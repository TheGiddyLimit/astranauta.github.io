"use strict";

const JSON_DIR = "data/bestiary/";
const META_URL = "meta.json";
const FLUFF_INDEX = "fluff-index.json";
const JSON_LIST_NAME = "monster";
const renderer = EntryRenderer.getDefaultRenderer();

window.PROF_MODE_BONUS = "bonus";
window.PROF_MODE_DICE = "dice";
window.PROF_DICE_MODE = PROF_MODE_BONUS;

function ascSortCr (a, b) {
	// always put unknown values last
	if (a === "Unknown" || a === undefined) a = "999";
	if (b === "Unknown" || b === undefined) b = "999";
	return SortUtil.ascSort(Parser.crToNumber(a), Parser.crToNumber(b))
}

function imgError (x) {
	$(x).closest("th").css("padding-right", "0.2em");
	$(x).remove();
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

function loadMeta (nextFunction) {
	DataUtil.loadJSON(JSON_DIR + META_URL).then(function (data) {
		// Convert the legendary Group JSONs into a look-up, i.e. use the name as a JSON property name
		for (let i = 0; i < data.legendaryGroup.length; i++) {
			meta[data.legendaryGroup[i].name] = {
				"lairActions": data.legendaryGroup[i].lairActions,
				"regionalEffects": data.legendaryGroup[i].regionalEffects
			};
		}

		nextFunction();
	});
}

// for use in homebrew only
function addLegendaryGroups (toAdd) {
	if (!toAdd || !toAdd.length) return;

	toAdd.forEach(it => {
		meta[it.name] = {
			"lairActions": it.lairActions,
			"regionalEffects": it.regionalEffects
		}
	});
}

let ixFluff = {};
function loadFluffIndex (nextFunction) {
	DataUtil.loadJSON(JSON_DIR + FLUFF_INDEX).then(function (data) {
		ixFluff = data;
		nextFunction();
	});
}

function handleBrew (homebrew) {
	addLegendaryGroups(homebrew.legendaryGroup);
	addMonsters(homebrew.monster);
}

window.onload = function load () {
	ExcludeUtil.initialise();
	loadMeta(() => {
		loadFluffIndex(() => {
			multisourceLoad(JSON_DIR, JSON_LIST_NAME, pageInit, addMonsters, () => {
				BrewUtil.addBrewData(handleBrew);
				BrewUtil.makeBrewButton("manage-brew");
				BrewUtil.bind({list, filterBox, sourceFilter});
				ListUtil.loadState();
			});
		});
	});
};

let list;
let printBookView;
const sourceFilter = getSourceFilter();
const crFilter = new Filter({header: "CR"});
const sizeFilter = new Filter({
	header: "Size",
	items: [
		SZ_FINE,
		SZ_DIMINUTIVE,
		SZ_TINY,
		SZ_SMALL,
		SZ_MEDIUM,
		SZ_LARGE,
		SZ_HUGE,
		SZ_GARGANTUAN,
		SZ_COLOSSAL,
		SZ_VARIES
	],
	displayFn: Parser.sizeAbvToFull
});
const speedFilter = new Filter({header: "Speed", items: ["walk", "burrow", "climb", "fly", "swim"], displayFn: StrUtil.uppercaseFirst});
const strengthFilter = new RangeFilter({header: "Strength"});
const dexterityFilter = new RangeFilter({header: "Dexterity"});
const constitutionFilter = new RangeFilter({header: "Constitution"});
const intelligenceFilter = new RangeFilter({header: "Intelligence"});
const wisdomFilter = new RangeFilter({header: "Wisdom"});
const charismaFilter = new RangeFilter({header: "Charisma"});
const abilityScoreFilter = new MultiFilter("Ability Score", strengthFilter, dexterityFilter, constitutionFilter, intelligenceFilter, wisdomFilter, charismaFilter);
abilityScoreFilter.setModeAnd();
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
	displayFn: StrUtil.uppercaseFirst
});
const tagFilter = new Filter({header: "Tag", displayFn: StrUtil.uppercaseFirst});
const alignmentFilter = new Filter({
	header: "Alignment",
	items: ["L", "NX", "C", "G", "NY", "E", "N", "U", "A"],
	displayFn: Parser.alignmentAbvToFull
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
	header: "Damage Vulnerabilities",
	items: DMG_TYPES,
	displayFn: dispVulnFilter
});
function dispResFilter (item) {
	return `${StrUtil.uppercaseFirst(item)} Res`;
}
const resistFilter = new Filter({
	header: "Damage Resistance",
	items: DMG_TYPES,
	displayFn: dispResFilter
});
function dispImmFilter (item) {
	return `${StrUtil.uppercaseFirst(item)} Imm`;
}
const immuneFilter = new Filter({
	header: "Damage Immunity",
	items: DMG_TYPES,
	displayFn: dispImmFilter
});
const conditionImmuneFilter = new Filter({
	header: "Condition Immunity",
	items: CONDS,
	displayFn: StrUtil.uppercaseFirst
});
const miscFilter = new Filter({header: "Miscellaneous", items: ["Familiar", "Legendary", "Spellcaster", "Swarm"], displayFn: StrUtil.uppercaseFirst});

