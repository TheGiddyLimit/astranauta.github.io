class ListItem {
	/**
	 * @param ix External ID information (e.g. the location of the entry this ListItem represents in a list of entries)
	 * @param ele An element, or jQuery element if the list is in jQuery mode.
	 * @param name A name for this item.
	 * @param values A dictionary of indexed values for this item.
	 * @param [data] An optional dictionary of additional data to store with the item (not indexed).
	 */
	constructor (ix, ele, name, values, data) {
		this.ix = ix;
		this.ele = ele;
		this.name = name;
		this.values = values || {};
		this.data = data || {};

		let searchText = `${this.name} - `;
		for (const k in this.values) {
			const v = this.values[k]; // unsafe for performance
			if (!v) continue;
			searchText += `${v} - `;
		}
		this.searchText = searchText.toLowerCase();

		this._isSelected = false;
	}

	set isSelected (val) {
		if (this._isSelected === val) return;
		this._isSelected = val;

		if (this.ele instanceof $) {
			if (this._isSelected) this.ele.addClass("list-multi-selected");
			else this.ele.removeClass("list-multi-selected");
		} else {
			if (this._isSelected) this.ele.classList.add("list-multi-selected");
			else this.ele.classList.remove("list-multi-selected");
		}
	}

	get isSelected () { return this._isSelected; }
}

class List {
	/**
	 * @param [opts] Options object.
	 * @param [opts.fnSort] Sort function. Should accept `(a, b, o)` where `o` is an options object. Pass `null` to
	 * disable sorting.
	 * @param [opts.$iptSearch] Search input.
	 * @param opts.$wrpList List wrapper.
	 * @param [opts.isUseJquery] If the list items are using jQuery elements. Significantly slower for large lists.
	 * @param [opts.sortByInitial] Initial sortBy.
	 * @param [opts.sortDirInitial] Initial sortDir.
	 */
	constructor (opts) {
		this._$iptSearch = opts.$iptSearch;
		this._$wrpList = opts.$wrpList;
		this._fnSort = opts.fnSort === undefined ? SortUtil.listSort : opts.fnSort;

		this._items = [];
		this._eventHandlers = {};

		this._searchTerm = List._DEFAULTS.searchTerm;
		this._sortBy = opts.sortByInitial || List._DEFAULTS.sortBy;
		this._sortDir = opts.sortDirInitial || List._DEFAULTS.sortDir;
		this._fnFilter = null;
		this._isUseJquery = opts.isUseJquery;

		this._searchedItems = [];
		this._filteredSortedItems = [];

		this._isInit = false;
		this._isDirty = false;

		// region selection
		this._prevList = null;
		this._nextList = null;
		this._lastSelection = null;
		this._isMultiSelection = false;
		// endregion
	}

	get items () { return this._items; }
	get visibleItems () { return this._filteredSortedItems; }
	get sortBy () { return this._sortBy; }
	get sortDir () { return this._sortDir; }
	set nextList (list) { this._nextList = list; }
	set prevList (list) { this._prevList = list; }

	init () {
		if (this._isInit) return;

		// This should only be run after all the elements are ready from page load
		if (this._$iptSearch) {
			UiUtil.bindTypingEnd({$ipt: this._$iptSearch, fnKeyup: () => this.search(this._$iptSearch.val())});
			this._searchTerm = List._getCleanSearchTerm(this._$iptSearch.val());
			this._init_bindEscapeKey();
		}
		this._doSearch();
		this._isInit = true;
	}

	_init_bindEscapeKey () {
		this._$iptSearch.on("keydown", evt => {
			if (evt.which !== 27) return; // escape
			this._$iptSearch.val("");
			this.search("");
		});
	}

	update () {
		if (this._isInit && this._isDirty) {
			this._doSearch();
		}
	}

	_doSearch () {
		if (this._searchTerm) this._searchedItems = this._items.filter(it => it.searchText.includes(this._searchTerm));
		else this._searchedItems = [...this._items];

		// Never show excluded items
		this._searchedItems = this._searchedItems.filter(it => !it.data.isExcluded);

		this._doFilter();
	}

	_doFilter () {
		if (this._fnFilter) this._filteredSortedItems = this._searchedItems.filter(it => this._fnFilter(it));
		else this._filteredSortedItems = this._searchedItems;
		this._doSort();
	}

