const fs = require('fs');
const ut = require('../js/utils.js');
const utS = require("../node/util-search-index");
const bu = require("../js/bookutils");

const re = /{@(spell|item|class|creature|condition|disease|background|race|optfeature|feat|reward|psionic|object|cult|boon|trap|hazard|deity|variantrule) (.*?)(\|(.*?))?(\|(.*?))?(\|.*?)?}/g;
const skillRe = /{@skill (.*?)(\|.*?)?}/g;
const actionRe = /{@action (.*?)(\|.*?)?}/g;

let msg = ``;

const TAG_TO_PAGE = {
	"spell": UrlUtil.PG_SPELLS,
	"item": UrlUtil.PG_ITEMS,
	"class": UrlUtil.PG_CLASSES,
	"creature": UrlUtil.PG_BESTIARY,
	"condition": UrlUtil.PG_CONDITIONS_DISEASES,
	"disease": UrlUtil.PG_CONDITIONS_DISEASES,
	"background": UrlUtil.PG_BACKGROUNDS,
	"race": UrlUtil.PG_RACES,
	"optfeature": UrlUtil.PG_OPT_FEATURES,
	"reward": UrlUtil.PG_REWARDS,
	"feat": UrlUtil.PG_FEATS,
	"psionic": UrlUtil.PG_PSIONICS,
	"object": UrlUtil.PG_OBJECTS,
	"cult": UrlUtil.PG_CULTS_BOONS,
	"boon": UrlUtil.PG_CULTS_BOONS,
	"trap": UrlUtil.PG_TRAPS_HAZARDS,
	"hazard": UrlUtil.PG_TRAPS_HAZARDS,
	"deity": UrlUtil.PG_DEITIES,
	"variantrule": UrlUtil.PG_VARIATNRULES
};

const TAG_TO_DEFAULT_SOURCE = {
	"spell": "phb",
	"item": "dmg",
	"class": "phb",
	"creature": "mm",
	"condition": "phb",
	"disease": "dmg",
	"background": "phb",
	"race": "phb",
	"optfeature": "phb",
	"reward": "dmg",
	"feat": "phb",
	"psionic": "UATheMysticClass",
	"object": "dmg",
	"cult": "mtf",
	"boon": "mtf",
	"trap": "dmg",
	"hazard": "dmg",
	"deity": "phb",
	"variantrule": "dmg"
};

const VALID_SKILLS = new Set([
	"Acrobatics",
	"Animal Handling",
	"Arcana",
	"Athletics",
	"Deception",
	"History",
	"Insight",
	"Intimidation",
	"Investigation",
	"Medicine",
	"Nature",
	"Perception",
	"Performance",
	"Persuasion",
	"Religion",
	"Sleight of Hand",
	"Stealth",
	"Survival"
]);

const VALID_ACTIONS = new Set([
	"Attack",
	"Dash",
	"Disengage",
	"Dodge",
	"Help",
	"Hide",
	"Ready",
	"Search",
	"Use an Object"
]);

function isIgnored (directory) {
	return directory === "./data/roll20-module";
}

function fileRecurse (file, fileHandler, filenameMatcher) {
	if (file.endsWith(".json") && (filenameMatcher == null || filenameMatcher.test(file.split("/").last()))) {
		fileHandler(file);
		if (msg && msg.trim() && msg.slice(-2) !== "\n\n") msg += "\n\n";
	} else if (fs.lstatSync(file).isDirectory() && !isIgnored(file)) fs.readdirSync(file).forEach(nxt => fileRecurse(`${file}/${nxt}`, fileHandler, filenameMatcher))
}

