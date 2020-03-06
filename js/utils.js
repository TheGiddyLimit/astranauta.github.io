// ************************************************************************* //
// Strict mode should not be used, as the roll20 script depends on this file //
// Do not use classes                                                        //
// ************************************************************************* //
// in deployment, `IS_DEPLOYED = "<version number>";` should be set below.
IS_DEPLOYED = undefined;
VERSION_NUMBER = /* 5ETOOLS_VERSION__OPEN */"1.99.1"/* 5ETOOLS_VERSION__CLOSE */;
DEPLOYED_STATIC_ROOT = ""; // "https://static.5etools.com/"; // FIXME re-enable this when we have a CDN again
// for the roll20 script to set
IS_VTT = false;

IMGUR_CLIENT_ID = `abdea4de492d3b0`;

HASH_PART_SEP = ",";
HASH_LIST_SEP = "_";
HASH_SUB_LIST_SEP = "~";
HASH_SUB_KV_SEP = ":";
HASH_BLANK = "blankhash";
HASH_SUB_NONE = "null";

CLSS_NON_STANDARD_SOURCE = "spicy-sauce";
CLSS_HOMEBREW_SOURCE = "refreshing-brew";

MON_HASH_SCALED = "scaled";

STR_NONE = "None";
STR_SEE_CONSOLE = "See the console (CTRL+SHIFT+J) for details.";

HOMEBREW_STORAGE = "HOMEBREW_STORAGE";
HOMEBREW_META_STORAGE = "HOMEBREW_META_STORAGE";
EXCLUDES_STORAGE = "EXCLUDES_STORAGE";
DMSCREEN_STORAGE = "DMSCREEN_STORAGE";
ROLLER_MACRO_STORAGE = "ROLLER_MACRO_STORAGE";
ENCOUNTER_STORAGE = "ENCOUNTER_STORAGE";
POINTBUY_STORAGE = "POINTBUY_STORAGE";

JSON_HOMEBREW_INDEX = `homebrew/index.json`;

// STRING ==============================================================================================================
String.prototype.uppercaseFirst = String.prototype.uppercaseFirst || function () {
	const str = this.toString();
	if (str.length === 0) return str;
	if (str.length === 1) return str.charAt(0).toUpperCase();
	return str.charAt(0).toUpperCase() + str.slice(1);
};

String.prototype.lowercaseFirst = String.prototype.lowercaseFirst || function () {
	const str = this.toString();
	if (str.length === 0) return str;
	if (str.length === 1) return str.charAt(0).toLowerCase();
	return str.charAt(0).toLowerCase() + str.slice(1);
};

String.prototype.toTitleCase = String.prototype.toTitleCase || function () {
	let str;
	str = this.replace(/([^\W_]+[^\s-/]*) */g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});

	if (!StrUtil._TITLE_LOWER_WORDS_RE) {
		StrUtil._TITLE_LOWER_WORDS_RE = StrUtil.TITLE_LOWER_WORDS.map(it => new RegExp(`\\s${it}\\s`, "g"));
	}

	for (let i = 0; i < StrUtil.TITLE_LOWER_WORDS.length; i++) {
		str = str.replace(
			StrUtil._TITLE_LOWER_WORDS_RE[i],
			(txt) => {
				return txt.toLowerCase();
			});
	}

	if (!StrUtil._TITLE_UPPER_WORDS_RE) {
		StrUtil._TITLE_UPPER_WORDS_RE = StrUtil.TITLE_UPPER_WORDS.map(it => new RegExp(`\\b${it}\\b`, "g"));
	}

	for (let i = 0; i < StrUtil.TITLE_UPPER_WORDS.length; i++) {
		str = str.replace(
			StrUtil._TITLE_UPPER_WORDS_RE[i],
			StrUtil.TITLE_UPPER_WORDS[i].toUpperCase()
		);
	}

	return str;
};

String.prototype.toSentenceCase = String.prototype.toSentenceCase || function () {
	const out = [];
	const re = /([^.!?]+)([.!?]\s*|$)/gi;
	let m;
	do {
		m = re.exec(this);
		if (m) {
			out.push(m[0].toLowerCase().uppercaseFirst());
		}
	} while (m);
	return out.join("");
};

String.prototype.toSpellCase = String.prototype.toSpellCase || function () {
	return this.toLowerCase().replace(/(^|of )(bigby|otiluke|mordenkainen|evard|hadar|agatys|abi-dalzim|aganazzar|drawmij|leomund|maximilian|melf|nystul|otto|rary|snilloc|tasha|tenser|jim)('s|$| )/g, (...m) => `${m[1]}${m[2].toTitleCase()}${m[3]}`);
};

String.prototype.toCamelCase = String.prototype.toCamelCase || function () {
	return this.split(" ").map((word, index) => {
		if (index === 0) return word.toLowerCase();
		return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
	}).join("");
};

String.prototype.escapeQuotes = String.prototype.escapeQuotes || function () {
	return this.replace(/'/g, `&apos;`).replace(/"/g, `&quot;`);
};

String.prototype.unescapeQuotes = String.prototype.unescapeQuotes || function () {
	return this.replace(/&apos;/g, `'`).replace(/&quot;/g, `"`);
};

String.prototype.encodeApos = String.prototype.encodeApos || function () {
	return this.replace(/'/g, `%27`);
};

/**
 * Calculates the Damerau-Levenshtein distance between two strings.
 * https://gist.github.com/IceCreamYou/8396172
 */
String.prototype.distance = String.prototype.distance || function (target) {
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

String.prototype.isNumeric = String.prototype.isNumeric || function () {
	return !isNaN(parseFloat(this)) && isFinite(this);
};

String.prototype.last = String.prototype.last || function () {
	return this[this.length - 1];
};

String.prototype.escapeRegexp = String.prototype.escapeRegexp || function () {
	return this.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
};

String.prototype.toUrlified = String.prototype.toUrlified || function () {
	return encodeURIComponent(this).toLowerCase();
};

String.prototype.toChunks = String.prototype.toChunks || function (size) {
	// https://stackoverflow.com/a/29202760/5987433
	const numChunks = Math.ceil(this.length / size)
	const chunks = new Array(numChunks)
	for (let i = 0, o = 0; i < numChunks; ++i, o += size) chunks[i] = this.substr(o, size);
	return chunks
};

Array.prototype.joinConjunct = Array.prototype.joinConjunct || function (joiner, lastJoiner, nonOxford) {
	if (this.length === 0) return "";
	if (this.length === 1) return this[0];
	if (this.length === 2) return this.join(lastJoiner);
	else {
		let outStr = "";
		for (let i = 0; i < this.length; ++i) {
			outStr += this[i];
			if (i < this.length - 2) outStr += joiner;
			else if (i === this.length - 2) outStr += `${(!nonOxford && this.length > 2 ? joiner.trim() : "")}${lastJoiner}`;
		}
		return outStr;
	}
};

StrUtil = {
	COMMAS_NOT_IN_PARENTHESES_REGEX: /,\s?(?![^(]*\))/g,
	COMMA_SPACE_NOT_IN_PARENTHESES_REGEX: /, (?![^(]*\))/g,

	uppercaseFirst: function (string) {
		return string.uppercaseFirst();
	},
	// Certain minor words should be left lowercase unless they are the first or last words in the string
	TITLE_LOWER_WORDS: ["A", "An", "The", "And", "But", "Or", "For", "Nor", "As", "At", "By", "For", "From", "In", "Into", "Near", "Of", "On", "Onto", "To", "With"],
	// Certain words such as initialisms or acronyms should be left uppercase
	TITLE_UPPER_WORDS: ["Id", "Tv", "Dm"],

	padNumber: (n, len, padder) => {
		return String(n).padStart(len, padder);
	},

	elipsisTruncate (str, atLeastPre = 5, atLeastSuff = 0, maxLen = 20) {
		if (maxLen >= str.length) return str;

		maxLen = Math.max(atLeastPre + atLeastSuff + 3, maxLen);
		let out = "";
		let remain = maxLen - (3 + atLeastPre + atLeastSuff);
		for (let i = 0; i < str.length - atLeastSuff; ++i) {
			const c = str[i];
			if (i < atLeastPre) out += c;
			else if ((remain--) > 0) out += c;
		}
		if (remain < 0) out += "...";
		out += str.substring(str.length - atLeastSuff, str.length);
		return out;
	},

	toTitleCase (str) {
		return str.toTitleCase();
	}
};

CleanUtil = {
	getCleanJson (data, minify = false) {
		let str = minify ? JSON.stringify(data) : `${JSON.stringify(data, null, "\t")}\n`;
		return CleanUtil.getCleanString(str);
	},

	/**
	 * @param str
	 * @param isJsonDump If the string is intended to be re-parsed by `JSON.parse`
	 */
	getCleanString (str, isJsonDump = true) {
		str = str
			.replace(CleanUtil.SHARED_REPLACEMENTS_REGEX, (match) => CleanUtil.SHARED_REPLACEMENTS[match])
			.replace(/\u00AD/g, "") // soft hyphens
			.replace(/\s*(\.\s*\.\s*\.)/g, "$1");

		if (isJsonDump) {
			return str
				.replace(CleanUtil.STR_REPLACEMENTS_REGEX, (match) => CleanUtil.STR_REPLACEMENTS[match])
				.replace(/\s*(\\u2014|\\u2013)\s*/g, "$1");
		} else {
			return str
				.replace(CleanUtil.JSON_REPLACEMENTS_REGEX, (match) => CleanUtil.JSON_REPLACEMENTS[match])
				.replace(/[ ]*([\u2014\u2013])[ ]*/g, "$1");
		}
	}
};
CleanUtil.SHARED_REPLACEMENTS = {
	"’": "'",
	"…": "...",
	" ": " ", // non-breaking space
	"ﬀ": "ff",
	"ﬃ": "ffi",
	"ﬄ": "ffl",
	"ﬁ": "fi",
	"ﬂ": "fl",
	"Ĳ": "IJ",
	"ĳ": "ij",
	"Ǉ": "LJ",
	"ǈ": "Lj",
	"ǉ": "lj",
	"Ǌ": "NJ",
	"ǋ": "Nj",
	"ǌ": "nj",
	"ﬅ": "ft"
};
CleanUtil.STR_REPLACEMENTS = {
	"—": "\\u2014",
	"–": "\\u2013",
	"−": "\\u2212",
	"“": `\\"`,
	"”": `\\"`
};
CleanUtil.JSON_REPLACEMENTS = {
	"“": `"`,
	"”": `"`
};
CleanUtil.SHARED_REPLACEMENTS_REGEX = new RegExp(Object.keys(CleanUtil.SHARED_REPLACEMENTS).join("|"), "g");
CleanUtil.STR_REPLACEMENTS_REGEX = new RegExp(Object.keys(CleanUtil.STR_REPLACEMENTS).join("|"), "g");
CleanUtil.JSON_REPLACEMENTS_REGEX = new RegExp(Object.keys(CleanUtil.JSON_REPLACEMENTS).join("|"), "g");

// PARSING =============================================================================================================
Parser = {};
Parser._parse_aToB = function (abMap, a, fallback) {
	if (a === undefined || a === null) throw new TypeError("undefined or null object passed to parser");
	if (typeof a === "string") a = a.trim();
	if (abMap[a] !== undefined) return abMap[a];
	return fallback !== undefined ? fallback : a;
};

Parser._parse_bToA = function (abMap, b) {
	if (b === undefined || b === null) throw new TypeError("undefined or null object passed to parser");
	if (typeof b === "string") b = b.trim();
	for (const v in abMap) {
		if (!abMap.hasOwnProperty(v)) continue;
		if (abMap[v] === b) return v;
	}
	return b;
};

Parser.attrChooseToFull = function (attList) {
	if (attList.length === 1) return `${Parser.attAbvToFull(attList[0])} modifier`;
	else {
		const attsTemp = [];
		for (let i = 0; i < attList.length; ++i) {
			attsTemp.push(Parser.attAbvToFull(attList[i]));
		}
		return `${attsTemp.join(" or ")} modifier (your choice)`;
	}
};

Parser.numberToText = function (number) {
	if (number == null) throw new TypeError(`undefined or null object passed to parser`);
	if (Math.abs(number) >= 100) return `${number}`;

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

Parser.numberToVulgar = function (number) {
	const spl = `${number}`.split(".");
	if (spl.length === 1) return number;
	if (spl[1] === "5") return `${spl[0]}½`;
	if (spl[1] === "25") return `${spl[0]}¼`;
	if (spl[1] === "75") return `${spl[0]}¾`;
	return Parser.numberToFractional(number);
};

Parser._greatestCommonDivisor = function (a, b) {
	if (b < Number.EPSILON) return a;
	return Parser._greatestCommonDivisor(b, Math.floor(a % b));
};
Parser.numberToFractional = function (number) {
	const len = number.toString().length - 2;
	let denominator = Math.pow(10, len);
	let numerator = number * denominator;
	const divisor = Parser._greatestCommonDivisor(numerator, denominator);
	numerator = Math.floor(numerator / divisor);
	denominator = Math.floor(denominator / divisor);

	return denominator === 1 ? String(numerator) : `${Math.floor(numerator)}/${Math.floor(denominator)}`;
};

Parser.ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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
	if (modifier >= 0) modifier = `+${modifier}`;
	return `${modifier}`;
};

Parser.getSpeedString = (it) => {
	if (it.speed == null) return "\u2014";

	function procSpeed (propName) {
		function addSpeed (s) {
			stack.push(`${propName === "walk" ? "" : `${propName} `}${getVal(s)} ft.${getCond(s)}`);
		}

		if (it.speed[propName] || propName === "walk") addSpeed(it.speed[propName] || 0);
		if (it.speed.alternate && it.speed.alternate[propName]) it.speed.alternate[propName].forEach(addSpeed);
	}

	function getVal (speedProp) {
		return speedProp.number != null ? speedProp.number : speedProp;
	}

	function getCond (speedProp) {
		return speedProp.condition ? ` ${Renderer.get().render(speedProp.condition)}` : "";
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
			stack.push(`${it.speed.choose.from.sort().joinConjunct(", ", " or ")} ${it.speed.choose.amount} ft.${it.speed.choose.note ? ` ${it.speed.choose.note}` : ""}`);
		}
		return stack.join(joiner);
	} else {
		return it.speed + (it.speed === "Varies" ? "" : " ft. ");
	}
};

Parser.SPEED_TO_PROGRESSIVE = {
	"walk": "walking",
	"burrow": "burrowing",
	"climb": "climbing",
	"fly": "flying",
	"swim": "swimming"
};

Parser.speedToProgressive = function (prop) {
	return Parser._parse_aToB(Parser.SPEED_TO_PROGRESSIVE, prop);
};

Parser._addCommas = function (intNum) {
	return `${intNum}`.replace(/(\d)(?=(\d{3})+$)/g, "$1,");
};

Parser.crToXp = function (cr) {
	if (cr != null && cr.xp) return Parser._addCommas(cr.xp);

	const toConvert = cr ? (cr.cr || cr) : null;
	if (toConvert === "Unknown" || toConvert == null) return "Unknown";
	if (toConvert === "0") return "0 or 10";
	if (toConvert === "1/8") return "25";
	if (toConvert === "1/4") return "50";
	if (toConvert === "1/2") return "100";
	return Parser._addCommas(Parser.XP_CHART[parseInt(toConvert) - 1]);
};

Parser.crToXpNumber = function (cr) {
	if (cr != null && cr.xp) return cr.xp;
	const toConvert = cr ? (cr.cr || cr) : cr;
	if (toConvert === "Unknown" || toConvert == null) return null;
	return Parser.XP_CHART_ALT[toConvert];
};

LEVEL_TO_XP_EASY = [0, 25, 50, 75, 125, 250, 300, 350, 450, 550, 600, 800, 1000, 1100, 1250, 1400, 1600, 2000, 2100, 2400, 2800];
LEVEL_TO_XP_MEDIUM = [0, 50, 100, 150, 250, 500, 600, 750, 900, 1100, 1200, 1600, 2000, 2200, 2500, 2800, 3200, 3900, 4100, 4900, 5700];
LEVEL_TO_XP_HARD = [0, 75, 150, 225, 375, 750, 900, 1100, 1400, 1600, 1900, 2400, 3000, 3400, 3800, 4300, 4800, 5900, 6300, 7300, 8500];
LEVEL_TO_XP_DEADLY = [0, 100, 200, 400, 500, 1100, 1400, 1700, 2100, 2400, 2800, 3600, 4500, 5100, 5700, 6400, 7200, 8800, 9500, 10900, 12700];
LEVEL_TO_XP_DAILY = [0, 300, 600, 1200, 1700, 3500, 4000, 5000, 6000, 7500, 9000, 10500, 11500, 13500, 15000, 18000, 20000, 25000, 27000, 30000, 40000];

Parser.LEVEL_XP_REQUIRED = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

Parser.CRS = ["0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"];

Parser.levelToXpThreshold = function (level) {
	return [LEVEL_TO_XP_EASY[level], LEVEL_TO_XP_MEDIUM[level], LEVEL_TO_XP_HARD[level], LEVEL_TO_XP_DEADLY[level]];
};

Parser.isValidCr = function (cr) {
	return Parser.CRS.includes(cr);
};

Parser.crToNumber = function (cr) {
	if (cr === "Unknown" || cr === "\u2014" || cr == null) return 100;
	if (cr.cr) return Parser.crToNumber(cr.cr);
	const parts = cr.trim().split("/");
	if (parts.length === 1) return Number(parts[0]);
	else if (parts.length === 2) return Number(parts[0]) / Number(parts[1]);
	else return 0;
};

Parser.numberToCr = function (number, safe) {
	// avoid dying if already-converted number is passed in
	if (safe && typeof number === "string" && Parser.CRS.includes(number)) return number;

	if (number == null) return "Unknown";

	return Parser.numberToFractional(number);
};

Parser.crToPb = function (cr) {
	if (cr === "Unknown" || cr == null) return 0;
	cr = cr.cr || cr;
	if (Parser.crToNumber(cr) < 5) return 2;
	return Math.ceil(cr / 4) + 1;
};

Parser.levelToPb = function (level) {
	if (!level) return 2;
	return Math.ceil(level / 4) + 1;
};

Parser.SKILL_TO_ATB_ABV = {
	"athletics": "str",
	"acrobatics": "dex",
	"sleight of hand": "dex",
	"stealth": "dex",
	"arcana": "int",
	"history": "int",
	"investigation": "int",
	"nature": "int",
	"religion": "int",
	"animal handling": "wis",
	"insight": "wis",
	"medicine": "wis",
	"perception": "wis",
	"survival": "wis",
	"deception": "cha",
	"intimidation": "cha",
	"performance": "cha",
	"persuasion": "cha"
};

Parser.skillToAbilityAbv = function (skill) {
	return Parser._parse_aToB(Parser.SKILL_TO_ATB_ABV, skill);
};

Parser.SKILL_TO_SHORT = {
	"athletics": "ath",
	"acrobatics": "acro",
	"sleight of hand": "soh",
	"stealth": "slth",
	"arcana": "arc",
	"history": "hist",
	"investigation": "invn",
	"nature": "natr",
	"religion": "reli",
	"animal handling": "hndl",
	"insight": "ins",
	"medicine": "med",
	"perception": "perp",
	"survival": "surv",
	"deception": "decp",
	"intimidation": "intm",
	"performance": "perf",
	"persuasion": "pers"
};

Parser.skillToShort = function (skill) {
	return Parser._parse_aToB(Parser.SKILL_TO_SHORT, skill);
};

Parser.LANGUAGES_STANDARD = [
	"Common",
	"Dwarvish",
	"Elvish",
	"Giant",
	"Gnomish",
	"Goblin",
	"Halfling",
	"Orc"
];

Parser.LANGUAGES_EXOTIC = [
	"Abyssal",
	"Celestial",
	"Draconic",
	"Deep",
	"Infernal",
	"Primordial",
	"Sylvan",
	"Undercommon"
];

Parser.LANGUAGES_SECRET = [
	"Druidic",
	"Thieves' cant"
];

Parser.LANGUAGES_ALL = [
	...Parser.LANGUAGES_STANDARD,
	...Parser.LANGUAGES_EXOTIC,
	...Parser.LANGUAGES_SECRET
].sort();

Parser.dragonColorToFull = function (c) {
	return Parser._parse_aToB(Parser.DRAGON_COLOR_TO_FULL, c);
};

Parser.DRAGON_COLOR_TO_FULL = {
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

Parser.acToFull = function (ac, renderer) {
	if (typeof ac === "string") return ac; // handle classic format

	renderer = renderer || Renderer.get();

	let stack = "";
	let inBraces = false;
	for (let i = 0; i < ac.length; ++i) {
		const cur = ac[i];
		const nxt = ac[i + 1];

		if (cur.ac) {
			const isNxtBraces = nxt && nxt.braces;

			if (i === 0 && cur.braces) {
				stack += "(";
				inBraces = true;
			}

			stack += cur.ac;

			if (cur.from) {
				// always brace nested braces
				if (cur.braces) {
					stack += " (";
				} else {
					stack += inBraces ? "; " : " (";
				}

				inBraces = true;

				stack += cur.from.map(it => renderer.render(it)).join(", ");

				if (cur.braces) {
					stack += ")";
				} else if (!isNxtBraces) {
					stack += ")";
					inBraces = false;
				}
			}

			if (cur.condition) stack += ` ${renderer.render(cur.condition)}`;

			if (cur.braces) {
				if (!isNxtBraces) {
					stack += ")";
					inBraces = false;
				}
			}
		} else {
			stack += cur;
		}

		if (nxt) {
			if (nxt.braces) stack += inBraces ? "; " : " (";
			else stack += ", ";
		}
	}
	if (inBraces) stack += ")";

	return stack.trim();
};

MONSTER_COUNT_TO_XP_MULTIPLIER = [1, 1.5, 2, 2, 2, 2, 2.5, 2.5, 2.5, 2.5, 3, 3, 3, 3, 4];
Parser.numMonstersToXpMult = function (num, playerCount = 3) {
	const baseVal = (() => {
		if (num >= MONSTER_COUNT_TO_XP_MULTIPLIER.length) return 4;
		return MONSTER_COUNT_TO_XP_MULTIPLIER[num - 1];
	})();

	if (playerCount < 3) return baseVal >= 3 ? baseVal + 1 : baseVal + 0.5;
	else if (playerCount > 5) {
		return baseVal === 4 ? 3 : baseVal - 0.5;
	} else return baseVal;
};

Parser.armorFullToAbv = function (armor) {
	return Parser._parse_bToA(Parser.ARMOR_ABV_TO_FULL, armor);
};

Parser._getSourceStringFromSource = function (source) {
	if (source && source.source) return source.source;
	return source;
};
Parser._buildSourceCache = function (dict) {
	const out = {};
	Object.entries(dict).forEach(([k, v]) => out[k.toLowerCase()] = v);
	return out;
};
Parser._sourceFullCache = null;
Parser.hasSourceFull = function (source) {
	Parser._sourceFullCache = Parser._sourceFullCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_FULL);
	return !!Parser._sourceFullCache[source.toLowerCase()];
};
Parser._sourceAbvCache = null;
Parser.hasSourceAbv = function (source) {
	Parser._sourceAbvCache = Parser._sourceAbvCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_ABV);
	return !!Parser._sourceAbvCache[source.toLowerCase()];
};
Parser._sourceDateCache = null;
Parser.hasSourceDate = function (source) {
	Parser._sourceDateCache = Parser._sourceDateCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_DATE);
	return !!Parser._sourceDateCache[source.toLowerCase()];
};
Parser.sourceJsonToFull = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceFull(source)) return Parser._sourceFullCache[source.toLowerCase()].replace(/'/g, "\u2019");
	if (BrewUtil.hasSourceJson(source)) return BrewUtil.sourceJsonToFull(source).replace(/'/g, "\u2019");
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_FULL, source).replace(/'/g, "\u2019");
};
Parser.sourceJsonToFullCompactPrefix = function (source) {
	return Parser.sourceJsonToFull(source)
		.replace(UA_PREFIX, UA_PREFIX_SHORT)
		.replace(AL_PREFIX, AL_PREFIX_SHORT)
		.replace(PS_PREFIX, PS_PREFIX_SHORT);
};
Parser.sourceJsonToAbv = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceAbv(source)) return Parser._sourceAbvCache[source.toLowerCase()];
	if (BrewUtil.hasSourceJson(source)) return BrewUtil.sourceJsonToAbv(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_ABV, source);
};
Parser.sourceJsonToDate = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceDate(source)) return Parser._sourceDateCache[source.toLowerCase()];
	if (BrewUtil.hasSourceJson(source)) return BrewUtil.sourceJsonToDate(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_DATE, source, null);
};

Parser.sourceJsonToColor = function (source) {
	return `source${Parser.sourceJsonToAbv(source)}`;
};

Parser.stringToSlug = function (str) {
	return str.trim().toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
};

Parser.stringToCasedSlug = function (str) {
	return str.replace(/[^\w ]+/g, "").replace(/ +/g, "-");
};

Parser.itemTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.ITEM_TYPE_JSON_TO_ABV, type);
};

Parser.itemValueToFull = function (item, isShortForm) {
	return Parser._moneyToFull(item, "value", "valueMult", isShortForm);
};

Parser.spellComponentCostToFull = function (item, isShortForm) {
	return Parser._moneyToFull(item, "cost", "costMult", isShortForm);
};

Parser._moneyToFull = function (it, prop, propMult, isShortForm) {
	if (it[prop]) {
		const {coin, mult} = Parser.getCurrencyAndMultiplier(it[prop], it.currencyConversion);
		return `${(it[prop] * mult).toLocaleString()} ${coin}`;
	} else if (it[propMult]) return isShortForm ? `×${it[propMult]}` : `base value ×${it[propMult]}`;
	return "";
};

Parser._DEFAULT_CURRENCY_CONVERSION_TABLE = [
	{
		coin: "cp",
		mult: 1
	},
	{
		coin: "sp",
		mult: 0.1
	},
	{
		coin: "gp",
		mult: 0.01,
		isFallback: true
	}
];
Parser.getCurrencyAndMultiplier = function (value, currencyConversionId) {
	const fromBrew = currencyConversionId ? MiscUtil.get(BrewUtil.homebrewMeta, "currencyConversions", currencyConversionId) : null;
	const conversionTable = fromBrew && fromBrew.length ? fromBrew : Parser._DEFAULT_CURRENCY_CONVERSION_TABLE;
	if (conversionTable !== Parser._DEFAULT_CURRENCY_CONVERSION_TABLE) conversionTable.sort((a, b) => SortUtil.ascSort(b.mult, a.mult));

	if (!value) return conversionTable.find(it => it.isFallback) || conversionTable[0];
	if (conversionTable.length === 1) return conversionTable[0];
	if (!Number.isInteger(value) && value < conversionTable[0].mult) return conversionTable[0];

	for (let i = conversionTable.length - 1; i >= 0; --i) {
		if (Number.isInteger(value * conversionTable[i].mult)) return conversionTable[i];
	}

	return conversionTable.last();
};

Parser.COIN_ABVS = ["cp", "sp", "ep", "gp", "pp"];
Parser.COIN_ABV_TO_FULL = {
	"cp": "copper pieces",
	"sp": "silver pieces",
	"ep": "electrum pieces",
	"gp": "gold pieces",
	"pp": "platinum pieces"
};
Parser.COIN_CONVERSIONS = [1, 10, 50, 100, 1000];

Parser.coinAbvToFull = function (coin) {
	return Parser._parse_aToB(Parser.COIN_ABV_TO_FULL, coin);
};

Parser.itemWeightToFull = function (item, isShortForm) {
	return item.weight
		? `${item.weight} lb.${(item.weightNote ? ` ${item.weightNote}` : "")}`
		: item.weightMult ? isShortForm ? `×${item.weightMult}` : `base weight ×${item.weightMult}` : "";
};

Parser._decimalSeparator = (0.1).toLocaleString().substring(1, 2);
Parser._numberCleanRegexp = Parser._decimalSeparator === "." ? new RegExp(/[\s,]*/g, "g") : new RegExp(/[\s.]*/g, "g");
Parser._costSplitRegexp = Parser._decimalSeparator === "." ? new RegExp(/(\d+(\.\d+)?)([csegp]p)/) : new RegExp(/(\d+(,\d+)?)([csegp]p)/);

Parser.weightValueToNumber = function (value) {
	if (!value) return 0;

	if (Number(value)) return Number(value);
	else throw new Error(`Badly formatted value ${value}`);
};

Parser.dmgTypeToFull = function (dmgType) {
	return Parser._parse_aToB(Parser.DMGTYPE_JSON_TO_FULL, dmgType);
};

Parser.skillToExplanation = function (skillType) {
	const fromBrew = MiscUtil.get(BrewUtil.homebrewMeta, "skills", skillType);
	if (fromBrew) return fromBrew;
	return Parser._parse_aToB(Parser.SKILL_JSON_TO_FULL, skillType);
};

Parser.senseToExplanation = function (senseType) {
	senseType = senseType.toLowerCase();
	const fromBrew = MiscUtil.get(BrewUtil.homebrewMeta, "senses", senseType);
	if (fromBrew) return fromBrew;
	return Parser._parse_aToB(Parser.SENSE_JSON_TO_FULL, senseType, ["No explanation available."]);
};

Parser.skillProficienciesToFull = function (skillProficiencies) {
	function renderSingle (skProf) {
		const keys = Object.keys(skProf).sort(SortUtil.ascSortLower);

		const ixChoose = keys.indexOf("choose");
		if (~ixChoose) keys.splice(ixChoose, 1);

		const baseStack = [];
		keys.filter(k => skProf[k]).forEach(k => baseStack.push(Renderer.get().render(`{@skill ${k.toTitleCase()}}`)));

		const chooseStack = [];
		if (~ixChoose) {
			const chObj = skProf.choose;
			if (chObj.from.length === 18) {
				chooseStack.push(`choose any ${!chObj.count || chObj.count === 1 ? "skill" : chObj.count}`);
			} else {
				chooseStack.push(`choose ${chObj.count || 1} from ${chObj.from.map(it => Renderer.get().render(`{@skill ${it.toTitleCase()}}`)).joinConjunct(", ", " and ")}`);
			}
		}

		const base = baseStack.joinConjunct(", ", " and ");
		const choose = chooseStack.join(""); // this should currently only ever be 1-length

		if (baseStack.length && chooseStack.length) return `${base}; and ${choose}`;
		else if (baseStack.length) return base;
		else if (chooseStack.length) return choose;
	}

	return skillProficiencies.map(renderSingle).join(" <i>or</i> ");
};

// sp-prefix functions are for parsing spell data, and shared with the roll20 script
Parser.spSchoolAndSubschoolsAbvsToFull = function (school, subschools) {
	if (!subschools || !subschools.length) return Parser.spSchoolAbvToFull(school);
	else return `${Parser.spSchoolAbvToFull(school)} (${subschools.map(sub => Parser.spSchoolAbvToFull(sub)).join(", ")})`;
};

Parser.spSchoolAbvToFull = function (schoolOrSubschool) {
	const out = Parser._parse_aToB(Parser.SP_SCHOOL_ABV_TO_FULL, schoolOrSubschool);
	if (Parser.SP_SCHOOL_ABV_TO_FULL[schoolOrSubschool]) return out;
	if (BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.spellSchools && BrewUtil.homebrewMeta.spellSchools[schoolOrSubschool]) return BrewUtil.homebrewMeta.spellSchools[schoolOrSubschool].full;
	return out;
};

Parser.spSchoolAndSubschoolsAbvsShort = function (school, subschools) {
	if (!subschools || !subschools.length) return Parser.spSchoolAbvToShort(school);
	else return `${Parser.spSchoolAbvToShort(school)} (${subschools.map(sub => Parser.spSchoolAbvToShort(sub)).join(", ")})`;
};

Parser.spSchoolAbvToShort = function (school) {
	const out = Parser._parse_aToB(Parser.SP_SCHOOL_ABV_TO_SHORT, school);
	if (Parser.SP_SCHOOL_ABV_TO_SHORT[school]) return out;
	if (BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.spellSchools && BrewUtil.homebrewMeta.spellSchools[school]) return BrewUtil.homebrewMeta.spellSchools[school].short;
	return out;
};

Parser.spSchoolAbvToStyle = function (school) { // For homebrew
	const rawColor = MiscUtil.get(BrewUtil, "homebrewMeta", "spellSchools", school, "color");
	if (!rawColor || !rawColor.trim()) return "";
	const validColor = BrewUtil.getValidColor(rawColor);
	if (validColor.length) return `style="color: #${validColor}"`;
	return "";
};

Parser.getOrdinalForm = function (i) {
	i = Number(i);
	if (isNaN(i)) return "";
	const j = i % 10; const k = i % 100;
	if (j === 1 && k !== 11) return `${i}st`;
	if (j === 2 && k !== 12) return `${i}nd`;
	if (j === 3 && k !== 13) return `${i}rd`;
	return `${i}th`;
};

Parser.spLevelToFull = function (level) {
	if (level === 0) return "Cantrip";
	else return Parser.getOrdinalForm(level);
};

Parser.getArticle = function (str) {
	str = `${str}`;
	str = str.replace(/\d+/g, (...m) => Parser.numberToText(m[0]));
	return /^[aeiou]/.test(str) ? "an" : "a";
};

Parser.spLevelToFullLevelText = function (level, dash) {
	return `${Parser.spLevelToFull(level)}${(level === 0 ? "s" : `${dash ? "-" : " "}level`)}`;
};

Parser.spMetaToArr = function (meta) {
	if (!meta) return [];
	return Object.entries(meta)
		.filter(([_, v]) => v)
		.sort(SortUtil.ascSort)
		.map(([k]) => k);
};

Parser.spMetaToFull = function (meta) {
	if (!meta) return "";
	const metaTags = Parser.spMetaToArr(meta);
	if (metaTags.length) return ` (${metaTags.join(", ")})`;
	return "";
};

Parser.spLevelSchoolMetaToFull = function (level, school, meta, subschools) {
	const levelPart = level === 0 ? Parser.spLevelToFull(level).toLowerCase() : `${Parser.spLevelToFull(level)}-level`;
	const levelSchoolStr = level === 0 ? `${Parser.spSchoolAbvToFull(school)} ${levelPart}` : `${levelPart} ${Parser.spSchoolAbvToFull(school).toLowerCase()}`;

	const metaArr = Parser.spMetaToArr(meta);
	if (metaArr.length || (subschools && subschools.length)) {
		const metaAndSubschoolPart = [
			(subschools || []).map(sub => Parser.spSchoolAbvToFull(sub)).join(", "),
			metaArr.join(", ")
		].filter(Boolean).join("; ").toLowerCase();
		return `${levelSchoolStr} (${metaAndSubschoolPart})`;
	}
	return levelSchoolStr;
};

Parser.spTimeListToFull = function (times, isStripTags) {
	return times.map(t => `${Parser.getTimeToFull(t)}${t.condition ? `, ${isStripTags ? Renderer.stripTags(t.condition) : Renderer.get().render(t.condition)}` : ""}`).join(" or ");
};

Parser.getTimeToFull = function (time) {
	return `${time.number} ${time.unit === "bonus" ? "bonus action" : time.unit}${time.number > 1 ? "s" : ""}`;
};

RNG_SPECIAL = "special";
RNG_POINT = "point";
RNG_LINE = "line";
RNG_CUBE = "cube";
RNG_CONE = "cone";
RNG_RADIUS = "radius";
RNG_SPHERE = "sphere";
RNG_HEMISPHERE = "hemisphere";
RNG_CYLINDER = "cylinder"; // homebrew only
RNG_SELF = "self";
RNG_SIGHT = "sight";
RNG_UNLIMITED = "unlimited";
RNG_UNLIMITED_SAME_PLANE = "plane";
RNG_TOUCH = "touch";
Parser.SP_RANGE_TYPE_TO_FULL = {
	[RNG_SPECIAL]: "Special",
	[RNG_POINT]: "Point",
	[RNG_LINE]: "Line",
	[RNG_CUBE]: "Cube",
	[RNG_CONE]: "Cone",
	[RNG_RADIUS]: "Radius",
	[RNG_SPHERE]: "Sphere",
	[RNG_HEMISPHERE]: "Hemisphere",
	[RNG_CYLINDER]: "Cylinder",
	[RNG_SELF]: "Self",
	[RNG_SIGHT]: "Sight",
	[RNG_UNLIMITED]: "Unlimited",
	[RNG_UNLIMITED_SAME_PLANE]: "Unlimited on the same plane",
	[RNG_TOUCH]: "Touch"
};

Parser.spRangeTypeToFull = function (range) {
	return Parser._parse_aToB(Parser.SP_RANGE_TYPE_TO_FULL, range);
};

UNT_FEET = "feet";
UNT_MILES = "miles";
Parser.SP_DIST_TYPE_TO_FULL = {
	[UNT_FEET]: "Feet",
	[UNT_MILES]: "Miles",
	[RNG_SELF]: Parser.SP_RANGE_TYPE_TO_FULL[RNG_SELF],
	[RNG_TOUCH]: Parser.SP_RANGE_TYPE_TO_FULL[RNG_TOUCH],
	[RNG_SIGHT]: Parser.SP_RANGE_TYPE_TO_FULL[RNG_SIGHT],
	[RNG_UNLIMITED]: Parser.SP_RANGE_TYPE_TO_FULL[RNG_UNLIMITED],
	[RNG_UNLIMITED_SAME_PLANE]: Parser.SP_RANGE_TYPE_TO_FULL[RNG_UNLIMITED_SAME_PLANE]
};

Parser.spDistanceTypeToFull = function (range) {
	return Parser._parse_aToB(Parser.SP_DIST_TYPE_TO_FULL, range);
};

Parser.SP_RANGE_TO_ICON = {
	[RNG_SPECIAL]: "fa-star",
	[RNG_POINT]: "",
	[RNG_LINE]: "fa-grip-lines-vertical",
	[RNG_CUBE]: "fa-cube",
	[RNG_CONE]: "fa-traffic-cone",
	[RNG_RADIUS]: "fa-hockey-puck",
	[RNG_SPHERE]: "fa-globe",
	[RNG_HEMISPHERE]: "fa-globe",
	[RNG_CYLINDER]: "fa-database",
	[RNG_SELF]: "fa-street-view",
	[RNG_SIGHT]: "fa-eye",
	[RNG_UNLIMITED_SAME_PLANE]: "fa-globe-americas",
	[RNG_UNLIMITED]: "fa-infinity",
	[RNG_TOUCH]: "fa-hand-paper"
};

Parser.spRangeTypeToIcon = function (range) {
	return Parser._parse_aToB(Parser.SP_RANGE_TO_ICON, range);
};

