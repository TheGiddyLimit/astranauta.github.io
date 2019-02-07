"use strict";

const JSON_DIR = "data/bestiary/";
const META_URL = "meta.json";
const FLUFF_INDEX = "fluff-index.json";
const JSON_LIST_NAME = "monster";
const ECGEN_BASE_PLAYERS = 4; // assume a party size of four
const renderer = EntryRenderer.getDefaultRenderer();

window.PROF_MODE_BONUS = "bonus";
window.PROF_MODE_DICE = "dice";
window.PROF_DICE_MODE = PROF_MODE_BONUS;

function imgError (x) {
	if (x) $(x).remove();
	$(`#pagecontent th.name`).css("padding-right", "0.3em");
	$(`.mon__wrp_hp`).css("max-width", "none");
}

function handleStatblockScroll (event, ele) {
	$(`#token_image`)
		.toggle(ele.scrollTop < 32)
		.css({
			opacity: (32 - ele.scrollTop) / 32,
			top: -ele.scrollTop
		});
}

const _MISC_FILTER_SPELLCASTER = "Spellcaster, ";
function ascSortMiscFilter (a, b) {
	if (a.includes(_MISC_FILTER_SPELLCASTER) && b.includes(_MISC_FILTER_SPELLCASTER)) {
		a = Parser.attFullToAbv(a.replace(_MISC_FILTER_SPELLCASTER, ""));
		b = Parser.attFullToAbv(b.replace(_MISC_FILTER_SPELLCASTER, ""));
		return SortUtil.ascSortAtts(b, a);
	} else return SortUtil.ascSort(a, b);
}

function getAllImmRest (toParse, key) {
	function recurse (it) {
		if (typeof it === "string") {
			out.push(it);
		} else if (it[key]) {
			it[key].forEach(nxt => recurse(nxt));
		}
	}
	const out = [];
	toParse.forEach(it => {
		recurse(it);
	});
	return out;
}

function basename (str, sep) {
	return str.substr(str.lastIndexOf(sep) + 1);
}

const meta = {};
const languages = {};

function pLoadMeta () {
	return new Promise(resolve => {
		DataUtil.loadJSON(JSON_DIR + META_URL)
			.then((data) => {
				// Convert the legendary Group JSONs into a look-up, i.e. use the name as a JSON property name
				data.legendaryGroup.forEach(lg => {
					meta[lg.source] = meta[lg.source] || {};
					meta[lg.source][lg.name] = lg;
				});

				Object.keys(data.language).forEach(k => languages[k] = data.language[k]);
				languageFilter.items = Object.keys(languages).sort((a, b) => SortUtil.ascSortLower(languages[a], languages[b]));
				resolve();
			});
	});
}

// for use in homebrew only
function addLegendaryGroups (toAdd) {
	if (!toAdd || !toAdd.length) return;

	toAdd.forEach(lg => {
		meta[lg.source] = meta[lg.source] || {};
		meta[lg.source][lg.name] = lg;
	});
}

let ixFluff = {};
function pLoadFluffIndex () {
	return new Promise(resolve => {
		DataUtil.loadJSON(JSON_DIR + FLUFF_INDEX)
			.then((data) => {
				ixFluff = data;
				resolve();
			});
	});
}

function handleBrew (homebrew) {
	addLegendaryGroups(homebrew.legendaryGroup);
	addMonsters(homebrew.monster);
	return Promise.resolve();
}

function pPostLoad () {
	return new Promise(resolve => {
		BrewUtil.pAddBrewData()
			.then(handleBrew)
			.then(() => BrewUtil.bind({list}))
			.then(BrewUtil.pAddLocalBrewData)
			.catch(BrewUtil.pPurgeBrew)
			.then(async () => {
				BrewUtil.makeBrewButton("manage-brew");
				BrewUtil.bind({filterBox, sourceFilter});
				await ListUtil.pLoadState();
				resolve();
			});
	})
}

let filterBox;
let encounterBuilder;
window.onload = async function load () {
	filterBox = await pInitFilterBox(
		sourceFilter,
		crFilter,
		typeFilter,
		tagFilter,
		environmentFilter,
		defenceFilter,
		conditionImmuneFilter,
		traitFilter,
		actionReactionFilter,
		miscFilter,
		spellcastingTypeFilter,
		sizeFilter,
		speedFilter,
		speedTypeFilter,
		alignmentFilter,
		saveFilter,
		skillFilter,
		senseFilter,
		languageFilter,
		acFilter,
		averageHpFilter,
		abilityScoreFilter
	);
	encounterBuilder = new EncounterBuilder();
	await ExcludeUtil.pInitialise();
	SortUtil.initHandleFilterButtonClicks();
	encounterBuilder.initUi();
	pLoadMeta()
		.then(pLoadFluffIndex)
		.then(multisourceLoad.bind(null, JSON_DIR, JSON_LIST_NAME, pPageInit, addMonsters, pPostLoad))
		.then(() => {
			if (History.lastLoadedId == null) History._freshLoad();
			ExcludeUtil.checkShowAllExcluded(monsters, $(`#pagecontent`));
			encounterBuilder.initState();
		});
};

