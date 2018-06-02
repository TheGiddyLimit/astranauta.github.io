"use strict";
const JSON_URL = "data/conditions.json";
const entryRenderer = EntryRenderer.getDefaultRenderer();
let tableDefault;
let conditionList;

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

function onJsonLoad (data) {
	conditionList = data.condition;

	tableDefault = $("#pagecontent").html();

	let tempString = "";
	for (let i = 0; i < conditionList.length; i++) {
		const name = conditionList[i].name;
		tempString += `
			<li class="row" ${FLTR_ID}="${i}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(conditionList[i])}' title='${name}'>
					<span class='name col-xs-12' title='${name}'>${name}</span>
				</a>
			</li>`;
	}
	$("ul.conditions").append(tempString);

	const list = ListUtil.search({
		valueNames: ['name'],
		listClass: "conditions"
	});

	const subList = ListUtil.initSublist({
		valueNames: ["name", "id"],
		listClass: "subconditions",
		itemList: conditionList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(conditionList);
	ListUtil.initGenericPinnable();
	ListUtil.loadState();

	History.init();
}

function getSublistItem (cond, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(cond)}" title="${cond.name}">
				<span class="name col-xs-12">${cond.name}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

function loadhash (id) {
	entryRenderer.setFirstSection(true);
	$("#pagecontent").html(tableDefault);
	const curcondition = conditionList[id];
	$("th.name").html(curcondition.name);
	$("tr.text").remove();
	const entryList = {type: "entries", entries: curcondition.entries};
	const textStack = [];
	entryRenderer.recursiveEntryRender(entryList, textStack);
	$("tr#text").after("<tr class='text'><td colspan='6'>" + textStack.join("") + "</td></tr>");
}
