"use strict";

class MultiSource {
	static onFilterChangeMulti (multiList) {
		FilterBox.selectFirstVisible(multiList);
	}

	/**
	 * @param opts Options object.
	 * @param opts.fnHandleData Data handling function, e.g. "addMonsters"
	 * @param opts.prop Data property, e.g. "monster"
	 */
	constructor (opts) {
		opts = opts || {};

		this._fnHandleData = opts.fnHandleData;
		this._prop = opts.prop;

		this._loadedSources = {};
	}

	get loadedSources () { return this._loadedSources; }

	async pLoadSource (src, nextFilterVal) {
		// We only act when the user changes the filter to "yes", i.e. "load/view the source"
		if (nextFilterVal !== "yes") return;

		const toLoad = this._loadedSources[src] || this._loadedSources[Object.keys(this._loadedSources).find(k => k.toLowerCase() === src)];
		if (toLoad.loaded) return;

		const data = await DataUtil.loadJSON(toLoad.url);
		this._fnHandleData(data[this._prop]);
		toLoad.loaded = true;
	}

	/**
	 * @param jsonDir the directory containing JSON for this page
	 * @param filterBox Filter box to check for active sources.
	 * @param pPageInit promise to be run once the index has loaded, should accept an object of src:URL mappings
	 * @param addFn function to be run when all data has been loaded, should accept a list of objects custom to the page
	 * @param pOptional optional promise to be run after dataFn, but before page history/etc is init'd
	 * (e.g. spell data objects for the spell page) which were found in the `this._prop` list
	 */
	async pMultisourceLoad (jsonDir, filterBox, pPageInit, addFn, pOptional) {
		const src2UrlMap = await DataUtil.loadJSON(`${jsonDir}index.json`);

		// track loaded sources
		Object.keys(src2UrlMap).forEach(src => this._loadedSources[src] = {url: jsonDir + src2UrlMap[src], loaded: false});

		// collect a list of sources to load
		const sources = Object.keys(src2UrlMap);
		const defaultSel = sources.filter(s => PageFilter.defaultSourceSelFn(s));
		const hashSourceRaw = Hist.getHashSource();
		const hashSource = hashSourceRaw ? Object.keys(src2UrlMap).find(it => it.toLowerCase() === hashSourceRaw.toLowerCase()) : null;
		const userSel = [...new Set(
			(await filterBox.pGetStoredActiveSources() || []).concat(await ListUtil.pGetSelectedSources() || []).concat(hashSource ? [hashSource] : []),
		)];

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
			const [link, ...sub] = Hist.getHashParts();
			const src = link.split(HASH_LIST_SEP)[1];
			const hashSrcs = {};
			sources.forEach(src => hashSrcs[UrlUtil.encodeForHash(src)] = src);
			const mapped = hashSrcs[src];
			if (mapped && !allSources.includes(mapped)) {
				allSources.push(mapped);
			}
		}

		// make a list of src : url objects
		const toLoads = allSources.map(src => ({src: src, url: jsonDir + src2UrlMap[src]}));

		// load the sources
		if (toLoads.length > 0) {
			const dataStack = (await Promise.all(toLoads.map(async toLoad => {
				const data = await DataUtil.loadJSON(toLoad.url);
				this._loadedSources[toLoad.src].loaded = true;
				return data;
			}))).flat();

			await pPageInit(this._loadedSources);

			let toAdd = [];
			dataStack.forEach(d => toAdd = toAdd.concat(d[this._prop]));
			addFn(toAdd);
		} else {
			await pPageInit(this._loadedSources);
		}

		if (pOptional) await pOptional();

		RollerUtil.addListRollButton();
		ListUtil.addListShowHide();

		list.init();
		subList.init();

		Hist.init(true);
	}
}
