"use strict";

const LOOT_JSON_URL = "data/loot.json";
const MULT_SIGN = "×";
const MAX_HIST = 9;
const renderer = new EntryRenderer();
let lootList;
const views = {};
const CHALLENGE_RATING_RANGE = {
	0: "1\u20144",
	1: "1\u20144",
	5: "5\u201410",
	11: "11\u201416",
	17: "17\u201420"
};

const STORAGE_BASIC_CR = "lootgen-basic-cr";
const STORAGE_BASIC_HOARD = "lootgen-basic-hoard";
const STORAGE_TABLE_SEL = "lootgen-table-sel";
const STORAGE_PARTY_CUMULATIVE = "lootgen-char-cumulative";
const STORAGE_PARTY_CLOSEST_TIER = "lootgen-closest-tier";

class LootGen {
	constructor () {
		this._spells = null;
		this._loadingSpells = false;
	}

	doPreLoadInit () {
		$("#rollAgaintTable").click(() => {
			const $selViewTable = $("#table-sel");
			const val = $selViewTable.val();

			$selViewTable.toggleClass("error-background", val === "");
			if (val === "") return;

			lootGen.pRollAgainstTable(val);
		});

		const $basicCr = $(`#cr`);
		const storedBasicCr = SessionStorageUtil.get(STORAGE_BASIC_CR);
		if (storedBasicCr != null) $basicCr.val(storedBasicCr);
		$basicCr.change(() => SessionStorageUtil.set(STORAGE_BASIC_CR, $basicCr.val()));

		const $basicHoard = $(`#hoard`);
		const storedBasicHoard = SessionStorageUtil.get(STORAGE_BASIC_HOARD);
		if (storedBasicHoard != null) $basicHoard.prop("checked", storedBasicHoard);
		$basicHoard.change(() => SessionStorageUtil.set(STORAGE_BASIC_HOARD, $basicHoard.prop("checked")));
	}

	doPostLoadInit () {
		const $selTables = $(`#table-sel`);
		const storedTableSel = SessionStorageUtil.get(STORAGE_TABLE_SEL);
		if (storedTableSel != null) {
			$selTables.val(storedTableSel);
			$selTables.change();
		}
		$selTables.change(() => SessionStorageUtil.set(STORAGE_TABLE_SEL, $selTables.val()));
	}

	loadLoot (lootData) {
		lootList = lootData;
		$("button.id-clear").click(() => lootOutput.clear());
		$("button#genloot").click(LootGen.pRollLoot);
		const $selTables = $(`#table-sel`);
		lootData.magicitems.forEach((t, i) => {
			$selTables.append(`<option value="${i}">${t.name}</option>`);
		});
		$selTables.on("change", () => {
			const v = $selTables.val();
			if (v) $("#table-sel").removeClass("error-background");
			this.pDisplayTable(v, !$(`#container-loot-table`).hasClass("hidden") && $(".id-showLootTable").prop("checked"));
		});
	}

	static getMaxRoll (table) {
		const lastItem = table.last();
		return lastItem.max != null ? lastItem.max : lastItem.min;
	}

	async pDisplayTable (arrayEntry, doShow = false) {
		const itemsTable = lootList.magicitems[arrayEntry];
		if (arrayEntry === "") $("div#classtable").hide();
		else {
			const $table = $(`
				<hr/>
				<table id="stats">
					<caption>${itemsTable.name}</caption>
					<tbody>
					<tr>
						<th class="col-2 text-align-center"><span class="roller" onclick="lootGen.pRollAgainstTable(${arrayEntry});">d100</span></th>
						<th class="col-10">Magic Item</th>
					</tr>
					</tbody>
				</table>
				<small><strong>Source:</strong> <em>${Parser.sourceJsonToFull(itemsTable.source)}</em>, page ${itemsTable.page}</small>
			`);

			const $tbody = $table.find("tbody");
			const promises = itemsTable.table.map(async it => {
				const $out = [];

				const primaryLink = await LootGen.p$ParseLink(it);
				const range = it.min === it.max ? it.min : `${it.min}-${it.max}`;
				const primary$Element = $(`<tr>
					<td class="text-align-center">${range}</td>
					<td><div data-r/>${it.table ? `(roll <span class="roller" onclick="lootGen.pRollAgainstTable(${arrayEntry}, ${it.min})">d${LootGen.getMaxRoll(it.table)}</span>)` : ""}</td>
				</tr>`).swap(primaryLink);
				$out.push(primary$Element);

				if (it.table) {
					const subPromises = it.table.map(async r => {
						const subLink = await LootGen.p$ParseLink(r);
						return $(`<tr>
							<td/>
							<td>
								<span style="display: inline-block; min-width: 40px;">${r.min}${r.max ? `\u2212${r.max}` : ""}</span>
								<div data-r/>
							</td>
						</tr>`).swap(subLink);
					});
					const sub$Elements = await Promise.all(subPromises);
					sub$Elements.forEach($e => $out.push($e));
				}

				return $out;
			});

			const $toAppend = await Promise.all(promises);
			$toAppend.forEach($eles => $eles.forEach($e => $e.appendTo($tbody)));

			$("div#classtable").empty().append($table).toggle(doShow);
		}
	}

