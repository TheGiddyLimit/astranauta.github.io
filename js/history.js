"use strict";

class History {
	static hashChange (evt) {
		if (History.isHistorySuppressed) {
			History.setSuppressHistory(false);
			return;
		}

		const [link, ...sub] = History._getHashParts();

		let blankFilterLoad = false;
		if (!evt || sub.length === 0) {
			if (link === HASH_BLANK) {
				blankFilterLoad = true;
			} else {
				const $el = History._getListElem(link);
				if ($el === undefined) {
					if (typeof handleUnknownHash === "function" && window.location.hash.length) {
						handleUnknownHash(link, sub);
						return;
					} else {
						History._freshLoad();
						return;
					}
				}
				const toLoad = $el.attr("id");
				if (toLoad === undefined) History._freshLoad();
				else {
					const id = $el.attr("id");
					History.lastLoadedId = id;
					loadhash(id);
					document.title = decodeURIComponent($el.attr("title")) + " - 5etools";
				}
			}
		}

		if (typeof loadsub === "function" && sub.length > 0) loadsub(sub);
		if (blankFilterLoad) {
			window.location.hash = "";
		}
	}

	static init (initialLoadComplete) {
		window.onhashchange = History.hashChange;
		if (window.location.hash.length) {
			History.hashChange();
		} else {
			History._freshLoad();
		}
		if (initialLoadComplete) History.initialLoad = false;
	}

	/**
	 * Allows the hash to be modified without triggering a hashchange
	 * @param val
	 */
	static setSuppressHistory (val) {
		History.isHistorySuppressed = val;
	}

	static getSelectedListElement () {
		const [link, ...sub] = History._getHashParts();
		return History._getListElem(link);
	}

	static getSelectedListElementWithIndex () {
		const [link, ...sub] = History._getHashParts();
		return History._getListElem(link, true);
	}

	static _getHashParts () {
		return window.location.hash.slice(1).replace(/%27/g, "'").split(HASH_PART_SEP);
	}

	static _getListElem (link, getIndex) {
		const toFind = `a[href="#${link.toLowerCase()}"]`;
		const listWrapper = $("#listcontainer");
		if (listWrapper.data("lists")) {
			for (let x = 0; x < listWrapper.data("lists").length; ++x) {
				const list = listWrapper.data("lists")[x];
				for (let y = 0; y < list.items.length; ++y) {
					const item = list.items[y];
					const $elm = $(item.elm).find(toFind);
					if ($elm[0]) {
						if (getIndex) return {$el: $elm, x: x, y: y};
						return $elm
					}
				}
			}
		}
		return undefined;
	}

	static _freshLoad () {
		// defer this, in case the list needs to filter first
		setTimeout(() => {
			const goTo = $("#listcontainer").find(".list a").attr('href');
			if (goTo) location.replace(goTo);
		}, 1);
	}

	static cleanSetHash (toSet) {
		window.location.hash = toSet.replace(/,+/g, ",").replace(/,$/, "").toLowerCase();
	}
}
History.lastLoadedId = null;
History.initialLoad = true;
History.isHistorySuppressed = false;