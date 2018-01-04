// ************************************************************************* //
// Strict mode should not be used, as the roll20 script depends on this file //
// ************************************************************************* //

HASH_PART_SEP = ",";
HASH_LIST_SEP = "_";
HASH_SUB_LIST_SEP = "~";
HASH_START = "#";
HASH_SUBCLASS = "sub:";

STR_EMPTY = "";
STR_VOID_LINK = "javascript:void(0)";
STR_SLUG_DASH = "-";
STR_APOSTROPHE = "\u2019";

ID_SEARCH_BAR = "filter-search-input-group";
ID_RESET_BUTTON = "reset";

ELE_SPAN = "span";
ELE_UL = "ul";
ELE_LI = "li";
ELE_A = "a";
ELE_P = "p";
ELE_DIV = "div";
ELE_BUTTON = "button";
ELE_INPUT = "input";

EVNT_MOUSEOVER = "mouseover";
EVNT_MOUSEOUT = "mouseout";
EVNT_MOUSELEAVE = "mouseleave";
EVNT_MOUSEENTER = "mouseenter";
EVNT_CLICK = "click";

ATB_ID = "id";
ATB_CLASS = "class";
ATB_TITLE = "title";
ATB_VALUE = "value";
ATB_HREF = "href";
ATB_STYLE = "style";
ATB_CHECKED = "checked";
ATB_TYPE = "type";
ATB_ONCLICK = "onclick";

STL_DISPLAY_INITIAL = "display: initial";
STL_DISPLAY_NONE = "display: none";

FLTR_ID = "filterId";

CLSS_NON_STANDARD_SOURCE = "spicy-sauce";
CLSS_SUBCLASS_FEATURE = "subclass-feature";

ATB_DATA_LIST_SEP = "||";
ATB_DATA_PART_SEP = "::";
ATB_DATA_SC = "data-subclass";
ATB_DATA_SRC = "data-source";

STR_CANTRIP = "Cantrip";
STR_NONE = "None";

RNG_SPECIAL = "special";
RNG_POINT = "point";
RNG_LINE = "line";
RNG_CUBE = "cube";
RNG_CONE = "cone";
RNG_RADIUS = "radius";
RNG_SPHERE = "sphere";
RNG_HEMISPHERE = "hemisphere";
RNG_SELF = "self";
RNG_SIGHT = "sight";
RNG_UNLIMITED = "unlimited";
RNG_UNLIMITED_SAME_PLANE = "plane";
RNG_TOUCH = "touch";

UNT_FEET = "feet";
UNT_MILES = "miles";

ABIL_STR = "Strength";
ABIL_DEX = "Dexterity";
ABIL_CON = "Constitution";
ABIL_INT = "Intelligence";
ABIL_WIS = "Wisdom";
ABIL_CHA = "Charisma";
ABIL_CH_ANY = "Choose Any";

// STRING ==============================================================================================================
// Appropriated from StackOverflow (literally, the site uses this code)
String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
	function () {
		let str = this.toString();
		if (arguments.length) {
			const t = typeof arguments[0];
			let key;
			const args = t === "string" || t === "number"
				? Array.prototype.slice.call(arguments)
				: arguments[0];

			for (key in args) {
				str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
			}
		}

		return str;
	};

function utils_joinPhraseArray (array, joiner, lastJoiner) {
	if (array.length === 0) return "";
	if (array.length === 1) return array[0];
	if (array.length === 2) return array.join(lastJoiner);
	else {
		let outStr = "";
		for (let i = 0; i < array.length; ++i) {
			outStr += array[i];
			if (i < array.length - 2) outStr += joiner;
			else if (i === array.length - 2) outStr += lastJoiner
		}
		return outStr;
	}
}

