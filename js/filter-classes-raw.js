"use strict";

class PageFilterClassesRaw extends PageFilterClasses {
	async _pPopulateBoxOptions (opts) {
		await super._pPopulateBoxOptions(opts);
		opts.isCompact = false;
	}

	/**
	 * @param cls
	 * @param isExcluded
	 * @param opts Options object.
	 * @param [opts.subclassExclusions] Map of `source:name:bool` indicating if each subclass is excluded or not.
	 */
	addToFilters (cls, isExcluded, opts) {
		if (isExcluded) return;
		opts = opts || {};
		const subclassExclusions = opts.subclassExclusions || {};

		this._sourceFilter.addItem(cls.source);

		if (cls.fluff) cls.fluff.forEach(it => this._addEntrySourcesToFilter(it));

		cls.classFeatures.forEach(feature => feature.loadeds.forEach(ent => this._addEntrySourcesToFilter(ent.entity)));

		cls.subclasses.forEach(sc => {
			const isScExcluded = (subclassExclusions[sc.source] || {})[sc.name] || false;
			if (!isScExcluded) {
				this._sourceFilter.addItem(sc.source);
				sc.subclassFeatures.forEach(feature => feature.loadeds.forEach(ent => this._addEntrySourcesToFilter(ent.entity)));
			}
		});
	}

	// region Data loading
	static async _pGetParentClass (sc) {
		// Search in base classes
		let baseClass = (await DataUtil.class.loadRawJSON()).class.find(bc => bc.name.toLowerCase() === sc.className.toLowerCase() && (bc.source.toLowerCase() || SRC_PHB) === sc.classSource.toLowerCase());

		// Search in brew classes
		if (!baseClass) {
			baseClass = (BrewUtil.homebrew.class || []).find(bc => bc.name.toLowerCase() === sc.className.toLowerCase() && (bc.source.toLowerCase() || SRC_PHB) === sc.classSource.toLowerCase());
		}

		return baseClass;
	}

