"use strict";
const LOOT_JSON_URL = "data/loot.json";
const renderer = new EntryRenderer();
let lootList;

window.onload = function load () {
	loadJSON(LOOT_JSON_URL, loadloot);
};

function loadloot (lootData) {
	lootList = lootData;
	$("button#clear").click(function () {
		$("#classtable").html("");
		$("#lootoutput").html("");
	});
	$("button#genloot").click(function () {
		rollLoot();
	});
}

function displayTable (arrayEntry) {
	const ItemsTable = lootList.magicitems[arrayEntry];
	let htmlText = `<table id="stats"><caption>${ItemsTable.name}</caption><thead><tr ><th class="col-xs-2 text-align-center"><span class="roller" onclick="rollAgainstTable(${arrayEntry});">d100</span></th><th class="col-xs-10">Magic Item</th></tr></thead>`;
	for (let i = 0; i < ItemsTable.table.length; i++) {
		const range = ItemsTable.table[i].min === ItemsTable.table[i].max ? ItemsTable.table[i].min : `${ItemsTable.table[i].min}-${ItemsTable.table[i].max}`
		htmlText += `<tr><td class="text-align-center">${range}</td><td>${parseLink(ItemsTable.table[i].item)}</td></tr>`;
	}
	htmlText += `</table><small><b>Source: </b> <i>${Parser.sourceJsonToFull(ItemsTable.source)}</i>, page ${ItemsTable.page}</small>`;
	$("div#classtable").html(htmlText).show();
}

function rollAgainstTable (arrayEntry) {
	const magicitemstable = lootList.magicitems[arrayEntry];
	let curmagicitem = null;
	const itemroll = randomNumber(1, 100);
	for (let n = 0; n < magicitemstable.table.length; n++) if (itemroll >= magicitemstable.table[n].min && itemroll <= magicitemstable.table[n].max) curmagicitem = magicitemstable.table[n];
	curmagicitem = parseLink(curmagicitem.table ? curmagicitem.table[randomNumber(0, curmagicitem.table.length - 1)] : curmagicitem.item);
	$("#lootoutput > ul:eq(4), #lootoutput > hr:eq(4)").remove();
	$("#lootoutput").prepend("<ul></ul><hr>");
	$("#lootoutput ul:eq(0)").append("<li>" + "Rolled a " + itemroll + " against " + magicitemstable.name + ":<ul><li>" + curmagicitem + "</li></ul></li>");
}

function rollLoot () {
	const cr = $("#cr").val();
	const hoard = $("#hoard").prop("checked");
	$("#lootoutput > ul:eq(4), #lootoutput > hr:eq(4)").remove();
	$("#lootoutput").prepend("<ul></ul><hr>")
	const tableset = hoard ? lootList.hoard : lootList.individual;
	let curtable = null;
	for (let i = 0; i < tableset.length; i++) if (cr >= tableset[i].mincr && cr <= tableset[i].maxcr) curtable = tableset[i];
	if (!curtable) return;
	const lootroll = randomNumber(1, 100);
	const loottable = curtable.table;
	let loot = null;
	for (let i = 0; i < loottable.length; i++) if (lootroll >= loottable[i].min && lootroll <= loottable[i].max) loot = loottable[i];
	if (!loot) return;
	if (hoard) {
		const treasure = [];
		treasure.push(getFormattedCoinsForDisplay(curtable.coins));
		const artgems = loot.gems ? loot.gems : (loot.artobjects ? loot.artobjects : null);
		if (artgems) {
			let artgemstable = loot.artobjects ? lootList.artobjects : lootList.gemstones;
			for (let i = 0; i < artgemstable.length; i++) if (artgemstable[i].type === artgems.type) artgemstable = artgemstable[i];
			const roll = droll.roll(artgems.amount).total;
			const gems = [];
			for (let i = 0; i < roll; i++) gems.push(artgemstable.table[randomNumber(0, artgemstable.table.length - 1)]);
			$("#lootoutput ul:eq(0)").append("<li>" + (roll > 1 ? "x" + roll + " " : "") + Parser._addCommas(artgems.type) + " gp " + (loot.artobjects ? "art object" : "gemstone") + (roll > 1 ? "s" : "") + ":<ul>" + sortArrayAndCountDupes(gems) + "</ul></li>");
		}
		if (loot.magicitems) {
			const magicitemtabletype = [];
			const magicitemtableamounts = [];
			magicitemtabletype.push(loot.magicitems.type.split(",")[0])
			magicitemtableamounts.push(loot.magicitems.amount.split(",")[0])
			if (loot.magicitems.type.indexOf(",") !== -1) {
				magicitemtabletype.push(loot.magicitems.type.split(",")[1])
				magicitemtableamounts.push(loot.magicitems.amount.split(",")[1])
			}
			for (let v = 0; v < magicitemtabletype.length; v++) {
				const curtype = magicitemtabletype[v];
				const curamount = magicitemtableamounts[v];
				let magicitemstable = lootList.magicitems;
				let tablearrayentry = 0;
				for (let i = 0; i < magicitemstable.length; i++) {
					if (magicitemstable[i].type === curtype) {
						tablearrayentry = i;
						magicitemstable = magicitemstable[tablearrayentry];
					}
				}
				const roll = droll.roll(curamount).total;
				const magicitems = [];
				for (let i = 0; i < roll; i++) {
					let curmagicitem = null;
					const itemroll = randomNumber(1, 100);
					for (let n = 0; n < magicitemstable.table.length; n++) if (itemroll >= magicitemstable.table[n].min && itemroll <= magicitemstable.table[n].max) curmagicitem = magicitemstable.table[n];
					magicitems.push(parseLink(curmagicitem.table ? curmagicitem.table[randomNumber(0, curmagicitem.table.length - 1)] : curmagicitem.item));
				}
				$("#lootoutput ul:eq(0)").append("<li>" + (magicitems.length > 1 ? "x" + magicitems.length + " " : "") + "Magic Item" + (roll > 1 ? "s" : "") + ` (<a onclick="displayTable(${tablearrayentry});">Table ${curtype}</a>):<ul>${sortArrayAndCountDupes(magicitems)}</ul></li>`);
			}
		}
		for (let i = 0; i < treasure.length; i++) $("#lootoutput ul:eq(0)").prepend(`<li>${treasure[i]}</li>`);
	} else {
		$("#lootoutput ul:eq(0)").prepend(`<li>${getFormattedCoinsForDisplay(loot.coins)}</li>`);
	}
}

