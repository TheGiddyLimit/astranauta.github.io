/**
 * Dbgging notes:
 *   - **CTRL+F5 is unreliable**
 *   - spam "Clear Site Data" in DevTools
 *   - use "update on reload" in Service Workers DevTools section
 *   - sanity-check code to ensure it has updated
 */

importScripts("./js/sw-files.js");

const cacheName = /* 5ETOOLS_VERSION__OPEN */"1.113.11"/* 5ETOOLS_VERSION__CLOSE */;
const cacheableFilenames = new Set(filesToCache);

let isCacheRunning;

function getPath (urlOrPath) {
	// Add a fake domain name to allow proper URL conversion
	if (urlOrPath.startsWith("/")) urlOrPath = `https://5e.com${urlOrPath}`;
	return (new URL(urlOrPath)).pathname;
}

// Installing Service Worker
self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", e => {
	clients.claim();

	// Remove any outdated caches
	e.waitUntil((async () => {
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.filter(name => name !== cacheName).map(name => caches.delete(name)));
	})());
});

async function getOrCache (url, responseMeta) {
	responseMeta = responseMeta || {};

	const path = getPath(url);

	const fromCache = await caches.match(path);
	if (fromCache) {
		responseMeta.fromCache = true;
		return fromCache;
	}

	let retryCount = 3;
	while (true) {
		let response;
		try {
			const controller = new AbortController();
			setTimeout(() => controller.abort(), 30 * 1000);
			response = await fetch(url, {signal: controller.signal});
		} catch (e) {
			if (retryCount-- > 0) continue;
			else throw e;
		}
		const cache = await caches.open(cacheName);
		// throttle this with `await` to ensure Firefox doesn't die under load
		await cache.put(path, response.clone());
		responseMeta.fromCache = false;
		return response;
	}
}

// All data loading (JSON, images, etc) passes through here when the service worker is active
self.addEventListener("fetch", e => {
	const url = e.request.url;
	const path = getPath(url);

	return; // TODO re-enable caching

	if (!cacheableFilenames.has(path)) return;
	const responseMeta = {};

	e.respondWith((async () => {
		const toReturn = await getOrCache(url, responseMeta);
		if (responseMeta.fromCache) {
			// TODO if we grabbed the result from the cache, we could here asynchronously launch a hard fetch to
			//    update the cache? Currently is of no relevance, as the user can simply refresh to have the service
			//    worker realise it is outdated and flush everything.
		}
		return toReturn;
	})());
});

self.addEventListener("message", async evt => {
	const send = (msgOut) => evt.ports[0].postMessage(msgOut);

	const msg = evt.data;
	switch (msg.type) {
		case "cache-cancel":
			isCacheRunning = false;
			break;
		case "cache-start": {
			isCacheRunning = true;
			for (let i = 0; i < filesToCache.length; ++i) {
				if (!isCacheRunning) return send({type: "download-cancelled"});
				try {
					await getOrCache(filesToCache[i]);
				} catch (e) {
					debugger
					return send({type: "download-error", message: ((e.stack || "").trim()) || e.name});
				}
				if (!isCacheRunning) return send({type: "download-cancelled"});
				if (i % 50) send({type: "download-progress", data: {pct: `${((i / filesToCache.length) * 100).toFixed(2)}%`}});
			}
			send({type: "download-progress", data: {pct: `100%`}});
			break;
		}
	}
});
