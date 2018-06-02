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
			<li class="row" ${FLTR_ID}="${i}">
				<a id="${i}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="type col-xs-3 text-align-center">${cultBoonTypeToFull(it._type)}</span>
					<span class="name col-xs-7">${it.name}</span>
					<span class="source col-xs-2" title='${Parser.sourceJsonToFull(it.source)}'>${Parser.sourceJsonToAbv(it.source)}</span>
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
	History.init();
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
	const sourceFull = Parser.sourceJsonToFull(it.source);

	if (it._type === "c") {
		if (it.goal || it.cultists || it.signaturespells) {
			const fauxList = {
				type: "list",
				style: "list-hang-notitle",
				items: []
			};
			if (it.goal) {
				fauxList.items.push({
					type: "item",
					name: "Goals:",
					entry: it.goal.entry
				});
			}

			if (it.cultists) {
				fauxList.items.push({
					type: "item",
					name: "Typical Cultists:",
					entry: it.cultists.entry
				});
			}
			if (it.signaturespells) {
				fauxList.items.push({
					type: "item",
					name: "Signature Spells:",
					entry: it.signaturespells.entry
				});
			}
			renderer.recursiveEntryRender(fauxList, renderStack, 2);
		}
		renderer.recursiveEntryRender({entries: it.entries}, renderStack, 2);

		$("#pagecontent").html(`
			<tr><th class="border" colspan="6"></th></tr>
			<tr><th class="name" colspan="6"><span class="stats-name">${it.name}</span><span class="stats-source source${it.source}" title="${sourceFull}">${Parser.sourceJsonToAbv(it.source)}</span></th></tr>
			<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
			<tr class='text'><td colspan='6' class='text'>${renderStack.join("")}</td></tr>
			<tr><th class="border" colspan="6"></th></tr>
		`);
	} else {
		if (it._type === "b") {
			const benefits = {type: "list", style: "list-hang-notitle", items: []};
			benefits.items.push({
				type: "item",
				name: "Ability Score Adjustment:",
				entry: it.ability ? it.ability.entry : "None"
			});
			benefits.items.push({
				type: "item",
				name: "Signature Spells:",
				entry: it.signaturespells ? it.signaturespells.entry : "None"
			});
			renderer.recursiveEntryRender(benefits, renderStack, 1);
			renderer.recursiveEntryRender({entries: it.entries}, renderStack, 1);
			$("#pagecontent").html(`
				<tr><th class="border" colspan="6"></th></tr>
				<tr><th class="name" colspan="6"><span class="stats-name">${it._type === "b" ? `Demonic Boon: ` : ""}${it.name}</span><span class="stats-source source${it.source}" title="${sourceFull}">${Parser.sourceJsonToAbv(it.source)}</span></th></tr>
				<tr class='text'><td colspan='6'>${renderStack.join("")}</td></tr>
				${EntryRenderer.utils.getPageTr(it)}
				<tr><th class="border" colspan="6"></th></tr>
			`);
		}
	}
}
