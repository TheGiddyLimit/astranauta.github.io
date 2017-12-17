"use strict";
const RACE_JSON_URL = "data/races.json";

let amount, count;

let raceData;

function loadRaceJson () {
	loadJSON(RACE_JSON_URL, onJsonLoad)
}

window.onload = function load () {
	loadRaceJson();
	prevent();
};

function onJsonLoad (data) {
	raceData = data.race;

	$("#rollbutton").click(rollstats);
	
	$(function() {
		$("#reset").click(function() {
			$(".base").val(8)
			$(".choose").prop("checked", false)
			changeTotal()
			changeRemaining()
        });
	});

	$(".base").on("input", changeBase);
	$("input.choose").on("change", choose);

	const names = raceData.map(x => x.name).sort();
	const options = names.map(name => `<option>${name}</option>`).join();
	$("#race").append(options).change(changeRace).change();

	if (window.location.hash) window.onhashchange();
	else window.location.hash = "#rolled";
}

const STATS_MIN = 8;
const STATS_MAX = 15;

function prevent() {
	$(`.base`).each((i, ele) => {
		const input = $(ele);
		input.on("change", function(e) {
			let num = parseInt(this.value);
			if (isNaN(num)) {
				this.value = 8;
			}
			else {
				this.value = Math.max(Math.min(num, STATS_MAX), STATS_MIN);
			}
			changeTotal();
		})
	});
}

window.onhashchange = function hashchange () {
	const hash = window.location.hash.slice(1);
	$(".statmethod").hide();
	$("#" + hash).show();
};

function getCost (n) {
	if (n < 14) return n - 8;
	if (n === 14) return 7;
	return 9
}

function choose () {
	if ($("input.choose:checked").length > count) return this.checked = false;

	$(".racial", this.parentNode.parentNode)
		.val(this.checked ? amount : 0);
	changeTotal()
}

function changeRace () {
	const race = this.value;
	const stats = raceData
		.find(({name}) => name === race).ability;

	$(".racial").val(0);
	for (const key in stats) $(`#${key} .racial`).val(stats[key])

	changeTotal();
	$(".choose").hide().prop("checked", false);

	if (!stats.choose) return;

	const {from} = stats.choose[0];
	amount = stats.choose[0].amount || 1;
	count = stats.choose[0].count;

	$("td.choose").text(`Choose ${count}`).show();
	from.forEach(key => $(`#${key} .choose`).show())
}

function changeTotal () {
	$("#pointbuy tr[id]").each((i, el) => {
		const [base, racial, total, mod] = $("input", el).get();
		const raw = total.value = Number(base.value) + Number(racial.value);
		mod.value = Math.floor((raw - 10) / 2)
	})
}

function changeRemaining () {
	const rempoints = Number($("#remaining").val(budget - cost));
}

function changeBase (e) {
	const budget = Number($("#budget").val());

	let cost = 0;
	$(".base").each((i, el) => cost += getCost(Number(el.value)));

	if (cost > budget) return this.value = this.dataset.prev;

	changeRemaining()

	changeTotal()
}

function rollstats () {
	var rolls = [];
	for (var i = 0; i < 6; i++) {
		var curroll = droll.roll("4d6").rolls.sort().splice(1);
		curroll = curroll[0] + curroll[1] + curroll[2];
		rolls.push(curroll);
	}

	$("#rolled #rolls").prepend("<p>" + rolls.join(", ") + "</p>");
	$("#rolled #rolls p:eq(10)").remove();
}