	async p$GetRandomItemHtml (ixTable, parentRoll) {
		const table = lootList.magicitems[ixTable];
		const rowRoll = parentRoll || LootGen.randomNumber(1, 100);
		const row = GenUtil.getFromTable(table.table, rowRoll);

		async function p$GetMessage () {
			const $item = await LootGen.p$ParseLink(row, {rollSpellScroll: true, rollChoices: true});
			return $(`<ul><li class="split">
				<span><div data-r/> (rolled ${rowRoll})</span>
				<span class="roller" onclick="lootGen.pRerollItem(this, ${ixTable})">[reroll]</span>
			</li></ul>`).swap($item);
		}

		async function p$GetMessageSub () {
			const subTableMax = LootGen.getMaxRoll(row.table);
			const roll = LootGen.randomNumber(1, subTableMax);
			const rolled = GenUtil.getFromTable(row.table, roll);
			const $item = await LootGen.p$ParseLink(rolled, {rollSpellScroll: true, rollChoices: true});

			return $(`<ul><li class="split">
				<span><div data-r/> (rolled ${roll})</span>
				<span class="roller" onclick="lootGen.pRerollItem(this, ${ixTable})">[reroll]</span>
			</li></ul>`).swap($item);
		}

		return row.table ? p$GetMessageSub() : p$GetMessage();
	}

	static itemTitleHtml (table) {
		return $(`<div class="id-top">Rolled against <strong>${table.name}</strong>:</div>`);
	}

	async pRollAgainstTable (ixTable, parentRoll) {
		const table = lootList.magicitems[ixTable];
		const rowRoll = parentRoll || LootGen.randomNumber(1, 100);
		const title = LootGen.itemTitleHtml(table);

		lootOutput.add(await this.p$GetRandomItemHtml(ixTable, rowRoll), title);
	}

	async pRerollItem (el, ixTable) {
		const $el = $(el);
		const roll = LootGen.randomNumber(1, 100);
		const $element = await this.p$GetRandomItemHtml(ixTable, roll);

		$el.parents("ul").replaceWith($element);
	}

