"use strict";

const JSON_DIR = "data/spells/";
const JSON_LIST_NAME = "spell";

const SUBCLASS_LOOKUP = {};

function handleBrew (homebrew) {
	RenderSpells.mergeHomebrewSubclassLookup(SUBCLASS_LOOKUP, homebrew);
	addSpells(homebrew.spell);
	return Promise.resolve();
}

class SpellsPage {
	constructor () {
		this._pageFilter = new PageFilterSpells();
	}

	getListItem (spell, spI) {
		const spHash = UrlUtil.autoEncodeHash(spell);
		if (!spell.uniqueId && _addedHashes.has(spHash)) return null;
		_addedHashes.add(spHash);
		const isExcluded = ExcludeUtil.isExcluded(spell.name, "spell", spell.source);

		this._pageFilter.addToFilters(spell, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const hash = UrlUtil.autoEncodeHash(spell);
		const source = Parser.sourceJsonToAbv(spell.source);
		const time = PageFilterSpells.getTblTimeStr(spell.time[0]);
		const school = Parser.spSchoolAndSubschoolsAbvsShort(spell.school, spell.subschools);
		const concentration = spell._isConc ? "×" : "";
		const range = Parser.spRangeToFull(spell.range);

		eleLi.innerHTML = `<a href="#${spHash}" class="lst--border">
			<span class="bold col-2-9 pl-0">${spell.name}</span>
			<span class="col-1-5 text-center">${Parser.spLevelToFull(spell.level)}${spell.meta && spell.meta.ritual ? " (rit.)" : ""}${spell.meta && spell.meta.technomagic ? " (tec.)" : ""}</span>
			<span class="col-1-7 text-center">${time}</span>
			<span class="col-1-2 school_${spell.school} text-center" title="${Parser.spSchoolAndSubschoolsAbvsToFull(spell.school, spell.subschools)}">${school}</span>
			<span class="col-0-6 text-center" title="Concentration">${concentration}</span>
			<span class="col-2-4 text-right">${range}</span>
			<span class="col-1-7 text-center ${Parser.sourceJsonToColor(spell.source)} pr-0" title="${Parser.sourceJsonToFull(spell.source)}" ${BrewUtil.sourceJsonToStyle(spell.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			spI,
			eleLi,
			spell.name,
			{
				hash,
				source,
				level: spell.level,
				time,
				school: Parser.spSchoolAbvToFull(spell.school),
				classes: Parser.spClassesToFull(spell.classes, true, SUBCLASS_LOOKUP),
				concentration,
				normalisedTime: spell._normalisedTime,
				normalisedRange: spell._normalisedRange,
				isExcluded,
				uniqueId: spell.uniqueId ? spell.uniqueId : spI
			}
		);

		eleLi.addEventListener("click", (evt) => list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._pageFilter.filterBox.getValues();
		list.filter(li => {
			const s = spellList[li.ix];
			return this._pageFilter.toDisplay(f, s);
		});
		onFilterChangeMulti(spellList);
	}

	getSublistItem (spell, pinId) {
		const hash = UrlUtil.autoEncodeHash(spell);
		const school = Parser.spSchoolAndSubschoolsAbvsShort(spell.school, spell.subschools);
		const time = PageFilterSpells.getTblTimeStr(spell.time[0]);
		const concentration = spell._isConc ? "×" : "";
		const range = Parser.spRangeToFull(spell.range);

		const $ele = $(`<li class="row">
			<a href="#${UrlUtil.autoEncodeHash(spell)}" title="${spell.name}" class="lst--border">
				<span class="bold col-3-2 pl-0">${spell.name}</span>
				<span class="capitalise col-1-5 text-center">${Parser.spLevelToFull(spell.level)}</span>
				<span class="col-1-8 text-center">${time}</span>
				<span class="capitalise col-1-6 school_${spell.school} text-center" title="${Parser.spSchoolAndSubschoolsAbvsToFull(spell.school, spell.subschools)}">${school}</span>
				<span class="concentration--sublist col-0-7 text-center" title="Concentration">${concentration}</span>
				<span class="range col-3-2 pr-0 text-right">${range}</span>
			</a>
		</li>`).contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			spell.name,
			{
				hash,
				school,
				level: spell.level,
				time,
				concentration,
				range,
				normalisedTime: spell._normalisedTime,
				normalisedRange: spell._normalisedRange
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const $content = $("#pagecontent").empty();
		const spell = spellList[id];

		function buildStatsTab () {
			$content.append(RenderSpells.$getRenderedSpell(spell, SUBCLASS_LOOKUP));
		}

		function buildFluffTab (isImageTab) {
			return Renderer.utils.pBuildFluffTab(
				isImageTab,
				$content,
				spell,
				(fluffJson) => spell.fluff || fluffJson.spell.find(it => it.name === spell.name && it.source === spell.source),
				null,
				() => false
			);
		}

		const statTab = Renderer.utils.tabButton(
			"Spell",
			() => {},
			buildStatsTab
		);
		const infoTab = Renderer.utils.tabButton(
			"Info",
			() => {},
			buildFluffTab
		);
		const picTab = Renderer.utils.tabButton(
			"Images",
			() => {},
			buildFluffTab.bind(null, true)
		);

		// only display the "Info"/"Images" tabs if there's some fluff info--currently (2019-12-08), no official spell has fluff
		if (spell.fluff && spell.fluff.entries) Renderer.utils.bindTabButtons(statTab, infoTab, picTab);
		else Renderer.utils.bindTabButtons(statTab);

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._pageFilter.filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub, sublistFuncPreload);

		spellBookView.handleSub(sub);
	}

	async pOnLoad () {
		window.loadHash = this.doLoadHash.bind(this);
		window.loadSubHash = this.doLoadSubHash.bind(this);

		await this._pageFilter.pInitFilterBox({
			$wrpFormTop: $(`#filter-search-input-group`).title("Hotkey: f"),
			$btnReset: $(`#reset`)
		});

