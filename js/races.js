"use strict";

const JSON_URL = "data/races.json";

const ASI_SORT_POS = {
	Strength: 0,
	Dexterity: 1,
	Constitution: 2,
	Intelligence: 3,
	Wisdom: 4,
	Charisma: 5
};

window.onload = async function load () {
	await ExcludeUtil.pInitialise();
	SortUtil.initHandleFilterButtonClicks();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

function getAbilityObjs (abils) {
	function makeAbilObj (asi, amount) {
		return {
			asi: asi,
			amount: amount,
			_toIdString: () => {
				return `${asi}${amount}`
			}
		}
	}

	const out = new CollectionUtil.ObjectSet();
	if (abils.choose) {
		abils.choose.forEach(ch => {
			if (ch.predefined) {
				ch.predefined.forEach(pre => {
					Object.keys(pre).forEach(abil => out.add(makeAbilObj(abil, pre[abil])));
				});
			} else if (ch.weighted) {
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
		});
	}
	Object.keys(abils).filter(abil => abil !== "choose").forEach(abil => out.add(makeAbilObj(abil, abils[abil])));
	return Array.from(out.values());
}

function mapAbilityObjToFull (abilObj) {
	return `${Parser.attAbvToFull(abilObj.asi)} ${abilObj.amount < 0 ? "" : "+"}${abilObj.amount}`;
}

function getSpeedRating (speed) {
	return speed > 30 ? "Walk (Fast)" : speed < 30 ? "Walk (Slow)" : "Walk";
}

let list;
const sourceFilter = getSourceFilter();
const sizeFilter = new Filter({header: "Size", displayFn: Parser.sizeAbvToFull});
const asiFilter = new Filter({
	header: "Ability Bonus (Including Subrace)",
	items: [
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
		"Charisma +1"
	]
});
let filterBox;
async function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ['name', 'ability', 'size', 'source', 'clean-name', "uniqueid"],
		listClass: "races"
	});

	const jsonRaces = EntryRenderer.race.mergeSubraces(data.race);
	const speedFilter = new Filter({header: "Speed", items: ["Climb", "Fly", "Swim", "Walk (Fast)", "Walk", "Walk (Slow)"]});
	const traitFilter = new Filter({
		header: "Traits",
		items: [
			"Amphibious",
			"Armor Proficiency",
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
			"Weapon Proficiency"
		],
		deselFn: (it) => {
			return it === "NPC Race";
		}
	});
	const languageFilter = new Filter({
		header: "Languages",
		items: [
			"Abyssal",
			"Aquan",
			"Auran",
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
			"Terran",
			"Undercommon"
		],
		umbrellaItems: ["Choose"]
	});

	filterBox = await pInitFilterBox(
		sourceFilter,
		asiFilter,
		sizeFilter,
		speedFilter,
		traitFilter,
		languageFilter
	);

	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	const subList = ListUtil.initSublist({
		valueNames: ["name", "ability", "size", "id"],
		listClass: "subraces",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addRaces({race: jsonRaces});
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(() => BrewUtil.bind({list}))
		.then(() => BrewUtil.pAddLocalBrewData())
		.catch(BrewUtil.pPurgeBrew)
		.then(async () => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({filterBox, sourceFilter});
			await ListUtil.pLoadState();
			RollerUtil.addListRollButton();
			ListUtil.addListShowHide();

			History.init(true);
			ExcludeUtil.checkShowAllExcluded(raceList, $(`#pagecontent`));
		});
}

function handleBrew (homebrew) {
	addRaces(homebrew);
	return Promise.resolve();
}