Parser.spRangeToShortHtml = function (range) {
	switch (range.type) {
		case RNG_SPECIAL: return `<span class="fas ${Parser.spRangeTypeToIcon(range.type)} help--subtle" title="Special"/>`;
		case RNG_POINT: return Parser.spRangeToShortHtml._renderPoint(range);
		case RNG_LINE:
		case RNG_CUBE:
		case RNG_CONE:
		case RNG_RADIUS:
		case RNG_SPHERE:
		case RNG_HEMISPHERE:
		case RNG_CYLINDER:
			return Parser.spRangeToShortHtml._renderArea(range);
	}
};
Parser.spRangeToShortHtml._renderPoint = function (range) {
	const dist = range.distance;
	switch (dist.type) {
		case RNG_SELF:
		case RNG_SIGHT:
		case RNG_UNLIMITED:
		case RNG_UNLIMITED_SAME_PLANE:
		case RNG_SPECIAL:
		case RNG_TOUCH: return `<span class="fas ${Parser.spRangeTypeToIcon(dist.type)} help--subtle" title="${Parser.spRangeTypeToFull(dist.type)}"/>`;
		case UNT_FEET:
		case UNT_MILES:
		default:
			return `${dist.amount} <span class="small">${Parser.getSingletonUnit(dist.type, true)}</span>`;
	}
};
Parser.spRangeToShortHtml._renderArea = function (range) {
	const size = range.distance;
	return `<span class="fas ${Parser.spRangeTypeToIcon(RNG_SELF)} help--subtle" title="Self"/> ${size.amount}<span class="small">-${Parser.getSingletonUnit(size.type, true)}</span> ${Parser.spRangeToShortHtml._getAreaStyleString(range)}`;
};
Parser.spRangeToShortHtml._getAreaStyleString = function (range) {
	return `<span class="fas ${Parser.spRangeTypeToIcon(range.type)} help--subtle" title="${Parser.spRangeTypeToFull(range.type)}"/>`
};

Parser.spRangeToFull = function (range) {
	switch (range.type) {
		case RNG_SPECIAL: return Parser.spRangeTypeToFull(range.type);
		case RNG_POINT: return Parser.spRangeToFull._renderPoint(range);
		case RNG_LINE:
		case RNG_CUBE:
		case RNG_CONE:
		case RNG_RADIUS:
		case RNG_SPHERE:
		case RNG_HEMISPHERE:
		case RNG_CYLINDER:
			return Parser.spRangeToFull._renderArea(range);
	}
};
Parser.spRangeToFull._renderPoint = function (range) {
	const dist = range.distance;
	switch (dist.type) {
		case RNG_SELF:
		case RNG_SIGHT:
		case RNG_UNLIMITED:
		case RNG_UNLIMITED_SAME_PLANE:
		case RNG_SPECIAL:
		case RNG_TOUCH: return Parser.spRangeTypeToFull(dist.type);
		case UNT_FEET:
		case UNT_MILES:
		default:
			return `${dist.amount} ${dist.amount === 1 ? Parser.getSingletonUnit(dist.type) : dist.type}`;
	}
};
Parser.spRangeToFull._renderArea = function (range) {
	const size = range.distance;
	return `Self (${size.amount}-${Parser.getSingletonUnit(size.type)}${Parser.spRangeToFull._getAreaStyleString(range)}${range.type === RNG_CYLINDER ? `${size.amountSecondary != null && size.typeSecondary != null ? `, ${size.amountSecondary}-${Parser.getSingletonUnit(size.typeSecondary)}-high` : ""} cylinder` : ""})`;
};
Parser.spRangeToFull._getAreaStyleString = function (range) {
	switch (range.type) {
		case RNG_SPHERE: return " radius";
		case RNG_HEMISPHERE: return `-radius ${range.type}`;
		case RNG_CYLINDER: return "-radius";
		default: return ` ${range.type}`;
	}
};

Parser.getSingletonUnit = function (unit, isShort) {
	switch (unit) {
		case UNT_FEET:
			return isShort ? "ft." : "foot";
		case UNT_MILES:
			return isShort ? "mi." : "mile";
		default: {
			const fromBrew = MiscUtil.get(BrewUtil.homebrewMeta, "spellDistanceUnits", unit, "singular");
			if (fromBrew) return fromBrew;
			if (unit.charAt(unit.length - 1) === "s") return unit.slice(0, -1);
			return unit;
		}
	}
};

Parser.RANGE_TYPES = [
	{type: RNG_POINT, hasDistance: true, isRequireAmount: false},

	{type: RNG_LINE, hasDistance: true, isRequireAmount: true},
	{type: RNG_CUBE, hasDistance: true, isRequireAmount: true},
	{type: RNG_CONE, hasDistance: true, isRequireAmount: true},
	{type: RNG_RADIUS, hasDistance: true, isRequireAmount: true},
	{type: RNG_SPHERE, hasDistance: true, isRequireAmount: true},
	{type: RNG_HEMISPHERE, hasDistance: true, isRequireAmount: true},
	{type: RNG_CYLINDER, hasDistance: true, isRequireAmount: true},

	{type: RNG_SPECIAL, hasDistance: false, isRequireAmount: false}
];

Parser.DIST_TYPES = [
	{type: RNG_SELF, hasAmount: false},
	{type: RNG_TOUCH, hasAmount: false},

	{type: UNT_FEET, hasAmount: true},
	{type: UNT_MILES, hasAmount: true},

	{type: RNG_SIGHT, hasAmount: false},
	{type: RNG_UNLIMITED_SAME_PLANE, hasAmount: false},
	{type: RNG_UNLIMITED, hasAmount: false}
];

Parser.spComponentsToFull = function (comp, level) {
	if (!comp) return "None";
	const out = [];
	if (comp.v) out.push("V");
	if (comp.s) out.push("S");
	if (comp.m != null) out.push(`M${comp.m !== true ? ` (${comp.m.text != null ? comp.m.text : comp.m})` : ""}`);
	if (comp.r) out.push(`R (${level} gp)`);
	return out.join(", ") || "None";
};

Parser.SP_END_TYPE_TO_FULL = {
	"dispel": "dispelled",
	"trigger": "triggered",
	"discharge": "discharged"
};
Parser.spEndTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_END_TYPE_TO_FULL, type);
};

Parser.spDurationToFull = function (dur) {
	let hasSubOr = false;
	const outParts = dur.map(d => {
		switch (d.type) {
			case "special":
				return "Special";
			case "instant":
				return `Instantaneous${d.condition ? ` (${d.condition})` : ""}`;
			case "timed":
				return `${d.concentration ? "Concentration, " : ""}${d.concentration ? "u" : d.duration.upTo ? "U" : ""}${d.concentration || d.duration.upTo ? "p to " : ""}${d.duration.amount} ${d.duration.amount === 1 ? d.duration.type : `${d.duration.type}s`}`;
			case "permanent": {
				if (d.ends) {
					const endsToJoin = d.ends.map(m => Parser.spEndTypeToFull(m));
					hasSubOr = hasSubOr || endsToJoin.length > 1;
					return `Until ${endsToJoin.joinConjunct(", ", " or ")}`;
				} else {
					return "Permanent";
				}
			}
		}
	});
	return `${outParts.joinConjunct(hasSubOr ? "; " : ", ", " or ")}${dur.length > 1 ? " (see below)" : ""}`;
};

Parser.DURATION_TYPES = [
	{type: "instant", full: "Instantaneous"},
	{type: "timed", hasAmount: true},
	{type: "permanent", hasEnds: true},
	{type: "special"}
];

Parser.DURATION_AMOUNT_TYPES = [
	"turn",
	"round",
	"minute",
	"hour",
	"day",
	"week",
	"year"
];

Parser.spClassesToFull = function (classes, textOnly, subclassLookup = {}) {
	const fromSubclasses = Parser.spSubclassesToFull(classes, textOnly, subclassLookup);
	return `${Parser.spMainClassesToFull(classes, textOnly)}${fromSubclasses ? `, ${fromSubclasses}` : ""}`
};

Parser.spMainClassesToFull = function (classes, textOnly = false, prop = "fromClassList") {
	if (!classes) return "";
	return (classes[prop] || [])
		.filter(c => !ExcludeUtil.isInitialised || !ExcludeUtil.isExcluded(c.name, "class", c.source))
		.sort((a, b) => SortUtil.ascSort(a.name, b.name))
		.map(c => textOnly ? c.name : `<a title="Source: ${Parser.sourceJsonToFull(c.source)}" href="${UrlUtil.PG_CLASSES}#${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](c)}">${c.name}</a>`)
		.join(", ");
};

Parser.spSubclassesToFull = function (classes, textOnly, subclassLookup = {}) {
	if (!classes || !classes.fromSubclass) return "";
	return classes.fromSubclass
		.filter(c => {
			if (!ExcludeUtil.isInitialised) return true;
			const excludeClass = ExcludeUtil.isExcluded(c.class.name, "class", c.class.source);
			if (excludeClass) return false;
			const fromLookup = MiscUtil.get(subclassLookup, c.class.source, c.class.name, c.subclass.source, c.subclass.name);
			if (!fromLookup) return true;
			const excludeSubclass = ExcludeUtil.isExcluded(fromLookup.name || c.subclass.name, "subclass", c.subclass.source);
			return !excludeSubclass;
		})
		.sort((a, b) => {
			const byName = SortUtil.ascSort(a.class.name, b.class.name);
			return byName || SortUtil.ascSort(a.subclass.name, b.subclass.name);
		})
		.map(c => Parser._spSubclassItem(c, textOnly, subclassLookup))
		.join(", ");
};

Parser._spSubclassItem = function (fromSubclass, textOnly, subclassLookup) {
	const c = fromSubclass.class;
	const sc = fromSubclass.subclass;
	const text = `${sc.name}${sc.subSubclass ? ` (${sc.subSubclass})` : ""}`;
	if (textOnly) return text;
	const classPart = `<a href="${UrlUtil.PG_CLASSES}#${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](c)}" title="Source: ${Parser.sourceJsonToFull(c.source)}">${c.name}</a>`;
	const fromLookup = subclassLookup ? MiscUtil.get(subclassLookup, c.source, c.name, sc.source, sc.name) : null;
	if (fromLookup) return `<a class="italic" href="${UrlUtil.PG_CLASSES}#${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](c)}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({subclass: {shortName: sc.name, source: sc.source}})}" title="Source: ${Parser.sourceJsonToFull(fromSubclass.subclass.source)}">${text}</a> ${classPart}`;
	else return `<span class="italic" title="Source: ${Parser.sourceJsonToFull(fromSubclass.subclass.source)}">${text}</span> ${classPart}`;
};

Parser.SPELL_ATTACK_TYPE_TO_FULL = {};
Parser.SPELL_ATTACK_TYPE_TO_FULL["M"] = "Melee";
Parser.SPELL_ATTACK_TYPE_TO_FULL["R"] = "Ranged";
Parser.SPELL_ATTACK_TYPE_TO_FULL["O"] = "Other/Unknown";

Parser.spAttackTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SPELL_ATTACK_TYPE_TO_FULL, type);
};

Parser.SPELL_AREA_TYPE_TO_FULL = {
	ST: "Single Target",
	MT: "Multiple Targets",
	C: "Cube",
	N: "Cone",
	Y: "Cylinder",
	S: "Sphere",
	R: "Circle",
	Q: "Square",
	L: "Line",
	H: "Hemisphere",
	W: "Wall"
};
Parser.spAreaTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SPELL_AREA_TYPE_TO_FULL, type);
};

Parser.SP_MISC_TAG_TO_FULL = {
	HL: "Healing",
	SGT: "Requires Sight",
	PRM: "Permanent Effects",
	SCL: "Scaling Effects",
	SMN: "Summons Creature"
};
Parser.spMiscTagToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_MISC_TAG_TO_FULL, type);
};

Parser.SP_CASTER_PROGRESSION_TO_FULL = {
	full: "Full",
	"1/2": "Half",
	"1/3": "One-Third",
	"pact": "Pact Magic"
};
Parser.spCasterProgressionToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_CASTER_PROGRESSION_TO_FULL, type);
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

Parser.monTypeFromPlural = function (type) {
	return Parser._parse_bToA(Parser.MON_TYPE_TO_PLURAL, type);
};

Parser.monCrToFull = function (cr, xp) {
	if (cr == null) return "";
	if (typeof cr === "string") return `${cr} (${xp != null ? Parser._addCommas(xp) : Parser.crToXp(cr)} XP)`;
	else {
		const stack = [Parser.monCrToFull(cr.cr, cr.xp)];
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
			const prop = it.immune ? "immune" : it.resist ? "resist" : it.vulnerable ? "vulnerable" : null;
			if (prop) {
				const toJoin = it[prop].map(nxt => toString(nxt, depth + 1));
				stack += depth ? toJoin.join(maxDepth ? "; " : ", ") : toJoin.joinConjunct(", ", " and ");
			}
			if (it.note) stack += ` ${it.note}`;
			return stack;
		}
	}

	function serialJoin (arr) {
		if (arr.length <= 1) return arr.join("");

		let out = "";
		for (let i = 0; i < arr.length - 1; ++i) {
			const it = arr[i];
			const nxt = arr[i + 1];
			out += it;
			out += (it.includes(",") || nxt.includes(",")) ? "; " : ", ";
		}
		out += arr.last();
		return out;
	}

	return serialJoin(toParse.map(it => toString(it)));
};

Parser.monCondImmToFull = function (condImm, isPlainText) {
	function render (condition) {
		return isPlainText ? condition : Renderer.get().render(`{@condition ${condition}}`);
	}
	return condImm.map(it => {
		if (it.special) return it.special;
		if (it.conditionImmune) return `${it.preNote ? `${it.preNote} ` : ""}${it.conditionImmune.map(render).join(", ")}${it.note ? ` ${it.note}` : ""}`;
		return render(it);
	}).join(", ");
};

Parser.MON_SENSE_TAG_TO_FULL = {
	"B": "blindsight",
	"D": "darkvision",
	"SD": "superior darkvision",
	"T": "tremorsense",
	"U": "truesight"
};
Parser.monSenseTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_SENSE_TAG_TO_FULL, tag);
};

Parser.MON_SPELLCASTING_TAG_TO_FULL = {
	"P": "Psionics",
	"I": "Innate",
	"F": "Form Only",
	"S": "Shared",
	"CB": "Class, Bard",
	"CC": "Class, Cleric",
	"CD": "Class, Druid",
	"CP": "Class, Paladin",
	"CR": "Class, Ranger",
	"CS": "Class, Sorcerer",
	"CL": "Class, Warlock",
	"CW": "Class, Wizard"
};
Parser.monSpellcastingTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_SPELLCASTING_TAG_TO_FULL, tag);
};

Parser.MON_MISC_TAG_TO_FULL = {
	"AOE": "Has Areas of Effect",
	"MW": "Has Melee Weapon Attacks",
	"RW": "Has Ranged Weapon Attacks",
	"RNG": "Has Ranged Weapons",
	"RCH": "Has Reach Attacks",
	"THW": "Has Thrown Weapons"
};
Parser.monMiscTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_MISC_TAG_TO_FULL, tag);
};

Parser.MON_LANGUAGE_TAG_TO_FULL = {
	"AB": "Abyssal",
	"AQ": "Aquan",
	"AU": "Auran",
	"C": "Common",
	"CE": "Celestial",
	"CS": "Can't Speak Known Languages",
	"D": "Dwarvish",
	"DR": "Draconic",
	"DS": "Deep Speech",
	"DU": "Druidic",
	"E": "Elvish",
	"G": "Gnomish",
	"GI": "Giant",
	"GO": "Goblin",
	"GTH": "Gith",
	"H": "Halfling",
	"I": "Infernal",
	"IG": "Ignan",
	"LF": "Languages Known in Life",
	"O": "Orc",
	"OTH": "Other",
	"P": "Primordial",
	"S": "Sylvan",
	"T": "Terran",
	"TC": "Thieves' cant",
	"TP": "Telepathy",
	"U": "Undercommon",
	"X": "Any (Choose)",
	"XX": "All"
};
Parser.monLanguageTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_LANGUAGE_TAG_TO_FULL, tag);
};

Parser.ENVIRONMENTS = ["arctic", "coastal", "desert", "forest", "grassland", "hill", "mountain", "swamp", "underdark", "underwater", "urban"];

// psi-prefix functions are for parsing psionic data, and shared with the roll20 script
Parser.PSI_ABV_TYPE_TALENT = "T";
Parser.PSI_ABV_TYPE_DISCIPLINE = "D";
Parser.PSI_ORDER_NONE = "None";
Parser.psiTypeToFull = type => Parser.psiTypeToMeta(type).full;

Parser.psiTypeToMeta = type => {
	let out = {};
	if (type === Parser.PSI_ABV_TYPE_TALENT) out = {hasOrder: false, full: "Talent"};
	else if (type === Parser.PSI_ABV_TYPE_DISCIPLINE) out = {hasOrder: true, full: "Discipline"};
	else if (BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.psionicTypes && BrewUtil.homebrewMeta.psionicTypes[type]) out = BrewUtil.homebrewMeta.psionicTypes[type];
	out.full = out.full || "Unknown";
	out.short = out.short || out.full;
	return out;
};

Parser.psiOrderToFull = (order) => {
	return order === undefined ? Parser.PSI_ORDER_NONE : order;
};

Parser.prereqSpellToFull = function (spell) {
	if (spell) {
		const [text, suffix] = spell.split("#");
		if (!suffix) return Renderer.get().render(`{@spell ${spell}}`);
		else if (suffix === "c") return Renderer.get().render(`{@spell ${text}} cantrip`);
		else if (suffix === "x") return Renderer.get().render("{@spell hex} spell or a warlock feature that curses");
	} else return STR_NONE;
};

Parser.prereqPactToFull = function (pact) {
	if (pact === "Chain") return "Pact of the Chain";
	if (pact === "Tome") return "Pact of the Tome";
	if (pact === "Blade") return "Pact of the Blade";
	if (pact === "Talisman") return "Pact of the Talisman";
	return pact;
};

Parser.prereqPatronToShort = function (patron) {
	if (patron === "Any") return patron;
	const mThe = /^The (.*?)$/.exec(patron);
	if (mThe) return mThe[1];
	return patron;
};

// NOTE: These need to be reflected in omnidexer.js to be indexed
Parser.OPT_FEATURE_TYPE_TO_FULL = {
	AI: "Artificer Infusion",
	ED: "Elemental Discipline",
	EI: "Eldritch Invocation",
	MM: "Metamagic",
	"MV": "Maneuver",
	"MV:B": "Maneuver, Battle Master",
	"MV:C2-UA": "Maneuver, Cavalier V2 (UA)",
	"AS:V1-UA": "Arcane Shot, V1 (UA)",
	"AS:V2-UA": "Arcane Shot, V2 (UA)",
	"AS": "Arcane Shot",
	OTH: "Other",
	"FS:F": "Fighting Style; Fighter",
	"FS:B": "Fighting Style; Bard",
	"FS:P": "Fighting Style; Paladin",
	"FS:R": "Fighting Style; Ranger",
	"PB": "Pact Boon",
	"SHP:H": "Ship Upgrade, Hull",
	"SHP:M": "Ship Upgrade, Movement",
	"SHP:W": "Ship Upgrade, Weapon",
	"SHP:F": "Ship Upgrade, Figurehead",
	"SHP:O": "Ship Upgrade, Miscellaneous",
	"IWM:W": "Infernal War Machine Variant, Weapon",
	"IWM:A": "Infernal War Machine Upgrade, Armor",
	"IWM:G": "Infernal War Machine Upgrade, Gadget",
	"OR": "Onomancy Resonant",
	"RN": "Rune Knight Rune",
	"AF": "Alchemical Formula"
};

Parser.optFeatureTypeToFull = function (type) {
	if (Parser.OPT_FEATURE_TYPE_TO_FULL[type]) return Parser.OPT_FEATURE_TYPE_TO_FULL[type];
	if (BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.optionalFeatureTypes && BrewUtil.homebrewMeta.optionalFeatureTypes[type]) return BrewUtil.homebrewMeta.optionalFeatureTypes[type];
	return type;
};

Parser.alignmentAbvToFull = function (alignment) {
	if (!alignment) return null; // used in sidekicks
	if (typeof alignment === "object") {
		if (alignment.special != null) {
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
	if (alignList.some(it => typeof it !== "string")) {
		if (alignList.some(it => typeof it === "string")) throw new Error(`Mixed alignment types: ${JSON.stringify(alignList)}`);
		// filter out any nonexistent alignments, as we don't care about "alignment does not exist" if there are other alignments
		alignList = alignList.filter(it => it.alignment === undefined || it.alignment != null);
		return alignList.map(it => it.special != null || it.chance != null ? Parser.alignmentAbvToFull(it) : Parser.alignmentListToFull(it.alignment)).join(" or ");
	} else {
		// assume all single-length arrays can be simply parsed
		if (alignList.length === 1) return Parser.alignmentAbvToFull(alignList[0]);
		// a pair of abv's, e.g. "L" "G"
		if (alignList.length === 2) {
			return alignList.map(a => Parser.alignmentAbvToFull(a)).join(" ");
		}
		if (alignList.length === 3) {
			if (alignList.includes("NX") && alignList.includes("NY") && alignList.includes("N")) return "Any Neutral Alignment";
		}
		// longer arrays should have a custom mapping
		if (alignList.length === 5) {
			if (!alignList.includes("G")) return "Any Non-Good Alignment";
			if (!alignList.includes("E")) return "Any Non-Evil Alignment";
			if (!alignList.includes("L")) return "Any Non-Lawful Alignment";
			if (!alignList.includes("C")) return "Any Non-Chaotic Alignment";
		}
		if (alignList.length === 4) {
			if (!alignList.includes("L") && !alignList.includes("NX")) return "Any Chaotic Alignment";
			if (!alignList.includes("G") && !alignList.includes("NY")) return "Any Evil Alignment";
			if (!alignList.includes("C") && !alignList.includes("NX")) return "Any Lawful Alignment";
			if (!alignList.includes("E") && !alignList.includes("NY")) return "Any Good Alignment";
		}
		throw new Error(`Unmapped alignment: ${JSON.stringify(alignList)}`);
	}
};

Parser.weightToFull = function (lbs, isSmallUnit) {
	const tons = Math.floor(lbs / 2000);
	lbs = lbs - (2000 * tons);
	return [
		tons ? `${tons}${isSmallUnit ? `<span class="small ml-1">` : " "}ton${tons === 1 ? "" : "s"}${isSmallUnit ? `</span>` : ""}` : null,
		lbs ? `${lbs}${isSmallUnit ? `<span class="small ml-1">` : " "}lb.${isSmallUnit ? `</span>` : ""}` : null
	].filter(Boolean).join(", ");
};

Parser.ITEM_RARITIES = ["None", "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact", "Unknown", "Unknown (Magic)", "Other"];

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
Parser.CAT_ID_METAMAGIC = 22;
Parser.CAT_ID_MANEUVER_BATTLEMASTER = 23;
Parser.CAT_ID_TABLE = 24;
Parser.CAT_ID_TABLE_GROUP = 25;
Parser.CAT_ID_MANEUVER_CAVALIER = 26;
Parser.CAT_ID_ARCANE_SHOT = 27;
Parser.CAT_ID_OPTIONAL_FEATURE_OTHER = 28;
Parser.CAT_ID_FIGHTING_STYLE = 29;
Parser.CAT_ID_CLASS_FEATURE = 30;
Parser.CAT_ID_VEHICLE = 31;
Parser.CAT_ID_PACT_BOON = 32;
Parser.CAT_ID_ELEMENTAL_DISCIPLINE = 33;
Parser.CAT_ID_ARTIFICER_INFUSION = 34;
Parser.CAT_ID_SHIP_UPGRADE = 35;
Parser.CAT_ID_INFERNAL_WAR_MACHINE_UPGRADE = 36;
Parser.CAT_ID_ONOMANCY_RESONANT = 37;
Parser.CAT_ID_RUNE_KNIGHT_RUNE = 37;
Parser.CAT_ID_ALCHEMICAL_FORMULA = 38;
Parser.CAT_ID_MANEUVER = 39;
Parser.CAT_ID_SUBCLASS = 40;
Parser.CAT_ID_SUBCLASS_FEATURE = 41;
Parser.CAT_ID_ACTION = 42;
Parser.CAT_ID_LANGUAGE = 43;

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
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_METAMAGIC] = "Metamagic";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_MANEUVER_BATTLEMASTER] = "Maneuver; Battlemaster";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TABLE] = "Table";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TABLE_GROUP] = "Table";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_MANEUVER_CAVALIER] = "Maneuver; Cavalier";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ARCANE_SHOT] = "Arcane Shot";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_OPTIONAL_FEATURE_OTHER] = "Optional Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_FIGHTING_STYLE] = "Fighting Style";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CLASS_FEATURE] = "Class Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VEHICLE] = "Vehicle";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PACT_BOON] = "Pact Boon";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ELEMENTAL_DISCIPLINE] = "Elemental Discipline";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ARTIFICER_INFUSION] = "Infusion";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SHIP_UPGRADE] = "Ship Upgrade";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_INFERNAL_WAR_MACHINE_UPGRADE] = "Infernal War Machine Upgrade";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ONOMANCY_RESONANT] = "Onomancy Resonant";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_RUNE_KNIGHT_RUNE] = "Rune Knight Rune";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ALCHEMICAL_FORMULA] = "Alchemical Formula";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_MANEUVER] = "Maneuver";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SUBCLASS] = "Subclass";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SUBCLASS_FEATURE] = "Subclass Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ACTION] = "Action";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_LANGUAGE] = "Language";

Parser.pageCategoryToFull = function (catId) {
	return Parser._parse_aToB(Parser.CAT_ID_TO_FULL, catId);
};

Parser.CAT_ID_TO_PROP = {};
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CREATURE] = "monster";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SPELL] = "spell";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BACKGROUND] = "background";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ITEM] = "item";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CLASS] = "class";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CONDITION] = "condition";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_FEAT] = "feat";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PSIONIC] = "psionic";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_RACE] = "race";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_OTHER_REWARD] = "reward";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VARIANT_OPTIONAL_RULE] = "variantrule";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ADVENTURE] = "adventure";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_DEITY] = "deity";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_OBJECT] = "object";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TRAP] = "trap";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_HAZARD] = "hazard";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CULT] = "cult";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BOON] = "boon";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_DISEASE] = "condition";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TABLE] = "table";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TABLE_GROUP] = "tableGroup";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VEHICLE] = "vehicle";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ELDRITCH_INVOCATION] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_MANEUVER_CAVALIER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ARCANE_SHOT] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_OPTIONAL_FEATURE_OTHER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_FIGHTING_STYLE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_METAMAGIC] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_MANEUVER_BATTLEMASTER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PACT_BOON] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ELEMENTAL_DISCIPLINE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ARTIFICER_INFUSION] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SHIP_UPGRADE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_INFERNAL_WAR_MACHINE_UPGRADE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ONOMANCY_RESONANT] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_RUNE_KNIGHT_RUNE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ALCHEMICAL_FORMULA] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_MANEUVER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_QUICKREF] = null;
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CLASS_FEATURE] = "class";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SUBCLASS] = "subclass";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SUBCLASS_FEATURE] = "subclass";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ACTION] = "action";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_LANGUAGE] = "language";

Parser.pageCategoryToProp = function (catId) {
	return Parser._parse_aToB(Parser.CAT_ID_TO_PROP, catId);
};

Parser.ABIL_ABVS = ["str", "dex", "con", "int", "wis", "cha"];

Parser.spClassesToCurrentAndLegacy = function (classes) {
	const current = [];
	const legacy = [];
	classes.fromClassList.forEach(cls => {
		if ((cls.name === "Artificer" && cls.source === "UAArtificer") || (cls.name === "Artificer (Revisited)" && cls.source === "UAArtificerRevisited")) legacy.push(cls);
		else current.push(cls);
	});
	return [current, legacy];
};

/**
 * Build a pair of strings; one with all current subclasses, one with all legacy subclasses
 *
 * @param classes a spell.classes JSON item
 * @param subclassLookup Data loaded from `generated/gendata-subclass-lookup.json`. Of the form: `{PHB: {Barbarian: {PHB: {Berserker: "Path of the Berserker"}}}}`
 * @returns {*[]} A two-element array. First item is a string of all the current subclasses, second item a string of
 * all the legacy/superceded subclasses
 */
Parser.spSubclassesToCurrentAndLegacyFull = function (classes, subclassLookup) {
	const out = [[], []];
	if (!classes.fromSubclass) return out;
	const curNames = new Set();
	const toCheck = [];
	classes.fromSubclass
		.filter(c => {
			const excludeClass = ExcludeUtil.isExcluded(c.class.name, "class", c.class.source);
			if (excludeClass) {
				return false;
			}
			const fromLookup = MiscUtil.get(subclassLookup, c.class.source, c.class.name, c.subclass.source, c.subclass.name);
			const excludeSubclass = ExcludeUtil.isExcluded((fromLookup || {}).name || c.subclass.name, "subclass", c.subclass.source);
			if (excludeSubclass) {
				return false;
			}
			return true;
		})
		.sort((a, b) => {
			const byName = SortUtil.ascSort(a.subclass.name, b.subclass.name);
			return byName || SortUtil.ascSort(a.class.name, b.class.name);
		})
		.forEach(c => {
			const nm = c.subclass.name;
			const src = c.subclass.source;
			const toAdd = Parser._spSubclassItem(c, false, subclassLookup);

			const fromLookup = MiscUtil.get(
				subclassLookup,
				c.class.source,
				c.class.name,
				c.subclass.source,
				c.subclass.name
			);

			if (fromLookup && fromLookup.isReprinted) {
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

Parser.trapHazTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.TRAP_HAZARD_TYPE_TO_FULL, type);
};

Parser.TRAP_HAZARD_TYPE_TO_FULL = {
	MECH: "Mechanical trap",
	MAG: "Magical trap",
	SMPL: "Simple trap",
	CMPX: "Complex trap",
	HAZ: "Hazard",
	WTH: "Weather",
	ENV: "Environmental Hazard",
	WLD: "Wilderness Hazard",
	GEN: "Generic"
};

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

Parser.bookOrdinalToAbv = (ordinal, preNoSuff) => {
	if (ordinal === undefined) return "";
	switch (ordinal.type) {
		case "part": return `${preNoSuff ? " " : ""}Part ${ordinal.identifier}${preNoSuff ? "" : " \u2014 "}`;
		case "chapter": return `${preNoSuff ? " " : ""}Ch. ${ordinal.identifier}${preNoSuff ? "" : ": "}`;
		case "episode": return `${preNoSuff ? " " : ""}Ep. ${ordinal.identifier}${preNoSuff ? "" : ": "}`;
		case "appendix": return `${preNoSuff ? " " : ""}App. ${ordinal.identifier}${preNoSuff ? "" : ": "}`;
		case "level": return `${preNoSuff ? " " : ""}Level ${ordinal.identifier}${preNoSuff ? "" : ": "}`;
		default: throw new Error(`Unhandled ordinal type "${ordinal.type}"`);
	}
};

Parser.nameToTokenName = function (name) {
	return name
		.normalize("NFD") // replace diactrics with their individual graphemes
		.replace(/[\u0300-\u036f]/g, "") // remove accent graphemes
		.replace(/Æ/g, "AE").replace(/æ/g, "ae")
		.replace(/"/g, "");
};

SKL_ABV_ABJ = "A";
SKL_ABV_EVO = "V";
SKL_ABV_ENC = "E";
SKL_ABV_ILL = "I";
SKL_ABV_DIV = "D";
SKL_ABV_NEC = "N";
SKL_ABV_TRA = "T";
SKL_ABV_CON = "C";
SKL_ABV_PSI = "P";
Parser.SKL_ABVS = [
	SKL_ABV_ABJ,
	SKL_ABV_EVO,
	SKL_ABV_ENC,
	SKL_ABV_ILL,
	SKL_ABV_DIV,
	SKL_ABV_NEC,
	SKL_ABV_TRA,
	SKL_ABV_CON,
	SKL_ABV_PSI
];

Parser.SP_TM_ACTION = "action";
Parser.SP_TM_B_ACTION = "bonus";
Parser.SP_TM_REACTION = "reaction";
Parser.SP_TM_ROUND = "round";
Parser.SP_TM_MINS = "minute";
Parser.SP_TM_HRS = "hour";
Parser.SP_TIME_SINGLETONS = [Parser.SP_TM_ACTION, Parser.SP_TM_B_ACTION, Parser.SP_TM_REACTION, Parser.SP_TM_ROUND];
Parser.SP_TIME_TO_FULL = {
	[Parser.SP_TM_ACTION]: "Action",
	[Parser.SP_TM_B_ACTION]: "Bonus Action",
	[Parser.SP_TM_REACTION]: "Reaction",
	[Parser.SP_TM_ROUND]: "Rounds",
	[Parser.SP_TM_MINS]: "Minutes",
	[Parser.SP_TM_HRS]: "Hours"
};
Parser.spTimeUnitToFull = function (timeUnit) {
	return Parser._parse_aToB(Parser.SP_TIME_TO_FULL, timeUnit);
};

Parser.SP_TIME_TO_ABV = {
	[Parser.SP_TM_ACTION]: "A",
	[Parser.SP_TM_B_ACTION]: "BA",
	[Parser.SP_TM_REACTION]: "R",
	[Parser.SP_TM_ROUND]: "rnd",
	[Parser.SP_TM_MINS]: "min",
	[Parser.SP_TM_HRS]: "hr"
};
Parser.spTimeUnitToAbv = function (timeUnit) {
	return Parser._parse_aToB(Parser.SP_TIME_TO_ABV, timeUnit);
};

Parser.spTimeToShort = function (time, isHtml) {
	if (!time) return "";
	return (time.number === 1 && Parser.SP_TIME_SINGLETONS.includes(time.unit))
		? `${Parser.spTimeUnitToAbv(time.unit).uppercaseFirst()}${time.condition ? "*" : ""}`
		: `${time.number} ${isHtml ? `<span class="small">` : ""}${Parser.spTimeUnitToAbv(time.unit)}${isHtml ? `</span>` : ""}${time.condition ? "*" : ""}`;
};

SKL_ABJ = "Abjuration";
SKL_EVO = "Evocation";
SKL_ENC = "Enchantment";
SKL_ILL = "Illusion";
SKL_DIV = "Divination";
SKL_NEC = "Necromancy";
SKL_TRA = "Transmutation";
SKL_CON = "Conjuration";
SKL_PSI = "Psionic";

Parser.SP_SCHOOL_ABV_TO_FULL = {};
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_ABJ] = SKL_ABJ;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_EVO] = SKL_EVO;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_ENC] = SKL_ENC;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_ILL] = SKL_ILL;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_DIV] = SKL_DIV;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_NEC] = SKL_NEC;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_TRA] = SKL_TRA;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_CON] = SKL_CON;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_PSI] = SKL_PSI;

Parser.SP_SCHOOL_ABV_TO_SHORT = {};
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_ABJ] = "Abj.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_EVO] = "Evoc.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_ENC] = "Ench.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_ILL] = "Illu.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_DIV] = "Divin.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_NEC] = "Necro.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_TRA] = "Trans.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_CON] = "Conj.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_PSI] = "Psi.";

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
Parser.MON_TYPES = [TP_ABERRATION, TP_BEAST, TP_CELESTIAL, TP_CONSTRUCT, TP_DRAGON, TP_ELEMENTAL, TP_FEY, TP_FIEND, TP_GIANT, TP_HUMANOID, TP_MONSTROSITY, TP_OOZE, TP_PLANT, TP_UNDEAD];
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
Parser.SIZE_ABVS = [SZ_TINY, SZ_SMALL, SZ_MEDIUM, SZ_LARGE, SZ_HUGE, SZ_GARGANTUAN, SZ_VARIES];
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

Parser.XP_CHART = [200, 450, 700, 1100, 1800, 2300, 2900, 3900, 5000, 5900, 7200, 8400, 10000, 11500, 13000, 15000, 18000, 20000, 22000, 25000, 30000, 41000, 50000, 62000, 75000, 90000, 105000, 120000, 135000, 155000];

Parser.XP_CHART_ALT = {
	"0": 10,
	"1/8": 25,
	"1/4": 50,
	"1/2": 100,
	"1": 200,
	"2": 450,
	"3": 700,
	"4": 1100,
	"5": 1800,
	"6": 2300,
	"7": 2900,
	"8": 3900,
	"9": 5000,
	"10": 5900,
	"11": 7200,
	"12": 8400,
	"13": 10000,
	"14": 11500,
	"15": 13000,
	"16": 15000,
	"17": 18000,
	"18": 20000,
	"19": 22000,
	"20": 25000,
	"21": 30000,
	"22": 41000,
	"23": 50000,
	"24": 62000,
	"25": 75000,
	"26": 90000,
	"27": 105000,
	"28": 120000,
	"29": 135000,
	"30": 155000
};

Parser.ARMOR_ABV_TO_FULL = {
	"l.": "light",
	"m.": "medium",
	"h.": "heavy"
};