	static async pRollLoot () {
		const cr = $("#cr").val();
		const hoard = $("#hoard").prop("checked");
		const $el = $("<ul></ul>");
		const tableSet = hoard ? lootList.hoard : lootList.individual;
		let curTable = null;
		for (let i = 0; i < tableSet.length; i++) if (cr >= tableSet[i].mincr && cr <= tableSet[i].maxcr) curTable = tableSet[i];
		if (!curTable) return;
		const lootRoll = LootGen.randomNumber(1, 100);
		const lootTable = curTable.table;
		let loot = null;
		for (let i = 0; i < lootTable.length; i++) if (lootRoll >= lootTable[i].min && lootRoll <= lootTable[i].max) loot = lootTable[i];

		if (!loot) return;

		if (hoard) {
			const treasure = [];
			treasure.push(lootGen.getFormattedCoinsForDisplay(curTable.coins));
			const artAndGems = loot.gems ? loot.gems : (loot.artobjects ? loot.artobjects : null);
			if (artAndGems) {
				let artAndGemsTable = loot.artobjects ? lootList.artobjects : lootList.gemstones;
				for (let i = 0; i < artAndGemsTable.length; i++) if (artAndGemsTable[i].type === artAndGems.type) artAndGemsTable = artAndGemsTable[i];
				const roll = EntryRenderer.dice.parseRandomise2(artAndGems.amount);
				const gems = [];
				for (let i = 0; i < roll; i++) gems.push(artAndGemsTable.table[LootGen.randomNumber(0, artAndGemsTable.table.length - 1)]);
				$(`
					<li>${Parser._addCommas(artAndGems.type)} gp ${loot.artobjects ? "art object" : "gemstone"}${roll > 1 ? "s" : ""}${roll > 1 ? ` (${MULT_SIGN}${roll})` : ""}:
					<ul data-r/>
					</li>
				`).swap(lootGen.$getSortedDeduplicatedList(gems)).appendTo($el);
			}

			if (loot.magicitems) {
				const magicItemTableType = [];
				const magicItemTableAmounts = [];
				magicItemTableType.push(loot.magicitems.type.split(",")[0]);
				magicItemTableAmounts.push(loot.magicitems.amount.split(",")[0]);
				if (loot.magicitems.type.indexOf(",") !== -1) {
					magicItemTableType.push(loot.magicitems.type.split(",")[1]);
					magicItemTableAmounts.push(loot.magicitems.amount.split(",")[1]);
				}
				for (let v = 0; v < magicItemTableType.length; v++) {
					const curType = magicItemTableType[v];
					const curAmount = magicItemTableAmounts[v];
					let magicItemsTable = lootList.magicitems;
					let tableArrayEntry = 0;
					for (let i = 0; i < magicItemsTable.length; i++) {
						if (magicItemsTable[i].type === curType) {
							tableArrayEntry = i;
							magicItemsTable = magicItemsTable[tableArrayEntry];
						}
					}
					const roll = EntryRenderer.dice.parseRandomise2(curAmount);
					const magicItems = [];
					for (let i = 0; i < roll; i++) {
						const {itemRoll, rolled} = LootGen.__getRolledItemFromTable(magicItemsTable);

						magicItems.push({
							rolled: rolled,
							$render: LootGen.p$ParseLink(rolled, {rollSpellScroll: true, rollChoices: true}),
							roll: itemRoll,
							table: magicItemsTable
						});
					}
					const magicItemResults = await Promise.all(magicItems.map(it => it.$render));
					magicItems.forEach((it, i) => it.$render = magicItemResults[i]);
					$(`
						<li>
							Magic Item${roll > 1 ? "s" : ""}
							(<span class="roller" onclick="MiscUtil.scrollPageTop() || lootGen.pDisplayTable(${tableArrayEntry}, true);">Table ${curType}</span>)
							${magicItems.length > 1 ? ` (${MULT_SIGN}${magicItems.length})` : ""}:
							<ul data-r/>
						</li>
					`).swap(lootGen.$getSortedItemList(magicItems)).appendTo($el)
				}
			}
			for (let i = 0; i < treasure.length; i++) $el.prepend(`<li>${treasure[i]}</li>`);
		} else {
			$el.prepend(`<li>${lootGen.getFormattedCoinsForDisplay(loot.coins)}</li>`);
		}
		let title = hoard
			? `<strong>Hoard</strong> for challenge rating: <strong>${CHALLENGE_RATING_RANGE[cr]}</strong>`
			: `<strong>Individual Treasure</strong> for challenge rating: <strong>${CHALLENGE_RATING_RANGE[cr]}</strong>`;
		lootOutput.add($el, title);
	}

	/**
	 * @param arr An array of strings.
	 */
	$getSortedDeduplicatedList (arr) {
		const sorted = arr.sort(SortUtil.ascSort);

		const $ulOut = $(`<ul/>`);
		let current = null;
		let count = 0;
		const addToOutput = () => $(`<li><span>${current}${count > 1 ? `, ${MULT_SIGN}${count} ` : ""}</span></li>`)
			.appendTo($ulOut);
		sorted.forEach(r => {
			if (current == null || r !== current) {
				if (count > 0) addToOutput();
				current = r;
				count = 1;
			} else count++;
		});
		if (count > 0) addToOutput();
		return $ulOut;
	}

