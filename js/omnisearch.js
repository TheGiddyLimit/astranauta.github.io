const Omnisearch = {
	_PLACEHOLDER_TEXT: "Search everywhere...",
	_searchIndex: null,
	_onFirstLoad: null,
	_loadingSearch: false,
	_CATEGORY_COUNTS: {},
	highestId: -1,

	init: init = function () {
		const $nav = $(`#navbar`);
		$nav.append(`
			<div class="input-group" id="wrp-omnisearch-input">
				<input id="omnisearch-input" class="form-control" placeholder="${Omnisearch._PLACEHOLDER_TEXT}" title="Disclaimer: unlikely to search everywhere. Use with caution.">
				<div class="input-group-btn">
					<button class="btn btn-default" id="omnisearch-submit" tabindex="-1"><span class="glyphicon glyphicon-search"></span></button>
				</div>
			</div>
		`);
		$nav.after(`<div id="omnisearch-output-wrapper"><div id="omnisearch-output"></div></div>`);

		const $searchOutWrapper = $(`#omnisearch-output-wrapper`);
		const $searchOut = $(`#omnisearch-output`);
		const $searchIn = $(`#omnisearch-input`);
		const $searchSubmit = $(`#omnisearch-submit`);

		let clickFirst = false;

		$(`body`).on("click", () => {
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
				case 37: // left
					e.preventDefault();
					$(`.pg-left`).click();
					break;
				case 38: // up
					e.preventDefault();
					break;
				case 39: // right
					e.preventDefault();
					$(`.pg-right`).click();
					break;
				case 40: // down
					e.preventDefault();
					$searchOut.find(`a`).first().focus();
					break;
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

			if (results.length) {
				renderLinks();
			} else {
				$searchOut.empty();
				$searchOutWrapper.hide();
			}

			function renderLinks () {
				function getHoverStr (category, url, src) {
					return `onmouseover="EntryRenderer.hover.mouseOver(event, this, '${UrlUtil.categoryToPage(category)}', '${src}', '${url.replace(/'/g, "\\'")}')"`;
				}

				$searchOut.empty();
				const showUa = doShowUaEtc();
				const $btnUaEtc = $(`<button class="btn btn-default btn-xs btn-file" title="Filter Unearthed Arcana and other unofficial source results" tabindex="-1">${showUa ? "Exclude" : "Include"} UA, etc</button>`)
					.on("click", () => {
						setShowUaEtc(!showUa);
						doSearch();
					});

				$searchOut.append($(`<div class="text-align-right"/>`).append($btnUaEtc));
				const base = page * MAX_RESULTS;
				for (let i = base; i < Math.max(Math.min(results.length, MAX_RESULTS + base), base); ++i) {
					const r = results[i].doc;
					$searchOut.append(`
				<p>
					<a href="${UrlUtil.categoryToPage(r.c)}#${r.u}" ${r.h ? getHoverStr(r.c, r.u, r.s) : ""} onkeydown="Omnisearch.handleLinkKeyDown(event, this)">${r.cf}: ${r.n}</a>
					${r.s ? `<i title="${Parser.sourceJsonToFull(r.s)}">${Parser.sourceJsonToAbv(r.s)}${r.p ? ` p${r.p}` : ""}</i>` : ""}
				</p>`);
				}
				$searchOutWrapper.css("display", "flex");

				// add pagination if there are many results
				if (results.length > MAX_RESULTS) {
					const $pgControls = $(`<div class="omnisearch-pagination-wrapper">`);
					if (page > 0) {
						const $prv = $(`<span class="pg-left has-results-left pg-control"><span class="glyphicon glyphicon-chevron-left"></span></span>`).on("click", () => {
							page--;
							renderLinks();
						});
						$pgControls.append($prv);
					} else ($pgControls.append(`<span class="pg-left">`));
					$pgControls.append(`<span class="pg-count">Page ${page + 1}/${Math.ceil(results.length / MAX_RESULTS)} (${results.length} results)</span>`);
					if (results.length - (page * MAX_RESULTS) > MAX_RESULTS) {
						const $nxt = $(`<span class="pg-right has-results-right pg-control"><span class="glyphicon glyphicon-chevron-right"></span></span>`).on("click", () => {
							page++;
							renderLinks();
						});
						$pgControls.append($nxt)
					} else ($pgControls.append(`<span class="pg-right pg-control">`));
					$searchOut.append($pgControls);
				}

				if (clickFirst) {
					$searchOut.find(`a`).first()[0].click();
				}
			}
		}
		const COOKIE_NAME_UA_ETC = "search-ua-etc";
		const CK_SHOW = "SHOW";
		const CK_HIDE = "HIDE";

		let showUaEtc;
		function doShowUaEtc () {
			if (!showUaEtc) showUaEtc = Cookies.get(COOKIE_NAME_UA_ETC);
			return showUaEtc !== CK_HIDE;
		}

		function setShowUaEtc (value) {
			showUaEtc = value ? CK_SHOW : CK_HIDE;
			Cookies.set(COOKIE_NAME_UA_ETC, showUaEtc, {expires: 365});
		}

		function initScrollHandler () {
			$(window).on("scroll", () => {
				if ($(window).width() < 768) {
					$searchIn.attr("placeholder", Omnisearch._PLACEHOLDER_TEXT);
					$("#wrp-omnisearch-input").removeClass("scrolled");
					$searchOut.removeClass("scrolled");
				} else {
					if ($(window).scrollTop() > 50) {
						$searchIn.attr("placeholder", "");
						$("#wrp-omnisearch-input").addClass("scrolled");
						$searchOut.addClass("scrolled");
					} else {
						$searchIn.attr("placeholder", Omnisearch._PLACEHOLDER_TEXT);
						$("#wrp-omnisearch-input").removeClass("scrolled");
						$searchOut.removeClass("scrolled");
					}
				}
			});
		}
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
		const addToIndex = (d) => {
			d.cf = Parser.pageCategoryToFull(d.c);
			if (!Omnisearch._CATEGORY_COUNTS[d.cf]) Omnisearch._CATEGORY_COUNTS[d.cf] = 1;
			else Omnisearch._CATEGORY_COUNTS[d.cf]++;
			Omnisearch._searchIndex.addDoc(d);
		};
		data.forEach(addToIndex);
		Omnisearch.highestId = data[data.length - 1].id;
		BrewUtil.getSearchIndex().forEach(addToIndex); // this doesn't update if the 'Brew changes later, but so be it.
	},

	handleLinkKeyDown (e, ele) {
		switch (e.which) {
			case 37: // left
				e.preventDefault();
				if ($(`.has-results-left`).length) {
					$(`.pg-left`).click();
					$(`#omnisearch-output`).find(`a`).first().focus();
				}
				break;
			case 38: // up
				e.preventDefault();
				if ($(ele).parent().prev().find(`a`).length) {
					$(ele).parent().prev().find(`a`).focus();
				} else if ($(`.has-results-left`).length) {
					$(`.pg-left`).click();
					$(`#omnisearch-output`).find(`a`).last().focus();
				}
				break;
			case 39: // right
				e.preventDefault();
				if ($(`.has-results-right`).length) {
					$(`.pg-right`).click();
					$(`#omnisearch-output`).find(`a`).first().focus();
				}
				break;
			case 40: // down
				e.preventDefault();
				if ($(ele).parent().next().find(`a`).length) {
					$(ele).parent().next().find(`a`).focus();
				} else if ($(`.has-results-right`).length) {
					$(`.pg-right`).click();
					$(`#omnisearch-output`).find(`a`).first().focus();
				}
				break;
		}
	}
};

window.addEventListener("load", Omnisearch.init);