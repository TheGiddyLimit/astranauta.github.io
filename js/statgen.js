"use strict";

const RACE_JSON_URL = "data/races.json";

class StatGen {
	static isValidState (state) {
		if (!state) return false;
		if (typeof state !== "object") return false;
		if (!state.t || !state.m || !state.p) return false;
		if (!Object.keys(state.t).length) return false;
		return !Object.entries(state.t).some(([k, v]) => isNaN(Number(k)) || isNaN(Number(v)));
	}

	async init () {
		this.raceStats = null;
		this.raceChoiceAmount = null;
		this.raceChoiceCount = null;
		this.raceData = null;
		this.$advanced = $(`#advanced`);
		this.$budget = $(`#budget`);
		this.budget = StatGen.DEFAULT_POINTS;
		this.doSaveDebounced = MiscUtil.debounce(this.doSaveState, 200, {leading: true});

		await ExcludeUtil.pInitialise();
		await this.pLoadRaceJson();
		this.initialiseChangeHandlers();

		// load from local storage
		try {
			const savedState = await StorageUtil.pGet(VeCt.STORAGE_POINTBUY);
			if (StatGen.isValidState(savedState)) this.doLoadStateFrom(savedState);
			else this.savedState = MiscUtil.copy(StatGen.DEFAULT_COSTS);
		} catch (e) {
			this.savedState = MiscUtil.copy(StatGen.DEFAULT_COSTS);
		}

		// load from URL
		try {
			this.doLoadUrlState(true);
		} catch (e) {
			window.location.hash = "";
		}

		this.renderCostsTable();

		this.$advanced.change(() => {
			const isAdvanced = this.isAdvanced;
			$(`#pointbuy`).toggleClass("pbuy__advanced_active", isAdvanced);
			this.$budget.attr("readonly", !isAdvanced);

			if (isAdvanced) this.$budget.val(this.budget);
			else this.$budget.val(StatGen.DEFAULT_POINTS);

			this.renderCostsTable();
			this.handleCostChanges();
			this.doSaveDebounced();
		}).change();

		$(`#pbuy__save_file`)
			.click(() => DataUtil.userDownload(`statgen-pointbuy`, this.getSaveableState()));

		$(`#pbuy__load_file`)
			.click(async () => {
				const json = await DataUtil.pUserUpload();
				if (StatGen.isValidState(json)) {
					this.doLoadStateFrom(json);
					this.doSaveDebounced();
					this.handleCostChanges();
				} else {
					return JqueryUtil.doToast({
						content: `Invalid save file!`,
						type: "danger",
					});
				}
			});

		const $btnSaveUrl = $(`#pbuy__save_url`)
			.click(async () => {
				const encoded = `${window.location.href.split("#")[0]}#pointbuy${HASH_PART_SEP}${encodeURIComponent(JSON.stringify(this.getSaveableState()))}`;
				await MiscUtil.pCopyTextToClipboard(encoded);
				JqueryUtil.showCopiedEffect($btnSaveUrl);
			});

		this.isInit = true;
	}

	doLoadStateFrom (savedState) {
		this.savedState = savedState.t;
		this.$advanced.prop("checked", !!savedState.m.a);
		this.$budget.val(savedState.p);
		this.budget = savedState.p;
		this.renderCostsTable();

		const checkArray = (prop) => savedState[prop] && savedState[prop] instanceof Array && savedState[prop].length === 6;

		const $cbsChoose = $(`.pbuy__cb_choose`);
		if (checkArray("b")) $(`.base`).each((i, e) => e.value = savedState.b[i]);
		if (checkArray("u")) $(`.pbuy__user_add`).each((i, e) => e.value = savedState.u[i]);
		if (savedState.r) $(`#race`).val(savedState.r);

		this.changeRace();
		if (checkArray("c")) $cbsChoose.each((i, e) => $(e).prop("checked", savedState.c[i]));
		$cbsChoose.each((i, e) => this.chooseRacialBonus(e, false));
	}

	doLoadUrlState (firstLoad) {
		if (window.location.hash.length) {
			const splitHash = window.location.hash.slice(1).split(",");
			if (splitHash.length > 1) {
				const toLoad = JSON.parse(decodeURIComponent(splitHash[1]));
				if (StatGen.isValidState(toLoad)) {
					this.doLoadStateFrom(toLoad);

					if (firstLoad !== true) this.handleCostChanges();
				}

				location.replace("#pointbuy");
			}
		}
	}

	handleCostChanges () {
		$(".base").each((i, e) => e.value = this.limit(e.value));
		this.changeBase();
	}

