"use strict";

/**
 * The API is as follows:
 * - render()
 * - getValues()
 * - addEventListener(type, listener, useCapture)
 * - reset()
 * - deselectIf(func, Filter.header)
 *
 * See the docs for each function for full explanations.
 */
class FilterBox {
	static getSelectedSources () {
		const parsed = StorageUtil.getForPage(FilterBox._STORAGE_NAME);
		if (parsed) {
			const sources = parsed[FilterBox.SOURCE_HEADER];
			if (sources) {
				const totals = sources._totals;
				delete sources._totals;
				if (totals.yes || totals.no) {
					if (totals.yes) {
						// if any are green, return only these
						return Object.keys(sources).filter(k => sources[k] === 1)
					}
					if (totals.no) {
						// otherwise, if we have any white, return these
						return Object.keys(sources).filter(k => sources[k] !== -1)
					}
				} else {
					// need to load all sources
					return Object.keys(sources);
				}
				return null;
			} else {
				return null;
			}
		}
		return null;
	}

	/**
	 * A FilterBox which sits in the search bar. See the Spells or Psionics page for a live example. Allows selection
	 * of multiple sources/spell schools/item types/etc.
	 *
	 * @param inputGroup the search bar DOM element to add the button to
	 * @param resetButton element to bind a reset-on-click to
	 * @param filterList a list of `Filter` objects to build the menus from
	 */
	constructor (inputGroup, resetButton, filterList) {
		this.inputGroup = inputGroup;
		this.resetButton = resetButton;
		this.filterList = filterList;

		this.headers = {};
		this.multiHeaders = {};
		this.$disabledOverlay = $(`<div class="homebrew-overlay"/>`);

		this.storedValues = StorageUtil.getForPage(FilterBox._STORAGE_NAME);
		this.storedVisible = StorageUtil.getForPage(FilterBox._STORAGE_NAME_VISIBLE);
		this.storedGroupState = StorageUtil.getForPage(FilterBox._STORAGE_NAME_GROUP_STATE);
		this.storedNestState = StorageUtil.getForPage(FilterBox._STORAGE_NAME_NEST_STATE);
		this.$rendered = [];
		this.dropdownVisible = false;
		this.modeAndOr = "AND";
		this.$txtCount = $(`<span style="margin-left: auto"/>`);
	}