String.prototype.uppercaseFirst = String.prototype.uppercaseFirst ||
	function () {
		const str = this.toString();
		if (str.length === 0) return str;
		if (str.length === 1) return str.charAt(0).toUpperCase();
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

function uppercaseFirst (string) {
	return string.uppercaseFirst();
}

// TEXT COMBINING ======================================================================================================
function utils_combineText (textList, tagPerItem, textBlockInlineTitle) {
	tagPerItem = tagPerItem === undefined ? null : tagPerItem;
	textBlockInlineTitle = textBlockInlineTitle === undefined ? null : textBlockInlineTitle;
	let textStack = "";
	if (typeof textList === "string") {
		return getString(textList, true)
	}
	for (let i = 0; i < textList.length; ++i) {
		if (typeof textList[i] === "object") {
			if (textList[i].islist === "YES") {
				textStack += utils_makeOldList(textList[i]);
			}
			if (textList[i].type === "list") {
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

	function getString (text, addTitle) {
		const openTag = tagPerItem === null ? "" : "<" + tagPerItem + ">";
		const closeTag = tagPerItem === null ? "" : "</" + tagPerItem + ">";
		const inlineTitle = addTitle ? textBlockInlineTitle : "";
		return openTag + inlineTitle + text + closeTag;
	}
}

function utils_makeTable (tableObject) {
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

function utils_makeAttDc (attDcObj) {
	return "<p class='spellabilitysubtext'><span>" + attDcObj.name + " save DC</span> = 8 + your proficiency bonus + your " + utils_makeAttChoose(attDcObj.attributes) + "</p>"
}

function utils_makeAttAttackMod (attAtkObj) {
	return "<p class='spellabilitysubtext'><span>" + attAtkObj.name + " attack modifier</span> = your proficiency bonus + your " + utils_makeAttChoose(attAtkObj.attributes) + "</p>"
}

function utils_makeLink (linkObj) {
	let href;
	if (linkObj.href.type === "internal") {
		href = `${linkObj.href.path}#`;
		if (linkObj.href.hash !== undefined) {
			if (linkObj.href.hash.type === "constant") {
				href += linkObj.href.hash.value;
			} else if (linkObj.href.hash.type === "multipart") {
				const partStack = [];
				for (let i = 0; i < linkObj.href.hash.parts.length; i++) {
					const part = linkObj.href.hash.parts[i];
					partStack.push(`${part.key}:${part.value}`)
				}
				href += partStack.join(",");
			}
		}
	} else if (linkObj.href.type === "external") {
		href = linkObj.href.url;
	}
	return `<a href='${href}' target='_blank'>${linkObj.text}</a>`;
}

function utils_makeOldList (listObj) { // to handle islist === "YES"
	let outStack = "<ul>";
	for (let i = 0; i < listObj.items.length; ++i) {
		const cur = listObj.items[i];
		outStack += "<li>";
		for (let j = 0; j < cur.entries.length; ++j) {
			if (cur.entries[j].hassubtitle === "YES") {
				outStack += "<br>" + utils_makeListSubHeader(cur.entries[j].title) + cur.entries[j].entries;
			} else {
				outStack += cur.entries[j];
			}
		}
		outStack += "</li>";
	}
	return outStack + "</ul>";
}

function utils_makeList (listObj) { // to handle type === "list"
	let listTag = "ul";
	const subtype = listObj.subtype;
	let suffix = "";
	if (subtype === "ordered") {
		listTag = "ol";
		if (listObj.ordering) suffix = " type=\"" + listObj.ordering + "\"";
	} // NOTE: "description" lists are more complex - can handle those later if required
	let outStack = "<" + listTag + suffix + ">";
	for (let i = 0; i < listObj.items.length; ++i) {
		const listItem = listObj.items[i];
		outStack += "<li>";
		for (let j = 0; j < listItem.length; ++j) {
			if (listItem[j].type === "link") {
				outStack += utils_makeLink(listItem[j]);
			} else {
				outStack += listItem[j];
			}
		}
		outStack += "</li>";
	}
	return outStack + "</" + listTag + ">";
}

function utils_makeSubHeader (text) {
	return "<span class='stats-sub-header'>" + text + ".</span> "
}

function utils_makeListSubHeader (text) {
	return "<span class='stats-list-sub-header'>" + text + ".</span> "
}

function utils_makeAttChoose (attList) {
	if (attList.length === 1) {
		return Parser.attAbvToFull(attList[0]) + " modifier";
	} else {
		const attsTemp = [];
		for (let i = 0; i < attList.length; ++i) {
			attsTemp.push(Parser.attAbvToFull(attList[i]));
		}
		return attsTemp.join(" or ") + " modifier (your choice)";
	}
}

DICE_REGEX = /([1-9]\d*)?d([1-9]\d*)(\s?[+-]\s?\d+)?/g;

function utils_makeRoller (text) {
	return text.replace(DICE_REGEX, "<span class='roller' data-roll='$&'>$&</span>").replace(/(-|\+)?\d+(?= to hit)/g, "<span class='roller' data-roll='1d20$&'>$&</span>").replace(/(-|\+)?\d+(?= bonus to)/g, "<span class='roller' data-roll='1d20$&'>$&</span>").replace(/(bonus of )(=?-|\+\d+)/g, "$1<span class='roller' data-roll='1d20$2'>$2</span>");
}

function makeTableThClassText (tableObject, i) {
	return tableObject.thstyleclass === undefined || i >= tableObject.thstyleclass.length ? "" : " class=\"" + tableObject.thstyleclass[i] + "\"";
}

function makeTableTdClassText (tableObject, i) {
	if (tableObject.tdstyleclass !== undefined) {
		return tableObject.tdstyleclass === undefined || i >= tableObject.tdstyleclass.length ? "" : " class=\"" + tableObject.tdstyleclass[i] + "\"";
	} else {
		return makeTableThClassText(tableObject, i);
	}
}

function utils_makePrerequisite (prereqList, shorthand, makeAsArray) {
	shorthand = shorthand === undefined || shorthand === null ? false : shorthand;
	makeAsArray = makeAsArray === undefined || makeAsArray === null ? false : makeAsArray;
	const outStack = [];
	if (prereqList === undefined || prereqList === null) return "";
	for (let i = 0; i < prereqList.length; ++i) {
		const pre = prereqList[i];
		if (pre.race !== undefined) {
			for (let j = 0; j < pre.race.length; ++j) {
				if (shorthand) {
					const DASH = "-";
					const raceNameParts = pre.race[j].name.split(DASH);
					let raceName = [];
					for (let k = 0; k < raceNameParts.length; ++k) {
						raceName.push(raceNameParts[k].uppercaseFirst());
					}
					raceName = raceName.join(DASH);
					outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
				} else {
					const raceName = j === 0 ? pre.race[j].name.uppercaseFirst() : pre.race[j].name;
					outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
				}
			}
		}
		if (pre.ability !== undefined) {
			// this assumes all ability requirements are the same (13), correct as of 2017-10-06
			let attCount = 0;
			for (let j = 0; j < pre.ability.length; ++j) {
				for (const att in pre.ability[j]) {
					if (!pre.ability[j].hasOwnProperty(att)) continue;
					if (shorthand) {
						outStack.push(att.uppercaseFirst() + (attCount === pre.ability.length - 1 ? " 13+" : ""));
					} else {
						outStack.push(Parser.attAbvToFull(att) + (attCount === pre.ability.length - 1 ? " 13 or higher" : ""));
					}
					attCount++;
				}
			}
		}
		if (pre.proficiency !== undefined) {
			// only handles armor proficiency requirements,
			for (let j = 0; j < pre.proficiency.length; ++j) {
				for (const type in pre.proficiency[j]) { // type is armor/weapon/etc.
					if (!pre.proficiency[j].hasOwnProperty(type)) continue;
					if (type === "armor") {
						if (shorthand) {
							outStack.push("prof " + Parser.armorFullToAbv(pre.proficiency[j][type]) + " armor");
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

class AbilityData {
	constructor (asText, asTextShort, asCollection, areNegative) {
		this.asText = asText;
		this.asTextShort = asTextShort;
		this.asCollection = asCollection;
		this.areNegative = areNegative;
	}
}

function utils_getAbilityData (abObj) {
	const ABILITIES = ["Str", "Dex", "Con", "Int", "Wis", "Cha"];
	const mainAbs = [];
	const allAbs = [];
	const negMods = [];
	const abs = [];
	const shortAbs = [];
	if (abObj !== undefined) {
		handleAllAbilities(abObj);
		handleAbilitiesChoose();
		return new AbilityData(abs.join("; "), shortAbs.join("; "), allAbs, negMods);
	}
	return new AbilityData("", "", [], []);

	function handleAllAbilities (abilityList) {
		for (let a = 0; a < ABILITIES.length; ++a) {
			handleAbility(abilityList, ABILITIES[a])
		}
	}

	function handleAbility (parent, ab) {
		if (parent[ab.toLowerCase()] !== undefined) {
			const isNegMod = parent[ab.toLowerCase()] < 0;
			const toAdd = `${ab} ${(isNegMod ? "" : "+")}${parent[ab.toLowerCase()]}`;
			abs.push(toAdd);
			shortAbs.push(toAdd);
			mainAbs.push(ab);
			allAbs.push(ab.toLowerCase());
			if (isNegMod) negMods.push(ab.toLowerCase());
		}
	}

	function handleAbilitiesChoose () {
		if (abObj.choose !== undefined) {
			for (let i = 0; i < abObj.choose.length; ++i) {
				const item = abObj.choose[i];
				let outStack = "";
				if (item.predefined !== undefined) {
					for (let j = 0; j < item.predefined.length; ++j) {
						const subAbs = [];
						handleAllAbilities(subAbs, item.predefined[j]);
						outStack += subAbs.join(", ") + (j === item.predefined.length - 1 ? "" : " or ");
					}
				} else {
					const allAbilities = item.from.length === 6;
					const allAbilitiesWithParent = isAllAbilitiesWithParent(item);
					let amount = item.amount === undefined ? 1 : item.amount;
					amount = (amount < 0 ? "" : "+") + amount;
					if (allAbilities) {
						outStack += "any ";
					} else if (allAbilitiesWithParent) {
						outStack += "any other ";
					}
					if (item.count !== undefined && item.count > 1) {
						outStack += getNumberString(item.count) + " ";
					}
					if (allAbilities || allAbilitiesWithParent) {
						outStack += amount;
					} else {
						for (let j = 0; j < item.from.length; ++j) {
							let suffix = "";
							if (item.from.length > 1) {
								if (j === item.from.length - 2) {
									suffix = " or ";
								} else if (j < item.from.length - 2) {
									suffix = ", "
								}
							}
							let thsAmount = " " + amount;
							if (item.from.length > 1) {
								if (j !== item.from.length - 1) {
									thsAmount = "";
								}
							}
							outStack += item.from[j].uppercaseFirst() + thsAmount + suffix;
						}
					}
				}
				abs.push("Choose " + outStack);
				shortAbs.push(outStack.uppercaseFirst());
			}
		}
	}

	function isAllAbilitiesWithParent (chooseAbs) {
		const tempAbilities = [];
		for (let i = 0; i < mainAbs.length; ++i) {
			tempAbilities.push(mainAbs[i].toLowerCase());
		}
		for (let i = 0; i < chooseAbs.from.length; ++i) {
			const ab = chooseAbs.from[i].toLowerCase();
			if (!tempAbilities.includes(ab)) tempAbilities.push(ab);
			if (!allAbs.includes(ab.toLowerCase)) allAbs.push(ab.toLowerCase());
		}
		return tempAbilities.length === 6;
	}

	function getNumberString (amount) {
		if (amount === 1) return "one";
		if (amount === 2) return "two";
		if (amount === 3) return "three";
		else return amount;
	}
}

// PARSING =============================================================================================================
Parser = {};
Parser._parse_aToB = function (abMap, a) {
	if (a === undefined || a === null) throw new Error("undefined or null object passed to parser");
	if (typeof a === "string") a = a.trim();
	if (abMap[a] !== undefined) return abMap[a];
	return a;
};

Parser._parse_bToA = function (abMap, b) {
	if (b === undefined || b === null) throw new Error("undefined or null object passed to parser");
	if (typeof b === "string") b = b.trim();
	for (const v in abMap) {
		if (!abMap.hasOwnProperty(v)) continue;
		if (abMap[v] === b) return v
	}
	return b;
};

Parser.attAbvToFull = function (abv) {
	return Parser._parse_aToB(Parser.ATB_ABV_TO_FULL, abv);
};

Parser.attFullToAbv = function (full) {
	return Parser._parse_bToA(Parser.ATB_ABV_TO_FULL, full);
};

Parser.sizeAbvToFull = function (abv) {
	return Parser._parse_aToB(Parser.SIZE_ABV_TO_FULL, abv);
};

Parser.getAbilityModNumber = function (abilityScore) {
	return Math.floor((abilityScore - 10) / 2);
};

Parser.getAbilityModifier = function (abilityScore) {
	let modifier = Parser.getAbilityModNumber(abilityScore);
	if (modifier >= 0) modifier = "+" + modifier;
	return modifier;
};

Parser._addCommas = function (intNum) {
	return (intNum + "").replace(/(\d)(?=(\d{3})+$)/g, "$1,");
};

Parser.crToXp = function (cr) {
	if (cr === "Unknown" || cr === undefined) return "Unknown";
	if (cr === "0") return "0 or 10";
	if (cr === "1/8") return "25";
	if (cr === "1/4") return "50";
	if (cr === "1/2") return "100";
	return Parser._addCommas(Parser.XP_CHART[parseInt(cr) - 1]);
};

LEVEL_TO_XP_EASY = [0, 25, 50, 75, 125, 250, 300, 350, 450, 550, 600, 800, 1000, 1100, 1250, 1400, 1600, 2000, 2100, 2400, 2800];
LEVEL_TO_XP_MEDIUM = [0, 50, 100, 150, 250, 500, 600, 750, 900, 1100, 1200, 1600, 2000, 2200, 2500, 2800, 3200, 3900, 4100, 4900, 5700];
LEVEL_TO_XP_HARD = [0, 75, 150, 225, 375, 750, 900, 1100, 1400, 1600, 1900, 2400, 3000, 3400, 3800, 4300, 4800, 5900, 6300, 7300, 8500];
LEVEL_TO_XP_DEADLY = [0, 100, 200, 400, 500, 1100, 1400, 1700, 2100, 2400, 2800, 3600, 4500, 5100, 5700, 6400, 7200, 8800, 9500, 10900, 12700];

Parser.levelToXpThreshold = function (level) {
	return [LEVEL_TO_XP_EASY[level], LEVEL_TO_XP_MEDIUM[level], LEVEL_TO_XP_HARD[level], LEVEL_TO_XP_DEADLY[level]];
};

Parser.crToNumber = function (cr) {
	if (cr === "Unknown" || cr === undefined) return 100;
	const parts = cr.trim().split("/");
	if (parts.length === 1) return Number(parts[0]);
	else if (parts.length === 2) return Number(parts[0]) / Number(parts[1]);
	else return 0;
};

Parser.armorFullToAbv = function (armor) {
	return Parser._parse_bToA(Parser.ARMOR_ABV_TO_FULL, armor);
};

Parser._getSourceStringFromSource = function (source) {
	if (source && source.source) return source.source;
	return source;
};
Parser.sourceJsonToFull = function (source) {
	source = Parser._getSourceStringFromSource(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_FULL, source).replace(/'/g, STR_APOSTROPHE);
};
Parser.sourceJsonToFullCompactPrefix = function (source) {
	source = Parser._getSourceStringFromSource(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_FULL, source)
		.replace(/'/g, STR_APOSTROPHE)
		.replace(UA_PREFIX, UA_PREFIX_SHORT)
		.replace(AL_PREFIX, AL_PREFIX_SHORT)
		.replace(PS_PREFIX, PS_PREFIX_SHORT);
};
Parser.sourceJsonToAbv = function (source) {
	source = Parser._getSourceStringFromSource(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_ABV, source);
};

Parser.stringToSlug = function (str) {
	return str.toLowerCase().replace(/[^\w ]+/g, STR_EMPTY).replace(/ +/g, STR_SLUG_DASH);
};

Parser.stringToCasedSlug = function (str) {
	return str.replace(/[^\w ]+/g, STR_EMPTY).replace(/ +/g, STR_SLUG_DASH);
};

Parser.itemTypeToAbv = function (type) {
	return Parser._parse_aToB(Parser.ITEM_TYPE_JSON_TO_ABV, type);
};

Parser.dmgTypeToFull = function (dmgType) {
	return Parser._parse_aToB(Parser.DMGTYPE_JSON_TO_FULL, dmgType);
};

Parser.skillToExplanation = function (skillType) {
	return Parser._parse_aToB(Parser.SKILL_JSON_TO_FULL, skillType);
};

Parser.actionToExplanation = function (actionType) {
	return Parser._parse_aToB(Parser.ACTION_JSON_TO_FULL, actionType);
};

Parser.numberToString = function (num) {
	if (num === 0) return "zero";
	else return parse_hundreds(num);

	function parse_hundreds (num) {
		if (num > 99) {
			return Parser.NUMBERS_ONES[Math.floor(num / 100)] + " hundred " + parse_tens(num % 100);
		} else {
			return parse_tens(num);
		}
	}

	function parse_tens (num) {
		if (num < 10) return Parser.NUMBERS_ONES[num];
		else if (num >= 10 && num < 20) return Parser.NUMBERS_TEENS[num - 10];
		else {
			return Parser.NUMBERS_TENS[Math.floor(num / 10)] + " " + Parser.NUMBERS_ONES[num % 10];
		}
	}
};

// sp-prefix functions are for parsing spell data, and shared with the roll20 script
Parser.spSchoolAbvToFull = function (school) {
	return Parser._parse_aToB(Parser.SP_SCHOOL_ABV_TO_FULL, school);
};

Parser.spSchoolAbvToShort = function (school) {
	return Parser._parse_aToB(Parser.SP_SCHOOL_ABV_TO_SHORT, school);
};

Parser.spLevelToFull = function (level) {
	if (level === 0) return STR_CANTRIP;
	if (level === 1) return level + "st";
	if (level === 2) return level + "nd";
	if (level === 3) return level + "rd";
	return level + "th";
};

Parser.spLevelSchoolMetaToFull = function (level, school, meta) {
	const levelPart = level === 0 ? Parser.spLevelToFull(level).toLowerCase() : Parser.spLevelToFull(level) + "-level";
	let levelSchoolStr = level === 0 ? `${Parser.spSchoolAbvToFull(school)} ${levelPart}` : `${levelPart} ${Parser.spSchoolAbvToFull(school).toLowerCase()}`;
	// these tags are (so far) mutually independent, so we don't need to combine the text
	if (meta && meta.ritual) levelSchoolStr += " (ritual)";
	if (meta && meta.technomagic) levelSchoolStr += " (technomagic)";
	return levelSchoolStr;
};

Parser.spTimeListToFull = function (times) {
	return times.map(t => `${Parser.getTimeToFull(t)}${t.condition ? `, ${t.condition}` : ""}`).join(" or ");
};

Parser.getTimeToFull = function (time) {
	return `${time.number} ${time.unit}${time.number > 1 ? "s" : ""}`
};

Parser.spRangeToFull = function (range) {
	switch (range.type) {
		case RNG_SPECIAL:
			return "Special";
		case RNG_POINT:
			return renderPoint();
		case RNG_LINE:
		case RNG_CUBE:
		case RNG_CONE:
		case RNG_RADIUS:
		case RNG_SPHERE:
		case RNG_HEMISPHERE:
			return renderArea();
	}

	function renderPoint () {
		const dist = range.distance;
		switch (dist.type) {
			case UNT_FEET:
			case UNT_MILES:
				return `${dist.amount} ${dist.amount === 1 ? Parser.getSingletonUnit(dist.type) : dist.type}`;
			case RNG_SELF:
				return "Self";
			case RNG_SIGHT:
				return "Sight";
			case RNG_UNLIMITED:
				return "Unlimited";
			case RNG_UNLIMITED_SAME_PLANE:
				return "Unlimited on the same plane";
			case RNG_TOUCH:
				return "Touch";
		}
	}

	function renderArea () {
		const size = range.distance;
		return `Self (${size.amount}-${Parser.getSingletonUnit(size.type)}${getAreaStyleStr()})`;

		function getAreaStyleStr () {
			return range.type === RNG_SPHERE || range.type === RNG_HEMISPHERE ? "-radius" : " " + range.type;
		}
	}
};

Parser.getSingletonUnit = function (unit) {
	if (unit === UNT_FEET) return "foot";
	if (unit.charAt(unit.length - 1) === "s") return unit.slice(0, -1);
	return unit;
};

Parser.spComponentsToFull = function (comp) {
	const out = [];
	if (comp.v) out.push("V");
	if (comp.s) out.push("S");
	if (comp.m) out.push("M" + (comp.m.length ? ` (${comp.m})` : ""));
	return out.join(", ");
};

Parser.spDurationToFull = function (dur) {
	return dur.map(d => {
		switch (d.type) {
			case "special":
				return "Special";
			case "instant":
				return `Instantaneous${d.condition ? ` (${d.condition})` : ""}`;
			case "timed":
				return `${d.concentration ? "Concentration, " : ""}${d.duration.upTo && d.concentration ? "u" : d.duration.upTo ? "U" : ""}${d.duration.upTo ? "p to " : ""}${d.duration.amount} ${d.duration.amount === 1 ? Parser.getSingletonUnit(d.duration.type) : d.duration.type}`;
			case "permanent":
				if (d.ends) {
					return `Until ${d.ends.map(m => m === "dispell" ? "dispelled" : m === "trigger" ? "triggered" : m === "discharge" ? "discharged" : undefined).join(" or ")}`
				} else {
					return "Permanent";
				}
		}
	}).join(" or ") + (dur.length > 1 ? " (see below)" : "");
};

Parser.spClassesToFull = function (classes) {
	const fromSubclasses = Parser.spSubclassesToFull(classes);
	return Parser.spMainClassesToFull(classes) + (fromSubclasses ? ", " + fromSubclasses : "");
};

Parser.spMainClassesToFull = function (classes) {
	return classes.fromClassList
		.sort((a, b) => ascSort(a.name, b.name))
		.map(c => `<span title="Source: ${Parser.sourceJsonToFull(c.source)}">${c.name}</span>`)
		.join(", ");
};

Parser.spSubclassesToFull = function (classes) {
	if (!classes.fromSubclass) return "";
	return classes.fromSubclass
		.sort((a, b) => {
			const byName = ascSort(a.class.name, b.class.name);
			return byName || ascSort(a.subclass.name, b.subclass.name);
		})
		.map(c => Parser._spSubclassItem(c))
		.join(", ");
};

Parser._spSubclassItem = function (fromSubclass) {
	return `<span class="italic" title="Source: ${Parser.sourceJsonToFull(fromSubclass.subclass.source)}">${fromSubclass.subclass.name}${fromSubclass.subclass.subSubclass ? ` (${fromSubclass.subclass.subSubclass})` : ""}</span> <span title="Source: ${Parser.sourceJsonToFull(fromSubclass.class.source)}">${fromSubclass.class.name}</span>`;
};

Parser.monTypeToFullObj = function (type) {
	const out = {type: "", tags: [], asText: ""};

	if (typeof type === "string") {
		// handles e.g. "fey"
		out.type = type;
		out.asText = type;
		return out;
	}

	const tempTags = [];
	if (type.tags) {
		for (const tag of type.tags) {
			if (typeof tag === "string") {
				// handles e.g. "fiend (devil)"
				out.tags.push(tag);
				tempTags.push(tag);
			} else {
				// handles e.g. "humanoid (Chondathan human)"
				out.tags.push(tag.tag);
				tempTags.push(`${tag.prefix} ${tag.tag}`);
			}
		}
	}
	out.type = type.type;
	if (type.swarmSize) {
		out.tags.push("swarm");
		out.asText = `swarm of ${Parser.sizeAbvToFull(type.swarmSize).toLowerCase()} ${Parser.monTypeToPlural(type.type)}`;
	} else {
		out.asText = `${type.type} (${tempTags.join(", ")})`;
	}
	return out;
};

Parser.monTypeToPlural = function (type) {
	return Parser._parse_aToB(Parser.MON_TYPE_TO_PLURAL, type);
};

Parser.CAT_ID_CREATURE = 1;
Parser.CAT_ID_SPELL = 2;
Parser.CAT_ID_BACKGROUND = 3;
Parser.CAT_ID_ITEM = 4;
Parser.CAT_ID_CLASS = 5;
Parser.CAT_ID_CONDITION = 6;
Parser.CAT_ID_FEAT = 7;
Parser.CAT_ID_ELDRITCH_INVOCATION = 8;
Parser.CAT_ID_PSIONIC = 9;
Parser.CAT_ID_RACE = 10;
Parser.CAT_ID_OTHER_REWARD = 11;
Parser.CAT_ID_VARIANT_OPTIONAL_RULE = 12;
Parser.CAT_ID_ADVENTURE = 13;

Parser.CAT_ID_TO_FULL = {};
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CREATURE] = "Bestiary";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SPELL] = "Spell";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BACKGROUND] = "Background";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ITEM] = "Item";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CLASS] = "Class";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CONDITION] = "Condition";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_FEAT] = "Feat";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ELDRITCH_INVOCATION] = "Eldritch Invocation";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PSIONIC] = "Psionic";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_RACE] = "Race";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_OTHER_REWARD] = "Other Reward";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VARIANT_OPTIONAL_RULE] = "Variant/Optional Rule";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ADVENTURE] = "Adventure";

Parser.pageCategoryToFull = function (catId) {
	return Parser._parse_aToB(Parser.CAT_ID_TO_FULL, catId);
};

/**
 * Build a pair of strings; one with all current subclasses, one with all legacy subclasses
 *
 * @param classes a spell.classes JSON item
 * @returns {*[]} A two-element array. First item is a string of all the current subclasses, second item a string of
 * all the legacy/superceded subclasses
 */
Parser.spSubclassesToCurrentAndLegacyFull = function (classes) {
	const out = [[], []];
	if (!classes.fromSubclass) return out;
	const curNames = new Set();
	const toCheck = [];
	classes.fromSubclass
		.sort((a, b) => {
			const byName = ascSort(a.class.name, b.class.name);
			return byName || ascSort(a.subclass.name, b.subclass.name);
		})
		.forEach(c => {
			const nm = c.subclass.name;
			const src = c.subclass.source;
			const toAdd = Parser._spSubclassItem(c);
			if (hasBeenReprinted(nm, src)) {
				out[1].push(toAdd);
			} else if (Parser.sourceJsonToFull(src).startsWith(UA_PREFIX) || Parser.sourceJsonToFull(src).startsWith(PS_PREFIX)) {
				const cleanName = mapClassShortNameToMostRecent(nm.split("(")[0].trim().split(/v\d+/)[0].trim());
				toCheck.push({"name": cleanName, "ele": toAdd});
			} else {
				out[0].push(toAdd);
				curNames.add(nm);
			}
		});
	toCheck.forEach(n => {
		if (curNames.has(n.name)) {
			out[1].push(n.ele);
		} else {
			out[0].push(n.ele);
		}
	});
	return [out[0].join(", "), out[1].join(", ")];

	/**
	 * Get the most recent iteration of a subclass name
	 */
	function mapClassShortNameToMostRecent (shortName) {
		switch (shortName) {
			case "Favored Soul":
				return "Divine Soul";
			case "Undying Light":
				return "Celestial";
			case "Deep Stalker":
				return "Gloom Stalker";
		}
		return shortName;
	}
};

SKL_ABV_ABJ = "A";
SKL_ABV_EVO = "V";
SKL_ABV_ENC = "E";
SKL_ABV_ILL = "I";
SKL_ABV_DIV = "D";
SKL_ABV_NEC = "N";
SKL_ABV_TRA = "T";
SKL_ABV_CON = "C";

SKL_ABJ = "Abjuration";
SKL_EVO = "Evocation";
SKL_ENC = "Enchantment";
SKL_ILL = "Illusion";
SKL_DIV = "Divination";
SKL_NEC = "Necromancy";
SKL_TRA = "Transmutation";
SKL_CON = "Conjuration";

Parser.SP_SCHOOL_ABV_TO_FULL = {};
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_ABJ] = SKL_ABJ;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_EVO] = SKL_EVO;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_ENC] = SKL_ENC;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_ILL] = SKL_ILL;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_DIV] = SKL_DIV;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_NEC] = SKL_NEC;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_TRA] = SKL_TRA;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_CON] = SKL_CON;

