"use strict";

const JSON_URL = "data/psionics.json";

const STR_JOIN_MODE_LIST = ",";
const STR_JOIN_MODE_TITLE_BRACKET_PART_LIST = "; ";
const STR_JOIN_MODE_TITLE = " ";
const STR_ABV_TYPE_TALENT = "T";
const STR_ABV_TYPE_DISCIPLINE = "D";
const STR_TYPE_TALENT = "Talent";
const STR_TYPE_DISCIPLINE = "Discipline";
const STR_ORDER_NONE = "None";

const TMP_HIDDEN_MODE = `"{0}"`;

const ID_PSIONICS_LIST = "psionicsList";
const ID_STATS_NAME = "name";
const ID_STATS_ORDER_AND_TYPE = "orderAndType";
const ID_STATS_DURATION = "duration";
const ID_TEXT = "text";

const JSON_ITEM_NAME = "name";
const JSON_ITEM_SOURCE = "source";
const JSON_ITEM_TYPE = "type";
const JSON_ITEM_ORDER = "order";
const JSON_ITEM_TEXT = "text";
const JSON_ITEM_DURATION = "duration";
const JSON_ITEM_DESCRIPTION = "description";
const JSON_ITEM_FOCUS = "focus";
const JSON_ITEM_MODES = "modes";
const JSON_ITEM_SUBMODES = "submodes";
const JSON_ITEM_MODE_TITLE = "title";
const JSON_ITEM_MODE_TEXT = "text";
const JSON_ITEM_MODE_COST = "cost";
const JSON_ITEM_MODE_COST_MIN = "min";
const JSON_ITEM_MODE_COST_MAX = "max";
const JSON_ITEM_MODE_CONCENTRATION = "concentration";
const JSON_ITEM_MODE_CONCENTRATION_DURATION = "duration";
const JSON_ITEM_MODE_CONCENTRATION_UNIT = "unit";

const CLS_PSIONICS = "psionics";
const CLS_ROW = "row";
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
		outArray.push(TMP_HIDDEN_MODE.formatUnicorn(modeList[i][JSON_ITEM_MODE_TITLE]));
		if (modeList[i][JSON_ITEM_SUBMODES] !== undefined) {
			const subModes = modeList[i][JSON_ITEM_SUBMODES];
			for (let j = 0; j < subModes.length; ++j) {
				outArray.push(TMP_HIDDEN_MODE.formatUnicorn(subModes[j][JSON_ITEM_MODE_TITLE]))
			}
		}
	}
	return outArray.join(STR_JOIN_MODE_LIST);
}

window.onload = function load () {
	loadJSON(JSON_URL, onJsonLoad);
};

let PSIONIC_LIST;