	/**
	 * Render the "Filters" button in the inputGroup
	 */
	render () {
		const firstRender = this.$rendered.length === 0 || History.initialLoad;
		// save the current values to re-apply if we're re-rendering
		const curValues = firstRender ? null : this.getValues();
		const curVisible = firstRender ? null : this._getVisible();
		const curGroupState = firstRender ? null : this._getGroupState();
		const curNestState = firstRender ? null : this._getNestState();
		// remove any previously rendered elements
		this._wipeRendered();

		const $body = $(`body`);
		this.$list = $(`#listcontainer`).find(`.list`);

		const $filterButton = getFilterButton();
		this.$miniView = $(`<div class="mini-view btn-group"/>`);
		const $inputGroup = $(this.inputGroup);

		const $outer = $(`<div class="dropdown-menu ${FilterBox.CLS_DROPDOWN_MENU_FILTER} homebrew-window">
			<h4 class="title">
				<span>Filters</span>
				<div>
					<div class="btn-group">
						<div id="fltr-show-all" class="btn btn-xs btn-default">Show All</div>
						<div id="fltr-hide-all" class="btn btn-xs btn-default">Hide All</div>
					</div>
					<div id="fltr-reset" class="btn btn-xs btn-default">Reset</div>
				</div>
			</h4>
			<hr>
		</div>`).hide();

		this._showAll = () => {
			const $btns = $outer.find(`.show-hide-button`);
			$btns.each((i, e) => {
				if ($(e).text() === "Show") $(e).click();
			});
		};
		this._hideAll = () => {
			const $btns = $outer.find(`.show-hide-button`);
			$btns.each((i, e) => {
				if ($(e).text() === "Hide") $(e).click();
			});
		};
		$outer.find(`#fltr-show-all`).click(() => this.showAll());
		$outer.find(`#fltr-hide-all`).click(() => this.hideAll());
		$outer.find(`#fltr-reset`).click((evt) => this.reset(evt.shiftKey));

		const self = this;
		const $hdrLine = $(`<li class="filter-item"/>`);
		const $hdrLineInner = $(`<div class="h-wrap"/>`).appendTo($hdrLine);
		if (this.filterList.length > 1) {
			const $btnAndOr = $(`<button class="btn btn-default btn-xs" style="width: 3em;">${this.modeAndOr}</button>`)
				.data("andor", this.modeAndOr)
				.on(EVNT_CLICK, () => {
					const nxt = $btnAndOr.data("andor") === "OR" ? "AND" : "OR";
					self.modeAndOr = nxt;
					$btnAndOr.text(nxt);
					$btnAndOr.data("andor", nxt);
				});
			$hdrLineInner.append(`Combine filters as... `).append(`<div style="display: inline-block; width: 10px;"/>`).append($btnAndOr);
		}
		$hdrLineInner.append(this.$txtCount);
		if (!this.filterList[0].minimalUI) $outer.append($hdrLine).append(makeDivider());
		for (let i = 0; i < this.filterList.length; ++i) {
			$outer.append(makeOuterItem(this, i, this.filterList[i], this.$miniView));
			if (i < this.filterList.length - 1) $outer.append(makeDivider());
		}
		$inputGroup.prepend($filterButton);
		this.$rendered.push($filterButton);
		this.$disabledOverlay.append($outer);
		this.$rendered.push($outer);
		$inputGroup.after(this.$miniView);
		this.$rendered.push(this.$miniView);

		addShowHideHandlers(this);

		const addResetHandler = () => {
			if (this.resetButton !== null && this.resetButton !== undefined) {
				const $btnReset = $(this.resetButton);
				$btnReset.attr("title", "Reset filters. SHIFT to reset Show/Hide.");
				this.resetButton.addEventListener("click", (evt) => this.reset(evt.shiftKey));
			}
		};

		const addSaveHandler = () => {
			window.addEventListener("beforeunload", () => {
				const state = this.getValues();
				StorageUtil.setForPage(FilterBox._STORAGE_NAME, state);
				const display = this._getVisible();
				StorageUtil.setForPage(FilterBox._STORAGE_NAME_VISIBLE, display);
				const groupState = this._getGroupState();
				StorageUtil.setForPage(FilterBox._STORAGE_NAME_GROUP_STATE, groupState);
				const nestState = this._getNestState();
				StorageUtil.setForPage(FilterBox._STORAGE_NAME_NEST_STATE, nestState);
			});
		};

		if (firstRender) {
			addResetHandler();
			addSaveHandler();
		}

		if (this.dropdownVisible) $filterButton.find("button").click();

		function getFilterButton () {
			const $buttonWrapper = $(`<div id="filter-toggle-btn"/>`);
			$buttonWrapper.addClass(FilterBox.CLS_INPUT_GROUP_BUTTON);

			const $filterButton = $(`<button class="btn btn-default btn-filter">Filter</span></button>`);
			$buttonWrapper.append($filterButton);
			return $buttonWrapper;
		}

		function makeOuterItem (self, idx, filter, $miniView, namePrefix, parent) {
			if (filter instanceof MultiFilter) {
				filter.eles = [];
				const $parent = $(`<div class="wrp-multifilter ${filter.compact ? "wrp-multi-compact" : ""}"/>`);

				const getChildren = () => filter.filters.map(it => self.headers[it.header]);

				const $hdrCompact = $(`<div class="multi-compact-visible-f split">
						<div>${filter.categoryName} <span class="group-comb-toggle text-muted">(group ${filter.mode.toUpperCase()})</span></div>
					</div>`).appendTo($parent);
				const $btnToggleComb = $hdrCompact.find(`.group-comb-toggle`);
				const setCombineAnd = () => {
					filter.setModeAnd();
					$btnToggleComb.text("(group AND)");
					getChildren().forEach(ch => ch.ele.data("handleUpdateCombiner")(filter.mode));
				};
				const setCombineOr = () => {
					filter.setModeOr();
					$btnToggleComb.text("(group OR)");
					getChildren().forEach(ch => ch.ele.data("handleUpdateCombiner")(filter.mode));
				};
				$hdrCompact.find(`.group-comb-toggle`).click(() => {
					if ($btnToggleComb.text() === "(group AND)") setCombineOr();
					else setCombineAnd();
				});

				const $wrpButtons = $(`<div/>`).appendTo($hdrCompact);
				const $groupSummary = $(`<span class="summary" style="margin-right: 5px;">`).appendTo($wrpButtons);
				const $groupSummaryVal = $(`<span class="filtering" title="Hidden active filters"/>`).appendTo($groupSummary);
				const updateSummary = () => {
					const numFiltering = getChildren().filter(it => {
						return it.ele.data("isFiltering")();
					}).length;
					$groupSummaryVal.text(numFiltering);
					numFiltering ? $groupSummary.show() : $groupSummary.hide();
				};
				$(`<button class="btn btn-default btn-xs multi-compact-visible btn-meta" style="border-radius: 3px;">Reset</button>`)
					.appendTo($wrpButtons)
					.click(() => {
						filter.eles.forEach($e => $e.data("resetValues")());
					});
				const $btnShowHideGroup = $(`<button class="btn btn-default btn-xs show-hide-button multi-compact-visible btn-meta" style="margin-left: 5px;">Hide</button>`)
					.appendTo($wrpButtons)
					.click(function () {
						const $this = $(this);
						if ($this.text() === "Hide") {
							filter.eles.forEach($e => $e.data("hideFilter")());
							$this.text("Show");
						} else {
							filter.eles.forEach($e => $e.data("showFilter")());
							$this.text("Hide");
						}
						updateSummary();
					});

				filter.filters.forEach((child, i) => {
					const $ch = makeOuterItem(self, i, child, $miniView, filter.categoryName, filter);
					$parent.append($ch);
				});

				const numHidden = filter.filters.map(it => it.header).filter(it => {
					if (curVisible) {
						return curVisible[it] === false
					} else if (self.storedVisible) {
						return self.storedVisible[it] === false;
					}
				}).length;
				if (numHidden) $btnShowHideGroup.text("Show");
				updateSummary();

				$parent.data(
					"resetCombiner",
					function () {
						filter._originalMode === "or" ? setCombineOr() : setCombineAnd();
					}
				);

				$parent.data(
					"setCombiner",
					function (mode) {
						mode === "or" ? setCombineOr() : setCombineAnd();
					}
				);

				if (curGroupState) {
					const state = curGroupState[filter.categoryName];
					if (state && state.mode) {
						$parent.data("setCombiner")(state.mode);
					}
				} else if (self.storedGroupState) {
					const state = self.storedGroupState[filter.categoryName];
					if (state && state.mode) {
						$parent.data("setCombiner")(state.mode);
					}
				}

				filter.$ele = $parent;
				self.multiHeaders[filter.categoryName] = {ele: $parent, filter: filter};
				return $parent;
			} else if (filter instanceof RangeFilter) {
				const $outI = $(`<li class="filter-item"/>`);

				self.headers[filter.header] = {outer: $outI, filter: filter};
				const $wrpSlider = makeSliderWrapper(filter.header);
				self.headers[filter.header].ele = $wrpSlider;
				if (parent) parent.eles.push($wrpSlider);

				const $headerLine = makeSliderHeaderLine(idx, $wrpSlider);
				self.headers[filter.header].$header = $headerLine;

				$outI.append($headerLine);
				$outI.append($wrpSlider);

				return $outI;
			} else if (filter instanceof GroupedFilter || filter instanceof Filter) {
				const isGrouped = filter instanceof GroupedFilter;
				const $outI = $(`<li class="filter-item"/>`);

				self.headers[filter.header] = {outer: $outI, filter: filter};
				const $grid = makePillGrid(isGrouped);
				self.headers[filter.header].ele = $grid;
				if (parent) parent.eles.push($grid);

				const $headerLine = makeHeaderLine(idx, $grid);
				self.headers[filter.header].$header = $headerLine;

				$outI.append($headerLine);
				$outI.append($grid);

				return $outI;
			}

			function _addGroupLabel (idx, $line) {
				$(`
					<div class="multi-compact-hidden">${namePrefix ? `<span class="text-muted">${namePrefix} <span class="group-comb-toggle">(group ${parent.mode.toUpperCase()})</span>: </span>` : ""}<span>${filter.header}</span></div>
				`).appendTo($line);

				$line.find(`.group-comb-toggle`).click(function () {
					const $this = $(this);
					if ($this.text() === "(group AND)") {
						parent.$ele.data("setCombiner")("or");
					} else {
						parent.$ele.data("setCombiner")("and");
					}
				});
			}

			function makeHeaderLine (idx, $grid) {
				const minimalClass = filter.minimalUI ? "filter-minimal" : "";
				const $line = $(`<div class="h-wrap ${minimalClass} multi-compact-hidden"/>`);
				_addGroupLabel(idx, $line);

				function makeAndOrBtn (defState, tooltip) {
					const $btn = $(` <button class="btn btn-default btn-xs ${minimalClass} btn-meta" style="width: 3em;" title="${tooltip}">${defState}</button>`)
						.data("andor", defState);
					return $btn
						.on(EVNT_CLICK, () => {
							const nxt = $btn.data("andor") === "OR" ? "AND" : "OR";
							$btn.data("andor", nxt);
							$btn.text(nxt);
						});
				}

				const $btnAndOrBlue = makeAndOrBtn("OR", "Positive matches mode for this filter. AND requires all blues to match, OR requires at least one blue to match.");
				self.headers[filter.header].getAndOrBlue = () => {
					return $btnAndOrBlue.data("andor");
				};
				const $btnAndOrRed = makeAndOrBtn("OR", "Negative match mode for this filter. AND requires all reds to match, OR requires at least one red to match.");
				self.headers[filter.header].getAndOrRed = () => {
					return $btnAndOrRed.data("andor");
				};

				const $quickBtns = $(`<span class="btn-group quick-btns" style="margin-left: auto;"/>`).appendTo($line);
				const $all = $(`<button class="btn btn-default btn-xs btn-meta ${minimalClass}">All</button>`).appendTo($quickBtns);
				const $clear = $(`<button class="btn btn-default btn-xs btn-meta ${minimalClass}">Clear</button>`).appendTo($quickBtns);
				const $none = $(`<button class="btn btn-default btn-xs btn-meta ${minimalClass}">None</button>`).appendTo($quickBtns);
				const $default = $(`<button class="btn btn-default btn-xs btn-meta ${minimalClass}">Default</button>`).appendTo($quickBtns);

				const $summary = $(`<span class="summary"/>`).appendTo($line);
				const $summaryInclude = $(`<span class="filter__summary_item filter__summary_item--include" title="Hidden includes"/>`).appendTo($summary);
				const $summarySpacer = $(`<span class="filter__summary_item_spacer"/>`).appendTo($summary);
				const $summaryExclude = $(`<span class="filter__summary_item filter__summary_item--exclude" title="Hidden excludes"/>`).appendTo($summary);
				$summary.hide();

				const $logicBtns = $(`<span class="btn-group andor-btns" style="margin-left: 5px;"/>`).append($btnAndOrBlue).append($btnAndOrRed).appendTo($line);

				const $showHide = $(`<button class="btn btn-default btn-xs btn-meta show-hide-button ${minimalClass}" style="margin-left: 5px;">Hide</button>`).appendTo($line);

				const doShow = () => {
					$showHide.text("Hide");
					$grid.show();
					$quickBtns.show();
					$logicBtns.css("margin-left", "5px");
					$summary.hide();
				};
				const doHide = () => {
					$showHide.text("Show");
					$grid.hide();
					$quickBtns.hide();
					$logicBtns.css("margin-left", "auto");
					const counts = $grid.data("getCounts")();
					if (counts.yes > 0 || counts.no > 0) {
						if (counts.yes > 0) {
							$summaryInclude.prop("title", `${counts.yes} hidden 'required' tag${counts.yes > 1 ? "s" : ""}`);
							$summaryInclude.text(counts.yes);
							$summaryInclude.show();
						} else {
							$summaryInclude.hide();
						}
						if (counts.yes > 0 && counts.no > 0) {
							$summarySpacer.show();
						} else {
							$summarySpacer.hide();
						}
						if (counts.no > 0) {
							$summaryExclude.prop("title", `${counts.no} hidden 'excluded' tag${counts.no > 1 ? "s" : ""}`);
							$summaryExclude.text(counts.no);
							$summaryExclude.show();
						} else {
							$summaryExclude.hide();
						}
						$logicBtns.css("margin-left", "5px");
						$summary.show();
					} else {
						$logicBtns.css("margin-left", "auto");
					}
				};
				$grid.data("showFilter", doShow);
				$grid.data("hideFilter", doHide);

				if (curVisible && curVisible[filter.header] === false) doHide();
				else if (self.storedVisible && self.storedVisible[filter.header] === false) doHide();

				$showHide.on(EVNT_CLICK, function () {
					if ($grid.is(":hidden")) {
						doShow();
					} else {
						doHide();
					}
				});

				$none.on(EVNT_CLICK, function () {
					$grid.find(".filter-pill").each(function () {
						$(this).data("setter")(FilterBox._PILL_STATES[2]);
					});
					if ($grid.data("doUpdateNestSummary")) $grid.data("doUpdateNestSummary")();
				});

				$all.on(EVNT_CLICK, function () {
					$grid.find(".filter-pill").each(function () {
						$(this).data("setter")(FilterBox._PILL_STATES[1]);
					});
					if ($grid.data("doUpdateNestSummary")) $grid.data("doUpdateNestSummary")();
				});

				$clear.on(EVNT_CLICK, function () {
					$grid.find(".filter-pill").each(function () {
						$(this).data("setter")(FilterBox._PILL_STATES[0]);
					});
					if ($grid.data("doUpdateNestSummary")) $grid.data("doUpdateNestSummary")();
				});

				$default.on(EVNT_CLICK, function () {
					self._reset(filter.header);
					if ($grid.data("doUpdateNestSummary")) $grid.data("doUpdateNestSummary")();
				});

				return $line;
			}

			function makePillGrid (isGrouped) {
				const $pills = [];
				const $grid = $(`<div class="pill-grid"/>`);
				const $subGrids = [];
				const $subGridDividers = [];
				let gridIndex = 0;

				function addDivider () {
					const $hr = $(`<hr class="pill-grid-subs-divider">`).appendTo($grid);
					$subGridDividers.push($hr);
				}

				function addGroup (bump) {
					if (bump) {
						filter.numGroups++;
						addDivider();
					}
					$subGrids[gridIndex] = $(`<div class="pill-grid-sub"/>`).appendTo($grid);
					if (gridIndex + 1 < filter.numGroups) addDivider();
					if (bump) gridIndex++;
				}

				function cycleState ($pill, $miniPill, forward) {
					const curIndex = FilterBox._PILL_STATES.indexOf($pill.attr("state"));

					let newIndex = forward ? curIndex + 1 : curIndex - 1;
					if (newIndex >= FilterBox._PILL_STATES.length) newIndex = 0;
					else if (newIndex < 0) newIndex = FilterBox._PILL_STATES.length - 1;
					$pill.attr("state", FilterBox._PILL_STATES[newIndex]);
					$miniPill.attr("state", FilterBox._PILL_STATES[newIndex]);
				}

				const nests = {};
				const nested = filter.items.filter(it => it instanceof FilterItem && it.nest).map(it => ({nest: it.nest, nestHidden: !!it.nestHidden})).sort((a, b) => SortUtil.ascSortLower(a.nest, b.nest));
				let updateNestStats = null;
				if (nested.length) {
					const $subGrid = $(`<div class="pill-grid-sub"/>`).appendTo($grid);
					nested.forEach(nestObj => {
						const nest = nestObj.nest
						if (!nests[nest]) {
							const $nest = $(`<div class="filter__btn_nest">${nest} [${nestObj.nestHidden ? "\u2212" : "+"}]</div>`).click(() => {
								$nest.html($nest.html().replace(/\[[\u2212+]]$/, (it) => it === "[+]" ? "[\u2212]" : "[+]"))
								const self = nests[nest];
								self.$children.forEach($e => $e.toggle());
								$subGrids.forEach(($sg, i) => {
									$subGridDividers[i].toggle(!!$sg.find(`.filter-pill:visible`).length);
								});
								updateNestStats();
							}).appendTo($grid);

							nests[nest] = {
								_key: nest,
								$nest,
								$children: [],
								nestHidden: nestObj.nestHidden
							};

							$subGrid.append($nest);
						}
					});

					const $nestStats = $(`<div class="filter__summary_nest"/>`).appendTo($subGrid);

					updateNestStats = () => {
						let hiddenHigh = 0;
						let hiddenLow = 0;
						Object.keys(nests).forEach(k => {
							const nest = nests[k];
							const nestStats = {high: 0, low: 0, total: 0};

							nest.$children.forEach($c => {
								const state = $c.attr("state");
								nestStats.total++;

								if (state === FilterBox._PILL_STATES[1]) {
									if ($c.is(":hidden")) {
										hiddenHigh++;
										nestStats.high++;
									}
								} else if (state === FilterBox._PILL_STATES[2]) {
									if ($c.is(":hidden")) {
										hiddenLow++;
										nestStats.low++;
									}
								}
							});

							const allHigh = nestStats.total === nestStats.high;
							const allLow = nestStats.total === nestStats.low
							nest.$nest.toggleClass("filter__btn_nest--include-all", allHigh)
								.toggleClass("filter__btn_nest--exclude-all", allLow)
								.toggleClass("filter__btn_nest--include", !!(!allHigh && !allLow && nestStats.high && !nestStats.low))
								.toggleClass("filter__btn_nest--exclude", !!(!allHigh && !allLow && !nestStats.high && nestStats.low))
								.toggleClass("filter__btn_nest--both", !!(!allHigh && !allLow && nestStats.high && nestStats.low));
						});

						$nestStats.html(`
							${hiddenHigh ? `<span class="filter__summary_item filter__summary_item--include" title="${hiddenHigh} hidden 'required' tag${hiddenHigh === 1 ? "" : "s"}">${hiddenHigh}</span>` : ""}
							${hiddenHigh && hiddenLow ? `<span class="filter__summary_item_spacer"></span>` : ""}
							${hiddenLow ? `<span class="filter__summary_item filter__summary_item--exclude" title="${hiddenLow} hidden 'excluded' tag${hiddenHigh === 1 ? "" : "s"}">${hiddenLow}</span>` : ""}
						`);
					};

					$grid.data("doUpdateNestSummary", updateNestStats);

					addDivider();
					self.headers[filter.header].getNestVisibility = () => {
						const outObj = {};
						Object.values(nests).forEach(nObj => {
							const hidden = nObj.$nest.text().includes("[+]");
							outObj[nObj._key] = hidden;
						});
						return outObj;
					};
				}

				if (isGrouped) {
					$grid.addClass(`pill-grid-subs`);
					for (; gridIndex < filter.numGroups; ++gridIndex) addGroup();
				}

				for (const item of filter.items) {
					const iText = item instanceof FilterItem ? item.item : item;
					const iChangeFn = item instanceof FilterItem ? item.changeFn : null;
					const display = filter.displayFn ? filter.displayFn(item) : iText;

					const $pill = $(`<div class="filter-pill">${display}</div>`).data("value", iText).attr("state", FilterBox._PILL_STATES[0]);
					const $miniPill = $(`<div class="mini-pill">${display}</div>`).attr("state", FilterBox._PILL_STATES[0]);

					$miniPill.on(EVNT_CLICK, function () {
						$pill.attr("state", FilterBox._PILL_STATES[0]);
						$miniPill.attr("state", FilterBox._PILL_STATES[0]);
						handlePillChange(iText, iChangeFn, FilterBox._PILL_STATES[0]);
						self._fireValChangeEvent();
					});

					$pill.on(EVNT_CLICK, function () {
						cycleState($pill, $miniPill, true);
						handlePillChange(iText, iChangeFn, $pill.attr("state"));
					});

					$pill.on("contextmenu", function (e) {
						if (e.ctrlKey) return true;
						e.preventDefault();
						cycleState($pill, $miniPill, false);
						handlePillChange(iText, iChangeFn, $pill.attr("state"));
					});

					// bind getters and resetters
					$pill.data(
						"setter",
						function (toVal) {
							_setter($pill, $miniPill, toVal, iText, iChangeFn, false);
						}
					);
					$pill.data("resetter",
						function () {
							_resetter($pill, $miniPill, iText, iChangeFn, false);
						}
					);

					// If re-render, use previous values. Otherwise, if there's stored values, stored values. Otherwise, default the pills
					if (curValues) {
						let valNum = curValues[filter.header][iText];
						if (valNum < 0) valNum = 2;
						_setter($pill, $miniPill, FilterBox._PILL_STATES[valNum], iText, iChangeFn, true);
					} else if (self.storedValues && self.storedValues[filter.header] && self.storedValues[filter.header][iText] !== undefined) {
						let valNum = self.storedValues[filter.header][iText];
						if (valNum < 0) valNum = 2;
						_setter($pill, $miniPill, FilterBox._PILL_STATES[valNum], iText, iChangeFn, true);
					} else {
						_resetter($pill, $miniPill, iText, iChangeFn, true);
					}

					// add a class to mark any items that are default deselected (used to add visual difference)
					tagDefaults($miniPill, iText);

					const nest = item instanceof FilterItem ? item.nest : null;
					const handleNest = () => {
						if (nest) nests[nest].$children.push($pill);
					};

					if (isGrouped) {
						const group = Number(item instanceof FilterItem && item.group != null ? item.group : filter.groupFn(iText));
						while (group > $subGrids.length - 1) addGroup(true);
						handleNest();
						$subGrids[group].append($pill)
					} else {
						handleNest();
						$grid.append($pill);
					}

					$miniView.append($miniPill);
					$pills.push($pill);
				}

				Object.values(nests).forEach(nest => {
					if (curNestState) {
						const isHidden = MiscUtil.getProperty(curNestState, filter.header, nest._key);
						if (isHidden) nest.$nest.trigger("click");
					} else if (self.storedNestState) {
						const isHidden = MiscUtil.getProperty(self.storedNestState, filter.header, nest._key);
						if (isHidden) nest.$nest.trigger("click");
					} else if (nest.nestHidden) nest.$nest.trigger("click");
				});

				function tagDefaults ($miniPill, iText) {
					if (filter.deselFn && filter.deselFn(iText)) {
						$miniPill.addClass("default-desel");
					} else if (filter.selFn && filter.selFn(iText)) {
						$miniPill.addClass("default-sel");
					}
				}

				// allows silent (pill change function not triggered) sets
				function _setter ($pill, $miniPill, toVal, iText, iChangeFn, silent) {
					$pill.attr("state", toVal);
					$miniPill.attr("state", toVal);
					if (!silent) {
						handlePillChange(iText, iChangeFn, toVal);
					}
				}

				// allows silent (pill change function not triggered) resets
				function _resetter ($pill, $miniPill, iText, iChangeFn, silent) {
					if (filter.deselFn && filter.deselFn(iText)) {
						$pill.attr("state", "no");
						$miniPill.attr("state", "no");
					} else if (filter.selFn && filter.selFn(iText)) {
						$pill.attr("state", "yes");
						$miniPill.attr("state", "yes");
					} else {
						$pill.attr("state", "ignore");
						$miniPill.attr("state", "ignore");
					}
					if (!silent) {
						handlePillChange(iText, iChangeFn, $pill.attr("state"));
					}
				}

				function handlePillChange (iText, iChangeFn, val) {
					if (iChangeFn) {
						iChangeFn(iText, val);
					}
				}

				$grid.data(
					"getValues",
					function () {
						const out = {};
						const _totals = {yes: 0, no: 0, ignored: 0};
						$pills.forEach(function (p) {
							const state = p.attr("state");
							out[p.data("value")] = state === "yes" ? 1 : state === "no" ? -1 : 0;
							const countName = state === "yes" ? "yes" : state === "no" ? "no" : "ignored";
							_totals[countName] = _totals[countName] + 1;
						});
						out._totals = _totals;
						out._andOr = {
							blue: self.headers[filter.header].getAndOrBlue(),
							red: self.headers[filter.header].getAndOrRed()
						};
						return out;
					}
				);

				$grid.data(
					"isVisible",
					function () {
						return $grid.css("display") !== "none";
					}
				);

				$grid.data(
					"isFiltering",
					function () {
						const counts = $grid.data("getCounts")();
						return counts.yes || counts.no;
					}
				);

				$grid.data(
					"handleUpdateCombiner",
					function (mode) {
						if (parent) {
							self.headers[filter.header].$header.find(`.group-comb-toggle`).each((i, e) => {
								$(e).text(`(group ${mode.toUpperCase()})`);
							});
						}
					}
				);

				$grid.data(
					"setValues",
					function (toVal) {
						const toNo = toVal.filter(it => it[0] === "!").map(it => it.slice(1));
						const toYes = toVal.filter(it => it[0] !== "!");
						$pills.forEach((p) => {
							if (toYes.includes(String(p.data("value")).toLowerCase())) {
								$(p).data("setter")(FilterBox._PILL_STATES[1])
							} else if (toNo.includes(String(p.data("value")).toLowerCase())) {
								$(p).data("setter")(FilterBox._PILL_STATES[2])
							} else {
								$(p).data("setter")(FilterBox._PILL_STATES[0])
							}
						});
						if ($grid.data("doUpdateNestSummary")) $grid.data("doUpdateNestSummary")();
					}
				);

				$grid.data(
					"getCounts",
					function () {
						const out = {"yes": 0, "no": 0};
						$pills.forEach(function (p) {
							const state = p.attr("state");
							if (out[state] !== undefined) out[state] = out[state] + 1;
						});
						return out;
					}
				);

				$grid.data(
					"resetValues",
					function () {
						$pills.forEach(function (p) {
							p.data("resetter")();
						});
						if ($grid.data("doUpdateNestSummary")) $grid.data("doUpdateNestSummary")();
					}
				);

				return $grid;
			}

			function makeSliderHeaderLine (idx, $wrpSlide) {
				const $line = $(`<div class="h-wrap multi-compact-hidden"/>`);
				_addGroupLabel(idx, $line);

				const $quickBtns = $(`<span class="btn-group quick-btns" style="margin-left: auto;"/>`).appendTo($line);
				$(`<button class="btn btn-default btn-xs multi-compact-hidden btn-meta" style="border-radius: 3px;">Reset</button>`)
					.appendTo($quickBtns)
					.click(() => {
						$wrpSlide.data("resetValues")();
					});

				const $summary = $(`<span class="summary" style="margin-left: auto;"/>`).appendTo($line);
				const $summaryRange = $(`<span class="filter__summary_item filter__summary_item--include multi-compact-hidden" title="Selected range"/>`).appendTo($summary);
				$summary.hide();

				const $showHide = $(`<button class="btn btn-default btn-xs show-hide-button multi-compact-hidden btn-meta" style="margin-left: 5px;">Hide</button>`).appendTo($line);

				const doHide = () => {
					$showHide.text("Show");
					$wrpSlide.hide();
					$quickBtns.hide();
					const vals = $wrpSlide.data("getValues")();
					const dispMax = () => filter.labels ? filter.items[vals.max] : vals.max;
					const dispMin = () => filter.labels ? filter.items[vals.min] : vals.min;
					$summaryRange.text(vals.min === filter.min && vals.max === filter.max ? "" : vals.min === filter.min ? `≤ ${dispMax()}` : vals.max === filter.max ? `≥ ${dispMin()}` : `${dispMin()}-${dispMax()}`);
					$summary.show();
				};
				const doShow = () => {
					$showHide.text("Hide");
					$wrpSlide.show();
					$quickBtns.show();
					$summary.hide();
				};
				$wrpSlide.data("showFilter", doShow);
				$wrpSlide.data("hideFilter", doHide);

				if (curVisible && curVisible[filter.header] === false) doHide();
				else if (self.storedVisible && self.storedVisible[filter.header] === false) doHide();

				$showHide.on(EVNT_CLICK, function () {
					if ($wrpSlide.is(":hidden")) doShow();
					else doHide();
				});

				return $line;
			}

			function makeSliderWrapper () {
				const $wrp = $(`<div class="pill-grid"/>`);

				const $lblInline = $(`<div class="multi-compact-visible range-inline-label">${filter.header}</div>`).appendTo($wrp);
				const $sld = $(`<div class="filter-slider"/>`).appendTo($wrp);
				const subSliderOpts = {};
				if (filter.labels) {
					subSliderOpts.labels = filter.items
				}
				$sld.slider({
					min: filter.min,
					max: filter.max,
					range: true,
					values: [filter.min, filter.max]
				}).slider("pips", subSliderOpts).slider("float", subSliderOpts);
				filter.$slider = $sld;

				const $miniPillMin = $(`<div class="mini-pill" state="ignore"/>`);
				const $miniPillMax = $(`<div class="mini-pill" state="ignore"/>`);

				function checkUpdateMiniPills () {
					const [min, max] = $sld.slider("values");

					if (min === max) {
						$miniPillMin.attr("state", FilterBox._PILL_STATES[1]).text(`${filter.header} = ${filter.labels ? filter.items[min] : min}`);
						$miniPillMax.attr("state", FilterBox._PILL_STATES[0]);
					} else {
						if (min > filter.min) $miniPillMin.attr("state", FilterBox._PILL_STATES[1]).text(`${filter.header} ≥ ${filter.labels ? filter.items[min] : min}`);
						else $miniPillMin.attr("state", FilterBox._PILL_STATES[0]);

						if (max < filter.max) $miniPillMax.attr("state", FilterBox._PILL_STATES[1]).text(`${filter.header} ≤ ${filter.labels ? filter.items[max] : max}`);
						else $miniPillMax.attr("state", FilterBox._PILL_STATES[0]);
					}
				}

				$sld.slider().on("slidechange", checkUpdateMiniPills);

				$miniPillMin.on(EVNT_CLICK, function () {
					$miniPillMin.attr("state", FilterBox._PILL_STATES[0]);
					const [min, max] = $sld.slider("values");
					$sld.slider("values", [filter.min, max]);
					self._fireValChangeEvent();
				}).appendTo($miniView);
				$miniPillMax.on(EVNT_CLICK, function () {
					$miniPillMax.attr("state", FilterBox._PILL_STATES[0]);
					const [min, max] = $sld.slider("values");
					$sld.slider("values", [min, filter.max]);
					self._fireValChangeEvent();
				}).appendTo($miniView);

				$wrp.data(
					"resetValues",
					function () {
						$sld.slider("values", [filter.min, filter.max]);
						checkUpdateMiniPills();
					}
				);

				$wrp.data(
					"getValues",
					function () {
						const out = {};
						const [min, max] = $sld.slider("values");
						out.min = min;
						out.max = max;
						return out;
					}
				);

				$wrp.data(
					"isVisible",
					function () {
						return $wrp.css("display") !== "none";
					}
				);

				$wrp.data(
					"isFiltering",
					function () {
						const values = $wrp.data("getValues")();
						return values.min !== filter.min || values.max !== filter.max;
					}
				);

				$wrp.data(
					"handleUpdateCombiner",
					function (mode) {
						if (parent) {
							self.headers[filter.header].$header.find(`.group-comb-toggle`).each((i, e) => {
								$(e).text(`(group ${mode.toUpperCase()})`);
							});
						}
					}
				);

				$wrp.data(
					"setValues",
					function (toVal) {
						if (filter.labels) {
							const idxs = toVal.map(it => {
								const idx = filter.items.indexOf(it);
								return ~idx ? idx : 0;
							});
							const min = Math.min(...idxs);
							const max = Math.max(...idxs);
							$sld.slider("values", [min, max]);
						} else {
							const min = toVal.filter(it => it.startsWith("min")).map(it => it.slice(3));
							const max = toVal.filter(it => it.startsWith("max")).map(it => it.slice(3));
							$sld.slider(
								"values",
								[
									min.length ? Math.max(min[0], filter.min) : filter.min,
									max.length ? Math.min(max[0], filter.max) : filter.max
								]
							);
						}
						checkUpdateMiniPills();
					}
				);

				// If re-render, use previous values. Otherwise, if there's stored values, stored values. Otherwise, default the pills
				if (curValues) {
					const min = curValues[filter.header].min;
					const max = curValues[filter.header].max;
					$sld.slider("values", [min, max]);
					checkUpdateMiniPills();
				} else if (self.storedValues && self.storedValues[filter.header]) {
					const min = self.storedValues[filter.header].min || filter.min;
					const max = self.storedValues[filter.header].max || filter.max;
					$sld.slider("values", [min, max]);
					checkUpdateMiniPills();
				} else {
					$wrp.data("resetValues")();
				}

				return $wrp;
			}
		}

		function makeDivider () {
			return $(`<div class="pill-grid-divider"/>`);
		}

		function open (self) {
			$body.css("overflow", "hidden");
			self.$list.parent().append(self.$disabledOverlay);
			$outer.show();
			self.dropdownVisible = true;
		}

		function close (self) {
			$body.css("overflow", "");
			self.$disabledOverlay.detach();
			self.dropdownVisible = false;
			$outer.hide();
			// fire an event when the form is closed
			self._fireValChangeEvent();
		}

		function addShowHideHandlers (self) {
			// watch for the button changing to "open"
			const $filterToggleButton = $("#filter-toggle-btn");
			$filterToggleButton.click(() => {
				open(self);
			});

			self.$disabledOverlay.off("click").click(() => {
				close(self);
			});

			// squash events from the menu, otherwise the dropdown gets hidden when we click inside it
			$outer.on(EVNT_CLICK, function (e) {
				e.stopPropagation();
			});
		}
	}