	static async pPostLoad (data) {
		data = MiscUtil.copy(data);

		// Ensure homebrew is initialised
		await BrewUtil.pAddBrewData();

		if (!data.class) data.class = [];

		// Attach subclasses to parent classes
		if (data.subclass) {
			// Do this sequentially, to avoid double-adding the same base classes
			for (const sc of data.subclass) {
				if (!sc.className) continue; // Subclass class name is required
				sc.classSource = sc.classSource || SRC_PHB;

				let cls = data.class.find(it => (it.name || "").toLowerCase() === sc.className.toLowerCase() && (it.source || SRC_PHB).toLowerCase() === sc.classSource.toLowerCase());

				if (!cls) {
					cls = await this._pGetParentClass(sc);
					if (cls) {
						// If a base class exists, make a stripped-down copy and override its subclasses with our own
						cls = MiscUtil.copy(cls);
						cls.subclasses = [];
						data.class.push(cls);
					} else {
						// Fall back on pushing a dummy class to the array, and we can handle its lack of content elsewhere
						cls = {name: sc.className, source: sc.classSource};
						data.class.push(cls);
					}
				}

				(cls.subclasses = cls.subclasses || []).push(sc);
			}

			delete data.subclass;
		}

		// Clean and initialise fields; sort arrays
		data.class.forEach(cls => {
			cls.source = cls.source || SRC_PHB;

			cls.subclasses = cls.subclasses || [];

			cls.subclasses.forEach(sc => {
				sc.name = sc.name || "(Unnamed subclass)";
				sc.source = sc.source || cls.source;
				sc.className = sc.className || cls.name;
				sc.classSource = sc.classSource || cls.source || SRC_PHB;
			});

			cls.subclasses.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source || cls.source, b.source || cls.source))
		});
		data.class.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));

		// Load linked features
		const walker = MiscUtil.getWalker({
			keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST,
			isDepthFirst: true,
			isNoModification: true,
		});

		// Load the data once before diving into nested promises, to avoid needless context switching
		await this._pPreloadSideData();

		await Promise.all(data.class.map(async cls => {
			cls.classFeatures = (cls.classFeatures || []).map(cf => typeof cf === "string" ? {classFeature: cf} : cf);

			await Promise.all((cls.classFeatures || []).map(async cf => {
				const unpacked = DataUtil.class.unpackUidClassFeature(cf.classFeature);

				cf.hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked);

				const {name, level, source} = unpacked;
				cf.name = name;
				cf.level = level;
				cf.source = source;

				const entityRoot = await Renderer.hover.pCacheAndGet("raw_classFeature", cf.source, cf.hash, {isCopy: true});
				const loadedRoot = {
					type: "classFeature",
					entity: entityRoot,
					page: "classFeature",
					source: cf.source,
					hash: cf.hash,
					className: cls.name,
				};

				const isIgnored = await this._pGetIgnoredAndApplySideData(entityRoot, "classFeature");
				if (isIgnored) {
					cf.isIgnored = true;
					return;
				}

				const subLoadeds = await this._pLoadSubEntries(walker, entityRoot, cls.name);

				cf.loadeds = [loadedRoot, ...subLoadeds];
			}));

			if (cls.classFeatures) cls.classFeatures = cls.classFeatures.filter(it => !it.isIgnored);

			await Promise.all((cls.subclasses || []).map(async sc => {
				sc.subclassFeatures = (sc.subclassFeatures || []).map(cf => typeof cf === "string" ? {subclassFeature: cf} : cf);

				await Promise.all((sc.subclassFeatures || []).map(async scf => {
					const unpacked = DataUtil.class.unpackUidSubclassFeature(scf.subclassFeature);

					scf.hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](unpacked);

					const {name, level, source} = unpacked;
					scf.name = name;
					scf.level = level;
					scf.source = source;

					const entityRoot = await Renderer.hover.pCacheAndGet("raw_subclassFeature", scf.source, scf.hash, {isCopy: true});
					const loadedRoot = {
						type: "subclassFeature",
						entity: entityRoot,
						page: "subclassFeature",
						source: scf.source,
						hash: scf.hash,
						className: cls.name,
						subclassName: sc.name,
					};

					const isIgnored = await this._pGetIgnoredAndApplySideData(entityRoot, "subclassFeature");
					if (isIgnored) {
						scf.isIgnored = true;
						return;
					}

					const subLoadeds = await this._pLoadSubEntries(walker, entityRoot, cls.name, sc.name);

					scf.loadeds = [loadedRoot, ...subLoadeds];
				}));

				if (sc.subclassFeatures) sc.subclassFeatures = sc.subclassFeatures.filter(it => !it.isIgnored);
			}));
		}));

		return data.class;
	}

	/**
	 * Pre-load any side data which is to be merged into the main data.
	 */
	static async _pPreloadSideData () { /* Implement as required */ }

	/**
	 * Get side data which is to be merged into the main data.
	 */
	static async _pGetSideData (entity, type) { return null; }

	/**
	 *  Apply side data, and check for ignored features.
	 */
	static async _pGetIgnoredAndApplySideData (entity, type) {
		switch (type) {
			case "classFeature": {
				const sideData = await this._pGetSideData(entity, "classFeature");
				if (sideData && sideData.isIgnored) return true;
				if (sideData && sideData.entries) entity.entries = MiscUtil.copy(sideData.entries);
				break;
			}
			case "subclassFeature": {
				const sideData = await this._pGetSideData(entity, "subclassFeature");
				if (sideData && sideData.isIgnored) return true;
				if (sideData && sideData.entries) entity.entries = MiscUtil.copy(sideData.entries);
				break;
			}
			default: throw new Error(`Unhandled type "${type}"`);
		}
		return false;
	}

	/**
	 * Walk the data, loading references.
	 */
	static async _pLoadSubEntries (walker, loadedRoot, ancestorClassName, ancestorSubclassName) {
		const out = [];

		const pRecurse = async toWalk => {
			const references = [];
			const path = [];

			walker.walk(
				toWalk,
				{
					array: (arr) => {
						arr = arr.filter(it => {
							if (it.type !== "refClassFeature" && it.type !== "refSubclassFeature" && it.type !== "refOptionalfeature") return true;

							it.parentName = (path.last() || {}).name;
							references.push(it);

							return false;
						});
						return arr;
					},
					preObject: (obj) => {
						if (obj.type === "options") {
							// Add metadata to options--only if they have a "count" specified, otherwise we assume
							//   that the entire option set is to be imported as per regular features.
							if (obj.count != null) {
								const optionSetId = CryptUtil.uid();
								obj.entries.forEach(ent => {
									ent._optionsMeta = {
										setId: optionSetId,
										count: obj.count,
										name: (path.last() || {}).name,
									};
								});
							}

							const parentName = MiscUtil.get(path.last(), "name");
							if (parentName) obj.entries.forEach(ent => ent._displayNamePrefix = `${parentName}: `);
						}

						if (obj.name) path.push(obj);
					},
					postObject: (obj) => {
						if (obj.name) path.pop();
					},
				},
			);

			for (const ent of references) {
				const isRequiredOption = !!MiscUtil.get(ent, "data", "isRequiredOption");
				switch (ent.type) {
					case "refClassFeature": {
						const unpacked = DataUtil.class.unpackUidClassFeature(ent.classFeature);
						const {source} = unpacked;
						const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked);

						const entity = await Renderer.hover.pCacheAndGet("raw_classFeature", source, hash, {isCopy: true});

						if (!entity) {
							this._handleReferenceError(`Failed to load "classFeature" reference "${ent.classFeature}"`);
							continue;
						}

						const isIgnored = await this._pGetIgnoredAndApplySideData(entity, "classFeature");
						if (isIgnored) continue;
						if (ent._displayNamePrefix) entity._displayName = `${ent._displayNamePrefix}${entity.name}`;

						entity._ancestorClassName = ancestorClassName;
						if (ancestorSubclassName) entity._ancestorSubclassName = ancestorSubclassName;

						out.push({
							type: "classFeature",
							entry: `{@classFeature ${ent.classFeature}}`,
							entity,
							optionsMeta: ent._optionsMeta,
							page: "classFeature",
							source,
							hash,
							isRequiredOption,
						});

						await pRecurse(entity);

						break;
					}
					case "refSubclassFeature": {
						const unpacked = DataUtil.class.unpackUidSubclassFeature(ent.subclassFeature);
						const {source} = unpacked;
						const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](unpacked);

						const entity = await Renderer.hover.pCacheAndGet("raw_subclassFeature", source, hash, {isCopy: true});

						if (!entity) {
							this._handleReferenceError(`Failed to load "subclassFeature" reference "${ent.subclassFeature}"`);
							continue;
						}

						const isIgnored = await this._pGetIgnoredAndApplySideData(entity, "subclassFeature");
						if (isIgnored) continue;
						if (ent._displayNamePrefix) entity._displayName = `${ent._displayNamePrefix}${entity.name}`;

						entity._ancestorClassName = ancestorClassName;
						if (ancestorSubclassName) entity._ancestorSubclassName = ancestorSubclassName;

						out.push({
							type: "subclassFeature",
							entry: `{@subclassFeature ${ent.subclassFeature}}`,
							entity,
							optionsMeta: ent._optionsMeta,
							page: "subclassFeature",
							source,
							hash,
							isRequiredOption,
						});

						await pRecurse(entity);

						break;
					}
					case "refOptionalfeature": {
						const unpacked = DataUtil.generic.unpackUid(ent.optionalfeature, "optfeature");
						const page = UrlUtil.PG_OPT_FEATURES;
						const {source} = unpacked;
						const hash = UrlUtil.URL_TO_HASH_BUILDER[page](unpacked);

						const entity = await Renderer.hover.pCacheAndGet(page, source, hash, {isCopy: true});

						if (!entity) {
							this._handleReferenceError(`Failed to load "optfeature" reference "${ent.optionalfeature}"`);
							continue;
						}

						if (ent._displayNamePrefix) entity._displayName = `${ent._displayNamePrefix}${entity.name}`;
						entity._foundryData = {
							requirements: `${loadedRoot.className} ${loadedRoot.level}${loadedRoot.subclassShortName ? ` (${loadedRoot.subclassShortName})` : ""}`,
						};

						// Cache this so we can determine if this optional feature is from a "classFeature" or a "subclassFeature"
						entity._ancestorType = ancestorSubclassName ? "subclassFeature" : "classFeature";
						entity._ancestorClassName = ancestorClassName;
						if (ancestorSubclassName) entity._ancestorSubclassName = ancestorSubclassName;

						out.push({
							type: "optionalfeature",
							entry: `{@optfeature ${ent.optionalfeature}}`,
							entity,
							optionsMeta: ent._optionsMeta,
							page,
							source,
							hash,
							isRequiredOption,
						});

						break;
					}
					default: throw new Error(`Unhandled type "${ent.type}"`);
				}
			}
		};

		await pRecurse(loadedRoot);

		return out;
	}

	static _handleReferenceError (msg) {
		JqueryUtil.doToast({type: "danger", content: msg});
	}
	// endregion
}

