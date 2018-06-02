"use strict";

const JSON_URL = "data/trapshazards.json";

window.onload = function load () {
	ExcludeUtil.initialise();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

let list;
function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ["name", "trapType", "source"],
		listClass: "trapshazards",
		sortFunction: SortUtil.listSort
	});

	const subList = ListUtil.initSublist({
		valueNames: ["name", "type", "id"],
		listClass: "subtrapshazards",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addTrapsHazards(data);
	BrewUtil.addBrewData(addTrapsHazards);
	BrewUtil.makeBrewButton("manage-brew");
	BrewUtil.bind({list});

	History.init();
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
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$(`#trapsHazardsList`).append(tempString);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");

	ListUtil.setOptions({
		itemList: trapsAndHazardsList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(trapsAndHazardsList);
	ListUtil.loadState();
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

	const $content = $(`#pagecontent`).empty();
	$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(it)}
		<tr class="text"><td colspan="6"><i>${Parser.trapTypeToFull(it.trapType)}</i></td>
		<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
		${EntryRenderer.utils.getPageTr(it)}
		${EntryRenderer.utils.getBorderTr()}
	`);
}