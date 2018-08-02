"use strict";
const JSON_URL = "data/backgrounds.json";
const JSON_FLUFF_URL = "data/fluff-backgrounds.json";
const renderer = EntryRenderer.getDefaultRenderer();

window.onload = function load () {
	ExcludeUtil.initialise();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

let list;
const sourceFilter = getSourceFilter();
let filterBox = initFilterBox(sourceFilter);
function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ['name', 'source'],
		listClass: "backgrounds"
	});

	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});

	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	const subList = ListUtil.initSublist({
		valueNames: ["name", "id"],
		listClass: "subbackgrounds",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addBackgrounds(data);
	BrewUtil.pAddBrewData()
		.then(addBackgrounds)
		.catch(BrewUtil.purgeBrew)
		.then(() => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({list, filterBox, sourceFilter});
			ListUtil.loadState();
			RollerUtil.addListRollButton();

			History.init(true);
		});
}

let bgList = [];
let bgI = 0;
function addBackgrounds (data) {
	if (!data.background || !data.background.length) return;

	bgList = bgList.concat(data.background);

	const bgTable = $("ul.backgrounds");
	let tempString = "";
	for (; bgI < bgList.length; bgI++) {
		const bg = bgList[bgI];
		if (ExcludeUtil.isExcluded(bg.name, "background", bg.source)) continue;

		// populate table
		tempString +=
			`<li class="row" ${FLTR_ID}="${bgI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id='${bgI}' href="#${UrlUtil.autoEncodeHash(bg)}" title="${bg.name}">
					<span class='name col-xs-10'>${bg.name.replace("Variant ", "")}</span>
					<span class='source col-xs-2 source${bg.source}' title="${Parser.sourceJsonToFull(bg.source)}">${Parser.sourceJsonToAbv(bg.source)}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(bg.source);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	bgTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: bgList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(bgList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const bg = bgList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(f, bg.source);
	});
	FilterBox.nextIfHidden(bgList);
}

function getSublistItem (bg, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(bg)}" title="${bg.name}">
				<span class="name col-xs-12">${bg.name}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

function loadhash (id) {
	renderer.setFirstSection(true);
	const $pgContent = $("#pagecontent").empty();
	const bg = bgList[id];

	function buildStatsTab () {
		const renderStack = [];
		const entryList = {type: "entries", entries: bg.entries};
		renderer.recursiveEntryRender(entryList, renderStack, 1);

		$pgContent.append(`
			${EntryRenderer.utils.getBorderTr()}
			${EntryRenderer.utils.getNameTr(bg)}
			<tr><td class="divider" colspan="6"><div></div></td></tr>
			<tr class='trait'><td colspan='6'>${renderStack.join("")}</td></tr>
			${EntryRenderer.utils.getPageTr(bg)}
			${EntryRenderer.utils.getBorderTr()}
		`);
	}

	const traitTab = EntryRenderer.utils.tabButton(
		"Traits",
		() => {},
		buildStatsTab
	);

	const infoTab = EntryRenderer.utils.tabButton(
		"Info",
		() => {},
		() => {
			function get$Tr () {
				return $(`<tr class="text">`);
			}
			function get$Td () {
				return $(`<td colspan="6" class="text">`);
			}

			$pgContent.append(EntryRenderer.utils.getBorderTr());
			$pgContent.append(EntryRenderer.utils.getNameTr(bg));
			let $tr = get$Tr();
			let $td = get$Td().appendTo($tr);
			$pgContent.append($tr);
			$pgContent.append(EntryRenderer.utils.getBorderTr());

			DataUtil.loadJSON(JSON_FLUFF_URL).then((data) => {
				const baseFluff = data.background.find(it => it.name.toLowerCase() === bg.name.toLowerCase() && it.source.toLowerCase() === bg.source.toLowerCase());
				if (bg.fluff && bg.fluff.entries) { // override; for homebrew usage only
					renderer.setFirstSection(true);
					$td.append(renderer.renderEntry({type: "section", entries: bg.fluff.entries}));
				} else if (baseFluff && baseFluff.entries) {
					renderer.setFirstSection(true);
					$td.append(renderer.renderEntry({type: "section", entries: baseFluff.entries}));
				} else {
					$td.empty();
					$td.append(HTML_NO_INFO);
				}
			});
		}
	);
	EntryRenderer.utils.bindTabButtons(traitTab, infoTab);

	ListUtil.updateSelected();
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}