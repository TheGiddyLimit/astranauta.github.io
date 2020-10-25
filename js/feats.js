"use strict";

class FeatsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterFeats();
		super({
			dataSource: "data/feats.json",

			pageFilter,

			listClass: "feats",

			sublistClass: "subfeats",

			dataProps: ["feat"],
		});
	}

	getListItem (feat, ftI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(feat, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(feat.source);
		const hash = UrlUtil.autoEncodeHash(feat);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-3-8 pl-0">${feat.name}</span>
			<span class="col-3-5 ${feat._slAbility === VeCt.STR_NONE ? "list-entry-none " : ""}">${feat._slAbility}</span>
			<span class="col-3 ${feat._slPrereq === VeCt.STR_NONE ? "list-entry-none " : ""}">${feat._slPrereq}</span>
			<span class="source col-1-7 text-center ${Parser.sourceJsonToColor(feat.source)} pr-0" title="${Parser.sourceJsonToFull(feat.source)}" ${BrewUtil.sourceJsonToStyle(feat.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			ftI,
			eleLi,
			feat.name,
			{
				hash,
				source,
				ability: feat._slAbility,
				prerequisite: feat._slPrereq,
			},
			{
				uniqueId: feat.uniqueId ? feat.uniqueId : ftI,
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

	getSublistItem (feat, pinId) {
		const hash = UrlUtil.autoEncodeHash(feat);

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-4 pl-0">${feat.name}</span>
				<span class="col-4 ${feat._slAbility === VeCt.STR_NONE ? "list-entry-none" : ""}">${feat._slAbility}</span>
				<span class="col-4 ${feat._slPrereq === VeCt.STR_NONE ? "list-entry-none" : ""} pr-0">${feat._slPrereq}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			feat.name,
			{
				hash,
				ability: feat._slAbility,
				prerequisite: feat._slPrereq,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const feat = this._dataList[id];

		$("#pagecontent").empty().append(RenderFeats.$getRenderedFeat(feat));

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const featsPage = new FeatsPage();
window.addEventListener("load", () => featsPage.pOnLoad());
