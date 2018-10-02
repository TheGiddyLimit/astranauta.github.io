const fs = require('fs');
const ut = require('../js/utils.js');
const utS = require("../node/util-search-index");
const bu = require("../js/bookutils");

const TIME_TAG = "\tRun duration";
console.time(TIME_TAG);

const MSG = {
	LinkCheck: "",
	AttachedSpellCheck: "",
	BraceCheck: "",
	FilterCheck: "",
	ScaleDiceCheck: "",
	AreaCheck: ""
};

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

const ALL_URLS = new Set();
utS.UtilSearchIndex.getIndex(false, true).forEach(it => {
	ALL_URLS.add(`${UrlUtil.categoryToPage(it.c)}#${it.u.toLowerCase().trim()}`);
});

function isIgnored (directory) {
	return directory === "./data/roll20-module";
}

function fileRecurse (file, fileHandler, filenameMatcher) {
	if (file.endsWith(".json") && (filenameMatcher == null || filenameMatcher.test(file.split("/").last()))) {
		fileHandler(file);
		Object.keys(MSG).forEach(k => {
			if (MSG[k] && MSG[k].trim() && MSG[k].slice(-2) !== "\n\n") MSG[k] += "\n\n";
		});
	} else if (fs.lstatSync(file).isDirectory() && !isIgnored(file)) fs.readdirSync(file).forEach(nxt => fileRecurse(`${file}/${nxt}`, fileHandler, filenameMatcher))
}