	/**
	 * Get a map of {Filter.header: {map of Filter.items: <1/0/-1> representing the state
	 * to each pill}}
	 * Additionally, include an element per filter which gives the total of 1/0/-1 entries
	 * Note that 1 represents a "required" pill, 0 represents an "ignored" pill, and -1 respresents an "excluded"
	 * pill.
	 *
	 * @returns the map described above e.g.
	 *
	 * {
	 *  "Source": { "PHB": 1, "DMG": 0, "_totals": { "yes": 1, "no": 0, "ignored": 1 }, "_andOr": { "blue": "OR", "red": "AND" } },
	 *  "School": { "A": 0, "EV": -1, "_totals": { "yes": 0, "no": 1, "ignored": 1 }, "_andOr": { "blue": "AND", "red": "OR" } }
     * }
	 *
	 */
	getValues () {
		const outObj = {};
		for (const header in this.headers) {
			if (!this.headers.hasOwnProperty(header)) continue;
			outObj[header] = this.headers[header].ele.data("getValues")();
		}
		return outObj;
	}

	/**
	 * Returns the list of filters which are not hidden.
	 */
	_getVisible () {
		const outObj = {};
		Object.keys(this.headers).forEach(h => {
			outObj[h] = this.headers[h].ele.data("isVisible")();
		});
		return outObj;
	}

