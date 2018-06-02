"use strict";

const JSON_URL = "data/bestiary/index.json";

window.onload = loadSources;

function moveon (cur) {
	return (!cur.toUpperCase().indexOf("ACTIONS") || !cur.toUpperCase().indexOf("LEGENDARY ACTIONS") || !cur.toUpperCase().indexOf("REACTIONS"))
}

function tryConvertNumber (strNumber) {
	try {
		return Number(strNumber)
	} catch (e) {
		return strNumber;
	}
}

function tryParseType (strType) {
	try {
		const m = /^(.*?) (\(.*?\))\s*$/.exec(strType);
		if (m) {
			return {type: m[1].toLowerCase(), tags: m[2].split(",").map(s => s.replace(/\(/g, "").replace(/\)/g, "").trim().toLowerCase())}
		}
		return strType.toLowerCase();
	} catch (e) {
		return strType;
	}
}

function tryGetStat (strLine) {
	try {
		return tryConvertNumber(/(\d+) \(.*?\)/.exec(strLine)[1]);
	} catch (e) {
		return 0;
	}
}

// Tries to parse immunities, resistances, and vulnerabilities
function tryParseSpecialDamage (strDamage, damageType) {
	const splSemi = strDamage.toLowerCase().split(";");
	const newDamage = [];
	try {
		splSemi.forEach(section => {
			const tempDamage = {};
			let pushArray = newDamage;
			if (section.includes("from")) {
				tempDamage[damageType] = [];
				pushArray = tempDamage[damageType];
				tempDamage["note"] = /from .*/.exec(section)[0];
				section = /(.*) from /.exec(section)[1];
			}
			section = section.replace(/and/g, '');
			section.split(",").forEach(s => {
				pushArray.push(s.trim());
			});
			if ("note" in tempDamage) {
				newDamage.push(tempDamage)
			}
		});
		return newDamage;
	} catch (ignored) {
		return strDamage;
	}
}

function tryParseSpellcasting (trait) {
	let spellcasting = [];

	function parseSpellcasting (trait) {
		const splitter = new RegExp(/,\s?(?![^(]*\))/, "g"); // split on commas not within parentheses

		let name = trait.name;
		let spellcastingEntry = {"name": name, "headerEntries": [parseToHit(trait.entries[0])]};
		let doneHeader = false;
		for (let i = 1; i < trait.entries.length; i++) {
			let thisLine = trait.entries[i];
			if (thisLine.includes("/rest")) {
				doneHeader = true;
				let property = thisLine.substr(0, 1) + (thisLine.includes(" each:") ? "e" : "");
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(splitter).map(i => parseSpell(i));
				if (!spellcastingEntry.rest) spellcastingEntry.rest = {};
				spellcastingEntry.rest[property] = value;
			} else if (thisLine.includes("/day")) {
				doneHeader = true;
				let property = thisLine.substr(0, 1) + (thisLine.includes(" each:") ? "e" : "");
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(splitter).map(i => parseSpell(i));
				if (!spellcastingEntry.daily) spellcastingEntry.daily = {};
				spellcastingEntry.daily[property] = value;
			} else if (thisLine.includes("/week")) {
				doneHeader = true;
				let property = thisLine.substr(0, 1) + (thisLine.includes(" each:") ? "e" : "");
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(splitter).map(i => parseSpell(i));
				if (!spellcastingEntry.weekly) spellcastingEntry.weekly = {};
				spellcastingEntry.weekly[property] = value;
			} else if (thisLine.startsWith("Constant: ")) {
				doneHeader = true;
				spellcastingEntry.constant = thisLine.substring(9).split(splitter).map(i => parseSpell(i));
			} else if (thisLine.startsWith("At will: ")) {
				doneHeader = true;
				spellcastingEntry.will = thisLine.substring(9).split(splitter).map(i => parseSpell(i));
			} else if (thisLine.includes("Cantrip")) {
				doneHeader = true;
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(splitter).map(i => parseSpell(i));
				if (!spellcastingEntry.spells) spellcastingEntry.spells = {"0": {"spells": []}};
				spellcastingEntry.spells["0"].spells = value;
			} else if (thisLine.includes(" level") && thisLine.includes(": ")) {
				doneHeader = true;
				let property = thisLine.substr(0, 1);
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(splitter).map(i => parseSpell(i));
				if (!spellcastingEntry.spells) spellcastingEntry.spells = {};
				let slots = thisLine.includes(" slot") ? parseInt(thisLine.substr(11, 1)) : 0;
				spellcastingEntry.spells[property] = {"slots": slots, "spells": value};
			} else {
				if (doneHeader) {
					if (!spellcastingEntry.footerEntries) spellcastingEntry.footerEntries = [];
					spellcastingEntry.footerEntries.push(parseToHit(thisLine));
				} else {
					spellcastingEntry.headerEntries.push(parseToHit(thisLine));
				}
			}
		}
		spellcasting.push(spellcastingEntry);
	}

	function parseSpell (name) {
		function getSourcePart (spellName) {
			const source = getSpellSource(spellName);
			return `${source && source !== SRC_PHB ? `|${source}` : ""}`;
		}

		name = name.trim();
		let asterix = name.indexOf("*");
		let brackets = name.indexOf(" (");
		if (asterix !== -1) {
			const trueName = name.substr(0, asterix);
			return `{@spell ${trueName}${getSourcePart(trueName)}}*`;
		} else if (brackets !== -1) {
			const trueName = name.substr(0, brackets);
			return `{@spell ${trueName}${getSourcePart(trueName)}}${name.substring(brackets)}`;
		}
		return `{@spell ${name}${getSourcePart(name)}}`;
	}

	function parseToHit (line) {
		return line.replace(/( \+)(\d+)( to hit with spell)/g, (m0, m1, m2, m3) => {
			return ` {@hit ${m2}}${m3}`;
		});
	}

	try {
		parseSpellcasting(trait);
		return {out: spellcasting, success: true};
	} catch (e) {
		return {out: trait, success: false};
	}
}

