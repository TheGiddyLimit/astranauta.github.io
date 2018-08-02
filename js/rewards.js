"use strict";

const JSON_URL = "data/rewards.json";

window.onload = function load () {
	ExcludeUtil.initialise();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

let list;
const sourceFilter = getSourceFilter();
const typeFilter = new Filter({
	header: "Type",
	items: [
		"Blessing",
		"Boon",
		"Charm"
	]
});
let filterBox;
function onJsonLoad (data) {
	filterBox = initFilterBox(sourceFilter, typeFilter);

	list = ListUtil.search({
		valueNames: ["name", "source"],
		listClass: "rewards"
	});
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
		listClass: "subrewards",
		getSublistRow: getSublistItem
	});

	addRewards(data);
	BrewUtil.pAddBrewData()
		.then(addRewards)
		.catch(BrewUtil.purgeBrew)
		.then(() => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({list, filterBox, sourceFilter});
			ListUtil.loadState();
			RollerUtil.addListRollButton();

			History.init(true);
		});
}

let rewardList = [];
let rwI = 0;
function addRewards (data) {
	if (!data.reward || !data.reward.length) return;

	rewardList = rewardList.concat(data.reward);

	let tempString = "";
	for (; rwI < rewardList.length; rwI++) {
		const reward = rewardList[rwI];
		if (ExcludeUtil.isExcluded(reward.name, "reward", reward.source)) continue;

		tempString += `
			<li class='row' ${FLTR_ID}='${rwI}' onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id='${rwI}' href="#${UrlUtil.autoEncodeHash(reward)}" title="${reward.name}">
					<span class='name col-xs-10'>${reward.name}</span>
					<span class='source col-xs-2 source${Parser.sourceJsonToAbv(reward.source)}' title="${Parser.sourceJsonToFull(reward.source)}">${Parser.sourceJsonToAbv(reward.source)}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(reward.source);
		typeFilter.addIfAbsent(reward.type);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$("ul.rewards").append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);
	typeFilter.items.sort(SortUtil.ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: rewardList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(rewardList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const r = rewardList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			r.source,
			r.type
		);
	});
	FilterBox.nextIfHidden(rewardList);
}

function getSublistItem (reward, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(reward)}" title="${reward.name}">
				<span class="name col-xs-12">${reward.name}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

function loadhash (id) {
	EntryRenderer.getDefaultRenderer().setFirstSection(true);
	const $content = $("#pagecontent").empty();
	const reward = rewardList[id];

	$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(reward)}
		<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
		${EntryRenderer.reward.getRenderedString(reward)}
		${EntryRenderer.utils.getBorderTr()}
	`);

	ListUtil.updateSelected();
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}
