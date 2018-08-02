"use strict";

const JSON_SRC_INDEX = "index.json";

/**
 * @param jsonDir the directory containing JSON for this page
 * @param jsonListName the name of the root JSON property for the list of data
 * @param pageInitFn function to be run once the index has loaded, should accept an object of src:URL mappings
 * @param dataFn function to be run when all data has been loaded, should accept a list of objects custom to the page
 * @param pOptional optional promise to be run after dataFn, but before page history/etc is init'd
 * (e.g. spell data objects for the spell page) which were found in the `jsonListName` list
 */
function multisourceLoad (jsonDir, jsonListName, pageInitFn, dataFn, pOptional) {
	return new Promise(resolve => {
		// load the index
		DataUtil.loadJSON(jsonDir + JSON_SRC_INDEX)
			.then((index) => _onIndexLoad(index, jsonDir, jsonListName, pageInitFn, dataFn, pOptional))
			.then(resolve);
	});
}

let loadedSources;
function _onIndexLoad (src2UrlMap, jsonDir, dataProp, pageInitFn, addFn, pOptional) {
	return new Promise(resolve => {
		// track loaded sources
		loadedSources = {};
		Object.keys(src2UrlMap).forEach(src => loadedSources[src] = {url: jsonDir + src2UrlMap[src], loaded: false});

		// collect a list of sources to load
		const sources = Object.keys(src2UrlMap);
		const defaultSel = sources.filter(s => defaultSourceSelFn(s));
		const userSel = [...new Set((FilterBox.getSelectedSources() || []).concat((ListUtil.getSelectedSources() || [])))];

		const allSources = [];

		// add any sources from the user's saved filters, provided they have URLs and haven't already been added
		if (userSel) {
			userSel
				.filter(src => src2UrlMap[src])
				.filter(src => $.inArray(src, allSources) === -1)
				.forEach(src => allSources.push(src));
		}
		// if there's no saved filters, load the defaults
		if (allSources.length === 0) {
			// remove any sources that don't have URLs
			defaultSel.filter(src => src2UrlMap[src]).forEach(src => allSources.push(src));
		}

		// add source from the current hash, if there is one
		if (window.location.hash.length) {
			const [link, ...sub] = History._getHashParts();
			const src = link.split(HASH_LIST_SEP)[1];
			const hashSrcs = {};
			sources.forEach(src => hashSrcs[UrlUtil.encodeForHash(src)] = src);
			const mapped = hashSrcs[src];
			if (mapped && $.inArray(mapped, allSources) === -1) {
				allSources.push(mapped);
			}
		}

		// make a list of src : url objects
		const toLoads = allSources.map(src => ({src: src, url: jsonDir + src2UrlMap[src]}));

		pageInitFn(loadedSources);

		if (toLoads.length > 0) {
			DataUtil.multiLoadJSON(
				toLoads,
				(toLoad) => {
					loadedSources[toLoad.src].loaded = true;
				},
				(dataStack) => {
					let toAdd = [];
					dataStack.forEach(d => toAdd = toAdd.concat(d[dataProp]));
					addFn(toAdd);

					const finalise = () => new Promise(resolve => {
						RollerUtil.addListRollButton();
						addListShowHide();

						History.init(true);
						resolve();
					});

					const p = pOptional ? pOptional().then(finalise) : finalise;
					p.then(resolve);
				}
			);
		} else {
			resolve();
		}
	});
}

function loadSource (jsonListName, dataFn) {
	return function (src, val) {
		const toLoad = loadedSources[src] || loadedSources[Object.keys(loadedSources).find(k => k.toLowerCase() === src)];
		if (!toLoad.loaded && val === "yes") {
			DataUtil.loadJSON(toLoad.url).then(function (data) {
				dataFn(data[jsonListName]);
				toLoad.loaded = true;
			});
		}
	}
}

function onFilterChangeMulti (multiList) {
	FilterBox.nextIfHidden(multiList);
}