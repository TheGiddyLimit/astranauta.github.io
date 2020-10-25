"use strict";

class ClassesPage extends BaseComponent {
	static _ascSortSubclasses (scA, scB) {
		return SortUtil.ascSortLower(scA.name, scB.name);
	}

	static _fnSortSubclassFilterItems (a, b) {
		if (a.values.isAlwaysVisible) return 1;
		else if (b.values.isAlwaysVisible) return -1;
		else return SortUtil.listSort(a, b, {sortBy: "shortName"});
	}

	static getBtnTitleSubclass (sc) {
		const titlePartReprint = sc.isReprinted ? " (this subclass has been reprinted in a more recent source)" : "";
		return `${sc.name}; Source: ${Parser.sourceJsonToFull(sc.source)}${sc.page ? `, page ${sc.page}` : ""}${titlePartReprint}`;
	}

	static getBaseShortName (sc) {
		const re = new RegExp(`\\((UA|${sc.source})\\)$`);
		return sc.shortName.trim().replace(re, "").trim();
	}

	constructor () {
		super();
		// Don't include classId in the main state/proxy, as we want special handling for it as the main hash part
		this.__classId = {_: 0};
		this._classId = this._getProxy("classId", this.__classId);

		this._list = null;
		this._ixData = 0;
		this._dataList = [];
		this._lastScrollFeature = null;
		this._outlineData = {};
		this._pageFilter = new PageFilterClasses();

		// region subclass list/filter
		this._listSubclass = null;
		this._ixDataSubclass = 0;
		// endregion

		this._fnTableHandleFilterChange = null;
		this._$wrpOutline = null;
		this._fnOutlineHandleFilterChange = null;
		this._$trsContent = [];
		this._$trNoContent = null;

		// region alternate views
		this._subclassComparisonView = null;
		this._classBookView = null;
		// endregion
	}

	get activeClass () { return this._dataList[this._classId._]; }
	get filterBox () { return this._pageFilter.filterBox; }

	async pOnLoad () {
		await ExcludeUtil.pInitialise();
		Omnisearch.addScrollTopFloat();
		const data = await DataUtil.class.loadJSON();

		this._list = ListUtil.initList({listClass: "classes", isUseJquery: true});
		ListUtil.setOptions({primaryLists: [this._list]});
		SortUtil.initBtnSortHandlers($("#filtertools"), this._list);

		await this._pageFilter.pInitFilterBox({
			$iptSearch: $(`#lst__search`),
			$wrpFormTop: $(`#filter-search-group`).title("Hotkey: f"),
			$btnReset: $(`#reset`),
		});

		this._addData(data);

		BrewUtil.bind({
			filterBox: this.filterBox,
			sourceFilter: this._pageFilter.sourceFilter,
			list: this._list,
			pHandleBrew: this._pHandleBrew.bind(this),
		});

		const homebrew = await BrewUtil.pAddBrewData();
		await this._pHandleBrew(homebrew);
		await BrewUtil.pAddLocalBrewData();

		BrewUtil.makeBrewButton("manage-brew");
		await ListUtil.pLoadState();
		RollerUtil.addListRollButton(true);

		window.onhashchange = this._handleHashChange.bind(this);

		this._list.init();

		$(`.initial-message`).text(`Select a class from the list to view it here`);

		// Silently prepare our initial state
		this._setClassFromHash(Hist.initialLoad);
		this._setStateFromHash(Hist.initialLoad);

		await this._pInitAndRunRender();

		ExcludeUtil.checkShowAllExcluded(this._dataList, $(`#pagecontent`));
		this._initLinkGrabbers();
		UrlUtil.bindLinkExportButton(this.filterBox, $(`#btn-link-export`));

		Hist.initialLoad = false;

		// Finally, ensure the hash correctly matches the state
		this._setHashFromState(true);

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	async _pHandleBrew (homebrew) {
		const {class: rawClassData, subclass: rawSubclassData} = homebrew;
		const cpy = MiscUtil.copy({class: rawClassData, subclass: rawSubclassData});
		if (cpy.class) for (let i = 0; i < cpy.class.length; ++i) cpy.class[i] = await DataUtil.class.pGetDereferencedClassData(cpy.class[i]);
		if (cpy.subclass) for (let i = 0; i < cpy.subclass.length; ++i) cpy.subclass[i] = await DataUtil.class.pGetDereferencedSubclassData(cpy.subclass[i]);

		const {isAddedAnyClass, isAddedAnySubclass} = this._addData(cpy);

		if (isAddedAnySubclass && !Hist.initialLoad) await this._pDoRender();
	}

	_addData (data) {
		let isAddedAnyClass = false;
		let isAddedAnySubclass = false;
		if (data.class && data.class.length) (isAddedAnyClass = true) && this._addData_addClassData(data.class);
		if (data.subclass && data.subclass.length) (isAddedAnySubclass = true) && this._addData_addSubclassData(data.subclass);

		if (isAddedAnyClass || isAddedAnySubclass) {
			this._list.update();
			this.filterBox.render();
			this._handleFilterChange();

			ListUtil.setOptions({
				itemList: this._dataList,
				primaryLists: [this._list],
			});
		}

		return {isAddedAnyClass, isAddedAnySubclass};
	}

	_addData_addClassData (classes) {
		classes.forEach(cls => {
			this._pageFilter.mutateForFilters(cls);

			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls), "class", cls.source);

			// Build a map of subclass source => subclass name => is excluded
			const subclassExclusions = {};
			(cls.subclasses || []).forEach(sc => {
				if (isExcluded) return;

				(subclassExclusions[sc.source] = subclassExclusions[sc.source] || {})[sc.name] = subclassExclusions[sc.source][sc.name] || ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](sc), "subclass", sc.source);
			});

