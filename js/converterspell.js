"use strict";

if (typeof module !== "undefined") {
	global.PropOrder = require("./utils-proporder.js");
}

/*
 * Various utilities to assist in statblock parse/conversion. Formatted as a Node module, to allow external use.
 *
 * In all cases, the first argument, `m`, is a monster statblock.
 * Additionally, `cbMan` is a callback which should accept up to two arguments representing part of the statblock which
 * require manual consideration/tagging, and an error message, respectively.
 * Where available, `cbErr` accepts the same arguments, and may be called when an error occurs (the parser encounters
 * something too far from acceptable to be solved with manual conversion; for instance, in the case of completely junk
 * data, or common errors which should be corrected prior to running the parser).
 */

String.prototype.split_handleColon = String.prototype.split_handleColon || function (str, maxSplits = Number.MAX_SAFE_INTEGER) {
	if (str === "") return this.split("");

	const colonStr = `${str.trim()}:`;
	const isColon = this.toLowerCase().startsWith(colonStr.toLowerCase());

	const re = isColon ? new RegExp(colonStr, "ig") : new RegExp(str, "ig");
	const targetString = isColon ? colonStr : str;

	let m = re.exec(this);
	let splits = 0;
	const out = [];
	const indexes = [];

	while (m && splits < maxSplits) {
		indexes.push(m.index);

		splits++;
		m = re.exec(this);
	}

	if (indexes.length === 1) {
		out.push(this.substring(0, indexes[0]));
		out.push(this.substring(indexes[0] + targetString.length, this.length));
	} else {
		for (let i = 0; i < indexes.length - 1; ++i) {
			const start = indexes[i];

			if (i === 0) {
				out.push(this.substring(0, start));
			}

			const end = indexes[i + 1];
			out.push(this.substring(start + targetString.length, end));

			if (i === indexes.length - 2) {
				out.push(this.substring(end + targetString.length, this.length));
			}
		}
	}

	return out.map(it => it.trim());
};

String.prototype.indexOf_handleColon = String.prototype.indexOf_handleColon || function (str) {
	const colonStr = `${str.trim()}:`;
	const idxColon = this.toLowerCase().indexOf(colonStr.toLowerCase());
	if (~idxColon) return idxColon;
	return this.toLowerCase().indexOf(str.toLowerCase());
};


class SchoolConvert {
	static tryConvertSchool (m, cbMan) {
		const match = Object.values(SchoolConvert.SCHOOLS).find(it => {
			const out = it.regex.test(m.school);
			it.regex.lastIndex = 0;
			return out;
		});

		if (match) m.school = match.output;
		else if (cbMan) cbMan(m.school);
	}
}
SchoolConvert.SCHOOLS = {
	"transmutation": "T",
	"necromancy": "N",
	"conjuration": "C",
	"abjuration": "A",
	"enchantment": "E",
	"evocation": "V",
	"illusion": "I",
	"divination": "D",
};
Object.entries(SchoolConvert.SCHOOLS).forEach(([k, v]) => {
	SchoolConvert.SCHOOLS[k] = {
		output: v,
		regex: RegExp(`^${k}$`)
	}
});


//returns the letter code for the school of magic, or null if not a part of one, is NOT case sensitive
function setSchool (school) {
	if (/transmutation/gi.exec(school.trim())){
		return "T";
	}
	if (/Necromancy/gi.exec(school.trim())){
		return "N";
	}
	if (/Divination/gi.exec(school.trim())){
		return "D";
	}
	if (/Conjuration/gi.exec(school.trim())){
		return "C";
	}
	if (/Abjuration/gi.exec(school.trim())){
		return "A";
	}
	if (/Enchantment/gi.exec(school.trim())){
		return "E";
	}
	if (/Evocation/gi.exec(school.trim())){
		return "V";
	}
	if (/Illusion/gi.exec(school.trim())){
		return "I";
	}
	return"";
}

// function sets string to lowercase then capitalizes the first letter and returns it
function capFirstLetter (string) {
	string = string.toLowerCase();
	return string.charAt(0).toUpperCase() + string.slice(1);
}

