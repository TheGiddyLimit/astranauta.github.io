// ************************************************************************* //
// Strict mode should not be used, as the roll20 script depends on this file //
// ************************************************************************* //

// in deployment, `_IS_DEPLOYED = "<version number>";` should be prepended here
IS_DEPLOYED = typeof _IS_DEPLOYED !== "undefined" && _IS_DEPLOYED;
VERSION_NUMBER = IS_DEPLOYED ? _IS_DEPLOYED : "-1";
DEPLOYED_STATIC_ROOT = ""; // "https://static.5etools.com/"; // FIXME re-enable this when we have a CDN again
// for the roll20 script to set
IS_ROLL20 = false;

// the GitHub API has a 60 requests/hour limit per IP which we quickly hit if the user refreshes their Roll20 a couple of times
// embed shitty OAth2 details here to enable 5k/hour requests per IP (sending them with requests to the API relaxes the limit)
// naturally these are client-visible and should not be used to secure anything
HOMEBREW_CLIENT_ID = `67e57877469da38a85a7`;
HOMEBREW_CLIENT_SECRET = `c00dede21ca63a855abcd9a113415e840aca3f92`;

IMGUR_CLIENT_ID = `abdea4de492d3b0`;

HASH_PART_SEP = ",";
HASH_LIST_SEP = "_";
HASH_SUB_LIST_SEP = "~";
HASH_SUB_KV_SEP = ":";
HASH_START = "#";
HASH_SUBCLASS = "sub:";
HASH_BLANK = "blankhash";
HASH_SUB_NONE = "null";

STR_EMPTY = "";
STR_VOID_LINK = "javascript:void(0)";
STR_SLUG_DASH = "-";
STR_APOSTROPHE = "\u2019";

HTML_NO_INFO = "<i>No information available.</i>";
HTML_NO_IMAGES = "<i>No images available.</i>";

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
CLSS_HOMEBREW_SOURCE = "refreshing-brew";
CLSS_SUBCLASS_FEATURE = "subclass-feature";

ATB_DATA_LIST_SEP = "||";
ATB_DATA_PART_SEP = "::";
ATB_DATA_SC = "data-subclass";
ATB_DATA_SRC = "data-source";

STR_CANTRIP = "Cantrip";
STR_NONE = "None";
STR_ANY = "Any";
STR_SPECIAL = "Special";

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

HOMEBREW_STORAGE = "HOMEBREW_STORAGE";
HOMEBREW_META_STORAGE = "HOMEBREW_META_STORAGE";
EXCLUDES_STORAGE = "EXCLUDES_STORAGE";
DMSCREEN_STORAGE = "DMSCREEN_STORAGE";
ROLLER_MACRO_STORAGE = "ROLLER_MACRO_STORAGE";

JSON_HOMEBREW_INDEX = `homebrew/index.json`;

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

String.prototype.uppercaseFirst = String.prototype.uppercaseFirst ||
	function () {
		const str = this.toString();
		if (str.length === 0) return str;
		if (str.length === 1) return str.charAt(0).toUpperCase();
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

String.prototype.lowercaseFirst = String.prototype.lowercaseFirst ||
	function () {
		const str = this.toString();
		if (str.length === 0) return str;
		if (str.length === 1) return str.charAt(0).toLowerCase();
		return str.charAt(0).toLowerCase() + str.slice(1);
	};

String.prototype.toTitleCase = String.prototype.toTitleCase ||
	function () {
		let str;
		str = this.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});

		if (!StrUtil._TITLE_LOWER_WORDS_RE) {
			StrUtil._TITLE_LOWER_WORDS_RE = StrUtil.TITLE_LOWER_WORDS.map(it => new RegExp(`\\s${it}\\s`, 'g'));
		}

		for (let i = 0; i < StrUtil.TITLE_LOWER_WORDS.length; i++) {
			str = str.replace(
				StrUtil._TITLE_LOWER_WORDS_RE[i],
				(txt) => {
					return txt.toLowerCase();
				});
		}

		if (!StrUtil._TITLE_UPPER_WORDS_RE) {
			StrUtil._TITLE_UPPER_WORDS_RE = StrUtil.TITLE_UPPER_WORDS.map(it => new RegExp(`\\b${it}\\b`, 'g'));
		}

		for (let i = 0; i < StrUtil.TITLE_UPPER_WORDS.length; i++) {
			str = str.replace(
				StrUtil._TITLE_UPPER_WORDS_RE[i],
				StrUtil.TITLE_UPPER_WORDS[i].toUpperCase()
			);
		}

		return str;
	};

// as we're targeting ES6
String.prototype.ltrim = String.prototype.ltrim ||
	function () {
		return this.replace(/^\s+/, "");
	};

String.prototype.rtrim = String.prototype.rtrim ||
	function () {
		return this.replace(/\s+$/, "");
	};

String.prototype.escapeQuotes = String.prototype.escapeQuotes ||
	function () {
		return this.replace(/'/g, `&singlequot;`).replace(/"/g, `&quot;`);
	};

String.prototype.unescapeQuotes = String.prototype.unescapeQuotes ||
	function () {
		return this.replace(/&singlequot;/g, `'`).replace(/&quot;/g, `"`);
	};

/**
 * Calculates the Damerau-Levenshtein distance between two strings.
 * https://gist.github.com/IceCreamYou/8396172
 */
String.prototype.distance = String.prototype.distance ||
	function (target) {
		let source = this; let i; let j;
		if (!source) return target ? target.length : 0;
		else if (!target) return source.length;

		const m = source.length; const n = target.length; const INF = m + n; const score = new Array(m + 2); const sd = {};
		for (i = 0; i < m + 2; i++) score[i] = new Array(n + 2);
		score[0][0] = INF;
		for (i = 0; i <= m; i++) {
			score[i + 1][1] = i;
			score[i + 1][0] = INF;
			sd[source[i]] = 0;
		}
		for (j = 0; j <= n; j++) {
			score[1][j + 1] = j;
			score[0][j + 1] = INF;
			sd[target[j]] = 0;
		}

		for (i = 1; i <= m; i++) {
			let DB = 0;
			for (j = 1; j <= n; j++) {
				const i1 = sd[target[j - 1]]; const j1 = DB;
				if (source[i - 1] === target[j - 1]) {
					score[i + 1][j + 1] = score[i][j];
					DB = j;
				} else {
					score[i + 1][j + 1] = Math.min(score[i][j], Math.min(score[i + 1][j], score[i][j + 1])) + 1;
				}
				score[i + 1][j + 1] = Math.min(score[i + 1][j + 1], score[i1] ? score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1) : Infinity);
			}
			sd[source[i - 1]] = i;
		}
		return score[m + 1][n + 1];
	};

StrUtil = {
	joinPhraseArray: function (array, joiner, lastJoiner) {
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
	},

	uppercaseFirst: function (string) {
		return string.uppercaseFirst();
	},
	// Certain minor words should be left lowercase unless they are the first or last words in the string
	TITLE_LOWER_WORDS: ["A", "An", "The", "And", "But", "Or", "For", "Nor", "As", "At", "By", "For", "From", "In", "Into", "Near", "Of", "On", "Onto", "To", "With"],
	// Certain words such as initialisms or acronyms should be left uppercase
	TITLE_UPPER_WORDS: ["Id", "Tv"],

	padNumber: (n, len, padder) => {
		return String(n).padStart(len, padder);
	}
};

RegExp.escape = function (string) {
	return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
};

// TEXT COMBINING ======================================================================================================
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
						outStack += Parser.numberToText(item.count) + " ";
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

Parser.numberToText = function (number) {
	if (Math.abs(number) >= 100) return number;

	function getAsText (num) {
		const abs = Math.abs(num);
		switch (abs) {
			case 0: return "zero";
			case 1: return "one";
			case 2: return "two";
			case 3: return "three";
			case 4: return "four";
			case 5: return "five";
			case 6: return "six";
			case 7: return "seven";
			case 8: return "eight";
			case 9: return "nine";
			case 10: return "ten";
			case 11: return "eleven";
			case 12: return "twelve";
			case 13: return "thirteen";
			case 14: return "fourteen";
			case 15: return "fifteen";
			case 16: return "sixteen";
			case 17: return "seventeen";
			case 18: return "eighteen";
			case 19: return "nineteen";
			case 20: return "twenty";
			case 30: return "thirty";
			case 40: return "forty";
			case 50: return "fiddy"; // :^)
			case 60: return "sixty";
			case 70: return "seventy";
			case 80: return "eighty";
			case 90: return "ninety";
			default: {
				const str = String(abs);
				return `${getAsText(Number(`${str[0]}0`))}-${getAsText(Number(str[1]))}`;
			}
		}
	}
	return `${number < 0 ? "negative " : ""}${getAsText(number)}`;
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

Parser.getSpeedString = (it) => {
	function procSpeed (propName) {
		function addSpeed (s) {
			stack.push(`${propName === "walk" ? "" : `${propName} `}${getVal(s)}ft.${getCond(s)}`);
		}

		if (it.speed[propName]) addSpeed(it.speed[propName]);
		if (it.speed.alternate && it.speed.alternate[propName]) it.speed.alternate[propName].forEach(addSpeed);
	}

	function getVal (speedProp) {
		return speedProp.number || speedProp;
	}

	function getCond (speedProp) {
		return speedProp.condition ? ` ${speedProp.condition}` : "";
	}

	const stack = [];
	if (typeof it.speed === "object") {
		let joiner = ", ";
		procSpeed("walk");
		procSpeed("burrow");
		procSpeed("climb");
		procSpeed("fly");
		procSpeed("swim");
		if (it.speed.choose) {
			joiner = "; ";
			stack.push(`${CollectionUtil.joinConjunct(it.speed.choose.from.sort(), ", ", ", or ")} ${it.speed.choose.amount} ft.${it.speed.choose.note ? ` ${it.speed.choose.note}` : ""}`);
		}
		return stack.join(joiner);
	} else {
		return it.speed + (it.speed === "Varies" ? "" : "ft. ");
	}
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

Parser.crToXpNumber = function (cr) {
	if (cr === "Unknown" || cr === undefined) return null;
	if (cr === "0") return 10;
	if (cr === "1/8") return 25;
	if (cr === "1/4") return 50;
	if (cr === "1/2") return 100;
	return Parser.XP_CHART[parseInt(cr) - 1];
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
	if (cr.cr) return Parser.crToNumber(cr.cr);
	const parts = cr.trim().split("/");
	if (parts.length === 1) return Number(parts[0]);
	else if (parts.length === 2) return Number(parts[0]) / Number(parts[1]);
	else return 0;
};

Parser.crToPb = function (cr) {
	if (cr === "Unknown" || cr == null) return 0;
	cr = cr.cr || cr;
	if (Parser.crToNumber(cr) < 5) return 2;
	return Math.ceil(cr / 4) + 1;
};

Parser.dragonColorToFull = function (c) {
	return Parser._parse_bToA(DRAGON_COLOR_TO_FULL, c);
};

DRAGON_COLOR_TO_FULL = {
	B: "black",
	U: "blue",
	G: "green",
	R: "red",
	W: "white",
	A: "brass",
	Z: "bronze",
	C: "copper",
	O: "gold",
	S: "silver"
};

Parser.acToFull = function (ac) {
	if (typeof ac === "string") return ac; // handle classic format

	const renderer = EntryRenderer.getDefaultRenderer();
	let stack = "";
	for (let i = 0; i < ac.length; ++i) {
		const cur = ac[i];
		const nxt = ac[i + 1];

		if (cur.ac) {
			stack += cur.ac;
			if (cur.from) stack += ` (${cur.from.map(it => renderer.renderEntry(it)).join(", ")})`;
			if (cur.condition) stack += ` ${renderer.renderEntry(cur.condition)}`;
			if (cur.braces) stack += ")";
		} else {
			stack += cur;
		}

		if (nxt) {
			if (nxt.braces) stack += " (";
			else stack += ", ";
		}
	}

	return stack.trim();
};

MONSTER_COUNT_TO_XP_MULTIPLIER = [1, 1.5, 2, 2, 2, 2, 2.5, 2.5, 2.5, 2.5, 3, 3, 3, 3, 4];
Parser.numMonstersToXpMult = function (num) {
	if (num >= MONSTER_COUNT_TO_XP_MULTIPLIER.length) return 4;
	return MONSTER_COUNT_TO_XP_MULTIPLIER[num - 1];
};

Parser.armorFullToAbv = function (armor) {
	return Parser._parse_bToA(Parser.ARMOR_ABV_TO_FULL, armor);
};

Parser._getSourceStringFromSource = function (source) {
	if (source && source.source) return source.source;
	return source;
};
Parser.hasSourceFull = function (source) {
	return !!Parser.SOURCE_JSON_TO_FULL[source];
};
Parser.hasSourceAbv = function (source) {
	return !!Parser.SOURCE_JSON_TO_ABV[source];
};
Parser.sourceJsonToFull = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceFull(source)) return Parser._parse_aToB(Parser.SOURCE_JSON_TO_FULL, source).replace(/'/g, STR_APOSTROPHE);
	if (BrewUtil.hasSourceJson(source)) return BrewUtil.sourceJsonToFull(source).replace(/'/g, STR_APOSTROPHE);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_FULL, source).replace(/'/g, STR_APOSTROPHE)
};
Parser.sourceJsonToFullCompactPrefix = function (source) {
	return Parser.sourceJsonToFull(source)
		.replace(UA_PREFIX, UA_PREFIX_SHORT)
		.replace(AL_PREFIX, AL_PREFIX_SHORT)
		.replace(PS_PREFIX, PS_PREFIX_SHORT);
};
Parser.sourceJsonToAbv = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceAbv(source)) return Parser._parse_aToB(Parser.SOURCE_JSON_TO_ABV, source);
	if (BrewUtil.hasSourceJson(source)) return BrewUtil.sourceJsonToAbv(source);
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

Parser.itemWeightToFull = function (item) {
	return item.weight ? item.weight + (Number(item.weight) === 1 ? " lb." : " lbs.") + (item.weightNote ? ` ${item.weightNote}` : "") : "";
};

Parser._coinValueToNumberMultipliers = {
	"cp": 0.01,
	"sp": 0.1,
	"ep": 0.5,
	"gp": 1,
	"pp": 10
};
Parser.coinValueToNumber = function (value) {
	if (!value) return 0;
	// handle oddities
	if (value === "x4" || value === "Varies") return 0;

	// input e.g. "25gp", "1,000pp"
	value = value.replace(/[\s,]*/g, "").toLowerCase();
	const m = /(\d+(\.\d+)?)([csegp]p)/.exec(value);
	if (!m) throw new Error(`Badly formatted value ${value}`);
	return Number(m[1]) * Parser._coinValueToNumberMultipliers[m[3]];
};

