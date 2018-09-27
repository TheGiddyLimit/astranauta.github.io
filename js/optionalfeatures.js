"use strict";

const JSON_URL = "data/optionalfeatures.json";
const CLS_NONE = "list-entry-none";

window.onload = function load () {
	ExcludeUtil.initialise();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
	initializationFunctions.initHandleFilterButtonClicks();
};

function listSortOptFeatures (a, b, o) {
	function sortByLevel (a, b) {
		if (a === "-1") a = 0;
		if (b === "-1") b = 0;
		return Number(b) - Number(a);
	}

	if (o.valueName === "prerequisite") {
		const comp = sortByLevel(a.values()["sortIndex"], b.values()["sortIndex"]);
		if (comp !== 0) return comp;
	}
	return SortUtil.listSort(a, b, o);
}

function getLevelFilterNestedItem (prereqLevel) {
	return new FilterItem({
		item: `${prereqLevel.class.name} Level ${prereqLevel.level}`,
		nest: prereqLevel.class.name,
		nestHidden: true
	})
}

let list;
const sourceFilter = getSourceFilter();
const typeFilter = new Filter({
	header: "Feature Type",
	items: ["EI", "MM", "MV:B"],
	displayFn: Parser.optFeatureTypeToFull
});
const pactFilter = new Filter({
	header: "Pact Boon",
	items: ["Blade", "Chain", "Tome"],
	displayFn: Parser.prereqPactToFull
});
const patronFilter = new Filter({
	header: "Otherworldly Patron",
	items: ["The Archfey", "The Fiend", "The Great Old One", "The Hexblade", "The Kraken", "The Raven Queen", "The Seeker"],
	displayFn: Parser.prereqPatronToShort
});
const spellOrFeatureFilter = new Filter({
	header: "Spell or Feature",
	items: ["eldritch blast", "hex/curse"],
	displayFn: StrUtil.toTitleCase
});
const levelFilter = new Filter({
	header: "Level"
});
const prerequisiteFilter = new MultiFilter({name: "Prerequisite"}, pactFilter, patronFilter, spellOrFeatureFilter, levelFilter);
let filterBox;
function onJsonLoad (data) {
	filterBox = initFilterBox(sourceFilter, typeFilter, prerequisiteFilter);

	list = ListUtil.search({
		valueNames: ["name", "source", "prerequisite", "type", "sortIndex"],
		listClass: "optfeatures",
		sortFunction: listSortOptFeatures
	});
	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	const subList = ListUtil.initSublist({
		valueNames: ["name", "ability", "prerequisite", "id", "sortIndex"],
		listClass: "suboptfeatures",
		getSublistRow: getSublistItem,
		sortFunction: listSortOptFeatures
	});
	ListUtil.initGenericPinnable();

	addOptionalfeatures(data);
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(BrewUtil.pAddLocalBrewData)
		.catch(BrewUtil.purgeBrew)
		.then(() => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({list, filterBox, sourceFilter});
			ListUtil.loadState();
			RollerUtil.addListRollButton();

			History.init(true);
		});
}

function handleBrew (homebrew) {
	addOptionalfeatures(homebrew);
	return Promise.resolve();
}

