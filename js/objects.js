"use strict";

const JSON_URL = "data/objects.json";

window.onload = function load () {
	ExcludeUtil.initialise();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

let list;
function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ["name", "size", "source"],
		listClass: "objects",
		sortFunction: SortUtil.listSort
	});

	EntryRenderer.hover.bindPopoutButton(objectsList);

	const subList = ListUtil.initSublist({
		valueNames: ["name", "size", "id"],
		listClass: "subobjects",
		itemList: objectsList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.initGenericPinnable();

	addObjects(data);
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(BrewUtil.pAddLocalBrewData)
		.catch(BrewUtil.purgeBrew)
		.then(() => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({list});
			ListUtil.loadState();

			History.init(true);
		});
}

function handleBrew (homebrew) {
	addObjects(homebrew);
	return Promise.resolve();
}

let objectsList = [];
let obI = 0;
function addObjects (data) {
	if (!data.object || !data.object.length) return;

	objectsList = objectsList.concat(data.object);

	let tempString = "";
	for (; obI < objectsList.length; obI++) {
		const obj = objectsList[obI];
		if (ExcludeUtil.isExcluded(obj.name, "object", obj.source)) continue;
		const abvSource = Parser.sourceJsonToAbv(obj.source);

		tempString += `
			<li class="row" ${FLTR_ID}="${obI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${obI}" href="#${UrlUtil.autoEncodeHash(obj)}" title="${obj.name}">
					<span class="name col-xs-8">${obj.name}</span>
					<span class="size col-xs-2">${Parser.sizeAbvToFull(obj.size)}</span>
					<span class="source col-xs-2 source${abvSource}" title="${Parser.sourceJsonToFull(obj.source)}">${abvSource}</span>
				</a>
			</li>
		`;
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$(`#objectsList`).append(tempString);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");

	ListUtil.setOptions({
		itemList: objectsList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(objectsList);
}

function getSublistItem (obj, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(obj)}" title="${obj.name}">
				<span class="name col-xs-9">${obj.name}</span>		
				<span class="ability col-xs-3">${Parser.sizeAbvToFull(obj.size)}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

const renderer = EntryRenderer.getDefaultRenderer();
function loadhash (jsonIndex) {
	renderer.setFirstSection(true);

	const obj = objectsList[jsonIndex];

	const renderStack = [];

	if (obj.entries) renderer.recursiveEntryRender({entries: obj.entries}, renderStack, 2);
	if (obj.actionEntries) renderer.recursiveEntryRender({entries: obj.actionEntries}, renderStack, 2);

	const $content = $(`#pagecontent`).empty();
	$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(obj)}
		<tr class="text"><td colspan="6"><i>${obj.type !== "GEN" ? `${Parser.sizeAbvToFull(obj.size)} object` : `Variable size object`}</i><br></td></tr>
		<tr class="text"><td colspan="6">
			<b>Armor Class:</b> ${obj.ac}<br>
			<b>Hit Points:</b> ${obj.hp}<br>
			<b>Damage Immunities:</b> ${obj.immune}<br>
			${obj.resist ? `<b>Damage Resistances:</b> ${obj.resist}<br>` : ""}
			${obj.vulnerable ? `<b>Damage Vulnerabilities:</b> ${obj.vulnerable}<br>` : ""}
		</td></tr>
		<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
		${EntryRenderer.utils.getPageTr(obj)}
		${EntryRenderer.utils.getBorderTr()}
	`);

	const imgLink = obj.tokenURL || UrlUtil.link(`img/objects/${obj.name.replace(/"/g, "")}.png`);
	$("th.name").append(`
		<a href="${imgLink}" target="_blank">
			<img src="${imgLink}" class="token" onerror="imgError(this)">
		</a>`
	);

	ListUtil.updateSelected();
}

function imgError (x) {
	$(x).closest("th").find(`span.stats-source`).css("margin-right", "0");
	$(x).remove();
}