let raceList = [];
let rcI = 0;
function addRaces (data) {
	if (!data.race || !data.race.length) return;

	raceList = raceList.concat(data.race);

	const racesTable = $("ul.races");
	let tempString = "";
	for (; rcI < raceList.length; rcI++) {
		const race = raceList[rcI];
		if (ExcludeUtil.isExcluded(race.name, "race", race.source)) continue;

		const ability = race.ability ? utils_getAbilityData(race.ability) : {asTextShort: "None"};
		if (race.ability) {
			const abils = getAbilityObjs(race.ability);
			race._fAbility = abils.map(a => mapAbilityObjToFull(a));
			const increases = {};
			abils.filter(it => it.amount > 0).forEach(it => increases[it.asi] = true);
			Object.keys(increases).forEach(it => race._fAbility.push(`Any ${Parser.attAbvToFull(it)} Increase`));
		} else race._fAbility = [];
		race._fSpeed = race.speed.walk ? [race.speed.climb ? "Climb" : null, race.speed.fly ? "Fly" : null, race.speed.swim ? "Swim" : null, getSpeedRating(race.speed.walk)].filter(it => it) : getSpeedRating(race.speed);
		race._fMisc = [
			race.darkvision === 120 ? "Superior Darkvision" : race.darkvision ? "Darkvision" : null,
			race.hasSpellcasting ? "Spellcasting" : null
		].filter(it => it).concat(race.traitTags || []);
		race._fSources = ListUtil.getCompleteSources(race);

		race._slAbility = ability.asTextShort;

		// convert e.g. "Elf (High)" to "High Elf" and add as a searchable field
		const bracketMatch = /^(.*?) \((.*?)\)$/.exec(race.name);

		tempString +=
			`<li class="row" ${FLTR_ID}='${rcI}' onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id='${rcI}' href="#${UrlUtil.autoEncodeHash(race)}" title="${race.name}">
					<span class='name col-4'>${race.name}</span>
					<span class='ability col-4'>${ability.asTextShort}</span>
					<span class='size col-2'>${Parser.sizeAbvToFull(race.size)}</span>
					<span class='source col-2 text-align-center ${Parser.sourceJsonToColor(race.source)}' title="${Parser.sourceJsonToFull(race.source)}">${Parser.sourceJsonToAbv(race.source)}</span>
					${bracketMatch ? `<span class="clean-name hidden">${bracketMatch[2]} ${bracketMatch[1]}</span>` : ""}
					
					<span class="uniqueid hidden">${race.uniqueId ? race.uniqueId : rcI}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(race._fSources);
		sizeFilter.addIfAbsent(race.size);
		asiFilter.addIfAbsent(race._fAbility);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	racesTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);
	sizeFilter.items.sort(ascSortSize);
	asiFilter.items.sort(ascSortAsi);

	function ascSortSize (a, b) {
		return SortUtil.ascSort(toNum(a), toNum(b));

		function toNum (size) {
			switch (size) {
				case "M":
					return 0;
				case "S":
					return -1;
				case "V":
					return 1;
			}
		}
	}

	function ascSortAsi (a, b) {
		if (a.startsWith("Any") && b.startsWith("Any")) {
			const aAbil = a.replace("Any", "").replace("Increase", "").trim();
			const bAbil = b.replace("Any", "").replace("Increase", "").trim();
			return ASI_SORT_POS[aAbil] - ASI_SORT_POS[bAbil];
		} else if (a.startsWith("Any")) {
			return -1;
		} else if (b.startsWith("Any")) {
			return 1;
		} else {
			const [aAbil, aScore] = a.split(" ");
			const [bAbil, bScore] = b.split(" ");
			return (ASI_SORT_POS[aAbil] - ASI_SORT_POS[bAbil]) || (Number(bScore) - Number(aScore));
		}
	}

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: raceList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(raceList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();

	$(`body`).on("click", ".btn-name-pronounce", function () {
		const audio = $(this).find(`.name-pronounce`)[0];
		audio.currentTime = 0;
		audio.play();
	});
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const r = raceList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			r._fSources,
			r._fAbility,
			r.size,
			r._fSpeed,
			r._fMisc,
			r.languageTags
		);
	});
	FilterBox.nextIfHidden(raceList);
}

function getSublistItem (race, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(race)}" title="${race.name}">
				<span class="name col-5">${race.name}</span>
				<span class="ability col-5">${race._slAbility}</span>
				<span class="size col-2">${Parser.sizeAbvToFull(race.size)}</span>
				<span class="id hidden">${pinId}</span>
			</a>
		</li>
	`;
}

const renderer = EntryRenderer.getDefaultRenderer();
function loadhash (id) {
	renderer.setFirstSection(true);
	const $pgContent = $("#pagecontent").empty();
	const race = raceList[id];

	function buildStatsTab () {
		function getPronunciationButton () {
			return `<button class="btn btn-xs btn-default btn-name-pronounce">
				<span class="glyphicon glyphicon-volume-up name-pronounce-icon"></span>
				<audio class="name-pronounce">
				   <source src="${race.soundClip}" type="audio/mpeg">
				   <source src="audio/races/${/^(.*?)(\(.*?\))?$/.exec(race._baseName || race.name)[1].trim().toLowerCase()}.mp3" type="audio/mpeg">
				</audio>
			</button>`;
		}

		$pgContent.append(`
		<tbody>
		${EntryRenderer.utils.getBorderTr()}
		<tr><th class="name" colspan="6">
		<span class="stats-name copyable" onclick="EntryRenderer.utils._pHandleNameClick(this, '${race.source.escapeQuotes()}')">${race.name}</span>
		${race.soundClip ? getPronunciationButton() : ""}
		<span class="stats-source ${Parser.sourceJsonToColor(race.source)}" title="${Parser.sourceJsonToFull(race.source)}">${Parser.sourceJsonToAbv(race.source)}</span>
		</th></tr>
		<tr><td colspan="6"><b>Ability Scores:</b> ${(race.ability ? utils_getAbilityData(race.ability) : {asText: "None"}).asText}</td></tr>
		<tr><td colspan="6"><b>Size:</b> ${Parser.sizeAbvToFull(race.size)}</td></tr>
		<tr><td colspan="6"><b>Speed:</b> ${Parser.getSpeedString(race)}</td></tr>
		<tr id="traits"><td class="divider" colspan="6"><div></div></td></tr>
		${EntryRenderer.utils.getBorderTr()}
		</tbody>
		`);

		const renderStack = [];
		renderStack.push("<tr class='text'><td colspan='6'>");
		renderer.recursiveEntryRender({type: "entries", entries: race.entries}, renderStack, 1);
		renderStack.push("</td></tr>");
		if (race.traitTags && race.traitTags.includes("NPC Race")) {
			renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted">`);
			renderer.recursiveEntryRender(
				`{@i Note: This race is listed in the {@i Dungeon Master's Guide} as an option for creating NPCs. It is not designed for use as a playable race.}`
				, renderStack, 2);
			renderStack.push(`</section></td></tr>`);
		}
		renderStack.push(EntryRenderer.utils.getPageTr(race));

		$pgContent.find('tbody tr:last').before(renderStack.join(""));
	}

	function buildFluffTab (isImageTab) {
		return EntryRenderer.utils.buildFluffTab(
			isImageTab,
			$pgContent,
			race,
			getFluff,
			`data/fluff-races.json`,
			() => true
		);
	}

	function getFluff (fluffJson) {
		const predefined = EntryRenderer.utils.getPredefinedFluff(race, "raceFluff");
		if (predefined) return predefined;

		const subFluff = race._baseName && race.name.toLowerCase() === race._baseName.toLowerCase() ? "" : fluffJson.race.find(it => it.name.toLowerCase() === race.name.toLowerCase() && it.source.toLowerCase() === race.source.toLowerCase());

		const baseFluff = fluffJson.race.find(it => race._baseName && it.name.toLowerCase() === race._baseName.toLowerCase() && race._baseSource && it.source.toLowerCase() === race._baseSource.toLowerCase());

		if (!subFluff && !baseFluff) return null;

		const findFluff = (toFind) => fluffJson.race.find(it => toFind.name.toLowerCase() === it.name.toLowerCase() && toFind.source.toLowerCase() === it.source.toLowerCase());

		const fluff = {type: "section"};

		const addFluff = (fluffToAdd, isBase) => {
			if (fluffToAdd.entries) {
				fluff.entries = fluff.entries || [];
				const toAdd = {type: "section", entries: MiscUtil.copy(fluffToAdd.entries)};
				if (isBase && !fluffToAdd.entries.length) toAdd.name = race._baseName;
				fluff.entries.push(toAdd);
			}
			if (fluffToAdd.images && !(isBase && subFluff && subFluff._excludeBaseImages)) {
				fluff.images = fluff.images || [];
				fluff.images.push(...MiscUtil.copy(fluffToAdd.images));
			}
			if (fluffToAdd._appendCopy) {
				const toAppend = findFluff(fluffToAdd._appendCopy);
				if (toAppend.entries) {
					fluff.entries = fluff.entries || [];
					const toAdd = {type: "section", entries: MiscUtil.copy(toAppend.entries)};
					if (isBase && !fluffToAdd.entries.length) toAdd.name = race._baseName;
					fluff.entries.push(toAdd);
				}
				if (toAppend.images) {
					fluff.images = fluff.images || [];
					fluff.images.push(...MiscUtil.copy(toAppend.images));
				}
			}
		};

		if (subFluff) addFluff(subFluff);
		if (baseFluff) addFluff(baseFluff, true);

		if ((subFluff && subFluff.uncommon) || (baseFluff && baseFluff.uncommon)) {
			const entryUncommon = {type: "section", entries: [MiscUtil.copy(fluffJson.meta.uncommon)]};
			if (fluff.entries) {
				fluff.entries.push(entryUncommon);
			} else {
				fluff.entries = [HTML_NO_INFO];
				fluff.entries.push(...entryUncommon.entries)
			}
		}

		if ((subFluff && subFluff.monstrous) || (baseFluff && baseFluff.monstrous)) {
			const entryMonstrous = {type: "section", entries: [MiscUtil.copy(fluffJson.meta.monstrous)]};
			if (fluff.entries) {
				fluff.entries.push(entryMonstrous);
			} else {
				fluff.entries = [HTML_NO_INFO];
				fluff.entries.push(...entryMonstrous.entries)
			}
		}

		if (fluff.entries.length && fluff.entries[0].type === "section") {
			const firstSection = fluff.entries.splice(0, 1)[0];
			fluff.entries.unshift(...firstSection.entries);
		}

		return fluff;
	}

	const traitTab = EntryRenderer.utils.tabButton(
		"Traits",
		() => {},
		buildStatsTab
	);
	const infoTab = EntryRenderer.utils.tabButton(
		"Info",
		() => {},
		buildFluffTab
	);
	const picTab = EntryRenderer.utils.tabButton(
		"Images",
		() => {},
		buildFluffTab.bind(null, true)
	);

	EntryRenderer.utils.bindTabButtons(traitTab, infoTab, picTab);

	ListUtil.updateSelected();
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}
