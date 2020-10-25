"use strict";

class TablesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterTables();
		super({
			dataSource: DataUtil.table.pLoadAll,

			pageFilter,

			listClass: "tablesdata",
			listOptions: {
				sortByInitial: "sortName",
			},

			sublistClass: "subtablesdata",

			dataProps: ["table", "tableGroup"],
		});
	}

	getListItem (it, tbI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const sortName = it.name.replace(/^\s*([\d,.]+)\s*gp/, (...m) => m[1].replace(Parser._numberCleanRegexp, "").padStart(9, "0"));

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-10 pl-0">${it.name}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			tbI,
			eleLi,
			it.name,
			{
				hash,
				sortName,
				source,
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : tbI,
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => this._pageFilter.toDisplay(f, this._dataList[item.ix]));
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const $ele = $(`<li class="row"><a href="#${hash}" class="lst--border" title="${it.name}"><span class="bold col-12 px-0">${it.name}</span></a></li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const it = this._dataList[id];

		$("#pagecontent").empty().append(RenderTables.$getRenderedTable(it));

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const tablesPage = new TablesPage();
window.addEventListener("load", () => tablesPage.pOnLoad());
