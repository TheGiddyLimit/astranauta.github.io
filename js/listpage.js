"use strict";

class ListPage {
	/**
	 * @param opts Options object.
	 * @param opts.dataSource Main JSON data url or function to fetch main data.
	 * @param [opts.dataSourceFluff] Fluff JSON data url or function to fetch fluff data.
	 * @param [opts.filters] Array of filters to use in the filter box. (Either `filters` and `filterSource` or
	 * `pageFilter` must be specified.)
	 * @param [opts.filterSource] Source filter. (Either `filters` and `filterSource` or
	 * `pageFilter` must be specified.)
	 * @param [opts.pageFilter] PageFilter implementation for this page. (Either `filters` and `filterSource` or
	 * `pageFilter` must be specified.)
	 * @param opts.listClass List class.
	 * @param opts.listOptions Other list options.
	 * @param opts.sublistClass Sublist class.
	 * @param opts.sublistOptions Other sublist options.
	 * @param opts.dataProps JSON data propert(y/ies).
	 * @param [opts.bookViewOptions] Book view options.
	 * @param [opts.tableViewOptions] Table view options.
	 * @param [opts.hasAudio] True if the entities have pronunciation audio.
	 */
	constructor (opts) {
		this._dataSource = opts.dataSource;
		this._dataSourcefluff = opts.dataSourceFluff;
		this._filters = opts.filters;
		this._filterSource = opts.filterSource;
		this._pageFilter = opts.pageFilter;
		this._listClass = opts.listClass;
		this._listOptions = opts.listOptions || {};
		this._sublistClass = opts.sublistClass;
		this._sublistOptions = opts.sublistOptions || {};
		this._dataProps = opts.dataProps;
		this._bookViewOptions = opts.bookViewOptions;
		this._tableViewOptions = opts.tableViewOptions;
		this._hasAudio = opts.hasAudio;

		this._renderer = Renderer.get();
		this._list = null;
		this._listSub = null;
		this._filterBox = null;
		this._dataList = [];
		this._ixData = 0;
		this._bookView = null;
	}

	async pOnLoad () {
		await ExcludeUtil.pInitialise();
		const data = typeof this._dataSource === "string" ? await DataUtil.loadJSON(this._dataSource) : await this._dataSource();

		this._list = ListUtil.initList({
			$wrpList: $(`ul.list.${this._listClass}`),
			...this._listOptions,
		});
		ListUtil.setOptions({primaryLists: [this._list]});
		SortUtil.initBtnSortHandlers($("#filtertools"), this._list);

		this._filterBox = await this._pageFilter.pInitFilterBox({
			$iptSearch: $(`#lst__search`),
			$wrpFormTop: $(`#filter-search-group`).title("Hotkey: f"),
			$btnReset: $(`#reset`),
		});

		const $outVisibleResults = $(`.lst__wrp-search-visible`);
		this._list.on("updated", () => $outVisibleResults.html(`${this._list.visibleItems.length}/${this._list.items.length}`));

		$(this._filterBox).on(FilterBox.EVNT_VALCHANGE, this.handleFilterChange.bind(this));

		this._listSub = ListUtil.initSublist({
			listClass: this._sublistClass,
			getSublistRow: this.getSublistItem.bind(this),
			...this._sublistOptions,
		});
		ListUtil.initGenericPinnable();
		SortUtil.initBtnSortHandlers($("#sublistsort"), this._listSub);

		this._addData(data);

		BrewUtil.bind({
			filterBox: this._filterBox,
			sourceFilter: this._pageFilter ? this._pageFilter.sourceFilter : this._filterSource,
			list: this._list,
			pHandleBrew: this._pHandleBrew.bind(this),
		});

		const homebrew = await BrewUtil.pAddBrewData();
		await this._pHandleBrew(homebrew);
		await BrewUtil.pAddLocalBrewData();

		BrewUtil.makeBrewButton("manage-brew");
		await ListUtil.pLoadState();
		RollerUtil.addListRollButton();
		ListUtil.addListShowHide();
		if (this._hasAudio) Renderer.utils.bindPronounceButtons();

		if (this._bookViewOptions) {
			this._bookView = new BookModeView({
				hashKey: "bookview",
				$openBtn: this._bookViewOptions.$btnOpen,
				noneVisibleMsg: this._bookViewOptions.noneVisibleMsg,
				pageTitle: this._bookViewOptions.pageTitle || "Book View",
				popTblGetNumShown: this._bookViewOptions.popTblGetNumShown,
				hasPrintColumns: true,
			});
		}

		// bind hash-change functions for hist.js to use
		window.loadHash = this.doLoadHash.bind(this);
		window.loadSubHash = this.pDoLoadSubHash.bind(this);

		this._list.init();
		this._listSub.init();

		Hist.init(true);
		ExcludeUtil.checkShowAllExcluded(this._dataList, $(`#pagecontent`));
		window.dispatchEvent(new Event("toolsLoaded"));
	}

	async _pHandleBrew (homebrew) {
		try {
			this._addData(homebrew);
		} catch (e) {
			BrewUtil.pPurgeBrew(e);
		}
	}

	_addData (data) {
		if (!this._dataProps.some(prop => data[prop] && data[prop].length)) return;

		this._dataProps.forEach(prop => {
			if (!data[prop]) return;
			data[prop].forEach(it => it.__prop = prop);
			this._dataList.push(...data[prop]);
		});

		const len = this._dataList.length;
		for (; this._ixData < len; this._ixData++) {
			const it = this._dataList[this._ixData];
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.autoEncodeHash(it), it.__prop, it.source);
			this._list.addItem(this.getListItem(it, this._ixData, isExcluded));
		}

		this._list.update();
		this._filterBox.render();
		this.handleFilterChange();

		ListUtil.setOptions({
			itemList: this._dataList,
			primaryLists: [this._list],
		});
		ListUtil.bindPinButton();
		const $btnPop = ListUtil.getOrTabRightButton(`btn-popout`, `new-window`);
		Renderer.hover.bindPopoutButton($btnPop, this._dataList);
		UrlUtil.bindLinkExportButton(this._filterBox);
		ListUtil.bindOtherButtons({
			download: true,
			upload: true,
		});

		if (this._tableViewOptions) {
			ListUtil.bindShowTableButton(
				"btn-show-table",
				this._tableViewOptions.title,
				this._dataList,
				this._tableViewOptions.colTransforms,
				this._tableViewOptions.filter,
				this._tableViewOptions.sorter,
			);
		}
	}

	getListItem () { throw new Error(`Unimplemented!`); }
	handleFilterChange () { throw new Error(`Unimplemented!`); }
	getSublistItem () { throw new Error(`Unimplemented!`); }
	doLoadHash () { throw new Error(`Unimplemented!`); }
	pDoLoadSubHash () { throw new Error(`Unimplemented!`); }
}
