const STR_EMPTY = "";
const STR_VOID_LINK = "javascript:void(0)";
const STR_SLUG_DASH = "-";

const TYP_STRING = "string";
const TYP_NUMBER = "number";
const TYP_OBJECT = "object";

const ELE_SPAN = "span";
const ELE_UL = "ul";
const ELE_LI = "li";
const ELE_A = "a";
const ELE_P = "p";
const ELE_DIV = "div";
const ELE_BUTTON = "button";
const ELE_INPUT = "input";

const EVNT_MOUSEOVER = "mouseover";
const EVNT_MOUSEOUT = "mouseout";
const EVNT_MOUSELEAVE = "mouseleave";
const EVNT_MOUSEENTER = "mouseenter";
const EVNT_CLICK = "click";

const ATB_ID = "id";
const ATB_CLASS = "class";
const ATB_TITLE = "title";
const ATB_VALUE = "value";
const ATB_HREF = "href";
const ATB_STYLE = "style";
const ATB_CHECKED = "checked";
const ATB_TYPE = "type";
const ATB_ONCLICK = "onclick";

const STL_DISPLAY_INITIAL = "display: initial";
const STL_DISPLAY_NONE = "display: none";

// STRING ==============================================================================================================
// Appropriated from StackOverflow (literally, the site uses this code)
String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
function () {
	"use strict";
	var str = this.toString();
	if (arguments.length) {
		var t = typeof arguments[0];
		var key;
		var args = (TYP_STRING === t || TYP_NUMBER === t) ?
			Array.prototype.slice.call(arguments)
			: arguments[0];

		for (key in args) {
			str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
		}
	}

	return str;
};

function utils_joinPhraseArray(array, joiner, lastJoiner) {
	if (array.length === 0) return "";
	if (array.length === 1) return array[0];
	if (array.length === 2) return array.join(lastJoiner);
	else {
		let outStr = "";
		for (let i = 0; i < array.length; ++i) {
			outStr += array[i];
			if (i < array.length-2) outStr += joiner;
			else if (i === array.length-2) outStr += lastJoiner
		}
		return outStr;
	}
}

String.prototype.uppercaseFirst = String.prototype.uppercaseFirst ||
function () {
	let str = this.toString();
	if (str.length === 0) return str;
	if (str.length === 1) return str.charAt(0).toUpperCase();
	return str.charAt(0).toUpperCase() + str.slice(1);
};

// TEXT COMBINING ======================================================================================================
function utils_combineText(textList, tagPerItem, textBlockInlineTitle) {
	tagPerItem = tagPerItem === undefined ? null : tagPerItem;
	textBlockInlineTitle = textBlockInlineTitle === undefined ? null : textBlockInlineTitle;
	let textStack = "";
	if (typeof textList === TYP_STRING) {
		return getString(textList, true)
	}
	for (let i = 0; i < textList.length; ++i) {
		if (typeof textList[i] === TYP_OBJECT) {
			if (textList[i].islist === "YES") {
				textStack += utils_makeList(textList[i]);
			}
			if (textList[i].hassubtitle === "YES") {
				// if required, add inline header before we go deeper
				if (textBlockInlineTitle !== null && i === 0) {
					textStack += textBlockInlineTitle;
				}
				textStack += utils_combineText(textList[i].text, tagPerItem, utils_makeSubHeader(textList[i].title));
			}
			if (textList[i].istable === "YES") {
				textStack += utils_makeTable(textList[i]);
			}
			if (textList[i].hassavedc === "YES") {
				textStack += utils_makeAttDc(textList[i]);
			}
			if (textList[i].hasattackmod === "YES") {
				textStack += utils_makeAttAttackMod(textList[i]);
			}
		} else {
			textStack += getString(textList[i], textBlockInlineTitle !== null && i === 0)
		}
	}
	return textStack;

	function getString(text, addTitle) {
		let openTag = tagPerItem === null ? "" : "<" + tagPerItem + ">";
		let closeTag = tagPerItem === null ? "" : "</" + tagPerItem + ">";
		let inlineTitle = addTitle ? textBlockInlineTitle : "";
		return openTag + inlineTitle + text + closeTag;
	}
}