let list;
let printBookView;
const sourceFilter = getSourceFilter();
const crFilter = new RangeFilter({header: "Challenge Rating", labels: true});
const sizeFilter = new Filter({
	header: "Size",
	items: [
		SZ_TINY,
		SZ_SMALL,
		SZ_MEDIUM,
		SZ_LARGE,
		SZ_HUGE,
		SZ_GARGANTUAN,
		SZ_VARIES
	],
	displayFn: Parser.sizeAbvToFull
});
const speedFilter = new RangeFilter({header: "Speed", min: 30, max: 30});
const speedTypeFilter = new Filter({header: "Speed Type", items: ["walk", "burrow", "climb", "fly", "hover", "swim"], displayFn: StrUtil.uppercaseFirst});
const strengthFilter = new RangeFilter({header: "Strength", min: 1, max: 30});
const dexterityFilter = new RangeFilter({header: "Dexterity", min: 1, max: 30});
const constitutionFilter = new RangeFilter({header: "Constitution", min: 1, max: 30});
const intelligenceFilter = new RangeFilter({header: "Intelligence", min: 1, max: 30});
const wisdomFilter = new RangeFilter({header: "Wisdom", min: 1, max: 30});
const charismaFilter = new RangeFilter({header: "Charisma", min: 1, max: 30});
const abilityScoreFilter = new MultiFilter({name: "Ability Scores", compact: true, mode: "and"}, strengthFilter, dexterityFilter, constitutionFilter, intelligenceFilter, wisdomFilter, charismaFilter);
const acFilter = new RangeFilter({header: "Armor Class"});
const averageHpFilter = new RangeFilter({header: "Average Hit Points"});
const typeFilter = new Filter({
	header: "Type",
	items: [
		"aberration",
		"beast",
		"celestial",
		"construct",
		"dragon",
		"elemental",
		"fey",
		"fiend",
		"giant",
		"humanoid",
		"monstrosity",
		"ooze",
		"plant",
		"undead"
	],
	displayFn: StrUtil.toTitleCase
});
const tagFilter = new Filter({header: "Tag", displayFn: StrUtil.uppercaseFirst});
const alignmentFilter = new Filter({
	header: "Alignment",
	items: ["L", "NX", "C", "G", "NY", "E", "N", "U", "A"],
	displayFn: Parser.alignmentAbvToFull
});
const languageFilter = new Filter({
	header: "Languages",
	displayFn: (k) => languages[k],
	umbrellaItems: ["X", "XX"],
	umbrellaExcludes: ["CS"]
});
const senseFilter = new Filter({
	header: "Senses",
	displayFn: (it) => Parser.monSenseTagToFull(it).toTitleCase(),
	items: ["B", "D", "SD", "T", "U"]
});
const skillFilter = new Filter({
	header: "Skills",
	displayFn: (it) => it.toTitleCase(),
	items: ["acrobatics", "animal handling", "arcana", "athletics", "deception", "history", "insight", "intimidation", "investigation", "medicine", "nature", "perception", "performance", "persuasion", "religion", "sleight of hand", "stealth", "survival"]
});
const saveFilter = new Filter({
	header: "Saves",
	displayFn: Parser.attAbvToFull,
	items: [...Parser.ABIL_ABVS]
});
const environmentFilter = new Filter({
	header: "Environment",
	items: ["arctic", "coastal", "desert", "forest", "grassland", "hill", "mountain", "swamp", "underdark", "underwater", "urban"],
	displayFn: StrUtil.uppercaseFirst
});
const DMG_TYPES = [
	"acid",
	"bludgeoning",
	"cold",
	"fire",
	"force",
	"lightning",
	"necrotic",
	"piercing",
	"poison",
	"psychic",
	"radiant",
	"slashing",
	"thunder"
];
const CONDS = [
	"blinded",
	"charmed",
	"deafened",
	"exhaustion",
	"frightened",
	"grappled",
	"incapacitated",
	"invisible",
	"paralyzed",
	"petrified",
	"poisoned",
	"prone",
	"restrained",
	"stunned",
	"unconscious",
	// not really a condition, but whatever
	"disease"
];
function dispVulnFilter (item) {
	return `${StrUtil.uppercaseFirst(item)} Vuln`;
}
const vulnerableFilter = new Filter({
	header: "Vulnerabilities",
	items: DMG_TYPES,
	displayFn: dispVulnFilter
});
function dispResFilter (item) {
	return `${StrUtil.uppercaseFirst(item)} Res`;
}
const resistFilter = new Filter({
	header: "Resistance",
	items: DMG_TYPES,
	displayFn: dispResFilter
});
function dispImmFilter (item) {
	return `${StrUtil.uppercaseFirst(item)} Imm`;
}
const immuneFilter = new Filter({
	header: "Immunity",
	items: DMG_TYPES,
	displayFn: dispImmFilter
});
const defenceFilter = new MultiFilter({name: "Damage", mode: "and"}, vulnerableFilter, resistFilter, immuneFilter);
const conditionImmuneFilter = new Filter({
	header: "Condition Immunity",
	items: CONDS,
	displayFn: StrUtil.uppercaseFirst
});
const traitFilter = new Filter({
	header: "Traits",
	items: [
		"Aggressive", "Ambusher", "Amorphous", "Amphibious", "Antimagic Susceptibility", "Brute", "Charge", "Damage Absorption", "Death Burst", "Devil's Sight", "False Appearance", "Fey Ancestry", "Flyby", "Hold Breath", "Illumination", "Immutable Form", "Incorporeal Movement", "Keen Senses", "Legendary Resistances", "Light Sensitivity", "Magic Resistance", "Magic Weapons", "Pack Tactics", "Pounce", "Rampage", "Reckless", "Regeneration", "Rejuvenation", "Shapechanger", "Siege Monster", "Sneak Attack", "Spider Climb", "Sunlight Sensitivity", "Turn Immunity", "Turn Resistance", "Undead Fortitude", "Water Breathing", "Web Sense", "Web Walker"
	]
});
const actionReactionFilter = new Filter({
	header: "Actions & Reactions",
	items: [
		"Frightful Presence", "Multiattack", "Parry", "Swallow", "Teleport", "Tentacles"
	]
});
const miscFilter = new Filter({
	header: "Miscellaneous",
	items: ["Familiar", "Lair Actions", "Legendary", "Named NPC", "Spellcaster", "Regional Effects", "Reactions", "Swarm", "Has Variants"],
	displayFn: StrUtil.uppercaseFirst,
	deselFn: (it) => it === "Named NPC"
});
const spellcastingTypeFilter = new Filter({
	header: "Spellcasting Type",
	items: ["F", "I", "P", "S", "CB", "CC", "CD", "CP", "CR", "CS", "CL", "CW"],
	displayFn: Parser.monSpellcastingTagToFull
});