Parser.CONDITION_TO_COLOR = {
	"Blinded": "#525252",
	"Charmed": "#f01789",
	"Deafened": "#ababab",
	"Exhausted": "#947a47",
	"Frightened": "#c9ca18",
	"Grappled": "#8784a0",
	"Incapacitated": "#3165a0",
	"Invisible": "#7ad2d6",
	"Paralyzed": "#c00900",
	"Petrified": "#a0a0a0",
	"Poisoned": "#4dc200",
	"Prone": "#5e60a0",
	"Restrained": "#d98000",
	"Stunned": "#a23bcb",
	"Unconscious": "#1c2383"
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
SRC_WDH = "WDH";
SRC_WDMM = "WDMM";
SRC_GGR = "GGR";
SRC_KKW = "KKW";
SRC_LLK = "LLK";
SRC_GoS = "GoS";
SRC_AI = "AI";
SRC_OoW = "OoW";
SRC_ESK = "ESK";
SRC_DIP = "DIP";
SRC_HftT = "HftT";
SRC_DC = "DC";
SRC_SLW = "SLW";
SRC_SDW = "SDW";
SRC_BGDIA = "BGDIA";
SRC_LR = "LR";
SRC_AL = "AL";
SRC_SAC = "SAC";
SRC_ERLW = "ERLW";
SRC_EFR = "EFR";
SRC_RMBRE = "RMBRE";
SRC_RMR = "RMR";
SRC_MFF = "MFF";
SRC_AWM = "AWM";
SRC_IMR = "IMR";
SRC_SADS = "SADS";
SRC_SCREEN = "Screen";

SRC_AL_PREFIX = "AL";

SRC_ALCoS = `${SRC_AL_PREFIX}CurseOfStrahd`;
SRC_ALEE = `${SRC_AL_PREFIX}ElementalEvil`;
SRC_ALRoD = `${SRC_AL_PREFIX}RageOfDemons`;

SRC_PS_PREFIX = "PS";

SRC_PSA = `${SRC_PS_PREFIX}A`;
SRC_PSI = `${SRC_PS_PREFIX}I`;
SRC_PSK = `${SRC_PS_PREFIX}K`;
SRC_PSZ = `${SRC_PS_PREFIX}Z`;
SRC_PSX = `${SRC_PS_PREFIX}X`;
SRC_PSD = `${SRC_PS_PREFIX}D`;

SRC_UA_PREFIX = "UA";

SRC_UAA = `${SRC_UA_PREFIX}Artificer`;
SRC_UAEAG = `${SRC_UA_PREFIX}EladrinAndGith`;
SRC_UAEBB = `${SRC_UA_PREFIX}Eberron`;
SRC_UAFFR = `${SRC_UA_PREFIX}FeatsForRaces`;
SRC_UAFFS = `${SRC_UA_PREFIX}FeatsForSkills`;
SRC_UAFO = `${SRC_UA_PREFIX}FiendishOptions`;
SRC_UAFT = `${SRC_UA_PREFIX}Feats`;
SRC_UAGH = `${SRC_UA_PREFIX}GothicHeroes`;
SRC_UAMDM = `${SRC_UA_PREFIX}ModernMagic`;
SRC_UASSP = `${SRC_UA_PREFIX}StarterSpells`;
SRC_UATMC = `${SRC_UA_PREFIX}TheMysticClass`;
SRC_UATOBM = `${SRC_UA_PREFIX}ThatOldBlackMagic`;
SRC_UATRR = `${SRC_UA_PREFIX}TheRangerRevised`;
SRC_UAWA = `${SRC_UA_PREFIX}WaterborneAdventures`;
SRC_UAVR = `${SRC_UA_PREFIX}VariantRules`;
SRC_UALDR = `${SRC_UA_PREFIX}LightDarkUnderdark`;
SRC_UARAR = `${SRC_UA_PREFIX}RangerAndRogue`;
SRC_UAATOSC = `${SRC_UA_PREFIX}ATrioOfSubclasses`;
SRC_UABPP = `${SRC_UA_PREFIX}BarbarianPrimalPaths`;
SRC_UARSC = `${SRC_UA_PREFIX}RevisedSubclasses`;
SRC_UAKOO = `${SRC_UA_PREFIX}KitsOfOld`;
SRC_UABBC = `${SRC_UA_PREFIX}BardBardColleges`;
SRC_UACDD = `${SRC_UA_PREFIX}ClericDivineDomains`;
SRC_UAD = `${SRC_UA_PREFIX}Druid`;
SRC_UARCO = `${SRC_UA_PREFIX}RevisedClassOptions`;
SRC_UAF = `${SRC_UA_PREFIX}Fighter`;
SRC_UAM = `${SRC_UA_PREFIX}Monk`;
SRC_UAP = `${SRC_UA_PREFIX}Paladin`;
SRC_UAMC = `${SRC_UA_PREFIX}ModifyingClasses`;
SRC_UAS = `${SRC_UA_PREFIX}Sorcerer`;
SRC_UAWAW = `${SRC_UA_PREFIX}WarlockAndWizard`;
SRC_UATF = `${SRC_UA_PREFIX}TheFaithful`;
SRC_UAWR = `${SRC_UA_PREFIX}WizardRevisited`;
SRC_UAESR = `${SRC_UA_PREFIX}ElfSubraces`;
SRC_UAMAC = `${SRC_UA_PREFIX}MassCombat`;
SRC_UA3PE = `${SRC_UA_PREFIX}ThreePillarExperience`;
SRC_UAGHI = `${SRC_UA_PREFIX}GreyhawkInitiative`;
SRC_UATSC = `${SRC_UA_PREFIX}ThreeSubclasses`;
SRC_UAOD = `${SRC_UA_PREFIX}OrderDomain`;
SRC_UACAM = `${SRC_UA_PREFIX}CentaursMinotaurs`;
SRC_UAGSS = `${SRC_UA_PREFIX}GiantSoulSorcerer`;
SRC_UARoE = `${SRC_UA_PREFIX}RacesOfEberron`;
SRC_UARoR = `${SRC_UA_PREFIX}RacesOfRavnica`;
SRC_UAWGE = `${SRC_UA_PREFIX}WGE`;
SRC_UAOSS = `${SRC_UA_PREFIX}OfShipsAndSea`;
SRC_UASIK = `${SRC_UA_PREFIX}Sidekicks`;
SRC_UAAR = `${SRC_UA_PREFIX}ArtificerRevisited`;
SRC_UABAM = `${SRC_UA_PREFIX}BarbarianAndMonk`;
SRC_UASAW = `${SRC_UA_PREFIX}SorcererAndWarlock`;
SRC_UABAP = `${SRC_UA_PREFIX}BardAndPaladin`;
SRC_UACDW = `${SRC_UA_PREFIX}ClericDruidWizard`;
SRC_UAFRR = `${SRC_UA_PREFIX}FighterRangerRogue`;
SRC_UACFV = `${SRC_UA_PREFIX}ClassFeatureVariants`;
SRC_UAFRW = `${SRC_UA_PREFIX}FighterRogueWizard`;
SRC_UA2020SC1 = `${SRC_UA_PREFIX}2020SubclassesPt1`;
SRC_UA2020SC2 = `${SRC_UA_PREFIX}2020SubclassesPt2`;
SRC_UA2020SC3 = `${SRC_UA_PREFIX}2020SubclassesPt3`;

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
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_AtG] = `${TftYP_NAME}: Against the Giants`;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_DiT] = `${TftYP_NAME}: Dead in Thay`;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_TFoF] = `${TftYP_NAME}: The Forge of Fury`;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_THSoT] = `${TftYP_NAME}: The Hidden Shrine of Tamoachan`;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_TSC] = `${TftYP_NAME}: The Sunless Citadel`;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_ToH] = `${TftYP_NAME}: Tomb of Horrors`;
Parser.SOURCE_JSON_TO_FULL[SRC_TYP_WPM] = `${TftYP_NAME}: White Plume Mountain`;
Parser.SOURCE_JSON_TO_FULL[SRC_VGM] = "Volo's Guide to Monsters";
Parser.SOURCE_JSON_TO_FULL[SRC_XGE] = "Xanathar's Guide to Everything";
Parser.SOURCE_JSON_TO_FULL[SRC_OGA] = "One Grung Above";
Parser.SOURCE_JSON_TO_FULL[SRC_MTF] = "Mordenkainen's Tome of Foes";
Parser.SOURCE_JSON_TO_FULL[SRC_WDH] = "Waterdeep: Dragon Heist";
Parser.SOURCE_JSON_TO_FULL[SRC_WDMM] = "Waterdeep: Dungeon of the Mad Mage";
Parser.SOURCE_JSON_TO_FULL[SRC_GGR] = "Guildmasters' Guide to Ravnica";
Parser.SOURCE_JSON_TO_FULL[SRC_KKW] = "Krenko's Way";
Parser.SOURCE_JSON_TO_FULL[SRC_LLK] = "Lost Laboratory of Kwalish";
Parser.SOURCE_JSON_TO_FULL[SRC_GoS] = "Ghosts of Saltmarsh";
Parser.SOURCE_JSON_TO_FULL[SRC_AI] = "Acquisitions Incorporated";
Parser.SOURCE_JSON_TO_FULL[SRC_OoW] = "The Orrery of the Wanderer";
Parser.SOURCE_JSON_TO_FULL[SRC_ESK] = "Essentials Kit";
Parser.SOURCE_JSON_TO_FULL[SRC_DIP] = "Dragon of Icespire Peak";
Parser.SOURCE_JSON_TO_FULL[SRC_HftT] = "Hunt for the Thessalhydra";
Parser.SOURCE_JSON_TO_FULL[SRC_DC] = "Divine Contention";
Parser.SOURCE_JSON_TO_FULL[SRC_SLW] = "Storm Lord's Wrath";
Parser.SOURCE_JSON_TO_FULL[SRC_SDW] = "Sleeping Dragon's Wake";
Parser.SOURCE_JSON_TO_FULL[SRC_BGDIA] = "Baldur's Gate: Descent Into Avernus";
Parser.SOURCE_JSON_TO_FULL[SRC_LR] = "Locathah Rising";
Parser.SOURCE_JSON_TO_FULL[SRC_AL] = "Adventurers' League";
Parser.SOURCE_JSON_TO_FULL[SRC_SAC] = "Sage Advice Compendium";
Parser.SOURCE_JSON_TO_FULL[SRC_ERLW] = "Eberron: Rising from the Last War";
Parser.SOURCE_JSON_TO_FULL[SRC_EFR] = "Eberron: Forgotten Relics";
Parser.SOURCE_JSON_TO_FULL[SRC_RMBRE] = "The Lost Dungeon of Rickedness: Big Rick Energy";
Parser.SOURCE_JSON_TO_FULL[SRC_RMR] = "Dungeons & Dragons vs. Rick and Morty: Basic Rules";
Parser.SOURCE_JSON_TO_FULL[SRC_MFF] = "Mordenkainen's Fiendish Folio";
Parser.SOURCE_JSON_TO_FULL[SRC_AWM] = "Adventure with Muk";
Parser.SOURCE_JSON_TO_FULL[SRC_IMR] = "Infernal Machine Rebuild";
Parser.SOURCE_JSON_TO_FULL[SRC_SADS] = "Sapphire Anniversary Dice Set";
Parser.SOURCE_JSON_TO_FULL[SRC_SCREEN] = "Dungeon Master's Screen";
Parser.SOURCE_JSON_TO_FULL[SRC_ALCoS] = `${AL_PREFIX}Curse of Strahd`;
Parser.SOURCE_JSON_TO_FULL[SRC_ALEE] = `${AL_PREFIX}Elemental Evil`;
Parser.SOURCE_JSON_TO_FULL[SRC_ALRoD] = `${AL_PREFIX}Rage of Demons`;
Parser.SOURCE_JSON_TO_FULL[SRC_PSA] = `${PS_PREFIX}Amonkhet`;
Parser.SOURCE_JSON_TO_FULL[SRC_PSI] = `${PS_PREFIX}Innistrad`;
Parser.SOURCE_JSON_TO_FULL[SRC_PSK] = `${PS_PREFIX}Kaladesh`;
Parser.SOURCE_JSON_TO_FULL[SRC_PSZ] = `${PS_PREFIX}Zendikar`;
Parser.SOURCE_JSON_TO_FULL[SRC_PSX] = `${PS_PREFIX}Ixalan`;
Parser.SOURCE_JSON_TO_FULL[SRC_PSD] = `${PS_PREFIX}Dominaria`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAA] = `${UA_PREFIX}Artificer`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAEAG] = `${UA_PREFIX}Eladrin and Gith`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAEBB] = `${UA_PREFIX}Eberron`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAFFR] = `${UA_PREFIX}Feats for Races`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAFFS] = `${UA_PREFIX}Feats for Skills`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAFO] = `${UA_PREFIX}Fiendish Options`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAFT] = `${UA_PREFIX}Feats`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAGH] = `${UA_PREFIX}Gothic Heroes`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAMDM] = `${UA_PREFIX}Modern Magic`;
Parser.SOURCE_JSON_TO_FULL[SRC_UASSP] = `${UA_PREFIX}Starter Spells`;
Parser.SOURCE_JSON_TO_FULL[SRC_UATMC] = `${UA_PREFIX}The Mystic Class`;
Parser.SOURCE_JSON_TO_FULL[SRC_UATOBM] = `${UA_PREFIX}That Old Black Magic`;
Parser.SOURCE_JSON_TO_FULL[SRC_UATRR] = `${UA_PREFIX}The Ranger, Revised`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAWA] = `${UA_PREFIX}Waterborne Adventures`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAVR] = `${UA_PREFIX}Variant Rules`;
Parser.SOURCE_JSON_TO_FULL[SRC_UALDR] = `${UA_PREFIX}Light, Dark, Underdark!`;
Parser.SOURCE_JSON_TO_FULL[SRC_UARAR] = `${UA_PREFIX}Ranger and Rogue`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAATOSC] = `${UA_PREFIX}A Trio of Subclasses`;
Parser.SOURCE_JSON_TO_FULL[SRC_UABPP] = `${UA_PREFIX}Barbarian Primal Paths`;
Parser.SOURCE_JSON_TO_FULL[SRC_UARSC] = `${UA_PREFIX}Revised Subclasses`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAKOO] = `${UA_PREFIX}Kits of Old`;
Parser.SOURCE_JSON_TO_FULL[SRC_UABBC] = `${UA_PREFIX}Bard: Bard Colleges`;
Parser.SOURCE_JSON_TO_FULL[SRC_UACDD] = `${UA_PREFIX}Cleric: Divine Domains`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAD] = `${UA_PREFIX}Druid`;
Parser.SOURCE_JSON_TO_FULL[SRC_UARCO] = `${UA_PREFIX}Revised Class Options`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAF] = `${UA_PREFIX}Fighter`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAM] = `${UA_PREFIX}Monk`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAP] = `${UA_PREFIX}Paladin`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAMC] = `${UA_PREFIX}Modifying Classes`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAS] = `${UA_PREFIX}Sorcerer`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAWAW] = `${UA_PREFIX}Warlock and Wizard`;
Parser.SOURCE_JSON_TO_FULL[SRC_UATF] = `${UA_PREFIX}The Faithful`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAWR] = `${UA_PREFIX}Wizard Revisited`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAESR] = `${UA_PREFIX}Elf Subraces`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAMAC] = `${UA_PREFIX}Mass Combat`;
Parser.SOURCE_JSON_TO_FULL[SRC_UA3PE] = `${UA_PREFIX}Three-Pillar Experience`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAGHI] = `${UA_PREFIX}Greyhawk Initiative`;
Parser.SOURCE_JSON_TO_FULL[SRC_UATSC] = `${UA_PREFIX}Three Subclasses`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAOD] = `${UA_PREFIX}Order Domain`;
Parser.SOURCE_JSON_TO_FULL[SRC_UACAM] = `${UA_PREFIX}Centaurs and Minotaurs`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAGSS] = `${UA_PREFIX}Giant Soul Sorcerer`;
Parser.SOURCE_JSON_TO_FULL[SRC_UARoE] = `${UA_PREFIX}Races of Eberron`;
Parser.SOURCE_JSON_TO_FULL[SRC_UARoR] = `${UA_PREFIX}Races of Ravnica`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAWGE] = "Wayfinder's Guide to Eberron";
Parser.SOURCE_JSON_TO_FULL[SRC_UAOSS] = `${UA_PREFIX}Of Ships and the Sea`;
Parser.SOURCE_JSON_TO_FULL[SRC_UASIK] = `${UA_PREFIX}Sidekicks`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAAR] = `${UA_PREFIX}Artificer Revisited`;
Parser.SOURCE_JSON_TO_FULL[SRC_UABAM] = `${UA_PREFIX}Barbarian and Monk`;
Parser.SOURCE_JSON_TO_FULL[SRC_UASAW] = `${UA_PREFIX}Sorcerer and Warlock`;
Parser.SOURCE_JSON_TO_FULL[SRC_UABAP] = `${UA_PREFIX}Bard and Paladin`;
Parser.SOURCE_JSON_TO_FULL[SRC_UACDW] = `${UA_PREFIX}Cleric, Druid, and Wizard`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAFRR] = `${UA_PREFIX}Fighter, Ranger, and Rogue`;
Parser.SOURCE_JSON_TO_FULL[SRC_UACFV] = `${UA_PREFIX}Class Feature Variants`;
Parser.SOURCE_JSON_TO_FULL[SRC_UAFRW] = `${UA_PREFIX}Fighter, Rogue, and Wizard`;
Parser.SOURCE_JSON_TO_FULL[SRC_UA2020SC1] = `${UA_PREFIX}2020 Subclasses, Part 1`;
Parser.SOURCE_JSON_TO_FULL[SRC_UA2020SC2] = `${UA_PREFIX}2020 Subclasses, Part 2`;
Parser.SOURCE_JSON_TO_FULL[SRC_UA2020SC3] = `${UA_PREFIX}2020 Subclasses, Part 3`;
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
Parser.SOURCE_JSON_TO_ABV[SRC_WDH] = "WDH";
Parser.SOURCE_JSON_TO_ABV[SRC_WDMM] = "WDMM";
Parser.SOURCE_JSON_TO_ABV[SRC_GGR] = "GGR";
Parser.SOURCE_JSON_TO_ABV[SRC_KKW] = "KKW";
Parser.SOURCE_JSON_TO_ABV[SRC_LLK] = "LLK";
Parser.SOURCE_JSON_TO_ABV[SRC_GoS] = "GoS";
Parser.SOURCE_JSON_TO_ABV[SRC_AI] = "AI";
Parser.SOURCE_JSON_TO_ABV[SRC_OoW] = "OoW";
Parser.SOURCE_JSON_TO_ABV[SRC_ESK] = "ESK";
Parser.SOURCE_JSON_TO_ABV[SRC_DIP] = "DIP";
Parser.SOURCE_JSON_TO_ABV[SRC_HftT] = "HftT";
Parser.SOURCE_JSON_TO_ABV[SRC_DC] = "DC";
Parser.SOURCE_JSON_TO_ABV[SRC_SLW] = "SLW";
Parser.SOURCE_JSON_TO_ABV[SRC_SDW] = "SDW";
Parser.SOURCE_JSON_TO_ABV[SRC_BGDIA] = "BGDIA";
Parser.SOURCE_JSON_TO_ABV[SRC_LR] = "LR";
Parser.SOURCE_JSON_TO_ABV[SRC_AL] = "AL";
Parser.SOURCE_JSON_TO_ABV[SRC_SAC] = "SAC";
Parser.SOURCE_JSON_TO_ABV[SRC_ERLW] = "ERLW";
Parser.SOURCE_JSON_TO_ABV[SRC_EFR] = "EFR";
Parser.SOURCE_JSON_TO_ABV[SRC_RMBRE] = "RMBRE";
Parser.SOURCE_JSON_TO_ABV[SRC_RMR] = "RMR";
Parser.SOURCE_JSON_TO_ABV[SRC_MFF] = "MFF";
Parser.SOURCE_JSON_TO_ABV[SRC_AWM] = "AWM";
Parser.SOURCE_JSON_TO_ABV[SRC_IMR] = "IMR";
Parser.SOURCE_JSON_TO_ABV[SRC_SADS] = "SADS";
Parser.SOURCE_JSON_TO_ABV[SRC_SCREEN] = "Screen";
Parser.SOURCE_JSON_TO_ABV[SRC_ALCoS] = "ALCoS";
Parser.SOURCE_JSON_TO_ABV[SRC_ALEE] = "ALEE";
Parser.SOURCE_JSON_TO_ABV[SRC_ALRoD] = "ALRoD";
Parser.SOURCE_JSON_TO_ABV[SRC_PSA] = "PSA";
Parser.SOURCE_JSON_TO_ABV[SRC_PSI] = "PSI";
Parser.SOURCE_JSON_TO_ABV[SRC_PSK] = "PSK";
Parser.SOURCE_JSON_TO_ABV[SRC_PSZ] = "PSZ";
Parser.SOURCE_JSON_TO_ABV[SRC_PSX] = "PSX";
Parser.SOURCE_JSON_TO_ABV[SRC_PSD] = "PSD";
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
Parser.SOURCE_JSON_TO_ABV[SRC_UATMC] = "UAMy";
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
Parser.SOURCE_JSON_TO_ABV[SRC_UAM] = "UAMk";
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
Parser.SOURCE_JSON_TO_ABV[SRC_UARoE] = "UARoE";
Parser.SOURCE_JSON_TO_ABV[SRC_UARoR] = "UARoR";
Parser.SOURCE_JSON_TO_ABV[SRC_UAWGE] = "WGE";
Parser.SOURCE_JSON_TO_ABV[SRC_UAOSS] = "UAOSS";
Parser.SOURCE_JSON_TO_ABV[SRC_UASIK] = "UASIK";
Parser.SOURCE_JSON_TO_ABV[SRC_UAAR] = "UAAR";
Parser.SOURCE_JSON_TO_ABV[SRC_UABAM] = "UABAM";
Parser.SOURCE_JSON_TO_ABV[SRC_UASAW] = "UASAW";
Parser.SOURCE_JSON_TO_ABV[SRC_UABAP] = "UABAP";
Parser.SOURCE_JSON_TO_ABV[SRC_UACDW] = "UACDW";
Parser.SOURCE_JSON_TO_ABV[SRC_UAFRR] = "UAFRR";
Parser.SOURCE_JSON_TO_ABV[SRC_UACFV] = "UACFV";
Parser.SOURCE_JSON_TO_ABV[SRC_UAFRW] = "UAFRW";
Parser.SOURCE_JSON_TO_ABV[SRC_UA2020SC1] = "UA20S1";
Parser.SOURCE_JSON_TO_ABV[SRC_UA2020SC2] = "UA20S2";
Parser.SOURCE_JSON_TO_ABV[SRC_UA2020SC3] = "UA20S3";
Parser.SOURCE_JSON_TO_ABV[SRC_STREAM] = "Stream";
Parser.SOURCE_JSON_TO_ABV[SRC_TWITTER] = "Twitter";

Parser.SOURCE_JSON_TO_DATE = {};
Parser.SOURCE_JSON_TO_DATE[SRC_CoS] = "2016-03-15";
Parser.SOURCE_JSON_TO_DATE[SRC_DMG] = "2014-12-09";
Parser.SOURCE_JSON_TO_DATE[SRC_EEPC] = "2015-03-10";
Parser.SOURCE_JSON_TO_DATE[SRC_EET] = "2015-03-10";
Parser.SOURCE_JSON_TO_DATE[SRC_HotDQ] = "2014-08-19";
Parser.SOURCE_JSON_TO_DATE[SRC_LMoP] = "2014-07-15";
Parser.SOURCE_JSON_TO_DATE[SRC_MM] = "2014-09-30";
Parser.SOURCE_JSON_TO_DATE[SRC_OotA] = "2015-09-15";
Parser.SOURCE_JSON_TO_DATE[SRC_PHB] = "2014-08-19";
Parser.SOURCE_JSON_TO_DATE[SRC_PotA] = "2015-04-07";
Parser.SOURCE_JSON_TO_DATE[SRC_RoT] = "2014-11-04";
Parser.SOURCE_JSON_TO_DATE[SRC_RoTOS] = "2014-11-04";
Parser.SOURCE_JSON_TO_DATE[SRC_SCAG] = "2015-11-03";
Parser.SOURCE_JSON_TO_DATE[SRC_SKT] = "2016-09-06";
Parser.SOURCE_JSON_TO_DATE[SRC_ToA] = "2017-09-19";
Parser.SOURCE_JSON_TO_DATE[SRC_ToD] = "2019-10-22";
Parser.SOURCE_JSON_TO_DATE[SRC_TTP] = "2017-09-19";
Parser.SOURCE_JSON_TO_DATE[SRC_TYP] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[SRC_TYP_AtG] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[SRC_TYP_DiT] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[SRC_TYP_TFoF] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[SRC_TYP_THSoT] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[SRC_TYP_TSC] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[SRC_TYP_ToH] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[SRC_TYP_WPM] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[SRC_VGM] = "2016-11-15";
Parser.SOURCE_JSON_TO_DATE[SRC_XGE] = "2017-11-21";
Parser.SOURCE_JSON_TO_DATE[SRC_OGA] = "2017-10-11";
Parser.SOURCE_JSON_TO_DATE[SRC_MTF] = "2018-05-29";
Parser.SOURCE_JSON_TO_DATE[SRC_WDH] = "2018-09-18";
Parser.SOURCE_JSON_TO_DATE[SRC_WDMM] = "2018-11-20";
Parser.SOURCE_JSON_TO_DATE[SRC_GGR] = "2018-11-20";
Parser.SOURCE_JSON_TO_DATE[SRC_KKW] = "2018-11-20";
Parser.SOURCE_JSON_TO_DATE[SRC_LLK] = "2018-11-10";
Parser.SOURCE_JSON_TO_DATE[SRC_GoS] = "2019-05-21";
Parser.SOURCE_JSON_TO_DATE[SRC_AI] = "2019-06-18";
Parser.SOURCE_JSON_TO_DATE[SRC_OoW] = "2019-06-18";
Parser.SOURCE_JSON_TO_DATE[SRC_ESK] = "2019-06-24";
Parser.SOURCE_JSON_TO_DATE[SRC_DIP] = "2019-06-24";
Parser.SOURCE_JSON_TO_DATE[SRC_HftT] = "2019-05-01";
Parser.SOURCE_JSON_TO_DATE[SRC_DC] = "2019-06-24";
Parser.SOURCE_JSON_TO_DATE[SRC_SLW] = "2019-06-24";
Parser.SOURCE_JSON_TO_DATE[SRC_SDW] = "2019-06-24";
Parser.SOURCE_JSON_TO_DATE[SRC_BGDIA] = "2019-09-17";
Parser.SOURCE_JSON_TO_DATE[SRC_LR] = "2019-09-19";
Parser.SOURCE_JSON_TO_DATE[SRC_SAC] = "2019-01-31";
Parser.SOURCE_JSON_TO_DATE[SRC_ERLW] = "2019-11-19";
Parser.SOURCE_JSON_TO_DATE[SRC_EFR] = "2019-11-19";
Parser.SOURCE_JSON_TO_DATE[SRC_RMBRE] = "2019-11-19";
Parser.SOURCE_JSON_TO_DATE[SRC_RMR] = "2019-11-19";
Parser.SOURCE_JSON_TO_DATE[SRC_MFF] = "2019-11-12";
Parser.SOURCE_JSON_TO_DATE[SRC_AWM] = "2019-11-12";
Parser.SOURCE_JSON_TO_DATE[SRC_IMR] = "2019-11-12";
Parser.SOURCE_JSON_TO_DATE[SRC_SADS] = "2019-12-12";
Parser.SOURCE_JSON_TO_DATE[SRC_SCREEN] = "2015-01-20";
Parser.SOURCE_JSON_TO_DATE[SRC_ALCoS] = "2016-03-15";
Parser.SOURCE_JSON_TO_DATE[SRC_ALEE] = "2015-04-07";
Parser.SOURCE_JSON_TO_DATE[SRC_ALRoD] = "2015-09-15";
Parser.SOURCE_JSON_TO_DATE[SRC_PSA] = "2017-07-06";
Parser.SOURCE_JSON_TO_DATE[SRC_PSI] = "2016-07-12";
Parser.SOURCE_JSON_TO_DATE[SRC_PSK] = "2017-02-16";
Parser.SOURCE_JSON_TO_DATE[SRC_PSZ] = "2016-04-27";
Parser.SOURCE_JSON_TO_DATE[SRC_PSX] = "2018-01-09";
Parser.SOURCE_JSON_TO_DATE[SRC_PSD] = "2018-07-31";
Parser.SOURCE_JSON_TO_DATE[SRC_UAEBB] = "2015-02-02";
Parser.SOURCE_JSON_TO_DATE[SRC_UAA] = "2017-01-09";
Parser.SOURCE_JSON_TO_DATE[SRC_UAEAG] = "2017-09-11";
Parser.SOURCE_JSON_TO_DATE[SRC_UAFFR] = "2017-04-24";
Parser.SOURCE_JSON_TO_DATE[SRC_UAFFS] = "2017-04-17";
Parser.SOURCE_JSON_TO_DATE[SRC_UAFO] = "2017-10-09";
Parser.SOURCE_JSON_TO_DATE[SRC_UAFT] = "2016-06-06";
Parser.SOURCE_JSON_TO_DATE[SRC_UAGH] = "2016-04-04";
Parser.SOURCE_JSON_TO_DATE[SRC_UAMDM] = "2015-08-03";
Parser.SOURCE_JSON_TO_DATE[SRC_UASSP] = "2017-04-03";
Parser.SOURCE_JSON_TO_DATE[SRC_UATMC] = "2017-03-13";
Parser.SOURCE_JSON_TO_DATE[SRC_UATOBM] = "2015-12-07";
Parser.SOURCE_JSON_TO_DATE[SRC_UATRR] = "2016-09-12";
Parser.SOURCE_JSON_TO_DATE[SRC_UAWA] = "2015-05-04";
Parser.SOURCE_JSON_TO_DATE[SRC_UAVR] = "2015-06-08";
Parser.SOURCE_JSON_TO_DATE[SRC_UALDR] = "2015-11-02";
Parser.SOURCE_JSON_TO_DATE[SRC_UARAR] = "2017-01-16";
Parser.SOURCE_JSON_TO_DATE[SRC_UAATOSC] = "2017-03-27";
Parser.SOURCE_JSON_TO_DATE[SRC_UABPP] = "2016-11-07";
Parser.SOURCE_JSON_TO_DATE[SRC_UARSC] = "2017-05-01";
Parser.SOURCE_JSON_TO_DATE[SRC_UAKOO] = "2016-01-04";
Parser.SOURCE_JSON_TO_DATE[SRC_UABBC] = "2016-11-14";
Parser.SOURCE_JSON_TO_DATE[SRC_UACDD] = "2016-11-12";
Parser.SOURCE_JSON_TO_DATE[SRC_UAD] = "2016-11-28";
Parser.SOURCE_JSON_TO_DATE[SRC_UARCO] = "2017-06-05";
Parser.SOURCE_JSON_TO_DATE[SRC_UAF] = "2016-12-5";
Parser.SOURCE_JSON_TO_DATE[SRC_UAM] = "2016-12-12";
Parser.SOURCE_JSON_TO_DATE[SRC_UAP] = "2016-12-19";
Parser.SOURCE_JSON_TO_DATE[SRC_UAMC] = "2015-04-06";
Parser.SOURCE_JSON_TO_DATE[SRC_UAS] = "2017-02-06";
Parser.SOURCE_JSON_TO_DATE[SRC_UAWAW] = "2017-02-13";
Parser.SOURCE_JSON_TO_DATE[SRC_UATF] = "2016-08-01";
Parser.SOURCE_JSON_TO_DATE[SRC_UAWR] = "2017-03-20";
Parser.SOURCE_JSON_TO_DATE[SRC_UAESR] = "2017-11-13";
Parser.SOURCE_JSON_TO_DATE[SRC_UAMAC] = "2017-02-21";
Parser.SOURCE_JSON_TO_DATE[SRC_UA3PE] = "2017-08-07";
Parser.SOURCE_JSON_TO_DATE[SRC_UAGHI] = "2017-07-10";
Parser.SOURCE_JSON_TO_DATE[SRC_UATSC] = "2018-01-08";
Parser.SOURCE_JSON_TO_DATE[SRC_UAOD] = "2018-04-09";
Parser.SOURCE_JSON_TO_DATE[SRC_UACAM] = "2018-05-14";
Parser.SOURCE_JSON_TO_DATE[SRC_UAGSS] = "2018-06-11";
Parser.SOURCE_JSON_TO_DATE[SRC_UARoE] = "5018-07-23";
Parser.SOURCE_JSON_TO_DATE[SRC_UARoR] = "2018-08-13";
Parser.SOURCE_JSON_TO_DATE[SRC_UAWGE] = "2018-07-23";
Parser.SOURCE_JSON_TO_DATE[SRC_UAOSS] = "2018-11-12";
Parser.SOURCE_JSON_TO_DATE[SRC_UASIK] = "2018-12-17";
Parser.SOURCE_JSON_TO_DATE[SRC_UAAR] = "2019-02-28";
Parser.SOURCE_JSON_TO_DATE[SRC_UABAM] = "2019-08-15";
Parser.SOURCE_JSON_TO_DATE[SRC_UASAW] = "2019-09-05";
Parser.SOURCE_JSON_TO_DATE[SRC_UABAP] = "2019-09-18";
Parser.SOURCE_JSON_TO_DATE[SRC_UACDW] = "2019-10-03";
Parser.SOURCE_JSON_TO_DATE[SRC_UAFRR] = "2019-10-17";
Parser.SOURCE_JSON_TO_DATE[SRC_UACFV] = "2019-11-04";
Parser.SOURCE_JSON_TO_DATE[SRC_UAFRW] = "2019-11-25";
Parser.SOURCE_JSON_TO_DATE[SRC_UA2020SC1] = "2020-01-14";
Parser.SOURCE_JSON_TO_DATE[SRC_UA2020SC2] = "2020-02-04";
Parser.SOURCE_JSON_TO_DATE[SRC_UA2020SC3] = "2020-02-24";

Parser.SOURCES_ADVENTURES = new Set([
	SRC_LMoP,
	SRC_HotDQ,
	SRC_RoT,
	SRC_PotA,
	SRC_OotA,
	SRC_CoS,
	SRC_SKT,
	SRC_TYP,
	SRC_TYP_AtG,
	SRC_TYP_DiT,
	SRC_TYP_TFoF,
	SRC_TYP_THSoT,
	SRC_TYP_TSC,
	SRC_TYP_ToH,
	SRC_TYP_WPM,
	SRC_ToA,
	SRC_TTP,
	SRC_WDH,
	SRC_LLK,
	SRC_WDMM,
	SRC_KKW,
	SRC_GoS,
	SRC_HftT,
	SRC_OoW,
	SRC_DIP,
	SRC_SLW,
	SRC_SDW,
	SRC_DC,
	SRC_BGDIA,
	SRC_LR,
	SRC_EFR,
	SRC_RMBRE,
	SRC_IMR,

	SRC_AWM
]);
Parser.SOURCES_CORE_SUPPLEMENTS = new Set(Object.keys(Parser.SOURCE_JSON_TO_FULL).filter(it => !Parser.SOURCES_ADVENTURES.has(it)));
Parser.SOURCES_NON_STANDARD_WOTC = new Set([
	SRC_OGA,
	SRC_Mag,
	SRC_STREAM,
	SRC_TWITTER,
	SRC_LLK,
	SRC_LR,
	SRC_TTP,
	SRC_AWM,
	SRC_IMR,
	SRC_SADS
]);

Parser.ITEM_TYPE_JSON_TO_ABV = {
	"A": "Ammunition",
	"AF": "Ammunition",
	"AT": "Artisan's Tools",
	"EM": "Eldritch Machine",
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
	"OTH": "Other",
	"T": "Tools",
	"TAH": "Tack and Harness",
	"TG": "Trade Good",
	"$": "Treasure",
	"VEH": "Vehicle (land)",
	"SHP": "Vehicle (water)",
	"AIR": "Vehicle (air)",
	"WD": "Wand"
};

Parser.DMGTYPE_JSON_TO_FULL = {
	"A": "acid",
	"B": "bludgeoning",
	"C": "cold",
	"F": "fire",
	"O": "force",
	"L": "lightning",
	"N": "necrotic",
	"P": "piercing",
	"I": "poison",
	"Y": "psychic",
	"R": "radiant",
	"S": "slashing",
	"T": "thunder"
};

Parser.DMG_TYPES = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
Parser.CONDITIONS = ["blinded", "charmed", "deafened", "exhaustion", "frightened", "grappled", "incapacitated", "invisible", "paralyzed", "petrified", "poisoned", "prone", "restrained", "stunned", "unconscious"];

Parser.SKILL_JSON_TO_FULL = {
	"Acrobatics": [
		"Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation, such as when you're trying to run across a sheet of ice, balance on a tightrope, or stay upright on a rocking ship's deck. The DM might also call for a Dexterity (Acrobatics) check to see if you can perform acrobatic stunts, including dives, rolls, somersaults, and flips."
	],
	"Animal Handling": [
		"When there is any question whether you can calm down a domesticated animal, keep a mount from getting spooked, or intuit an animal's intentions, the DM might call for a Wisdom (Animal Handling) check. You also make a Wisdom (Animal Handling) check to control your mount when you attempt a risky maneuver."
	],
	"Arcana": [
		"Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes."
	],
	"Athletics": [
		"Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming. Examples include the following activities:",
		{
			"type": "list",
			"items": [
				"You attempt to climb a sheer or slippery cliff, avoid hazards while scaling a wall, or cling to a surface while something is trying to knock you off.",
				"You try to jump an unusually long distance or pull off a stunt mid jump.",
				"You struggle to swim or stay afloat in treacherous currents, storm-tossed waves, or areas of thick seaweed. Or another creature tries to push or pull you underwater or otherwise interfere with your swimming."
			]
		}
	],
	"Deception": [
		"Your Charisma (Deception) check determines whether you can convincingly hide the truth, either verbally or through your actions. This deception can encompass everything from misleading others through ambiguity to telling outright lies. Typical situations include trying to fast-talk a guard, con a merchant, earn money through gambling, pass yourself off in a disguise, dull someone's suspicions with false assurances, or maintain a straight face while telling a blatant lie."
	],
	"History": [
		"Your Intelligence (History) check measures your ability to recall lore about historical events, legendary people, ancient kingdoms, past disputes, recent wars, and lost civilizations."
	],
	"Insight": [
		"Your Wisdom (Insight) check decides whether you can determine the true intentions of a creature, such as when searching out a lie or predicting someone's next move. Doing so involves gleaning clues from body language, speech habits, and changes in mannerisms."
	],
	"Intimidation": [
		"When you attempt to influence someone through overt threats, hostile actions, and physical violence, the DM might ask you to make a Charisma (Intimidation) check. Examples include trying to pry information out of a prisoner, convincing street thugs to back down from a confrontation, or using the edge of a broken bottle to convince a sneering vizier to reconsider a decision."
	],
	"Investigation": [
		"When you look around for clues and make deductions based on those clues, you make an Intelligence (Investigation) check. You might deduce the location of a hidden object, discern from the appearance of a wound what kind of weapon dealt it, or determine the weakest point in a tunnel that could cause it to collapse. Poring through ancient scrolls in search of a hidden fragment of knowledge might also call for an Intelligence (Investigation) check."
	],
	"Medicine": [
		"A Wisdom (Medicine) check lets you try to stabilize a dying companion or diagnose an illness."
	],
	"Nature": [
		"Your Intelligence (Nature) check measures your ability to recall lore about terrain, plants and animals, the weather, and natural cycles."
	],
	"Perception": [
		"Your Wisdom (Perception) check lets you spot, hear, or otherwise detect the presence of something. It measures your general awareness of your surroundings and the keenness of your senses.", "For example, you might try to hear a conversation through a closed door, eavesdrop under an open window, or hear monsters moving stealthily in the forest. Or you might try to spot things that are obscured or easy to miss, whether they are orcs lying in ambush on a road, thugs hiding in the shadows of an alley, or candlelight under a closed secret door."
	],
	"Performance": [
		"Your Charisma (Performance) check determines how well you can delight an audience with music, dance, acting, storytelling, or some other form of entertainment."
	],
	"Persuasion": [
		"When you attempt to influence someone or a group of people with tact, social graces, or good nature, the DM might ask you to make a Charisma (Persuasion) check. Typically, you use persuasion when acting in good faith, to foster friendships, make cordial requests, or exhibit proper etiquette. Examples of persuading others include convincing a chamberlain to let your party see the king, negotiating peace between warring tribes, or inspiring a crowd of townsfolk."
	],
	"Religion": [
		"Your Intelligence (Religion) check measures your ability to recall lore about deities, rites and prayers, religious hierarchies, holy symbols, and the practices of secret cults."
	],
	"Sleight of Hand": [
		"Whenever you attempt an act of legerdemain or manual trickery, such as planting something on someone else or concealing an object on your person, make a Dexterity (Sleight of Hand) check. The DM might also call for a Dexterity (Sleight of Hand) check to determine whether you can lift a coin purse off another person or slip something out of another person's pocket."
	],
	"Stealth": [
		"Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies, slink past guards, slip away without being noticed, or sneak up on someone without being seen or heard."
	],
	"Survival": [
		"The DM might ask you to make a Wisdom (Survival) check to follow tracks, hunt wild game, guide your group through frozen wastelands, identify signs that owlbears live nearby, predict the weather, or avoid quicksand and other natural hazards."
	]
};

Parser.SENSE_JSON_TO_FULL = {
	"blindsight": [
		"A creature with blindsight can perceive its surroundings without relying on sight, within a specific radius. Creatures without eyes, such as oozes, and creatures with echolocation or heightened senses, such as bats and true dragons, have this sense."
	],
	"darkvision": [
		"Many creatures in fantasy gaming worlds, especially those that dwell underground, have darkvision. Within a specified range, a creature with darkvision can see in dim light as if it were bright light and in darkness as if it were dim light, so areas of darkness are only lightly obscured as far as that creature is concerned. However, the creature can't discern color in that darkness, only shades of gray."
	],
	"tremorsense": [
		"A creature with tremorsense can detect and pinpoint the origin of vibrations within a specific radius, provided that the creature and the source of the vibrations are in contact with the same ground or substance. Tremorsense can't be used to detect flying or incorporeal creatures. Many burrowing creatures, such as ankhegs and umber hulks, have this special sense."
	],
	"truesight": [
		"A creature with truesight can, out to a specific range, see in normal and magical darkness, see invisible creatures and objects, automatically detect visual illusions and succeed on saving throws against them, and perceives the original form of a shapechanger or a creature that is transformed by magic. Furthermore, the creature can see into the Ethereal Plane."
	]
};

