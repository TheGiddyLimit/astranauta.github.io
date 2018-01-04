"use strict";

const JSON_SRC_INDEX = "index.json";

/**
 * @param jsonDir the directory containing JSON for this page
 * @param jsonListName the name of the root JSON property for the list of data
 * @param pageInitFn function to be run once the index has loaded, should accept an object of src:URL mappings
 * @param dataFn function to be run when all data has been loaded, should accept a list of objects custom to the page
 * (e.g. spell data objects for the spell page) which were found in the `jsonListName` list
 */
function multisourceLoad (jsonDir, jsonListName, pageInitFn, dataFn) {
	// load the index
	loadJSON(jsonDir + JSON_SRC_INDEX, function (index) {
		_onIndexLoad(index, jsonDir, jsonListName, pageInitFn, dataFn)
	});
}

let loadedSources;

function _onIndexLoad (src2UrlMap, jsonDir, dataProp, pageInitFn, addFn) {
	// track loaded sources
	loadedSources = {};
	Object.keys(src2UrlMap).forEach(src => loadedSources[src] = {url: jsonDir + src2UrlMap[src], loaded: false});

	// collect a list of sources to load
	const sources = Object.keys(src2UrlMap);
	const defaultSel = sources.filter(s => defaultSourceSelFn(s));
	const userSel = FilterBox.getSelectedSources();

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
		const [link, ...sub] = _getHashParts();
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
		multiLoadJSON(
			toLoads,
			function (toLoad) {
				loadedSources[toLoad.src].loaded = true;
			},
			function (dataStack) {
				let toAdd = [];
				dataStack.forEach(d => toAdd = toAdd.concat(d[dataProp]));
				addFn(toAdd);

				initHistory();
				handleFilterChange();
				addListShowHide();
			}
		);
	}
}

function loadSource (jsonListName, dataFn) {
	return function (src, val) {
		const toLoad = loadedSources[src];
		if (!toLoad.loaded && val === "yes") {
			loadJSON(toLoad.url, function (data) {
				dataFn(data[jsonListName]);
				toLoad.loaded = true;
			});
		}
	}
}