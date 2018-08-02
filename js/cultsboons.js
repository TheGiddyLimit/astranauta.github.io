"use strict";
const JSON_URL = "data/cultsboons.json";

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

function cultBoonTypeToFull (type) {
	return type === "c" ? "Cult" : "Demonic Boon";
}

let cultsAndBoonsList;
const sourceFilter = getSourceFilter();
let filterBox;
let list;
function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ['name', "source", "type"],
		listClass: "cultsboons",
		sortFunction: SortUtil.listSort
	});

	const typeFilter = new Filter({
		header: "Type",
		items: ["b", "c"],
		displayFn: cultBoonTypeToFull
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

	data.cult.forEach(it => it._type = "c");
	data.boon.forEach(it => it._type = "b");
	cultsAndBoonsList = data.cult.concat(data.boon);

	let tempString = "";
	cultsAndBoonsList.forEach((it, i) => {
		tempString += `
			<li class="row" ${FLTR_ID}="${i}" onclick="ListUtil.toggleSelected(event, this)">
				<a id="${i}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="type col-xs-3 text-align-center">${cultBoonTypeToFull(it._type)}</span>
					<span class="name col-xs-7">${it.name}</span>
					<span class="source col-xs-2 source${it.source}" title="${Parser.sourceJsonToFull(it.source)}">${Parser.sourceJsonToAbv(it.source)}</span>
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
		EntryRenderer.cultboon.doRenderBoonParts(it, renderer, renderStack);
		renderer.recursiveEntryRender({entries: it.entries}, renderStack, 1);
		$("#pagecontent").html(`
			<tr><th class="border" colspan="6"></th></tr>
			<tr><th class="name" colspan="6"><span class="stats-name">${it._type === "b" ? `Demonic Boon: ` : ""}${it.name}</span><span class="stats-source source${it.source}" title="${Parser.sourceJsonToFull(it.source)}">${Parser.sourceJsonToAbv(it.source)}</span></th></tr>
			<tr class='text'><td colspan='6'>${renderStack.join("")}</td></tr>
			${EntryRenderer.utils.getPageTr(it)}
			<tr><th class="border" colspan="6"></th></tr>
		`);
	}

	ListUtil.updateSelected();
}