Parser.weightValueToNumber = function (value) {
	if (!value) return 0;
	// handle oddities
	if (value === "x2") return 0;

	if (Number(value)) return Number(value);
	else throw new Error(`Badly formatted value ${value}`)
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

Parser.spLevelToFullLevelText = function (level, dash) {
	return `${Parser.spLevelToFull(level)}${(level === 0 ? "s" : `${dash ? "-" : " "}level`)}`;
};

Parser.spMetaToFull = function (meta) {
	// these tags are (so far) mutually independent, so we don't need to combine the text
	if (meta && meta.ritual) return " (ritual)";
	if (meta && meta.technomagic) return " (technomagic)";
	return "";
};

Parser.spLevelSchoolMetaToFull = function (level, school, meta) {
	const levelPart = level === 0 ? Parser.spLevelToFull(level).toLowerCase() : Parser.spLevelToFull(level) + "-level";
	let levelSchoolStr = level === 0 ? `${Parser.spSchoolAbvToFull(school)} ${levelPart}` : `${levelPart} ${Parser.spSchoolAbvToFull(school).toLowerCase()}`;
	return levelSchoolStr + Parser.spMetaToFull(meta);
};

Parser.spTimeListToFull = function (times) {
	return times.map(t => `${Parser.getTimeToFull(t)}${t.condition ? `, ${EntryRenderer.getDefaultRenderer().renderEntry(t.condition)}` : ""}`).join(" or ");
};

Parser.getTimeToFull = function (time) {
	return `${time.number} ${time.unit === "bonus" ? "bonus action" : time.unit}${time.number > 1 ? "s" : ""}`
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
			switch (range.type) {
				case RNG_SPHERE:
					return " radius";
				case RNG_HEMISPHERE:
					return `-radius ${range.type}`;
				default:
					return ` ${range.type}`
			}
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
	if (comp.m) out.push("M" + (comp.m !== true ? ` (${comp.m.text || comp.m})` : ""));
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
				return `${d.concentration ? "Concentration, " : ""}${d.duration.upTo && d.concentration ? "u" : d.duration.upTo ? "U" : ""}${d.duration.upTo ? "p to " : ""}${d.duration.amount} ${d.duration.amount === 1 ? d.duration.type : `${d.duration.type}s`}`;
			case "permanent":
				if (d.ends) {
					return `Until ${d.ends.map(m => m === "dispel" ? "dispelled" : m === "trigger" ? "triggered" : m === "discharge" ? "discharged" : undefined).join(" or ")}`
				} else {
					return "Permanent";
				}
		}
	}).join(" or ") + (dur.length > 1 ? " (see below)" : "");
};

Parser.spClassesToFull = function (classes, textOnly) {
	const fromSubclasses = Parser.spSubclassesToFull(classes, textOnly);
	return Parser.spMainClassesToFull(classes, textOnly) + (fromSubclasses ? ", " + fromSubclasses : "");
};

Parser.spMainClassesToFull = function (classes, textOnly) {
	return classes.fromClassList
		.sort((a, b) => SortUtil.ascSort(a.name, b.name))
		.map(c => textOnly ? c.name : `<span title="Source: ${Parser.sourceJsonToFull(c.source)}">${c.name}</span>`)
		.join(", ");
};

Parser.spSubclassesToFull = function (classes, textOnly) {
	if (!classes.fromSubclass) return "";
	return classes.fromSubclass
		.sort((a, b) => {
			const byName = SortUtil.ascSort(a.class.name, b.class.name);
			return byName || SortUtil.ascSort(a.subclass.name, b.subclass.name);
		})
		.map(c => Parser._spSubclassItem(c, textOnly))
		.join(", ");
};

Parser._spSubclassItem = function (fromSubclass, textOnly) {
	const text = `${fromSubclass.subclass.name}${fromSubclass.subclass.subSubclass ? ` (${fromSubclass.subclass.subSubclass})` : ""}`;
	if (textOnly) return text;
	return `<span class="italic" title="Source: ${Parser.sourceJsonToFull(fromSubclass.subclass.source)}">${text}</span> <span title="Source: ${Parser.sourceJsonToFull(fromSubclass.class.source)}">${fromSubclass.class.name}</span>`;
};

Parser.SPELL_ATTACK_TYPE_TO_FULL = {};
Parser.SPELL_ATTACK_TYPE_TO_FULL["M"] = "Melee";
Parser.SPELL_ATTACK_TYPE_TO_FULL["R"] = "Ranged";
Parser.SPELL_ATTACK_TYPE_TO_FULL["O"] = "Other/Unknown";

Parser.spAttackTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SPELL_ATTACK_TYPE_TO_FULL, type);
};

// mon-prefix functions are for parsing monster data, and shared with the roll20 script
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
		out.asText = `${type.type}`;
	}
	if (tempTags.length) out.asText += ` (${tempTags.join(", ")})`;
	return out;
};

Parser.monTypeToPlural = function (type) {
	return Parser._parse_aToB(Parser.MON_TYPE_TO_PLURAL, type);
};

Parser.monCrToFull = function (cr) {
	if (typeof cr === "string" || !cr) return `${cr || "Unknown"} (${Parser.crToXp(cr)} XP)`;
	else {
		const stack = [Parser.monCrToFull(cr.cr)];
		if (cr.lair) stack.push(`${Parser.monCrToFull(cr.lair)} when encountered in lair`);
		if (cr.coven) stack.push(`${Parser.monCrToFull(cr.coven)} when part of a coven`);
		return stack.join(" or ");
	}
};

Parser.monImmResToFull = function (toParse) {
	const outerLen = toParse.length;
	let maxDepth = 0;
	if (outerLen === 1 && (toParse[0].immune || toParse[0].resist)) {
		return toParse.map(it => toString(it, -1)).join(maxDepth ? "; " : ", ");
	}

	function toString (it, depth = 0) {
		maxDepth = Math.max(maxDepth, depth);
		if (typeof it === "string") {
			return it;
		} else if (it.special) {
			return it.special;
		} else {
			let stack = it.preNote ? `${it.preNote} ` : "";
			if (it.immune) {
				const toJoin = it.immune.map(nxt => toString(nxt, depth + 1));
				stack += depth ? toJoin.join(maxDepth ? "; " : ", ") : CollectionUtil.joinConjunct(toJoin, ", ", " and ");
			} else if (it.resist) {
				const toJoin = it.resist.map(nxt => toString(nxt, depth + 1));
				stack += depth ? toJoin.join(maxDepth ? "; " : ", ") : CollectionUtil.joinConjunct(toJoin, ", ", " and ");
			} else if (it.vulnerable) {
				const toJoin = it.vulnerable.map(nxt => toString(nxt, depth + 1));
				stack += depth ? toJoin.join(maxDepth ? "; " : ", ") : CollectionUtil.joinConjunct(toJoin, ", ", " and ");
			}
			if (it.note) stack += ` ${it.note}`;
			return stack;
		}
	}

	return toParse.map(it => toString(it)).join(maxDepth ? "; " : ", ");
};

Parser.monCondImmToFull = function (condImm) {
	return condImm.map(it => {
		if (it.special) return it.special;
		if (it.conditionImmune) return `${it.preNote ? `${it.preNote} ` : ""}${it.conditionImmune.join(", ")}${it.note ? ` ${it.note}` : ""}`;
		return it;
	}).join(", ");
};

// psi-prefix functions are for parsing psionic data, and shared with the roll20 script
Parser.PSI_ABV_TYPE_TALENT = "T";
Parser.PSI_ABV_TYPE_DISCIPLINE = "D";
Parser.PSI_ORDER_NONE = "None";
Parser.psiTypeToFull = (type) => {
	if (type === Parser.PSI_ABV_TYPE_TALENT) return "Talent";
	else if (type === Parser.PSI_ABV_TYPE_DISCIPLINE) return "Discipline";
	else return type;
};

Parser.psiOrderToFull = (order) => {
	return order === undefined ? Parser.PSI_ORDER_NONE : order;
};

Parser.levelToFull = function (level) {
	if (isNaN(level)) return "";
	if (level === "2") return level + "nd";
	if (level === "3") return level + "rd";
	if (level === "1") return level + "st";
	return level + "th";
};

Parser.invoSpellToFull = function (spell) {
	if (spell === "Eldritch Blast") return EntryRenderer.getDefaultRenderer().renderEntry(`{@spell ${spell}} cantrip`);
	else if (spell === "Hex/Curse") return EntryRenderer.getDefaultRenderer().renderEntry("{@spell Hex} spell or a warlock feature that curses");
	else if (spell) return EntryRenderer.getDefaultRenderer().renderEntry(`{@spell ${spell}}`);
	return STR_NONE
};

Parser.invoPactToFull = function (pact) {
	if (pact === "Chain") return "Pact of the Chain";
	if (pact === "Tome") return "Pact of the Tome";
	if (pact === "Blade") return "Pact of the Blade";
	return STR_ANY;
};

Parser.invoPatronToShort = function (patron) {
	if (patron === STR_ANY) return STR_ANY;
	return /^The (.*?)$/.exec(patron)[1];
};

Parser.alignmentAbvToFull = function (alignment) {
	if (typeof alignment === "object") {
		if (alignment.special) {
			// use in MTF Sacred Statue
			return alignment.special;
		} else {
			// e.g. `{alignment: ["N", "G"], chance: 50}` or `{alignment: ["N", "G"]}`
			return `${alignment.alignment.map(a => Parser.alignmentAbvToFull(a)).join(" ")}${alignment.chance ? ` (${alignment.chance}%)` : ""}`;
		}
	} else {
		alignment = alignment.toUpperCase();
		switch (alignment) {
			case "L":
				return "Lawful";
			case "N":
				return "Neutral";
			case "NX":
				return "Neutral (Law/Chaos axis)";
			case "NY":
				return "Neutral (Good/Evil axis)";
			case "C":
				return "Chaotic";
			case "G":
				return "Good";
			case "E":
				return "Evil";
			// "special" values
			case "U":
				return "Unaligned";
			case "A":
				return "Any alignment";
		}
		return alignment;
	}
};

Parser.alignmentListToFull = function (alignList) {
	// assume all single-length arrays can be simply parsed
	if (alignList.length === 1) return Parser.alignmentAbvToFull(alignList[0]);
	// two-length arrays can be:
	// 1. "[object] or [object]"
	// 2. a pair of abv's, e.g. "L" "G"
	if (alignList.length === 2) {
		if (typeof alignList[0] === "object" && typeof alignList[1] === "object") return `${Parser.alignmentAbvToFull(alignList[0])} or ${Parser.alignmentAbvToFull(alignList[1]).toLowerCase()}`;
		else if (typeof alignList[0] === "string" && typeof alignList[1] === "string") return alignList.map(a => Parser.alignmentAbvToFull(a)).join(" ");
		else throw new Error(`Malformed alignment pair: ${JSON.stringify(alignList)}`);
	}
	// longer arrays should have a custom mapping
	// available options are:
	// "L", "NX", "C" ("NX" = "neutral X" = neutral law/chaos axis)
	// "G", "NY", "E" ("NY" = "neutral Y" = neutral good/evil axis)
	if (alignList.length === 5) {
		if (!alignList.includes("G")) return "any non-good alignment";
		if (!alignList.includes("L")) return "any non-lawful alignment";
	}
	if (alignList.length === 4) {
		if (!alignList.includes("L") && !alignList.includes("NX")) return "any chaotic alignment";
		if (!alignList.includes("G") && !alignList.includes("NY")) return "any evil alignment";
		if (!alignList.includes("C") && !alignList.includes("NX")) return "any lawful alignment";
		if (!alignList.includes("E") && !alignList.includes("NY")) return "any good alignment";
	}
	throw new Error(`Unmapped alignment: ${JSON.stringify(alignList)}`);
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
Parser.CAT_ID_DEITY = 14;
Parser.CAT_ID_OBJECT = 15;
Parser.CAT_ID_TRAP = 16;
Parser.CAT_ID_HAZARD = 17;
Parser.CAT_ID_QUICKREF = 18;
Parser.CAT_ID_CULT = 19;
Parser.CAT_ID_BOON = 20;
Parser.CAT_ID_DISEASE = 21;

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
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_DEITY] = "Deity";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_OBJECT] = "Object";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TRAP] = "Trap";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_HAZARD] = "Hazard";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_QUICKREF] = "Quick Reference";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CULT] = "Cult";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BOON] = "Boon";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_DISEASE] = "Disease";

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
			const byName = SortUtil.ascSort(a.subclass.name, b.subclass.name);
			return byName || SortUtil.ascSort(a.class.name, b.class.name);
		})
		.forEach(c => {
			const nm = c.subclass.name;
			const src = c.subclass.source;
			const toAdd = Parser._spSubclassItem(c);
			if (SourceUtil.hasBeenReprinted(nm, src)) {
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

Parser.attackTypeToFull = function (attackType) {
	return Parser._parse_aToB(Parser.ATK_TYPE_TO_FULL, attackType);
};

Parser.trapTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.TRAP_TYPE_TO_FULL, type);
};

Parser.TRAP_TYPE_TO_FULL = {};
Parser.TRAP_TYPE_TO_FULL["MECH"] = "Mechanical trap";
Parser.TRAP_TYPE_TO_FULL["MAG"] = "Magical trap";
Parser.TRAP_TYPE_TO_FULL["SMPL"] = "Simple trap";
Parser.TRAP_TYPE_TO_FULL["CMPX"] = "Complex trap";
Parser.TRAP_TYPE_TO_FULL["HAZ"] = "Hazard";

Parser.tierToFullLevel = function (tier) {
	return Parser._parse_aToB(Parser.TIER_TO_FULL_LEVEL, tier);
};

Parser.TIER_TO_FULL_LEVEL = {};
Parser.TIER_TO_FULL_LEVEL[1] = "level 1\u20144";
Parser.TIER_TO_FULL_LEVEL[2] = "level 5\u201410";
Parser.TIER_TO_FULL_LEVEL[3] = "level 11\u201416";
Parser.TIER_TO_FULL_LEVEL[4] = "level 17\u201420";

Parser.threatToFull = function (threat) {
	return Parser._parse_aToB(Parser.THREAT_TO_FULL, threat);
};

Parser.THREAT_TO_FULL = {};
Parser.THREAT_TO_FULL[1] = "moderate";
Parser.THREAT_TO_FULL[2] = "dangerous";
Parser.THREAT_TO_FULL[3] = "deadly";

Parser.trapInitToFull = function (init) {
	return Parser._parse_aToB(Parser.TRAP_INIT_TO_FULL, init);
};

Parser.TRAP_INIT_TO_FULL = {};
Parser.TRAP_INIT_TO_FULL[1] = "initiative count 10";
Parser.TRAP_INIT_TO_FULL[2] = "initiative count 20";
Parser.TRAP_INIT_TO_FULL[3] = "initiative count 20 and initiative count 10";

Parser.ATK_TYPE_TO_FULL = {};
Parser.ATK_TYPE_TO_FULL["MW"] = "Melee Weapon Attack";
Parser.ATK_TYPE_TO_FULL["RW"] = "Ranged Weapon Attack";

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
SRC_Mag = "Mag";
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
SRC_MTF = "MTF";

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
SRC_UATSC = SRC_UA_PREFIX + "ThreeSubclasses";
SRC_UAOD = SRC_UA_PREFIX + "OrderDomain";
SRC_UACAM = SRC_UA_PREFIX + "CentaursMinotaurs";
SRC_UAGSS = SRC_UA_PREFIX + "GiantSoulSorcerer";
SRC_UAWGtE = SRC_UA_PREFIX + "WGtE";

SRC_3PP_SUFFIX = " 3pp";
SRC_STREAM = "Stream";
SRC_TWITTER = "Twitter";

AL_PREFIX = "Adventurers League: ";
AL_PREFIX_SHORT = "AL: ";
PS_PREFIX = "Plane Shift: ";
PS_PREFIX_SHORT = "PS: ";
UA_PREFIX = "Unearthed Arcana: ";
UA_PREFIX_SHORT = "UA: ";
TftYP_NAME = "Tales from the Yawning Portal";

Parser.SOURCE_JSON_TO_FULL = {};
Parser.SOURCE_JSON_TO_FULL[SRC_CoS] = "Curse of Strahd";
Parser.SOURCE_JSON_TO_FULL[SRC_DMG] = "Dungeon Master's Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_EEPC] = "Elemental Evil Player's Companion";
Parser.SOURCE_JSON_TO_FULL[SRC_EET] = "Elemental Evil: Trinkets";
Parser.SOURCE_JSON_TO_FULL[SRC_HotDQ] = "Hoard of the Dragon Queen";
Parser.SOURCE_JSON_TO_FULL[SRC_LMoP] = "Lost Mine of Phandelver";
Parser.SOURCE_JSON_TO_FULL[SRC_Mag] = "Dragon Magazine";
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
Parser.SOURCE_JSON_TO_FULL[SRC_MTF] = "Mordenkainen's Tome of Foes";
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
Parser.SOURCE_JSON_TO_FULL[SRC_UATSC] = UA_PREFIX + "Three Subclasses";
Parser.SOURCE_JSON_TO_FULL[SRC_UAOD] = UA_PREFIX + "Order Domain";
Parser.SOURCE_JSON_TO_FULL[SRC_UACAM] = UA_PREFIX + "Centaurs and Minotaurs";
Parser.SOURCE_JSON_TO_FULL[SRC_UAGSS] = UA_PREFIX + "Giant Soul Sorcerer";
Parser.SOURCE_JSON_TO_FULL[SRC_UAWGtE] = "Wayfinder's Guide to Eberron";
Parser.SOURCE_JSON_TO_FULL[SRC_STREAM] = "Livestream";
Parser.SOURCE_JSON_TO_FULL[SRC_TWITTER] = "Twitter";

Parser.SOURCE_JSON_TO_ABV = {};
Parser.SOURCE_JSON_TO_ABV[SRC_CoS] = "CoS";
Parser.SOURCE_JSON_TO_ABV[SRC_DMG] = "DMG";
Parser.SOURCE_JSON_TO_ABV[SRC_EEPC] = "EEPC";
Parser.SOURCE_JSON_TO_ABV[SRC_EET] = "EET";
Parser.SOURCE_JSON_TO_ABV[SRC_HotDQ] = "HotDQ";
Parser.SOURCE_JSON_TO_ABV[SRC_LMoP] = "LMoP";
Parser.SOURCE_JSON_TO_ABV[SRC_Mag] = "Mag";
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
Parser.SOURCE_JSON_TO_ABV[SRC_MTF] = "MTF";
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
Parser.SOURCE_JSON_TO_ABV[SRC_UAKOO] = "UAKoO";
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
Parser.SOURCE_JSON_TO_ABV[SRC_UATSC] = "UATSC";
Parser.SOURCE_JSON_TO_ABV[SRC_UAOD] = "UAOD";
Parser.SOURCE_JSON_TO_ABV[SRC_UACAM] = "UACAM";
Parser.SOURCE_JSON_TO_ABV[SRC_UAGSS] = "UAGSS";
Parser.SOURCE_JSON_TO_ABV[SRC_UAWGtE] = "WGE";
Parser.SOURCE_JSON_TO_ABV[SRC_STREAM] = "Stream";
Parser.SOURCE_JSON_TO_ABV[SRC_TWITTER] = "Twitter";

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
	"SHP": "Vehicle",
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
	"Animal Handling": "When there is any question whether you can calm down a domesticated animal, keep a mount from getting spooked, or intuit an animal's intentions, the GM might call for a Wisdom (Animal Handling) check.",
	"Arcana": "Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes.",
	"Athletics": "Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming.",
	"Deception": "Your Charisma (Deception) check determines whether you can convincingly hide the truth, either verbally or through your actions.",
	"History": "Your Intelligence (History) check measures your ability to recall lore about historical events, legendary people, ancient kingdoms, past disputes, recent wars, and lost civilizations.",
	"Insight": "Your Wisdom (Insight) check decides whether you can determine the true intentions of a creature, such as when searching out a lie or predicting someone's next move.",
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
	"Disengage": "If you take the Disengage action, your movement doesn't provoke opportunity attacks for the rest of the turn.",
	"Dodge": "When you take the Dodge action, you focus entirely on avoiding attacks. Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage.",
	"Help": "You can lend your aid to another creature in the completion of a task. The creature you aid gains advantage on the next ability check it makes to perform the task you are helping with, provided that it makes the check before the start of your next turn.",
	"Hide": "When you take the Hide action, you make a Dexterity (Stealth) check in an attempt to hide, following the rules for hiding.",
	"Ready": "Sometimes you want to get the jump on a foe or wait for a particular circumstance before you act. To do so, you can take the Ready action on your turn, which lets you act using your reaction before the start of your next turn."
};