Parser.NUMBERS_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
Parser.NUMBERS_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
Parser.NUMBERS_TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];

// SOURCES =============================================================================================================
SourceUtil = {
	_subclassReprintLookup: {},
	async pInitSubclassReprintLookup () {
		SourceUtil._subclassReprintLookup = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/generated/gendata-subclass-lookup.json`);
	},

	isSubclassReprinted (className, classSource, subclassShortName, subclassSource) {
		const fromLookup = MiscUtil.get(SourceUtil._subclassReprintLookup, classSource, className, subclassSource, subclassShortName);
		return fromLookup ? fromLookup.isReprinted : false;
	},

	isAdventure (source) {
		if (source instanceof FilterItem) source = source.item;
		return Parser.SOURCES_ADVENTURES.has(source);
	},

	isCoreOrSupplement (source) {
		if (source instanceof FilterItem) source = source.item;
		return Parser.SOURCES_CORE_SUPPLEMENTS.has(source);
	},

	isNonstandardSource (source) {
		return source != null && !BrewUtil.hasSourceJson(source) && SourceUtil._isNonstandardSourceWiz(source);
	},

	_isNonstandardSourceWiz (source) {
		return source.startsWith(SRC_UA_PREFIX) || source.startsWith(SRC_PS_PREFIX) || source.startsWith(SRC_AL_PREFIX) || Parser.SOURCES_NON_STANDARD_WOTC.has(source);
	},

	getFilterGroup (source) {
		if (source instanceof FilterItem) source = source.item;
		if (BrewUtil.hasSourceJson(source)) return 2;
		return Number(SourceUtil.isNonstandardSource(source));
	}
};

// CURRENCY ============================================================================================================
CurrencyUtil = {
	/**
	 * Convert 10 gold -> 1 platinum, etc.
	 * @param obj Object of the form {cp: 123, sp: 456, ...} (values optional)
	 * @param [coinAbvs] List of allowed coin abbreviations e.g. `["cp", "gp"]`
	 */
	doSimplifyCoins (obj, coinAbvs) {
		coinAbvs = coinAbvs || [];
		// Simplify currencies
		for (let i = 0; i < Parser.COIN_CONVERSIONS.length - 1; ++i) {
			const coinCur = Parser.COIN_ABVS[i];
			const coinNxt = Parser.COIN_ABVS[i + 1];
			const coinRatio = Parser.COIN_CONVERSIONS[i + 1] / Parser.COIN_CONVERSIONS[i];

			if (obj[coinCur] && Math.abs(obj[coinCur]) >= coinRatio) {
				const nxtVal = obj[coinCur] >= 0 ? Math.floor(obj[coinCur] / coinRatio) : Math.ceil(obj[coinCur] / coinRatio);
				obj[coinCur] = obj[coinCur] % coinRatio;
				obj[coinNxt] = (obj[coinNxt] || 0) + nxtVal;
			}
		}

		// Convert undesirable currencies to their previous currencies
		for (let i = Parser.COIN_CONVERSIONS.length - 1; i >= 0; --i) {
			const coinCur = Parser.COIN_ABVS[i];
			const coinNxt = Parser.COIN_ABVS[i - 1];
			const coinRatio = Parser.COIN_CONVERSIONS[i] / Parser.COIN_CONVERSIONS[i - 1];

			if (!coinAbvs.includes(coinCur)) {
				obj[coinNxt] = (obj[coinNxt] || 0) + (obj[coinCur] || 0) * coinRatio;
				delete obj[coinCur];
			}
		}

		Parser.COIN_ABVS.filter(coin => obj[coin] === 0).forEach(coin => delete obj[coin]);

		return obj;
	}
};

// CONVENIENCE/ELEMENTS ================================================================================================
Math.sum = Math.sum || function (...values) {
	return values.reduce((a, b) => a + b, 0);
};

Math.mean = Math.mean || function (...values) {
	return Math.sum(...values) / values.length;
};

Math.meanAbsoluteDeviation = Math.meanAbsoluteDeviation || function (...values) {
	const mean = Math.mean(...values);
	return Math.mean(...(values.map(num => Math.abs(num - mean))));
};

Math.seed = Math.seed || function (s) {
	return function () {
		s = Math.sin(s) * 10000;
		return s - Math.floor(s);
	};
};

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

function isObject (obj) {
	const type = typeof obj;
	return (type === "function" || type === "object") && !!obj;
}

function isString (str) {
	return typeof str === "string";
}

function isNumber (obj) {
	return toString.call(obj) === "[object Number]";
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

JqueryUtil = {
	_isEnhancementsInit: false,
	initEnhancements () {
		if (JqueryUtil._isEnhancementsInit) return;
		JqueryUtil._isEnhancementsInit = true;

		JqueryUtil.addSelectors();

		/**
		 * Template strings which can contain jQuery objects.
		 * Usage: $$`<div>Press this button: ${$btn}</div>`
		 * @return jQuery
		 */
		window.$$ = function (parts, ...args) {
			if (parts instanceof jQuery) {
				return (...passed) => {
					const parts2 = [...passed[0]];
					const args2 = passed.slice(1);
					parts2[0] = `<div>${parts2[0]}`;
					parts2.last(`${parts2.last()}</div>`);

					const $temp = $$(parts2, ...args2);
					$temp.children().each((i, e) => $(e).appendTo(parts));
					return parts;
				};
			} else {
				const $eles = [];
				let ixArg = 0;

				const handleArg = (arg) => {
					if (arg instanceof $) {
						$eles.push(arg);
						return `<${arg.tag()} data-r="true"/>`;
					} else if (arg instanceof HTMLElement) {
						return handleArg($(arg));
					} else return arg
				};

				const raw = parts.reduce((html, p) => {
					const myIxArg = ixArg++;
					if (args[myIxArg] == null) return `${html}${p}`;
					if (args[myIxArg] instanceof Array) return `${html}${args[myIxArg].map(arg => handleArg(arg)).join("")}${p}`;
					else return `${html}${handleArg(args[myIxArg])}${p}`;
				});
				const $res = $(raw);
				$res.find(`[data-r=true]`).replaceWith(i => $eles[i]);
				return $res;
			}
		};

		$.fn.extend({
			// avoid setting input type to "search" as it visually offsets the contents of the input
			disableSpellcheck: function () { return this.attr("autocomplete", "off").attr("autocapitalize", "off").attr("spellcheck", "false"); },

			tag: function () {
				return this.prop("tagName").toLowerCase();
			},

			title: function (...args) { return this.attr("title", ...args); },

			/**
			 * Quickly set the innerHTML of the innermost element, wihtout parsing the whole thing with jQuery.
			 * Useful for populating e.g. a table row.
			 */
			fastSetHtml: function (html) {
				if (!this.length) return this;
				let tgt = this[0];
				while (tgt.children.length) {
					tgt = tgt.children[0];
				}
				tgt.innerHTML = html;
				return this;
			},

			blurOnEsc: function () {
				return this.keydown(evt => {
					if (evt.which === 27) this.blur(); // escape
				});
			},

			hideVe: function () { return this.addClass("ve-hidden"); },
			showVe: function () { return this.removeClass("ve-hidden"); },
			toggleVe: function (val) { return this.toggleClass("ve-hidden", !!val); }
		});

		$.event.special.destroyed = {
			remove: function (o) {
				if (o.handler) o.handler();
			}
		}
	},

	addSelectors () {
		// Add a selector to match exact text (case insensitive) to jQuery's arsenal
		//   Note that the search text should be `trim().toLowerCase()`'d before being passed in
		$.expr[":"].textEquals = (el, i, m) => $(el).text().toLowerCase().trim() === m[3];

		// Add a selector to match contained text (case insensitive)
		$.expr[":"].containsInsensitive = (el, i, m) => {
			const searchText = m[3];
			const textNode = $(el).contents().filter((i, e) => e.nodeType === 3)[0];
			if (!textNode) return false;
			const match = textNode.nodeValue.toLowerCase().trim().match(`${searchText.toLowerCase().trim().escapeRegexp()}`);
			return match && match.length > 0;
		};
	},

	showCopiedEffect ($ele, text = "Copied!", bubble) {
		const $temp = $(`<div class="copied-tip"><span>${text}</span></div>`).appendTo($(`body`));
		const offset = $temp.width() / 2;
		const top = $(window).scrollTop();
		const pos = $ele.offset();

		const animationOptions = {
			top: "-=8",
			opacity: 0
		};
		if (bubble) {
			animationOptions.left = `${Math.random() > 0.5 ? "-" : "+"}=${~~(Math.random() * 17)}`;
		}
		const seed = Math.random();
		const duration = bubble ? 250 + seed * 200 : 250;

		$temp.css({
			top: bubble ? (pos.top - 5) - top : (pos.top - 17) - top,
			left: pos.left - offset + ($ele.width() / 2)
		}).animate(
			animationOptions,
			{
				easing: "linear",
				duration,
				complete: () => $temp.remove(),
				progress: (_, progress) => { // progress is 0..1
					if (bubble) {
						const diffProgress = 0.5 - progress;
						animationOptions.top = `${diffProgress > 0 ? "-" : "+"}=40`;
						$temp.css("transform", `rotate(${seed > 0.5 ? "-" : ""}${seed * 500 * progress}deg)`);
					}
				}
			}
		);
	},

	_dropdownInit: false,
	bindDropdownButton ($ele) {
		if (!JqueryUtil._dropdownInit) {
			JqueryUtil._dropdownInit = true;
			document.addEventListener("click", () => [...document.querySelectorAll(`.open`)].filter(ele => !(ele.className || "").split(" ").includes(`dropdown--navbar`)).forEach(ele => ele.classList.remove("open")));
		}
		$ele.click(() => setTimeout(() => $ele.parent().addClass("open"), 1)); // defer to allow the above to complete
	},

	_ACTIVE_TOAST: [],
	/**
	 * @param {Object|string} options
	 * @param {(jQuery|string)} options.content Toast contents. Supports jQuery objects.
	 * @param {string} options.type Toast type. Can be any Bootstrap alert type ("success", "info", "warning", or "danger").
	 */
	doToast (options) {
		if (typeof options === "string") {
			options = {
				content: options,
				type: "info"
			};
		}
		options.type = options.type || "info";

		const doCleanup = ($toast) => {
			$toast.removeClass("toast--animate");
			setTimeout(() => $toast.remove(), 85);
			JqueryUtil._ACTIVE_TOAST.splice(JqueryUtil._ACTIVE_TOAST.indexOf($toast), 1);
		};

		const $btnToastDismiss = $(`<button class="btn toast__btn-close"><span class="glyphicon glyphicon-remove"/></button>`)
			.click(() => doCleanup($toast));

		const $toast = $$`
		<div class="toast toast--type-${options.type}">
			<div class="toast__wrp-content">${options.content}</div>
			<div class="toast__wrp-control">${$btnToastDismiss}</div>
		</div>`.prependTo($(`body`)).data("pos", 0);

		setTimeout(() => $toast.addClass(`toast--animate`), 5);
		setTimeout(() => doCleanup($toast), 5000);

		if (JqueryUtil._ACTIVE_TOAST.length) {
			JqueryUtil._ACTIVE_TOAST.forEach($oldToast => {
				const pos = $oldToast.data("pos");
				$oldToast.data("pos", pos + 1);
				if (pos === 2) doCleanup($oldToast);
			});
		}

		JqueryUtil._ACTIVE_TOAST.push($toast);
	}
};

if (typeof window !== "undefined") window.addEventListener("load", JqueryUtil.initEnhancements);

ObjUtil = {
	mergeWith (source, target, fnMerge, options = {depth: 1}) {
		if (!source || !target || typeof fnMerge !== "function") throw new Error("Must include a source, target and a fnMerge to handle merging");

		const recursive = function (deepSource, deepTarget, depth = 1) {
			if (depth > options.depth || !deepSource || !deepTarget) return;
			for (let prop of Object.keys(deepSource)) {
				deepTarget[prop] = fnMerge(deepSource[prop], deepTarget[prop], source, target);
				recursive(source[prop], deepTarget[prop], depth + 1);
			}
		};
		recursive(source, target, 1);
	},

	async pForEachDeep (source, pCallback, options = {depth: Infinity, callEachLevel: false}) {
		const path = [];
		const pDiveDeep = async function (val, path, depth = 0) {
			if (options.callEachLevel || typeof val !== "object" || options.depth === depth) {
				await pCallback(val, path, depth);
			}
			if (options.depth !== depth && typeof val === "object") {
				for (const key of Object.keys(val)) {
					path.push(key);
					await pDiveDeep(val[key], path, depth + 1);
				}
			}
			path.pop();
		};
		await pDiveDeep(source, path);
	}
};

// TODO refactor other misc utils into this
MiscUtil = {
	COLOR_HEALTHY: "#00bb20",
	COLOR_HURT: "#c5ca00",
	COLOR_BLOODIED: "#f7a100",
	COLOR_DEFEATED: "#cc0000",

	STR_SEE_CONSOLE: "See the console (CTRL+SHIFT+J) for more information.",

	copy (obj) {
		return JSON.parse(JSON.stringify(obj));
	},

	async pCopyTextToClipboard (text) {
		function doCompatabilityCopy () {
			const $temp = $(`<textarea id="copy-temp" style="position: fixed; top: -1000px; left: -1000px; width: 1px; height: 1px;">${text}</textarea>`);
			$(`body`).append($temp);
			$temp.select();
			document.execCommand("Copy");
			$temp.remove();
		}

		if (navigator && navigator.permissions) {
			try {
				const access = await navigator.permissions.query({name: "clipboard-write"});
				if (access.state === "granted" || access.state === "prompt") {
					await navigator.clipboard.writeText(text);
				} else doCompatabilityCopy();
			} catch (e) { doCompatabilityCopy(); }
		} else doCompatabilityCopy();
	},

	checkProperty (object, ...path) {
		for (let i = 0; i < path.length; ++i) {
			object = object[path[i]];
			if (object == null) return false;
		}
		return true;
	},

	get (object, ...path) {
		if (object == null) return null;
		for (let i = 0; i < path.length; ++i) {
			object = object[path[i]];
			if (object == null) return object;
		}
		return object;
	},

	mix: (superclass) => new MiscUtil._MixinBuilder(superclass),
	_MixinBuilder: function (superclass) {
		this.superclass = superclass;

		this.with = function (...mixins) {
			return mixins.reduce((c, mixin) => mixin(c), this.superclass);
		};
	},

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
		return `#${`00${(~~(r * 255)).toString(16)}`.slice(-2)}${`00${(~~(g * 255)).toString(16)}`.slice(-2)}${`00${(~~(b * 255)).toString(16)}`.slice(-2)}`;
	},

	/**
	 * @param hex Original hex color.
	 * @param [opts] Options object.
	 * @param [opts.bw] True if the color should be returnes as black/white depending on contrast ratio.
	 * @param [opts.dark] Color to return if a "dark" color would contrast best.
	 * @param [opts.light] Color to return if a "light" color would contrast best.
	 */
	invertColor (hex, opts) {
		opts = opts || {};

		hex = hex.slice(1); // remove #

		let r = parseInt(hex.slice(0, 2), 16);
		let g = parseInt(hex.slice(2, 4), 16);
		let b = parseInt(hex.slice(4, 6), 16);

		// http://stackoverflow.com/a/3943023/112731
		const isDark = (r * 0.299 + g * 0.587 + b * 0.114) > 186;
		if (opts.dark && opts.light) return isDark ? opts.dark : opts.light;
		else if (opts.bw) return isDark ? "#000000" : "#FFFFFF";

		r = (255 - r).toString(16); g = (255 - g).toString(16); b = (255 - b).toString(16);
		return `#${[r, g, b].map(it => it.padStart(2, "0")).join("")}`;
	},

	scrollPageTop () {
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	},

	isInInput (event) {
		return event.target.nodeName === "INPUT" || event.target.nodeName === "TEXTAREA"
			|| event.target.getAttribute("contenteditable") === "true";
	},

	expEval (str) {
		// eslint-disable-next-line no-new-func
		return new Function(`return ${str.replace(/[^-()\d/*+.]/g, "")}`)();
	},

	parseNumberRange (input, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
		function errInvalid (input) {
			throw new Error(`Could not parse range input "${input}"`);
		}

		function errOutOfRange () {
			throw new Error(`Number was out of range! Range was ${min}-${max} (inclusive).`);
		}

		function isOutOfRange (num) {
			return num < min || num > max;
		}

		function addToRangeVal (range, num) {
			range.add(num);
		}

		function addToRangeLoHi (range, lo, hi) {
			for (let i = lo; i <= hi; ++i) range.add(i);
		}

		while (true) {
			if (input && input.trim()) {
				const clean = input.replace(/\s*/g, "");
				if (/^((\d+-\d+|\d+),)*(\d+-\d+|\d+)$/.exec(clean)) {
					const parts = clean.split(",");
					const out = new Set();

					for (const part of parts) {
						if (part.includes("-")) {
							const spl = part.split("-");
							const numLo = Number(spl[0]);
							const numHi = Number(spl[1]);

							if (isNaN(numLo) || isNaN(numHi) || numLo === 0 || numHi === 0 || numLo > numHi) errInvalid();

							if (isOutOfRange(numLo) || isOutOfRange(numHi)) errOutOfRange();

							if (numLo === numHi) addToRangeVal(out, numLo);
							else addToRangeLoHi(out, numLo, numHi);
						} else {
							const num = Number(part);
							if (isNaN(num) || num === 0) errInvalid();
							else {
								if (isOutOfRange(num)) errOutOfRange();
								addToRangeVal(out, num);
							}
						}
					}

					return out;
				} else errInvalid();
			} else return null;
		}
	},

	MONTH_NAMES: [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	],
	dateToStr (date, short) {
		const month = MiscUtil.MONTH_NAMES[date.getMonth()];
		return `${short ? month.substring(0, 3) : month} ${date.getDate()}, ${date.getFullYear()}`;
	},

	findCommonPrefix (strArr) {
		let prefix = null;
		strArr.forEach(s => {
			if (prefix == null) {
				prefix = s;
			} else {
				const minLen = Math.min(s.length, prefix.length);
				for (let i = 0; i < minLen; ++i) {
					const cp = prefix[i];
					const cs = s[i];
					if (cp !== cs) {
						prefix = prefix.substring(0, i);
						break;
					}
				}
			}
		});
		return prefix;
	},

	/**
	 * @param fgHexTarget Target/resultant color for the foreground item
	 * @param fgOpacity Desired foreground transparency (0-1 inclusive)
	 * @param bgHex Background color
	 */
	calculateBlendedColor (fgHexTarget, fgOpacity, bgHex) {
		const fgDcTarget = CryptUtil.hex2Dec(fgHexTarget);
		const bgDc = CryptUtil.hex2Dec(bgHex);
		return ((fgDcTarget - ((1 - fgOpacity) * bgDc)) / fgOpacity).toString(16);
	},

	/**
	 * Borrowed from lodash.
	 *
	 * @param func The function to debounce.
	 * @param wait Minimum duration between calls.
	 * @param options Options object.
	 * @return {Function} The debounced function.
	 */
	debounce (func, wait, options) {
		let lastArgs; let lastThis; let maxWait; let result; let timerId; let lastCallTime; let lastInvokeTime = 0; let leading = false; let maxing = false; let trailing = true;

		wait = Number(wait) || 0;
		if (typeof options === "object") {
			leading = !!options.leading;
			maxing = "maxWait" in options;
			maxWait = maxing ? Math.max(Number(options.maxWait) || 0, wait) : maxWait;
			trailing = "trailing" in options ? !!options.trailing : trailing;
		}

		function invokeFunc (time) {
			let args = lastArgs; let thisArg = lastThis;

			lastArgs = lastThis = undefined;
			lastInvokeTime = time;
			result = func.apply(thisArg, args);
			return result;
		}

		function leadingEdge (time) {
			lastInvokeTime = time;
			timerId = setTimeout(timerExpired, wait);
			return leading ? invokeFunc(time) : result;
		}

		function remainingWait (time) {
			let timeSinceLastCall = time - lastCallTime; let timeSinceLastInvoke = time - lastInvokeTime; let result = wait - timeSinceLastCall;
			return maxing ? Math.min(result, maxWait - timeSinceLastInvoke) : result;
		}

		function shouldInvoke (time) {
			let timeSinceLastCall = time - lastCallTime; let timeSinceLastInvoke = time - lastInvokeTime;

			return (lastCallTime === undefined || (timeSinceLastCall >= wait) || (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
		}

		function timerExpired () {
			const time = Date.now();
			if (shouldInvoke(time)) {
				return trailingEdge(time);
			}
			// Restart the timer.
			timerId = setTimeout(timerExpired, remainingWait(time));
		}

		function trailingEdge (time) {
			timerId = undefined;

			if (trailing && lastArgs) return invokeFunc(time);
			lastArgs = lastThis = undefined;
			return result;
		}

		function cancel () {
			if (timerId !== undefined) clearTimeout(timerId);
			lastInvokeTime = 0;
			lastArgs = lastCallTime = lastThis = timerId = undefined;
		}

		function flush () {
			return timerId === undefined ? result : trailingEdge(Date.now());
		}

		function debounced () {
			let time = Date.now(); let isInvoking = shouldInvoke(time);
			lastArgs = arguments;
			lastThis = this;
			lastCallTime = time;

			if (isInvoking) {
				if (timerId === undefined) return leadingEdge(lastCallTime);
				if (maxing) {
					// Handle invocations in a tight loop.
					timerId = setTimeout(timerExpired, wait);
					return invokeFunc(lastCallTime);
				}
			}
			if (timerId === undefined) timerId = setTimeout(timerExpired, wait);
			return result;
		}

		debounced.cancel = cancel;
		debounced.flush = flush;
		return debounced;
	},

	// from lodash
	throttle (func, wait, options) {
		let leading = true; let trailing = true;

		if (typeof options === "object") {
			leading = "leading" in options ? !!options.leading : leading;
			trailing = "trailing" in options ? !!options.trailing : trailing;
		}

		return this.debounce(func, wait, {leading, maxWait: wait, trailing});
	},

	pDelay (msecs, resolveAs) {
		return new Promise(resolve => setTimeout(() => resolve(resolveAs), msecs));
	},

	getWalker (keyBlacklist = new Set()) {
		function applyHandlers (handlers, ident, obj, lastKey) {
			if (!(handlers instanceof Array)) handlers = [handlers];
			handlers.forEach(h => obj = h(ident, obj, lastKey));
			return obj;
		}

		const fn = (ident, obj, primitiveHandlers, lastKey) => {
			if (obj == null) {
				if (primitiveHandlers.null) return applyHandlers(primitiveHandlers.null, ident, obj, lastKey);
				return obj;
			}

			const to = typeof obj;
			switch (to) {
				case undefined:
					if (primitiveHandlers.undefined) return applyHandlers(primitiveHandlers.undefined, ident, obj, lastKey);
					return obj;
				case "boolean":
					if (primitiveHandlers.boolean) return applyHandlers(primitiveHandlers.boolean, ident, obj, lastKey);
					return obj;
				case "number":
					if (primitiveHandlers.number) return applyHandlers(primitiveHandlers.number, ident, obj, lastKey);
					return obj;
				case "string":
					if (primitiveHandlers.string) return applyHandlers(primitiveHandlers.string, ident, obj, lastKey);
					return obj;
				case "object": {
					if (obj instanceof Array) {
						if (primitiveHandlers.array) obj = applyHandlers(primitiveHandlers.array, ident, obj, lastKey);
						return obj.map(it => fn(ident, it, primitiveHandlers, lastKey));
					} else {
						if (primitiveHandlers.object) obj = applyHandlers(primitiveHandlers.object, ident, obj, lastKey);
						Object.keys(obj).forEach(k => {
							const v = obj[k];
							if (!keyBlacklist.has(k)) obj[k] = fn(ident, v, primitiveHandlers, k);
						});
						return obj;
					}
				}
				default: throw new Error(`Unhandled type "${to}"`);
			}
		};

		return {walk: fn};
	},

	pDefer (fn) {
		return (async () => fn())();
	}
};

// EVENT HANDLERS ======================================================================================================
EventUtil = {
	getClientX (evt) { return evt.touches && evt.touches.length ? evt.touches[0].clientX : evt.clientX; },
	getClientY (evt) { return evt.touches && evt.touches.length ? evt.touches[0].clientY : evt.clientY; }
};

// CONTEXT MENUS =======================================================================================================
ContextUtil = {
	_ctxInit: {},
	_ctxClick: {},
	_ctxOpenRefsNextId: 1,
	_ctxOpenRefs: {},
	_handlePreInitContextMenu: (menuId) => {
		if (ContextUtil._ctxInit[menuId]) return;
		ContextUtil._ctxInit[menuId] = true;
		const clickId = `click.${menuId}`;
		$("body").off(clickId).on(clickId, (evt) => {
			if ($(evt.target).data("ctx-id") != null) return; // ignore clicks on context menus

			Object.entries(ContextUtil._ctxOpenRefs[menuId] || {}).forEach(([k, v]) => {
				v(false);
				delete ContextUtil._ctxOpenRefs[menuId][k];
			});
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

	_lastMenuId: 1,
	getNextGenericMenuId () { return `contextMenu_${ContextUtil._lastMenuId++}`; },

	doInitContextMenu: (menuId, clickFn, labels) => {
		ContextUtil._ctxClick[menuId] = clickFn;
		ContextUtil._handlePreInitContextMenu(menuId);
		let tempString = `<ul id="${menuId}" class="dropdown-menu ui-ctx" role="menu">`;
		let i = 0;
		labels.forEach(it => {
			if (it === null) tempString += `<li class="divider"/>`;
			else if (typeof it === "object") {
				tempString += `<li class="${it.isDisabled ? `disabled` : ``} ${it.style || ""}"><span ${!it.isDisabled ? `data-ctx-id="${i}"` : ""} ${it.title ? `title="${it.title.escapeQuotes()}"` : ""}>${it.text}</span></li>`;
				if (!it.isDisabled) i++;
			} else {
				tempString += `<li><span data-ctx-id="${i}">${it}</span></li>`;
				i++;
			}
		});
		tempString += `</ul>`;
		$(`#${menuId}`).remove();
		$("body").append(tempString);
	},

	doInitActionContextMenu (contextId, actionOptions) {
		ContextUtil.doInitContextMenu(contextId, (evt, ele, $invokedOn, $selectedMenu) => {
			const val = Number($selectedMenu.data("ctx-id"));
			actionOptions.filter(Boolean)[val].action(evt, $invokedOn);
		}, actionOptions);
	},

	doTeardownContextMenu (menuId) {
		delete ContextUtil._ctxInit[menuId];
		delete ContextUtil._ctxClick[menuId];
		delete ContextUtil._ctxOpenRefs[menuId];
		$(`#${menuId}`).remove();
	},

	handleOpenContextMenu: (evt, ele, menuId, closeHandler, data) => {
		// anything specified in "data" is passed through to the final handler(s)
		evt.preventDefault();
		evt.stopPropagation();
		const thisId = ContextUtil._ctxOpenRefsNextId++;
		(ContextUtil._ctxOpenRefs[menuId] = ContextUtil._ctxOpenRefs[menuId] || {})[thisId] = closeHandler || (() => {});
		const $menu = $(`#${menuId}`)
			.show()
			.css({
				position: "absolute",
				left: ContextUtil._getMenuPosition(menuId, evt.clientX, "width", "scrollLeft"),
				top: ContextUtil._getMenuPosition(menuId, evt.clientY, "height", "scrollTop")
			})
			.off("click")
			.on("click", "span", function (e) {
				$menu.hide();
				if (ContextUtil._ctxOpenRefs[menuId][thisId]) ContextUtil._ctxOpenRefs[menuId][thisId](true);
				delete ContextUtil._ctxOpenRefs[menuId][thisId];
				const $invokedOn = $(evt.target).closest(`li.row`);
				const $selectedMenu = $(e.target);
				const invokedOnId = Number($selectedMenu.data("ctx-id"));
				ContextUtil._ctxClick[menuId](e, ele, $invokedOn, $selectedMenu, isNaN(invokedOnId) ? null : invokedOnId, data);
			});
	},

	/**
	 * @param name
	 * @param fnAction
	 * @param [opts] Options object.
	 * @param [opts.isDisabled] If this action is disabled.
	 * @param [opts.helpText] Help (title) text.
	 * @param [opts.style] Additional CSS classes to add (e.g. `ctx-danger`).
	 */
	Action: function (text, fnAction, opts) {
		opts = opts || {};

		this.text = text;
		this.action = fnAction;

		this.isDisabled = opts.isDisabled;
		this.helpText = opts.helpText;
		this.style = opts.style;
	}
};

// LIST AND SEARCH =====================================================================================================
SearchUtil = {
	removeStemmer (elasticSearch) {
		const stemmer = elasticlunr.Pipeline.getRegisteredFunction("stemmer");
		elasticSearch.pipeline.remove(stemmer);
	}
};

ListUtil = {
	SUB_HASH_PREFIX: "sublistselected",

	bindEscapeKey (list, $iptSearch, forceRebind) {
		// Bind "ESC" when in search input to "clear input"
		if (!list._isBoundEscape || forceRebind) {
			if (forceRebind) $iptSearch.off("keydown.search5e");
			list._isBoundEscape = true;
			$iptSearch.on("keydown.search5e", (e) => {
				if (e.which === 27) {
					setTimeout(() => {
						$iptSearch.blur().val("");
						list.search($iptSearch.val());
					}, 0);
				}
			});
		}
	},

	_firstInit: true,
	initList (listOpts) {
		const $iptSearch = $("#lst__search");
		const $wrpList = $(`ul.list.${listOpts.listClass}`);
		const list = new List({$iptSearch, $wrpList, ...listOpts});

		$("#reset").click(function () {
			$iptSearch.val("");
			list.reset();
		});

		// region Magnifying glass/clear button
		const $btnSearchClear = $(`#lst__search-glass`)
			.click(() => $iptSearch.val("").change().keydown().keyup());
		const _handleSearchChange = () => {
			setTimeout(() => {
				if ($iptSearch.val().length) $btnSearchClear.removeClass("no-events").addClass("clickable").title("Clear").html(`<span class="glyphicon glyphicon-remove"/>`);
				else $btnSearchClear.addClass("no-events").removeClass("clickable").title(null).html(`<span class="glyphicon glyphicon-search"/>`);
			})
		};
		const handleSearchChange = MiscUtil.throttle(_handleSearchChange, 50);
		$iptSearch.on("keydown", handleSearchChange);
		// endregion

		ListUtil.bindEscapeKey(list, $iptSearch);

		if (ListUtil._firstInit) {
			ListUtil._firstInit = false;
			const $headDesc = $(`.page__subtitle`);
			$headDesc.html(`${$headDesc.html()} Press J/K to navigate rows.`);
			ListUtil._initList_bindWindowHandlers();
		}

		return list;
	},

	_initList_scrollToItem () {
		const toShow = Hist.getSelectedListElementWithLocation();

		if (toShow) {
			const $li = $(toShow.item.ele);
			const $wrpList = $li.parent();
			const parentScroll = $wrpList.scrollTop();
			const parentHeight = $wrpList.height();
			const posInParent = $li.position().top;
			const height = $li.height();

			if (posInParent < 0) {
				$li[0].scrollIntoView();
			} else if (posInParent + height > parentHeight) {
				$wrpList.scrollTop(parentScroll + (posInParent - parentHeight + height));
			}
		}
	},

	_initList_bindWindowHandlers () {
		$(window).on("keypress", (e) => {
			// K up; J down
			if (noModifierKeys(e)) {
				if (e.key === "k" || e.key === "j") {
					// don't switch if the user is typing somewhere else
					if (MiscUtil.isInInput(e)) return;
					const it = Hist.getSelectedListElementWithLocation();

					if (it) {
						if (e.key === "k") {
							const prevLink = $(it.item.ele).prev().find("a").attr("href");
							if (prevLink !== undefined) {
								window.location.hash = prevLink;
								ListUtil._initList_scrollToItem();
							} else {
								const lists = ListUtil.getPrimaryLists();
								let x = it.x;
								while (--x >= 0) {
									const l = lists[x];
									if (l.visibleItems.length) {
										const goTo = $(l.visibleItems[l.visibleItems.length - 1].ele).find("a").attr("href");
										if (goTo) {
											window.location.hash = goTo;
											ListUtil._initList_scrollToItem();
										}
										return;
									}
								}
							}
							const fromPrevSibling = $(it.item.ele).closest(`ul`).parent().prev(`li`).find(`ul li`).last().find("a").attr("href");
							if (fromPrevSibling) {
								window.location.hash = fromPrevSibling;
							}
						} else if (e.key === "j") {
							const nextLink = $(it.item.ele).next().find("a").attr("href");
							if (nextLink !== undefined) {
								window.location.hash = nextLink;
								ListUtil._initList_scrollToItem();
							} else {
								const lists = ListUtil.getPrimaryLists();
								let x = it.x;
								while (++x < lists.length) {
									const l = lists[x];
									if (l.visibleItems.length) {
										const goTo = $(l.visibleItems[0].ele).find("a").attr("href");
										if (goTo) {
											window.location.hash = goTo;
											ListUtil._initList_scrollToItem();
										}
										return;
									}
								}
							}
							const fromNxtSibling = $(it.item.ele).closest(`ul`).parent().next(`li`).find(`ul li`).first().find("a").attr("href");
							if (fromNxtSibling) {
								window.location.hash = fromNxtSibling;
							}
						}
					}
				}
			}
		});
	},

	updateSelected () {
		const curSelectedItem = Hist.getSelectedListItem();
		ListUtil._primaryLists.forEach(l => l.updateSelected(curSelectedItem));
	},

	openContextMenu (evt, list, listItem) {
		const listsWithSelections = ListUtil._primaryLists.map(l => ({l, selected: l.getSelected()}));

		let selection;
		if (listsWithSelections.some(it => it.selected.length)) {
			const isItemInSelection = listsWithSelections.some(it => it.selected.some(li => li === listItem));
			if (isItemInSelection) {
				selection = listsWithSelections.map(it => it.selected).flat();
				// trigger a context menu event with all the selected items
			} else {
				ListUtil._primaryLists.forEach(l => l.deselectAll());
				list.doSelect(listItem);
				selection = [listItem]
			}
		} else {
			list.doSelect(listItem);
			selection = [listItem]
		}

		ContextUtil.handleOpenContextMenu(evt, listItem.ele, "list", null, selection);
	},

	openSubContextMenu (evt, listItem) {
		ContextUtil.handleOpenContextMenu(evt, listItem.ele, "listSub", null, [listItem]);
	},

	$sublistContainer: null,
	sublist: null,
	_sublistChangeFn: null,
	_pCustomHashHandler: null,
	_allItems: null,
	_primaryLists: [],
	_pinned: {},
	initSublist (options) {
		if (options.itemList !== undefined) ListUtil._allItems = options.itemList; delete options.itemList;
		if (options.getSublistRow !== undefined) ListUtil._getSublistRow = options.getSublistRow; delete options.getSublistRow;
		if (options.onUpdate !== undefined) ListUtil._sublistChangeFn = options.onUpdate; delete options.onUpdate;
		if (options.primaryLists !== undefined) ListUtil._primaryLists = options.primaryLists; delete options.primaryLists;
		if (options.customHashHandler !== undefined) ListUtil._pCustomHashHandler = options.customHashHandler; delete options.customHashHandler;
		if (options.customHashUnpacker !== undefined) ListUtil._customHashUnpackFn = options.customHashUnpacker; delete options.customHashUnpacker;

		ListUtil.$sublistContainer = $("#sublistcontainer");
		const $wrpSublist = $(`ul.${options.listClass}`);
		const sublist = new List({...options, $wrpList: $wrpSublist, isUseJquery: true});
		ListUtil.sublist = sublist;

		if (ListUtil.$sublistContainer.hasClass(`sublist--resizable`)) ListUtil._pBindSublistResizeHandlers(ListUtil.$sublistContainer);

		return sublist;
	},

	setOptions (options) {
		if (options.itemList !== undefined) ListUtil._allItems = options.itemList;
		if (options.getSublistRow !== undefined) ListUtil._getSublistRow = options.getSublistRow;
		if (options.onUpdate !== undefined) ListUtil._sublistChangeFn = options.onUpdate;
		if (options.primaryLists !== undefined) ListUtil._primaryLists = options.primaryLists;
		if (options.customHashHandler !== undefined) ListUtil._pCustomHashHandler = options.customHashHandler;
		if (options.customHashUnpacker !== undefined) ListUtil._customHashUnpackFn = options.customHashUnpacker;
	},

	getPrimaryLists () { return this._primaryLists; },

	__mouseMoveId: 1,
	async _pBindSublistResizeHandlers ($ele) {
		const STORAGE_KEY = "SUBLIST_RESIZE";
		const BORDER_SIZE = 3;
		const MOUSE_MOVE_ID = ListUtil.__mouseMoveId++;
		const $doc = $(document);

		let mousePos;
		function resize (evt) {
			const dx = evt.clientY - mousePos;
			mousePos = evt.clientY;
			$ele.css("height", parseInt($ele.css("height")) + dx);
		}

		$ele.on("mousedown", (evt) => {
			if (evt.which === 1 && evt.target === $ele[0]) {
				evt.preventDefault();
				if (evt.offsetY > $ele.height() - BORDER_SIZE) {
					mousePos = evt.clientY;
					$doc.on(`mousemove.sublist_resize-${MOUSE_MOVE_ID}`, resize);
				}
			}
		});

		$doc.on("mouseup", (evt) => {
			if (evt.which === 1) {
				$(document).off(`mousemove.sublist_resize-${MOUSE_MOVE_ID}`);
				StorageUtil.pSetForPage(STORAGE_KEY, $ele.css("height"));
			}
		});

		const storedHeight = await StorageUtil.pGetForPage(STORAGE_KEY);
		if (storedHeight) $ele.css("height", storedHeight);
	},

	getOrTabRightButton: (id, icon) => {
		let $btn = $(`#${id}`);
		if (!$btn.length) {
			$btn = $(`<button class="stat-tab btn btn-default" id="${id}"><span class="glyphicon glyphicon-${icon}"></span></button>`).appendTo($(`#tabs-right`));
		}
		return $btn;
	},

	bindPinButton: () => {
		ListUtil.getOrTabRightButton(`btn-pin`, `pushpin`)
			.off("click")
			.on("click", () => {
				if (!ListUtil.isSublisted(Hist.lastLoadedId)) ListUtil.pDoSublistAdd(Hist.lastLoadedId, true);
				else ListUtil.pDoSublistRemove(Hist.lastLoadedId);
			})
			.title("Pin (Toggle)");
	},

	genericAddButtonHandler (evt, options = {}) {
		if (evt.shiftKey) ListUtil.pDoSublistAdd(Hist.lastLoadedId, true, options.shiftCount || 20);
		else ListUtil.pDoSublistAdd(Hist.lastLoadedId, true);
	},
	bindAddButton: (handlerGenerator, options = {}) => {
		ListUtil.getOrTabRightButton(`btn-sublist-add`, `plus`)
			.off("click")
			.title(`Add (SHIFT for ${options.shiftCount || 20})`)
			.on("click", handlerGenerator ? handlerGenerator() : ListUtil.genericAddButtonHandler);
	},

	genericSubtractButtonHandler (evt, options = {}) {
		if (evt.shiftKey) ListUtil.pDoSublistSubtract(Hist.lastLoadedId, options.shiftCount || 20);
		else ListUtil.pDoSublistSubtract(Hist.lastLoadedId);
	},
	bindSubtractButton: (handlerGenerator, options = {}) => {
		ListUtil.getOrTabRightButton(`btn-sublist-subtract`, `minus`)
			.off("click")
			.title(`Subtract (SHIFT for ${options.shiftCount || 20})`)
			.on("click", handlerGenerator ? handlerGenerator() : ListUtil.genericSubtractButtonHandler);
	},

	bindDownloadButton: () => {
		const $btn = ListUtil.getOrTabRightButton(`btn-sublist-download`, `download`);
		$btn.off("click")
			.on("click", async evt => {
				if (evt.shiftKey) {
					const toEncode = JSON.stringify(ListUtil.getExportableSublist());
					const parts = [window.location.href, (UrlUtil.packSubHash(ListUtil.SUB_HASH_PREFIX, [toEncode], {isEncodeBoth: true}))];
					await MiscUtil.pCopyTextToClipboard(parts.join(HASH_PART_SEP));
					JqueryUtil.showCopiedEffect($btn);
				} else {
					DataUtil.userDownload(ListUtil._getDownloadName(), JSON.stringify(ListUtil.getExportableSublist(), null, "\t"));
				}
			})
			.title("Download List (SHIFT for Link)");
	},

	async pDoJsonLoad (json, additive) {
		await ListUtil._pLoadSavedSublist(json.items, additive);
		await ListUtil._pFinaliseSublist();
	},

	bindUploadButton: (pFnPreLoad) => {
		const $btn = ListUtil.getOrTabRightButton(`btn-sublist-upload`, `upload`);
		$btn.off("click")
			.on("click", (evt) => {
				function pHandleIptChange (event, additive) {
					const input = event.target;

					const reader = new FileReader();
					reader.onload = async () => {
						const text = reader.result;
						const json = JSON.parse(text);
						$iptAdd.remove();
						if (pFnPreLoad) await pFnPreLoad(json);
						await ListUtil.pDoJsonLoad(json, additive);
					};
					reader.readAsText(input.files[0]);
				}

				const additive = evt.shiftKey;
				const $iptAdd = $(`<input type="file" accept=".json" style="position: fixed; top: -100px; left: -100px; display: none;">`)
					.on("change", (evt) => pHandleIptChange(evt, additive))
					.appendTo($(`body`));
				$iptAdd.click();
			})
			.title("Upload List (SHIFT for Add Only)");
	},

	async pSetFromSubHashes (subHashes, pFnPreLoad) {
		const unpacked = {};
		subHashes.forEach(s => Object.assign(unpacked, UrlUtil.unpackSubHash(s, true)));
		const setFrom = unpacked[ListUtil.SUB_HASH_PREFIX];
		if (setFrom) {
			const json = JSON.parse(setFrom);

			if (pFnPreLoad) {
				await pFnPreLoad(json);
			}

			await ListUtil._pLoadSavedSublist(json.items, false);
			await ListUtil._pFinaliseSublist();

			const [link, ...sub] = Hist.getHashParts();
			const outSub = [];
			Object.keys(unpacked)
				.filter(k => k !== ListUtil.SUB_HASH_PREFIX)
				.forEach(k => {
					outSub.push(`${k}${HASH_SUB_KV_SEP}${unpacked[k].join(HASH_SUB_LIST_SEP)}`);
				});
			Hist.setSuppressHistory(true);
			window.location.hash = `#${link}${outSub.length ? `${HASH_PART_SEP}${outSub.join(HASH_PART_SEP)}` : ""}`;
		}
	},

	_getPinnedCount (index, data) {
		const base = ListUtil._pinned[index];
		if (!base) return null;
		if (data && data.customHashId) return base[data.customHashId];
		return base._;
	},

	_setPinnedCount (index, count, data) {
		const base = ListUtil._pinned[index];
		const key = data && data.customHashId ? data.customHashId : "_";
		if (base) base[key] = count;
		else (ListUtil._pinned[index] = {})[key] = count;
	},

	_deletePinnedCount (index, data) {
		const base = ListUtil._pinned[index];
		if (base) {
			if (data && data.customHashId) delete base[data.customHashId];
			else delete base._;
		}
	},

	async pDoSublistAdd (index, doFinalise, addCount, data) {
		if (index == null) {
			return JqueryUtil.doToast({
				content: "Please first view something from the list.",
				type: "danger"
			});
		}

		const count = ListUtil._getPinnedCount(index, data) || 0;
		addCount = addCount || 1;
		ListUtil._setPinnedCount(index, count + addCount, data);

		if (count !== 0) {
			ListUtil._setViewCount(index, count + addCount, data);
			if (doFinalise) await ListUtil._pFinaliseSublist();
		} else {
			const listItem = await ListUtil._getSublistRow(ListUtil._allItems[index], index, addCount, data);
			ListUtil.sublist.addItem(listItem);
			if (doFinalise) await ListUtil._pFinaliseSublist();
		}
	},

	async pDoSublistSubtract (index, subtractCount, data) {
		const count = ListUtil._getPinnedCount(index, data);
		subtractCount = subtractCount || 1;
		if (count > subtractCount) {
			ListUtil._setPinnedCount(index, count - subtractCount, data);
			ListUtil._setViewCount(index, count - subtractCount, data);
			ListUtil.sublist.update();
			await ListUtil._pSaveSublist();
			ListUtil._handleCallUpdateFn();
		} else if (count) await ListUtil.pDoSublistRemove(index, data);
	},

	getSublisted () {
		const cpy = MiscUtil.copy(ListUtil._pinned);
		const out = {};
		Object.keys(cpy).filter(k => Object.keys(cpy[k]).length).forEach(k => out[k] = cpy[k]);
		return out;
	},

	getSublistedIds () {
		return Object.keys(ListUtil._pinned).filter(k => Object.keys(ListUtil._pinned[k]).length).map(it => Number(it));
	},

	_setViewCount: (index, newCount, data) => {
		let foundItem;
		if (data && data.customHashId != null) {
			foundItem = ListUtil.sublist.items.find(it => it.data.customHashId === data.customHashId);
		} else {
			foundItem = ListUtil.sublist.items.find(it => it.ix === index);
		}

		foundItem.values.count = newCount;
		foundItem.data.$elesCount.forEach($ele => {
			if ($ele.is("input")) $ele.val(newCount);
			else $ele.text(newCount);
		})
	},

	async _pFinaliseSublist (noSave) {
		ListUtil.sublist.update();
		ListUtil._updateSublistVisibility();
		if (!noSave) await ListUtil._pSaveSublist();
		ListUtil._handleCallUpdateFn();
	},

	getExportableSublist: () => {
		const sources = new Set();
		const toSave = ListUtil.sublist.items
			.map(it => {
				sources.add(ListUtil._allItems[it.ix].source);
				return {h: it.values.hash.split(HASH_PART_SEP)[0], c: it.values.count || undefined, customHashId: it.data.customHashId};
			});
		return {items: toSave, sources: Array.from(sources)};
	},

	async _pSaveSublist () {
		await StorageUtil.pSetForPage("sublist", ListUtil.getExportableSublist());
	},

	_updateSublistVisibility: () => {
		if (ListUtil.sublist.items.length) ListUtil.$sublistContainer.addClass("sublist--visible");
		else ListUtil.$sublistContainer.removeClass("sublist--visible");
	},

	async pDoSublistRemove (index, data) {
		ListUtil._deletePinnedCount(index, data);
		if (data && data.customHashId) ListUtil.sublist.removeItemBy("customHashId", data.customHashId);
		else ListUtil.sublist.removeItem(index);
		ListUtil.sublist.update();
		ListUtil._updateSublistVisibility();
		await ListUtil._pSaveSublist();
		ListUtil._handleCallUpdateFn();
	},

	async pDoSublistRemoveAll (noSave) {
		ListUtil._pinned = {};
		ListUtil.sublist.removeAllItems();
		ListUtil.sublist.update();
		ListUtil._updateSublistVisibility();
		if (!noSave) await ListUtil._pSaveSublist();
		ListUtil._handleCallUpdateFn();
	},

	isSublisted: (index, data) => {
		return ListUtil._getPinnedCount(index, data);
	},

	mapSelectedWithDeslect (list, mapFunc) {
		return list.getSelected()
			.map(it => {
				it.isSelected = false;
				mapFunc(it.ix);
			});
	},

	_handleCallUpdateFn: () => {
		if (ListUtil._sublistChangeFn) ListUtil._sublistChangeFn();
	},

	_hasLoadedState: false,
	async pLoadState () {
		if (ListUtil._hasLoadedState) return;
		ListUtil._hasLoadedState = true;
		try {
			const store = await StorageUtil.pGetForPage("sublist");
			if (store && store.items) {
				await ListUtil._pLoadSavedSublist(store.items);
			}
		} catch (e) {
			setTimeout(() => { throw e });
			await StorageUtil.pRemoveForPage("sublist");
		}
	},

	async _pLoadSavedSublist (items, additive) {
		if (!additive) await ListUtil.pDoSublistRemoveAll(true);

		const toLoad = items.map(it => {
			const item = Hist.getActiveListItem(it.h);
			if (item != null) {
				const out = {index: item.ix, addCount: Number(it.c)};
				if (ListUtil._customHashUnpackFn && it.customHashId) out.data = ListUtil._customHashUnpackFn(it.customHashId);
				return out;
			}
			return null;
		}).filter(it => it);

		// Do this in series to ensure sublist items are added before having their counts updated
		//  This only becomes a problem when there are duplicate items in the list, but as we're not finalizing, the
		//  performance implications are negligible.
		for (const it of toLoad) await ListUtil.pDoSublistAdd(it.index, false, it.addCount, it.data);
		await ListUtil._pFinaliseSublist(true);
	},

	async pGetSelectedSources () {
		let store;
		try {
			store = await StorageUtil.pGetForPage("sublist");
		} catch (e) {
			setTimeout(() => { throw e });
		}
		if (store && store.sources) return store.sources;
	},

	initGenericPinnable () {
		ContextUtil.doInitContextMenu(
			"list",
			ListUtil.handleGenericContextMenuClick,
			[
				"Popout",
				"Pin"
			]
		);
		ContextUtil.doInitContextMenu(
			"listSub",
			ListUtil.handleGenericSubContextMenuClick,
			[
				"Popout",
				"Unpin",
				"Clear Pins",
				null,
				"Roll on List",
				null,
				"Download JSON Data"
			]
		);
	},

	initGenericAddable () {
		ContextUtil.doInitContextMenu(
			"list",
			ListUtil.handleGenericMultiContextMenuClick,
			[
				"Popout",
				"Add"
			]
		);
		ContextUtil.doInitContextMenu(
			"listSub",
			ListUtil.handleGenericMultiSubContextMenuClick,
			[
				"Popout",
				"Remove",
				"Clear List",
				null,
				"Roll on List",
				null,
				"Download JSON Data"
			]
		);
	},

	handleGenericContextMenuClick: (evt, ele, $invokedOn, $selectedMenu, _, selection) => {
		switch (Number($selectedMenu.data("ctx-id"))) {
			case 0: ListUtil._handleGenericContextMenuClick_pDoMassPopout(evt, ele, $invokedOn, selection); break;
			case 1:
				Promise.all(ListUtil._primaryLists.map(l => Promise.all(ListUtil.mapSelectedWithDeslect(l, (it) => ListUtil.isSublisted(it) ? Promise.resolve() : ListUtil.pDoSublistAdd(it)))))
					.then(async () => ListUtil._pFinaliseSublist());
				break;
		}
	},

	handleGenericSubContextMenuClick: (evt, ele, $invokedOn, $selectedMenu, _, selection) => {
		switch (Number($selectedMenu.data("ctx-id"))) {
			case 0: ListUtil._handleGenericContextMenuClick_pDoMassPopout(evt, ele, $invokedOn, selection); break;
			case 1: selection.forEach(item => ListUtil.pDoSublistRemove(item.ix)); break;
			case 2:
				ListUtil.pDoSublistRemoveAll();
				break;
			case 3:
				ListUtil._rollSubListed();
				break;
			case 4:
				ListUtil._handleJsonDownload();
				break;
		}
	},

	handleGenericMultiContextMenuClick: (evt, ele, $invokedOn, $selectedMenu, _, selection) => {
		switch (Number($selectedMenu.data("ctx-id"))) {
			case 0: ListUtil._handleGenericContextMenuClick_pDoMassPopout(evt, ele, $invokedOn, selection); break;
			case 1:
				Promise.all(ListUtil._primaryLists.map(l => Promise.all(ListUtil.mapSelectedWithDeslect(l, (it) => ListUtil.pDoSublistAdd(it)))))
					.then(async () => {
						await ListUtil._pFinaliseSublist();
						ListUtil.updateSelected();
					});
				break;
		}
	},

	handleGenericMultiSubContextMenuClick: (evt, ele, $invokedOn, $selectedMenu, _, selection) => {
		switch (Number($selectedMenu.data("ctx-id"))) {
			case 0: ListUtil._handleGenericContextMenuClick_pDoMassPopout(evt, ele, $invokedOn, selection); break;
			case 1: {
				selection.forEach(item => {
					if (item.data.customHashId) ListUtil.pDoSublistRemove(item.ix, {customHashId: item.data.customHashId});
					else ListUtil.pDoSublistRemove(item.ix);
				});
				break;
			}
			case 2:
				ListUtil.pDoSublistRemoveAll();
				break;
			case 3:
				ListUtil._rollSubListed();
				break;
			case 4:
				ListUtil._handleJsonDownload();
				break;
		}
	},

	async _handleGenericContextMenuClick_pDoMassPopout (evt, ele, $invokedOn, selection) {
		const page = UrlUtil.getCurrentPage();

		const elePos = ele.getBoundingClientRect();

		// do this in serial to have a "window cascade" effect
		for (let i = 0; i < selection.length; ++i) {
			const listItem = selection[i];
			const toRender = ListUtil._allItems[listItem.ix];
			const hash = UrlUtil.autoEncodeHash(toRender);
			const posOffset = Renderer.hover._BAR_HEIGHT * i;

			Renderer.hover.getShowWindow(
				Renderer.hover.$getHoverContent_stats(UrlUtil.getCurrentPage(), toRender),
				{mode: "exact", x: elePos.x + posOffset, y: elePos.y + posOffset},
				{
					title: toRender.name,
					isPermanent: true,
					pageUrl: `${page}#${hash}`
				}
			);
		}
	},

	_isRolling: false,
	_rollSubListed () {
		const timerMult = RollerUtil.randomise(125, 75);
		const timers = [0, 1, 1, 1, 1, 1, 1.5, 1.5, 1.5, 2, 2, 2, 2.5, 3, 4, -1] // last element is always sliced off
			.map(it => it * timerMult)
			.slice(0, -RollerUtil.randomise(4, 1));

		function generateSequence (array, length) {
			const out = [RollerUtil.rollOnArray(array)];
			for (let i = 0; i < length; ++i) {
				let next = RollerUtil.rollOnArray(array);
				while (next === out.last()) {
					next = RollerUtil.rollOnArray(array);
				}
				out.push(next);
			}
			return out;
		}

		if (!ListUtil._isRolling) {
			ListUtil._isRolling = true;
			const $eles = ListUtil.sublist.items
				.map(it => $(it.ele).find(`a`));

			if ($eles.length <= 1) {
				JqueryUtil.doToast({
					content: "Not enough entries to roll!",
					type: "danger"
				});
				return ListUtil._isRolling = false;
			}

			const $sequence = generateSequence($eles, timers.length);

			let total = 0;
			timers.map((it, i) => {
				total += it;
				setTimeout(() => {
					$sequence[i][0].click();
					if (i === timers.length - 1) ListUtil._isRolling = false;
				}, total);
			});
		}
	},

	_getDownloadName () {
		return `${UrlUtil.getCurrentPage().replace(".html", "")}-sublist`;
	},

	genericPinKeyMapper (pMapUid = ListUtil._pCustomHashHandler) {
		return Object.entries(ListUtil.getSublisted()).map(([id, it]) => {
			return Object.keys(it).map(k => {
				const it = ListUtil._allItems[id];
				return k === "_" ? Promise.resolve(MiscUtil.copy(it)) : pMapUid(it, k);
			}).reduce((a, b) => a.concat(b), []);
		}).reduce((a, b) => a.concat(b), []);
	},

	_handleJsonDownload () {
		if (ListUtil._pCustomHashHandler) {
			const promises = ListUtil.genericPinKeyMapper();

			Promise.all(promises).then(data => {
				data.forEach(cpy => DataUtil.cleanJson(cpy));
				DataUtil.userDownload(`${ListUtil._getDownloadName()}-data`, data);
			});
		} else {
			const out = ListUtil.getSublistedIds().map(id => {
				const cpy = JSON.parse(JSON.stringify(ListUtil._allItems[id]));
				DataUtil.cleanJson(cpy);
				return cpy;
			});
			DataUtil.userDownload(`${ListUtil._getDownloadName()}-data`, out);
		}
	},

	getCompleteFilterSources (it) {
		return it.otherSources ? [it.source].concat(it.otherSources.map(src => new FilterItem({item: src.source, isIgnoreRed: true}))) : it.source;
	},

	bindShowTableButton (id, title, dataList, colTransforms, filter, sorter) {
		$(`#${id}`).click("click", () => ListUtil.showTable(title, dataList, colTransforms, filter, sorter));
	},

	basicFilterGenerator () {
		const slIds = ListUtil.getSublistedIds();
		if (slIds.length) {
			const slIdSet = new Set(slIds);
			return slIdSet.has.bind(slIdSet);
		} else {
			const visibleIds = new Set(ListUtil.getVisibleIds());
			return visibleIds.has.bind(visibleIds);
		}
	},

	getVisibleIds () {
		return ListUtil._primaryLists.map(l => l.visibleItems.map(it => it.ix)).flat();
	},

	// FIXME move this out
	showTable (title, dataList, colTransforms, filter, sorter) {
		const $modal = $(`<div class="modal__outer dropdown-menu"/>`);
		const $wrpModal = $(`<div class="modal__wrp">`).appendTo($(`body`)).click(() => $wrpModal.remove());
		$modal.appendTo($wrpModal);
		const $modalInner = $(`<div class="modal__inner"/>`).appendTo($modal).click((evt) => evt.stopPropagation());

		const $pnlControl = $(`<div class="split my-3"/>`).appendTo($modalInner);
		const $pnlCols = $(`<div class="flex" style="align-items: center;"/>`).appendTo($pnlControl);
		Object.values(colTransforms).forEach((c, i) => {
			const $wrpCb = $(`<label class="flex-${c.flex || 1} px-2 mr-2 no-wrap inline-flex">${c.name} </label>`).appendTo($pnlCols);
			const $cbToggle = $(`<input type="checkbox" class="ml-1" data-name="${c.name}" checked>`)
				.click(() => {
					const toToggle = $modalInner.find(`.col_${i}`);
					if ($cbToggle.prop("checked")) {
						toToggle.show();
					} else {
						toToggle.hide();
					}
				})
				.appendTo($wrpCb);
		});
		const $pnlBtns = $(`<div/>`).appendTo($pnlControl);
		function getAsCsv () {
			const headers = $pnlCols.find(`input:checked`).map((i, e) => $(e).data("name")).get();
			const rows = $modalInner.find(`.data-row`).map((i, e) => $(e)).get().map($e => {
				return $e.children().filter(`td:visible`).map((j, d) => $(d).text().trim()).get();
			});
			return DataUtil.getCsv(headers, rows);
		}
		const $btnCsv = $(`<button class="btn btn-primary mr-3">Download CSV</button>`).click(() => {
			DataUtil.userDownloadText(`${title}.csv`, getAsCsv());
		}).appendTo($pnlBtns);
		const $btnCopy = $(`<button class="btn btn-primary">Copy CSV to Clipboard</button>`).click(async () => {
			await MiscUtil.pCopyTextToClipboard(getAsCsv());
			JqueryUtil.showCopiedEffect($btnCopy);
		}).appendTo($pnlBtns);
		$modalInner.append(`<hr>`);

		if (typeof filter === "object" && filter.generator) filter = filter.generator();

		let temp = `<table class="table-striped stats stats--book stats--book-large" style="width: 100%;"><thead><tr>${Object.values(colTransforms).map((c, i) => `<th class="col_${i} px-2" colspan="${c.flex || 1}">${c.name}</th>`).join("")}</tr></thead><tbody>`;
		const listCopy = JSON.parse(JSON.stringify(dataList)).filter((it, i) => filter ? filter(i) : it);
		if (sorter) listCopy.sort(sorter);
		listCopy.forEach(it => {
			temp += `<tr class="data-row">`;
			temp += Object.keys(colTransforms).map((k, i) => {
				const c = colTransforms[k];
				return `<td class="col_${i} px-2" colspan="${c.flex || 1}">${c.transform === true ? it[k] : c.transform(k[0] === "_" ? it : it[k])}</td>`;
			}).join("");
			temp += `</tr>`;
		});
		temp += `</tbody></table>`;
		$modalInner.append(temp);
	},

	addListShowHide () {
		$(`#filter-search-input-group`).find(`#reset`).before(`<button class="btn btn-default" id="hidesearch">Hide</button>`);
		$(`#contentwrapper`).prepend(`<div class="col-12" id="showsearch"><button class="btn btn-block btn-default btn-xs" type="button">Show Search</button><br></div>`);

		const $wrpList = $(`#listcontainer`);
		const $wrpBtnShowSearch = $("div#showsearch");
		const $btnHideSearch = $("button#hidesearch");
		$btnHideSearch.title("Hide Search Bar and Entry List");
		// collapse/expand search button
		$btnHideSearch.click(function () {
			$wrpList.hide();
			$wrpBtnShowSearch.show();
			$btnHideSearch.hide();
		});
		$wrpBtnShowSearch.find("button").click(function () {
			$wrpList.show();
			$wrpBtnShowSearch.hide();
			$btnHideSearch.show();
		});
	}
};

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
		displayFn: Parser.attAbvToFull,
		itemSortFn: null
	};
	return getFilterWithMergedOptions(baseOptions, options);
}

function getFilterWithMergedOptions (baseOptions, addOptions) {
	if (addOptions) Object.assign(baseOptions, addOptions); // merge in anything we get passed
	return new Filter(baseOptions);
}

/**
 * @param opts Options object.
 * @param opts.filters Array of filters to be included in this box.
 * @param [opts.isCompact] True if this box should have a compact/reduced UI.
 */
async function pInitFilterBox (opts) {
	opts.$iptSearch = $(`#lst__search`);
	opts.$wrpFormTop = $(`#filter-search-input-group`).title("Hotkey: f");
	opts.$btnReset = $(`#reset`);
	const filterBox = new FilterBox(opts);
	await filterBox.pDoLoadState();
	return filterBox;
}

// ENCODING/DECODING ===================================================================================================
UrlUtil = {
	encodeForHash (toEncode) {
		if (toEncode instanceof Array) return toEncode.map(it => `${it}`.toUrlified()).join(HASH_LIST_SEP);
		else return `${toEncode}`.toUrlified();
	},

	autoEncodeHash (obj) {
		const curPage = UrlUtil.getCurrentPage();
		const encoder = UrlUtil.URL_TO_HASH_BUILDER[curPage];
		if (!encoder) throw new Error(`No encoder found for page ${curPage}`);
		return encoder(obj);
	},

	getCurrentPage () {
		const pSplit = window.location.pathname.split("/");
		let out = pSplit[pSplit.length - 1];
		if (!out.toLowerCase().endsWith(".html")) out += ".html";
		return out;
	},

	/**
	 * All internal URL construction should pass through here, to ensure `static.5etools.com` is used when required.
	 *
	 * @param href the link
	 */
	link (href) {
		function addGetParam (curr) {
			if (href.includes("?")) return `${curr}&v=${VERSION_NUMBER}`;
			else return `${curr}?v=${VERSION_NUMBER}`;
		}

		if (!IS_VTT && IS_DEPLOYED) return addGetParam(`${DEPLOYED_STATIC_ROOT}${href}`);
		else if (IS_DEPLOYED) return addGetParam(href);
		return href;
	},

	unpackSubHash (subHash, unencode) {
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
			throw new Error(`Badly formatted subhash ${subHash}`)
		}
	},

	/**
	 * @param key The subhash key.
	 * @param values The subhash values.
	 * @param [opts] Options object.
	 * @param [opts.isEncodeBoth] If both the key and values should be URl encoded.
	 * @param [opts.isEncodeKey] If the key should be URL encoded.
	 * @param [opts.isEncodeValues] If the values should be URL encoded.
	 * @returns {string}
	 */
	packSubHash (key, values, opts) {
		opts = opts || {};
		if (opts.isEncodeBoth || opts.isEncodeKey) key = key.toUrlified();
		if (opts.isEncodeBoth || opts.isEncodeValues) values = values.map(it => it.toUrlified());
		return `${key}${HASH_SUB_KV_SEP}${values.join(HASH_SUB_LIST_SEP)}`;
	},

	categoryToPage (category) { return UrlUtil.CAT_TO_PAGE[category]; },

	bindLinkExportButton (filterBox, $btn) {
		$btn = $btn || ListUtil.getOrTabRightButton(`btn-link-export`, `magnet`);
		$btn.addClass("btn-copy-effect")
			.off("click")
			.on("click", async evt => {
				let url = window.location.href;

				const parts = filterBox.getSubHashes();
				parts.unshift(url);

				if (evt.shiftKey && ListUtil.sublist) {
					const toEncode = JSON.stringify(ListUtil.getExportableSublist());
					const part2 = UrlUtil.packSubHash(ListUtil.SUB_HASH_PREFIX, [toEncode], {isEncodeBoth: true});
					parts.push(part2);
				}

				await MiscUtil.pCopyTextToClipboard(parts.join(HASH_PART_SEP));
				JqueryUtil.showCopiedEffect($btn);
			})
			.title("Get Link to Filters (SHIFT adds List)")
	},

	mini: {
		compress (primitive) {
			const type = typeof primitive;
			if (primitive == null) return `x`;
			switch (type) {
				case "boolean": return `b${Number(primitive)}`;
				case "number": return `n${primitive}`;
				case "string": return `s${primitive.toUrlified()}`;
				default: throw new Error(`Unhandled type "${type}"`);
			}
		},

		decompress (raw) {
			const [type, data] = [raw.slice(0, 1), raw.slice(1)];
			switch (type) {
				case "x": return null;
				case "b": return !!Number(data);
				case "n": return Number(data);
				case "s": return String(data);
				default: throw new Error(`Unhandled type "${type}"`);
			}
		}
	},

	class: {
		getIndexedEntries (cls) {
			const out = [];
			let scFeatureI = 0;
			(cls.classFeatures || []).forEach((lvlFeatureList, ixLvl) => {
				// class features
				lvlFeatureList
					.filter(feature => !feature.gainSubclassFeature && feature.name !== "Ability Score Improvement") // don't add "you gain a subclass feature" or ASI's
					.forEach((feature, ixFeature) => {
						const name = Renderer.findName(feature);
						if (!name) { // tolerate missing names in homebrew
							if (BrewUtil.hasSourceJson(cls.source)) return;
							else throw new Error("Class feature had no name!");
						}
						out.push({
							_type: "classFeature",
							source: cls.source.source || cls.source,
							name,
							hash: `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls)}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({feature: {ixLevel: ixLvl, ixFeature: ixFeature}})}`,
							entry: feature,
							level: ixLvl + 1
						})
					});

				// subclass features
				const ixGainSubclassFeatures = lvlFeatureList.findIndex(feature => feature.gainSubclassFeature);
				if (~ixGainSubclassFeatures) {
					cls.subclasses.forEach(sc => {
						const features = ((sc.subclassFeatures || [])[scFeatureI] || []);
						sc.source = sc.source || cls.source; // default to class source if required
						const tempStack = [];
						features.forEach(feature => {
							const subclassFeatureHash = `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls)}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({subclass: sc, feature: {ixLevel: ixLvl, ixFeature: ixGainSubclassFeatures}})}`;
							const name = Renderer.findName(feature);
							if (!name) { // tolerate missing names in homebrew
								if (BrewUtil.hasSourceJson(sc.source)) return;
								else throw new Error("Subclass feature had no name!");
							}
							tempStack.push({
								_type: "subclassFeature",
								name,
								subclassName: sc.name,
								subclassShortName: sc.shortName,
								source: sc.source.source || sc.source,
								hash: subclassFeatureHash,
								entry: feature,
								level: ixLvl + 1
							});

							if (feature.entries) {
								const namedFeatureParts = feature.entries.filter(it => it.name);
								namedFeatureParts.forEach(it => {
									const lvl = ixLvl + 1;
									if (tempStack.find(existing => it.name === existing.name && lvl === existing.level)) return;
									tempStack.push({
										_type: "subclassFeaturePart",
										name: it.name,
										subclassName: sc.name,
										subclassShortName: sc.shortName,
										source: sc.source.source || sc.source,
										hash: subclassFeatureHash,
										entry: feature,
										level: lvl
									});
								});
							}
						});
						out.push(...tempStack);
					});
					scFeatureI++;
				} else if (ixGainSubclassFeatures.length > 1) {
					setTimeout(() => { throw new Error(`Multiple subclass features gained at level ${ixLvl + 1} for class "${cls.name}" from source "${cls.source}"!`) });
				}
			});
			return out;
		}
	},

	getStateKeySubclass (sc) { return Parser.stringToSlug(`sub ${sc.shortName || sc.name} ${Parser.sourceJsonToAbv(sc.source)}`); },

	/**
	 * @param opts Options object.
	 * @param [opts.subclass] Subclass (or object of the form `{shortName: "str", source: "str"}`)
	 * @param [opts.feature] Object of the form `{ixLevel: 0, ixFeature: 0}`
	 */
	getClassesPageStatePart (opts) {
		const stateParts = [
			opts.subclass ? `${UrlUtil.getStateKeySubclass(opts.subclass)}=${UrlUtil.mini.compress(true)}` : null,
			opts.feature ? `feature=${UrlUtil.mini.compress(`${opts.feature.ixLevel}-${opts.feature.ixFeature}`)}` : ""
		].filter(Boolean);
		return stateParts.length ? UrlUtil.packSubHash("state", stateParts) : "";
	}
};

UrlUtil.PG_BESTIARY = "bestiary.html";
UrlUtil.PG_SPELLS = "spells.html";
UrlUtil.PG_BACKGROUNDS = "backgrounds.html";
UrlUtil.PG_ITEMS = "items.html";
UrlUtil.PG_CLASSES = "classes.html";
UrlUtil.PG_CONDITIONS_DISEASES = "conditionsdiseases.html";
UrlUtil.PG_FEATS = "feats.html";
UrlUtil.PG_OPT_FEATURES = "optionalfeatures.html";
UrlUtil.PG_PSIONICS = "psionics.html";
UrlUtil.PG_RACES = "races.html";
UrlUtil.PG_REWARDS = "rewards.html";
UrlUtil.PG_VARIATNRULES = "variantrules.html";
UrlUtil.PG_ADVENTURE = "adventure.html";
UrlUtil.PG_ADVENTURES = "adventures.html";
UrlUtil.PG_BOOK = "book.html";
UrlUtil.PG_BOOKS = "books.html";
UrlUtil.PG_DEITIES = "deities.html";
UrlUtil.PG_CULTS_BOONS = "cultsboons.html";
UrlUtil.PG_OBJECTS = "objects.html";
UrlUtil.PG_TRAPS_HAZARDS = "trapshazards.html";
UrlUtil.PG_QUICKREF = "quickreference.html";
UrlUtil.PG_MAKE_SHAPED = "makeshaped.html";
UrlUtil.PG_MANAGE_BREW = "managebrew.html";
UrlUtil.PG_MAKE_BREW = "makebrew.html";
UrlUtil.PG_DEMO_RENDER = "renderdemo.html";
UrlUtil.PG_TABLES = "tables.html";
UrlUtil.PG_VEHICLES = "vehicles.html";
UrlUtil.PG_CHARACTERS = "characters.html";
UrlUtil.PG_ACTIONS = "actions.html";
UrlUtil.PG_LANGUAGES = "languages.html";

UrlUtil.URL_TO_HASH_BUILDER = {};
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS_DISEASES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OPT_FEATURES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_PSIONICS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_REWARDS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VARIATNRULES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ADVENTURE] = (it) => UrlUtil.encodeForHash(it.id);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BOOK] = (it) => UrlUtil.encodeForHash(it.id);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_DEITIES] = (it) => UrlUtil.encodeForHash([it.name, it.pantheon, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CULTS_BOONS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OBJECTS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TRAPS_HAZARDS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TABLES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VEHICLES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ACTIONS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_LANGUAGES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);

UrlUtil.CAT_TO_PAGE = {};
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CREATURE] = UrlUtil.PG_BESTIARY;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SPELL] = UrlUtil.PG_SPELLS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_BACKGROUND] = UrlUtil.PG_BACKGROUNDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ITEM] = UrlUtil.PG_ITEMS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CLASS] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CLASS_FEATURE] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SUBCLASS] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SUBCLASS_FEATURE] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CONDITION] = UrlUtil.PG_CONDITIONS_DISEASES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_FEAT] = UrlUtil.PG_FEATS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ELDRITCH_INVOCATION] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_METAMAGIC] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_MANEUVER_BATTLEMASTER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_MANEUVER_CAVALIER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ARCANE_SHOT] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_OPTIONAL_FEATURE_OTHER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_FIGHTING_STYLE] = UrlUtil.PG_OPT_FEATURES;
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
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_TABLE] = UrlUtil.PG_TABLES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_TABLE_GROUP] = UrlUtil.PG_TABLES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_VEHICLE] = UrlUtil.PG_VEHICLES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_PACT_BOON] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ELEMENTAL_DISCIPLINE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ARTIFICER_INFUSION] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SHIP_UPGRADE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_INFERNAL_WAR_MACHINE_UPGRADE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ONOMANCY_RESONANT] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_RUNE_KNIGHT_RUNE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ALCHEMICAL_FORMULA] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_MANEUVER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ACTION] = UrlUtil.PG_ACTIONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_LANGUAGE] = UrlUtil.PG_LANGUAGES;