	_getGroupState () {
		const outObj = {};
		Object.keys(this.multiHeaders).forEach(catName => {
			outObj[catName] = {mode: this.multiHeaders[catName].filter.mode}
		});
		return outObj;
	}

	_getNestState () {
		const outObj = {};
		Object.keys(this.headers).forEach(h => {
			if (this.headers[h].getNestVisibility) outObj[h] = this.headers[h].getNestVisibility();
		});
		return outObj;
	}

	/**
	 * Convenience function to cleanly add event listeners
	 *
	 * @param type should probably always be `FilterBox.EVNT_VALCHANGE` which is fired when the values available
	 * from getValues() change
	 *
	 * @param listener A function to call when the event is fired. See JS addEventListener docs for more.
	 * @param useCapture See JS addEventListener docs.
	 */
	addEventListener (type, listener, useCapture) {
		this.inputGroup.addEventListener(type, listener, useCapture)
	}

	/**
	 * Reset the selected filters to default, applying any `selFn` and `deselFn` functions from the filters
	 * @param showAll True if all filters should be set to Showing
	 */
	reset (showAll) {
		Object.keys(this.headers).forEach(header => this._reset(header));
		Object.values(this.multiHeaders).forEach(it => it.ele.data("resetCombiner")());
		if (showAll) this.showAll();
		this._fireValChangeEvent();
	}