Parser.NUMBERS_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
Parser.NUMBERS_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
Parser.NUMBERS_TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

// SOURCES =============================================================================================================
SourceUtil = {
	hasBeenReprinted (shortName, source) {
		/* can accept sources of the form:
		{
			"source": "UAExample",
			"forceStandard": true
		}
		 */
		if (source && source.source) source = source.source;
		return (shortName !== undefined && shortName !== null && source !== undefined && source !== null) &&
			(
				(shortName === "Sun Soul" && source === SRC_SCAG) ||
				(shortName === "Mastermind" && source === SRC_SCAG) ||
				(shortName === "Swashbuckler" && source === SRC_SCAG) ||
				(shortName === "Storm" && source === SRC_SCAG) ||
				(shortName === "Deep Stalker Conclave" && source === SRC_UATRR)
			);
	},

	isNonstandardSource (source) {
		/* can accept sources of the form:
		{
			"source": "UAExample",
			"forceStandard": true
		}
		 */
		if (source && source.forceStandard !== undefined) {
			return !source.forceStandard;
		}
		if (source && source.source) source = source.source;
		return (source !== undefined && source !== null) && !BrewUtil.hasSourceJson(source) && (SourceUtil._isNonstandardSourceWiz(source) || SourceUtil._isNonstandardSource3pp(source));
	},

	_isNonstandardSourceWiz (source) {
		return source.startsWith(SRC_UA_PREFIX) || source.startsWith(SRC_PS_PREFIX) || source === SRC_OGA || source === SRC_Mag || source === SRC_STREAM || source === SRC_TWITTER;
	},

	_isNonstandardSource3pp (source) {
		return source.endsWith(SRC_3PP_SUFFIX);
	},

	getFilterGroup (source) {
		if (BrewUtil.hasSourceJson(source)) return 2;
		return Number(SourceUtil.isNonstandardSource(source))
	}
};

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

function noModifierKeys (e) {
	return !e.ctrlKey && !e.altKey && !e.metaKey;
}

if (typeof window !== "undefined") {
	window.addEventListener("load", () => {
		// Add a selector to match exact text (case insensitive) to jQuery's arsenal
		$.expr[':'].textEquals = (el, i, m) => {
			const searchText = m[3];
			const match = $(el).text().toLowerCase().trim().match(`^${RegExp.escape(searchText.toLowerCase())}$`);
			return match && match.length > 0;
		};

		// Add a selector to match contained text (case insensitive)
		$.expr[':'].containsInsensitive = (el, i, m) => {
			const searchText = m[3];
			const textNode = $(el).contents().filter((i, e) => {
				return e.nodeType === 3;
			})[0];
			if (!textNode) return false;
			const match = textNode.nodeValue.toLowerCase().trim().match(`${RegExp.escape(searchText.toLowerCase())}`);
			return match && match.length > 0;
		};
	});
}

function copyText (text) {
	const $temp = $(`<textarea id="copy-temp" style="position: fixed; top: -1000px; left: -1000px; width: 1px; height: 1px;">${text}</textarea>`);
	$(`body`).append($temp);
	$temp.select();
	document.execCommand("Copy");
	$temp.remove();
}

function showCopiedEffect ($ele) {
	const $temp = $(`<div class="copied-tip"><span>Copied!</span></div>`);
	const pos = $ele.offset();
	$temp.css({
		top: pos.top - 17,
		left: pos.left - 36 + ($ele.width() / 2)
	}).appendTo($(`body`)).animate({
		top: "-=8",
		opacity: 0
	}, 250, () => {
		$temp.remove();
	});
}

// TODO refactor other misc utils into this
MiscUtil = {
	clearSelection () {
		if (document.getSelection) {
			document.getSelection().removeAllRanges();
			document.getSelection().addRange(document.createRange());
		} else if (window.getSelection) {
			if (window.getSelection().removeAllRanges) {
				window.getSelection().removeAllRanges();
				window.getSelection().addRange(document.createRange());
			} else if (window.getSelection().empty) {
				window.getSelection().empty();
			}
		} else if (document.selection) {
			document.selection.empty();
		}
	},

	randomColor () {
		let r; let g; let b;
		const h = RollerUtil.randomise(30, 0) / 30;
		const i = ~~(h * 6);
		const f = h * 6 - i;
		const q = 1 - f;
		switch (i % 6) {
			case 0: r = 1; g = f; b = 0; break;
			case 1: r = q; g = 1; b = 0; break;
			case 2: r = 0; g = 1; b = f; break;
			case 3: r = 0; g = q; b = 1; break;
			case 4: r = f; g = 0; b = 1; break;
			case 5: r = 1; g = 0; b = q; break;
		}
		return `#${("00" + (~~(r * 255)).toString(16)).slice(-2)}${("00" + (~~(g * 255)).toString(16)).slice(-2)}${("00" + (~~(b * 255)).toString(16)).slice(-2)}`;
	}
};