if (!IS_DEPLOYED && !IS_VTT && typeof window !== "undefined") {
	// for local testing, hotkey to get a link to the current page on the main site
	window.addEventListener("keypress", (e) => {
		if (noModifierKeys(e) && typeof d20 === "undefined") {
			if (e.key === "#") {
				const spl = window.location.href.split("/");
				window.prompt("Copy to clipboard: Ctrl+C, Enter", `https://noads.5e.tools/${spl[spl.length - 1]}`);
			}
		}
	});
}

// SORTING =============================================================================================================
SortUtil = {
	ascSort: (a, b) => {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}

		return SortUtil._ascSort(a, b);
	},

	ascSortProp: (prop, a, b) => { return SortUtil.ascSort(a[prop], b[prop]); },

	ascSortLower: (a, b) => {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}

		return SortUtil._ascSort(a.toLowerCase(), b.toLowerCase());
	},

	ascSortLowerSafe (a, b) { return SortUtil.ascSortLower(a || "", b || ""); },

	ascSortLowerProp: (prop, a, b) => { return SortUtil.ascSortLower(a[prop], b[prop]); },

	// warning: slow
	ascSortNumericalSuffix (a, b) {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}

		function popEndNumber (str) {
			const spl = str.split(" ");
			return spl.last().isNumeric() ? [spl.slice(0, -1).join(" "), Number(spl.last().replace(Parser._numberCleanRegexp, ""))] : [spl.join(" "), 0];
		}

		const [aStr, aNum] = popEndNumber(a.item || a);
		const [bStr, bNum] = popEndNumber(b.item || b);
		const initialSort = SortUtil.ascSort(aStr, bStr);
		if (initialSort) return initialSort;
		return SortUtil.ascSort(aNum, bNum);
	},

	_ascSort: (a, b) => {
		if (b === a) return 0;
		return b < a ? 1 : -1;
	},

	ascSortDate (a, b) {
		return b.getTime() - a.getTime();
	},

	ascSortDateString (a, b) {
		return SortUtil.ascSortDate(new Date(a || "1970-01-0"), new Date(b || "1970-01-0"));
	},

	compareListNames (a, b) { return SortUtil._ascSort(a.name.toLowerCase(), b.name.toLowerCase()); },

	listSort (a, b, opts) {
		opts = opts || {sortBy: "name"};
		if (opts.sortBy === "name") return SortUtil.compareListNames(a, b);
		else return SortUtil._compareByOrDefault_compareByOrDefault(a, b, opts.sortBy);
	},

	_listSort_compareBy (a, b, sortBy) {
		const aValue = typeof a.values[sortBy] === "string" ? a.values[sortBy].toLowerCase() : a.values[sortBy];
		const bValue = typeof b.values[sortBy] === "string" ? b.values[sortBy].toLowerCase() : b.values[sortBy];

		return SortUtil._ascSort(aValue, bValue);
	},

	_compareByOrDefault_compareByOrDefault (a, b, sortBy) {
		return SortUtil._listSort_compareBy(a, b, sortBy) || SortUtil.compareListNames(a, b);
	},

	/**
	 * "Special Equipment" first, then alphabetical
	 */
	_MON_TRAIT_ORDER: [
		"special equipment",
		"shapechanger"
	],
	monTraitSort: (a, b) => {
		if (!a && !b) return 0;
		const aClean = a.toLowerCase().trim();
		const bClean = b.toLowerCase().trim();

		const ixA = SortUtil._MON_TRAIT_ORDER.indexOf(aClean);
		const ixB = SortUtil._MON_TRAIT_ORDER.indexOf(bClean);
		if (~ixA && ~ixB) return ixA - ixB;
		else if (~ixA) return -1;
		else if (~ixB) return 1;
		else return SortUtil.ascSort(aClean, bClean);
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
	},

	ascSortCr (a, b) {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}
		// always put unknown values last
		if (a === "Unknown" || a === undefined) a = "999";
		if (b === "Unknown" || b === undefined) b = "999";
		return SortUtil.ascSort(Parser.crToNumber(a), Parser.crToNumber(b));
	},

	ascSortAtts (a, b) {
		const aSpecial = a === "special";
		const bSpecial = b === "special";
		return aSpecial && bSpecial ? 0 : aSpecial ? 1 : bSpecial ? -1 : Parser.ABIL_ABVS.indexOf(a) - Parser.ABIL_ABVS.indexOf(b);
	},

	initBtnSortHandlers ($wrpBtnsSort, list) {
		function addCaret ($btnSort, direction) {
			$wrpBtnsSort.find(".caret").removeClass("caret");
			$btnSort.find(".caret_wrp").addClass("caret").toggleClass("caret--reverse", direction === "asc");
		}

		const $btnSort = $wrpBtnsSort.find(`.sort[data-sort="${list.sortBy}"]`);
		addCaret($btnSort, list.sortDir);

		$wrpBtnsSort.find(".sort").each((i, e) => {
			const $btnSort = $(e);
			$btnSort.click(evt => {
				evt.stopPropagation();
				const direction = list.sortDir === "asc" ? "desc" : "asc";
				addCaret($btnSort, direction);
				list.sort($btnSort.data("sort"), direction);
			});
		});
	}
};

