const fs = require("fs");
const xmlbuilder = require("xmlbuilder");
require("../js/utils");
require("../js/render");
require("../js/render-dice");

function rd (path) {
	return JSON.parse(fs.readFileSync(path, "utf-8"));
}

const BASE_SITE_URL = "https://5e.tools/";
const version = rd("package.json").version;

const lastMod = (() => {
	const date = new Date();
	return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`
})();

const baseSitemapData = (() => {
	const out = {};

	// Scrape all the links from navigation.js -- avoid any unofficial HTML files which might exist
	const navText = fs.readFileSync("./js/navigation.js", "utf-8");
	navText.replace(/(?:"([^"]+\.html)"|'([^']+)\.html'|`([^`]+)\.html`)/gi, (...m) => {
		const str = m[1] || m[2] || m[3];
		if (str.includes("${")) return;
		out[str] = true;
	});

	return out;
})();

const getTemplate = (page, source, hash, textStyle) => `<!DOCTYPE html><html lang="en"><head>
<!--5ETOOLS_CMP-->
<!--5ETOOLS_ANALYTICS-->
<!--5ETOOLS_ADCODE-->
<meta charset="utf-8"><meta name="description" content=""><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="apple-mobile-web-app-capable" content="yes"><title>5etools</title><link rel="manifest" href="manifest.webmanifest"><link rel="stylesheet" href="/css/bootstrap.css?v=${version}"><link rel="stylesheet" href="/css/jquery-ui.css?v=${version}"><link rel="stylesheet" href="/css/jquery-ui-slider-pips.css?v=${version}"><link rel="stylesheet" href="/css/style.css?v=${version}"><link rel="icon" href="/favicon.png"><link rel="apple-touch-icon" href="icon-320.png"><script type="text/javascript" src="/js/header.js?v=${VERSION_NUMBER}"></script><script>_SEO_PAGE="${page}";_SEO_SOURCE="${source}";_SEO_HASH="${hash}";_SEO_STYLE=${textStyle}</script></head><body><div class="cancer__wrp-sidebar-rhs cancer__anchor"><div class="cancer__disp-cancer"></div><div class="cancer__sidebar-rhs-inner cancer__sidebar-rhs-inner--top"><!--5ETOOLS_AD_RIGHT_1--></div><div class="cancer__sidebar-rhs-inner cancer__sidebar-rhs-inner--bottom"><!--5ETOOLS_AD_RIGHT_2--></div></div><div class="cancer__wrp-leaderboard cancer__anchor"><div class="cancer__disp-cancer"></div><div class="cancer__wrp-leaderboard-inner"><!--5ETOOLS_AD_LEADERBOARD--></div></div><header class="hidden-xs hidden-sm page__header"><div class="container"><h1 class="page__title"></h1></div></header><nav class="container page__nav" id="navigation"><ul class="nav page__nav-inner" id="navbar"></ul></nav><main class="container"><div class="row"><table id="pagecontent" class="stats"><tr><th class="border" colspan="6"></th></tr><tr><td colspan="6" class="initial-message">Loading...</td></tr><tr><th class="border" colspan="6"></th></tr></table></div><div class="row" id="link-page"></div></main><script type="text/javascript" src="https://cdn.jsdelivr.net/combine/npm/jquery@3.4.1/dist/jquery.min.js,gh/weixsong/elasticlunr.js@0.9/elasticlunr.min.js"></script><script type="text/javascript" src="/lib/localforage.js"></script><script type="text/javascript" src="/lib/jquery-ui.js"></script><script type="text/javascript" src="/lib/jquery-ui-slider-pip.js"></script><script type="text/javascript" src="/js/shared.js?v=${VERSION_NUMBER}"></script><script type="text/javascript" src="/js/render-${page}.js?v=${VERSION_NUMBER}"></script><script type="text/javascript" src="/js/seo-loader.js?v=${VERSION_NUMBER}"></script></body></html>`;

