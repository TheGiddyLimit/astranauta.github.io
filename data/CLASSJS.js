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
					if (clss.subclasses === undefined) clss.subclasses = {}

					if (clss.classFeatures[t._level-1]) console.log("already defd") // never happens :)
					else clss.classFeatures[t._level-1] = []

					// Fix class features
					for (let ii = 0; ii < t.feature.length; ii++) {
						let ff = t.feature[ii]

						if (ff._optional !== "YES" && ff.subclass !== undefined) console.log(ff); // never happens

						if (ff._optional === "YES" && ff.subclass !== undefined) {
							clss.subclassTitle = ff.subclass.split(":")[0].trim();
							let nom = ff.subclass.split(":").slice(1).join(":").trim();
							if (clss.subclasses[nom] === undefined) clss.subclasses[nom] = [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]];

							// SUBCLASS FEATURES
							if (ff.suboption !== undefined) {
								// NON-OPTIONAL SHIT WITH PARENT FEATURES
								let lastFeature = clss.subclasses[nom][Number(t._level) - 1][clss.subclasses[nom][Number(t._level) - 1].length-1];
								if (lastFeature === undefined) {
									if (clss.subclasses[nom][Number(t._level) - 1].length === 0) {
										lastFeature = {"entries": [{"type": "entries", "entries": []}], "source": getSrc(ff.subclass, clss, ff.subclass)}
										clss.subclasses[nom][Number(t._level) - 1].push(lastFeature)
									}
								}
								let lastEntry = lastFeature.entries[lastFeature.entries.length-1]
								if (ff.suboption === "1") {
									if (lastEntry.type !== "entries") {
										let newLast = {"type": "entries", "entries": []}
										lastFeature.entries.push(newLast)
										lastEntry = newLast
									}

								}

								if (ff.suboption === "2") { // ve go van deepah
									if (lastEntry.type === "entries") {
										lastEntry = lastEntry.entries[lastEntry.entries.length-1]
										let newLast = {"type": "entries", "entries": []}
										lastEntry.entries.push(newLast)
										lastEntry = newLast
									} else {
										console.log(ff.name, "no parent entries list with suboption 2!!") // never happens
									}
								}

								let fOb = getFeatureObj(ff, null); // no source cuz not optional, always part of the feature
								lastEntry.entries.push(fOb)
							} else {
								// SHIT WITHOUT PARENT FEATURES
								let src = getSrc(ff.subclass, clss, ff.subclass)

								let fOb = getFeatureObj(ff, src)

								clss.subclasses[nom][Number(t._level) - 1].push(fOb)
							}


						} else {

							// CLASS FEATURES
							if (ff._optional === "YES" && ff.parent === undefined) console.log(ff.name) // never happens


							if (ff._optional === "YES" && ff.parent !== undefined) {
								if (ff.suboption === "2") console.log(ff.name) // never happens
								// OPTIONAL SHIT WITH PARENT FEATURES
								let pa = clss.classFeatures[Number(t._level) - 1];
								let lastFeature = pa[pa.length-1];
								let lastEntry = lastFeature.entries[lastFeature.entries.length-1]
								if (lastEntry.type !== "options") {
									let newLast = {"type": "options", "entries": []}
									lastFeature.entries.push(newLast)
									lastEntry = newLast
								}
								let src = getSrc(ff.name, clss)

								let fOb = getFeatureObj(ff, src);

								lastEntry.entries.push(fOb)
							} else {
								if (ff.suboption !== undefined) {
									// NON-OPTIONAL SHIT WITH PARENT FEATURES
									let lastFeature = clss.classFeatures[Number(t._level) - 1][clss.classFeatures[Number(t._level) - 1].length-1];
									let lastEntry = lastFeature.entries[lastFeature.entries.length-1]
									if (ff.suboption === "1") {
										if (lastEntry.type !== "entries") {
											let newLast = {"type": "entries", "entries": []}
											lastFeature.entries.push(newLast)
											lastEntry = newLast
										}

									}

									if (ff.suboption === "2") { // ve go van deepah
										if (lastEntry.type === "entries") {
											lastEntry = lastEntry.entries[lastEntry.entries.length-1]
											let newLast = {"type": "entries", "entries": []}
											lastEntry.entries.push(newLast)
											lastEntry = newLast
										} else {
											console.log(ff.name, "no parent entries list with suboption 2!!") // never happens
										}
									}

									let fOb = getFeatureObj(ff, null); // no source cuz not optional, always part of the feature
									lastEntry.entries.push(fOb)
								} else {
									// SHIT WITHOUT PARENT FEATURES
									let src = getSrc(ff.name, clss)

									let fOb = getFeatureObj(ff, src)

									clss.classFeatures[Number(t._level) - 1].push(fOb)
								}
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
	// PRINTS THE SET AS A SET
	// let setR = {}
	// for (let i = 0; i < SETERINO.length; i++) {
	// 	let xd = SETERINO[i];
	// 	setR[xd] = ""
	// }
	// console.log(JSON.stringify(setR, null, 4))

	o.value = JSON.stringify(data, null, "\t")
		.replace("  ", " ") // collapse double spaces
		.replace("\u2014", "\\u2014").replace("\u2011", "\\u2011"); // maintain unicode stuff
}

function getFeatureObj(ff, src) { // pass in a feature object
	let fOb = {}
	fOb.name = ff.name.replace("(UA)", "").replace("(PSA)").trim();
	fOb.entries = []
	if (src !== null) {
		fOb.source = src;
	}

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

function getSrc(text, parent, optSubclass) {
	if (optSubclass !== undefined) {
		if (!text.endsWith(")")) {
			if (SRC_MAP[optSubclass] === undefined) console.log(optSubclass)
			return SRC_MAP[optSubclass]
		} else {
			if (UA_MAP[optSubclass] === undefined) console.log(optSubclass)
			return UA_MAP[optSubclass]
		}
	}

	return text.includes("(UA)") ? "UA" : text.includes("(PSA)") ? "PSA" : text.includes("(PSK)") ? "PSK": parent.source;
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

const SRC_MAP =
	{
		"Primal Path: Path of the Berserker": 							"PHB",
		"Primal Path: Path of the Totem Warrior": 						"PHB",
		"Primal Path: Path of the Battlerager": 						"SCAG",
		"Bard College: College of Lore": 								"PHB",
		"Bard College: College of Valor": 								"PHB",
		"Divine Domain: Arcana": 										"PHB",
		"Divine Domain: Death": 										"DMG",
		"Divine Domain: Knowledge": 									"PHB",
		"Divine Domain: Life": 											"PHB",
		"Divine Domain: Light": 										"PHB",
		"Divine Domain: Nature": 										"PHB",
		"Divine Domain: Tempest": 										"PHB",
		"Divine Domain: Trickery": 										"PHB",
		"Divine Domain: War": 											"PHB",
		"Divine Domain: Forge": 										"XGE",
		"Druid Circle: Circle of the Land": 							"PHB",
		"Druid Circle: Circle of the Moon": 							"PHB",
		"Martial Archetype: Champion": 									"PHB",
		"Martial Archetype: Battle Master": 							"PHB",
		"Martial Archetype: Eldritch Knight": 							"PHB",
		"Monastic Tradition: Way of Shadow": 							"PHB",
		"Monastic Tradition: Way of the Open Hand": 					"PHB",
		"Monastic Tradition: Way of the Four Elements": 				"PHB",
		"Monastic Tradition: Way of the Long Death": 					"SCAG",
		"Monastic Tradition: Way of the Sun Soul": 						"SCAG",
		"Sacred Oath: Oath of the Ancients": 							"PHB",
		"Sacred Oath: Oath of Devotion": 								"PHB",
		"Sacred Oath: Oath of Vengeance": 								"PHB",
		"Sacred Oath: Oathbreaker": 									"DMG",
		"Sacred Oath: Oath of the Crown": 								"SCAG",
		"Ranger Archetype: Hunter": 									"PHB",
		"Ranger Archetype: Beast Master": 								"PHB",
		"Ranger Conclave: Beast Conclave": 								"UATRR",
		"Ranger Conclave: Hunter": 										"UATRR",
		"Roguish Archetype: Arcane Trickster": 							"PHB",
		"Roguish Archetype: Assassin": 									"PHB",
		"Roguish Archetype: Mastermind": 								"SCAG",
		"Roguish Archetype: Swashbuckler": 								"SCAG",
		"Roguish Archetype: Thief": 									"PHB",
		"Sorcerous Origin: Draconic Bloodline": 						"PHB",
		"Sorcerous Origin: Wild Magic": 								"PHB",
		"Sorcerous Origin: Storm": 										"SCAG",
		"Otherworldly Patron: The Archfey": 							"PHB",
		"Otherworldly Patron: The Fiend": 								"PHB",
		"Otherworldly Patron: The Great Old One": 						"PHB",
		"Otherworldly Patron: The Undying": 							"SCAG",
		"Arcane Tradition: Artificer": 									"UAEBerron",
		"Arcane Tradition: Abjuration": 								"PHB",
		"Arcane Tradition: Bladesinger": 								"SCAG",
		"Arcane Tradition: Conjuration": 								"PHB",
		"Arcane Tradition: Divination": 								"PHB",
		"Arcane Tradition: Enchantment": 								"PHB",
		"Arcane Tradition: Evocation": 									"PHB",
		"Arcane Tradition: Illusion": 									"PHB",
		"Arcane Tradition: Transmutation": 								"PHB",
		"Arcane Tradition: Necromancy": 								"PHB",
		"Artificer Specialist: Alchemist": 								"UAA",
		"Artificer Specialist: Gunsmith": 								"UAA",
		"Mystic Order: Order of the Avatar": 							"UATMC",
		"Mystic Order: Order of the Awakened": 							"UATMC",
		"Mystic Order: Order of the Immortal": 							"UATMC",
		"Mystic Order: Order of the Nomad": 							"UATMC",
		"Mystic Order: Order of the Soul Knife": 						"UATMC",
		"Mystic Order: Order of the Wu Jen": 							"UATMC"
	}

const UA_MAP =
	{
		"Primal Path: Path of the Ancestral Guardian (UA)": 			"UABarbarianPrimalPaths",
		"Primal Path: Path of the Ancestral Guardian v2 (UA)": 			"UARevisedSubclasses",
		"Primal Path: Path of the Storm Herald (UA)": 					"UABarbarianPrimalPaths",
		"Primal Path: Path of the Zealot (UA)": 						"UABarbarianPrimalPaths",
		"Bard College: College of Glamour (UA)": 						"UABardBardColleges",
		"Bard College: College of Whispers (UA)": 						"UABardBardColleges",
		"Bard College: College of Swords (UA)": 						"UAKitsOfOld",
		"Bard College: College of Swords v2 (UA)": 						"UARevisedSubclasses",
		"Bard College: College of Satire (UA)": 						"UAKitsOfOld",
		"Divine Domain: City (UA)": 									"UAModernMagic",
		"Divine Domain: Knowledge (PSA)": 								"PSA",
		"Divine Domain: Forge (UA)": 									"UAClericDivineDomains",
		"Divine Domain: Forge": 										"XGE",
		"Divine Domain: Grave (UA)": 									"UAClericDivineDomains",
		"Divine Domain: Protection (UA)": 								"UAClericDivineDomains",
		"Divine Domain: Solidarity (PSA)": 								"PSA",
		"Divine Domain: Strength (PSA)": 								"PSA",
		"Divine Domain: Ambition (PSA)": 								"PSA",
		"Divine Domain: Zeal (PSA)": 									"PSA",
		"Druid Circle: Circle of Dreams (UA)": 							"UADruid",
		"Druid Circle: Circle of the Shepherd (UA)": 					"UADruid",
		"Druid Circle: Circle of the Shepherd v2 (UA)": 				"UARevisedClassOptions",
		"Druid Circle: Circle of Twilight (UA)": 						"UADruid",
		"Martial Archetype: Cavalier (UA)": 							"UAKitsOfOld",
		"Martial Archetype: Cavalier v2 (UA)": 							"UARevisedClassOptions",
		"Martial Archetype: Monster Hunter (UA)": 						"UAGothicHeroes",
		"Martial Archetype: Purple Dragon Knight (Banneret)": 			"SCAG",
		"Martial Archetype: Scout (UA)": 								"UAKitsOfOld",
		"Martial Archetype: Arcane Archer (UA)": 						"UAFighter",
		"Martial Archetype: Arcane Archer v2 (UA)": 					"UARevisedSubclasses",
		"Martial Archetype: Knight (UA)": 								"UAFighter",
		"Martial Archetype: Samurai (UA)": 								"UAFighter",
		"Martial Archetype: Sharpshooter (UA)": 						"UAFighter",
		"Monastic Tradition: Way of the Kensei (UA)": 					"UAMonk",
		"Monastic Tradition: Way of the Kensei v2 (UA)": 				"UARevisedSubclasses",
		"Monastic Tradition: Way of Tranquility (UA)": 					"UAMonk",
		"Monastic Tradition: Way of the Drunken Master (UA)": 			"UAATrioOfSubclasses",
		"Sacred Oath: Oath of Conquest (UA)": 							"UAPaladin",
		"Sacred Oath: Oath of Conquest v2 (UA)": 						"UARevisedClassOptions",
		"Sacred Oath: Oath of Treachery (UA)": 							"UAPaladin",
		"Sacred Oath: Oath of Redemption (UA)": 						"UAATrioOfSubclasses",
		"Ranger Archetype: Deep Stalker (UA)": 							"UALightDarkUnderdark",
		"Ranger Archetype: Horizon Walker (UA)": 						"UARangerAndRogue",
		"Ranger Archetype: Primeval Guardian (UA)": 					"UARangerAndRogue",
		"Ranger Archetype: Monster Slayer (UA)": 						"UAATrioOfSubclasses",
		"Ranger Conclave: Deep Stalker (UA)": 							"UALightDarkUnderdark",
		"Ranger Conclave: Horizon Walker (UA)": 						"UARangerAndRogue",
		"Ranger Conclave: Primeval Guardian (UA)": 						"UARangerAndRogue",
		"Ranger Conclave: Monster Slayer (UA)": 						"UAATrioOfSubclasses",
		"Roguish Archetype: Inquisitive (UA)": 							"UAGothicHeroes",
		"Roguish Archetype: Scout (UA)": 								"UARangerAndRogue",
		"Sorcerous Origin: Favored Soul (UA)": 							"UAModifyingClasses",
		"Sorcerous Origin: Favored Soul v2 (UA)": 						"UASorcerer",
		"Sorcerous Origin: Favored Soul v3 (UA)": 						"UARevisedSubclasses",
		"Sorcerous Origin: Shadow (UA)": 								"UALightDarkUnderdark",
		"Sorcerous Origin: Phoenix (UA)": 								"UASorcerer",
		"Sorcerous Origin: Sea (UA)": 									"UASorcerer",
		"Sorcerous Origin: Stone (UA)": 								"UASorcerer",
		"Sorcerous Origin: Pyromancer (PSK)": 							"PSK",
		"Otherworldly Patron: Ghost in the Machine (UA)": 				"UAModernMagic",
		"Otherworldly Patron: The Undying Light (UA)": 					"UALightDarkUnderdark",
		"Otherworldly Patron: The Celestial (UA)": 						"UARevisedClassOptions",
		"Otherworldly Patron: The Seeker (UA)": 						"UATheFaithful",
		"Otherworldly Patron: The Raven Queen (UA)": 					"UAWarlockAndWizard",
		"Otherworldly Patron: The Hexblade (UA)": 						"UAWarlockAndWizard",
		"Arcane Tradition: Technomancy (UA)": 							"UAModernMagic",
		"Arcane Tradition: Theurgy (UA)": 								"UATheFaithful",
		"Arcane Tradition: War Magic (UA)": 							"UAWizardRevisited",
		"Arcane Tradition: Lore Mastery (UA)": 							"UAWarlockAndWizard"
	}