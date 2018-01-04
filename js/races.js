"use strict";
const JSON_URL = "data/races.json";
let tableDefault = "";

window.onload = function load () {
	loadJSON(JSON_URL, onJsonLoad)
};

let raceList;

function onJsonLoad (data) {
	tableDefault = $("#stats").html();

	raceList = data.race;

	const sourceFilter = getSourceFilter();
	const asiFilter = getAsiFilter();
	const sizeFilter = new Filter({header: "Size", displayFn: Parser.sizeAbvToFull});

	const filterBox = initFilterBox(
		sourceFilter,
		asiFilter,
		sizeFilter
	);

	const racesTable = $("ul.races");
	let tempString = "";
	for (let i = 0; i < raceList.length; i++) {
		const race = raceList[i];

		const ability = utils_getAbilityData(race.ability);
		race._fAbility = ability.asCollection.filter(a => !ability.areNegative.includes(a)); // used for filtering

		tempString +=
			`<li ${FLTR_ID}='${i}'>
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(race)}' title='${race.name}'>
					<span class='name col-xs-4'>${race.name}</span>
					<span class='ability col-xs-4'>${ability.asTextShort}</span>
					<span class='size col-xs-2'>${Parser.sizeAbvToFull(race.size)}</span>
					<span class='source col-xs-2 source${race.source}' title="${Parser.sourceJsonToFull(race.source)}">${Parser.sourceJsonToAbv(race.source)}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(race.source);
		sizeFilter.addIfAbsent(race.size);
	}

	racesTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(ascSort);
	sizeFilter.items.sort(ascSortSize);

	function ascSortSize (a, b) {
		return ascSort(toNum(a), toNum(b));

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

	const list = search({
		valueNames: ['name', 'ability', 'size', 'source'],
		listClass: "races"
	});

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function handleFilterChange () {
		const f = filterBox.getValues();
		list.filter(function (item) {
			const r = raceList[$(item.elm).attr(FLTR_ID)];

			const rightSource = sourceFilter.toDisplay(f, r.source);
			const rightAsi = asiFilter.toDisplay(f, r._fAbility);
			const rightSize = sizeFilter.toDisplay(f, r.size);

			return rightSource && rightAsi && rightSize;
		})
	}

	initHistory();
	handleFilterChange();
}

const renderer = new EntryRenderer();

function loadhash (id) {
	$("#stats").html(tableDefault);
	$("#stats td").show();

	const race = raceList[id];

	$("th#name").html(`<span class="stats-name">${race.name}</span><span class="stats-source source${race.source}" title="${Parser.sourceJsonToFull(race.source)}">${Parser.sourceJsonToAbv(race.source)}</span>`);

	const size = Parser.sizeAbvToFull(race.size);
	$("td#size span").html(size);
	if (size === "") $("td#size").hide();

	const ability = utils_getAbilityData(race.ability);
	$("td#ability span").html(ability.asText);

	let speed;
	if (typeof race.speed === "string") {
		speed = race.speed + (race.speed === "Varies" ? "" : "ft. ");
	} else {
		speed = race.speed.walk + "ft.";
		if (race.speed.climb) speed += `, climb ${race.speed.climb}ft.`
	}
	$("td#speed span").html(speed);
	if (speed === "") $("td#speed").hide();

	const traitlist = race.trait;
	if (traitlist) {
		$("tr.trait").remove();

		let statsText = "<tr class='text'><td colspan='6'>";
		for (let n = 0; n < traitlist.length; ++n) {
			const trait = traitlist[n];

			const header = `<span class='name'>${trait.name}.</span> `;
			statsText += utils_combineText(traitlist[n].text, "p", header)
		}
		statsText += "</td></tr>";
		$('table#stats tbody tr:last').before(statsText);
	} else if (race.entries) {
		const renderStack = [];
		const faux = {"type": "entries", "entries": race.entries};

		renderer.recursiveEntryRender(faux, renderStack, 1, "<tr class='text'><td colspan='6'>", "</td></tr>", true);

		$('table#stats tbody tr:last').before(renderStack.join(""));
	}
}