function pPageInit (loadedSources) {
	sourceFilter.items = Object.keys(loadedSources).map(src => new FilterItem({item: src, changeFn: loadSource(JSON_LIST_NAME, addMonsters)}));
	sourceFilter.items.sort(SortUtil.ascSort);

	list = ListUtil.search({
		valueNames: ["name", "source", "type", "cr", "group", "alias", "uniqueid"],
		listClass: "monsters",
		sortFunction: sortMonsters
	});
	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	// sorting headers
	$("#filtertools").find("button.sort").click(function () {
		const $this = $(this);
		let direction = $this.data("sortby") === "desc" ? "asc" : "desc";

		$this.data("sortby", direction);
		$this.find('span').addClass($this.data("sortby") === "desc" ? "caret" : "caret caret--reverse");
		list.sort($this.data("sort"), {order: $this.data("sortby"), sortFunction: sortMonsters});
	});

	const subList = ListUtil.initSublist({
		valueNames: ["name", "source", "type", "cr", "count", "id", "uid"],
		listClass: "submonsters",
		sortFunction: sortMonsters,
		onUpdate: onSublistChange,
		uidHandler: (mon, uid) => ScaleCreature.scale(mon, Number(uid.split("_").last())),
		uidUnpacker: (uid) => ({scaled: Number(uid.split("_").last()), uid})
	});
	const baseHandlerOptions = {shiftCount: 5};
	function addHandlerGenerator () {
		return (evt, proxyEvt) => {
			evt = proxyEvt || evt;
			if (lastRendered.isScaled) {
				if (evt.shiftKey) ListUtil.pDoSublistAdd(History.lastLoadedId, true, 5, getScaledData());
				else ListUtil.pDoSublistAdd(History.lastLoadedId, true, 1, getScaledData());
			} else ListUtil._genericAddButtonHandler(evt, baseHandlerOptions);
		};
	}
	function subtractHandlerGenerator () {
		return (evt, proxyEvt) => {
			evt = proxyEvt || evt;
			if (lastRendered.isScaled) {
				if (evt.shiftKey) ListUtil.pDoSublistSubtract(History.lastLoadedId, 5, getScaledData());
				else ListUtil.pDoSublistSubtract(History.lastLoadedId, 1, getScaledData());
			} else ListUtil._genericSubtractButtonHandler(evt, baseHandlerOptions);
		};
	}
	ListUtil.bindAddButton(addHandlerGenerator, baseHandlerOptions);
	ListUtil.bindSubtractButton(subtractHandlerGenerator, baseHandlerOptions);
	ListUtil.initGenericAddable();

	// print view
	printBookView = new BookModeView("bookview", $(`#btn-printbook`), "If you wish to view multiple creatures, please first make a list",
		($tbl) => {
			return new Promise(resolve => {
				const promises = ListUtil._genericPinKeyMapper();

				Promise.all(promises).then(toShow => {
					toShow.sort((a, b) => SortUtil.ascSort(a._displayName || a.name, b._displayName || b.name));

					let numShown = 0;

					const stack = [];

					const renderCreature = (mon) => {
						stack.push(`<table class="printbook-bestiary-entry"><tbody>`);
						stack.push(EntryRenderer.monster.getCompactRenderedString(mon, renderer));
						if (mon.legendaryGroup) {
							const thisGroup = (meta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name];
							if (thisGroup) {
								stack.push(EntryRenderer.monster.getCompactRenderedStringSection(thisGroup, renderer, "Lair Actions", "lairActions", 0));
								stack.push(EntryRenderer.monster.getCompactRenderedStringSection(thisGroup, renderer, "Regional Effects", "regionalEffects", 0));
							}
						}
						stack.push(`</tbody></table>`);
					};

					stack.push(`<tr class="printbook-bestiary"><td>`);
					toShow.forEach(mon => renderCreature(mon));
					if (!toShow.length && History.lastLoadedId != null) {
						renderCreature(monsters[History.lastLoadedId]);
					}
					stack.push(`</td></tr>`);

					numShown += toShow.length;
					$tbl.append(stack.join(""));
					resolve(numShown);
				});
			});
		}, true
	);

	// proficiency bonus/dice toggle
	const profBonusDiceBtn = $("button#profbonusdice");
	profBonusDiceBtn.click(function () {
		if (window.PROF_DICE_MODE === PROF_MODE_DICE) {
			window.PROF_DICE_MODE = PROF_MODE_BONUS;
			this.innerHTML = "Use Proficiency Dice";
			$("#pagecontent").find(`span.render-roller, span.dc-roller`).each(function () {
				const $this = $(this);
				$this.attr("mode", "");
				$this.html($this.attr("data-roll-prof-bonus"));
			});
		} else {
			window.PROF_DICE_MODE = PROF_MODE_DICE;
			this.innerHTML = "Use Proficiency Bonus";
			$("#pagecontent").find(`span.render-roller, span.dc-roller`).each(function () {
				const $this = $(this);
				$this.attr("mode", "dice");
				$this.html($this.attr("data-roll-prof-dice"));
			});
		}
	});

	return Promise.resolve();
}

class EncounterBuilderUtils {
	static getSublistedEncounter () {
		return ListUtil.sublist.items.map(it => {
			const mon = monsters[Number(it._values.id)];
			if (mon.cr) {
				return {
					cr: Parser.crToNumber(it._values.cr),
					count: Number(it._values.count),

					// used for encounter adjuster
					uid: it._values.uid,
					hash: UrlUtil.autoEncodeHash(mon)
				}
			}
		}).filter(it => it && it.cr !== 100).sort((a, b) => SortUtil.ascSort(b.cr, a.cr));
	}

	static calculateListEncounterXp (playerCount) {
		return EncounterBuilderUtils.calculateEncounterXp(EncounterBuilderUtils.getSublistedEncounter(), playerCount);
	}

	static getCrCutoff (data) {
		data = data.filter(it => it.cr !== 100).sort((a, b) => SortUtil.ascSort(b.cr, a.cr));

		// "When making this calculation, don't count any monsters whose challenge rating is significantly below the average
		// challenge rating of the other monsters in the group unless you think the weak monsters significantly contribute
		// to the difficulty of the encounter." -- DMG, p. 82

		// no cutoff for CR 0-2
		return data[0].cr <= 2 ? 0 : data[0].cr / 2;
	}

	/**
	 * @param data an array of {cr: n, count: m} objects
	 * @param playerCount number of players in the party
	 */
	static calculateEncounterXp (data, playerCount = ECGEN_BASE_PLAYERS) {
		data = data.filter(it => it.cr !== 100).sort((a, b) => SortUtil.ascSort(b.cr, a.cr));

		let baseXp = 0;
		let relevantCount = 0;
		if (!data.length) return {baseXp: 0, relevantCount: 0, adjustedXp: 0};

		const crCutoff = EncounterBuilderUtils.getCrCutoff(data);
		data.forEach(it => {
			if (it.cr >= crCutoff) relevantCount += it.count;
			baseXp += Parser.crToXpNumber(Parser.numberToCr(it.cr)) * it.count;
		});

		const playerAdjustedXpMult = Parser.numMonstersToXpMult(relevantCount, playerCount);

		const adjustedXp = playerAdjustedXpMult * baseXp;
		return {baseXp, relevantCount, adjustedXp, meta: {crCutoff, playerCount, playerAdjustedXpMult}};
	}
}