function onJsonLoad (data) {
	PSIONIC_LIST = data.psionic;

	const sourceFilter = getSourceFilter({
		deselFn: function (val) {
			return false;
		}
	});
	const typeFilter = new Filter({header: "Type", items: ["D", "T"], displayFn: parse_psionicTypeToFull});
	const orderFilter = new Filter({
		header: "Order",
		items: ["Avatar", "Awakened", "Immortal", "Nomad", "Wu Jen", STR_ORDER_NONE]
	});

	const filterBox = initFilterBox(sourceFilter, typeFilter, orderFilter);

	let tempString = "";
	PSIONIC_LIST.forEach(function (p, i) {
		p[JSON_ITEM_ORDER] = parse_psionicOrderToFull(p[JSON_ITEM_ORDER]);

		tempString += `
			<li class='row' ${FLTR_ID}="${i}">
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(p)}' title="${p[JSON_ITEM_NAME]}">
					<span class='${LIST_NAME} ${CLS_COL1}'>${p[JSON_ITEM_NAME]}</span>
					<span class='${LIST_SOURCE} ${CLS_COL2}' title="${Parser.sourceJsonToFull(p[JSON_ITEM_SOURCE])}">${Parser.sourceJsonToAbv(p[JSON_ITEM_SOURCE])}</span>
					<span class='${LIST_TYPE} ${CLS_COL3}'>${parse_psionicTypeToFull(p[JSON_ITEM_TYPE])}</span>
					<span class='${LIST_ORDER} ${CLS_COL4} ${p[JSON_ITEM_ORDER] === STR_NONE ? CLS_LI_NONE : STR_EMPTY}'>${p[JSON_ITEM_ORDER]}</span>
					<span class='${LIST_MODE_LIST} ${CLS_HIDDEN}'>${getHiddenModeList(p)}</span>
				</a>
			</li>
		`;

		// populate filters
		sourceFilter.addIfAbsent(p[JSON_ITEM_SOURCE]);
	});
	$(`#${ID_PSIONICS_LIST}`).append(tempString);

	// sort filters
	sourceFilter.items.sort(ascSort);

	const list = search({
		valueNames: [LIST_NAME, LIST_SOURCE, LIST_TYPE, LIST_ORDER, LIST_MODE_LIST],
		listClass: CLS_PSIONICS,
		sortFunction: listSort
	});

	function listSort (itemA, itemB, options) {
		if (options.valueName === LIST_NAME) return compareBy(LIST_NAME);
		else return compareByOrDefault(options.valueName, LIST_NAME);

		function compareBy (valueName) {
			const aValue = itemA.values()[valueName].toLowerCase();
			const bValue = itemB.values()[valueName].toLowerCase();
			if (aValue === bValue) return 0;
			return (aValue > bValue) ? 1 : -1;
		}

		function compareByOrDefault (valueName, defaultValueName) {
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

	function handleFilterChange () {
		const f = filterBox.getValues();
		list.filter(function (item) {
			const p = PSIONIC_LIST[$(item.elm).attr(FLTR_ID)];

			const rightSource = sourceFilter.toDisplay(f, p.source);
			const rightType = typeFilter.toDisplay(f, p.type);
			const rightOrder = orderFilter.toDisplay(f, p.order);

			return rightSource && rightType && rightOrder;
		});
	}

	initHistory();
	handleFilterChange();
}

function loadhash (jsonIndex) {
	const STATS_NAME = document.getElementById(ID_STATS_NAME);
	const STATS_ORDER_AND_TYPE = document.getElementById(ID_STATS_ORDER_AND_TYPE);
	const STATS_DURATION = document.getElementById(ID_STATS_DURATION);
	const STATS_TEXT = document.getElementById(ID_TEXT);

	const selectedPsionic = PSIONIC_LIST[jsonIndex];

	STATS_NAME.innerHTML = selectedPsionic[JSON_ITEM_NAME];
	if (selectedPsionic[JSON_ITEM_TYPE] === STR_ABV_TYPE_TALENT) loadTalent();
	else if (selectedPsionic[JSON_ITEM_TYPE] === STR_ABV_TYPE_DISCIPLINE) loadDiscipline();

	function loadTalent () {
		STATS_ORDER_AND_TYPE.innerHTML = parse_psionicTypeToFull(selectedPsionic[JSON_ITEM_TYPE]);
		STATS_TEXT.innerHTML = utils_combineText(selectedPsionic[JSON_ITEM_TEXT], ELE_P);
		STATS_DURATION.innerHTML = STR_EMPTY;
	}

	function loadDiscipline () {
		STATS_ORDER_AND_TYPE.innerHTML = `${selectedPsionic[JSON_ITEM_ORDER]} ${parse_psionicTypeToFull(selectedPsionic[JSON_ITEM_TYPE])}`;
		STATS_TEXT.innerHTML = getTextString();
		STATS_DURATION.innerHTML = getDurationString();

		function getTextString () {
			const modeStringArray = [];
			for (let i = 0; i < selectedPsionic[JSON_ITEM_MODES].length; ++i) {
				modeStringArray.push(getModeString(i));
			}

			return `${getDescriptionString()}${getFocusString()}${modeStringArray.join(STR_EMPTY)}`;
		}

		function getDescriptionString () {
			return `<p>${selectedPsionic[JSON_ITEM_DESCRIPTION]}</p>`;
		}

		function getFocusString () {
			return `<p><span class='psi-focus-title'>Psycic Focus.</span> ${selectedPsionic[JSON_ITEM_FOCUS]}</p>`;
		}

		function getModeString (modeIndex) {
			const modeString = utils_combineText(selectedPsionic[JSON_ITEM_MODES][modeIndex][JSON_ITEM_MODE_TEXT], ELE_P, getModeTitle(selectedPsionic[JSON_ITEM_MODES][modeIndex]));
			if (selectedPsionic[JSON_ITEM_MODES][modeIndex][JSON_ITEM_SUBMODES] === undefined) return modeString;
			const subModeString = getSubModeString();
			return `${modeString}${subModeString}`;

			function getSubModeString () {
				const modeStrings = [];
				const subModes = selectedPsionic[JSON_ITEM_MODES][modeIndex][JSON_ITEM_SUBMODES];
				for (let i = 0; i < subModes.length; ++i) {
					modeStrings.push(utils_combineText(subModes[i][JSON_ITEM_MODE_TEXT], ELE_P, getModeTitle(subModes[i], true)));
				}
				return modeStrings.join(STR_EMPTY);
			}

			function getModeTitle (mode, subMode) {
				subMode = subMode === undefined || subMode === null ? false : subMode;
				const modeTitleArray = [];
				modeTitleArray.push(mode[JSON_ITEM_MODE_TITLE]);
				const bracketPart = getModeTitleBracketPart();
				if (bracketPart !== null) modeTitleArray.push(bracketPart);
				if (subMode) return `<span class='psi-mode-sub-title'>${modeTitleArray.join(STR_JOIN_MODE_TITLE)}.</span> `;
				else return `<span class='psi-mode-title'>${modeTitleArray.join(STR_JOIN_MODE_TITLE)}.</span> `;

				function getModeTitleBracketPart () {
					const modeTitleBracketArray = [];

					if (mode[JSON_ITEM_MODE_COST]) modeTitleBracketArray.push(getModeTitleCost());
					if (mode[JSON_ITEM_MODE_CONCENTRATION]) modeTitleBracketArray.push(getModeTitleConcentration());

					if (modeTitleBracketArray.length === 0) return null;
					return `(${modeTitleBracketArray.join(STR_JOIN_MODE_TITLE_BRACKET_PART_LIST)})`;

					function getModeTitleCost () {
						const costMin = mode[JSON_ITEM_MODE_COST][JSON_ITEM_MODE_COST_MIN];
						const costMax = mode[JSON_ITEM_MODE_COST][JSON_ITEM_MODE_COST_MAX];
						const costString = costMin === costMax ? costMin : `${costMin}-${costMax}`;
						return `${costString} psi`;
					}

					function getModeTitleConcentration () {
						return `conc., ${mode[JSON_ITEM_MODE_CONCENTRATION][JSON_ITEM_MODE_CONCENTRATION_DURATION]} ${mode[JSON_ITEM_MODE_CONCENTRATION][JSON_ITEM_MODE_CONCENTRATION_UNIT]}.`
					}
				}
			}
		}
	}

	function getDurationString () {
		const duration = selectedPsionic[JSON_ITEM_DURATION];
		if (duration === undefined) return STR_EMPTY;
		else return getDurationElement();

		function getDurationElement () {

		}
	}
}

function parse_psionicTypeToFull (type) {
	if (type === STR_ABV_TYPE_TALENT) return STR_TYPE_TALENT;
	else if (type === STR_ABV_TYPE_DISCIPLINE) return STR_TYPE_DISCIPLINE;
	else return type;
}

function parse_psionicOrderToFull (order) {
	return order === undefined ? STR_ORDER_NONE : order;
}
