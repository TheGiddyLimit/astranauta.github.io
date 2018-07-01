"use strict";

const JSON_DIR = "data/spells/";
const JSON_LIST_NAME = "spell";

// toss these into the "Tags" section to save screen space
const META_ADD_CONC = "Concentration";
const META_ADD_V = "Verbal";
const META_ADD_S = "Somatic";
const META_ADD_M = "Material";
const META_ADD_M_COST = "Material with Cost";
const META_ADD_MB_PERMANENT = "Permanent Effects";
// real meta tags
const META_RITUAL = "Ritual";
const META_TECHNOMAGIC = "Technomagic";

const P_LEVEL = "level";
const P_NORMALISED_TIME = "normalisedTime";
const P_SCHOOL = "school";
const P_NORMALISED_RANGE = "normalisedRange";

const STR_WIZARD = "Wizard";
const STR_FIGHTER = "Fighter";
const STR_ROGUE = "Rogue";
const STR_CLERIC = "Cleric";
const STR_SORCERER = "Sorcerer";
const STR_ELD_KNIGHT = "Eldritch Knight";
const STR_ARC_TCKER = "Arcane Trickster";
const STR_DIV_SOUL = "Divine Soul";
const STR_FAV_SOUL_V2 = "Favored Soul v2 (UA)";
const STR_FAV_SOUL_V3 = "Favored Soul v3 (UA)";

const TM_ACTION = "action";
const TM_B_ACTION = "bonus";
const TM_REACTION = "reaction";
const TM_ROUND = "round";
const TM_MINS = "minute";
const TM_HRS = "hour";
const TO_HIDE_SINGLETON_TIMES = [TM_ACTION, TM_B_ACTION, TM_REACTION, TM_ROUND];
const TIME_UNITS_TO_FULL = {};
TIME_UNITS_TO_FULL[TM_ACTION] = "Action";
TIME_UNITS_TO_FULL[TM_B_ACTION] = "Bonus Action";
TIME_UNITS_TO_FULL[TM_REACTION] = "Reaction";
TIME_UNITS_TO_FULL[TM_ROUND] = "Rounds";
TIME_UNITS_TO_FULL[TM_MINS] = "Minutes";
TIME_UNITS_TO_FULL[TM_HRS] = "Hours";

const F_RNG_POINT = "Point";
const F_RNG_SELF_AREA = "Self (Area)";
const F_RNG_SELF = "Self";
const F_RNG_TOUCH = "Touch";
const F_RNG_SPECIAL = "Special";

let tableDefault;

function getFltrSpellLevelStr (level) {
	return level === 0 ? Parser.spLevelToFull(level) : Parser.spLevelToFull(level) + " level";
}

function getNormalisedTime (time) {
	const firstTime = time[0];
	let multiplier = 1;
	let offset = 0;
	switch (firstTime.unit) {
		case TM_B_ACTION:
			offset = 1;
			break;
		case TM_REACTION:
			offset = 2;
			break;
		case TM_ROUND:
			multiplier = 6;
			break;
		case TM_MINS:
			multiplier = 60;
			break;
		case TM_HRS:
			multiplier = 3600;
			break;
	}
	if (time.length > 1) offset += 0.5;
	return (multiplier * firstTime.number) + offset;
}

const INCHES_PER_FOOT = 12;
const FEET_PER_MILE = 5280;