const filterBox = initFilterBox(
	sourceFilter,
	crFilter,
	sizeFilter,
	speedFilter,
	abilityScoreFilter,
	acFilter,
	averageHpFilter,
	typeFilter,
	tagFilter,
	alignmentFilter,
	environmentFilter,
	vulnerableFilter,
	resistFilter,
	immuneFilter,
	conditionImmuneFilter,
	miscFilter
);

function pageInit (loadedSources) {
	sourceFilter.items = Object.keys(loadedSources).map(src => new FilterItem(src, loadSource(JSON_LIST_NAME, addMonsters)));
	sourceFilter.items.sort(SortUtil.ascSort);

	list = ListUtil.search({
		valueNames: ["name", "source", "type", "cr", "group"],
		listClass: "monsters"
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
	$("#filtertools").find("button.sort").on(EVNT_CLICK, function () {
		const $this = $(this);
		$this.data("sortby", $this.data("sortby") === "asc" ? "desc" : "asc");
		list.sort($this.data("sort"), {order: $this.data("sortby"), sortFunction: sortMonsters});
	});

	const subList = ListUtil.initSublist({
		valueNames: ["name", "source", "type", "cr", "count", "id"],
		listClass: "submonsters",
		sortFunction: sortMonsters,
		onUpdate: onSublistChange
	});
	ListUtil.bindAddButton();
	ListUtil.bindSubtractButton();
	ListUtil.initGenericAddable();

	// print view
	printBookView = new BookModeView("bookview", $(`#btn-printbook`), "Please make a list of creatures first",
		($tbl) => {
			const toShow = ListUtil.getSublistedIds().map(id => monsters[id]).sort((a, b) => SortUtil.ascSort(a.name, b.name));
			let numShown = 0;
			const stack = [];
			stack.push(`<tr class="printbook-bestiary"><td>`);
			toShow.forEach(mon => {
				stack.push(`<table class="printbook-bestiary-entry"><tbody>`);
				stack.push(EntryRenderer.monster.getCompactRenderedString(mon, renderer));
				stack.push(`</tbody></table>`);
			});
			stack.push(`</td></tr>`);
			numShown += toShow.length;
			$tbl.append(stack.join(""));
			return numShown;
		}
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
}

function onSublistChange () {
	const $totalCr = $(`#totalcr`);
	let baseXp = 0;
	let totalCount = 0;
	ListUtil.sublist.items.forEach(it => {
		const mon = monsters[Number(it._values.id)];
		const count = Number($(it.elm).find(".count").text());
		totalCount += count;
		if (mon.cr) baseXp += Parser.crToXpNumber(mon.cr) * count;
	});
	$totalCr.html(`${baseXp.toLocaleString()} XP (Enc: ${(Parser.numMonstersToXpMult(totalCount) * baseXp).toLocaleString()} XP)`);
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const m = monsters[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			m.source,
			m._pCr,
			m.size,
			m._fSpeed,
			[
				m.str,
				m.dex,
				m.con,
				m.int,
				m.wis,
				m.cha
			],
			m._fAc,
			m._fHp,
			m._pTypes.type,
			m._pTypes.tags,
			m._fAlign,
			m.environment,
			m._fVuln,
			m._fRes,
			m._fImm,
			m._fCondImm,
			m._fMisc
		);
	});
	onFilterChangeMulti(monsters);
}

let monsters = [];
let mI = 0;

const _NEUT_ALIGNS = ["NX", "NY"];
function addMonsters (data) {
	if (!data || !data.length) return;

	monsters = monsters.concat(data);

	const table = $("ul.monsters");
	let textStack = "";
	// build the table
	for (; mI < monsters.length; mI++) {
		const mon = monsters[mI];
		if (ExcludeUtil.isExcluded(mon.name, "monster", mon.source)) continue;
		mon._pTypes = Parser.monTypeToFullObj(mon.type); // store the parsed type
		mon._pCr = mon.cr === undefined ? "Unknown" : (mon.cr.cr || mon.cr);
		mon._fSpeed = Object.keys(mon.speed).filter(k => mon.speed[k]);
		mon._fAc = mon.ac.map(it => it.ac || it);
		mon._fHp = mon.hp.average;
		const tempAlign = typeof mon.alignment[0] === "object"
			? Array.prototype.concat.apply([], mon.alignment.map(a => a.alignment))
			: [...mon.alignment];
		if (tempAlign.includes("N") && !tempAlign.includes("G") && !tempAlign.includes("E")) tempAlign.push("NY");
		else if (tempAlign.includes("N") && !tempAlign.includes("L") && !tempAlign.includes("C")) tempAlign.push("NX");
		else if (tempAlign.length === 1 && tempAlign.includes("N")) Array.prototype.push.apply(tempAlign, _NEUT_ALIGNS);
		mon._fAlign = tempAlign;
		mon.environment = mon.environment || [];
		mon._fVuln = mon.vulnerable ? getAllImmRest(mon.vulnerable, "vulnerable") : [];
		mon._fRes = mon.resist ? getAllImmRest(mon.resist, "resist") : [];
		mon._fImm = mon.immune ? getAllImmRest(mon.immune, "immune") : [];
		mon._fCondImm = mon.conditionImmune ? getAllImmRest(mon.conditionImmune, "conditionImmune") : [];

		const abvSource = Parser.sourceJsonToAbv(mon.source);

		textStack +=
			`<li class="row" ${FLTR_ID}="${mI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id=${mI} href="#${UrlUtil.autoEncodeHash(mon)}" title="${mon.name}">
					<span class="name col-xs-4 col-xs-4-2">${mon.name}</span>
					<span title="${Parser.sourceJsonToFull(mon.source)}${EntryRenderer.utils.getSourceSubText(mon)}" class="col-xs-2 source source${abvSource}">${abvSource}</span>
					<span class="type col-xs-4 col-xs-4-1">${mon._pTypes.asText.uppercaseFirst()}</span>
					<span class="col-xs-1 col-xs-1-7 text-align-center cr">${mon._pCr}</span>
					${mon.group ? `<span class="group hidden">${mon.group}</span>` : ""}
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(new FilterItem(mon.source, () => {}));
		crFilter.addIfAbsent(mon._pCr);
		strengthFilter.addIfAbsent(mon.str);
		dexterityFilter.addIfAbsent(mon.dex);
		constitutionFilter.addIfAbsent(mon.con);
		intelligenceFilter.addIfAbsent(mon.int);
		wisdomFilter.addIfAbsent(mon.wis);
		charismaFilter.addIfAbsent(mon.cha);
		mon.ac.forEach(it => acFilter.addIfAbsent(it.ac || it));
		if (mon.hp.average) averageHpFilter.addIfAbsent(mon.hp.average);
		mon._pTypes.tags.forEach(t => tagFilter.addIfAbsent(t));
		mon._fMisc = mon.legendary || mon.legendaryGroup ? ["Legendary"] : [];
		if (mon.familiar) mon._fMisc.push("Familiar");
		if (mon.type.swarmSize) mon._fMisc.push("Swarm");
		if (mon.spellcasting) mon._fMisc.push("Spellcaster");
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	table.append(textStack);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);
	crFilter.items.sort(ascSortCr);
	typeFilter.items.sort(SortUtil.ascSort);
	tagFilter.items.sort(SortUtil.ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: monsters,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	EntryRenderer.hover.bindPopoutButton(monsters);
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

function getSublistItem (mon, pinId, addCount) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(mon)}" title="${mon.name}">
				<span class="name col-xs-4">${mon.name}</span>
				<span class="type col-xs-3">${mon._pTypes.asText.uppercaseFirst()}</span>
				<span class="cr col-xs-3 text-align-center">${mon._pCr}</span>		
				<span class="count col-xs-2 text-align-center">${addCount || 1}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

// sorting for form filtering
function sortMonsters (a, b, o) {
	if (o.valueName === "count") return SortUtil.ascSort(Number(a.values().count), Number(b.values().count));
	a = monsters[a.elm.getAttribute(FLTR_ID)];
	b = monsters[b.elm.getAttribute(FLTR_ID)];
	if (o.valueName === "name") return SortUtil.ascSort(a.name, b.name);
	if (o.valueName === "type") return SortUtil.ascSort(a._pTypes.asText, b._pTypes.asText);
	if (o.valueName === "source") return SortUtil.ascSort(a.source, b.source);
	if (o.valueName === "cr") return ascSortCr(a._pCr, b._pCr);
	return 0;
}

let profBtn = null;
// load selected monster stat block
function loadhash (id) {
	renderer.setFirstSection(true);

	const $content = $("#pagecontent").empty();
	const $wrpBtnProf = $(`#wrp-profbonusdice`);

	const mon = monsters[id];

	if (profBtn !== null) {
		$wrpBtnProf.append(profBtn);
		profBtn = null;
	}

	function buildStatsTab () {
		$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		<tr><th class="name" colspan="6">Name <span class="source" title="Source book">SRC</span></th></tr>
		<tr><td id="sizetypealignment" colspan="6"><span id="size">Size</span> <span id="type">type</span>, <span id="alignment">alignment</span></td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr><td colspan="6"><strong>Armor Class</strong> <span id="ac">## (source)</span></td></tr>
		<tr><td colspan="6"><strong>Hit Points</strong> <span id="hp">hp</span></td></tr>
		<tr><td colspan="6"><strong>Speed</strong> <span id="speed">30 ft.</span></td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr id="abilitynames"><th>STR</th><th>DEX</th><th>CON</th><th>INT</th><th>WIS</th><th>CHA</th></tr>
		<tr id="abilityscores">
			<td id="str">${EntryRenderer.getDefaultRenderer().renderEntry(`{@dice 1d20${Parser.getAbilityModifier(mon.str)}|${mon.str} (${Parser.getAbilityModifier(mon.str)})|Strength}`)}</td>
			<td id="dex">${EntryRenderer.getDefaultRenderer().renderEntry(`{@dice 1d20${Parser.getAbilityModifier(mon.dex)}|${mon.dex} (${Parser.getAbilityModifier(mon.dex)})|Dexterity}`)}</td>
			<td id="con">${EntryRenderer.getDefaultRenderer().renderEntry(`{@dice 1d20${Parser.getAbilityModifier(mon.con)}|${mon.con} (${Parser.getAbilityModifier(mon.con)})|Constitution}`)}</td>
			<td id="int">${EntryRenderer.getDefaultRenderer().renderEntry(`{@dice 1d20${Parser.getAbilityModifier(mon.int)}|${mon.int} (${Parser.getAbilityModifier(mon.int)})|Intelligence}`)}</td>
			<td id="wis">${EntryRenderer.getDefaultRenderer().renderEntry(`{@dice 1d20${Parser.getAbilityModifier(mon.wis)}|${mon.wis} (${Parser.getAbilityModifier(mon.wis)})|Wisdom}`)}</td>
			<td id="cha">${EntryRenderer.getDefaultRenderer().renderEntry(`{@dice 1d20${Parser.getAbilityModifier(mon.cha)}|${mon.cha} (${Parser.getAbilityModifier(mon.cha)})|Charisma}`)}</td>
		</tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr><td colspan="6"><strong>Saving Throws</strong> <span id="saves">Str +0</span></td></tr>
		<tr><td colspan="6"><strong>Skills</strong> <span id="skills">Perception +0</span></td></tr>
		<tr><td colspan="6"><strong>Damage Vulnerabilities</strong> <span id="dmgvuln">fire</span></td></tr>
		<tr><td colspan="6"><strong>Damage Resistances</strong> <span id="dmgres">cold</span></td></tr>
		<tr><td colspan="6"><strong>Damage Immunities</strong> <span id="dmgimm">lightning</span></td></tr>
		<tr><td colspan="6"><strong>Condition Immunities</strong> <span id="conimm">exhaustion</span></td></tr>
		<tr><td colspan="6"><strong>Senses</strong> <span id="senses">darkvision 30 ft.</span> passive Perception <span id="pp">10</span></td></tr>
		<tr><td colspan="6"><strong>Languages</strong> <span id="languages">Common</span></td></tr>
		<tr><td colspan="6"><strong>Challenge</strong> <span id="cr">1 (450 XP)</span></td></tr>
		<tr id="traits"><td class="divider" colspan="6"><div></div></td></tr>
		<tr class="trait"><td colspan="6"><span class="name">Trait.</span> <span class="content">Content.</span></td></tr>
		<tr id="actions"><td colspan="6"><span>Actions</span></td></tr>
		<tr class="action"><td colspan="6"><span class="name">Action.</span> <span class="content">Content.</span></td></tr>
		<tr id="reactions"><td colspan="6"><span>Reactions</span></td></tr>
		<tr class="reaction"><td colspan="6"><span class="name">Reaction.</span> <span class="content">Content.</span></td></tr>
		<tr id="legendaries"><td colspan="6"><span>Legendary Actions</span></td></tr>
		<tr class="legendary"><td colspan="6"><span class="name">Action.</span> <span class="content">Content.</span></td></tr>
		<tr id="lairactions"><td colspan="6"><span>Lair Actions</span></td></tr>
		<tr class="lairaction"><td colspan="6"><span class="name">Action.</span> <span class="content">Content.</span></td></tr>
		<tr id="regionaleffects"><td colspan="6"><span>Regional Effects</span></td></tr>
		<tr class="regionaleffect"><td colspan="6"><span class="name">Effect.</span> <span class="content">Content.</span></td></tr>
		<tr id="variants"></tr>
		<tr id="source"></tr>
		${EntryRenderer.utils.getBorderTr()}
		`);

		let renderStack = [];
		let entryList = {};
		const name = mon.name;
		let source = Parser.sourceJsonToAbv(mon.source);
		let sourceFull = Parser.sourceJsonToFull(mon.source);
		const type = mon._pTypes.asText;

		function getPronunciationButton () {
			return `<span class="btn btn-xs btn-default btn-name-pronounce">
				<span class="glyphicon glyphicon-volume-up name-pronounce-icon"></span>
				<audio class="name-pronounce">
				   <source src="${mon.soundClip}" type="audio/mpeg">
				   <source src="audio/bestiary/${basename(mon.soundClip, '/')}" type="audio/mpeg">
				</audio>
			</span>`;
		}

		const imgLink = mon.tokenURL || UrlUtil.link(`img/${source}/${name.replace(/"/g, "")}.png`);
		$content.find("th.name").html(
			`<span class="stats-name">${name}</span>
			${mon.soundClip ? getPronunciationButton() : ""}
		<span class="stats-source source${source}" title="${sourceFull}${EntryRenderer.utils.getSourceSubText(mon)}">${source}</span>
		<a href="${imgLink}" target="_blank">
			<img src="${imgLink}" class="token" onerror="imgError(this)">
		</a>`
		);

		// TODO most of this could be rolled into the string template above
		$content.find("td span#size").html(Parser.sizeAbvToFull(mon.size));

		$content.find("td span#type").html(type);

		$content.find("td span#alignment").html(Parser.alignmentListToFull(mon.alignment).toLowerCase());

		$content.find("td span#ac").html(Parser.acToFull(mon.ac));

		$content.find("td span#hp").html(EntryRenderer.monster.getRenderedHp(mon.hp));

		$content.find("td span#speed").html(Parser.getSpeedString(mon));

		var saves = mon.save;
		if (saves) {
			const parsedSaves = Object.keys(saves).map(it => `${it.uppercaseFirst()} ${saves[it]}`).join(", ");
			$content.find("td span#saves").parent().show();
			$content.find("td span#saves").html(parsedSaves);
		} else {
			$content.find("td span#saves").parent().hide();
		}

		var skills = mon.skill;
		if (skills) {
			$content.find("td span#skills").parent().show();
			$content.find("td span#skills").html(EntryRenderer.monster.getSkillsString(mon));
		} else {
			$content.find("td span#skills").parent().hide();
		}

		var dmgvuln = mon.vulnerable;
		if (dmgvuln) {
			$content.find("td span#dmgvuln").parent().show();
			$content.find("td span#dmgvuln").html(Parser.monImmResToFull(dmgvuln));
		} else {
			$content.find("td span#dmgvuln").parent().hide();
		}

		var dmgres = mon.resist;
		if (dmgres) {
			$content.find("td span#dmgres").parent().show();
			$content.find("td span#dmgres").html(Parser.monImmResToFull(dmgres));
		} else {
			$content.find("td span#dmgres").parent().hide();
		}

		var dmgimm = mon.immune;
		if (dmgimm) {
			$content.find("td span#dmgimm").parent().show();
			$content.find("td span#dmgimm").html(Parser.monImmResToFull(dmgimm));
		} else {
			$content.find("td span#dmgimm").parent().hide();
		}

		var conimm = mon.conditionImmune;
		if (conimm) {
			$content.find("td span#conimm").parent().show();
			$content.find("td span#conimm").html(Parser.monCondImmToFull(conimm));
		} else {
			$content.find("td span#conimm").parent().hide();
		}

		var senses = mon.senses;
		if (senses) {
			$content.find("td span#senses").html(senses + ", ");
		} else {
			$content.find("td span#senses").html("");
		}

		$content.find("td span#pp").html(mon.passive);

		var languages = mon.languages;
		if (languages) {
			$content.find("td span#languages").html(languages);
		} else {
			$content.find("td span#languages").html("\u2014");
		}

		$content.find("td span#cr").html(Parser.monCrToFull(mon.cr));

		$content.find("tr.trait").remove();

		let trait = EntryRenderer.monster.getOrderedTraits(mon, renderer);
		if (trait) renderSection("trait", "trait", trait, 1);

		const action = mon.action;
		$content.find("tr#actions").hide();
		$content.find("tr.action").remove();

		if (action) renderSection("action", "action", action, 1);

		const reaction = mon.reaction;
		$content.find("tr#reactions").hide();
		$content.find("tr.reaction").remove();

		if (reaction) renderSection("reaction", "reaction", reaction, 1);

		const variants = mon.variant;
		const variantSect = $content.find(`#variants`);
		if (!variants) variantSect.hide();
		else {
			const rStack = [];
			variants.forEach(v => renderer.recursiveEntryRender(v, rStack));
			variantSect.html(`<td colspan=6>${rStack.join("")}</td>`);
			variantSect.show();
		}

		const srcCpy = {
			source: mon.source,
			sourceSub: mon.sourceSub,
			page: mon.page
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
		$content.find(`#source`).append(EntryRenderer.utils.getPageTr(srcCpy));

		const legendary = mon.legendary;
		$content.find("tr#legendaries").hide();
		$content.find("tr.legendary").remove();
		if (legendary) {
			renderSection("legendary", "legendary", legendary, 1);
			$content.find("tr#legendaries").after(`<tr class='legendary'><td colspan='6' class='legendary'><span class='name'></span> <span>${EntryRenderer.monster.getLegendaryActionIntro(mon)}</span></td></tr>`);
		}

		const legendaryGroup = mon.legendaryGroup;
		$content.find("tr.lairaction").remove();
		$content.find("tr#lairactions").hide();
		$content.find("tr.regionaleffect").remove();
		$content.find("tr#regionaleffects").hide();
		if (legendaryGroup) {
			const thisGroup = meta[legendaryGroup];
			if (thisGroup.lairActions) renderSection("lairaction", "legendary", thisGroup.lairActions, 0);
			if (thisGroup.regionalEffects) renderSection("regionaleffect", "legendary", thisGroup.regionalEffects, 0);
		}

		function renderSection (sectionTrClass, sectionTdClass, sectionEntries, sectionLevel) {
			let pluralSectionTrClass = sectionTrClass === `legendary` ? `legendaries` : `${sectionTrClass}s`;
			$content.find(`tr#${pluralSectionTrClass}`).show();
			entryList = {type: "entries", entries: sectionEntries};
			renderStack = [];
			sectionEntries.forEach(e => {
				if (e.rendered) renderStack.push(e.rendered);
				else renderer.recursiveEntryRender(e, renderStack, sectionLevel + 1);
			});
			$content.find(`tr#${pluralSectionTrClass}`).after(`<tr class='${sectionTrClass}'><td colspan='6' class='${sectionTdClass}'>${renderStack.join("")}</td></tr>`);
		}

		// add click links for rollables
		$content.find("#abilityscores td").each(function () {
			$(this).wrapInner(`<span class="roller" data-roll="1d20${$(this).children(".mod").html()}" title="${Parser.attAbvToFull($(this).prop("id"))}"></span>`);
		});

		const isProfDiceMode = PROF_DICE_MODE === PROF_MODE_DICE;
		if (mon.skill) {
			$content.find("#skills").each(makeSkillRoller);
		}
		if (mon.save) {
			$content.find("#saves").each(makeSaveRoller);
		}

		function makeSkillRoller () {
			const $this = $(this);

			const re = /,\s*(?![^()]*\))/g; // Don't split commas within parentheses
			const skills = $this.html().split(re).map(s => s.trim());
			const out = [];

			skills.map(s => {
				const re = /([-+])?\d+|(?:[^+]|\n(?!\+))+/g; // Split before and after each bonus
				const spl = s.match(re);

				const skillName = spl[0].trim();

				var skillString = "";
				spl.map(b => {
					const re = /([-+])?\d+/;

					if (b.match(re)) {
						const bonus = Number(b);
						const pBonusStr = `+${bonus}`;
						skillString += renderSkillOrSaveRoller(skillName, pBonusStr, false);
					} else {
						skillString += b;
					}
				});

				out.push(skillString);
			});

			$this.html(out.join(", "));
		}

		function makeSaveRoller () {
			const $this = $(this);
			const saves = $this.html().split(",").map(s => s.trim());
			const out = [];
			saves.map(s => {
				const spl = s.split("+").map(s => s.trim());
				const bonus = Number(spl[1]);
				const pBonusStr = `+${bonus}`;
				out.push(spl[0] + ' ' + renderSkillOrSaveRoller(spl[0], pBonusStr, true));
			});
			$this.html(out.join(", "));
		}

		function renderSkillOrSaveRoller (itemName, profBonusString, isSave) {
			itemName = itemName.replace(/plus one of the following:/g, "").replace(/^or\s*/, "");
			return EntryRenderer.getDefaultRenderer().renderEntry(`{@dice 1d20${profBonusString}|${profBonusString}|${itemName}${isSave ? " save" : ""}`);
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
				const expectedPB = getProfBonusFromCr(mon.cr);

				// skills and saves can have expertise
				let expert = 1;
				let pB = expectedPB;
				if ($(this).parent().prop("id") === "saves") {
					const title = $(this).attr("title");
					const fromAbility = Parser.getAbilityModNumber(mon[title.split(" ")[0].trim().toLowerCase()]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
				} else if ($(this).parent().prop("id") === "skills") {
					const title = $(this).attr("title");
					const fromAbility = Parser.getAbilityModNumber(mon[getAttribute(title)]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
				}
				const withoutPB = bonus - pB;

				// if we have proficiency bonus, convert the roller
				if (expectedPB > 0) {
					const profDiceString = `${expert}d${pB * (3 - expert)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`;

					$(this).attr("data-roll-prof-bonus", $(this).text());
					$(this).attr("data-roll-prof-dice", profDiceString);
					const parsed = EntryRenderer.dice._parse(profDiceString);
					const entFormat = parsed.dice.map(d => ({number: d.num, faces: d.faces}));
					entFormat.unshift({number: 1, faces: 20});

					// here be (metallic) dragons
					const cached = $(this).attr("onclick");
					const nu = `
					(function(it) {
						if (PROF_DICE_MODE === PROF_MODE_DICE) {
							EntryRenderer.dice.rollerClick(it, '{"type":"dice","rollable":true,"toRoll":${JSON.stringify(entFormat)}}'${$(this).prop("title") ? `, '${$(this).prop("title")}'` : ""})
						} else {
							${cached.replace(/this/g, "it")}
						}
					})(this)`;

					$(this).attr("onclick", nu);

					if (isProfDiceMode) {
						$(this).html(profDiceString);
					}
				}
			});

		$content.find("p").each(function () {
			$(this).html($(this).html().replace(/DC\s*(\d+)/g, function (match, capture) {
				const dc = Number(capture);

				const expectedPB = getProfBonusFromCr(mon.cr);

				if (expectedPB > 0) {
					const withoutPB = dc - expectedPB;
					const profDiceString = `1d${(expectedPB * 2)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`;

					return `DC <span class="dc-roller" mode="${isProfDiceMode ? "dice" : ""}" onclick="dcRollerClick(this, '${profDiceString}')" data-roll-prof-bonus="${capture}" data-roll-prof-dice="${profDiceString}">${isProfDiceMode ? profDiceString : capture}</span>`;
				} else {
					return match; // if there was no proficiency bonus to work with, fall back on this
				}
			}));
		});
	}

	function buildFluffTab (showImages) {
		$content.append(EntryRenderer.utils.getBorderTr());
		const name = $(EntryRenderer.utils.getNameTr(monsters[id]));
		name.find(`th`).css("padding-right", "0.3em");
		$content.append(name);
		const $tr = $(`<tr class='text'/>`);
		$content.append($tr);
		const $td = $(`<td colspan='6' class='text'/>`).appendTo($tr);
		$content.append(EntryRenderer.utils.getBorderTr());
		renderer.setFirstSection(true);

		function handleFluff (data) {
			const fluff = mon.fluff || data.monster.find(it => (it.name === mon.name && it.source === mon.source));

			if (!fluff) {
				$td.empty();
				$td.append(HTML_NO_INFO);
				return;
			}

			if (fluff._copy) {
				const cpy = data.monster.find(it => fluff._copy.name === it.name && fluff._copy.source === it.source);
				// preserve these
				const name = fluff.name;
				const src = fluff.source;
				const images = fluff.images;
				Object.assign(fluff, cpy);
				fluff.name = name;
				fluff.source = src;
				if (images) fluff.images = images;
				delete fluff._copy;
			}

			if (fluff._appendCopy) {
				const cpy = data.monster.find(it => fluff._appendCopy.name === it.name && fluff._appendCopy.source === it.source);
				if (cpy.images) {
					if (!fluff.images) fluff.images = cpy.images;
					else fluff.images = fluff.images.concat(cpy.images);
				}
				if (cpy.entries) {
					if (!fluff.entries) fluff.entries = cpy.entries;
					else fluff.entries.entries = fluff.entries.entries.concat(cpy.entries.entries);
				}
				delete fluff._appendCopy;
			}

			if (showImages) {
				if (fluff.images) {
					fluff.images.forEach(img => $td.append(renderer.renderEntry(img, 1)));
				} else {
					$td.append(HTML_NO_IMAGES);
				}
			} else {
				if (fluff.entries) {
					const depth = fluff.entries.type === "section" ? -1 : 2;
					$td.append(renderer.renderEntry(fluff.entries, depth));
				} else {
					$td.append(HTML_NO_INFO);
				}
			}
		}

		if (ixFluff[mon.source] || mon.fluff) {
			if (mon.fluff) handleFluff();
			else DataUtil.loadJSON(JSON_DIR + ixFluff[mon.source]).then(handleFluff);
		} else {
			$td.empty();
			if (showImages) $td.append(HTML_NO_IMAGES);
			else $td.append(HTML_NO_INFO);
		}
	}

	// reset tabs
	const statTab = EntryRenderer.utils.tabButton(
		"Statblock",
		() => $wrpBtnProf.append(profBtn),
		buildStatsTab
	);
	const infoTab = EntryRenderer.utils.tabButton(
		"Info",
		() => profBtn = profBtn || $wrpBtnProf.children().detach(),
		buildFluffTab
	);
	const picTab = EntryRenderer.utils.tabButton(
		"Images",
		() => profBtn = profBtn || $wrpBtnProf.children().detach(),
		() => buildFluffTab(true)
	);
	EntryRenderer.utils.bindTabButtons(statTab, infoTab, picTab);

	loadsub([]);
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

function getProfBonusFromCr (cr) {
	if (CR_TO_PROF[cr]) return CR_TO_PROF[cr];
	return 0;
}

function dcRollerClick (ele, exp) {
	const parsed = EntryRenderer.dice._parse(exp);
	const entFormat = parsed.dice.map(d => ({number: d.num, faces: d.faces}));
	entFormat[0].modifier = parsed.mod;
	const it = {
		type: "dice",
		rollable: true,
		toRoll: entFormat
	};
	EntryRenderer.dice.rollerClick(ele, JSON.stringify(it));
}

const CR_TO_PROF = {
	"0": 2,
	"1/8": 2,
	"1/4": 2,
	"1/2": 2,
	"1": 2,
	"2": 2,
	"3": 2,
	"4": 2,
	"5": 3,
	"6": 3,
	"7": 3,
	"8": 3,
	"9": 4,
	"10": 4,
	"11": 4,
	"12": 4,
	"13": 5,
	"14": 5,
	"15": 5,
	"16": 5,
	"17": 6,
	"18": 6,
	"19": 6,
	"20": 6,
	"21": 7,
	"22": 7,
	"23": 7,
	"24": 7,
	"25": 8,
	"26": 8,
	"27": 8,
	"28": 8,
	"29": 9,
	"30": 9
};
const SKILL_TO_ATB_ABV = {
	"athletics": "str",
	"acrobatics": "dex",
	"sleight of hand": "dex",
	"stealth": "dex",
	"arcana": "int",
	"history": "int",
	"investigation": "int",
	"nature": "int",
	"religion": "int",
	"animal handling": "wis",
	"insight": "wis",
	"medicine": "wis",
	"perception": "wis",
	"survival": "wis",
	"deception": "cha",
	"intimidation": "cha",
	"performance": "cha",
	"persuasion": "cha"
};

function getAttribute (skill) {
	return SKILL_TO_ATB_ABV[skill.toLowerCase().trim()];
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub, sublistFuncPreload);

	const bookViewHash = sub.find(it => it.startsWith(printBookView.hashKey));
	if (bookViewHash && UrlUtil.unpackSubHash(bookViewHash)[printBookView.hashKey][0] === "true") printBookView.open();
	else printBookView.teardown();
}
