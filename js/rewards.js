"use strict";

const JSON_URL = "data/rewards.json";

let tableDefault;
let rewardList;

window.onload = function load () {
	loadJSON(JSON_URL, onJsonLoad);
};

function onJsonLoad (data) {
	tableDefault = $("#stats").html();
	rewardList = data.reward;

	const sourceFilter = getSourceFilter();
	const typeFilter = new Filter({
		header: "Type",
		items: [
			"Blessing",
			"Boon",
			"Charm",
			"Demonic Boon"
		]
	});

	const filterBox = initFilterBox(sourceFilter, typeFilter);

	let tempString = "";
	for (let i = 0; i < rewardList.length; i++) {
		const reward = rewardList[i];
		const displayName = reward.type === "Demonic Boon" ? "Demonic Boon: " + reward.name : reward.name;

		tempString += `
			<li class='row' ${FLTR_ID}='${i}'>
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(reward)}' title='${reward.name}'>
					<span class='name col-xs-10'>${displayName}</span>
					<span class='source col-xs-2 source${Parser.sourceJsonToAbv(reward.source)}' title='${Parser.sourceJsonToFull(reward.source)}'>${Parser.sourceJsonToAbv(reward.source)}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(reward.source);
	}
	$("ul.rewards").append(tempString);

	// sort filters
	sourceFilter.items.sort(ascSort);

	const list = search({
		valueNames: ["name", "source"],
		listClass: "rewards"
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
			const r = rewardList[$(item.elm).attr(FLTR_ID)];

			return sourceFilter.toDisplay(f, r.source) && typeFilter.toDisplay(f, r.type);
		});
	}

	initHistory();
	handleFilterChange();
}

function loadhash (id) {
	$("#stats").html(tableDefault);
	const reward = rewardList[id];

	const name = reward.type === "Demonic Boon" ? "Demonic Boon: " + reward.name : reward.name;
	$("th#name").html(`<span class="stats-name">${name}</span><span class="stats-source source${reward.source}" title="${Parser.sourceJsonToFull(reward.source)}">${Parser.sourceJsonToAbv(reward.source)}</span>`);

	$("tr.text").remove();

	const textlist = reward.text;
	let texthtml = "";

	if (reward.ability !== undefined) texthtml += utils_combineText(reward.ability.text, "p", "<span class='bold'>Ability Score Adjustment:</span> ");
	if (reward.signaturespells !== undefined) texthtml += utils_combineText(reward.signaturespells.text ? reward.signaturespells.text : "None", "p", "<span class='bold'>Signature Spells:</span> ");
	texthtml += utils_combineText(textlist, "p");

	$("tr#text").after("<tr class='text'><td colspan='6'>" + texthtml + "</td></tr>");
}
