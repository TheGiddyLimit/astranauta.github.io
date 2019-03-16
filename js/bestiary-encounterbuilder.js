"use strict";

class EncounterBuilder {
	constructor () {
		this.stateInit = false;
		this._cache = null;
		this._lastPlayerCount = null;
		this._advanced = false;

		this._cachedTitle = null;

		this.doSaveStateDebounced = MiscUtil.debounce(this.doSaveState, 50);
	}

	initUi () {
		$(`#btn-encounterbuild`).click(() => History.setSubhash(EncounterBuilder.HASH_KEY, true));
		$(`#btn-encounterstatblock`).click(() => History.setSubhash(EncounterBuilder.HASH_KEY, null));

		this._initRandomHandlers();
		this._initAdjustHandlers();

		$(`.ecgen__add_players`).click(() => {
			if (this._advanced) this.addAdvancedPlayerRow(false);
			else this.addPlayerRow(false)
		});

		const $cbAdvanced = $(`.ecgen__players_advanced`).change(() => {
			const party = this.getParty();
			this._advanced = !!$cbAdvanced.prop("checked");
			if (this._advanced) {
				let first = true;
				party.forEach(it => {
					[...new Array(it.count)].forEach(() => {
						this.addAdvancedPlayerRow(first, false, "", it.level);
						first = false;
					});
				});
				$(`.ecgen__player_group`).remove();
				this.updateDifficulty();
			} else {
				let first = true;
				party.forEach(it => {
					this.addPlayerRow(first, false, it.count, it.level);
					first = false;
				});
				$(`.ecgen__player_advanced`).remove();
				this.updateDifficulty();
			}
			this.updateUiIsAdvanced(this._advanced);
		});

		const $btnSvUrl = $(`.ecgen__sv_url`).click(async () => {
			const encounterPart = UrlUtil.packSubHash(EncounterUtil.SUB_HASH_PREFIX, [JSON.stringify(this.getSaveableState())], true);
			const parts = [location.href, encounterPart];
			await MiscUtil.pCopyTextToClipboard(parts.join(HASH_PART_SEP));
			JqueryUtil.showCopiedEffect($btnSvUrl);
		});
		$(`.ecgen__sv_file`).click(() => DataUtil.userDownload(`encounter`, this.getSaveableState()));
		$(`.ecgen__ld_file`).click(() => {
			DataUtil.userUpload((json) => {
				if (json.items && json.sources) { // if it's a bestiary sublist
					json.l = {
						items: json.items,
						sources: json.sources
					}
				}
				this.pDoLoadState(json);
			});
		});
		$(`.ecgen__reset`).click(() => confirm("Are you sure?") && encounterBuilder.pReset());
	}

	_initRandomHandlers () {
		JqueryUtil.bindDropdownButton($(`#ecgen_dropdown_rng`));

		const $btnGen = $(`.ecgen_rng`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter($btnGen.data("mode"))
		});

