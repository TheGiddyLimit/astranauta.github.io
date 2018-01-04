"use strict";
const JSON_URL = "data/backgrounds.json";
let tabledefault = "";
let bgList;

window.onload = function load () {
	loadJSON(JSON_URL, onJsonLoad);
};

function onJsonLoad (data) {
	bgList = data.background;

	tabledefault = $("#stats").html();

	const sourceFilter = getSourceFilter();
	const filterBox = initFilterBox(sourceFilter);

	const bgTable = $("ul.backgrounds");
	let tempString = "";
	for (let i = 0; i < bgList.length; i++) {
		const bg = bgList[i];

		// populate table
		tempString +=
			`<li ${FLTR_ID}="${i}">
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(bg)}' title='${bg.name}'>
					<span class='name col-xs-9'>${bg.name.replace("Variant ", "")}</span>
					<span class='source col-xs-3 source${bg.source}' title='${Parser.sourceJsonToFull(bg.source)}'>${Parser.sourceJsonToAbv(bg.source)}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(bg.source);
	}
	bgTable.append(tempString);

	const list = search({
		valueNames: ['name', 'source'],
		listClass: "backgrounds"
	});

	filterBox.render();

	// sort filters
	sourceFilter.items.sort(ascSort);

	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function handleFilterChange () {
		const f = filterBox.getValues();
		list.filter(function (item) {
			const bg = bgList[$(item.elm).attr(FLTR_ID)];

			return sourceFilter.toDisplay(f, bg.source);
		});
	}

	initHistory();
	handleFilterChange();
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	const curbg = bgList[id];
	const name = curbg.name;
	const source = curbg.source;
	const sourceAbv = Parser.sourceJsonToAbv(source);
	const sourceFull = Parser.sourceJsonToFull(source);
	$("th#name").html(`<span class="stats-name">${name}</span> <span title="${sourceFull}" class='stats-source source${sourceAbv}'>${sourceAbv}</span>`);
	const traitlist = curbg.trait;
	$("tr.trait").remove();

	for (let n = traitlist.length - 1; n >= 0; n--) {
		let texthtml = "";
		texthtml += utils_combineText(traitlist[n].text, "p", "<span class='name'>" + traitlist[n].name + ".</span> ");

		const subtraitlist = traitlist[n].subtrait;
		if (subtraitlist !== undefined) {
			for (let j = 0; j < subtraitlist.length; j++) {
				texthtml = texthtml + "<p class='subtrait'>";
				const subtrait = subtraitlist[j];
				texthtml = texthtml + "<span class='name'>" + subtrait.name + ".</span> ";
				for (let k = 0; k < subtrait.text.length; k++) {
					if (!subtrait.text[k]) continue;
					if (k === 0) {
						texthtml = texthtml + "<span>" + subtrait.text[k] + "</span>";
					} else {
						texthtml = texthtml + "<p class='subtrait'>" + subtrait.text[k] + "</p>";
					}
				}
				texthtml = texthtml + "</p>";
			}
		}

		$("tr#traits").after("<tr class='trait'><td colspan='6'>" + texthtml + "</td></tr>");
		$(`#source`).html(`<td colspan=6><b>Source: </b> <i>${sourceFull}</i>, page ${curbg.page}</td>`);
	}
}