// takes a string with a unit of time for duration, and converts it to the proper input form
// instantaneous becomes instant, and any plural form such as minutes or hours becomes singular, minute or hours
// also sets strings to lower case
function setTimeUnit (input) {
	if (input.toLowerCase() == ("instantaneous")) {
		return "instant";
	} else if (input.toLowerCase().endsWith("s")) {
		return input.toLowerCase().substring(0, input.length - 1);
	} else {
		return input.toLowerCase();
	}
}

//converts the word foot to feet for distance tag, also sets them as lowercase
function setDistanceUnit (input) {
	if (input.toLowerCase() == ("foot" || "feet" )) {
    	return "feet";
    }
    return input.toLowerCase();
}

class SpellConverter {
	static _getValidOptions (options) {
		options = options || {};
		options.isAppend = options.isAppend || false;
		if (!options.cbWarning || !options.cbOutput) throw new Error(`Missing required callback options!`);
		return options;
	}

	/**
	 * Parses statblocks from raw text pastes
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 */
	doParseText (inText, options) {
		options = SpellConverter._getValidOptions(options);

		/**
		 * If the current line ends in a comma, we can assume the next line is a broken/wrapped part of the current line
		 */
		function absorbBrokenLine (isCrLine) {
			const NO_ABSORB_SUBTITLES = [
				"CASTING TIME",
				"RANGE",
				"COMPONENTS",
				"DURATION",
				"CLASSES",
				"AT HIGHER LEVELS"
			];

			if (curLine) {
				if (curLine.trim().endsWith(",")) {
					const nxtLine = toConvert[++i];
					if (!nxtLine) return false;
					curLine = `${curLine.trim()} ${nxtLine.trim()}`;
					return true;
				}

				const nxtLine = toConvert[i + 1];
				if (!nxtLine) return false;

				if (ConvertUtil.isNameLine(nxtLine)) return false; // avoid absorbing the start of traits
				if (NO_ABSORB_SUBTITLES.some(it => nxtLine.toUpperCase().startsWith(it))) return false;

				i++;
				curLine = `${curLine.trim()} ${nxtLine.trim()}`;
				return true;
			}
			return false;
		}

		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		const toConvert = (() => {
			const clean = SpellConverter._getCleanInput(inText);
			return clean.split("\n").filter(it => it && it.trim());
		})();
		const stats = {};
		stats.source = options.source || "";
		// for the user to fill out
		stats.page = options.pageNumber;

		let prevLine = null; //last line of text
		let curLine = null; //current line of text
		let i; //integer count for line number

		for (i = 0; i < toConvert.length; i++) {
			prevLine = curLine;
			curLine = toConvert[i].trim();

			if (curLine === "") continue;

			// name of spell
			if (i === 0) {
				stats.name = this._getCleanName(curLine, options);
				continue;
			}

			// spell level, and school plus ritual
			if (i === 1) {
				SpellConverter._setCleanLevelSchoolRitual(stats, curLine, options);
				continue;
			}

			// casting time
			if (i === 2) {
				SpellConverter._setCleanCastingTime(stats, curLine);
				continue;
			}

			// range
			if (!curLine.indexOf_handleColon("Range")) {
				SpellConverter._setCleanRange(stats, curLine);
				continue;
			}

			// components
			if (!curLine.indexOf_handleColon("Components")) {
				SpellConverter._setCleanComponents(stats, curLine, options);
				continue;
			}

			// duration
			if (!curLine.indexOf_handleColon("Duration")) {
				SpellConverter._setCleanDuration(stats, curLine, options);
				continue;
			}

			// classes (optional)
			if (!curLine.indexOf_handleColon("Classes") || !curLine.indexOf_handleColon("Class") ) {
				SpellConverter._setCleanClasses(stats, curLine, options);
				continue;
			}


			let isEntry = true; //turn false once we get to the end of the base level spell text, unless the loop ends at that time

			stats.entries = [];

			while (i < toConvert.length) {



			// goes into actions
			if (!curLine.indexOf_handleColon("At Higher Levels.") || !curLine.indexOf_handleColon("At Higher Levels")) {
				//make sure the last bit doesn't get added to the spell text
				isEntry = false;

				// noinspection StatementWithEmptyBodyJS
				while (absorbBrokenLine(true));
				SpellConverter._setCleanHigherLevel(stats, curLine);

			} else if (isEntry) {
				//since all the headers have been put in everything else must be spell text until we get to the at higher level
				stats.entries.push(curLine);
			}

			i++;
			curLine = toConvert[i];
			}

		}

		this._doSpellPostProcess(stats, options);
		const statsOut = PropOrder.getOrdered(stats, "spell");
		options.cbOutput(statsOut, options.isAppend);
	}