// LIST AND SEARCH =====================================================================================================
ListUtil = {
	SUB_HASH_PREFIX: "sublistselected",

	_first: true,

	search: (options) => {
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
		if (ListUtil._first) {
			ListUtil._first = false;
			const $headDesc = $(`header div p`);
			$headDesc.html(`${$headDesc.html()} Press J/K to navigate rows.`);

			$(window).on("keypress", (e) => {
				// K up; J down
				if (noModifierKeys(e)) {
					if (e.key === "k" || e.key === "j") {
						// don't switch if the user is typing somewhere else
						if (e.target.nodeName === "INPUT" || e.target.nodeName === "TEXTAREA") return;
						const it = History.getSelectedListElementWithIndex();

						if (it) {
							if (e.key === "k") {
								const prevLink = it.$el.parent().prev().find("a").attr("href");
								if (prevLink !== undefined) {
									window.location.hash = prevLink;
								} else {
									const lists = listWrapper.data("lists");
									let x = it.x;
									while (--x >= 0) {
										const l = lists[x];
										if (l.visibleItems.length) {
											const goTo = $(l.visibleItems[l.visibleItems.length - 1].elm).find("a").attr("href");
											if (goTo) window.location.hash = goTo;
											return;
										}
									}
								}
								const fromPrevSibling = it.$el.closest(`ul`).parent().prev(`li`).find(`ul li`).last().find("a").attr("href");
								if (fromPrevSibling) {
									window.location.hash = fromPrevSibling;
								}
							} else if (e.key === "j") {
								const nextLink = it.$el.parent().next().find("a").attr("href");
								if (nextLink !== undefined) {
									window.location.hash = nextLink;
								} else {
									const lists = listWrapper.data("lists");
									let x = it.x;
									while (++x < lists.length) {
										const l = lists[x];
										if (l.visibleItems.length) {
											const goTo = $(l.visibleItems[0].elm).find("a").attr("href");
											if (goTo) window.location.hash = goTo;
											return;
										}
									}
								}
								const fromNxtSibling = it.$el.closest(`ul`).parent().next(`li`).find(`ul li`).first().find("a").attr("href");
								if (fromNxtSibling) {
									window.location.hash = fromNxtSibling;
								}
							}
						}
					}
				}
			});
		}
		return list
	},

	toggleSelected: (evt, ele) => {
		if (evt.shiftKey) {
			evt.preventDefault();
			$(ele).toggleClass("list-multi-selected");
		} else {
			ListUtil._primaryLists.forEach(l => ListUtil.deslectAll(l));
			$(ele).addClass("list-multi-selected");
		}
	},

	updateSelected: () => {
		ListUtil.toggleSelected({}, History.getSelectedListElement().parent());
	},

	_ctxInit: {},
	_ctxClick: {},
	_handlePreInitContextMenu: (menuId) => {
		if (ListUtil._ctxInit[menuId]) return;
		ListUtil._ctxInit[menuId] = true;
		$("body").click(() => {
			$(`#${menuId}`).hide();
		});
	},

	_getMenuPosition: (menuId, mouse, direction, scrollDir) => {
		const win = $(window)[direction]();
		const scroll = $(window)[scrollDir]();
		const menu = $(`#${menuId}`)[direction]();
		let position = mouse + scroll;
		// opening menu would pass the side of the page
		if (mouse + menu > win && menu < mouse) position -= menu;
		return position;
	},

	initContextMenu: (clickFn, ...labels) => {
		ListUtil._handleInitContextMenu("contextMenu", clickFn, labels);
	},

	openContextMenu: (evt, ele) => {
		const selCount = ListUtil._primaryLists.map(l => ListUtil.getSelectedCount(l)).reduce((a, b) => a + b, 0);
		if (selCount === 1) ListUtil._primaryLists.forEach(l => ListUtil.deslectAll(l));
		if (selCount === 0 || selCount === 1) $(ele).addClass("list-multi-selected");
		ListUtil._handleOpenContextMenu(evt, ele, "contextMenu");
	},

	initSubContextMenu: (clickFn, ...labels) => {
		ListUtil._handleInitContextMenu("contextSubMenu", clickFn, labels)
	},

	openSubContextMenu: (evt, ele) => {
		ListUtil._handleOpenContextMenu(evt, ele, "contextSubMenu");
	},

	_handleInitContextMenu: (menuId, clickFn, labels) => {
		ListUtil._ctxClick[menuId] = clickFn;
		ListUtil._handlePreInitContextMenu(menuId);
		let tempString = `<ul id="${menuId}" class="dropdown-menu" role="menu">`;
		labels.forEach((it, i) => {
			tempString += `<li><a data-ctx-id="${i}" href="${STR_VOID_LINK}">${it}</a></li>`;
		});
		tempString += `</ul>`;
		$("body").append(tempString);
	},

	_handleOpenContextMenu: (evt, ele, menuId) => {
		if (evt.ctrlKey) return;
		evt.preventDefault();
		const $menu = $(`#${menuId}`)
			.data("invokedOn", $(evt.target).closest(`li.row`))
			.show()
			.css({
				position: "absolute",
				left: ListUtil._getMenuPosition(menuId, evt.clientX, "width", "scrollLeft"),
				top: ListUtil._getMenuPosition(menuId, evt.clientY, "height", "scrollTop")
			})
			.off("click")
			.on("click", "a", function (e) {
				$menu.hide();
				const $invokedOn = $menu.data("invokedOn");
				const $selectedMenu = $(e.target);
				ListUtil._ctxClick[menuId](evt, ele, $invokedOn, $selectedMenu);
			});
	},

	$sublistContainer: null,
	sublist: null,
	$sublist: null,
	_sublistChangeFn: null,
	_allItems: null,
	_primaryLists: [],
	_pinned: {},
	initSublist: (options) => {
		ListUtil._allItems = options.itemList;
		ListUtil._getSublistRow = options.getSublistRow;
		ListUtil._sublistChangeFn = options.onUpdate;
		ListUtil._primaryLists = options.primaryLists;
		delete options.itemList;
		delete options.getSublistRow;
		delete options.onUpdate;
		delete options.primaryLists;

		ListUtil.$sublistContainer = $("#sublistcontainer");
		const sublist = new List("sublistcontainer", options);
		ListUtil.sublist = sublist;
		ListUtil.$sublist = $(`ul.${options.listClass}`);
		return sublist;
	},

	setOptions: (options) => {
		if (options.itemList !== undefined) ListUtil._allItems = options.itemList;
		if (options.getSublistRow !== undefined) ListUtil._getSublistRow = options.getSublistRow;
		if (options.onUpdate !== undefined) ListUtil._sublistChangeFn = options.onUpdate;
		if (options.primaryLists !== undefined) ListUtil._primaryLists = options.primaryLists;
	},

	getOrTabRightButton: (id, icon) => {
		let $btn = $(`#${id}`);
		if (!$btn.length) {
			$btn = $(`<span class="stat-tab btn btn-default" id="${id}"><span class="glyphicon glyphicon-${icon}"></span></span>`).appendTo($(`#tabs-right`));
		}
		return $btn;
	},

	bindPinButton: () => {
		ListUtil.getOrTabRightButton(`btn-pin`, `pushpin`)
			.off("click")
			.on("click", () => {
				if (!ListUtil.isSublisted(History.lastLoadedId)) ListUtil.doSublistAdd(History.lastLoadedId, true);
				else ListUtil.doSublistRemove(History.lastLoadedId);
			})
			.attr("title", "Pin (Toggle)");
	},

	bindAddButton: () => {
		ListUtil.getOrTabRightButton(`btn-sublist-add`, `plus`)
			.off("click")
			.on("click", (evt) => {
				if (evt.shiftKey) ListUtil.doSublistAdd(History.lastLoadedId, true, 20);
				else ListUtil.doSublistAdd(History.lastLoadedId, true);
			})
			.attr("title", "Add (SHIFT for 20)");
	},

	bindSubtractButton: () => {
		ListUtil.getOrTabRightButton(`btn-sublist-subtract`, `minus`)
			.off("click")
			.on("click", (evt) => {
				if (evt.shiftKey) ListUtil.doSublistSubtract(History.lastLoadedId, 20);
				else ListUtil.doSublistSubtract(History.lastLoadedId);
			})
			.attr("title", "Subtract (SHIFT for 20)");
	},

	bindDownloadButton: () => {
		const $btn = ListUtil.getOrTabRightButton(`btn-sublist-download`, `download`);
		$btn.off("click")
			.on("click", (evt) => {
				if (evt.shiftKey) {
					const toEncode = JSON.stringify(ListUtil._getExportableSublist());
					const parts = [window.location.href, (UrlUtil.packSubHash(ListUtil.SUB_HASH_PREFIX, [toEncode], true))];
					copyText(parts.join(HASH_PART_SEP));
					showCopiedEffect($btn);
				} else {
					const filename = `${UrlUtil.getCurrentPage().replace(".html", "")}-sublist`;
					DataUtil.userDownload(filename, JSON.stringify(ListUtil._getExportableSublist(), null, "\t"));
				}
			})
			.attr("title", "Download List (SHIFT for Link)");
	},

	bindUploadButton: (funcPreload) => {
		const $btn = ListUtil.getOrTabRightButton(`btn-sublist-upload`, `upload`);
		$btn.off("click")
			.on("click", (evt) => {
				function loadSaved (event, additive) {
					const input = event.target;

					const reader = new FileReader();
					reader.onload = () => {
						const text = reader.result;
						const json = JSON.parse(text);
						const funcOnload = () => {
							ListUtil._loadSavedSublist(json.items, additive);
							$iptAdd.remove();
							ListUtil._finaliseSublist();
						};
						if (funcPreload) funcPreload(json, funcOnload);
						else funcOnload();
					};
					reader.readAsText(input.files[0]);
				}

				const additive = evt.shiftKey;
				const $iptAdd = $(`<input type="file" accept=".json" style="position: fixed; top: -100px; left: -100px; display: none;">`).on("change", (evt) => {
					loadSaved(evt, additive);
				}).appendTo($(`body`));
				$iptAdd.click();
			})
			.attr("title", "Upload List (SHIFT for Add Only)");
	},

	setFromSubHashes: (subHashes, funcPreload) => {
		function funcOnload (json) {
			ListUtil._loadSavedSublist(json.items, false);
			ListUtil._finaliseSublist();

			const [link, ...sub] = History._getHashParts();
			const outSub = [];
			Object.keys(unpacked)
				.filter(k => k !== ListUtil.SUB_HASH_PREFIX)
				.forEach(k => {
					outSub.push(`${k}${HASH_SUB_KV_SEP}${unpacked[k].join(HASH_SUB_LIST_SEP)}`)
				});
			History.setSuppressHistory(true);
			window.location.hash = `#${link}${outSub.length ? `${HASH_PART_SEP}${outSub.join(HASH_PART_SEP)}` : ""}`;
		}

		const unpacked = {};
		subHashes.forEach(s => Object.assign(unpacked, UrlUtil.unpackSubHash(s, true)));
		const setFrom = unpacked[ListUtil.SUB_HASH_PREFIX];
		if (setFrom) {
			const json = JSON.parse(setFrom);

			if (funcPreload) funcPreload(json, () => funcOnload(json));
			else funcOnload(json);
		}
	},

	doSublistAdd: (index, doFinalise, addCount) => {
		if (index == null) {
			alert("Please first view something from the list");
			return;
		}
		const count = ListUtil._pinned[index] || 0;
		addCount = addCount || 1;
		ListUtil._pinned[index] = count + addCount;
		if (count === 0) ListUtil.$sublist.append(ListUtil._getSublistRow(ListUtil._allItems[index], index, addCount));
		else ListUtil._setCount(index, count + addCount);
		if (doFinalise) ListUtil._finaliseSublist();
	},

	doSublistSubtract: (index, subtractCount) => {
		const count = ListUtil._pinned[index] || 0;
		subtractCount = subtractCount || 1;
		if (count > subtractCount) {
			ListUtil._pinned[index] = count - subtractCount;
			ListUtil._setCount(index, count - subtractCount);
			ListUtil._handleCallUpdateFn();
		} else if (count) ListUtil.doSublistRemove(index);
	},

	getSublistedIds: () => {
		return Object.keys(ListUtil._pinned).map(it => Number(it));
	},

	_setCount: (index, newCount) => {
		const $cnt = $(ListUtil.sublist.get("id", index)[0].elm).find(".count");
		if ($cnt.find("input").length) $cnt.find("input").val(newCount);
		else $cnt.text(newCount);
	},

	_finaliseSublist: (noSave) => {
		ListUtil.sublist.reIndex();
		ListUtil._updateSublistVisibility();
		if (!noSave) ListUtil._saveSublist();
		ListUtil._handleCallUpdateFn();
	},

	_getExportableSublist: () => {
		const sources = new Set();
		const toSave = ListUtil.sublist.items
			.map(it => {
				const $elm = $(it.elm);
				sources.add(ListUtil._allItems[Number($elm.attr(FLTR_ID))].source);
				return {h: $elm.find(`a`).prop("hash").slice(1), c: $elm.find(".count").text() || undefined};
			});
		return {items: toSave, sources: Array.from(sources)};
	},

	_saveSublist: () => {
		StorageUtil.setForPage("sublist", ListUtil._getExportableSublist());
	},

	_updateSublistVisibility: () => {
		if (ListUtil.sublist.items.length) ListUtil.$sublistContainer.show();
		else ListUtil.$sublistContainer.hide();
	},

	doSublistRemove: (index) => {
		delete ListUtil._pinned[index];
		ListUtil.sublist.remove("id", index);
		ListUtil._updateSublistVisibility();
		ListUtil._saveSublist();
		ListUtil._handleCallUpdateFn();
	},

	doSublistRemoveAll: (noSave) => {
		ListUtil._pinned = {};
		ListUtil.sublist.clear();
		ListUtil._updateSublistVisibility();
		if (!noSave) ListUtil._saveSublist();
		ListUtil._handleCallUpdateFn();
	},

	isSublisted: (index) => {
		return ListUtil._pinned[index];
	},

	deslectAll: (list) => {
		list.items.forEach(it => it.elm.className = it.elm.className.replace(/list-multi-selected/g, ""));
	},

	forEachSelected: (list, forEachFunc) => {
		list.items
			.filter(it => it.elm.className.includes("list-multi-selected"))
			.map(it => {
				it.elm.className = it.elm.className.replace(/list-multi-selected/g, "");
				return it.elm.getAttribute(FLTR_ID);
			})
			.forEach(it => forEachFunc(it));
	},

	getSelectedCount: (list) => {
		return list.items.filter(it => it.elm.className.includes("list-multi-selected")).length;
	},

	isAnySelected: (list) => {
		return !!list.items.find(it => it.elm.className.includes("list-multi-selected"));
	},

	_handleCallUpdateFn: () => {
		if (ListUtil._sublistChangeFn) ListUtil._sublistChangeFn();
	},

	_hasLoadedState: false,
	loadState: () => {
		if (ListUtil._hasLoadedState) return;
		ListUtil._hasLoadedState = true;
		try {
			const store = StorageUtil.getForPage("sublist");
			if (store && store.items) {
				ListUtil._loadSavedSublist(store.items);
			}
		} catch (e) {
			StorageUtil.removeForPage("sublist");
			setTimeout(() => {
				throw e
			});
		}
	},

	_loadSavedSublist: (items, additive) => {
		if (!additive) ListUtil.doSublistRemoveAll(true);
		items.forEach(it => {
			const $ele = History._getListElem(it.h);
			const itId = $ele ? $ele.attr("id") : null;
			if (itId != null) ListUtil.doSublistAdd(itId, false, Number(it.c));
		});
		ListUtil._finaliseSublist(true);
	},

	getSelectedSources: () => {
		const store = StorageUtil.getForPage("sublist");
		if (store && store.sources) {
			return store.sources;
		}
	},

	initGenericPinnable: () => {
		ListUtil.initContextMenu(ListUtil.handleGenericContextMenuClick, "Popout", "Pin");
		ListUtil.initSubContextMenu(ListUtil.handleGenericSubContextMenuClick, "Popout", "Unpin", "Clear Pins");
	},

	handleGenericContextMenuClick: (evt, ele, $invokedOn, $selectedMenu) => {
		const itId = Number($invokedOn.attr(FLTR_ID));
		switch (Number($selectedMenu.data("ctx-id"))) {
			case 0:
				EntryRenderer.hover.doPopout($invokedOn, ListUtil._allItems, itId, evt.clientX);
				break;
			case 1:
				ListUtil._primaryLists.forEach(l => {
					ListUtil.forEachSelected(l, (it) => {
						if (!ListUtil.isSublisted(it)) ListUtil.doSublistAdd(it);
					});
				});
				ListUtil._finaliseSublist();
				break;
		}
	},

	handleGenericSubContextMenuClick: (evt, ele, $invokedOn, $selectedMenu) => {
		const itId = Number($invokedOn.attr(FLTR_ID));
		switch (Number($selectedMenu.data("ctx-id"))) {
			case 0:
				EntryRenderer.hover.doPopout($invokedOn, ListUtil._allItems, itId, evt.clientX);
				break;
			case 1:
				ListUtil.doSublistRemove(itId);
				break;
			case 2:
				ListUtil.doSublistRemoveAll();
				break;
		}
	},

	initGenericAddable: () => {
		ListUtil.initContextMenu(ListUtil.handleGenericMultiContextMenuClick, "Popout", "Add");
		ListUtil.initSubContextMenu(ListUtil.handleGenericMulriSubContextMenuClick, "Popout", "Remove", "Clear List");
	},

	handleGenericMultiContextMenuClick: (evt, ele, $invokedOn, $selectedMenu) => {
		const itId = Number($invokedOn.attr(FLTR_ID));
		switch (Number($selectedMenu.data("ctx-id"))) {
			case 0:
				EntryRenderer.hover.doPopout($invokedOn, ListUtil._allItems, itId, evt.clientX);
				break;
			case 1:
				ListUtil._primaryLists.forEach(l => {
					ListUtil.forEachSelected(l, (it) => ListUtil.doSublistAdd(it));
				});
				ListUtil._finaliseSublist();
				break;
		}
	},

	handleGenericMulriSubContextMenuClick: (evt, ele, $invokedOn, $selectedMenu) => {
		const itId = Number($invokedOn.attr(FLTR_ID));
		switch (Number($selectedMenu.data("ctx-id"))) {
			case 0:
				EntryRenderer.hover.doPopout($invokedOn, itemList, itId, evt.clientX);
				break;
			case 1:
				ListUtil.doSublistRemove(itId);
				break;
			case 2:
				ListUtil.doSublistRemoveAll();
				break;
		}
	},

	/**
	 * Assumes any other lists have been searched using the same term
	 */
	getSearchTermAndReset: (list, ...otherLists) => {
		let lastSearch = null;
		if (list.searched) {
			lastSearch = $(`#search`).val();
			list.search();
			otherLists.forEach(l => l.search());
		}
		list.filter();
		otherLists.forEach(l => l.filter());
		return lastSearch;
	},

	toggleCheckbox (evt, ele) {
		const $ipt = $(ele).find(`input`);
		$ipt.prop("checked", !$ipt.prop("checked"))
	},

	getCompleteSources (it) {
		return it.otherSources ? [it.source].concat(it.otherSources.map(src => src.source)) : it.source;
	},

	bindShowTableButton (id, title, dataList, colTransforms, sorter) {
		$(`#${id}`).click("click", () => ListUtil.showTable(title, dataList, colTransforms, sorter));
	},

	getVisibleIds () {
		return BrewUtil._lists.map(l => l.visibleItems.map(it => Number(it.elm.getAttribute(FLTR_ID)))).reduce((la, lb) => la.concat(lb), []);
	},

	showTable (title, dataList, colTransforms, filter, sorter) {
		const $modal = $(`<div class="modal-outer dropdown-menu"/>`);
		const $wrpModal = $(`<div class="modal-wrapper">`).appendTo($(`body`)).click(() => $wrpModal.remove());
		$modal.appendTo($wrpModal);
		const $modalInner = $(`<div class="modal-inner"/>`).appendTo($modal).click((evt) => evt.stopPropagation());

		const $pnlControl = $(`<div class="split my-3"/>`).appendTo($modalInner);
		const $pnlCols = $(`<div class="flex" style="align-items: center;"/>`).appendTo($pnlControl);
		Object.values(colTransforms).forEach((c, i) => {
			const $wrpCb = $(`<label class="flex-${c.flex} px-2 mr-2 no-wrap inline-flex">${c.name} </label>`).appendTo($pnlCols);
			const $cbToggle = $(`<input type="checkbox" class="ml-1" data-name="${c.name}" checked>`)
				.click(() => {
					const toToggle = $modalInner.find(`.col_${i}`);
					if ($cbToggle.prop("checked")) {
						toToggle.show();
					} else {
						toToggle.hide();
					}
				})
				.appendTo($wrpCb)
		});
		const $pnlBtns = $(`<div/>`).appendTo($pnlControl);
		function getAsCsv () {
			const headers = $pnlCols.find(`input:checked`).map((i, e) => $(e).data("name")).get();
			const rows = $modalInner.find(`.data-row`).map((i, e) => $(e)).get().map($e => {
				return $e.find(`td:visible`).map((j, d) => $(d).text()).get();
			});
			return DataUtil.getCsv(headers, rows);
		}
		const $btnCsv = $(`<div class="btn btn-primary mr-3">Download CSV</div>`).click(() => {
			DataUtil.userDownloadText(`${title}.csv`, getAsCsv());
		}).appendTo($pnlBtns);
		const $btnCopy = $(`<div class="btn btn-primary">Copy CSV to Clipboard</div>`).click(() => {
			copyText(getAsCsv());
			showCopiedEffect($btnCopy);
		}).appendTo($pnlBtns);
		$modalInner.append(`<hr>`);

		if (typeof filter === "object" && filter.generator) filter = filter.generator();

		let temp = `<table class="table-striped" style="width: 100%;"><thead><tr class="flex">${Object.values(colTransforms).map((c, i) => `<th class="col_${i} flex-${c.flex} px-2">${c.name}</th>`).join("")}</tr></thead><tbody>`;
		(sorter ? JSON.parse(JSON.stringify(dataList)).sort(sorter) : dataList).filter((it, i) => filter ? filter(i) : it).forEach(it => {
			temp += `<tr class="flex data-row">`;
			temp += Object.keys(colTransforms).map((k, i) => {
				const c = colTransforms[k];
				return `<td class="col_${i} flex-${c.flex} px-2">${c.transform === true ? it[k] : c.transform(it[k])}</td>`;
			}).join("");
			temp += `</tr>`;
		});
		temp += `</tbody></table>`;
		$modalInner.append(temp);
	}
};

