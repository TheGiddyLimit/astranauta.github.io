const skills = [
	"Athletics",
	"Acrobatics",
	"Sleight of Hand",
	"Stealth",
	"Arcana",
	"History",
	"Investigation",
	"Nature",
	"Religion",
	"Animal Handling",
	"Insight",
	"Medicine",
	"Perception",
	"Survival",
	"Deception",
	"Intimidation",
	"Performance",
	"Persuasion"
]
const numbers = {
	"one": 1,
	"two": 2,
	"three": 3,
	"four": 4,
	"five": 5
}
const LVL = "lvl_";
const COL = "col_";
function getNumFromStr(numberString) {
	if (numbers[numberString] === undefined) console.log(numberString, "not in `numbers`")
	return numbers[numberString]
}

const DOT_CODE = 8226

const SETERINO = []

let o = document.getElementById("out");

let jsonURL = "classes.json";

let request = new XMLHttpRequest();
request.open('GET', jsonURL, true);
request.onload = function() {
	let data = JSON.parse(this.response);
	doStuff(data)
}
request.send();


function doStuff(data) {
	let classes = data.class;

	for (let i = 0; i < classes.length; i++) {
		let clss = classes[i];

		clss.classTable = {};

		// fix proficiency
		clss.proficiency = clss.proficiency.split(", ");
		for (let j = 0; j < clss.proficiency.length; j++) {
			clss.proficiency[j] = parse_attFullToAbv(clss.proficiency[j]);
		}

		// fix spellability
		if (clss.spellAbility) {
			clss.spellAbility = parse_attFullToAbv(clss.spellAbility)
		}

		// fix hd (in case of e.g. 2d6)
		clss.hd = {"number": 1, "faces": clss.hd}

		let cols = [];
		clss.classTable = {};
		clss.spellcasting = {};

		for (let j = 0; j < clss.autolevel.length; j++) {
			let t = clss.autolevel[j];

			// spell slots and table data
			if (!t.feature) {

				// SPELLS ==============================================================================================
				// SLOTS ===============================================================================================
				if (t.slots) {
					if (t.slots._optional === "YES") clss.spellcasting.fromSubclass = true // TODO include it in the subclass deets
					if (clss.spellcasting.slots === undefined) clss.spellcasting.slots = []
					let sltObj = {}
					let slts = t.slots._optional === "YES" ? t.slots.__text.split(",") : t.slots.split(",")
					for (let k = 0; k < slts.length; k++) {
						let slt = Number(slts[k]);
						if (slt > 0) {
							if (k === 0) {
								if (clss.spellcasting.cantripsKnown === undefined) clss.spellcasting.cantripsKnown = []
								clss.spellcasting.cantripsKnown[t._level-1] = {"known": slt}
							} else {
								sltObj[k] = slt
							}
						}
					}
					clss.spellcasting.slots[t._level-1] = {"slots": sltObj}
				}
				// KENT ================================================================================================
				if (t.spellsknown) {
					if (clss.spellcasting.spellsKnown === undefined) clss.spellcasting.spellsKnown = []
					clss.spellcasting.spellsKnown[t._level-1] = {"known": Number(t.spellsknown)}
				}

				// INVOCATIONS KENT ====================================================================================
				if (t.invocationsknown && t.slotlevel) {
					if (!cols.includes("invocations")) {
						cols.push("invocations");
						clss.classTable.cols = [
							{"col": 7, "name": "Slot Level"},
							{"col": 8, "name": "Invocations Known"}
						]
						clss.classTable.rows = []
					}

					let slRe = /(\d+).*?/
					let slM = slRe.exec(t.slotlevel);

					clss.classTable.rows[t._level-1] = {"cells": [
						{"col": 7, "type": "level", "value": Number(slM[1])},
						{"col": 8, "type": "number", "value": isNaN(t.invocationsknown) ? 0 : Number(t.invocationsknown)}
						]}
				}
				if (t.rages) {
					if (!cols.includes("rages")) {
						cols.push("rages");
						clss.classTable.cols = [{"col": 3, "name": "Rages"}, {"col": 4, "name": "Rage Damage"}]
						clss.classTable.rows = []
					}

					clss.classTable.rows[t._level-1] =
						{"cells": [
							{"col": 3, "type": "string", "value": t.rages},
							{"col": 4, "type": "bonus", "value": Number(t.ragedamage)}
						]}
				}
				if (t.martialarts && t.kipoints && t.unarmoredmovement) {
					if (!cols.includes("martialarts")) {
						cols.push("martialarts");
						clss.classTable.cols = [
							{"col": 3, "name": "Martial Arts"},
							{"col": 4, "name": "Ki Points"},
							{"col": 5, "name": "Unarmored Movement"}
						]
						clss.classTable.rows = []
					}

					let mrtRe = /^(\d+)d(\d+)$/
					let mrtM = mrtRe.exec(t.martialarts)

					let umRe = /^\+(\d+) ft\.$/
					let umM = umRe.exec(t.unarmoredmovement)

					clss.classTable.rows[t._level-1] =
						{"cells": [
								{"col": 3, "type": "dice", "number": mrtM[1], "faces": mrtM[2]},
								{"col": 4, "type": "number", "value": isNaN(t.kipoints) ? 0 : Number(t.kipoints)},
								{"col": 5, "type": "bonusSpeed", "value": umM ? Number(umM[1]) : 0},
							]}

				}
				if (t.sneakattack) {
					if (!cols.includes("sneakatk")) {
						cols.push("sneakatk");
						clss.classTable.cols = [{"col": 3, "name": "Sneak Attack"}]
						clss.classTable.rows = []
					}

					let mrtRe = /^(\d+)d(\d+)$/
					let mrtM = mrtRe.exec(t.sneakattack)

					clss.classTable.rows[t._level-1] =
						{"cells": [
								{"col": 3, "type": "dice", "number": mrtM[1], "faces": mrtM[2]},
							]}
				}
				if (t.sorcerypoints) {
					if (!cols.includes("sorcerypoints")) {
						cols.push("sorcerypoints");
						clss.classTable.cols = [{"col": 3, "name": "Sorcery Points"}]
						clss.classTable.rows = []
					}

					clss.classTable.rows[t._level-1] = {"cells": [{"col": 3, "type": "number", "value": isNaN(t.sorcerypoints) ? 0 : Number(t.sorcerypoints)}]}
				}
				if (t.psilimit && t.psipoints && t.disciplinesknown && t.talentsknown) {
					if (!cols.includes("psionics")) {
						cols.push("psionics");
						clss.classTable.cols = [
							{"col": 4, "name": "Talents Known"},
							{"col": 5, "name": "Disciplines Known"},
							{"col": 6, "name": "Psi Points"},
							{"col": 7, "name": "Psi Limit"}
						]
						clss.classTable.rows = []
					}

					clss.classTable.rows[t._level-1] = {"cells": [
						{"col": 4, "type": "number", "value": Number(t.talentsknown)},
						{"col": 5, "type": "number", "value": Number(t.talentsknown)},
						{"col": 6, "type": "number", "value": Number(t.psipoints)},
						{"col": 7, "type": "number", "value": Number(t.psilimit)}
					]}
				}
			} else {

				if (isFeature(t)) {
					if (clss.classFeatures === undefined) clss.classFeatures = []
					if (clss.subClasses === undefined) clss.subClasses = {}

					if (clss.classFeatures[t._level-1]) console.log("already defd") // never happens :)
					else clss.classFeatures[t._level-1] = []

					// Fix class features
					for (let ii = 0; ii < t.feature.length; ii++) {
						let ff = t.feature[ii]

						if (ff._optional !== "YES" && ff.subclass !== undefined) console.log(ff); // never happens

						if (ff._optional === "YES" && ff.subclass !== undefined) {
							// SUBCLASS FEATURES
							// TODO
							// setAdd(SETERINO, ff.subclass)
						} else {
							if (ff.suboption === "2") console.log(ff.name)

							// CLASS FEATURES
							if (ff._optional === "YES" && ff.parent === undefined) console.log(ff.name) // never happens


							if (ff._optional === "YES" && ff.parent !== undefined) {
								// SHIT WITH PARENT FEATURES
								let pa = clss.classFeatures[Number(t._level) - 1];
								let lastItem = pa[pa.length-1];
								let lastEntry = lastItem.entries[lastItem.entries.length-1]
								if (lastEntry.type !== "options") {
									let newLast = {"type": "options", "entries": []}
									lastItem.entries.push(newLast)
									lastEntry = newLast
								}
								let isUa = ff.name.includes("(UA)")

								let fOb = getFeatureObj(ff, isUa);

								lastEntry.entries.push(fOb)
							} else {
								// SHIT WITHOUT PARENT FEATURES
								let isUa = ff.name.includes("(UA)")

								let fOb = getFeatureObj(ff, isUa)

								clss.classFeatures[Number(t._level) - 1].push(fOb)
							}
						}
					}

				} else {
					// fix starting prof and gear
					for (let ii = 0; ii < t.feature.length; ii++) {
						let ff = t.feature[ii]

						// Fix proficiencies
						if (ff.name === "Starting Proficiencies") {
							clss.startingProficiencies = {
								"armor": [],
								"weapons": [],
								"tools": [],
								"skills": {"choose": 0, "from": []}
							};

							for (let k = 0; k < ff.text.length; k++) {
								let pf = ff.text[k];

								if (pf.startsWith("Armor: ")) {
									let spl = pf.substr("Armor: ".length).split(", ");
									for (let l = 0; l < spl.length; l++) {
										if (spl[l].endsWith(" armor")) spl[l] = spl[l].substr(0, spl[l].length - " armor".length)
										if (spl[l].trim() !== "none")
											clss.startingProficiencies.armor.push(spl[l])
									}
								}
								if (pf.startsWith("Weapons: ")) {
									let spl = pf.substr("Weapons: ".length).split(", ");
									for (let l = 0; l < spl.length; l++) {
										if (spl[l].endsWith(" weapons")) spl[l] = spl[l].substr(0, spl[l].length - " weapons".length)
										if (spl[l].trim() !== "none")
											clss.startingProficiencies.weapons.push(spl[l])
									}
								}
								if (pf.startsWith("Tools: ")) {
									let spl = pf.substr("Tools: ".length).split(", ");
									for (let l = 0; l < spl.length; l++) {
										if (spl[l].trim() !== "none")
											clss.startingProficiencies.tools.push(spl[l])
									}
								}
								if (pf.startsWith("Skills: ")) {
									if (pf.substr("Skills: ".length) === "Choose any three.") {
										clss.startingProficiencies.skills.choose = 3;
										clss.startingProficiencies.skills.from = skills;
									} else {
										let spl = pf.substr("Skills: ".length).split(", ");
										for (let l = 0; l < spl.length; l++) {

											let cRe = /^Choose ([a-zA-Z]*?) (skills )?from (.*)$/;
											let m = cRe.exec(spl[l]);
											if (m) {
												clss.startingProficiencies.skills.choose = getNumFromStr(m[1]);
												spl[l] = m[3]
											}

											let andRe = /and (.*)/;
											m = andRe.exec(spl[l]);
											if (m) {
												spl[l] = m[1]
											}


											clss.startingProficiencies.skills.from.push(spl[l])
										}
									}
								}
							}
						}

						// Fix starting equipment
						if (ff.name === "Starting Equipment") {
							clss.startingEquipment = {"additionalFromBackground": false, "default": []};
							let eqTxt = ff.text
							clss.startingEquipment.additionalFromBackground = eqTxt[0].includes("plus anything provided by your background")
							for (let k = 1; k < eqTxt.length; k++) { // line 1 is always the same
								let eqLine = eqTxt[k];
								if (eqLine.charCodeAt(0) === DOT_CODE) {
									eqLine = eqLine.substr(1).trim();
									clss.startingEquipment.default.push(eqLine);
								}
								if (eqLine.startsWith("Alternatively")) {
									let altRe = /Alternatively, you may start with (.*?) gp to buy your own equipment\./
									let m = altRe.exec(eqLine);
									if (m) {
										clss.startingEquipment.goldAlternative = m[1];
									}
								}
							}
						}
					}
				}
			}

		}

		// ENSURE NO NULL ELEMENTS
		// spells
		if (clss.spellcasting.slots !== undefined) {
			for (let j = 0; j < clss.spellcasting.slots.length; j++) {
				let spot = clss.spellcasting.slots[j];
				if (spot === undefined) {
					clss.spellcasting.slots[j] = {"slots":{}}
				}
			}
		}
		if (clss.spellcasting.cantripsKnown !== undefined) {
			for (let j = 0; j < clss.spellcasting.cantripsKnown.length; j++) {
				let spot = clss.spellcasting.cantripsKnown[j];
				if (spot === undefined) {
					clss.spellcasting.cantripsKnown[j] = {"known": 0}
				}
			}
		}
		if (clss.spellcasting.spellsKnown !== undefined) {
			for (let j = 0; j < clss.spellcasting.spellsKnown.length; j++) {
				let spot = clss.spellcasting.spellsKnown[j];
				if (spot === undefined || spot.known === undefined || spot.known === null || isNaN(spot.known)) {
					clss.spellcasting.spellsKnown[j] = {"known": 0}
				}
			}
		}

		// features
		if (clss.classFeatures !== undefined) {
			for (let j = 0; j < clss.classFeatures.length; j++) {
				let spot = clss.classFeatures[j];
				if (spot === undefined) {
					clss.classFeatures[j] = []
				}
			}
		}

		delete clss.autolevel;
	}

	console.log(SETERINO)
	o.value = JSON.stringify(data, null, "\t")
		.replace("\u2014", "\\u2014").replace("\u2011", "\\u2011"); // maintain unicode stuff
}

