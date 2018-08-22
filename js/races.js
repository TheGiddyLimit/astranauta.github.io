"use strict";
const JSON_URL = "data/races.json";
const JSON_FLUFF_URL = "data/fluff-races.json";

window.onload = function load () {
	ExcludeUtil.initialise();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad)
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
			const by = ch.amount || 1;
			ch.from.forEach(asi => {
				out.add(makeAbilObj(asi, by));
			});
		});
	}
	Object.keys(abils).forEach(abil => {
		if (abil !== "choose") {
			out.add(makeAbilObj(abil, abils[abil]));
		}
	});
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
let filterBox;
function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ['name', 'ability', 'size', 'source', 'clean-name'],
		listClass: "races"
	});

	const jsonRaces = EntryRenderer.race.mergeSubraces(data.race);

	const asiFilter = new Filter({
		header: "Ability Bonus (Including Subrace)",
		items: [
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
		umbrellaItem: "Choose"
	});

	filterBox = initFilterBox(
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
		.then(BrewUtil.pAddLocalBrewData)
		.catch(BrewUtil.purgeBrew)
		.then(() => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({list, filterBox, sourceFilter});
			ListUtil.loadState();
			RollerUtil.addListRollButton();

			History.init(true);
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
		race._fAbility = race.ability ? getAbilityObjs(race.ability).map(a => mapAbilityObjToFull(a)) : []; // used for filtering
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
					<span class='name col-xs-4'>${race.name}</span>
					<span class='ability col-xs-4'>${ability.asTextShort}</span>
					<span class='size col-xs-2'>${Parser.sizeAbvToFull(race.size)}</span>
					<span class='source col-xs-2 source${race.source}' title="${Parser.sourceJsonToFull(race.source)}">${Parser.sourceJsonToAbv(race.source)}</span>
					${bracketMatch ? `<span class="clean-name hidden">${bracketMatch[2]} ${bracketMatch[1]}</span>` : ""}
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(race._fSources);
		sizeFilter.addIfAbsent(race.size);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	racesTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);
	sizeFilter.items.sort(ascSortSize);

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
				<span class="name col-xs-5">${race.name}</span>		
				<span class="ability col-xs-5">${race._slAbility}</span>		
				<span class="size col-xs-2">${Parser.sizeAbvToFull(race.size)}</span>		
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
			return `<span class="btn btn-xs btn-default btn-name-pronounce">
				<span class="glyphicon glyphicon-volume-up name-pronounce-icon"></span>
				<audio class="name-pronounce">
				   <source src="${race.soundClip}" type="audio/mpeg">
				   <source src="audio/races/${/^(.*?)(\(.*?\))?$/.exec(race._baseName || race.name)[1].trim().toLowerCase()}.mp3" type="audio/mpeg">
				</audio>
			</span>`;
		}

		$pgContent.append(`
		<tbody>
		${EntryRenderer.utils.getBorderTr()}
		<tr><th class="name" colspan="6">Name</th></tr>
		<tr><td id="ability" colspan="6">Ability Scores: <span>+1 Dex</span></td></tr>
		<tr><td id="size" colspan="6">Size: <span>Medium</span></td></tr>
		<tr><td id="speed" colspan="6">Speed: <span>30 ft.</span></td></tr>
		<tr id="traits"><td class="divider" colspan="6"><div></div></td></tr>
		${EntryRenderer.utils.getBorderTr()}
		</tbody>		
		`);

		$pgContent.find("th.name").html(`
			<span class="stats-name copyable" onclick="EntryRenderer.utils._handleNameClick(this, '${race.source.escapeQuotes()}')">${race.name}</span>
			${race.soundClip ? getPronunciationButton() : ""}
			<span class="stats-source source${race.source}" title="${Parser.sourceJsonToFull(race.source)}">${Parser.sourceJsonToAbv(race.source)}</span>
		`);

		const size = Parser.sizeAbvToFull(race.size);
		$pgContent.find("td#size span").html(size);

		const ability = race.ability ? utils_getAbilityData(race.ability) : {asText: "None"};
		$pgContent.find("td#ability span").html(ability.asText);

		$pgContent.find("td#speed span").html(Parser.getSpeedString(race));

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

	const traitTab = EntryRenderer.utils.tabButton(
		"Traits",
		() => {},
		buildStatsTab
	);
	const infoTab = EntryRenderer.utils.tabButton(
		"Info",
		() => {},
		() => {
			function get$Tr () {
				return $(`<tr class="text">`);
			}
			function get$Td () {
				return $(`<td colspan="6" class="text">`);
			}

			$pgContent.append(EntryRenderer.utils.getBorderTr());
			$pgContent.append(EntryRenderer.utils.getNameTr(race));
			let $tr = get$Tr();
			let $td = get$Td().appendTo($tr);
			$pgContent.append($tr);
			$pgContent.append(EntryRenderer.utils.getBorderTr());

			DataUtil.loadJSON(JSON_FLUFF_URL).then((data) => {
				function renderMeta (prop) {
					let $tr2 = get$Tr();
					let $td2 = get$Td().appendTo($tr2);
					$tr.after($tr2);
					$tr.after(EntryRenderer.utils.getDividerTr());
					renderer.setFirstSection(true);
					$td2.append(renderer.renderEntry(data.meta[prop]));
					$tr = $tr2;
					$td = $td2;
				}

				const findFluff = (appendCopy) => {
					return data.race.find(it => it.name.toLowerCase() === appendCopy.name.toLowerCase() && it.source.toLowerCase() === appendCopy.source.toLowerCase());
				};

				const appendCopy = (fromFluff) => {
					if (fromFluff && fromFluff._appendCopy) {
						const appFluff = findFluff(fromFluff._appendCopy);
						renderer.setFirstSection(true);
						$td.append(renderer.renderEntry({type: "section", entries: appFluff.entries}));
					}
				};

				const subFluff = race._baseName && race.name.toLowerCase() === race._baseName.toLowerCase() ? "" : data.race.find(it => it.name.toLowerCase() === race.name.toLowerCase() && it.source.toLowerCase() === race.source.toLowerCase());
				const baseFluff = data.race.find(it => race._baseName && it.name.toLowerCase() === race._baseName.toLowerCase() && race._baseSource && it.source.toLowerCase() === race._baseSource.toLowerCase());
				if (race.fluff && race.fluff.entries) { // override; for homebrew usage only
					renderer.setFirstSection(true);
					$td.append(renderer.renderEntry({type: "section", entries: race.fluff.entries}));
				} else if (subFluff || baseFluff) {
					if (subFluff && (subFluff.entries || subFluff._appendCopy) && !baseFluff) {
						renderer.setFirstSection(true);
						$td.append(renderer.renderEntry({type: "section", entries: subFluff.entries}));
						appendCopy(subFluff);
					} else if (subFluff && (subFluff.entries || subFluff._appendCopy) && baseFluff && (baseFluff.entries || baseFluff._appendCopy)) {
						renderer.setFirstSection(true);
						$td.append(renderer.renderEntry({type: "section", entries: subFluff.entries}));
						appendCopy(subFluff);
						let $tr2 = get$Tr();
						let $td2 = get$Td().appendTo($tr2);
						$tr.after($tr2);
						$tr.after(EntryRenderer.utils.getDividerTr());
						renderer.setFirstSection(true);
						$td2.append(renderer.renderEntry({type: "section", name: race._baseName, entries: baseFluff.entries}));
						appendCopy(baseFluff);
						$tr = $tr2;
						$td = $td2;
					} else if (baseFluff && (baseFluff.entries || baseFluff._appendCopy)) {
						renderer.setFirstSection(true);
						$td.append(renderer.renderEntry({type: "section", entries: baseFluff.entries}));
						appendCopy(baseFluff);
					}
					if ((subFluff && subFluff.uncommon) || (baseFluff && baseFluff.uncommon)) {
						renderMeta("uncommon");
					}
					if ((subFluff && subFluff.monstrous) || (baseFluff && baseFluff.monstrous)) {
						renderMeta("monstrous");
					}
				} else {
					$td.empty();
					$td.append(HTML_NO_INFO);
				}
			});
		}
	);
	EntryRenderer.utils.bindTabButtons(traitTab, infoTab);

	ListUtil.updateSelected();
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}