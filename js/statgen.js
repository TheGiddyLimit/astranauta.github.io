let amount, count

window.onload = function load() {
	$("#rollbutton").click(rollstats);
	$(".base").on("input", changeBase);
	$("input.choose").on("change", choose);

	const names = racedata.compendium.race.map(x => x.name).sort()
	const options = names.map(name => `<option>${name}</option>`).join()
	$("#race").append(options).change(changeRace).change();

	if (window.location.hash)
		window.onhashchange();
	else
		window.location.hash = "#rolled";
}

window.onhashchange = function hashchange() {
	const hash = window.location.hash.slice(1);
	$(".statmethod").hide();
	$("#" + hash).show();
}

function getCost(n) {
	if (n < 14)
		return n - 8
	if (n === 14)
		return 7
	return 9
}

function choose() {
	if ($("input.choose:checked").length > count)
		return this.checked = false

	$(".racial", this.parentNode.parentNode)
		.val(this.checked ? amount : 0)
	changeTotal()
}

function changeRace() {
	const race = this.value
	const stats = racedata.compendium.race
		.find(({name}) => name === race).ability

	$(".racial").val(0)
	for (let key in stats)
		$(`#${key} .racial`).val(stats[key])

	changeTotal()
	$(".choose").hide().prop("checked", false)

	if (!stats.choose)
		return

	const {from} = stats.choose[0]
	amount = stats.choose[0].amount || 1
	count = stats.choose[0].count

	$("td.choose").text(`Choose ${count}`).show()
	from.forEach(key => $(`#${key} .choose`).show())
}

function changeTotal() {
	$("#pointbuy tr[id]").each((i, el) => {
		const [base, racial, total, mod] = $("input", el).get()
		const raw = total.value = Number(base.value) + Number(racial.value)
		mod.value = Math.floor((raw - 10) / 2)
	})
}

function changeBase(e) {
	const budget = Number($("#budget").val())

	let cost = 0
	$(".base").each((i, el) =>
		cost += getCost(Number(el.value)))

	if (cost > budget)
		return this.value = this.dataset.prev

	this.dataset.prev = this.value
	$("#remaining").val(budget - cost)

	changeTotal()
}

function rollstats() {
	var rolls = [];
	for (var i = 0; i < 6; i++) {
		var curroll = droll.roll("4d6").rolls.sort().splice(1);
		curroll = curroll[0] + curroll[1] + curroll[2];
		rolls.push(curroll);
	}

	$("#rolled #rolls").prepend("<p>"+rolls.join(", ")+"</p>");
	$("#rolled #rolls p:eq(10)").remove();
}