	/**
	 * @param arr An array of objects:
	 * {
	 *     rolled: "string rolled"
	 *     $render: $ele
	 * 	   roll: numberRolled,
	 * 	   table: { ... magic item table ... }
	 * }
	 */
	$getSortedItemList (arr) {
		const sorted = arr.sort((a, b) => SortUtil.ascSort(a.rolled, b.rolled));

		const $ulOut = $(`<ul/>`);

		sorted.forEach(current => {
			const $rollPart = $(`<span class="text-muted">(Rolled ${current.roll})</span>`);

			const $reroll = $(`<span class="roller">[reroll]</span>`).click(async () => {
				const {itemRoll, rolled} = LootGen.__getRolledItemFromTable(current.table);
				$rollPart.text(`(Rolled ${itemRoll})`);
				const new$Render = await LootGen.p$ParseLink(rolled, {rollSpellScroll: true, rollChoices: true});
				current.$render.replaceWith(new$Render);
				current.$render = new$Render;
			});

			$(`<li class="split">
					<span><span data-r="$render"/> <span data-r="$rollPart"/></span>
					<span data-r="$reroll"/>
			</li>`)
				.swap({
					$render: current.$render,
					$rollPart,
					$reroll
				})
				.appendTo($ulOut)
		});

		return $ulOut;
	}

	static __getRolledItemFromTable (magicItemsTable) {
		const itemRoll = LootGen.randomNumber(1, 100);
		const curMagicItem = GenUtil.getFromTable(magicItemsTable.table, itemRoll);

		const rolled = curMagicItem.table
			? curMagicItem.table[LootGen.randomNumber(0, curMagicItem.table.length - 1)]
			: curMagicItem;

		return {itemRoll, rolled};
	}

	getFormattedCoinsForDisplay (loot) {
		const generatedCoins = LootGen.generateCoinsFromLoot(loot);
		const individuallyFormattedCoins = [];
		generatedCoins.forEach((coin) => {
			individuallyFormattedCoins.unshift(`<li>${Parser._addCommas(coin.value)} ${coin.denomination}</li>`);
		});
		const totalValueGP = Parser._addCommas(LootGen.getGPValueFromCoins(generatedCoins));
		const combinedFormattedCoins = individuallyFormattedCoins.reduce((total, formattedCoin) => total + formattedCoin, "");
		return `${totalValueGP} gp total:<ul> ${combinedFormattedCoins}</ul>`;
	}

	static generateCoinsFromLoot (loot) {
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

	static getGPValueFromCoins (coins) {
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

	static randomNumber (min, max) {
		return RollerUtil.randomise(max, min);
	}

	static _getOrViewSpellsPart (level) {
		return renderer.renderEntry(`{@filter see all ${Parser.spLevelToFullLevelText(level, true)} spells|spells|level=${level}}`);
	}

	static async p$ParseLink (result, options = {}) {
		function mapToChooseObj (it) {
			return typeof it === "string" ? {name: it, source: SRC_DMG} : it;
		}

		const $out = $(`<span/>`);
		const rawText = result.item || (() => {
			const it = Object.values(Object.values(result.choose)[0])[0];
			return typeof it === "string" ? `{@item ${it}}` : `{@item ${it.name}|${it.source}}`;
		})();

		if (rawText.indexOf("{@item ") !== -1) {
			const txt = renderer.renderEntry(rawText);
			$out.append(txt);
		} else $out.append(rawText);

		if (options.rollSpellScroll && result.spellLevel != null) {
			$out.append(" ").append(lootGen.getSpell$ele(result.spellLevel));
		}

		if (options.rollChoices && result.choose) {
			const allChoices = [];

			if (result.choose.fromGeneric) {
				allChoices.push(...(await Promise.all(result.choose.fromGeneric.map(mapToChooseObj).map(it => EntryRenderer.hover.pCacheAndGet(UrlUtil.PG_ITEMS, it.source, UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](it)))))
					.map(it => it.variants)
					.flat());
			}

			if (result.choose.fromGroup) {
				allChoices.push(...(await Promise.all(result.choose.fromGroup.map(mapToChooseObj).map(it => EntryRenderer.hover.pCacheAndGet(UrlUtil.PG_ITEMS, it.source, UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](it)))))
					.flat()
					.map(it => it.items.map(x => {
						const [name, source] = [...x.split("|")];
						return EntryRenderer.hover._getFromCache(UrlUtil.PG_ITEMS, source || SRC_DMG, UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS]({name, source: source || SRC_DMG}));
					}))
					.flat());
			}

			if (result.choose.fromItems) {
				allChoices.push(...(await Promise.all(result.choose.fromItems.map(mapToChooseObj).map(it => EntryRenderer.hover.pCacheAndGet(UrlUtil.PG_ITEMS, it.source, UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](it))))));
			}

			if (result.choose.fromLoaded) {
				allChoices.push(...result.choose.fromLoaded);
			}