Parser.SP_SCHOOL_ABV_TO_SHORT = {};
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_ABJ] = "Abj.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_EVO] = "Evoc.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_ENC] = "Ench.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_ILL] = "Illu.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_DIV] = "Divin.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_NEC] = "Necro.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_TRA] = "Trans.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_CON] = "Conj.";

Parser.ATB_ABV_TO_FULL = {
	"str": "Strength",
	"dex": "Dexterity",
	"con": "Constitution",
	"int": "Intelligence",
	"wis": "Wisdom",
	"cha": "Charisma"
};

TP_ABERRATION = "aberration";
TP_BEAST = "beast";
TP_CELESTIAL = "celestial";
TP_CONSTRUCT = "construct";
TP_DRAGON = "dragon";
TP_ELEMENTAL = "elemental";
TP_FEY = "fey";
TP_FIEND = "fiend";
TP_GIANT = "giant";
TP_HUMANOID = "humanoid";
TP_MONSTROSITY = "monstrosity";
TP_OOZE = "ooze";
TP_PLANT = "plant";
TP_UNDEAD = "undead";
Parser.MON_TYPE_TO_PLURAL = {};
Parser.MON_TYPE_TO_PLURAL[TP_ABERRATION] = "aberrations";
Parser.MON_TYPE_TO_PLURAL[TP_BEAST] = "beasts";
Parser.MON_TYPE_TO_PLURAL[TP_CELESTIAL] = "celestials";
Parser.MON_TYPE_TO_PLURAL[TP_CONSTRUCT] = "constructs";
Parser.MON_TYPE_TO_PLURAL[TP_DRAGON] = "dragons";
Parser.MON_TYPE_TO_PLURAL[TP_ELEMENTAL] = "elementals";
Parser.MON_TYPE_TO_PLURAL[TP_FEY] = "fey";
Parser.MON_TYPE_TO_PLURAL[TP_FIEND] = "fiends";
Parser.MON_TYPE_TO_PLURAL[TP_GIANT] = "giants";
Parser.MON_TYPE_TO_PLURAL[TP_HUMANOID] = "humanoids";
Parser.MON_TYPE_TO_PLURAL[TP_MONSTROSITY] = "monstrosities";
Parser.MON_TYPE_TO_PLURAL[TP_OOZE] = "oozes";
Parser.MON_TYPE_TO_PLURAL[TP_PLANT] = "plants";
Parser.MON_TYPE_TO_PLURAL[TP_UNDEAD] = "undead";