		const [subclassLookup] = await Promise.all([
			RenderSpells.pGetSubclassLookup(),
			ExcludeUtil.pInitialise()
		]);
		Object.assign(SUBCLASS_LOOKUP, subclassLookup);
		await pMultisourceLoad(JSON_DIR, JSON_LIST_NAME, this._pageFilter.filterBox, pPageInit, addSpells, pPostLoad);
		if (Hist.lastLoadedId == null) Hist._freshLoad();
		ExcludeUtil.checkShowAllExcluded(spellList, $(`#pagecontent`));
	}
}
SpellsPage._BOOK_VIEW_MODE_K = "bookViewMode";

async function pPostLoad () {
	const homebrew = await BrewUtil.pAddBrewData();
	await handleBrew(homebrew);
	BrewUtil.bind({list});
	BrewUtil.makeBrewButton("manage-brew");
	BrewUtil.bind({filterBox: spellsPage._pageFilter.filterBox, sourceFilter: spellsPage._pageFilter.sourceFilter});
	await ListUtil.pLoadState();

	ListUtil.bindShowTableButton(
		"btn-show-table",
		"Spells",
		spellList,
		{
			name: {name: "Name", transform: true},
			source: {name: "Source", transform: (it) => `<span class="${Parser.sourceJsonToColor(it)}" title="${Parser.sourceJsonToFull(it)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${Parser.sourceJsonToAbv(it)}</span>`},
			level: {name: "Level", transform: (it) => Parser.spLevelToFull(it)},
			time: {name: "Casting Time", transform: (it) => PageFilterSpells.getTblTimeStr(it[0])},
			duration: {name: "Duration", transform: (it) => Parser.spDurationToFull(it)},
			_school: {name: "School", transform: (sp) => `<span class="school_${sp.school}">${Parser.spSchoolAndSubschoolsAbvsToFull(sp.school, sp.subschools)}</span>`},
			range: {name: "Range", transform: (it) => Parser.spRangeToFull(it)},
			_components: {name: "Components", transform: (sp) => Parser.spComponentsToFull(sp.components, sp.level)},
			classes: {name: "Classes", transform: (it) => Parser.spMainClassesToFull(it)},
			entries: {name: "Text", transform: (it) => Renderer.get().render({type: "entries", entries: it}, 1), flex: 3},
			entriesHigherLevel: {name: "At Higher Levels", transform: (it) => Renderer.get().render({type: "entries", entries: (it || [])}, 1), flex: 2}
		},
		{generator: ListUtil.basicFilterGenerator},
		(a, b) => SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source)
	);
}

let list;
let subList;
let spellBookView;

