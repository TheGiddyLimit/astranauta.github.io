"use strict";
const JSON_URL = "data/variantrules.json";

window.onload = function load () {
	ExcludeUtil.initialise();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

let tableDefault;

const entryRenderer = EntryRenderer.getDefaultRenderer();

let list;
const sourceFilter = getSourceFilter();
let filterBox;

function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ['name', 'source', 'search'],
		listClass: "variantRules"
	});

	tableDefault = $("#pagecontent").html();

	filterBox = initFilterBox(sourceFilter);

	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});
	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	const subList = ListUtil.initSublist({
		valueNames: ["name"],
		listClass: "subVariantRules"
	});
	ListUtil.initGenericPinnable();

	addListShowHide();

	addVariantRules(data);
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(BrewUtil.pAddLocalBrewData)
		.catch(BrewUtil.purgeBrew)
		.then(() => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({list, filterBox, sourceFilter});

			History.init(true);
		});
}

function handleBrew (homebrew) {
	addVariantRules(homebrew);
	return Promise.resolve();
}

let rulesList = [];
let rlI = 0;
function addVariantRules (data) {
	if (!data.variantrule || !data.variantrule.length) return;

	rulesList = rulesList.concat(data.variantrule);

	let tempString = "";
	for (; rlI < rulesList.length; rlI++) {
		const curRule = rulesList[rlI];
		if (ExcludeUtil.isExcluded(curRule.name, "variantrule", curRule.source)) continue;

		const searchStack = [];
		for (const e1 of curRule.entries) {
			EntryRenderer.getNames(searchStack, e1);
		}

		// populate table
		tempString += `
			<li class="row" ${FLTR_ID}="${rlI}" onclick="ListUtil.toggleSelected(event, this)">
				<a id="${rlI}" href="#${UrlUtil.autoEncodeHash(curRule)}" title="${curRule.name}">
					<span class="name col-xs-10">${curRule.name}</span>
					<span class="source col-xs-2 source${Parser.sourceJsonToAbv(curRule.source)}" title="${Parser.sourceJsonToFull(curRule.source)}">${Parser.sourceJsonToAbv(curRule.source)}</span>
					<span class="search hidden">${searchStack.join(",")}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(curRule.source);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$("ul.variantRules").append(tempString);
	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: rulesList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(rulesList);
}

function getSublistItem (rule, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(rule)}" title="${rule.name}">
				<span class="name col-xs-12">${rule.name}</span>
				<span class="id hidden">${pinId}</span>
			</a>
		</li>
	`;
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const r = rulesList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(f, r.source);
	});
	FilterBox.nextIfHidden(rulesList);
}

function loadhash (id) {
	entryRenderer.setFirstSection(true);

	// reset details pane to initial HTML
	$("#pagecontent").html(tableDefault);

	const curRule = rulesList[id];

	// build text list and display
	$("tr.text").remove();
	const textStack = [];
	entryRenderer.recursiveEntryRender(curRule, textStack);
	$("tr#text").after("<tr class='text'><td colspan='6'>" + textStack.join("") + "</td></tr>");

	ListUtil.updateSelected();
}