function getFeatureObj(ff, isUa) { // pass in a feature object
	let fOb = {}
	fOb.name = ff.name.replace("(UA)", "").trim();
	fOb.entries = []
	fOb.source = isUa ? "UA" : "PHB";

	for (let k = 0; k < ff.text.length; k++) {
		let fTxt = ff.text[k];

		// STRINGS
		if (typeof fTxt === "string") {
			if (fTxt.trim().charCodeAt(0) === DOT_CODE) {
				let toIns = fTxt.substr(1).trim()
				if (fOb.entries.length > 0 && fOb.entries[fOb.entries.length - 1].type === "list") {
					fOb.entries[fOb.entries.length - 1].items.push(toIns)
				} else {
					fOb.entries.push({"type": "list", "items": [toIns]})
				}
			} else {
				fOb.entries.push({"type": "text", "value": fTxt.trim()})
			}
		}
		// OBJECTS
		else {
			if (fTxt.istable === "YES") {
				fOb.entries.push(
					{
						"type": "table",
						"caption": fTxt.caption,
						"cols": fTxt.thead,
						"colStyles": fTxt.thstyleclass,
						"rows": fTxt.tbody
					}
				)
			} else if (fTxt.hassavedc === "YES" || fTxt.hasattackmod === "YES") {
				if (fTxt.hassavedc === "YES") {
					fOb.entries.push(
						{
							"type": "abilityDc",
							"name": fTxt.name,
							"attributes": fTxt.attributes
						}
					)
				}
				if (fTxt.hasattackmod === "YES") {
					fOb.entries.push(
						{
							"type": "abilityAttackMod",
							"name": fTxt.name,
							"attributes": fTxt.attributes
						}
					)
				}
			}
		}
	}

	return fOb;
}

function isFeature(t) {
	if (t.feature.length !== 2) return true
	let titleMatch = true;
	for (let ii = 0; ii < t.feature.length; ii++) {
		let ff = t.feature[ii]
		if (ff.name !== "Starting Proficiencies" && ff.name !== "Starting Equipment") titleMatch = false
	}
	return !titleMatch
}

function setAdd(set, item) {
	if (item === undefined || item === null) {
		console.log("oi vey!")
		return;
	}
	if (item instanceof Array) {
		for (let i = 0; i < item.length; ++i) {
			console.log("ASD")
			helper(item[i])
		}
	} else {
		helper(item)
	}

	function helper(x) {
		if (!set.includes(x)) set.push(x)
	}
}