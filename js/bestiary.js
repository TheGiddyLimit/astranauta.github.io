"use strict";

const JSON_DIR = "data/bestiary/";
const META_URL = "meta.json";
const FLUFF_INDEX = "fluff-index.json";
const JSON_LIST_NAME = "monster";
const renderer = new EntryRenderer();

let tableDefault = "";

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

const meta = {};

function loadMeta (nextFunction) {
	DataUtil.loadJSON(JSON_DIR + META_URL, function (data) {
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

let ixFluff = {};
function loadFluffIndex (nextFunction) {
	DataUtil.loadJSON(JSON_DIR + FLUFF_INDEX, function (data) {
		ixFluff = data;
		nextFunction();
	});
}

window.onload = function load () {
	loadMeta(() => {
		loadFluffIndex(() => {
			multisourceLoad(JSON_DIR, JSON_LIST_NAME, pageInit, addMonsters);
		});
	});
};

let list;
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
const miscFilter = new Filter({header: "Miscellaneous", items: ["Familiar", "Legendary", "Swarm"], displayFn: StrUtil.uppercaseFirst});

const filterBox = initFilterBox(
	sourceFilter,
	crFilter,
	sizeFilter,
	speedFilter,
	typeFilter,
	tagFilter,
	alignmentFilter,
	vulnerableFilter,
	resistFilter,
	immuneFilter,
	conditionImmuneFilter,
	miscFilter
);

function pageInit (loadedSources) {
	tableDefault = $("#pagecontent").html();

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

	// proficiency bonus/dice toggle
	const profBonusDiceBtn = $("button#profbonusdice");
	profBonusDiceBtn.useDice = false;
	profBonusDiceBtn.click(function () {
		if (this.useDice) {
			this.innerHTML = "Use Proficiency Dice";
			$("#pagecontent").find(`span.roller[${ATB_PROF_MODE}], span.dc-roller[${ATB_PROF_MODE}]`).each(function () {
				const $this = $(this);
				$this.attr(ATB_PROF_MODE, PROF_MODE_BONUS);
				$this.html($this.attr(ATB_PROF_BONUS_STR));
			})
		} else {
			this.innerHTML = "Use Proficiency Bonus";
			$("#pagecontent").find(`span.roller[${ATB_PROF_MODE}], span.dc-roller[${ATB_PROF_MODE}]`).each(function () {
				const $this = $(this);
				$this.attr(ATB_PROF_MODE, PROF_MODE_DICE);
				$this.html($this.attr(ATB_PROF_DICE_STR));
			})
		}
		this.useDice = !this.useDice;
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
			m._pTypes.type,
			m._pTypes.tags,
			m._fAlign,
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
	monsters = monsters.concat(data);

	const table = $("ul.monsters");
	let textStack = "";
	// build the table
	for (; mI < monsters.length; mI++) {
		const mon = monsters[mI];
		mon._pTypes = Parser.monTypeToFullObj(mon.type); // store the parsed type
		mon._pCr = mon.cr === undefined ? "Unknown" : (mon.cr.cr || mon.cr);
		mon._fSpeed = Object.keys(mon.speed).filter(k => mon.speed[k]);
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
		crFilter.addIfAbsent(mon._pCr);
		mon._pTypes.tags.forEach(t => tagFilter.addIfAbsent(t));
		mon._fMisc = mon.legendary || mon.legendaryGroup ? ["Legendary"] : [];
		if (mon.familiar) mon._fMisc.push("Familiar");
		if (mon.type.swarmSize) mon._fMisc.push("Swarm");
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	table.append(textStack);

	// sort filters
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
	ListUtil.loadState();
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

function objToTitleCaseStringWithCommas (obj) {
	return Object.keys(obj).map(function (k) {
		return k.uppercaseFirst() + " " + obj[k]
	}).join(", ");
}

let profBtn = null;
// load selected monster stat block
function loadhash (id) {
	const $content = $("#pagecontent");
	const $wrpBtnProf = $(`#wrp-profbonusdice`);

	const mon = monsters[id];

	$content.html(tableDefault);
	if (profBtn !== null) {
		$wrpBtnProf.append(profBtn);
		profBtn = null;
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
		if (ixFluff[mon.source]) {
			DataUtil.loadJSON(JSON_DIR + ixFluff[mon.source], (data) => {
				const fluff = data.monster.find(it => (it.name === mon.name && it.source === mon.source));

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
			});
		} else {
			$td.empty();
			if (showImages) $td.append(HTML_NO_IMAGES);
			else $td.append(HTML_NO_INFO);
		}
	}

	// reset tabs
	const statTab = EntryRenderer.utils.tabButton(
		"Statblock",
		() => {
			$wrpBtnProf.append(profBtn);
		}
	);
	const infoTab = EntryRenderer.utils.tabButton(
		"Info",
		() => {
			profBtn = profBtn || $wrpBtnProf.children().detach();
		},
		() => {
			buildFluffTab();
		}
	);
	const picTab = EntryRenderer.utils.tabButton(
		"Images",
		() => {
			profBtn = profBtn || $wrpBtnProf.children().detach();
		},
		() => {
			buildFluffTab(true);
		}
	);
	EntryRenderer.utils.bindTabButtons(statTab, infoTab, picTab);

	let renderStack = [];
	let entryList = {};
	var name = mon.name;
	let source = Parser.sourceJsonToAbv(mon.source);
	let sourceFull = Parser.sourceJsonToFull(mon.source);
	var type = mon._pTypes.asText;

	const imgLink = mon.tokenURL || UrlUtil.link(`img/${source}/${name.replace(/"/g, "")}.png`);
	$content.find("th.name").html(
		`<span class="stats-name">${name}</span>
		<span class="stats-source source${source}" title="${sourceFull}${EntryRenderer.utils.getSourceSubText(mon)}">${source}</span>
		<a href="${imgLink}" target="_blank">
			<img src="${imgLink}" class="token" onerror="imgError(this)">
		</a>`
	);

	$content.find("td span#size").html(Parser.sizeAbvToFull(mon.size));

	$content.find("td span#type").html(type);

	$content.find("td span#alignment").html(Parser.alignmentListToFull(mon.alignment).toLowerCase());

	$content.find("td span#ac").html(mon.ac);

	$content.find("td span#hp").html(mon.hp);

	$content.find("td span#speed").html(Parser.getSpeedString(mon));

	$content.find("td#str span.score").html(mon.str);
	$content.find("td#str span.mod").html(Parser.getAbilityModifier(mon.str));

	$content.find("td#dex span.score").html(mon.dex);
	$content.find("td#dex span.mod").html(Parser.getAbilityModifier(mon.dex));

	$content.find("td#con span.score").html(mon.con);
	$content.find("td#con span.mod").html(Parser.getAbilityModifier(mon.con));

	$content.find("td#int span.score").html(mon.int);
	$content.find("td#int span.mod").html(Parser.getAbilityModifier(mon.int));

	$content.find("td#wis span.score").html(mon.wis);
	$content.find("td#wis span.mod").html(Parser.getAbilityModifier(mon.wis));

	$content.find("td#cha span.score").html(mon.cha);
	$content.find("td#cha span.mod").html(Parser.getAbilityModifier(mon.cha));

	var saves = mon.save;
	if (saves) {
		$content.find("td span#saves").parent().show();
		$content.find("td span#saves").html(saves);
	} else {
		$content.find("td span#saves").parent().hide();
	}

	var skills = mon.skill;
	let perception = 0;
	if (skills) {
		$content.find("td span#skills").parent().show();
		$content.find("td span#skills").html(objToTitleCaseStringWithCommas(skills));
		if (skills.perception) perception = parseInt(skills.perception);
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

	const isProfDiceMode = $("button#profbonusdice")[0].useDice;
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
					const fromAbility = Parser.getAbilityModNumber(mon[getAttribute(skillName)]);
					const expectedPB = getProfBonusFromCr(mon.cr);
					const pB = bonus - fromAbility;

					const expert = (pB === expectedPB * 2) ? 2 : 1;
					const pBonusStr = `+${bonus}`;
					const pDiceStr = `${expert}d${pB * (3 - expert)}${fromAbility >= 0 ? "+" : ""}${fromAbility}`;

					skillString += renderSkillOrSaveRoller(skillName, pBonusStr, pDiceStr, false);
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
			const fromAbility = Parser.getAbilityModNumber(mon[spl[0].toLowerCase()]);
			const expectedPB = getProfBonusFromCr(mon.cr);
			const pB = bonus - fromAbility;

			const expert = (pB === expectedPB * 2) ? 2 : 1;
			const pBonusStr = `+${bonus}`;
			const pDiceStr = `${expert}d${pB * (3 - expert)}${fromAbility >= 0 ? "+" : ""}${fromAbility}`;

			out.push(spl[0] + ' ' + renderSkillOrSaveRoller(spl[0], pBonusStr, pDiceStr, true));
		});
		$this.html(out.join(", "));
	}

	function renderSkillOrSaveRoller (itemName, profBonusString, profDiceString, isSave) {
		const mode = isProfDiceMode ? PROF_MODE_DICE : PROF_MODE_BONUS;
		return `<span class='roller' title="${itemName} ${isSave ? " save" : ""}" data-roll-alt="1d20;${profDiceString}" data-roll='1d20${profBonusString}' ${ATB_PROF_MODE}='${mode}' ${ATB_PROF_DICE_STR}="+${profDiceString}" ${ATB_PROF_BONUS_STR}="${profBonusString}">${isProfDiceMode ? profDiceString : profBonusString}</span>`;
	}

	// inline rollers
	$content.find("p").each(function () {
		addNonD20Rollers(this);

		// add proficiency dice stuff for attack rolls, since those _generally_ have proficiency
		// this is not 100% accurate; for example, ghouls don't get their prof bonus on bite attacks
		// fixing it would probably involve machine learning though; we need an AI to figure it out on-the-fly
		// (Siri integration forthcoming)
		const titleMaybe = attemptToGetTitle(this);
		const mode = isProfDiceMode ? PROF_MODE_DICE : PROF_MODE_BONUS;

		$(this).html($(this).html().replace(/([-+])?\d+(?= to hit)/g, function (match) {
			const bonus = Number(match);

			const expectedPB = getProfBonusFromCr(mon.cr);
			const withoutPB = bonus - expectedPB;

			if (expectedPB > 0) {
				const profDiceString = `1d${expectedPB * 2}${withoutPB >= 0 ? "+" : ""}${withoutPB}`;

				return `<span class='roller' ${titleMaybe ? `title="${titleMaybe}"` : ""} data-roll-alt='1d20;${profDiceString}' data-roll='1d20${match}' ${ATB_PROF_MODE}='${mode}' ${ATB_PROF_DICE_STR}="+${profDiceString}" ${ATB_PROF_BONUS_STR}="${match}">${isProfDiceMode ? profDiceString : match}</span>`
			} else {
				return `<span class='roller' data-roll='1d20${match}'>${match}</span>`; // if there was no proficiency bonus to work with, fall back on this
			}
		}));

		$(this).html($(this).html().replace(/DC\s*(\d+)/g, function (match, capture) {
			const dc = Number(capture);

			const expectedPB = getProfBonusFromCr(mon.cr);

			if (expectedPB > 0) {
				const withoutPB = dc - expectedPB;
				const profDiceString = `1d${(expectedPB * 2)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`;

				return `DC <span class="dc-roller" ${titleMaybe ? `title="${titleMaybe}"` : ""} ${ATB_PROF_MODE}="${mode}" data-roll-alt="${profDiceString}" data-bonus="${capture}" ${ATB_PROF_DICE_STR}="+${profDiceString}" ${ATB_PROF_BONUS_STR}="${capture}">${isProfDiceMode ? profDiceString : capture}</span>`;
			} else {
				return match; // if there was no proficiency bonus to work with, fall back on this
			}
		}));
	});
	$content.find("span#hp").each(function () {
		addNonD20Rollers(this, "Hit Points");
	});

	function addNonD20Rollers (ele, title) {
		$(ele).html($(ele).html().replace(/\d+d\d+(\s?([-+])\s?\d+\s?)?/g, function (match) {
			const titleMaybe = title || attemptToGetTitle(ele);
			return `<span class='roller' ${titleMaybe ? `title="${titleMaybe}"` : ""} data-roll='${match}'>${match}</span>`
		}));
	}

	function attemptToGetTitle (ele) {
		let titleMaybe = $(ele.parentElement).find(".entry-title")[0];
		if (titleMaybe !== undefined) {
			titleMaybe = titleMaybe.innerHTML;
			if (titleMaybe) {
				titleMaybe = titleMaybe.substring(0, titleMaybe.length - 1).trim();
			}
		}
		return titleMaybe;
	}

	$content.find(".spells span.roller").contents().unwrap();
	$content.find("span.roller").filter((i, e) => {
		const $e = $(e);
		return !$e.prop("onclick");
	}).click(function () {
		const $this = $(this);
		outputRollResult($this, $this.attr("data-roll").replace(/\s+/g, ""));
	});

	$content.find("span.dc-roller").click(function () {
		const $this = $(this);
		let roll;
		if ($this.attr(ATB_PROF_MODE) === PROF_MODE_DICE) {
			roll = $this.attr("data-roll-alt").replace(/\s+/g, "");
			outputRollResult($this, roll);
		}
	});

	function outputRollResult ($ele, roll) {
		EntryRenderer.dice.roll(roll, {
			name: name,
			label: $ele.attr("title")
		});
	}
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

const ATB_PROF_MODE = "mode";
const ATB_PROF_BONUS_STR = "profBonusStr";
const ATB_PROF_DICE_STR = "profDiceStr";
const PROF_MODE_BONUS = "bonus";
const PROF_MODE_DICE = "dice";

function getProfBonusFromCr (cr) {
	if (CR_TO_PROF[cr]) return CR_TO_PROF[cr];
	return 0;
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
	"athletics": "dex",
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
}
