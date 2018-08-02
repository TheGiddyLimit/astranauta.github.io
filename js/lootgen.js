"use strict";
const LOOT_JSON_URL = "data/loot.json";
const renderer = new EntryRenderer();
let lootList;

class LootGen {
	constructor () {
		this._spells = null;
		this._loadingSpells = false;
	}

	loadLoot (lootData) {
		lootList = lootData;
		$("button#clear").click(() => $("#lootoutput").html(""));
		$("button#genloot").click(lootGen.rollLoot);
		const $selTables = $(`#table-sel`);
		lootData.magicitems.forEach((t, i) => {
			$selTables.append(`<option value="${i}">${t.name}</option>`);
		});
		$selTables.on("change", () => {
			const v = $selTables.val();
			if (v !== "") this.displayTable(v);
		});
	}

	displayTable (arrayEntry) {
		const ItemsTable = lootList.magicitems[arrayEntry];
		let htmlText = `
		<table id="stats">
			<caption>${ItemsTable.name}</caption>
			<thead>
				<tr>
					<th class="col-xs-2 text-align-center"><span class="roller" onclick="lootGen.rollAgainstTable(${arrayEntry});">d100</span></th>
					<th class="col-xs-10">Magic Item</th>
				</tr>
			</thead>`;
		ItemsTable.table.forEach(it => {
			const range = it.min === it.max ? it.min : `${it.min}-${it.max}`;
			htmlText += `<tr><td class="text-align-center">${range}</td><td>${lootGen.parseLink(it.item)}</td></tr>`;
		});
		htmlText += `
		</table>
		<small><b>Source:</b> <i>${Parser.sourceJsonToFull(ItemsTable.source)}</i>, page ${ItemsTable.page}</small>`;
		$("div#classtable").html(htmlText).show();
	}

	rollAgainstTable (arrayEntry) {
		const magicitemstable = lootList.magicitems[arrayEntry];
		let curmagicitem = null;
		const itemroll = lootGen.randomNumber(1, 100);
		for (let n = 0; n < magicitemstable.table.length; n++) if (itemroll >= magicitemstable.table[n].min && itemroll <= magicitemstable.table[n].max) curmagicitem = magicitemstable.table[n];
		const rolled = curmagicitem.table ? curmagicitem.table[lootGen.randomNumber(0, curmagicitem.table.length - 1)] : curmagicitem.item;
		curmagicitem = lootGen.parseLink(rolled, {rollSpellScroll: true});
		$("#lootoutput > ul:eq(4), #lootoutput > hr:eq(4)").remove();
		$("#lootoutput").prepend("<ul></ul><hr>");
		$("#lootoutput ul:eq(0)").append("<li>" + "Rolled a " + itemroll + " against " + magicitemstable.name + ":<ul><li>" + curmagicitem + "</li></ul></li>");
	}