let _$totalCr;
function onSublistChange () {
	_$totalCr = _$totalCr || $(`#totalcr`);
	const xp = EncounterBuilderUtils.calculateListEncounterXp(encounterBuilder.lastPlayerCount);
	_$totalCr.html(`${xp.baseXp.toLocaleString()} XP (<span class="help" title="Adjusted Encounter XP">Enc</span>: ${(xp.adjustedXp).toLocaleString()} XP)`);
	if (encounterBuilder.isActive()) encounterBuilder.updateDifficulty();
	else encounterBuilder.doSaveState();
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const m = monsters[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			m._fSources,
			m._pCr,
			m._pTypes.type,
			m._pTypes.tags,
			m.environment,
			[
				m._fVuln,
				m._fRes,
				m._fImm
			],
			m._fCondImm,
			m.traitTags,
			m.actionTags,
			m._fMisc,
			m.spellcastingTags,
			m.size,
			m._fSpeed,
			m._fSpeedType,
			m._fAlign,
			m._fSave,
			m._fSkill,
			m.senseTags,
			m.languageTags,
			m._fAc,
			m._fHp,
			[
				m.str,
				m.dex,
				m.con,
				m.int,
				m.wis,
				m.cha
			]
		);
	});
	onFilterChangeMulti(monsters);
	encounterBuilder.resetCache();
}

let monsters = [];
let mI = 0;
const lastRendered = {mon: null, isScaled: false};
function getScaledData () {
	const last = lastRendered.mon;
	return {scaled: last._isScaledCr, uid: getUid(last.name, last.source, last._isScaledCr)};
}

function getUid (name, source, scaledCr) {
	return `${name}_${source}_${scaledCr}`.toLowerCase();
}

function _initParsed (mon) {
	mon._pTypes = Parser.monTypeToFullObj(mon.type); // store the parsed type
	mon._pCr = mon.cr === undefined ? "Unknown" : (mon.cr.cr || mon.cr);
}

