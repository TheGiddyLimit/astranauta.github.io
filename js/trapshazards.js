"use strict";

const JSON_URL = "data/trapshazards.json";

window.onload = function load () {
	ExcludeUtil.initialise();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

const sourceFilter = getSourceFilter();
let filterBox;
let list;
function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ["name", "trapType", "source"],
		listClass: "trapshazards",
		sortFunction: SortUtil.listSort
	});

	const typeFilter = new Filter({
		header: "Type",
		items: [
			"MECH",
			"MAG",
			"SMPL",
			"CMPX",
			"HAZ"
		],
		displayFn: Parser.trapTypeToFull
	});
	filterBox = initFilterBox(
		sourceFilter,
		typeFilter
	);

	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	const subList = ListUtil.initSublist({
		valueNames: ["name", "type", "id"],
		listClass: "subtrapshazards",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addTrapsHazards(data);
	BrewUtil.pAddBrewData()
		.then(handleBrew)
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
	addTrapsHazards({trap: homebrew.trap});
	addTrapsHazards({hazard: homebrew.hazard});
}

let trapsAndHazardsList = [];
let thI = 0;
function addTrapsHazards (data) {
	if ((!data.trap || !data.trap.length) && (!data.hazard || !data.hazard.length)) return;

	if (data.trap && data.trap.length) trapsAndHazardsList = trapsAndHazardsList.concat(data.trap);
	if (data.hazard && data.hazard.length) {
		data.hazard.forEach(h => h.trapType = "HAZ");
		trapsAndHazardsList = trapsAndHazardsList.concat(data.hazard);
	}

	let tempString = "";
	for (; thI < trapsAndHazardsList.length; thI++) {
		const it = trapsAndHazardsList[thI];
		if (it.trapType === "HAZ" && ExcludeUtil.isExcluded(it.name, "hazard", it.source)) continue;
		else if (it.trapType !== "HAZ" && ExcludeUtil.isExcluded(it.name, "trap", it.source)) continue;
		const abvSource = Parser.sourceJsonToAbv(it.source);

		tempString += `
			<li class="row" ${FLTR_ID}="${thI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${thI}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="name col-xs-6">${it.name}</span>
					<span class="trapType col-xs-4">${Parser.trapTypeToFull(it.trapType)}</span>
					<span class="source col-xs-2 source${abvSource}" title="${Parser.sourceJsonToFull(it.source)}">${abvSource}</span>
				</a>
			</li>
		`;

		// populate filters
		sourceFilter.addIfAbsent(it.source);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$(`#trapsHazardsList`).append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: trapsAndHazardsList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(trapsAndHazardsList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

// filtering function
function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const it = trapsAndHazardsList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			it.source,
			it.trapType
		);
	});
	FilterBox.nextIfHidden(trapsAndHazardsList);
}

function getSublistItem (it, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
				<span class="name col-xs-8">${it.name}</span>		
				<span class="type col-xs-4">${Parser.trapTypeToFull(it.trapType)}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

const renderer = EntryRenderer.getDefaultRenderer();
function loadhash (jsonIndex) {
	renderer.setFirstSection(true);
	const it = trapsAndHazardsList[jsonIndex];

	const renderStack = [];

	renderer.recursiveEntryRender({entries: it.entries}, renderStack, 2);

	const simplePart = EntryRenderer.traphazard.getSimplePart(renderer, it);
	const complexPart = EntryRenderer.traphazard.getComplexPart(renderer, it);
	const $content = $(`#pagecontent`).empty();
	$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(it)}
		<tr class="text"><td colspan="6"><i>${EntryRenderer.traphazard.getSubtitle(it)}</i></td>
		<tr class="text"><td colspan="6">${renderStack.join("")}${simplePart || ""}${complexPart || ""}</td></tr>
		${EntryRenderer.utils.getPageTr(it)}
		${EntryRenderer.utils.getBorderTr()}
	`);

	ListUtil.updateSelected();
}