SZ_FINE = "F";
SZ_DIMINUTIVE = "D";
SZ_TINY = "T";
SZ_SMALL = "S";
SZ_MEDIUM = "M";
SZ_LARGE = "L";
SZ_HUGE = "H";
SZ_GARGANTUAN = "G";
SZ_COLOSSAL = "C";
SZ_VARIES = "V";
Parser.SIZE_ABV_TO_FULL = {};
Parser.SIZE_ABV_TO_FULL[SZ_FINE] = "Fine";
Parser.SIZE_ABV_TO_FULL[SZ_DIMINUTIVE] = "Diminutive";
Parser.SIZE_ABV_TO_FULL[SZ_TINY] = "Tiny";
Parser.SIZE_ABV_TO_FULL[SZ_SMALL] = "Small";
Parser.SIZE_ABV_TO_FULL[SZ_MEDIUM] = "Medium";
Parser.SIZE_ABV_TO_FULL[SZ_LARGE] = "Large";
Parser.SIZE_ABV_TO_FULL[SZ_HUGE] = "Huge";
Parser.SIZE_ABV_TO_FULL[SZ_GARGANTUAN] = "Gargantuan";
Parser.SIZE_ABV_TO_FULL[SZ_COLOSSAL] = "Colossal";
Parser.SIZE_ABV_TO_FULL[SZ_VARIES] = "Varies";