	getSaveableState () {
		const mapToVals = (sel) => $(sel).map((i, e) => Number(e.value)).get();

		return MiscUtil.copy({
			b: mapToVals(`.base`),
			u: mapToVals(`.pbuy__user_add`),
			r: $(`#race`).val(),
			c: $(`.pbuy__cb_choose`).map((i, e) => $(e).prop("checked")).get(),

			// custom point-buy
			t: this.savedState,
			p: this.budget,
			m: {
				a: this.isAdvanced,
			},
		})
	}

	doSaveState () {
		if (!this.isInit) return;
		StorageUtil.pSet(VeCt.STORAGE_POINTBUY, this.getSaveableState());
	}

	async pLoadRaceJson () {
		const data = await DataUtil.loadJSON(RACE_JSON_URL);

		const brew = await BrewUtil.pAddBrewData();

		this.raceData = Renderer.race.mergeSubraces(data.race);
		if (brew.race) {
			const cpyBrew = MiscUtil.copy(brew);
			cpyBrew.race = Renderer.race.mergeSubraces(cpyBrew.race, {isAddBaseRaces: true});
			this.raceData = this.raceData.concat(cpyBrew.race);
		}
		this.raceData = this.raceData.filter(it => {
			const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](it);
			return !ExcludeUtil.isExcluded(hash, "race", it.source);
		});

		$("#rollbutton").click(() => this.rollStats());

		const isCrypto = RollerUtil.isCrypto();
		const titleStr = isCrypto ? "Numbers will be generated using Crypto.getRandomValues()" : "Numbers will be generated using Math.random()";
		$(`#roller-mode`).html(`Cryptographically strong random generation: <span title="${titleStr}" class="crypto-${isCrypto}">${isCrypto ? `<span class="glyphicon glyphicon-lock"></span> enabled` : `<span class="glyphicon glyphicon-ban-circle"></span> not available`}</span>`);

		const doReset = () => {
			$(".base").val(this.statMin);
			$(".pbuy__user_add").val(0);
			$(".choose").prop("checked", false);
			this.changeBase();
		};

		$("#reset").click(() => doReset());

		$("#randomise").click(() => {
			doReset();

			let tries = 999;
			const $iptAttrs = [...$(".base")].map(ele => $(ele));
			while (tries > 0) {
				tries--;

				const $iptAttrsCanIncrease = $iptAttrs.filter(it => Number(it.val()) < this.statMax);
				const $toBump = RollerUtil.rollOnArray($iptAttrsCanIncrease);
				const oldVal = Number($toBump.val());
				$toBump.val(oldVal + 1);
				this.changeBase();

				const constBudget = this.getCostAndBudget();
				const remain = constBudget.budget - constBudget.cost;
				if (remain === 0) return;
				else if (remain < 0) $toBump.val(oldVal);
			}
		});

		$(".base").on("input", () => this.changeBase());
		$("input.choose").on("change", (evt) => this.chooseRacialBonus(evt.target));

