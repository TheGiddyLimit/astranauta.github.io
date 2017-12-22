"use strict";

const JSON_DIR = "data/spells/";
const JSON_LIST_NAME = "spell";

// toss these into the "Tags" section to save screen space
const META_ADD_CONC = "Concentration";
const META_ADD_V = "Verbal";
const META_ADD_S = "Somatic";
const META_ADD_M = "Material";
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
const TM_B_ACTION = "bonus action";
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
	if (time.length > 1) offset += 1;
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
	// TODO change "bonus action" to "bonus" in the JSON, and update this to match (will require updates to parsing functions also)
	let temp;
	if (time.number === 1 && TO_HIDE_SINGLETON_TIMES.includes(time.unit)) {
		temp = time.unit.uppercaseFirst();
	} else {
		temp = Parser.getTimeToFull(time);
	}
	if (temp.toLowerCase().endsWith("bonus action")) temp = temp.substr(0, temp.length - 4) + "n.";
	return temp;
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
	return out;
}

function ascSortSpellLevel (a, b) {
	if (a === b) return 0;
	if (a === STR_CANTRIP) return -1;
	if (b === STR_CANTRIP) return 1;
	return ascSort(a, b);
}

window.onload = function load () {
	multisourceLoad(JSON_DIR, JSON_LIST_NAME, pageInit, addSpells)
};

let list;
const sourceFilter = getSourceFilter();
const levelFilter = new Filter({header: "Level", displayFn: getFltrSpellLevelStr});
const classFilter = new Filter({header: "Class"});
const subclassFilter = new Filter({header: "Subclass"});
const classAndSubclassFilter = new MultiFilter("Classes", classFilter, subclassFilter);
const metaFilter = new Filter({
	header: "Tag",
	items: [META_ADD_CONC, META_ADD_V, META_ADD_S, META_ADD_M, META_RITUAL, META_TECHNOMAGIC]
});
const schoolFilter = new Filter({header: "School", displayFn: Parser.spSchoolAbvToFull});
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
	timeFilter,
	rangeFilter
);