	/**
	 * Show all filters. Requires the filter to have been rendered.
	 */
	showAll () {
		if (this._showAll) this._showAll();
	}

	/**
	 * Hide all filters. Requires the filter to have been rendered.
	 */
	hideAll () {
		if (this._hideAll) this._hideAll();
	}

	setFromSubHashes (subHashes) {
		const unpacked = {};
		subHashes.forEach(s => Object.assign(unpacked, UrlUtil.unpackSubHash(s, true)));
		const toMatch = {};
		Object.keys(this.headers).forEach(hk => {
			toMatch[hk.toLowerCase()] = this.headers[hk];
		});
		const consumed = new Set();
		const consumedClean = new Set();
		Object.keys(unpacked)
			.filter(k => k.startsWith(FilterBox._SUB_HASH_PREFIX))
			.forEach(rawSubhash => {
				const header = rawSubhash.substring(6);

				if (toMatch[header]) {
					consumed.add(rawSubhash);
					consumedClean.add(header);
					toMatch[header].ele.data("setValues")(unpacked[rawSubhash])
				} else {
					throw new Error(`Could not find filter with header ${header} for subhash ${rawSubhash}`)
				}
			});

		if (consumed.size) {
			// reset any other fields
			Object.keys(toMatch)
				.filter(k => !consumedClean.has(k))
				.forEach(k => {
					toMatch[k].ele.data("resetValues")();
				});

			const [link, ...sub] = History._getHashParts();

			const outSub = [];
			Object.keys(unpacked)
				.filter(k => !consumed.has(k))
				.forEach(k => {
					outSub.push(`${k}${HASH_SUB_KV_SEP}${unpacked[k].join(HASH_SUB_LIST_SEP)}`)
				});

			History.setSuppressHistory(true);
			window.location.hash = `#${link}${outSub.length ? `${HASH_PART_SEP}${outSub.join(HASH_PART_SEP)}` : ""}`;

			this._fireValChangeEvent();
		}
	}