Parser.XP_CHART = [200, 450, 700, 1100, 1800, 2300, 2900, 3900, 5000, 5900, 7200, 8400, 10000, 11500, 13000, 15000, 18000, 20000, 22000, 25000, 30000, 41000, 50000, 62000, 75000, 90000, 105000, 102000, 135000, 155000];

Parser.ARMOR_ABV_TO_FULL = {
	"l.": "light",
	"m.": "medium",
	"h.": "heavy"
};

SRC_CoS = "CoS";
SRC_DMG = "DMG";
SRC_EEPC = "EEPC";
SRC_EET = "EET";
SRC_HotDQ = "HotDQ";
SRC_LMoP = "LMoP";
SRC_MM = "MM";
SRC_OotA = "OotA";
SRC_PHB = "PHB";
SRC_PotA = "PotA";
SRC_RoT = "RoT";
SRC_RoTOS = "RoTOS";
SRC_SCAG = "SCAG";
SRC_SKT = "SKT";
SRC_ToA = "ToA";
SRC_ToD = "ToD";
SRC_TTP = "TTP";
SRC_TYP = "TftYP";
SRC_TYP_AtG = "TftYP-AtG";
SRC_TYP_DiT = "TftYP-DiT";
SRC_TYP_TFoF = "TftYP-TFoF";
SRC_TYP_THSoT = "TftYP-THSoT";
SRC_TYP_TSC = "TftYP-TSC";
SRC_TYP_ToH = "TftYP-ToH";
SRC_TYP_WPM = "TftYP-WPM";
SRC_VGM = "VGM";
SRC_XGE = "XGE";
SRC_OGA = "OGA";

SRC_ALCoS = "ALCurseOfStrahd";
SRC_ALEE = "ALElementalEvil";
SRC_ALRoD = "ALRageOfDemons";

SRC_PS_PREFIX = "PS";

SRC_PSA = SRC_PS_PREFIX + "A";
SRC_PSI = SRC_PS_PREFIX + "I";
SRC_PSK = SRC_PS_PREFIX + "K";
SRC_PSZ = SRC_PS_PREFIX + "Z";
SRC_PSX = SRC_PS_PREFIX + "X";

SRC_UA_PREFIX = "UA";

SRC_UAA = SRC_UA_PREFIX + "Artificer";
SRC_UAEAG = SRC_UA_PREFIX + "EladrinAndGith";
SRC_UAEBB = SRC_UA_PREFIX + "Eberron";
SRC_UAFFR = SRC_UA_PREFIX + "FeatsForRaces";
SRC_UAFFS = SRC_UA_PREFIX + "FeatsForSkills";
SRC_UAFO = SRC_UA_PREFIX + "FiendishOptions";
SRC_UAFT = SRC_UA_PREFIX + "Feats";
SRC_UAGH = SRC_UA_PREFIX + "GothicHeroes";
SRC_UAMDM = SRC_UA_PREFIX + "ModernMagic";
SRC_UASSP = SRC_UA_PREFIX + "StarterSpells";
SRC_UATMC = SRC_UA_PREFIX + "TheMysticClass";
SRC_UATOBM = SRC_UA_PREFIX + "ThatOldBlackMagic";
SRC_UATRR = SRC_UA_PREFIX + "TheRangerRevised";
SRC_UAWA = SRC_UA_PREFIX + "WaterborneAdventures";
SRC_UAVR = SRC_UA_PREFIX + "VariantRules";
SRC_UALDR = SRC_UA_PREFIX + "LightDarkUnderdark";
SRC_UARAR = SRC_UA_PREFIX + "RangerAndRogue";
SRC_UAATOSC = SRC_UA_PREFIX + "ATrioOfSubclasses";
SRC_UABPP = SRC_UA_PREFIX + "BarbarianPrimalPaths";
SRC_UARSC = SRC_UA_PREFIX + "RevisedSubclasses";
SRC_UAKOO = SRC_UA_PREFIX + "KitsOfOld";
SRC_UABBC = SRC_UA_PREFIX + "BardBardColleges";
SRC_UACDD = SRC_UA_PREFIX + "ClericDivineDomains";
SRC_UAD = SRC_UA_PREFIX + "Druid";
SRC_UARCO = SRC_UA_PREFIX + "RevisedClassOptions";
SRC_UAF = SRC_UA_PREFIX + "Fighter";
SRC_UAM = SRC_UA_PREFIX + "Monk";
SRC_UAP = SRC_UA_PREFIX + "Paladin";
SRC_UAMC = SRC_UA_PREFIX + "ModifyingClasses";
SRC_UAS = SRC_UA_PREFIX + "Sorcerer";
SRC_UAWAW = SRC_UA_PREFIX + "WarlockAndWizard";
SRC_UATF = SRC_UA_PREFIX + "TheFaithful";
SRC_UAWR = SRC_UA_PREFIX + "WizardRevisited";
SRC_UAESR = SRC_UA_PREFIX + "ElfSubraces";
SRC_UAMAC = SRC_UA_PREFIX + "MassCombat";
SRC_UA3PE = SRC_UA_PREFIX + "ThreePillarExperience";
SRC_UAGHI = SRC_UA_PREFIX + "GreyhawkInitiative";

SRC_3PP_SUFFIX = " 3pp";
SRC_BOLS_3PP = "BoLS" + SRC_3PP_SUFFIX;
SRC_ToB_3PP = "ToB" + SRC_3PP_SUFFIX;

AL_PREFIX = "Adventurers League: ";
AL_PREFIX_SHORT = "AL: ";
PS_PREFIX = "Plane Shift: ";
PS_PREFIX_SHORT = "PS: ";
UA_PREFIX = "Unearthed Arcana: ";
UA_PREFIX_SHORT = "UA: ";
PP3_SUFFIX = " (3pp)";
TftYP_NAME = "Tales from the Yawning Portal";