function dataRecurse (file, obj, primitiveHandlers, lastType, lastKey) {
	const to = typeof obj;
	if (obj == null) return;

	switch (to) {
		case undefined:
			if (primitiveHandlers.undefined) primitiveHandlers.undefined(file, obj, lastType, lastKey);
			break;
		case "boolean":
			if (primitiveHandlers.boolean) primitiveHandlers.boolean(file, obj, lastType, lastKey);
			break;
		case "number":
			if (primitiveHandlers.number) primitiveHandlers.number(file, obj, lastType, lastKey);
			break;
		case "string":
			if (primitiveHandlers.string) primitiveHandlers.string(file, obj, lastType, lastKey);
			break;
		case "object": {
			if (obj instanceof Array) {
				obj.forEach(it => dataRecurse(file, it, primitiveHandlers, lastType, lastKey));
			} else {
				Object.keys(obj).forEach(k => {
					const v = obj[k];
					obj[k] = dataRecurse(file, v, primitiveHandlers, lastType, k)
				});
			}
			break;
		}
		default:
			console.warn("Unhandled type?!", to);
	}
}

function getSimilar (url) {
	// scan for a list of similar entries, to aid debugging
	const similarUrls = [];
	const similar = /^\w+\.html#\w+/.exec(url);
	Array.from(ALL_URLS).forEach(it => {
		if (similar && it.startsWith(similar[0])) similarUrls.push(it)
	});
	return JSON.stringify(similarUrls, null, 2);
}

function checkFile (file) {
	const contents = fs.readFileSync(file, 'utf8');
	let match;
	// eslint-disable-next-line no-cond-assign
	while (match = re.exec(contents)) {
		const tag = match[1];
		const toEncode = [match[2]];

		if (tag === "deity") {
			toEncode.push();
			toEncode.push(match[4] || "forgotten realms");
			toEncode.push(match[6] || TAG_TO_DEFAULT_SOURCE[tag]);
		} else {
			toEncode.push(match[4] || TAG_TO_DEFAULT_SOURCE[tag]);
		}

		const url = `${TAG_TO_PAGE[tag]}#${UrlUtil.encodeForHash(toEncode)}`.toLowerCase().trim()
			.replace(/%5c/gi, ""); // replace slashes
		if (!ALL_URLS.has(url)) msg += `Missing link: ${match[0]} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
	}

	// eslint-disable-next-line no-cond-assign
	while (match = skillRe.exec(contents)) {
		const skill = match[1];
		if (!VALID_SKILLS.has(skill)) {
			msg += `Unknown skill: ${match[0]} in file ${file} (evaluates to "${skill}")\n`
		}
	}

	// eslint-disable-next-line no-cond-assign
	while (match = actionRe.exec(contents)) {
		const action = match[1];
		if (!VALID_ACTIONS.has(action)) {
			msg += `Unknown action: ${match[0]} in file ${file} (evaluates to "${action}")\n`
		}
	}
}

const ALL_URLS = new Set();
utS.UtilSearchIndex.getIndex(false, true).forEach(it => {
	ALL_URLS.add(`${UrlUtil.categoryToPage(it.c)}#${it.u.toLowerCase().trim()}`);
});

console.log("##### Checking links in JSON #####");
fileRecurse("./data", checkFile);

