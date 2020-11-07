"use strict";

class PageFilterBestiary extends PageFilter {
	// region static
	static sortMonsters (a, b, o) {
		if (o.sortBy === "count") return SortUtil.ascSort(a.values.count, b.values.count) || SortUtil.compareListNames(a, b);
		switch (o.sortBy) {
			case "name": return SortUtil.compareListNames(a, b);
			case "type": return SortUtil.ascSort(a.values.type, b.values.type) || SortUtil.compareListNames(a, b);
			case "source": return SortUtil.ascSort(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
			case "cr": return SortUtil.ascSortCr(a.values.cr, b.values.cr) || SortUtil.compareListNames(a, b);
		}
	}

	static ascSortMiscFilter (a, b) {
		a = a.item;
		b = b.item;
		if (a.includes(PageFilterBestiary.MISC_FILTER_SPELLCASTER) && b.includes(PageFilterBestiary.MISC_FILTER_SPELLCASTER)) {
			a = Parser.attFullToAbv(a.replace(PageFilterBestiary.MISC_FILTER_SPELLCASTER, ""));
			b = Parser.attFullToAbv(b.replace(PageFilterBestiary.MISC_FILTER_SPELLCASTER, ""));
			return SortUtil.ascSortAtts(a, b);
		} else {
			a = Parser.monMiscTagToFull(a);
			b = Parser.monMiscTagToFull(b);
			return SortUtil.ascSortLower(a, b);
		}
	}

	static getAllImmRest (toParse, key) {
		const out = [];
		for (const it of toParse) this._getAllImmRest_recurse(it, key, out); // Speed > safety
		return out;
	}

	static _getAllImmRest_recurse (it, key, out, conditional) {
		if (typeof it === "string") {
			out.push(conditional ? `${it} (Conditional)` : it);
		} else if (it[key]) {
			it[key].forEach(nxt => this._getAllImmRest_recurse(nxt, key, out, !!it.cond));
		}
	}
	// endregion

	constructor () {
		super();

		this._crFilter = new RangeFilter({
			header: "Challenge Rating",
			isLabelled: true,
			labelSortFn: SortUtil.ascSortCr,
			labels: [...Parser.CRS, "Unknown", "\u2014"],
			labelDisplayFn: it => it === "\u2014" ? "None" : it,
		});
		this._sizeFilter = new Filter({
			header: "Size",
			items: [
				SZ_TINY,
				SZ_SMALL,
				SZ_MEDIUM,
				SZ_LARGE,
				SZ_HUGE,
				SZ_GARGANTUAN,
				SZ_VARIES,
			],
			displayFn: Parser.sizeAbvToFull,
			itemSortFn: null,
		});
		this._speedFilter = new RangeFilter({header: "Speed", min: 30, max: 30});
		this._speedTypeFilter = new Filter({header: "Speed Type", items: ["walk", "burrow", "climb", "fly", "hover", "swim"], displayFn: StrUtil.uppercaseFirst});
		this._strengthFilter = new RangeFilter({header: "Strength", min: 1, max: 30});
		this._dexterityFilter = new RangeFilter({header: "Dexterity", min: 1, max: 30});
		this._constitutionFilter = new RangeFilter({header: "Constitution", min: 1, max: 30});
		this._intelligenceFilter = new RangeFilter({header: "Intelligence", min: 1, max: 30});
		this._wisdomFilter = new RangeFilter({header: "Wisdom", min: 1, max: 30});
		this._charismaFilter = new RangeFilter({header: "Charisma", min: 1, max: 30});
		this._abilityScoreFilter = new MultiFilter({
			header: "Ability Scores",
			filters: [this._strengthFilter, this._dexterityFilter, this._constitutionFilter, this._intelligenceFilter, this._wisdomFilter, this._charismaFilter],
			isAddDropdownToggle: true,
		});
		this._acFilter = new RangeFilter({header: "Armor Class"});
		this._averageHpFilter = new RangeFilter({header: "Average Hit Points"});
		this._typeFilter = new Filter({
			header: "Type",
			items: Parser.MON_TYPES,
			displayFn: StrUtil.toTitleCase,
			itemSortFn: SortUtil.ascSortLower,
		});
		this._tagFilter = new Filter({header: "Tag", displayFn: StrUtil.uppercaseFirst});
		this._alignmentFilter = new Filter({
			header: "Alignment",
			items: ["L", "NX", "C", "G", "NY", "E", "N", "U", "A"],
			displayFn: alignment => Parser.alignmentAbvToFull(alignment).toTitleCase(),
			itemSortFn: null,
		});
		this._languageFilter = new Filter({
			header: "Languages",
			displayFn: (k) => Parser.monLanguageTagToFull(k).toTitleCase(),
			umbrellaItems: ["X", "XX"],
			umbrellaExcludes: ["CS"],
		});
		this._damageTypeFilter = new Filter({
			header: "Damage Inflicted",
			displayFn: (it) => Parser.dmgTypeToFull(it).toTitleCase(),
			items: Object.keys(Parser.DMGTYPE_JSON_TO_FULL),
		});
		this._conditionsInflictedFilterBase = new Filter({
			header: "By Traits/Actions",
			displayFn: StrUtil.toTitleCase,
			items: [...Parser.CONDITIONS],
		});
		this._conditionsInflictedFilterLegendary = new Filter({
			header: "By Lair Actions/Regional Effects",
			displayFn: StrUtil.toTitleCase,
			items: [...Parser.CONDITIONS],
		});
		this._conditionsInflictedFilterSpells = new Filter({
			header: "By Spells",
			displayFn: StrUtil.toTitleCase,
			items: [...Parser.CONDITIONS],
		});
		this._conditionsInflictedFilter = new MultiFilter({header: "Conditions Inflicted", filters: [this._conditionsInflictedFilterBase, this._conditionsInflictedFilterLegendary, this._conditionsInflictedFilterSpells]});
		this._senseFilter = new Filter({
			header: "Senses",
			displayFn: (it) => Parser.monSenseTagToFull(it).toTitleCase(),
			items: ["B", "D", "SD", "T", "U"],
		});
		this._skillFilter = new Filter({
			header: "Skills",
			displayFn: (it) => it.toTitleCase(),
			items: Object.keys(Parser.SKILL_TO_ATB_ABV),
		});
		this._saveFilter = new Filter({
			header: "Saves",
			displayFn: Parser.attAbvToFull,
			items: [...Parser.ABIL_ABVS],
			itemSortFn: null,
		});
		this._environmentFilter = new Filter({
			header: "Environment",
			items: ["arctic", "coastal", "desert", "forest", "grassland", "hill", "mountain", "swamp", "underdark", "underwater", "urban"],
			displayFn: StrUtil.uppercaseFirst,
		});
		this._vulnerableFilter = new Filter({
			header: "Vulnerabilities",
			items: PageFilterBestiary.DMG_TYPES,
			displayFn: StrUtil.uppercaseFirst,
		});
		this._resistFilter = new Filter({
			header: "Resistance",
			items: PageFilterBestiary.DMG_TYPES,
			displayFn: StrUtil.uppercaseFirst,
		});
		this._immuneFilter = new Filter({
			header: "Immunity",
			items: PageFilterBestiary.DMG_TYPES,
			displayFn: StrUtil.uppercaseFirst,
		});
		this._defenceFilter = new MultiFilter({header: "Damage", filters: [this._vulnerableFilter, this._resistFilter, this._immuneFilter]});
		this._conditionImmuneFilter = new Filter({
			header: "Condition Immunity",
			items: PageFilterBestiary.CONDS,
			displayFn: StrUtil.uppercaseFirst,
		});
		this._traitFilter = new Filter({
			header: "Traits",
			items: [
				"Aggressive", "Ambusher", "Amorphous", "Amphibious", "Antimagic Susceptibility", "Brute", "Charge", "Damage Absorption", "Death Burst", "Devil's Sight", "False Appearance", "Fey Ancestry", "Flyby", "Hold Breath", "Illumination", "Immutable Form", "Incorporeal Movement", "Keen Senses", "Legendary Resistances", "Light Sensitivity", "Magic Resistance", "Magic Weapons", "Pack Tactics", "Pounce", "Rampage", "Reckless", "Regeneration", "Rejuvenation", "Shapechanger", "Siege Monster", "Sneak Attack", "Spider Climb", "Sunlight Sensitivity", "Turn Immunity", "Turn Resistance", "Undead Fortitude", "Water Breathing", "Web Sense", "Web Walker",
			],
		});
		this._actionReactionFilter = new Filter({
			header: "Actions & Reactions",
			items: [
				"Frightful Presence", "Multiattack", "Parry", "Swallow", "Teleport", "Tentacles",
			],
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Familiar", ...Object.keys(Parser.MON_MISC_TAG_TO_FULL), "Lair Actions", "Legendary", "Mythic", "Adventure NPC", "Spellcaster", ...Object.values(Parser.ATB_ABV_TO_FULL).map(it => `${PageFilterBestiary.MISC_FILTER_SPELLCASTER}${it}`), "Regional Effects", "Reactions", "Swarm", "Has Variants", "Modified Copy", "Has Alternate Token", "Has Token", "SRD", "AC from Item(s)", "AC from Natural Armor", "AC from Unarmored Defense"],
			displayFn: (it) => Parser.monMiscTagToFull(it).uppercaseFirst(),
			deselFn: (it) => it === "Adventure NPC",
			itemSortFn: PageFilterBestiary.ascSortMiscFilter,
			isSrdFilter: true,
		});
		this._spellcastingTypeFilter = new Filter({
			header: "Spellcasting Type",
			items: ["F", "I", "P", "S", "CA", "CB", "CC", "CD", "CP", "CR", "CS", "CL", "CW"],
			displayFn: Parser.monSpellcastingTagToFull,
		});
	}

	mutateForFilters (mon) {
		Renderer.monster.initParsed(mon);

		if (typeof mon.speed === "number" && mon.speed > 0) {
			mon._fSpeedType = ["walk"];
			mon._fSpeed = mon.speed;
		} else {
			mon._fSpeedType = Object.keys(mon.speed).filter(k => mon.speed[k]);
			if (mon._fSpeedType.length) mon._fSpeed = mon._fSpeedType.map(k => mon.speed[k].number || mon.speed[k]).filter(it => !isNaN(it)).sort((a, b) => SortUtil.ascSort(b, a))[0];
			else mon._fSpeed = 0;
			if (mon.speed.canHover) mon._fSpeedType.push("hover");
		}

		mon._fAc = mon.ac.map(it => it.special ? null : (it.ac || it)).filter(it => it !== null);
		if (!mon._fAc.length) mon._fAc = null;
		mon._fHp = mon.hp.average;
		if (mon.alignment) {
			const tempAlign = typeof mon.alignment[0] === "object"
				? Array.prototype.concat.apply([], mon.alignment.map(a => a.alignment))
				: [...mon.alignment];
			if (tempAlign.includes("N") && !tempAlign.includes("G") && !tempAlign.includes("E")) tempAlign.push("NY");
			else if (tempAlign.includes("N") && !tempAlign.includes("L") && !tempAlign.includes("C")) tempAlign.push("NX");
			else if (tempAlign.length === 1 && tempAlign.includes("N")) Array.prototype.push.apply(tempAlign, PageFilterBestiary._NEUT_ALIGNS);
			mon._fAlign = tempAlign;
		} else {
			mon._fAlign = null;
		}
		mon._fVuln = mon.vulnerable ? PageFilterBestiary.getAllImmRest(mon.vulnerable, "vulnerable") : [];
		mon._fRes = mon.resist ? PageFilterBestiary.getAllImmRest(mon.resist, "resist") : [];
		mon._fImm = mon.immune ? PageFilterBestiary.getAllImmRest(mon.immune, "immune") : [];
		mon._fCondImm = mon.conditionImmune ? PageFilterBestiary.getAllImmRest(mon.conditionImmune, "conditionImmune") : [];
		mon._fSave = mon.save ? Object.keys(mon.save) : [];
		mon._fSkill = mon.skill ? Object.keys(mon.skill) : [];
		mon._fSources = SourceFilter.getCompleteFilterSources(mon);

		mon._fMisc = mon.legendary ? ["Legendary"] : [];
		if (mon.familiar) mon._fMisc.push("Familiar");
		if (mon.type.swarmSize) mon._fMisc.push("Swarm");
		if (mon.spellcasting) {
			mon._fMisc.push("Spellcaster");
			mon.spellcasting.forEach(sc => {
				if (sc.ability) mon._fMisc.push(`${PageFilterBestiary.MISC_FILTER_SPELLCASTER}${Parser.attAbvToFull(sc.ability)}`);
			});
		}
		if (mon.isNpc) mon._fMisc.push("Adventure NPC");
		const legGroup = DataUtil.monster.getMetaGroup(mon);
		if (legGroup) {
			if (legGroup.lairActions) mon._fMisc.push("Lair Actions");
			if (legGroup.regionalEffects) mon._fMisc.push("Regional Effects");
		}
		if (mon.reaction) mon._fMisc.push("Reactions");
		if (mon.variant) mon._fMisc.push("Has Variants");
		if (mon.miscTags) mon._fMisc.push(...mon.miscTags);
		if (mon._isCopy) mon._fMisc.push("Modified Copy");
		if (mon.altArt) mon._fMisc.push("Has Alternate Token");
		if (mon.srd) mon._fMisc.push("SRD");
		if (mon.tokenUrl || mon.hasToken) mon._fMisc.push("Has Token");
		if (mon.mythic) mon._fMisc.push("Mythic");
		(mon.ac || []).forEach(it => {
			if (!it.from) return;
			if (it.from.includes("natural armor")) mon._fMisc.push("AC from Natural Armor");
			if (it.from.some(x => x.startsWith("{@item "))) mon._fMisc.push("AC from Item(s)");
			if (it.from.includes("Unarmored Defense")) mon._fMisc.push("AC from Unarmored Defense");
		});
	}

	addToFilters (mon, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(mon._fSources);
		this._crFilter.addItem(mon._pCr);
		this._strengthFilter.addItem(mon.str);
		this._dexterityFilter.addItem(mon.dex);
		this._constitutionFilter.addItem(mon.con);
		this._intelligenceFilter.addItem(mon.int);
		this._wisdomFilter.addItem(mon.wis);
		this._charismaFilter.addItem(mon.cha);
		this._speedFilter.addItem(mon._fSpeed);
		mon.ac.forEach(it => this._acFilter.addItem(it.ac || it));
		if (mon.hp.average) this._averageHpFilter.addItem(mon.hp.average);
		this._tagFilter.addItem(mon._pTypes.tags);
		this._traitFilter.addItem(mon.traitTags);
		this._actionReactionFilter.addItem(mon.actionTags);
		this._environmentFilter.addItem(mon.environment);
		this._vulnerableFilter.addItem(mon._fVuln);
		this._resistFilter.addItem(mon._fRes);
		this._immuneFilter.addItem(mon._fImm);
	}

	async _pPopulateBoxOptions (opts) {
		Object.entries(Parser.MON_LANGUAGE_TAG_TO_FULL)
			.sort(([kA, vA], [kB, vB]) => SortUtil.ascSortLower(vA, vB))
			.forEach(([k]) => this._languageFilter.addItem(k));

		opts.filters = [
			this._sourceFilter,
			this._crFilter,
			this._typeFilter,
			this._tagFilter,
			this._environmentFilter,
			this._defenceFilter,
			this._conditionImmuneFilter,
			this._traitFilter,
			this._actionReactionFilter,
			this._miscFilter,
			this._spellcastingTypeFilter,
			this._sizeFilter,
			this._speedFilter,
			this._speedTypeFilter,
			this._alignmentFilter,
			this._saveFilter,
			this._skillFilter,
			this._senseFilter,
			this._languageFilter,
			this._damageTypeFilter,
			this._conditionsInflictedFilter,
			this._acFilter,
			this._averageHpFilter,
			this._abilityScoreFilter,
		];
	}

	toDisplay (values, m) {
		return this._filterBox.toDisplay(
			values,
			m._fSources,
			m._fCr,
			m._pTypes.type,
			m._pTypes.tags,
			m.environment,
			[
				m._fVuln,
				m._fRes,
				m._fImm,
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
			m.damageTags,
			[
				m.conditionInflict,
				m.conditionInflictLegendary,
				m.conditionInflictSpell,
			],
			m._fAc,
			m._fHp,
			[
				m.str,
				m.dex,
				m.con,
				m.int,
				m.wis,
				m.cha,
			],
		);
	}
}
PageFilterBestiary._NEUT_ALIGNS = ["NX", "NY"];
PageFilterBestiary.MISC_FILTER_SPELLCASTER = "Spellcaster, ";
PageFilterBestiary.DMG_TYPES = [...Parser.DMG_TYPES];
PageFilterBestiary.CONDS = [
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
	"disease",
];

class ModalFilterBestiary extends ModalFilter {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.isRadio]
	 * @param [opts.allData]
	 */
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: "Creatures",
			pageFilter: new PageFilterBestiary(),
			fnSort: PageFilterBestiary.sortMonsters,
		})
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "4"},
			{sort: "type", text: "Type", width: "4"},
			{sort: "cr", text: "CR", width: "2"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilter._$getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		const brew = await BrewUtil.pAddBrewData();
		const fromData = await DataUtil.monster.pLoadAll();
		const fromBrew = brew.monster || [];
		return [...fromData, ...fromBrew];
	}

	_getListItem (pageFilter, mon, itI) {
		Renderer.monster.initParsed(mon);
		pageFilter.mutateAndAddToFilters(mon);

		const eleLabel = document.createElement("label");
		eleLabel.className = "row lst--border no-select lst__wrp-cells";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon);
		const source = Parser.sourceJsonToAbv(mon.source);
		const type = mon._pTypes.asText.uppercaseFirst();
		const cr = mon._pCr;

		eleLabel.innerHTML = `<div class="col-1 pl-0 flex-vh-center"><input type="checkbox" class="no-events"></div>
		<div class="col-4 bold">${mon.name}</div>
		<div class="col-4">${type}</div>
		<div class="col-2 text-center">${cr}</div>
		<div class="col-1 text-center ${Parser.sourceJsonToColor(mon.source)} pr-0" title="${Parser.sourceJsonToFull(mon.source)}" ${BrewUtil.sourceJsonToStyle(mon.source)}>${source}</div>`;

		return new ListItem(
			itI,
			eleLabel,
			mon.name,
			{
				hash,
				source,
				sourceJson: mon.source,
				type,
				cr,
			},
			{
				cbSel: eleLabel.firstElementChild.firstElementChild,
			},
		);
	}
}