function sortArrayAndCountDupes (arr) {
	arr.sort();
	let current = null;
	let cnt = 0;
	let result = "";
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] !== current) {
			if (cnt > 0) result += "<li>" + (cnt > 1 ? "x" + cnt + " " : "") + current + "</li>";
			current = arr[i];
			cnt = 1;
		} else cnt++;
	}
	if (cnt > 0) result += "<li>" + (cnt > 1 ? "x" + cnt + " " : "") + current + "</li>";
	return result;
}

function getFormattedCoinsForDisplay (loot) {
	const generatedCoins = generateCoinsFromLoot(loot);
	const individuallyFormattedCoins = [];
	generatedCoins.forEach((coin) => {
		individuallyFormattedCoins.unshift(`<li>${Parser._addCommas(coin.value)} ${coin.denomination}</li>`);
	});
	const totalValueGP = Parser._addCommas(getGPValueFromCoins(generatedCoins));
	const combinedFormattedCoins = individuallyFormattedCoins.reduce((total, formattedCoin) => {
		return total += formattedCoin;
	}, "");
	return `${totalValueGP} gp total:<ul> ${combinedFormattedCoins}</ul>`;
}

function generateCoinsFromLoot (loot) {
	const retVal = [];
	const coins = [loot.cp, loot.sp, loot.ep, loot.gp, loot.pp]
	const coinnames = ["cp", "sp", "ep", "gp", "pp"];
	for (let i = coins.length - 1; i >= 0; i--) {
		if (!coins[i]) continue;
		const multiplier = coins[i].split("*")[1];
		let rolledValue = droll.roll(coins[i].split("*")[0]).total;
		if (multiplier) rolledValue *= parseInt(multiplier);
		const coin = {"denomination": coinnames[i], "value": rolledValue};
		retVal.push(coin);
	}
	return retVal;
}

function getGPValueFromCoins (coins) {
	const initialValue = 0;
	const retVal = coins.reduce((total, coin) => {
		switch (coin.denomination) {
			case "cp":
				return total += coin.value * 0.01;
			case "sp":
				return total += coin.value * 0.1;
			case "ep":
				return total += coin.value * 0.5;
			case "gp":
				return total += coin.value;
			case "pp":
				return total += coin.value * 10;
			default:
				return total;
		}
	}, initialValue);
	return parseFloat(retVal.toFixed(2));
}

function randomNumber (min, max) {
	return Math.floor(Math.random() * max) + min;
}

function parseLink (rawText) {
	if (rawText.indexOf("{@item ") !== -1) {
		const stack = [];
		renderer.recursiveEntryRender(rawText, stack);
		return stack.join("");
	} else return rawText;
}
