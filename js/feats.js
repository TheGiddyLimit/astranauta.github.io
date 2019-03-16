"use strict";

const JSON_URL = "data/feats.json";
let list;

window.onload = async function load () {
	await ExcludeUtil.pInitialise();
	SortUtil.initHandleFilterButtonClicks();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

const sourceFilter = getSourceFilter();
let filterBox;
async function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ['name', 'source', 'ability', 'prerequisite', "uniqueid"],
		listClass: "feats"
	});

	const asiFilter = getAsiFilter();
	const prereqFilter = new Filter({
		header: "Prerequisite",
		items: ["Ability", "Race", "Proficiency", "Spellcasting"]
	});
	filterBox = await pInitFilterBox(
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
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(() => BrewUtil.bind({list}))
		.then(() => BrewUtil.pAddLocalBrewData())
		.catch(BrewUtil.pPurgeBrew)
		.then(async () => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({filterBox, sourceFilter});
			await ListUtil.pLoadState();
			RollerUtil.addListRollButton();
			ListUtil.addListShowHide();

			History.init(true);
			ExcludeUtil.checkShowAllExcluded(featList, $(`#pagecontent`));
		});
}

function handleBrew (homebrew) {
	addFeats(homebrew);
	return Promise.resolve();
}

let featList = [];
let ftI = 0;
function addFeats (data) {
	if (!data.feat || !data.feat.length) return;

	featList = featList.concat(data.feat);

	const featTable = $("ul.feats");
	let tempString = "";
	for (; ftI < featList.length; ftI++) {
		const feat = featList[ftI];
		if (ExcludeUtil.isExcluded(feat.name, "feat", feat.source)) continue;
		const name = feat.name;
		const ability = utils_getAbilityData(feat.ability);
		if (!ability.asText) ability.asText = STR_NONE;
		feat._fAbility = ability.asCollection.filter(a => !ability.areNegative.includes(a)); // used for filtering
		let prereqText = EntryRenderer.feat.getPrerequisiteText(feat.prerequisite, true);
		if (!prereqText) prereqText = STR_NONE;

		const preSet = new Set();
		(feat.prerequisite || []).forEach(it => preSet.add(...Object.keys(it)));
		feat._fPrereq = [...preSet].map(it => it.uppercaseFirst());

		feat._slAbility = ability.asText;
		feat._slPrereq = prereqText;

		tempString += `
			<li class="row" ${FLTR_ID}="${ftI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${ftI}" href="#${UrlUtil.autoEncodeHash(feat)}" title="${name}">
					<span class="name col-3-8">${name}</span>
					<span class="ability col-3-5 ${ability.asText === STR_NONE ? "list-entry-none " : ""}">${ability.asText}</span>
					<span class="prerequisite col-3 ${(prereqText === STR_NONE ? "list-entry-none " : "")}">${prereqText}</span>
					<span class="source col-1-7 text-align-center ${Parser.sourceJsonToColor(feat.source)}" title="${Parser.sourceJsonToFull(feat.source)}">${Parser.sourceJsonToAbv(feat.source)}</span>
					
					<span class="uniqueid hidden">${feat.uniqueId ? feat.uniqueId : ftI}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(feat.source);
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
				<span class="name col-4">${feat.name}</span>
				<span class="ability col-4 ${feat._slAbility === STR_NONE ? "list-entry-none" : ""}">${feat._slAbility}</span>
				<span class="prerequisite col-4 ${feat._slPrereq === STR_NONE ? "list-entry-none" : ""}">${feat._slPrereq}</span>
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

	ListUtil.updateSelected();
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}
