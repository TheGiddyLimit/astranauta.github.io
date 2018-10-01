"use strict";
const LOOT_JSON_URL = "data/loot.json";
const ITEMS_URL = "data/items.json";
const MULT_SIGN = "×";
const MAX_HIST = 9;
const renderer = new EntryRenderer();
let lootList;
const randomtableLists = {
	Major: {},
	Minor: {}
};

class LootGen {
	constructor () {
		this._spells = null;
		this._loadingSpells = false;
	}

	loadLoot (lootData) {
		lootList = lootData;
		$("button.id-clear").click(() => $("#lootoutput").html(""));
		$("button#genloot").click(lootGen.rollLoot);
		const $selTables = $(`#table-sel`);
		lootData.magicitems.forEach((t, i) => {
			$selTables.append(`<option value="${i}">${t.name}</option>`);
		});
		$selTables.on("change", () => {
			const v = $selTables.val();
			this.displayTable(v);
		});
	}

	static getMaxRoll (table) {
		const lastItem = table.last();
		return lastItem.max != null ? lastItem.max : lastItem.min;
	}

	displayTable (arrayEntry) {
		const itemsTable = lootList.magicitems[arrayEntry];
		if (arrayEntry === "") {
			$("div#classtable").hide();
		} else {
			let htmlText = `
			<table id="stats">
			<caption>${itemsTable.name}</caption>
			<thead>
			<tr>
			<th class="col-xs-2 text-align-center"><span class="roller" onclick="lootGen.rollAgainstTable(${arrayEntry});">d100</span></th>
			<th class="col-xs-10">Magic Item</th>
			</tr>
			</thead>`;
			itemsTable.table.forEach(it => {
				const range = it.min === it.max ? it.min : `${it.min}-${it.max}`;
				htmlText += `<tr><td class="text-align-center">${range}</td><td>${lootGen.parseLink(it.item)}${it.table ? ` (roll <span class="roller" onclick="lootGen.rollAgainstTable(${arrayEntry}, ${it.min})">d${LootGen.getMaxRoll(it.table)}</span>)` : ""}</td></tr>`;
				if (it.table) {
					it.table.forEach(r => {
						htmlText += `<tr><td></td><td><span style="display: inline-block; min-width: 40px;">${r.min}${r.max ? `\u2212${r.max}` : ""}</span> ${lootGen.parseLink(r.item)}</td></tr>`;
					})
				}
			});
			htmlText += `
			</table>
			<small><b>Source:</b> <i>${Parser.sourceJsonToFull(itemsTable.source)}</i>, page ${itemsTable.page}</small>`;
			$("div#classtable").html(htmlText).show();
		}
	}

	rollAgainstTable (ixTable, parentRoll) {
		const table = lootList.magicitems[ixTable];

		const rowRoll = parentRoll || lootGen.randomNumber(1, 100);
		const row = GenUtil.getFromTable(table.table, rowRoll);

		function getMessage () {
			const item = lootGen.parseLink(row.item, {rollSpellScroll: true});

			return `Rolled a ${rowRoll} against ${table.name}:<ul><li>${item}</li></ul>`;
		}

		function getMessageSub () {
			const subTableMax = LootGen.getMaxRoll(row.table);
			const roll = lootGen.randomNumber(1, subTableMax);
			const rolled = GenUtil.getFromTable(row.table, roll);
			const item = lootGen.parseLink(rolled.item, {rollSpellScroll: true});

			return `Rolled a ${rowRoll} (${roll + 1}) against ${table.name}:<ul><li>${item}</li></ul>`;
		}

		const message = row.table ? getMessageSub() : getMessage();

		$(`#lootoutput > ul:eq(${MAX_HIST}), #lootoutput > hr:eq(${MAX_HIST})`).remove();
		$("#lootoutput").prepend(`<ul><li>${message}</li></ul><hr>`);
	}

