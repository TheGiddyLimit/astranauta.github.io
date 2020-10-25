"use strict";

const BookUtil = {
	getHeaderText (header) {
		return header.header || header;
	},

	_getSelectors (scrollTo) {
		scrollTo = scrollTo.trim().toLowerCase();
		return [
			`.rd__h--0 > .entry-title-inner:textEquals("${scrollTo}")`,
			`.rd__h--1 > .entry-title-inner:textEquals("${scrollTo}")`,
			`.rd__h--2 > .entry-title-inner:textEquals("${scrollTo}")`,
			`.rd__h--2-inset > .entry-title-inner:textEquals("${scrollTo}")`,
			`.rd__h--3 > .entry-title-inner:textEquals("${scrollTo}.")`,
		];
	},

	scrollClick (scrollTo, scrollIndex, ele) {
		scrollTo = scrollTo.escapeQuotes();

		if (ele != null && !~BookUtil.curRender.chapter) {
			// if in full-book mode, find the index of our header against the
			const $list = $(ele).closest(".bk-headers");
			const $siblings = $list.parent().children(".bk-headers").filter((i, e) => $(e).find(`[data-header="${scrollTo}"]`).length);
			scrollIndex = $siblings.index($list);
		}

		const selectors = BookUtil._getSelectors(scrollTo);

		if (scrollIndex == null) {
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
				const ele = $(`#pagecontent tr.text td`).children(`.${Renderer.HEAD_NEG_1}`)[ix];
				if (ele) ele.scrollIntoView();
				else setTimeout(() => { throw new Error(`Failed to find header scroll target with index "${ix}"`) });
			} else setTimeout(() => { throw new Error(`Failed to find element within contents items`) });
		} else document.getElementById(`pagecontent`).scrollIntoView();
	},

	makeContentsBlock (options) {
		let out = `<ul class="bk-contents" ${options.defaultHidden ? `style="display: none;"` : ""}>`;
		options.book.contents.forEach((c, i) => {
			out += `<li class="lst--border">
				<a href="${options.addPrefix || ""}#${UrlUtil.encodeForHash(options.book.id)},${i}" ${options.addOnclick ? `onclick="BookUtil.scrollPageTop(this)"` : ""}>
					<span class="sect">${Parser.bookOrdinalToAbv(c.ordinal)}${c.name}</span>
				</a>
			</li>`;
			out += BookUtil.makeHeadersBlock(options.book.id, i, c, options.addPrefix, options.addOnclick, options.defaultHeadersHidden);
		});
		out += "</ul>";
		return out;
	},

	makeHeadersBlock (bookId, chapterIndex, chapter, addPrefix, addOnclick, defaultHeadersHidden) {
		let out = `<ul class="bk-headers" ${defaultHeadersHidden ? `style="display: none;"` : ""}>`;

		const headerCounts = {};

		chapter.headers && chapter.headers.forEach(h => {
			const headerText = BookUtil.getHeaderText(h);

			const headerPos = headerCounts[headerText] || 0;
			headerCounts[headerText] = (headerCounts[headerText] || 0) + 1;

			const displayText = h.header ? `<span class="bk-contents__sub_spacer--1">\u2013</span>${h.header}` : h; // handle entries with depth
			out += `<li class="lst--border">
				<a href="${addPrefix || ""}#${bookId},${chapterIndex},${UrlUtil.encodeForHash(headerText)}${headerPos > 0 ? `,${headerPos}` : ""}" data-book="${bookId}" data-chapter="${chapterIndex}" data-header="${headerText.escapeQuotes()}" ${addOnclick ? `onclick="BookUtil.scrollClick('${headerText.escapeQuotes()}', ${headerPos}, this)"` : ""}>${displayText}</a>
			</li>`;
		});

		out += "</ul>";

		return out;
	},

	addHeaderHandles (defHidden) {
		// Add show/hide handles to section names, and update styles
		const allHeaders = $(`ul.bk-headers`);
		// add styles to all
		allHeaders.prev(`li`).find(`a`).css({
			display: "flex",
			"justify-content": "space-between",
			padding: "0",
		});

		allHeaders.filter((i, ele) => $(ele).children().length).each((i, ele) => {
			const $ele = $(ele);
			// add expand/collapse to only those with children
			const $appendTo = $ele.prev(`li`).find(`a`);
			if (!$appendTo.children(`.showhide`).length) {
				$appendTo.append(`<span class="showhide px-2 py-1px bold" onclick="BookUtil.sectToggle(event, this)" data-hidden="true">${defHidden ? `[+]` : `[\u2013]`}</span>`)
			}
		});

		// region Bind toggle all
		$(`.bk__contents-header`).each((i, e) => {
			const $e = $(e);
			const $nxtContents = $e.next();
			if (!$nxtContents.hasClass(`bk-contents`)) return;
			const $btnToggle = $e.find(`.bk__contents-toggle-all`);
			$btnToggle.click(() => {
				const nxtDisp = $btnToggle.text() === "[+]" ? `[\u2013]` : "[+]";
				$nxtContents.find(`.showhide`).each((i, e) => {
					const $e = $(e);
					if ($e.text() !== nxtDisp) $e.click();
				});
				$btnToggle.text(nxtDisp).title(nxtDisp === "[+]" ? "Expand All" : "Collapse All");
			});
		});
		// endregion
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

	thisContents: null,
	curRender: {
		curBookId: "NONE",
		chapter: null, // -1 represents "entire book"
		data: {},
		fromIndex: {},
		lastRefHeader: null,
		controls: {},
		headerMap: {},
	},
	_lastClickedLink: null,
	_isNarrow: null,
	showBookContent (data, fromIndex, bookId, hashParts) {
		function handleQuickReferenceShowAll () {
			$(`.${Renderer.HEAD_NEG_1}`).show();
			$(`.rd__hr--section`).show();
		}

		/**
		 * @param sectionHeader Section header to scroll to.
		 * @return {boolean} True if the scroll happened, false otherwise.
		 */
		function handleQuickReferenceShow (sectionHeader) {
			handleQuickReferenceShowAll();
			if (sectionHeader && ~BookUtil.curRender.chapter) {
				const $allSects = $(`.${Renderer.HEAD_NEG_1}`);
				const $toShow = $allSects.filter((i, e) => {
					const $e = $(e);
					const cleanSectionHead = sectionHeader.trim().toLowerCase();
					const $match = $e.children(`.rd__h`).find(`span.entry-title-inner`).filter(`:textEquals("${cleanSectionHead}")`);
					return $match.length;
				});

				if ($toShow.length) {
					BookUtil.curRender.lastRefHeader = sectionHeader.toLowerCase();
					$allSects.hide();
					$(`hr.rd__hr--section`).hide();
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
			if (hashParts[2]) {
				scrollTo = decodeURIComponent(hashParts[1]);
				if (hashParts[2]) scrollIndex = Number(hashParts[2]);
				forceScroll = true;
			} else {
				scrollTo = $(`[href="#${bookId},${chapter},${hashParts[1]}"]`).data("header");
				if (BookUtil.referenceId) {
					handleQuickReferenceShow(scrollTo);
				}
			}
		} else if (BookUtil.referenceId) {
			handleQuickReferenceShowAll();
		}

		BookUtil.curRender.data = data;
		BookUtil.curRender.fromIndex = fromIndex;
		BookUtil.curRender.headerMap = Renderer.adventureBook.getEntryIdLookup(data);

		// If it's a new chapter or a new book
		if (BookUtil.curRender.chapter !== chapter || UrlUtil.encodeForHash(BookUtil.curRender.curBookId.toLowerCase()) !== UrlUtil.encodeForHash(bookId)) {
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
				// Update the mass expand/collapse button to match
				$(`.bk__contents-toggle-all`).each((i, e) => $(e).title("Collapse All").text(`[\u2013]`))
			}

			BookUtil.curRender.curBookId = bookId;
			BookUtil.curRender.chapter = chapter;
			BookUtil.renderArea.html("");

			const chapterTitle = (fromIndex.contents[chapter] || {}).name;
			document.title = `${chapterTitle ? `${chapterTitle} - ` : ""}${fromIndex.name} - 5etools`;

			const goToPage = (mod, isGetHref) => {
				const getHashPart = () => {
					const newHashParts = [bookId, chapter + mod];
					return newHashParts.join(HASH_PART_SEP);
				};

				const changeChapter = () => {
					window.location.hash = getHashPart();
					MiscUtil.scrollPageTop();
				};

				if (isGetHref) return getHashPart();

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
				const tdStyle = `padding-${isTop ? "top" : "bottom"}: 6px; padding-left: 9px; padding-right: 9px;`;
				const $wrpControls = $(`<div class="split"/>`).appendTo($(`<td colspan="6" style="${tdStyle}"/>`).appendTo($(`<tr/>`).appendTo(BookUtil.renderArea)));

				const showPrev = ~chapter && chapter > 0;
				BookUtil.curRender.controls.$btnsPrv = BookUtil.curRender.controls.$btnsPrv || [];
				let $btnPrev;
				if (BookUtil.referenceId) {
					$btnPrev = $(`<button class="btn btn-xs btn-default bk__nav-head-foot-item"><span class="glyphicon glyphicon-chevron-left"/>Previous</button>`)
						.click(() => goToPage(-1));
				} else {
					$btnPrev = $(`<a href="#${goToPage(-1, true)}" class="btn btn-xs btn-default bk__nav-head-foot-item"><span class="glyphicon glyphicon-chevron-left"/>Previous</a>`)
						.click(() => MiscUtil.scrollPageTop());
				}
				$btnPrev
					.toggle(showPrev)
					.appendTo($wrpControls);
				BookUtil.curRender.controls.$btnsPrv.push($btnPrev);

				(BookUtil.curRender.controls.$divsPrv = BookUtil.curRender.controls.$divsPrv || [])
					.push($(`<div class="bk__nav-head-foot-item"/>`)
						.toggle(!showPrev)
						.appendTo($wrpControls));

				if (isTop) {
					const href = (~BookUtil.curRender.chapter ? BookUtil.thisContents.find(`.bk__contents_show_all`) : BookUtil.thisContents.find(`.bk__contents_header_link`)).attr("href");
					const $btnEntireBook = $(`<a href="${href}" class="btn btn-xs btn-default no-print ${~BookUtil.curRender.chapter ? "" : "active"}" title="Warning: Slow">View Entire ${BookUtil.contentType.uppercaseFirst()}</a>`);

					if (BookUtil._isNarrow == null) {
						const saved = StorageUtil.syncGetForPage("narrowMode");
						if (saved != null) BookUtil._isNarrow = saved;
						else BookUtil._isNarrow = false;
					}

					const hdlNarrowUpdate = () => {
						$btnToggleNarrow.toggleClass("active", BookUtil._isNarrow);
						$(`#pagecontent`).toggleClass(`bk__stats--narrow`, BookUtil._isNarrow);
					};
					const $btnToggleNarrow = $(`<button class="btn btn-xs btn-default" title="Toggle Narrow Reading Width"><span class="glyphicon glyphicon-resize-small"/></button>`)
						.click(() => {
							BookUtil._isNarrow = !BookUtil._isNarrow;
							hdlNarrowUpdate();
							StorageUtil.syncSetForPage("narrowMode", BookUtil._isNarrow);
						});
					hdlNarrowUpdate();

					$$`<div class="no-print flex-v-center btn-group">${$btnEntireBook}${$btnToggleNarrow}</div>`.appendTo($wrpControls);
				} else $(`<button class="btn btn-xs btn-default no-print">Back to Top</button>`).click(() => MiscUtil.scrollPageTop()).appendTo($wrpControls);

				const showNxt = ~chapter && chapter < data.length - 1;
				BookUtil.curRender.controls.$btnsNxt = BookUtil.curRender.controls.$btnsNxt || [];
				let $btnNext;
				if (BookUtil.referenceId) {
					$btnNext = $(`<button class="btn btn-xs btn-default bk__nav-head-foot-item">Next<span class="glyphicon glyphicon-chevron-right"/></button>`)
						.click(() => goToPage(1))
				} else {
					$btnNext = $(`<a href="#${goToPage(1, true)}" class="btn btn-xs btn-default bk__nav-head-foot-item">Next<span class="glyphicon glyphicon-chevron-right"/></a>`)
						.click(() => MiscUtil.scrollPageTop());
				}
				$btnNext
					.toggle(showNxt)
					.appendTo($wrpControls);
				BookUtil.curRender.controls.$btnsNxt.push($btnNext);

				(BookUtil.curRender.controls.$divsNxt = BookUtil.curRender.controls.$divsNxt || [])
					.push($(`<div class="bk__nav-head-foot-item"/>`)
						.toggle(!showNxt)
						.appendTo($wrpControls));

				if (isTop) {
					BookUtil.$wrpFloatControls.empty();

					let $btnPrev;
					if (BookUtil.referenceId) {
						$btnPrev = $(`<button class="btn btn-xxs btn-default"><span class="glyphicon glyphicon-chevron-left"/></button>`)
							.click(() => goToPage(-1));
					} else {
						$btnPrev = $(`<a href="#${goToPage(-1, true)}" class="btn btn-xxs btn-default"><span class="glyphicon glyphicon-chevron-left"/></a>`)
							.click(() => MiscUtil.scrollPageTop());
					}
					$btnPrev
						.toggle(showPrev)
						.appendTo(BookUtil.$wrpFloatControls)
						.title("Previous Chapter");
					BookUtil.curRender.controls.$btnsPrv.push($btnPrev);

					let $btnNext;
					if (BookUtil.referenceId) {
						$btnNext = $(`<button class="btn btn-xxs btn-default"><span class="glyphicon glyphicon-chevron-right"/></button>`)
							.click(() => goToPage(1))
					} else {
						$btnNext = $(`<a href="#${goToPage(1, true)}" class="btn btn-xxs btn-default"><span class="glyphicon glyphicon-chevron-right"/></a>`)
							.click(() => MiscUtil.scrollPageTop());
					}
					$btnNext
						.toggle(showNxt)
						.appendTo(BookUtil.$wrpFloatControls)
						.title("Next Chapter");
					BookUtil.curRender.controls.$btnsNxt.push($btnNext);

					BookUtil.$wrpFloatControls.toggleClass("btn-group", showPrev && showNxt);
					BookUtil.$wrpFloatControls.toggleClass("hidden", !~chapter);
				}
			};

			BookUtil.curRender.controls = {};
			BookUtil.renderArea.append(Renderer.utils.getBorderTr());
			renderNavButtons(true);
			const textStack = [];
			BookUtil._renderer.setFirstSection(true);
			BookUtil._renderer.setLazyImages(true);
			BookUtil._renderer.resetHeaderIndex();
			if (chapter === -1) data.forEach(d => BookUtil._renderer.recursiveRender(d, textStack));
			else BookUtil._renderer.recursiveRender(data[chapter], textStack);
			BookUtil.renderArea.append(`<tr class="text"><td colspan="6" style="padding: 5px 20px;">${textStack.join("")}</td></tr>`);
			Renderer.initLazyImageLoaders();
			BookUtil._renderer.setLazyImages(false);
			renderNavButtons();

			BookUtil.renderArea.append(Renderer.utils.getBorderTr());

			if (scrollTo) {
				let handled = false;
				if (BookUtil.referenceId) handled = handleQuickReferenceShow(scrollTo);
				if (!handled) {
					setTimeout(() => {
						BookUtil.scrollClick(scrollTo, scrollIndex);
					}, BookUtil.isHashReload ? 15 : 75);
					BookUtil.isHashReload = false;
				}
			}
		} else {
			// It's the same chapter/same book
			if (hashParts.length <= 1) {
				if (~chapter) {
					if (BookUtil.referenceId) MiscUtil.scrollPageTop();
					else BookUtil.scrollPageTop();
				} else {
					if (hashParts.length === 1 && BookUtil._lastClickedLink) {
						const $lastLink = $(BookUtil._lastClickedLink);
						const lastHref = $lastLink.attr("href");
						const mLink = new RegExp(`^${UrlUtil.PG_ADVENTURE}#${BookUtil.curRender.curBookId},(\\d+)$`, "i").exec(lastHref.trim());
						if (mLink) {
							const linkChapterIx = Number(mLink[1]);
							const ele = $(`#pagecontent tr.text td`).children(`.${Renderer.HEAD_NEG_1}`)[linkChapterIx];
							if (ele) ele.scrollIntoView();
							else setTimeout(() => { throw new Error(`Failed to find header scroll target with index "${linkChapterIx}"`) });
							return;
						}
					}
				}
			} else if (forceScroll) {
				setTimeout(() => {
					BookUtil.scrollClick(scrollTo, scrollIndex);
				}, BookUtil.isHashReload ? 15 : 75);
			} else if (scrollTo) {
				setTimeout(() => {
					BookUtil.scrollClick(scrollTo, scrollIndex);
				}, BookUtil.isHashReload ? 15 : 75);
				BookUtil.isHashReload = false;
			}
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

		$(`.bk__overlay-loading`).remove();

		if (BookUtil._pendingPageFromHash) {
			const pageTerm = BookUtil._pendingPageFromHash;
			BookUtil._pendingPageFromHash = null;
			BookUtil._handlePageFromHash(pageTerm);
		}
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

	initScrollTopFloat () {
		const $wrpScrollTop = Omnisearch.addScrollTopFloat();
		BookUtil.$wrpFloatControls = $(`<div class="flex-vh-center w-100 mb-2 btn-group"/>`).prependTo($wrpScrollTop);
	},

	baseDataUrl: "",
	bookIndex: [],
	homebrewIndex: null,
	homebrewData: null,
	renderArea: null,
	referenceId: false,
	isHashReload: false,
	contentType: null, // one of "book" "adventure" or "document"
	$wrpFloatControls: null,

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
				$(`.initial-message`).text(`Loading failed\u2014could not find ${Parser.getArticle(BookUtil.contentType)} ${BookUtil.contentType} with ID "${bookId}." You may need to load it as homebrew.`);
				throw new Error(`No book with ID: ${bookId}`);
			}
		}

		const [bookIdRaw, ...hashParts] = window.location.hash.slice(1).split(HASH_PART_SEP);
		const bookId = decodeURIComponent(bookIdRaw);

		// Handle "page:" parts
		if (hashParts.some(it => it.toLowerCase().startsWith("page:"))) {
			let term = "";

			// Remove the "page" parts, and save the first one found
			for (let i = 0; i < hashParts.length; ++i) {
				const hashPart = hashParts[i];
				if (hashPart.toLowerCase().startsWith("page:")) {
					if (!term) term = hashPart.toLowerCase().split(":")[1];
					hashParts.splice(i, 1);
					i--;
				}
			}

			// Stash the page for later use
			BookUtil._pendingPageFromHash = term;

			// Re-start the hashchange with our clean hash
			Hist.replaceHistoryHash([bookIdRaw, ...hashParts].join(HASH_PART_SEP));
			return BookUtil.booksHashChange();
		}

		// if current chapter is -1 (full book mode), and a chapter is specified, override + stay in full-book mode
		if (BookUtil.curRender.chapter === -1
			&& hashParts.length && hashParts[0] !== "-1"
			&& UrlUtil.encodeForHash(BookUtil.curRender.curBookId) === UrlUtil.encodeForHash(bookId)) {
			// Offset any unspecified header indices (i.e. those likely originating from sidebar header clicks) to match
			//   their chapter.
			const [headerName, headerIndex] = hashParts.slice(1);
			if (headerName && !headerIndex) {
				const headerNameClean = decodeURIComponent(headerName).trim().toLowerCase();
				const chapterNum = Number(hashParts[0]);
				const headerMetas = Object.values(BookUtil.curRender.headerMap)
					.filter(it => it.chapter === chapterNum && it.nameClean === headerNameClean);
				// Offset by the lowest relative title index in the chapter
				const offset = Math.min(...headerMetas.map(it => it.ixTitleRel));
				if (isFinite(offset)) hashParts[2] = `${offset}`;
			}

			Hist.replaceHistoryHash([bookIdRaw, -1, ...hashParts.slice(1)].join(HASH_PART_SEP));
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
		} else handleNotFound();
	},

	_pendingPageFromHash: null,
	_handlePageFromHash (pageTerm) {
		// Find the first result, and jump to it if it exists
		const found = BookUtil.search.doSearch(pageTerm, true);
		if (found.length) {
			const firstFound = found[0];
			const nxtHash = BookUtil.search.getResultHash(BookUtil.curRender.curBookId, firstFound);
			Hist.replaceHistoryHash(nxtHash);
			return BookUtil.booksHashChange();
		} else {
			JqueryUtil.doToast({type: "warning", content: `Could not find page ${pageTerm}!`});
		}
	},

	_renderer: new Renderer().setEnumerateTitlesRel(true),
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
		const linkHash = ($(ele).attr("href").split("#")[1] || "").toLowerCase();
		if (hash === linkHash) {
			BookUtil.isHashReload = true;
			BookUtil.booksHashChange();
		}
	},

	_$findAll: null,
	_headerCounts: null,
	_lastHighlight: null,
	addSearch (indexData, bookId) {
		$(document.body).on("click", () => {
			if (BookUtil._$findAll) BookUtil._$findAll.remove();
		});

		$(document.body)
			.off("keypress")
			.on("keypress", (e) => {
				if (!((e.key === "f" || e.key === "g") && EventUtil.noModifierKeys(e))) return;
				if (EventUtil.isInInput(e)) return;
				e.preventDefault();
				BookUtil._showSearchBox(indexData, bookId, e.key === "g");
			});

		// region Mobile only "open find bar" buttons
		const $btnOpenFind = $(`<button class="btn btn-default btn-sm bk__btn-find no-print" title="Find">F</button>`)
			.click(evt => {
				evt.stopPropagation();
				BookUtil._showSearchBox(indexData, bookId, false);
			});

		const $btnOpenGoto = $(`<button class="btn btn-default btn-sm bk__btn-goto no-print" title="Go to Page">G</button>`)
			.click(evt => {
				evt.stopPropagation();
				BookUtil._showSearchBox(indexData, bookId, true);
			});

		$$`<div class="mobile__visible bk__wrp-btns-open-find btn-group">
			${$btnOpenFind}${$btnOpenGoto}
		</div>`.appendTo(document.body);
	},

	_showSearchBox (indexData, bookId, isPageMode) {
		$(`span.temp`).contents().unwrap();
		BookUtil._lastHighlight = null;
		if (BookUtil._$findAll) BookUtil._$findAll.remove();
		BookUtil._$findAll = $(`<div class="f-all-wrapper"/>`)
			.on("click", (e) => {
				e.stopPropagation();
			});

		const $results = $(`<div class="f-all-out">`);
		const $srch = $(`<input class="form-control" placeholder="${isPageMode ? "Go to page number..." : "Find text..."}">`)
			.on("keydown", (e) => {
				e.stopPropagation();

				if (e.key === "Enter" && EventUtil.noModifierKeys(e)) {
					const term = $srch.val();
					if (isPageMode) {
						if (!/^\d+$/.exec(term.trim())) {
							return JqueryUtil.doToast({
								content: `Please enter a valid page number.`,
								type: "danger",
							});
						}
					}

					$results.html("");

					const found = BookUtil.search.doSearch(term, isPageMode);

					if (found.length) {
						$results.show();
						found.forEach(f => {
							const $row = $(`<p class="f-result"/>`);
							const $ptLink = $(`<span/>`);
							const isLitTitle = f.headerMatches && !f.page;
							const $link = $(
								`<a href="#${BookUtil.search.getResultHash(bookId, f)}">
									<i>${Parser.bookOrdinalToAbv(indexData.contents[f.ch].ordinal)} ${indexData.contents[f.ch].name}${f.header ? ` \u2013 ${isLitTitle ? `<span class="highlight">` : ""}${f.header}${isLitTitle ? `</span>` : ""}` : ""}</i>
								</a>`,
							);
							$ptLink.append($link);
							$row.append($ptLink);

							if (!isPageMode && f.previews) {
								const $ptPreviews = $(`<a href="#${BookUtil.search.getResultHash(bookId, f)}"/>`);
								const re = new RegExp(f.term.escapeRegexp(), "gi");

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
							}

							$results.append($row);
						});
					} else {
						$results.hide();
					}
				} else if (e.key === "Escape" && EventUtil.noModifierKeys(e)) {
					BookUtil._$findAll.remove();
				}
			});
		BookUtil._$findAll.append($srch).append($results);

		$(document.body).append(BookUtil._$findAll);

		$srch.focus();
	},

	search: {
		_EXTRA_WORDS: 2,

		getResultHash (bookId, found) {
			return `${UrlUtil.encodeForHash(bookId)}${HASH_PART_SEP}${~BookUtil.curRender.chapter ? found.ch : -1}${found.header ? `${HASH_PART_SEP}${UrlUtil.encodeForHash(found.header)}${HASH_PART_SEP}${found.headerIndex}` : ""}`
		},

		doSearch (term, isPageMode) {
			if (term == null) return;
			term = term.trim();

			if (isPageMode) {
				if (isNaN(term)) return [];
				else term = Number(term);
			} else {
				if (!term) return [];
			}

			const out = [];

			const toSearch = BookUtil.curRender.data;
			toSearch.forEach((section, i) => {
				BookUtil._headerCounts = {};
				BookUtil.search._searchEntriesFor(i, out, term, section, isPageMode);
			});

			// If we're in page mode, try hard to identify _something_ to display
			if (isPageMode && !out.length) {
				const [closestPrevPage, closestNextPage] = BookUtil.search._getClosestPages(toSearch, term);

				toSearch.forEach((section, i) => {
					BookUtil.search._searchEntriesFor(i, out, closestPrevPage, section, true);
					if (closestNextPage !== closestPrevPage) BookUtil.search._searchEntriesFor(i, out, closestNextPage, section, true);
				});
			}

			return out;
		},

		_searchEntriesFor (chapterIndex, appendTo, term, obj, isPageMode) {
			BookUtil._headerCounts = {};

			const cleanTerm = isPageMode ? term : term.toLowerCase();

			BookUtil.search._searchEntriesForRecursive(chapterIndex, "", appendTo, term, cleanTerm, obj, isPageMode);
		},

		_searchEntriesForRecursive (chapterIndex, prevLastName, appendTo, term, cleanTerm, obj, isPageMode) {
			if (BookUtil.search._isNamedEntry(obj)) {
				if (BookUtil._headerCounts[obj.name] === undefined) BookUtil._headerCounts[obj.name] = 0;
				else BookUtil._headerCounts[obj.name]++;
			}

			let lastName;
			if (BookUtil.search._isNamedEntry(obj)) {
				lastName = Renderer.stripTags(obj.name);
				const matches = isPageMode ? obj.page === cleanTerm : lastName.toLowerCase().includes(cleanTerm);
				if (matches) {
					appendTo.push({
						ch: chapterIndex,
						header: lastName,
						headerIndex: BookUtil._headerCounts[lastName],
						term,
						headerMatches: true,
						page: obj.page,
					});
				}
			} else {
				lastName = prevLastName;
			}

			if (obj.entries) {
				obj.entries.forEach(e => BookUtil.search._searchEntriesForRecursive(chapterIndex, lastName, appendTo, term, cleanTerm, e, isPageMode))
			} else if (obj.items) {
				obj.items.forEach(e => BookUtil.search._searchEntriesForRecursive(chapterIndex, lastName, appendTo, term, cleanTerm, e, isPageMode))
			} else if (obj.rows) {
				obj.rows.forEach(r => {
					const toSearch = r.row ? r.row : r;
					toSearch.forEach(c => BookUtil.search._searchEntriesForRecursive(chapterIndex, lastName, appendTo, term, cleanTerm, c, isPageMode));
				})
			} else if (obj.tables) {
				obj.tables.forEach(t => BookUtil.search._searchEntriesForRecursive(chapterIndex, lastName, appendTo, term, cleanTerm, t, isPageMode))
			} else if (obj.entry) {
				BookUtil.search._searchEntriesForRecursive(chapterIndex, lastName, appendTo, term, cleanTerm, obj.entry, isPageMode)
			} else if (typeof obj === "string" || typeof obj === "number") {
				if (isPageMode) return;

				const renderStack = [];
				BookUtil._renderer.recursiveRender(obj, renderStack);
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
							slices.push(getSubstring(rendered, first, first + `${cleanTerm}`.length));
							slices.push(getSubstring(rendered, last, last + `${cleanTerm}`.length));
						}
						appendTo.push({
							ch: chapterIndex,
							header: lastName,
							headerIndex: BookUtil._headerCounts[lastName],
							previews: slices.map(s => s.preview),
							term: term,
							matches: slices.map(s => s.match),
							headerMatches: lastName.toLowerCase().includes(cleanTerm),
						});
					} else {
						const last = toCheck.lastIndexOf(cleanTerm);
						const slice = getSubstring(rendered, last, last + `${cleanTerm}`.length);
						const lastItem = appendTo[appendTo.length - 1];
						lastItem.previews[1] = slice.preview;
						lastItem.matches[1] = slice.match;
					}
				}
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
					if (spaceCount > BookUtil.search._EXTRA_WORDS) {
						break;
					}
				}
				pre = pre.trimStart();
				const preDots = i > 0;

				spaceCount = 0;
				let post = "";
				const start = first === last ? last + `${cleanTerm}`.length : last;
				i = Math.min(start, rendered.length);
				for (; i < rendered.length; ++i) {
					post += rendered.charAt(i);
					if (rendered.charAt(i) === " " && braceCount === 0) {
						spaceCount++;
					}
					if (spaceCount > BookUtil.search._EXTRA_WORDS) {
						break;
					}
				}
				post = post.trimEnd();
				const postDots = i < rendered.length;

				const originalTerm = rendered.substr(first, `${term}`.length);

				return {
					preview: `${preDots ? "..." : ""}${pre}<span class="highlight">${originalTerm}</span>${post}${postDots ? "..." : ""}`,
					match: `${pre}${term}${post}`,
				};
			}
		},

		_isNamedEntry (obj) {
			return obj.name && (obj.type === "entries" || obj.type === "inset" || obj.type === "section");
		},

		_getClosestPages (toSearch, targetPage) {
			let closestBelow = Number.MIN_SAFE_INTEGER;
			let closestAbove = Number.MAX_SAFE_INTEGER;

			const walker = MiscUtil.getWalker({keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST});
			walker.walk(
				toSearch,
				{
					object: (obj) => {
						if (obj.page) {
							if (obj.page <= targetPage) closestBelow = Math.max(closestBelow, obj.page);
							if (obj.page >= targetPage) closestAbove = Math.min(closestAbove, obj.page);
						}
						return obj;
					},
				},
			)

			return [closestBelow, closestAbove];
		},
	},

	getContentsItem (ix, book, options) {
		return `<li class="contents-item" data-bookid="${UrlUtil.encodeForHash(book.id)}" style="display: none;">
			<div class="bk__contents-header">
				<a id="${ix}" href="#${UrlUtil.encodeForHash(book.id)}" class="bk__contents_header_link" title="${book.name}">
					<span class="name">${book.name}</span>
				</a>
				<div class="flex-v-center">
					<a href="#${UrlUtil.encodeForHash(book.id)},-1" class="bk__contents_show_all px-2 py-1px flex-v-center" title="View Entire ${BookUtil.contentType.uppercaseFirst()} (Warning: Slow)">
						<span class="glyphicon glyphicon glyphicon-book" style="top: 0;"/>
					</a>
					<span title="Expand All" class="bk__contents-toggle-all px-2 bold py-1px no-select">[+]</span>
				</div>
			</div>
			${BookUtil.makeContentsBlock(options)}
		</li>`;
	},
};

if (typeof window !== "undefined") {
	window.addEventListener("load", () => $("body").on("click", "a", (evt) => {
		const lnk = evt.currentTarget;
		let $lnk = $(lnk);
		while ($lnk.length && !$lnk.is("a")) $lnk = $lnk.parent();
		BookUtil._lastClickedLink = $lnk[0];

		if (`#${$lnk.attr("href").split("#")[1] || ""}` === window.location.hash) BookUtil.handleReNav(lnk);
	}));
}