	_doSort () {
		const opts = {
			sortBy: this._sortBy,
			// The sort function should generally ignore this, as we do the reversing here. We expose it in case there
			//   is specific functionality that requires it.
			sortDir: this._sortDir,
		};
		if (this._fnSort) this._filteredSortedItems.sort((a, b) => this._fnSort(a, b, opts));
		if (this._sortDir === "desc") this._filteredSortedItems.reverse();

		this._doRender();
	}

	_doRender () {
		const len = this._filteredSortedItems.length;

		if (this._isUseJquery) {
			this._$wrpList.children().detach();
			for (let i = 0; i < len; ++i) this._$wrpList.append(this._filteredSortedItems[i].ele);
		} else {
			this._$wrpList.empty();
			const frag = document.createDocumentFragment();
			for (let i = 0; i < len; ++i) frag.appendChild(this._filteredSortedItems[i].ele);
			this._$wrpList[0].appendChild(frag);
		}

		this._isDirty = false;
		this._trigger("updated");
	}

	search (searchTerm) {
		const nextTerm = List._getCleanSearchTerm(searchTerm);
		if (nextTerm !== this._searchTerm) {
			this._searchTerm = nextTerm;
			this._doSearch();
		}
	}

	filter (fnFilter) {
		if (this._fnFilter !== fnFilter) {
			this._fnFilter = fnFilter;
			this._doFilter();
		}
	}

	sort (sortBy, sortDir) {
		if (this._sortBy !== sortBy || this._sortDir !== sortDir) {
			this._sortBy = sortBy;
			this._sortDir = sortDir;
			this._doSort();
		}
	}

	reset () {
		if (this._searchTerm !== List._DEFAULTS.searchTerm) {
			this._searchTerm = List._DEFAULTS.searchTerm;
			this._doSearch();
		} else if (this._sortBy !== List._DEFAULTS.sortBy || this._sortDir !== List._DEFAULTS.sortDir) {
			this._sortBy = List._DEFAULTS.sortBy;
			this._sortDir = List._DEFAULTS.sortDir
		}
	}

	addItem (listItem) {
		this._isDirty = true;
		this._items.push(listItem);
	}

	removeItem (ix) {
		const ixItem = this._items.findIndex(it => it.ix === ix);
		if (~ixItem) {
			this._isDirty = true;
			const removed = this._items.splice(ixItem, 1);
			return removed[0];
		}
	}

	removeItemBy (valueName, value) {
		const ixItem = this._items.findIndex(it => it.values[valueName] === value);
		if (~ixItem) {
			this._isDirty = true;
			const removed = this._items.splice(ixItem, 1);
			return removed[0];
		}
	}

	removeItemByData (dataName, value) {
		const ixItem = this._items.findIndex(it => it.data[dataName] === value);
		if (~ixItem) {
			this._isDirty = true;
			const removed = this._items.splice(ixItem, 1);
			return removed[0];
		}
	}

	removeAllItems () {
		this._isDirty = true;
		this._items = [];
	}

	on (eventName, handler) { (this._eventHandlers[eventName] = this._eventHandlers[eventName] || []).push(handler); }
	_trigger (eventName) { (this._eventHandlers[eventName] || []).forEach(fn => fn()); }

	// region hacks
	/**
	 * Allows the current contents of the list wrapper to be converted to list items.
	 * Useful in situations where, for whatever reason, we can't fill the list after the fact (e.g. when using Foundry's
	 * template engine).
	 * Extremely fragile; use with caution.
	 * @param dataArr Array from which the list was rendered.
	 * @param opts Options object.
	 * @param opts.fnGetName Function which gets the name from a dataSource item.
	 * @param opts.fnGetValues Function which gets list values from a dataSource item.
	 * @param opts.fnGetData Function which gets list data from a listItem and dataSource item.
	 * @param [opts.fnBindListeners] Function which binds event listeners to the list.
	 */
	doAbsorbItems (dataArr, opts) {
		const childNodesRaw = this._$wrpList[0].childNodes;
		const childNodes = [];
		const lenRaw = childNodesRaw.length;
		for (let i = 0; i < lenRaw; ++i) if (childNodesRaw[i].nodeType !== Node.TEXT_NODE) childNodes.push(childNodesRaw[i]);

		const len = childNodes.length;
		if (len !== dataArr.length) throw new Error(`Data source length and list element length did not match!`);

		for (let i = 0; i < len; ++i) {
			const node = childNodes[i];
			const dataItem = dataArr[i];
			const listItem = new ListItem(
				i,
				node,
				opts.fnGetName(dataItem),
				opts.fnGetValues ? opts.fnGetValues(dataItem) : {},
				{},
			);
			if (opts.fnGetData) listItem.data = opts.fnGetData(listItem, dataItem);
			if (opts.fnBindListeners) opts.fnBindListeners(listItem, dataItem);
			this.addItem(listItem);
		}
	}
	// endregion

