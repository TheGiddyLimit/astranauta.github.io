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
		const cookie = Cookies.get(FilterBox._COOKIE_NAME);
		if (cookie) {
			const parsed = JSON.parse(cookie);
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
		this.$disabledOverlay = $(`<div class="list-disabled-overlay"/>`);
		const cookie = Cookies.get(FilterBox._COOKIE_NAME);
		this.cookieValues = cookie ? JSON.parse(cookie) : null;
		this.$rendered = [];
		this.dropdownVisible = false;
	}

	/**
	 * Render the "Filters" button in the inputGroup
	 */
	render () {
		// save the current values to re-apply if we're re-rendering
		const curValues = this.$rendered.length > 0 ? this.getValues() : null;
		// remove any previously rendered elements
		this._wipeRendered();

		this.$list = $(`#listcontainer`).find(`.list`);

		const $filterButton = getFilterButton();
		this.$miniView = getMiniView();
		const $inputGroup = $(this.inputGroup);

		const $outer = makeOuterList();
		for (let i = 0; i < this.filterList.length; ++i) {
			$outer.append(makeOuterItem(this, this.filterList[i], this.$miniView));
			if (i < this.filterList.length - 1) $outer.append(makeDivider());
		}
		$inputGroup.prepend($filterButton);
		this.$rendered.push($filterButton);
		$inputGroup.append($outer);
		this.$rendered.push($outer);
		$inputGroup.after(this.$miniView);
		this.$rendered.push(this.$miniView);

		addShowHideHandlers(this);
		addResetHandler(this);
		addCookieHandler(this);

		if (this.dropdownVisible) {
			$filterButton.find("button").click();
		}

		function getFilterButton () {
			const $buttonWrapper = $(`<div id="filter-toggle-btn"/>`);
			$buttonWrapper.addClass(FilterBox.CLS_INPUT_GROUP_BUTTON);

			const $filterButton = $(`<button class="btn btn-default dropdown-toggle" data-toggle="dropdown">Filter <span class="caret"></span></button>`);
			$buttonWrapper.append($filterButton);
			return $buttonWrapper;
		}

		function getMiniView () {
			return $(`<div class="mini-view btn-group"/>`);
		}

		function makeOuterList () {
			const $outL = $("<ul/>");
			$outL.addClass(FilterBox.CLS_DROPDOWN_MENU);
			$outL.addClass(FilterBox.CLS_DROPDOWN_MENU_FILTER);
			return $outL;
		}

		function makeOuterItem (self, filter, $miniView, namePrefix) {
			if (filter instanceof MultiFilter) {
				const $parent = $(`<div/>`);
				for (const child of filter.filters) {
					const $ch = makeOuterItem(self, child, $miniView, filter.categoryName);
					$parent.append($ch);
				}
				return $parent;
			} else {
				const $outI = $("<li/>");
				$outI.addClass("filter-item");

				const $grid = makePillGrid();
				const $innerListHeader = makeHeaderLine($grid);

				$outI.append($innerListHeader);
				$outI.append($grid);

				self.headers[filter.header] = {ele: $grid, outer: $outI, filter: filter};

				return $outI;
			}

			function makeHeaderLine ($grid) {
				const $line = $(`<div class="h-wrap"/>`);
				const $label = `<div>${namePrefix ? `<span class="text-muted">${namePrefix}: </span>` : ""}${filter.header}</div>`;
				$line.append($label);

				const $quickBtns = $(`<span class="btn-group" style="margin-left: auto;"/>`);
				const $all = $(`<button class="btn btn-default btn-xs">All</button>`);
				$quickBtns.append($all);
				const $clear = $(`<button class="btn btn-default btn-xs">Clear</button>`);
				$quickBtns.append($clear);
				const $none = $(`<button class="btn btn-default btn-xs">None</button>`);
				$quickBtns.append($none);
				const $default = $(`<button class="btn btn-default btn-xs">Default</button>`);
				$quickBtns.append($default);
				$line.append($quickBtns);

				const $summary = $(`<span class="summary" style="margin-left: auto;"/>`);
				const $summaryInclude = $(`<span class="include" title="Hiding  includes"/>`);
				const $summarySpacer = $(`<span class="spacer"/>`);
				const $summaryExclude = $(`<span class="exclude" title="Hidden excludes"/>`);
				$summary.append($summaryInclude);
				$summary.append($summarySpacer);
				$summary.append($summaryExclude);
				$summary.hide();
				$line.append($summary);

				const $showHide = $(`<button class="btn btn-default btn-xs show-hide-button" style="margin-left: 12px;">Hide</button>`);
				$line.append($showHide);

				$showHide.on(EVNT_CLICK, function () {
					if ($grid.is(":hidden")) {
						$showHide.text("Hide");
						$grid.show();
						$quickBtns.show();
						$summary.hide();
						$showHide.css("margin-left", "12px");
					} else {
						$showHide.text("Show");
						$grid.hide();
						$quickBtns.hide();
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
							$showHide.css("margin-left", "12px");
							$summary.show();
						} else {
							$showHide.css("margin-left", "auto");
						}
					}
				});

				$none.on(EVNT_CLICK, function () {
					$grid.find(".filter-pill").each(function () {
						$(this).data("setter")(FilterBox._PILL_STATES[2]);
					});
				});

				$all.on(EVNT_CLICK, function () {
					$grid.find(".filter-pill").each(function () {
						$(this).data("setter")(FilterBox._PILL_STATES[1]);
					});
				});

				$clear.on(EVNT_CLICK, function () {
					$grid.find(".filter-pill").each(function () {
						$(this).data("setter")(FilterBox._PILL_STATES[0]);
					});
				});

				$default.on(EVNT_CLICK, function () {
					self._reset(filter.header);
				});

				return $line;
			}

			function makePillGrid () {
				const $pills = [];
				const $grid = $(`<div class="pill-grid"/>`);

				function cycleState ($pill, $miniPill, forward) {
					const curIndex = FilterBox._PILL_STATES.indexOf($pill.attr("state"));

					let newIndex = forward ? curIndex + 1 : curIndex - 1;
					if (newIndex >= FilterBox._PILL_STATES.length) newIndex = 0;
					else if (newIndex < 0) newIndex = FilterBox._PILL_STATES.length - 1;
					$pill.attr("state", FilterBox._PILL_STATES[newIndex]);
					$miniPill.attr("state", FilterBox._PILL_STATES[newIndex]);
				}

				for (const item of filter.items) {
					const iText = item instanceof FilterItem ? item.item : item;
					const iChangeFn = item instanceof FilterItem ? item.changeFn : null;

					const $pill = $(`<div class="filter-pill"/>`);
					const $miniPill = $(`<div class="mini-pill"/>`);

					const display = filter.displayFn ? filter.displayFn(iText) : iText;

					$pill.val(iText);
					$pill.html(display);
					$miniPill.html(display);

					$pill.attr("state", FilterBox._PILL_STATES[0]);
					$miniPill.attr("state", FilterBox._PILL_STATES[0]);

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

					// If re-render, use previous values. Otherwise, if there's a cookie, cookie values. Otherwise, default the pills
					if (curValues) {
						let valNum = curValues[filter.header][iText];
						if (valNum < 0) valNum = 2;
						_setter($pill, $miniPill, FilterBox._PILL_STATES[valNum], iText, iChangeFn, true);
					} else if (self.cookieValues && self.cookieValues[filter.header] && self.cookieValues[filter.header][iText] !== undefined) {
						let valNum = self.cookieValues[filter.header][iText];
						if (valNum < 0) valNum = 2;
						_setter($pill, $miniPill, FilterBox._PILL_STATES[valNum], iText, iChangeFn, true);
					} else {
						_resetter($pill, $miniPill, iText, iChangeFn, true);
					}

					// add a class to mark any items that are default deselected (used to add visual difference)
					tagDefaults($miniPill, iText);

					$grid.append($pill);
					$miniView.append($miniPill);
					$pills.push($pill);
				}

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
							out[p.val()] = state === "yes" ? 1 : state === "no" ? -1 : 0;
							const countName = state === "yes" ? "yes" : state === "no" ? "no" : "ignored";
							_totals[countName] = _totals[countName] + 1;
						});
						out._totals = _totals;
						return out;
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

				return $grid;
			}
		}

		function makeDivider () {
			return $(`<div class="pill-grid-divider"/>`);
		}

		function addShowHideHandlers (self) {
			// watch for the button changing to "open"
			const $filterToggleButton = $("#filter-toggle-btn");
			const observer = new MutationObserver(function (mutations) {
				mutations.forEach(function (mutationRecord) {
					if (!$filterToggleButton.hasClass("open")) {
						self.$disabledOverlay.detach();
						self.dropdownVisible = false;
						$outer.hide();
						// fire an event when the form is closed
						self._fireValChangeEvent();
					} else {
						self.$list.parent().append(self.$disabledOverlay);
						$outer.show();
						self.dropdownVisible = true;
					}
				});
			});
			observer.observe($filterToggleButton[0], {attributes: true, attributeFilter: ["class"]});

			// squash events from the menu, otherwise the dropdown gets hidden when we click inside it
			$outer.on(EVNT_CLICK, function (e) {
				e.stopPropagation();
			});
		}

		function addResetHandler (self) {
			if (self.resetButton !== null && self.resetButton !== undefined) {
				self.resetButton.addEventListener(EVNT_CLICK, function () {
					self.reset();
				}, false);
			}
		}

		function addCookieHandler (self) {
			window.addEventListener("unload", function () {
				const state = self.getValues();
				Cookies.set(FilterBox._COOKIE_NAME, state, {expires: 365, path: window.location.pathname})
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
	 *  "Source": { "PHB": 1, "DMG": 0, "_totals": { "yes": 1, "no": 0, "ignored": 1 } },
	 *  "School": { "A": 0, "EV": -1, "_totals": { "yes": 0, "no": 1, "ignored": 1 } }
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
	 */
	reset () {
		for (const header in this.headers) {
			if (!this.headers.hasOwnProperty(header)) continue;
			this._reset(header);
		}
		this._fireValChangeEvent();
	}

	/**
	 * Helper which resets an section of the filter
	 * @param header the name of the section to reset
	 * @private
	 */
	_reset (header) {
		const cur = this.headers[header];
		cur.ele.find(".filter-pill").each(function () {
			$(this).data("resetter")();
		});
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
}

FilterBox.CLS_INPUT_GROUP_BUTTON = "input-group-btn";
FilterBox.CLS_DROPDOWN_MENU = "dropdown-menu";
FilterBox.CLS_DROPDOWN_MENU_FILTER = "dropdown-menu-filter";
FilterBox.EVNT_VALCHANGE = "valchange";
FilterBox.SOURCE_HEADER = "Source";
FilterBox._PILL_STATES = ["ignore", "yes", "no"];
FilterBox._COOKIE_NAME = "filterState";

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
	 */
	constructor (options) {
		this.header = options.header;
		this.items = options.items ? options.items : [];
		this.displayFn = options.displayFn;
		this.selFn = options.selFn;
		this.deselFn = options.deselFn;
	}

	/**
	 * Add an item if it doesn't already exist in the filter
	 * @param item the item to add
	 */
	addIfAbsent (item) {
		if ($.inArray(item, this.items) === -1) this.items.push(item);
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
		if (toCheck instanceof Array) {
			let display = false;
			// default to displaying
			if (totals.yes === 0) {
				display = true;
			}
			let hide = false;
			for (let i = 0; i < toCheck.length; i++) {
				const item = toCheck[i];

				// if any are 1 (green) include if they match
				if (map[item] === 1) {
					display = true;
				}
				// if any are -1 (red) exclude if they match
				if (map[item] === -1) {
					hide = true;
				}
			}

			return display && !hide;
		} else {
			return doCheck(toCheck);
		}

		function doCheck () {
			if (totals.yes > 0) {
				return map[toCheck] === 1;
			} else {
				return map[toCheck] >= 0;
			}
		}
	}
}

class FilterItem {
	/**
	 * An alternative to string `Filter.items` with a change-handling function
	 * @param item string
	 * @param changeFn called when this item is clicked/etc; calls `changeFn(item)`
	 */
	constructor (item, changeFn) {
		this.item = item;
		this.changeFn = changeFn;
	}
}

class MultiFilter {
	/**
	 * A group of multiple `Filter`s, which are OR'd together
	 * @param categoryName a prefix to display before the filter headers
	 * @param filters the list of filters
	 */
	constructor (categoryName, ...filters) {
		this.categoryName = categoryName;
		this.filters = filters;
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
			const totals = valObj[f.header]._totals;

			if (totals.yes === 0 && totals.no === 0) results.push(null);
			else {
				results.push(this.filters[i].toDisplay(valObj, toChecks[i]));
			}
		}
		const resultsFilt = results.filter(r => r !== null);
		if (!resultsFilt.length) return true;
		return resultsFilt.find(r => r);
	}
}

/**
 * An extremely simple deselect function. Simply deselects everything.
 * Useful for creating filter boxes where the default is "everything deselected"
 */
Filter.deselAll = function (val) {
	return true;
};