let optfList = [];
let ivI = 0;
function addOptionalfeatures (data) {
	if (!data.optionalfeature || !data.optionalfeature.length) return;

	optfList = optfList.concat(data.optionalfeature);

	let tempString = "";
	for (; ivI < optfList.length; ivI++) {
		const it = optfList[ivI];
		if (ExcludeUtil.isExcluded(it.name, "optionalfeature", it.source)) continue;

		it.featureType = it.featureType || "OTH";
		if (it.prerequisite) {
			it._fPrereqPact = it.prerequisite.filter(it => it.type === "prereqPact").map(it => {
				pactFilter.addIfAbsent(it.entry);
				return it.entry;
			});
			it._fPrereqPatron = it.prerequisite.filter(it => it.type === "prereqPatron").map(it => {
				patronFilter.addIfAbsent(it.entry);
				return it.entry;
			});
			it._fprereqSpellOrFeature = it.prerequisite.filter(it => it.type === "prereqSpellOrFeature").map(it => {
				spellOrFeatureFilter.addIfAbsent(it.entries);
				return it.entries;
			});
			it._fPrereqLevel = it.prerequisite.filter(it => it.type === "prereqLevel").map(it => {
				const item = getLevelFilterNestedItem(it);
				levelFilter.addIfAbsent(item);
				return item;
			});
		}

		tempString += `
			<li class="row" ${FLTR_ID}="${ivI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${ivI}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="name col-xs-3 col-xs-3-2">${it.name}</span>
					<span class="source col-xs-1 col-xs-1-5 ${Parser.sourceJsonToColor(it.source)} text-align-center" title="${Parser.sourceJsonToFull(it.source)}">${Parser.sourceJsonToAbv(it.source)}</span>
					<span class="source col-xs-1 col-xs-1-5 text-align-center type" title="${Parser.optFeatureTypeToFull(it.featureType)}">${it.featureType}</span>
					<span class="prerequisite col-xs-5 col-xs-5-8 ${it.prerequisite == null ? CLS_NONE : ""}">${EntryRenderer.optionalfeature.getPrerequisiteText(it.prerequisite, true)}</span>
					<span class="hidden sortIndex">${it._fPrereqLevel && it._fPrereqLevel.length ? it._fPrereqLevel[0] : -1}</span>
				</a>
			</li>
		`;

		// populate filters
		sourceFilter.addIfAbsent(it.source);
		typeFilter.addIfAbsent(it.featureType);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$(`#optfeaturesList`).append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);
	spellOrFeatureFilter.items.sort(SortUtil.ascSort);
	levelFilter.items.sort(SortUtil.ascSortNumericalSuffix);
	typeFilter.items.sort((a, b) => SortUtil.ascSort(Parser.optFeatureTypeToFull(a), Parser.optFeatureTypeToFull(b)));

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: optfList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(optfList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const it = optfList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			it.source,
			it.featureType,
			[
				it._fPrereqPact,
				it._fPrereqPatron,
				it._fprereqSpellOrFeature,
				it._fPrereqLevel
			]
		);
	});
	FilterBox.nextIfHidden(optfList);
}

function getSublistItem (it, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
				<span class="name col-xs-4">${it.name}</span>
				<span class="source col-xs-2 text-align-center type" title="${Parser.optFeatureTypeToFull(it.featureType)}">${it.featureType}</span>
				<span class="prerequisite col-xs-6 ${it.prerequisite == null ? CLS_NONE : ""}">${EntryRenderer.optionalfeature.getPrerequisiteText(it.prerequisite, true)}</span>
				<span class="id hidden">${pinId}</span>
				<span class="hidden">${it._fPrereqLevel ? it._fPrereqLevel[0] : -1}</span>
			</a>
		</li>
	`;
}

function loadhash (jsonIndex) {
	EntryRenderer.getDefaultRenderer().setFirstSection(true);
	const $content = $(`#pagecontent`).empty();
	const it = optfList[jsonIndex];

	const $wrpTab = $(`#stat-tabs`);
	$wrpTab.find(`.opt-feature-type`).remove();
	$(`<span class="opt-feature-type roller">${Parser.optFeatureTypeToFull(it.featureType)}</span>`)
		.click(() => {
			filterBox.setFromValues({"Feature Type": [it.featureType.toLowerCase()]});
			handleFilterChange();
		})
		.prependTo($wrpTab);

	$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(it)}
		${it.prerequisite ? `<tr><td colspan="6"><i>${EntryRenderer.optionalfeature.getPrerequisiteText(it.prerequisite)}</i></td></tr>` : ""}
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr><td colspan="6">${EntryRenderer.getDefaultRenderer().renderEntry({entries: it.entries}, 1)}</td></tr>
		${EntryRenderer.optionalfeature.getPreviouslyPrintedText(it)}
		${EntryRenderer.utils.getPageTr(it)}
		${EntryRenderer.utils.getBorderTr()}
	`);

	ListUtil.updateSelected();
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}