function getNormalisedRange (range) {
	let multiplier = 1;
	let distance = 0;
	let offset = 0;

	switch (range.type) {
		case RNG_SPECIAL:
			return 1000000000;
		case RNG_POINT:
			adjustForDistance();
			break;
		case RNG_LINE:
			offset = 1;
			adjustForDistance();
			break;
		case RNG_CONE:
			offset = 2;
			adjustForDistance();
			break;
		case RNG_RADIUS:
			offset = 3;
			adjustForDistance();
			break;
		case RNG_HEMISPHERE:
			offset = 4;
			adjustForDistance();
			break;
		case RNG_SPHERE:
			offset = 5;
			adjustForDistance();
			break;
		case RNG_CUBE:
			offset = 6;
			adjustForDistance();
			break;
	}

	// value in inches, to allow greater granularity
	return (multiplier * distance) + offset;

	function adjustForDistance () {
		const dist = range.distance;
		switch (dist.type) {
			case UNT_FEET:
				multiplier = INCHES_PER_FOOT;
				distance = dist.amount;
				break;
			case UNT_MILES:
				multiplier = INCHES_PER_FOOT * FEET_PER_MILE;
				distance = dist.amount;
				break;
			case RNG_SELF:
				distance = 0;
				break;
			case RNG_TOUCH:
				distance = 1;
				break;
			case RNG_SIGHT:
				multiplier = FEET_PER_MILE * FEET_PER_MILE;
				distance = 12; // assume sight range of person ~100 ft. above the ground
				break;
			case RNG_UNLIMITED_SAME_PLANE: // from BolS, if/when it gets restored
				distance = 900000000;
				break;
			case RNG_UNLIMITED:
				distance = 900000001;
				break;
		}
	}
}

function getRangeType (range) {
	switch (range.type) {
		case RNG_SPECIAL:
			return F_RNG_SPECIAL;
		case RNG_POINT:
			switch (range.distance.type) {
				case RNG_SELF:
					return F_RNG_SELF;
				case RNG_TOUCH:
					return F_RNG_TOUCH;
				default:
					return F_RNG_POINT;
			}
		case RNG_LINE:
		case RNG_CONE:
		case RNG_RADIUS:
		case RNG_HEMISPHERE:
		case RNG_SPHERE:
		case RNG_CUBE:
			return F_RNG_SELF_AREA
	}
}

function getTblTimeStr (time) {
	return (time.number === 1 && TO_HIDE_SINGLETON_TIMES.includes(time.unit))
		? `${time.unit.uppercaseFirst()}${time.unit === TM_B_ACTION ? " acn." : ""}`
		: `${time.number} ${time.unit === TM_B_ACTION ? "Bonus acn." : time.unit}${time.number > 1 ? "s" : ""}`.uppercaseFirst();
}

function getTimeDisplay (timeUnit) {
	return TIME_UNITS_TO_FULL[timeUnit];
}

function getClassFilterStr (c) {
	const nm = c.name.split("(")[0].trim();
	return `${nm}${c.source !== SRC_PHB ? ` (${Parser.sourceJsonToAbv(c.source)})` : ""}`;
}

function getMetaFilterObj (s) {
	const out = [];
	if (s.meta && s.meta.ritual) out.push(META_RITUAL);
	if (s.meta && s.meta.technomagic) out.push(META_TECHNOMAGIC);
	if (s.duration.filter(d => d.concentration).length) out.push(META_ADD_CONC);
	if (s.components.v) out.push(META_ADD_V);
	if (s.components.s) out.push(META_ADD_S);
	if (s.components.m) out.push(META_ADD_M);
	if (s.components.m && s.components.m.cost) out.push(META_ADD_M_COST);
	if (s.permanentEffects || s.duration.filter(it => it.type === "permanent").length) out.push(META_ADD_MB_PERMANENT);
	return out;
}

function getFilterAbilitySave (ability) {
	return `${ability.uppercaseFirst().substring(0, 3)}. Save`;
}

function getFilterAbilityCheck (ability) {
	return `${ability.uppercaseFirst().substring(0, 3)}. Check`;
}

function handleBrew (homebrew) {
	addSpells(homebrew.spell);
}

window.onload = function load () {
	ExcludeUtil.initialise();
	multisourceLoad(JSON_DIR, JSON_LIST_NAME, pageInit, addSpells, () => {
		BrewUtil.addBrewData(handleBrew);
		BrewUtil.makeBrewButton("manage-brew");
		BrewUtil.bind({list, filterBox, sourceFilter});
		ListUtil.loadState();
	});
};