// Monkey patch
(() => {
	DataUtil.loadJSON = async (url) => {
		const data = rd(url);
		await DataUtil.pDoMetaMerge(url, data);
		return data;
	};
})();

const toGenerate = [
	{
		page: "spells",
		pGetEntries: () => {
			const index = rd(`data/spells/index.json`);
			const fileData = Object.entries(index)
				.map(([_, filename]) => rd(`data/spells/${filename}`));
			return fileData.map(it => MiscUtil.copy(it.spell)).reduce((a, b) => a.concat(b))
		},
		style: 1,
	},
	{
		page: "bestiary",
		pGetEntries: () => {
			const index = rd(`data/bestiary/index.json`);
			const fileData = Object.entries(index)
				.map(([source, filename]) => ({source: source, json: rd(`data/bestiary/${filename}`)}));
			// Filter to prevent duplicates from "otherSources" copies
			return fileData.map(it => MiscUtil.copy(it.json.monster.filter(mon => mon.source === it.source))).reduce((a, b) => a.concat(b))
		},
		style: 2,
	},
	{
		page: "items",
		pGetEntries: async () => {
			return Renderer.item.pBuildList();
		},
		style: 1,
	},

	// TODO expand this as required
];

const siteMapData = {};

async function main () {
	let total = 0;
	console.log(`Generating SEO pages...`);
	await Promise.all(toGenerate.map(async meta => {
		try {
			fs.mkdirSync(`./${meta.page}`, { recursive: true })
		} catch (err) {
			if (err.code !== "EEXIST") throw err
		}

		const entries = await meta.pGetEntries();
		const builder = UrlUtil.URL_TO_HASH_BUILDER[`${meta.page}.html`];
		entries.forEach(ent => {
			let offset = 0;
			let html;
			let path;
			while (true) {
				const hash = builder(ent);
				const sluggedHash = Parser.stringToSlug(decodeURIComponent(hash)).replace(/_/g, "-");
				path = `${meta.page}/${sluggedHash}${offset ? `-${offset}` : ""}.html`;
				if (siteMapData[path]) {
					++offset;
					continue;
				}

				html = getTemplate(meta.page, ent.source, hash, meta.style);

				siteMapData[path] = true;
				break;
			}

			if (offset > 0) console.warn(`\tDeduplicated URL using suffix: ${path}`);

			fs.writeFileSync(`./${path}`, html, "utf-8");

			total++;
			if (total % 100 === 0) console.log(`Wrote ${total} files...`);
		});
	}));
	console.log(`Wrote ${total} files.`);

	let sitemapLinkCount = 0;
	const $urlSet = xmlbuilder
		.create("urlset", {version: "1.0", encoding: "UTF-8"})
		.att("xmlns", "https://www.sitemaps.org/schemas/sitemap/0.9");

	const $urlRoot = $urlSet.ele("url");
	$urlRoot.ele("loc", BASE_SITE_URL);
	$urlRoot.ele("lastmod", lastMod);
	$urlRoot.ele("changefreq", "monthly");
	sitemapLinkCount++;

	Object.keys(baseSitemapData).forEach(url => {
		const $url = $urlSet.ele("url");
		$url.ele("loc", `${BASE_SITE_URL}${url}`);
		$url.ele("lastmod", lastMod);
		$url.ele("changefreq", "monthly");
		sitemapLinkCount++;
	});

	Object.keys(siteMapData).forEach(url => {
		const $url = $urlSet.ele("url");
		$url.ele("loc", `${BASE_SITE_URL}${url}`);
		$url.ele("lastmod", lastMod);
		$url.ele("changefreq", "weekly");
		sitemapLinkCount++;
	});

	const xml = $urlSet.end({pretty: true});
	fs.writeFileSync("./sitemap.xml", xml, "utf-8");
	console.log(`Wrote ${sitemapLinkCount.toLocaleString()} URL${sitemapLinkCount === 1 ? "" : "s"} to sitemap.xml`)
}

main().then(() => console.log(`SEO page generation complete.`)).catch(e => console.error(e));
