"use strict";

const JSON_DIR = "data/bestiary/";
const META_URL = "meta.json";
const JSON_LIST_NAME = "monster";

let tableDefault = "";

function ascSortCr (a, b) {
	// always put unknown values last
	if (a === "Unknown" || a === undefined) a = "999";
	if (b === "Unknown" || b === undefined) b = "999";
	return ascSort(Parser.crToNumber(a), Parser.crToNumber(b))
}

const meta = {};

function loadMeta (nextFunction) {
	loadJSON(JSON_DIR + META_URL, function (data) {
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

window.onload = function load () {
	loadMeta(function () {
		multisourceLoad(JSON_DIR, JSON_LIST_NAME, pageInit, addMonsters);
	});
};

let list;
// TODO alignment filter
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
	displayFn: uppercaseFirst
});
const tagFilter = new Filter({header: "Tag", displayFn: uppercaseFirst});
const miscFilter = new Filter({header: "Miscellaneous", items: ["Legendary"], displayFn: uppercaseFirst});

const filterBox = initFilterBox(
	sourceFilter,
	crFilter,
	sizeFilter,
	typeFilter,
	tagFilter,
	miscFilter
);

function pageInit (loadedSources) {
	tableDefault = $("#stats").html();

	sourceFilter.items = Object.keys(loadedSources).map(src => new FilterItem(src, loadSource(JSON_LIST_NAME, addMonsters)));
	sourceFilter.items.sort(ascSort);

	list = search({
		valueNames: ["name", "source", "type", "cr"],
		listClass: "monsters"
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

	// proficiency bonus/dice toggle
	const profBonusDiceBtn = $("button#profbonusdice");
	profBonusDiceBtn.useDice = false;
	profBonusDiceBtn.click(function () {
		if (this.useDice) {
			this.innerHTML = "Use Proficiency Dice";
			$("#stats").find(`span.roller[${ATB_PROF_MODE}], span.dc-roller[${ATB_PROF_MODE}]`).each(function () {
				const $this = $(this);
				$this.attr(ATB_PROF_MODE, PROF_MODE_BONUS);
				$this.html($this.attr(ATB_PROF_BONUS_STR));
			})
		} else {
			this.innerHTML = "Use Proficiency Bonus";
			$("#stats").find(`span.roller[${ATB_PROF_MODE}], span.dc-roller[${ATB_PROF_MODE}]`).each(function () {
				const $this = $(this);
				$this.attr(ATB_PROF_MODE, PROF_MODE_DICE);
				$this.html($this.attr(ATB_PROF_DICE_STR));
			})
		}
		this.useDice = !this.useDice;
	})
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const m = monsters[$(item.elm).attr(FLTR_ID)];

		return sourceFilter.toDisplay(f, m.source) &&
			crFilter.toDisplay(f, m.cr) &&
			sizeFilter.toDisplay(f, m.size) &&
			typeFilter.toDisplay(f, m._pTypes.type) &&
			tagFilter.toDisplay(f, m._pTypes.tags) &&
			miscFilter.toDisplay(f, m._fMisc);
	});
}

let monsters = [];
let mI = 0;

function addMonsters (data) {
	monsters = monsters.concat(data);

	const table = $("ul.monsters");
	let textStack = "";
	// build the table
	for (; mI < monsters.length; mI++) {
		const mon = monsters[mI];
		mon._pTypes = Parser.monTypeToFullObj(mon.type); // store the parsed type
		mon.cr = mon.cr === undefined ? "Unknown" : mon.cr;

		const abvSource = Parser.sourceJsonToAbv(mon.source);

		textStack +=
			`<li ${FLTR_ID}='${mI}'>
				<a id=${mI} href='#${UrlUtil.autoEncodeHash(mon)}' title="${mon.name}">
					<span class='name col-xs-4 col-xs-4-2'>${mon.name}</span>
					<span title="${Parser.sourceJsonToFull(mon.source)}" class='col-xs-1 col-xs-1-8 source source${abvSource}'>${abvSource}</span>
					<span class='type col-xs-4 col-xs-4-3'>${mon._pTypes.asText.uppercaseFirst()}</span>
					<span class='col-xs-1 col-xs-1-7 text-align-center cr'>${mon.cr}</span>
				</a>
			</li>`;

		// populate filters
		crFilter.addIfAbsent(mon.cr);
		mon._pTypes.tags.forEach(t => tagFilter.addIfAbsent(t));
		mon._fMisc = mon.legendary || mon.legendaryGroup ? ["Legendary"] : [];
	}
	let lastSearch = null;
	if (list.searched) {
		lastSearch = $(`#search`).val();
		list.search("");
	}

	table.append(textStack);

	// sort filters
	crFilter.items.sort(ascSortCr);
	typeFilter.items.sort(ascSort);
	tagFilter.items.sort(ascSort);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");

	filterBox.render();
}

// sorting for form filtering
function sortMonsters (a, b, o) {
	a = monsters[a.elm.getAttribute(FLTR_ID)];
	b = monsters[b.elm.getAttribute(FLTR_ID)];

	if (o.valueName === "name") {
		return ascSort(a.name, b.name);
	}

	if (o.valueName === "type") {
		return ascSort(a._pTypes.asText, b._pTypes.asText);
	}

	if (o.valueName === "source") {
		return ascSort(a.source, b.source);
	}

	if (o.valueName === "cr") {
		return ascSortCr(a.cr, b.cr)
	}

	return 0;
}

function objToTitleCaseStringWithCommas (obj) {
	return Object.keys(obj).map(function (k) {
		return k.uppercaseFirst() + ' ' + obj[k]
	}).join(', ');
}

const renderer = new EntryRenderer();

// load selected monster stat block
function loadhash (id) {
	$("#stats").html(tableDefault);
	let renderStack = [];
	let entryList = {};
	var mon = monsters[id];
	var name = mon.name;
	let source = Parser.sourceJsonToAbv(mon.source);
	let sourceFull = Parser.sourceJsonToFull(source)
	var type = mon._pTypes.asText;

	imgError = function (x) {
		$(x).closest("th").css("padding-right", "0.2em");
		$(x).remove();
	};

	$("th#name").html(
		`<span class="stats-name">${name}</span>
		<span class="stats-source source${source}" title="${sourceFull}">${Parser.sourceJsonToAbv(source)}</span>
		<a href="img/${source}/${name.replace(/"/g, "")}.png" target='_blank'>
			<img src="img/${source}/${name.replace(/"/g, "")}.png" class='token' onerror='imgError(this)'>
		</a>`
	);

	$("td span#size").html(Parser.sizeAbvToFull(mon.size));

	$("td span#type").html(type);

	$("td span#alignment").html(mon.alignment);

	$("td span#ac").html(mon.ac);

	$("td span#hp").html(mon.hp);

	$("td span#speed").html(mon.speed);

	$("td#str span.score").html(mon.str);
	$("td#str span.mod").html(Parser.getAbilityModifier(mon.str));

	$("td#dex span.score").html(mon.dex);
	$("td#dex span.mod").html(Parser.getAbilityModifier(mon.dex));

	$("td#con span.score").html(mon.con);
	$("td#con span.mod").html(Parser.getAbilityModifier(mon.con));

	$("td#int span.score").html(mon.int);
	$("td#int span.mod").html(Parser.getAbilityModifier(mon.int));

	$("td#wis span.score").html(mon.wis);
	$("td#wis span.mod").html(Parser.getAbilityModifier(mon.wis));

	$("td#cha span.score").html(mon.cha);
	$("td#cha span.mod").html(Parser.getAbilityModifier(mon.cha));

	var saves = mon.save;
	if (saves) {
		$("td span#saves").parent().show();
		$("td span#saves").html(saves);
	} else {
		$("td span#saves").parent().hide();
	}

	var skills = mon.skill;
	let perception = 0;
	if (skills) {
		$("td span#skills").parent().show();
		$("td span#skills").html(objToTitleCaseStringWithCommas(skills));
		if (skills.perception) perception = parseInt(skills.perception);
	} else {
		$("td span#skills").parent().hide();
	}

	var dmgvuln = mon.vulnerable;
	if (dmgvuln) {
		$("td span#dmgvuln").parent().show();
		$("td span#dmgvuln").html(dmgvuln);
	} else {
		$("td span#dmgvuln").parent().hide();
	}

	var dmgres = mon.resist;
	if (dmgres) {
		$("td span#dmgres").parent().show();
		$("td span#dmgres").html(dmgres);
	} else {
		$("td span#dmgres").parent().hide();
	}

	var dmgimm = mon.immune;
	if (dmgimm) {
		$("td span#dmgimm").parent().show();
		$("td span#dmgimm").html(dmgimm);
	} else {
		$("td span#dmgimm").parent().hide();
	}

	var conimm = mon.conditionImmune;
	if (conimm) {
		$("td span#conimm").parent().show();
		$("td span#conimm").html(conimm);
	} else {
		$("td span#conimm").parent().hide();
	}

	var senses = mon.senses;
	if (senses) {
		$("td span#senses").html(senses + ", ");
	} else {
		$("td span#senses").html("");
	}

	$("td span#pp").html(mon.passive)

	var languages = mon.languages;
	if (languages) {
		$("td span#languages").html(languages);
	} else {
		$("td span#languages").html("\u2014");
	}

	var cr = mon.cr === undefined ? "Unknown" : mon.cr;
	$("td span#cr").html(cr);
	$("td span#xp").html(Parser.crToXp(cr));

	var traits = mon.trait;
	$("tr.trait").remove();

	if (traits) {
		for (var i = traits.length - 1; i >= 0; i--) {
			var traitname = traits[i].name;
			var traittext = traits[i].text;
			var traittexthtml = "";
			var renderedcount = 0;
			for (var n = 0; n < traittext.length; n++) {
				if (!traittext[n]) continue;

				renderedcount++;
				var firstsecond = "";
				if (renderedcount === 1) firstsecond = "first ";
				if (renderedcount === 2) firstsecond = "second ";

				var spells = "";
				if (traitname.indexOf("Spellcasting") !== -1 && traittext[n].indexOf(": ") !== -1) spells = "spells";
				if (traitname.indexOf("Variant") !== -1 && traitname.indexOf("Coven") !== -1 && traittext[n].indexOf(": ") !== -1) spells = "spells";

				traittexthtml = traittexthtml + "<p class='" + firstsecond + spells + "'>" + traittext[n].replace(/\u2022\s?(?=C|\d|At\swill)/g, "") + "</p>";
			}

			$("tr#traits").after("<tr class='trait'><td colspan='6' class='trait" + i + "'><span class='name'>" + traitname + ".</span> " + traittexthtml + "</td></tr>");

			// parse spells, make hyperlinks
			$("tr.trait").children("td").children("p.spells").each(function () {
				let spellslist = $(this).html();
				if (spellslist[0] === "*") return;
				spellslist = spellslist.split(": ")[1].split(/, (?!\+|\dd|appears|inside gems)/g);
				for (let i = 0; i < spellslist.length; i++) {
					spellslist[i] = "<a href='spells.html#" + encodeURIComponent((spellslist[i].replace(/(\*)| \(([^)]+)\)/g, ""))).toLowerCase().replace("'", "%27") + "_" + "phb' target='_blank'>" + spellslist[i] + "</a>";
					if (i !== spellslist.length - 1) spellslist[i] = spellslist[i] + ", ";
				}

				$(this).html($(this).html().split(": ")[0] + ": " + spellslist.join(""))
			});
		}
	}

	const actions = mon.action;
	$("tr.action").remove();

	if (actions && actions.length) {
		for (let i = actions.length - 1; i >= 0; i--) {
			const actionname = actions[i].name;
			const actiontext = actions[i].text;
			let actiontexthtml = "";
			let renderedcount = 0;
			for (let n = 0; n < actiontext.length; n++) {
				if (!actiontext[n]) continue;

				renderedcount++;
				let firstsecond = "";
				if (renderedcount === 1) firstsecond = "first ";
				if (renderedcount === 2) firstsecond = "second ";

				actiontexthtml = actiontexthtml + "<p class='" + firstsecond + "'>" + actiontext[n] + "</p>";
			}

			$("tr#actions").after("<tr class='action'><td colspan='6' class='action" + i + "'><span class='name'>" + actionname + ".</span> " + actiontexthtml + "</td></tr>");
		}
	}

	const reactions = mon.reaction;
	$("tr#reactions").hide();
	$("tr.reaction").remove();

	if (reactions && (reactions.text || reactions.length)) {
		$("tr#reactions").show();

		if (reactions.length) {
			for (let i = reactions.length - 1; i >= 0; i--) {
				const reactionname = reactions[i].name;

				const reactiontext = reactions[i].text;
				let reactiontexthtml = "<p>" + reactiontext + "</p>";
				for (let n = 1; n < reactiontext.length; n++) {
					if (!reactiontext[n]) continue;
					reactiontexthtml = reactiontexthtml + "<p>" + reactiontext[n] + "</p>";
				}

				$("tr#reactions").after("<tr class='reaction'><td colspan='6' class='reaction" + i + "'><span class='name'>" + reactionname + ".</span> " + reactiontexthtml + "</td></tr>");
			}
		}
	}

	const variants = mon.variant;
	const variantSect = $(`#variants`);
	if (!variants) variantSect.hide();
	else {
		const rStack = [];
		variants.forEach(v => renderer.recursiveEntryRender(v, rStack));
		variantSect.html(`<td colspan=6>${rStack.join("")}</td>`);
		variantSect.show();
	}

	$(`#source`).append(`<td colspan=6><b>Source: </b> <i>${sourceFull}</i>, page ${mon.page}</td>`);

	const legendaries = mon.legendary;
	$("tr.legendary").remove();
	$("tr#legendaries").hide();
	if (legendaries) {
		$("tr#legendaries").show();
		for (let i = legendaries.length - 1; i >= 0; i--) {
			const legendaryname = legendaries[i].name ? legendaries[i].name + "." : "";
			const legendarytext = legendaries[i].text;
			let legendarytexthtml = "";
			let renderedcount = 0;
			for (let n = 0; n < legendarytext.length; n++) {
				if (!legendarytext[n]) continue;
				renderedcount++;
				let firstsecond = "";
				if (renderedcount === 1) firstsecond = "first ";
				if (renderedcount === 2) firstsecond = "second ";
				legendarytexthtml += `<p class='${firstsecond}'>${legendarytext[n]}</p>`;
			}
			$("tr#legendaries").after(`<tr class='legendary'><td colspan='6' class='legendary'><span class='name'>${legendaryname}</span> ${legendarytexthtml}</td></tr>`);
		}
		if ($("tr.legendary").length && !$("tr.legendary span.name:empty").length && !$("tr.legendary span.name:contains(Legendary Actions)").length) {
			const legendaryActions = mon.legendaryActions || 3;
			const legendaryName = name.split(",");
			$("tr#legendaries").after(`<tr class='legendary'><td colspan='6' class='legendary'><span class='name'></span> <span>${legendaryName[0]} can take ${legendaryActions} legendary action${legendaryActions > 1 ? "s" : ""}, choosing from the options below. Only one legendary action can be used at a time and only at the end of another creature's turn. ${legendaryName[0]} regains spent legendary actions at the start of its turn.</span></td></tr>`);
		}
	}

	const legendaryGroup = mon.legendaryGroup;
	$("tr.lairaction").remove();
	$("tr#lairactions").hide();
	$("tr.regionaleffect").remove();
	$("tr#regionaleffects").hide();
	if (legendaryGroup) {
		const thisGroup = meta[legendaryGroup];
		if (thisGroup.lairActions) renderSection("lairaction", thisGroup.lairActions);
		if (thisGroup.regionalEffects) renderSection("regionaleffect", thisGroup.regionalEffects);
	}

	function renderSection (sectionClass, sectionEntries) {
		$(`tr#${sectionClass}s`).show();
		entryList = {type: "entries", entries: sectionEntries};
		renderStack = [];
		renderer.recursiveEntryRender(entryList, renderStack);
		$(`tr#${sectionClass}s`).after(`<tr class='${sectionClass}'><td colspan='6' class='legendary'>${utils_makeRoller(renderStack.join(""))}</td></tr>`);
	}

	// add click links for rollables
	$("#stats #abilityscores td").each(function () {
		$(this).wrapInner("<span class='roller' data-roll='1d20" + $(this).children(".mod").html() + "'></span>");
	});

	const isProfDiceMode = $("button#profbonusdice")[0].useDice;
	if (mon.skill) {
		$("#skills").each(makeSkillRoller);
	}
	if (mon.save) {
		$("#saves").each(makeSaveRoller);
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
	$("#stats p").each(function () {
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
	$("#stats span#hp").each(function () {
		addNonD20Rollers(this);
	});

	function addNonD20Rollers (ele) {
		$(ele).html($(ele).html().replace(/\d+d\d+(\s?([-+])\s?\d+\s?)?/g, function (match) {
			const titleMaybe = attemptToGetTitle(ele);
			return `<span class='roller' ${titleMaybe ? `title="${titleMaybe}"` : ""} data-roll='${match}'>${match}</span>`
		}));
	}

	function attemptToGetTitle (ele) {
		let titleMaybe = $(ele.parentElement).find(".name")[0];
		if (titleMaybe !== undefined) {
			titleMaybe = titleMaybe.innerHTML;
			if (titleMaybe) {
				titleMaybe = titleMaybe.substring(0, titleMaybe.length - 1).trim();
			}
		}
		return titleMaybe;
	}

	$(".spells span.roller").contents().unwrap();
	$("#stats").find("span.roller").click(function () {
		const $this = $(this);
		let roll;
		let rollResult;
		if ($this.attr(ATB_PROF_MODE) === PROF_MODE_DICE) {
			roll = $this.attr("data-roll-alt").replace(/\s+/g, "");
			// hacks because droll doesn't support e.g. "1d20+1d4+2" :joy: :ok_hand:
			const multi = roll.split(";");
			roll = roll.replace(/;/g, "+");
			rollResult = droll.roll(multi[0]);
			const res2 = droll.roll(multi[1]);
			rollResult.rolls = rollResult.rolls.concat(res2.rolls);
			rollResult.total += res2.total;
		} else {
			roll = $this.attr("data-roll").replace(/\s+/g, "");
			rollResult = droll.roll(roll);
		}
		outputRollResult($this, roll, rollResult);
	});

	$("#stats").find("span.dc-roller").click(function () {
		const $this = $(this);
		let roll;
		let rollResult;
		if ($this.attr(ATB_PROF_MODE) === PROF_MODE_DICE) {
			roll = $this.attr("data-roll-alt").replace(/\s+/g, "");
			rollResult = droll.roll(roll);
			outputRollResult($this, roll, rollResult);
		}
	});

	function outputRollResult ($ele, roll, rollResult) {
		const name = $("#name .stats-name").text();
		$("div#output").prepend(`<span>${name}: <em>${roll}</em> rolled ${$ele.attr("title") ? `${$ele.attr("title")} ` : ""}for <strong>${rollResult.total}</strong> (<em>${rollResult.rolls.join(", ")}</em>)<br></span>`).show();
		$("div#output span:eq(5)").remove();
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
