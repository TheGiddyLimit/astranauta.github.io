"use strict";

const Omnisearch = {
	_PLACEHOLDER_TEXT: "Search everywhere...",
	_searchIndex: null,
	_onFirstLoad: null,
	_loadingSearch: false,
	_CATEGORY_COUNTS: {},
	highestId: -1,

	init: function () {
		const $nav = $(`#navbar`);

		const $searchIn = $(`<input class="form-control search omni__input" placeholder="${Omnisearch._PLACEHOLDER_TEXT}" title="Disclaimer: unlikely to search everywhere. Use with caution.">`);
		const $searchSubmit = $(`<button class="btn btn-default omni__submit" tabindex="-1"><span class="glyphicon glyphicon-search"></span></button>`);

		const $searchInputWrapper = $(`
			<div class="input-group omni__wrp-input">
				<div data-r="$searchIn"/>
				<div class="input-group-btn">
					<div data-r="$searchSubmit"/>
				</div>
			</div>
		`).swap({$searchIn, $searchSubmit}).appendTo($nav);

		const $searchOutWrapper = $(`<div class="omni__wrp-output"/>`).insertAfter($nav);
		const $searchOut = $(`<div class="omni__output"/>`).appendTo($searchOutWrapper);

		let clickFirst = false;

		const $body = $(`body`);
		$body.on("click", () => {
			$searchOutWrapper.hide();
		});

		$searchOut.on("click", (e) => {
			e.stopPropagation();
		});

		$searchIn.on("keydown", (e) => {
			switch (e.which) {
				case 13: // enter
					clickFirst = true;
					$searchSubmit.click();
					break;
				case 38: // up
					e.preventDefault();
					break;
				case 40: // down
					e.preventDefault();
					$searchOut.find(`a`).first().focus();
					break;
				case 27: // escape
					$searchIn.val("");
					$searchIn.blur();
			}
			e.stopPropagation();
		});

		// auto-search after 100ms
		const TYPE_TIMEOUT_MS = 100;
		let typeTimer;
		$searchIn.on("keyup", (e) => {
			if (e.which >= 37 && e.which <= 40) return;
			clearTimeout(typeTimer);
			typeTimer = setTimeout(() => {
				$searchSubmit.click()
			}, TYPE_TIMEOUT_MS);
		});
		$searchIn.on("keydown", () => {
			clearTimeout(typeTimer);
		});
		$searchIn.on("click", (e) => {
			if ($searchIn.val() && $searchIn.val().trim().length) $searchSubmit.click();
			e.stopPropagation();
		});

		$searchSubmit.on("click", (e) => {
			e.stopPropagation();
			doSearch();
		});

		initScrollHandler();

		const MAX_RESULTS = 15;
		function doSearch () {
			if (!Omnisearch._searchIndex) {
				Omnisearch.doSearchLoad();
				Omnisearch._onFirstLoad = doSearch;
				return;
			}

			const srch = $searchIn.val();

			const tokens = elasticlunr.tokenizer(srch);
			const tokensIsCat = tokens.map(t => {
				const category = Object.keys(Omnisearch._CATEGORY_COUNTS).map(k => k.toLowerCase()).find(k => (`in:${k}` === t.toLowerCase().trim() || `in:${k}s` === t.toLowerCase().trim()));
				return {
					t: t,
					isCat: !!category,
					c: category
				};
			});

			let page = 0;

			const catTokens = tokensIsCat.filter(tc => tc.isCat);
			let results;
			if (catTokens.length === 1) {
				const noCatTokens = tokensIsCat.filter(tc => !tc.isCat).map(tc => tc.t);
				results = Omnisearch._searchIndex.search(noCatTokens.join(" "), {
					fields: {
						n: {boost: 5, expand: true},
						s: {expand: true}
					},
					bool: "AND",
					expand: true
				}).filter(r => catTokens[0].c && r.doc.cf.toLowerCase() === catTokens[0].c.toLowerCase());
			} else {
				results = Omnisearch._searchIndex.search(srch, {
					fields: {
						n: {boost: 5, expand: true},
						s: {expand: true}
					},
					bool: "AND",
					expand: true
				});
			}

			if (!doShowUaEtc()) {
				results = results.filter(r => r.doc.s && !SourceUtil._isNonstandardSourceWiz(r.doc.s));
			}

			if (!doHideBlacklisted() && ExcludeUtil.getList().length) {
				results = results.filter(r => {
					if (r.doc.c === Parser.CAT_ID_QUICKREF) return true;
					let bCat = Parser.pageCategoryToProp(r.doc.c);
					let bName = bCat !== "variantrule" ? r.doc.n : r.doc.n.split(";")[0];
					return !ExcludeUtil.isExcluded(bName, bCat, r.doc.s);
				});
			}

			if (results.length) {
				renderLinks();
			} else {
				$searchOut.empty();
				$searchOutWrapper.hide();
			}

			function renderLinks () {
				function getHoverStr (category, url, src) {
					return `onmouseover="EntryRenderer.hover.mouseOver(event, this, '${UrlUtil.categoryToPage(category)}', '${src}', '${url.replace(/'/g, "\\'")}')" ${EntryRenderer.hover._getPreventTouchString()}`;
				}

				$searchOut.empty();
				const showUa = doShowUaEtc();
				const $btnUaEtc = $(`<button class="btn btn-default btn-xs btn-file" title="Filter Unearthed Arcana and other unofficial source results" tabindex="-1">${showUa ? "Exclude" : "Include"} UA, etc</button>`)
					.on("click", () => {
						setShowUaEtc(!showUa);
						doSearch();
					});

				const hideBlacklisted = doHideBlacklisted();
				const $btnBlacklist = $(`<button class="btn btn-default btn-xs btn-file" style="margin-left: 6px;" title="Filter blacklisted content results" tabindex="-1">${hideBlacklisted ? "Exclude" : "Include"} Blacklisted</button>`)
					.on("click", () => {
						setShowBlacklisted(!hideBlacklisted);
						doSearch();
					});

				$searchOut.append($(`<div class="text-align-right"/>`).append([$btnUaEtc, $btnBlacklist]));
				const base = page * MAX_RESULTS;
				for (let i = base; i < Math.max(Math.min(results.length, MAX_RESULTS + base), base); ++i) {
					const r = results[i].doc;
					const $link = $(`<a href="${UrlUtil.categoryToPage(r.c)}#${r.u}" ${r.h ? getHoverStr(r.c, r.u, r.s) : ""}>${r.cf}: ${r.n}</a>`)
						.keydown(evt => Omnisearch.handleLinkKeyDown(evt, $link, $searchOut));
					$(`<p>
						<span data-r="$link"/>
						${r.s ? `<i title="${Parser.sourceJsonToFull(r.s)}">${Parser.sourceJsonToAbv(r.s)}${r.p ? ` p${r.p}` : ""}</i>` : ""}
					</p>`).swap({$link}).appendTo($searchOut);
				}
				$searchOutWrapper.css("display", "flex");

				// add pagination if there are many results
				if (results.length > MAX_RESULTS) {
					const $pgControls = $(`<div class="omni__wrp-paginate">`);
					if (page > 0) {
						const $prv = $(`<span class="omni__paginate-left has-results-left omni__paginate-ctrl"><span class="glyphicon glyphicon-chevron-left"></span></span>`).on("click", () => {
							page--;
							renderLinks();
						});
						$pgControls.append($prv);
					} else ($pgControls.append(`<span class="omni__paginate-left">`));
					$pgControls.append(`<span class="paginate-count">Page ${page + 1}/${Math.ceil(results.length / MAX_RESULTS)} (${results.length} results)</span>`);
					if (results.length - (page * MAX_RESULTS) > MAX_RESULTS) {
						const $nxt = $(`<span class="omni__paginate-right has-results-right omni__paginate-ctrl"><span class="glyphicon glyphicon-chevron-right"></span></span>`).on("click", () => {
							page++;
							renderLinks();
						});
						$pgControls.append($nxt)
					} else ($pgControls.append(`<span class="omni__paginate-right omni__paginate-ctrl">`));
					$searchOut.append($pgControls);
				}

				if (clickFirst) {
					$searchOut.find(`a`).first()[0].click();
				}
			}
		}
		const STORAGE_NAME_UA_ETC = "search-ua-etc";
		const STORAGE_NAME_BLACKLIST = "search-blacklist";
		const CK_SHOW = "SHOW";
		const CK_HIDE = "HIDE";

		let showUaEtc;
		function doShowUaEtc () {
			if (!showUaEtc) showUaEtc = StorageUtil.syncGet(STORAGE_NAME_UA_ETC);
			return showUaEtc !== CK_HIDE;
		}

		function setShowUaEtc (value) {
			showUaEtc = value ? CK_SHOW : CK_HIDE;
			StorageUtil.syncSet(STORAGE_NAME_UA_ETC, showUaEtc);
		}

		let hideBlacklisted;
		function doHideBlacklisted () {
			if (!hideBlacklisted) hideBlacklisted = StorageUtil.syncGet(STORAGE_NAME_BLACKLIST);
			return hideBlacklisted === CK_SHOW;
		}

		function setShowBlacklisted (value) {
			hideBlacklisted = value ? CK_SHOW : CK_HIDE;
			StorageUtil.syncSet(STORAGE_NAME_BLACKLIST, hideBlacklisted);
		}

		function initScrollHandler () {
			const $window = $(window);
			$window.on("scroll", () => {
				if ($window.width() < 768) {
					$searchIn.attr("placeholder", Omnisearch._PLACEHOLDER_TEXT);
					$searchInputWrapper.removeClass("omni__wrp-input--scrolled");
					$searchOut.removeClass("omni__output--scrolled");
				} else {
					if ($window.scrollTop() > 50) {
						$searchIn.attr("placeholder", "");
						$searchInputWrapper.addClass("omni__wrp-input--scrolled");
						$searchOut.addClass("omni__output--scrolled");
					} else {
						$searchIn.attr("placeholder", Omnisearch._PLACEHOLDER_TEXT);
						$searchInputWrapper.removeClass("omni__wrp-input--scrolled");
						$searchOut.removeClass("omni__output--scrolled");
					}
				}
			});
		}

		$body.on("keypress", (e) => {
			if (!noModifierKeys(e) || MiscUtil.isInInput(e)) return;
			if (e.key === "f" || e.key === "F") {
				const toSel = e.key === "F" ? $searchIn : $(`#${ID_SEARCH_BAR}`).find(`.search`);
				// defer, otherwise the "f" will be input into the search field
				setTimeout(() => {
					toSel.select().focus();
				}, 0);
			}
		});
	},

	doSearchLoad: function () {
		if (Omnisearch._loadingSearch) return;
		Omnisearch._loadingSearch = true;
		DataUtil.loadJSON("search/index.json").then((data) => {
			Omnisearch.onSearchLoad(data);
			Omnisearch._onFirstLoad();
			Omnisearch._loadingSearch = false;
		});
	},

	onSearchLoad: function (data) {
		elasticlunr.clearStopWords();
		Omnisearch._searchIndex = elasticlunr(function () {
			this.addField("n");
			this.addField("cf");
			this.addField("s");
			this.setRef("id");
		});
		SearchUtil.removeStemmer(Omnisearch._searchIndex);
		const addToIndex = (d) => {
			d.cf = Parser.pageCategoryToFull(d.c);
			if (!Omnisearch._CATEGORY_COUNTS[d.cf]) Omnisearch._CATEGORY_COUNTS[d.cf] = 1;
			else Omnisearch._CATEGORY_COUNTS[d.cf]++;
			Omnisearch._searchIndex.addDoc(d);
		};
		data.forEach(addToIndex);
		Omnisearch.highestId = data[data.length - 1].id;
		BrewUtil.pGetSearchIndex().then(index => {
			index.forEach(addToIndex); // this doesn't update if the 'Brew changes later, but so be it.
		})
	},

	handleLinkKeyDown (e, $ele, $searchOut) {
		switch (e.which) {
			case 37: // left
				e.preventDefault();
				if ($(`.has-results-left`).length) {
					const ix = $ele.parent().index() - 1; // offset as the control bar is at position 0
					$(`.omni__paginate-left`).click();
					const $psNext = $searchOut.find(`p`);
					$($psNext[ix] || $psNext[$psNext.length - 1]).find(`a`).focus();
				}
				break;
			case 38: // up
				e.preventDefault();
				if ($ele.parent().prev().find(`a`).length) {
					$ele.parent().prev().find(`a`).focus();
				} else if ($(`.has-results-left`).length) {
					$(`.omni__paginate-left`).click();
					$searchOut.find(`a`).last().focus();
				}
				break;
			case 39: // right
				e.preventDefault();
				if ($(`.has-results-right`).length) {
					const ix = $ele.parent().index() - 1; // offset as the control bar is at position 0
					$(`.omni__paginate-right`).click();
					const $psNext = $searchOut.find(`p`);
					$($psNext[ix] || $psNext[$psNext.length - 1]).find(`a`).focus();
				}
				break;
			case 40: // down
				e.preventDefault();
				if ($ele.parent().next().find(`a`).length) {
					$ele.parent().next().find(`a`).focus();
				} else if ($(`.has-results-right`).length) {
					$(`.omni__paginate-right`).click();
					$searchOut.find(`a`).first().focus();
				}
				break;
		}
	},

	addScrollTopFloat () {
		const $wrpTop = $(`<div class="bk__to-top"/>`).appendTo($("body"));
		const $btnToTop = $(`<button class="btn btn-sm btn-default" title="To Top"><span class="glyphicon glyphicon-arrow-up"/></button>`).appendTo($wrpTop).click(() => MiscUtil.scrollPageTop());

		$(window).on("scroll", () => {
			if ($(window).scrollTop() > 50) $wrpTop.addClass("bk__to-top--scrolled");
			else $wrpTop.removeClass("bk__to-top--scrolled");
		});
	}
};

window.addEventListener("load", Omnisearch.init);