	// region selection
	doSelect (item, evt) {
		if (evt && evt.shiftKey) {
			evt.preventDefault(); // Stop a new window from being opened
			// Don't update the last selection, as we want to be able to "pivot" the multi-selection off the first selection
			if (this._prevList && this._prevList._lastSelection) {
				this._prevList._selectFromItemToEnd(this._prevList._lastSelection, true);
				this._selectToItemFromStart(item);
			} else if (this._nextList && this._nextList._lastSelection) {
				this._nextList._selectToItemFromStart(this._nextList._lastSelection, true);
				this._selectFromItemToEnd(item);
			} else if (this._lastSelection && this.visibleItems.includes(item)) {
				this._doSelect_doMulti(item);
			} else {
				this._doSelect_doSingle(item);
			}
		} else this._doSelect_doSingle(item);
	}

	_doSelect_doSingle (item) {
		if (this._isMultiSelection) {
			this.deselectAll();
			if (this._prevList) this._prevList.deselectAll();
			if (this._nextList) this._nextList.deselectAll();
		} else if (this._lastSelection) this._lastSelection.isSelected = false;

		item.isSelected = true;
		this._lastSelection = item;
	}

	_doSelect_doMulti (item) {
		this._selectFromItemToItem(this._lastSelection, item);

		if (this._prevList && this._prevList._isMultiSelection) {
			this._prevList.deselectAll();
		}

		if (this._nextList && this._nextList._isMultiSelection) {
			this._nextList.deselectAll();
		}
	}

	_selectFromItemToEnd (item, isKeepLastSelection = false) {
		this.deselectAll(isKeepLastSelection);
		this._isMultiSelection = true;
		const ixStart = this.visibleItems.indexOf(item);
		const len = this.visibleItems.length;
		for (let i = ixStart; i < len; ++i) {
			this.visibleItems[i].isSelected = true;
		}
	}

	_selectToItemFromStart (item, isKeepLastSelection = false) {
		this.deselectAll(isKeepLastSelection);
		this._isMultiSelection = true;
		const ixEnd = this.visibleItems.indexOf(item);
		for (let i = 0; i <= ixEnd; ++i) {
			this.visibleItems[i].isSelected = true;
		}
	}

	_selectFromItemToItem (item1, item2) {
		this.deselectAll(true);

		if (item1 === item2) {
			if (this._lastSelection) this._lastSelection.isSelected = false;
			item1.isSelected = true;
			this._lastSelection = item1;
			return;
		}

		const ix1 = this.visibleItems.indexOf(item1);
		const ix2 = this.visibleItems.indexOf(item2);

		this._isMultiSelection = true;
		const [ixStart, ixEnd] = [ix1, ix2].sort(SortUtil.ascSort);
		for (let i = ixStart; i <= ixEnd; ++i) {
			this.visibleItems[i].isSelected = true;
		}
	}

	deselectAll (isKeepLastSelection = false) {
		if (!isKeepLastSelection) this._lastSelection = null;
		this._isMultiSelection = false;
		this._items.forEach(it => it.isSelected = false);
	}

	updateSelected (item) {
		if (this.visibleItems.includes(item)) {
			if (this._isMultiSelection) {
				this.deselectAll(true);
			} else if (this._lastSelection) {
				if (this._lastSelection !== item) {
					this._lastSelection.isSelected = false;
					item.isSelected = true;
					this._lastSelection = item;
				}
			} else {
				item.isSelected = true;
				this._lastSelection = item;
			}
		} else this.deselectAll();
	}

	getSelected () {
		return this.visibleItems.filter(it => it.isSelected);
	}
	// endregion

	static _getCleanSearchTerm (str) {
		return (str || "").trim().toLowerCase().split(/\s+/g).join(" ");
	}
}
List._DEFAULTS = {
	searchTerm: "",
	sortBy: "name",
	sortDir: "asc",
	fnFilter: null,
};

if (typeof module !== "undefined") module.exports = {List, ListItem};