			$out.append(" ").append(lootGen.getGenericVariant$ele(allChoices));
		}

		return $out;
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
						.catch(BrewUtil.pPurgeBrew);
				});
		}
	}

	getGenericVariant$ele (allVariants) {
		const getRandomItem = () => {
			const wrpItem = RollerUtil.rollOnArray(allVariants);
			const item = wrpItem.specificVariant || wrpItem;
			return `{@item ${item.name}|${item.source}}`
		};
		const handleReroll = () => $wrpItem.empty().append(renderer.renderEntry(getRandomItem()));

		const $roll = $(`<span class="roller" onmousedown="event.preventDefault()">[reroll]</span>`).click(() => handleReroll());
		const $wrpItem = $(`<span/>`).append(renderer.renderEntry(getRandomItem()));

		return $(`<em>(<span><span data-r="$wrpItem"/> <span data-r="$roll"/></span>)</em>`)
			.swap({
				$wrpItem,
				$roll
			});
	}

	getSpell$ele (level) {
		if (this.hasLoadedSpells()) {
			const $roll = $(`<span class="roller" onmousedown="event.preventDefault()">[reroll]</span>`).click(() => this.loadRollSpell($roll.parent(), level));
			return $(`<em>(<span>${renderer.renderEntry(this.getRandomSpell(level))} <div data-r/></span> or ${LootGen._getOrViewSpellsPart(level)})</em>`).swap($roll);
		}
		const $spnRoll = $(`<span class="roller">roll</span>`).click(() => this.loadRollSpell($spnRoll.parent(), level));
		return $(`<em>(<div data-r/> or ${LootGen._getOrViewSpellsPart(level)})</em>`).swap($spnRoll);
	}

	loadRollSpell ($ele, level) {
		const output = () => {
			const $roll = $(`<span class="roller" onmousedown="event.preventDefault()">[reroll]</span>`)
				.click(() => this.loadRollSpell($roll.parent(), level));
			$ele
				.removeClass("roller").attr("onclick", "")
				.html(`${renderer.renderEntry(this.getRandomSpell(level))} `)
				.append($roll);
		};

		if (!this.hasLoadedSpells()) {
			$ele.html(`[loading...]`);
			this.loadSpells(() => output());
		} else {
			output();
		}
	}

	getRandomSpell (level) {
		const rollAgainst = this._spells[level];
		return rollAgainst[LootGen.randomNumber(0, rollAgainst.length - 1)];
	}
}

