"use strict";

const fs = require("fs");
const ut = require("./util");
require("../js/utils");
const PropOrder = require("../js/utils-proporder");

const FILE_BLACKLIST = new Set([
	"loot.json",
	"msbcr.json",
	"monsterfeatures.json",
	"index.json",
	"encounters.json",
	"names.json",
	"life.json",
	"makecards.json",
	"renderdemo.json",
	"roll20-items.json",
	"roll20-spells.json",
	"roll20-tables.json",
	"foundry.json",
	"roll20.json",
	"makebrew-creature.json",
]);

const KEY_BLACKLIST = new Set(["data", "itemTypeAdditionalEntries", "itemType", "itemProperty"]);

const PROPS_TO_UNHANDLED_KEYS = {};

function getFnListSort (prop) {
	switch (prop) {
		case "spell":
		case "monster":
		case "monsterFluff":
		case "action":
		case "background":
		case "trait":
		case "legendaryGroup":
		case "language":
		case "condition":
		case "disease":
		case "status":
		case "cult":
		case "boon":
		case "feat":
		case "vehicle":
		case "backgroundFluff":
		case "conditionFluff":
		case "spellFluff":
		case "itemFluff":
		case "languageFluff":
		case "vehicleFluff":
		case "raceFluff":
		case "item":
		case "baseitem":
		case "variant":
		case "itemGroup":
		case "object":
		case "optionalfeature":
		case "psionic":
		case "reward":
		case "variantrule":
		case "race":
		case "table":
		case "trap":
		case "hazard":
			return (a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source);
		case "deity":
			return (a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source) || SortUtil.ascSortLower(a.pantheon, b.pantheon);
		case "class":
			return (a, b) => SortUtil.ascSortDateString(Parser.sourceJsonToDate(b.source), Parser.sourceJsonToDate(a.source)) || SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source);
		case "classFeature": return (a, b) => SortUtil.ascSortLower(a.classSource, b.classSource)
			|| SortUtil.ascSortLower(a.className, b.className)
			|| SortUtil.ascSort(a.level, b.level)
			|| SortUtil.ascSortLower(a.name, b.name)
			|| SortUtil.ascSortLower(a.source, b.source);
		case "subclassFeature": return (a, b) => SortUtil.ascSortLower(a.classSource, b.classSource)
			|| SortUtil.ascSortLower(a.className, b.className)
			|| SortUtil.ascSortLower(a.subclassSource, b.subclassSource)
			|| SortUtil.ascSortLower(a.subclassShortName, b.subclassShortName)
			|| SortUtil.ascSort(a.level, b.level)
			|| SortUtil.ascSort(a.header || 0, b.header || 0)
			|| SortUtil.ascSortLower(a.name, b.name)
			|| SortUtil.ascSortLower(a.source, b.source);
		case "adventure":
		case "book":
			return (a, b) => SortUtil.ascSortDate(new Date(b.published), new Date(a.published) || SortUtil.ascSortLower(a.name, b.name));
		default: throw new Error(`Unhandled prop "${prop}"`);
	}
}

function prettifyFolder (folder) {
	console.log(`Prettifying directory ${folder}...`);
	const files = ut.listFiles({dir: folder});
	files
		.filter(file => file.endsWith(".json") && !FILE_BLACKLIST.has(file.split("/").last()))
		.forEach(file => {
			console.log(`\tPrettifying ${file}...`);
			const json = ut.readJson(file);
			let isModified = false;

			Object.entries(json)
				.filter(([k, v]) => !KEY_BLACKLIST.has(k) && v instanceof Array)
				.forEach(([k, v]) => {
					if (PropOrder.hasOrder(k)) {
						PROPS_TO_UNHANDLED_KEYS[k] = PROPS_TO_UNHANDLED_KEYS[k] || new Set();

						json[k] = v.map(it => PropOrder.getOrdered(it, k, {fnUnhandledKey: uk => PROPS_TO_UNHANDLED_KEYS[k].add(uk)}));

						json[k].sort(getFnListSort(k));

						isModified = true;
					} else console.warn(`\tUnhandled property "${k}"`);
				});

			if (isModified) fs.writeFileSync(file, CleanUtil.getCleanJson(json), "utf-8");
		});

	Object.entries(PROPS_TO_UNHANDLED_KEYS)
		.filter(([prop, set]) => set.size)
		.forEach(([prop, set]) => {
			console.warn(`Unhandled keys for data property "${prop}":`);
			set.forEach(k => console.warn(`\t${k}`));
		})
}

prettifyFolder(`./data`);
console.log("Prettifying complete.");
