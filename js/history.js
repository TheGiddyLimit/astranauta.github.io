"use strict";

class History {
	static hashChange (forceLoad) {
		if (History.isHistorySuppressed) {
			History.setSuppressHistory(false);
			return;
		}

		const [link, ...sub] = History._getHashParts();

		let blankFilterLoad = false;
		if (link !== History.lastLoadedLink || sub.length === 0 || forceLoad) {
			History.lastLoadedLink = link;
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

		if (typeof loadsub === "function" && (sub.length > 0 || forceLoad)) loadsub(sub);
		if (blankFilterLoad) {
			History._freshLoad();
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
		return window.location.hash.slice(1).toLowerCase().replace(/%27/g, "'").split(HASH_PART_SEP);
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
			if (goTo) {
				const parts = location.hash.split(HASH_PART_SEP);
				const fullHash = `${goTo}${parts.length > 1 ? `${HASH_PART_SEP}${parts.slice(1).join(HASH_PART_SEP)}` : ""}`;
				location.replace(fullHash);
			}
		}, 1);
	}

	static cleanSetHash (toSet) {
		window.location.hash = toSet.replace(/,+/g, ",").replace(/,$/, "").toLowerCase();
	}

	static getHashSource () {
		const [link, ...sub] = History._getHashParts();
		// by convention, the source is the last hash segment
		return link ? link.split(HASH_LIST_SEP).last() : null;
	}

	static getSubHash (key) {
		const [link, ...sub] = History._getHashParts();
		const hKey = `${key}${HASH_SUB_KV_SEP}`;
		const part = sub.find(it => it.startsWith(hKey));
		if (part) return part.slice(hKey.length);
		return null;
	}

	/**
	 * Sets a subhash with the key specified, overwriting any existing.
	 * @param key Subhash key.
	 * @param val Subhash value. Passing a nully object removes the k/v pair.
	 */
	static setSubhash (key, val) {
		const [link, ...sub] = History._getHashParts();
		if (!link) History.cleanSetHash("");

		const hKey = `${key}${HASH_SUB_KV_SEP}`;
		const out = [link];
		if (sub.length) sub.filter(it => !it.startsWith(hKey)).forEach(it => out.push(it));
		if (val != null) out.push(`${hKey}${val}`);

		History.cleanSetHash(out.join(HASH_PART_SEP));
	}
}
History.lastLoadedLink = null;
History.lastLoadedId = null;
History.initialLoad = true;
History.isHistorySuppressed = false;
