"use strict";

class PageFilterRaces extends PageFilter {
	// region static
	static getLanguageProficiencyTags (lProfs) {
		if (!lProfs) return [];

		const outSet = new Set();
		lProfs.forEach(lProfGroup => {
			Object.keys(lProfGroup).filter(k => k !== "choose").forEach(k => outSet.add(k.toTitleCase()));
			if (lProfGroup.choose) outSet.add("Choose");
		});

		return [...outSet];
	}

	static getAbilityObjs (abils) {
		function makeAbilObj (asi, amount) {
			return {
				asi: asi,
				amount: amount,
				_toIdString: () => {
					return `${asi}${amount}`
				},
			}
		}

		const out = new CollectionUtil.ObjectSet();

		(abils || []).forEach(abil => {
			if (abil.choose) {
				const ch = abil.choose;

				if (ch.weighted) {
					// add every ability + weight combo
					ch.weighted.from.forEach(f => {
						ch.weighted.weights.forEach(w => {
							out.add(makeAbilObj(f, w));
						});
					});
				} else {
					const by = ch.amount || 1;
					ch.from.forEach(asi => out.add(makeAbilObj(asi, by)));
				}
			}
			Object.keys(abil).filter(prop => prop !== "choose").forEach(prop => out.add(makeAbilObj(prop, abil[prop])));
		});

		return Array.from(out.values());
	}

	static mapAbilityObjToFull (abilObj) { return `${Parser.attAbvToFull(abilObj.asi)} ${abilObj.amount < 0 ? "" : "+"}${abilObj.amount}`; }

	static getSpeedRating (speed) { return speed > 30 ? "Walk (Fast)" : speed < 30 ? "Walk (Slow)" : "Walk"; }

	static filterAscSortSize (a, b) {
		a = a.item;
		b = b.item;

		return SortUtil.ascSort(toNum(a), toNum(b));

		function toNum (size) {
			switch (size) {
				case "M": return 0;
				case "S": return -1;
				case "V": return 1;
			}
		}
	}

	static filterAscSortAsi (a, b) {
		a = a.item;
		b = b.item;

		if (a === "Player Choice") return -1;
		else if (a.startsWith("Any") && b.startsWith("Any")) {
			const aAbil = a.replace("Any", "").replace("Increase", "").trim();
			const bAbil = b.replace("Any", "").replace("Increase", "").trim();
			return PageFilterRaces.ASI_SORT_POS[aAbil] - PageFilterRaces.ASI_SORT_POS[bAbil];
		} else if (a.startsWith("Any")) {
			return -1;
		} else if (b.startsWith("Any")) {
			return 1;
		} else {
			const [aAbil, aScore] = a.split(" ");
			const [bAbil, bScore] = b.split(" ");
			return (PageFilterRaces.ASI_SORT_POS[aAbil] - PageFilterRaces.ASI_SORT_POS[bAbil]) || (Number(bScore) - Number(aScore));
		}
	}
	// endregion

	constructor () {
		super();

		const sizeFilter = new Filter({header: "Size", displayFn: Parser.sizeAbvToFull, itemSortFn: PageFilterRaces.filterAscSortSize});
		const asiFilter = new Filter({
			header: "Ability Bonus (Including Subrace)",
			items: [
				"Player Choice",
				"Any Strength Increase",
				"Any Dexterity Increase",
				"Any Constitution Increase",
				"Any Intelligence Increase",
				"Any Wisdom Increase",
				"Any Charisma Increase",
				"Strength +2",
				"Strength +1",
				"Dexterity +2",
				"Dexterity +1",
				"Constitution +2",
				"Constitution +1",
				"Intelligence +2",
				"Intelligence +1",
				"Wisdom +2",
				"Wisdom +1",
				"Charisma +2",
				"Charisma +1",
			],
			itemSortFn: PageFilterRaces.filterAscSortAsi,
		});
		const baseRaceFilter = new Filter({header: "Base Race"});
		const speedFilter = new Filter({header: "Speed", items: ["Climb", "Fly", "Swim", "Walk (Fast)", "Walk", "Walk (Slow)"]});
		const traitFilter = new Filter({
			header: "Traits",
			items: [
				"Amphibious",
				"Armor Proficiency",
				"Blindsight",
				"Condition Immunity",
				"Damage Immunity",
				"Damage Resistance",
				"Darkvision", "Superior Darkvision",
				"Dragonmark",
				"Improved Resting",
				"Monstrous Race",
				"Natural Armor",
				"NPC Race",
				"Powerful Build",
				"Skill Proficiency",
				"Spellcasting",
				"Tool Proficiency",
				"Unarmed Strike",
				"Uncommon Race",
				"Weapon Proficiency",
			],
			deselFn: (it) => {
				return it === "NPC Race";
			},
		});
		const languageFilter = new Filter({
			header: "Languages",
			items: [
				"Abyssal",
				"Celestial",
				"Choose",
				"Common",
				"Draconic",
				"Dwarvish",
				"Elvish",
				"Giant",
				"Gnomish",
				"Goblin",
				"Halfling",
				"Infernal",
				"Orc",
				"Other",
				"Primordial",
				"Sylvan",
				"Undercommon",
			],
			umbrellaItems: ["Choose"],
		});
		const miscFilter = new Filter({header: "Miscellaneous", items: ["Base Race", "Key Race", "Modified Copy", "SRD"], isSrdFilter: true});

		this._sizeFilter = sizeFilter;
		this._asiFilter = asiFilter;
		this._baseRaceFilter = baseRaceFilter;
		this._speedFilter = speedFilter;
		this._traitFilter = traitFilter;
		this._languageFilter = languageFilter;
		this._miscFilter = miscFilter;
	}