	rollLoot () {
		const cr = $("#cr").val();
		const hoard = $("#hoard").prop("checked");
		$("#lootoutput > ul:eq(4), #lootoutput > hr:eq(4)").remove();
		$("#lootoutput").prepend("<ul></ul><hr>");
		const tableset = hoard ? lootList.hoard : lootList.individual;
		let curtable = null;
		for (let i = 0; i < tableset.length; i++) if (cr >= tableset[i].mincr && cr <= tableset[i].maxcr) curtable = tableset[i];
		if (!curtable) return;
		const lootroll = lootGen.randomNumber(1, 100);
		const loottable = curtable.table;
		let loot = null;
		for (let i = 0; i < loottable.length; i++) if (lootroll >= loottable[i].min && lootroll <= loottable[i].max) loot = loottable[i];
		if (!loot) return;
		if (hoard) {
			const treasure = [];
			treasure.push(lootGen.getFormattedCoinsForDisplay(curtable.coins));
			const artgems = loot.gems ? loot.gems : (loot.artobjects ? loot.artobjects : null);
			if (artgems) {
				let artgemstable = loot.artobjects ? lootList.artobjects : lootList.gemstones;
				for (let i = 0; i < artgemstable.length; i++) if (artgemstable[i].type === artgems.type) artgemstable = artgemstable[i];
				const roll = EntryRenderer.dice.parseRandomise(artgems.amount).total;
				const gems = [];
				for (let i = 0; i < roll; i++) gems.push(artgemstable.table[lootGen.randomNumber(0, artgemstable.table.length - 1)]);
				$("#lootoutput ul:eq(0)").append("<li>" + (roll > 1 ? "x" + roll + " " : "") + Parser._addCommas(artgems.type) + " gp " + (loot.artobjects ? "art object" : "gemstone") + (roll > 1 ? "s" : "") + ":<ul>" + lootGen.sortArrayAndCountDupes(gems) + "</ul></li>");
			}
			if (loot.magicitems) {
				const magicitemtabletype = [];
				const magicitemtableamounts = [];
				magicitemtabletype.push(loot.magicitems.type.split(",")[0]);
				magicitemtableamounts.push(loot.magicitems.amount.split(",")[0]);
				if (loot.magicitems.type.indexOf(",") !== -1) {
					magicitemtabletype.push(loot.magicitems.type.split(",")[1]);
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
					const roll = EntryRenderer.dice.parseRandomise(curamount).total;
					const magicitems = [];
					for (let i = 0; i < roll; i++) {
						let curmagicitem = null;
						const itemroll = lootGen.randomNumber(1, 100);
						for (let n = 0; n < magicitemstable.table.length; n++) if (itemroll >= magicitemstable.table[n].min && itemroll <= magicitemstable.table[n].max) curmagicitem = magicitemstable.table[n];
						const nestedRoll = curmagicitem.table ? lootGen.randomNumber(0, curmagicitem.table.length - 1) : null;
						const rolled = curmagicitem.table ? curmagicitem.table[nestedRoll] : curmagicitem.item;
						magicitems.push({
							result: lootGen.parseLink(rolled, {rollSpellScroll: true}),
							roll: itemroll
						});
					}
					$("#lootoutput ul:eq(0)").append("<li>" + (magicitems.length > 1 ? "x" + magicitems.length + " " : "") + "Magic Item" + (roll > 1 ? "s" : "") + ` (<a onclick="lootGen.displayTable(${tablearrayentry});">Table ${curtype}</a>):<ul>${lootGen.sortArrayAndCountDupes(magicitems)}</ul></li>`);
				}
			}
			for (let i = 0; i < treasure.length; i++) $("#lootoutput ul:eq(0)").prepend(`<li>${treasure[i]}</li>`);
		} else {
			$("#lootoutput ul:eq(0)").prepend(`<li>${lootGen.getFormattedCoinsForDisplay(loot.coins)}</li>`);
		}
	}

	sortArrayAndCountDupes (arr) {
		let rolls = [];
		function getRollPart () {
			return rolls.length ? ` <span class="text-muted">(Rolled ${rolls.join(", ")})</span>` : "";
		}

		arr.sort();
		let current = null;
		let cnt = 0;
		let result = "";
		arr.forEach(r => {
			if ((r.result || r) !== current) {
				if (cnt > 0) result += `<li>${cnt > 1 ? `x${cnt} ` : ""}${current}${getRollPart()}</li>`;
				current = (r.result || r);
				cnt = 1;
				rolls = r.roll != null ? [r.roll] : [];
			} else cnt++;
		});
		if (cnt > 0) result += `<li>${cnt > 1 ? `x${cnt} ` : ""}${current}${getRollPart()}</li>`;
		return result;
	}

	getFormattedCoinsForDisplay (loot) {
		const generatedCoins = lootGen.generateCoinsFromLoot(loot);
		const individuallyFormattedCoins = [];
		generatedCoins.forEach((coin) => {
			individuallyFormattedCoins.unshift(`<li>${Parser._addCommas(coin.value)} ${coin.denomination}</li>`);
		});
		const totalValueGP = Parser._addCommas(lootGen.getGPValueFromCoins(generatedCoins));
		const combinedFormattedCoins = individuallyFormattedCoins.reduce((total, formattedCoin) => {
			return total += formattedCoin;
		}, "");
		return `${totalValueGP} gp total:<ul> ${combinedFormattedCoins}</ul>`;
	}