function pageInit (loadedSources) {
	tableDefault = $("#stats").html();

	sourceFilter.items = Object.keys(loadedSources).map(src => new FilterItem(src, loadSource(JSON_LIST_NAME, addSpells)));
	sourceFilter.items.sort(ascSort);

	list = search({
		valueNames: ["name", "source", "level", "time", "school", "range", "classes"],
		listClass: "spells"
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
}

function handleFilterChange () {
	list.filter(function (item) {
		const f = filterBox.getValues();
		const s = spellList[$(item.elm).attr(FLTR_ID)];

		return sourceFilter.toDisplay(f, s.source) && levelFilter.toDisplay(f, s.level) && metaFilter.toDisplay(f, s._fMeta) && schoolFilter.toDisplay(f, s.school) && timeFilter.toDisplay(f, s._fTimeType) && rangeFilter.toDisplay(f, s._fRangeType) && classAndSubclassFilter.toDisplay(f, s._fClasses, s._fSubclasses);
	});
}

let spellList = [];
let spI = 0;

function addSpells (data) {
	spellList = spellList.concat(data);

	const spellTable = $("ul.spells");
	let tempString = "";
	for (; spI < spellList.length; spI++) {
		const spell = spellList[spI];

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

		// used for sorting
		spell[P_NORMALISED_TIME] = getNormalisedTime(spell.time);
		spell[P_NORMALISED_RANGE] = getNormalisedRange(spell.range);

		// used for filtering
		spell._fMeta = getMetaFilterObj(spell);
		spell._fClasses = spell.classes.fromClassList.map(c => getClassFilterStr(c));
		spell._fSubclasses = spell.classes.fromSubclass ? spell.classes.fromSubclass.map(c => getClassFilterStr(c.subclass)) : [];
		spell._fTimeType = spell.time.map(t => t.unit);
		spell._fRangeType = getRangeType(spell.range);

		// populate table
		tempString += `
			<li class='row' ${FLTR_ID}="${spI}">
				<a id='${spI}' href='#${encodeForHash([spell.name, spell.source])}' title="${spell.name}">
					<span class='name col-xs-3 col-xs-3-5'>${spell.name}</span>
					<span class='source col-xs-1 col-xs-1-7 source${Parser.stringToCasedSlug(spell.source)}' title="${Parser.sourceJsonToFull(spell.source)}">${Parser.sourceJsonToAbv(spell.source)}</span>
					<span class='level col-xs-1 col-xs-1-5'>${levelText}</span>
					<span class='time col-xs-1 col-xs-1-7' title="${Parser.spTimeListToFull(spell.time)}">${getTblTimeStr(spell.time[0])}</span>
					<span class='school col-xs-1 col-xs-1-2 school_${spell.school}' title="${Parser.spSchoolAbvToFull(spell.school)}">${Parser.spSchoolAbvToShort(spell.school)}</span>
					<span class='range col-xs-2 col-xs-2-4'>${Parser.spRangeToFull(spell.range)}</span>
					
					<span class='classes' style='display: none'>${Parser.spClassesToFull(spell.classes)}</span>
				</a>
			</li>`;

		// populate filters
		levelFilter.addIfAbsent(spell.level);
		schoolFilter.addIfAbsent(spell.school);
		spell._fClasses.forEach(c => classFilter.addIfAbsent(c));
		spell._fSubclasses.forEach(sc => subclassFilter.addIfAbsent(sc));
	}

	let lastSearch = null;
	if (list.searched) {
		lastSearch = $(`#search`).val();
		list.search("");
	}

	spellTable.append(tempString);

	// sort filters
	levelFilter.items.sort(ascSortSpellLevel);
	schoolFilter.items.sort(ascSort);
	classFilter.items.sort(ascSort);
	subclassFilter.items.sort(ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");

	filterBox.render();
}

function sortSpells (a, b, o) {
	a = spellList[a.elm.getAttribute(FLTR_ID)];
	b = spellList[b.elm.getAttribute(FLTR_ID)];

	if (o.valueName === "name") {
		return fallback();
	}

	if (o.valueName === "source") {
		const bySrc = ascSort(a.source, b.source);
		return bySrc !== 0 ? bySrc : ascSort(a.name, b.name);
	}

	if (o.valueName === "level") {
		return orFallback(ascSort, P_LEVEL);
	}

	if (o.valueName === "time") {
		return orFallback(ascSort, P_NORMALISED_TIME);
	}

	if (o.valueName === "school") {
		return orFallback(ascSort, P_SCHOOL);
	}

	if (o.valueName === "range") {
		return orFallback(ascSort, P_NORMALISED_RANGE);
	}

	return 0;

	function byName () {
		return ascSort(a.name, b.name);
	}

	function bySource () {
		return ascSort(a.source, b.source);
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

const renderer = new EntryRenderer();

function loadhash (id) {
	$("#stats").html(tableDefault);
	const spell = spellList[id];

	const renderStack = [];

	renderStack.push(`<tr><th id="name" colspan="6"><span class="stats-name">${spell.name}</span><span class="stats-source source${spell.source}" title="${Parser.sourceJsonToFull(spell.source)}">${Parser.sourceJsonToAbv(spell.source)}</span></th></tr>`);

	renderStack.push(`<tr><td id="levelschoolritual" colspan="6"><span>${Parser.spLevelSchoolMetaToFull(spell.level, spell.school, spell.meta)}</span></td></tr>`);

	renderStack.push(`<tr><td id="castingtime" colspan="6"><span class="bold">Casting Time: </span>${Parser.spTimeListToFull(spell.time)}</td></tr>`);

	renderStack.push(`<tr><td id="range" colspan="6"><span class="bold">Range: </span>${Parser.spRangeToFull(spell.range)}</td></tr>`);

	renderStack.push(`<tr><td id="components" colspan="6"><span class="bold">Components: </span>${Parser.spComponentsToFull(spell.components)}</td></tr>`);

	renderStack.push(`<tr><td id="range" colspan="6"><span class="bold">Duration: </span>${Parser.spDurationToFull(spell.duration)}</td></tr>`);

	renderStack.push(`<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>`);

	const entryList = {type: "entries", entries: spell.entries};

	renderStack.push(`<tr class='text'><td colspan='6' class='text'>`);
	renderer.recursiveEntryRender(entryList, renderStack, 1);

	if (spell.entriesHigherLevel) {
		const higherLevelsEntryList = {type: "entries", entries: spell.entriesHigherLevel};
		renderer.recursiveEntryRender(higherLevelsEntryList, renderStack, 2);
	}

	renderStack.push(`</td></tr>`);

	renderStack.push(`<tr class="text"><td id="classes" colspan="6"><span class="bold">Classes: </span>${Parser.spMainClassesToFull(spell.classes)}</td></tr>`);

	if (spell.classes.fromSubclass) {
		const currentAndLegacy = Parser.spSubclassesToCurrentAndLegacyFull(spell.classes);
		renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Subclasses: </span>${currentAndLegacy[0]}</td></tr>`);
		if (currentAndLegacy[1]) {
			renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted"><span class="bold">Subclasses (legacy): </span>${currentAndLegacy[1]}</section></td></tr>`);
		}
	}

	if (spell.scrollNote) {
		renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted">`);
		renderer.recursiveEntryRender(
			`{@italic Note: Both the {@class ${STR_FIGHTER} (${STR_ELD_KNIGHT})} and the {@class ${STR_ROGUE} (${STR_ARC_TCKER})} spell lists include all {@class ${STR_WIZARD}} spells. Spells of 5th level or higher may be cast with the aid of a spell scroll or similar.}`
			, renderStack, 2);
		renderStack.push(`</section></td></tr>`);
	}

	const topBorder = $("#topBorder");
	topBorder.after(renderStack.join(""));
}
