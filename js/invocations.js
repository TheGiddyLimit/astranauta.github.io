"use strict";

const JSON_URL = "data/invocations-test.json";

const STR_JOIN_MODE_LIST = ",";
const STR_JOIN_MODE_TITLE_BRACKET_PART_LIST = "; ";
const STR_JOIN_MODE_TITLE = " ";

const STR_PACT_NONE = "Any";
const STR_PATRON_NONE = "Any";
const STR_LEVEL_NONE = "Any";
const STR_SPELL_NONE = "None";

const TMP_HIDDEN_MODE = `"{0}"`;

const ID_INVOCATION_LIST = "invocationsList"
const ID_STATS_NAME = "name";
const ID_STATS_PREREQUISITES = "prerequisites";
const ID_TEXT = "text";

const JSON_ITEM_NAME = "name";
const JSON_ITEM_SOURCE = "source";
const JSON_ITEM_PATRON = "patron";
const JSON_ITEM_PACT = "pact";
const JSON_ITEM_LEVEL = "level";
const JSON_ITEM_SPELL = "spell";
const JSON_ITEM_TEXT = "text";
const JSON_ITEM_PREREQUISITES = "prerequisites";

const CLS_INVOCATION = "invocations";
const CLS_ROW = "row";
const CLS_COL1 = "col-xs-4";
const CLS_COL2 = "col-xs-2";
const CLS_COL3 = "col-xs-3";
const CLS_COL4 = "col-xs-3";
const CLS_COL5 = "col-xs-2";
const CLS_COL6 = "col-xs-2";
const CLS_HIDDEN = "hidden";
const CLS_LI_NONE = "list-entry-none";

const LIST_NAME = "name";
const LIST_SOURCE = "source";
const LIST_PATRON = "patron";
const LIST_PACT = "pact";
const LIST_LEVEL = "level";
const LIST_SPELL = "spell";


window.onload = function load() {
	loadJSON(JSON_URL, onJsonLoad);
};

function parselevel (level) {
	if (isNaN (level)) return "";
	if (level === "2") return level+"nd";
	if (level === "3") return level+"rd";
	if (level === "1") return level+"st";
	return level+"th";
}

function parseSpell (spell) {
	if (spell === "Eldritch Blast") return spell+" cantrip";
	if (spell === "Hex/Curse") return "Hex spell or a warlock feature that curses";
	if (spell === undefined) return STR_SPELL_NONE;
	return STR_SPELL_NONE
}

function parsePact (pact) {
	if (pact === "Chain") return "Pact of the Chain";
	if (pact === "Tome") return "Pact of the Tome";
	if (pact === "Blade") return "Pact of the Blade";
	if (pact === undefined) return STR_PACT_NONE;
	return STR_PACT_NONE;
}

function parsePatron (patron) {
	if (patron === STR_PATRON_NONE) return STR_PATRON_NONE;
	if (patron === undefined) return STR_PATRON_NONE;
	return "The "+patron;
}