	setFromValues (values) {
		Object.keys(this.headers).forEach(hk => {
			if (values[hk]) {
				const cur = this.headers[hk];
				const toSet = values[hk];
				cur.ele.data("setValues")(toSet)
			}
		});
	}

	getAsSubHashes () {
		const cur = this.getValues();
		const out = {};

		Object.keys(cur).forEach(name => {
			const vals = cur[name];
			const filter = this.headers[name].filter;
			let isDefault = true;
			if (filter.selFn || filter.deselFn) {
				const notDefault = Object.keys(vals).filter(it => !it.startsWith("_")).find(vK => {
					const val = vals[vK];
					return (filter.selFn && Number(filter.selFn(vK)) !== val) || (filter.deselFn && Number(filter.deselFn(vK)) !== (-val));
				});
				if (notDefault) isDefault = false;
			} else {
				if (filter instanceof RangeFilter) {
					isDefault = filter.min === vals.min && filter.max === vals.max;
				} else {
					isDefault = vals._totals.yes === 0 && vals._totals.no === 0
				}
			}
			if (isDefault) return;

			const outName = `${FilterBox._SUB_HASH_PREFIX}${name}`;

			if (vals.min != null && vals.max != null) {
				out[outName] = [
					`min${vals.min}`,
					`max${vals.max}`
				];
			} else if (vals._totals.yes || vals._totals.no) {
				out[outName] = [];
				Object.keys(vals).forEach(vK => {
					if (vK.startsWith("_")) return;
					const vV = vals[vK];
					if (!vV) return;
					out[outName].push(`${vV < 0 ? "!" : ""}${vK}`);
				});
			} else {
				out[outName] = [HASH_SUB_NONE];
			}
		});
		return out;
	}

