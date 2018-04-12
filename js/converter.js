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
			if ("note" in tempDamage)
				newDamage.push(tempDamage)
		});
		return newDamage;
	} catch (ignored) {
		return strDamage;
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
	"neutral good": ["N", "G"],
	"lawful evil": ["L", "E"],
	"lawful neutral": ["L", "N"],
	"lawful good": ["L", "G"],
};


function loadSources () {
	DataUtil.loadJSON(JSON_URL, loadparser)
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
		doParse(true);
	});

	$("button#parsestatblock").on("click", () => {
		if (!hasAppended || confirm("You're about to overwrite multiple entries. Are you sure?")) doParse(false);
	});

	function doParse (append) {
		const statblock = editor.getValue().split("\n");
		const stats = {};

		stats.source = $srcSel.val();
		// for the user to fill out
		stats.page = 0;

		let prevLine = null;
		let curline = null;
		for (let i = 0; i < statblock.length; i++) {
			prevLine = curline;
			curline = statblock[i].trim();

			if (curline === "") continue;

			// name of monster
			if (i === 0) {
				stats.name = curline.toLowerCase().replace(/\b\w/g, function (l) {
					return l.toUpperCase()
				});
				continue;
			}

			// size type alignment
			if (i === 1) {
				stats.size = curline[0];
				stats.type = curline.split(",")[0].split(" ").splice(1).join(" "); // + ", " + $("input#source").val();
				stats.type = tryParseType(stats.type);

				stats.alignment = curline.split(", ")[1].toLowerCase();
				stats.alignment = ALIGNMENT_MAP[stats.alignment] || stats.alignment;
				continue;
			}

			// armor class
			if (i === 2) {
				stats.ac = curline.split("Armor Class ")[1];
				continue;
			}

			// hit points
			if (i === 3) {
				stats.hp = curline.split("Hit Points ")[1];
				continue;
			}

			// speed
			if (i === 4) {
				stats.speed = curline.toLowerCase();
				const split = stats.speed.split(",");
				const newSpeeds = {};
				try {
					split.forEach(s => {
						const splSpace = s.trim().split(" ");
						let name = splSpace.shift().trim();
						const val = tryConvertNumber(splSpace.shift().trim());
						if (name == "speed")
							name = "walk";
						newSpeeds[name] = val;
					});
					stats.speed = newSpeeds;
				} catch (ignored) {
					// because the linter doesn't like empty blocks...
					continue;
				}
				continue;
			}

			if (i === 5) continue;
			// ability scores
			if (i === 6) {
				const abilities = curline.split(/ \(([+-–‒])?[0-9]*\) ?/g);
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
					stats.str = tryGetStat(curline);
					break;
				case "dex":
					stats.dex = tryGetStat(curline);
					break;
				case "con":
					stats.con = tryGetStat(curline);
					break;
				case "int":
					stats.int = tryGetStat(curline);
					break;
				case "wis":
					stats.wis = tryGetStat(curline);
					break;
				case "cha":
					stats.cha = tryGetStat(curline);
					break;
			}

			// saves (optional)
			if (!curline.indexOf("Saving Throws ")) {
				stats.save = curline.split("Saving Throws ")[1];
				continue;
			}

			// skills (optional)
			if (!curline.indexOf("Skills ")) {
				stats.skill = [curline.split("Skills ")[1].toLowerCase()];
				if (stats.skill.length === 1) stats.skill = stats.skill[0];
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
				} catch (ignored) {
					// because the linter doesn't like empty blocks...
					continue;
				}
				continue;
			}

			// damage vulnerabilities (optional)
			if (!curline.indexOf("Damage Vulnerabilities ")) {
				stats.vulnerable = curline.split("Vulnerabilities ")[1];
				continue;
			}

			// damage resistances (optional)
			if (!curline.indexOf("Damage Resistances ")) {
				stats.resist = curline.split("Resistances ")[1];
				stats.resist = tryParseSpecialDamage(stats.resist, "resist");
				continue;
			}

			// damage immunities (optional)
			if (!curline.indexOf("Damage Immunities ")) {
				stats.immune = curline.split("Immunities ")[1];
				stats.immune = tryParseSpecialDamage(stats.immune, "immune");
				continue;
			}

			// condition immunities (optional)
			if (!curline.indexOf("Condition Immunities ")) {
				stats.conditionImmune = curline.split("Immunities ")[1];
				stats.conditionImmune = tryParseSpecialDamage(
								stats.conditionImmune, "conditionImmune");
				continue;
			}

			// senses
			if (!curline.indexOf("Senses ")) {
				stats.senses = curline.split("Senses ")[1].split(" passive Perception ")[0];
				if (!stats.senses.indexOf("passive Perception")) stats.senses = "";
				if (stats.senses[stats.senses.length - 1] === ",") stats.senses = stats.senses.substring(0, stats.senses.length - 1);
				stats.passive = tryConvertNumber(curline.split(" passive Perception ")[1]);
				continue;
			}

			// languages
			if (!curline.indexOf("Languages ")) {
				stats.languages = curline.split("Languages ")[1];
				continue;
			}

			// challenges and traits
			// goes into actions
			if (!curline.indexOf("Challenge ")) {
				stats.cr = curline.split("Challenge ")[1].split(" (")[0];

				// traits
				i++;
				curline = statblock[i];
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
				while (i < statblock.length) {
					if (moveon(curline)) {
						ontraits = false;
						onactions = !curline.toUpperCase().indexOf("ACTIONS");
						onreactions = !curline.toUpperCase().indexOf("REACTIONS");
						onlegendaries = !curline.toUpperCase().indexOf("LEGENDARY ACTIONS");
						onlegendarydescription = onlegendaries;

						i++;
						curline = statblock[i];
					}

					// get the name
					curtrait.name = "";
					curtrait.entries = [];

					if (!onlegendarydescription) {
						// first paragraph
						curtrait.name = curline.split(/([.!])/g)[0];
						curtrait.entries.push(curline.split(".").splice(1).join(".").trim());
					} else {
						curtrait.entries.push(curline.trim());
						onlegendarydescription = false;
					}

					i++;
					curline = statblock[i];

					// get paragraphs
					while (curline && curline.match(/^([A-Zot][a-z'’`]+( \(.*\)| )?)+([.!])+/g) === null && !moveon(curline)) {
						curtrait.entries.push(curline.trim());
						i++;
						curline = statblock[i];
					}

					if (curtrait.name || curtrait.entries) {
						if (ontraits) stats.trait.push(curtrait);
						if (onactions) stats.action.push(curtrait);
						if (onreactions) stats.reaction.push(curtrait);
						if (onlegendaries) stats.legendary.push(curtrait);
					}
					curtrait = {};
				}
			}
		}

		let out = JSON.stringify(stats, null, "\t");
		out = out.replace(/([1-9]\d*)?d([1-9]\d*)(\s?)([+-])(\s?)(\d+)?/g, "$1d$2$4$6");

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
}
