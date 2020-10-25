"use strict";

class ConditionsDiseasesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterConditionsDiseases();

		super({
			dataSource: "data/conditionsdiseases.json",

			pageFilter,

			listClass: "conditions",

			sublistClass: "subconditions",

			dataProps: ["condition", "disease", "status"],
		});
	}

	getListItem (it, cdI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="col-3 text-center pl-0">${PageFilterConditionsDiseases.getDisplayProp(it.__prop)}</span>
			<span class="bold col-7">${it.name}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			cdI,
			eleLi,
			it.name,
			{
				hash,
				source,
				type: it.__prop,
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : cdI,
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

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="col-2 pl-0 text-center">${PageFilterConditionsDiseases.getDisplayProp(it.__prop)}</span>
				<span class="bold col-10 pr-0">${it.name}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				type: it.__prop,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const $content = $("#pagecontent").empty();
		const it = this._dataList[id];

		function buildStatsTab () {
			$content.append(RenderConditionDiseases.$getRenderedConditionDisease(it));
		}

		function buildFluffTab (isImageTab) {
			return Renderer.utils.pBuildFluffTab({
				isImageTab,
				$content,
				entity: it,
				pFnGetFluff: Renderer.condition.pGetFluff,
			});
		}

		const statTab = Renderer.utils.tabButton(
			"Traits",
			() => {},
			buildStatsTab,
		);
		const picTab = Renderer.utils.tabButton(
			"Images",
			() => {},
			buildFluffTab.bind(null, true),
		);

		Renderer.utils.bindTabButtons(statTab, picTab);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const conditionsDiseasesPage = new ConditionsDiseasesPage();
window.addEventListener("load", () => conditionsDiseasesPage.pOnLoad());
