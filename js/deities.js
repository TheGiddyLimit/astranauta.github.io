"use strict";

const STR_REPRINTED = "reprinted";

window.onload = function load () {
	ExcludeUtil.initialise();
	DataUtil.deity.loadJSON().then(onJsonLoad);
};

let list;
const sourceFilter = getSourceFilter();
const pantheonFilter = new Filter({
	header: "Pantheon",
	items: [
		"Celtic",
		"Dawn War",
		"Dragonlance",
		"Drow",
		"Dwarven",
		"Eberron",
		"Egyptian",
		"Elven",
		"Faerûnian",
		"Forgotten Realms",
		"Gnomish",
		"Greek",
		"Greyhawk",
		"Halfling",
		"Nonhuman",
		"Norse",
		"Orc"
	]
});
const categoryFilter = new Filter({
	header: "Category",
	items: [
		STR_NONE,
		"Other Faiths of Eberron",
		"The Dark Six",
		"The Gods of Evil",
		"The Gods of Good",
		"The Gods of Neutrality",
		"The Sovereign Host"
	]
});

let filterBox;
function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ["name", "pantheon", "alignment", "domains", "symbol", "source"],
		listClass: "deities",
		sortFunction: SortUtil.listSort
	});

	const alignmentFilter = new Filter({
		header: "Alignment",
		items: ["C", "E", "G", "L", "N"],
		displayFn: Parser.alignmentAbvToFull
	});
	const domainFilter = new Filter({
		header: "Domain",
		items: ["Arcana", "Death", "Forge", "Grave", "Knowledge", "Life", "Light", "Nature", STR_NONE, "Tempest", "Trickery", "War"]
	});
	const miscFilter = new Filter({
		header: "Miscellaneous",
		items: [STR_REPRINTED],
		displayFn: StrUtil.uppercaseFirst,
		deselFn: (it) => { return it === STR_REPRINTED }
	});

	filterBox = initFilterBox(sourceFilter, alignmentFilter, pantheonFilter, categoryFilter, domainFilter, miscFilter);

	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});
	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	const subList = ListUtil.initSublist({
		valueNames: ["name", "pantheon", "alignment", "domains", "id"],
		listClass: "subdeities",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addDeities(data);
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(BrewUtil.pAddLocalBrewData)
		.catch(BrewUtil.purgeBrew)
		.then(() => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({list, filterBox, sourceFilter});
			ListUtil.loadState();
			RollerUtil.addListRollButton();
			addListShowHide();

			History.init(true);
		});
}

function handleBrew (homebrew) {
	addDeities(homebrew);
	return Promise.resolve();
}

let deitiesList = [];
let dtI = 0;
function addDeities (data) {
	if (!data.deity || !data.deity.length) return;

	deitiesList = deitiesList.concat(data.deity);

	let tempString = "";
	for (; dtI < deitiesList.length; dtI++) {
		const g = deitiesList[dtI];
		if (ExcludeUtil.isExcluded(g.name, "deity", g.source)) continue;
		const abvSource = Parser.sourceJsonToAbv(g.source);

		g.alignment.sort(SortUtil.alignmentSort);
		if (!g.category) g.category = STR_NONE;
		if (!g.domains) g.domains = [STR_NONE];
		g.domains.sort(SortUtil.ascSort);

		g._fReprinted = g.reprinted ? STR_REPRINTED : "";

		tempString += `
			<li class="row" ${FLTR_ID}="${dtI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${dtI}" href="#${UrlUtil.autoEncodeHash(g)}" title="${g.name}">
					<span class="name col-xs-3">${g.name}</span>
					<span class="pantheon col-xs-2 text-align-center">${g.pantheon}</span>
					<span class="alignment col-xs-2 text-align-center">${g.alignment.join("")}</span>
					<span class="domains col-xs-3 ${g.domains[0] === STR_NONE ? `list-entry-none` : ""}">${g.domains.join(", ")}</span>
					<span class="source col-xs-2 source${abvSource}" title="${Parser.sourceJsonToFull(g.source)}">${abvSource}</span>
				</a>
			</li>
		`;

		sourceFilter.addIfAbsent(g.source);
		pantheonFilter.addIfAbsent(g.pantheon);
		categoryFilter.addIfAbsent(g.category);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$(`#deitiesList`).append(tempString);
	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);
	categoryFilter.items.sort();

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: deitiesList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(deitiesList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const g = deitiesList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			g.source,
			g.alignment,
			g.pantheon,
			g.category,
			g.domains,
			g._fReprinted
		);
	});
	FilterBox.nextIfHidden(deitiesList);
}

function getSublistItem (g, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(g)}" title="${g.name}">
				<span class="name col-xs-4">${g.name}</span>
				<span class="pantheon col-xs-2">${g.pantheon}</span>
				<span class="alignment col-xs-2">${g.alignment.join("")}</span>
				<span class="domains col-xs-4 ${g.domains[0] === STR_NONE ? `list-entry-none` : ""}">${g.domains.join(", ")}</span>
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

const renderer = EntryRenderer.getDefaultRenderer();
function loadhash (jsonIndex) {
	renderer.setFirstSection(true);
	const deity = deitiesList[jsonIndex];

	function getDeityBody (deity, reprintIndex) {
		const renderStack = [];
		if (deity.entries) renderer.recursiveEntryRender({entries: deity.entries}, renderStack);
		return `
		${reprintIndex ? `<tr><td colspan="6"><i class="text-muted">${reprintIndex === 1 ? `This deity is a reprint.` : ""} The version below was printed in an older publication (${Parser.sourceJsonToFull(deity.source)}${deity.page ? `, page ${deity.page}` : ""}).</i></td></tr>` : ""}
		<tr><td colspan="6"><span class="bold">Pantheon: </span>${deity.pantheon}</td></tr>
		${deity.category ? `<tr><td colspan="6"><span class="bold">Category: </span>${deity.category}</td></tr>` : ""}
		<tr><td colspan="6"><span class="bold">Alignment: </span>${deity.alignment.map(a => Parser.alignmentAbvToFull(a)).join(" ")}</td></tr>
		<tr><td colspan="6"><span class="bold">Domains: </span>${deity.domains.join(", ")}</td></tr>
		${deity.province ? `<tr><td colspan="6"><span class="bold">Province: </span>${deity.province}</td></tr>` : ""}
		${deity.altNames ? `<tr><td colspan="6"><span class="bold">Alternate Names: </span>${deity.altNames.join(", ")}</td></tr>` : ""}
		<tr><td colspan="6"><span class="bold">Symbol: </span>${deity.symbol}</td></tr>
		${deity.symbolImg ? `<tr><td colspan="6">${renderer.renderEntry({entries: [deity.symbolImg]})}</td></tr>` : ""}
		${renderStack.length ? `<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>` : ""}
		`;
	}

	const $content = $(`#pagecontent`).empty();
	$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(deity, false, "", deity.title ? `, ${deity.title.toTitleCase()}` : "")}
		${getDeityBody(deity)}
		${deity.reprinted ? `<tr class="text"><td colspan="6"><i class="text-muted">Note: this deity has been reprinted in a newer publication.</i></td></tr>` : ""}
		${EntryRenderer.utils.getPageTr(deity)}
		${deity.previousVersions ? `
		${EntryRenderer.utils.getDividerTr()}
		${deity.previousVersions.map((d, i) => getDeityBody(d, i + 1)).join(EntryRenderer.utils.getDividerTr())}
		` : ""}
		${EntryRenderer.utils.getBorderTr()}
	`);

	ListUtil.updateSelected();
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}