	mutateForFilters (race) {
		if (race.ability) {
			const abils = PageFilterRaces.getAbilityObjs(race.ability);
			race._fAbility = abils.map(a => PageFilterRaces.mapAbilityObjToFull(a));
			const increases = {};
			abils.filter(it => it.amount > 0).forEach(it => increases[it.asi] = true);
			Object.keys(increases).forEach(it => race._fAbility.push(`Any ${Parser.attAbvToFull(it)} Increase`));
			if (race.ability.some(it => it.choose)) race._fAbility.push("Player Choice");
		} else race._fAbility = [];
		race._fSpeed = race.speed ? race.speed.walk ? [race.speed.climb ? "Climb" : null, race.speed.fly ? "Fly" : null, race.speed.swim ? "Swim" : null, PageFilterRaces.getSpeedRating(race.speed.walk)].filter(it => it) : [PageFilterRaces.getSpeedRating(race.speed)] : [];
		race._fTraits = [
			race.darkvision === 120 ? "Superior Darkvision" : race.darkvision ? "Darkvision" : null,
			race.hasSpellcasting ? "Spellcasting" : null,
			race.resist ? "Damage Resistance" : null,
			race.immune ? "Damage Immunity" : null,
			race.conditionImmune ? "Condition Immunity" : null,
		].filter(it => it);
		race._fTraits.push(...(race.traitTags || []));
		race._fSources = SourceFilter.getCompleteFilterSources(race);
		race._fLangs = PageFilterRaces.getLanguageProficiencyTags(race.languageProficiencies);
		race._fMisc = race.srd ? ["SRD"] : [];
		if (race._isBaseRace) race._fMisc.push("Base Race");
		if (race._isBaseRace || !race._isSubRace) race._fMisc.push("Key Race");
		if (race._isCopy) race._fMisc.push("Modified Copy");

		const ability = race.ability ? Renderer.getAbilityData(race.ability) : {asTextShort: "None"};
		race._slAbility = ability.asTextShort;
	}

	addToFilters (race, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(race._fSources);
		this._sizeFilter.addItem(race.size);
		this._asiFilter.addItem(race._fAbility);
		this._baseRaceFilter.addItem(race._baseName);
		this._traitFilter.addItem(race._fTraits);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._asiFilter,
			this._sizeFilter,
			this._speedFilter,
			this._traitFilter,
			this._languageFilter,
			this._baseRaceFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, r) {
		return this._filterBox.toDisplay(
			values,
			r._fSources,
			r._fAbility,
			r.size,
			r._fSpeed,
			r._fTraits,
			r._fLangs,
			r._baseName,
			r._fMisc,
		)
	}

	static getListAliases (race) {
		return (race.alias || [])
			.map(it => {
				const invertedName = PageFilterRaces.getInvertedName(it);
				return [`"${it}"`, invertedName ? `"${invertedName}"` : false].filter(Boolean);
			})
			.flat()
			.join(",")
	}

	static getInvertedName (name) {
		// convert e.g. "Elf (High)" to "High Elf" for use as a searchable field
		const bracketMatch = /^(.*?) \((.*?)\)$/.exec(name);
		return bracketMatch ? `${bracketMatch[2]} ${bracketMatch[1]}` : null;
	}
}
PageFilterRaces.ASI_SORT_POS = {
	Strength: 0,
	Dexterity: 1,
	Constitution: 2,
	Intelligence: 3,
	Wisdom: 4,
	Charisma: 5,
};

class ModalFilterRaces extends ModalFilter {
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
			modalTitle: `Race${opts.isRadio ? "" : "s"}`,
			pageFilter: new PageFilterRaces(),
		});
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "4"},
			{sort: "ability", text: "Ability", width: "4"},
			{sort: "size", text: "Size", width: "2"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilter._$getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		const rawRaceData = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/races.json`);
		return Renderer.race.mergeSubraces(rawRaceData.race);
	}

	_getListItem (pageFilter, race, rI) {
		const eleLabel = document.createElement("label");
		eleLabel.className = "row lst--border no-select lst__wrp-cells";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](race);
		const ability = race.ability ? Renderer.getAbilityData(race.ability) : {asTextShort: "None"};
		const size = Parser.sizeAbvToFull(race.size || SZ_VARIES);
		const source = Parser.sourceJsonToAbv(race.source);

		eleLabel.innerHTML = `<div class="col-1 pl-0 flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="no-events">` : `<input type="checkbox" class="no-events">`}</div>
		<div class="bold col-4">${race.name}</div>
		<div class="col-4">${ability.asTextShort}</div>
		<div class="col-2 text-center">${size}</div>
		<div class="col-1 pr-0 text-center ${Parser.sourceJsonToColor(race.source)}" title="${Parser.sourceJsonToFull(race.source)}" ${BrewUtil.sourceJsonToStyle(race.source)}>${source}</div>`;

		return new ListItem(
			rI,
			eleLabel,
			race.name,
			{
				hash,
				source,
				sourceJson: race.source,
				ability: ability.asTextShort,
				size,
				cleanName: PageFilterRaces.getInvertedName(race.name) || "",
				alias: PageFilterRaces.getListAliases(race),
			},
			{
				cbSel: eleLabel.firstElementChild.firstElementChild,
			},
		);
	}
}
