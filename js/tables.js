"use strict";
const JSON_URL = "data/generated/gendata-tables.json";
const renderer = EntryRenderer.getDefaultRenderer();

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

const sourceFilter = getSourceFilter();
let filterBox;
let list;
function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ["name", "source"],
		listClass: "tablesdata"
	});

	filterBox = initFilterBox(
		sourceFilter
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
		valueNames: ["name", "id"],
		listClass: "subtablesdata",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addTables(data);
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(BrewUtil.pAddLocalBrewData)
		.catch(BrewUtil.purgeBrew)
		.then(() => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({list, filterBox, sourceFilter});
			ListUtil.loadState();

			History.init(true);
			RollerUtil.addListRollButton();
		});
}

function handleBrew (homebrew) {
	addTables(homebrew);
	return Promise.resolve();
}

let tableList = [];
let cdI = 0;
function addTables (data) {
	if ((!data.table || !data.table.length) && (!data.tableGroup || !data.tableGroup.length)) return;

	if (data.table) data.table.forEach(it => it._type = "t");
	if (data.tableGroup) data.tableGroup.forEach(it => it._type = "g");

	if (data.table && data.table.length) tableList = tableList.concat(data.table);
	if (data.tableGroup && data.tableGroup.length) tableList = tableList.concat(data.tableGroup);

	const tablesTable = $("ul.tablesdata");
	let tempString = "";
	for (; cdI < tableList.length; cdI++) {
		const it = tableList[cdI];

		tempString += `
			<li class="row" ${FLTR_ID}="${cdI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${cdI}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class='name col-xs-10'>${it.name}</span>
					<span class='source col-xs-2 text-align-center ${Parser.sourceJsonToColor(it.source)}' title="${Parser.sourceJsonToFull(it.source)}">${Parser.sourceJsonToAbv(it.source)}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(it.source);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	tablesTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: tableList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(tableList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

function getSublistItem (table, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(table)}">
				<span class="name col-xs-12">${table.name}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

// filtering function
function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const it = tableList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			it.source
		);
	});
	FilterBox.nextIfHidden(tableList);
}

function loadhash (id) {
	renderer.setFirstSection(true);
	const $content = $("#pagecontent").empty();
	const it = tableList[id];

	$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(it)}
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		${EntryRenderer.table.getCompactRenderedString(it)}
		${it.chapter ? `<tr class="text"><td colspan="6">
		${EntryRenderer.getDefaultRenderer().renderEntry(`{@note ${it._type === "t" ? `This table` : "These tables"} can be found in ${Parser.sourceJsonToFull(it.source)}${Parser.bookOrdinalToAbv(it.chapter.ordinal, true)}, {@book ${it.chapter.name}|${it.source}|${it.chapter.index}|${it.chapter.name}}.}`)}
		</td></tr>` : ""}
		${EntryRenderer.utils.getPageTr(it)}
		${EntryRenderer.utils.getBorderTr()}
	`);

	ListUtil.updateSelected();
}