class AttachedSpellCheck {
	static run () {
		console.log("##### Checking Attached Spells #####");

		function getEncoded (str) {
			const [name, source] = str.split("|");
			return `${TAG_TO_PAGE["spell"]}#${UrlUtil.encodeForHash([name, source || TAG_TO_DEFAULT_SOURCE["spell"]])}`.toLowerCase().trim();
		}

		function checkRoot (file, root, name, source) {
			function checkDuplicates () {
				const asUrls = root.attachedSpells.map(getEncoded);

				if (asUrls.length !== new Set(asUrls).size) msg += `Duplicate attached spells in ${file} for ${source}, ${name}: ${asUrls.filter(s => asUrls.filter(it => it === s).length > 1).join(", ")}\n`;
			}

			if (root && root.attachedSpells) {
				checkDuplicates();

				root.attachedSpells.forEach(s => {
					const url = getEncoded(s);
					if (!ALL_URLS.has(url)) msg += `Missing link: ${s} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
				})
			}
		}

		const items = require(`../data/items.json`);
		items.item.forEach(it => checkRoot("data/items.json", it, it.name, it.source));

		const magicVariants = require(`../data/magicvariants.json`);
		magicVariants.variant.forEach(va => checkRoot("data/magicvariants.json", va, va.name, va.source) || (va.inherits && checkRoot("data/magicvariants.json", va.inherits, `${va.name} (inherits)`, va.source)));
	}
}
AttachedSpellCheck.run();

if (msg) throw new Error(msg);
console.log("##### Link check complete #####");

class BraceChecker {
	static checkString (file, str) {
		let total = 0;
		for (let i = 0; i < str.length; ++i) {
			const c = str[i];
			switch (c) {
				case "{":
					++total;
					break;
				case "}":
					--total;
					break;
			}
		}
		if (total !== 0) {
			msg += `Mismatched braces in ${file}: "${str}"\n`
		}
	}

	static checkFile (file) {
		const contents = JSON.parse(fs.readFileSync(file, 'utf8'));
		dataRecurse(file, contents, {string: BraceChecker.checkString});
	}

	static run () {
		fileRecurse("./data", BraceChecker.checkFile);
		if (msg) throw new Error(msg);
		console.log(`##### Brace check complete #####`)
	}
}

msg = "";
BraceChecker.run();

class FilterChecker {
	static checkString (file, str) {
		str.replace(/{@filter ([^}]*)}/g, (m0, m1) => {
			const spl = m1.split("|");
			if (spl.length < 3) {
				msg += `Filter tag "${str}" was too short!\n`;
			} else {
				const missingEq = [];
				for (let i = 2; i < spl.length; ++i) {
					if (!spl[i].includes("=")) {
						missingEq.push(spl[i]);
					}
				}
				if (missingEq.length) {
					msg += `Missing equals in filter tag "${str}" in part${missingEq.length > 1 ? "s" : ""} ${missingEq.join(", ")}\n`
				}
			}
			return m0;
		});
	}

	static checkFile (file) {
		const contents = JSON.parse(fs.readFileSync(file, 'utf8'));
		dataRecurse(file, contents, {string: FilterChecker.checkString});
	}

	static run () {
		fileRecurse("./data", FilterChecker.checkFile);
		if (msg) throw new Error(msg);
		console.log(`##### Filter tag check complete #####`)
	}
}
msg = "";
FilterChecker.run();

class AreaChecker {
	static _buildMap (file, data) {
		AreaChecker.headerMap = bu.BookUtil._buildHeaderMap(data, file);
	}

	static checkString (file, str) {
		str.replace(/{@area ([^}]*)}/g, (m0, m1) => {
			const [areaCode, ...otherData] = m1.split("|");
			if (!AreaChecker.headerMap[areaCode]) {
				AreaChecker.errorSet.add(m0);
			}
			return m0;
		});
	}

	static checkFile (file) {
		AreaChecker.errorSet = new Set();
		const contents = JSON.parse(fs.readFileSync(file, 'utf8'));
		AreaChecker._buildMap(file, contents.data);
		dataRecurse(file, contents, {string: AreaChecker.checkString});
		if (AreaChecker.errorSet.size) {
			msg += `Errors in ${file}! See below:\n`;

			const toPrint = [...AreaChecker.errorSet].sort(SortUtil.ascSortLower);
			toPrint.forEach(tp => msg += `${tp}\n`);
		}
	}

	static run () {
		fileRecurse("./data", AreaChecker.checkFile, AreaChecker.fileMatcher);
		if (msg) throw new Error(msg);
		console.log(`##### Area tag check complete #####`)
	}
}
AreaChecker.errorSet = new Set();
AreaChecker.fileMatcher = /^(adventure-).*\.json/;

msg = "";
AreaChecker.run();