const _NEUT_ALIGNS = ["NX", "NY"];
const _addedHashes = new Set();
function addMonsters (data) {
	if (!data || !data.length) return;

	monsters = monsters.concat(data);

	const table = $("ul.monsters");
	let textStack = "";
	// build the table
	for (; mI < monsters.length; mI++) {
		const mon = monsters[mI];
		const monHash = UrlUtil.autoEncodeHash(mon);
		if (_addedHashes.has(monHash)) continue;
		_addedHashes.add(monHash);
		if (ExcludeUtil.isExcluded(mon.name, "monster", mon.source)) continue;
		_initParsed(mon);
		mon._fSpeedType = Object.keys(mon.speed).filter(k => mon.speed[k]);
		if (mon._fSpeedType.length) mon._fSpeed = mon._fSpeedType.map(k => mon.speed[k]).sort((a, b) => SortUtil.ascSort(b, a))[0];
		else mon._fSpeed = 0;
		if (mon.speed.canHover) mon._fSpeedType.push("hover");
		mon._fAc = mon.ac.map(it => it.ac || it);
		mon._fHp = mon.hp.average;
		const tempAlign = typeof mon.alignment[0] === "object"
			? Array.prototype.concat.apply([], mon.alignment.map(a => a.alignment))
			: [...mon.alignment];
		if (tempAlign.includes("N") && !tempAlign.includes("G") && !tempAlign.includes("E")) tempAlign.push("NY");
		else if (tempAlign.includes("N") && !tempAlign.includes("L") && !tempAlign.includes("C")) tempAlign.push("NX");
		else if (tempAlign.length === 1 && tempAlign.includes("N")) Array.prototype.push.apply(tempAlign, _NEUT_ALIGNS);
		mon._fAlign = tempAlign;
		mon._fVuln = mon.vulnerable ? getAllImmRest(mon.vulnerable, "vulnerable") : [];
		mon._fRes = mon.resist ? getAllImmRest(mon.resist, "resist") : [];
		mon._fImm = mon.immune ? getAllImmRest(mon.immune, "immune") : [];
		mon._fCondImm = mon.conditionImmune ? getAllImmRest(mon.conditionImmune, "conditionImmune") : [];
		mon._fSave = mon.save ? Object.keys(mon.save) : [];
		mon._fSkill = mon.skill ? Object.keys(mon.skill) : [];
		mon._fSources = ListUtil.getCompleteSources(mon);

		const abvSource = Parser.sourceJsonToAbv(mon.source);

		textStack +=
			`<li class="row" ${FLTR_ID}="${mI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id=${mI} href="#${monHash}" title="${mon.name}">
					${EncounterBuilder.getButtons(mI)}
					<span class="ecgen__name name col-4-2">${mon.name}</span>
					<span class="type col-4-1">${mon._pTypes.asText.uppercaseFirst()}</span>
					<span class="col-1-7 text-align-center cr">${mon._pCr}</span>
					<span title="${Parser.sourceJsonToFull(mon.source)}${EntryRenderer.utils.getSourceSubText(mon)}" class="col-2 source text-align-center ${Parser.sourceJsonToColor(mon.source)}">${abvSource}</span>
					
					${mon.group ? `<span class="group hidden">${mon.group}</span>` : ""}
					<span class="alias hidden">${(mon.alias || []).map(it => `"${it}"`).join(",")}</span>
					<span class="uniqueid hidden">${mon.uniqueId ? mon.uniqueId : mI}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(mon._fSources);
		crFilter.addIfAbsent(mon._pCr);
		strengthFilter.addIfAbsent(mon.str);
		dexterityFilter.addIfAbsent(mon.dex);
		constitutionFilter.addIfAbsent(mon.con);
		intelligenceFilter.addIfAbsent(mon.int);
		wisdomFilter.addIfAbsent(mon.wis);
		charismaFilter.addIfAbsent(mon.cha);
		speedFilter.addIfAbsent(mon._fSpeed);
		mon.ac.forEach(it => acFilter.addIfAbsent(it.ac || it));
		if (mon.hp.average) averageHpFilter.addIfAbsent(mon.hp.average);
		mon._pTypes.tags.forEach(t => tagFilter.addIfAbsent(t));
		mon._fMisc = mon.legendary || mon.legendaryGroup ? ["Legendary"] : [];
		if (mon.familiar) mon._fMisc.push("Familiar");
		if (mon.type.swarmSize) mon._fMisc.push("Swarm");
		if (mon.spellcasting) {
			mon._fMisc.push("Spellcaster");
			mon.spellcasting.forEach(sc => {
				if (sc.ability) {
					const scAbility = `${_MISC_FILTER_SPELLCASTER}${Parser.attAbvToFull(sc.ability)}`;
					mon._fMisc.push(scAbility);
					miscFilter.addIfAbsent(scAbility);
				}
			});
		}
		if (mon.isNPC) mon._fMisc.push("Named NPC");
		if (mon.legendaryGroup && (meta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name]) {
			if ((meta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name].lairActions) mon._fMisc.push("Lair Actions");
			if ((meta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name].regionalEffects) mon._fMisc.push("Regional Effects");
		}
		if (mon.reaction) mon._fMisc.push("Reactions");
		if (mon.variant) mon._fMisc.push("Has Variants");
		traitFilter.addIfAbsent(mon.traitTags);
		actionReactionFilter.addIfAbsent(mon.actionTags);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	table.append(textStack);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);
	crFilter.items.sort(SortUtil.ascSortCr);
	typeFilter.items.sort(SortUtil.ascSortLower);
	tagFilter.items.sort(SortUtil.ascSort);
	miscFilter.items.sort(ascSortMiscFilter);
	traitFilter.items.sort(SortUtil.ascSort);
	actionReactionFilter.items.sort(SortUtil.ascSortCr);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: monsters,
		getSublistRow: pGetSublistItem,
		primaryLists: [list]
	});

	function popoutHandlerGenerator (toList, $btnPop, popoutCodeId) {
		return (evt) => {
			if (evt.shiftKey) {
				EntryRenderer.hover.handlePopoutCode(evt, toList, $btnPop, popoutCodeId);
			} else {
				if (lastRendered.mon != null && lastRendered.isScaled) EntryRenderer.hover.doPopoutPreloaded($btnPop, lastRendered.mon, evt.clientX);
				else if (History.lastLoadedId !== null) EntryRenderer.hover.doPopout($btnPop, toList, History.lastLoadedId, evt.clientX);
			}
		};
	}

	EntryRenderer.hover.bindPopoutButton(monsters, popoutHandlerGenerator);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton(sublistFuncPreload);

	$(`body`).on("click", ".btn-name-pronounce", function () {
		const audio = $(this).find(`.name-pronounce`)[0];
		audio.currentTime = 0;
		audio.play();
	});
}

function sublistFuncPreload (json, funcOnload) {
	if (json.l && json.l.items && json.l.sources) { // if it's an encounter file
		json.items = json.l.items;
		json.sources = json.l.sources;
	}
	const loaded = Object.keys(loadedSources).filter(it => loadedSources[it].loaded);
	const lowerSources = json.sources.map(it => it.toLowerCase());
	const toLoad = Object.keys(loadedSources).filter(it => !loaded.includes(it)).filter(it => lowerSources.includes(it.toLowerCase()));
	const loadTotal = toLoad.length;
	if (loadTotal) {
		let loadCount = 0;
		toLoad.forEach(src => {
			loadSource(JSON_LIST_NAME, (monsters) => {
				addMonsters(monsters);
				if (++loadCount === loadTotal) {
					funcOnload();
				}
			})(src, "yes");
		});
	} else {
		funcOnload();
	}
}

function pGetSublistItem (mon, pinId, addCount, data = {}) {
	return new Promise(resolve => {
		const pMon = data.scaled ? ScaleCreature.scale(mon, data.scaled) : Promise.resolve(mon);

		pMon.then(mon => {
			const subHash = data.scaled ? `${HASH_PART_SEP}${MON_HASH_SCALED}${HASH_SUB_KV_SEP}${data.scaled}` : "";
			_initParsed(mon);

			resolve(`
				<li class="row row--bestiary_sublist" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
					<a href="#${UrlUtil.autoEncodeHash(mon)}${subHash}" title="${mon._displayName || mon.name}" draggable="false" class="ecgen__hidden">
						<span class="name col-5">${mon._displayName || mon.name}</span>
						<span class="type col-3">${mon._pTypes.asText.uppercaseFirst()}</span>
						<span class="cr col-2 text-align-center">${mon._pCr}</span>						
						<span class="count col-2 text-align-center">${addCount || 1}</span>
						<span class="id hidden">${data.uid ? "" : pinId}</span>
						<span class="uid hidden">${data.uid || ""}</span>
					</a>
					
					<div class="list__item_inner ecgen__visible--flex">
						${EncounterBuilder.getButtons(pinId, true)}
						<span class="ecgen__name--sub col-5">${mon._displayName || mon.name}</span>
						<span class="col-1-5 help--hover ecgen__visible" onmouseover="EncounterBuilder.doStatblockMouseOver(event, this, ${pinId}, ${mon._isScaledCr})">Statblock</span>
						<span class="col-1-5 ecgen__visible help--hover" ${EncounterBuilder.getTokenMouseOver(mon)}>Token</span>
						${mon._pCr !== "Unknown" ? `
							<span class="col-2 text-align-center">
								<input value="${mon._pCr}" onchange="encounterBuilder.doCrChange(this, ${pinId}, ${mon._isScaledCr})" class="ecgen__cr_input form-control form-control--minimal input-xs">
							</span>
						` : `<span class="col-2 text-align-center">${mon._pCr}</span>`}
						<span class="col-2 text-align-center count">${addCount || 1}</span>
					</div>
				</li>
			`);
		});
	});
}

// sorting for form filtering
function sortMonsters (a, b, o) {
	function getPrimary () {
		if (o.valueName === "count") return SortUtil.ascSort(Number(a.values().count), Number(b.values().count));
		a = monsters[a.elm.getAttribute(FLTR_ID)];
		b = monsters[b.elm.getAttribute(FLTR_ID)];
		switch (o.valueName) {
			case "name":
				return SortUtil.ascSort(a.name, b.name);
			case "type":
				return SortUtil.ascSort(a._pTypes.asText, b._pTypes.asText);
			case "source":
				return SortUtil.ascSort(a.source, b.source);
			case "cr":
				return SortUtil.ascSortCr(a._pCr, b._pCr);
		}
	}
	return getPrimary() || SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source);
}

let profBtn = null;
// load selected monster stat block
function loadhash (id) {
	const mon = monsters[id];

	renderStatblock(mon);

	loadsub([]);
	ListUtil.updateSelected();
}

function renderStatblock (mon, isScaled) {
	lastRendered.mon = mon;
	lastRendered.isScaled = isScaled;
	renderer.setFirstSection(true);

	const $content = $("#pagecontent").empty();
	const $wrpBtnProf = $(`#wrp-profbonusdice`);

	if (profBtn !== null) {
		$wrpBtnProf.append(profBtn);
		profBtn = null;
	}

	function buildStatsTab () {
		const $btnScaleCr = $(`
			<button id="btn-scale-cr" title="Scale Creature By CR (Highly Experimental)" class="mon__btn-scale-cr btn btn-xs btn-default">
				<span class="glyphicon glyphicon-signal"/>
			</button>`)
			.off("click").click((evt) => {
				evt.stopPropagation();
				const mon = monsters[History.lastLoadedId];
				const lastCr = lastRendered.mon ? lastRendered.mon.cr.cr || lastRendered.mon.cr : mon.cr.cr || mon.cr;
				EntryRenderer.monster.getCrScaleTarget($btnScaleCr, lastCr, (targetCr) => {
					if (targetCr === Parser.crToNumber(mon.cr)) renderStatblock(mon);
					else History.setSubhash(MON_HASH_SCALED, targetCr);
				});
			}).toggle(Parser.crToNumber(mon.cr.cr || mon.cr) !== 100);

		const $btnResetScaleCr = $(`
			<button id="btn-reset-cr" title="Reset CR Scaling" class="mon__btn-reset-cr btn btn-xs btn-default">
				<span class="glyphicon glyphicon-refresh"></span>
			</button>`)
			.click(() => History.setSubhash(MON_HASH_SCALED, null))
			.toggle(isScaled);

		$(`
		${EntryRenderer.utils.getBorderTr()}
		<tr><th class="name mon__name--token" colspan="6">Name <span class="source" title="Source book">SRC</span></th></tr>
		<tr><td colspan="6" class="mon__size-type-alignment">
			<i>${Parser.sizeAbvToFull(mon.size)} ${mon._pTypes.asText}, ${Parser.alignmentListToFull(mon.alignment).toLowerCase()}</i>
		</td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		
		<tr><td colspan="6"><strong>Armor Class</strong> ${Parser.acToFull(mon.ac)}</td></tr>
		<tr><td colspan="6"><div class="mon__wrp_hp"><strong>Hit Points</strong> ${EntryRenderer.monster.getRenderedHp(mon.hp)}</div></td></tr>
		<tr><td colspan="6"><strong>Speed</strong> ${Parser.getSpeedString(mon)}</td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		
		<tr class="mon__ability-names">
			<th>STR</th><th>DEX</th><th>CON</th><th>INT</th><th>WIS</th><th>CHA</th>
		</tr>
		<tr class="mon__ability-scores">
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.str)}|${mon.str} (${Parser.getAbilityModifier(mon.str)})|Strength}`)}</td>
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.dex)}|${mon.dex} (${Parser.getAbilityModifier(mon.dex)})|Dexterity}`)}</td>
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.con)}|${mon.con} (${Parser.getAbilityModifier(mon.con)})|Constitution}`)}</td>
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.int)}|${mon.int} (${Parser.getAbilityModifier(mon.int)})|Intelligence}`)}</td>
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.wis)}|${mon.wis} (${Parser.getAbilityModifier(mon.wis)})|Wisdom}`)}</td>
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.cha)}|${mon.cha} (${Parser.getAbilityModifier(mon.cha)})|Charisma}`)}</td>
		</tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		
		${mon.save ? `<tr><td colspan="6"><strong>Saving Throws</strong> ${Object.keys(mon.save).map(it => EntryRenderer.monster.getSave(renderer, it, mon.save[it])).join(", ")}</td></tr>` : ""}
		${mon.skill ? `<tr><td colspan="6"><strong>Skills</strong> ${EntryRenderer.monster.getSkillsString(renderer, mon)}</td></tr>` : ""}
		${mon.vulnerable ? `<tr><td colspan="6"><strong>Damage Vulnerabilities</strong> ${Parser.monImmResToFull(mon.vulnerable)}</td></tr>` : ""}
		${mon.resist ? `<tr><td colspan="6"><strong>Damage Resistances</strong> ${Parser.monImmResToFull(mon.resist)}</td></tr>` : ""}
		${mon.immune ? `<tr><td colspan="6"><strong>Damage Immunities</strong> ${Parser.monImmResToFull(mon.immune)}</td></tr>` : ""}
		${mon.conditionImmune ? `<tr><td colspan="6"><strong>Condition Immunities</strong> ${Parser.monCondImmToFull(mon.conditionImmune)}</td></tr>` : ""}
		<tr><td colspan="6"><strong>Senses</strong> ${mon.senses ? `${EntryRenderer.monster.getRenderedSenses(mon.senses)},` : ""} passive Perception ${mon.passive || "\u2014"}</td></tr>
		<tr><td colspan="6"><strong>Languages</strong> ${mon.languages || "\u2014"}</td></tr>
		
		<tr><td colspan="6" style="position: relative;"><strong>Challenge</strong>
			<span>${Parser.monCrToFull(mon.cr)}</span>
			<div data-r="$btnScaleCr"/>
			<div data-r="$btnResetScaleCr"/>
		</td></tr>
		
		<tr id="traits"><td class="divider" colspan="6"><div></div></td></tr>
		<tr id="actions"><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Actions</span></td></tr>
		<tr id="reactions"><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Reactions</span></td></tr>
		<tr id="legendaries"><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Legendary Actions</span></td></tr>
		<tr id="lairactions"><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Lair Actions</span></td></tr>
		<tr id="regionaleffects"><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Regional Effects</span></td></tr>
		
		<tr id="variants"></tr>
		<tr id="source"></tr>
		${EntryRenderer.utils.getBorderTr()}
		`).swap({$btnScaleCr, $btnResetScaleCr}).appendTo($content);

		let renderStack = [];
		const displayName = mon._displayName || mon.name;
		const source = Parser.sourceJsonToAbv(mon.source);
		const sourceFull = Parser.sourceJsonToFull(mon.source);

		function getPronunciationButton () {
			return `<button class="btn btn-xs btn-default btn-name-pronounce">
				<span class="glyphicon glyphicon-volume-up name-pronounce-icon"></span>
				<audio class="name-pronounce">
				   <source src="${mon.soundClip}" type="audio/mpeg">
				   <source src="audio/bestiary/${basename(mon.soundClip, '/')}" type="audio/mpeg">
				</audio>
			</button>`;
		}

		const $floatToken = $(`#float-token`).empty();
		if (mon.tokenUrl || !mon.uniqueId) {
			const imgLink = EntryRenderer.monster.getTokenUrl(mon);
			$floatToken.append(`
				<a href="${imgLink}" target="_blank" rel="noopener">
					<img src="${imgLink}" id="token_image" class="token" onerror="imgError(this)" alt="${mon.name}">
				</a>`
			);
		} else imgError();

		$content.find(".mon__name--token").html(
			`<span class="stats-name copyable" onclick="EntryRenderer.utils._pHandleNameClick(this, '${mon.source.escapeQuotes()}')">${displayName}</span>
			${mon.soundClip ? getPronunciationButton() : ""}
			<span class="stats-source ${Parser.sourceJsonToColor(mon.source)}" title="${sourceFull}${EntryRenderer.utils.getSourceSubText(mon)}">${source}</span>`
		);

		// TODO most of this could be rolled into the string template above

		let trait = EntryRenderer.monster.getOrderedTraits(mon, renderer);
		if (trait) renderSection("trait", trait, 1);

		const action = mon.action;
		$content.find("tr#actions").hide();
		if (action) renderSection("action", action, 1);

		const reaction = mon.reaction;
		$content.find("tr#reactions").hide();
		if (reaction) renderSection("reaction", reaction, 1);

		const dragonVariant = EntryRenderer.monster.getDragonCasterVariant(renderer, mon);
		const variants = mon.variant;
		const variantSect = $content.find(`#variants`);
		if (!variants && !dragonVariant) variantSect.hide();
		else {
			const rStack = [];
			(variants || []).forEach(v => renderer.recursiveEntryRender(v, rStack));
			if (dragonVariant) rStack.push(dragonVariant);
			variantSect.html(`<td colspan=6>${rStack.join("")}</td>`);
			variantSect.show();
		}

		const srcCpy = {
			source: mon.source,
			sourceSub: mon.sourceSub,
			page: mon.page,
			otherSources: mon.otherSources,
			additionalSources: mon.additionalSources,
			externalSources: mon.externalSources
		};
		const additional = mon.additionalSources ? JSON.parse(JSON.stringify(mon.additionalSources)) : [];
		if (mon.variant && mon.variant.length > 1) {
			mon.variant.forEach(v => {
				if (v.variantSource) {
					additional.push({
						source: v.variantSource.source,
						page: v.variantSource.page
					})
				}
			})
		}
		srcCpy.additionalSources = additional;
		const $trSource = $content.find(`#source`);
		const $tdSource = $(EntryRenderer.utils.getPageTr(srcCpy));
		$trSource.append($tdSource);
		if (mon.environment && mon.environment.length) {
			$tdSource.attr("colspan", 4);
			$trSource.append(`<td colspan="2" class="text-align-right mr-2"><i>Environment: ${mon.environment.sort(SortUtil.ascSortLower).map(it => it.toTitleCase()).join(", ")}</i></td>`)
		}

		const legendary = mon.legendary;
		$content.find("tr#legendaries").hide();
		if (legendary) {
			renderSection("legendary", legendary, 1);
			$content.find("tr#legendaries").after(`<tr class='legendary'><td colspan='6' class='legendary'><span class='name'></span> <span>${EntryRenderer.monster.getLegendaryActionIntro(mon)}</span></td></tr>`);
		}

		const legGroup = mon.legendaryGroup;
		$content.find("tr#lairactions").hide();
		$content.find("tr#regionaleffects").hide();
		if (legGroup) {
			const thisGroup = (meta[legGroup.source] || {})[legGroup.name];
			if (thisGroup.lairActions) renderSection("lairaction", thisGroup.lairActions, -1);
			if (thisGroup.regionalEffects) renderSection("regionaleffect", thisGroup.regionalEffects, -1);
		}

		function renderSection (sectionTrClass, sectionEntries, sectionLevel) {
			let pluralSectionTrClass = sectionTrClass === `legendary` ? `legendaries` : `${sectionTrClass}s`;
			$content.find(`tr#${pluralSectionTrClass}`).show();
			renderStack = [];
			if (sectionTrClass === "legendary") {
				const cpy = MiscUtil.copy(sectionEntries).map(it => {
					if (it.name && it.entries) {
						it.name = `${it.name}.`;
						it.type = it.type || "item";
					}
					return it;
				});
				const toRender = {type: "list", style: "list-hang-notitle", items: cpy};
				renderer.recursiveEntryRender(toRender, renderStack, sectionLevel);
			} else {
				sectionEntries.forEach(e => {
					if (e.rendered) renderStack.push(e.rendered);
					else renderer.recursiveEntryRender(e, renderStack, sectionLevel + 1);
				});
			}
			$content.find(`tr#${pluralSectionTrClass}`).after(`<tr class='${sectionTrClass}'><td colspan='6' class="mon__sect-row-inner">${renderStack.join("")}</td></tr>`);
		}

		// add click links for rollables
		$content.find(".mon__ability-scores td").each(function () {
			$(this).wrapInner(`<span class="roller" data-roll="1d20${$(this).children(".mod").html()}" title="${Parser.attAbvToFull($(this).prop("id"))}"></span>`);
		});

		const isProfDiceMode = PROF_DICE_MODE === PROF_MODE_DICE;
		function _addSpacesToDiceExp (exp) {
			return exp.replace(/([^0-9d])/gi, " $1 ").replace(/\s+/g, " ");
		}
		// inline rollers
		// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// add proficiency dice stuff for attack rolls, since those _generally_ have proficiency
		// this is not 100% accurate; for example, ghouls don't get their prof bonus on bite attacks
		// fixing it would probably involve machine learning though; we need an AI to figure it out on-the-fly
		// (Siri integration forthcoming)
		$content.find(".render-roller")
			.filter(function () {
				return $(this).text().match(/^([-+])?\d+$/);
			})
			.each(function () {
				const bonus = Number($(this).text());
				const expectedPB = Parser.crToPb(mon.cr);

				// skills and saves can have expertise
				let expert = 1;
				let pB = expectedPB;
				let fromAbility;
				let ability;
				if ($(this).parent().attr("data-mon-save")) {
					const title = $(this).attr("title");
					ability = title.split(" ")[0].trim().toLowerCase().substring(0, 3);
					fromAbility = Parser.getAbilityModNumber(mon[ability]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
				} else if ($(this).parent().attr("data-mon-skill")) {
					const title = $(this).attr("title");
					ability = Parser.skillToAbilityAbv(title.toLowerCase().trim());
					fromAbility = Parser.getAbilityModNumber(mon[ability]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
				}
				const withoutPB = bonus - pB;
				try {
					// if we have proficiency bonus, convert the roller
					if (expectedPB > 0) {
						const profDiceString = _addSpacesToDiceExp(`${expert}d${pB * (3 - expert)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`);

						$(this).attr("data-roll-prof-bonus", $(this).text());
						$(this).attr("data-roll-prof-dice", profDiceString);

						// here be (chromatic) dragons
						const cached = $(this).attr("onclick");
						const nu = `
							(function(it) {
								if (PROF_DICE_MODE === PROF_MODE_DICE) {
									EntryRenderer.dice.rollerClick(event, it, '{"type":"dice","rollable":true,"toRoll":"1d20 + ${profDiceString}"}'${$(this).prop("title") ? `, '${$(this).prop("title")}'` : ""})
								} else {
									${cached.replace(/this/g, "it")}
								}
							})(this)`;

						$(this).attr("onclick", nu);

						if (isProfDiceMode) {
							$(this).html(profDiceString);
						}
					}
				} catch (e) {
					setTimeout(() => {
						throw new Error(`Invalid save or skill roller! Bonus was ${bonus >= 0 ? "+" : ""}${bonus}, but creature's PB was +${expectedPB} and relevant ability score (${ability}) was ${fromAbility >= 0 ? "+" : ""}${fromAbility} (should have been ${expectedPB + fromAbility >= 0 ? "+" : ""}${expectedPB + fromAbility} total)`);
					}, 0);
				}
			});

		$content.find("p").each(function () {
			$(this).html($(this).html().replace(/DC\s*(\d+)/g, function (match, capture) {
				const dc = Number(capture);

				const expectedPB = Parser.crToPb(mon.cr);

				if (expectedPB > 0) {
					const withoutPB = dc - expectedPB;
					const profDiceString = _addSpacesToDiceExp(`1d${(expectedPB * 2)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`);

					return `DC <span class="dc-roller" mode="${isProfDiceMode ? "dice" : ""}" onmousedown="window.PROF_DICE_MODE === window.PROF_MODE_DICE &&  event.preventDefault()" onclick="dcRollerClick(event, this, '${profDiceString}')" data-roll-prof-bonus="${capture}" data-roll-prof-dice="${profDiceString}">${isProfDiceMode ? profDiceString : capture}</span>`;
				} else {
					return match; // if there was no proficiency bonus to work with, fall back on this
				}
			}));
		});
	}

	function buildFluffTab (isImageTab) {
		return EntryRenderer.utils.buildFluffTab(
			isImageTab,
			$content,
			mon,
			EntryRenderer.monster.getFluff.bind(null, mon, meta),
			`${JSON_DIR}${ixFluff[mon.source]}`,
			() => ixFluff[mon.source]
		);
	}

	// reset tabs
	const statTab = EntryRenderer.utils.tabButton(
		"Statblock",
		() => {
			$wrpBtnProf.append(profBtn);
			$(`#float-token`).show();
		},
		buildStatsTab
	);
	const infoTab = EntryRenderer.utils.tabButton(
		"Info",
		() => {
			profBtn = profBtn || $wrpBtnProf.children().detach();
			$(`#float-token`).hide();
		},
		buildFluffTab
	);
	const picTab = EntryRenderer.utils.tabButton(
		"Images",
		() => {
			profBtn = profBtn || $wrpBtnProf.children().detach();
			$(`#float-token`).hide();
		},
		() => buildFluffTab(true)
	);
	EntryRenderer.utils.bindTabButtons(statTab, infoTab, picTab);
}