const SKILL_SPACE_MAP = {
	"sleightofhand": "sleight of hand",
	"animalhandling": "animal handling"
};

const ALIGNMENT_MAP = {
	"any non-good alignment": ["L", "NX", "C", "NY", "E"],
	"any non-lawful alignment": ["NX", "C", "G", "NY", "E"],
	"any chaotic alignment": ["C", "G", "NY", "E"],
	"any evil alignment": ["L", "NX", "C", "E"],
	"any alignment": ["A"],
	"unaligned": ["U"],
	"neutral": ["N"],
	"chaotic evil": ["C", "E"],
	"chaotic neutral": ["C", "N"],
	"chaotic good": ["C", "G"],
	"neutral good": ["N", "G"],
	"neutral evil": ["N", "E"],
	"lawful evil": ["L", "E"],
	"lawful neutral": ["L", "N"],
	"lawful good": ["L", "G"]
};

const SPELL_SRC_MAP = {};
function getSpellSource (spellName) {
	if (spellName && SPELL_SRC_MAP[spellName.toLowerCase()]) return SPELL_SRC_MAP[spellName.toLowerCase()];
	return null;
}

function loadSources () {
	DataUtil.loadJSON(`data/spells/index.json`)
		.then(index => Promise.all(Object.values(index).map(f => DataUtil.loadJSON(`data/spells/${f}`))))
		.then(spellData => {
			// reversed so official sources take precedence over 3pp
			spellData.reverse().forEach(d => d.spell.forEach(s => SPELL_SRC_MAP[s.name.toLowerCase()] = s.source));
			DataUtil.loadJSON(JSON_URL).then(loadparser);
		});
}

function sortOptions ($select) {
	$select.append($select.find("option").remove().sort((a, b) => {
		const at = $(a).text();
		const bt = $(b).text();
		return (at > bt) ? 1 : ((at < bt) ? -1 : 0);
	}));
}

function appendSource ($select, src) {
	$select.append(`<option value="${src}">${src}</option>`);
}

