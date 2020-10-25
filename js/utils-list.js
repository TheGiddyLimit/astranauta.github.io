"use strict";

const ListUtil = {
	SUB_HASH_PREFIX: "sublistselected",

	_firstInit: true,
	initList (listOpts) {
		const $iptSearch = $("#lst__search");
		const $wrpList = $(`ul.list.${listOpts.listClass}`);
		const list = new List({$iptSearch, $wrpList, ...listOpts});

		$("#reset").click(function () {
			$iptSearch.val("");
			list.reset();
		});

		// region Magnifying glass/clear button
		const $btnSearchClear = $(`#lst__search-glass`)
			.click(() => $iptSearch.val("").change().keydown().keyup());
		const _handleSearchChange = () => {
			setTimeout(() => {
				if ($iptSearch.val().length) $btnSearchClear.removeClass("no-events").addClass("clickable").title("Clear").html(`<span class="glyphicon glyphicon-remove"/>`);
				else $btnSearchClear.addClass("no-events").removeClass("clickable").title(null).html(`<span class="glyphicon glyphicon-search"/>`);
			})
		};
		const handleSearchChange = MiscUtil.throttle(_handleSearchChange, 50);
		$iptSearch.on("keydown", handleSearchChange);
		// endregion

		if (ListUtil._firstInit) {
			ListUtil._firstInit = false;
			const $headDesc = $(`.page__subtitle`);
			$headDesc.html(`${$headDesc.html()} Press J/K to navigate rows.`);
			ListUtil._initList_bindWindowHandlers();
		}

		return list;
	},

	_initList_scrollToItem () {
		const toShow = Hist.getSelectedListElementWithLocation();

		if (toShow) {
			const $li = $(toShow.item.ele);
			const $wrpList = $li.parent();
			const parentScroll = $wrpList.scrollTop();
			const parentHeight = $wrpList.height();
			const posInParent = $li.position().top;
			const height = $li.height();

			if (posInParent < 0) {
				$li[0].scrollIntoView();
			} else if (posInParent + height > parentHeight) {
				$wrpList.scrollTop(parentScroll + (posInParent - parentHeight + height));
			}
		}
	},

	_initList_bindWindowHandlers () {
		$(window).on("keypress", (e) => {
			if (!EventUtil.noModifierKeys(e)) return;

			// K up; J down
			if (e.key === "k" || e.key === "j") {
				// don't switch if the user is typing somewhere else
				if (EventUtil.isInInput(e)) return;
				const it = Hist.getSelectedListElementWithLocation();

				if (it) {
					if (e.key === "k") {
						const prevLink = $(it.item.ele).prev().find("a").attr("href");
						if (prevLink !== undefined) {
							window.location.hash = prevLink;
							ListUtil._initList_scrollToItem();
						} else {
							const lists = ListUtil.getPrimaryLists();
							let x = it.x;
							while (--x >= 0) {
								const l = lists[x];
								if (l.visibleItems.length) {
									const goTo = $(l.visibleItems[l.visibleItems.length - 1].ele).find("a").attr("href");
									if (goTo) {
										window.location.hash = goTo;
										ListUtil._initList_scrollToItem();
									}
									return;
								}
							}
						}
						const fromPrevSibling = $(it.item.ele).closest(`ul`).parent().prev(`li`).find(`ul li`).last().find("a").attr("href");
						if (fromPrevSibling) {
							window.location.hash = fromPrevSibling;
						}
					} else if (e.key === "j") {
						const nextLink = $(it.item.ele).next().find("a").attr("href");
						if (nextLink !== undefined) {
							window.location.hash = nextLink;
							ListUtil._initList_scrollToItem();
						} else {
							const lists = ListUtil.getPrimaryLists();
							let x = it.x;
							while (++x < lists.length) {
								const l = lists[x];
								if (l.visibleItems.length) {
									const goTo = $(l.visibleItems[0].ele).find("a").attr("href");
									if (goTo) {
										window.location.hash = goTo;
										ListUtil._initList_scrollToItem();
									}
									return;
								}
							}
						}
						const fromNxtSibling = $(it.item.ele).closest(`ul`).parent().next(`li`).find(`ul li`).first().find("a").attr("href");
						if (fromNxtSibling) {
							window.location.hash = fromNxtSibling;
						}
					}
				}
			}
		});
	},

	updateSelected () {
		const curSelectedItem = Hist.getSelectedListItem();
		ListUtil._primaryLists.forEach(l => l.updateSelected(curSelectedItem));
	},

	openContextMenu (evt, list, listItem) {
		const listsWithSelections = ListUtil._primaryLists.map(l => ({l, selected: l.getSelected()}));

		let selection;
		if (listsWithSelections.some(it => it.selected.length)) {
			const isItemInSelection = listsWithSelections.some(it => it.selected.some(li => li === listItem));
			if (isItemInSelection) {
				selection = listsWithSelections.map(it => it.selected).flat();
				// trigger a context menu event with all the selected items
			} else {
				ListUtil._primaryLists.forEach(l => l.deselectAll());
				list.doSelect(listItem);
				selection = [listItem]
			}
		} else {
			list.doSelect(listItem);
			selection = [listItem]
		}

		const menu = ListUtil.contextMenuPinnableList || ListUtil.contextMenuAddableList;
		ContextUtil.pOpenMenu(evt, menu, {ele: listItem.ele, selection});
	},

	openSubContextMenu (evt, listItem) {
		const menu = ListUtil.contextMenuPinnableListSub || ListUtil.contextMenuAddableListSub;
		const ele = listItem.ele instanceof $ ? listItem.ele[0] : listItem.ele;
		ContextUtil.pOpenMenu(evt, menu, {ele: ele, selection: [listItem]});
	},

	$sublistContainer: null,
	sublist: null,
	_sublistChangeFn: null,
	_pCustomHashHandler: null,
	_allItems: null,
	_primaryLists: [],
	_pinned: {},
	initSublist (options) {
		if (options.itemList !== undefined) ListUtil._allItems = options.itemList; delete options.itemList;
		if (options.getSublistRow !== undefined) ListUtil._getSublistRow = options.getSublistRow; delete options.getSublistRow;
		if (options.onUpdate !== undefined) ListUtil._sublistChangeFn = options.onUpdate; delete options.onUpdate;
		if (options.primaryLists !== undefined) ListUtil._primaryLists = options.primaryLists; delete options.primaryLists;
		if (options.customHashHandler !== undefined) ListUtil._pCustomHashHandler = options.customHashHandler; delete options.customHashHandler;
		if (options.customHashUnpacker !== undefined) ListUtil._customHashUnpackFn = options.customHashUnpacker; delete options.customHashUnpacker;

		ListUtil.$sublistContainer = $("#sublistcontainer");
		const $wrpSublist = $(`ul.${options.listClass}`);
		const sublist = new List({...options, $wrpList: $wrpSublist, isUseJquery: true});
		ListUtil.sublist = sublist;

		if (ListUtil.$sublistContainer.hasClass(`sublist--resizable`)) ListUtil._pBindSublistResizeHandlers(ListUtil.$sublistContainer);

		return sublist;
	},

	setOptions (options) {
		if (options.itemList !== undefined) ListUtil._allItems = options.itemList;
		if (options.getSublistRow !== undefined) ListUtil._getSublistRow = options.getSublistRow;
		if (options.onUpdate !== undefined) ListUtil._sublistChangeFn = options.onUpdate;
		if (options.primaryLists !== undefined) ListUtil._primaryLists = options.primaryLists;
		if (options.customHashHandler !== undefined) ListUtil._pCustomHashHandler = options.customHashHandler;
		if (options.customHashUnpacker !== undefined) ListUtil._customHashUnpackFn = options.customHashUnpacker;
	},

	getPrimaryLists () { return this._primaryLists; },

	__mouseMoveId: 1,
	async _pBindSublistResizeHandlers ($ele) {
		const STORAGE_KEY = "SUBLIST_RESIZE";
		const BORDER_SIZE = 3;
		const MOUSE_MOVE_ID = ListUtil.__mouseMoveId++;
		const $doc = $(document);

		let mousePos;
		function resize (evt) {
			const dx = evt.clientY - mousePos;
			mousePos = evt.clientY;
			$ele.css("height", parseInt($ele.css("height")) + dx);
		}

		$ele.on("mousedown", (evt) => {
			if (evt.which === 1 && evt.target === $ele[0]) {
				evt.preventDefault();
				if (evt.offsetY > $ele.height() - BORDER_SIZE) {
					mousePos = evt.clientY;
					$doc.on(`mousemove.sublist_resize-${MOUSE_MOVE_ID}`, resize);
				}
			}
		});

		$doc.on("mouseup", (evt) => {
			if (evt.which === 1) {
				$(document).off(`mousemove.sublist_resize-${MOUSE_MOVE_ID}`);
				StorageUtil.pSetForPage(STORAGE_KEY, $ele.css("height"));
			}
		});

		const storedHeight = await StorageUtil.pGetForPage(STORAGE_KEY);
		if (storedHeight) $ele.css("height", storedHeight);
	},

	getOrTabRightButton: (id, icon) => {
		let $btn = $(`#${id}`);
		if (!$btn.length) {
			$btn = $(`<button class="ui-tab__btn-tab-head btn btn-default" id="${id}"><span class="glyphicon glyphicon-${icon}"></span></button>`).appendTo($(`#tabs-right`));
		}
		return $btn;
	},

	bindPinButton: () => {
		ListUtil.getOrTabRightButton(`btn-pin`, `pushpin`)
			.off("click")
			.on("click", () => {
				if (!ListUtil.isSublisted(Hist.lastLoadedId)) ListUtil.pDoSublistAdd(Hist.lastLoadedId, true);
				else ListUtil.pDoSublistRemove(Hist.lastLoadedId);
			})
			.title("Pin (Toggle)");
	},

	genericAddButtonHandler (evt, options = {}) {
		if (evt.shiftKey) ListUtil.pDoSublistAdd(Hist.lastLoadedId, true, options.shiftCount || 20);
		else ListUtil.pDoSublistAdd(Hist.lastLoadedId, true);
	},
	bindAddButton: (handlerGenerator, options = {}) => {
		ListUtil.getOrTabRightButton(`btn-sublist-add`, `plus`)
			.off("click")
			.title(`Add (SHIFT for ${options.shiftCount || 20})`)
			.on("click", handlerGenerator ? handlerGenerator() : ListUtil.genericAddButtonHandler);
	},

	genericSubtractButtonHandler (evt, options = {}) {
		if (evt.shiftKey) ListUtil.pDoSublistSubtract(Hist.lastLoadedId, options.shiftCount || 20);
		else ListUtil.pDoSublistSubtract(Hist.lastLoadedId);
	},
	bindSubtractButton: (handlerGenerator, options = {}) => {
		ListUtil.getOrTabRightButton(`btn-sublist-subtract`, `minus`)
			.off("click")
			.title(`Subtract (SHIFT for ${options.shiftCount || 20})`)
			.on("click", handlerGenerator ? handlerGenerator() : ListUtil.genericSubtractButtonHandler);
	},

	/**
	 * @param opts
	 * @param [opts.download]
	 * @param [opts.upload]
	 * @param [opts.upload.pPreloadSublistSources]
	 * @param [opts.sendToBrew]
	 * @param [opts.sendToBrew.fnGetMeta]
	 */
	bindOtherButtons (opts) {
		opts = opts || {};

		const $btnOptions = ListUtil.getOrTabRightButton(`btn-sublist-other`, `option-vertical`);

		const contextOptions = [];

		if (opts.download) {
			const action = new ContextUtil.Action(
				"Download Pinned List (SHIFT to Copy Link)",
				async evt => {
					if (evt.shiftKey) {
						const toEncode = JSON.stringify(ListUtil.getExportableSublist());
						const parts = [window.location.href, (UrlUtil.packSubHash(ListUtil.SUB_HASH_PREFIX, [toEncode], {isEncodeBoth: true}))];
						await MiscUtil.pCopyTextToClipboard(parts.join(HASH_PART_SEP));
						JqueryUtil.showCopiedEffect($btnOptions);
					} else {
						DataUtil.userDownload(ListUtil._getDownloadName(), JSON.stringify(ListUtil.getExportableSublist(), null, "\t"));
					}
				},
			);
			contextOptions.push(action);
		}

		if (opts.upload) {
			const action = new ContextUtil.Action(
				"Upload Pinned List (SHIFT for Add Only)",
				evt => {
					function pHandleIptChange (event, additive) {
						const input = event.target;

						const reader = new FileReader();
						reader.onload = async () => {
							const text = reader.result;
							const json = JSON.parse(text);
							$iptAdd.remove();
							if (typeof opts.upload === "object" && opts.upload.pFnPreLoad) await opts.upload.pFnPreLoad(json);
							await ListUtil.pDoJsonLoad(json, additive);
						};
						reader.readAsText(input.files[0]);
					}

					const additive = evt.shiftKey;
					const $iptAdd = $(`<input type="file" accept=".json" style="position: fixed; top: -100px; left: -100px; display: none;">`)
						.on("change", (evt) => pHandleIptChange(evt, additive))
						.appendTo($(`body`));
					$iptAdd.click();
				},
			);
			contextOptions.push(action);
		}

		if (opts.sendToBrew) {
			if (contextOptions.length) contextOptions.push(null); // Add a spacer after the previous group

			const action = new ContextUtil.Action(
				"Edit in Homebrew Builder",
				() => {
					const meta = opts.sendToBrew.fnGetMeta();
					const toLoadData = [meta.page, meta.source, meta.hash];
					window.location = `${UrlUtil.PG_MAKE_BREW}#${opts.sendToBrew.mode.toUrlified()}${HASH_PART_SEP}${UrlUtil.packSubHash("statemeta", toLoadData)}`;
				},
			);
			contextOptions.push(action);
		}

		const menu = ContextUtil.getMenu(contextOptions);
		$btnOptions
			.off("click")
			.on("click", evt => ContextUtil.pOpenMenu(evt, menu));
	},

	async pDoJsonLoad (json, additive) {
		await ListUtil._pLoadSavedSublist(json.items, additive);
		await ListUtil._pFinaliseSublist();
	},

	async pSetFromSubHashes (subHashes, pFnPreLoad) {
		const unpacked = {};
		subHashes.forEach(s => Object.assign(unpacked, UrlUtil.unpackSubHash(s, true)));
		const setFrom = unpacked[ListUtil.SUB_HASH_PREFIX];
		if (setFrom) {
			const json = JSON.parse(setFrom);

			if (pFnPreLoad) {
				await pFnPreLoad(json);
			}

			await ListUtil._pLoadSavedSublist(json.items, false);
			await ListUtil._pFinaliseSublist();

			const [link, ...sub] = Hist.getHashParts();
			const outSub = [];
			Object.keys(unpacked)
				.filter(k => k !== ListUtil.SUB_HASH_PREFIX)
				.forEach(k => {
					outSub.push(`${k}${HASH_SUB_KV_SEP}${unpacked[k].join(HASH_SUB_LIST_SEP)}`);
				});
			Hist.setSuppressHistory(true);
			window.location.hash = `#${link}${outSub.length ? `${HASH_PART_SEP}${outSub.join(HASH_PART_SEP)}` : ""}`;
		}
	},

	_getPinnedCount (index, data) {
		const base = ListUtil._pinned[index];
		if (!base) return null;
		if (data && data.customHashId) return base[data.customHashId];
		return base._;
	},

	_setPinnedCount (index, count, data) {
		const base = ListUtil._pinned[index];
		const key = data && data.customHashId ? data.customHashId : "_";
		if (base) base[key] = count;
		else (ListUtil._pinned[index] = {})[key] = count;
	},

	_deletePinnedCount (index, data) {
		const base = ListUtil._pinned[index];
		if (base) {
			if (data && data.customHashId) delete base[data.customHashId];
			else delete base._;
		}
	},

	async pDoSublistAdd (index, doFinalise, addCount, data) {
		if (index == null) {
			return JqueryUtil.doToast({
				content: "Please first view something from the list.",
				type: "danger",
			});
		}

		const count = ListUtil._getPinnedCount(index, data) || 0;
		addCount = addCount || 1;
		ListUtil._setPinnedCount(index, count + addCount, data);

		if (count !== 0) {
			ListUtil._setViewCount(index, count + addCount, data);
			if (doFinalise) await ListUtil._pFinaliseSublist();
		} else {
			const listItem = await ListUtil._getSublistRow(ListUtil._allItems[index], index, addCount, data);
			ListUtil.sublist.addItem(listItem);
			if (doFinalise) await ListUtil._pFinaliseSublist();
		}
	},

	async pDoSublistSubtract (index, subtractCount, data) {
		const count = ListUtil._getPinnedCount(index, data);
		subtractCount = subtractCount || 1;
		if (count > subtractCount) {
			ListUtil._setPinnedCount(index, count - subtractCount, data);
			ListUtil._setViewCount(index, count - subtractCount, data);
			ListUtil.sublist.update();
			await ListUtil._pSaveSublist();
			ListUtil._handleCallUpdateFn();
		} else if (count) await ListUtil.pDoSublistRemove(index, data);
	},

	getSublisted () {
		const cpy = MiscUtil.copy(ListUtil._pinned);
		const out = {};
		Object.keys(cpy).filter(k => Object.keys(cpy[k]).length).forEach(k => out[k] = cpy[k]);
		return out;
	},

	getSublistedIds () {
		return Object.keys(ListUtil._pinned).filter(k => Object.keys(ListUtil._pinned[k]).length).map(it => Number(it));
	},

	_setViewCount: (index, newCount, data) => {
		let foundItem;
		if (data && data.customHashId != null) {
			foundItem = ListUtil.sublist.items.find(it => it.data.customHashId === data.customHashId);
		} else {
			foundItem = ListUtil.sublist.items.find(it => it.data.customHashId == null && it.ix === index);
		}

		foundItem.values.count = newCount;
		foundItem.data.$elesCount.forEach($ele => {
			if ($ele.is("input")) $ele.val(newCount);
			else $ele.text(newCount);
		})
	},

	async _pFinaliseSublist (noSave) {
		ListUtil.sublist.update();
		ListUtil._updateSublistVisibility();
		if (!noSave) await ListUtil._pSaveSublist();
		ListUtil._handleCallUpdateFn();
	},

	getExportableSublist: () => {
		const sources = new Set();
		const toSave = ListUtil.sublist.items
			.map(it => {
				sources.add(ListUtil._allItems[it.ix].source);
				return {h: it.values.hash.split(HASH_PART_SEP)[0], c: it.values.count || undefined, customHashId: it.data.customHashId};
			});
		return {items: toSave, sources: Array.from(sources)};
	},

	async _pSaveSublist () {
		await StorageUtil.pSetForPage("sublist", ListUtil.getExportableSublist());
	},

	_updateSublistVisibility: () => {
		if (ListUtil.sublist.items.length) ListUtil.$sublistContainer.addClass("sublist--visible");
		else ListUtil.$sublistContainer.removeClass("sublist--visible");
	},

	async pDoSublistRemove (index, data) {
		ListUtil._deletePinnedCount(index, data);
		if (data && data.customHashId) ListUtil.sublist.removeItemByData("customHashId", data.customHashId);
		else ListUtil.sublist.removeItem(index);
		ListUtil.sublist.update();
		ListUtil._updateSublistVisibility();
		await ListUtil._pSaveSublist();
		ListUtil._handleCallUpdateFn();
	},

	async pDoSublistRemoveAll (noSave) {
		ListUtil._pinned = {};
		ListUtil.sublist.removeAllItems();
		ListUtil.sublist.update();
		ListUtil._updateSublistVisibility();
		if (!noSave) await ListUtil._pSaveSublist();
		ListUtil._handleCallUpdateFn();
	},

	isSublisted: (index, data) => {
		return ListUtil._getPinnedCount(index, data);
	},

	mapSelectedWithDeslect (list, mapFunc) {
		return list.getSelected()
			.map(it => {
				it.isSelected = false;
				mapFunc(it.ix);
			});
	},

	_handleCallUpdateFn: () => {
		if (ListUtil._sublistChangeFn) ListUtil._sublistChangeFn();
	},

	_hasLoadedState: false,
	async pLoadState () {
		if (ListUtil._hasLoadedState) return;
		ListUtil._hasLoadedState = true;
		try {
			const store = await StorageUtil.pGetForPage("sublist");
			if (store && store.items) {
				await ListUtil._pLoadSavedSublist(store.items);
			}
		} catch (e) {
			setTimeout(() => { throw e });
			await StorageUtil.pRemoveForPage("sublist");
		}
	},

	async _pLoadSavedSublist (items, additive) {
		if (!additive) await ListUtil.pDoSublistRemoveAll(true);

		const toLoad = items.map(it => {
			const item = Hist.getActiveListItem(it.h);
			if (item != null) {
				const out = {index: item.ix, addCount: Number(it.c)};
				if (ListUtil._customHashUnpackFn && it.customHashId) out.data = ListUtil._customHashUnpackFn(it.customHashId);
				return out;
			}
			return null;
		}).filter(it => it);

		// Do this in series to ensure sublist items are added before having their counts updated
		//  This only becomes a problem when there are duplicate items in the list, but as we're not finalizing, the
		//  performance implications are negligible.
		for (const it of toLoad) await ListUtil.pDoSublistAdd(it.index, false, it.addCount, it.data);
		await ListUtil._pFinaliseSublist(true);
	},

	async pGetSelectedSources () {
		let store;
		try {
			store = await StorageUtil.pGetForPage("sublist");
		} catch (e) {
			setTimeout(() => { throw e });
		}
		if (store && store.sources) return store.sources;
	},

	contextMenuPinnableList: null,
	contextMenuPinnableListSub: null,
	initGenericPinnable () {
		if (ListUtil.contextMenuPinnableList) return;

		ListUtil.contextMenuPinnableList = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Popout",
				(evt, userData) => {
					const {ele, selection} = userData;
					ListUtil._handleGenericContextMenuClick_pDoMassPopout(evt, ele, selection);
				},
			),
			new ContextUtil.Action(
				"Pin",
				async () => {
					await Promise.all(
						ListUtil._primaryLists.map(l => Promise.all(ListUtil.mapSelectedWithDeslect(l, (it) => ListUtil.isSublisted(it) ? Promise.resolve() : ListUtil.pDoSublistAdd(it)))),
					);
					await ListUtil._pFinaliseSublist();
				},
			),
		]);

		const subActions = [
			new ContextUtil.Action(
				"Popout",
				(evt, userData) => {
					const {ele, selection} = userData;
					ListUtil._handleGenericContextMenuClick_pDoMassPopout(evt, ele, selection);
				},
			),
			new ContextUtil.Action(
				"Unpin",
				(evt, userData) => {
					const {selection} = userData;
					selection.forEach(item => ListUtil.pDoSublistRemove(item.ix));
				},
			),
			new ContextUtil.Action(
				"Clear Pins",
				() => ListUtil.pDoSublistRemoveAll(),
			),
			null,
			new ContextUtil.Action(
				"Roll on List",
				() => ListUtil._rollSubListed(),
			),
			null,
			new ContextUtil.Action(
				"Send to DM Screen",
				() => ListUtil._pDoSendSublistToDmScreen(),
			),
			ExtensionUtil.ACTIVE
				? new ContextUtil.Action(
					"Send to Foundry",
					() => ListUtil._pDoSendSublistToFoundry(),
				)
				: undefined,
			null,
			new ContextUtil.Action(
				"Download JSON Data",
				() => ListUtil._handleJsonDownload(),
			),
		].filter(it => it !== undefined);
		ListUtil.contextMenuPinnableListSub = ContextUtil.getMenu(subActions);
	},

	contextMenuAddableList: null,
	contextMenuAddableListSub: null,
	initGenericAddable () {
		ListUtil.contextMenuAddableList = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Popout",
				(evt, userData) => {
					const {ele, selection} = userData;
					ListUtil._handleGenericContextMenuClick_pDoMassPopout(evt, ele, selection);
				},
			),
			new ContextUtil.Action(
				"Add",
				async () => {
					await Promise.all(
						ListUtil._primaryLists.map(l => Promise.all(ListUtil.mapSelectedWithDeslect(l, (it) => ListUtil.pDoSublistAdd(it)))),
					);
					await ListUtil._pFinaliseSublist();
					ListUtil.updateSelected();
				},
			),
		]);

		const subActions = [
			new ContextUtil.Action(
				"Popout",
				(evt, userData) => {
					const {ele, selection} = userData;
					ListUtil._handleGenericContextMenuClick_pDoMassPopout(evt, ele, selection)
				},
			),
			new ContextUtil.Action(
				"Remove",
				(evt, userData) => {
					const {selection} = userData;
					selection.forEach(item => {
						if (item.data.customHashId) ListUtil.pDoSublistRemove(item.ix, {customHashId: item.data.customHashId});
						else ListUtil.pDoSublistRemove(item.ix);
					});
				},
			),
			new ContextUtil.Action(
				"Clear List",
				() => ListUtil.pDoSublistRemoveAll(),
			),
			null,
			new ContextUtil.Action(
				"Roll on List",
				() => ListUtil._rollSubListed(),
			),
			null,
			new ContextUtil.Action(
				"Send to DM Screen",
				() => ListUtil._pDoSendSublistToDmScreen(),
			),
			ExtensionUtil.ACTIVE
				? new ContextUtil.Action(
					"Send to Foundry",
					() => ListUtil._pDoSendSublistToFoundry(),
				)
				: undefined,
			null,
			new ContextUtil.Action(
				"Download JSON Data",
				() => ListUtil._handleJsonDownload(),
			),
		].filter(it => it !== undefined);
		ListUtil.contextMenuAddableListSub = ContextUtil.getMenu(subActions);
	},

	async _pDoSendSublistToDmScreen () {
		try {
			const list = ListUtil.getExportableSublist();
			const len = list.items.length;
			await StorageUtil.pSet(VeCt.STORAGE_DMSCREEN_TEMP_SUBLIST, {page: UrlUtil.getCurrentPage(), list});
			JqueryUtil.doToast(`${len} pin${len === 1 ? "" : "s"} will be loaded into the DM Screen on your next visit.`)
		} catch (e) {
			JqueryUtil.doToast(`Failed! ${VeCt.STR_SEE_CONSOLE}`);
			setTimeout(() => { throw e; })
		}
	},

	async _pDoSendSublistToFoundry () {
		const list = ListUtil.getExportableSublist();
		const len = list.items.length;

		const page = UrlUtil.getCurrentPage();

		for (const it of list.items) {
			let toSend = await Renderer.hover.pCacheAndGetHash(page, it.h);

			switch (page) {
				case UrlUtil.PG_BESTIARY: {
					const scaleTo = it.customHashId ? Parser.numberToCr(Number(it.customHashId.split("_").last())) : null;
					if (scaleTo != null) {
						toSend = await ScaleCreature.scale(toSend, scaleTo);
					}
				}
			}

			await ExtensionUtil._doSend("entity", {page, entity: toSend});
		}

		JqueryUtil.doToast(`Attepmted to send ${len} item${len === 1 ? "" : "s"} to Foundry.`);
	},

	async _handleGenericContextMenuClick_pDoMassPopout (evt, ele, selection) {
		const page = UrlUtil.getCurrentPage();

		const elePos = ele.getBoundingClientRect();

		// do this in serial to have a "window cascade" effect
		for (let i = 0; i < selection.length; ++i) {
			const listItem = selection[i];
			const toRender = ListUtil._allItems[listItem.ix];
			const hash = UrlUtil.autoEncodeHash(toRender);
			const posOffset = Renderer.hover._BAR_HEIGHT * i;

			Renderer.hover.getShowWindow(
				Renderer.hover.$getHoverContent_stats(UrlUtil.getCurrentPage(), toRender),
				Renderer.hover.getWindowPositionExact(
					elePos.x + posOffset,
					elePos.y + posOffset,
					evt,
				),
				{
					title: toRender.name,
					isPermanent: true,
					pageUrl: `${page}#${hash}`,
				},
			);
		}
	},

	_isRolling: false,
	_rollSubListed () {
		const timerMult = RollerUtil.randomise(125, 75);
		const timers = [0, 1, 1, 1, 1, 1, 1.5, 1.5, 1.5, 2, 2, 2, 2.5, 3, 4, -1] // last element is always sliced off
			.map(it => it * timerMult)
			.slice(0, -RollerUtil.randomise(4, 1));

		function generateSequence (array, length) {
			const out = [RollerUtil.rollOnArray(array)];
			for (let i = 0; i < length; ++i) {
				let next = RollerUtil.rollOnArray(array);
				while (next === out.last()) {
					next = RollerUtil.rollOnArray(array);
				}
				out.push(next);
			}
			return out;
		}

		if (!ListUtil._isRolling) {
			ListUtil._isRolling = true;
			const $eles = ListUtil.sublist.items
				.map(it => $(it.ele).find(`a`));

			if ($eles.length <= 1) {
				JqueryUtil.doToast({
					content: "Not enough entries to roll!",
					type: "danger",
				});
				return ListUtil._isRolling = false;
			}

			const $sequence = generateSequence($eles, timers.length);

			let total = 0;
			timers.map((it, i) => {
				total += it;
				setTimeout(() => {
					$sequence[i][0].click();
					if (i === timers.length - 1) ListUtil._isRolling = false;
				}, total);
			});
		}
	},

	_getDownloadName () {
		return `${UrlUtil.getCurrentPage().replace(".html", "")}-sublist`;
	},

	genericPinKeyMapper (pMapUid = ListUtil._pCustomHashHandler) {
		return Object.entries(ListUtil.getSublisted()).map(([id, it]) => {
			return Object.keys(it).map(k => {
				const it = ListUtil._allItems[id];
				return k === "_" ? Promise.resolve(MiscUtil.copy(it)) : pMapUid(it, k);
			}).reduce((a, b) => a.concat(b), []);
		}).reduce((a, b) => a.concat(b), []);
	},

	_handleJsonDownload () {
		if (ListUtil._pCustomHashHandler) {
			const promises = ListUtil.genericPinKeyMapper();

			Promise.all(promises).then(data => {
				data.forEach(cpy => DataUtil.cleanJson(cpy));
				DataUtil.userDownload(`${ListUtil._getDownloadName()}-data`, data);
			});
		} else {
			const out = ListUtil.getSublistedIds().map(id => {
				const cpy = JSON.parse(JSON.stringify(ListUtil._allItems[id]));
				DataUtil.cleanJson(cpy);
				return cpy;
			});
			DataUtil.userDownload(`${ListUtil._getDownloadName()}-data`, out);
		}
	},

	bindShowTableButton (id, title, dataList, colTransforms, filter, sorter) {
		$(`#${id}`).click("click", () => ListUtil.showTable(title, dataList, colTransforms, filter, sorter));
	},

	basicFilterGenerator () {
		const slIds = ListUtil.getSublistedIds();
		if (slIds.length) {
			const slIdSet = new Set(slIds);
			return slIdSet.has.bind(slIdSet);
		} else {
			const visibleIds = new Set(ListUtil.getVisibleIds());
			return visibleIds.has.bind(visibleIds);
		}
	},

	getVisibleIds () {
		return ListUtil._primaryLists.map(l => l.visibleItems.map(it => it.ix)).flat();
	},

	// FIXME move this out
	showTable (title, dataList, colTransforms, filter, sorter) {
		const {$modal} = UiUtil.getShowModal({
			isWidth100: true,
			isHeight100: true,
			isUncappedWidth: true,
			isUncappedHeight: true,
			isEmpty: true,
		});

		const $pnlControl = $(`<div class="split my-3"/>`).appendTo($modal);
		const $pnlCols = $(`<div class="flex" style="align-items: center;"/>`).appendTo($pnlControl);
		Object.values(colTransforms).forEach((c, i) => {
			const $wrpCb = $(`<label class="flex-${c.flex || 1} px-2 mr-2 no-wrap flex-inline-v-center"><span class="mr-2">${c.name}</span></label>`).appendTo($pnlCols);
			const $cbToggle = $(`<input type="checkbox" data-name="${c.name}" checked>`)
				.click(() => {
					const toToggle = $modal.find(`.col_${i}`);
					if ($cbToggle.prop("checked")) {
						toToggle.show();
					} else {
						toToggle.hide();
					}
				})
				.appendTo($wrpCb);
		});
		const $pnlBtns = $(`<div/>`).appendTo($pnlControl);
		function getAsCsv () {
			const headers = $pnlCols.find(`input:checked`).map((i, e) => $(e).data("name")).get();
			const rows = $modal.find(`.data-row`).map((i, e) => $(e)).get().map($e => {
				return $e.children().filter(`td:visible`).map((j, d) => $(d).text().trim()).get();
			});
			return DataUtil.getCsv(headers, rows);
		}
		const $btnCsv = $(`<button class="btn btn-primary mr-3">Download CSV</button>`).click(() => {
			DataUtil.userDownloadText(`${title}.csv`, getAsCsv());
		}).appendTo($pnlBtns);
		const $btnCopy = $(`<button class="btn btn-primary">Copy CSV to Clipboard</button>`).click(async () => {
			await MiscUtil.pCopyTextToClipboard(getAsCsv());
			JqueryUtil.showCopiedEffect($btnCopy);
		}).appendTo($pnlBtns);
		$modal.append(`<hr class="hr-1">`);

		if (typeof filter === "object" && filter.generator) filter = filter.generator();

		let stack = `<div class="overflow-y-auto w-100 h-100 flex-col"><table class="table-striped stats stats--book stats--book-large" style="width: 100%;"><thead><tr>${Object.values(colTransforms).map((c, i) => `<th class="col_${i} px-2" colspan="${c.flex || 1}">${c.name}</th>`).join("")}</tr></thead><tbody>`;
		const listCopy = JSON.parse(JSON.stringify(dataList)).filter((it, i) => filter ? filter(i) : it);
		if (sorter) listCopy.sort(sorter);
		listCopy.forEach(it => {
			stack += `<tr class="data-row">`;
			stack += Object.keys(colTransforms).map((k, i) => {
				const c = colTransforms[k];
				return `<td class="col_${i} px-2" colspan="${c.flex || 1}">${c.transform === true ? it[k] : c.transform(k[0] === "_" ? it : it[k])}</td>`;
			}).join("");
			stack += `</tr>`;
		});
		stack += `</tbody></table></div>`;
		$modal.append(stack);
	},

	addListShowHide () {
		$(`#filter-search-group`).find(`#reset`).before(`<button class="btn btn-default" id="hidesearch">Hide</button>`);
		$(`#contentwrapper`).prepend(`<div class="col-12" id="showsearch"><button class="btn btn-block btn-default btn-xs" type="button">Show Filter</button><br></div>`);

		const $wrpList = $(`#listcontainer`);
		const $wrpBtnShowSearch = $("div#showsearch");
		const $btnHideSearch = $("button#hidesearch");
		$btnHideSearch.title("Hide Search Bar and Entry List");
		// collapse/expand search button
		$btnHideSearch.click(function () {
			$wrpList.hide();
			$wrpBtnShowSearch.show();
			$btnHideSearch.hide();
		});
		$wrpBtnShowSearch.find("button").click(function () {
			$wrpList.show();
			$wrpBtnShowSearch.hide();
			$btnHideSearch.show();
		});
	},
};