			this._pageFilter.addToFilters(cls, isExcluded, {subclassExclusions});
		});

		// Force data on any classes with unusual sources to behave as though they have normal sources
		classes.filter(cls => SourceUtil.isNonstandardSource(cls.source) || BrewUtil.hasSourceJson(cls.source))
			.forEach(cls => {
				if (cls.fluff) cls.fluff.filter(f => f.source === cls.source).forEach(f => f._isStandardSource = true);
				cls.subclasses.filter(sc => sc.source === cls.source).forEach(sc => sc._isStandardSource = true);
			});

		classes.filter(cls => cls.subclasses).forEach(cls => cls.subclasses.sort(ClassesPage._ascSortSubclasses));

		this._dataList.push(...classes);

		const len = this._dataList.length;
		for (; this._ixData < len; this._ixData++) {
			const it = this._dataList[this._ixData];
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](it), "class", it.source);
			this._list.addItem(this.getListItem(it, this._ixData, isExcluded));
		}
	}

	_addData_addSubclassData (subclasses) {
		let isBlankSourceFilter;
		if (!Hist.initialLoad) {
			isBlankSourceFilter = !this._pageFilter.sourceFilter.getValues()._isActive;
		}

		subclasses.forEach(sc => {
			const cls = this._dataList.find(c => c.name.toLowerCase() === sc.className.toLowerCase() && c.source.toLowerCase() === (sc.classSource || SRC_PHB).toLowerCase());
			if (!cls) {
				JqueryUtil.doToast({
					content: `Could not add subclass; could not find class with name: ${cls.class} and source ${sc.source || SRC_PHB}`,
					type: "danger",
				});
				return;
			}

			// Avoid re-adding existing brew subclasses
			const existingBrewSc = sc.uniqueId ? cls.subclasses.find(it => it.uniqueId === sc.uniqueId) : null;
			if (existingBrewSc) return;

			const isExcludedClass = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls), "class", cls.source);

			cls.subclasses.push(sc);
			// Don't bother checking subclass exclusion for individually-added subclasses, as they should be from homebrew
			this._pageFilter.mutateAndAddToFilters(cls, isExcludedClass);
			cls.subclasses.sort(ClassesPage._ascSortSubclasses);
		});

		// If we load a homebrew source when we have no source filters active, the homebrew source will set itself high
		//   and force itself as the only visible source. Fix it in post.
		if (isBlankSourceFilter) this._pageFilter.sourceFilter.doSetPillsClear();
	}

	_initHashAndStateSync () {
		// Wipe all hooks, as we redo them for each class render
		this._resetHooks("state");
		this._resetHooksAll("state");
		this._resetHooks("classId");
		// Don't reset hooksAll for classId, as we use this to render the class

		this._addHookAll("state", () => this._setHashFromState());
	}

	_setHashFromState (isSuppressHistory) {
		// During the initial load, force-suppress all changes
		if (isSuppressHistory === undefined) isSuppressHistory = Hist.initialLoad;

		const nxtHash = this._getHashState();
		const rawLocation = window.location.hash;
		const location = rawLocation[0] === "#" ? rawLocation.slice(1) : rawLocation;
		if (nxtHash !== location) {
			if (isSuppressHistory) Hist.replaceHistoryHash(nxtHash);
			else window.location.hash = nxtHash;
		}
	}

	_handleHashChange () {
		// Parity with the implementation in hist.js
		if (Hist.isHistorySuppressed) return Hist.setSuppressHistory(false);

		this._setClassFromHash();
		this._setStateFromHash();
	}

	_setClassFromHash (isInitialLoad) {
		const [link] = Hist.getHashParts();

		let ixToLoad;

		if (link === HASH_BLANK) ixToLoad = -1;
		else {
			const listItem = Hist.getActiveListItem(link);

			if (listItem == null) ixToLoad = -1;
			else {
				const toLoad = listItem.ix;
				if (toLoad == null) ixToLoad = -1;
				else ixToLoad = listItem.ix;
			}
		}

		if (!~ixToLoad && this._list.visibleItems.length) ixToLoad = this._list.visibleItems[0].ix;

		if (~ixToLoad) {
			const target = isInitialLoad ? this.__classId : this._classId;
			if (target._ !== ixToLoad) {
				Hist.lastLoadedId = ixToLoad;
				const cls = this._dataList[ixToLoad];
				document.title = `${cls ? cls.name : "Classes"} - 5etools`;
				target._ = ixToLoad;
			}
		} else {
			// This should never occur (failed loads should pick the first list item), but attempt to handle it semi-gracefully
			$(`#pagecontent`).empty().append(ClassesPage._render_$getTrNoContent());
			JqueryUtil.doToast({content: "Could not find the class to load!", type: "error"})
		}
	}

	_setStateFromHash (isInitialLoad) {
		let [_, ...subs] = Hist.getHashParts();
		subs = this.filterBox.setFromSubHashes(subs);

		const target = isInitialLoad ? this.__state : this._state;

		// On changing class (class links have no state parts), clean "feature" state
		if (!subs.length) this.__state.feature = null;

		if (this._getHashState() === subs.join(HASH_PART_SEP)) return;

		const cls = this.activeClass;

		const validScLookup = {};
		cls.subclasses.forEach(sc => validScLookup[UrlUtil.getStateKeySubclass(sc)] = sc);

		// Track any incoming sources we need to filter to enable in order to display the desired subclasses
		const requiredSources = new Set();

		const seenKeys = new Set();
		subs.forEach(sub => {
			const unpacked = UrlUtil.unpackSubHash(sub);
			if (!unpacked.state) return;
			unpacked.state.map(it => {
				let [k, v] = it.split("=");
				k = k.toLowerCase();
				v = UrlUtil.mini.decompress(v);
				if (k.startsWith("sub")) { // subclass selection state keys
					if (validScLookup[k]) {
						if (target[k] !== v) target[k] = v;
						requiredSources.add(validScLookup[k].source);
						seenKeys.add(k);
					}
				} else { // known classes page state keys
					const knownKey = Object.keys(ClassesPage._DEFAULT_STATE).find(it => it.toLowerCase() === k);
					if (knownKey) {
						if (target[knownKey] !== v) target[knownKey] = v;
						seenKeys.add(knownKey);
					}
				} // else discard it
			});
		});

		Object.entries(ClassesPage._DEFAULT_STATE).forEach(([k, v]) => {
			// If we did not have a value for it, and the current state doesn't match the default, reset it
			if (!seenKeys.has(k) && v !== target[k]) target[k] = v;
		});

		if (requiredSources.size) {
			const sourceFilterValues = this._pageFilter.sourceFilter.getValues().Source;
			if (sourceFilterValues._isActive) {
				// If the filter includes "blue" values, set our sources to be included
				if (sourceFilterValues._totals.yes > 0) {
					requiredSources.forEach(source => this._pageFilter.sourceFilter.setValue(source, 1));
				} else { // if there are only "red"s active, disable them for our sources
					requiredSources.forEach(source => {
						if (sourceFilterValues[source] !== 0) this._pageFilter.sourceFilter.setValue(source, 0);
					});
				}
			}
		}

		Object.keys(validScLookup).forEach(k => {
			if (!seenKeys.has(k) && target[k]) target[k] = false;
		});

		// Run the sync in the other direction, a loop that *should* break once the hash/state match perfectly
		if (!isInitialLoad) this._setHashFromState();
	}

	/**
	 * @param [opts] Options object.
	 * @param [opts.class] Class to convert to hash.
	 * @param [opts.state] State to convert to hash.
	 */
	_getHashState (opts) {
		opts = opts || {};

		let fromState = opts.state || MiscUtil.copy(this.__state);
		let cls = opts.class || this.activeClass;

		// region class
		let primaryHash = cls ? UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls) : null;
		if (!primaryHash) {
			const firstItem = this._list.items[0];
			primaryHash = firstItem ? firstItem.values.hash : HASH_BLANK;
		}
		// endregion

		// region state
		const validScKeys = cls.subclasses.map(sc => UrlUtil.getStateKeySubclass(sc));
		const stateParts = Object.entries(fromState)
			.filter(([k, v]) => ClassesPage._DEFAULT_STATE[k] !== v) // ignore any default values
			.filter(([k, v]) => !(ClassesPage._DEFAULT_STATE[k] === undefined && !v)) // ignore any falsey values which don't have defaults
			.filter(([k]) => {
				// Filter out any junky subclasses/those from other classes
				if (!k.startsWith("sub")) return true;
				return validScKeys.includes(k);
			})
			.map(([k, v]) => `${k}=${UrlUtil.mini.compress(v)}`);
		const stateHash = stateParts.length ? UrlUtil.packSubHash("state", stateParts) : "";
		// endregion

		const hashParts = [
			primaryHash,
			stateHash,
		].filter(Boolean);
		return Hist.util.getCleanHash(hashParts.join(HASH_PART_SEP));
	}

	_initLinkGrabbers () {
		const $body = $(document.body);
		$body.on(`mousedown`, `.cls-main__linked-titles > td > * > .rd__h .entry-title-inner`, (evt) => evt.preventDefault());
		$body.on(`click`, `.cls-main__linked-titles > td > * > .rd__h .entry-title-inner`, async (evt) => {
			const $target = $(evt.target);

			if (evt.shiftKey) {
				await MiscUtil.pCopyTextToClipboard($target.text().replace(/\.$/, ""));
				JqueryUtil.showCopiedEffect($target);
			} else {
				const featureId = $target.closest(`tr`).attr("data-scroll-id");

				const curState = MiscUtil.copy(this.__state);
				curState.feature = featureId;
				const href = `${window.location.href.split("#")[0]}#${this._getHashState({state: curState})}`;

				await MiscUtil.pCopyTextToClipboard(href);
				JqueryUtil.showCopiedEffect($target, "Copied link!");
			}
		});
	}

	getListItem (cls, clsI, isExcluded) {
		const hash = UrlUtil.autoEncodeHash(cls);
		const source = Parser.sourceJsonToAbv(cls.source);

		const $lnk = $(`<a href="#${hash}" class="lst--border">
			<span class="bold col-8 pl-0">${cls.name}</span>
			<span class="col-4 text-center ${Parser.sourceJsonToColor(cls.source)} pr-0" title="${Parser.sourceJsonToFull(cls.source)}" ${BrewUtil.sourceJsonToStyle(cls.source)}>${source}</span>
		</a>`);

		const $ele = $$`<li class="row ${isExcluded ? "row--blacklisted" : ""}">${$lnk}</li>`;

		return new ListItem(
			clsI,
			$ele,
			cls.name,
			{
				hash,
				source,
			},
			{
				$lnk,
				entity: cls,
				uniqueId: cls.uniqueId ? cls.uniqueId : clsI,
				isExcluded,
			},
		);
	}

	_handleFilterChange () {
		const f = this.filterBox.getValues();

		this._list.filter(item => this._pageFilter.toDisplay(f, item.data.entity));

		this._$trsContent.forEach($tr => {
			$tr.find(`[data-source]`).each((i, e) => {
				const source = e.dataset.source;
				$(e).toggleClass("hidden", !this.filterBox.toDisplay(f, source, []));
			})
		});

		if (this._fnOutlineHandleFilterChange) this._fnOutlineHandleFilterChange();
		if (this._fnTableHandleFilterChange) this._fnTableHandleFilterChange(f);

		// Force-hide any subclasses which are filtered out
		this._proxyAssign(
			"state",
			"_state",
			"__state",
			this.activeClass.subclasses
				.filter(sc => !this.filterBox.toDisplay(f, sc.source, sc._fMisc))
				.map(sc => UrlUtil.getStateKeySubclass(sc))
				.filter(stateKey => this._state[stateKey])
				.mergeMap(stateKey => ({[stateKey]: false})),
		);
	}

	async _pInitAndRunRender () {
		this._$wrpOutline = $(`#sticky-nav`);

		// Use hookAll to allow us to reset temp hooks on the property itself
		this._addHookAll("classId", async () => {
			await this._pLock("render");
			try {
				await this._pDoRender();
			} finally {
				this._unlock("render");
			}
		});

		await this._pDoRender();
	}

	async _pDoRender () {
		// reset all hooks in preparation for rendering
		this._initHashAndStateSync();
		$(this.filterBox)
			.off(FilterBox.EVNT_VALCHANGE)
			.on(FilterBox.EVNT_VALCHANGE, this._handleFilterChange.bind(this));

		// region bind list updates
		const hkSetHref = () => {
			// defer this for performance
			setTimeout(() => {
				this._list.items
					.filter(it => it.data.$lnk)
					.forEach(it => {
						const href = `#${this._getHashState({class: it.data.entity})}`;
						it.data.$lnk.attr("href", href)
					});
			}, 5);
		};
		this._addHook("classId", "_", hkSetHref);
		this._addHookAll("state", hkSetHref);
		hkSetHref();
		// endregion

		// region rendering
		this._render_renderClassTable();
		this._render_renderSidebar();
		await this._render_pRenderSubclassTabs();
		this._render_renderClassContent();
		this._render_renderOutline();
		this._render_renderAltViews();
		// endregion

		// region state handling
		const hkScrollToFeature = () => {
			// `state.feature` is set by clicking links in the class feature table
			if (this._state.feature) {
				// track last scrolled, otherwise *any* further hash/state change will cause us to scroll
				if (this._lastScrollFeature === this._state.feature) return;
				this._lastScrollFeature = this._state.feature;

				const $scrollTo = $(`[data-scroll-id="${this._state.feature}"]`);
				if (!$scrollTo[0]) {
					// This should never occur, but just in case, clean up
					this._state.feature = null;
					this._lastScrollFeature = null;
				} else {
					setTimeout(() => $scrollTo[0].scrollIntoView(), 100);
				}
			}
		};
		this._addHookBase("feature", hkScrollToFeature);
		hkScrollToFeature();

		const hkDisplayFluff = () => $(`.cls-main__cls-fluff`).toggleClass("hidden", !this._state.isShowFluff);
		this._addHookBase("isShowFluff", hkDisplayFluff);
		MiscUtil.pDefer(hkDisplayFluff);

		const hkDisplayFeatures = () => {
			const $dispClassFeatures = $(`[data-feature-type="class"]`);
			const $dispFeaturesSubclassHeader = $(`[data-feature-type="gain-subclass"]`);

			if (this._state.isHideFeatures) {
				if (this._isAnySubclassActive()) {
					this._$wrpOutline.toggleClass("hidden", false);
					this._$trNoContent.toggleClass("hidden", true);
					$dispClassFeatures.toggleClass("hidden", true);
					$dispFeaturesSubclassHeader.toggleClass("hidden", false);
				} else {
					this._$wrpOutline.toggleClass("hidden", true);
					this._$trNoContent.toggleClass("hidden", false);
					$dispClassFeatures.toggleClass("hidden", true);
					$dispFeaturesSubclassHeader.toggleClass("hidden", true);
				}
			} else {
				this._$wrpOutline.toggleClass("hidden", false);
				this._$trNoContent.toggleClass("hidden", true);
				$dispClassFeatures.toggleClass("hidden", false);
				$dispFeaturesSubclassHeader.toggleClass("hidden", false);
			}
		};
		this._addHookBase("isHideFeatures", hkDisplayFeatures);
		MiscUtil.pDefer(hkDisplayFeatures);

		const cls = this.activeClass;
		cls.subclasses.forEach(sc => {
			const stateKey = UrlUtil.getStateKeySubclass(sc);
			const hkDisplaySubclass = () => {
				const isVisible = this._state[stateKey];
				$(`[data-subclass-id="${stateKey}"]`).toggleClass("hidden", !isVisible);
			};
			this._addHookBase(stateKey, hkDisplaySubclass);
			// Check/update main feature display here, as if there are no subclasses active we can hide more
			this._addHookBase(stateKey, hkDisplayFeatures);
			MiscUtil.pDefer(hkDisplaySubclass);
		});
		// endregion

		this._handleFilterChange();
	}

	_isAnySubclassActive () { return !!this._getActiveSubclasses().length; }

	_getActiveSubclasses (asStateKeys) {
		const cls = this.activeClass;
		return cls.subclasses
			.filter(sc => this._state[UrlUtil.getStateKeySubclass(sc)])
			.map(sc => asStateKeys ? UrlUtil.getStateKeySubclass(sc) : sc);
	}

	_render_renderClassTable () {
		const $wrpTblClass = $(`#classtable`).empty();
		const cls = this.activeClass;

		Renderer.get().resetHeaderIndex();

		const $tblGroupHeaders = [];
		const $tblHeaders = [];

		const renderTableGroupHeader = (tableGroup, stateKey) => {
			// Render titles (top section)
			let $thGroupHeader;
			if (tableGroup.title) {
				$thGroupHeader = $(`<th class="cls-tbl__col-group" colspan="${tableGroup.colLabels.length}">${tableGroup.title}</th>`);
			} else {
				// if there's no title, add a spacer
				$thGroupHeader = $(`<th colspan="${tableGroup.colLabels.length}"/>`);
			}
			$tblGroupHeaders.push($thGroupHeader);

			// Render column headers (bottom section)
			const $tblHeadersGroup = [];
			tableGroup.colLabels.forEach(lbl => {
				const $tblHeader = $(`<th class="cls-tbl__col-generic-center"><div class="cls__squash_header"/></th>`)
					.fastSetHtml(Renderer.get().render(lbl));
				$tblHeadersGroup.push($tblHeader);
				$tblHeaders.push($tblHeader);
			});

			// If there is a state key, this is a subclass table group, and may therefore need to be hidden
			if (!stateKey) return;
			const hkShowHide = () => {
				$thGroupHeader.toggleClass("hidden", !this._state[stateKey]);
				$tblHeadersGroup.forEach($tblHeader => $tblHeader.toggleClass("hidden", !this._state[stateKey]))
			};
			this._addHookBase(stateKey, hkShowHide);
			MiscUtil.pDefer(hkShowHide);
		};

		if (cls.classTableGroups) {
			cls.classTableGroups.forEach(tableGroup => renderTableGroupHeader(tableGroup));
		}

		cls.subclasses.forEach(sc => {
			if (!sc.subclassTableGroups) return;
			const stateKey = UrlUtil.getStateKeySubclass(sc);
			sc.subclassTableGroups.forEach(tableGroup => renderTableGroupHeader(tableGroup, stateKey));
		});

		const metasTblRows = cls.classFeatures.map((lvlFeatures, ixLvl) => {
			const pb = Math.ceil((ixLvl + 1) / 4) + 1;

			const lvlFeaturesFilt = lvlFeatures
				.filter(it => it.name && it.type !== "inset"); // don't add inset entry names to class table
			const metasFeatureLinks = lvlFeaturesFilt
				.map((it, ixFeature) => {
					const featureId = `${ixLvl}-${ixFeature}`;

					const $lnk = $(`<a>${it.name}</a>`)
						.click(() => {
							this._lastScrollFeature = null;
							this._state.feature = null;
							this._state.feature = featureId;
						});

					const hkSetHref = () => {
						// defer this for performance
						setTimeout(() => {
							// these will modify this._state.feature when clicked
							const curState = MiscUtil.copy(this.__state);
							curState.feature = featureId;
							const href = `#${this._getHashState({state: curState})}`;
							$lnk.attr("href", href);
						}, 5);
					};
					this._addHookAll("state", hkSetHref);
					hkSetHref();

					// Make a dummy for the last item
					const $dispComma = ixFeature === lvlFeaturesFilt.length - 1 ? $(`<span/>`) : $(`<span class="mr-1">,</span>`);
					return {
						$wrpLink: $$`<div class="inline-block">${$lnk}${$dispComma}</div>`,
						$dispComma,
						source: it.source,
						isHidden: false,
					};
				});

			const $ptTableGroups = [];

			const renderTableGroupRow = (tableGroup, stateKey) => {
				const row = tableGroup.rows[ixLvl] || [];
				const $cells = row.map(cell => $(`<td class="cls-tbl__col-generic-center"/>`).fastSetHtml(cell === 0 ? "\u2014" : Renderer.get().render(cell)));
				$ptTableGroups.push(...$cells);

				// If there is a state key, this is a subclass table group, and may therefore need to be hidden
				if (!stateKey) return;
				const hkShowHide = () => $cells.forEach($cell => $cell.toggleClass("hidden", !this._state[stateKey]));
				this._addHookBase(stateKey, hkShowHide);
				MiscUtil.pDefer(hkShowHide); // saves ~10ms
			};

			if (cls.classTableGroups) {
				cls.classTableGroups.forEach(tableGroup => renderTableGroupRow(tableGroup));
			}

			cls.subclasses.forEach(sc => {
				if (!sc.subclassTableGroups) return;
				const stateKey = UrlUtil.getStateKeySubclass(sc);
				sc.subclassTableGroups.forEach(tableGroup => renderTableGroupRow(tableGroup, stateKey));
			});

			return {
				$row: $$`<tr class="cls-tbl__stripe-odd">
					<td class="cls-tbl__col-level">${Parser.getOrdinalForm(ixLvl + 1)}</td>
					<td class="cls-tbl__col-prof-bonus">+${pb}</td>
					<td>${metasFeatureLinks.length ? metasFeatureLinks.map(it => it.$wrpLink) : `\u2014`}</td>
					${$ptTableGroups}
				</tr>`,
				metasFeatureLinks,
			}
		});

		this._fnTableHandleFilterChange = (filterValues) => {
			metasTblRows.forEach(metaTblRow => {
				metaTblRow.metasFeatureLinks.forEach(metaFeatureLink => {
					if (metaFeatureLink.source) {
						const isHidden = !this.filterBox.toDisplay(filterValues, metaFeatureLink.source, []);
						metaFeatureLink.isHidden = isHidden;
						metaFeatureLink.$wrpLink.toggleClass("hidden", isHidden);
					}
				});

				metaTblRow.metasFeatureLinks.forEach(metaFeatureLink => metaFeatureLink.$dispComma.toggleClass("hidden", false));
				const lastVisible = metaTblRow.metasFeatureLinks.filter(metaFeatureLink => !metaFeatureLink.isHidden).last();
				if (lastVisible) lastVisible.$dispComma.addClass("hidden");
			});
		};

		$$`<table class="cls-tbl shadow-big w-100 mb-2">
			<tbody>
			<tr><th class="border" colspan="15"></th></tr>
			<tr><th class="cls-tbl__disp-name" colspan="15">${cls.name}</th></tr>
			<tr>
				<th colspan="3"/> <!-- spacer to match the 3 default cols (level, prof, features) -->
				${$tblGroupHeaders}
			</tr>
			<tr>
				<th class="cls-tbl__col-level">Level</th>
				<th class="cls-tbl__col-prof-bonus">Proficiency Bonus</th>
				<th>Features</th>
				${$tblHeaders}
			</tr>
			${metasTblRows.map(it => it.$row)}
			<tr><th class="border" colspan="15"></th></tr>
			</tbody>
		</table>`.appendTo($wrpTblClass);
		$wrpTblClass.show();
	}

	_render_renderSidebar () {
		const $wrpSidebar = $(`#statsprof`).empty();
		const cls = this.activeClass;

		const $btnToggleSidebar = $(`<div class="cls-side__btn-toggle">[\u2012]</div>`)
			.click(() => this._state.isHideSidebar = !this._state.isHideSidebar);
		const hkSidebarHidden = () => {
			$btnToggleSidebar.text(this._state.isHideSidebar ? `[+]` : `[\u2012]`);
			$(`.cls-side__show-hide`).toggle(!this._state.isHideSidebar);
		};
		this._addHookBase("isHideSidebar", hkSidebarHidden);
		// (call the hook later)

		// region Requirements
		const $getRenderedRequirements = (requirements, intro = null) => {
			const renderPart = (obj, joiner = ", ") => Object.keys(obj).filter(k => Parser.ABIL_ABVS.includes(k)).sort(SortUtil.ascSortAtts).map(k => `${Parser.attAbvToFull(k)} ${obj[k]}`).join(joiner);
			const orPart = requirements.or ? requirements.or.map(obj => renderPart(obj, " or ")).join("; ") : "";
			const basePart = renderPart(requirements);
			const abilityPart = [orPart, basePart].filter(Boolean).join("; ");

			const allEntries = [
				abilityPart ? `{@b Ability Score Minimum:} ${abilityPart}` : null,
				...requirements.entries || [],
			].filter(Boolean);

			return $$`<div>${Renderer.get().setFirstSection(true).render({type: "section", entries: allEntries})}</div>`
		};

		let $ptRequirements = null;
		if (cls.requirements) {
			const $ptPrereq = $getRenderedRequirements(cls.requirements);

			$ptRequirements = $$`<tr class="cls-side__show-hide">
				<td class="cls-side__section" colspan="6">
					<h5 class="cls-side__section-head">Prerequisites</h5>
					${$ptPrereq}
				</td>
			</tr>`;
		}
		// endregion

		// region HP/hit dice
		let $ptHp = null;
		if (cls.hd) {
			const hdEntry = {toRoll: `${cls.hd.number}d${cls.hd.faces}`, rollable: true};

			$ptHp = `<tr class="cls-side__show-hide">
				<td colspan="6" class="cls-side__section">
					<h5 class="cls-side__section-head">Hit Points</h5>
					<div><strong>Hit Dice:</strong> ${Renderer.getEntryDice(hdEntry, "Hit die")}</div>
					<div><strong>Hit Points at 1st Level:</strong> ${cls.hd.number * cls.hd.faces} + your Constitution modifier</div>
					<div><strong>Hit Points at Higher Levels:</strong> ${Renderer.getEntryDice(hdEntry, "Hit die")} (or ${((cls.hd.number * cls.hd.faces) / 2 + 1)}) + your Constitution modifier per ${cls.name} level after 1st</div>
				</td>
			</tr>`
		}
		// endregion

		// region Starting proficiencies
		const renderArmorProfs = armorProfs => armorProfs.map(a => a.full ? a.full : a === "light" || a === "medium" || a === "heavy" ? `${a} armor` : a).join(", ");
		const renderWeaponsProfs = weaponProfs => weaponProfs.map(w => w === "simple" || w === "martial" ? `${w} weapons` : w).join(", ");
		const renderToolProfs = toolProfs => toolProfs.map(it => Renderer.get().render(it)).join(", ")
		const renderSkillsProfs = skills => `${Parser.skillProficienciesToFull(skills).uppercaseFirst()}.`;

		const profs = cls.startingProficiencies || {};
		// endregion

		// region Starting equipment
		let $ptEquipment = null;
		if (cls.startingEquipment) {
			const equip = cls.startingEquipment;
			const rendered = [
				equip.additionalFromBackground ? "<p>You start with the following items, plus anything provided by your background.</p>" : "",
				equip.default && equip.default.length ? `<ul class="pl-4"><li>${equip.default.map(it => Renderer.get().render(it)).join("</li><li>")}</ul>` : "",
				equip.goldAlternative != null ? `<p>Alternatively, you may start with ${Renderer.get().render(equip.goldAlternative)} gp to buy your own equipment.</p>` : "",
			].filter(Boolean).join("");
			const $dispRendered = $(`<div/>`);

			$ptEquipment = $$`<tr class="cls-side__show-hide">
				<td class="cls-side__section" colspan="6">
					<h5 class="cls-side__section-head">Starting Equipment</h5>
					<div>${$dispRendered}</div>
				</td>
			</tr>`;
			$dispRendered.fastSetHtml(rendered);
		}
		// endregion

		// region multiclassing
		let $ptMulticlassing = null;
		if (cls.multiclassing) {
			const mc = cls.multiclassing;

			const htmlMCcPrereqPreText = mc.requirements || mc.requirementsSpecial ? `<div>To qualify for a new class, you must meet the ${mc.requirementsSpecial ? "" : "ability score "}prerequisites for both your current class and your new one.</div>` : "";
			let $ptMcPrereq = null;
			if (mc.requirements) {
				$ptMcPrereq = $getRenderedRequirements(mc.requirements, htmlMCcPrereqPreText);
			}

			let $ptMcPrereqSpecial = null;
			if (mc.requirementsSpecial) {
				$ptMcPrereqSpecial = $$`<div>
					${mc.requirements ? "" : htmlMCcPrereqPreText}
					<b>${mc.requirements ? "Other " : ""}Prerequisites:</b> ${Renderer.get().render(mc.requirementsSpecial || "")}
				</div>`
			}

			let $ptMcProfsIntro = null;
			let $ptMcProfsArmor = null;
			let $ptMcProfsWeapons = null;
			let $ptMcProfsTools = null;
			let $ptMcProfsSkills = null;
			if (mc.proficienciesGained) {
				$ptMcProfsIntro = $(`<div ${mc.requirements || mc.requirementsSpecial ? `class="cls-side__mc-prof-intro--requirements"` : ""}>When you gain a level in a class other than your first, you gain only some of that class's starting proficiencies.</div>`);

				if (mc.proficienciesGained.armor) $ptMcProfsArmor = $(`<div><b>Armor:</b> ${renderArmorProfs(mc.proficienciesGained.armor)}</div>`);

				if (mc.proficienciesGained.weapons) $ptMcProfsWeapons = $(`<div><b>Weapons:</b> ${renderWeaponsProfs(mc.proficienciesGained.weapons)}</div>`);

				if (mc.proficienciesGained.tools) $ptMcProfsTools = $(`<div><b>Tools:</b> ${renderToolProfs(mc.proficienciesGained.tools)}</div>`);

				if (mc.proficienciesGained.skills) $ptMcProfsSkills = $(`<div><b>Skills:</b> ${renderSkillsProfs(mc.proficienciesGained.skills)}</div>`);
			}

			let $ptMcEntries = null;
			if (mc.entries) {
				$ptMcEntries = $(`<div></div>`).fastSetHtml(Renderer.get().setFirstSection(true).render({type: "section", entries: mc.entries}));
			}

			$ptMulticlassing = $$`<tr class="cls-side__show-hide">
				<td class="cls-side__section" colspan="6">
					<h5 class="cls-side__section-head">Multiclassing</h5>
					${$ptMcPrereq}
					${$ptMcPrereqSpecial}
					${$ptMcEntries}
					${$ptMcProfsIntro}
					${$ptMcProfsArmor}
					${$ptMcProfsWeapons}
					${$ptMcProfsTools}
					${$ptMcProfsSkills}
				</td>
			</tr>`;
		}
		// endregion

		$$`<table class="stats shadow-big">
			<tr><th class="border" colspan="6"></th></tr>
			<tr><th colspan="6"><div class="split-v-center pr-1"><div class="cls-side__name">${cls.name}</div>${$btnToggleSidebar}</div></th></tr>
			${cls.authors ? `<tr><th colspan="6">By ${cls.authors.join(", ")}</th></tr>` : ""}

			${$ptRequirements}

			${$ptHp}

			<tr class="cls-side__show-hide">
				<td colspan="6" class="cls-side__section">
					<h5 class="cls-side__section-head">Proficiencies</h5>
					<div><b>Armor:</b> <span>${profs.armor ? renderArmorProfs(profs.armor) : "none"}</span></div>
					<div><b>Weapons:</b> <span>${profs.weapons ? renderWeaponsProfs(profs.weapons) : "none"}</span></div>
					<div><b>Tools:</b> <span>${profs.tools ? renderToolProfs(profs.tools) : "none"}</span></div>
					<div><b>Saving Throws:</b> <span>${cls.proficiency ? cls.proficiency.map(p => Parser.attAbvToFull(p)).join(", ") : "none"}</span></div>
					<div><b>Skills:</b> <span>${profs.skills ? renderSkillsProfs(profs.skills) : "none"}</span></div>
				</td>
			</tr>

			${$ptEquipment}

			${$ptMulticlassing}

			<tr><th class="border" colspan="6"></th></tr>
		</table>`.appendTo($wrpSidebar);
		$wrpSidebar.show();

		MiscUtil.pDefer(hkSidebarHidden);
	}

	async _render_pRenderSubclassTabs () {
		const $wrp = $(`#subclasstabs`).empty();

		this._render_renderSubclassPrimaryControls($wrp);
		await this._render_pInitSubclassControls($wrp);
	}

	_render_renderSubclassPrimaryControls ($wrp) {
		const cls = this.activeClass;

		// region features/fluff
		const $btnToggleFeatures = ComponentUiUtil.$getBtnBool(this, "isHideFeatures", {text: "Features", activeClass: "cls__btn-cf--active", isInverted: true}).title("Toggle Class Features");
		const $btnToggleFluff = ComponentUiUtil.$getBtnBool(this, "isShowFluff", {text: "Info"}).title("Toggle Class Info");

		$$`<div class="flex-v-center m-1 btn-group mr-3 no-shrink">${$btnToggleFeatures}${$btnToggleFluff}</div>`.appendTo($wrp);
		// endregion

		// region subclasses
		const $wrpScTabs = $(`<div class="flex-v-center flex-wrap mr-2 w-100"/>`).appendTo($wrp);
		this._listSubclass = new List({$wrpList: $wrpScTabs, isUseJquery: true, fnSort: ClassesPage._fnSortSubclassFilterItems});

		this._ixDataSubclass = 0;
		for (; this._ixDataSubclass < cls.subclasses.length; ++this._ixDataSubclass) {
			const sc = cls.subclasses[this._ixDataSubclass];
			const listItem = this._render_getSubclassTab(cls, sc, this._ixDataSubclass);
			if (!listItem) continue;
			this._listSubclass.addItem(listItem);
		}

		const $dispCount = $(`<div class="text-muted m-1 cls-tabs__sc-not-shown flex-vh-center"/>`);
		this._listSubclass.addItem(new ListItem(
			-1,
			$dispCount,
			null,
			{isAlwaysVisible: true},
		));

		this._listSubclass.on("updated", () => {
			$dispCount.off("click");
			if (this._listSubclass.visibleItems.length) {
				const cntNotShown = this._listSubclass.items.length - this._listSubclass.visibleItems.length;
				$dispCount.html(cntNotShown ? `<i class="clickable" title="Adjust your filters to see more.">(${cntNotShown} more not shown)</i>` : "").click(() => this._doSelectAllSubclasses());
			} else if (this._listSubclass.items.length > 1) {
				$dispCount.html(`<i class="clickable" title="Adjust your filters to see more.">(${this._listSubclass.items.length - 1} subclasses not shown)</i>`).click(() => this._doSelectAllSubclasses());
			} else $dispCount.html("");
		});

		this._listSubclass.init();
		// endregion
	}

	_doSelectAllSubclasses () {
		const cls = this.activeClass;
		const allStateKeys = cls.subclasses.map(sc => UrlUtil.getStateKeySubclass(sc));

		this._pageFilter.sourceFilter.doSetPillsClear();
		this.filterBox.fireChangeEvent();
		this._proxyAssign("state", "_state", "__state", allStateKeys.mergeMap(stateKey => ({[stateKey]: true})));
	}

	async _render_pInitSubclassControls ($wrp) {
		const cls = this.activeClass;

		const $btnSelAll = $(`<button class="btn btn-xs btn-default" title="Select All (SHIFT to include most recent UA/etc.; CTRL to select official only)"><span class="glyphicon glyphicon-check"/></button>`)
			.click(evt => {
				const allStateKeys = cls.subclasses.map(sc => UrlUtil.getStateKeySubclass(sc));
				if (evt.shiftKey) {
					this._doSelectAllSubclasses();
				} else if (evt.ctrlKey || evt.metaKey) {
					const nxtState = {};
					allStateKeys.forEach(k => nxtState[k] = false);
					this._listSubclass.visibleItems
						.filter(it => it.values.mod === "brew" || it.values.mod === "fresh")
						.map(it => it.values.stateKey)
						.forEach(stateKey => nxtState[stateKey] = true);
					this._proxyAssign("state", "_state", "__state", nxtState);
				} else {
					const nxtState = {};
					allStateKeys.forEach(k => nxtState[k] = false);
					this._listSubclass.visibleItems
						.map(it => it.values.stateKey)
						.filter(Boolean)
						.forEach(stateKey => nxtState[stateKey] = true);
					this._proxyAssign("state", "_state", "__state", nxtState);
				}
			});

		const filterSets = [
			{name: "View Official", subHashes: [], isClearSources: false},
			{name: "View Most Recent", subHashes: [], isClearSources: true},
			{name: "View All", subHashes: ["flstmiscellaneous:reprinted=0"], isClearSources: true},
		];
		const setFilterSet = ix => {
			const filterSet = filterSets[ix];
			const boxSubhashes = this.filterBox.getBoxSubHashes() || [];

			const cpySubHashes = MiscUtil.copy(filterSet.subHashes);
			if (filterSet.isClearSources) {
				const classifiedSources = this._pageFilter.sourceFilter.getSources();
				const sourcePart = [...classifiedSources.official, ...classifiedSources.homebrew]
					.map(src => `${src.toUrlified()}=0`)
					.join(HASH_SUB_LIST_SEP);
				cpySubHashes.push(`flstsource:${sourcePart}`)
			}

			this.filterBox.setFromSubHashes([
				...boxSubhashes,
				...cpySubHashes,
				`flopsource:extend`,
			].filter(Boolean), true);
			$selFilterPreset.val("-1");
		};
		const $selFilterPreset = $(`<select class="input-xs form-control cls-tabs__sel-preset"><option value="-1" disabled>Filter...</option></select>`)
			.change(() => {
				const val = Number($selFilterPreset.val());
				if (val == null) return;
				setFilterSet(val)
			});
		filterSets.forEach((it, i) => $selFilterPreset.append(`<option value="${i}">${it.name}</option>`));
		$selFilterPreset.val("-1");

		const $btnReset = $(`<button class="btn btn-xs btn-default" title="Reset Selection"><span class="glyphicon glyphicon-refresh"/></button>`)
			.click(() => {
				this._proxyAssign("state", "_state", "__state", cls.subclasses.mergeMap(sc => ({[UrlUtil.getStateKeySubclass(sc)]: false})));
			});

		$(this.filterBox).on(FilterBox.EVNT_VALCHANGE, this._handleSubclassFilterChange.bind(this));
		this._handleSubclassFilterChange();
		// Remove the temporary "hidden" class used to prevent popping
		this._listSubclass.items.forEach(it => it.ele.removeClass("hidden"));

		const $btnToggleSources = ComponentUiUtil.$getBtnBool(this, "isShowScSources", {$ele: $(`<button class="btn btn-xs btn-default flex-1" title="Show Subclass Sources"><span class="glyphicon glyphicon-book"/></button>`)});

		const $btnShuffle = $(`<button title="Feeling Lucky?" class="btn btn-xs btn-default flex-1"><span class="glyphicon glyphicon-random"/></button>`)
			.click(() => {
				if (!this._listSubclass.visibleItems.length) return JqueryUtil.doToast({content: "No subclasses to choose from!", type: "warning"});

				const doDeselAll = () => this._listSubclass.items.filter(it => it.values.stateKey).forEach(it => this._state[it.values.stateKey] = false);

				const activeKeys = Object.keys(this._state).filter(it => it.startsWith("sub"));
				const visibleActiveKeys = this._listSubclass.visibleItems.filter(it => it.values.stateKey).map(it => it.values.stateKey).filter(it => activeKeys.includes(it));

				// Avoid re-selecting the same option if there's only one selected
				if (visibleActiveKeys.length === 1) {
					doDeselAll();
					const options = this._listSubclass.visibleItems.filter(it => it.values.stateKey).map(it => it.values.stateKey).filter(it => it.values.stateKey !== visibleActiveKeys[0]);
					this._state[RollerUtil.rollOnArray(options)] = true;
				} else {
					doDeselAll();
					const it = RollerUtil.rollOnArray(this._listSubclass.visibleItems.filter(it => it.values.stateKey));
					this._state[it.values.stateKey] = true;
				}
			});

		$$`<div class="flex-v-center m-1 no-shrink">${$selFilterPreset}</div>`.appendTo($wrp);
		$$`<div class="flex-v-center m-1 btn-group no-shrink">
			${$btnSelAll}${$btnShuffle}${$btnReset}${$btnToggleSources}
		</div>`.appendTo($wrp);
	}

	_handleSubclassFilterChange () {
		const f = this.filterBox.getValues();
		const cls = this.activeClass;
		this._listSubclass.filter(li => {
			if (li.values.isAlwaysVisible) return true;
			return this.filterBox.toDisplay(
				f,
				li.data.entity.source,
				li.data.entity._fMisc,
			);
		});
	}

	_render_getSubclassTab (cls, sc, ix) {
		const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](sc), "subclass", sc.source);

		const stateKey = UrlUtil.getStateKeySubclass(sc);
		const mod = ClassesPage.getSubclassCssMod(cls, sc);
		const clsActive = `cls__btn-sc--active-${mod}`;

		if (this._state[stateKey] == null) this._state[stateKey] = false;

		const $dispName = $(`<div title="${ClassesPage.getBtnTitleSubclass(sc)}"/>`);
		const $dispSource = $(`<div class="ml-1" title="${Parser.sourceJsonToFull(sc.source)}">(${Parser.sourceJsonToAbv(sc.source)})</div>`);
		const hkSourcesVisible = () => {
			$dispName.text(this._state.isShowScSources ? ClassesPage.getBaseShortName(sc) : sc.shortName);
			$dispSource.toggleClass("hidden", !this._state.isShowScSources);
		};
		this._addHookBase("isShowScSources", hkSourcesVisible);
		MiscUtil.pDefer(hkSourcesVisible);

		// Initially have these "hidden," to prevent them popping out when we filter them
		const $btn = $$`<button class="btn btn-default btn-xs flex-v-center m-1 hidden ${sc.isReprinted ? "cls__btn-sc--reprinted" : ""}">
				${$dispName}
				${$dispSource}
			</button>`
			.click(() => this._state[stateKey] = !this._state[stateKey])
			.contextmenu(evt => {
				evt.preventDefault();
				this._state[stateKey] = !this._state[stateKey];
			});
		const hkVisible = () => $btn.toggleClass(clsActive, !!this._state[stateKey]);
		this._addHookBase(stateKey, hkVisible);
		MiscUtil.pDefer(hkVisible);

		return new ListItem(
			ix,
			$btn,
			sc.name,
			{
				source: sc.source,
				shortName: sc.shortName,
				stateKey,
				mod,
			},
			{
				isExcluded,
				entity: sc,
				uniqueId: sc.uniqueId ? sc.uniqueId : ix,
			},
		);
	}

	_trackOutlineFluffData (depthData) { this._outlineData.fluff = depthData; }

	_trackOutlineCfData (ixLvl, ixFeature, depthData) {
		((this._outlineData.classFeatures = (this._outlineData.classFeatures || []))[ixLvl] =
			(this._outlineData.classFeatures[ixLvl] || []))[ixFeature] =
			depthData;
	}

	_trackOutlineScData (stateKey, ixScLvl, ixScFeature, depthData) {
		((this._outlineData[stateKey] = (this._outlineData[stateKey] || []))[ixScLvl] =
			(this._outlineData[stateKey][ixScLvl] || []))[ixScFeature] =
			depthData;
	}

	_render_renderOutline () {
		this._$wrpOutline.empty();

		const $dispShowHide = $(`<div class="cls-nav__disp-toggle"/>`);
		const $wrpHeadInner = $$`<div class="cls-nav__head-inner split">
			<div>Outline</div>
			${$dispShowHide}
		</div>`
			.click(() => this._state.isHideOutline = !this._state.isHideOutline);

		const $wrpHead = $$`<div class="cls-nav__head">
			${$wrpHeadInner}
			<hr class="cls-nav__hr">
		</div>`.appendTo(this._$wrpOutline);
		const $wrpBody = $(`<div class="nav-body"/>`).appendTo(this._$wrpOutline);

		const hkShowHide = () => {
			$wrpHead.toggleClass("cls-nav__head--active", !this._state.isHideOutline);
			$wrpBody.toggleClass("hidden", !!this._state.isHideOutline);
			$dispShowHide.toggleClass("cls-nav__disp-toggle--active", !this._state.isHideOutline);
		};
		this._addHookBase("isHideOutline", hkShowHide);
		MiscUtil.pDefer(hkShowHide);

		const _hkRender = async () => {
			await this._pLock("render-outline");
			$wrpBody.empty();
			const filterValues = this.filterBox.getValues();

			const makeItem = (depthData, scCssClass) => {
				// Skip inline entries
				if (depthData.depth >= 2) return;
				// Skip filtered sources
				if (depthData.source && !this.filterBox.toDisplay(filterValues, depthData.source, [])) return;

				// If there was not a class specified, then this is not a subclass item, so we can color it with grellow as required
				scCssClass = (depthData.source && SourceUtil.isNonstandardSource(depthData.source) ? `cls-nav__item--spicy` : "") || scCssClass;
				const displayDepth = Math.min(depthData.depth + 1, 2);
				$(`<div class="cls-nav__item cls-nav__item--depth-${displayDepth} ${scCssClass}">${depthData.name}</div>`)
					.click(() => {
						const $it = $(`[data-title-index="${depthData.ixHeader}"]`);
						if ($it.get()[0]) $it.get()[0].scrollIntoView();
					})
					.appendTo($wrpBody);
			};

			if (this._state.isShowFluff && this._outlineData.fluff) {
				this._outlineData.fluff.filter(it => it.name).forEach(it => makeItem(it));
			}

			if (this._state.isHideFeatures && !this._isAnySubclassActive()) {
				this._unlock("render-outline");
				return;
			}

			let ixScLvl = 0;
			this.activeClass.classFeatures.forEach((lvlFeatures, ixLvl) => {
				lvlFeatures.forEach((feature, ixFeature) => {
					const depthData = MiscUtil.get(this._outlineData.classFeatures, ixLvl, ixFeature);

					if (!this._state.isHideFeatures && depthData) {
						depthData.filter(it => it.name).forEach(it => makeItem(it));
					}

					const activeScStateKeys = this._getActiveSubclasses(true);
					if (feature.gainSubclassFeature) {
						if (activeScStateKeys.length) {
							// If we didn't render the intro for gaining a subclass feature, do so now
							if (this._state.isHideFeatures && depthData) {
								depthData.filter(it => it.name).forEach(it => makeItem(it));
							}

							this.activeClass.subclasses.forEach(sc => {
								const stateKey = UrlUtil.getStateKeySubclass(sc);

								if (!activeScStateKeys.includes(stateKey)) return;

								const scLvlFeatures = sc.subclassFeatures[ixScLvl];
								if (!scLvlFeatures) return;

								const mod = ClassesPage.getSubclassCssMod(this.activeClass, sc);
								const modClass = `cls-nav__item--sc-${mod}`;

								scLvlFeatures.forEach((scFeature, ixScFeature) => {
									const depthData = MiscUtil.get(this._outlineData, stateKey, ixScLvl, ixScFeature);
									depthData.filter(it => it.name).map(it => makeItem(it, modClass));
								});
							});
						}

						ixScLvl++;
					}
				});
			});

			this._unlock("render-outline");
		};
		const hkRender = MiscUtil.debounce(_hkRender, 50);
		this._addHookBase("isShowFluff", hkRender);
		this._addHookBase("isHideFeatures", hkRender);
		this.activeClass.subclasses.forEach(sc => {
			const stateKey = UrlUtil.getStateKeySubclass(sc);
			this._addHookBase(stateKey, hkRender);
		});
		this._fnOutlineHandleFilterChange = hkRender;
		MiscUtil.pDefer(hkRender);
	}

	_render_renderAltViews () { // "Hitler was right"
		const cls = this.activeClass;

		// region subclass comparison
		this._subclassComparisonView = new BookModeView({
			stateKey: "isViewActiveScComp",
			state: this._state,
			$openBtn: $(`#btn-comparemode`),
			noneVisibleMsg: "Please select some subclasses first",
			pageTitle: "Subclass Comparison",
			isFlex: true,
			popTblGetNumShown: $wrpContent => {
				$wrpContent.removeClass("bkmv__wrp").addClass("h-100").addClass("flex-col");
				$wrpContent.parent().addClass("stats").addClass("stats--book");

				const renderStack = [];
				const numScLvls = cls.subclasses[0].subclassFeatures.length;

				const filterValues = this._pageFilter.filterBox.getValues();
				const walker = MiscUtil.getWalker({keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST, isAllowDeleteObjects: true});

				for (let ixLevel = 0; ixLevel < numScLvls; ++ixLevel) {
					const isLastRow = ixLevel === numScLvls - 1;

					renderStack.push(`<div class="flex ${isLastRow ? "mb-4" : ""}">`);
					cls.subclasses
						.filter(sc => !ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](sc), "subclass", sc.source))
						.forEach((sc, ixSubclass) => {
							const mod = ClassesPage.getSubclassCssMod(cls, sc);
							renderStack.push(`<div class="mx-2 no-shrink cls-comp__wrp-features cls-main__sc-feature ${mod ? `cls-main__sc-feature--${mod}` : ""}" data-cls-comp-sc-ix="${ixSubclass}">`);
							sc.subclassFeatures[ixLevel].forEach(f => {
								const cpy = MiscUtil.copy(f);

								// Note that this won't affect the root feature, only those nested inside it. The root
								//   feature is filtered out elsewhere.
								walker.walk(
									cpy,
									{
										object: (obj) => {
											if (!obj.source) return obj;
											if (this._pageFilter.filterBox.toDisplay(filterValues, obj.source, [])) return obj;
											return undefined; // If it shouldn't be displayed, delete it
										},
									},
								)

								Renderer.get().recursiveRender(cpy, renderStack);
							});
							renderStack.push(`</div>`);
						});
					renderStack.push(`</div>`);

					if (!isLastRow) renderStack.push(`<hr class="hr-2 mt-3 cls-comp__hr-level"/>`);
				}
				$wrpContent.append(renderStack.join(""));

				let numShown = 0;
				cls.subclasses
					.filter(sc => !ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](sc), "subclass", sc.source))
					.forEach((sc, i) => {
						const key = UrlUtil.getStateKeySubclass(sc);

						if (!this._state[key]) {
							$wrpContent.find(`[data-cls-comp-sc-ix="${i}"]`).hide();
						} else numShown++;
					});

				if (!numShown) $wrpContent.find(".cls-comp__hr-level").addClass("hidden");

				return numShown;
			},
		});

		const hkToggleScOverlay = async () => {
			await this._pLock("sc-comparison ");

			if (this._state.isViewActiveScComp) await this._subclassComparisonView.pOpen();
			else {
				this._subclassComparisonView.teardown();
				document.title = `${cls ? cls.name : "Classes"} - 5etools`;
			}

			this._unlock("sc-comparison ");
		};
		this._addHookBase("isViewActiveScComp", hkToggleScOverlay);
		hkToggleScOverlay();
		// endregion

		// region book view
		if (this._classBookView) this._classBookView.cleanup();
		this._classBookView = new ClassesPage.ClassBookView(this);

		const hkToggleBookOverlay = () => {
			if (this._state.isViewActiveBook) this._classBookView.open();
			else {
				this._classBookView.teardown();
				document.title = `${cls ? cls.name : "Classes"} - 5etools`;
			}
		};
		this._addHookBase("isViewActiveBook", hkToggleBookOverlay);
		hkToggleBookOverlay();
		// endregion
	}

	static getSubclassCssMod (cls, sc) {
		if (sc.source !== cls.source) {
			return BrewUtil.hasSourceJson(sc.source)
				? "brew"
				: SourceUtil.isNonstandardSource(sc.source)
					? sc.isReprinted ? "stale" : "spicy"
					: sc.isReprinted ? "reprinted" : "fresh";
		}
		return "fresh";
	}

	_render_renderClassContent () {
		const $content = $(`#pagecontent`).empty();
		const cls = this._dataList[this._classId._];
		this._outlineData = {};
		this._$trsContent = [];

		$content.append(Renderer.utils.getBorderTr());

		if (cls.fluff) {
			const depthArr = [];
			let stack = "";
			Renderer.get().setFirstSection(true);

			cls.fluff.forEach((f, i) => {
				const cpy = MiscUtil.copy(f);

				if (typeof cpy !== "string") {
					if (f.source && f.source !== cls.source && cpy.entries) cpy.entries.unshift(`{@note The following information is from ${Parser.sourceJsonToFull(f.source)}${Renderer.utils.isDisplayPage(f.page) ? `, page ${f.page}` : ""}.}`);
				}

				stack += Renderer.get().setDepthTracker(depthArr).render(cpy);
			});

			const $trFluff = $(`<tr class="cls-main__cls-fluff"><td colspan="6"/></tr>`).fastSetHtml(stack).appendTo($content);
			this._$trsContent.push($trFluff);
			this._trackOutlineFluffData(depthArr);
		}

		let ixScLvl = 0;
		cls.classFeatures.forEach((lvlFeatures, ixLvl) => {
			lvlFeatures.forEach((feature, ixFeature) => {
				const depthArr = [];
				const $trClassFeature = $(`<tr data-scroll-id="${ixLvl}-${ixFeature}" data-feature-type="class" class="${feature.gainSubclassFeature ? "cls-main__gain-sc-feature" : ""} cls-main__linked-titles"><td colspan="6"/></tr>`)
					.fastSetHtml(Renderer.get().setDepthTracker(depthArr).render(feature))
					.appendTo($content);
				this._$trsContent.push($trClassFeature);
				this._trackOutlineCfData(ixLvl, ixFeature, depthArr);

				if (feature.gainSubclassFeature) {
					$trClassFeature.attr("data-feature-type", "gain-subclass");
					cls.subclasses.forEach(sc => {
						const stateKey = UrlUtil.getStateKeySubclass(sc);

						// Add any extra coloring the subclass might require
						const cssMod = `cls-main__sc-feature--${ClassesPage.getSubclassCssMod(cls, sc)}`;

						const scLvlFeatures = sc.subclassFeatures[ixScLvl];
						if (!scLvlFeatures) return;

						scLvlFeatures.forEach((scFeature, ixScFeature) => {
							const depthArr = [];

							const ptDate = ixScLvl === 0 && SourceUtil.isNonstandardSource(sc.source) && Parser.sourceJsonToDate(sc.source)
								? Renderer.get().render(`{@note This subclass was published on ${MiscUtil.dateToStr(new Date(Parser.sourceJsonToDate(sc.source)))}.}`)
								: "";
							const toRender = ptDate && scFeature.entries ? MiscUtil.copy(scFeature) : scFeature;
							if (ptDate && toRender.entries) {
								toRender.entries.unshift(ptDate);
							}

							const $trSubclassFeature = $(`<tr class="cls-main__sc-feature ${cssMod}" data-subclass-id="${UrlUtil.getStateKeySubclass(sc)}"><td colspan="6"/></tr>`)
								.fastSetHtml(Renderer.get().setDepthTracker(depthArr).render(toRender))
								.appendTo($content);

							this._$trsContent.push($trSubclassFeature);
							this._trackOutlineScData(stateKey, ixScLvl, ixScFeature, depthArr);
						});
					});

					ixScLvl++;
				}
			});
		});

		this._$trNoContent = ClassesPage._render_$getTrNoContent().appendTo($content);

		$content.append(Renderer.utils.getBorderTr());
	}

	async pDeleteSubclassBrew (uniqueId, sc) {
		sc.classSource = sc.classSource || SRC_PHB;
		const cls = this._dataList.find(c => c.name.toLowerCase() === sc.className.toLowerCase() && c.source.toLowerCase() === sc.classSource.toLowerCase());

		if (!cls) {
			setTimeout(() => { throw new Error(`Could not find class "${sc.className}" with source "${sc.classSource}" to delete subclass "${sc.name}" from!`); })
			return;
		}

		const ixSc = cls.subclasses.findIndex(it => it.uniqueId === uniqueId);
		if (~ixSc) {
			cls.subclasses.splice(ixSc, 1);
			if (this._listSubclass) this._listSubclass.removeItemByData("uniqueId", uniqueId);
			const stateKey = UrlUtil.getStateKeySubclass(sc);
			this._state[stateKey] = false;
		}
	}

	static _render_$getTrNoContent () {
		return $(`<tr class="cls-main__msg-no-content"><td colspan="6">Toggle a button to view class and subclass information</td></tr>`);
	}

	_getDefaultState () { return MiscUtil.copy(ClassesPage._DEFAULT_STATE); }
}
ClassesPage._SC_FILTER_NAMESPACE = "sctabs";
ClassesPage._DEFAULT_STATE = {
	feature: null,
	isHideSidebar: false,
	isHideFeatures: false,
	isShowFluff: false,
	isShowScSources: false,
	isViewActiveScComp: false,
	isViewActiveBook: false,
	isHideOutline: false,
	// N.b. ensure none of these start with the string "sub" as this prefix is used for subclass state keys e.g.
	// `"sub Berserker": false`
};

