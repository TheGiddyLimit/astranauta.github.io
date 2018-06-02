"use strict";
const JSON_URL = "data/feats.json";
let list;

window.onload = function load () {
	ExcludeUtil.initialise();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

const sourceFilter = getSourceFilter();
let filterBox;
function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ['name', 'source', 'ability', 'prerequisite'],
		listClass: "feats"
	});

	const asiFilter = getAsiFilter();
	const prereqFilter = new Filter({
		header: "Prerequisite",
		items: ["Ability", "Race", "Proficiency", "Spellcasting"]
	});
	filterBox = initFilterBox(
		sourceFilter,
		asiFilter,
		prereqFilter
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
		valueNames: ["name", "ability", "prerequisite", "id"],
		listClass: "subfeats",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addFeats(data);
	BrewUtil.addBrewData(addFeats);
	BrewUtil.makeBrewButton("manage-brew");
	BrewUtil.bind({list, filterBox, sourceFilter});

	History.init();
	handleFilterChange();
	RollerUtil.addListRollButton();
}

let featList = [];
let ftI = 0;
function addFeats (data) {
	if (!data.feat || !data.feat.length) return;

	featList = featList.concat(data.feat);

	const featTable = $("ul.feats");
	let tempString = "";
	for (; ftI < featList.length; ftI++) {
		const curfeat = featList[ftI];
		if (ExcludeUtil.isExcluded(curfeat.name, "feat", curfeat.source)) continue;
		const name = curfeat.name;
		const ability = utils_getAbilityData(curfeat.ability);
		if (!ability.asText) ability.asText = STR_NONE;
		curfeat._fAbility = ability.asCollection.filter(a => !ability.areNegative.includes(a)); // used for filtering
		let prereqText = EntryRenderer.feat.getPrerequisiteText(curfeat.prerequisite, true);
		if (!prereqText) prereqText = STR_NONE;
		const CLS_COL_1 = "name col-xs-3 col-xs-3-8";
		const CLS_COL_2 = `source col-xs-1 col-xs-1-7 source${curfeat.source}`;
		const CLS_COL_3 = "ability " + (ability.asText === STR_NONE ? "list-entry-none " : "") + "col-xs-3 col-xs-3-5";
		const CLS_COL_4 = "prerequisite " + (prereqText === STR_NONE ? "list-entry-none " : "") + "col-xs-3";

		const preSet = new Set();
		(curfeat.prerequisite || []).forEach(it => preSet.add(...Object.keys(it)));
		curfeat._fPrereq = [...preSet].map(it => it.uppercaseFirst());

		curfeat._slAbility = ability.asText;
		curfeat._slPrereq = prereqText;

		tempString += `
			<li class="row" ${FLTR_ID}="${ftI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id='${ftI}' href='#${UrlUtil.autoEncodeHash(curfeat)}' title='${name}'>
					<span class='${CLS_COL_1}'>${name}</span>
					<span class='${CLS_COL_2}' title='${Parser.sourceJsonToFull(curfeat.source)}'>${Parser.sourceJsonToAbv(curfeat.source)}</span>
					<span class='${CLS_COL_3}'>${ability.asText}</span>
					<span class='${CLS_COL_4}'>${prereqText}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(curfeat.source);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	featTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: featList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(featList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
	ListUtil.loadState();
}

// filtering function
function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const ft = featList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			ft.source,
			ft._fAbility,
			ft._fPrereq
		);
	});
	FilterBox.nextIfHidden(featList);
}

function getSublistItem (feat, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(feat)}" title="${feat.name}">
				<span class="name col-xs-4">${feat.name}</span>		
				<span class="ability col-xs-4 ${feat._slAbility === STR_NONE ? "list-entry-none" : ""}">${feat._slAbility}</span>		
				<span class="prerequisite col-xs-4 ${feat._slPrereq === STR_NONE ? "list-entry-none" : ""}">${feat._slPrereq}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

const renderer = EntryRenderer.getDefaultRenderer();
function loadhash (id) {
	renderer.setFirstSection(true);

	const $content = $("#pagecontent").empty();

	const feat = featList[id];

	const prerequisite = EntryRenderer.feat.getPrerequisiteText(feat.prerequisite);
	EntryRenderer.feat.mergeAbilityIncrease(feat);
	const renderStack = [];
	renderer.recursiveEntryRender({entries: feat.entries}, renderStack, 2);

	$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(feat)}
		${prerequisite ? `<tr><td colspan="6"><span class="prerequisite">Prerequisite: ${prerequisite}</span></td></tr>` : ""}
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr class='text'><td colspan='6'>${renderStack.join("")}</td></tr>
		${EntryRenderer.utils.getPageTr(feat)}
		${EntryRenderer.utils.getBorderTr()}
	`);
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}