	rollLoot () {
		const cr = $("#cr").val();
		const hoard = $("#hoard").prop("checked");
		$(`#lootoutput > ul:eq(${MAX_HIST}), #lootoutput > hr:eq(${MAX_HIST})`).remove();
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
				const roll = EntryRenderer.dice.parseRandomise2(artgems.amount);
				const gems = [];
				for (let i = 0; i < roll; i++) gems.push(artgemstable.table[lootGen.randomNumber(0, artgemstable.table.length - 1)]);
				$("#lootoutput ul:eq(0)").append(`<li>${Parser._addCommas(artgems.type)} gp ${loot.artobjects ? "art object" : "gemstone"}${roll > 1 ? "s" : ""}${roll > 1 ? ` (${MULT_SIGN}${roll})` : ""}:<ul>${lootGen.sortArrayAndCountDupes(gems)}</ul></li>`);
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
					const roll = EntryRenderer.dice.parseRandomise2(curamount);
					const magicitems = [];
					for (let i = 0; i < roll; i++) {
						const itemRoll = lootGen.randomNumber(1, 100);
						const curmagicitem = GenUtil.getFromTable(magicitemstable.table, itemRoll);

						const nestedRoll = curmagicitem.table ? lootGen.randomNumber(0, curmagicitem.table.length - 1) : null;
						const rolled = curmagicitem.table ? curmagicitem.table[nestedRoll] : curmagicitem.item;
						magicitems.push({
							result: lootGen.parseLink(rolled, {rollSpellScroll: true}),
							roll: itemRoll
						});
					}
					$("#lootoutput ul:eq(0)").append(`<li>Magic Item${roll > 1 ? "s" : ""} (<span class="roller" onclick="lootGen.displayTable(${tablearrayentry});">Table ${curtype}</span>)${magicitems.length > 1 ? ` (${MULT_SIGN}${magicitems.length})` : ""}:<ul>${lootGen.sortArrayAndCountDupes(magicitems)}</ul></li>`);
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
				if (cnt > 0) result += `<li>${current}${getRollPart()}${cnt > 1 ? `, ${MULT_SIGN}${cnt} ` : ""}</li>`;
				current = (r.result || r);
				cnt = 1;
				rolls = r.roll != null ? [r.roll] : [];
			} else cnt++;
		});
		if (cnt > 0) result += `<li>${current}${getRollPart()}${cnt > 1 ? `, ${MULT_SIGN}${cnt} ` : ""}</li>`;
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
			let rolledValue = EntryRenderer.dice.parseRandomise2(coins[i].split("*")[0]);
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

const randomLootTables = {
	_selectorTarget: "#random-from-loot-table",

	_table: {
		4: {
			"Major": {
				"Uncommon": 2,
				"Rare": 0,
				"Very Rare": 0,
				"Legendary": 0
			},
			"Minor": {
				"Common": 6,
				"Uncommon": 2,
				"Rare": 1,
				"Very Rare": 0
			}
		},
		5: {
			"Major": {
				"Uncommon": 5,
				"Rare": 1,
				"Very Rare": 0,
				"Legendary": 0
			},
			"Minor": {
				"Common": 10,
				"Uncommon": 12,
				"Rare": 5,
				"Very Rare": 1
			}
		},
		11: {
			"Major": {
				"Uncommon": 1,
				"Rare": 2,
				"Very Rare": 2,
				"Legendary": 0
			},
			"Minor": {
				"Common": 3,
				"Uncommon": 6,
				"Rare": 9,
				"Very Rare": 5
			}
		},
		15: {
			"Major": {
				"Uncommon": 0,
				"Rare": 1,
				"Very Rare": 2,
				"Legendary": 3
			},
			"Minor": {
				"Common": 0,
				"Uncommon": 0,
				"Rare": 4,
				"Very Rare": 9
			}
		}
	},

	init () {
		DataUtil.loadJSON(ITEMS_URL)
			.then(({item: items}) => {
				for (let item of items) {
					let rarity = item.rarity;
					let tier = item.tier;
					if (!randomtableLists[tier]) randomtableLists[tier] = {};
					let tableTier = randomtableLists[tier];
					if (!tableTier[rarity]) tableTier[rarity] = [];
					tableTier[rarity].push(item);
				}
				return randomtableLists;
			})
			.then(randomtableLists => {
				let $selector = $(randomLootTables._selectorTarget);
				for (let nameTier of Object.keys(randomtableLists)) {
					for (let nameRarity of Object.keys(randomtableLists[nameTier])) {
						if (nameRarity !== undefined && nameRarity !== "None" && nameTier && nameTier !== "undefined") {
							$selector.append(`<option value="${nameTier}-${nameRarity}">${nameTier} ${nameRarity}</option>`);
						}
					}
				}
			});
	},

	getNumberOfItemsNeeded (charLevel, estimateBetweenLevels = false) {
		let count = { Major: 0, Minor: 0 };
		let last = 0;

		for (let [level, props] of Object.keys(randomLootTables._table).sort()) {
			if (level <= charLevel) {
				last = level;
				ObjUtil.mergeWith(props, count, {depth: 2}, (val, sum) => val + sum);
			} else if (estimateBetweenLevels) {
				let difference = level - last;
				ObjUtil.mergeWith(props, count, {depth: 2}, (val, sum) => (sum + ~~(val / difference)));
				break;
			} else {
				break;
			}
		}
		return count;
	},

	randomItem (tier, rarity) {

	}
};