	toDisplay (curr, ...vals) {
		const res = this.filterList.map((f, i) => {
			return f._isMulti ? f.toDisplay(curr, ...vals[i]) : f.toDisplay(curr, vals[i])
		});
		return this.modeAndOr === "AND" ? res.every(it => it) : res.find(it => it);
	}

	setCount (count, maxCount) {
		this.$txtCount.html(`Showing ${count}/${maxCount}`);
	}

	/**
	 * Helper which resets an section of the filter
	 * @param header the name of the section to reset
	 * @private
	 */
	_reset (header) {
		const cur = this.headers[header];
		cur.ele.data("resetValues")();
	}

	/**
	 * Helper which dispatched the event when the filter needs to fire a "changed" event
	 * @private
	 */
	_fireValChangeEvent () {
		const eventOut = new Event(FilterBox.EVNT_VALCHANGE);
		this.inputGroup.dispatchEvent(eventOut);
	}

	/**
	 * Clean up any previously rendered elements
	 * @private
	 */
	_wipeRendered () {
		this.$rendered.forEach($e => $e.remove());
		this.$rendered = [];
		this.$disabledOverlay.detach();
	}

	/**
	 * If the currently selected item is hidden, load the first visible item
	 * @param fromList the page data list
	 */
	static nextIfHidden (fromList) {
		if (History.lastLoadedId && !History.initialLoad) {
			const last = fromList[History.lastLoadedId];
			const lastHash = UrlUtil.autoEncodeHash(last);
			const link = $("#listcontainer").find(`.list a[href="#${lastHash.toLowerCase()}"]`);
			if (!link.length) History._freshLoad();
		} else if (History.lastLoadedId == null && !History.initialLoad) {
			History._freshLoad();
		}
	}
}

FilterBox.CLS_INPUT_GROUP_BUTTON = "input-group-btn";
FilterBox.CLS_DROPDOWN_MENU_FILTER = "dropdown-menu-filter";
FilterBox.EVNT_VALCHANGE = "valchange";
FilterBox.SOURCE_HEADER = "Source";
FilterBox._PILL_STATES = ["ignore", "yes", "no"];
FilterBox._STORAGE_NAME = "filterState";
FilterBox._STORAGE_NAME_VISIBLE = "filterStateVisible";
FilterBox._STORAGE_NAME_GROUP_STATE = "filterStateGroupState";
FilterBox._STORAGE_NAME_NEST_STATE = "filterStateNestState";
FilterBox._SUB_HASH_PREFIX = "filter";

class Filter {
	/**
	 * A single filter category
	 *
	 * @param options an object with the following properties:
	 *
	 *   header: the category header e.g. "Source"
	 *
	 *   (OPTIONAL)
	 *   items: a list of items to display (after applying the displayFn) in the FilterBox once `render()`
	 *     has been called e.g. ["PHB", "DMG"]
	 *     Note that you can pass a pointer to a list, and add items afterwards. Or pass nothing, which is equivalent to
	 *     passing an empty list. The contents are only evaluated once `render()` is called.
	 *     The items themselves can be strings or `FilterItem`s.
	 *
	 *   (OPTIONAL)
	 *   displayFn: A function to apply to each item in items when displaying the FilterBox on the page
	 *     e.g. Parser.sourceJsonToFull
	 *
	 *   (OPTIONAL)
	 *   selFn: a function, defaults items as "match this" if `selFn(item)` is true
	 *
	 *   (OPTIONAL)
	 *   deselFn: a function, defaults items as "do not match this" if `deselFn(item)` is true
	 *
	 *   (OPTIONAL)
	 *   umbrellaItem: e.g. "Choose Any"; an item that should allow anything containing it to always be displayed when
	 *     checking for other items in the filter
	 *
	 */
	constructor (options) {
		this.header = options.header;
		this.items = options.items ? options.items : [];
		this.displayFn = options.displayFn;
		this.selFn = options.selFn;
		this.deselFn = options.deselFn;
		this.attrName = options.attrName;
		this.minimalUI = options.minimalUI;
		this.umbrellaItem = options.umbrellaItem;
	}

	/**
	 * Add an item if it doesn't already exist in the filter
	 * @param item the item to add
	 */
	addIfAbsent (item) {
		if (!item) return;
		if (item instanceof Array) item.forEach(it => this.addIfAbsent(it));
		else if (!this.items.find(it => Filter._checkMatches(it, item))) this.items.push(item);
	}

	static _checkMatches (item1, item2) {
		return item1 instanceof FilterItem ? item1.item === (item2 instanceof FilterItem ? item2.item : item2) : item1 === (item2 instanceof FilterItem ? item2.item : item2)
	}

	/**
	 * Remove an item if it exists in the filter
	 * @param item the item to remove
	 */
	removeIfExists (item) {
		const ix = this.items.findIndex(it => Filter._checkMatches(it, item));
		if (~ix) this.items.splice(ix, 1);
	}