		const races = this.raceData.map(x => ({name: x.name, source: x.source})).sort((a, b) => SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source));
		const options = races.map(it => `<option value="${it.name}_${it.source}">${it.name} ${it.source !== SRC_PHB ? `[${Parser.sourceJsonToAbv(it.source)}]` : ""}</option>`).join("");
		$("#race")
			.append(`<option value="">None</option>`)
			.append(`<option value="_CUSTOM">Custom</option>`)
			.append(options)
			.change(() => this.changeRace())
			.change();
	}

	renderCostsTable () {
		$(`.pbuy__add_row_btn_wrap`).remove();
		const $table = $(`#costs`);
		$table.empty().append(`
			<thead>
				<tr>
					<th class="col-4 pbuy__adv-col-3">Score</th>
					<th class="col-4 pbuy__adv-col-3">Modifier</th>
					<th class="col-4 pbuy__adv-col-3">Point Cost</th>
					<th class="col-3 pbuy__adv--visible"></th>
				</tr>
			</thead>
		`);
		const $tbody = $(`<tbody/>`).appendTo($table);

		const renderState = (isAdvanced) => {
			const state = isAdvanced ? this.savedState : StatGen.DEFAULT_COSTS;
			const keys = Object.keys(state).map(Number).sort(SortUtil.ascSort);
			for (let i = 0; i < keys.length; ++i) {
				const k = keys[i]; const v = state[k];

				const $row = $(`
					<tr${isAdvanced ? ` class="pbuy__tbl_row"` : ""}>
						<td>${k}</td>
						<td>${Parser.getAbilityModifier(Number(k))}</td>
						<td>
							<span class="pbuy__adv--hidden">${v}</span>
							<span class="pbuy__wrp_cost_ipt pbuy__adv--visible"/>
						</td>
						<td class="pbuy__adv--visible"/>
					</tr>
				`).appendTo($tbody);

				$(`<input value="${v}" type="number">`).on("change", (evt) => {
					state[k] = Number(evt.target.value);
					this.doSaveDebounced();
					this.handleCostChanges();
				}).appendTo($row.find(`.pbuy__wrp_cost_ipt`));

				if (isAdvanced && (i === 0 || i === keys.length - 1) && keys.length > 1) {
					const $btnRm = $(`<button class="btn btn-xs btn-danger"><span class="glyphicon glyphicon-remove"></span></button>`).click(() => {
						delete state[k];
						this.doSaveDebounced();

						this.renderCostsTable();
						this.handleCostChanges();
					});
					$(`<div class="pbuy__wrp-btn-rem">`).append($btnRm).appendTo($row.find(`td`).last());
				}
			}
		};

		if (this.isAdvanced) {
			renderState(true);

			const $wrpBtnsTop = $(`<div class="pbuy__add_row_btn_wrap"/>`).insertBefore($table);

			const $btnAddLow = $(`<button class="btn btn-xs btn-primary" style="margin-right: 7px;">Add Lower Score</button>`)
				.click(() => {
					const lowest = Object.keys(this.savedState).map(Number).sort(SortUtil.ascSort)[0];
					if (lowest === 0) {
						return JqueryUtil.doToast({
							content: "Can't go any lower!",
							type: "danger",
						});
					}

					this.savedState[lowest - 1] = this.savedState[lowest];
					this.doSaveDebounced();

					this.renderCostsTable();
				}).appendTo($wrpBtnsTop);

			const $btnAddHigh = $(`<button class="btn btn-xs btn-primary" style="margin-right: 14px;">Add Higher Score</button>`)
				.click(() => {
					const highest = Object.keys(this.savedState).map(Number).sort(SortUtil.ascSort).reverse()[0];

					this.savedState[highest + 1] = this.savedState[highest];
					this.doSaveDebounced();

					this.renderCostsTable();
				}).appendTo($wrpBtnsTop);

			const $btnReset = $(`<button class="btn btn-xs btn-default">Reset</button>`)
				.click(() => {
					this.savedState = MiscUtil.copy(StatGen.DEFAULT_COSTS);
					this.budget = StatGen.DEFAULT_POINTS;
					this.$budget.val(this.budget);
					this.doSaveDebounced();

					this.renderCostsTable();
					this.handleCostChanges();
				}).appendTo($wrpBtnsTop);
		} else renderState();
	}

	initialiseChangeHandlers () {
		$(`.base`).each((i, ele) => {
			const $ipt = $(ele);
			$ipt.on("change", (evt) => {
				const ele = evt.target;
				let num = parseInt(ele.value);

				if (isNaN(num)) ele.value = this.statMin;
				else ele.value = this.limit(num);

				this.changeTotal();
			})
		});

		$(`.pbuy__user_add`).each((i, ele) => {
			const $ipt = $(ele);
			$ipt.on("change", (evt) => {
				const ele = evt.target;
				let num = parseInt(ele.value);

				if (isNaN(num)) ele.value = 0;

				this.changeTotal();
			})
		});

		this.$budget.on("change", () => {
			this.changeBase();
			if (this.isAdvanced) {
				this.budget = Number(this.$budget.val());
				this.doSaveDebounced();
			}
		});
	}

	limit (num) {
		return Math.max(Math.min(num, this.statMax), this.statMin)
	}

	get statMin () {
		if (this.isAdvanced) {
			return Object.keys(this.savedState).map(Number).sort(SortUtil.ascSort)[0];
		} else {
			return StatGen.DEFAULT_MIN;
		}
	}

	get statMax () {
		if (this.isAdvanced) {
			return Object.keys(this.savedState).map(Number).sort(SortUtil.ascSort).reverse()[0];
		} else {
			return StatGen.DEFAULT_MAX;
		}
	}

	getPointBuyCost (n) {
		if (this.isAdvanced) {
			return this.savedState[n];
		} else {
			return StatGen.DEFAULT_COSTS[n];
		}
	}

	chooseRacialBonus (ele, updateTotal = true) {
		if (this.raceChoiceAmount == null) return;
		if ($("input.choose:checked").length > this.raceChoiceCount) return ele.checked = false;

		const baseStat = this.raceStats[$(ele).closest("tr").attr("id")] || 0;
		$(".racial", $(ele).closest("tr"))
			.val(ele.checked ? baseStat + this.raceChoiceAmount : baseStat);
		if (updateTotal) this.changeTotal();
	}

	changeRace () {
		const handleStats = (stats) => {
			$(".racial").val(0);
			Object.keys(stats).forEach(key => $(`#${key} .racial`).val(stats[key]));

			this.changeTotal();
			const $chooseHead = $("td.choose_head").hide();
			$(".choose").hide().prop("checked", false);
			$(".pbuy__choose_dummy").hide();

			// TODO this only handles the most basic "choose" format
			if (!stats.choose || !stats.choose.from) {
				this.raceChoiceAmount = null;
				this.raceChoiceCount = null;
				return;
			}

			this.raceStats = stats;
			const {from} = stats.choose;
			this.raceChoiceAmount = stats.choose.amount || 1;
			this.raceChoiceCount = stats.choose.count;

			$chooseHead.text(`Choose ${this.raceChoiceCount}`).show();
			Parser.ABIL_ABVS.forEach(abi => $(`#${abi} .${from.includes(abi) ? "choose" : "pbuy__choose_dummy"}`).show());
		};

		const race = $(`#race`).val();
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
				: this.raceData.find(({name, source}) => `${name}_${source}` === race).ability[0];
			handleStats(stats);
		}
	}

	getCostAndBudget () {
		const budget = Number(this.$budget.val());
		let cost = 0;
		$(".base").each((i, el) => cost += this.getPointBuyCost(this.limit(Number(el.value))));
		return {cost, budget};
	}

	checkBudget (costBudget) {
		if (!costBudget) costBudget = this.getCostAndBudget();
		$(`#remaining`).toggleClass("form-control--error", costBudget.cost > costBudget.budget);
	}

	changeBase () {
		const constBudget = this.getCostAndBudget();
		$("#remaining").val(constBudget.budget - constBudget.cost);
		this.checkBudget(constBudget);

		this.changeTotal();
	}

	changeTotal () {
		$("#pointbuy tr[id]").each((i, el) => {
			const [base, racial, user, total, mod] = $(`input[data-select="number"]`, el).get();
			const raw = total.value = Number(base.value) + Number(racial.value) + Number(user.value);
			const modValue = Math.floor((raw - 10) / 2);
			mod.value = modValue >= 0 ? `+${modValue}` : modValue;
		});

		this.doSaveDebounced();
	}

	rollStats () {
		const formula = $(`#stats-formula`).val();

		const tree = Renderer.dice.lang.getTree3(formula);

		const $rolled = $("#rolled");
		if (!tree) {
			$rolled.find("#rolls").prepend(`<p>Invalid dice formula!</p>`)
		} else {
			const rolls = [];
			for (let i = 0; i < 6; i++) {
				const meta = {};
				meta.__total = tree.evl(meta);
				rolls.push(meta);
			}
			rolls.sort((a, b) => SortUtil.ascSort(b.__total, a.__total));

			$rolled.find("#rolls").prepend(`<p class="stat-roll-line">${rolls.map(r => `<span class="stat-roll-item" title="${r.text}">${r.__total}</span>`).join("")}</p>`);
		}
		$rolled.find("#rolls p:eq(15)").remove();
	}

	get isAdvanced () {
		return this.$advanced.prop("checked");
	}
}
StatGen.DEFAULT_COSTS = {
	8: 0,
	9: 1,
	10: 2,
	11: 3,
	12: 4,
	13: 5,
	14: 7,
	15: 9,
};
StatGen.DEFAULT_MIN = 8;
StatGen.DEFAULT_MAX = 15;
StatGen.DEFAULT_POINTS = 27;

const statGen = new StatGen();

window.addEventListener("load", async () => {
	await statGen.init();
	hashchange();

	window.dispatchEvent(new Event("toolsLoaded"));
});

function hashchange () {
	const VALID_HASHES = [
		"rolled",
		"array",
		"pointbuy",
	];

	ExcludeUtil.pInitialise(); // don't await, as this is only used for search

	let hash = (window.location.hash.slice(1) || "").trim().toLowerCase();
	const mode = (hash.split(HASH_PART_SEP) || [""])[0];
	$(".statmethod").hide();
	if (!VALID_HASHES.includes(mode)) {
		window.history.replaceState(
			{},
			document.title,
			`${location.origin}${location.pathname}#rolled`,
		);
		hashchange();
	} else {
		$(`#${mode}`).show();
		if (statGen.isInit) statGen.doLoadUrlState();
	}
}

window.onhashchange = hashchange;