Parser.SOURCE_JSON_TO_FULL = {};
Parser.SOURCE_JSON_TO_FULL[SRC_CoS] = "Curse of Strahd";
Parser.SOURCE_JSON_TO_FULL[SRC_DMG] = "Dungeon Master's Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_EEPC] = "Elemental Evil Player's Companion";
Parser.SOURCE_JSON_TO_FULL[SRC_EET] = "Elemental Evil: Trinkets";
Parser.SOURCE_JSON_TO_FULL[SRC_HotDQ] = "Hoard of the Dragon Queen";
Parser.SOURCE_JSON_TO_FULL[SRC_LMoP] = "Lost Mine of Phandelver";
Parser.SOURCE_JSON_TO_FULL[SRC_MM] = "Monster Manual";
Parser.SOURCE_JSON_TO_FULL[SRC_OotA] = "Out of the Abyss";
Parser.SOURCE_JSON_TO_FULL[SRC_PHB] = "Player's Handbook";
Parser.SOURCE_JSON_TO_FULL[SRC_PotA] = "Princes of the Apocalypse";
Parser.SOURCE_JSON_TO_FULL[SRC_RoT] = "The Rise of Tiamat";
Parser.SOURCE_JSON_TO_FULL[SRC_RoTOS] = "The Rise of Tiamat Online Supplement";
Parser.SOURCE_JSON_TO_FULL[SRC_SCAG] = "Sword Coast Adventurer's Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_SKT] = "Storm King's Thunder";
Parser.SOURCE_JSON_TO_FULL[SRC_ToA] = "Tomb of Annihilation";
Parser.SOURCE_JSON_TO_FULL[SRC_ToD] = "Tyranny of Dragons";
Parser.SOURCE_JSON_TO_FULL[SRC_TTP] = "The Tortle Package";
Parser.SOURCE_JSON_TO_FULL[SRC_TYP] = TftYP_NAME;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_AtG] = TftYP_NAME;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_DiT] = TftYP_NAME;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_TFoF] = TftYP_NAME;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_THSoT] = TftYP_NAME;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_TSC] = TftYP_NAME;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_ToH] = TftYP_NAME;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_WPM] = TftYP_NAME;
Parser.SOURCE_JSON_TO_FULL[SRC_VGM] = "Volo's Guide to Monsters";
Parser.SOURCE_JSON_TO_FULL[SRC_XGE] = "Xanathar's Guide to Everything";
Parser.SOURCE_JSON_TO_FULL[SRC_OGA] = "One Grung Above";
Parser.SOURCE_JSON_TO_FULL[SRC_ALCoS] = AL_PREFIX + "Curse of Strahd";
Parser.SOURCE_JSON_TO_FULL[SRC_ALEE] = AL_PREFIX + "Elemental Evil";
Parser.SOURCE_JSON_TO_FULL[SRC_ALRoD] = AL_PREFIX + "Rage of Demons";
Parser.SOURCE_JSON_TO_FULL[SRC_PSA] = PS_PREFIX + "Amonkhet";
Parser.SOURCE_JSON_TO_FULL[SRC_PSI] = PS_PREFIX + "Innistrad";
Parser.SOURCE_JSON_TO_FULL[SRC_PSK] = PS_PREFIX + "Kaladesh";
Parser.SOURCE_JSON_TO_FULL[SRC_PSZ] = PS_PREFIX + "Zendikar";
Parser.SOURCE_JSON_TO_FULL[SRC_PSX] = PS_PREFIX + "Ixalan";
Parser.SOURCE_JSON_TO_FULL[SRC_UAA] = UA_PREFIX + "Artificer";
Parser.SOURCE_JSON_TO_FULL[SRC_UAEAG] = UA_PREFIX + "Eladrin and Gith";
Parser.SOURCE_JSON_TO_FULL[SRC_UAEBB] = UA_PREFIX + "Eberron";
Parser.SOURCE_JSON_TO_FULL[SRC_UAFFR] = UA_PREFIX + "Feats for Races";
Parser.SOURCE_JSON_TO_FULL[SRC_UAFFS] = UA_PREFIX + "Feats for Skills";
Parser.SOURCE_JSON_TO_FULL[SRC_UAFO] = UA_PREFIX + "Fiendish Options";
Parser.SOURCE_JSON_TO_FULL[SRC_UAFT] = UA_PREFIX + "Feats";
Parser.SOURCE_JSON_TO_FULL[SRC_UAGH] = UA_PREFIX + "Gothic Heroes";
Parser.SOURCE_JSON_TO_FULL[SRC_UAMDM] = UA_PREFIX + "Modern Magic";
Parser.SOURCE_JSON_TO_FULL[SRC_UASSP] = UA_PREFIX + "Starter Spells";
Parser.SOURCE_JSON_TO_FULL[SRC_UATMC] = UA_PREFIX + "The Mystic Class";
Parser.SOURCE_JSON_TO_FULL[SRC_UATOBM] = UA_PREFIX + "That Old Black Magic";
Parser.SOURCE_JSON_TO_FULL[SRC_UATRR] = UA_PREFIX + "The Ranger, Revised";
Parser.SOURCE_JSON_TO_FULL[SRC_UAWA] = UA_PREFIX + "Waterborne Adventures";
Parser.SOURCE_JSON_TO_FULL[SRC_UAVR] = UA_PREFIX + "Variant Rules";
Parser.SOURCE_JSON_TO_FULL[SRC_UALDR] = UA_PREFIX + "Light, Dark, Underdark!";
Parser.SOURCE_JSON_TO_FULL[SRC_UARAR] = UA_PREFIX + "Ranger and Rogue";
Parser.SOURCE_JSON_TO_FULL[SRC_UAATOSC] = UA_PREFIX + "A Trio of Subclasses";
Parser.SOURCE_JSON_TO_FULL[SRC_UABPP] = UA_PREFIX + "Barbarian Primal Paths";
Parser.SOURCE_JSON_TO_FULL[SRC_UARSC] = UA_PREFIX + "Revised Subclasses";
Parser.SOURCE_JSON_TO_FULL[SRC_UAKOO] = UA_PREFIX + "Kits of Old";
Parser.SOURCE_JSON_TO_FULL[SRC_UABBC] = UA_PREFIX + "Bard: Bard Colleges";
Parser.SOURCE_JSON_TO_FULL[SRC_UACDD] = UA_PREFIX + "Cleric: Divine Domains";
Parser.SOURCE_JSON_TO_FULL[SRC_UAD] = UA_PREFIX + "Druid";
Parser.SOURCE_JSON_TO_FULL[SRC_UARCO] = UA_PREFIX + "Revised Class Options";
Parser.SOURCE_JSON_TO_FULL[SRC_UAF] = UA_PREFIX + "Fighter";
Parser.SOURCE_JSON_TO_FULL[SRC_UAM] = UA_PREFIX + "Monk";
Parser.SOURCE_JSON_TO_FULL[SRC_UAP] = UA_PREFIX + "Paladin";
Parser.SOURCE_JSON_TO_FULL[SRC_UAMC] = UA_PREFIX + "Modifying Classes";
Parser.SOURCE_JSON_TO_FULL[SRC_UAS] = UA_PREFIX + "Sorcerer";
Parser.SOURCE_JSON_TO_FULL[SRC_UAWAW] = UA_PREFIX + "Warlock and Wizard";
Parser.SOURCE_JSON_TO_FULL[SRC_UATF] = UA_PREFIX + "The Faithful";
Parser.SOURCE_JSON_TO_FULL[SRC_UAWR] = UA_PREFIX + "Wizard Revisited";
Parser.SOURCE_JSON_TO_FULL[SRC_UAESR] = UA_PREFIX + "Elf Subraces";
Parser.SOURCE_JSON_TO_FULL[SRC_UAMAC] = UA_PREFIX + "Mass Combat";
Parser.SOURCE_JSON_TO_FULL[SRC_UA3PE] = UA_PREFIX + "Three-Pillar Experience";
Parser.SOURCE_JSON_TO_FULL[SRC_UAGHI] = UA_PREFIX + "Greyhawk Initiative";
Parser.SOURCE_JSON_TO_FULL[SRC_BOLS_3PP] = "Book of Lost Spells" + PP3_SUFFIX;
Parser.SOURCE_JSON_TO_FULL[SRC_ToB_3PP] = "Tome of Beasts" + PP3_SUFFIX;

