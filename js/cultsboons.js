"use strict";

const JSON_URL = "data/cultsboons.json";

window.onload = function load () {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	SortUtil.initHandleFilterButtonClicks();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

function cultBoonTypeToFull (type) {
	return type === "c" ? "Cult" : "Demonic Boon";
}

let cultsAndBoonsList;
const sourceFilter = getSourceFilter();
let filterBox;
let list;
async function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ['name', "source", "type", "uniqueid"],
		listClass: "cultsboons",
		sortFunction: SortUtil.listSort
	});

	const typeFilter = new Filter({
		header: "Type",
		items: ["b", "c"],
		displayFn: cultBoonTypeToFull
	});
	filterBox = await pInitFilterBox(
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

	data.cult.forEach(it => it._type = "c");
	data.boon.forEach(it => it._type = "b");
	cultsAndBoonsList = data.cult.concat(data.boon);

	let tempString = "";
	cultsAndBoonsList.forEach((it, bcI) => {
		tempString += `
			<li class="row" ${FLTR_ID}="${bcI}" onclick="ListUtil.toggleSelected(event, this)">
				<a id="${bcI}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="type col-3 text-align-center">${cultBoonTypeToFull(it._type)}</span>
					<span class="name col-7">${it.name}</span>
					<span class="source col-2 text-align-center ${Parser.sourceJsonToColor(it.source)}" title="${Parser.sourceJsonToFull(it.source)}">${Parser.sourceJsonToAbv(it.source)}</span>
					
					<span class="uniqueid hidden">${it.uniqueId ? it.uniqueId : bcI}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(it.source);
	});
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$("ul.cultsboons").append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("type");

	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: cultsAndBoonsList,
		primaryLists: [list]
	});

	RollerUtil.addListRollButton();
	ListUtil.addListShowHide();

	History.init(true);
}

// filtering function
function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const cb = cultsAndBoonsList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			cb.source,
			cb._type
		);
	});
	FilterBox.nextIfHidden(cultsAndBoonsList);
}

const renderer = EntryRenderer.getDefaultRenderer();
function loadhash (id) {
	renderer.setFirstSection(true);

	const it = cultsAndBoonsList[id];

	const renderStack = [];
	if (it._type === "c") {
		EntryRenderer.cultboon.doRenderCultParts(it, renderer, renderStack);
		renderer.recursiveEntryRender({entries: it.entries}, renderStack, 2);

		$("#pagecontent").html(`
			${EntryRenderer.utils.getBorderTr()}
			${EntryRenderer.utils.getNameTr(it)}
			<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
			<tr class='text'><td colspan='6' class='text'>${renderStack.join("")}</td></tr>
			${EntryRenderer.utils.getPageTr(it)}
			${EntryRenderer.utils.getBorderTr()}
		`);
	} else if (it._type === "b") {
		it._displayName = it._displayName || `Demonic Boon: ${it.name}`;
		EntryRenderer.cultboon.doRenderBoonParts(it, renderer, renderStack);
		renderer.recursiveEntryRender({entries: it.entries}, renderStack, 1);
		$("#pagecontent").html(`
			${EntryRenderer.utils.getBorderTr()}
			${EntryRenderer.utils.getNameTr(it)}
			<tr class='text'><td colspan='6'>${renderStack.join("")}</td></tr>
			${EntryRenderer.utils.getPageTr(it)}
			${EntryRenderer.utils.getBorderTr()}
		`);
	}

	ListUtil.updateSelected();
}