const randomLootTables = {
	_selectorTarget: "#random-from-loot-table",
	_items: {
		Major: {},
		Minor: {},
		Other: {}
	},
	_rarityOrder: ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"],
	_tableItemCountPerLevelTier: {
		1: {
			"Major": {
				"Uncommon": 0,
				"Rare": 0,
				"Very Rare": 0,
				"Legendary": 0
			},
			"Minor": {
				"Common": 0,
				"Uncommon": 0,
				"Rare": 0,
				"Very Rare": 0,
				"Legendary": 0
			}
		},
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
				"Very Rare": 0,
				"Legendary": 0
			}
		},
		10: {
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
				"Very Rare": 1,
				"Legendary": 0
			}
		},
		16: {
			"Major": {
				"Uncommon": 1,
				"Rare": 2,
				"Very Rare": 2,
				"Legendary": 1
			},
			"Minor": {
				"Common": 3,
				"Uncommon": 6,
				"Rare": 9,
				"Very Rare": 5,
				"Legendary": 1
			}
		},
		20: {
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
				"Very Rare": 9,
				"Legendary": 6
			}
		}
	},

	async init () {
		const stockItems = await EntryRenderer.item.buildList();
		let brewItems = [];
		try {
			const homebrew = await BrewUtil.pAddBrewData();
			brewItems = await EntryRenderer.item.getItemsFromHomebrew(homebrew);
		} catch (e) {
			BrewUtil.pPurgeBrew();
			setTimeout(() => { throw e });
		}
		const allItems = stockItems.concat(brewItems);

		for (const item of allItems) {
			if (item.category === "Specific Variant") continue;
			if (item.noDisplay) continue;
			let rarity = item.rarity;
			let tier = item.tier || "Other";
			if (!randomLootTables._items[tier]) {
				randomLootTables._items[tier] = {};
			}
			let tableTier = randomLootTables._items[tier];
			if (!tableTier[rarity]) {
				tableTier[rarity] = [];
			}
			tableTier[rarity].push(item);
		}

		const itemList = randomLootTables._items;
		const $selector = $(randomLootTables._selectorTarget);
		for (let nameTier of Object.keys(itemList)) {
			let keys = Object.keys(itemList[nameTier]).sort((a, b) => randomLootTables._rarityOrder.findIndex(val => val === a) - randomLootTables._rarityOrder.findIndex((val) => val === b));
			for (let nameRarity of keys) {
				if (nameRarity !== undefined && nameRarity !== "None" && nameTier && nameTier !== "undefined") {
					$selector.append(`<option value="${nameTier}-${nameRarity}">${nameTier} ${nameRarity}</option>`);
				}
			}
		}

		if (SessionStorageUtil.get(STORAGE_PARTY_CUMULATIVE) === false) $("#char-cumulative").prop("checked", false);
		$("#closest-tier").prop("checked", SessionStorageUtil.get(STORAGE_PARTY_CLOSEST_TIER));
		$("#random-magic-item-select-tier").toggle(!SessionStorageUtil.get(STORAGE_PARTY_CLOSEST_TIER));
		randomLootTables.setEvents();
	},

	setEvents () {
		const $cumulative = $("#char-cumulative");
		const $closestTier = $("#closest-tier");
		const $classTable = $("#classtable");
		const $charLevel = $(`#charLevel`);
		const $randomFromLootTable = $("#random-from-loot-table");

		$(".slider")
			.toggle($closestTier.prop("checked"))
			.slider({min: 1, max: 20})
			.slider('pips', {rest: "label"})
			.slider('float');

		$cumulative.change((evt) => {
			const toggled = evt.currentTarget.checked;
			SessionStorageUtil.set(STORAGE_PARTY_CUMULATIVE, toggled);
		});

		$closestTier.change((evt) => {
			const toggled = evt.currentTarget.checked;
			$(".slider").toggle(toggled);
			$("#random-magic-item-select-tier").toggle(!toggled);
			SessionStorageUtil.set(STORAGE_PARTY_CLOSEST_TIER, toggled);
		});

		$charLevel.change((evt) => {
			const isBase = evt.currentTarget.value === "1";
			$(`#wrp-char-cumulative`).toggle(!isBase);
			if (isBase) {
				$charLevel.css({
					borderTopRightRadius: 3,
					borderBottomRightRadius: 3
				});
			} else {
				$charLevel.css({
					borderTopRightRadius: "",
					borderBottomRightRadius: ""
				});
			}
		});

		$(".id-showLootTable").click(function (evt) {
			const checked = evt.currentTarget.checked;
			$(".id-showLootTable").prop("checked", checked);
			$("#classtable").toggle(checked);
		});

		$randomFromLootTable.change(function (evt) {
			const val = evt.currentTarget.value;
			if (val !== "") {
				const [tier, rarity] = val.split("-");
				randomLootTables.displayTable(randomLootTables._items[tier][rarity], tier, rarity);
				$("#random-from-loot-table").removeClass("error-background");
			} else {
				randomLootTables.displayTable("");
			}
			$(".id-showLootTable").prop("checked") ? $classTable.show() : $classTable.hide();
		});

		$("#get-random-item-from-table").click(async () => {
			let [tier, rarity] = $randomFromLootTable.val().split("-");
			$("#random-from-loot-table").toggleClass("error-background", !tier && !rarity);
			if (tier && rarity) {
				const $ul = $(`<ul data-rarity="${rarity}" data-tier="${tier}"></ul>`).append(await randomLootTables.p$GetRandomItemHtml(tier, rarity));
				lootOutput.add($ul, `Rolled on the table for <strong>${tier} ${rarity}</strong> items`);
			}
		});

		$("#get-group-of-items-for-character").click(async () => {
			let level;
			const useClosestTier = $("#closest-tier").prop("checked");
			const accumulateTiers = $("#char-cumulative").prop("checked") && !useClosestTier; // ignored if slider is used

			if (useClosestTier) level = $(".slider").slider("value");
			else level = $("#charLevel").val();

			const text = useClosestTier ? `level ${level}` : `level ${$(`#charLevel option[value=${level}]`).text()}`;
			const itemsNeeded = randomLootTables.getNumberOfItemsNeeded(Number(level), useClosestTier, accumulateTiers);
			const title = `Magical Items for a <strong>${text}</strong> Party:`;
			const $el = $(`<div/>`);

			const itemCount = {};
			await ObjUtil.pForEachDeep(
				itemsNeeded,
				async function (rarityValues, path) {
					let tier = path[0];
					let $tier = $(`<ul data-tier="${tier}"><li>${tier} items</li></ul>`);

					await Promise.all(Object.keys(rarityValues).map(async rarity => {
						let count = rarityValues[rarity];
						let $rarity = $(`<ul data-rarity="${rarity}"><li>${rarity} items(${count})</li></ul>`);
						let $items = $(`<ul data-tier="${tier}"></ul>`);
						itemCount[tier] = (itemCount[tier] || 0) + count;
						const $toAppend = await Promise.all([...new Array(count)].map(async () => randomLootTables.p$GetRandomItemHtml(tier, rarity)));
						$toAppend.forEach($e => $items.append($e));

						if ($items.find("li").length > 0) {
							$rarity.append($items);
							$tier.append($rarity);
						}
					}));
					if (itemCount[tier]) $el.append($tier);
				},
				{depth: 1}
			);
			if (!Object.values(itemCount).reduce((a, b) => a + b, 0)) $el.append(`<i>No items.</i>`);
			lootOutput.add($el, title);
		});
	},

	getNumberOfItemsNeeded (charLevel, estimateBetweenLevels = false, accumulateTiers = true) {
		const count = {
			"Major": {
				"Uncommon": 0,
				"Rare": 0,
				"Very Rare": 0,
				"Legendary": 0
			},
			"Minor": {
				"Common": 0,
				"Uncommon": 0,
				"Rare": 0,
				"Very Rare": 0,
				"Legendary": 0
			}
		};

		if (!estimateBetweenLevels && !accumulateTiers) {
			const props = randomLootTables._tableItemCountPerLevelTier[charLevel];
			ObjUtil.mergeWith(props, count, (val, sum) => typeof val === "number" ? val + sum : sum, {depth: 2});
		} else {
			let last = 1;
			const keys = Object.keys(randomLootTables._tableItemCountPerLevelTier).sort((a, b) => a - b);
			for (let i = 0; i <= keys.length; i++) {
				let level = Number(keys[i]);
				let props = randomLootTables._tableItemCountPerLevelTier[level];

				if (level <= charLevel) {
					ObjUtil.mergeWith(props, count, (val, sum) => typeof val === "number" ? val + sum : sum, {depth: 2});
				} else if (level > charLevel && estimateBetweenLevels) {
					let differenceLevels = level - last;
					let charDifferenceLevels = level - charLevel;
					let levelsToCalc = differenceLevels - charDifferenceLevels;
					let ratio = levelsToCalc / differenceLevels;
					ObjUtil.mergeWith(props, count, (val, sum) => typeof val === "number" ? sum + Math.floor(ratio * val) : sum, {depth: 2});
					break;
				} else break;

				last = level;
			}
		}
		return count;
	},

	async p$CreateLink (item) {
		const fauxResult = (() => {
			if (item.category === "Generic Variant" && item.variants && item.variants.length) {
				return {
					item: `{@item ${item.name}|${item.source}}`,
					choose: {
						fromLoaded: item.variants
					}
				}
			} else {
				return {
					item: `{@item ${item.name}|${item.source}}`
				};
			}
		})();
		return LootGen.p$ParseLink(fauxResult, {rollSpellScroll: true, rollChoices: true});
	},

	getRandomItem (tier, rarity) {
		const roll = RollerUtil.randomise(randomLootTables._items[tier][rarity].length - 1, 0);
		return {roll, item: randomLootTables._items[tier][rarity][roll]};
	},

	async p$GetRandomItemHtml (tier, rarity) {
		const {roll, item} = randomLootTables.getRandomItem(tier, rarity);
		const $link = await randomLootTables.p$CreateLink(item);
		return $(`
			<li class="split">
				<span><span data-r/> <span class="text-muted">(Rolled ${roll + 1})</span></span>
				<span class="roller" onclick="randomLootTables.pRerollItem(this)">[reroll]</span>
			</li>
		`).swap($link);
	},

	async pRerollItem (ele) {
		const $ele = $(ele);
		const rarity = $ele.closest("[data-rarity]").attr("data-rarity");
		const tier = $ele.closest("[data-tier]").attr("data-tier");
		$ele.parent("li").replaceWith(await randomLootTables.p$GetRandomItemHtml(tier, rarity));
	},

	displayTable (itemsArray, tier, rarity) {
		if (itemsArray === "") {
			$("div#classtable").hide();
		} else {
			let html = $(`
			<hr/>
			<table id="stats">
				<caption>Table for ${tier} Magic items that are ${rarity}</caption>
				<tbody>
				<tr>
					<th class="col-2 text-align-center"><span class="roller" onclick="randomLootTables.getRandomItem('${tier}', '${rarity}');">d${itemsArray.length}</span></th>
					<th class="col-10">${tier} ${rarity} Magic Items</th>
				</tr>
				</tbody>
			</table>`);
			itemsArray.forEach((item, index) => {
				html.find("tbody").append(`<tr><td class="text-align-center">${index + 1}</td><td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@item ${item.name}|${item.source}}`)}`);
			});
			$("div#classtable").html(html);
		}
	}
};

const lootOutput = (function lootOutput () {
	const $table = () => $("#lootoutput");

	const checkSize = function () {
		$(`#lootoutput > div:eq(${MAX_HIST}), #lootoutput > hr:eq(${MAX_HIST})`).remove();
	};

	const clear = function () {
		$table().html("");
	};

	const addRaw = function (html) {
		$table().prepend(html);
	};

	const add = function (html, title) {
		checkSize();
		title = $("<h4 class='wrp-sect-head'></h4>").append(title);
		if (typeof html === "string") {
			addRaw(html);
		} else if (html.jquery) {
			let $el = $("<div/>").append(title);
			$el.append(html).append("<hr/>");
			addRaw($el);
		}

		const $eLast = $(`#lootoutput > div`).last().find(`*`).last();
		if ($eLast.is("hr")) $eLast.remove();
	};
	return {
		add,
		clear
	};
})();

