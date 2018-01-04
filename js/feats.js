"use strict";
const JSON_URL = "data/feats.json";
let tabledefault = "";
let featlist;

function deselUa (val) {
	return val.startsWith(SRC_UA_PREFIX);
}

window.onload = function load () {
	loadJSON(JSON_URL, onJsonLoad);
};

function onJsonLoad (data) {
	tabledefault = $("#stats").html();
	featlist = data.feat;

	// TODO prerequisite filter?
	const sourceFilter = getSourceFilter();
	const asiFilter = getAsiFilter();
	const filterBox = initFilterBox(
		sourceFilter,
		asiFilter
	);

	const featTable = $("ul.feats");
	let tempString = "";
	for (let i = 0; i < featlist.length; i++) {
		const curfeat = featlist[i];
		const name = curfeat.name;
		const ability = utils_getAbilityData(curfeat.ability);
		if (!ability.asText) ability.asText = STR_NONE;
		curfeat._fAbility = ability.asCollection.filter(a => !ability.areNegative.includes(a)); // used for filtering
		let prereqText = utils_makePrerequisite(curfeat.prerequisite, true);
		if (!prereqText) prereqText = STR_NONE;
		const CLS_COL_1 = "name col-xs-3 col-xs-3-8";
		const CLS_COL_2 = `source col-xs-1 col-xs-1-7 source${curfeat.source}`;
		const CLS_COL_3 = "ability " + (ability.asText === STR_NONE ? "list-entry-none " : "") + "col-xs-3 col-xs-3-5";
		const CLS_COL_4 = "prerequisite " + (prereqText === STR_NONE ? "list-entry-none " : "") + "col-xs-3";

		tempString += `
			<li ${FLTR_ID}="${i}">
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(curfeat)}' title='${name}'>
					<span class='${CLS_COL_1}'>${name}</span>
					<span class='${CLS_COL_2}' title='${Parser.sourceJsonToFull(curfeat.source)}'>${Parser.sourceJsonToAbv(curfeat.source)}</span>
					<span class='${CLS_COL_3}'>${ability.asText}</span>
					<span class='${CLS_COL_4}'>${prereqText}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(curfeat.source);
	}
	featTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(ascSort);

	// init list
	const list = search({
		valueNames: ['name', 'source', 'ability', 'prerequisite'],
		listClass: "feats"
	});

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	// filtering function
	function handleFilterChange () {
		const f = filterBox.getValues();
		list.filter(function (item) {
			const ft = featlist[$(item.elm).attr(FLTR_ID)];

			return sourceFilter.toDisplay(f, ft.source) && asiFilter.toDisplay(f, ft._fAbility);
		});
	}

	initHistory();
	handleFilterChange();
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	const feat = featlist[id];

	$("th#name").html(`<span class="stats-name">${feat.name}</span><span class="stats-source source${feat.source}" title="${Parser.sourceJsonToFull(feat.source)}">${Parser.sourceJsonToAbv(feat.source)}</span>`);

	const prerequisite = utils_makePrerequisite(feat.prerequisite);
	$("td#prerequisite").html(prerequisite ? "Prerequisite: " + prerequisite : "");
	$("tr.text").remove();
	addAttributeItem(feat.ability, feat.entries);
	$("tr#text").after("<tr class='text'><td colspan='6'>" + utils_combineText(feat.entries, "p") + "</td></tr>");

	function addAttributeItem (abilityObj, textArray) {
		if (abilityObj === undefined) return;
		for (let i = 0; i < textArray.length; ++i) { // insert the new list item at the head of the first list we find list; flag with "hasabilityitem" so we don't do it more than once
			if (textArray[i].type === "list" && textArray[i].hasabilityitem !== "YES") {
				textArray[i].hasabilityitem = "YES";
				textArray[i].items.unshift(abilityObjToListItem())
			}
		}

		function abilityObjToListItem () {
			const TO_MAX_OF_TWENTY = ", to a maximum of 20.";
			const abbArr = [];
			if (abilityObj.choose === undefined) {
				for (const att in abilityObj) {
					if (!abilityObj.hasOwnProperty(att)) continue;
					abbArr.push("Increase your " + Parser.attAbvToFull(att) + " score by " + abilityObj[att] + TO_MAX_OF_TWENTY);
				}
			} else {
				const choose = abilityObj.choose;
				for (let i = 0; i < choose.length; ++i) {
					if (choose[i].from.length === 6) {
						if (choose[i].textreference === "YES") { // only used in "Resilient"
							abbArr.push("Increase the chosen ability score by " + choose[i].amount + TO_MAX_OF_TWENTY);
						} else {
							abbArr.push("Increase one ability score of your choice by " + choose[i].amount + TO_MAX_OF_TWENTY);
						}
					} else {
						const from = choose[i].from;
						const amount = choose[i].amount;
						const abbChoices = [];
						for (let j = 0; j < from.length; ++j) {
							abbChoices.push(Parser.attAbvToFull(from[j]));
						}
						const abbChoicesText = utils_joinPhraseArray(abbChoices, ", ", " or ");
						abbArr.push("Increase your " + abbChoicesText + " by " + amount + TO_MAX_OF_TWENTY);
					}
				}
			}
			return abbArr.join(" ");
		}
	}
}