const ViewManinpulation = class ViewManinpulation {
	constructor (...names) {
		this._views = names;
		this._containers = (function (views) {
			let containers = {};
			views.forEach(view => {
				let container = this.returnContainerName(view);
				containers[view] = $("#" + container);
			})
			return containers;
		}.bind(this)(names));

		this._buttons = (function (names) {
			let buttons = {};
			names.forEach(name => {
				let button = this.returnButtonName(name);
				buttons[name] = $("#" + button);
			})
			return buttons;
		}.bind(this)(names));
		this.setClicks();
	}

	returnName (nameStr) {
		return nameStr.split("-").slice(1).join("-");
	}

	returnContainerName (view) {
		return "container-" + view;
	}

	returnButtonName (view) {
		return "btn-" + view;
	}

	each (target, cb) {
		for (let name of Object.keys(target)) cb.call(this, target[name], name);
	}

	setClicks () {
		this.each(this._buttons, view => {
			view.click((evt) => {
				let name = this.returnName(evt.currentTarget.id);
				this.switchView(name)
			});
		});
	}

	switchView (name) {
		this._views.forEach((view) => {
			let $button = this._buttons[view];
			let $container = this._containers[view];
			$button.toggleClass("btn-selected", name === view);
			$container.toggleClass("hidden", name !== view);
		})
		Cookies.set("lootGenViewState", name);
	}
}

const lootGen = new LootGen();
let viewManinpulation;

window.onload = function load () {
	DataUtil.loadJSON(LOOT_JSON_URL).then(lootGen.loadLoot.bind(lootGen));
	$(`body`).on("mousedown", ".roller", (e) => e.preventDefault());

	let $charLevSelector = $('#character-level-selector');
	for (let i = 1; i < 21; i++) {
		$charLevSelector.append(`<option value="${i}">${i}</option>`);
	}
	viewManinpulation = new ViewManinpulation("lootgen", "loot-table", "random-magic-item")
		.switchView(Cookies.get("lootGenViewState") || "lootgen");

	$(".slider")
		.slider({min: 1, max: 20})
		.slider('pips', {rest: "label"})
		.slider('float');

	randomLootTables.init();

	$(".slider").hide();
	$("#closest-tier").change((evt) => {
		if (evt.currentTarget.checked) {
			$(".slider").hide();
			$("#random-magic-item-select-tier").show();
		} else {
			$(".slider").show();
			$("#random-magic-item-select-tier").hide();
		}
	})

	$("#get-random-item-from-table").click(evt => {
		if ($("#closest-tier").prop("checked")) {
			randomLootTables()
		}
	});

	$("#target").html(lootGen.parseLink("{@item Adamantine Plate Armor}"))
	$("#rollAgaintTable").click(function (evt) {
		let val = $("#table-sel").val();
		if (val === "") return;
		lootGen.rollAgainstTable(val);
	})
};