Parser.SOURCE_JSON_TO_ABV = {};
Parser.SOURCE_JSON_TO_ABV[SRC_CoS] = "CoS";
Parser.SOURCE_JSON_TO_ABV[SRC_DMG] = "DMG";
Parser.SOURCE_JSON_TO_ABV[SRC_EEPC] = "EEPC";
Parser.SOURCE_JSON_TO_ABV[SRC_EET] = "EET";
Parser.SOURCE_JSON_TO_ABV[SRC_HotDQ] = "HotDQ";
Parser.SOURCE_JSON_TO_ABV[SRC_LMoP] = "LMoP";
Parser.SOURCE_JSON_TO_ABV[SRC_MM] = "MM";
Parser.SOURCE_JSON_TO_ABV[SRC_OotA] = "OotA";
Parser.SOURCE_JSON_TO_ABV[SRC_PHB] = "PHB";
Parser.SOURCE_JSON_TO_ABV[SRC_PotA] = "PotA";
Parser.SOURCE_JSON_TO_ABV[SRC_RoT] = "RoT";
Parser.SOURCE_JSON_TO_ABV[SRC_RoTOS] = "RoTOS";
Parser.SOURCE_JSON_TO_ABV[SRC_SCAG] = "SCAG";
Parser.SOURCE_JSON_TO_ABV[SRC_SKT] = "SKT";
Parser.SOURCE_JSON_TO_ABV[SRC_ToA] = "ToA";
Parser.SOURCE_JSON_TO_ABV[SRC_ToD] = "ToD";
Parser.SOURCE_JSON_TO_ABV[SRC_TTP] = "TTP";
Parser.SOURCE_JSON_TO_ABV[SRC_TYP] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[SRC_TYP_AtG] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[SRC_TYP_DiT] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[SRC_TYP_TFoF] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[SRC_TYP_THSoT] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[SRC_TYP_TSC] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[SRC_TYP_ToH] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[SRC_TYP_WPM] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[SRC_VGM] = "VGM";
Parser.SOURCE_JSON_TO_ABV[SRC_XGE] = "XGE";
Parser.SOURCE_JSON_TO_ABV[SRC_OGA] = "OGA";
Parser.SOURCE_JSON_TO_ABV[SRC_ALCoS] = "ALCoS";
Parser.SOURCE_JSON_TO_ABV[SRC_ALEE] = "ALEE";
Parser.SOURCE_JSON_TO_ABV[SRC_ALRoD] = "ALRoD";
Parser.SOURCE_JSON_TO_ABV[SRC_PSA] = "PSA";
Parser.SOURCE_JSON_TO_ABV[SRC_PSI] = "PSI";
Parser.SOURCE_JSON_TO_ABV[SRC_PSK] = "PSK";
Parser.SOURCE_JSON_TO_ABV[SRC_PSZ] = "PSZ";
Parser.SOURCE_JSON_TO_ABV[SRC_PSX] = "PSX";
Parser.SOURCE_JSON_TO_ABV[SRC_UAA] = "UAA";
Parser.SOURCE_JSON_TO_ABV[SRC_UAEAG] = "UAEaG";
Parser.SOURCE_JSON_TO_ABV[SRC_UAEBB] = "UAEB";
Parser.SOURCE_JSON_TO_ABV[SRC_UAFFR] = "UAFFR";
Parser.SOURCE_JSON_TO_ABV[SRC_UAFFS] = "UAFFS";
Parser.SOURCE_JSON_TO_ABV[SRC_UAFO] = "UAFO";
Parser.SOURCE_JSON_TO_ABV[SRC_UAFT] = "UAFT";
Parser.SOURCE_JSON_TO_ABV[SRC_UAGH] = "UAGH";
Parser.SOURCE_JSON_TO_ABV[SRC_UAMDM] = "UAMM";
Parser.SOURCE_JSON_TO_ABV[SRC_UASSP] = "UASS";
Parser.SOURCE_JSON_TO_ABV[SRC_UATMC] = "UAM";
Parser.SOURCE_JSON_TO_ABV[SRC_UATOBM] = "UAOBM";
Parser.SOURCE_JSON_TO_ABV[SRC_UATRR] = "UATRR";
Parser.SOURCE_JSON_TO_ABV[SRC_UAWA] = "UAWA";
Parser.SOURCE_JSON_TO_ABV[SRC_UAVR] = "UAVR";
Parser.SOURCE_JSON_TO_ABV[SRC_UALDR] = "UALDU";
Parser.SOURCE_JSON_TO_ABV[SRC_UARAR] = "UARAR";
Parser.SOURCE_JSON_TO_ABV[SRC_UAATOSC] = "UAATOSC";
Parser.SOURCE_JSON_TO_ABV[SRC_UABPP] = "UABPP";
Parser.SOURCE_JSON_TO_ABV[SRC_UARSC] = "UARSC";
Parser.SOURCE_JSON_TO_ABV[SRC_UAKOO] = "UAKOO";
Parser.SOURCE_JSON_TO_ABV[SRC_UABBC] = "UABBC";
Parser.SOURCE_JSON_TO_ABV[SRC_UACDD] = "UACDD";
Parser.SOURCE_JSON_TO_ABV[SRC_UAD] = "UAD";
Parser.SOURCE_JSON_TO_ABV[SRC_UARCO] = "UARCO";
Parser.SOURCE_JSON_TO_ABV[SRC_UAF] = "UAF";
Parser.SOURCE_JSON_TO_ABV[SRC_UAM] = "UAM";
Parser.SOURCE_JSON_TO_ABV[SRC_UAP] = "UAP";
Parser.SOURCE_JSON_TO_ABV[SRC_UAMC] = "UAMC";
Parser.SOURCE_JSON_TO_ABV[SRC_UAS] = "UAS";
Parser.SOURCE_JSON_TO_ABV[SRC_UAWAW] = "UAWAW";
Parser.SOURCE_JSON_TO_ABV[SRC_UATF] = "UATF";
Parser.SOURCE_JSON_TO_ABV[SRC_UAWR] = "UAWR";
Parser.SOURCE_JSON_TO_ABV[SRC_UAESR] = "UAESR";
Parser.SOURCE_JSON_TO_ABV[SRC_UAMAC] = "UAMAC";
Parser.SOURCE_JSON_TO_ABV[SRC_UA3PE] = "UA3PE";
Parser.SOURCE_JSON_TO_ABV[SRC_UAGHI] = "UAGHI";
Parser.SOURCE_JSON_TO_ABV[SRC_BOLS_3PP] = "BoLS (3pp)";
Parser.SOURCE_JSON_TO_ABV[SRC_ToB_3PP] = "ToB (3pp)";

Parser.ITEM_TYPE_JSON_TO_ABV = {
	"A": "Ammunition",
	"AF": "Ammunition",
	"AT": "Artisan Tool",
	"EXP": "Explosive",
	"G": "Adventuring Gear",
	"GS": "Gaming Set",
	"HA": "Heavy Armor",
	"INS": "Instrument",
	"LA": "Light Armor",
	"M": "Melee Weapon",
	"MA": "Medium Armor",
	"MNT": "Mount",
	"GV": "Generic Variant",
	"P": "Potion",
	"R": "Ranged Weapon",
	"RD": "Rod",
	"RG": "Ring",
	"S": "Shield",
	"SC": "Scroll",
	"SCF": "Spellcasting Focus",
	"T": "Tool",
	"TAH": "Tack and Harness",
	"TG": "Trade Good",
	"VEH": "Vehicle",
	"WD": "Wand"
};

Parser.DMGTYPE_JSON_TO_FULL = {
	"B": "bludgeoning",
	"N": "necrotic",
	"P": "piercing",
	"R": "radiant",
	"S": "slashing"
};

Parser.SKILL_JSON_TO_FULL = {
	"Acrobatics": "Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation, such as when you're trying to run across a sheet of ice, balance on a tightrope, or stay upright on a rocking ship's deck.",
	"Animal Handling": "When there is any question whether you can calm down a domesticated animal, keep a mount from getting spooked, or intuit an animal’s intentions, the GM might call for a Wisdom (Animal Handling) check.",
	"Arcana": "Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes.",
	"Athletics": "Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming.",
	"Deception": "Your Charisma (Deception) check determines whether you can convincingly hide the truth, either verbally or through your actions.",
	"History": "Your Intelligence (History) check measures your ability to recall lore about historical events, legendary people, ancient kingdoms, past disputes, recent wars, and lost civilizations.",
	"Insight": "Your Wisdom (Insight) check decides whether you can determine the true intentions of a creature, such as when searching out a lie or predicting someone’s next move.",
	"Intimidation": "When you attempt to influence someone through overt threats, hostile actions, and physical violence, the GM might ask you to make a Charisma (Intimidation) check.",
	"Investigation": "When you look around for clues and make deductions based on those clues, you make an Intelligence (Investigation) check.",
	"Medicine": "A Wisdom (Medicine) check lets you try to stabilize a dying companion or diagnose an illness.",
	"Nature": "Your Intelligence (Nature) check measures your ability to recall lore about terrain, plants and animals, the weather, and natural cycles.",
	"Perception": "Your Wisdom (Perception) check lets you spot, hear, or otherwise detect the presence of something. It measures your general awareness of your surroundings and the keenness of your senses.",
	"Performance": "Your Charisma (Performance) check determines how well you can delight an audience with music, dance, acting, storytelling, or some other form of entertainment.",
	"Persuasion": "When you attempt to influence someone or a group of people with tact, social graces, or good nature, the GM might ask you to make a Charisma (Persuasion) check.",
	"Religion": "Your Intelligence (Religion) check measures your ability to recall lore about deities, rites and prayers, religious hierarchies, holy symbols, and the practices of secret cults.",
	"Sleight of Hand": "Whenever you attempt an act of legerdemain or manual trickery, such as planting something on someone else or concealing an object on your person, make a Dexterity (Sleight of Hand) check.",
	"Stealth": "Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies, slink past guards, slip away without being noticed, or sneak up on someone without being seen or heard.",
	"Survival": "The GM might ask you to make a Wisdom (Survival) check to follow tracks, hunt wild game, guide your group through frozen wastelands, identify signs that owlbears live nearby, predict the weather, or avoid quicksand and other natural hazards."
};

Parser.ACTION_JSON_TO_FULL = {
	"Dash": "When you take the Dash action, you gain extra movement for the current turn. The increase equals your speed, after applying any modifiers. With a speed of 30 feet, for example, you can move up to 60 feet on your turn if you dash.",
	"Disengage": "If you take the Disengage action, your movement doesn’t provoke opportunity attacks for the rest of the turn.",
	"Dodge": "When you take the Dodge action, you focus entirely on avoiding attacks. Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage.",
	"Help": "You can lend your aid to another creature in the completion of a task. The creature you aid gains advantage on the next ability check it makes to perform the task you are helping with, provided that it makes the check before the start of your next turn.",
	"Hide": "When you take the Hide action, you make a Dexterity (Stealth) check in an attempt to hide, following the rules for hiding.",
	"Ready": "Sometimes you want to get the jump on a foe or wait for a particular circumstance before you act. To do so, you can take the Ready action on your turn, which lets you act using your reaction before the start of your next turn."
};