class ModalFilterClasses extends ModalFilter {
	constructor (namespace) {
		super({
			modalTitle: "Class and Subclass",
			pageFilter: new PageFilterClassesRaw(),
			namespace: namespace,
			fnSort: ModalFilterClasses.fnSort,
		});

		this._pLoadingAllData = null;
		this._allData = null;
	}

	get pageFilter () { return this._pageFilter; }

	static fnSort (a, b, opts) {
		const out = SortUtil.listSort(a, b, opts);

		if (opts.sortDir === "desc" && a.data.ixClass === b.data.ixClass && (a.data.ixSubclass != null || b.data.ixSubclass != null)) {
			return a.data.ixSubclass != null ? -1 : 1;
		}

		return out;
	}

	/** Used to fetch the data for a level, given some identifying information from a previous user selection. */
	async pGetSelection (classSubclassMeta) {
		const {className, classSource, subclassName, subclassSource} = classSubclassMeta;

		const allData = await this._pLoadAllData();

		const cls = allData.find(it => it.name === className && it.source === classSource);
		if (!cls) throw new Error(`Could not find class with name "${className}" and source "${classSource}"`);

		const out = {
			class: cls,
		};

		if (subclassName && subclassSource) {
			const sc = cls.subclasses.find(it => it.name === subclassName && it.source === subclassSource);
			if (!sc) throw new Error(`Could not find subclass with name "${subclassName}" and source "${subclassSource}" on class with name "${className}" and source "${classSource}"`);

			out.subclass = sc;
		}

		return out;
	}

