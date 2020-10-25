"use strict";

class BackgroundPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterBackgrounds();
		super({
			dataSource: "data/backgrounds.json",
			dataSourceFluff: "data/fluff-backgrounds.json",

			pageFilter,

			listClass: "backgrounds",

			sublistClass: "subbackgrounds",

			dataProps: ["background"],
		});
	}

	getListItem (bg, bgI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(bg, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const name = bg.name.replace("Variant ", "");
		const hash = UrlUtil.autoEncodeHash(bg);
		const source = Parser.sourceJsonToAbv(bg.source);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-4 pl-0">${name}</span>
			<span class="col-6">${bg._skillDisplay}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(bg.source)}" title="${Parser.sourceJsonToFull(bg.source)} pr-0" ${BrewUtil.sourceJsonToStyle(bg.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			bgI,
			eleLi,
			name,
			{
				hash,
				source,
				skills: bg._skillDisplay,
			},
			{
				uniqueId: bg.uniqueId || bgI,
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

	getSublistItem (bg, pinId) {
		const name = bg.name.replace("Variant ", "");
		const hash = UrlUtil.autoEncodeHash(bg);
		const skills = Renderer.background.getSkillSummary(bg.skillProficiencies || [], true);

		const $ele = $$`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-4 pl-0">${name}</span>
				<span class="col-8 pr-0">${skills}</span>
			</a>
		</li>`
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			name,
			{
				hash,
				source: Parser.sourceJsonToAbv(bg.source),
				skills,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		this._renderer.setFirstSection(true);
		const $pgContent = $("#pagecontent").empty();
		const bg = this._dataList[id];

		const buildStatsTab = () => {
			$pgContent.append(RenderBackgrounds.$getRenderedBackground(bg));
		};

		const buildFluffTab = (isImageTab) => {
			return Renderer.utils.pBuildFluffTab({
				isImageTab,
				$content: $pgContent,
				pFnGetFluff: Renderer.background.pGetFluff,
				entity: bg,
			});
		};

		const traitTab = Renderer.utils.tabButton(
			"Traits",
			() => {},
			buildStatsTab,
		);

		const infoTab = Renderer.utils.tabButton(
			"Info",
			() => {},
			buildFluffTab,
		);
		const picTab = Renderer.utils.tabButton(
			"Images",
			() => {},
			buildFluffTab.bind(null, true),
		);
		Renderer.utils.bindTabButtons(traitTab, infoTab, picTab);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const backgroundsPage = new BackgroundPage();
window.addEventListener("load", () => backgroundsPage.pOnLoad());
