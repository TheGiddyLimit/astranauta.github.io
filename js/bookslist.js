"use strict";

class BooksList {
	static getDateStr (it) {
		if (!it.published) return "\u2014";
		const date = new Date(it.published);
		return MiscUtil.dateToStr(date);
	}

	constructor (options) {
		this._contentsUrl = options.contentsUrl;
		this._fnSort = options.fnSort;
		this._sortByInitial = options.sortByInitial;
		this._sortDirInitial = options.sortDirInitial;
		this._dataProp = options.dataProp;
		this._enhanceRowDataFn = options.enhanceRowDataFn;
		this._rootPage = options.rootPage;
		this._rowBuilderFn = options.rowBuilderFn;

		this._list = null;
		this._listAlt = null;
		this._dataIx = 0;
		this._dataList = [];
	}

	async pOnPageLoad () {
		ExcludeUtil.pInitialise(); // don't await, as this is only used for search
		const data = await DataUtil.loadJSON(this._contentsUrl);

		const $iptSearch = $(`#search`);

		const fnSort = (a, b, o) => this._fnSort(this._dataList, a, b, o);
		this._list = new List({
			$wrpList: $("ul.books"),
			$iptSearch,
			fnSort,
			sortByInitial: this._sortByInitial,
			sortDirInitial: this._sortDirInitial,
		});
		SortUtil.initBtnSortHandlers($(`#filtertools`), this._list);

		this._listAlt = new List({
			$wrpList: $(".books--alt"),
			$iptSearch,
			fnSort,
			sortByInitial: this._sortByInitial,
			sortDirInitial: this._sortDirInitial,
		});

		$("#reset").click(() => {
			this._list.reset();
			this._listAlt.reset();

			$(`.showhide`).each((i, ele) => {
				const $ele = $(ele);
				if (!$ele.data("hidden")) {
					BookUtil.indexListToggle(null, ele);
				}
			});
		});

		this.addData(data);
		const brewData = await BrewUtil.pAddBrewData();
		await handleBrew(brewData);
		BrewUtil.bind({lists: [this._list, this._listAlt]});
		await BrewUtil.pAddLocalBrewData();
		BrewUtil.makeBrewButton("manage-brew");
		this._list.init();
		this._listAlt.init();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	addData (data) {
		if (!data[this._dataProp] || !data[this._dataProp].length) return;

		this._dataList.push(...data[this._dataProp]);

		for (; this._dataIx < this._dataList.length; this._dataIx++) {
			const it = this._dataList[this._dataIx];
			if (this._enhanceRowDataFn) this._enhanceRowDataFn(it);

			const eleLi = document.createElement("li");

			eleLi.innerHTML = `<a href="${this._rootPage}#${UrlUtil.encodeForHash(it.id)}" class="book-name lst--border">
				<span class="w-100">${this._rowBuilderFn(it)}</span>
				<span class="showhide px-2 py-1px bold" onclick="BookUtil.indexListToggle(event, this)" data-hidden="true">[+]</span>
			</a>
			${BookUtil.makeContentsBlock({book: it, addPrefix: this._rootPage, defaultHidden: true})}`;

			const listItem = new ListItem(
				this._dataIx,
				eleLi,
				it.name,
				{source: it.id},
				{uniqueId: it.uniqueId},
			);

			this._list.addItem(listItem);

			// region alt
			const eleLiAlt = $(`<a href="${this._rootPage}#${UrlUtil.encodeForHash(it.id)}" class="flex-col flex-v-center m-3 bks__wrp-bookshelf-item py-3 px-2 ${Parser.sourceJsonToColor(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>
				<img src="${it.coverUrl || `${Renderer.get().baseMediaUrls["img"] || Renderer.get().baseUrl}img/covers/blank.png`}" class="mb-2 bks__bookshelf-image">
				<div class="bks__bookshelf-item-name flex-vh-center text-center">${it.name}</div>
			</a>`)[0];
			const listItemAlt = new ListItem(
				this._dataIx,
				eleLiAlt,
				it.name,
				{source: it.id},
				{uniqueId: it.uniqueId},
			);
			this._listAlt.addItem(listItemAlt);
			// endregion
		}

		this._list.update();
		this._listAlt.update();
	}
}