function utils_makeTable(tableObject) {
	let tableStack = "<table>";
	if (tableObject.caption !== undefined) {
		tableStack += "<caption>" + tableObject.caption + "</caption>";
	}
	tableStack += "<thead><tr>";

	for (let i = 0; i < tableObject.thead.length; ++i) {
		tableStack += "<th" + makeTableThClassText(tableObject, i) + ">" + tableObject.thead[i] + "</th>"
	}

	tableStack += "</tr></thead><tbody>";
	for (let i = 0; i < tableObject.tbody.length; ++i) {
		tableStack += "<tr>";
		for (let j = 0; j < tableObject.tbody[i].length; ++j) {
			tableStack += "<td" + makeTableTdClassText(tableObject, j) + ">" + tableObject.tbody[i][j] + "</td>";
		}
		tableStack += "</tr>";
	}
	tableStack += "</tbody></table>";
	return tableStack;
}

function utils_makeAttDc(attDcObj) {
	return "<p class='spellabilitysubtext'><span>" + attDcObj.name + " save DC</span> = 8 + your proficiency bonus + your " + utils_makeAttChoose(attDcObj.attributes) + "</p>"

}
function utils_makeAttAttackMod(attAtkObj) {
	return "<p class='spellabilitysubtext'><span>" + attAtkObj.name + " attack modifier</span> = your proficiency bonus + your " + utils_makeAttChoose(attAtkObj.attributes) + "</p>"
}
function utils_makeList(listObj) {
	let outStack = "<ul>";
	for (let i = 0; i < listObj.items.length; ++i) {
		let cur = listObj.items[i];
		outStack += "<li>";
		for (let j = 0; j < cur.text.length; ++j) {
			if (cur.text[j].hassubtitle === "YES") {
				outStack += "<br>" + utils_makeListSubHeader(cur.text[j].title) + cur.text[j].text;
			} else {
				outStack += cur.text[j];
			}
		}
		outStack += "</li>";
	}
	return outStack + "</ul>";
}
function utils_makeSubHeader(text) {
	return "<span class='stats-sub-header'>" + text + ".</span> "
}
function utils_makeListSubHeader(text) {
	return "<span class='stats-list-sub-header'>" + text + ".</span> "
}
function utils_makeAttChoose(attList) {
	if (attList.length === 1) {
		return parse_attAbvToFull(attList[0]) + " modifier";
	} else {
		let attsTemp = [];
		for (let i = 0; i < attList.length; ++i) {
			attsTemp.push(parse_attAbvToFull(attList[i]));
		}
		return attsTemp.join(" or ") + " modifier (your choice)";
	}
}

function makeTableThClassText(tableObject, i) {
	return (tableObject.thstyleclass === undefined || i >= tableObject.thstyleclass.length ? "" : " class=\"" + tableObject.thstyleclass[i] + "\"")
}
function makeTableTdClassText(tableObject, i) {
	if (tableObject.tdstyleclass !== undefined) {
		return (tableObject.tdstyleclass === undefined || i >= tableObject.tdstyleclass.length ? "" : " class=\"" + tableObject.tdstyleclass[i] + "\"")
	} else {
		return makeTableThClassText(tableObject, i);
	}
}

