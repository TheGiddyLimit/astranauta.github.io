"use strict";

const BookUtil = {
	getHeaderText (header) {
		return header.header || header;
	},

	_getSelectors (scrollTo) {
		return [
			`.statsBlockSectionHead > .entry-title > .entry-title-inner:textEquals("${scrollTo}")`,
			`.statsBlockHead > .entry-title > .entry-title-inner:textEquals("${scrollTo}")`,
			`.statsBlockSubHead > .entry-title > .entry-title-inner:textEquals("${scrollTo}")`,
			`.statsBlockInset > .entry-title > .entry-title-inner:textEquals("${scrollTo}")`,
			`.statsInlineHead > .entry-title > .entry-title-inner:textEquals("${scrollTo}.")`
		];
	},

	scrollClick (scrollTo, scrollIndex) {
		const selectors = BookUtil._getSelectors(scrollTo);

		if (scrollIndex === undefined) {
			// textEquals selector defined below; added on window load
			const goToSect = $(selectors[0]);
			if (goToSect.length) {
				goToSect[0].scrollIntoView();
				return;
			}
			const goTo = $(selectors[1]);
			if (goTo.length) {
				goTo[0].scrollIntoView();
				return;
			}
			const goToSub = $(selectors[2]);
			if (goToSub.length) {
				goToSub[0].scrollIntoView();
				return;
			}
			const goToInset = $(selectors[3]);
			if (goToInset.length) {
				goToInset[0].scrollIntoView();
			}
			const goToInline = $(selectors[4]);
			if (goToInline.length) {
				goToInline[0].scrollIntoView();
			}
		} else {
			const goTo = $(`${selectors[0]}, ${selectors[1]}, ${selectors[2]}, ${selectors[3]}, ${selectors[4]}`);
			if (goTo.length) {
				if (goTo[scrollIndex]) goTo[scrollIndex].scrollIntoView();
				else goTo[0].scrollIntoView();
			}
		}
	},

	scrollPageTop (ele) {
		if (ele && !~BookUtil.curRender.chapter) {
			const ix = BookUtil.thisContents.children("ul").children("li").children("a").index(ele);
			if (~ix) {
				const ele = $(`#pagecontent tr.text td`).children(`.statsBlockSectionHead`)[ix];
				if (ele) ele.scrollIntoView();
				else setTimeout(() => { throw new Error(`Failed to find header scroll target with index "${ix}"`) });
			} else setTimeout(() => { throw new Error(`Failed to find element within contents items`) });
		} else document.getElementById(`pagecontent`).scrollIntoView();
	},

	makeContentsBlock (options) {
		let out =
			`<ul class="bk-contents" ${options.defaultHidden ? `style="display: none;"` : ""}>`;

		options.book.contents.forEach((c, i) => {
			out +=
				`<li>
				<a href="${options.addPrefix || ""}#${UrlUtil.encodeForHash(options.book.id)},${i}" ${options.addOnclick ? `onclick="BookUtil.scrollPageTop(this)"` : ""}>
					<span class="sect">${Parser.bookOrdinalToAbv(c.ordinal)}${c.name}</span>
				</a>
			</li>`;
			out += BookUtil.makeHeadersBlock(options.book.id, i, c, options.addPrefix, options.addOnclick, options.defaultHeadersHidden);
		});

		out +=
			"</ul>";
		return out;
	},

	makeHeadersBlock (bookId, chapterIndex, chapter, addPrefix, addOnclick, defaultHeadersHidden) {
		let out =
			`<ul class="bk-headers" ${defaultHeadersHidden ? `style="display: none;"` : ""}>`;
		chapter.headers && chapter.headers.forEach(h => {
			const headerText = BookUtil.getHeaderText(h);
			const displayText = h.header ? `<span class="bk-contents__sub_spacer--1">\u2013</span>${h.header}` : h; // handle entries with depth
			out += `
				<li>
					<a href="${addPrefix || ""}#${bookId},${chapterIndex},${UrlUtil.encodeForHash(headerText)}" data-book="${bookId}" data-chapter="${chapterIndex}" data-header="${headerText}" ${addOnclick ? `onclick="BookUtil.scrollClick('${headerText.replace(/'/g, "\\'")}')"` : ""}>${displayText}</a>
				</li>
			`;
		});
		out +=
			"</ul>";
		return out;
	},

	addHeaderHandles (defHidden) {
		// Add show/hide handles to section names, and update styles
		const allHeaders = $(`ul.bk-headers`);
		// add styles to all
		allHeaders.prev(`li`).find(`a`).css({
			display: "flex",
			"justify-content": "space-between",
			padding: "0"
		});
		allHeaders.filter((i, ele) => $(ele).children().length).each((i, ele) => {
			const $ele = $(ele);
			// add expand/collapse to only those with children
			const $appendTo = $ele.prev(`li`).find(`a`);
			if (!$appendTo.children(`.showhide`).length) {
				$appendTo.append(`<span class="showhide" onclick="BookUtil.sectToggle(event, this)" data-hidden="true">${defHidden ? `[+]` : `[\u2013]`}</span>`)
			}
		});
	},

	sectToggle (evt, ele) {
		if (evt) {
			evt.stopPropagation();
			evt.preventDefault();
		}
		const $ele = $(ele);
		const $childList = $ele.closest(`li`).next(`ul.bk-headers`);
		if ($ele.data("hidden")) {
			$childList.show();
			$ele.data("hidden", false);
			$ele.html(`[\u2013]`);
		} else {
			$childList.hide();
			$ele.data("hidden", true);
			$ele.html(`[+]`);
		}
	},

	_buildHeaderMap (bookData, dbgTag) {
		const out = {};
		function recurse (data, ixChap) {
			if ((data.type === "section" || data.type === "entries") && data.entries && data.name) {
				const m = /^([A-Z]+\d+(?:[a-z]+)?)\./.exec(data.name.trim());
				if (m) {
					const k = m[1];
					if (out[k]) throw new Error(`Header "${k}" was already defined!`);
					out[k] = {chapter: ixChap, entry: data};
				} else {
					const m = /^(\d+(?:[A-Za-z]+)?)\./.exec(data.name.trim()); // case seems to be important
					if (m) {
						let k = `${ixChap}>${m[1]}>0`;
						while (out[k]) {
							k = k.split(">");
							k[k.length - 1] = Number(k.last()) + 1;
							k = k.join(">");
						}
						out[k] = out[k] = {chapter: ixChap, entry: data};
					} else out[data.name] = {chapter: ixChap, entry: data};
				}
				data.entries.forEach(nxt => recurse(nxt, ixChap));
			}
		}
		bookData.forEach((chapter, i) => recurse(chapter, i));
		// cleaning stage
		// convert `chapter>headerId>0`'s to `chapter>headerId` if there's no `>1`
		const keyBuckets = {};
		const keys = Object.keys(out);
		keys.forEach(k => {
			if (k.includes(">")) {
				const bucket = k.split(">").slice(0, 2).join(">");
				(keyBuckets[bucket] = keyBuckets[bucket] || []).push(k);
			}
		});
		keys.forEach(k => {
			if (k.includes(">")) {
				const bucket = k.split(">").slice(0, 2).join(">");
				if (keyBuckets[bucket].length === 1) {
					out[bucket] = out[k];
					delete out[k];
				}
			}
		});
		return out;
	},

	thisContents: null,
	curRender: {
		curBookId: "NONE",
		chapter: null, // -1 represents "entire book"
		data: {},
		fromIndex: {},
		lastRefHeader: null,
		controls: {},
		headerMap: {}
	},
	showBookContent (data, fromIndex, bookId, hashParts) {
		function handleQuickReferenceShowAll () {
			$(`div.statsBlockSectionHead`).show();
			$(`hr.section-break`).show();
		}

		/**
		 * @param sectionHeader Section header to scroll to.
		 * @return {boolean} True if the scroll happened, false otherwise.
		 */
		function handleQuickReferenceShow (sectionHeader) {
			handleQuickReferenceShowAll();
			if (sectionHeader && ~BookUtil.curRender.chapter) {
				const $allSects = $(`div.statsBlockSectionHead`);
				const $toShow = $allSects.filter((i, e) => {
					const $e = $(e);
					const $match = $e.children(`.entry-title`).find(`span.entry-title-inner`).filter(`:textEquals("${sectionHeader}")`);
					return $match.length;
				});

				if ($toShow.length) {
					BookUtil.curRender.lastRefHeader = sectionHeader.toLowerCase();
					$allSects.hide();
					$(`hr.section-break`).hide();
					$toShow.show();
					MiscUtil.scrollPageTop();
				} else BookUtil.curRender.lastRefHeader = null;
				return !!$toShow.length;
			}
		}

		let chapter = 0;
		let scrollTo;
		let scrollIndex;
		let forceScroll = false;
		if (hashParts && hashParts.length > 0) chapter = Number(hashParts[0]);
		if (hashParts && hashParts.length > 1) {
			scrollTo = $(`[href="#${bookId},${chapter},${hashParts[1]}"]`).data("header");
			if (BookUtil.referenceId) {
				handleQuickReferenceShow(scrollTo);
			}

			// fallback to scanning the document
			if (!scrollTo) {
				scrollTo = decodeURIComponent(hashParts[1]);
				if (hashParts[2]) scrollIndex = Number(hashParts[2]);
				forceScroll = true;
			}
		} else if (BookUtil.referenceId) {
			handleQuickReferenceShowAll();
		}

		BookUtil.curRender.data = data;
		BookUtil.curRender.fromIndex = fromIndex;
		BookUtil.curRender.headerMap = BookUtil._buildHeaderMap(data);
		if (BookUtil.curRender.chapter !== chapter || BookUtil.curRender.curBookId !== bookId) {
			BookUtil.thisContents.children(`ul`).children(`ul, li`).removeClass("active");
			if (~chapter) {
				BookUtil.thisContents.children(`ul`).children(`li:nth-of-type(${chapter + 1}), ul:nth-of-type(${chapter + 1})`).addClass("active");
				const $showHideBtn = BookUtil.thisContents.children(`ul`).children(`li:nth-of-type(${chapter + 1})`).find(`.showhide`);
				if ($showHideBtn.data("hidden")) $showHideBtn.click();
			} else {
				// if displaying as one continual run, expand all
				BookUtil.thisContents.children(`ul`).children(`li`).find(`.showhide`).each((i, e) => {
					const $showHideBtn = $(e);
					if ($showHideBtn.data("hidden")) $showHideBtn.click();
				});
			}

			BookUtil.curRender.curBookId = bookId;
			BookUtil.curRender.chapter = chapter;
			BookUtil.renderArea.html("");

			const chapterTitle = (fromIndex.contents[chapter] || {}).name;
			document.title = `${chapterTitle ? `${chapterTitle} - ` : ""}${fromIndex.name} - 5etools`;

			const goToPage = (mod) => {
				const changeChapter = () => {
					const newHashParts = [bookId, chapter + mod];
					window.location.hash = newHashParts.join(HASH_PART_SEP);
					MiscUtil.scrollPageTop();
				};

				if (BookUtil.referenceId && BookUtil.curRender.lastRefHeader) {
					const chap = BookUtil.curRender.fromIndex.contents[chapter];
					const ix = chap.headers.findIndex(it => BookUtil.getHeaderText(it).toLowerCase() === BookUtil.curRender.lastRefHeader);
					if (~ix) {
						if (chap.headers[ix + mod]) {
							const newHashParts = [bookId, chapter, BookUtil.getHeaderText(chap.headers[ix + mod]).toLowerCase()];
							window.location.hash = newHashParts.join(HASH_PART_SEP);
						} else {
							changeChapter();
							const nxtHeaders = BookUtil.curRender.fromIndex.contents[chapter + mod].headers;
							const nxtIx = mod > 0 ? 0 : nxtHeaders.length - 1;
							const newHashParts = [bookId, chapter + mod, nxtHeaders[nxtIx].toLowerCase()];
							window.location.hash = newHashParts.join(HASH_PART_SEP);
						}
					} else changeChapter();
				} else changeChapter();
			};

			const renderNavButtons = (isTop) => {
				const tdStlye = `padding-${isTop ? "top" : "bottom"}: 6px; padding-left: 9px; padding-right: 9px;`;
				const $wrpControls = $(`<div class="split"/>`).appendTo($(`<td colspan="6" style="${tdStlye}"/>`).appendTo($(`<tr/>`).appendTo(BookUtil.renderArea)));

				const showPrev = ~chapter && chapter > 0;
				(BookUtil.curRender.controls.$btnsPrv = BookUtil.curRender.controls.$btnsPrv || [])
					.push($(`<button class="btn btn-xs btn-default bk__nav-head-foot-item"><span class="glyphicon glyphicon-chevron-left"></span>Previous</button>`)
						.click(() => goToPage(-1))
						.toggle(showPrev)
						.appendTo($wrpControls));
				(BookUtil.curRender.controls.$divsPrv = BookUtil.curRender.controls.$divsPrv || [])
					.push($(`<div class="bk__nav-head-foot-item"/>`)
						.toggle(!showPrev)
						.appendTo($wrpControls));

				if (isTop) {
					$(`<button class="btn btn-xs btn-default ${~BookUtil.curRender.chapter ? "" : "active"}" title="Warning: Slow">View Entire ${BookUtil.contentType.uppercaseFirst()}</button>`).click(() => {
						window.location.href = (~BookUtil.curRender.chapter ? BookUtil.thisContents.find(`.bk__contents_show_all`) : BookUtil.thisContents.find(`.bk__contents_header_link`)).attr("href");
					}).appendTo($wrpControls);
				} else $(`<button class="btn btn-xs btn-default">Back to Top</button>`).click(() => MiscUtil.scrollPageTop()).appendTo($wrpControls);

				const showNxt = ~chapter && chapter < data.length - 1;
				(BookUtil.curRender.controls.$btnsNxt = BookUtil.curRender.controls.$btnsNxt || [])
					.push($(`<button class="btn btn-xs btn-default bk__nav-head-foot-item">Next<span class="glyphicon glyphicon-chevron-right"></span></button>`)
						.click(() => goToPage(1))
						.toggle(showNxt)
						.appendTo($wrpControls));
				(BookUtil.curRender.controls.$divsNxt = BookUtil.curRender.controls.$divsNxt || [])
					.push($(`<div class="bk__nav-head-foot-item"/>`)
						.toggle(!showNxt)
						.appendTo($wrpControls));
			};

			BookUtil.curRender.controls = {};
			BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());
			renderNavButtons(true);
			const textStack = [];
			BookUtil._renderer.setFirstSection(true);
			BookUtil._renderer.resetHeaderIndex();
			if (chapter === -1) data.forEach(d => BookUtil._renderer.recursiveEntryRender(d, textStack));
			else BookUtil._renderer.recursiveEntryRender(data[chapter], textStack);
			BookUtil.renderArea.append(`<tr class="text"><td colspan="6">${textStack.join("")}</td></tr>`);
			renderNavButtons();

			BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());

			if (scrollTo) {
				let handled = false;
				if (BookUtil.referenceId) handled = handleQuickReferenceShow(scrollTo);
				if (!handled) {
					setTimeout(() => {
						BookUtil.scrollClick(scrollTo, scrollIndex);
					}, BookUtil.isHashReload ? 1 : 75);
					BookUtil.isHashReload = false;
				}
			}
		} else {
			if (hashParts.length <= 1) {
				if (~chapter) {
					if (BookUtil.referenceId) MiscUtil.scrollPageTop();
					else BookUtil.scrollPageTop();
				}
			} else if (forceScroll) BookUtil.scrollClick(scrollTo, scrollIndex);
		}

		/**
		 * Update the Previous/Next/To Top buttons at the top/bottom of the page
		 */
		(function updateControls () {
			if (BookUtil.referenceId) {
				const cnt = BookUtil.curRender.controls;

				if (~chapter) {
					const chap = BookUtil.curRender.fromIndex.contents[chapter];
					const headerIx = chap.headers.findIndex(it => BookUtil.getHeaderText(it).toLowerCase() === BookUtil.curRender.lastRefHeader);
					const renderPrev = chapter > 0 || (~headerIx && headerIx > 0);
					const renderNxt = chapter < data.length - 1 || (~headerIx && headerIx < chap.headers.length - 1);
					cnt.$btnsPrv.forEach($it => $it.toggle(!!renderPrev));
					cnt.$btnsNxt.forEach($it => $it.toggle(!!renderNxt));
					cnt.$divsPrv.forEach($it => $it.toggle(!renderPrev));
					cnt.$divsNxt.forEach($it => $it.toggle(!renderNxt));
				} else {
					cnt.$btnsPrv.forEach($it => $it.toggle(false));
					cnt.$btnsNxt.forEach($it => $it.toggle(false));
					cnt.$divsPrv.forEach($it => $it.toggle(true));
					cnt.$divsNxt.forEach($it => $it.toggle(true));
				}
			}
		})();
	},

	indexListToggle (evt, ele) {
		if (evt) {
			evt.stopPropagation();
			evt.preventDefault();
		}
		const $ele = $(ele);
		const $childList = $ele.closest(`li`).find(`ul.bk-contents`);
		if ($ele.data("hidden")) {
			$childList.show();
			$ele.data("hidden", false);
			$ele.html(`[\u2013]`);
		} else {
			$childList.hide();
			$ele.data("hidden", true);
			$ele.html(`[+]`);
		}
	},

	initLinkGrabbers () {
		const $body = $(`body`);
		$body.on(`mousedown`, `.entry-title-inner`, function (evt) {
			evt.preventDefault();
		});
		$body.on(`click`, `.entry-title-inner`, async function (evt) {
			const $this = $(this);
			const text = $this.text().trim().replace(/\.$/, "");

			if (evt.shiftKey) {
				await MiscUtil.pCopyTextToClipboard(text);
				JqueryUtil.showCopiedEffect($this);
			} else {
				const hashParts = [BookUtil.curRender.chapter, text, $this.parent().data("title-relative-index")].map(it => UrlUtil.encodeForHash(it));
				const toCopy = [`${window.location.href.split("#")[0]}#${BookUtil.curRender.curBookId}`, ...hashParts];
				await MiscUtil.pCopyTextToClipboard(toCopy.join(HASH_PART_SEP));
				JqueryUtil.showCopiedEffect($this, "Copied link!");
			}
		});
	},

	baseDataUrl: "",
	bookIndex: [],
	homebrewIndex: null,
	homebrewData: null,
	renderArea: null,
	referenceId: false,
	isHashReload: false,
	contentType: null, // one of "book" "adventure" or "document"
	// custom loading to serve multiple sources
	booksHashChange () {
		function cleanName (name) {
			// prevent TftYP names from causing the header to wrap
			return name.includes(Parser.SOURCE_JSON_TO_FULL[SRC_TYP]) ? name.replace(Parser.SOURCE_JSON_TO_FULL[SRC_TYP], Parser.sourceJsonToAbv(SRC_TYP)) : name;
		}

		async function pHandleFound (fromIndex, homebrewData) {
			document.title = `${fromIndex.name} - 5etools`;
			$(`.book-head-header`).html(cleanName(fromIndex.name));
			$(`.book-head-message`).html("Browse content. Press F to find, and G to go to page.");
			await BookUtil.pLoadBook(fromIndex, bookId, hashParts, homebrewData);
			NavBar.highlightCurrentPage();
		}

		function handleNotFound () {
			if (!window.location.hash) window.history.back();
			else {
				$(`.initial-message`).text(`Loading failed\u2014could not find a book with id "${bookId}"`);
				throw new Error(`No book with ID: ${bookId}`);
			}
		}

		const [bookIdRaw, ...hashParts] = window.location.hash.slice(1).split(HASH_PART_SEP);
		const bookId = decodeURIComponent(bookIdRaw);

		// if current chapter is -1 (full book mode), and a chapter is specified, override + stay in full-book mode
		if (BookUtil.curRender.chapter === -1 &&
			hashParts.length && hashParts[0] !== "-1" &&
			UrlUtil.encodeForHash(BookUtil.curRender.curBookId) === UrlUtil.encodeForHash(bookId)) {
			window.history.replaceState(
				{},
				document.title,
				`${location.origin}${location.pathname}#${[bookIdRaw, -1, ...hashParts.slice(1)].join(HASH_PART_SEP)}`
			);
			return BookUtil.booksHashChange();
		}

		const fromIndex = BookUtil.bookIndex.find(bk => UrlUtil.encodeForHash(bk.id) === UrlUtil.encodeForHash(bookId));
		if (fromIndex && !fromIndex.uniqueId) pHandleFound(fromIndex);
		else if (fromIndex && fromIndex.uniqueId) { // it's homebrew
			BrewUtil.pAddBrewData() // to load existing data
				.then((brew) => {
					if (!brew[BookUtil.homebrewData]) handleNotFound();
					const bookData = (brew[BookUtil.homebrewData] || []).find(bk => UrlUtil.encodeForHash(bk.id) === UrlUtil.encodeForHash(bookId));
					if (!bookData) handleNotFound();
					pHandleFound(fromIndex, bookData);
				})
				.catch(e => {
					BrewUtil.pPurgeBrew();
					setTimeout(() => { throw e; });
				});
		} else handleNotFound();
	},

	_renderer: new EntryRenderer().setEnumerateTitlesRel(true),
	async pLoadBook (fromIndex, bookId, hashParts, homebrewData) {
		function doPopulate (data) {
			const allContents = $(`.contents-item`);
			BookUtil.thisContents = allContents.filter(`[data-bookid="${UrlUtil.encodeForHash(bookId)}"]`);
			BookUtil.thisContents.show();
			allContents.filter(`[data-bookid!="${UrlUtil.encodeForHash(bookId)}"]`).hide();
			BookUtil.showBookContent(BookUtil.referenceId ? data.data[BookUtil.referenceId] : data.data, fromIndex, bookId, hashParts);
			BookUtil.addSearch(fromIndex, bookId);
		}

		if (homebrewData) {
			doPopulate(homebrewData);
		} else {
			const data = await DataUtil.loadJSON(`${BookUtil.baseDataUrl}${bookId.toLowerCase()}.json`);
			doPopulate(data);
		}
	},

	handleReNav (ele) {
		const hash = window.location.hash.slice(1).toLowerCase();
		const linkHash = $(ele).attr("href").slice(1).toLowerCase();
		if (hash === linkHash) {
			BookUtil.isHashReload = true;
			BookUtil.booksHashChange();
		}
	},

	_$body: null,
	_$findAll: null,
	_headerCounts: null,
	_lastHighlight: null,
	addSearch (indexData, bookId) {
		function getHash (found) {
			return `${UrlUtil.encodeForHash(bookId)}${HASH_PART_SEP}${~BookUtil.curRender.chapter ? found.ch : -1}${found.header ? `${HASH_PART_SEP}${UrlUtil.encodeForHash(found.header)}${HASH_PART_SEP}${found.headerIndex}` : ""}`
		}

		BookUtil._$body = BookUtil._$body || $(`body`);

		BookUtil._$body.on("click", () => {
			if (BookUtil._$findAll) BookUtil._$findAll.remove();
		});

		BookUtil._$body.off("keypress");
		BookUtil._$body.on("keypress", (e) => {
			if (((e.key === "f" || e.key === "g") && noModifierKeys(e))) {
				if (MiscUtil.isInInput(e)) return;
				e.preventDefault();

				const isPageMode = e.key === "g";

				$(`span.temp`).contents().unwrap();
				BookUtil._lastHighlight = null;
				if (BookUtil._$findAll) BookUtil._$findAll.remove();
				BookUtil._$findAll = $(`<div class="f-all-wrapper"/>`).on("click", (e) => {
					e.stopPropagation();
				});

				const $results = $(`<div class="f-all-out">`);
				const $srch = $(`<input class="form-control" placeholder="${isPageMode ? "Go to page number..." : "Find text..."}">`).on("keypress", (e) => {
					e.stopPropagation();

					if (e.key === "Enter" && noModifierKeys(e)) {
						const term = $srch.val();
						if (isPageMode) {
							if (!/^\d+$/.exec(term.trim())) {
								return JqueryUtil.doToast({
									content: `Please enter a valid page number.`,
									type: "danger"
								});
							}
						}

						$results.html("");
						const found = [];
						const toSearch = BookUtil.curRender.data;
						toSearch.forEach((section, i) => {
							BookUtil._headerCounts = {};
							searchEntriesFor(i, "", found, term, section, isPageMode);
						});
						if (found.length) {
							$results.show();
							found.forEach(f => {
								const $row = $(`<p class="f-result"/>`);
								const $ptLink = $(`<span/>`);
								const isLitTitle = f.headerMatches && !f.page;
								const $link = $(
									`<a href="#${getHash(f)}">
									<i>${Parser.bookOrdinalToAbv(indexData.contents[f.ch].ordinal)} ${indexData.contents[f.ch].name}${f.header ? ` \u2013 ${isLitTitle ? `<span class="highlight">` : ""}${f.header}${isLitTitle ? `</span>` : ""}` : ""}</i>
								</a>`
								);
								$ptLink.append($link);
								$row.append($ptLink);

								if (!isPageMode && f.previews) {
									const $ptPreviews = $(`<a href="#${getHash(f)}"/>`).click(function () {
										BookUtil.handleReNav(this);
									});
									const re = new RegExp(RegExp.escape(f.term), "gi");

									$ptPreviews.on("click", () => {
										setTimeout(() => {
											if (BookUtil._lastHighlight === null || BookUtil._lastHighlight !== f.term.toLowerCase()) {
												BookUtil._lastHighlight = f.term;
												$(`#pagecontent`)
													.find(`p:containsInsensitive("${f.term}"), li:containsInsensitive("${f.term}"), td:containsInsensitive("${f.term}"), a:containsInsensitive("${f.term}")`)
													.each((i, ele) => {
														$(ele).html($(ele).html().replace(re, "<span class='temp highlight'>$&</span>"))
													});
											}
										}, 15)
									});

									$ptPreviews.append(`<span>${f.previews[0]}</span>`);
									if (f.previews[1]) {
										$ptPreviews.append(" ... ");
										$ptPreviews.append(`<span>${f.previews[1]}</span>`);
									}
									$row.append($ptPreviews);

									$link.on("click", () => $ptPreviews.click());
								} else {
									if (f.page) {
										const $ptPage = $(`<span>Page ${f.page}</span>`);
										$row.append($ptPage);
									}

									$link.click(function () {
										BookUtil.handleReNav(this);
									});
								}

								$results.append($row);
							});
						} else {
							$results.hide();
						}
					}
				});
				BookUtil._$findAll.append($srch).append($results);

				BookUtil._$body.append(BookUtil._$findAll);

				$srch.focus();
			}
		});

		function isNamedEntry (obj) {
			return obj.name && (obj.type === "entries" || obj.type === "inset" || obj.type === "section");
		}

		const EXTRA_WORDS = 2;
		function searchEntriesFor (chapterIndex, prevLastName, appendTo, term, obj, isPageMode) {
			if (term == null) return;
			const cleanTerm = isPageMode ? Number(term.trim()) : term.toLowerCase().trim();
			if (!cleanTerm) return;

			if (isNamedEntry(obj)) {
				if (BookUtil._headerCounts[obj.name] === undefined) BookUtil._headerCounts[obj.name] = 0;
				else BookUtil._headerCounts[obj.name]++;
			}

			let lastName;
			if (isNamedEntry(obj)) {
				lastName = EntryRenderer.stripTags(obj.name);
				const matches = isPageMode ? obj.page === cleanTerm : lastName.toLowerCase().includes(cleanTerm);
				if (matches) {
					appendTo.push({
						ch: chapterIndex,
						header: lastName,
						headerIndex: BookUtil._headerCounts[lastName],
						term: term.trim(),
						headerMatches: true,
						page: obj.page
					});
				}
			} else {
				lastName = prevLastName;
			}

			if (obj.entries) {
				obj.entries.forEach(e => searchEntriesFor(chapterIndex, lastName, appendTo, term, e, isPageMode))
			} else if (obj.items) {
				obj.items.forEach(e => searchEntriesFor(chapterIndex, lastName, appendTo, term, e, isPageMode))
			} else if (obj.rows) {
				obj.rows.forEach(r => {
					const toSearch = r.row ? r.row : r;
					toSearch.forEach(c => searchEntriesFor(chapterIndex, lastName, appendTo, term, c, isPageMode));
				})
			} else if (obj.tables) {
				obj.tables.forEach(t => searchEntriesFor(chapterIndex, lastName, appendTo, term, t, isPageMode))
			} else if (obj.entry) {
				searchEntriesFor(chapterIndex, lastName, appendTo, term, obj.entry, isPageMode)
			} else if (typeof obj === "string" || typeof obj === "number") {
				if (isPageMode) return;

				const renderStack = [];
				BookUtil._renderer.recursiveEntryRender(obj, renderStack);
				const rendered = $(`<p>${renderStack.join("")}</p>`).text();

				const toCheck = typeof obj === "number" ? String(rendered) : rendered.toLowerCase();
				if (toCheck.includes(cleanTerm)) {
					if (!appendTo.length || (!(appendTo[appendTo.length - 1].header === lastName && appendTo[appendTo.length - 1].headerIndex === BookUtil._headerCounts[lastName] && appendTo[appendTo.length - 1].previews))) {
						const first = toCheck.indexOf(cleanTerm);
						const last = toCheck.lastIndexOf(cleanTerm);

						const slices = [];
						if (first === last) {
							slices.push(getSubstring(rendered, first, first));
						} else {
							slices.push(getSubstring(rendered, first, first + cleanTerm.length));
							slices.push(getSubstring(rendered, last, last + cleanTerm.length));
						}
						appendTo.push({
							ch: chapterIndex,
							header: lastName,
							headerIndex: BookUtil._headerCounts[lastName],
							previews: slices.map(s => s.preview),
							term: term.trim(),
							matches: slices.map(s => s.match),
							headerMatches: lastName.toLowerCase().includes(cleanTerm)
						});
					} else {
						const last = toCheck.lastIndexOf(cleanTerm);
						const slice = getSubstring(rendered, last, last + cleanTerm.length);
						const lastItem = appendTo[appendTo.length - 1];
						lastItem.previews[1] = slice.preview;
						lastItem.matches[1] = slice.match;
					}
				}
			} else if (!(obj.type === "image" || obj.type === "gallery" || obj.type === "link" || obj.type === "abilityGeneric" || obj.type === "cell")) {
				throw new Error("Unhandled entity type");
			}

			function getSubstring (rendered, first, last) {
				let spaceCount = 0;
				let braceCount = 0;
				let pre = "";
				let i = first - 1;
				for (; i >= 0; --i) {
					pre = rendered.charAt(i) + pre;
					if (rendered.charAt(i) === " " && braceCount === 0) {
						spaceCount++;
					}
					if (spaceCount > EXTRA_WORDS) {
						break;
					}
				}
				pre = pre.trimStart();
				const preDots = i > 0;

				spaceCount = 0;
				let post = "";
				const start = first === last ? last + cleanTerm.length : last;
				i = Math.min(start, rendered.length);
				for (; i < rendered.length; ++i) {
					post += rendered.charAt(i);
					if (rendered.charAt(i) === " " && braceCount === 0) {
						spaceCount++;
					}
					if (spaceCount > EXTRA_WORDS) {
						break;
					}
				}
				post = post.trimEnd();
				const postDots = i < rendered.length;

				const originalTerm = rendered.substr(first, term.length);

				return {
					preview: `${preDots ? "..." : ""}${pre}<span class="highlight">${originalTerm}</span>${post}${postDots ? "..." : ""}`,
					match: `${pre}${term}${post}`
				};
			}
		}
	},

	getContentsItem (ix, book, options) {
		return `<li class="contents-item" data-bookid="${UrlUtil.encodeForHash(book.id)}" style="display: none;">
			<div class="bk__contents-header">
				<a id="${ix}" href="#${UrlUtil.encodeForHash(book.id)}" class="bk__contents_header_link" title="${book.name}">
					<span class="name">${book.name}</span>
				</a>
				<a href="#${UrlUtil.encodeForHash(book.id)},-1" class="bk__contents_show_all" title="View Entire ${BookUtil.contentType.uppercaseFirst()} (Warning: Slow)">
					<span class="glyphicon glyphicon glyphicon-book" style="top: 0;"/>
				</a>
			</div>
			${BookUtil.makeContentsBlock(options)}
		</li>`;
	}
};

if (typeof module !== "undefined") {
	module.exports.BookUtil = BookUtil;
}