const COOKIE_NAME = "converterSources";
function loadparser (data) {
	let hasAppended = false;

	// custom sources
	const $srcSel = $(`#source`);
	Object.keys(data).forEach(src => appendSource($srcSel, src));
	const rawCookie = Cookies.get(COOKIE_NAME);
	const cookie = rawCookie ? JSON.parse(rawCookie) : {sources: [], selected: SRC_MM};
	cookie.sources.forEach(src => appendSource($srcSel, src));
	sortOptions($srcSel);
	$srcSel.val(cookie.selected);

	$srcSel.on("change", () => cookie.selected = $srcSel.val());

	window.addEventListener("unload", function () {
		Cookies.set(COOKIE_NAME, cookie, {expires: 365, path: window.location.pathname})
	});

	const $inptCustomSource = $(`#customsourcein`);
	$(`#addsource`).on("click", () => {
		const toAdd = $inptCustomSource.val().trim();
		if (!cookie.sources.find(src => toAdd.toLowerCase() === src.toLowerCase())) {
			cookie.selected = toAdd;
			cookie.sources.push(toAdd);
			appendSource($srcSel, toAdd);
			sortOptions($srcSel);
			$srcSel.val(toAdd);
			$inptCustomSource.val("");
		}
	});

	// init editor
	const editor = ace.edit("statblock");
	editor.setOptions({
		wrap: true
	});

	$(`button#parsestatblockadd`).on("click", () => {
		if ($(`#parse_mode`).val() === "txt") doParseText(true);
		else doParseMarkdown(true);
	});

	$("button#parsestatblock").on("click", () => {
		if (!hasAppended || confirm("You're about to overwrite multiple entries. Are you sure?")) {
			if ($(`#parse_mode`).val() === "txt") doParseText(false);
			else doParseMarkdown(false);
		}
	});

	// SHARED PARSING FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	function getCleanInput (ipt) {
		// convert minus signs to hyphens
		return ipt.replace(/[−–]/g, "-");
	}

	function getCleanName (line) {
		return line.toLowerCase().replace(/\b\w/g, function (l) {
			return l.toUpperCase()
		});
	}

	function setCleanSizeTypeAlignment (stats, line) {
		stats.size = line[0].toUpperCase();
		stats.type = line.split(",")[0].split(" ").splice(1).join(" ");
		stats.type = tryParseType(stats.type);

		stats.alignment = line.split(", ")[1].toLowerCase();
		stats.alignment = ALIGNMENT_MAP[stats.alignment] || stats.alignment;
	}

	function setCleanHp (stats, line) {
		const rawHp = line.split("Hit Points ")[1];
		// split HP into average and formula
		const m = /^(\d+) \((.*?)\)$/.exec(rawHp);
		if (!m) stats.hp = {special: rawHp}; // for e.g. Avatar of Death
		else {
			stats.hp = {
				average: Number(m[1]),
				formula: m[2]
			};
		}
	}

	function setCleanSpeed (stats, line) {
		line = line.toLowerCase().trim().replace(/^speed\s*/, "");
		const ALLOWED = ["walk", "fly", "swim", "climb", "burrow"];

		function splitSpeed (str) {
			let c;
			let ret = [];
			let stack = "";
			let para = 0;
			for (let i = 0; i < str.length; ++i) {
				c = str.charAt(i);
				switch (c) {
					case ",":
						if (para === 0) {
							ret.push(stack);
							stack = "";
						}
						break;
					case "(":
						para++;
						stack += c;
						break;
					case ")":
						para--;
						stack += c;
						break;
					default:
						stack += c;
				}
			}
			if (stack) ret.push(stack);
			return ret.map(it => it.trim()).filter(it => it);
		}

		const out = {};
		let byHand = false;

		splitSpeed(line.toLowerCase()).map(it => it.trim()).forEach(s => {
			const m = /^(\w+?\s+)?(\d+)\s*ft\.( .*)?$/.exec(s);
			if (!m) {
				byHand = true;
				return;
			}

			if (m[1]) m[1] = m[1].trim();
			else m[1] = "walk";

			if (ALLOWED.includes(m[1])) {
				if (m[3]) {
					out[m[1]] = {
						number: Number(m[2]),
						condition: m[3].trim()
					};
				} else out[m[1]] = Number(m[2]);
			} else byHand = true;
		});

		// flag speed as invalid
		if (Object.values(out).filter(s => (s.number != null ? s.number : s) % 5 !== 0).length) out.INVALID_SPEED = true;

		// flag speed as needing hand-parsing
		if (byHand) out.UNPARSED_SPEED = line;
		stats.speed = out;
	}

	function setCleanSaves (stats, line) {
		stats.save = line.split("Saving Throws")[1].trim();
		// convert to object format
		if (stats.save && stats.save.trim()) {
			const spl = stats.save.split(",").map(it => it.trim().toLowerCase()).filter(it => it);
			const nu = {};
			spl.forEach(it => {
				const sv = it.split(" ");
				nu[sv[0]] = sv[1];
			});
			stats.save = nu;
		}
	}

	function setCleanSkills (stats, line) {
		stats.skill = line.split("Skills")[1].trim().toLowerCase();
		const split = stats.skill.split(",");
		const newSkills = {};
		try {
			split.forEach(s => {
				const splSpace = s.split(" ");
				const val = splSpace.pop().trim();
				let name = splSpace.join(" ").toLowerCase().trim().replace(/ /g, "");
				name = SKILL_SPACE_MAP[name] || name;
				newSkills[name] = val;
			});
			stats.skill = newSkills;
			if (stats.skill[""]) delete stats.skill[""]; // remove empty properties
		} catch (ignored) {
			return 0;
		}
	}

	function setCleanDamageVuln (stats, line) {
		stats.vulnerable = line.split("Vulnerabilities")[1].trim();
		stats.vulnerable = tryParseSpecialDamage(stats.vulnerable, "vulnerable");
	}

	function setCleanDamageRes (stats, line) {
		stats.resist = line.split("Resistances")[1].trim();
		stats.resist = tryParseSpecialDamage(stats.resist, "resist");
	}

	function setCleanDamageImm (stats, line) {
		stats.immune = line.split("Immunities")[1].trim();
		stats.immune = tryParseSpecialDamage(stats.immune, "immune");
	}

	function setCleanConditionImm (stats, line) {
		stats.conditionImmune = line.split("Immunities")[1];
		stats.conditionImmune = tryParseSpecialDamage(stats.conditionImmune, "conditionImmune");
	}

	function setCleanSenses (stats, line) {
		stats.senses = line.toLowerCase().split("senses")[1].split("passive perception")[0].trim();
		if (!stats.senses.indexOf("passive perception")) stats.senses = "";
		if (stats.senses[stats.senses.length - 1] === ",") stats.senses = stats.senses.substring(0, stats.senses.length - 1);
		stats.passive = tryConvertNumber(line.toLowerCase().split("passive perception")[1].trim());
	}

	function setCleanLanguages (stats, line) {
		stats.languages = line.split("Languages")[1].trim();
	}

	function setCleanCr (stats, line) {
		stats.cr = line.split("Challenge")[1].trim().split("(")[0].trim();
	}

	function hasEntryContent (trait) {
		return trait && (trait.name || (trait.entries.length === 1 && trait.entries[0]) || trait.entries.length > 1);
	}

	function doConvertDiceTags (trait) {
		if (trait.entries) {
			trait.entries = trait.entries.filter(it => it.trim()).map(e => {
				if (typeof e !== "string") return e;

				// replace e.g. "+X to hit"
				e = e.replace(/([-+])?\d+(?= to hit)/g, function (match) {
					return `{@hit ${match}}`
				});

				// replace e.g. "2d4+2"
				e = e.replace(/\d+d\d+(\s?([-+])\s?\d+\s?)?/g, function (match) {
					return `{@dice ${match}}`;
				});

				return e;
			});
		}
	}

	/**
	 * Parses statblocks from raw text pastes
	 * @param append
	 */
	function doParseText (append) {
		const toConvert = getCleanInput(editor.getValue()).split("\n");
		const stats = {};
		stats.source = $srcSel.val();
		// for the user to fill out
		stats.page = 0;

		let prevLine = null;
		let curLine = null;
		for (let i = 0; i < toConvert.length; i++) {
			prevLine = curLine;
			curLine = toConvert[i].trim();

			if (curLine === "") continue;

			// name of monster
			if (i === 0) {
				stats.name = getCleanName(curLine);
				continue;
			}

			// size type alignment
			if (i === 1) {
				setCleanSizeTypeAlignment(stats, curLine);
				continue;
			}

			// armor class
			if (i === 2) {
				stats.ac = curLine.split("Armor Class ")[1];
				continue;
			}

			// hit points
			if (i === 3) {
				setCleanHp(stats, curLine);
				continue;
			}

			// speed
			if (i === 4) {
				setCleanSpeed(stats, curLine);
				continue;
			}

			if (i === 5) continue;
			// ability scores
			if (i === 6) {
				const abilities = curLine.split(/ \(([+-–‒])?[0-9]*\) ?/g);
				stats.str = tryConvertNumber(abilities[0]);
				stats.dex = tryConvertNumber(abilities[2]);
				stats.con = tryConvertNumber(abilities[4]);
				stats.int = tryConvertNumber(abilities[6]);
				stats.wis = tryConvertNumber(abilities[8]);
				stats.cha = tryConvertNumber(abilities[10]);
				continue;
			}

			// alternate ability scores
			switch (prevLine.toLowerCase()) {
				case "str":
					stats.str = tryGetStat(curLine);
					break;
				case "dex":
					stats.dex = tryGetStat(curLine);
					break;
				case "con":
					stats.con = tryGetStat(curLine);
					break;
				case "int":
					stats.int = tryGetStat(curLine);
					break;
				case "wis":
					stats.wis = tryGetStat(curLine);
					break;
				case "cha":
					stats.cha = tryGetStat(curLine);
					break;
			}

			// saves (optional)
			if (!curLine.indexOf("Saving Throws ")) {
				setCleanSaves(stats, curLine);
				continue;
			}

			// skills (optional)
			if (!curLine.indexOf("Skills ")) {
				setCleanSkills(stats, curLine);
				continue;
			}

			// damage vulnerabilities (optional)
			if (!curLine.indexOf("Damage Vulnerabilities ")) {
				setCleanDamageVuln(stats, curLine);
				continue;
			}

			// damage resistances (optional)
			if (!curLine.indexOf("Damage Resistance")) {
				setCleanDamageRes(stats, curLine);
				continue;
			}

			// damage immunities (optional)
			if (!curLine.indexOf("Damage Immunities ")) {
				setCleanDamageImm(stats, curLine);
				continue;
			}

			// condition immunities (optional)
			if (!curLine.indexOf("Condition Immunities ")) {
				setCleanConditionImm(stats, curLine);
				continue;
			}

			// senses
			if (!curLine.indexOf("Senses ")) {
				setCleanSenses(stats, curLine);
				continue;
			}

			// languages
			if (!curLine.indexOf("Languages ")) {
				setCleanLanguages(stats, curLine);
				continue;
			}

			// challenges and traits
			// goes into actions
			if (!curLine.indexOf("Challenge ")) {
				setCleanCr(stats, curLine);

				// traits
				i++;
				curLine = toConvert[i];
				stats.trait = [];
				stats.action = [];
				stats.reaction = [];
				stats.legendary = [];

				let curtrait = {};

				let ontraits = true;
				let onactions = false;
				let onreactions = false;
				let onlegendaries = false;
				let onlegendarydescription = false;

				// keep going through traits til we hit actions
				while (i < toConvert.length) {
					if (moveon(curLine)) {
						ontraits = false;
						onactions = !curLine.toUpperCase().indexOf("ACTIONS");
						onreactions = !curLine.toUpperCase().indexOf("REACTIONS");
						onlegendaries = !curLine.toUpperCase().indexOf("LEGENDARY ACTIONS");
						onlegendarydescription = onlegendaries;
						i++;
						curLine = toConvert[i];
					}

					// get the name
					curtrait.name = "";
					curtrait.entries = [];

					const parseAction = line => {
						curtrait.name = line.split(/([.!])/g)[0];
						curtrait.entries.push(line.split(".").splice(1).join(".").trim());
					};

					if (onlegendarydescription) {
						// usually the first paragraph is a description of how many legendary actions the creature can make
						// but in the case that it's missing the substring "legendary" and "action" it's probably an action
						const compressed = curLine.replace(/\s*/g, "").toLowerCase();
						if (!compressed.includes("legendary") && !compressed.includes("action")) onlegendarydescription = false;
					}

					if (onlegendarydescription) {
						curtrait.entries.push(curLine.trim());
						onlegendarydescription = false;
					} else {
						parseAction(curLine);
					}

					i++;
					curLine = toConvert[i];

					// get paragraphs
					// connecting words can start with: o ("of", "or"); t ("the"); a ("and", "at"). Accept numbers, e.g. (Costs 2 Actions)
					// allow numbers
					// allow "a" and "I" as single-character words
					while (curLine && curLine.match(/^(([A-Z0-9ota][a-z0-9'’`]+|[aI])( \(.*\)| )?)+([.!])+/g) === null && !moveon(curLine)) {
						curtrait.entries.push(curLine.trim());
						i++;
						curLine = toConvert[i];
					}

					if (curtrait.name || curtrait.entries) {
						// convert dice tags
						doConvertDiceTags(curtrait);

						// convert spellcasting
						if (ontraits) {
							if (curtrait.name.toLowerCase().includes("spellcasting")) {
								curtrait = tryParseSpellcasting(curtrait);
								if (curtrait.success) {
									// merge in e.g. innate spellcasting
									if (stats.spellcasting) stats.spellcasting = stats.spellcasting.concat(curtrait.out);
									else stats.spellcasting = curtrait.out;
								} else stats.trait.push(curtrait.out);
							} else {
								if (hasEntryContent(curtrait)) stats.trait.push(curtrait);
							}
						}
						if (onactions && hasEntryContent(curtrait)) stats.action.push(curtrait);
						if (onreactions && hasEntryContent(curtrait)) stats.reaction.push(curtrait);
						if (onlegendaries && hasEntryContent(curtrait)) stats.legendary.push(curtrait);
					}
					curtrait = {};
				}

				// Remove keys if they are empty
				if (stats.trait.length === 0) {
					delete stats.trait;
				}
				if (stats.reaction.length === 0) {
					delete stats.reaction;
				}
				if (stats.legendary.length === 0) {
					delete stats.legendary;
				}
			}
		}

		const out = cleanOutput(JSON.stringify(stats, null, "\t"));
		doOutput(out, append);
	}

	function cleanOutput (out) {
		return out.replace(/([1-9]\d*)?d([1-9]\d*)(\s?)([+-])(\s?)(\d+)?/g, "$1d$2$4$6")
			.replace(/\u2014/g, "\\u2014")
			.replace(/\u2013/g, "\\u2014")
			.replace(/’/g, "'")
			.replace(/[“”]/g, "\\\"");
	}

	function doOutput (out, append) {
		const $outArea = $("textarea#jsonoutput");
		if (append) {
			const oldVal = $outArea.text();
			$outArea.text(`${out},\n${oldVal}`);
			hasAppended = true;
		} else {
			$outArea.text(out);
			hasAppended = false;
		}
	}

	/**
	 * Parses statblocks from Homebrewery/etc Markdown
	 * @param append
	 */
	function doParseMarkdown (append) {
		function stripQuote (line) {
			return line.replace(/^\s*>\s*/, "").trim();
		}

		function stripDashStarStar (line) {
			return line.replace(/\**/g, "").replace(/^-/, "").trim();
		}

		function stripTripleHash (line) {
			return line.replace(/^###/, "").trim();
		}

		function stripLeadingSymbols (line) {
			return line.replace(/^[^A-Za-z0-9]*/, "").trim();
		}

		const toConvert = getCleanInput(editor.getValue()).split("\n");
		let stats = null;

		function getNewStatblock () {
			return {
				source: $srcSel.val(),
				page: 0
			}
		}

		let parsed = 0;
		let hasMultipleBlocks = false;
		function doOutputStatblock () {
			if (stats) {
				doAddFromParsed();

				const out = cleanOutput(JSON.stringify(stats, null, "\t"));
				doOutput(out, append);
			}
			stats = getNewStatblock();
			if (hasMultipleBlocks) append = true; // append any further blocks we find in this parse
			parsed = 0;
		}

		let prevLine = null;
		let curLineRaw = null;
		let curLine = null;
		let prevBlank = true;
		let nextPrevBlank = true;
		let trait = null;

		function getCleanTraitText (line) {
			return line.replace(/^\*\*\*/, "").split(/.\s*\*\*\*/).map(it => it.trim());
		}

		function doAddFromParsed () {
			if (parsed === 9) { // traits
				doAddTrait();
			} else if (parsed === 10) { // actions
				doAddAction();
			} else if (parsed === 11) { // reactions
				doAddReaction();
			} else if (parsed === 12) { // legendary actions
				doAddLegendary();
			}
		}

		function doAddTrait () {
			if (hasEntryContent(trait)) {
				stats.trait = stats.trait || [];

				doConvertDiceTags(trait);

				// convert spellcasting
				if (trait.name.toLowerCase().includes("spellcasting")) {
					trait = tryParseSpellcasting(trait);
					if (trait.success) {
						// merge in e.g. innate spellcasting
						if (stats.spellcasting) stats.spellcasting = stats.spellcasting.concat(trait.out);
						else stats.spellcasting = trait.out;
					} else stats.trait.push(trait.out);
				} else {
					stats.trait.push(trait)
				}
			}
			trait = null;
		}

		function doAddAction () {
			if (hasEntryContent(trait)) {
				stats.action = stats.action || [];

				doConvertDiceTags(trait);
				stats.action.push(trait);
			}
			trait = null;
		}

		function doAddReaction () {
			if (hasEntryContent(trait)) {
				stats.reaction = stats.reaction || [];

				doConvertDiceTags(trait);
				stats.reaction.push(trait);
			}
			trait = null;
		}

		function doAddLegendary () {
			if (hasEntryContent(trait)) {
				stats.legendary = stats.legendary || [];

				doConvertDiceTags(trait);
				stats.legendary.push(trait);
			}
			trait = null;
		}

		let i = 0;
		for (; i < toConvert.length; i++) {
			prevLine = curLine;
			curLineRaw = toConvert[i].trim();
			curLine = toConvert[i].trim();

			if (curLine === "" || curLine.toLowerCase() === "\\pagebreak") {
				prevBlank = true;
				continue;
			} else nextPrevBlank = false;
			curLine = stripQuote(curLine).trim();
			if (curLine === "") continue;
			else if (
				(curLine === "___" && prevBlank) || // handle nicely separated blocks
				curLineRaw === "___" // lines multiple stacked blocks
			) {
				if (stats !== null) hasMultipleBlocks = true;
				doOutputStatblock();
				prevBlank = nextPrevBlank;
				continue;
			} else if (curLine === "___") {
				prevBlank = nextPrevBlank;
				continue;
			}

			// name of monster
			if (parsed === 0) {
				curLine = curLine.replace(/^\s*##/, "").trim();
				stats.name = getCleanName(curLine);
				parsed++;
				continue;
			}

			// size type alignment
			if (parsed === 1) {
				curLine = curLine.replace(/^\**(.*?)\**$/, "$1");
				setCleanSizeTypeAlignment(stats, curLine);
				parsed++;
				continue;
			}

			// armor class
			if (parsed === 2) {
				stats.ac = stripDashStarStar(curLine).replace(/Armor Class/g, "").trim();
				parsed++;
				continue;
			}

			// hit points
			if (parsed === 3) {
				setCleanHp(stats, stripDashStarStar(curLine));
				parsed++;
				continue;
			}

			// speed
			if (parsed === 4) {
				setCleanSpeed(stats, stripDashStarStar(curLine));
				parsed++;
				continue;
			}

			// ability scores
			if (parsed === 5 || parsed === 6 || parsed === 7) {
				// skip the two header rows
				if (curLine.replace(/\s*/g, "").startsWith("|STR") || curLine.replace(/\s*/g, "").startsWith("|:-")) {
					parsed++;
					continue;
				}
				const abilities = curLine.split("|").map(it => it.trim()).filter(Boolean);
				["str", "dex", "con", "int", "wis", "cha"].map((abi, j) => stats[abi] = tryGetStat(abilities[j]));
				parsed++;
				continue;
			}

			if (parsed === 8) {
				// saves (optional)
				if (~curLine.indexOf("Saving Throws")) {
					setCleanSaves(stats, stripDashStarStar(curLine));
					continue;
				}

				// skills (optional)
				if (~curLine.indexOf("Skills")) {
					setCleanSkills(stats, stripDashStarStar(curLine));
					continue;
				}

				// damage vulnerabilities (optional)
				if (~curLine.indexOf("Damage Vulnerabilities")) {
					setCleanDamageVuln(stats, stripDashStarStar(curLine));
					continue;
				}

				// damage resistances (optional)
				if (~curLine.indexOf("Damage Resistance")) {
					setCleanDamageRes(stats, stripDashStarStar(curLine));
					continue;
				}

				// damage immunities (optional)
				if (~curLine.indexOf("Damage Immunities")) {
					setCleanDamageImm(stats, stripDashStarStar(curLine));
					continue;
				}

				// condition immunities (optional)
				if (~curLine.indexOf("Condition Immunities")) {
					setCleanConditionImm(stats, stripDashStarStar(curLine));
					continue;
				}

				// senses
				if (~curLine.indexOf("Senses")) {
					setCleanSenses(stats, stripDashStarStar(curLine));
					continue;
				}

				// languages
				if (~curLine.indexOf("Languages")) {
					setCleanLanguages(stats, stripDashStarStar(curLine));
					continue;
				}

				if (~curLine.indexOf("Challenge")) {
					setCleanCr(stats, stripDashStarStar(curLine));
					parsed++;
					continue;
				}
			}

			const cleanedLine = stripTripleHash(curLine);
			if (cleanedLine.toLowerCase() === "actions") {
				doAddFromParsed();
				parsed = 10;
				continue;
			} else if (cleanedLine.toLowerCase() === "reactions") {
				doAddFromParsed();
				parsed = 11;
				continue;
			} else if (cleanedLine.toLowerCase() === "legendary actions") {
				doAddFromParsed();
				parsed = 12;
				continue;
			}

			// traits
			if (parsed === 9) {
				if (curLine.includes("***")) {
					doAddTrait();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					trait.entries.push(stripLeadingSymbols(curLine));
				}
			}

			// actions
			if (parsed === 10) {
				if (curLine.includes("***")) {
					doAddAction();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					trait.entries.push(stripLeadingSymbols(curLine));
				}
			}

			// reactions
			if (parsed === 11) {
				if (curLine.includes("***")) {
					doAddReaction();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					trait.entries.push(stripLeadingSymbols(curLine));
				}
			}

			// legendary actions
			if (parsed === 12) {
				if (curLine.includes("***")) {
					doAddLegendary();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					if (!trait) { // legendary action intro text
						// ignore generic LA intro; the renderer will insert it
						if (!curLine.toLowerCase().includes("can take 3 legendary actions")) {
							trait = {name: "", entries: [stripLeadingSymbols(curLine)]};
						}
					} else trait.entries.push(stripLeadingSymbols(curLine));
				}
			}
		}

		doOutputStatblock();
	}
}