function handleUnknownHash (link, sub) {
	const src = Object.keys(loadedSources).find(src => src.toLowerCase() === decodeURIComponent(link.split(HASH_LIST_SEP)[1]).toLowerCase());
	if (src) {
		loadSource(JSON_LIST_NAME, (monsters) => {
			addMonsters(monsters);
			History.hashChange();
		})(src, "yes");
	}
}

function dcRollerClick (event, ele, exp) {
	if (window.PROF_DICE_MODE === PROF_MODE_BONUS) return;
	const it = {
		type: "dice",
		rollable: true,
		toRoll: exp
	};
	EntryRenderer.dice.rollerClick(event, ele, JSON.stringify(it));
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub, sublistFuncPreload);

	printBookView.handleSub(sub);

	const scaledHash = sub.find(it => it.startsWith(MON_HASH_SCALED));
	if (scaledHash) {
		const scaleTo = Number(UrlUtil.unpackSubHash(scaledHash)[MON_HASH_SCALED][0]);
		const scaleToStr = Parser.numberToCr(scaleTo);
		const mon = monsters[History.lastLoadedId];
		if (Parser.isValidCr(scaleToStr) && scaleTo !== Parser.crToNumber(lastRendered.mon.cr)) {
			ScaleCreature.scale(mon, scaleTo).then(scaled => renderStatblock(scaled, true));
		}
	}

	encounterBuilder.handleSubhash(sub);
}