const PRIMITIVE_HANDLERS = {
	undefined: [],
	boolean: [],
	number: [],
	string: []
};
function dataRecurse (file, obj, primitiveHandlers, lastType, lastKey) {
	const to = typeof obj;
	if (obj == null) return;

	switch (to) {
		case undefined:
			if (primitiveHandlers.undefined) {
				primitiveHandlers.undefined instanceof Array
					? primitiveHandlers.undefined.forEach(ph => ph(file, obj, lastType, lastKey))
					: primitiveHandlers.undefined(file, obj, lastType, lastKey);
			}
			break;
		case "boolean":
			if (primitiveHandlers.boolean) {
				primitiveHandlers.boolean instanceof Array
					? primitiveHandlers.boolean.forEach(ph => ph(file, obj, lastType, lastKey))
					: primitiveHandlers.boolean(file, obj, lastType, lastKey);
			}
			break;
		case "number":
			if (primitiveHandlers.number) {
				primitiveHandlers.number instanceof Array
					? primitiveHandlers.number.forEach(ph => ph(file, obj, lastType, lastKey))
					: primitiveHandlers.number(file, obj, lastType, lastKey);
			}
			break;
		case "string":
			if (primitiveHandlers.string) {
				primitiveHandlers.string instanceof Array
					? primitiveHandlers.string.forEach(ph => ph(file, obj, lastType, lastKey))
					: primitiveHandlers.string(file, obj, lastType, lastKey);
			}
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

class LinkCheck {
	static addHandlers () {
		PRIMITIVE_HANDLERS.string.push(LinkCheck.checkString);
	}

	static checkString (file, str) {
		let match;
		// eslint-disable-next-line no-cond-assign
		while (match = LinkCheck.re.exec(str)) {
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
			if (!ALL_URLS.has(url)) {
				MSG.LinkCheck += `Missing link: ${match[0]} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
			}
		}

		// eslint-disable-next-line no-cond-assign
		while (match = LinkCheck.skillRe.exec(str)) {
			const skill = match[1];
			if (!VALID_SKILLS.has(skill)) {
				MSG.LinkCheck += `Unknown skill: ${match[0]} in file ${file} (evaluates to "${skill}")\n`
			}
		}

		// eslint-disable-next-line no-cond-assign
		while (match = LinkCheck.actionRe.exec(str)) {
			const action = match[1];
			if (!VALID_ACTIONS.has(action)) {
				MSG.LinkCheck += `Unknown action: ${match[0]} in file ${file} (evaluates to "${action}")\n`
			}
		}
	}
}
LinkCheck.re = /{@(spell|item|class|creature|condition|disease|background|race|optfeature|feat|reward|psionic|object|cult|boon|trap|hazard|deity|variantrule) (.*?)(\|(.*?))?(\|(.*?))?(\|.*?)?}/g;
LinkCheck.skillRe = /{@skill (.*?)(\|.*?)?}/g;
LinkCheck.actionRe = /{@action (.*?)(\|.*?)?}/g;

class AttachedSpellCheck {
	static run () {
		function getEncoded (str) {
			const [name, source] = str.split("|");
			return `${TAG_TO_PAGE["spell"]}#${UrlUtil.encodeForHash([name, source || TAG_TO_DEFAULT_SOURCE["spell"]])}`.toLowerCase().trim();
		}

		function checkRoot (file, root, name, source) {
			function checkDuplicates () {
				const asUrls = root.attachedSpells.map(getEncoded);

				if (asUrls.length !== new Set(asUrls).size) MSG.AttachedSpellCheck += `Duplicate attached spells in ${file} for ${source}, ${name}: ${asUrls.filter(s => asUrls.filter(it => it === s).length > 1).join(", ")}\n`;
			}

			if (root) {
				if (root.attachedSpells) {
					checkDuplicates();

					root.attachedSpells.forEach(s => {
						const url = getEncoded(s);
						if (!ALL_URLS.has(url)) MSG.AttachedSpellCheck += `Missing link: ${s} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
					})
				}

				if (root.baseItem) {
					const url = `${TAG_TO_PAGE.item}#${UrlUtil.encodeForHash(root.baseItem.split("|"))}`.toLowerCase().trim()
						.replace(/%5c/gi, "");
					if (!ALL_URLS.has(url)) {
						MSG.AttachedSpellCheck += `Missing link: ${root.baseItem} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
					}
				}
			}
		}

		const items = require(`../data/items.json`);
		items.item.forEach(it => checkRoot("data/items.json", it, it.name, it.source));

		const magicVariants = require(`../data/magicvariants.json`);
		magicVariants.variant.forEach(va => checkRoot("data/magicvariants.json", va, va.name, va.source) || (va.inherits && checkRoot("data/magicvariants.json", va.inherits, `${va.name} (inherits)`, va.source)));
	}
}

class BraceCheck {
	static addHandlers () {
		PRIMITIVE_HANDLERS.string.push(BraceCheck.checkString);
	}

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
			MSG.BraceCheck += `Mismatched braces in ${file}: "${str}"\n`
		}
	}
}

class FilterCheck {
	static addHandlers () {
		PRIMITIVE_HANDLERS.string.push(FilterCheck.checkString);
	}

	static checkString (file, str) {
		str.replace(/{@filter ([^}]*)}/g, (m0, m1) => {
			const spl = m1.split("|");
			if (spl.length < 3) {
				MSG.FilterCheck += `Filter tag "${str}" was too short!\n`;
			} else {
				const missingEq = [];
				for (let i = 2; i < spl.length; ++i) {
					if (!spl[i].includes("=")) {
						missingEq.push(spl[i]);
					}
				}
				if (missingEq.length) {
					MSG.FilterCheck += `Missing equals in filter tag "${str}" in part${missingEq.length > 1 ? "s" : ""} ${missingEq.join(", ")}\n`
				}
			}
			return m0;
		});
	}
}

class ScaleDiceCheck {
	static addHandlers () {
		PRIMITIVE_HANDLERS.string.push(ScaleDiceCheck.checkString);
	}

	static checkString (file, str) {
		str.replace(/{@scaledice ([^}]*)}/g, (m0, m1) => {
			const spl = m1.split("|");
			if (spl.length < 3) {
				MSG.ScaleDiceCheck += `Scaledice tag "${str}" was too short!\n`;
			} else if (spl.length > 3) {
				MSG.ScaleDiceCheck += `Scaledice tag "${str}" was too long!\n`;
			} else {
				let range;
				try {
					range = MiscUtil.parseNumberRange(spl[1], 1, 9);
				} catch (e) {
					MSG.ScaleDiceCheck += `Range "${spl[1]}" is invalid!\n`;
					return;
				}
				if (range.size < 2) MSG.ScaleDiceCheck += `Range "${spl[1]}" has too few entries! Should be 2 or more.\n`;
			}
			return m0;
		});
	}
}

class AreaCheck {
	static _buildMap (file, data) {
		AreaCheck.headerMap = bu.BookUtil._buildHeaderMap(data, file);
	}

	static checkString (file, str) {
		str.replace(/{@area ([^}]*)}/g, (m0, m1) => {
			const [areaCode, ...otherData] = m1.split("|");
			if (!AreaCheck.headerMap[areaCode]) {
				AreaCheck.errorSet.add(m0);
			}
			return m0;
		});
	}

	static checkFile (file) {
		AreaCheck.errorSet = new Set();
		const contents = JSON.parse(fs.readFileSync(file, 'utf8'));
		AreaCheck._buildMap(file, contents.data);
		dataRecurse(file, contents, {string: AreaCheck.checkString});
		if (AreaCheck.errorSet.size) {
			MSG.AreaCheck += `Errors in ${file}! See below:\n`;

			const toPrint = [...AreaCheck.errorSet].sort(SortUtil.ascSortLower);
			toPrint.forEach(tp => MSG.AreaCheck += `${tp}\n`);
		}
	}

	static run () {
		fileRecurse("./data", AreaCheck.checkFile, AreaCheck.fileMatcher);
	}
}
AreaCheck.errorSet = new Set();
AreaCheck.fileMatcher = /^(adventure-).*\.json/;

LinkCheck.addHandlers();
BraceCheck.addHandlers();
FilterCheck.addHandlers();
ScaleDiceCheck.addHandlers();

fileRecurse("./data", (file) => {
	const contents = JSON.parse(fs.readFileSync(file, 'utf8'));
	dataRecurse(file, contents, PRIMITIVE_HANDLERS);
});

AttachedSpellCheck.run();
AreaCheck.run();

let outMessage = "";
Object.entries(MSG).forEach(([k, v]) => {
	if (v) outMessage += `Error messages for ${k}:\n\n${v}`;
	else console.log(`##### ${k} passed! #####`)
});
if (outMessage) throw new Error(outMessage);

console.timeEnd(TIME_TAG);
