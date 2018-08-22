"use strict";
const JSON_URL = "data/conditionsdiseases.json";
const entryRenderer = EntryRenderer.getDefaultRenderer();

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

function conditionDiseaseTypeToFull (type) {
	return type === "c" ? "Condition" : "Disease";
}

const sourceFilter = getSourceFilter();
let filterBox;
let list;
function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ["name", "source", "type"],
		listClass: "conditions"
	});

	const typeFilter = new Filter({
		header: "Type",
		items: ["c", "d"],
		displayFn: conditionDiseaseTypeToFull,
		deselFn: (it) => it === "d"
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
		listClass: "subconditions",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addConditions(data);
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
	addConditions(homebrew);
	return Promise.resolve();
}

let conditionList = [];
let cdI = 0;
function addConditions (data) {
	if ((!data.condition || !data.condition.length) && (!data.disease || !data.disease.length)) return;

	if (data.condition) data.condition.forEach(it => it._type = "c");
	if (data.disease) data.disease.forEach(it => it._type = "d");

	if (data.condition && data.condition.length) conditionList = conditionList.concat(data.condition);
	if (data.disease && data.disease.length) conditionList = conditionList.concat(data.disease);

	const condTable = $("ul.conditions");
	let tempString = "";
	for (; cdI < conditionList.length; cdI++) {
		const it = conditionList[cdI];
		tempString += `
			<li class="row" ${FLTR_ID}="${cdI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id='${cdI}' href='#${UrlUtil.autoEncodeHash(it)}' title="${it.name}">
					<span class="type col-xs-3 text-align-center">${conditionDiseaseTypeToFull(it._type)}</span>
					<span class='name col-xs-7'>${it.name}</span>
					<span class='source col-xs-2 source${it.source}' title="${Parser.sourceJsonToFull(it.source)}">${Parser.sourceJsonToAbv(it.source)}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(it.source);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	condTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: conditionList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(conditionList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

function getSublistItem (cond, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(cond)}">
				<span class="name col-xs-12">${cond.name}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

// filtering function
function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const it = conditionList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			it.source,
			it._type
		);
	});
	FilterBox.nextIfHidden(conditionList);
}

function loadhash (id) {
	entryRenderer.setFirstSection(true);
	const $content = $("#pagecontent").empty();
	const it = conditionList[id];
	const entryList = {type: "entries", entries: it.entries};
	const textStack = [];
	entryRenderer.recursiveEntryRender(entryList, textStack);
	$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(it)}
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr class='text'><td colspan='6'>${textStack.join("")}</td></tr>
		${EntryRenderer.utils.getPageTr(it)}
		${EntryRenderer.utils.getBorderTr()}
	`);

	ListUtil.updateSelected();
}