/**
 * Generic source filter
 * deselected. If there are more items to be deselected than selected, it is advisable to set this to "true"
 * @param options overrides for the default filter options
 * @returns {*} a `Filter`
 */
function getSourceFilter (options = {}) {
	const baseOptions = {
		header: FilterBox.SOURCE_HEADER,
		displayFn: Parser.sourceJsonToFullCompactPrefix,
		selFn: defaultSourceSelFn,
		groupFn: SourceUtil.getFilterGroup
	};
	Object.assign(baseOptions, options);
	return new GroupedFilter(baseOptions);
}

function defaultSourceDeselFn (val) {
	return SourceUtil.isNonstandardSource(val);
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
UrlUtil = {};
UrlUtil.encodeForHash = function (toEncode) {
	if (toEncode instanceof Array) {
		return toEncode.map(i => encodeForHashHelper(i)).join(HASH_LIST_SEP);
	} else {
		return encodeForHashHelper(toEncode);
	}

	function encodeForHashHelper (part) {
		return encodeURIComponent(part).toLowerCase();
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
	let out = pSplit[pSplit.length - 1];
	if (!out.toLowerCase().endsWith(".html")) out += ".html";
	return out;
};

/**
 * All internal URL construction should pass through here, to ensure `static.5etools.com` is used when required.
 *
 * @param href the link
 */
UrlUtil.link = function (href) {
	function addGetParam (curr) {
		if (href.includes("?")) return `${curr}&ver=${VERSION_NUMBER}`;
		else return `${curr}?ver=${VERSION_NUMBER}`;
	}
	if (!IS_ROLL20 && IS_DEPLOYED) return addGetParam(`${DEPLOYED_STATIC_ROOT}${href}`);
	else if (IS_DEPLOYED) return addGetParam(href);
	return href;
};

UrlUtil.unpackSubHash = function (subHash, unencode) {
	// format is "key:value~list~sep~with~tilde"
	if (subHash.includes(HASH_SUB_KV_SEP)) {
		const keyValArr = subHash.split(HASH_SUB_KV_SEP).map(s => s.trim());
		const out = {};
		let k = keyValArr[0].toLowerCase();
		if (unencode) k = decodeURIComponent(k);
		let v = keyValArr[1].toLowerCase();
		if (unencode) v = decodeURIComponent(v);
		out[k] = v.split(HASH_SUB_LIST_SEP).map(s => s.trim());
		if (out[k].length === 1 && out[k] === HASH_SUB_NONE) out[k] = [];
		return out;
	} else {
		throw new Error(`Baldy formatted subhash ${subHash}`)
	}
};

UrlUtil.packSubHash = function (key, values, encode) {
	if (encode) {
		key = encodeURIComponent(key.toLowerCase());
		values = values.map(it => encodeURIComponent(it.toLowerCase()));
	}
	return `${key}${HASH_SUB_KV_SEP}${values.join(HASH_SUB_LIST_SEP)}`;
};

UrlUtil.categoryToPage = function (category) {
	return UrlUtil.CAT_TO_PAGE[category];
};

UrlUtil.PG_BESTIARY = "bestiary.html";
UrlUtil.PG_SPELLS = "spells.html";
UrlUtil.PG_BACKGROUNDS = "backgrounds.html";
UrlUtil.PG_ITEMS = "items.html";
UrlUtil.PG_CLASSES = "classes.html";
UrlUtil.PG_CONDITIONS_DISEASES = "conditionsdiseases.html";
UrlUtil.PG_FEATS = "feats.html";
UrlUtil.PG_INVOCATIONS = "invocations.html";
UrlUtil.PG_PSIONICS = "psionics.html";
UrlUtil.PG_RACES = "races.html";
UrlUtil.PG_REWARDS = "rewards.html";
UrlUtil.PG_VARIATNRULES = "variantrules.html";
UrlUtil.PG_ADVENTURE = "adventure.html";
UrlUtil.PG_ADVENTURES = "adventures.html";
UrlUtil.PG_DEITIES = "deities.html";
UrlUtil.PG_CULTS_BOONS = "cultsboons.html";
UrlUtil.PG_OBJECTS = "objects.html";
UrlUtil.PG_TRAPS_HAZARDS = "trapshazards.html";
UrlUtil.PG_QUICKREF = "quickreference.html";
UrlUtil.PG_MAKE_SHAPED = "makeshaped.html";

UrlUtil.URL_TO_HASH_BUILDER = {};
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS] = (it) => UrlUtil.encodeForHash([it.name, Parser.sourceJsonToAbv(it.source)]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS_DISEASES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_INVOCATIONS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_PSIONICS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_REWARDS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VARIATNRULES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ADVENTURE] = (it) => UrlUtil.encodeForHash(it.id);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_DEITIES] = (it) => UrlUtil.encodeForHash([it.name, it.pantheon, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CULTS_BOONS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OBJECTS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TRAPS_HAZARDS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);

UrlUtil.CAT_TO_PAGE = {};
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CREATURE] = UrlUtil.PG_BESTIARY;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SPELL] = UrlUtil.PG_SPELLS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_BACKGROUND] = UrlUtil.PG_BACKGROUNDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ITEM] = UrlUtil.PG_ITEMS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CLASS] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CONDITION] = UrlUtil.PG_CONDITIONS_DISEASES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_FEAT] = UrlUtil.PG_FEATS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ELDRITCH_INVOCATION] = UrlUtil.PG_INVOCATIONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_PSIONIC] = UrlUtil.PG_PSIONICS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_RACE] = UrlUtil.PG_RACES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_OTHER_REWARD] = UrlUtil.PG_REWARDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_VARIANT_OPTIONAL_RULE] = UrlUtil.PG_VARIATNRULES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ADVENTURE] = UrlUtil.PG_ADVENTURE;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_DEITY] = UrlUtil.PG_DEITIES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_OBJECT] = UrlUtil.PG_OBJECTS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_TRAP] = UrlUtil.PG_TRAPS_HAZARDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_HAZARD] = UrlUtil.PG_TRAPS_HAZARDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_QUICKREF] = UrlUtil.PG_QUICKREF;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CULT] = UrlUtil.PG_CULTS_BOONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_BOON] = UrlUtil.PG_CULTS_BOONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_DISEASE] = UrlUtil.PG_CONDITIONS_DISEASES;

UrlUtil.bindLinkExportButton = (filterBox) => {
	const $btn = ListUtil.getOrTabRightButton(`btn-link-export`, `magnet`);
	$btn.addClass("btn-copy-effect")
		.off("click")
		.on("click", (evt) => {
			let url = window.location.href;

			const toHash = filterBox.getAsSubHashes();
			parts = Object.keys(toHash).map(hK => {
				const hV = toHash[hK];
				return UrlUtil.packSubHash(hK, hV, true);
			});
			if (evt.shiftKey) {
				const toEncode = JSON.stringify(ListUtil._getExportableSublist());
				const part2 = UrlUtil.packSubHash(ListUtil.SUB_HASH_PREFIX, [toEncode], true);
				parts = parts.concat(part2);
			}
			parts.unshift(url);

			copyText(parts.join(HASH_PART_SEP));
			showCopiedEffect($btn);
		})
		.attr("title", "Get Link to Filters (SHIFT adds List)")
};

if (!IS_DEPLOYED && !IS_ROLL20 && typeof window !== "undefined") {
	// for local testing, hotkey to get a link to the current page on the main site
	window.addEventListener("keypress", (e) => {
		if (noModifierKeys(e) && typeof d20 === "undefined") {
			if (e.key === "#") {
				const spl = window.location.href.split("/");
				window.prompt("Copy to clipboard: Ctrl+C, Enter", `https://5e.tools/${spl[spl.length - 1]}`);
			}
		}
	});
}

// SORTING =============================================================================================================
SortUtil = {
	ascSort: (a, b) => {
		// to handle `FilterItem`s
		if (a.hasOwnProperty("item") && b.hasOwnProperty("item")) {
			return SortUtil._ascSort(a.item, b.item);
		}
		return SortUtil._ascSort(a, b);
	},

	_ascSort: (a, b) => {
		if (b === a) return 0;
		return b < a ? 1 : -1;
	},

	compareNames: (a, b) => {
		if (b._values.name.toLowerCase() === a._values.name.toLowerCase()) return 0;
		else if (b._values.name.toLowerCase() > a._values.name.toLowerCase()) return 1;
		else if (b._values.name.toLowerCase() < a._values.name.toLowerCase()) return -1;
	},

	listSort: (itemA, itemB, options) => {
		if (options.valueName === "name") return compareBy("name");
		else return compareByOrDefault(options.valueName, "name");

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
	},

	/**
	 * "Special Equipment" first, then alphabetical
	 */
	monTraitSort: (a, b) => {
		if (!a && !b) return 0;
		if (!a) return -1;
		if (!b) return 1;
		if (a.toLowerCase().trim() === "special equipment") return -1;
		if (b.toLowerCase().trim() === "special equipment") return 1;
		return SortUtil.ascSort(a, b)
	},

	_alignFirst: ["L", "C"],
	_alignSecond: ["G", "E"],
	alignmentSort: (a, b) => {
		if (a === b) return 0;
		if (SortUtil._alignFirst.includes(a)) return -1;
		if (SortUtil._alignSecond.includes(a)) return 1;
		if (SortUtil._alignFirst.includes(b)) return 1;
		if (SortUtil._alignSecond.includes(b)) return -1;
		return 0;
	}
};

// JSON LOADING ========================================================================================================
DataUtil = {
	_loaded: {},

	loadJSON: function (url, ...otherData) {
		return new Promise((resolve, reject) => {
			function handleAlreadyLoaded (url) {
				resolve(DataUtil._loaded[url], otherData);
			}

			if (this._loaded[url]) {
				handleAlreadyLoaded(url);
				return;
			}

			const procUrl = UrlUtil.link(url);
			if (this._loaded[procUrl]) {
				handleAlreadyLoaded(procUrl);
				return;
			}

			const request = getRequest(procUrl);
			if (procUrl !== url) {
				request.onerror = function () {
					const fallbackRequest = getRequest(url);
					fallbackRequest.send();
				};
			}
			request.send();

			function getRequest (toUrl) {
				const request = new XMLHttpRequest();
				request.open("GET", toUrl, true);
				request.overrideMimeType("application/json");
				request.onload = function () {
					try {
						const data = JSON.parse(this.response);
						DataUtil._loaded[toUrl] = data;
						resolve(data, otherData);
					} catch (e) {
						reject(new Error('Could not parse JSON' + toUrl + e));
					}
				};
				request.onerror = (e) => reject(new Error('Error during JSON request: ' + e));
				return request;
			}
		});
	},

	multiLoadJSON: function (toLoads, onEachLoadFunction, onFinalLoadFunction) {
		if (!toLoads.length) onFinalLoadFunction([]);
		return Promise.all(toLoads.map(tl => this.loadJSON(tl.url))).then(datas => {
			datas.forEach((data, i) => {
				if (onEachLoadFunction) onEachLoadFunction(toLoads[i], data);
			});
			return onFinalLoadFunction(datas);
		});
	},

	userDownload: function (filename, data) {
		if (typeof data !== "string") data = JSON.stringify(data, null, "\t");
		const $a = $(`<a href="data:text/json;charset=utf-8,${encodeURIComponent(data)}" download="${filename}.json" style="display: none;">DL</a>`);
		$(`body`).append($a);
		$a[0].click();
		$a.remove();
	},

	getCsv (headers, rows) {
		function escapeCsv (str) {
			return `"${str.replace(/"/g, `""`)}"`;
		}

		function toCsv (row) {
			return row.map(str => escapeCsv(str)).join(",");
		}

		return `${toCsv(headers)}\n${rows.map(r => toCsv(r)).join("\n")}`;
	},

	userDownloadText (filename, string) {
		const $a = $(`<a href="data:text/plain;charset=utf-8,${encodeURIComponent(string)}" download="${filename}" style="display: none;">DL</a>`);
		$(`body`).append($a);
		$a[0].click();
		$a.remove();
	},

	userUpload (fnCallback) {
		function loadSaved (event) {
			const input = event.target;

			const reader = new FileReader();
			reader.onload = () => {
				const text = reader.result;
				const json = JSON.parse(text);
				fnCallback(json);
			};
			reader.readAsText(input.files[0]);
		}

		const $iptAdd = $(`<input type="file" accept=".json" style="position: fixed; top: -100px; left: -100px; display: none;">`).on("change", (evt) => {
			loadSaved(evt);
		}).appendTo($(`body`));
		$iptAdd.click();
	},

	class: {
		loadJSON: function (baseUrl = "") {
			return new Promise((resolve) => {
				DataUtil.loadJSON(`${baseUrl}data/class/index.json`).then((index) => {
					Promise.all(Object.values(index).map(it => DataUtil.loadJSON(`${baseUrl}data/class/${it}`))).then((all) => {
						resolve(all.reduce((a, b) => ({class: a.class.concat(b.class)}), {class: []}));
					});
				})
			});
		}
	},

	deity: {
		doPostLoad: function (data, callbackFn) {
			const PRINT_ORDER = [
				SRC_PHB,
				SRC_DMG,
				SRC_SCAG,
				SRC_MTF
			];

			const inSource = {};
			PRINT_ORDER.forEach(src => {
				inSource[src] = {};
				data.deity.filter(it => it.source === src).forEach(it => inSource[src][it.reprintAlias || it.name] = it); // TODO need to handle similar names
			});

			const laterPrinting = [PRINT_ORDER.last()];
			[...PRINT_ORDER].reverse().slice(1).forEach(src => {
				laterPrinting.forEach(laterSrc => {
					Object.keys(inSource[src]).forEach(name => {
						const newer = inSource[laterSrc][name];
						if (newer) {
							const old = inSource[src][name];
							old.reprinted = true;
							if (!newer._isEnhanced) {
								newer.previousVersions = newer.previousVersions || [];
								newer.previousVersions.push(old);
							}
						}
					});
				});

				laterPrinting.push(src);
			});
			data.deity.forEach(g => g._isEnhanced = true);

			callbackFn(data);
		},

		loadJSON: function (baseUrl = "") {
			return new Promise((resolve) => {
				DataUtil.loadJSON(`${baseUrl}data/deities.json`).then((data) => {
					DataUtil.deity.doPostLoad(data, resolve);
				})
			});
		}
	}
};

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
	$(`#contentwrapper`).prepend(toInjectShow);

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