// JSON LOADING ========================================================================================================
DataUtil = {
	_loading: {},
	_loaded: {},
	_merging: {},
	_merged: {},

	async _pLoad (url) {
		if (DataUtil._loading[url]) {
			await DataUtil._loading[url];
			return DataUtil._loaded[url];
		}

		DataUtil._loading[url] = new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();
			request.open("GET", url, true);
			request.overrideMimeType("application/json");
			request.onload = function () {
				try {
					DataUtil._loaded[url] = JSON.parse(this.response);
					resolve();
				} catch (e) {
					reject(new Error(`Could not parse JSON from ${url}: ${e.message}`));
				}
			};
			request.onerror = (e) => reject(new Error(`Error during JSON request: ${e.target.status}`));
			request.send();
		});

		await DataUtil._loading[url];
		return DataUtil._loaded[url];
	},

	async loadJSON (url, ...otherData) {
		const procUrl = UrlUtil.link(url);

		let ident = procUrl;
		let data;
		try {
			data = await DataUtil._pLoad(procUrl);
		} catch (e) {
			setTimeout(() => { throw e; })
		}

		// Fallback to the un-processed URL
		if (!data) {
			ident = url;
			data = await DataUtil._pLoad(url);
		}

		await DataUtil.pDoMetaMerge(ident, data);

		return data;
	},

	async pDoMetaMerge (ident, data, options) {
		DataUtil._merging[ident] = DataUtil._merging[ident] || DataUtil._pDoMetaMerge(ident, data, options);
		await DataUtil._merging[ident];
		return DataUtil._merged[ident];
	},

	async _pDoMetaMerge (ident, data, options) {
		if (data._meta) {
			if (data._meta.dependencies) {
				await Promise.all(Object.entries(data._meta.dependencies).map(async ([prop, sources]) => {
					if (!data[prop]) return; // if e.g. monster dependencies are declared, but there are no monsters to merge with, bail out

					const toLoads = await Promise.all(sources.map(async source => DataUtil.pGetLoadableByMeta(prop, source)));
					const dependencyData = await Promise.all(toLoads.map(toLoad => DataUtil.loadJSON(toLoad)));
					const flatDependencyData = dependencyData.map(dd => dd[prop]).flat();
					await Promise.all(data[prop].map(async entry => {
						if (entry._copy) {
							switch (prop) {
								case "monster": return DataUtil.monster.pMergeCopy(flatDependencyData, entry, options);
								case "spell": return DataUtil.spell.pMergeCopy(flatDependencyData, entry, options);
								default: throw new Error(`No dependency _copy merge strategy specified for property "${prop}"`);
							}
						}
					}));
				}));
				delete data._meta.dependencies;
			}

			if (data._meta.internalCopies) {
				Promise.all(data._meta.internalCopies.map(async prop => {
					if (!data[prop]) return;

					await Promise.all(data[prop].map(async entry => {
						if (entry._copy) {
							switch (prop) {
								case "monster": return DataUtil.monster.pMergeCopy(data[prop], entry, options);
								case "spell": return DataUtil.spell.pMergeCopy(data[prop], entry, options);
								case "item": return DataUtil.item.pMergeCopy(data[prop], entry, options);
								case "background": return DataUtil.background.pMergeCopy(data[prop], entry, options);
								case "race": return DataUtil.race.pMergeCopy(data[prop], entry, options);
								default: throw new Error(`No internal _copy merge strategy specified for property "${prop}"`);
							}
						}
					}));
				}));
				delete data._meta.internalCopies;
			}
		}

		if (data._meta && data._meta.otherSources) {
			await Promise.all(Object.entries(data._meta.otherSources).map(async ([prop, sources]) => {
				const toLoads = await Promise.all(Object.entries(sources).map(async ([source, findWith]) => ({
					findWith,
					url: await DataUtil.pGetLoadableByMeta(prop, source)
				})));

				const additionalData = await Promise.all(toLoads.map(async ({findWith, url}) => ({findWith, sourceData: await DataUtil.loadJSON(url)})));

				additionalData.forEach(dataAndSource => {
					const findWith = dataAndSource.findWith;
					const ad = dataAndSource.sourceData;
					const toAppend = ad[prop].filter(it => it.otherSources && it.otherSources.find(os => os.source === findWith));
					if (toAppend.length) data[prop] = (data[prop] || []).concat(toAppend);
				});
			}));
			delete data._meta.otherSources;
		}
		DataUtil._merged[ident] = data;
	},

	userDownload (filename, data) {
		if (typeof data !== "string") data = JSON.stringify(data, null, "\t");
		const a = document.createElement("a");
		const t = new Blob([data], {type: "text/json"});
		a.href = URL.createObjectURL(t);
		a.download = `${filename}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	},

	getCleanFilename (filename) {
		return filename.replace(/[^-_a-zA-Z0-9]/g, "_");
	},

	getCsv (headers, rows) {
		function escapeCsv (str) {
			return `"${str.replace(/"/g, `""`).replace(/ +/g, " ").replace(/\n\n+/gi, "\n\n")}"`;
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

	pUserUpload () {
		return new Promise(resolve => {
			const $iptAdd = $(`<input type="file" accept=".json" style="position: fixed; top: -100px; left: -100px; display: none;">`).on("change", (evt) => {
				const input = evt.target;

				const reader = new FileReader();
				reader.onload = () => {
					const text = reader.result;
					const json = JSON.parse(text);
					resolve(json);
				};

				reader.readAsText(input.files[0]);
			}).appendTo($(`body`));
			$iptAdd.click();
		});
	},

	cleanJson (cpy) {
		cpy.name = cpy._displayName || cpy.name;
		DataUtil.__cleanJsonObject(cpy);
		return cpy;
	},

	__cleanJsonObject (obj) {
		if (obj == null) return obj;
		if (typeof obj === "object") {
			if (obj instanceof Array) {
				obj.forEach(it => DataUtil.__cleanJsonObject(it));
			} else {
				Object.entries(obj).forEach(([k, v]) => {
					if (k.startsWith("_") || k === "customHashId") delete obj[k];
					else DataUtil.__cleanJsonObject(v);
				});
			}
		}
	},

	async pGetLoadableByMeta (key, value) {
		// TODO in future, allow value to be e.g. a string (assumed to be an official data's source); an object e.g. `{type: external, url: <>}`,...
		switch (key) {
			case "monster": {
				const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/index.json`);
				if (!index[value]) throw new Error(`Bestiary index did not contain source "${value}"`);
				return `${Renderer.get().baseUrl}data/bestiary/${index[value]}`;
			}
			case "spell": {
				const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/spells/index.json`);
				if (!index[value]) throw new Error(`Spell index did not contain source "${value}"`);
				return `${Renderer.get().baseUrl}data/spells/${index[value]}`;
			}
			default: throw new Error(`Could not get loadable URL for \`${JSON.stringify({key, value})}\``);
		}
	},

	generic: {
		async _pMergeCopy (impl, page, entryList, entry, options) {
			if (entry._copy) {
				const hash = UrlUtil.URL_TO_HASH_BUILDER[page](entry._copy);
				const it = impl._mergeCache[hash] || DataUtil.generic._pMergeCopy_search(impl, page, entryList, entry);
				if (!it) return;
				return DataUtil.generic._pApplyCopy(impl, MiscUtil.copy(it), entry, options);
			}
		},

		_pMergeCopy_search (impl, page, entryList, entry) {
			return entryList.find(it => {
				impl._mergeCache[UrlUtil.URL_TO_HASH_BUILDER[page](it)] = it;
				return it.name === entry._copy.name && it.source === entry._copy.source;
			});
		},

		async _pApplyCopy (impl, copyFrom, copyTo, options = {}) {
			if (options.doKeepCopy) copyTo.__copy = MiscUtil.copy(copyFrom);

			// convert everything to arrays
			function normaliseMods (obj) {
				Object.entries(obj._mod).forEach(([k, v]) => {
					if (!(v instanceof Array)) obj._mod[k] = [v];
				});
			}

			const copyMeta = copyTo._copy || {};

			if (copyMeta._mod) normaliseMods(copyMeta);

			// fetch and apply any external traits -- append them to existing copy mods where available
			let racials = null;
			if (copyMeta._trait) {
				const traitData = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/traits.json`);
				racials = traitData.trait.find(t => t.name.toLowerCase() === copyMeta._trait.name.toLowerCase() && t.source.toLowerCase() === copyMeta._trait.source.toLowerCase());
				if (!racials) throw new Error(`Could not find traits to apply with name "${copyMeta._trait.name}" and source "${copyMeta._trait.source}"`);
				racials = MiscUtil.copy(racials);

				if (racials.apply._mod) {
					normaliseMods(racials.apply);

					if (copyMeta._mod) {
						Object.entries(racials.apply._mod).forEach(([k, v]) => {
							if (copyMeta._mod[k]) copyMeta._mod[k] = copyMeta._mod[k].concat(v);
							else copyMeta._mod[k] = v;
						});
					} else copyMeta._mod = racials.apply._mod;
				}

				delete copyMeta._trait;
			}

			// copy over required values
			Object.keys(copyFrom).forEach(k => {
				if (copyTo[k] === null) return delete copyTo[k];
				if (copyTo[k] == null) {
					if (impl._MERGE_REQUIRES_PRESERVE[k]) {
						if (copyTo._copy._preserve && copyTo._copy._preserve[k]) copyTo[k] = copyFrom[k];
					} else copyTo[k] = copyFrom[k];
				}
			});

			// apply any root racial properties after doing base copy
			if (racials && racials.apply._root) Object.entries(racials.apply._root).forEach(([k, v]) => copyTo[k] = v);

			// mod helpers /////////////////
			function doEnsureArray (obj, prop) {
				if (!(obj[prop] instanceof Array)) obj[prop] = [obj[prop]];
			}

			function doMod_appendStr (modInfo, prop) {
				if (copyTo[prop]) copyTo[prop] = `${copyTo[prop]}${modInfo.joiner || ""}${modInfo.str}`;
				else copyTo[prop] = modInfo.str;
			}

			function doMod_replaceTxt (modInfo, prop) {
				const re = new RegExp(modInfo.replace, `g${modInfo.flags || ""}`);
				if (copyTo[prop]) {
					copyTo[prop].forEach(it => {
						if (it.entries) it.entries = JSON.parse(JSON.stringify(it.entries).replace(re, modInfo.with));
						if (it.headerEntries) it.headerEntries = JSON.parse(JSON.stringify(it.headerEntries).replace(re, modInfo.with));
						if (it.footerEntries) it.footerEntries = JSON.parse(JSON.stringify(it.footerEntries).replace(re, modInfo.with));
					});
				}
			}

			function doMod_prependArr (modInfo, prop) {
				doEnsureArray(modInfo, "items");
				copyTo[prop] = copyTo[prop] ? modInfo.items.concat(copyTo[prop]) : modInfo.items
			}

			function doMod_appendArr (modInfo, prop) {
				doEnsureArray(modInfo, "items");
				copyTo[prop] = copyTo[prop] ? copyTo[prop].concat(modInfo.items) : modInfo.items
			}

			function doMod_replaceArr (modInfo, prop, isThrow = true) {
				doEnsureArray(modInfo, "items");

				if (!copyTo[prop]) {
					if (isThrow) throw new Error(`Could not find "${prop}" array`);
					return false;
				}

				let ixOld;
				if (modInfo.replace.regex) {
					const re = new RegExp(modInfo.replace.regex, modInfo.replace.flags || "");
					ixOld = copyTo[prop].findIndex(it => it.name ? re.test(it.name) : typeof it === "string" ? re.test(it) : false);
				} else if (modInfo.replace.index != null) {
					ixOld = modInfo.replace.index;
				} else {
					ixOld = copyTo[prop].findIndex(it => it.name ? it.name === modInfo.replace : it === modInfo.replace);
				}

				if (~ixOld) {
					copyTo[prop].splice(ixOld, 1, ...modInfo.items);
					return true;
				} else if (isThrow) throw new Error(`Could not find "${prop}" item with name "${modInfo.replace}" to replace`);
				return false;
			}

			function doMod_replaceOrAppendArr (modInfo, prop) {
				const didReplace = doMod_replaceArr(modInfo, prop, false);
				if (!didReplace) doMod_appendArr(modInfo, prop);
			}

			function doMod_insertArr (modInfo, prop) {
				doEnsureArray(modInfo, "items");
				if (!copyTo[prop]) throw new Error(`Could not find "${prop}" array`);
				copyTo[prop].splice(modInfo.index, 0, ...modInfo.items);
			}

			function doMod_removeArr (modInfo, prop) {
				if (modInfo.names) {
					doEnsureArray(modInfo, "names");
					modInfo.names.forEach(nameToRemove => {
						const ixOld = copyTo[prop].findIndex(it => it.name === nameToRemove);
						if (~ixOld) copyTo[prop].splice(ixOld, 1);
						else throw new Error(`Could not find "${prop}" item with name "${nameToRemove}" to remove`);
					});
				} else if (modInfo.items) {
					doEnsureArray(modInfo, "items");
					modInfo.items.forEach(itemToRemove => {
						const ixOld = copyTo[prop].findIndex(it => it === itemToRemove);
						if (~ixOld) copyTo[prop].splice(ixOld, 1);
						else throw new Error(`Could not find "${prop}" item "${itemToRemove}" to remove`);
					});
				} else throw new Error(`One of "names" or "items" must be provided!`)
			}

			function doMod_calculateProp (modInfo, prop) {
				copyTo[prop] = copyTo[prop] || {};
				const toExec = modInfo.formula.replace(/<\$([^$]+)\$>/g, (...m) => {
					switch (m[1]) {
						case "prof_bonus": return Parser.crToPb(copyTo.cr);
						case "dex_mod": return Parser.getAbilityModNumber(copyTo.dex);
						default: throw new Error(`Unknown variable "${m[1]}"`);
					}
				});
				// eslint-disable-next-line no-eval
				copyTo[prop][modInfo.prop] = eval(toExec);
			}

			function doMod_scalarAddProp (modInfo, prop) {
				function applyTo (k) {
					const out = Number(copyTo[prop][k]) + modInfo.scalar;
					const isString = typeof copyTo[prop][k] === "string";
					copyTo[prop][k] = isString ? `${out >= 0 ? "+" : ""}${out}` : out;
				}

				if (!copyTo[prop]) return;
				if (modInfo.prop === "*") Object.keys(copyTo[prop]).forEach(k => applyTo(k));
				else applyTo(modInfo.prop);
			}

			function doMod_scalarMultProp (modInfo, prop) {
				function applyTo (k) {
					let out = Number(copyTo[prop][k]) * modInfo.scalar;
					if (modInfo.floor) out = Math.floor(out);
					const isString = typeof copyTo[prop][k] === "string";
					copyTo[prop][k] = isString ? `${out >= 0 ? "+" : ""}${out}` : out;
				}

				if (!copyTo[prop]) return;
				if (modInfo.prop === "*") Object.keys(copyTo[prop]).forEach(k => applyTo(k));
				else applyTo(modInfo.prop);
			}

			function doMod_addSenses (modInfo) {
				doEnsureArray(modInfo, "senses");
				copyTo.senses = copyTo.senses || [];
				modInfo.senses.forEach(sense => {
					let found = false;
					for (let i = 0; i < copyTo.senses.length; ++i) {
						const m = new RegExp(`${sense.type} (\\d+)`, "i").exec(copyTo.senses[i]);
						if (m) {
							found = true;
							// if the creature already has a greater sense of this type, do nothing
							if (Number(m[1]) < sense.type) {
								copyTo.senses[i] = `${sense.type} ${sense.range} ft.`;
							}
							break;
						}
					}

					if (!found) copyTo.senses.push(`${sense.type} ${sense.range} ft.`);
				});
			}

			function doMod_addSkills (modInfo) {
				copyTo.skill = copyTo.skill || [];
				Object.entries(modInfo.skills).forEach(([skill, mode]) => {
					// mode: 1 = proficient; 2 = expert
					const total = mode * Parser.crToPb(copyTo.cr) + Parser.getAbilityModNumber(copyTo[Parser.skillToAbilityAbv(skill)]);
					const asText = total >= 0 ? `+${total}` : `-${total}`;
					if (copyTo.skill && copyTo.skill[skill]) {
						// update only if ours is larger (prevent reduction in skill score)
						if (Number(copyTo.skill[skill]) < total) copyTo.skill[skill] = asText;
					} else copyTo.skill[skill] = asText;
				});
			}

			function doMod_addSpells (modInfo) {
				if (!copyTo.spellcasting) throw new Error(`Creature did not have a spellcasting property!`);

				// TODO could accept a "position" or "name" parameter should spells need to be added to other spellcasting traits
				const spellcasting = copyTo.spellcasting[0];

				if (modInfo.spells) {
					const spells = spellcasting.spells;

					Object.keys(modInfo.spells).forEach(k => {
						if (!spells[k]) spells[k] = modInfo.spells[k];
						else {
							// merge the objects
							const spellCategoryNu = modInfo.spells[k];
							const spellCategoryOld = spells[k];
							Object.keys(spellCategoryNu).forEach(kk => {
								if (!spellCategoryOld[kk]) spellCategoryOld[kk] = spellCategoryNu[kk];
								else {
									if (typeof spellCategoryOld[kk] === "object") {
										if (spellCategoryOld[kk] instanceof Array) spellCategoryOld[kk] = spellCategoryOld[kk].concat(spellCategoryNu[kk]).sort(SortUtil.ascSortLower);
										else throw new Error(`Object at key ${kk} not an array!`);
									} else spellCategoryOld[kk] = spellCategoryNu[kk];
								}
							});
						}
					});
				}

				if (modInfo.will) {
					modInfo.will.forEach(sp => (modInfo.will = modInfo.will || []).push(sp));
				}

				if (modInfo.daily) {
					for (let i = 1; i <= 9; ++i) {
						const e = `${i}e`;

						spellcasting.daily = spellcasting.daily || {};

						if (modInfo.daily[i]) {
							modInfo.daily[i].forEach(sp => (spellcasting.daily[i] = spellcasting.daily[i] || []).push(sp));
						}

						if (modInfo.daily[e]) {
							modInfo.daily[e].forEach(sp => (spellcasting.daily[e] = spellcasting.daily[e] || []).push(sp));
						}
					}
				}
			}

			function doMod_replaceSpells (modInfo) {
				if (!copyTo.spellcasting) throw new Error(`Creature did not have a spellcasting property!`);

				// TODO could accept a "position" or "name" parameter should spells need to be added to other spellcasting traits
				const spellcasting = copyTo.spellcasting[0];

				const handleReplace = (curSpells, replaceMeta, k) => {
					doEnsureArray(replaceMeta, "with");

					const ix = curSpells[k].indexOf(replaceMeta.replace);
					if (~ix) {
						curSpells[k].splice(ix, 1, ...replaceMeta.with);
						curSpells[k].sort(SortUtil.ascSortLower);
					} else throw new Error(`Could not find spell "${replaceMeta.replace}" to replace`);
				};

				if (modInfo.spells) {
					const trait0 = spellcasting.spells;
					Object.keys(modInfo.spells).forEach(k => { // k is e.g. "4"
						if (trait0[k]) {
							const replaceMetas = modInfo.spells[k];
							const curSpells = trait0[k];
							replaceMetas.forEach(replaceMeta => handleReplace(curSpells, replaceMeta, "spells"));
						}
					});
				}

				// TODO should be extended  to handle all non-slot-based spellcasters
				if (modInfo.daily) {
					for (let i = 1; i <= 9; ++i) {
						const e = `${i}e`;

						if (modInfo.daily[i]) {
							modInfo.daily[i].forEach(replaceMeta => handleReplace(spellcasting.daily, replaceMeta, i));
						}

						if (modInfo.daily[e]) {
							modInfo.daily[e].forEach(replaceMeta => handleReplace(spellcasting.daily, replaceMeta, e));
						}
					}
				}
			}

			function doMod_scalarAddHit (modInfo, prop) {
				if (!copyTo[prop]) return;
				copyTo[prop] = JSON.parse(JSON.stringify(copyTo[prop]).replace(/{@hit ([-+]?\d+)}/g, (m0, m1) => `{@hit ${Number(m1) + modInfo.scalar}}`))
			}

			function doMod_scalarAddDc (modInfo, prop) {
				if (!copyTo[prop]) return;
				copyTo[prop] = JSON.parse(JSON.stringify(copyTo[prop]).replace(/{@dc (\d+)}/g, (m0, m1) => `{@dc ${Number(m1) + modInfo.scalar}}`));
			}

			function doMod_maxSize (modInfo) {
				const ixCur = Parser.SIZE_ABVS.indexOf(copyTo.size);
				const ixMax = Parser.SIZE_ABVS.indexOf(modInfo.max);
				if (ixCur < 0 || ixMax < 0) throw new Error(`Unhandled size!`);
				copyTo.size = Parser.SIZE_ABVS[Math.min(ixCur, ixMax)]
			}

			function doMod_scalarMultXp (modInfo) {
				function getOutput (input) {
					let out = input * modInfo.scalar;
					if (modInfo.floor) out = Math.floor(out);
					return out;
				}

				if (copyTo.cr.xp) copyTo.cr.xp = getOutput(copyTo.cr.xp);
				else {
					const curXp = Parser.crToXpNumber(copyTo.cr);
					if (!copyTo.cr.cr) copyTo.cr = {cr: copyTo.cr};
					copyTo.cr.xp = getOutput(curXp);
				}
			}

			function doMod (modInfos, ...properties) {
				function handleProp (prop) {
					modInfos.forEach(modInfo => {
						if (typeof modInfo === "string") {
							switch (modInfo) {
								case "remove": return delete copyTo[prop];
								default: throw new Error(`Unhandled mode: ${modInfo}`);
							}
						} else {
							switch (modInfo.mode) {
								case "appendStr": return doMod_appendStr(modInfo, prop);
								case "replaceTxt": return doMod_replaceTxt(modInfo, prop);
								case "prependArr": return doMod_prependArr(modInfo, prop);
								case "appendArr": return doMod_appendArr(modInfo, prop);
								case "replaceArr": return doMod_replaceArr(modInfo, prop);
								case "replaceOrAppendArr": return doMod_replaceOrAppendArr(modInfo, prop);
								case "insertArr": return doMod_insertArr(modInfo, prop);
								case "removeArr": return doMod_removeArr(modInfo, prop);
								case "calculateProp": return doMod_calculateProp(modInfo, prop);
								case "scalarAddProp": return doMod_scalarAddProp(modInfo, prop);
								case "scalarMultProp": return doMod_scalarMultProp(modInfo, prop);
								// bestiary specific
								case "addSenses": return doMod_addSenses(modInfo);
								case "addSkills": return doMod_addSkills(modInfo);
								case "addSpells": return doMod_addSpells(modInfo);
								case "replaceSpells": return doMod_replaceSpells(modInfo);
								case "scalarAddHit": return doMod_scalarAddHit(modInfo, prop);
								case "scalarAddDc": return doMod_scalarAddDc(modInfo, prop);
								case "maxSize": return doMod_maxSize(modInfo);
								case "scalarMultXp": return doMod_scalarMultXp(modInfo);
								default: throw new Error(`Unhandled mode: ${modInfo.mode}`);
							}
						}
					});
				}

				properties.forEach(prop => handleProp(prop));
				// special case for "no property" modifications, i.e. underscore-key'd
				if (!properties.length) handleProp();
			}

			// apply mods
			if (copyMeta._mod) {
				// pre-convert any dynamic text
				Object.entries(copyMeta._mod).forEach(([k, v]) => {
					copyMeta._mod[k] = JSON.parse(
						JSON.stringify(v)
							.replace(/<\$([^$]+)\$>/g, (...m) => {
								const parts = m[1].split("__");

								switch (parts[0]) {
									case "name": return copyTo.name;
									case "short_name":
									case "title_name": {
										return copyTo.isNpc ? copyTo.name.split(" ")[0] : `${parts[0] === "title_name" ? "The " : "the "}${copyTo.name.toLowerCase()}`;
									}
									case "spell_dc": {
										if (!Parser.ABIL_ABVS.includes(parts[1])) throw new Error(`Unknown ability score "${parts[1]}"`);
										return 8 + Parser.getAbilityModNumber(Number(copyTo[parts[1]])) + Parser.crToPb(copyTo.cr);
									}
									case "to_hit": {
										if (!Parser.ABIL_ABVS.includes(parts[1])) throw new Error(`Unknown ability score "${parts[1]}"`);
										const total = Parser.crToPb(copyTo.cr) + Parser.getAbilityModNumber(Number(copyTo[parts[1]]));
										return total >= 0 ? `+${total}` : total;
									}
									case "damage_mod": {
										if (!Parser.ABIL_ABVS.includes(parts[1])) throw new Error(`Unknown ability score "${parts[1]}"`);
										const total = Parser.getAbilityModNumber(Number(copyTo[parts[1]]));
										return total === 0 ? "" : total > 0 ? ` +${total}` : ` ${total}`;
									}
									case "damage_avg": {
										const replaced = parts[1].replace(/(str|dex|con|int|wis|cha)/gi, (...m2) => Parser.getAbilityModNumber(Number(copyTo[m2[0]])));
										const clean = replaced.replace(/[^-+/*0-9.,]+/g, "");
										// eslint-disable-next-line no-eval
										return Math.floor(eval(clean));
									}
									default: return m[0];
								}
							})
					);
				});

				Object.entries(copyMeta._mod).forEach(([prop, modInfos]) => {
					if (prop === "*") doMod(modInfos, "action", "reaction", "trait", "legendary", "variant", "spellcasting");
					else if (prop === "_") doMod(modInfos);
					else doMod(modInfos, prop);
				});
			}

			// add filter tag
			copyTo._isCopy = true;

			// cleanup
			delete copyTo._copy;
		}
	},

	monster: {
		_MERGE_REQUIRES_PRESERVE: {
			legendaryGroup: true,
			environment: true,
			soundClip: true,
			page: true,
			altArt: true,
			otherSources: true,
			variant: true,
			dragonCastingColor: true,
			srd: true
		},
		_mergeCache: {},
		async pMergeCopy (monList, mon, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.monster, UrlUtil.PG_BESTIARY, monList, mon, options);
		},

		async pPreloadMeta () {
			if (DataUtil.monster._isMetaLoaded) return;

			const meta = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/meta.json`);
			DataUtil.monster.populateMetaReference(meta);
			DataUtil.monster._isMetaLoaded = true;
		},

		async pLoadAll () {
			const [index, meta] = await Promise.all([
				DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/index.json`),
				DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/meta.json`)
			]);

			if (!DataUtil.monster._isMetaLoaded) {
				DataUtil.monster.populateMetaReference(meta);
				DataUtil.monster._isMetaLoaded = true;
			}

			const allData = await Promise.all(Object.entries(index).map(async ([source, file]) => {
				const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/${file}`);
				return data.monster.filter(it => it.source === source);
			}));
			return allData.flat();
		},

		_isMetaLoaded: false,
		metaGroupMap: {},
		getMetaGroup (mon) {
			if (!mon.legendaryGroup || !mon.legendaryGroup.source || !mon.legendaryGroup.name) return null;
			return (DataUtil.monster.metaGroupMap[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name];
		},
		populateMetaReference (data) {
			(data.legendaryGroup || []).forEach(it => {
				(DataUtil.monster.metaGroupMap[it.source] =
					DataUtil.monster.metaGroupMap[it.source] || {})[it.name] =
					DataUtil.monster.metaGroupMap[it.source][it.name] || it;
			});
		}
	},

	spell: {
		_MERGE_REQUIRES_PRESERVE: {
			page: true,
			otherSources: true,
			srd: true
		},
		_mergeCache: {},
		async pMergeCopy (spellList, spell, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.spell, UrlUtil.PG_SPELLS, spellList, spell, options);
		},

		async pLoadAll () {
			const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/spells/index.json`);
			const allData = await Promise.all(Object.entries(index).map(async ([source, file]) => {
				const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/spells/${file}`);
				return data.spell.filter(it => it.source === source);
			}));
			return allData.flat();
		}
	},

	item: {
		_MERGE_REQUIRES_PRESERVE: {
			lootTables: true,
			tier: true,
			page: true,
			otherSources: true,
			srd: true
		},
		_mergeCache: {},
		async pMergeCopy (itemList, item, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.item, UrlUtil.PG_ITEMS, itemList, item, options);
		}
	},

	background: {
		_MERGE_REQUIRES_PRESERVE: {
			page: true,
			otherSources: true,
			srd: true
		},
		_mergeCache: {},
		async pMergeCopy (bgList, bg, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.background, UrlUtil.PG_BACKGROUNDS, bgList, bg, options);
		}
	},

	race: {
		_MERGE_REQUIRES_PRESERVE: {
			subraces: true,
			page: true,
			otherSources: true,
			srd: true
		},
		_mergeCache: {},
		async pMergeCopy (raceList, race, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.race, UrlUtil.PG_RACES, raceList, race, options);
		}
	},

	class: {
		_pLoadingJson: null,
		_loadedJson: null,
		loadJSON: async function (baseUrl = "") {
			if (DataUtil.class._loadedJson) return DataUtil.class._loadedJson;

			DataUtil.class._pLoadingJson = (async () => {
				const index = await DataUtil.loadJSON(`${baseUrl}data/class/index.json`);
				const allData = await Promise.all(Object.values(index).map(it => DataUtil.loadJSON(`${baseUrl}data/class/${it}`)));
				DataUtil.class._loadedJson = allData.reduce((a, b) => ({class: a.class.concat(b.class)}), {class: []});
			})();
			await DataUtil.class._pLoadingJson;

			return DataUtil.class._loadedJson;
		}
	},

	deity: {
		doPostLoad: function (data) {
			const PRINT_ORDER = [
				SRC_PHB,
				SRC_DMG,
				SRC_SCAG,
				SRC_MTF,
				SRC_ERLW
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
		},

		loadJSON: async function (baseUrl = "") {
			const data = await DataUtil.loadJSON(`${baseUrl}data/deities.json`);
			DataUtil.deity.doPostLoad(data);
			return data;
		}
	},

	table: {
		async pLoadAll (baseUrl = "") {
			const datas = await Promise.all([`${baseUrl}data/generated/gendata-tables.json`, `${baseUrl}data/tables.json`].map(url => DataUtil.loadJSON(url)));
			const combined = {};
			datas.forEach(data => {
				Object.entries(data).forEach(([k, v]) => {
					if (combined[k] && combined[k] instanceof Array && v instanceof Array) combined[k] = combined[k].concat(v);
					else if (combined[k] == null) combined[k] = v;
					else throw new Error(`Could not merge keys for key "${k}"`);
				});
			});
			return combined;
		}
	},

	brew: {
		_getCleanUrlRoot (urlRoot) {
			if (urlRoot && urlRoot.trim()) {
				urlRoot = urlRoot.trim();
				if (!urlRoot.endsWith("/")) urlRoot = `${urlRoot}/`;
			} else urlRoot = `https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/`;
			return urlRoot;
		},

		async pLoadTimestamps (urlRoot) {
			urlRoot = DataUtil.brew._getCleanUrlRoot(urlRoot);
			return DataUtil.loadJSON(`${urlRoot}_generated/index-timestamps.json`);
		},

		async pLoadCollectionIndex (urlRoot) {
			urlRoot = DataUtil.brew._getCleanUrlRoot(urlRoot);
			return DataUtil.loadJSON(`${urlRoot}collection/index.json`);
		},

		getDirUrl (dir, urlRoot) {
			urlRoot = DataUtil.brew._getCleanUrlRoot(urlRoot);
			return `${urlRoot}_generated/index-dir-${dir}.json?t=${(new Date()).getTime()}`;
		}
	}
};

// ROLLING =============================================================================================================
RollerUtil = {
	isCrypto () {
		return typeof window !== "undefined" && typeof window.crypto !== "undefined";
	},

	randomise (max, min = 1) {
		if (min > max) return 0;
		if (max === min) return max;
		if (RollerUtil.isCrypto()) {
			return RollerUtil._randomise(min, max + 1);
		} else {
			return RollerUtil.roll(max) + min;
		}
	},

	rollOnArray (array) {
		return array[RollerUtil.randomise(array.length) - 1]
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
	 * @param fn funciton to call to generate random numbers
	 * @returns {number} rolled
	 */
	roll (max, fn = Math.random) {
		return Math.floor(fn() * max);
	},

	addListRollButton (isCompact) {
		const $btnRoll = $(`<button class="btn btn-default ${isCompact ? "px-2" : ""}" id="feelinglucky" title="Feeling Lucky?"><span class="glyphicon glyphicon-random"></span></button>`);
		$btnRoll.on("click", () => {
			const primaryLists = ListUtil.getPrimaryLists();
			if (primaryLists && primaryLists.length) {
				const allLists = primaryLists.filter(l => l.visibleItems.length);
				if (allLists.length) {
					const rollX = RollerUtil.roll(allLists.length);
					const list = allLists[rollX];
					const rollY = RollerUtil.roll(list.visibleItems.length);
					window.location.hash = $(list.visibleItems[rollY].ele).find(`a`).prop("hash");
				}
			}
		});

		$(`#filter-search-input-group`).find(`#reset`).before($btnRoll);
	},

	isRollCol (colLabel) {
		if (typeof colLabel !== "string") return false;
		if (/^{@dice [^}]+}$/.test(colLabel.trim())) return true;
		colLabel = Renderer.stripTags(colLabel);
		return !!Renderer.dice.lang.getTree3(colLabel);
	},

	_DICE_REGEX_STR: "((([1-9]\\d*)?d([1-9]\\d*)(\\s*?[-+×x*÷/]\\s*?(\\d,\\d|\\d)+(\\.\\d+)?)?))+?"
};
RollerUtil.DICE_REGEX = new RegExp(RollerUtil._DICE_REGEX_STR, "g");
RollerUtil.REGEX_DAMAGE_DICE = /(\d+)( \((?:{@dice |{@damage ))([-+0-9d ]*)(}\) [a-z]+( \([-a-zA-Z0-9 ]+\))?( or [a-z]+( \([-a-zA-Z0-9 ]+\))?)? damage)/gi;
RollerUtil.REGEX_DAMAGE_FLAT = /(Hit: |{@h})([0-9]+)( [a-z]+( \([-a-zA-Z0-9 ]+\))?( or [a-z]+( \([-a-zA-Z0-9 ]+\))?)? damage)/gi;

// STORAGE =============================================================================================================
// Dependency: localforage
StorageUtil = {
	_init: false,
	_initAsync: false,
	_fakeStorage: {},
	_fakeStorageAsync: {},

	getSyncStorage: () => {
		if (StorageUtil._init) {
			if (StorageUtil.__fakeStorage) return StorageUtil._fakeStorage;
			else return window.localStorage;
		}

		StorageUtil._init = true;

		try {
			return window.localStorage;
		} catch (e) {
			// if the user has disabled cookies, build a fake version
			StorageUtil.__fakeStorage = true;
			StorageUtil._fakeStorage = {
				isSyncFake: true,
				getItem: (k) => {
					return StorageUtil.__fakeStorage[k];
				},
				removeItem: (k) => {
					delete StorageUtil.__fakeStorage[k];
				},
				setItem: (k, v) => {
					StorageUtil.__fakeStorage[k] = v;
				}
			};
			return StorageUtil._fakeStorage;
		}
	},

	async getAsyncStorage () {
		if (StorageUtil._initAsync) {
			if (StorageUtil.__fakeStorageAsync) return StorageUtil._fakeStorageAsync;
			else return localforage;
		}

		StorageUtil._initAsync = true;

		const getInitFakeStorage = () => {
			StorageUtil.__fakeStorageAsync = {};
			StorageUtil._fakeStorageAsync = {
				pIsAsyncFake: true,
				async setItem (k, v) {
					StorageUtil.__fakeStorageAsync[k] = v;
				},
				async getItem (k) {
					return StorageUtil.__fakeStorageAsync[k];
				},
				async removeItem (k) {
					delete StorageUtil.__fakeStorageAsync[k];
				}
			};
			return StorageUtil._fakeStorageAsync;
		};

		if (typeof window !== "undefined") {
			try {
				// check if IndexedDB is available (i.e. not in Firefox private browsing)
				await new Promise((resolve, reject) => {
					const request = window.indexedDB.open("_test_db", 1);
					request.onerror = reject;
					request.onsuccess = resolve;
				});
				await localforage.setItem("_storage_check", true);
				return localforage;
			} catch (e) {
				return getInitFakeStorage();
			}
		} else return getInitFakeStorage();
	},

	// SYNC METHODS ////////////////////////////////////////////////////////////////////////////////////////////////////
	// Synchronous localStorage access, which should only be used for small amounts of data (metadata, config, etc)
	syncGet (key) {
		const rawOut = StorageUtil.getSyncStorage().getItem(key);
		if (rawOut && rawOut !== "undefined" && rawOut !== "null") return JSON.parse(rawOut);
		return null;
	},

	syncSet (key, value) {
		StorageUtil.getSyncStorage().setItem(key, JSON.stringify(value));
		StorageUtil._syncTrackKey(key)
	},

	syncRemove (key) {
		StorageUtil.getSyncStorage().removeItem(key);
		StorageUtil._syncTrackKey(key, true);
	},

	syncGetForPage (key) { return StorageUtil.syncGet(`${key}_${UrlUtil.getCurrentPage()}`); },
	syncSetForPage (key, value) { StorageUtil.syncSet(`${key}_${UrlUtil.getCurrentPage()}`, value); },

	isSyncFake () {
		return !!StorageUtil.getSyncStorage().isSyncFake
	},

	_syncTrackKey (key, isRemove) {
		const meta = StorageUtil.syncGet(StorageUtil._META_KEY) || {};
		if (isRemove) delete meta[key];
		else meta[key] = 1;
		StorageUtil.getSyncStorage().setItem(StorageUtil._META_KEY, JSON.stringify(meta));
	},

	syncGetDump () {
		const out = {};
		const meta = StorageUtil.syncGet(StorageUtil._META_KEY) || {};
		Object.entries(meta).filter(([key, isPresent]) => isPresent).forEach(([key]) => out[key] = StorageUtil.syncGet(key));
		return out;
	},

	syncSetFromDump (dump) {
		Object.entries(dump).forEach(([k, v]) => StorageUtil.syncSet(k, v));
	},
	// END SYNC METHODS ////////////////////////////////////////////////////////////////////////////////////////////////

	async pIsAsyncFake () {
		const storage = await StorageUtil.getAsyncStorage();
		return !!storage.pIsAsyncFake;
	},

	async pSet (key, value) {
		StorageUtil._pTrackKey(key);
		const storage = await StorageUtil.getAsyncStorage();
		return storage.setItem(key, value);
	},

	async pGet (key) {
		const storage = await StorageUtil.getAsyncStorage();
		return storage.getItem(key);
	},

	async pRemove (key) {
		StorageUtil._pTrackKey(key, true);
		const storage = await StorageUtil.getAsyncStorage();
		return storage.removeItem(key);
	},

	getPageKey (key, page) { return `${key}_${page || UrlUtil.getCurrentPage()}`; },
	async pGetForPage (key) { return StorageUtil.pGet(StorageUtil.getPageKey(key)); },
	async pSetForPage (key, value) { return StorageUtil.pSet(StorageUtil.getPageKey(key), value); },
	async pRemoveForPage (key) { return StorageUtil.pRemove(StorageUtil.getPageKey(key)); },

	async _pTrackKey (key, isRemove) {
		const storage = await StorageUtil.getAsyncStorage();
		const meta = (await StorageUtil.pGet(StorageUtil._META_KEY)) || {};
		if (isRemove) delete meta[key];
		else meta[key] = 1;
		storage.setItem(StorageUtil._META_KEY, meta);
	},

	async pGetDump () {
		const out = {};
		const meta = (await StorageUtil.pGet(StorageUtil._META_KEY)) || {};
		await Promise.all(Object.entries(meta).filter(([key, isPresent]) => isPresent).map(async ([key]) => out[key] = await StorageUtil.pGet(key)));
		return out;
	},

	async pSetFromDump (dump) {
		return Promise.all(Object.entries(dump).map(([k, v]) => StorageUtil.pSet(k, v)));
	}
};
StorageUtil._META_KEY = "_STORAGE_META_STORAGE";

// TODO transition cookie-like storage items over to this
SessionStorageUtil = {
	_fakeStorage: {},
	__storage: null,
	getStorage: () => {
		try {
			return window.sessionStorage;
		} catch (e) {
			// if the user has disabled cookies, build a fake version
			if (SessionStorageUtil.__storage) return SessionStorageUtil.__storage;
			else {
				return SessionStorageUtil.__storage = {
					isFake: true,
					getItem: (k) => {
						return SessionStorageUtil._fakeStorage[k];
					},
					removeItem: (k) => {
						delete SessionStorageUtil._fakeStorage[k];
					},
					setItem: (k, v) => {
						SessionStorageUtil._fakeStorage[k] = v;
					}
				};
			}
		}
	},

	isFake () {
		return SessionStorageUtil.getStorage().isSyncFake
	},

	setForPage: (key, value) => {
		SessionStorageUtil.set(`${key}_${UrlUtil.getCurrentPage()}`, value);
	},

	set (key, value) {
		SessionStorageUtil.getStorage().setItem(key, JSON.stringify(value));
	},

	getForPage: (key) => {
		return SessionStorageUtil.get(`${key}_${UrlUtil.getCurrentPage()}`);
	},

	get (key) {
		const rawOut = SessionStorageUtil.getStorage().getItem(key);
		if (rawOut && rawOut !== "undefined" && rawOut !== "null") return JSON.parse(rawOut);
		return null;
	},

	removeForPage: (key) => {
		SessionStorageUtil.remove(`${key}_${UrlUtil.getCurrentPage()}`)
	},

	remove (key) {
		SessionStorageUtil.getStorage().removeItem(key);
	}
};

// HOMEBREW ============================================================================================================
BrewUtil = {
	homebrew: null,
	homebrewMeta: null,
	_lists: null,
	_sourceCache: null,
	_filterBox: null,
	_sourceFilter: null,
	_pHandleBrew: null,
	_lockHandleBrewJson: null,

	/**
	 * @param options Options object.
	 * @param [options.list] List.
	 * @param [options.lists] Lists.
	 * @param [options.filterBox] Filter box.
	 * @param [options.sourceFilter] Source filter.
	 * @param [options.pHandleBrew] Brew handling function.
	 */
	bind (options) {
		// provide ref to List.js instance
		if (options.list) BrewUtil._lists = [options.list];
		else if (options.lists) BrewUtil._lists = options.lists;
		// provide ref to FilterBox and Filter instance
		if (options.filterBox) BrewUtil._filterBox = options.filterBox;
		if (options.sourceFilter) BrewUtil._sourceFilter = options.sourceFilter;
		// allow external source for handleBrew
		if (options.pHandleBrew !== undefined) this._pHandleBrew = options.pHandleBrew;
	},

	async pAddBrewData () {
		if (BrewUtil.homebrew) {
			return BrewUtil.homebrew;
		} else {
			try {
				const homebrew = await StorageUtil.pGet(HOMEBREW_STORAGE) || {};
				BrewUtil.homebrewMeta = StorageUtil.syncGet(HOMEBREW_META_STORAGE) || {sources: []};
				BrewUtil.homebrewMeta.sources = BrewUtil.homebrewMeta.sources || [];

				BrewUtil.homebrew = homebrew;

				BrewUtil._resetSourceCache();

				return BrewUtil.homebrew;
			} catch (e) {
				BrewUtil.pPurgeBrew(e);
			}
		}
	},

	async pPurgeBrew (error) {
		JqueryUtil.doToast({
			content: "Error when loading homebrew! Purged homebrew data. (See the log for more information.)",
			type: "danger"
		});
		await StorageUtil.pRemove(HOMEBREW_STORAGE);
		StorageUtil.syncRemove(HOMEBREW_META_STORAGE);
		BrewUtil.homebrew = null;
		window.location.hash = "";
		BrewUtil.homebrew = {};
		BrewUtil.homebrewMeta = {sources: []};
		if (error) setTimeout(() => { throw error; });
	},

	async pAddLocalBrewData (callbackFn = async (d, page) => BrewUtil.pDoHandleBrewJson(d, page, null)) {
		if (!IS_VTT && !IS_DEPLOYED) {
			const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}${JSON_HOMEBREW_INDEX}`);
			// auto-load from `homebrew/`, for custom versions of the site
			if (data.toImport.length) {
				const page = UrlUtil.getCurrentPage();
				const allData = await Promise.all(data.toImport.map(it => DataUtil.loadJSON(`homebrew/${it}`)));
				await Promise.all(allData.map(d => callbackFn(d, page)));
			}
		}
	},

	async _pRenderBrewScreen ($appendTo, isModal, cbGetBrewOnClose) {
		const page = UrlUtil.getCurrentPage();

		const $brewList = $(`<div class="manbrew__current_brew flex-col h-100"/>`);

		await BrewUtil._pRenderBrewScreen_pRefreshBrewList($brewList);

		const $iptAdd = $(`<input multiple type="file" accept=".json" style="display: none;">`)
			.change(evt => {
				const input = evt.target;

				let readIndex = 0;
				const reader = new FileReader();
				reader.onload = async () => {
					const json = JSON.parse(reader.result);

					await DataUtil.pDoMetaMerge(CryptUtil.uid(), json);

					await BrewUtil.pDoHandleBrewJson(json, page, BrewUtil._pRenderBrewScreen_pRefreshBrewList.bind(this, $brewList));

					if (input.files[readIndex]) reader.readAsText(input.files[readIndex++]);
					else $(evt.target).val(""); // reset the input
				};
				reader.readAsText(input.files[readIndex++]);
			});

		const $btnLoadFromUrl = $(`<button class="btn btn-default btn-sm mr-2">Load from URL</button>`)
			.click(async () => {
				const enteredUrl = await InputUiUtil.pGetUserString({title: "Homebrew URL"});
				if (!enteredUrl || !enteredUrl.trim()) return;

				let parsedUrl;
				try {
					parsedUrl = new URL(enteredUrl);
				} catch (e) {
					JqueryUtil.doToast({
						content: `The provided URL does not appear to be valid.`,
						type: "danger"
					});
					return;
				}
				BrewUtil.addBrewRemote(null, parsedUrl.href).catch(() => {
					JqueryUtil.doToast({
						content: "Could not load homebrew from the provided URL.",
						type: "danger"
					});
				});
			});

		const $btnGet = $(`<button class="btn btn-info btn-sm">Get Homebrew</button>`)
			.click(async () => {
				const $btnAll = $(`<button class="btn btn-default btn-xs manbrew__load_all" disabled title="(Excluding samples)">Add All</button>`);

				const $ulRows = $$`<ul class="list"><li><div class="lst__wrp-cells"><span style="font-style: italic;">Loading...</span></div></li></ul>`;

				const $iptSearch = $(`<input type="search" class="search manbrew__search form-control w-100" placeholder="Find homebrew...">`)
					.keydown(evt => {
						switch (evt.which) {
							case 13: { // enter
								return $ulRows.find(`li`).first().find(`.manbrew__load_from_url`).click()
							}
							case 40: { // down
								const firstItem = list.visibleItems[0];
								if (firstItem) firstItem.ele.focus();
							}
						}
					});

				const {$modalInner} = UiUtil.getShowModal({
					fullHeight: true,
					title: `Get Homebrew`,
					cbClose: () => {
						if (cbGetBrewOnClose) cbGetBrewOnClose();
					},
					isLarge: true,
					overlayColor: "transparent"
				});

				$$($modalInner)`
					<p><i>A list of homebrew available in the public repository. Click a name to load the homebrew, or view the source directly.<br>
					Contributions are welcome; see the <a href="https://github.com/TheGiddyLimit/homebrew/blob/master/README.md" target="_blank" rel="noopener noreferrer">README</a>, or stop by our <a href="https://discord.gg/nGvRCDs" target="_blank" rel="noopener noreferrer">Discord</a>.</i></p>
					<hr class="manbrew__hr">
					<div class="manbrew__load_all_wrp">${$btnAll}</div>
					${$iptSearch}
					<div class="filtertools manbrew__filtertools sortlabel btn-group lst__form-bottom">
						<button class="col-4 sort btn btn-default btn-xs" data-sort="name">Name</button>
						<button class="col-3 sort btn btn-default btn-xs" data-sort="author">Author</button>
						<button class="col-1-2 sort btn btn-default btn-xs" data-sort="category">Category</button>
						<button class="col-1-4 sort btn btn-default btn-xs" data-sort="modified">Modified</button>
						<button class="col-1-4 sort btn btn-default btn-xs" data-sort="added">Added</button>
						<button class="sort btn btn-default btn-xs" disabled>Source</button>
					</div>
					${$ulRows}`;

				// populate list
				function getBrewDirs () {
					switch (page) {
						case UrlUtil.PG_SPELLS: return ["spell"];
						case UrlUtil.PG_CLASSES: return ["class", "subclass"];
						case UrlUtil.PG_BESTIARY: return ["creature"];
						case UrlUtil.PG_BACKGROUNDS: return ["background"];
						case UrlUtil.PG_FEATS: return ["feat"];
						case UrlUtil.PG_OPT_FEATURES: return ["optionalfeature"];
						case UrlUtil.PG_RACES: return ["race", "subrace"];
						case UrlUtil.PG_OBJECTS: return ["object"];
						case UrlUtil.PG_TRAPS_HAZARDS: return ["trap", "hazard"];
						case UrlUtil.PG_DEITIES: return ["deity"];
						case UrlUtil.PG_ITEMS: return ["item", "magicvariant"];
						case UrlUtil.PG_REWARDS: return ["reward"];
						case UrlUtil.PG_PSIONICS: return ["psionic"];
						case UrlUtil.PG_VARIATNRULES: return ["variantrule"];
						case UrlUtil.PG_CONDITIONS_DISEASES: return ["condition", "disease"];
						case UrlUtil.PG_ADVENTURES: return ["adventure"];
						case UrlUtil.PG_BOOKS: return ["book"];
						case UrlUtil.PG_TABLES: return ["table"];
						case UrlUtil.PG_MAKE_SHAPED: return ["spell", "creature"];
						case UrlUtil.PG_MANAGE_BREW:
						case UrlUtil.PG_MAKE_BREW:
						case UrlUtil.PG_DEMO_RENDER: return BrewUtil._DIRS;
						case UrlUtil.PG_VEHICLES: return ["vehicle"];
						case UrlUtil.PG_ACTIONS: return ["action"];
						case UrlUtil.PG_CULTS_BOONS: return ["cult", "boon"];
						case UrlUtil.PG_LANGUAGES: return ["language"];
						default: throw new Error(`No homebrew directories defined for category ${page}`);
					}
				}

				let dataList;
				function fnSort (a, b, o) {
					a = dataList[a.ix];
					b = dataList[b.ix];

					if (o.sortBy === "name") return byName();
					if (o.sortBy === "author") return orFallback(SortUtil.ascSortLower, "_brewAuthor");
					if (o.sortBy === "category") return orFallback(SortUtil.ascSortLower, "_brewCat");
					if (o.sortBy === "added") return orFallback(SortUtil.ascSort, "_brewAdded");
					if (o.sortBy === "modified") return orFallback(SortUtil.ascSort, "_brewModified");

					function byName () { return SortUtil.ascSortLower(a._brewName, b._brewName); }
					function orFallback (func, prop) { return func(a[prop], b[prop]) || byName(); }
				}

				const urlRoot = await StorageUtil.pGet(`HOMEBREW_CUSTOM_REPO_URL`);
				const timestamps = await DataUtil.brew.pLoadTimestamps(urlRoot);
				const collectionIndex = await DataUtil.brew.pLoadCollectionIndex(urlRoot);
				const collectionFiles = (() => {
					const dirs = new Set(getBrewDirs().map(dir => BrewUtil._pRenderBrewScreen_dirToCat(dir)));
					return Object.keys(collectionIndex).filter(k => collectionIndex[k].find(it => dirs.has(it)));
				})();

				const toLoads = getBrewDirs().map(it => ({url: DataUtil.brew.getDirUrl(it, urlRoot), _cat: BrewUtil._pRenderBrewScreen_dirToCat(it)}));
				if (collectionFiles.length) toLoads.push({url: DataUtil.brew.getDirUrl("collection", urlRoot), _collection: true, _cat: "collection"});

				const jsonStack = (await Promise.all(toLoads.map(async toLoad => {
					const json = await DataUtil.loadJSON(toLoad.url);
					if (toLoad._collection) json.filter(it => it.name === "index.json" || !collectionFiles.includes(it.name)).forEach(it => it._brewSkip = true);
					json.forEach(it => it._cat = toLoad._cat);
					return json;
				}))).flat();

				const all = jsonStack.flat();
				all.forEach(it => {
					const cleanFilename = it.name.trim().replace(/\.json$/, "");
					const spl = cleanFilename.split(";").map(it => it.trim());
					if (spl.length > 1) {
						it._brewName = spl[1];
						it._brewAuthor = spl[0];
					} else {
						it._brewName = cleanFilename;
						it._brewAuthor = "";
					}
				});
				all.sort((a, b) => SortUtil.ascSortLower(a._brewName, b._brewName));

				const list = new List({
					$iptSearch,
					$wrpList: $ulRows,
					fnSort,
					isUseJquery: true
				});
				SortUtil.initBtnSortHandlers($modalInner.find(".manbrew__filtertools"), list);

				dataList = all.filter(it => !it._brewSkip);
				dataList.forEach((it, i) => {
					it._brewAdded = (timestamps[it.path] || {}).a || 0;
					it._brewModified = (timestamps[it.path] || {}).m || 0;
					it._brewCat = BrewUtil._pRenderBrewScreen_getDisplayCat(BrewUtil._pRenderBrewScreen_dirToCat(it._cat));

					const timestampAdded = it._brewAdded ? MiscUtil.dateToStr(new Date(it._brewAdded * 1000), true) : "";
					const timestampModified = it._brewModified ? MiscUtil.dateToStr(new Date(it._brewModified * 1000), true) : "";

					const $btnAdd = $(`<span class="col-4 bold manbrew__load_from_url pl-0 clickable"/>`)
						.text(it._brewName)
						.click(() => BrewUtil.addBrewRemote($btnAdd, it.download_url || "", true));

					const $li = $$`<li class="not-clickable lst--border lst__row--focusable" tabindex="1">
						<div class="lst__wrp-cells">
							${$btnAdd}
							<span class="col-3">${it._brewAuthor}</span>
							<span class="col-1-2 text-center">${it._brewCat}</span>
							<span class="col-1-4 text-center">${timestampModified}</span>
							<span class="col-1-4 text-center">${timestampAdded}</span>
							<span class="col-1 manbrew__source text-center pr-0"><a href="${it.download_url}" target="_blank" rel="noopener noreferrer">View Raw</a></span>
						</div>
					</li>`;

					$li.keydown(evt => {
						switch (evt.which) {
							case 13: { // enter
								return $btnAdd.click()
							}
							case 38: { // up
								const ixCur = list.visibleItems.indexOf(listItem);
								if (~ixCur) {
									const prevItem = list.visibleItems[ixCur - 1];
									if (prevItem) prevItem.ele.focus();
								} else {
									const firstItem = list.visibleItems[0];
									if (firstItem) firstItem.ele.focus();
								}
								return;
							}
							case 40: { // down
								const ixCur = list.visibleItems.indexOf(listItem);
								if (~ixCur) {
									const nxtItem = list.visibleItems[ixCur + 1];
									if (nxtItem) nxtItem.ele.focus();
								} else {
									const lastItem = list.visibleItems.last();
									if (lastItem) lastItem.ele.focus();
								}
							}
						}
					});

					const listItem = new ListItem(
						i,
						$li,
						it._brewName,
						{
							author: it._brewAuthor,
							category: it._brewCat,
							added: timestampAdded,
							modified: timestampAdded
						},
						{
							$btnAdd,
							isSample: it._brewAuthor.toLowerCase().startsWith("sample -")
						}
					);
					list.addItem(listItem);
				});

				list.init();

				ListUtil.bindEscapeKey(list, $iptSearch, true);

				$btnAll.prop("disabled", false).click(() => list.visibleItems.filter(it => !it.data.isSample).forEach(it => it.data.$btnAdd.click()));

				$iptSearch.focus();
			});

		const $btnCustomUrl = $(`<button class="btn btn-info btn-sm px-2" title="Set Custom Repository URL"><span class="glyphicon glyphicon-cog"/></button>`)
			.click(async () => {
				const customBrewUtl = await StorageUtil.pGet(`HOMEBREW_CUSTOM_REPO_URL`);

				const nxtUrl = await InputUiUtil.pGetUserString({
					title: "Homebrew Repository URL (Blank for Default)",
					default: customBrewUtl
				});

				if (nxtUrl == null) await StorageUtil.pRemove(`HOMEBREW_CUSTOM_REPO_URL`);
				else await StorageUtil.pSet(`HOMEBREW_CUSTOM_REPO_URL`, nxtUrl);
			});

		const $btnDelAll = isModal ? null : BrewUtil._$getBtnDeleteAll();

		const $wrpBtns = $$`<div class="flex-vh-center no-shrink mobile__flex-col">
			<div class="flex-v-center mobile__mb-2">
				<div class="flex-v-center btn-group mr-2">
					${$btnGet}
					${$btnCustomUrl}
				</div>
				<label role="button" class="btn btn-default btn-sm btn-file mr-2">Upload File${$iptAdd}</label>
				${$btnLoadFromUrl}
			</div>
			<div class="flex-v-center">
				<a href="https://github.com/TheGiddyLimit/homebrew" class="flex-v-center" target="_blank" rel="noopener noreferrer"><button class="btn btn-default btn-sm btn-file">Browse Source Repository</button></a>
				${$btnDelAll}
			</div>
		</div>`;

		if (isModal) {
			$$($appendTo)`
			<hr class="manbrew__hr no-shrink">
			${$brewList}
			<div class="mb-3 text-center no-shrink">${$wrpBtns}</div>
		`
		} else {
			$$($appendTo)`
			<div class="mb-3 text-center no-shrink">${$wrpBtns}</div>
			<hr class="manbrew__hr no-shrink">
			${$brewList}
		`
		}

		BrewUtil.addBrewRemote = async ($ele, jsonUrl, doUnescape) => {
			let cached;
			if ($ele) {
				cached = $ele.html();
				$ele.text("Loading...");
			}
			if (doUnescape) jsonUrl = jsonUrl.unescapeQuotes();
			const data = await DataUtil.loadJSON(`${jsonUrl}?${(new Date()).getTime()}`);
			await BrewUtil.pDoHandleBrewJson(data, page, BrewUtil._pRenderBrewScreen_pRefreshBrewList.bind(this, $brewList));
			if ($ele) {
				$ele.text("Done!");
				setTimeout(() => $ele.html(cached), 500);
			}
		};
	},

	_$getBtnDeleteAll (isModal) {
		return $(`<button class="btn ${isModal ? "btn-xs" : "btn-sm ml-2"} btn-danger">Delete All</button>`)
			.click(async () => {
				if (!window.confirm("Are you sure?")) return;
				await StorageUtil.pSet(HOMEBREW_STORAGE, {});
				StorageUtil.syncSet(HOMEBREW_META_STORAGE, {});
				window.location.hash = "";
				location.reload();
			});
	},

	async _pCleanSaveBrew () {
		const cpy = MiscUtil.copy(BrewUtil.homebrew);
		BrewUtil._STORABLE.forEach(prop => {
			(BrewUtil.homebrew[prop] || []).forEach(ent => {
				Object.keys(ent).filter(k => k.startsWith("_")).forEach(k => delete ent[k]);
			});
		});
		await StorageUtil.pSet(HOMEBREW_STORAGE, cpy);
	},

	async _pRenderBrewScreen_pDeleteSource ($brewList, source, doConfirm, isAllSources) {
		if (doConfirm && !window.confirm(`Are you sure you want to remove all homebrew${!isAllSources ? ` with${source ? ` source "${Parser.sourceJsonToFull(source)}"` : `out a source`}` : ""}?`)) return;

		const vetoolsSourceSet = new Set(BrewUtil._getActiveVetoolsSources().map(it => it.json));
		const isMatchingSource = (itSrc) => isAllSources || (itSrc === source || (source === undefined && !vetoolsSourceSet.has(itSrc) && !BrewUtil.hasSourceJson(itSrc)));

		await Promise.all(BrewUtil._getBrewCategories().map(async k => {
			const cat = BrewUtil.homebrew[k];
			const pDeleteFn = BrewUtil._getPDeleteFunction(k);
			const toDel = [];
			cat.filter(it => isMatchingSource(it.source)).forEach(it => toDel.push(it.uniqueId));
			await Promise.all(toDel.map(async uId => pDeleteFn(uId)));
		}));
		if (BrewUtil._lists) BrewUtil._lists.forEach(l => l.update());
		BrewUtil._persistHomebrewDebounced();
		BrewUtil.removeJsonSource(source);
		if (UrlUtil.getCurrentPage() === UrlUtil.PG_MAKE_SHAPED) removeBrewSource(source);
		// remove the source from the filters and re-render the filter box
		if (BrewUtil._sourceFilter) BrewUtil._sourceFilter.removeItem(source);
		if (BrewUtil._filterBox) BrewUtil._filterBox.render();
		await BrewUtil._pRenderBrewScreen_pRefreshBrewList($brewList);
		window.location.hash = "";
		if (BrewUtil._filterBox) BrewUtil._filterBox.fireChangeEvent();
	},

	async _pRenderBrewScreen_pRefreshBrewList ($brewList) {
		function showSourceManager (source, showAll) {
			const $wrpBtnDel = $(`<div class="flex-v-center"/>`);

			const {$modalInner, doClose} = UiUtil.getShowModal({
				fullHeight: true,
				title: `View/Manage ${source ? `Source Contents: ${Parser.sourceJsonToFull(source)}` : showAll ? "Entries from All Sources" : `Entries with No Source`}`,
				isLarge: true,
				overlayColor: "transparent",
				titleSplit: $wrpBtnDel
			});

			const $cbAll = $(`<input type="checkbox">`);
			const $ulRows = $$`<ul class="list"/>`;
			const $iptSearch = $(`<input type="search" class="search manbrew__search form-control w-100" placeholder="Search entries...">`);
			$$($modalInner)`
				${$iptSearch}
				<div class="filtertools manbrew__filtertools sortlabel btn-group">
					<button class="col-6 sort btn btn-default btn-xs" data-sort="name">Name</button>
					<button class="col-5 sort btn btn-default btn-xs" data-sort="category">Category</button>
					<label class="wrp-cb-all pr-0 flex-vh-center mb-0 h-100">${$cbAll}</label>
				</div>
				${$ulRows}`;

			let list;

			// populate list
			function populateList () {
				$ulRows.empty();

				list = new List({
					$iptSearch,
					$wrpList: $ulRows,
					fnSort: SortUtil.listSort
				});

				function mapCategoryEntry (cat, bru) {
					const out = {};
					out.name = bru.name;
					out.uniqueId = bru.uniqueId;
					out.extraInfo = "";
					switch (cat) {
						case "subclass":
							out.extraInfo = ` (${bru.class})`;
							break;
						case "subrace":
							out.extraInfo = ` (${(bru.race || {}).name})`;
							break;
						case "psionic":
							out.extraInfo = ` (${Parser.psiTypeToMeta(bru.type).short})`;
							break;
						case "itemProperty": {
							if (bru.entries) out.name = Renderer.findName(bru.entries);
							if (!out.name) out.name = bru.abbreviation;
							break;
						}
						case "adventureData":
						case "bookData": {
							const assocData = {
								"adventureData": "adventure",
								"bookData": "book"
							};
							out.name = (((BrewUtil.homebrew[assocData[cat]] || []).find(a => a.id === bru.id) || {}).name || bru.id);
						}
					}
					out.name = out.name || `(Unknown)`;
					return out;
				}

				const vetoolsSourceSet = new Set(BrewUtil._getActiveVetoolsSources().map(it => it.json));

				const isMatchingSource = (itSrc) => showAll || (itSrc === source || (source === undefined && !vetoolsSourceSet.has(itSrc) && !BrewUtil.hasSourceJson(itSrc)));
				BrewUtil._getBrewCategories().forEach(cat => {
					BrewUtil.homebrew[cat]
						.filter(it => isMatchingSource(it.source))
						.map(it => mapCategoryEntry(cat, it))
						.sort((a, b) => SortUtil.ascSort(a.name, b.name))
						.forEach((it, i) => {
							const dispCat = BrewUtil._pRenderBrewScreen_getDisplayCat(cat, true);

							const eleLi = $(`<li class="lst--border"><label class="mb-0 flex-v-center row">
									<span class="col-6 bold">${it.name}</span>
									<span class="col-5 text-center">${dispCat}${it.extraInfo}</span>
									<span class="pr-0 col-1 text-center"><input type="checkbox"></span>
								</label></li>`)[0];

							const listItem = new ListItem(
								i,
								eleLi,
								it.name,
								{
									category: dispCat,
									category_raw: cat
								},
								{uniqueId: it.uniqueId}
							);
							list.addItem(listItem);
						});
				});
				$ulRows.empty();

				list.init();
				if (!list.items.length) $ulRows.append(`<h5 class="text-center">No results found.</h5>`);
				ListUtil.bindEscapeKey(list, $iptSearch, true);
			}
			populateList();

			$cbAll.change(function () {
				const val = this.checked;
				list.items.forEach(it => $(it.ele).find(`input`).prop("checked", val));
			});
			$(`<button class="btn btn-danger btn-xs">Delete Selected</button>`).on("click", async () => {
				const toDel = list.items.filter(it => $(it.ele).find(`input`).prop("checked")).map(it => ({...it.values, ...it.data}));

				if (!toDel.length) return;
				if (!window.confirm("Are you sure?")) return;

				if (toDel.length === list.items.length) {
					await BrewUtil._pRenderBrewScreen_pDeleteSource($brewList, source, false, false);
					doClose();
				} else {
					await Promise.all(toDel.map(async it => {
						const pDeleteFn = BrewUtil._getPDeleteFunction(it.category_raw);
						await pDeleteFn(it.uniqueId);
					}));
					if (BrewUtil._lists) BrewUtil._lists.forEach(l => l.update());
					BrewUtil._persistHomebrewDebounced();
					populateList();
					await BrewUtil._pRenderBrewScreen_pRefreshBrewList($brewList);
					window.location.hash = "";
				}
			}).appendTo($wrpBtnDel);

			$iptSearch.focus();
		}

		$brewList.empty();
		if (BrewUtil.homebrew) {
			const $iptSearch = $(`<input type="search" class="search manbrew__search form-control" placeholder="Search active homebrew...">`);
			const $wrpList = $(`<ul class="list-display-only brew-list brew-list--target manbrew__list"></ul>`);
			const $ulGroup = $(`<ul class="list-display-only brew-list brew-list--groups no-shrink" style="height: initial;"></ul>`);

			const list = new List({$iptSearch, $wrpList, isUseJquery: true});

			const $lst = $$`
				<div class="flex-col h-100">
					${$iptSearch}
					<div class="filtertools manbrew__filtertools sortlabel btn-group lst__form-bottom">
						<button class="col-5 sort btn btn-default btn-xs" data-sort="source">Source</button>
						<button class="col-4 sort btn btn-default btn-xs" data-sort="authors">Authors</button>
						<button class="col-1 btn btn-default btn-xs" disabled>Origin</button>
						<button class="btn btn-default btn-xs" disabled>&nbsp;</button>
					</div>
					<div class="flex w-100 h-100 overflow-y-auto relative">${$wrpList}</div>
				</div>
			`.appendTo($brewList);
			$ulGroup.appendTo($brewList);
			SortUtil.initBtnSortHandlers($lst.find(".manbrew__filtertools"), list);

			const createButtons = (src, $row) => {
				const $btnViewManage = $(`<button class="btn btn-sm btn-default">View/Manage</button>`)
					.on("click", () => {
						showSourceManager(src.json, src._all);
					});

				const $btnDeleteAll = $(`<button class="btn btn-danger btn-sm"><span class="glyphicon glyphicon-trash"></span></button>`)
					.on("click", () => BrewUtil._pRenderBrewScreen_pDeleteSource($brewList, src.json, true, src._all));

				$$`<div class="flex-h-right flex-v-center btn-group">
					${$btnViewManage}
					${$btnDeleteAll}
				</div>`.appendTo($row);
			};

			const page = UrlUtil.getCurrentPage();
			const isSourceRelevantForCurrentPage = (source) => {
				const getPageCats = () => {
					switch (page) {
						case UrlUtil.PG_SPELLS: return ["spell"];
						case UrlUtil.PG_CLASSES: return ["class", "subclass"];
						case UrlUtil.PG_BESTIARY: return ["monster", "legendaryGroup", "monsterFluff"];
						case UrlUtil.PG_BACKGROUNDS: return ["background"];
						case UrlUtil.PG_FEATS: return ["feat"];
						case UrlUtil.PG_OPT_FEATURES: return ["optionalfeature"];
						case UrlUtil.PG_RACES: return ["race", "raceFluff", "subrace"];
						case UrlUtil.PG_OBJECTS: return ["object"];
						case UrlUtil.PG_TRAPS_HAZARDS: return ["trap", "hazard"];
						case UrlUtil.PG_DEITIES: return ["deity"];
						case UrlUtil.PG_ITEMS: return ["item", "baseitem", "variant", "itemProperty", "itemType"];
						case UrlUtil.PG_REWARDS: return ["reward"];
						case UrlUtil.PG_PSIONICS: return ["psionic"];
						case UrlUtil.PG_VARIATNRULES: return ["variantrule"];
						case UrlUtil.PG_CONDITIONS_DISEASES: return ["condition", "disease"];
						case UrlUtil.PG_ADVENTURES: return ["adventure", "adventureData"];
						case UrlUtil.PG_BOOKS: return ["book", "bookData"];
						case UrlUtil.PG_TABLES: return ["table", "tableGroup"];
						case UrlUtil.PG_MAKE_SHAPED: return ["spell", "creature"];
						case UrlUtil.PG_MANAGE_BREW:
						case UrlUtil.PG_MAKE_BREW:
						case UrlUtil.PG_DEMO_RENDER: return BrewUtil._STORABLE;
						case UrlUtil.PG_VEHICLES: return ["vehicle"];
						case UrlUtil.PG_ACTIONS: return ["action"];
						case UrlUtil.PG_CULTS_BOONS: return ["cult", "boon"];
						case UrlUtil.PG_LANGUAGES: return ["language"];
						default: throw new Error(`No homebrew properties defined for category ${page}`);
					}
				};

				const cats = getPageCats();
				return !!cats.find(cat => !!(BrewUtil.homebrew[cat] || []).some(entry => entry.source === source));
			};

			const brewSources = MiscUtil.copy(BrewUtil.getJsonSources()).filter(src => isSourceRelevantForCurrentPage(src.json));
			brewSources.sort((a, b) => SortUtil.ascSort(a.full, b.full));

			brewSources.forEach((src, i) => {
				const validAuthors = (!src.authors ? [] : !(src.authors instanceof Array) ? [] : src.authors).join(", ");
				const isGroup = src._unknown || src._all;

				const $row = $(`<li class="row manbrew__row lst--border">
						<span class="col-5 manbrew__col--tall source manbrew__source">${isGroup ? "<i>" : ""}${src.full}${isGroup ? "</i>" : ""}</span>
						<span class="col-4 manbrew__col--tall authors">${validAuthors}</span>
						<${src.url ? "a" : "span"} class="col-1 manbrew__col--tall text-center" ${src.url ? `href="${src.url}" target="_blank" rel="noopener noreferrer"` : ""}>${src.url ? "View Source" : ""}</${src.url ? "a" : "span"}>
						<span class="hidden">${src.abbreviation}</span>
					</li>`);
				createButtons(src, $row);

				const listItem = new ListItem(
					i,
					$row,
					src.full,
					{
						authors: validAuthors,
						abbreviation: src.abbreviation
					}
				);
				list.addItem(listItem);
			});

			const createGroupRow = (fullText, modeProp) => {
				const $row = $(`<div class="row manbrew__row flex-h-right">
					<div class="manbrew__col--tall source manbrew__source text-right"><i class="mr-3">${fullText}</i></div>
				</div>`);
				createButtons({[modeProp]: true}, $row);
				$ulGroup.append($row);
			};
			createGroupRow("Entries From All Sources", "_all");
			createGroupRow("Entries Without Sources", "_unknown");

			list.init();
			ListUtil.bindEscapeKey(list, $iptSearch, true);
			$iptSearch.focus();
		}
	},

	_pRenderBrewScreen_dirToCat (dir) {
		if (!dir) return "";
		else if (BrewUtil._STORABLE.includes(dir)) return dir;
		else {
			switch (dir) {
				case "creature": return "monster";
				case "collection": return dir;
				case "magicvariant": return "variant";
			}
			throw new Error(`Directory was not mapped to a category: "${dir}"`);
		}
	},

	_pRenderBrewScreen_getDisplayCat (cat, isManager) {
		if (cat === "variantrule") return "Variant Rule";
		if (cat === "legendaryGroup") return "Legendary Group";
		if (cat === "optionalfeature") return "Optional Feature";
		if (cat === "adventure") return isManager ? "Adventure Contents/Info" : "Adventure";
		if (cat === "adventureData") return "Adventure Text";
		if (cat === "book") return isManager ? "Book Contents/Info" : "Book";
		if (cat === "bookData") return "Book Text";
		if (cat === "itemProperty") return "Item Property";
		if (cat === "baseitem") return "Base Item";
		if (cat === "variant") return "Magic Item Variant";
		if (cat === "monsterFluff") return "Monster Fluff";
		return cat.uppercaseFirst();
	},

	handleLoadbrewClick: async (ele, jsonUrl, name) => {
		const $ele = $(ele);
		if (!$ele.hasClass("rd__wrp-loadbrew--ready")) return; // an existing click is being handled
		const cached = $ele.html();
		const cachedTitle = $ele.title();
		$ele.title("");
		$ele.removeClass("rd__wrp-loadbrew--ready").html(`${name}<span class="glyphicon glyphicon-refresh rd__loadbrew-icon rd__loadbrew-icon--active"/>`);
		jsonUrl = jsonUrl.unescapeQuotes();
		const data = await DataUtil.loadJSON(`${jsonUrl}?${(new Date()).getTime()}`);
		await BrewUtil.pDoHandleBrewJson(data, UrlUtil.getCurrentPage());
		$ele.html(`${name}<span class="glyphicon glyphicon-saved rd__loadbrew-icon"/>`);
		setTimeout(() => $ele.html(cached).addClass("rd__wrp-loadbrew--ready").title(cachedTitle), 500);
	},

	async _pDoRemove (arrName, uniqueId, isChild) {
		function getIndex (arrName, uniqueId, isChild) {
			return BrewUtil.homebrew[arrName].findIndex(it => isChild ? it.parentUniqueId : it.uniqueId === uniqueId);
		}

		const index = getIndex(arrName, uniqueId, isChild);
		if (~index) {
			BrewUtil.homebrew[arrName].splice(index, 1);
			if (BrewUtil._lists) {
				BrewUtil._lists.forEach(l => l.removeItemByData(isChild ? "parentuniqueId" : "uniqueId", uniqueId));
			}
		}
	},

	_getPDeleteFunction (category) {
		switch (category) {
			case "spell":
			case "monster":
			case "monsterFluff":
			case "background":
			case "feat":
			case "optionalfeature":
			case "race":
			case "raceFluff":
			case "subrace":
			case "object":
			case "trap":
			case "hazard":
			case "deity":
			case "item":
			case "baseitem":
			case "variant":
			case "itemType":
			case "itemProperty":
			case "reward":
			case "psionic":
			case "variantrule":
			case "legendaryGroup":
			case "condition":
			case "disease":
			case "table":
			case "tableGroup":
			case "vehicle":
			case "action":
			case "cult":
			case "boon":
			case "language": return BrewUtil._genPDeleteGenericBrew(category);
			case "subclass": return BrewUtil._pDeleteSubclassBrew;
			case "class": return BrewUtil._pDeleteClassBrew;
			case "adventure":
			case "book": return BrewUtil._genPDeleteGenericBookBrew(category);
			case "adventureData":
			case "bookData": return () => {}; // Do nothing, handled by deleting the associated book/adventure
			default: throw new Error(`No homebrew delete function defined for category ${category}`);
		}
	},

	async _pDeleteClassBrew (uniqueId) {
		await BrewUtil._pDoRemove("class", uniqueId);
	},

	async _pDeleteSubclassBrew (uniqueId) {
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
			BrewUtil._persistHomebrewDebounced();

			// FIXME
			if (typeof ClassData !== "undefined") {
				const c = ClassData.classes.find(c => c.name.toLowerCase() === forClass.toLowerCase());

				const indexInClass = c.subclasses.findIndex(it => it.uniqueId === uniqueId);
				if (~indexInClass) {
					c.subclasses.splice(indexInClass, 1);
					c.subclasses = c.subclasses.sort((a, b) => SortUtil.ascSort(a.name, b.name));
				}
			}
		}
	},

	_genPDeleteGenericBrew (category) {
		return async (uniqueId) => {
			await BrewUtil._pDoRemove(category, uniqueId);
		};
	},

	_genPDeleteGenericBookBrew (category) {
		return async (uniqueId) => {
			await BrewUtil._pDoRemove(category, uniqueId);
			await BrewUtil._pDoRemove(`${category}Data`, uniqueId, true);
		};
	},

	manageBrew: () => {
		const {$modalInner} = UiUtil.getShowModal({
			fullHeight: true,
			title: `Manage Homebrew`,
			isLarge: true,
			titleSplit: BrewUtil._$getBtnDeleteAll(true)
		});

		BrewUtil._pRenderBrewScreen($modalInner, true);
	},

	async pAddEntry (prop, obj) {
		BrewUtil._mutUniqueId(obj);
		(BrewUtil.homebrew[prop] = BrewUtil.homebrew[prop] || []).push(obj);
		BrewUtil._persistHomebrewDebounced();
		return BrewUtil.homebrew[prop].length - 1;
	},

	async pRemoveEntry (prop, obj) {
		const ix = (BrewUtil.homebrew[prop] = BrewUtil.homebrew[prop] || []).findIndex(it => it.uniqueId === obj.uniqueId);
		if (~ix) {
			BrewUtil.homebrew[prop].splice(ix, 1);
			BrewUtil._persistHomebrewDebounced();
		} else throw new Error(`Could not find object with ID "${obj.uniqueId}" in "${prop}" list`);
	},

	getEntryIxByName (prop, obj) {
		return (BrewUtil.homebrew[prop] = BrewUtil.homebrew[prop] || []).findIndex(it => it.name === obj.name && it.source === obj.source);
	},

	async pUpdateEntryByIx (prop, ix, obj) {
		if (~ix && ix < BrewUtil.homebrew[prop].length) {
			BrewUtil._mutUniqueId(obj);
			BrewUtil.homebrew[prop].splice(ix, 1, obj);
			BrewUtil._persistHomebrewDebounced();
		} else throw new Error(`Index "${ix}" was not valid!`);
	},

	_mutUniqueId (obj) {
		delete obj.uniqueId; // avoid basing the hash on the previous hash
		obj.uniqueId = CryptUtil.md5(JSON.stringify(obj));
	},

	_DIRS: ["action", "adventure", "background", "book", "boon", "class", "condition", "creature", "cult", "deity", "disease", "feat", "hazard", "item", "language", "magicvariant", "object", "optionalfeature", "psionic", "race", "reward", "spell", "subclass", "subrace", "table", "trap", "variantrule", "vehicle"],
	_STORABLE: ["class", "subclass", "spell", "monster", "legendaryGroup", "monsterFluff", "background", "feat", "optionalfeature", "race", "raceFluff", "subrace", "deity", "item", "baseitem", "variant", "itemProperty", "itemType", "psionic", "reward", "object", "trap", "hazard", "variantrule", "condition", "disease", "adventure", "adventureData", "book", "bookData", "table", "tableGroup", "vehicle", "action", "cult", "boon", "language"],
	async pDoHandleBrewJson (json, page, pFuncRefresh) {
		await BrewUtil._lockHandleBrewJson.pLock();
		try {
			return BrewUtil._pDoHandleBrewJson(json, page, pFuncRefresh);
		} finally {
			BrewUtil._lockHandleBrewJson.unlock();
		}
	},

	async _pDoHandleBrewJson (json, page, pFuncRefresh) {
		function storePrep (arrName) {
			if (json[arrName]) {
				json[arrName].forEach(it => BrewUtil._mutUniqueId(it));
			} else json[arrName] = [];
		}

		// prepare for storage
		if (json.race && json.race.length) json.race = Renderer.race.mergeSubraces(json.race);
		BrewUtil._STORABLE.forEach(storePrep);

		const bookPairs = [
			["adventure", "adventureData"],
			["book", "bookData"]
		];
		bookPairs.forEach(([bookMetaKey, bookDataKey]) => {
			if (json[bookMetaKey] && json[bookDataKey]) {
				json[bookMetaKey].forEach(book => {
					const data = json[bookDataKey].find(it => it.id === book.id);
					if (data) {
						data.parentUniqueId = book.uniqueId;
					}
				});
			}
		});

		// store
		async function pCheckAndAdd (prop) {
			if (!BrewUtil.homebrew[prop]) BrewUtil.homebrew[prop] = [];
			if (IS_DEPLOYED) {
				// in production mode, skip any existing brew
				const areNew = [];
				const existingIds = BrewUtil.homebrew[prop].map(it => it.uniqueId);
				json[prop].forEach(it => {
					if (!existingIds.find(id => it.uniqueId === id)) {
						BrewUtil.homebrew[prop].push(it);
						areNew.push(it);
					}
				});
				return areNew;
			} else {
				// in development mode, replace any existing brew
				const existing = {};
				BrewUtil.homebrew[prop].forEach(it => {
					existing[it.source] = (existing[it.source] || {});
					existing[it.source][it.name] = it.uniqueId;
				});
				const pDeleteFn = BrewUtil._getPDeleteFunction(prop);
				await Promise.all(json[prop].map(async it => {
					// Handle magic variants
					const itSource = it.inherits && it.inherits.source ? it.inherits.source : it.source;
					if (existing[itSource] && existing[itSource][it.name]) {
						await pDeleteFn(existing[itSource][it.name]);
					}
					BrewUtil.homebrew[prop].push(it);
				}));
				return json[prop];
			}
		}

		function checkAndAddMetaGetNewSources () {
			const areNew = [];
			if (json._meta) {
				if (!BrewUtil.homebrewMeta) BrewUtil.homebrewMeta = {sources: []};

				Object.keys(json._meta).forEach(k => {
					switch (k) {
						case "dateAdded":
						case "dateLastModified":
							break;
						case "sources": {
							const existing = BrewUtil.homebrewMeta.sources.map(src => src.json);
							json._meta.sources.forEach(src => {
								if (!existing.find(it => it === src.json)) {
									BrewUtil.homebrewMeta.sources.push(src);
									areNew.push(src);
								}
							});
							break;
						}
						default: {
							BrewUtil.homebrewMeta[k] = BrewUtil.homebrewMeta[k] || {};
							Object.assign(BrewUtil.homebrewMeta[k], json._meta[k]);
							break;
						}
					}
				});
			}
			return areNew;
		}

		let sourcesToAdd = json._meta ? json._meta.sources : [];
		const toAdd = {};
		BrewUtil._STORABLE.forEach(k => toAdd[k] = json[k]);
		BrewUtil.homebrew = BrewUtil.homebrew || {};
		sourcesToAdd = checkAndAddMetaGetNewSources(); // adding source(s) to Filter should happen in per-page addX functions
		await Promise.all(BrewUtil._STORABLE.map(async k => toAdd[k] = await pCheckAndAdd(k))); // only add if unique ID not already present
		BrewUtil._persistHomebrewDebounced(); // Debounce this for mass adds, e.g. "Add All"
		StorageUtil.syncSet(HOMEBREW_META_STORAGE, BrewUtil.homebrewMeta);

		// wipe old cache
		BrewUtil._resetSourceCache();

		// display on page
		switch (page) {
			case UrlUtil.PG_SPELLS:
			case UrlUtil.PG_CLASSES:
			case UrlUtil.PG_BESTIARY:
			case UrlUtil.PG_BACKGROUNDS:
			case UrlUtil.PG_FEATS:
			case UrlUtil.PG_OPT_FEATURES:
			case UrlUtil.PG_RACES:
			case UrlUtil.PG_OBJECTS:
			case UrlUtil.PG_TRAPS_HAZARDS:
			case UrlUtil.PG_DEITIES:
			case UrlUtil.PG_ITEMS:
			case UrlUtil.PG_REWARDS:
			case UrlUtil.PG_PSIONICS:
			case UrlUtil.PG_VARIATNRULES:
			case UrlUtil.PG_CONDITIONS_DISEASES:
			case UrlUtil.PG_ADVENTURE:
			case UrlUtil.PG_ADVENTURES:
			case UrlUtil.PG_BOOK:
			case UrlUtil.PG_BOOKS:
			case UrlUtil.PG_MAKE_SHAPED:
			case UrlUtil.PG_TABLES:
			case UrlUtil.PG_VEHICLES:
			case UrlUtil.PG_ACTIONS:
			case UrlUtil.PG_CULTS_BOONS:
			case UrlUtil.PG_LANGUAGES:
				await (BrewUtil._pHandleBrew || handleBrew)(MiscUtil.copy(toAdd));
				break;
			case UrlUtil.PG_MANAGE_BREW:
			case UrlUtil.PG_MAKE_BREW:
			case UrlUtil.PG_DEMO_RENDER:
			case "NO_PAGE":
				break;
			default:
				throw new Error(`No homebrew add function defined for category ${page}`);
		}

		if (pFuncRefresh) await pFuncRefresh();

		if (BrewUtil._filterBox && BrewUtil._sourceFilter) {
			const cur = BrewUtil._filterBox.getValues();
			if (cur.Source) {
				const toSet = JSON.parse(JSON.stringify(cur.Source));

				if (toSet._totals.yes || toSet._totals.no) {
					if (page === UrlUtil.PG_CLASSES) toSet["Core"] = 1;
					else sourcesToAdd.forEach(src => toSet[src.json] = 1);
					BrewUtil._filterBox.setFromValues({Source: toSet});
				}
			}
			if (BrewUtil._filterBox) BrewUtil._filterBox.fireChangeEvent();
		}
	},

	makeBrewButton: (id) => {
		$(`#${id}`).on("click", () => BrewUtil.manageBrew());
	},

	_getBrewCategories () {
		return Object.keys(BrewUtil.homebrew).filter(it => !it.startsWith("_"));
	},

	// region sources
	_buildSourceCache () {
		function doBuild () {
			if (BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.sources) {
				BrewUtil.homebrewMeta.sources.forEach(src => BrewUtil._sourceCache[src.json.toLowerCase()] = ({...src}));
			}
		}

		if (!BrewUtil._sourceCache) {
			BrewUtil._sourceCache = {};

			if (!BrewUtil.homebrewMeta) {
				const temp = StorageUtil.syncGet(HOMEBREW_META_STORAGE) || {};
				temp.sources = temp.sources || [];
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
		if (!source) return;
		source = source.toLowerCase();
		BrewUtil._resetSourceCache();
		const ix = BrewUtil.homebrewMeta.sources.findIndex(it => it.json.toLowerCase() === source);
		if (~ix) BrewUtil.homebrewMeta.sources.splice(ix, 1);
		StorageUtil.syncSet(HOMEBREW_META_STORAGE, BrewUtil.homebrewMeta);
	},

	getJsonSources () {
		BrewUtil._buildSourceCache();
		return BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.sources ? BrewUtil.homebrewMeta.sources : [];
	},

	hasSourceJson (source) {
		if (!source) return false;
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		return !!BrewUtil._sourceCache[source];
	},

	sourceJsonToFull (source) {
		if (!source) return "";
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		return BrewUtil._sourceCache[source] ? BrewUtil._sourceCache[source].full || source : source;
	},

	sourceJsonToAbv (source) {
		if (!source) return "";
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		return BrewUtil._sourceCache[source] ? BrewUtil._sourceCache[source].abbreviation || source : source;
	},

	sourceJsonToDate (source) {
		if (!source) return "";
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		return BrewUtil._sourceCache[source] ? BrewUtil._sourceCache[source].dateReleased || source : source;
	},

	sourceJsonToSource (source) {
		if (!source) return null;
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		return BrewUtil._sourceCache[source] ? BrewUtil._sourceCache[source] : null;
	},

	sourceJsonToStyle (source) {
		if (!source) return "";
		source = source.toLowerCase();
		const color = BrewUtil.sourceJsonToColor(source);
		if (color) return `style="color: #${color};"`;
		return "";
	},

	sourceJsonToColor (source) {
		if (!source) return "";
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		if (BrewUtil._sourceCache[source] && BrewUtil._sourceCache[source].color) {
			const validColor = BrewUtil.getValidColor(BrewUtil._sourceCache[source].color);
			if (validColor.length) return validColor;
			return "";
		} else return "";
	},

	getValidColor (color) {
		// Prevent any injection shenanigans
		return color.replace(/[^a-fA-F0-9]/g, "").slice(0, 8);
	},

	addSource (sourceObj) {
		BrewUtil._resetSourceCache();
		const exists = BrewUtil.homebrewMeta.sources.some(it => it.json === sourceObj.json);
		if (exists) throw new Error(`Source "${sourceObj.json}" already exists!`);
		(BrewUtil.homebrewMeta.sources = BrewUtil.homebrewMeta.sources || []).push(sourceObj);
		StorageUtil.syncSet(HOMEBREW_META_STORAGE, BrewUtil.homebrewMeta);
	},

	updateSource (sourceObj) {
		BrewUtil._resetSourceCache();
		const ix = BrewUtil.homebrewMeta.sources.findIndex(it => it.json === sourceObj.json);
		if (!~ix) throw new Error(`Source "${sourceObj.json}" does not exist!`);
		const json = BrewUtil.homebrewMeta.sources[ix].json;
		BrewUtil.homebrewMeta.sources[ix] = {
			...sourceObj,
			json
		};
		StorageUtil.syncSet(HOMEBREW_META_STORAGE, BrewUtil.homebrewMeta);
	},

	_getActiveVetoolsSources () {
		if (BrewUtil.homebrew === null) throw new Error(`Homebrew was not initialized!`);

		const allActiveSources = new Set();
		Object.keys(BrewUtil.homebrew).forEach(k => BrewUtil.homebrew[k].forEach(it => it.source && allActiveSources.add(it.source)));
		return Object.keys(Parser.SOURCE_JSON_TO_FULL).map(k => ({
			json: k,
			full: Parser.SOURCE_JSON_TO_FULL[k],
			abbreviation: Parser.SOURCE_JSON_TO_ABV[k],
			dateReleased: Parser.SOURCE_JSON_TO_DATE[k]
		})).sort((a, b) => SortUtil.ascSort(a.full, b.full)).filter(it => allActiveSources.has(it.json));
	},
	// endregion

	/**
	 * Get data in a format similar to the main search index
	 */
	async pGetSearchIndex () {
		BrewUtil._buildSourceCache();
		const indexer = new Omnidexer(Omnisearch.highestId + 1);

		await BrewUtil.pAddBrewData();
		if (BrewUtil.homebrew) {
			const INDEX_DEFINITIONS = [Omnidexer.TO_INDEX__FROM_INDEX_JSON, Omnidexer.TO_INDEX];

			// Run these in serial, to prevent any ID race condition antics
			for (const IX_DEF of INDEX_DEFINITIONS) {
				for (const arbiter of IX_DEF) {
					if (!(BrewUtil.homebrew[arbiter.brewProp || arbiter.listProp] || []).length) continue;

					if (arbiter.pFnPreProcBrew) {
						const toProc = await arbiter.pFnPreProcBrew(arbiter, BrewUtil.homebrew);
						indexer.addToIndex(arbiter, toProc)
					} else {
						indexer.addToIndex(arbiter, BrewUtil.homebrew)
					}
				}
			}
		}
		return Omnidexer.decompressIndex(indexer.getIndex());
	},

	async pGetAdditionalSearchIndices (highestId, addiProp) {
		BrewUtil._buildSourceCache();
		const indexer = new Omnidexer(highestId + 1);

		await BrewUtil.pAddBrewData();
		if (BrewUtil.homebrew) {
			const INDEX_DEFINITIONS = [Omnidexer.TO_INDEX__FROM_INDEX_JSON, Omnidexer.TO_INDEX];

			await Promise.all(INDEX_DEFINITIONS.map(IXDEF => {
				return Promise.all(IXDEF
					.filter(ti => ti.additionalIndexes && (BrewUtil.homebrew[ti.listProp] || []).length)
					.map(ti => {
						return Promise.all(Object.entries(ti.additionalIndexes).filter(([prop]) => prop === addiProp).map(async ([prop, pGetIndex]) => {
							const toIndex = await pGetIndex(indexer, {[ti.listProp]: BrewUtil.homebrew[ti.listProp]});
							toIndex.forEach(add => indexer.pushToIndex(add));
						}));
					}));
			}));
		}
		return Omnidexer.decompressIndex(indexer.getIndex());
	},

	async pGetAlternateSearchIndices (highestId, altProp) {
		BrewUtil._buildSourceCache();
		const indexer = new Omnidexer(highestId + 1);

		await BrewUtil.pAddBrewData();
		if (BrewUtil.homebrew) {
			const INDEX_DEFINITIONS = [Omnidexer.TO_INDEX__FROM_INDEX_JSON, Omnidexer.TO_INDEX];

			INDEX_DEFINITIONS.forEach(IXDEF => {
				IXDEF
					.filter(ti => ti.alternateIndexes && (BrewUtil.homebrew[ti.listProp] || []).length)
					.forEach(ti => {
						Object.entries(ti.alternateIndexes)
							.filter(([prop]) => prop === altProp)
							.map(async ([prop, pGetIndex]) => {
								indexer.addToIndex(ti, BrewUtil.homebrew, {alt: ti.alternateIndexes[prop]})
							});
					});
			});
		}
		return Omnidexer.decompressIndex(indexer.getIndex());
	},

	__pPersistHomebrewDebounced: null,
	_persistHomebrewDebounced () {
		if (BrewUtil.__pPersistHomebrewDebounced == null) {
			BrewUtil.__pPersistHomebrewDebounced = MiscUtil.debounce(() => BrewUtil._pCleanSaveBrew(), 125);
		}
		BrewUtil.__pPersistHomebrewDebounced();
	}
};

// ID GENERATION =======================================================================================================
CryptUtil = {
	// region md5 internals
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

	_hex_chr: "0123456789abcdef".split(""),

	_rhex: (n) => {
		let s = "";
		for (let j = 0; j < 4; j++) {
			s += CryptUtil._hex_chr[(n >> (j * 8 + 4)) & 0x0F] + CryptUtil._hex_chr[(n >> (j * 8)) & 0x0F];
		}
		return s;
	},

	_add32: (a, b) => {
		return (a + b) & 0xFFFFFFFF;
	},
	// endregion

	hex: (x) => {
		for (let i = 0; i < x.length; i++) {
			x[i] = CryptUtil._rhex(x[i]);
		}
		return x.join("");
	},

	hex2Dec (hex) {
		return parseInt(`0x${hex}`);
	},

	md5: (s) => {
		return CryptUtil.hex(CryptUtil._md51(s));
	},

	/**
	 * Based on Java's implementation.
	 * @param obj An object to hash.
	 * @return {*} An integer hashcode for the object.
	 */
	hashCode (obj) {
		if (typeof obj === "string") {
			if (!obj) return 0;
			let h = 0;
			for (let i = 0; i < obj.length; ++i) h = 31 * h + obj.charCodeAt(i);
			return h;
		} else if (typeof obj === "number") return obj;
		else throw new Error(`No hashCode implementation for ${obj}`);
	},

	uid () { // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
		if (RollerUtil.isCrypto()) {
			return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
		} else {
			let d = Date.now();
			if (typeof performance !== "undefined" && typeof performance.now === "function") {
				d += performance.now();
			}
			return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
				const r = (d + Math.random() * 16) % 16 | 0;
				d = Math.floor(d / 16);
				return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
			});
		}
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

	setEq (a, b) {
		if (a.size !== b.size) return false;
		for (const it of a) if (!b.has(it)) return false;
		return true;
	},

	setDiff (set1, set2) {
		return new Set([...set1].filter(it => !set2.has(it)));
	},

	deepEquals (a, b) {
		if (CollectionUtil._eq_sameValueZeroEqual(a, b)) return true;
		if (a && b && typeof a === "object" && typeof b === "object") {
			if (CollectionUtil._eq_isPlainObject(a) && CollectionUtil._eq_isPlainObject(b)) return CollectionUtil._eq_areObjectsEqual(a, b);
			const arrayA = Array.isArray(a);
			const arrayB = Array.isArray(b);
			if (arrayA || arrayB) return arrayA === arrayB && CollectionUtil._eq_areArraysEqual(a, b);
			const setA = a instanceof Set;
			const setB = b instanceof Set;
			if (setA || setB) return setA === setB && CollectionUtil.setEq(a, b);
			return CollectionUtil._eq_areObjectsEqual(a, b);
		}
		return false;
	},

	// This handles the NaN != NaN case; ignore linter complaints
	// eslint-disable-next-line no-self-compare
	_eq_sameValueZeroEqual: (a, b) => a === b || (a !== a && b !== b),
	_eq_isPlainObject: (value) => value.constructor === Object || value.constructor == null,
	_eq_areObjectsEqual (a, b) {
		const keysA = Object.keys(a);
		const {length} = keysA;
		if (Object.keys(b).length !== length) return false;
		for (let i = 0; i < length; i++) {
			if (!b.hasOwnProperty(keysA[i])) return false;
			if (!CollectionUtil.deepEquals(a[keysA[i]], b[keysA[i]])) return false;
		}
		return true;
	},
	_eq_areArraysEqual (a, b) {
		const {length} = a;
		if (b.length !== length) return false;
		for (let i = 0; i < length; i++) if (!CollectionUtil.deepEquals(a[i], b[i])) return false;
		return true;
	}
};

Array.prototype.last = Array.prototype.last || function (arg) {
	if (arg !== undefined) this[this.length - 1] = arg;
	else return this[this.length - 1];
};

Array.prototype.filterIndex = Array.prototype.filterIndex || function (fnCheck) {
	const out = [];
	this.forEach((it, i) => {
		if (fnCheck(it)) out.push(i);
	});
	return out;
};

Array.prototype.equals = Array.prototype.equals || function (array2) {
	const array1 = this;
	if (!array1 && !array2) return true;
	else if ((!array1 && array2) || (array1 && !array2)) return false;

	let temp = [];
	if ((!array1[0]) || (!array2[0])) return false;
	if (array1.length !== array2.length) return false;
	let key;
	// Put all the elements from array1 into a "tagged" array
	for (let i = 0; i < array1.length; i++) {
		key = `${(typeof array1[i])}~${array1[i]}`; // Use "typeof" so a number 1 isn't equal to a string "1".
		if (temp[key]) temp[key]++;
		else temp[key] = 1;
	}
	// Go through array2 - if same tag missing in "tagged" array, not equal
	for (let i = 0; i < array2.length; i++) {
		key = `${(typeof array2[i])}~${array2[i]}`;
		if (temp[key]) {
			if (temp[key] === 0) return false;
			else temp[key]--;
		} else return false;
	}
	return true;
};

Array.prototype.partition = Array.prototype.partition || function (fnIsValid) {
	return this.reduce(([pass, fail], elem) => fnIsValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]], [[], []]);
};

Array.prototype.getNext = Array.prototype.getNext || function (curVal) {
	let ix = this.indexOf(curVal);
	if (!~ix) throw new Error("Value was not in array!");
	if (++ix >= this.length) ix = 0;
	return this[ix];
};

Array.prototype.shuffle = Array.prototype.shuffle || function () {
	for (let i = 0; i < 10000; ++i) this.sort(() => Math.random() - 0.5);
	return this;
};

/** Map each array item to a k:v pair, then flatten them into one object. */
Array.prototype.mergeMap = Array.prototype.mergeMap || function (fnMap) {
	return this.map((...args) => fnMap(...args)).reduce((a, b) => Object.assign(a, b), {});
};

// OVERLAY VIEW ========================================================================================================
/**
 * Relies on:
 * - page implementing HashUtil's `loadSubHash` with handling to show/hide the book view based on hashKey changes
 * - page running no-argument `loadSubHash` when `hashchange` occurs
 *
 * @param opts Options object.
 * @param opts.hashKey to use in the URL so that forward/back can open/close the view
 * @param opts.$openBtn jQuery-selected button to bind click open/close
 * @param opts.noneVisibleMsg "error" message to display if user has not selected any viewable content
 * @param opts.pageTitle Title.
 * @param opts.state State to modify when opening/closing.
 * @param opts.stateKey Key in state to set true/false when opening/closing.
 * @param opts.popTblGetNumShown function which should populate the view with HTML content and return the number of items displayed
 * @param [opts.hasPrintColumns] True if the overlay should contain a dropdown for adjusting print columns.
 * @constructor
 */
function BookModeView (opts) {
	opts = opts || {};
	const {hashKey, $openBtn, noneVisibleMsg, pageTitle, popTblGetNumShown, isFlex, state, stateKey} = opts;

	if (hashKey && stateKey) throw new Error();

	this.hashKey = hashKey;
	this.stateKey = stateKey;
	this.state = state;
	this.$openBtn = $openBtn;
	this.noneVisibleMsg = noneVisibleMsg;
	this.popTblGetNumShown = popTblGetNumShown;

	this.active = false;
	this._$body = null;
	this._$wrpBook = null;

	this._$wrpRenderedContent = null;
	this._$wrpNoneShown = null;
	this._doRenderContent = null; // N.B. currently unused, but can be used to refresh the contents of the view

	this.$openBtn.off("click").on("click", () => {
		if (this.stateKey) {
			this.state[this.stateKey] = true;
		} else {
			Hist.cleanSetHash(`${window.location.hash}${HASH_PART_SEP}${this.hashKey}${HASH_SUB_KV_SEP}true`);
		}
	});

	this._doHashTeardown = () => {
		if (this.stateKey) {
			this.state[this.stateKey] = false;
		} else {
			Hist.cleanSetHash(window.location.hash.replace(`${this.hashKey}${HASH_SUB_KV_SEP}true`, ""));
		}
	};

	this._renderContent = async ($wrpContent, $dispName, $wrpControlsToPass) => {
		this._$wrpRenderedContent = this._$wrpRenderedContent
			? this._$wrpRenderedContent.empty()
			: $$`<div class="bkmv__scroller h-100 overflow-y-auto ${isFlex ? "flex" : ""}">${$wrpContent}</div>`.appendTo(this._$wrpBook);

		const numShown = await this.popTblGetNumShown($wrpContent, $dispName, $wrpControlsToPass);

		if (numShown) {
			if (this._$wrpNoneShown) {
				this._$wrpNoneShown.remove();
				this._$wrpNoneShown = null;
			}
		} else {
			if (!this._$wrpNoneShown) {
				const $btnClose = $(`<button class="btn btn-default">Close</button>`)
					.click(() => this._doHashTeardown());

				this._$wrpNoneShown = $$`<div class="w-100 flex-col no-shrink bkmv__footer mb-3">
					<div class="mb-2 flex-vh-center"><span class="initial-message">${this.noneVisibleMsg}</span></div>
					<div class="flex-vh-center">${$btnClose}</div>
				</div>`.appendTo(this._$wrpBook);
			}
		}
	};

	// NOTE: Avoid using `flex` css, as it doesn't play nice with printing
	this.pOpen = async () => {
		if (this.active) return;
		this.active = true;
		document.title = `${pageTitle} - 5etools`;

		this._$body = $(`body`);
		this._$wrpBook = $(`<div class="bkmv"/>`);

		this._$body.css("overflow", "hidden");
		this._$body.addClass("bkmv-active");

		const $btnClose = $(`<span class="delete-icon glyphicon glyphicon-remove"/>`)
			.click(() => this._doHashTeardown());
		const $dispName = $(`<div/>`); // pass this to the content function to allow it to set a main header
		$$`<div class="bkmv__spacer-name split-v-center no-shrink">${$dispName}${$btnClose}</div>`.appendTo(this._$wrpBook);

		// region controls
		// Optionally usable "controls" section at the top of the pane
		const $wrpControls = $(`<div class="w-100 flex-col bkmv__wrp-controls"/>`)
			.appendTo(this._$wrpBook);

		let $wrpControlsToPass = $wrpControls;
		if (opts.hasPrintColumns) {
			$wrpControls.addClass("px-2 mt-2");

			const injectPrintCss = (cols) => {
				$(`#bkmv__print-style`).remove();
				$(`<style media="print" id="bkmv__print-style">.bkmv__wrp { column-count: ${cols}; }</style>`)
					.appendTo($(document.body))
			};

			const lastColumns = StorageUtil.syncGetForPage(BookModeView._BOOK_VIEW_COLUMNS_K);

			const $selColumns = $(`<select class="form-control input-sm">
				<option value="0">Two (book style)</option>
				<option value="1">One</option>
			</select>`)
				.change(() => {
					const val = Number($selColumns.val());
					if (val === 0) injectPrintCss(2);
					else injectPrintCss(1);

					StorageUtil.syncSetForPage(BookModeView._BOOK_VIEW_COLUMNS_K, val);
				});
			if (lastColumns != null) $selColumns.val(lastColumns);
			$selColumns.change();

			$wrpControlsToPass = $$`<div class="w-100 flex">
				<div class="flex-vh-center"><div class="mr-2 no-wrap help--subtle" title="Applied when printing the page.">Print columns:</div>${$selColumns}</div>
			</div>`.appendTo($wrpControls);
		}
		// endregion

		const $wrpContent = $(`<div class="bkmv__wrp p-2"/>`);

		await this._renderContent($wrpContent, $dispName, $wrpControlsToPass);

		this._pRenderContent = () => this._renderContent($wrpContent, $dispName, $wrpControlsToPass);

		this._$body.append(this._$wrpBook);
	};

	this.teardown = () => {
		if (this.active) {
			this._$body.css("overflow", "");
			this._$body.removeClass("bkmv-active");
			this._$wrpBook.remove();
			this.active = false;

			this._$wrpRenderedContent = null;
			this._$wrpNoneShown = null;
			this._pRenderContent = null;
		}
	};

	this.pHandleSub = (sub) => {
		if (this.stateKey) return; // Assume anything with state will handle this itself.

		const bookViewHash = sub.find(it => it.startsWith(this.hashKey));
		if (bookViewHash && UrlUtil.unpackSubHash(bookViewHash)[this.hashKey][0] === "true") return this.pOpen();
		else this.teardown();
	};
}
BookModeView._BOOK_VIEW_COLUMNS_K = "bookViewColumns";

// CONTENT EXCLUSION ===================================================================================================
ExcludeUtil = {
	isInitialised: false,
	_excludes: null,

	async pInitialise () {
		ExcludeUtil.pSave = MiscUtil.throttle(ExcludeUtil._pSave, 50);
		try {
			ExcludeUtil._excludes = await StorageUtil.pGet(EXCLUDES_STORAGE) || [];
		} catch (e) {
			JqueryUtil.doToast({
				content: "Error when loading content blacklist! Purged blacklist data. (See the log for more information.)",
				type: "danger"
			});
			try {
				await StorageUtil.pRemove(EXCLUDES_STORAGE);
			} catch (e) {
				setTimeout(() => { throw e });
			}
			ExcludeUtil._excludes = null;
			window.location.hash = "";
			setTimeout(() => { throw e });
		}
		ExcludeUtil.isInitialised = true;
	},

	getList () {
		return ExcludeUtil._excludes || [];
	},

	async pSetList (toSet) {
		ExcludeUtil._excludes = toSet;
		await ExcludeUtil.pSave();
	},

	_excludeCount: 0,
	isExcluded (name, category, source) {
		if (!ExcludeUtil._excludes || !ExcludeUtil._excludes.length) return false;
		if (!source) return false;  // Can't exclude an item if it has no source defined
		source = source.source || source;
		const out = !!ExcludeUtil._excludes.find(row => (row.source === "*" || row.source === source) && (row.category === "*" || row.category === category) && (row.name === "*" || row.name === name));
		if (out) ++ExcludeUtil._excludeCount;
		return out;
	},

	checkShowAllExcluded (list, $pagecontent) {
		if ((!list.length && ExcludeUtil._excludeCount) || (list.length > 0 && list.length === ExcludeUtil._excludeCount)) {
			$pagecontent.html(`
				<tr><th class="border" colspan="6"></th></tr>
				<tr><td colspan="6" class="initial-message">(Content <a href="blacklist.html">blacklisted</a>)</td></tr>
				<tr><th class="border" colspan="6"></th></tr>
			`);
		}
	},

	addExclude (name, category, source) {
		if (!ExcludeUtil._excludes.find(row => row.source === source && row.category === category && row.name === name)) {
			ExcludeUtil._excludes.push({name, category, source});
			ExcludeUtil.pSave();
			return true;
		}
		return false;
	},

	removeExclude (name, category, source) {
		const ix = ExcludeUtil._excludes.findIndex(row => row.source === source && row.category === category && row.name === name);
		if (~ix) {
			ExcludeUtil._excludes.splice(ix, 1);
			ExcludeUtil.pSave();
		}
	},

	async _pSave () {
		return StorageUtil.pSet(EXCLUDES_STORAGE, ExcludeUtil._excludes);
	},

	// The throttled version, available post-initialisation
	async pSave () { /* no-op */ },

	resetExcludes () {
		ExcludeUtil._excludes = [];
		ExcludeUtil.pSave();
	}
};

// ENCOUNTERS ==========================================================================================================
EncounterUtil = {
	async pGetInitialState () {
		if (await EncounterUtil._pHasSavedStateLocal()) {
			if (await EncounterUtil._hasSavedStateUrl()) {
				return {
					type: "url",
					data: EncounterUtil._getSavedStateUrl()
				};
			} else {
				return {
					type: "local",
					data: await EncounterUtil._pGetSavedStateLocal()
				};
			}
		} else return null;
	},

	_hasSavedStateUrl () {
		return window.location.hash.length && Hist.getSubHash(EncounterUtil.SUB_HASH_PREFIX) != null;
	},

	_getSavedStateUrl () {
		let out = null;
		try {
			out = JSON.parse(decodeURIComponent(Hist.getSubHash(EncounterUtil.SUB_HASH_PREFIX)));
		} catch (e) {
			setTimeout(() => {
				throw e;
			});
		}
		Hist.setSubhash(EncounterUtil.SUB_HASH_PREFIX, null);
		return out;
	},

	async _pHasSavedStateLocal () {
		return !!StorageUtil.pGet(ENCOUNTER_STORAGE);
	},

	async _pGetSavedStateLocal () {
		try {
			return await StorageUtil.pGet(ENCOUNTER_STORAGE);
		} catch (e) {
			JqueryUtil.doToast({
				content: "Error when loading encounters! Purged encounter data. (See the log for more information.)",
				type: "danger"
			});
			await StorageUtil.pRemove(ENCOUNTER_STORAGE);
			setTimeout(() => { throw e; });
		}
	},

	async pDoSaveState (toSave) {
		StorageUtil.pSet(ENCOUNTER_STORAGE, toSave);
	},

	async pGetSavedState () {
		const saved = await StorageUtil.pGet(EncounterUtil.SAVED_ENCOUNTER_SAVE_LOCATION);
		return saved || {};
	},

	getEncounterName (encounter) {
		if (encounter.l && encounter.l.items && encounter.l.items.length) {
			const largestCount = encounter.l.items.sort((a, b) => SortUtil.ascSort(Number(b.c), Number(a.c)))[0];
			const name = decodeURIComponent(largestCount.h.split(HASH_LIST_SEP)[0]).toTitleCase();
			return `Encounter with ${name} ×${largestCount.c}`;
		} else return "(Unnamed Encounter)"
	}
};
EncounterUtil.SUB_HASH_PREFIX = "encounter";
EncounterUtil.SAVED_ENCOUNTER_SAVE_LOCATION = "ENCOUNTER_SAVED_STORAGE";

// EXTENSIONS ==========================================================================================================
ExtensionUtil = {
	ACTIVE: false,

	_doSend (type, data) {
		window.dispatchEvent(new CustomEvent("rivet.send", {detail: {type, data}}));
	},

	async pDoSendStats (evt, ele) {
		const $parent = $(ele).closest(`th.rnd-name`);
		const page = $parent.attr("data-page");
		const source = $parent.attr("data-source");
		const hash = $parent.attr("data-hash");

		if (page && source && hash) {
			const loaded = await Renderer.hover.pCacheAndGet(page, source, hash);
			ExtensionUtil._doSend("entity", {page, entity: loaded, isTemp: !!evt.shiftKey});
		}
	},

	doSendRoll (data) { ExtensionUtil._doSend("roll", data); }
};
if (typeof window !== "undefined") window.addEventListener("rivet.active", () => ExtensionUtil.ACTIVE = true);

// REACTOR =============================================================================================================
class Reactor {
	constructor () {
		this.rvents = {};
	}

	_registerEvent (eventName) {
		this.rvents[eventName] = new ReactorEvent(eventName);
	}

	fire (eventName, eventArgs) {
		if (this.rvents[eventName]) this.rvents[eventName].callbacks.forEach(callback => callback(eventArgs));
	}

	on (eventName, callback) {
		if (!this.rvents[eventName]) this._registerEvent(eventName);
		this.rvents[eventName]._registerCallback(callback);
	}

	off (eventName, callback) {
		if (!this.rvents[eventName]) return;
		this.rvents[eventName]._unregisterCallback(callback);
	}
}

class ReactorEvent {
	constructor (name) {
		this.name = name;
		this.callbacks = [];
	}

	_registerCallback (callback) {
		this.callbacks.push(callback);
	}

	_unregisterCallback (callback) {
		const ix = this.callbacks.indexOf(callback);
		this.callbacks.splice(ix, 1);
	}
}

// TOKENS ==============================================================================================================
class TokenUtil {
	static imgError (x) {
		if (x) $(x).parent().remove();
		$(`.rnd-name`).find(`span.stats-source`).css("margin-right", "0");
	}

	static handleStatblockScroll (event, ele) {
		$(`#token_image`)
			.toggle(ele.scrollTop < 32)
			.css({
				opacity: (32 - ele.scrollTop) / 32,
				top: -ele.scrollTop
			})
	}
}

// LOCKS ===============================================================================================================
class VeLock {
	constructor () { this._lockMeta = null; }

	async pLock () {
		while (this._lockMeta) await this._lockMeta.lock;
		let unlock = null;
		const lock = new Promise(resolve => unlock = resolve);
		this._lockMeta = {
			lock,
			unlock
		}
	}

	unlock () {
		const lockMeta = this._lockMeta;
		if (lockMeta) {
			this._lockMeta = null;
			lockMeta.unlock();
		}
	}
}
BrewUtil._lockHandleBrewJson = new VeLock();

// MISC WEBPAGE ONLOADS ================================================================================================
if (!IS_VTT && typeof window !== "undefined") {
	// add an obnoxious banner
	// TODO is this something we want? If so, uncomment
	/*
	window.addEventListener("load", async () => {
		if (!StorageUtil.isSyncFake() && await StorageUtil.pGet("seenLegal")) return;
		const $wrpBanner = $(`<div id="legal-notice"><span>Don't go posting this shit to Reddit</span></div>`);
		$(`<button class="btn btn-sm btn-default">Whatever, kid</button>`).on("click", () => {
			StorageUtil.pSet("seenLegal", true);
			$wrpBanner.remove();
		}).appendTo($wrpBanner);
		$(`body`).append($wrpBanner);
	});
	*/

	// Hack to lock the ad space at original size--prevents the screen from shifting around once loaded
	setTimeout(() => {
		const $wrp = $(`.cancer__wrp-leaderboard`);
		// const w = $wrp.outerWidth();
		const h = $wrp.outerHeight();
		$wrp.css({
			// width: w,
			height: h
		});
	}, 5000);
}

_Donate = {
	// TAG Disabled until further notice
	/*
	init () {
		if (IS_DEPLOYED) {
			DataUtil.loadJSON(`https://get.5etools.com/money.php`).then(dosh => {
				const pct = Number(dosh.donated) / Number(dosh.Goal);
				$(`#don-total`).text(`€${dosh.Goal}`);
				if (isNaN(pct)) {
					throw new Error(`Was not a number! Values were ${dosh.donated} and ${dosh.Goal}`);
				} else {
					const $bar = $(`.don__bar_inner`);
					$bar.css("width", `${Math.min(Math.ceil(100 * pct), 100)}%`).html(pct !== 0 ? `€${dosh.donated}&nbsp;` : "");
					if (pct >= 1) $bar.css("background-color", "lightgreen");
				}
			}).catch(noDosh => {
				$(`#don-wrapper`).remove();
				throw noDosh;
			});
		}
	},

	async pNotDonating () {
		const isFake = await StorageUtil.pIsAsyncFake();
		const isNotDonating = await StorageUtil.pGet("notDonating");
		return isFake || isNotDonating;
	},
	*/

	// region Test code, please ignore
	cycleLeader (ele) {
		const modes = [{width: 970, height: 90}, {width: 970, height: 250}, {width: 320, height: 50}, {width: 728, height: 90}];
		_Donate._cycleMode(ele, modes);
	},

	cycleSide (ele) {
		const modes = [{width: 300, height: 250}, {width: 300, height: 600}];
		_Donate._cycleMode(ele, modes);
	},

	_cycleMode (ele, modes) {
		const $e = $(ele);
		const pos = $e.data("pos") || 0;
		const mode = modes[pos];
		$e.css(mode);
		$e.text(`${mode.width}*${mode.height}`);
		$e.data("pos", (pos + 1) % modes.length)
	}
	// endregion
};