	async pGetUserSelection () {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async resolve => {
			const {$modalInner, doClose} = UiUtil.getShowModal({
				isHeight100: true,
				title: `Filter/Search for ${this._modalTitle}`,
				cbClose: (isDataEntered) => {
					this._filterCache.$wrpModalInner.detach();
					if (!isDataEntered) resolve(null);
				},
				isUncappedHeight: true,
			});

			await this.pPreloadHidden($modalInner);

			this._filterCache.$btnConfirm.off("click").click(async () => {
				const checked = this._filterCache.list.visibleItems.filter(it => it.data.tglSel.classList.contains("active"));
				const out = {};
				checked.forEach(it => {
					if (it.data.ixSubclass == null) out.class = this._filterCache.allData[it.data.ixClass];
					else out.subclass = this._filterCache.allData[it.data.ixClass].subclasses[it.data.ixSubclass];
				});
				resolve(MiscUtil.copy(out));

				doClose(true);

				ModalFilterClasses._doListDeselectAll(this._filterCache.list);
			});
		});
	}

	/**
	 * Pre-heat the modal, thus allowing access to the filter box underneath.
	 *
	 * @param [$modalInner]
	 */
	async pPreloadHidden ($modalInner) {
		// If we're rendering in "hidden" mode, create a dummy element to attach the UI to.
		$modalInner = $modalInner || $(`<div></div>`);

		if (this._filterCache) {
			this._filterCache.$wrpModalInner.appendTo($modalInner);
		} else {
			await this._pInit();

			const $ovlLoading = $(`<div class="w-100 h-100 flex-vh-center"><i class="dnd-font ve-muted">Loading...</i></div>`).appendTo($modalInner);

			const $iptSearch = $(`<input class="form-control" type="search" placeholder="Search...">`);
			const $btnReset = $(`<button class="btn btn-default">Reset</button>`);
			const $wrpFormTop = $$`<div class="flex input-group btn-group w-100 lst__form-top">${$iptSearch}${$btnReset}</div>`;

			const $wrpFormBottom = $(`<div class="w-100"></div>`);

			const $wrpFormHeaders = $(`<div class="input-group input-group--bottom flex no-shrink">
				<div class="btn btn-default disabled col-1 pl-0"></div>
				<button class="col-9 sort btn btn-default btn-xs" data-sort="name">Name <span class="caret_wrp"></span></button>
				<button class="col-2 pr-0 sort btn btn-default btn-xs ve-grow" data-sort="source">Source <span class="caret_wrp"></span></button>
			</div>`);

			const $wrpForm = $$`<div class="flex-col w-100 mb-2">${$wrpFormTop}${$wrpFormBottom}${$wrpFormHeaders}</div>`;
			const $wrpList = $(`<ul class="list mb-2 h-100"></ul>`);

			const $btnConfirm = $(`<button class="btn btn-default">Confirm</button>`);

			const list = new List({
				$iptSearch,
				$wrpList,
				fnSort: this._fnSort,
			});

			SortUtil.initBtnSortHandlers($wrpFormHeaders, list);

			const allData = await this._pLoadAllData();
			const pageFilter = this._pageFilter;

			await pageFilter.pInitFilterBox({
				$wrpFormTop,
				$btnReset,
				$wrpMiniPills: $wrpFormBottom,
				namespace: this._namespace,
			});

			allData.forEach((it, i) => {
				pageFilter.mutateAndAddToFilters(it);
				const filterListItems = this._getListItems(pageFilter, it, i);
				filterListItems.forEach((filterListItem, i) => {
					list.addItem(filterListItem);
					filterListItem.ele.addEventListener("click", evt => ModalFilterClasses.handleSelectClick(list, filterListItems, filterListItem, i === 0, evt));
				});
			});

			list.init();
			list.update();

			const handleFilterChange = () => {
				const f = pageFilter.filterBox.getValues();

				// Find all the classes which have visible subclasses so we can force them to remain visible.
				const ixsVisibleCls = new Set();
				list.items.forEach(li => {
					if (li.data.ixSubclass == null) return;
					const sc = allData[li.data.ixClass].subclasses[li.data.ixSubclass];
					const isVisible = pageFilter.toDisplay(f, sc);
					if (isVisible) ixsVisibleCls.add(li.data.ixClass);
				});

				list.filter(li => {
					if (li.data.ixSubclass == null) return ixsVisibleCls.has(li.data.ixClass) || pageFilter.toDisplay(f, allData[li.data.ixClass]);
					else return pageFilter.toDisplay(f, allData[li.data.ixClass].subclasses[li.data.ixSubclass]);
				});
			};

			$(pageFilter.filterBox).on(FilterBox.EVNT_VALCHANGE, handleFilterChange);
			pageFilter.filterBox.render();
			handleFilterChange();

			$ovlLoading.remove();

			const $wrpModalInner = $$`<div class="flex-col h-100">
				${$wrpForm}
				${$wrpList}
				<div class="flex-vh-center">${$btnConfirm}</div>
			</div>`.appendTo($modalInner);

			this._filterCache = {$wrpModalInner, $btnConfirm, pageFilter, list, allData};
		}
	}

	static _doListDeselectAll (list) {
		list.items.forEach(it => {
			if (it.data.tglSel) it.data.tglSel.classList.remove("active");
			it.ele.classList.remove("list-multi-selected");
		});
	}

	static handleSelectClick (list, filterListItems, filterListItem, isClassItem, evt) {
		evt.preventDefault();
		evt.stopPropagation();

		// region De-selecting the currently-selected item
		if (filterListItem.data.tglSel.classList.contains("active")) {
			this._doListDeselectAll(list);
			return;
		}
		// endregion

		// region Selecting an item
		this._doListDeselectAll(list);

		if (!isClassItem) {
			const classItem = filterListItems[0];
			classItem.data.tglSel.classList.add("active");
			classItem.ele.classList.add("list-multi-selected");
		}

		filterListItem.data.tglSel.classList.add("active");
		filterListItem.ele.classList.add("list-multi-selected");
		// endregion
	}

	/** Caches the result for fast re-querying. Note that brew added after the initial load will not be available. */
	async _pLoadAllData () {
		this._pLoadingAllData = this._pLoadingAllData || (async () => {
			const [data, brew] = await Promise.all([
				MiscUtil.copy(await DataUtil.class.loadRawJSON()),
				BrewUtil.pAddBrewData(),
			]);

			// Combine main data with brew
			const clsProps = BrewUtil.getPageProps(UrlUtil.PG_CLASSES);
			clsProps.forEach(prop => data[prop] = [...data[prop] || [], ...MiscUtil.copy(brew[prop] || [])]);

			this._allData = await PageFilterClassesRaw.pPostLoad(data);
		})();

		await this._pLoadingAllData;
		return this._allData;
	}

	_getListItems (pageFilter, cls, clsI) {
		return [
			this._getListItems_getClassItem(pageFilter, cls, clsI),
			...cls.subclasses.map((sc, scI) => this._getListItems_getSubclassItem(pageFilter, cls, clsI, sc, scI)),
		]
	}

	_getListItems_getClassItem (pageFilter, cls, clsI) {
		const eleLabel = document.createElement("label");
		eleLabel.className = "row lst--border no-select lst__wrp-cells";

		const source = Parser.sourceJsonToAbv(cls.source);

		eleLabel.innerHTML = `<div class="col-1 pl-0 flex-vh-center"><div class="fltr-cls__tgl"></div></div>
		<div class="bold col-9">${cls.name}</div>
		<div class="col-2 pr-0 text-center ${Parser.sourceJsonToColor(cls.source)}" title="${Parser.sourceJsonToFull(cls.source)}" ${BrewUtil.sourceJsonToStyle(cls.source)}>${source}</div>`;

		return new ListItem(
			clsI,
			eleLabel,
			`${cls.name} -- ${cls.source}`,
			{
				source: `${source} -- ${cls.name}`,
			},
			{
				ixClass: clsI,
				tglSel: eleLabel.firstElementChild.firstElementChild,
			},
		);
	}

	_getListItems_getSubclassItem (pageFilter, cls, clsI, sc, scI) {
		const eleLabel = document.createElement("label");
		eleLabel.className = "row lst--border no-select lst__wrp-cells";

		const source = Parser.sourceJsonToAbv(sc.source);

		eleLabel.innerHTML = `<div class="col-1 pl-0 flex-vh-center"><div class="fltr-cls__tgl"></div></div>
		<div class="col-9 pl-1 flex-v-center"><span class="mx-3">\u2014</span> ${sc.name}</div>
		<div class="col-2 pr-0 text-center ${Parser.sourceJsonToColor(sc.source)}" title="${Parser.sourceJsonToFull(sc.source)}" ${BrewUtil.sourceJsonToStyle(sc.source)}>${source}</div>`;

		return new ListItem(
			`${clsI}--${scI}`,
			eleLabel,
			`${cls.name} -- ${cls.source} -- ${sc.name} -- ${sc.source}`,
			{
				source: `${cls.source} -- ${cls.name} -- ${source} -- ${sc.name}`,
			},
			{
				ixClass: clsI,
				ixSubclass: scI,
				tglSel: eleLabel.firstElementChild.firstElementChild,
			},
		);
	}
}