// ROLLING =============================================================================================================
RollerUtil = {
	isCrypto: () => {
		return typeof window !== "undefined" && typeof window.crypto !== "undefined";
	},

	randomise: (max, min = 1) => {
		if (RollerUtil.isCrypto()) {
			return RollerUtil._randomise(min, max + min);
		} else {
			return RollerUtil.roll(max) + min;
		}
	},

	/**
	 * Cryptographically secure RNG
	 */
	_randomise: (min, max) => {
		const range = max - min;
		const bytesNeeded = Math.ceil(Math.log2(range) / 8);
		const randomBytes = new Uint8Array(bytesNeeded);
		const maximumRange = Math.pow(Math.pow(2, 8), bytesNeeded);
		const extendedRange = Math.floor(maximumRange / range) * range;
		let i;
		let randomInteger;
		while (true) {
			window.crypto.getRandomValues(randomBytes);
			randomInteger = 0;
			for (i = 0; i < bytesNeeded; i++) {
				randomInteger <<= 8;
				randomInteger += randomBytes[i];
			}
			if (randomInteger < extendedRange) {
				randomInteger %= range;
				return min + randomInteger;
			}
		}
	},

	/**
	 * Result in range: 0 to (max-1); inclusive
	 * e.g. roll(20) gives results ranging from 0 to 19
	 * @param max range max (exclusive)
	 * @returns {number} rolled
	 */
	roll: (max) => {
		return Math.floor(Math.random() * max);
	},

	addListRollButton: () => {
		const listWrapper = $("#listcontainer");

		const $btnRoll = $(`<button class="btn btn-default" id="feelinglucky" title="Feeling Lucky?"><span class="glyphicon glyphicon-random"></span></button>`);
		$btnRoll.on("click", () => {
			if (listWrapper.data("lists")) {
				const allLists = listWrapper.data("lists").filter(l => l.visibleItems.length);
				if (allLists.length) {
					const rollX = RollerUtil.roll(allLists.length);
					const list = allLists[rollX];
					const rollY = RollerUtil.roll(list.visibleItems.length);
					window.location.hash = $(list.visibleItems[rollY].elm).find(`a`).prop("hash");
				}
			}
		});

		$(`#filter-search-input-group`).find(`#reset`).before($btnRoll);
	},

	isRollCol (string) {
		if (typeof string !== "string") return false;
		return !!/^({@dice )?(\d+)?d\d+([+-](\d+)?d\d+)*(})?$/.exec(string.trim());
	},

	DICE_REGEX: /([1-9]\d*)?d([1-9]\d*)(\s?[+-]\s?\d+)?/g
};

// STORAGE =============================================================================================================
StorageUtil = {
	_fakeStorage: {},
	getStorage: () => {
		try {
			return window.localStorage;
		} catch (e) {
			// if the user has disabled cookies, build a fake version
			return {
				isFake: true,
				getItem: (k) => {
					return StorageUtil._fakeStorage[k];
				},
				removeItem: (k) => {
					delete StorageUtil._fakeStorage[k];
				},
				setItem: (k, v) => {
					StorageUtil._fakeStorage[k] = v;
				}
			};
		}
	},

	isFake () {
		return StorageUtil.getStorage().isFake
	},

	setForPage: (key, value) => {
		StorageUtil.set(`${key}_${UrlUtil.getCurrentPage()}`, value);
	},

	set (key, value) {
		StorageUtil.getStorage().setItem(key, JSON.stringify(value));
	},

	getForPage: (key) => {
		return StorageUtil.get(`${key}_${UrlUtil.getCurrentPage()}`);
	},

	get (key) {
		const rawOut = StorageUtil.getStorage().getItem(key);
		if (rawOut && rawOut !== "undefined" && rawOut !== "null") return JSON.parse(rawOut);
		return null;
	},

	removeForPage: (key) => {
		StorageUtil.remove(`${key}_${UrlUtil.getCurrentPage()}`)
	},

	remove (key) {
		StorageUtil.getStorage().removeItem(key);
	}
};