async function pPageInit (loadedSources) {
	Object.keys(loadedSources)
		.map(src => new FilterItem({item: src, changeFn: loadSource(JSON_LIST_NAME, addSpells)}))
		.forEach(fi => spellsPage._pageFilter.sourceFilter.addItem(fi));

	list = ListUtil.initList({
		listClass: "spells",
		fnSort: PageFilterSpells.sortSpells
	});
	ListUtil.setOptions({primaryLists: [list]});
	SortUtil.initBtnSortHandlers($(`#filtertools`), list);

	const $outVisibleResults = $(`.lst__wrp-search-visible`);
	list.on("updated", () => {
		$outVisibleResults.html(`${list.visibleItems.length}/${list.items.length}`);
	});

	// filtering function
	$(spellsPage._pageFilter.filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		spellsPage.handleFilterChange.bind(spellsPage)
	);

	subList = ListUtil.initSublist({
		listClass: "subspells",
		fnSort: PageFilterSpells.sortSpells
	});
	SortUtil.initBtnSortHandlers($("#sublistsort"), subList);
	ListUtil.initGenericPinnable();

	spellBookView = new BookModeView({
		hashKey: "bookview",
		$openBtn: $(`#btn-spellbook`),
		noneVisibleMsg: "If you wish to view multiple spells, please first make a list",
		pageTitle: "Spells Book View",
		popTblGetNumShown: ($wrpContent, $dispName, $wrpControls) => {
			const toShow = ListUtil.getSublistedIds().map(id => spellList[id])
				.sort((a, b) => SortUtil.ascSortLower(a.name, b.name));

			const renderSpell = (stack, sp) => {
				stack.push(`<div class="bkmv__wrp-item"><table class="stats stats--book stats--bkmv"><tbody>`);
				stack.push(Renderer.spell.getCompactRenderedString(sp));
				stack.push(`</tbody></table></div>`);
			};

			const lastOrder = StorageUtil.syncGetForPage(SpellsPage._BOOK_VIEW_MODE_K);

			const $selSortMode = $(`<select class="form-control">
				<option value="0">Spell Level</option>
				<option value="1">Alphabetical</option>
			</select>`)
				.change(() => {
					if (!toShow.length && Hist.lastLoadedId != null) return;

					const val = Number($selSortMode.val());
					if (val === 0) renderByLevel();
					else renderByAlpha();

					StorageUtil.syncSetForPage(SpellsPage._BOOK_VIEW_MODE_K, val);
				});
			if (lastOrder != null) $selSortMode.val(lastOrder);

			$$`<div class="flex-vh-center ml-3"><div class="mr-2 no-wrap">Sort order:</div>${$selSortMode}</div>`.appendTo($wrpControls);

			const renderByLevel = () => {
				const stack = [];
				for (let i = 0; i < 10; ++i) {
					const atLvl = toShow.filter(sp => sp.level === i);
					if (atLvl.length) {
						stack.push(`<div class="w-100 h-100 bkmv__no-breaks">`);
						stack.push(`<div class="bkmv__spacer-name flex-v-center no-shrink">${Parser.spLevelToFullLevelText(i)}</div>`);
						atLvl.forEach(sp => renderSpell(stack, sp));
						stack.push(`</div>`);
					}
				}
				$wrpContent.empty().append(stack.join(""));
			};

			const renderByAlpha = () => {
				const stack = [];
				toShow.forEach(sp => renderSpell(stack, sp));
				$wrpContent.empty().append(stack.join(""));
			};

			const renderNoneSelected = () => {
				const stack = [];
				stack.push(`<div class="w-100 h-100 no-breaks">`);
				const sp = spellList[Hist.lastLoadedId];
				renderSpell(stack, sp);
				$dispName.text(Parser.spLevelToFullLevelText(sp.level));
				stack.push(`</div>`);
				$wrpContent.empty().append(stack.join(""));
			};

			if (!toShow.length && Hist.lastLoadedId != null) renderNoneSelected();
			else if (lastOrder === 1) renderByAlpha();
			else renderByLevel();

			return toShow.length;
		},
		hasPrintColumns: true
	});

	const homebrew = await BrewUtil.pAddBrewData();
	BrewUtil.bind({pHandleBrew: () => {}}); // temporarily bind "do nothing" brew handler
	await BrewUtil.pAddLocalBrewData(); // load local homebrew, so we can add any local spell classes
	BrewUtil.bind({pHandleBrew: null}); // unbind temporary handler
	spellsPage._pageFilter.populateHomebrewClassLookup(homebrew);
}

let spellList = [];
let spI = 0;

const _addedHashes = new Set();
function addSpells (data) {
	if (!data || !data.length) return;

	spellList = spellList.concat(data);

	for (; spI < spellList.length; spI++) {
		const spell = spellList[spI];
		const listItem = spellsPage.getListItem(spell, spI);
		if (!listItem) continue;
		list.addItem(listItem);
	}
	list.update();

	spellsPage._pageFilter.filterBox.render();
	spellsPage.handleFilterChange();

	ListUtil.setOptions({
		itemList: spellList,
		getSublistRow: spellsPage.getSublistItem.bind(spellsPage),
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	Renderer.hover.bindPopoutButton(spellList);
	UrlUtil.bindLinkExportButton(spellsPage._pageFilter.filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton(sublistFuncPreload);
}

function sublistFuncPreload (json, funcOnload) {
	const loaded = Object.keys(loadedSources).filter(it => loadedSources[it].loaded);
	const lowerSources = json.sources.map(it => it.toLowerCase());
	const toLoad = Object.keys(loadedSources).filter(it => !loaded.includes(it)).filter(it => lowerSources.includes(it.toLowerCase()));
	const loadTotal = toLoad.length;
	if (loadTotal) {
		let loadCount = 0;
		toLoad.forEach(src => {
			loadSource(JSON_LIST_NAME, (spells) => {
				addSpells(spells);
				if (++loadCount === loadTotal) {
					funcOnload();
				}
			})(src, "yes");
		});
	} else {
		funcOnload();
	}
}

function handleUnknownHash (link, sub) {
	const src = Object.keys(loadedSources).find(src => src.toLowerCase() === decodeURIComponent(link.split(HASH_LIST_SEP)[1]).toLowerCase());
	if (src) {
		loadSource(JSON_LIST_NAME, (spells) => {
			addSpells(spells);
			Hist.hashChange();
		})(src, "yes");
	} else {
		Hist._freshLoad();
	}
}

const spellsPage = new SpellsPage();
window.addEventListener("load", () => spellsPage.pOnLoad());
