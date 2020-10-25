"use strict";

function filterTypeSort (a, b) {
	return SortUtil.ascSortLower(Parser.trapHazTypeToFull(a.item), Parser.trapHazTypeToFull(b.item));
}

class TrapsHazardsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterTrapsHazards();
		super({
			dataSource: "data/trapshazards.json",

			pageFilter,

			listClass: "trapshazards",

			sublistClass: "subtrapshazards",

			dataProps: ["trap", "hazard"],
		});
	}

	getListItem (it, thI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const trapType = Parser.trapHazTypeToFull(it.trapHazType);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="col-3 pl-0 text-center">${trapType}</span>
			<span class="bold col-7">${it.name}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			thI,
			eleLi,
			it.name,
			{
				hash,
				source,
				trapType,
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : thI,
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
		const trapType = Parser.trapHazTypeToFull(it.trapHazType);

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="col-4 pr-0">${trapType}</span>
				<span class="bold col-8 pl-0">${it.name}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				trapType,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const it = this._dataList[id];

		$(`#pagecontent`).empty().append(RenderTrapsHazards.$getRenderedTrapHazard(it));

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const trapsHazardsPage = new TrapsHazardsPage();
window.addEventListener("load", () => trapsHazardsPage.pOnLoad());