// HOMEBREW ============================================================================================================
BrewUtil = {
	homebrew: null,
	homebrewMeta: null, // TODO
	_lists: null,
	storage: StorageUtil.getStorage(),
	_sourceCache: null,
	_filterBox: null,
	_sourceFilter: null,

	bind (options) {
		// provide ref to List.js instance
		if (options.list) BrewUtil._lists = [options.list];
		else if (options.lists) BrewUtil._lists = options.lists;
		// provide ref to FilterBox and Filter instance
		if (options.filterBox) BrewUtil._filterBox = options.filterBox;
		if (options.sourceFilter) BrewUtil._sourceFilter = options.sourceFilter;
	},

	pAddBrewData: () => {
		return new Promise(resolve => {
			if (BrewUtil.homebrew) {
				resolve(BrewUtil.homebrew);
			} else {
				const rawBrew = BrewUtil.storage.getItem(HOMEBREW_STORAGE);
				const rawBrewMeta = BrewUtil.storage.getItem(HOMEBREW_META_STORAGE);

				new Promise((resolve) => {
					if (rawBrewMeta) {
						BrewUtil.homebrewMeta = JSON.parse(rawBrewMeta);
						BrewUtil.homebrewMeta.sources = BrewUtil.homebrewMeta.sources || [];
						resolve();
					} else {
						BrewUtil.homebrewMeta = {sources: []};
						resolve();
					}
				}).then(new Promise((resolve) => {
					if (rawBrew) {
						BrewUtil.homebrew = JSON.parse(rawBrew);
						resolve();
					} else {
						BrewUtil.homebrew = {};
						resolve();
					}
				}).then(BrewUtil._pLoadLocal()).then(() => {
					BrewUtil._resetSourceCache();
				}).then(() => resolve(BrewUtil.homebrew))).catch(error => {
					// on error, purge all brew and reset hash
					BrewUtil.purgeBrew();
					setTimeout(() => {
						throw error
					});
				});
			}
		});
	},

	purgeBrew (error) {
		window.alert("Error when loading homebrew! Purging corrupt data...");
		BrewUtil.storage.removeItem(HOMEBREW_STORAGE);
		BrewUtil.homebrew = null;
		window.location.hash = "";
		if (error) {
			setTimeout(() => {
				throw error
			}, 1);
		}
	},

	_pLoadLocal (callbackFn = (d, page) => BrewUtil.doHandleBrewJson(d, page, null)) {
		return DataUtil.loadJSON(`${EntryRenderer.getDefaultRenderer().baseUrl}${JSON_HOMEBREW_INDEX}`).then((data) => {
			// auto-load from `homebrew/`, for custom versions of the site
			if (data.toImport.length) {
				const page = UrlUtil.getCurrentPage();
				Promise.all(data.toImport.map(it => DataUtil.loadJSON(`homebrew/${it}`))).then((datas) => {
					datas.forEach(d => callbackFn(d, page));
					Promise.resolve();
				});
			} else Promise.resolve();
		});
	},

	manageBrew: (funcAddCallback) => {
		const page = UrlUtil.getCurrentPage();
		const $body = $(`body`);
		$body.css("overflow", "hidden");
		const $overlay = $(`<div class="homebrew-overlay"/>`);
		$overlay.on("click", () => {
			$body.css("overflow", "");
			$overlay.remove();
		});

		function makeNextOverlay () {
			$overlay.css("background", "transparent");
			const $overlay2 = $(`<div class="homebrew-overlay"/>`);
			$overlay2.on("click", () => {
				$overlay2.remove();
				$overlay.css("background", "");
			});
			$body.append($overlay2);
			return $overlay2;
		}

		const $window = $(`
		<div class="homebrew-window dropdown-menu">
			<h4 class="title"><span>Manage Homebrew</span><button class="btn btn-xs btn-danger">Delete All (Including Legacy)</button></h4>
			<hr>
		</div>`
		);
		$window.on("click", (evt) => {
			evt.stopPropagation();
		});
		const $btnDelAll = $window.find(`button`);
		const $brewList = $(`<div class="current-brew"/>`);
		$window.append($brewList);

		refreshBrewList();

		const $iptAdd = $(`<input multiple type="file" accept=".json" style="display: none;">`).change((evt) => {
			addBrewLocal(evt, funcAddCallback);
		});

		const $btnLoadFromUrl = $(`<button class="btn btn-default btn-sm">Load from URL</button>`);
		$btnLoadFromUrl.click(() => {
			const enteredUrl = window.prompt('Please enter the URL of the homebrew:');
			if (!enteredUrl) return;

			let parsedUrl;
			try {
				parsedUrl = new URL(enteredUrl);
			} catch (e) {
				window.alert('The entered URL does not seem to be valid.');
				return;
			}
			BrewUtil.addBrewRemote(null, parsedUrl.href).catch(() => {
				window.alert('Could not load homebrew from the given URL.')
			});
		});

		const $btnGet = $(`<button class="btn btn-default btn-sm">Get Homebrew 2.0</button>`);
		$btnGet.click(() => {
			const $lst = $(`
				<div id="brewlistcontainer" class="listcontainer homebrew-window dropdown-menu">
					<input type="search" class="search form-control" placeholder="Find homebrew..." style="width: 100%">
					<div class="filtertools sortlabel btn-group">
						<button class="col-xs-4 sort btn btn-default btn-xs" data-sort="filename">Filename</button>
						<button class="col-xs-8 sort btn btn-default btn-xs" data-sort="source">Source</button>
					</div>
					<ul class="list brew-list">
						<li><section><span style="font-style: italic;">Loading...</span></section></li>
					</ul>
				</div>
			`);
			const $nxt = makeNextOverlay();
			$nxt.append($lst);
			$lst.on("click", (evt) => {
				evt.stopPropagation();
			});

			// populate list
			const $ul = $lst.find(`ul`);
			function getBrewDirs () {
				switch (page) {
					case UrlUtil.PG_SPELLS:
						return ["spell"];
					case UrlUtil.PG_CLASSES:
						return ["class", "subclass"];
					case UrlUtil.PG_BESTIARY:
						return ["creature"];
					case UrlUtil.PG_BACKGROUNDS:
						return ["background"];
					case UrlUtil.PG_FEATS:
						return ["feat"];
					case UrlUtil.PG_INVOCATIONS:
						return ["invocation"];
					case UrlUtil.PG_RACES:
						return ["race"];
					case UrlUtil.PG_OBJECTS:
						return ["object"];
					case UrlUtil.PG_TRAPS_HAZARDS:
						return ["trap", "hazard"];
					case UrlUtil.PG_DEITIES:
						return ["deity"];
					case UrlUtil.PG_ITEMS:
						return ["item"];
					case UrlUtil.PG_REWARDS:
						return ["reward"];
					case UrlUtil.PG_PSIONICS:
						return ["psionic"];
					case UrlUtil.PG_VARIATNRULES:
						return ["variantrule"];
					case UrlUtil.PG_CONDITIONS_DISEASES:
						return ["condition", "disease"];
					case UrlUtil.PG_ADVENTURES:
						return ["adventure"];
					case UrlUtil.PG_MAKE_SHAPED:
						return ["spell", "creature"];
					default:
						throw new Error(`No homebrew properties defined for category ${page}`);
				}
			}
			const urls = getBrewDirs().map(it => ({url: `https://api.github.com/repos/TheGiddyLimit/homebrew/contents/${it}?client_id=${HOMEBREW_CLIENT_ID}&client_secret=${HOMEBREW_CLIENT_SECRET}&${(new Date()).getTime()}`}));
			DataUtil.multiLoadJSON(urls, null, (json) => {
				let stack = "";
				const all = [].concat.apply([], json);
				all.forEach(it => {
					stack += `<li>
						<section onclick="BrewUtil.addBrewRemote(this, '${(it.download_url || "").escapeQuotes()}', true)">
							<span class="col-xs-4 filename">${it.name.trim().replace(/\.json$/, "")}</span>
							<span class="col-xs-8 source" title="${it.download_url}">${it.download_url}</span>
						</section>
					</li>`;
				});

				$ul.empty();
				$ul.append(stack);

				const list = new List("brewlistcontainer", {
					valueNames: ["filename"],
					listClass: "brew-list"
				});
			});
		});
		$window.append(
			$(`<div class="text-align-center"/>`)
				.append($btnGet)
				.append(" ")
				.append($(`<label class="btn btn-default btn-sm btn-file">Upload File</label>`).append($iptAdd))
				.append(" ")
				.append($btnLoadFromUrl)
				.append(" ")
				.append(`<a href="https://github.com/TheGiddyLimit/homebrew" target="_blank"><button class="btn btn-default btn-sm btn-file">Browse Repository</button></a>`)
		);

		$overlay.append($window);
		$body.append($overlay);

		function refreshBrewList () {
			function showSourceManager (source, $overlay2) {
				const $wrpBtnDel = $(`<div class="wrp-btn-del-selected"/>`);
				const $lst = $(`
					<div id="brewlistcontainer" class="listcontainer homebrew-window dropdown-menu">
						<input type="search" class="search form-control" placeholder="Search entries..." style="width: 100%">
						<div class="filtertools sortlabel btn-group">
							<button class="col-xs-7 sort btn btn-default btn-xs" data-sort="name">Name</button>
							<button class="col-xs-4 sort btn btn-default btn-xs" data-sort="category">Category</button>
							<span class="col-xs-1 wrp-cb-all"><input type="checkbox"></span>
						</div>
						<ul class="list brew-list"></ul>
					</div>
				`);
				$lst.prepend($wrpBtnDel);
				$overlay2.append($lst);
				$lst.on("click", (evt) => {
					evt.stopPropagation();
				});

				const $cbAll = $lst.find(`.wrp-cb-all input`);

				// populate list
				function populateList () {
					function getDisplayCat (cat) {
						if (cat === "variantrule") return "Variant Rule";
						return cat.uppercaseFirst();
					}

					function getExtraInfo (category, entry) {
						switch (category) {
							case "subclass":
								return ` (${entry.class})`;
							case "psionic":
								return ` (${Parser.psiTypeToFull(entry.type)})`;
							default:
								return "";
						}
					}

					const $ul = $lst.find(`ul`);
					let stack = "";
					BrewUtil._getBrewCategories().forEach(cat => {
						BrewUtil.homebrew[cat].filter(it => it.source === source).sort((a, b) => SortUtil.ascSort(a.name, b.name)).forEach(it => {
							stack += `<li><section onclick="ListUtil.toggleCheckbox(event, this)">
							<span class="col-xs-7 name">${it.name}</span>
							<span class="col-xs-4 category">${getDisplayCat(cat)}${getExtraInfo(cat, it)}</span>
							<span class="col-xs-1 text-align-center"><input type="checkbox" onclick="event.stopPropagation()"></span>
							<span class="hidden uid">${it.uniqueId}</span>
						</section></li>`;
						})
					});
					$ul.empty();
					$ul.append(stack);
				}
				populateList();

				const list = new List("brewlistcontainer", {
					valueNames: ["name", "category", "uid"],
					listClass: "brew-list"
				});

				$cbAll.change(function () {
					const val = this.checked;
					list.items.forEach(it => $(it.elm).find(`input`).prop("checked", val));
				});
				$(`<button class="btn btn-danger btn-sm">Delete Selected</button>`).on("click", () => {
					const toDel = list.items.filter(it => $(it.elm).find(`input`).prop("checked")).map(it => it.values());

					if (!toDel.length) return;
					if (!window.confirm("Are you sure?")) return;

					if (toDel.length === list.items.length) {
						deleteSource(source, false);
						$overlay2.click();
					} else {
						toDel.forEach(it => {
							const deleteFn = getDeleteFunction(it.category.toLowerCase().replace(/ /g, ""));
							deleteFn(it.uid, false);
						});
						populateList();
						refreshBrewList();
						window.location.hash = "";
					}
				}).appendTo($wrpBtnDel);
			}

			$brewList.empty();
			if (BrewUtil.homebrew) {
				const $lst = $(`
					<div id="outerbrewlistcontainer" class="listcontainer">
						<input type="search" class="search form-control" placeholder="Search homebrew..." style="width: calc(100% - 3px)">
						<div class="filtertools sortlabel btn-group">
							<button class="col-xs-5 sort btn btn-default btn-xs" data-sort="source">Source</button>
							<button class="col-xs-4 sort btn btn-default btn-xs" data-sort="authors">Authors</button>
							<button class="col-xs-1 btn btn-default btn-xs" disabled>&nbsp;</button>
							<button class="col-xs-2 btn btn-default btn-xs" disabled>&nbsp;</button>
						</div>
						<ul class="list-display-only brew-list"></ul>
					</div>
				`);
				$brewList.append($lst);

				// populate list
				const $ul = $lst.find(`ul`);
				$ul.empty();

				BrewUtil.getJsonSources().forEach(src => {
					const $row = $(`<li class="row no-click">
						<span class="col-xs-5 col-tall source">${src.full}</span>
						<span class="col-xs-4 col-tall authors">${(src.authors || []).join(", ")}</span>
						<${src.url ? "a" : "span"} class="col-xs-1 col-tall" ${src.url ? `href="${src.url}" target="_blank"` : ""}>${src.url ? "Source" : ""}</${src.url ? "a" : "span"}>
					</li>`);
					const $btns = $(`<span class="col-xs-2 text-align-right"/>`).appendTo($row);
					$(`<button class="btn btn-sm btn-default">View/Manage</button>`)
						.on("click", () => {
							const $nxt = makeNextOverlay();
							showSourceManager(src.json, $nxt);
						})
						.appendTo($btns);
					$btns.append(" ");
					$(`<button class="btn btn-danger btn-sm"><span class="glyphicon glyphicon-trash"></span></button>`)
						.on("click", () => {
							deleteSource(src.json, true);
						})
						.appendTo($btns);

					$ul.append($row);
				});

				// hack to delay list indexing, otherwise it seems to fail
				setTimeout(() => {
					const list = new List("outerbrewlistcontainer", {
						valueNames: ["source", "authors"],
						listClass: "brew-list"
					});
				}, 5);
			}
		}

		$btnDelAll.on("click", () => {
			if (!window.confirm("Are you sure?")) return;
			BrewUtil.storage.setItem(HOMEBREW_STORAGE, "{}");
			BrewUtil.storage.setItem(HOMEBREW_META_STORAGE, "{}");
			window.location.hash = "";
			location.reload();
		});

		BrewUtil.addBrewRemote = (ele, jsonUrl, doUnescape) => {
			const $src = $(ele).find(`span.source`);
			const cached = $src.text();
			$src.text("Loading...");
			if (doUnescape) jsonUrl = jsonUrl.unescapeQuotes();
			return DataUtil.loadJSON(`${jsonUrl}?${(new Date()).getTime()}`).then((data) => {
				BrewUtil.doHandleBrewJson(data, page, refreshBrewList);
				$src.text("Done!");
				setInterval(() => {
					$src.text(cached);
				}, 500);
				if (funcAddCallback) funcAddCallback();
			});
		};

		function addBrewLocal (event, funcAddCallback) {
			const input = event.target;

			let readIndex = 0;
			const reader = new FileReader();
			reader.onload = () => {
				const text = reader.result;
				const json = JSON.parse(text);

				BrewUtil.doHandleBrewJson(json, page, refreshBrewList);
				ExcludeUtil.setList(json.blacklist || []);

				if (input.files[readIndex]) {
					reader.readAsText(input.files[readIndex++]);
				} else {
					// reset the input
					$(event.target).val("");
					if (funcAddCallback) funcAddCallback();
				}
			};
			reader.readAsText(input.files[readIndex++]);
		}

		function getIndex (arrName, uniqueId) {
			return BrewUtil.homebrew[arrName].findIndex(it => it.uniqueId === uniqueId);
		}

		function deleteSource (source, doConfirm) {
			if (doConfirm && !window.confirm(`Are you sure you want to remove all homebrew with source "${source}"?`)) return;

			BrewUtil._getBrewCategories().forEach(k => {
				const cat = BrewUtil.homebrew[k];
				const deleteFn = getDeleteFunction(k);
				const toDel = [];
				cat.forEach(it => {
					if (it.source === source) {
						toDel.push(it.uniqueId);
					}
				});
				toDel.forEach(uId => {
					deleteFn(uId, false);
				});
			});
			BrewUtil.removeJsonSource(source);
			// remove the source from the filters and re-render the filter box
			if (BrewUtil._sourceFilter) BrewUtil._sourceFilter.removeIfExists(source);
			if (BrewUtil._filterBox) BrewUtil._filterBox.render();
			refreshBrewList();
			window.location.hash = "";
			if (BrewUtil._filterBox) BrewUtil._filterBox._fireValChangeEvent();
		}

		function doRemove (arrName, uniqueId, doRefresh) {
			const index = getIndex(arrName, uniqueId);
			if (~index) {
				BrewUtil.homebrew[arrName].splice(index, 1);
				BrewUtil.storage.setItem(HOMEBREW_STORAGE, JSON.stringify(BrewUtil.homebrew));
				if (doRefresh) refreshBrewList();
				if (page === UrlUtil.PG_MAKE_SHAPED) {
					// TODO call "delete" function
				} else {
					BrewUtil._lists.forEach(l => l.remove("uniqueid", uniqueId));
					if (doRefresh) History.hashChange();
				}
			}
		}

		function getDeleteFunction (category) {
			switch (category) {
				case "spell":
				case "monster":
				case "background":
				case "feat":
				case "invocation":
				case "race":
				case "object":
				case "trap":
				case "hazard":
				case "deity":
				case "item":
				case "itemType":
				case "itemProperty":
				case "reward":
				case "psionic":
				case "variantrule":
				case "legendaryGroup":
				case "condition":
				case "disease":
					return deleteGenericBrew(category);
				case "subclass":
					return deleteSubclassBrew;
				case "class":
					return deleteClassBrew;
				case "adventure":
					return deleteAdventureBrew;
				default:
					throw new Error(`No homebrew delete function defined for category ${category}`);
			}
		}

		function deleteClassBrew (uniqueId, doRefresh) {
			doRemove("class", uniqueId, doRefresh);
		}

		function deleteSubclassBrew (uniqueId, doRefresh) {
			let subClass;
			let index = 0;
			for (; index < BrewUtil.homebrew.subclass.length; ++index) {
				if (BrewUtil.homebrew.subclass[index].uniqueId === uniqueId) {
					subClass = BrewUtil.homebrew.subclass[index];
					break;
				}
			}
			if (subClass) {
				const forClass = subClass.class;
				BrewUtil.homebrew.subclass.splice(index, 1);
				BrewUtil.storage.setItem(HOMEBREW_STORAGE, JSON.stringify(BrewUtil.homebrew));
				// refreshBrewList();
				const c = ClassData.classes.find(c => c.name.toLowerCase() === forClass.toLowerCase());

				const indexInClass = c.subclasses.findIndex(it => it.uniqueId === uniqueId);
				if (~indexInClass) {
					c.subclasses.splice(indexInClass, 1);
					c.subclasses = c.subclasses.sort((a, b) => SortUtil.ascSort(a.name, b.name));
				}
				if (doRefresh) {
					refreshBrewList();
					window.location.hash = "";
				}
			}
		}

		function deleteGenericBrew (category) {
			return (uniqueId, doRefresh) => {
				doRemove(category, uniqueId, doRefresh);
			}
		}

		function deleteAdventureBrew () {
			return (uniqueId, doRefresh) => {
				doRemove("adventure", uniqueId, false);
				// TODO lookup the other uniqueID
				doRemove("adventureData", uniqueId, doRefresh);
			}
		}
	},

	doHandleBrewJson: function (json, page, funcRefresh) {
		function storePrep (arrName) {
			if (json[arrName]) {
				json[arrName].forEach(it => {
					it.uniqueId = CryptUtil.md5(JSON.stringify(it));
				});
			} else json[arrName] = [];
		}

		// prepare for storage
		if (json.race && json.race.length) json.race = EntryRenderer.race.mergeSubraces(json.race);
		const storable = ["class", "subclass", "spell", "monster", "background", "feat", "invocation", "race", "deity", "item", "itemProperty", "itemType", "psionic", "reward", "object", "trap", "hazard", "variantrule", "legendaryGroup", "condition", "disease", "adventure", "adventureData"];
		storable.forEach(storePrep);

		// store
		function checkAndAdd (prop) {
			const areNew = [];
			if (!BrewUtil.homebrew[prop]) BrewUtil.homebrew[prop] = [];
			const existingIds = BrewUtil.homebrew[prop].map(it => it.uniqueId);
			json[prop].forEach(it => {
				if (!existingIds.find(id => it.uniqueId === id)) {
					BrewUtil.homebrew[prop].push(it);
					areNew.push(it);
				}
			});
			return areNew;
		}

		function checkAndAddSources () {
			if (!json._meta || !json._meta.sources) return [];
			const areNew = [];
			if (!BrewUtil.homebrewMeta) BrewUtil.homebrewMeta = {sources: []};
			const existing = BrewUtil.homebrewMeta.sources.map(src => src.json);
			json._meta.sources.forEach(src => {
				if (!existing.find(it => it === src.json)) {
					BrewUtil.homebrewMeta.sources.push(src);
					areNew.push(src);
				}
			});
			return areNew;
		}

		let sourcesToAdd = json._meta ? json._meta.sources : [];
		const toAdd = {};
		storable.forEach(k => toAdd[k] = json[k]);
		if (!BrewUtil.homebrew) {
			BrewUtil.homebrew = json;
		} else {
			sourcesToAdd = checkAndAddSources(); // adding source(s) to Filter should happen in per-page addX functions
			storable.forEach(k => toAdd[k] = checkAndAdd(k)); // only add if unique ID not already present
		}
		BrewUtil.storage.setItem(HOMEBREW_STORAGE, JSON.stringify(BrewUtil.homebrew));
		BrewUtil.storage.setItem(HOMEBREW_META_STORAGE, JSON.stringify(BrewUtil.homebrewMeta));

		// wipe old cache
		BrewUtil._resetSourceCache();

		// display on page
		// FIXME this requires changing the pAddBrewData in the page JS, as well as here
		// TODO complete refactoring so this always call `handleBrew` which can be defined per-page
		switch (page) {
			case UrlUtil.PG_SPELLS:
				handleBrew(toAdd);
				break;
			case UrlUtil.PG_CLASSES:
				handleBrew(toAdd);
				break;
			case UrlUtil.PG_BESTIARY:
				handleBrew(toAdd);
				break;
			case UrlUtil.PG_BACKGROUNDS:
				addBackgrounds({background: toAdd.background});
				break;
			case UrlUtil.PG_FEATS:
				addFeats({feat: toAdd.feat});
				break;
			case UrlUtil.PG_INVOCATIONS:
				addInvocations({invocation: toAdd.invocation});
				break;
			case UrlUtil.PG_RACES:
				addRaces({race: toAdd.race});
				break;
			case UrlUtil.PG_OBJECTS:
				addObjects({object: toAdd.object});
				break;
			case UrlUtil.PG_TRAPS_HAZARDS:
				handleBrew(toAdd);
				break;
			case UrlUtil.PG_DEITIES:
				addDeities({deity: toAdd.deity});
				break;
			case UrlUtil.PG_ITEMS:
				handleBrew(toAdd);
				break;
			case UrlUtil.PG_REWARDS:
				addRewards({reward: toAdd.reward});
				break;
			case UrlUtil.PG_PSIONICS:
				addPsionics({psionic: toAdd.psionic});
				break;
			case UrlUtil.PG_VARIATNRULES:
				addVariantRules({variantrule: toAdd.variantrule});
				break;
			case UrlUtil.PG_CONDITIONS_DISEASES:
				handleBrew(toAdd);
				break;
			case UrlUtil.PG_ADVENTURES:
				handleBrew(toAdd);
				break;
			case UrlUtil.PG_MAKE_SHAPED:
				// TODO call "add" function
				break;
			case "NO_PAGE":
				break;
			default:
				throw new Error(`No homebrew add function defined for category ${page}`);
		}

		if (funcRefresh) funcRefresh();

		if (BrewUtil._filterBox && BrewUtil._sourceFilter) {
			const cur = BrewUtil._filterBox.getValues();
			if (cur.Source) {
				const toSet = JSON.parse(JSON.stringify(cur.Source));

				if (toSet._totals.yes || toSet._totals.no) {
					if (page === UrlUtil.PG_CLASSES) toSet["Core"] = 1;
					else sourcesToAdd.forEach(src => toSet[src.json] = 1);

					const toSetValues = Object.keys(toSet).filter(k => !k.startsWith("_")).filter(k => toSet[k]).map(k => `${!~toSet[k] ? "!" : ""}${k}`.toLowerCase());
					BrewUtil._filterBox.setFromValues({Source: toSetValues});
				}
			}
			BrewUtil._filterBox._fireValChangeEvent();
		}
	},

	makeBrewButton: (id, funcAddCallback) => {
		$(`#${id}`).on("click", () => {
			BrewUtil.manageBrew(funcAddCallback);
		});
	},

	_getBrewCategories () {
		return Object.keys(BrewUtil.homebrew).filter(it => !it.startsWith("_"));
	},

	_buildSourceCache () {
		function doBuild () {
			if (BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.sources) {
				BrewUtil.homebrewMeta.sources.forEach(src => BrewUtil._sourceCache[src.json] = ({abbreviation: src.abbreviation, full: src.full}));
			}
		}

		if (!BrewUtil._sourceCache) {
			BrewUtil._sourceCache = {};

			if (!BrewUtil.homebrewMeta) {
				const rawBrew = BrewUtil.storage.getItem(HOMEBREW_META_STORAGE);
				const temp = rawBrew ? ((JSON.parse(rawBrew) || {})._meta || {}) : {};
				temp.sources = temp.sources || [];

				// FIXME Async code that, to be properly implemented, requires everything to be rewritten.
				// This *should* complete before anything further is allowed to execute.
				// The downside of not doing this, is homebrew sources will appear in the "official" section of the source filter.
				// This didn't seem worth breaking everything to fix.
				BrewUtil._pLoadLocal(d => {
					if (d._meta && !d._meta.sources) {
						const existing = temp.sources.map(src => src.json);
						d._meta.sources.forEach(src => {
							if (!existing.find(it => it === src.json)) {
								temp.sources.push(src);
							}
						});
					}
				});
				BrewUtil.homebrewMeta = temp;
				doBuild();
			} else {
				doBuild();
			}
		}
	},

	_resetSourceCache () {
		BrewUtil._sourceCache = null;
	},

	removeJsonSource (source) {
		BrewUtil._resetSourceCache();
		const ix = BrewUtil.homebrewMeta.sources.findIndex(it => it.json === source);
		if (~ix) BrewUtil.homebrewMeta.sources.splice(ix, 1);
		BrewUtil.storage.setItem(HOMEBREW_META_STORAGE, JSON.stringify(BrewUtil.homebrewMeta));
	},

	getJsonSources () {
		BrewUtil._buildSourceCache();
		return BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.sources ? BrewUtil.homebrewMeta.sources : [];
	},

	hasSourceJson (source) {
		BrewUtil._buildSourceCache();
		return !!BrewUtil._sourceCache[source];
	},

	sourceJsonToFull (source) {
		BrewUtil._buildSourceCache();
		return BrewUtil._sourceCache[source] ? BrewUtil._sourceCache[source].full || source : source;
	},

	sourceJsonToAbv (source) {
		BrewUtil._buildSourceCache();
		return BrewUtil._sourceCache[source] ? BrewUtil._sourceCache[source].abbreviation || source : source;
	},

	/**
	 * Get data in a format similar to the main search index
	 */
	getSearchIndex () {
		BrewUtil._buildSourceCache();
		const indexer = new Omnidexer(Omnisearch.highestId + 1);

		if (BrewUtil.homebrew) {
			Omnidexer.TO_INDEX__FROM_INDEX_JSON.filter(ti => BrewUtil.homebrew[ti.listProp]).forEach(ti => indexer.addToIndex(ti, BrewUtil.homebrew));
			Omnidexer.TO_INDEX.filter(ti => BrewUtil.homebrew[ti.listProp]).forEach(ti => indexer.addToIndex(ti, BrewUtil.homebrew));
		}

		return indexer.getIndex();
	}
};

