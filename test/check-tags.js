const fs = require('fs');
const ut = require('../js/utils.js');
const er = require('../js/entryrender.js');
const utS = require("../node/util-search-index");
const bu = require("../js/bookutils");

const TIME_TAG = "\tRun duration";
console.time(TIME_TAG);

const MSG = {
	LinkCheck: "",
	AttachedSpellAndGroupItemsCheck: "",
	BraceCheck: "",
	FilterCheck: "",
	ScaleDiceCheck: "",
	StripTagTest: "",
	AreaCheck: "",
	LootCheck: "",
	TableDiceTest: ""
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
	"variantrule": "dmg",
	"ship": "NONE"
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
	string: [],
	object: []
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
				if (primitiveHandlers.object) {
					primitiveHandlers.object instanceof Array
						? primitiveHandlers.object.forEach(ph => ph(file, obj, lastType, lastKey))
						: primitiveHandlers.object(file, obj, lastType, lastKey);
				}
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
		while ((match = LinkCheck.re.exec(str))) {
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

		while ((match = LinkCheck.skillRe.exec(str))) {
			const skill = match[1];
			if (!VALID_SKILLS.has(skill)) {
				MSG.LinkCheck += `Unknown skill: ${match[0]} in file ${file} (evaluates to "${skill}")\n`
			}
		}

		while ((match = LinkCheck.actionRe.exec(str))) {
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

class AttachedSpellAndGroupItemsCheck {
	static run () {
		function getEncoded (str, tag) {
			const [name, source] = str.split("|");
			return `${TAG_TO_PAGE[tag]}#${UrlUtil.encodeForHash([name, source || TAG_TO_DEFAULT_SOURCE[tag]])}`.toLowerCase().trim();
		}

		function checkRoot (file, root, name, source) {
			function checkDuplicates (prop, tag) {
				const asUrls = root[prop].map(it => getEncoded(it, tag));

				if (asUrls.length !== new Set(asUrls).size) MSG.AttachedSpellAndGroupItemsCheck += `Duplicate ${prop} in ${file} for ${source}, ${name}: ${asUrls.filter(s => asUrls.filter(it => it === s).length > 1).join(", ")}\n`;
			}

			function checkExists (prop, tag) {
				root[prop].forEach(s => {
					const url = getEncoded(s, tag);
					if (!ALL_URLS.has(url)) MSG.AttachedSpellAndGroupItemsCheck += `Missing link: ${s} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
				})
			}

			if (root) {
				if (root.attachedSpells) {
					checkDuplicates("attachedSpells", "spell");
					checkExists("attachedSpells", "spell");
				}

				if (root.items) {
					checkDuplicates("items", "item");
					checkExists("items", "item");
				}

				if (root.baseItem) {
					const url = `${TAG_TO_PAGE.item}#${UrlUtil.encodeForHash(root.baseItem.split("|"))}`.toLowerCase().trim()
						.replace(/%5c/gi, "");
					if (!ALL_URLS.has(url)) {
						MSG.AttachedSpellAndGroupItemsCheck += `Missing link: ${root.baseItem} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
					}
				}
			}
		}

		const items = require(`../data/items.json`);
		items.item.forEach(it => checkRoot("data/items.json", it, it.name, it.source));
		items.itemGroup.forEach(it => checkRoot("data/items.json", it, it.name, it.source));

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

class StripTagTest {
	static addHandlers () {
		PRIMITIVE_HANDLERS.string.push(StripTagTest.checkString);
	}

	static checkString (file, str) {
		try {
			EntryRenderer.stripTags(str)
		} catch (e) {
			if (!StripTagTest._seenErrors.has(e.message)) {
				StripTagTest._seenErrors.add(e.message);
				if (MSG.StripTagTest) MSG.StripTagTest = `${MSG.StripTagTest.trim()}\n`;
				MSG.StripTagTest += `Tag stripper error: ${e.message}\n`;
			}
		}
	}
}
StripTagTest._seenErrors = new Set();

class TableDiceTest {
	static addHandlers () {
		PRIMITIVE_HANDLERS.object.push(TableDiceTest.checkTable);
	}

	static checkTable (file, obj) {
		if (obj.type === "table" && EntryRenderer.isRollableTable(obj)) {
			const possibleResults = new Set();
			const errors = [];
			const cbErr = (cell, e) => MSG.TableDiceTest += `Row parse failed! Cell was: "${cell}"; error was: "${e.message}"\n`;
			obj.rows.forEach(r => {
				const row = EntryRenderer.getRollableRow(r, cbErr);
				const cell = row[0].roll;
				if (!cell) return;
				if (cell.exact != null) {
					if (cell.exact === 0 && cell.pad) cell.exact = 100;
					if (possibleResults.has(cell.exact)) errors.push(`"exact" value "${cell.exact}" was repeated!`);
					possibleResults.add(cell.exact);
				} else {
					if (cell.max === 0) cell.max = 100;
					// convert +inf to a reasonable range (no official table goes to 250+ as of 2019-03-01)
					if (cell.max === EntryRenderer.dice.POS_INFINITE) cell.max = 250;
					for (let i = cell.min; i <= cell.max; ++i) {
						if (possibleResults.has(i)) errors.push(`"min-max" value "${i}" was repeated!`);
						possibleResults.add(i);
					}
				}
			});

			const cleanHeader = obj.colLabels[0].trim().replace(/^{@dice (.*?)(\|.*?)?}$/i, "$1");
			const possibleRolls = new Set();
			let hasPrompt = false;

			cleanHeader.split(";").forEach(rollable => {
				if (rollable.includes("#$prompt_")) hasPrompt = true;

				const rollTree = EntryRenderer.dice.parseToTree(rollable);
				if (rollTree) {
					const genRolls = rollTree.nxt();
					let gen;
					while (!(gen = genRolls.next()).done) possibleRolls.add(gen.value);
				} else {
					if (!hasPrompt) errors.push(`"${obj.colLabels[0]}" was not a valid rollable header?!`);
				}
			});

			if (!CollectionUtil.setEq(possibleResults, possibleRolls) && !hasPrompt) {
				errors.push(`Possible results did not match possible rolls!\nPossible results: (${TableDiceTest._flattenSequence([...possibleResults])})\nPossible rolls: (${TableDiceTest._flattenSequence([...possibleRolls])})`);
			}

			if (errors.length) MSG.TableDiceTest += `Errors in ${obj.caption ? `table "${obj.caption}"` : `${JSON.stringify(obj.rows[0]).substring(0, 30)}...`} in ${file}:\n${errors.map(it => `\t${it}`).join("\n")}\n`;
		}
	}

	static _flattenSequence (nums) {
		const out = [];
		let l = null; let r = null;
		nums.sort(SortUtil.ascSort).forEach(n => {
			if (l == null) {
				l = n;
				r = n;
			} else if (n === (r + 1)) {
				r = n;
			} else {
				if (l === r) out.push(`${l}`);
				else out.push(`${l}-${r}`);
				l = n;
				r = n;
			}
		});
		if (l === r) out.push(`${l}`);
		else out.push(`${l}-${r}`);
		return out.join(", ");
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

class LootCheck {
	static run () {
		function handleItem (it) {
			const toCheck = typeof it === "string" ? {name: it, source: SRC_DMG} : it;
			const url = `${TAG_TO_PAGE["item"]}#${UrlUtil.encodeForHash([toCheck.name, toCheck.source])}`.toLowerCase().trim();
			if (!ALL_URLS.has(url)) MSG.LootCheck += `Missing link: ${JSON.stringify(it)} in file "${LootCheck.file}" (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
		}

		const loot = require(`../${LootCheck.file}`);
		loot.magicitems.forEach(it => {
			if (it.table) {
				it.table.forEach(row => {
					if (row.choose) {
						if (row.choose.fromGeneric) {
							row.choose.fromGeneric.forEach(handleItem);
						}

						if (row.choose.fromGroup) {
							row.choose.fromGroup.forEach(handleItem);
						}

						if (row.choose.fromItems) {
							row.choose.fromItems.forEach(handleItem);
						}
					}
				});
			}
		})
	}
}
LootCheck.file = `data/loot.json`;

async function main () {
	const primaryIndex = await utS.UtilSearchIndex.pGetIndex(false, true);
	primaryIndex.forEach(it => ALL_URLS.add(`${UrlUtil.categoryToPage(it.c)}#${it.u.toLowerCase().trim()}`));
	const highestId = primaryIndex.last().id;
	const secondaryIndexItem = await utS.UtilSearchIndex.pGetIndexAdditionalItem(highestId + 1, false);
	secondaryIndexItem.forEach(it => ALL_URLS.add(`${UrlUtil.categoryToPage(it.c)}#${it.u.toLowerCase().trim()}`));

	LinkCheck.addHandlers();
	BraceCheck.addHandlers();
	FilterCheck.addHandlers();
	ScaleDiceCheck.addHandlers();
	StripTagTest.addHandlers();
	TableDiceTest.addHandlers();

	fileRecurse("./data", (file) => {
		const contents = JSON.parse(fs.readFileSync(file, 'utf8'));
		dataRecurse(file, contents, PRIMITIVE_HANDLERS);
	});

	AttachedSpellAndGroupItemsCheck.run();
	AreaCheck.run();
	LootCheck.run();

	let outMessage = "";
	Object.entries(MSG).forEach(([k, v]) => {
		if (v) outMessage += `Error messages for ${k}:\n\n${v}`;
		else console.log(`##### ${k} passed! #####`)
	});
	if (outMessage) throw new Error(outMessage);

	console.timeEnd(TIME_TAG);
}

return main();
