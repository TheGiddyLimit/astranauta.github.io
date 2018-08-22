"use strict";

const JSON_URL = "data/psionics.json";

const STR_JOIN_MODE_LIST = ",";
const TMP_HIDDEN_MODE = `"{0}"`;

const ID_PSIONICS_LIST = "psionicsList";

const JSON_ITEM_NAME = "name";
const JSON_ITEM_SOURCE = "source";
const JSON_ITEM_TYPE = "type";
const JSON_ITEM_MODES = "modes";
const JSON_ITEM_SUBMODES = "submodes";
const CLS_PSIONICS = "psionics";
const CLS_COL1 = "col-xs-5";
const CLS_COL2 = "col-xs-2";
const CLS_COL3 = "col-xs-2";
const CLS_COL4 = "col-xs-2";
const CLS_HIDDEN = "hidden";
const CLS_LI_NONE = "list-entry-none";

const LIST_NAME = "name";
const LIST_SOURCE = "source";
const LIST_TYPE = "type";
const LIST_ORDER = "order";
const LIST_MODE_LIST = "mode-list";

function getHiddenModeList (psionic) {
	const modeList = psionic[JSON_ITEM_MODES];
	if (modeList === undefined) return STR_EMPTY;
	const outArray = [];
	for (let i = 0; i < modeList.length; ++i) {
		outArray.push(TMP_HIDDEN_MODE.formatUnicorn(modeList[i].name));
		if (modeList[i][JSON_ITEM_SUBMODES] !== undefined) {
			const subModes = modeList[i][JSON_ITEM_SUBMODES];
			for (let j = 0; j < subModes.length; ++j) {
				outArray.push(TMP_HIDDEN_MODE.formatUnicorn(subModes[j].name))
			}
		}
	}
	return outArray.join(STR_JOIN_MODE_LIST);
}