let list;
let spellBookView;
let brewSpellClasses;
const sourceFilter = getSourceFilter();
const levelFilter = new Filter({
	header: "Level",
	items: [
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9
	],
	displayFn: getFltrSpellLevelStr
});
const classFilter = new Filter({header: "Class"});
const subclassFilter = new GroupedFilter({
	header: "Subclass",
	numGroups: 2
});
const classAndSubclassFilter = new MultiFilter("Classes", classFilter, subclassFilter);
const metaFilter = new Filter({
	header: "Components/Miscellaneous",
	items: [META_ADD_CONC, META_ADD_V, META_ADD_S, META_ADD_M, META_ADD_M_COST, META_RITUAL, META_TECHNOMAGIC, META_ADD_MB_PERMANENT]
});
const schoolFilter = new Filter({
	header: "School",
	items: [
		SKL_ABV_ABJ,
		SKL_ABV_CON,
		SKL_ABV_DIV,
		SKL_ABV_ENC,
		SKL_ABV_EVO,
		SKL_ABV_ILL,
		SKL_ABV_NEC,
		SKL_ABV_TRA
	],
	displayFn: Parser.spSchoolAbvToFull}
);
const damageFilter = new Filter({
	header: "Damage Type",
	items: [
		"acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"
	],
	displayFn: StrUtil.uppercaseFirst
});
const saveFilter = new Filter({
	header: "Saving Throw",
	items: ["strength", "constitution", "dexterity", "intelligence", "wisdom", "charisma"],
	displayFn: getFilterAbilitySave
});
const checkFilter = new Filter({
	header: "Opposed Ability Check",
	items: ["strength", "constitution", "dexterity", "intelligence", "wisdom", "charisma"],
	displayFn: getFilterAbilityCheck
});
const timeFilter = new Filter({
	header: "Cast Time",
	items: [
		TM_ACTION,
		TM_B_ACTION,
		TM_REACTION,
		TM_ROUND,
		TM_MINS,
		TM_HRS
	],
	displayFn: getTimeDisplay
});
const durationFilter = new Filter({
	header: "Duration",
	items: [
		"instant",
		"timed",
		"permanent",
		"special"
	],
	displayFn: StrUtil.uppercaseFirst
});
const rangeFilter = new Filter({
	header: "Range",
	items: [
		F_RNG_SELF,
		F_RNG_TOUCH,
		F_RNG_POINT,
		F_RNG_SELF_AREA,
		F_RNG_SPECIAL
	]
});
const filterBox = initFilterBox(
	sourceFilter,
	levelFilter,
	classAndSubclassFilter,
	metaFilter,
	schoolFilter,
	damageFilter,
	saveFilter,
	checkFilter,
	timeFilter,
	durationFilter,
	rangeFilter
);