ClassesPage.ClassBookView = class {
	constructor (classPage) {
		this._classPage = classPage;
		this._parent = classPage.getPod();
		this._bookViewActive = false;

		this._hooks = {};

		this._$body = null;
		this._$wrpBook = null;

		$(`#btn-readmode`).off("click").on("click", () => this._parent.set("isViewActiveBook", true));
	}

	cleanup () {
		Object.entries(this._hooks).forEach(([prop, arr]) => {
			arr.forEach(hk => this._parent.removeHook(prop, hk));
		});
	}

	open () {
		if (this._bookViewActive) return;
		this._bookViewActive = true;

		const cls = this._classPage.activeClass;

		this._$body = $(document.body);
		this._$wrpBook = $(`<div class="bkmv"/>`);

		this._$body.css("overflow", "hidden");
		this._$body.addClass("bkmv-active");

		// Top bar
		const $btnClose = $(`<span class="delete-icon glyphicon glyphicon-remove"/>`)
			.click(() => this._parent.set("isViewActiveBook", false));
		$$`<div class="bkmv__spacer-name flex-h-right no-shrink">${$btnClose}</div>`.appendTo(this._$wrpBook);

		const $pnlMenu = $(`<div class="cls-bkmv__wrp-tabs flex-h-center"/>`).appendTo(this._$wrpBook);

		// Main panel
		const $tblBook = $(`<table class="stats stats--book stats--book-large"/>`);
		$$`<div class="flex-col overflow-y-auto container">${$tblBook}</div>`.appendTo(this._$wrpBook);

		const renderStack = [];
		Renderer.get().setFirstSection(true);
		renderStack.push(`<tr><td colspan="6" class="py-3 px-5">`);
		Renderer.get().recursiveRender({type: "section", name: cls.name}, renderStack);
		renderStack.push(`</td></tr>`);

		renderStack.push(`<tr class="text" data-cls-book-fluff="true"><td colspan="6" class="py-3 px-5">`);
		Renderer.get().setFirstSection(true);
		(cls.fluff || []).forEach((f, i) => {
			f = MiscUtil.copy(f);

			// Remove the name from the first section if it is a copy of the class name
			if (i === 0 && f.name && f.name.toLowerCase() === cls.name.toLowerCase()) {
				delete f.name;
			}

			if (f.source && f.source !== cls.source && f.entries) {
				f.entries.unshift(`{@note The following information is from ${Parser.sourceJsonToFull(f.source)}${Renderer.utils.isDisplayPage(f.page) ? `, page ${f.page}` : ""}.}`);
			}

			Renderer.get().recursiveRender(f, renderStack);
		});
		renderStack.push(`</td></tr>`);

		renderStack.push(`<tr class="text" data-cls-book-cf="true"><td colspan="6" class="py-3 px-5">`);
		cls.classFeatures.forEach(lvl => {
			lvl.forEach(cf => Renderer.get().recursiveRender(cf, renderStack));
		});
		renderStack.push(`</td></tr>`);

		cls.subclasses
			.filter(sc => !ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](sc), "subclass", sc.source))
			.forEach((sc, ixSubclass) => {
				const mod = ClassesPage.getSubclassCssMod(cls, sc);
				renderStack.push(`<tr data-cls-book-sc-ix="${ixSubclass}" class="cls-main__sc-feature ${mod ? `cls-main__sc-feature--${mod}` : ""}"><td colspan="6" class="py-3 px-5">`);
				sc.subclassFeatures.forEach(lvl => {
					lvl.forEach(f => Renderer.get().recursiveRender(f, renderStack));
				});
				renderStack.push(`</td></tr>`);
			});
		renderStack.push(Renderer.utils.getBorderTr());
		$tblBook.append(renderStack.join(""));

		// Menu panel
		const $btnToggleCf = $(`<span class="cls-bkmv__btn-tab">Features</span>`).on("click", () => {
			this._parent.set("isHideFeatures", !this._parent.get("isHideFeatures"));
		});
		const $btnToggleInfo = $(`<span class="cls-bkmv__btn-tab">Info</span>`).on("click", () => {
			this._parent.set("isShowFluff", !this._parent.get("isShowFluff"));
		});

		if (this._parent.get("isHideFeatures")) this._parent.set("isHideFeatures", false);
		if (!this._parent.get("isShowFluff")) this._parent.set("isShowFluff", true);

		$pnlMenu.append($btnToggleCf);
		$pnlMenu.append($btnToggleInfo);

		const filterValues = this._classPage.filterBox.getValues();
		cls.subclasses
			.filter(sc => !ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](sc), "subclass", sc.source))
			.forEach((sc, i) => {
				const name = sc.isReprinted ? `${ClassesPage.getBaseShortName(sc)} (${Parser.sourceJsonToAbv(sc.source)})` : sc.shortName;
				const mod = ClassesPage.getSubclassCssMod(cls, sc);
				const stateKey = UrlUtil.getStateKeySubclass(sc);

				const $btnToggleSc = $(`<span class="cls-bkmv__btn-tab ${sc.isReprinted ? "cls__btn-sc--reprinted" : ""}" title="${ClassesPage.getBtnTitleSubclass(sc)}">${name}</span>`)
					.on("click", () => this._parent.set(stateKey, !this._parent.get(stateKey)));
				const isVisible = this._classPage.filterBox.toDisplay(filterValues, sc.source, sc._fMisc);
				if (!isVisible) $btnToggleSc.addClass("hidden");

				const hkShowHide = () => {
					const $dispFeatures = this._$wrpBook.find(`[data-cls-book-sc-ix="${i}"]`);
					const isActive = !!this._parent.get(stateKey);
					$btnToggleSc.toggleClass(`cls__btn-sc--active-${mod}`, isActive);
					$dispFeatures.toggleClass("hidden", !isActive);
				};
				(this._hooks[stateKey] = this._hooks[stateKey] || []).push(hkShowHide);
				this._parent.addHook(stateKey, hkShowHide);
				hkShowHide();

				$pnlMenu.append($btnToggleSc);
			});

		const hkFeatures = () => {
			const $dispFeatures = this._$wrpBook.find(`[data-cls-book-cf="true"]`);
			const isActive = !this._parent.get("isHideFeatures");
			$btnToggleCf.toggleClass("cls__btn-cf--active", isActive);
			$dispFeatures.toggleClass("hidden", !isActive);
		};
		(this._hooks["isHideFeatures"] = this._hooks["isHideFeatures"] || []).push(hkFeatures);
		this._parent.addHook("isHideFeatures", hkFeatures);
		hkFeatures();

		const hkFluff = () => {
			const $dispFluff = this._$wrpBook.find(`[data-cls-book-fluff="true"]`);
			const isHidden = !this._parent.get("isShowFluff");
			$btnToggleInfo.toggleClass("active", !isHidden);
			$dispFluff.toggleClass("hidden", !!isHidden);
		};
		(this._hooks["isShowFluff"] = this._hooks["isShowFluff"] || []).push(hkFluff);
		this._parent.addHook("isShowFluff", hkFluff);
		hkFluff();

		const f = this._classPage.filterBox.getValues();
		this._$wrpBook.find(`tr`).each((i, e) => {
			const $tr = $(e);
			$tr.find(`[data-source]`).each((i, e) => {
				const source = e.dataset.source;
				$(e).toggleClass("hidden", !this._classPage.filterBox.toDisplay(f, source, []));
			})
		})

		this._$body.append(this._$wrpBook);
	}

	teardown () {
		if (this._bookViewActive) {
			this._$body.css("overflow", "");
			this._$body.removeClass("bkmv-active");
			this._$wrpBook.remove();
			this._bookViewActive = false;
		}
	}
};

const classesPage = new ClassesPage();
window.addEventListener("load", () => classesPage.pOnLoad());