		$(`.ecgen_rng_easy`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("easy");
			$btnGen.data("mode", "easy").text("Random Easy").attr("title", "Randomly generate an Easy encounter");
		});
		$(`.ecgen_rng_medium`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("medium");
			$btnGen.data("mode", "medium").text("Random Medium").attr("title", "Randomly generate a Medium encounter");
		});
		$(`.ecgen_rng_hard`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("hard");
			$btnGen.data("mode", "hard").text("Random Hard").attr("title", "Randomly generate a Hard encounter");
		});
		$(`.ecgen_rng_deadly`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("deadly");
			$btnGen.data("mode", "deadly").text("Random Deadly").attr("title", "Randomly generate a Deadly encounter");
		});
	}

	_initAdjustHandlers () {
		JqueryUtil.bindDropdownButton($(`#ecgen_dropdown_adj`));

		const $btnAdjust = $(`.ecgen_adj`).click((evt) => {
			evt.preventDefault();
			this.pDoAdjustEncounter($btnAdjust.data("mode"))
		});

		$(`.ecgen_adj_easy`).click((evt) => {
			evt.preventDefault();
			this.pDoAdjustEncounter("easy");
			$btnAdjust.data("mode", "easy").text("Adjust to Easy").attr("title", "Adjust the current encounter difficulty to Easy");
		});
		$(`.ecgen_adj_medium`).click((evt) => {
			evt.preventDefault();
			this.pDoAdjustEncounter("medium");
			$btnAdjust.data("mode", "medium").text("Adjust to Medium").attr("title", "Adjust the current encounter difficulty to Medium");
		});
		$(`.ecgen_adj_hard`).click((evt) => {
			evt.preventDefault();
			this.pDoAdjustEncounter("hard");
			$btnAdjust.data("mode", "hard").text("Adjust to Hard").attr("title", "Adjust the current encounter difficulty to Hard");
		});
		$(`.ecgen_adj_deadly`).click((evt) => {
			evt.preventDefault();
			this.pDoAdjustEncounter("deadly");
			$btnAdjust.data("mode", "deadly").text("Adjust to Deadly").attr("title", "Adjust the current encounter difficulty to Deadly");
		});
	}

	updateUiIsAdvanced () {
		$(`.ecgen__players_advanced`).prop("checked", this._advanced);
		$(`.ecgen__player_advanced_extra_head `).remove();
		$(`.ecgen__player_advanced_extra_foot`).remove();
		if (this._advanced) {
			$(`.ecgen__add_players`).html(`<span class="glyphicon glyphicon-plus"></span> Add Another Player`);
			$(`.ecgen__group_lhs`).addClass(`ecgen__group_lhs--advanced`);
			$(`.ecgen__advanced_help`).show();
		} else {
			$(`.ecgen__add_players`).html(`<span class="glyphicon glyphicon-plus"></span> Add Another Level`);
			$(`.ecgen__group_lhs`).removeClass(`ecgen__group_lhs--advanced`);
			$(`.ecgen__advanced_help`).hide();
		}
	}

	initState () {
		EncounterUtil.pGetSavedState().then(async savedState => {
			if (savedState) await this.pDoLoadState(savedState.data, savedState.type === "local");
			else this.addInitialPlayerRows();
			this.stateInit = true;
		});
	}

	addInitialPlayerRows (first) {
		if (this._advanced) this.addAdvancedPlayerRow(first);
		else this.addPlayerRow(first, true, ECGEN_BASE_PLAYERS);
	}

	async pReset (doAddRows = true, playersOnly) {
		if (!playersOnly) ListUtil.pDoSublistRemoveAll();

		this.removeAllPlayerRows();
		if (doAddRows) this.addInitialPlayerRows();
	}

	async pDoLoadState (savedState, playersOnly) {
		await this.pReset(false, playersOnly);
		try {
			if (savedState.a) {
				this._advanced = true;
				this.updateUiIsAdvanced();
				if (savedState.d && savedState.d.length) {
					savedState.d.forEach((details, i) => this.addAdvancedPlayerRow(!i, false, details.n, details.l, details.x));
				} else this.addInitialPlayerRows(false);

				if (savedState.c && savedState.c.length) {
					savedState.c.forEach(col => {
						this.addAdvancedColumnHeader(col);
						this.addAdvancedColumnFooter();
					});
				}
			} else {
				if (savedState.p && savedState.p.length) {
					savedState.p.forEach(({count, level}, i) => this.addPlayerRow(!i, false, count, level));
				} else this.addInitialPlayerRows(false);
			}

			if (savedState.l && !playersOnly) {
				ListUtil.doJsonLoad(savedState.l, false, sublistFuncPreload);
			}
			this.updateDifficulty();
		} catch (e) {
			JqueryUtil.doToast({content: `Could not load encounter! Was the file valid?`, type: "danger"});
			this.pReset();
		}
	}

	getSaveableState () {
		const out = {
			p: this.getParty(),
			l: ListUtil.getExportableSublist(),
			a: this._advanced
		};
		if (this._advanced) {
			out.c = $(`.ecgen__players_head_advanced`).find(`.ecgen__player_advanced_extra_head`).map((i, e) => $(e).val()).get();
			out.d = $(`.ecgen__player_advanced`).map((i, e) => {
				const $e = $(e);
				const extras = $e.find(`.ecgen__player_advanced_extra`).map((i, e) => $(e).val()).get();
				while (extras.length < out.c.length) extras.push(""); // pad array to match columns length

				return {
					n: $e.find(`.ecgen__player_advanced__name`).val(),
					l: Number($e.find(`.ecgen__player_advanced__level`).val()),
					x: extras.slice(0, out.c.length) // cap at columns length
				};
			}).get();
		}
		return out;
	}

	doSaveState () {
		if (this.stateInit) EncounterUtil.pDoSaveState(this.getSaveableState());
	}

	generateCache () {
		// create a map of {XP: [monster list]}
		if (this._cache == null) {
			this._cache = (() => {
				const out = {};
				list.visibleItems.map(it => monsters[Number(it.elm.getAttribute("filterid"))]).filter(m => !m.isNpc).forEach(m => {
					const mXp = Parser.crToXpNumber(m.cr.cr || m.cr);
					if (mXp) (out[mXp] = out[mXp] || []).push(m);
				});
				return out;
			})();
		}
	}

	resetCache () {
		this._cache = null;
	}

	async pDoAdjustEncounter (difficulty) {
		let currentEncounter = EncounterBuilderUtils.getSublistedEncounter();
		if (!currentEncounter.length) {
			return JqueryUtil.doToast({content: `The current encounter contained no creatures! Please add some first.`, type: "warning"})
		}
		currentEncounter.forEach(creatureType => creatureType.count = 1);

		const xpThresholds = this.getPartyXpThresholds();
		let encounterXp = EncounterBuilderUtils.calculateEncounterXp(currentEncounter, xpThresholds.count);

		const ixLow = EncounterBuilder.TIERS.indexOf(difficulty);
		if (!~ixLow) throw new Error(`Unhandled difficulty level: "${difficulty}"`);
		// fudge min/max numbers slightly
		const [targetMin, targetMax] = [
			Math.floor(xpThresholds[EncounterBuilder.TIERS[ixLow]] * 0.9),
			Math.ceil((xpThresholds[EncounterBuilder.TIERS[ixLow + 1]] - 1) * 1.1)
		];

		if (encounterXp.adjustedXp > targetMax) {
			JqueryUtil.doToast({content: `Could not adjust the current encounter to ${difficulty.uppercaseFirst()}, try removing some creatures!`, type: "danger"})
		} else {
			// only calculate this once rather than during the loop, to ensure stable conditions
			// less accurate in some cases, but should prevent infinite loops
			const crCutoff = EncounterBuilderUtils.getCrCutoff(currentEncounter);

			// randomly choose creatures to skip
			// generate array of [0, 1, ... n-1] where n = number of unique creatures
			// this will be used to determine how many of the unique creatures we want to skip
			const numSkipTotals = [...new Array(currentEncounter.length)].map((_, ix) => ix);

			const doTryAdjusting = () => {
				if (!numSkipTotals.length) return -1; // no solution possible, so exit loop

				let skipIx = 0;
				// 7/12 * 7/12 * ... chance of moving the skipIx along one
				while (!(RollerUtil.randomise(12) > 7) && skipIx < numSkipTotals.length - 1) skipIx++;

				const numSkips = numSkipTotals.splice(skipIx, 1)[0]; // remove the selected skip amount; we'll try the others if this one fails
				const curUniqueCreatures = [...currentEncounter];
				if (numSkips) {
					[...new Array(numSkips)].forEach(() => {
						const ixRemove = RollerUtil.randomise(curUniqueCreatures.length) - 1;
						curUniqueCreatures.splice(ixRemove, 1);
					});
				}

				let maxTries = 999;
				while (!(encounterXp.adjustedXp > targetMin && encounterXp.adjustedXp < targetMax) && maxTries-- > 0) {
					// chance to skip each creature at each iteration
					// otherwise, the case where every creature is relevant produces an equal number of every creature
					const pickFrom = [...curUniqueCreatures];
					if (pickFrom.length > 1) {
						let loops = Math.floor(pickFrom.length / 2);
						// skip [half, n-1] creatures
						loops = RollerUtil.randomise(pickFrom.length - 1, loops);
						while (loops-- > 0) {
							const ix = RollerUtil.randomise(pickFrom.length) - 1;
							pickFrom.splice(ix, 1);
						}
					}

					while (pickFrom.length) {
						const ix = RollerUtil.randomise(pickFrom.length) - 1;
						const picked = pickFrom.splice(ix, 1)[0];
						picked.count++;
						encounterXp = EncounterBuilderUtils.calculateEncounterXp(currentEncounter, xpThresholds.count);
						if (encounterXp.adjustedXp > targetMax) {
							picked.count--;
							encounterXp = EncounterBuilderUtils.calculateEncounterXp(currentEncounter, xpThresholds.count);
						}
					}
				}

				return maxTries < 0 ? 0 : 1; // 1 if a solution was found, 0 otherwise
			};

			const invalidSolutions = [];
			let lastSolution;
			while (!(lastSolution = doTryAdjusting())) { // -1/1 = complete; 0 = continue
				invalidSolutions.push(MiscUtil.copy(currentEncounter));
				currentEncounter.forEach(it => it.count = 1); // reset for next attempt
			}

			// no good solution was found, so pick the closest invalid solution
			if (lastSolution === -1 && invalidSolutions.length) {
				currentEncounter = invalidSolutions.map(is => ({
					encounter: is,
					distance: (() => {
						const xp = EncounterBuilderUtils.calculateEncounterXp(is, xpThresholds.count);
						if (xp > targetMax) return xp - targetMax;
						else if (xp < targetMin) return targetMin - xp;
						else return 0;
					})()
				})).sort((a, b) => SortUtil.ascSort(a.distance, b.distance))[0];
			}

			const belowCrCutoff = currentEncounter.filter(it => it.cr < crCutoff);

			if (belowCrCutoff.length) {
				// do a post-step to randomly add "irrelevant" creatures, ensuring plenty of fireball fodder
				let budget = targetMax - encounterXp.adjustedXp;
				if (budget > 0) {
					belowCrCutoff.forEach(it => it._xp = Parser.crToXpNumber(Parser.numberToCr(it.cr)));
					const usable = belowCrCutoff.filter(it => it._xp < budget);

					if (usable.length) {
						const party = this.getParty();
						const totalPlayers = party.map(it => it.count).reduce((a, b) => a + b, 0);
						const averagePlayerLevel = party.map(it => it.level * it.count).reduce((a, b) => a + b, 0) / totalPlayers;

						// try to avoid flooding low-level parties
						const playerToCreatureRatio = (() => {
							if (averagePlayerLevel < 5) return [0.8, 1.3];
							else if (averagePlayerLevel < 11) return [1, 2];
							else if (averagePlayerLevel < 17) return [1, 3];
							else return [1, 4];
						})();

						const [minDesired, maxDesired] = [Math.floor(playerToCreatureRatio[0] * totalPlayers), Math.ceil(playerToCreatureRatio[1] * totalPlayers)];

						// keep rolling until we fail to add a creature, or until we're out of budget
						while (encounterXp.adjustedXp <= targetMax) {
							const totalCreatures = currentEncounter.map(it => it.count).reduce((a, b) => a + b, 0);

							// if there's less than min desired, large chance of adding more
							// if there's more than max desired, small chance of adding more
							// if there's between min and max desired, medium chance of adding more
							const chanceToAdd = totalCreatures < minDesired ? 90 : totalCreatures > maxDesired ? 40 : 75;

							const isAdd = RollerUtil.roll(100) < chanceToAdd;
							if (isAdd) {
								RollerUtil.rollOnArray(belowCrCutoff).count++;
								encounterXp = EncounterBuilderUtils.calculateEncounterXp(currentEncounter, xpThresholds.count);
							} else break;
						}
					}
				}
			}
		}

		this._loadSublist({
			items: currentEncounter.map(creatureType => ({
				h: creatureType.hash,
				c: `${creatureType.count}`,
				uid: creatureType.uid || undefined
			})),
			sources: ListUtil.getExportableSublist().sources
		});
	}

	async pDoGenerateEncounter (difficulty) {
		const xp = this.calculateXp();

		const ixLow = EncounterBuilder.TIERS.indexOf(difficulty);
		if (!~ixLow) throw new Error(`Unhandled difficulty level: "${difficulty}"`);
		const budget = xp.party[EncounterBuilder.TIERS[ixLow + 1]] - 1;

		this.generateCache();

		const generateClosestEncounter = () => {
			const _xps = Object.keys(this._cache).map(it => Number(it)).sort(SortUtil.ascSort).reverse();
			/*
			Sorted array of:
			{
				cr: "1/2",
				xp: 50,
				crNum: 0.5
			}
			 */
			const _meta = Object.entries(Parser.XP_CHART_ALT).map(([cr, xp]) => ({cr, xp, crNum: Parser.crToNumber(cr)}))
				.sort((a, b) => SortUtil.ascSort(b.crNum, a.crNum));
			const getXps = budget => _xps.filter(it => it <= budget);

			const calcNextBudget = (encounter) => {
				const data = encounter.map(it => ({cr: Parser.crToNumber(it.mon.cr.cr || it.mon.cr), count: it.count}));
				if (!data.length) return budget;

				const curr = EncounterBuilderUtils.calculateEncounterXp(data, xp.party.count);
				const budgetRemaining = budget - curr.adjustedXp;

				const meta = _meta.filter(it => it.xp <= budgetRemaining);
				// if the highest CR creature has CR greater than the cutoff, adjust for next multiplier
				if (meta.length && meta[0].crNum >= curr.meta.crCutoff) {
					const nextMult = Parser.numMonstersToXpMult(curr.relevantCount + 1, xp.party.count);
					return Math.floor((budget - (nextMult * curr.baseXp)) / nextMult);
				}
				// otherwise, no creature has CR greater than the cutoff, don't worry about multipliers
				return budgetRemaining;
			};

			const addToEncounter = (encounter, xp) => {
				const existing = encounter.filter(it => it.xp === xp);
				if (existing.length && RollerUtil.roll(100) < 85) { // 85% chance to add another copy of an existing monster
					RollerUtil.rollOnArray(existing).count++;
				} else {
					const rolled = RollerUtil.rollOnArray(this._cache[xp]);
					// add to an existing group, if present
					const existing = encounter.find(it => it.mon.source === rolled.source && it.mon.name === rolled.name);
					if (existing) existing.count++;
					else {
						encounter.push({
							xp: xp,
							mon: rolled,
							count: 1
						});
					}
				}
			};

			let skipCount = 0;
			const doSkip = (xps, encounter, xp) => {
				// if there are existing entries at this XP, don't skip
				const existing = encounter.filter(it => it.xp === xp);
				if (existing.length) return false;

				// skip 70% of the time by default, less 13% chance per item skipped
				if (xps.length > 1) {
					const isSkip = RollerUtil.roll(100) < (70 - (13 * skipCount));
					if (isSkip) {
						skipCount++;
						const maxSkip = xps.length - 1;
						// flip coins; so long as we get heads, keep skipping
						for (let i = 0; i < maxSkip; ++i) {
							if (RollerUtil.roll(2) === 0) {
								return i;
							}
						}
						return maxSkip - 1;
					} else return 0;
				} else return false;
			};

			const doInitialSkip = xps => {
				// 50% of the time, skip the first 0-1/3rd of available CRs
				if (xps.length > 4 && RollerUtil.roll(2) === 1) {
					const skips = RollerUtil.roll(Math.ceil(xps.length / 3));
					return xps.slice(skips);
				} else return xps;
			};

			const doFind = (budget) => {
				const enc = [];
				const xps = doInitialSkip(getXps(budget));

				let nextBudget = budget;
				let skips = 0;
				let steps = 0;
				while (xps.length) {
					if (steps++ > 100) break;

					if (skips) {
						skips--;
						xps.shift();
						continue;
					}

					const xp = xps[0];

					if (xp > nextBudget) {
						xps.shift();
						continue;
					}

					skips = doSkip(xps, enc, xp);
					if (skips) {
						skips--;
						xps.shift();
						continue;
					}

					addToEncounter(enc, xp);

					nextBudget = calcNextBudget(enc);
				}

				return enc;
			};

			return doFind(budget);
		};

		const closestSolution = generateClosestEncounter();

		if (closestSolution) {
			const toLoad = {items: []};
			const sources = new Set();
			closestSolution.forEach(it => {
				toLoad.items.push({h: UrlUtil.autoEncodeHash(it.mon), c: String(it.count)});
				sources.add(it.mon.source);
			});
			toLoad.sources = [...sources];
			this._loadSublist(toLoad);
		} else {
			await ListUtil.pDoSublistRemoveAll();
			this.updateDifficulty();
		}
	}

	_loadSublist (toLoad) {
		ListUtil.doJsonLoad(toLoad, false, (json, funcOnload) => {
			sublistFuncPreload(json, () => {
				funcOnload();
				this.updateDifficulty();
			});
		});
	}

	addAdvancedPlayerRow (first = true, doUpdate = true, name, level, extraCols) {
		$(`.ecgen__wrp_add_players`).before(EncounterBuilder.getAdvancedPlayerRow(first, name, level, extraCols));
		if (doUpdate) this.updateDifficulty();
	}

	addPlayerRow (first = true, doUpdate = true, count, level) {
		$(`.ecgen__wrp_add_players`).before(EncounterBuilder.getPlayerRow(first, count, level));
		if (doUpdate) this.updateDifficulty();
	}

	removeAllPlayerRows () {
		$(`.ecgen__player_group`).remove();
		$(`.ecgen__player_advanced`).remove();
	}

	isActive () {
		return History.getSubHash(EncounterBuilder.HASH_KEY) === "true";
	}

	show () {
		this._cachedTitle = this._cachedTitle || document.title;
		document.title = "Encounter Builder - 5etools";
		$(`body`).addClass("ecgen_active");
		this.updateDifficulty();
	}

	hide () {
		if (this._cachedTitle) {
			document.title = this._cachedTitle;
			this._cachedTitle = null;
		}
		$(`body`).removeClass("ecgen_active");
	}

	handleClick (evt, ix, add, ele) {
		const data = ele ? {uid: $(ele).closest(`li.row`).find(`.uid`).text()} : undefined;
		if (add) ListUtil.pDoSublistAdd(ix, true, evt.shiftKey ? 5 : 1, data);
		else ListUtil.pDoSublistSubtract(ix, evt.shiftKey ? 5 : 1, data);
	}

	handleShuffleClick (evt, ix) {
		const mon = monsters[ix];
		const xp = Parser.crToXpNumber(mon.cr.cr || mon.cr);
		if (!xp) return; // if Unknown/etc

		const curr = ListUtil.getExportableSublist();
		const hash = UrlUtil.autoEncodeHash(mon);
		const itemToSwitch = curr.items.find(it => it.h === hash);

		this.generateCache();
		const availMons = this._cache[xp];
		if (availMons.length !== 1) {
			// note that this process does not remove any old sources

			let reroll = mon;
			let rolledHash = hash;
			while (rolledHash === hash) {
				reroll = RollerUtil.rollOnArray(availMons);
				rolledHash = UrlUtil.autoEncodeHash(reroll);
			}
			itemToSwitch.h = rolledHash;
			if (!curr.sources.includes(reroll.source)) {
				curr.sources.push(reroll.source);
			}

			// do a pass to merge any duplicates
			outer: for (let i = 0; i < curr.items.length; ++i) {
				const item = curr.items[i];
				for (let j = i - 1; j >= 0; --j) {
					const prevItem = curr.items[j];

					if (item.h === prevItem.h) {
						prevItem.c = String(Number(prevItem.c) + Number(item.c));
						curr.items.splice(i, 1);
						continue outer;
					}
				}
			}

			this._loadSublist(curr);
		} // else can't reroll
	}

	handleContext (evt) {
		evt.stopPropagation();
	}

	handleSubhash () {
		// loading state from the URL is instead handled as part of EncounterUtil.pGetSavedState
		if (History.getSubHash(EncounterBuilder.HASH_KEY) === "true") this.show();
		else this.hide();
	}

	removeAdvancedPlayerRow (ele) {
		const $ele = $(ele);
		$ele.closest(`.ecgen__player_advanced`).remove();
		this.updateDifficulty();
	}

	removePlayerRow (ele) {
		const $ele = $(ele);
		$ele.closest(`.ecgen__player_group`).remove();
		this.updateDifficulty();
	}

	updateDifficulty () {
		const xp = this.calculateXp();

		const $elEasy = $(`.ecgen__easy`).removeClass("bold").text(`Easy: ${xp.party.easy.toLocaleString()} XP`);
		const $elmed = $(`.ecgen__medium`).removeClass("bold").text(`Medium: ${xp.party.medium.toLocaleString()} XP`);
		const $elHard = $(`.ecgen__hard`).removeClass("bold").text(`Hard: ${xp.party.hard.toLocaleString()} XP`);
		const $elDeadly = $(`.ecgen__deadly`).removeClass("bold").text(`Deadly: ${xp.party.deadly.toLocaleString()} XP`);

		$(`.ecgen__daily_budget`).removeClass("bold").text(`Daily Budget: ${xp.party.daily.toLocaleString()} XP`);

		let difficulty = "Trivial";
		if (xp.encounter.adjustedXp >= xp.party.deadly) {
			difficulty = "Deadly";
			$elDeadly.addClass("bold");
		} else if (xp.encounter.adjustedXp >= xp.party.hard) {
			difficulty = "Hard";
			$elHard.addClass("bold");
		} else if (xp.encounter.adjustedXp >= xp.party.medium) {
			difficulty = "Medium";
			$elmed.addClass("bold");
		} else if (xp.encounter.adjustedXp >= xp.party.easy) {
			difficulty = "Easy";
			$elEasy.addClass("bold");
		}

		if (xp.encounter.relevantCount) {
			$(`.ecgen__req_creatures`).show();
			$(`.ecgen__rating`).text(`Difficulty: ${difficulty}`);
			$(`.ecgen__raw_total`).text(`Total XP: ${xp.encounter.baseXp.toLocaleString()}`);
			$(`.ecgen__raw_per_player`).text(`(${Math.floor(xp.encounter.baseXp / xp.party.count).toLocaleString()} per player)`);
			const infoHover = EntryRenderer.hover.bindOnMouseHoverEntry(
				{
					entries: [
						`{@b Adjusted by a ${xp.encounter.meta.playerAdjustedXpMult}× multiplier, based on a minimum challenge rating threshold of approximately ${`${xp.encounter.meta.crCutoff.toFixed(2)}`.replace(/[,.]?0+$/, "")}*&dagger;, and a party size of ${xp.encounter.meta.playerCount} players.}`,
						`{@note * Calculated as half of the maximum challenge rating, unless the highest challenge rating is two or less, in which case there is no threshold.}`,
						`<hr>`,
						{
							type: "quote",
							entries: [
								`&dagger; [...] don't count any monsters whose challenge rating is significantly below the average challenge rating of the other monsters in the group [...]`
							],
							"by": "{@book Dungeon Master's Guide, page 82|DMG|3|4 Modify Total XP for Multiple Monsters}"
						}
					]
				},
				true
			);
			$(`.ecgen__adjusted_total_info`).off("mouseover").on("mouseover", function (event) {
				infoHover(event, this);
			});
			$(`.ecgen__adjusted_total`).text(`Adjusted XP: ${xp.encounter.adjustedXp.toLocaleString()}`);
			$(`.ecgen__adjusted_per_player`).text(`(${Math.floor(xp.encounter.adjustedXp / xp.party.count).toLocaleString()} per player)`);
		} else {
			$(`.ecgen__req_creatures`).hide();
		}

		this.doSaveState();
	}

	getParty () {
		if (this._advanced) {
			const $players = $(`.ecgen__player_advanced`);
			const countByLevel = {};
			$players.each((i, e) => {
				const level = $(e).find(`.ecgen__player_advanced__level`).val();
				countByLevel[level] = (countByLevel[level] || 0) + 1;
			});
			return Object.entries(countByLevel).map(([level, count]) => ({level, count}));
		} else {
			return $(`.ecgen__player_group`).map((i, e) => {
				const $e = $(e);
				return {
					count: Number($e.find(`.ecgen__player_group__count`).val()),
					level: Number($e.find(`.ecgen__player_group__level`).val())
				}
			}).get();
		}
	}

	get lastPlayerCount () {
		return this._lastPlayerCount;
	}

	getPartyXpThresholds () {
		const party = this.getParty();
		party.forEach(group => {
			group.easy = LEVEL_TO_XP_EASY[group.level] * group.count;
			group.medium = LEVEL_TO_XP_MEDIUM[group.level] * group.count;
			group.hard = LEVEL_TO_XP_HARD[group.level] * group.count;
			group.deadly = LEVEL_TO_XP_DEADLY[group.level] * group.count;
			group.daily = LEVEL_TO_XP_DAILY[group.level] * group.count;
		});
		const totals = party.reduce((a, b) => {
			Object.keys(a).forEach(k => a[k] = a[k] + b[k]);
			return a;
		}, {
			count: 0,
			level: 0,
			easy: 0,
			medium: 0,
			hard: 0,
			deadly: 0,
			daily: 0
		});
		totals.yikes = totals.deadly + (totals.deadly - totals.hard);
		this._lastPlayerCount = totals.count;
		return totals;
	}

	calculateXp () {
		const totals = this.getPartyXpThresholds();
		const encounter = EncounterBuilderUtils.calculateListEncounterXp(totals.count);
		return {party: totals, encounter: encounter};
	}

	static async doStatblockMouseOver (evt, ele, ixMon, scaledTo) {
		const mon = monsters[ixMon];
		if (scaledTo != null) {
			const scaled = await ScaleCreature.scale(mon, scaledTo);
			EntryRenderer.hover.mouseOverPreloaded(evt, ele, scaled, UrlUtil.PG_BESTIARY, mon.source, UrlUtil.autoEncodeHash(mon));
		} else {
			EntryRenderer.hover.mouseOver(evt, ele, UrlUtil.PG_BESTIARY, mon.source, UrlUtil.autoEncodeHash(mon));
		}
	}

	static getTokenMouseOver (mon) {
		return EntryRenderer.hover.createOnMouseHoverEntry(
			{
				name: `Token \u2014 ${mon.name}`,
				type: "image",
				href: {
					type: "external",
					url: EntryRenderer.monster.getTokenUrl(mon)
				}
			},
			true
		);
	}

	doCrChange (ele, ixMon, scaledTo) {
		const $iptCr = $(ele);
		const mon = monsters[ixMon];
		const baseCr = mon.cr.cr || mon.cr;
		const baseCrNum = Parser.crToNumber(baseCr);
		const targetCr = $iptCr.val();

		if (Parser.isValidCr(targetCr)) {
			const targetCrNum = Parser.crToNumber(targetCr);

			if (targetCrNum === scaledTo) return;

			const state = ListUtil.getExportableSublist();
			const toFindHash = UrlUtil.autoEncodeHash(mon);

			const toFindUid = !(scaledTo == null || baseCrNum === scaledTo) ? getUid(mon.name, mon.source, scaledTo) : null;
			const ixCurrItem = state.items.findIndex(it => {
				if (scaledTo == null || scaledTo === baseCrNum) return it.uid == null && it.h === toFindHash;
				else return it.uid === toFindUid;
			});
			if (!~ixCurrItem) throw new Error(`Could not find previously sublisted item! 🐛`);

			const toFindNxtUid = baseCrNum !== targetCrNum ? getUid(mon.name, mon.source, targetCrNum) : null;
			const nextItem = state.items.find(it => {
				if (targetCrNum === baseCrNum) return it.uid == null && it.h === toFindHash;
				else return it.uid === toFindNxtUid;
			});
			// if there's an existing item with a matching UID (or lack of), merge into it
			if (nextItem) {
				const curr = state.items[ixCurrItem];
				nextItem.c = `${Number(nextItem.c || 1) + Number(curr.c || 1)}`;
				state.items.splice(ixCurrItem, 1);
			} else state.items[ixCurrItem].uid = getUid(mon.name, mon.source, targetCrNum);

			this._loadSublist(state);
		} else {
			JqueryUtil.doToast({
				content: `"${$iptCr.val()}" is not a valid Challenge Rating! Please enter a valid CR (0-30). For fractions, "1/X" should be used.`,
				type: "danger"
			});
			$iptCr.val(Parser.numberToCr(scaledTo || baseCr));
		}
	}

	addAdvancedColumnHeader (name) {
		$(`.ecgen__advanced_add_col`).before(EncounterBuilder.getAdvancedPlayerDetailHeader(name));
	}

	addAdvancedColumnFooter () {
		$(`.ecgen__wrp_add_players`).append(`
			<div class="ecgen__player_advanced_narrow ecgen__player_advanced_extra_foot mr-1">
				<button class="btn btn-xs btn-danger ecgen__advanced_remove_col" onclick="encounterBuilder.removeAdvancedColumn(this)" title="Remove Column"><span class="glyphicon-trash glyphicon"/></button>
			</div>
		`);
	}

	addAdvancedColumn () {
		this.addAdvancedColumnHeader();
		$(`.ecgen__player_advanced`).each((i, e) => {
			$(e).find(`input`).last().after(EncounterBuilder.getAdvancedPlayerDetailColumn());
		});
		this.addAdvancedColumnFooter();
		this.doSaveStateDebounced();
	}

	removeAdvancedColumn (ele) {
		const $e = $(ele);
		const pos = $(`.ecgen__wrp_add_players`).find(`.ecgen__player_advanced_extra_foot`).index($e.parent());
		$e.parent().remove();
		$(`.ecgen__player_advanced`).each((i, e) => {
			$($(e).find(`.ecgen__player_advanced_extra`)[pos]).remove();
		});
		$($(`.ecgen__players_head_advanced .ecgen__player_advanced_extra_head`)[pos]).remove();
		// debugger
	}

	static getAdvancedPlayerDetailHeader (name) {
		return `
			<input class="ecgen__player_advanced_narrow ecgen__player_advanced_extra_head form-control form-control--minimal input-xs text-align-center mr-1" value="${(name || "").escapeQuotes()}" onchange="encounterBuilder.doSaveStateDebounced()">
		`;
	}

	static getAdvancedPlayerDetailColumn (value) {
		return `
			<input class="ecgen__player_advanced_narrow ecgen__player_advanced_extra form-control form-control--minimal input-xs text-align-center mr-1" value="${(value || "").escapeQuotes()}" onchange="encounterBuilder.doSaveStateDebounced()">
		`;
	}

	static getAdvancedPlayerRow (isFirst, name, level, extraVals) {
		extraVals = extraVals || [...new Array($(`.ecgen__player_advanced_extra_head`).length)].map(() => "");
		return `
			<div class="row mb-2 ecgen__player_advanced">
				<div class="col-12 flex ecgen__player_advanced_flex">
					<input class="ecgen__player_advanced__name form-control form-control--minimal input-xs mr-1" value="${(name || "").escapeQuotes()}" onchange="encounterBuilder.doSaveStateDebounced()">
					<input value="${level || 1}" min="1" max="20" type="number" class="ecgen__player_advanced__level ecgen__player_advanced_narrow form-control form-control--minimal input-xs text-align-right mr-1" onchange="encounterBuilder.updateDifficulty()">
					${extraVals.map(it => EncounterBuilder.getAdvancedPlayerDetailColumn(it)).join("")}
					${!isFirst ? `
					<button class="btn btn-danger btn-xs ecgen__del_players" onclick="encounterBuilder.removeAdvancedPlayerRow(this)" title="Remove Player">
						<span class="glyphicon glyphicon-trash"></span>
					</button>
					` : `<div class="ecgen__del_players_filler"/>`}
				</div>
			</div>
		`;
	}

	static getPlayerRow (isFirst, count, level) {
		count = Number(count) || 1;
		level = Number(level) || 1;
		return `
			<div class="row mb-2 ecgen__player_group">
				<div class="col-2">
					<select class="ecgen__player_group__count" onchange="encounterBuilder.updateDifficulty()">
					${[...new Array(12)].map((_, i) => `<option ${(count === i + 1) ? "selected" : ""}>${i + 1}</option>`).join("")}
					</select>
				</div>
				<div class="col-2">
					<select class="ecgen__player_group__level" onchange="encounterBuilder.updateDifficulty()" >
						${[...new Array(20)].map((_, i) => `<option ${(level === i + 1) ? "selected" : ""}>${i + 1}</option>`).join("")}
					</select>
				</div>
				${!isFirst ? `
				<div class="col-2 flex" style="margin-left: -20px; align-items: center; height: 20px;">
					<button class="btn btn-danger btn-xs ecgen__del_players" onclick="encounterBuilder.removePlayerRow(this)" title="Remove Player Group">
						<span class="glyphicon glyphicon-trash"></span>
					</button>
				</div>
				` : ""}
			</div>
		`;
	}

	static getButtons (monId, isSublist) {
		return `
			<span class="ecgen__visible ${isSublist ? "col-1-5" : "col-1"} no-wrap" onclick="event.preventDefault()">
				<button title="Add (SHIFT for 5)" class="btn btn-success btn-xs ecgen__btn_list" onclick="encounterBuilder.handleClick(event, ${monId}, 1${isSublist ? `, this` : ""})">
					<span class="glyphicon glyphicon-plus"></span>
				</button>
				<button title="Subtract (SHIFT for 5)" class="btn btn-danger btn-xs ecgen__btn_list" onclick="encounterBuilder.handleClick(event, ${monId}, 0${isSublist ? `, this` : ""})">
					<span class="glyphicon glyphicon-minus"></span>
				</button>
				${isSublist ? `
				<button title="Randomize Monster" class="btn btn-default btn-xs ecgen__btn_list" onclick="encounterBuilder.handleShuffleClick(event, ${monId}, this)">
					<span class="glyphicon glyphicon-random" style="right: 1px"></span>
				</button>
				` : ""}
			</span>
		`;
	}
}
EncounterBuilder.HASH_KEY = "encounterbuilder";
EncounterBuilder.TIERS = ["easy", "medium", "hard", "deadly", "yikes"];