window.onload = function load () {
	ExcludeUtil.initialise();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

let list;
let psionicsBookView;
const sourceFilter = getSourceFilter({
	deselFn: () => false
});
let filterBox;
function onJsonLoad (data) {
	const typeFilter = new Filter({header: "Type", items: [Parser.PSI_ABV_TYPE_TALENT, Parser.PSI_ABV_TYPE_DISCIPLINE], displayFn: Parser.psiTypeToFull});
	const orderFilter = new Filter({
		header: "Order",
		items: ["Avatar", "Awakened", "Immortal", "Nomad", "Wu Jen", Parser.PSI_ORDER_NONE]
	});

	filterBox = initFilterBox(sourceFilter, typeFilter, orderFilter);

	list = ListUtil.search({
		valueNames: [LIST_NAME, LIST_SOURCE, LIST_TYPE, LIST_ORDER, LIST_MODE_LIST],
		listClass: CLS_PSIONICS,
		sortFunction: SortUtil.listSort
	});
	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	RollerUtil.addListRollButton();

	const subList = ListUtil.initSublist({
		valueNames: ["name", "type", "order", "id"],
		listClass: "subpsionics",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	psionicsBookView = new BookModeView("bookview", $(`#btn-psibook`), "If you wish to view multiple psionics, please first make a list",
		($tbl) => {
			const toShow = ListUtil.getSublistedIds().map(id => psionicList[id]);

			const stack = [];
			const renderSpell = (p) => {
				stack.push(`<table class="spellbook-entry"><tbody>`);
				stack.push(EntryRenderer.psionic.getCompactRenderedString(p));
				stack.push(`</tbody></table>`);
			};

			const renderType = (type) => {
				const toRender = toShow.filter(p => p.type === type);
				if (toRender.length) {
					stack.push(EntryRenderer.utils.getBorderTr(`<span class="spacer-name">${Parser.psiTypeToFull(type)}</span>`));

					stack.push(`<tr class="spellbook-level"><td>`);
					toRender.forEach(p => renderSpell(p));
					stack.push(`</td></tr>`);
				}
			};

			renderType("T");
			renderType("D");

			if (!toShow.length && History.lastLoadedId != null) {
				stack.push(`<tr class="spellbook-level"><td>`);
				renderSpell(psionicList[History.lastLoadedId]);
				stack.push(`</td></tr>`);
			}

			$tbl.append(stack.join(""));
			return toShow.length;
		}, true
	);

	addPsionics(data);
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(BrewUtil.pAddLocalBrewData)
		.catch(BrewUtil.purgeBrew)
		.then(() => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({list, filterBox, sourceFilter});
			ListUtil.loadState();

			ListUtil.bindShowTableButton(
				"btn-show-table",
				"Psionics",
				psionicList,
				{
					name: {name: "Name", transform: true},
					source: {name: "Source", transform: (it) => `<span class="source${Parser.stringToCasedSlug(it)}" title="${Parser.sourceJsonToFull(it)}">${Parser.sourceJsonToAbv(it)}</span>`},
					_text: {name: "Text", transform: (it) => it.type === "T" ? EntryRenderer.psionic.getTalentText(it, renderer) : EntryRenderer.psionic.getDisciplineText(it, renderer), flex: 3}
				},
				{generator: ListUtil.basicFilterGenerator},
				(a, b) => SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source)
			);

			RollerUtil.addListRollButton();
			History.init(true);
		});
}

function handleBrew (homebrew) {
	addPsionics(homebrew);
	return Promise.resolve();
}

let psionicList = [];
let psI = 0;
function addPsionics (data) {
	if (!data.psionic || !data.psionic.length) return;

	psionicList = psionicList.concat(data.psionic);

	let tempString = "";
	for (; psI < psionicList.length; psI++) {
		const p = psionicList[psI];
		if (ExcludeUtil.isExcluded(p.name, "psionic", p.source)) continue;
		p._fOrder = Parser.psiOrderToFull(p.order);

		tempString += `
			<li class='row' ${FLTR_ID}="${psI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id='${psI}' href='#${UrlUtil.autoEncodeHash(p)}' title="${p[JSON_ITEM_NAME]}">
					<span class='${LIST_NAME} ${CLS_COL1}'>${p[JSON_ITEM_NAME]}</span>
					<span class='${LIST_SOURCE} ${CLS_COL2}' title="${Parser.sourceJsonToFull(p[JSON_ITEM_SOURCE])}">${Parser.sourceJsonToAbv(p[JSON_ITEM_SOURCE])}</span>
					<span class='${LIST_TYPE} ${CLS_COL3}'>${Parser.psiTypeToFull(p[JSON_ITEM_TYPE])}</span>
					<span class='${LIST_ORDER} ${CLS_COL4} ${p._fOrder === STR_NONE ? CLS_LI_NONE : STR_EMPTY}'>${p._fOrder}</span>
					<span class='${LIST_MODE_LIST} ${CLS_HIDDEN}'>${getHiddenModeList(p)}</span>
				</a>
			</li>
		`;

		// populate filters
		sourceFilter.addIfAbsent(p[JSON_ITEM_SOURCE]);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$(`#${ID_PSIONICS_LIST}`).append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: psionicList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(psionicList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const p = psionicList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			p.source,
			p.type,
			p._fOrder
		);
	});
	FilterBox.nextIfHidden(psionicList);
}

function getSublistItem (p, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(p)}" title="${p.name}">
				<span class="name col-xs-6">${p.name}</span>
				<span class="type col-xs-3">${Parser.psiTypeToFull(p.type)}</span>
				<span class="order col-xs-3 ${p._fOrder === STR_NONE ? CLS_LI_NONE : ""}">${p._fOrder}</span>
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

let renderer;
function loadhash (jsonIndex) {
	if (!renderer) renderer = EntryRenderer.getDefaultRenderer();
	renderer.setFirstSection(true);
	const $content = $(`#pagecontent`).empty();

	const psi = psionicList[jsonIndex];

	$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(psi)}
		<tr>
			<td colspan="6"><i>${psi.type === "T" ? Parser.psiTypeToFull(psi[JSON_ITEM_TYPE]) : `${psi._fOrder} ${Parser.psiTypeToFull(psi[JSON_ITEM_TYPE])}`}</i><span id="order"></span> <span id="type"></span></td>
		</tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr class="text"><td colspan="6" id="text">${psi.type === "T" ? EntryRenderer.psionic.getTalentText(psi, renderer) : EntryRenderer.psionic.getDisciplineText(psi, renderer)}</td></tr>
		${EntryRenderer.utils.getPageTr(psi)}
		${EntryRenderer.utils.getBorderTr()}
	`);

	loadsub([]);

	ListUtil.updateSelected();
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);

	psionicsBookView.handleSub(sub);
}
