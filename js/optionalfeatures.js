"use strict";

function optFeatSort (itemA, itemB, options) {
	if (options.sortBy === "level") {
		const aValue = Number(itemA.values.level) || 0;
		const bValue = Number(itemB.values.level) || 0;
		return SortUtil.ascSort(aValue, bValue) || SortUtil.listSort(itemA, itemB, options);
	}
	return SortUtil.listSort(itemA, itemB, options);
}

class OptionalFeaturesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterOptionalFeatures();

		super({
			dataSource: "data/optionalfeatures.json",

			pageFilter,

			listClass: "optfeatures",
			listOptions: {
				fnSort: optFeatSort,
			},

			sublistClass: "suboptfeatures",
			sublistOptions: {
				fnSort: optFeatSort,
			},

			dataProps: ["optionalfeature"],
		});
	}

	getListItem (it, ivI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const prerequisite = Renderer.utils.getPrerequisiteText(it.prerequisite, true, new Set(["level"]));
		const level = Renderer.optionalfeature.getListPrerequisiteLevelText(it.prerequisite);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-3-2 pl-0">${it.name}</span>
			<span class="col-1-5 text-center" title="${it._dFeatureType}">${it._lFeatureType}</span>
			<span class="col-4-8 text-center">${prerequisite}</span>
			<span class="col-1 text-center">${level}</span>
			<span class="col-1-5 ${Parser.sourceJsonToColor(it.source)} text-center pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			ivI,
			eleLi,
			it.name,
			{
				hash,
				source,
				prerequisite,
				level,
				type: it._lFeatureType,
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : ivI,
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
		const prerequisite = Renderer.utils.getPrerequisiteText(it.prerequisite, true, new Set(["level"]));
		const level = Renderer.optionalfeature.getListPrerequisiteLevelText(it.prerequisite);

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-4 pl-0">${it.name}</span>
				<span class="col-2 text-center" title="${it._dFeatureType}">${it._lFeatureType}</span>
				<span class="col-4-5 ${prerequisite === "\u2014" ? "text-center" : ""}">${prerequisite}</span>
				<span class="col-1-5 pr-0">${level}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				type: it._lFeatureType,
				prerequisite,
				level,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const it = this._dataList[id];

		const $wrpTab = $(`#stat-tabs`);
		$wrpTab.find(`.opt-feature-type`).remove();
		const $wrpOptFeatType = $(`<div class="opt-feature-type"/>`).prependTo($wrpTab);
		if (it.featureType instanceof Array) {
			const commonPrefix = MiscUtil.findCommonPrefix(it.featureType.map(fs => Parser.optFeatureTypeToFull(fs)));
			if (commonPrefix) $wrpOptFeatType.append(`${commonPrefix.trim()} `);
			it.featureType.forEach((ft, i) => {
				if (i > 0) $wrpOptFeatType.append("/");
				$(`<span class="roller">${Parser.optFeatureTypeToFull(ft).substring(commonPrefix.length)}</span>`)
					.click(() => {
						this._filterBox.setFromValues({"Feature Type": {[ft]: 1}});
						this.handleFilterChange();
					})
					.appendTo($wrpOptFeatType);
			});
		} else {
			$(`<span class="roller">${Parser.optFeatureTypeToFull(it.featureType)}</span>`)
				.click(() => {
					this._filterBox.setFromValues({"Feature Type": {[it.featureType]: 1}});
					this.handleFilterChange();
				})
				.appendTo($wrpOptFeatType);
		}

		$(`#pagecontent`).empty().append(RenderOptionalFeatures.$getRenderedOptionalFeature(it));

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const optionalFeaturesPage = new OptionalFeaturesPage();
window.addEventListener("load", () => optionalFeaturesPage.pOnLoad());