	/**
	 * Takes the output of `FilterBox.getValues()` and an item to check or array of items to check, and matches the
	 * filter against it/them.
	 *
	 * @param valObj `FilterBox.getValues()` returned object
	 * @param toCheck item or array of items to match against
	 * @returns {*} true if this item should be displayed, false otherwise
	 */
	toDisplay (valObj, toCheck) {
		const map = valObj[this.header];
		const totals = map._totals;

		function toCheckVal (tc) {
			if (tc instanceof FilterItem) return tc.item;
			return tc;
		}

		const isUmbrella = () => {
			return this.umbrellaItem &&
				toCheck &&
				toCheck instanceof Array ? toCheck.includes(this.umbrellaItem) : toCheck === this.umbrellaItem &&
				(map[toCheckVal(this.umbrellaItem)] === 0 || map[toCheckVal(this.umbrellaItem)] === 1);
		};

		if (toCheck instanceof Array) {
			let hide = false;
			let display = false;

			if (map._andOr.blue === "OR") {
				// default to displaying
				if (totals.yes === 0) {
					display = true;
				}

				toCheck.forEach(tc => {
					if (map[toCheckVal(tc)] === 1 || isUmbrella()) { // if any are 1 (blue) include if they match
						display = true;
					}
				});
			} else {
				let ttlYes = 0;
				toCheck.forEach(tc => {
					if (map[toCheckVal(tc)] === 1) {
						ttlYes++;
					}
				});
				display = !totals.yes || totals.yes === ttlYes;
			}

			if (map._andOr.red === "OR") {
				toCheck.forEach(tc => {
					if (map[toCheckVal(tc)] === -1) { // if any are -1 (red) exclude if they match
						hide = true;
					}
				});
			} else {
				let ttlNo = 0;
				toCheck.forEach(tc => {
					if (map[toCheckVal(tc)] === -1) {
						ttlNo++;
					}
				});
				hide = totals.no && totals.no === ttlNo;
			}

			return display && !hide;
		} else {
			return doCheck.bind(this)();
		}

		function doCheck () {
			let display = false;
			let hide = false;
			if (map._andOr.blue === "OR") {
				if (totals.yes > 0) {
					display = map[toCheckVal(toCheck)] === 1 || isUmbrella();
				} else {
					display = true;
				}
			} else {
				if (totals.yes > 0) {
					display = (map[toCheckVal(toCheck)] === 1 || isUmbrella()) && totals.yes === 1;
				} else {
					display = true;
				}
			}

			if (map._andOr.red === "OR") {
				if (totals.no > 0) {
					hide = map[toCheckVal(toCheck)] === -1;
				}
			} else {
				hide = totals.no === 1 && map[toCheckVal(toCheck)] === -1;
			}

			return display && !hide;
		}
	}
}

class FilterItem {
	/**
	 * An alternative to string `Filter.items` with a change-handling function
	 * @param options containing:
	 *   `item`: the item string
	 *   `changeFn`: (optional) function to call when filter is changed
	 *   `group` (optional) group this item belongs to, if it's part of a GroupedFilter
	 *   `nest` (optional) nest this item belongs to
	 *   `nestHidden` (optional) if nested, default visibility state
	 *
	 *   `customData` (optional) free data storage
	 */
	constructor (options) {
		this.item = options.item;
		this.changeFn = options.changeFn;
		this.group = options.group;
		this.nest = options.nest;
		this.nestHidden = options.nestHidden;
	}
}

class RangeFilter extends Filter {
	constructor (options) {
		super(options);
		this.min = options.min;
		this.max = options.max;
		this.labels = !!options.labels;
	}

	addIfAbsent (item) {
		if (this.labels) {
			super.addIfAbsent(item);
			this._addNumberIfAbsent(this.items.length - 1);
		} else {
			this._addNumberIfAbsent(item);
		}
	}

	_addNumberIfAbsent (number) {
		if (this.min == null && this.max == null) this.min = this.max = number;
		else {
			const oMin = this.min;
			const oMax = this.max;
			this.min = Math.min(this.min, number);
			this.max = Math.max(this.max, number);
			if (this.$slider) {
				const [lower, upper] = this.$slider.slider("values");

				const updateMin = lower === oMin && this.min !== oMin;
				const updateMax = upper === oMax && this.max !== oMax;

				if (updateMin) this.$slider.slider("option", "min", this.min);
				if (updateMax) this.$slider.slider("option", "max", this.max);

				if (updateMin && updateMax) this.$slider.slider("values", [this.min, this.max]);
				else if (updateMin) this.$slider.slider("values", [this.min, upper]);
				else if (updateMax) this.$slider.slider("values", [lower, this.max]);
			}
		}
	}

	toDisplay (valObj, toCheck) {
		const range = valObj[this.header];

		// match everything if filter is set to complete range
		if (toCheck == null) return range.min === this.min && range.max === this.max;

		if (this.labels) {
			const slice = this.items.slice(range.min, range.max + 1);
			if (toCheck instanceof Array) {
				return !!toCheck.find(it => slice.includes(it));
			} else {
				return slice.includes(toCheck);
			}
		} else {
			if (toCheck instanceof Array) return range.min <= Math.min(...toCheck) && range.max >= Math.max(...toCheck);
			else return range.min <= toCheck && range.max >= toCheck;
		}
	}
}

class GroupedFilter extends Filter {
	/**
	 * An extension of the basic filter, which enables visual grouping of elements.
	 * @param options As with `Filter`, with two extra fields:
	 *
	 *   (OPTIONAL)
	 *   groupFn: function which takes an item, and returns a number (from 0 to numGroups, inclusive)
	 *     Either this function or a `group` on a FilterItem must be specified.
	 *
	 */
	constructor (options) {
		super(options);
		this.numGroups = 1;
		this.groupFn = options.groupFn;
	}
}

class MultiFilter {
	/**
	 * A group of multiple `Filter`s, which are OR'd together
	 * @param options should include `.name`
	 * @param filters the list of filters
	 */
	constructor (options, ...filters) {
		this.categoryName = options.name;
		// designed to be toggle-able: to switch, toggle class `wrp-multi-compact` on the wrapper
		// warning: only fully implemented for RangeFilter; currently only used there
		this.compact = !!options.compact;
		this.mode = options.mode || "or";

		this.filters = filters;
		this._originalMode = options.mode;
		this._isMulti = true;
	}

	setModeAnd () {
		this.mode = "and";
	}

	setModeOr () {
		this.mode = "or";
	}

	/**
	 * For each `toChecks` tc, calls `Filter.toDisplay(valObj, tc)` and OR's the result, returning it. See the
	 * `Filter.toDisplay` docs.
	 * @param valObj `FilterBox.getValues()` returned object
	 * @param toChecks a list of objects to pass to the underlying filters, which must be the same length as the number
	 * of filters
	 * @returns {boolean} OR'd results of the underling `Filter.toDisplay` results
	 * @throws an error if the `toChecks` list did not match the length of `this.filters`
	 */
	toDisplay (valObj, ...toChecks) {
		if (this.filters.length !== toChecks.length) throw new Error("Number of filters and number of toChecks did not match");
		const results = [];
		for (let i = 0; i < this.filters.length; ++i) {
			const f = this.filters[i];
			if (f instanceof RangeFilter) {
				results.push(this.filters[i].toDisplay(valObj, toChecks[i]))
			} else {
				const totals = valObj[f.header]._totals;

				if (totals.yes === 0 && totals.no === 0) results.push(null);
				else {
					results.push(this.filters[i].toDisplay(valObj, toChecks[i]));
				}
			}
		}
		const resultsFilt = results.filter(r => r !== null);
		if (this.mode === "or") {
			if (!resultsFilt.length) return true;
			return resultsFilt.find(r => r);
		} else return resultsFilt.filter(it => it).length === resultsFilt.length;
	}
}

/**
 * An extremely simple deselect function. Simply deselects everything.
 * Useful for creating filter boxes where the default is "everything deselected"
 */
Filter.deselAll = function (val) {
	return true;
};