function pageInit (loadedSources) {
	tableDefault = $("#pagecontent").html();

	sourceFilter.items = Object.keys(loadedSources).map(src => new FilterItem(src, loadSource(JSON_LIST_NAME, addSpells)));
	sourceFilter.items.sort(SortUtil.ascSort);

	list = ListUtil.search({
		valueNames: ["name", "source", "level", "time", "school", "range", "classes", "uniqueid"],
		listClass: "spells"
	});
	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	$("#filtertools").find("button.sort").on(EVNT_CLICK, function () {
		const $this = $(this);
		if ($this.attr("sortby") === "asc") {
			$this.attr("sortby", "desc");
		} else $this.attr("sortby", "asc");
		list.sort($this.data("sort"), {order: $this.attr("sortby"), sortFunction: sortSpells});
	});

	const subList = ListUtil.initSublist({
		valueNames: ["name", "level", "time", "school", "range", "id"],
		listClass: "subspells",
		sortFunction: sortSpells
	});
	ListUtil.initGenericPinnable();

	spellBookView = new BookModeView("bookview", $(`#btn-spellbook`), "Please pin some spells first",
		($tbl) => {
			const toShow = ListUtil.getSublistedIds().map(id => spellList[id]);
			let numShown = 0;
			const stack = [];
			for (let i = 0; i < 10; ++i) {
				const atLvl = toShow.filter(sp => sp.level === i);
				if (atLvl.length) {
					const levelText = i === 0 ? `${Parser.spLevelToFull(i)}s` : `${Parser.spLevelToFull(i)}-level Spells`;
					stack.push(EntryRenderer.utils.getBorderTr(`<span class="spacer-name">${levelText}</span>`));

					stack.push(`<tr class="spellbook-level"><td>`);
					atLvl.forEach(sp => {
						stack.push(`<table class="spellbook-entry"><tbody>`);
						stack.push(EntryRenderer.spell.getCompactRenderedString(sp));
						stack.push(`</tbody></table>`);
					});
					stack.push(`</td></tr>`);
				}
				numShown += atLvl.length;
			}
			$tbl.append(stack.join(""));
			return numShown;
		}
	);

	// load homebrew class spell list addons
	brewSpellClasses = {PHB: {}};
	BrewUtil.addBrewData((homebrew) => {
		function handleSubclass (className, classSource = SRC_PHB, sc) {
			if (sc.subclassSpells) {
				sc.subclassSpells.forEach(it => {
					const name = typeof it === "string" ? it : it.name;
					const source = typeof it === "string" ? "PHB" : it.source;
					brewSpellClasses[source] = brewSpellClasses[source] || {fromClassList: [], fromSubclass: []};
					brewSpellClasses[source][name] = brewSpellClasses[source][name] || {fromClassList: [], fromSubclass: []};
					brewSpellClasses[source][name].fromSubclass.push({
						class: {
							name: className,
							source: classSource
						},
						subclass: {
							name: sc.shortName,
							source: sc.source
						}
					});
				});
			}
		}

		if (homebrew.class) {
			homebrew.class.forEach(c => {
				if (c.classSpells) {
					c.classSpells.forEach(it => {
						const name = typeof it === "string" ? it : it.name;
						const source = typeof it === "string" ? "PHB" : it.source;
						brewSpellClasses[source] = brewSpellClasses[source] || {};
						brewSpellClasses[source][name] = brewSpellClasses[source][name] || {fromClassList: [], fromSubclass: []};
						brewSpellClasses[source][name].fromClassList.push({name: c.name, source: c.source});
					});
				}
				if (c.subclasses) c.subclasses.forEach(sc => handleSubclass(c.name, c.source, sc));
			})
		}
		if (homebrew.subclass) homebrew.subclass.forEach(sc => handleSubclass(sc.class, sc.classSource, sc));
	});
}

function getSublistItem (spell, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(spell)}" title="${spell.name}">
				<span class="name col-xs-3 col-xs-3-9">${spell.name}</span>
				<span class="level col-xs-1 col-xs-1-5">${Parser.spLevelToFull(spell.level)}</span>
				<span class="time col-xs-1 col-xs-1-8">${getTblTimeStr(spell.time[0])}</span>
				<span class="school col-xs-1 col-xs-1-2 school_${spell.school}" title="${Parser.spSchoolAbvToFull(spell.school)}">${Parser.spSchoolAbvToShort(spell.school)}</span>
				<span class="range col-xs-3 col-xs-3-6">${Parser.spRangeToFull(spell.range)}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(item => {
		const s = spellList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			s.source,
			s.level,
			[s._fClasses, s._fSubclasses],
			s._fMeta,
			s.school,
			s.damageInflict,
			s.savingThrow,
			s.opposedCheck,
			s._fTimeType,
			s._fDurationType,
			s._fRangeType
		);
	});
	onFilterChangeMulti(spellList);
}

let spellList = [];
let spI = 0;