// ID GENERATION =======================================================================================================
CryptUtil = {
	// stolen from http://www.myersdaily.org/joseph/javascript/md5.js
	_md5cycle: (x, k) => {
		let a = x[0];
		let b = x[1];
		let c = x[2];
		let d = x[3];

		a = CryptUtil._ff(a, b, c, d, k[0], 7, -680876936);
		d = CryptUtil._ff(d, a, b, c, k[1], 12, -389564586);
		c = CryptUtil._ff(c, d, a, b, k[2], 17, 606105819);
		b = CryptUtil._ff(b, c, d, a, k[3], 22, -1044525330);
		a = CryptUtil._ff(a, b, c, d, k[4], 7, -176418897);
		d = CryptUtil._ff(d, a, b, c, k[5], 12, 1200080426);
		c = CryptUtil._ff(c, d, a, b, k[6], 17, -1473231341);
		b = CryptUtil._ff(b, c, d, a, k[7], 22, -45705983);
		a = CryptUtil._ff(a, b, c, d, k[8], 7, 1770035416);
		d = CryptUtil._ff(d, a, b, c, k[9], 12, -1958414417);
		c = CryptUtil._ff(c, d, a, b, k[10], 17, -42063);
		b = CryptUtil._ff(b, c, d, a, k[11], 22, -1990404162);
		a = CryptUtil._ff(a, b, c, d, k[12], 7, 1804603682);
		d = CryptUtil._ff(d, a, b, c, k[13], 12, -40341101);
		c = CryptUtil._ff(c, d, a, b, k[14], 17, -1502002290);
		b = CryptUtil._ff(b, c, d, a, k[15], 22, 1236535329);

		a = CryptUtil._gg(a, b, c, d, k[1], 5, -165796510);
		d = CryptUtil._gg(d, a, b, c, k[6], 9, -1069501632);
		c = CryptUtil._gg(c, d, a, b, k[11], 14, 643717713);
		b = CryptUtil._gg(b, c, d, a, k[0], 20, -373897302);
		a = CryptUtil._gg(a, b, c, d, k[5], 5, -701558691);
		d = CryptUtil._gg(d, a, b, c, k[10], 9, 38016083);
		c = CryptUtil._gg(c, d, a, b, k[15], 14, -660478335);
		b = CryptUtil._gg(b, c, d, a, k[4], 20, -405537848);
		a = CryptUtil._gg(a, b, c, d, k[9], 5, 568446438);
		d = CryptUtil._gg(d, a, b, c, k[14], 9, -1019803690);
		c = CryptUtil._gg(c, d, a, b, k[3], 14, -187363961);
		b = CryptUtil._gg(b, c, d, a, k[8], 20, 1163531501);
		a = CryptUtil._gg(a, b, c, d, k[13], 5, -1444681467);
		d = CryptUtil._gg(d, a, b, c, k[2], 9, -51403784);
		c = CryptUtil._gg(c, d, a, b, k[7], 14, 1735328473);
		b = CryptUtil._gg(b, c, d, a, k[12], 20, -1926607734);

		a = CryptUtil._hh(a, b, c, d, k[5], 4, -378558);
		d = CryptUtil._hh(d, a, b, c, k[8], 11, -2022574463);
		c = CryptUtil._hh(c, d, a, b, k[11], 16, 1839030562);
		b = CryptUtil._hh(b, c, d, a, k[14], 23, -35309556);
		a = CryptUtil._hh(a, b, c, d, k[1], 4, -1530992060);
		d = CryptUtil._hh(d, a, b, c, k[4], 11, 1272893353);
		c = CryptUtil._hh(c, d, a, b, k[7], 16, -155497632);
		b = CryptUtil._hh(b, c, d, a, k[10], 23, -1094730640);
		a = CryptUtil._hh(a, b, c, d, k[13], 4, 681279174);
		d = CryptUtil._hh(d, a, b, c, k[0], 11, -358537222);
		c = CryptUtil._hh(c, d, a, b, k[3], 16, -722521979);
		b = CryptUtil._hh(b, c, d, a, k[6], 23, 76029189);
		a = CryptUtil._hh(a, b, c, d, k[9], 4, -640364487);
		d = CryptUtil._hh(d, a, b, c, k[12], 11, -421815835);
		c = CryptUtil._hh(c, d, a, b, k[15], 16, 530742520);
		b = CryptUtil._hh(b, c, d, a, k[2], 23, -995338651);

		a = CryptUtil._ii(a, b, c, d, k[0], 6, -198630844);
		d = CryptUtil._ii(d, a, b, c, k[7], 10, 1126891415);
		c = CryptUtil._ii(c, d, a, b, k[14], 15, -1416354905);
		b = CryptUtil._ii(b, c, d, a, k[5], 21, -57434055);
		a = CryptUtil._ii(a, b, c, d, k[12], 6, 1700485571);
		d = CryptUtil._ii(d, a, b, c, k[3], 10, -1894986606);
		c = CryptUtil._ii(c, d, a, b, k[10], 15, -1051523);
		b = CryptUtil._ii(b, c, d, a, k[1], 21, -2054922799);
		a = CryptUtil._ii(a, b, c, d, k[8], 6, 1873313359);
		d = CryptUtil._ii(d, a, b, c, k[15], 10, -30611744);
		c = CryptUtil._ii(c, d, a, b, k[6], 15, -1560198380);
		b = CryptUtil._ii(b, c, d, a, k[13], 21, 1309151649);
		a = CryptUtil._ii(a, b, c, d, k[4], 6, -145523070);
		d = CryptUtil._ii(d, a, b, c, k[11], 10, -1120210379);
		c = CryptUtil._ii(c, d, a, b, k[2], 15, 718787259);
		b = CryptUtil._ii(b, c, d, a, k[9], 21, -343485551);

		x[0] = CryptUtil._add32(a, x[0]);
		x[1] = CryptUtil._add32(b, x[1]);
		x[2] = CryptUtil._add32(c, x[2]);
		x[3] = CryptUtil._add32(d, x[3]);
	},

	_cmn: (q, a, b, x, s, t) => {
		a = CryptUtil._add32(CryptUtil._add32(a, q), CryptUtil._add32(x, t));
		return CryptUtil._add32((a << s) | (a >>> (32 - s)), b);
	},

	_ff: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn((b & c) | ((~b) & d), a, b, x, s, t);
	},

	_gg: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn((b & d) | (c & (~d)), a, b, x, s, t);
	},

	_hh: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn(b ^ c ^ d, a, b, x, s, t);
	},

	_ii: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn(c ^ (b | (~d)), a, b, x, s, t);
	},

	_md51: (s) => {
		let n = s.length;
		let state = [1732584193, -271733879, -1732584194, 271733878];
		let i;
		for (i = 64; i <= s.length; i += 64) {
			CryptUtil._md5cycle(state, CryptUtil._md5blk(s.substring(i - 64, i)));
		}
		s = s.substring(i - 64);
		let tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
		tail[i >> 2] |= 0x80 << ((i % 4) << 3);
		if (i > 55) {
			CryptUtil._md5cycle(state, tail);
			for (i = 0; i < 16; i++) tail[i] = 0;
		}
		tail[14] = n * 8;
		CryptUtil._md5cycle(state, tail);
		return state;
	},

	_md5blk: (s) => {
		let md5blks = [];
		for (let i = 0; i < 64; i += 4) {
			md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
		}
		return md5blks;
	},

	_hex_chr: '0123456789abcdef'.split(''),

	_rhex: (n) => {
		let s = '';
		for (let j = 0; j < 4; j++) {
			s += CryptUtil._hex_chr[(n >> (j * 8 + 4)) & 0x0F] + CryptUtil._hex_chr[(n >> (j * 8)) & 0x0F];
		}
		return s;
	},

	hex: (x) => {
		for (let i = 0; i < x.length; i++) {
			x[i] = CryptUtil._rhex(x[i]);
		}
		return x.join('');
	},

	md5: (s) => {
		return CryptUtil.hex(CryptUtil._md51(s));
	},

	_add32: (a, b) => {
		return (a + b) & 0xFFFFFFFF;
	}
};

// COLLECTIONS =========================================================================================================
CollectionUtil = {
	ObjectSet: class ObjectSet {
		constructor () {
			this.map = new Map();
			this[Symbol.iterator] = this.values;
		}
		// Each inserted element has to implement _toIdString() method that returns a string ID.
		// Two objects are considered equal if their string IDs are equal.
		add (item) {
			this.map.set(item._toIdString(), item);
		}

		values () {
			return this.map.values();
		}
	},

	joinConjunct: (arr, joinWith, conjunctWith) => {
		return arr.length === 1 ? String(arr[0]) : arr.length === 2 ? arr.join(conjunctWith) : arr.slice(0, -1).join(joinWith) + conjunctWith + arr.slice(-1);
	},

	arrayEq (array1, array2) {
		if (!array1 && !array2) return true;
		else if ((!array1 && array2) || (array1 && !array2)) return false;

		let temp = [];
		if ((!array1[0]) || (!array2[0])) return false;
		if (array1.length !== array2.length) return false;
		let key;
		// Put all the elements from array1 into a "tagged" array
		for (let i = 0; i < array1.length; i++) {
			key = (typeof array1[i]) + "~" + array1[i]; // Use "typeof" so a number 1 isn't equal to a string "1".
			if (temp[key]) temp[key]++;
			else temp[key] = 1;
		}
		// Go through array2 - if same tag missing in "tagged" array, not equal
		for (let i = 0; i < array2.length; i++) {
			key = (typeof array2[i]) + "~" + array2[i];
			if (temp[key]) {
				if (temp[key] === 0) return false;
				else temp[key]--;
			} else return false;
		}
		return true;
	}
};

Array.prototype.last = Array.prototype.last ||
	function () {
		return this[this.length - 1];
	};

// OVERLAY VIEW ========================================================================================================
/**
 * Relies on:
 * - page implementing HashUtil's `loadsub` with handling to show/hide the book view based on hashKey changes
 * - page running no-argument `loadsub` when `hashchange` occurs
 *
 * @param hashKey to use in the URL so that forward/back can open/close the view
 * @param $openBtn jQuery-selected button to bind click open/close
 * @param noneVisibleMsg "error" message to display if user has not selected any viewable content
 * @param popTblGetNumShown function which should populate the view with HTML content and return the number of items displayed
 * @constructor
 */
function BookModeView (hashKey, $openBtn, noneVisibleMsg, popTblGetNumShown) {
	this.hashKey = hashKey;
	this.$openBtn = $openBtn;
	this.noneVisibleMsg = noneVisibleMsg;
	this.popTblGetNumShown = popTblGetNumShown;

	this.active = false;
	this._$body = null;
	this._$wrpBook = null;

	const self = this;

	self.$openBtn.on("click", () => {
		History.cleanSetHash(`${window.location.hash}${HASH_PART_SEP}${self.hashKey}:true`);
	});

	this.open = () => {
		function hashTeardown () {
			History.cleanSetHash(window.location.hash.replace(`${self.hashKey}:true`, ""));
		}

		if (self.active) return;
		self.active = true;

		const $body = $(`body`);
		const $wrpBook = $(`<div class="book-mode"/>`);
		self._$body = $body;
		self._$wrpBook = $wrpBook;
		$body.css("overflow", "hidden");
		$body.addClass("book-mode-active");

		const $bkTbl = $(`<table class="stats stats-book" style="font-size: 1.0em; font-family: inherit;"/>`);
		const $brdTop = $(`<tr><th class="border close-border" style="width: 100%;"><div/></th></tr>`);
		const $hdTxt = $(`<span class="spacer-name"/>`); // pass this to the content function to allow it to set a main header
		const $btnClose = $(`<span class="delete-icon glyphicon glyphicon-remove"></span>`)
			.on("click", () => {
				hashTeardown();
			});
		$brdTop.find(`div`).append($hdTxt).append($btnClose);
		$bkTbl.append($brdTop);

		const $tbl = $(`<table class="stats stats-book" style="width: auto; margin: 0 auto; font-family: inherit;"/>`);

		const numShown = self.popTblGetNumShown($tbl, $hdTxt);

		const $tblRow = $(`<tr/>`);
		$tblRow.append($(`<div class="wrp-content" style="${numShown ? "" : "display: none;"}"/>`).append($tbl));
		const $msgRow = $(`<tr ${numShown ? `style="display: none;"` : ""}><td class="text-align-center"><span class="initial-message">${self.noneVisibleMsg}</span><br></td></tr>`);
		$msgRow.find(`td`).append($(`<button class="btn btn-default">Close</button>`).on("click", () => {
			hashTeardown();
		}));
		$bkTbl.append($tblRow).append($msgRow).append(EntryRenderer.utils.getBorderTr());

		$wrpBook.append($bkTbl);
		$body.append($wrpBook);
	};

	this.teardown = () => {
		if (self.active) {
			self._$body.css("overflow", "");
			self._$body.removeClass("book-mode-active");
			self._$wrpBook.remove();
			self.active = false;
		}
	}
}

// CONTENT EXCLUSION ===================================================================================================
ExcludeUtil = {
	_excludes: null,
	storage: StorageUtil.getStorage(),

	initialise () {
		const raw = ExcludeUtil.storage.getItem(EXCLUDES_STORAGE);
		if (raw) {
			try {
				ExcludeUtil._excludes = JSON.parse(raw);
			} catch (e) {
				window.alert("Error when loading content blacklist! Purging corrupt data...");
				ExcludeUtil.storage.removeItem(EXCLUDES_STORAGE);
				ExcludeUtil._excludes = null;
				window.location.hash = "";
				setTimeout(() => {
					throw e
				});
			}
		} else {
			ExcludeUtil._excludes = [];
		}
	},

	getList () {
		return ExcludeUtil._excludes || [];
	},

	setList (toSet) {
		ExcludeUtil._excludes = toSet;
		ExcludeUtil._save();
	},

	isExcluded (name, category, source) {
		if (!ExcludeUtil._excludes) return false;
		source = source.source || source;
		return !!ExcludeUtil._excludes.find(row => (row.source === "*" || row.source === source) && (row.category === "*" || row.category === category) && (row.name === "*" || row.name === name));
	},

	addExclude (name, category, source) {
		if (!ExcludeUtil._excludes.find(row => row.source === source && row.category === category && row.name === name)) {
			ExcludeUtil._excludes.push({name, category, source});
			ExcludeUtil._save();
			return true;
		}
		return false;
	},

	removeExclude (name, category, source) {
		const ix = ExcludeUtil._excludes.findIndex(row => row.source === source && row.category === category && row.name === name);
		if (~ix) {
			ExcludeUtil._excludes.splice(ix, 1);
			ExcludeUtil._save();
		}
	},

	_save () {
		ExcludeUtil.storage.setItem(EXCLUDES_STORAGE, JSON.stringify(ExcludeUtil._excludes));
	},

	resetExcludes () {
		ExcludeUtil._excludes = [];
		ExcludeUtil._save();
	}
};

// LEGAL NOTICE ========================================================================================================
if (!IS_ROLL20 && typeof window !== "undefined") {
	// add an obnoxious banner
	window.addEventListener("load", () => {
		// FIXME is this something we want? If so, delete this
		/* eslint-disable */
		return;

		if (!StorageUtil.isFake() && StorageUtil.get("seenLegal")) return;
		const $wrpBanner = $(`<div id="legal-notice"><span>Don't go posting this shit to Reddit</span></div>`);
		$(`<button class="btn btn-sm btn-default">Whatever, kid</button>`).on("click", () => {
			StorageUtil.set("seenLegal", true);
			$wrpBanner.remove();
		}).appendTo($wrpBanner);
		$(`body`).append($wrpBanner);
		/* eslint-enable */
	});
}

function isObject (obj) {
	const type = typeof obj;
	return (type === 'function' || type === 'object') && !!obj;
}

function isString (str) {
	return typeof str === 'string';
}

function isNumber (obj) {
	return toString.call(obj) === '[object Number]';
}

function isEmpty (obj) {
	if (obj == null) {
		return true;
	}
	if (Array.isArray(obj) || isString(obj)) {
		return obj.length === 0;
	}
	return Object.keys(obj).length === 0;
}