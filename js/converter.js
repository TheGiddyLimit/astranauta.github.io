"use strict";
window.onload = loadparser;

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
			return {type: m[1], tags: m[2].split(",").map(s => s.replace(/\(/g, "").replace(/\)/g, "").trim())}
		}
		return strType;
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

const SKILL_SPACE_MAP = {
	"sleightofhand": "sleight of hand",
	"animalhandling": "animal handling"
};

function loadparser () {
	// parse it on click
	$("button#parsestatblock").click(function () {
		const statblock = $("textarea#statblock").val().split("\n");
		const stats = {};

		stats.source = $("input#source").val();

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

				stats.alignment = curline.split(", ")[1];
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
				stats.speed = curline.split("Speed ")[1];
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
				stats.skill = [curline.split("Skills ")[1]];
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

			// damage resistances (optional)
			if (!curline.indexOf("Damage Resistances ")) {
				stats.resist = curline.split("Resistances ")[1];
				continue;
			}

			// damage immunities (optional)
			if (!curline.indexOf("Damage Immunities ")) {
				stats.immune = curline.split("Immunities ")[1];
				continue;
			}

			// condition immunities (optional)
			if (!curline.indexOf("Condition Immunities ")) {
				stats.conditionImmune = curline.split("Immunities ")[1];
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
					curtrait.text = [];

					if (!onlegendarydescription) {
						// first pargraph
						curtrait.name = curline.split(/([.!])/g)[0];
						curtrait.text.push(curline.split(".").splice(1).join(".").trim());
					} else {
						curtrait.text.push(curline.trim());
						onlegendarydescription = false;
					}

					i++;
					curline = statblock[i];

					// get paragraphs
					while (curline && curline.match(/^([A-Zot][a-z'’`]+( \(.*\)| )?)+([.!])+/g) === null && !moveon(curline)) {
						curtrait.text.push(curline.trim());
						i++;
						curline = statblock[i];
					}

					if (ontraits) stats.trait.push(curtrait);
					if (onactions) stats.action.push(curtrait);
					if (onreactions) stats.reaction.push(curtrait);
					if (onlegendaries) stats.legendary.push(curtrait);
					curtrait = {};
				}
			}
		}
		// for the user to fill out
		stats.page = 0;

		let out = JSON.stringify(stats, null, " ");
		out = out.replace(/([1-9]\d*)?d([1-9]\d*)(\s?)([+-])(\s?)(\d+)?/g, "$1d$2$4$6");
		$("textarea#jsonoutput").text(out);
	})
}