function utils_makePrerequisite(prereqList, shorthand, makeAsArray) {
	shorthand = shorthand === undefined || shorthand === null ? false : shorthand;
	makeAsArray = makeAsArray === undefined || makeAsArray === null ? false : makeAsArray;
	let outStack = [];
	if (prereqList === undefined || prereqList === null) return "";
	for (let i = 0; i < prereqList.length; ++i) {
		let pre = prereqList[i];
		if (pre.race !== undefined) {
			for (let j = 0; j < pre.race.length; ++j) {
				if (shorthand) {
					const DASH = "-";
					let raceNameParts = pre.race[j].name.split(DASH);
					let raceName = [];
					for (let k = 0; k < raceNameParts.length; ++k) {
						raceName.push(raceNameParts[k].uppercaseFirst());
					}
					raceName = raceName.join(DASH);
					outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
				} else {
					let raceName = j === 0 ? pre.race[j].name.uppercaseFirst() : pre.race[j].name;
					outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
				}
			}
		}
		if (pre.ability !== undefined) {
			// this assumes all ability requirements are the same (13), correct as of 2017-10-06
			let attCount = 0;
			for (let j = 0; j < pre.ability.length; ++j) {
				for (let att in pre.ability[j]) {
					if (!pre.ability[j].hasOwnProperty(att)) continue;
					if (shorthand) {
						outStack.push(att.uppercaseFirst() + (attCount === pre.ability.length -1 ? " 13+" : ""));
					} else {
						outStack.push(parse_attAbvToFull(att) + (attCount === pre.ability.length -1 ? " 13 or higher" : ""));
					}
					attCount++;
				}
			}
		}
		if (pre.proficiency !== undefined) {
			// only handles armor proficiency requirements,
			for (let j = 0; j < pre.proficiency.length; ++j) {
				for (let type in pre.proficiency[j]) { // type is armor/weapon/etc.
					if (!pre.proficiency[j].hasOwnProperty(type)) continue;
					if (type === "armor") {
						if (shorthand) {
							outStack.push("prof " + parse_armorFullToAbv(pre.proficiency[j][type]) + " armor");
						} else {
							outStack.push("Proficiency with " + pre.proficiency[j][type] + " armor");
						}
					}
				}
			}
		}
		if (pre.spellcasting === "YES") {
			if (shorthand) {
				outStack.push("Spellcasting");
			} else {
				outStack.push("The ability to cast at least one spell");
			}
		}
	}
	if (makeAsArray) {
		return outStack;
	} else {
		if (shorthand) return outStack.join("/");
		else return utils_joinPhraseArray(outStack, ", ", " or ");
	}
}

function utils_getAttributeText(attObj) {
	const ATTRIBUTES = ["Str", "Dex", "Con", "Int", "Wis", "Cha"];
	let mainAtts = [];
	let atts = [];
	if (attObj !== undefined) {
		handleAllAttributes(attObj);
		handleAttributesChoose();
		return atts.join("; ");
	}
	return "";

	function handleAllAttributes(abilityList) {
		for (let a = 0; a < ATTRIBUTES.length; ++a) {
			handleAttribute(abilityList, ATTRIBUTES[a])
		}
	}

	function handleAttribute(parent, att) {
		if (parent[att.toLowerCase()] !== undefined) {
			atts.push(att + " " + (parent[att.toLowerCase()] < 0 ? "" : "+") + parent[att.toLowerCase()]);
			mainAtts.push(att);
		}
	}

	function handleAttributesChoose() {
		if (attObj.choose !== undefined) {
			for (let i = 0; i < attObj.choose.length; ++i) {
				let item = attObj.choose[i];
				let outStack = "Choose ";
				if (item.predefined !== undefined) {
					for (let j = 0; j < item.predefined.length; ++j) {
						let subAtts = [];
						handleAllAttributes(subAtts, item.predefined[j]);
						outStack += subAtts.join(", ") + (j === item.predefined.length - 1 ? "" : " or ");
					}
				} else {
					let allAttributes = item.from.length === 6;
					let allAttributesWithParent = isAllAttributesWithParent(item);
					let amount = item.amount === undefined ? 1 : item.amount;
					amount = (amount < 0 ? "" : "+") + amount;
					if (allAttributes) {
						outStack += "any ";
					} else if (allAttributesWithParent) {
						outStack += "any other ";
					}
					if (item.count !== undefined && item.count > 1) {
						outStack += getNumberString(item.count) + " ";
					}
					if (allAttributes || allAttributesWithParent) {
						outStack += amount;
					} else {
						for (let j = 0; j < item.from.length; ++j) {
							let suffix = "";
							if (item.from.length > 1) {
								if (j === item.from.length-2) {
									suffix = " or ";
								} else if (j < item.from.length-2) {
									suffix = ", "
								}
							}
							let thsAmount = " " + amount;
							if (item.from.length > 1) {
								if (j !== item.from.length-1) {
									thsAmount = "";
								}
							}
							outStack += item.from[j].uppercaseFirst() + thsAmount + suffix;
						}
					}
				}
				atts.push(outStack)
			}

		}
	}

	function isAllAttributesWithParent(item) {
		let tempAttributes = [];
		for (let i = 0; i < mainAtts.length; ++i) {
			tempAttributes.push(mainAtts[i].toLowerCase());
		}
		for (let i = 0; i < item.from.length; ++i) {
			let attb = item.from[i].toLowerCase();
			if (!tempAttributes.includes(attb)) {
				tempAttributes.push(attb)
			}
		}
		return tempAttributes.length === 6;
	}
	function getNumberString(amount) {
		if (amount === 1) return "one";
		if (amount === 2) return "two";
		if (amount === 3) return "three";
		else return amount;
	}
}

