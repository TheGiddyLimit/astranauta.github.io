"use strict";
const RACE_JSON_URL = "data/races.json";

let amount, count;

let raceData;

function loadRaceJson () {
	DataUtil.loadJSON(RACE_JSON_URL).then(onJsonLoad)
}

window.onload = function load () {
	loadRaceJson();
	prevent();
};

function onJsonLoad (data) {
	BrewUtil.pAddBrewData()
		.then((brew) => {
			raceData = EntryRenderer.race.mergeSubraces(data.race);
			if (brew.race) raceData = raceData.concat(brew.race);

			$("#rollbutton").click(rollstats);

			const isCrypto = RollerUtil.isCrypto();
			const titleStr = isCrypto ? "Numbers will be generated using Crypto.getRandomValues()" : "Numbers will be generated using Math.random()";
			$(`#roller-mode`).html(`Cryptographically strong random generation: <span title="${titleStr}" class="crypto-${isCrypto}">${isCrypto ? `<span class="glyphicon glyphicon-lock"></span> enabled` : `<span class="glyphicon glyphicon-ban-circle"></span> not available`}</span>`);

			$(function () {
				$("#reset").click(function () {
					$(".base").val(8);
					$(".choose").prop("checked", false);
					changeTotal();
					changeBase()
				});
			});

			$(".base").on("input", changeBase);
			$("input.choose").on("change", choose);

			const races = raceData.map(x => ({name: x.name, source: x.source})).sort((a, b) => SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source));
			const options = races.map(it => `<option value="${it.name}_${it.source}">${it.name} ${it.source !== SRC_PHB ? `[${Parser.sourceJsonToAbv(it.source)}]` : ""}</option>`).join("");
			$("#race").append(`<option value="">None</option>`).append(`<option value="_CUSTOM">Custom</option>`).append(options).change(changeRace).change();

			if (window.location.hash) window.onhashchange();
			else window.location.hash = "#rolled";
		})
		.catch(BrewUtil.purgeBrew);
}

const STATS_MIN = 8;
const STATS_MAX = 15;

function prevent () {
	$(`.base`).each((i, ele) => {
		const input = $(ele);
		input.on("change", function (e) {
			let num = parseInt(this.value);
			if (isNaN(num)) {
				this.value = 8;
			} else {
				this.value = Math.max(Math.min(num, STATS_MAX), STATS_MIN);
			}
			changeTotal();
		})
	});
}

window.onhashchange = function hashchange () {
	let hash = window.location.hash.slice(1);
	$(".statmethod").hide();
	if (hash === "") hash = "rolled";
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
	function handleStats (stats) {
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

	const race = this.value;
	if (race === "_CUSTOM") {
		$(`#custom`).show();
		const custom = $(`.custom`);
		custom.off("input").on("input", () => {
			const stats = {};
			custom.each((i, e) => {
				const val = Number($(e).val());
				stats[$(e).attr("name")] = val || 0;
			});
			handleStats(stats);
		})
	} else {
		$(`#custom`).hide();
		const stats = race === ""
			? {}
			: raceData.find(({name, source}) => `${name}_${source}` === race).ability;
		handleStats(stats);
	}
}

function changeTotal () {
	$("#pointbuy tr[id]").each((i, el) => {
		const [base, racial, total, mod] = $("input", el).get();
		const raw = total.value = Number(base.value) + Number(racial.value);
		mod.value = Math.floor((raw - 10) / 2)
	})
}

function changeBase (e) {
	const budget = Number($("#budget").val());
	let cost = 0;
	$(".base").each((i, el) => cost += getCost(Number(el.value)));
	if (cost > budget) return this.value = this.dataset.prev;
	this.dataset.prev = this.value;
	$("#remaining").val(budget - cost);

	changeTotal()
}

function rollstats () {
	const formula = $(`#stats-formula`).val();

	const rolls = [];
	for (let i = 0; i < 6; i++) {
		rolls.push(EntryRenderer.dice.parseRandomise(formula));
	}

	const $rolled = $("#rolled");
	if (~rolls.findIndex(it => !it)) {
		$rolled.find("#rolls").prepend(`<p>Invalid dice formula!</p>`)
	} else {
		$rolled.find("#rolls").prepend(`<p class="stat-roll-line">${rolls.map(r => `<span class="stat-roll-item" title="${EntryRenderer.dice.getDiceSummary(r, true)}">${r.total}</span>`).join("")}</p>`);
	}
	$rolled.find("#rolls p:eq(10)").remove();
}