let INVOCATION_LIST;
function onJsonLoad(data) {
	INVOCATION_LIST = data.invocation;

	const sourceFilter = getSourceFilter({
		deselFn: function(val) {
			return false;
		}
	});
	const patronFilter = new Filter({header: "Patron", items: ["Archfey", "Fiend", "Great Old One", "Hexblade", "Raven Queen", "Seeker", STR_PATRON_NONE], displayFn: parsePatron});
	const pactFilter = new Filter({header: "Pact", items: ["Chain", "Tome", "Blade", STR_PACT_NONE], displayFn: parsePact});
	const spellFilter = new Filter({header: "Spell or Feature", items: ["Eldritch Blast", "Hex/Curse", STR_SPELL_NONE]});
	const levelFilter = new Filter({header: "Warlock Level", items: ["5", "7", "9", "12", "15", "18", STR_LEVEL_NONE]});


	const filterBox = initFilterBox(sourceFilter, pactFilter, patronFilter, spellFilter, levelFilter);

	let tempString = "";
	INVOCATION_LIST.forEach(function(p, i) {
		//if (!p.prerequisites) p.pact = STR_PACT_NONE;
		if (!p.prerequisites) p.prerequisites = {};
		if (!p.prerequisites.pact) p.prerequisites.pact = STR_PACT_NONE;
		if (!p.prerequisites.patron) p.prerequisites.patron = STR_PATRON_NONE;
		if (!p.prerequisites.spell) p.prerequisites.spell = STR_SPELL_NONE;
		if (!p.prerequisites.level) p.prerequisites.level = STR_LEVEL_NONE;


		tempString += `
			<li class='row' ${FLTR_ID}="${i}">
				<a id='${i}' href='#${encodeForHash([p[JSON_ITEM_NAME], p[JSON_ITEM_SOURCE]])}' title="${p[JSON_ITEM_NAME]}">
					<span class='${LIST_NAME} ${CLS_COL1}'>${p[JSON_ITEM_NAME]}</span>
					<span class='${LIST_SOURCE} ${CLS_COL2} source${Parser.sourceJsonToAbv(p[JSON_ITEM_SOURCE])}' title="${Parser.sourceJsonToFull(p[JSON_ITEM_SOURCE])}">${Parser.sourceJsonToAbv(p[JSON_ITEM_SOURCE])}</span>
					<span class='${LIST_PACT} ${CLS_COL3} ${p[JSON_ITEM_PACT] === STR_PACT_NONE ? CLS_LI_NONE : STR_EMPTY}'>${parsePact(p[JSON_ITEM_PREREQUISITES][JSON_ITEM_PACT])}</span>
					<span class='${LIST_PATRON} ${CLS_COL4} ${p[JSON_ITEM_PATRON] === STR_PATRON_NONE ? CLS_LI_NONE : STR_EMPTY}'>${parsePatron(p[JSON_ITEM_PREREQUISITES][JSON_ITEM_PATRON])}</span>
				</a>
			</li>
		`;

		// populate filters
		sourceFilter.addIfAbsent(p[JSON_ITEM_SOURCE]);
	});
	$(`#${ID_INVOCATION_LIST}`).append(tempString);
	// sort filters
	sourceFilter.items.sort(ascSort);

	const list = search({
		valueNames: [LIST_NAME, LIST_SOURCE, LIST_PACT, LIST_PATRON, LIST_SPELL, LIST_LEVEL],
		listClass: CLS_INVOCATION,
		sortFunction: listSort
	});

	function listSort(itemA, itemB, options) {
		if (options.valueName === LIST_NAME) return compareBy(LIST_NAME);
		else return compareByOrDefault(options.valueName, LIST_NAME);

		function compareBy(valueName) {
			const aValue = itemA.values()[valueName].toLowerCase();
			const bValue = itemB.values()[valueName].toLowerCase();
			if (aValue === bValue) return 0;
			return (aValue > bValue) ? 1 : -1;
		}
		function compareByOrDefault(valueName, defaultValueName) {
			const initialCompare = compareBy(valueName);
			return initialCompare === 0 ? compareBy(defaultValueName) : initialCompare;
		}
	}

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function handleFilterChange() {
		list.filter(function (item) {
			const f = filterBox.getValues();
			const p = INVOCATION_LIST[$(item.elm).attr(FLTR_ID)];

			const rightSource = sourceFilter.toDisplay(f, p.source);
			const rightPact = pactFilter.toDisplay(f,p.prerequisites.pact);
			const rightPatron = patronFilter.toDisplay(f,p.prerequisites.patron);
			const rightSpell = spellFilter.toDisplay(f,p.prerequisites.spell);
			const rightLevel = levelFilter.toDisplay(f,p.prerequisites.level);
			return rightSource && rightPact && rightPatron && rightSpell && rightLevel;
		});
	}

	initHistory();
	handleFilterChange();
}

function loadhash (jsonIndex) {
	const STATS_NAME = document.getElementById(ID_STATS_NAME);
	const STATS_PREREQUISITES = document.getElementById(ID_STATS_PREREQUISITES);
	const STATS_TEXT = document.getElementById(ID_TEXT);

	const selectedInvocation = INVOCATION_LIST[jsonIndex];

	STATS_NAME.innerHTML = selectedInvocation[JSON_ITEM_NAME];

	loadInvocation();

	function loadInvocation() {

		const prereqs = [
		    selectedInvocation[JSON_ITEM_PREREQUISITES][JSON_ITEM_PATRON] === STR_PATRON_NONE  ? null : parsePatron(selectedInvocation[JSON_ITEM_PREREQUISITES][JSON_ITEM_PATRON])+` patron`,
		    selectedInvocation[JSON_ITEM_PREREQUISITES][JSON_ITEM_PACT] === STR_PACT_NONE  ? null : parsePact(selectedInvocation[JSON_ITEM_PREREQUISITES][JSON_ITEM_PACT]),
		    selectedInvocation[JSON_ITEM_PREREQUISITES][JSON_ITEM_LEVEL] === STR_LEVEL_NONE  ? null : parselevel(selectedInvocation[JSON_ITEM_PREREQUISITES][JSON_ITEM_LEVEL])+` level`,
		    selectedInvocation[JSON_ITEM_PREREQUISITES][JSON_ITEM_SPELL] === STR_SPELL_NONE  ? null : parseSpell(selectedInvocation[JSON_ITEM_PREREQUISITES][JSON_ITEM_SPELL]),
		].filter(f => f);
		STATS_PREREQUISITES.innerHTML = prereqs.length ? `Prerequisites: ${prereqs.join(", ")}` : "";

		STATS_TEXT.innerHTML = utils_combineText(selectedInvocation[JSON_ITEM_TEXT], ELE_P);
	}
}