	getSample (format) {
		switch (format) {
			case "txt": return SpellConverter.SAMPLE_TEXT;
			default: throw new Error(`Unknown format "${format}"`);
		}
	}

	// SHARED UTILITY FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	_doSpellPostProcess (stats, options) {
		const doCleanup = () => {
			// remove any empty arrays
			Object.keys(stats).forEach(k => {
				if (stats[k] instanceof Array && stats[k].length === 0) {
					delete stats[k];
				}
			});
		};
		TagCondition.tryTagConditions(stats);
		DamageTypeTag.tryRun(stats);
		doCleanup();
	}

	static _tryConvertNumber (strNumber) {
		try {
			return Number(strNumber.replace(/—/g, "-"))
		} catch (e) {
			return strNumber;
		}
	}


	// SHARED PARSING FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	static _getCleanInput (ipt) {
		return ipt
			.replace(/[−–‒]/g, "-") // convert minus signs to hyphens
		;
	}

	_getCleanName (line, options) {
		return options.isTitleCaseName ? line.toLowerCase().toTitleCase() : line;
	}



	// cuts the string for spell level, school and ritual, checks if the first character is a number "4th-level transmutation" and parses as a leveled spell.
	// if not it treats it as a cantrip "Transmutation cantrip" does not check for ritual tag if its a cantrip
	// throws a warning if no valid school was found, does not process 10th-level or higher spells at all
	// calls setSchool for adding the correct school letter tag
	static _setCleanLevelSchoolRitual (stats, line, options) {
		const leveledSpell = /^(\d)(?:st|nd|rd|th)(-?|\s)(\S+)\s+(\w+)(\s?)(\(ritual\))?/gi.exec(line.trim());
		var schoolItem = "";
		if (leveledSpell) {
			// if a level 1-9 spell
			stats.level = leveledSpell[1];
			stats.school = setSchool(leveledSpell[4].trim());
			schoolItem = leveledSpell[4].trim();
			if (/ritual/i.exec(leveledSpell[6])){
				stats.meta = {ritual : true};
			}
		} else {
			// cantrip
			stats.level = 0;
			stats.school = setSchool(str.split(" ")[0]);
			schoolItem = str.split(" ")[0];
		}
		if (stats.school == ""){
			options.cbWarning(`Alignment "${schoolItem}" requires manual conversion`)
		}
	}

	// strips off the word range
	// tests with if else, first if its touch, then self range aura, self range cone, self range line, just self, ranged point, and a catch all for special ranges
	// used examples to have it hard code the correct tags for each range variant.
	static _setCleanRange (stats, line) {
		const rawRange = line.split_handleColon("Range", 1)[1];
		if (/touch/gi.exec(rawRange.trim())){
			stats.range = {
				type: "point",
				distance: {
					type: "touch"
				}
			};
		} else if (/self/gi.exec(rawRange.trim())){
			if (/foot/gi.exec(rawRange.trim())){
				if (/radius/gi.exec(rawRange.trim())){
					var x = rawRange.split(/[\s-\(\)]+/);
					stats.range = {
						type: "radius",
						distance: {
							type: setDistanceUnit(x[2]),
							amount: Number(x[1])
						}
					};
				} else if (/cone/gi.exec(rawRange.trim())){
					var x = rawRange.split(/[\s-\(\)]+/);
					stats.range = {
						type: "cone",
						distance: {
							type: setDistanceUnit(x[2]),
							amount: Number(x[1])
						}
					};
				} else if (/line/gi.exec(rawRange.trim())){
					var x = rawRange.split(/[\s-\(\)]+/);
					stats.range = {
						type: "line",
						distance: {
							type: setDistanceUnit(x[2]),
							amount: Number(x[1])
						}
					};
				}

			} else {
				stats.range = {
					type: "point",
					distance: {
						type: "self"
					}
				};
			}
		} else if (/feet/gi.exec(rawRange.trim())){
			var x = rawRange.split(/[\s-\(\)]+/);
			stats.range = {
				type: "point",
				distance: {
					type: setDistanceUnit(x[1]),
					amount: Number(x[0])
				}
			};
		} else {
			var x = rawRange.split(/[\s-\(\)]+/);
			stats.range = {
				type: x
			};
		}
	}

	// splits the number from the string '1' from 'bonus action' then puts the number as the amount variable, and the text as the time and sets the tags with them.
	// incase there is no number for some reason there is an else.
	static _setCleanCastingTime (stats, line) {
		var str = line.split_handleColon("Casting Time", 1)[1].trim();
		if (/^([0-9]+)/.exec(str)){
			var amount = str.split(" ")[0].trim();
			var time = str.replace(/[0-9]/g, '').trim();
			if (time.split(" ").length > 1) {
				var firstWord = time.match(/^(\S+)\s(.*)/).slice(1)
				firstWord[0] = firstWord[0].replace(/,/,'');
				stats.time = [{
					number: Number(amount),
					unit: setTimeUnit(firstWord[0]),
					condition: firstWord[1]
				}];
			} else {
				stats.time = [{
					number: Number(amount),
					unit: setTimeUnit(time)
				}];
			}
		} else {
			stats.time = [{
				unit: time
			}];
		}
	}

	// splits the line using commas before any () to make sure it keeps the material component text together
	// flips through each compnent in a loop incase they don't have all of them
	// material takes off the M and () to add the text
	// if there is a cost and extracts the number for it
	// checks if the word consume is in the line and sets the tag to true if it is
	static _setCleanComponents (stats, line, options) {
		const rawComponent = line.split_handleColon("Components", 1)[1].trim();
		var list = rawComponent.split(/\,\s?(?![^\(]*\))/gi);
		stats.components = {};
		var i;
		for (i = 0; list.length > i; i++) {
			if (/^v/i.exec(list[i].trim())){
				stats.components["v"] = true;
			} else if (/^s/i.exec(list[i].trim())){
				stats.components["s"] = true;
			} else if (/^m/i.test(list[i].trim())){
				try {
					var materialText = /\(.+\)/.exec(list[i])[0].replace(/[()]/g,"");
					var cost = /\d*,?\d+\s?(?:cp|sp|ep|gp|pp)/gi.exec(/\(.+\)/.exec(list[i].trim()));
					var consume = /consume/i.exec(list[i].trim());
					if (cost && consume){
						stats.components.m = {
							text : materialText,
							cost : Number(cost[0].split(" ")[0].replace(/,/g, '')),
							consume : true
						};
					} else if (cost){
						stats.components.m = {
							text : materialText,
							cost : Number(cost[0].split(" ")[0].replace(/,/g, ''))
						};
					} else {
						stats.components.m = materialText;
					}
				}
				catch(error) {
					options.cbWarning(`Alignment "${rawComponent}" requires manual conversion`)
				}

			}
		}
	}



	// takes line and takes off duration header, then checks for in that order concentration, Instantaneous, until dispelled, and special
	// sets value same as in document, document sets all text inputs to lowercase through the setTimeUnit function
	// empty else statment at end is for putting in an error message when no duration was found
	static _setCleanDuration (stats, line, options) {
		const rawDuration = line.split_handleColon("Duration", 1)[1].trim();
		const focused = /^(Concentration)/gi.exec(rawDuration.trim());
		const instant = /^(Instantaneous)/gi.exec(rawDuration.trim());
		const permanent = /^(Until dispelled)/gi.exec(rawDuration.trim());
		const special = /^(special)/gi.exec(rawDuration.trim());

		if (focused) {
			var time = rawDuration.match(/\d+\s+[a-z]+/i);
			var time2 = time[0].split(" ");
			stats.duration = [{
				type : "timed",
				duration : {
					type : setTimeUnit(time2[1]),
					amount : Number(time2[0])
				},
				concentration : true
			}];
		} else if (instant) {
			stats.duration = [{
				type : "instant"
			}];
		} else if (permanent) {
			const trigger = /(triggered)/gi.exec(rawDuration.trim());
			if (trigger) {
				stats.duration = [{
						type: "permanent",
						ends: [
							"dispel",
							"trigger"
						]}
				];
			} else {
				stats.duration = [{
						type: "permanent",
						ends: [
							"dispel"
						]}
				];
			}

		} else if (special) {
			stats.duration = [{
						type: "special"
			}];
		} else {
			const exists = /\d+\s+[a-z]+/gi.exec(rawDuration.trim());
			if (exists) {
				var time = rawDuration.match(/\d+\s+[a-z]+/i);
				var time2 = time[0].split(" ");
				stats.duration = [{
					type : "timed",
					duration : {
						type : setTimeUnit(time2[1]),
						amount : Number(time2[0])
					}
				}];
			} else {
				//nothing was found/done
			}

		}

	}


	// takes the line, removes the Classes: fromt he front, then splits the classes into an array, using the comma's as the separator
	// loops through the array adding each class name with proper casing to a temporary array of objects
	// giving each object the source of PHB unless it is the artificer which gets ERLW
	// sets stats.classes' fromClassList key to the value of the array of objects
	static _setCleanClasses (stats, line, options) {
		var rawClasses = "";
		if (/^(Classes)/i.test(line)){
			rawClasses = line.split_handleColon("Classes", 1)[1].trim();
		} else {
			rawClasses = line.split_handleColon("Class", 1)[1].trim();
		}
		//const rawClasses = line.split_handleColon("Classes", 1)[1].trim();
		var classList = rawClasses.split(/,\s*/i);
		var list = [];
		var i;
		for (i = 0; classList.length > i; i++) {
			classList[i] = capFirstLetter(classList[i]);
			if (classList[i] == "Artificer"){
				list.push({name : capFirstLetter(classList[i]), source : "ERLW"});
			} else {
				list.push({name : capFirstLetter(classList[i]), source : "PHB"});
			}
		}
		stats.classes = {fromClassList : list};

	}

	static _setCleanHigherLevel (stats, line) {
		const rawHigher = line.split_handleColon("At Higher Levels.", 1)[1].trim();
   		if (!stats.entriesHigherLevel) {
			stats.entriesHigherLevel = [{
				type : "entries",
				name : "At Higher Levels",
				entries : [rawHigher]
			}];
		}

	}


	static _hasEntryContent (trait) {
		return trait && (trait.name || (trait.entries.length === 1 && trait.entries[0]) || trait.entries.length > 1);
	}
}
SpellConverter.SAMPLE_TEXT =
	`Chromatic Orb
1st-level evocation
Casting Time: 1 action
Range: 90 feet
Components: V, S, M (a diamond worth at least 50 gp)
Duration: Instantaneous

You hurl a 4-inch-diameter sphere of energy at a creature that you can see within range. You choose acid, cold, fire, lightning, poison, or thunder for the type of orb you create, and then make a ranged spell attack against the target. If the attack hits, the creature takes 3d8 damage of the type you chose.

At Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st.`;



if (typeof module !== "undefined") {
	module.exports = {
		AcConvert,
		TagAttack,
		TagHit,
		TagDc,
		TagCondition,
		AlignmentConvert,
		TraitActionTag,
		LanguageTag,
		SenseTag,
		SpellcastingTypeTag,
		DamageTypeTag,
		MiscTag,
		SpellcastingTraitConvert,
		DiceConvert,
		RechargeConvert,
		SpeedConvert,
		StatblockConverter
	};
}