Parser.NUMBERS_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
Parser.NUMBERS_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
Parser.NUMBERS_TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

// SOURCES =============================================================================================================
function hasBeenReprinted (shortName, source) {
	return (shortName !== undefined && shortName !== null && source !== undefined && source !== null) &&
		(
			(shortName === "Sun Soul" && source === SRC_SCAG) ||
			(shortName === "Mastermind" && source === SRC_SCAG) ||
			(shortName === "Swashbuckler" && source === SRC_SCAG) ||
			(shortName === "Storm" && source === SRC_SCAG)
		);
}

function isNonstandardSource (source) {
	/* can accept sources of the form:
	{
		"source": "UAExample",
		"forceStandard": true
	}
	 */
	if (source && source.forceStandard !== undefined) {
		return !source.forceStandard;
	}
	return (source !== undefined && source !== null) && (source.startsWith(SRC_UA_PREFIX) || source.startsWith(SRC_PS_PREFIX) || source.endsWith(SRC_3PP_SUFFIX) || source === SRC_OGA);
}

// CONVENIENCE/ELEMENTS ================================================================================================
function xor (a, b) {
	return !a !== !b;
}

/**
 * > implying
 */
function implies (a, b) {
	return (!a) || b;
}

// SEARCH AND FILTER ===================================================================================================
function search (options) {
	const list = new List("listcontainer", options);
	list.sort("name");
	$("#reset").click(function () {
		$("#filtertools").find("select").val("All");
		$("#search").val("");
		list.search();
		list.sort("name");
		list.filter();
	});
	const listWrapper = $("#listcontainer");
	if (listWrapper.data("lists")) {
		listWrapper.data("lists").push(list);
	} else {
		listWrapper.data("lists", [list]);
	}
	return list
}

/**
 * Generic source filter
 * deselected. If there are more items to be deselected than selected, it is advisable to set this to "true"
 * @param options overrides for the default filter options
 * @returns {*} a `Filter`
 */
function getSourceFilter (options) {
	const baseOptions = {
		header: FilterBox.SOURCE_HEADER,
		displayFn: Parser.sourceJsonToFullCompactPrefix,
		selFn: defaultSourceSelFn
	};
	return getFilterWithMergedOptions(baseOptions, options);
}

function defaultSourceDeselFn (val) {
	return isNonstandardSource(val);
}

function defaultSourceSelFn (val) {
	return !defaultSourceDeselFn(val);
}

function getAsiFilter (options) {
	const baseOptions = {
		header: "Ability Bonus",
		items: [
			"str",
			"dex",
			"con",
			"int",
			"wis",
			"cha"
		],
		displayFn: Parser.attAbvToFull
	};
	return getFilterWithMergedOptions(baseOptions, options);
}

function getFilterWithMergedOptions (baseOptions, addOptions) {
	if (addOptions) Object.assign(baseOptions, addOptions); // merge in anything we get passed
	return new Filter(baseOptions);
}

function initFilterBox (...filterList) {
	return new FilterBox(document.getElementById(ID_SEARCH_BAR), document.getElementById(ID_RESET_BUTTON), filterList);
}

// ENCODING/DECODING ===================================================================================================
UrlUtil = function () {
};
UrlUtil.encodeForHash = function (toEncode) {
	if (toEncode instanceof Array) {
		return toEncode.map(i => encodeForHashHelper(i)).join(HASH_LIST_SEP);
	} else {
		return encodeForHashHelper(toEncode);
	}

	function encodeForHashHelper (part) {
		return encodeURIComponent(part).toLowerCase().replace(/'/g, "%27");
	}
};

UrlUtil.autoEncodeHash = function (obj) {
	const curPage = UrlUtil.getCurrentPage();
	const encoder = UrlUtil.URL_TO_HASH_BUILDER[curPage];
	if (!encoder) throw new Error(`No encoder found for page ${curPage}`);
	return encoder(obj);
};

UrlUtil.getCurrentPage = function () {
	const pSplit = window.location.pathname.split("/");
	return pSplit[pSplit.length - 1];
};

UrlUtil.PG_BESTIARY = "bestiary.html";
UrlUtil.PG_SPELLS = "spells.html";
UrlUtil.PG_BACKGROUNDS = "backgrounds.html";
UrlUtil.PG_ITEMS = "items.html";
UrlUtil.PG_CLASSES = "classes.html";
UrlUtil.PG_CONDITIONS = "conditions.html";
UrlUtil.PG_FEATS = "feats.html";
UrlUtil.PG_INVOCATIONS = "invocations.html";
UrlUtil.PG_PSIONICS = "psionics.html";
UrlUtil.PG_RACES = "races.html";
UrlUtil.PG_REWARDS = "rewards.html";
UrlUtil.PG_VARIATNRULES = "variantrules.html";
UrlUtil.PG_ADVENTURE = "adventure.html";

UrlUtil.URL_TO_HASH_BUILDER = {};
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS] = (it) => UrlUtil.encodeForHash([it.name, Parser.sourceJsonToAbv(it.source)]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_INVOCATIONS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_PSIONICS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_REWARDS] = (it) => UrlUtil.encodeForHash(it.name);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VARIATNRULES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ADVENTURE] = (it) => UrlUtil.encodeForHash(it.id);

// SORTING =============================================================================================================
// TODO refactor into a class
function ascSort (a, b) {
	// to handle `FilterItem`s
	if (a.hasOwnProperty("item") && b.hasOwnProperty("item")) {
		return _ascSort(a.item, b.item);
	}
	return _ascSort(a, b);
}

function _ascSort (a, b) {
	if (b === a) return 0;
	return b < a ? 1 : -1;
}

function compareNames (a, b) {
	if (b._values.name.toLowerCase() === a._values.name.toLowerCase()) return 0;
	else if (b._values.name.toLowerCase() > a._values.name.toLowerCase()) return 1;
	else if (b._values.name.toLowerCase() < a._values.name.toLowerCase()) return -1;
}

// ARRAYS ==============================================================================================================
function joinConjunct (arr, joinWith, conjunctWith) {
	return arr.length === 1 ? String(arr[0]) : arr.length === 2 ? arr.join(conjunctWith) : arr.slice(0, -1).join(joinWith) + conjunctWith + arr.slice(-1);
}

// JSON LOADING ========================================================================================================
function loadJSON (url, onLoadFunction, ...otherData) {
	const request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.overrideMimeType("application/json");
	request.onload = function () {
		const data = JSON.parse(this.response);
		onLoadFunction(data, otherData);
	};
	request.send();
}

/**
 * Loads a sequence of URLs, then calls a final function once all the data is ready
 * @param toLoads array of objects, which should have a `url` property
 * @param onEachLoadFunction function to call after each load completes. Should accept a `toLoad` and the data returned
 * from the load
 * @param onFinalLoadFunction final function to call once all data has been loaded, should accept the `dataStack` array as
 * an argument. `dataStack` is an array of the data pulled from each URL
 */
function multiLoadJSON (toLoads, onEachLoadFunction, onFinalLoadFunction) {
	if (!toLoads.length) onFinalLoadFunction([]);
	const dataStack = [];

	let loadedCount = 0;
	toLoads.forEach(tl => {
		loadJSON(
			tl.url,
			function (data) {
				onEachLoadFunction(tl, data);
				dataStack.push(data);

				loadedCount++;
				if (loadedCount >= toLoads.length) {
					onFinalLoadFunction(dataStack);
				}
			}
		)
	});
}

// SHOW/HIDE SEARCH ====================================================================================================
function addListShowHide () {
	const toInjectShow = `
		<div class="col-xs-12" id="showsearch">
			<button class="btn btn-block btn-default btn-xs" type="button">Show Search</button>
			<br>
		</div>	
	`;

	const toInjectHide = `
		<button class="btn btn-default" type="button" id="hidesearch">Hide</button>
	`;

	$(`#filter-search-input-group`).find(`#reset`).before(toInjectHide);
	$(`#statscontainer`).prepend(toInjectShow);

	const listContainer = $(`#listcontainer`);
	const showSearchWrpr = $("div#showsearch");
	const hideSearchBtn = $("button#hidesearch");
	// collapse/expand search button
	hideSearchBtn.click(function () {
		listContainer.hide();
		showSearchWrpr.show();
		hideSearchBtn.hide();
	});
	showSearchWrpr.find("button").click(function () {
		listContainer.show();
		showSearchWrpr.hide();
		hideSearchBtn.show();
	});
}