const ViewManipulation = class ViewManipulation {
	constructor (name, viewNames) {
		this.name = name;
		this.events = {};
		this._views = viewNames;
		this._containers = (function (views) {
			const containers = {};
			views.forEach(view => {
				let container = ViewManipulation.getContainerName(view);
				containers[view] = $(`#${container}`);
			});
			return containers;
		}(viewNames));

		this._buttons = (function (names) {
			const buttons = {};
			names.forEach(name => {
				let button = ViewManipulation.getButtonName(name);
				buttons[name] = $("#" + button);
			});
			return buttons;
		}(viewNames));

		this.initClickHandlers();
		this.switchView(SessionStorageUtil.get(this.getStorageName()) || viewNames[0]);
	}

	getStorageName () {
		return `lootgen-view-${this.name}`;
	}

	static getName (nameStr) {
		return nameStr.split("-").slice(1).join("-");
	}

	static getContainerName (view) {
		return `container-${view}`;
	}

	static getButtonName (view) {
		return `btn-${view}`;
	}

	each (target, cb) {
		for (let name of Object.keys(target)) {
			cb.call(this, target[name], name);
		}
	}

	initClickHandlers () {
		this.each(this._buttons, view => {
			view.click(evt => {
				const name = ViewManipulation.getName(evt.currentTarget.id);
				this.switchView(name);
			});
		});
	}

	switchView (name) {
		this._views.forEach(view => {
			const $button = this._buttons[view];
			const $container = this._containers[view];
			$button.toggleClass("btn-selected", name === view);
			$container.toggleClass("hidden", name !== view);
			this.emit("change", name);
		});
		SessionStorageUtil.set(this.getStorageName(), name);
	}

	on (name, func) {
		if (!this.events[name]) {
			this.events[name] = [];
		}
		this.events[name].push(func);
	}

	emit (name, ...args) {
		const event = this.events[name];
		if (event) {
			event.forEach(func => {
				func.apply(this, args);
			});
		}
	}
};

const lootGen = new LootGen();

window.addEventListener("load", function load () {
	lootGen.doPreLoadInit();
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	DataUtil.loadJSON(LOOT_JSON_URL).then(data => {
		lootGen.loadLoot(data);
		lootGen.doPostLoadInit();
	});
	$(`body`).on("mousedown", ".roller", (e) => e.preventDefault());

	views.mainView = new ViewManipulation("lootgen-tables", ["lootgen", "loot-table", "random-magic-item"]);
	views.mainView.on("change", () => $("#classtable").hide());

	views.lootTables = new ViewManipulation("lootTables", ["dmg-loot-table", "xge-loot-table"]);
	views.lootTables.on("change", () => randomLootTables.displayTable(""));

	randomLootTables.init();

	$("select").on("change", (evt) => $(evt.currentTarget).val() === "" && $(evt.currentTarget).removeClass("error-background"));
});