// PARSING =============================================================================================================
function _parse_aToB(abMap, a) {
	a = a.trim();
	if (abMap[a] !== undefined) return abMap[a];
	return a;
}
function _parse_bToA(abMap, b) {
	b = b.trim();
	for (let v in abMap) {
		if (!abMap.hasOwnProperty(v)) continue;
		if (abMap[v] === b) return v
	}
	return b;
}

const ATB_ABV_TO_FULL = {
	"str": "Strength",
	"dex": "Dexterity",
	"con": "Constitution",
	"int": "Intelligence",
	"wis": "Wisdom",
	"cha": "Charisma"
};
function parse_attAbvToFull(abv) {
	return _parse_aToB(ATB_ABV_TO_FULL, abv);
}
function parse_attFullToAbv(full) {
	return _parse_bToA(ATB_ABV_TO_FULL, full);
}

const SIZE_ABV_TO_FULL = {
	"T": "Tiny",
	"S": "Small",
	"M": "Medium",
	"L": "Large",
	"H": "Huge",
	"G": "Gargantuan",
	"V": "Varies"
};
function parse_sizeAbvToFull (abv) {
	return _parse_aToB(SIZE_ABV_TO_FULL, abv);
}

function getAbilityModifier (abilityScore) {
	let modifier = Math.floor((abilityScore - 10) / 2);
	if (modifier >= 0) modifier = "+"+modifier;
	return modifier;
}

function addCommas(intNum) {
	return (intNum + '').replace(/(\d)(?=(\d{3})+$)/g, '$1,');
}

const xpchart = [200, 450, 700, 1100, 1800, 2300, 2900, 3900, 5000, 5900, 7200, 8400, 10000, 11500, 13000, 15000, 18000, 20000, 22000, 25000, 30000, 41000, 50000, 62000, 75000, 90000, 105000, 102000, 135000, 155000]

function parsecr (cr) {
	if (cr === "0") return "0 or 10"
	if (cr === "1/8") return "25"
	if (cr === "1/4") return "50"
	if (cr === "1/2") return "100"
	return addCommas (xpchart[parseInt(cr)-1]);
}

const ARMOR_ABV_TO_FULL = {
	"l.": "light",
	"m.": "medium",
	"h.": "heavy",
};
function parse_armorFullToAbv(armor) {
	return _parse_bToA(ARMOR_ABV_TO_FULL, armor);
}

const SRC_PHB = "PHB";
const SRC_EEPC = "EEPC";
const SRC_SCAG = "SCAG";
const SRC_UAA = "UAA";
const SRC_UATMC = "UATMC";
const SRC_UAMystic = "UAMystic";
const SRC_UAStarterSpells = "UAStarterSpells";
const SRC_UAModern = "UAModern";
const SRC_UATOBM = "UATOBM";
const SRC_UAEBB = "UAEB";
const SRC_UAFT = "UAFT";
const SRC_UAFFS = "UAFFS";
const SRC_UAFFR = "UAFFR";
const SRC_UATRR = "UATRR";
const SRC_PSK = "PSK";
const SRC_BOLS_3PP = "BoLS 3pp";

const UA_PREFIX = "Unearthed Arcana: ";
const PS_PREFIX = "Plane Shift: ";