	generateCoinsFromLoot (loot) {
		const retVal = [];
		const coins = [loot.cp, loot.sp, loot.ep, loot.gp, loot.pp];
		const coinnames = ["cp", "sp", "ep", "gp", "pp"];
		for (let i = coins.length - 1; i >= 0; i--) {
			if (!coins[i]) continue;
			const multiplier = coins[i].split("*")[1];
			let rolledValue = EntryRenderer.dice.parseRandomise(coins[i].split("*")[0]).total;
			if (multiplier) rolledValue *= parseInt(multiplier);
			const coin = {"denomination": coinnames[i], "value": rolledValue};
			retVal.push(coin);
		}
		return retVal;
	}

	getGPValueFromCoins (coins) {
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

	randomNumber (min, max) {
		return RollerUtil.randomise(max, min);
	}

	_getOrViewSpellsPart (level) {
		return renderer.renderEntry(`{@filter see all ${Parser.spLevelToFullLevelText(level, true)} spells|spells|level=${level}}`);
	}

	parseLink (rawText, options = {}) {
		if (rawText.indexOf("{@item ") !== -1) {
			const stack = [];
			renderer.recursiveEntryRender(rawText, stack);
			if (options.rollSpellScroll && rawText.toLowerCase().startsWith("{@item spell scroll")) {
				const m = /spell scroll \((.*?)\)/.exec(rawText.toLowerCase());
				const level = m[1] === "cantrip" ? 0 : Number(m[1][0]); // 1st letter is the spell level
				if (this.hasLoadedSpells()) {
					stack.push(` <i>(<span>${renderer.renderEntry(this.getRandomSpell(level))}</span> or ${this._getOrViewSpellsPart(level)})</i>`);
				} else {
					stack.push(` <i>(<span class="roller" onclick="lootGen.loadRollSpell.bind(lootGen)(this, ${level})">roll</span> or ${this._getOrViewSpellsPart(level)})</i>`);
				}
			}
			return stack.join("");
		} else return rawText;
	}

	hasLoadedSpells () {
		return !!this._spells && !this._loadingSpells;
	}

	loadSpells (then) {
		if (!this._loadingSpells) {
			this._loadingSpells = true;
			DataUtil.loadJSON(`data/spells/index.json`)
				.then(index => Promise.all(Object.values(index).map(f => DataUtil.loadJSON(`data/spells/${f}`))))
				.then(spellData => {
					this._spells = {};
					const addSpell = (sp) => {
						this._spells[sp.level] = this._spells[sp.level] || [];
						this._spells[sp.level].push(`{@spell ${sp.name}|${sp.source}}`);
					};
					spellData.forEach(d => {
						d.spell.filter(it => !SourceUtil.isNonstandardSource(it.source)).forEach(sp => addSpell(sp));
					});
					BrewUtil.pAddBrewData()
						.then((brew) => {
							if (brew && brew.spell) brew.spell.forEach(sp => addSpell(sp));
							this._loadingSpells = false;
							then();
						})
						.catch(BrewUtil.purgeBrew);
				});
		}
	}

	loadRollSpell (ele, level) {
		const output = () => {
			$(ele).removeClass("roller").attr("onclick", "").html(`${renderer.renderEntry(this.getRandomSpell(level))}`)
		};

		if (!this.hasLoadedSpells()) {
			$(ele).html(`[loading...]`);
			this.loadSpells(() => output());
		} else {
			output();
		}
	}

	getRandomSpell (level) {
		const rollAgainst = this._spells[level];
		return rollAgainst[this.randomNumber(0, rollAgainst.length - 1)];
	}
}

const lootGen = new LootGen();
window.onload = function load () {
	DataUtil.loadJSON(LOOT_JSON_URL).then(lootGen.loadLoot.bind(lootGen));
};