function addSpells (data) {
	if (!data || !data.length) return;

	spellList = spellList.concat(data);

	const spellTable = $("ul.spells");
	let tempString = "";
	for (; spI < spellList.length; spI++) {
		const spell = spellList[spI];
		if (ExcludeUtil.isExcluded(spell.name, "spell", spell.source)) continue;

		let levelText = Parser.spLevelToFull(spell.level);
		if (spell.meta && spell.meta.ritual) levelText += " (rit.)";
		if (spell.meta && spell.meta.technomagic) levelText += " (tec.)";

		// add eldritch knight and arcane trickster
		if (spell.classes.fromClassList.filter(c => c.name === STR_WIZARD && c.source === SRC_PHB).length) {
			if (!spell.classes.fromSubclass) spell.classes.fromSubclass = [];
			spell.classes.fromSubclass.push({
				class: {name: STR_FIGHTER, source: SRC_PHB},
				subclass: {name: STR_ELD_KNIGHT, source: SRC_PHB}
			});
			spell.classes.fromSubclass.push({
				class: {name: STR_ROGUE, source: SRC_PHB},
				subclass: {name: STR_ARC_TCKER, source: SRC_PHB}
			});
			if (spell.level > 4) {
				spell.scrollNote = true;
			}
		}

		// add divine soul, favored soul v2, favored soul v3
		if (spell.classes.fromClassList.filter(c => c.name === STR_CLERIC && c.source === SRC_PHB).length) {
			if (!spell.classes.fromSubclass) spell.classes.fromSubclass = [];
			spell.classes.fromSubclass.push({
				class: {name: STR_SORCERER, source: SRC_PHB},
				subclass: {name: STR_DIV_SOUL, source: SRC_XGE}
			});
			spell.classes.fromSubclass.push({
				class: {name: STR_SORCERER, source: SRC_PHB},
				subclass: {name: STR_FAV_SOUL_V2, source: SRC_UAS}
			});
			spell.classes.fromSubclass.push({
				class: {name: STR_SORCERER, source: SRC_PHB},
				subclass: {name: STR_FAV_SOUL_V3, source: SRC_UARSC}
			});
		}

		// add homebrew class/subclass
		if (brewSpellClasses[spell.source] && brewSpellClasses[spell.source][spell.name]) {
			spell.classes = spell.classes || {};
			if (brewSpellClasses[spell.source][spell.name].fromClassList.length) {
				spell.classes.fromClassList = spell.classes.fromClassList || [];
				spell.classes.fromClassList = spell.classes.fromClassList.concat(brewSpellClasses[spell.source][spell.name].fromClassList);
			}
			if (brewSpellClasses[spell.source][spell.name].fromSubclass.length) {
				spell.classes.fromSubclass = spell.classes.fromSubclass || [];
				spell.classes.fromSubclass = spell.classes.fromSubclass.concat(brewSpellClasses[spell.source][spell.name].fromSubclass);
			}
		}

		// used for sorting
		spell[P_NORMALISED_TIME] = getNormalisedTime(spell.time);
		spell[P_NORMALISED_RANGE] = getNormalisedRange(spell.range);

		// used for filtering
		if (!spell.damageInflict) spell.damageInflict = [];
		spell._fMeta = getMetaFilterObj(spell);
		spell._fClasses = spell.classes.fromClassList.map(c => getClassFilterStr(c));
		spell._fSubclasses = spell.classes.fromSubclass
			? spell.classes.fromSubclass.map(c => new FilterItem(
				getClassFilterStr(c.subclass),
				null,
				SourceUtil.hasBeenReprinted(c.subclass.name, c.subclass.source) || Parser.sourceJsonToFull(c.subclass.source).startsWith(UA_PREFIX) || Parser.sourceJsonToFull(c.subclass.source).startsWith(PS_PREFIX)
			))
			: [];
		spell._fTimeType = spell.time.map(t => t.unit);
		spell._fDurationType = spell.duration.map(t => t.type);
		spell._fRangeType = getRangeType(spell.range);

		// populate table
		tempString += `
			<li class="row" ${FLTR_ID}="${spI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${spI}" href="#${UrlUtil.autoEncodeHash(spell)}" title="${spell.name}">
					<span class="name col-xs-3 col-xs-3-5">${spell.name}</span>
					<span class="source col-xs-1 col-xs-1-7 source${Parser.stringToCasedSlug(spell.source)}" title="${Parser.sourceJsonToFull(spell.source)}">${Parser.sourceJsonToAbv(spell.source)}</span>
					<span class="level col-xs-1 col-xs-1-5">${levelText}</span>
					<span class="time col-xs-1 col-xs-1-7">${getTblTimeStr(spell.time[0])}</span>
					<span class="school col-xs-1 col-xs-1-2 school_${spell.school}" title="${Parser.spSchoolAbvToFull(spell.school)}">${Parser.spSchoolAbvToShort(spell.school)}</span>
					<span class="range col-xs-2 col-xs-2-4">${Parser.spRangeToFull(spell.range)}</span>

					<span class="classes" style="display: none">${Parser.spClassesToFull(spell.classes, true)}</span>
					<span class="uniqueid hidden">${spell.uniqueId ? spell.uniqueId : spI}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(new FilterItem(spell.source, () => {}));
		spell._fClasses.forEach(c => classFilter.addIfAbsent(c));
		spell._fSubclasses.forEach(sc => subclassFilter.addIfAbsent(sc));
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	spellTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);
	classFilter.items.sort(SortUtil.ascSort);
	subclassFilter.items.sort(SortUtil.ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: spellList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(spellList);
	UrlUtil.bindLinkExportButton(filterBox);
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

function sortSpells (a, b, o) {
	a = spellList[a.elm.getAttribute(FLTR_ID)];
	b = spellList[b.elm.getAttribute(FLTR_ID)];

	if (o.valueName === "name") {
		return fallback();
	}

	if (o.valueName === "source") {
		const bySrc = SortUtil.ascSort(a.source, b.source);
		return bySrc !== 0 ? bySrc : SortUtil.ascSort(a.name, b.name);
	}

	if (o.valueName === "level") {
		return orFallback(SortUtil.ascSort, P_LEVEL);
	}

	if (o.valueName === "time") {
		return orFallback(SortUtil.ascSort, P_NORMALISED_TIME);
	}

	if (o.valueName === "school") {
		return orFallback(SortUtil.ascSort, P_SCHOOL);
	}

	if (o.valueName === "range") {
		return orFallback(SortUtil.ascSort, P_NORMALISED_RANGE);
	}

	return 0;

	function byName () {
		return SortUtil.ascSort(a.name, b.name);
	}

	function bySource () {
		return SortUtil.ascSort(a.source, b.source);
	}

	function fallback () {
		const onName = byName();
		return onName !== 0 ? onName : bySource();
	}

	function orFallback (func, prop) {
		const initial = func(a[prop], b[prop]);
		return initial !== 0 ? initial : fallback();
	}
}

const renderer = EntryRenderer.getDefaultRenderer();
function loadhash (id) {
	renderer.setFirstSection(true);
	const $pageContent = $("#pagecontent").empty();
	const spell = spellList[id];
	$pageContent.append(EntryRenderer.spell.getRenderedString(spell, renderer));
	loadsub([]);
}

function handleUnknownHash (link, sub) {
	const src = Object.keys(loadedSources).find(src => src.toLowerCase() === decodeURIComponent(link.split(HASH_LIST_SEP)[1]).toLowerCase());
	if (src) {
		loadSource(JSON_LIST_NAME, (spells) => {
			addSpells(spells);
			History.hashChange();
		})(src, "yes");
	} else {
		History._freshLoad();
	}
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub, sublistFuncPreload);

	const bookViewHash = sub.find(it => it.startsWith(spellBookView.hashKey));
	if (bookViewHash && UrlUtil.unpackSubHash(bookViewHash)[spellBookView.hashKey][0] === "true") spellBookView.open();
	else spellBookView.teardown();
}