const SOURCE_JSON_TO_FULL = {}
SOURCE_JSON_TO_FULL[SRC_PHB] = "Player\u2019s Handbook";
SOURCE_JSON_TO_FULL[SRC_EEPC] = "Elemental Evil Player\u2019s Companion";
SOURCE_JSON_TO_FULL[SRC_SCAG] = "Sword Coast Adventurer\u2019s Guide";
SOURCE_JSON_TO_FULL[SRC_UAA] = UA_PREFIX + "Artificer";
SOURCE_JSON_TO_FULL[SRC_UATMC] = UA_PREFIX + "The Mystic Class";
SOURCE_JSON_TO_FULL[SRC_UAMystic] = UA_PREFIX + "The Mystic Class";
SOURCE_JSON_TO_FULL[SRC_UAStarterSpells] = UA_PREFIX + "Starter Spells";
SOURCE_JSON_TO_FULL[SRC_UAModern] = UA_PREFIX + "Modern Magic";
SOURCE_JSON_TO_FULL[SRC_UATOBM] = UA_PREFIX + "That Old Black Magic";
SOURCE_JSON_TO_FULL[SRC_UAEBB] = UA_PREFIX + "Eberron";
SOURCE_JSON_TO_FULL[SRC_UAFT] = UA_PREFIX + "Feats";
SOURCE_JSON_TO_FULL[SRC_UAFFS] = UA_PREFIX + "Feats for Skills";
SOURCE_JSON_TO_FULL[SRC_UAFFR] = UA_PREFIX + "Feats for Races";
SOURCE_JSON_TO_FULL[SRC_PSK] = PS_PREFIX + "Kaladesh";
SOURCE_JSON_TO_FULL[SRC_BOLS_3PP] = "Book of Lost Spells (3pp)";
SOURCE_JSON_TO_FULL[SRC_UATRR] = UA_PREFIX + "The Ranger, Revised";

const SOURCE_JSON_TO_ABV = {};
SOURCE_JSON_TO_ABV[SRC_PHB] = "PHB";
SOURCE_JSON_TO_ABV[SRC_EEPC] = "EEPC";
SOURCE_JSON_TO_ABV[SRC_SCAG] = "SCAG";
SOURCE_JSON_TO_ABV[SRC_UAMystic] = "UAM";
SOURCE_JSON_TO_ABV[SRC_UAStarterSpells] = "UASS";
SOURCE_JSON_TO_ABV[SRC_UAModern] = "UAMM";
SOURCE_JSON_TO_ABV[SRC_UATOBM] = "UAOBM";
SOURCE_JSON_TO_ABV[SRC_UAEBB] = "UAEB";
SOURCE_JSON_TO_ABV[SRC_UAFT] = "UAFT";
SOURCE_JSON_TO_ABV[SRC_UAFFS] = "UAFFS";
SOURCE_JSON_TO_ABV[SRC_UAFFR] = "UAFFR";
SOURCE_JSON_TO_ABV[SRC_PSK] = "PSK";
SOURCE_JSON_TO_ABV[SRC_BOLS_3PP] = "BLS";

function parse_sourceJsonToFull (source) {
	return _parse_aToB(SOURCE_JSON_TO_FULL, source);
}
function parse_sourceJsonToAbv(source) {
	return _parse_aToB(SOURCE_JSON_TO_ABV, source);
}

function parse_stringToSlug(str) {
	return str.toLowerCase().replace(/[^\w ]+/g, STR_EMPTY).replace(/ +/g, STR_SLUG_DASH);
}

// DATA LINKS ==========================================================================================================
function utils_nameToDataLink(name) {
	return encodeURIComponent(name.toLowerCase()).replace("'","%27");
}

// CONVENIENCE/ELEMENTS ================================================================================================
function toggleCheckBox(cb) {
	if (cb.checked === true) cb.checked = false;
	else cb.checked = true;
}
function stopEvent(event) {
	event.stopPropagation();
	event.preventDefault();
}
function toggleVisible(element) {
	if (isShowing(element)) hide(element);
	else show(element);
}
function isShowing(element) {
	return element.hasAttribute(ATB_STYLE) && element.getAttribute(ATB_STYLE).includes(STL_DISPLAY_INITIAL);
}
function show(element) {
	element.setAttribute(ATB_STYLE, STL_DISPLAY_INITIAL);
}
function hide(element) {
	element.setAttribute(ATB_STYLE, STL_DISPLAY_NONE);
}

// search
function search(options) {
	const list = new List("listcontainer", options);
	list.sort("name")
	$("#reset").click(function() {
		$("#filtertools select").val("All");
		$("#search").val("");
		list.search();
		list.sort("name");
		list.filter();
	})
	return list
}

// SORTING =============================================================================================================

function asc_sort(a, b){
	return ($(b).text()) < ($(a).text()) ? 1 : -1;
}

function asc_sort_range(a, b){
	return (parseInt(b.value)) < parseInt((a.value)) ? 1 : -1;
}

function desc_sort(a, b){
	return ($(b).text()) > ($(a).text()) ? 1 : -1;
}