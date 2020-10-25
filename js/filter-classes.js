"use strict";

class PageFilterClasses extends PageFilter {
	constructor () {
		super({
			sourceFilterOpts: {
				displayFnMini: it => Parser.sourceJsonToAbv(it),
				displayFnTitle: it => Parser.sourceJsonToFull(it),
				itemSortFnMini: (a, b) => SortUtil.ascSort(Parser.sourceJsonToAbv(a.item), Parser.sourceJsonToAbv(b.item)),
			},
		});

		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Reprinted", "SRD"],
			deselFn: (it) => { return it === "Reprinted" },
			displayFnMini: it => it === "Reprinted" ? "Repr." : it,
			displayFnTitle: it => it === "Reprinted" ? it : "",
			isSrdFilter: true,
		});

		// region source
		this._sourceWalker = MiscUtil.getWalker({keyBlacklist: new Set(["type", "data"])}).walk;
		this._sourcePrimitiveHandlers = {
			string: (obj, lastKey) => {
				if (lastKey === "source") this._sourceFilter.addItem(obj);
				return obj;
			},
		};
		// endregion
	}

	mutateForFilters (cls) {
		cls.source = cls.source || SRC_PHB;
		cls.subclasses = cls.subclasses || [];

		cls._fMisc = [];
		if (cls.isReprinted) cls._fMisc.push("Reprinted");
		if (cls.srd) cls._fMisc.push("SRD");

		cls.subclasses.forEach(sc => {
			sc.source = sc.source || cls.source; // default subclasses to same source as parent
			sc.shortName = sc.shortName || sc.name; // ensure shortName

			sc._fMisc = [];
			if (sc.srd) sc._fMisc.push("SRD");
			if (sc.isReprinted) sc._fMisc.push("Reprinted");
		});
	}

	_addEntrySourcesToFilter (entry) { this._sourceWalker(entry, this._sourcePrimitiveHandlers); }

	/**
	 * @param cls
	 * @param isExcluded
	 * @param opts Options object.
	 * @param [opts.subclassExclusions] Map of `source:name:bool` indicating if each subclass is excluded or not.
	 */
	addToFilters (cls, isExcluded, opts) {
		if (isExcluded) return;
		opts = opts || {};
		const subclassExclusions = opts.subclassExclusions || {};

		this._sourceFilter.addItem(cls.source);

		if (cls.fluff) cls.fluff.forEach(it => this._addEntrySourcesToFilter(it));
		cls.classFeatures.forEach(lvlFeatures => lvlFeatures.forEach(feature => this._addEntrySourcesToFilter(feature)));

		cls.subclasses.forEach(sc => {
			const isScExcluded = (subclassExclusions[sc.source] || {})[sc.name] || false;
			if (!isScExcluded) {
				this._sourceFilter.addItem(sc.source);
				sc.subclassFeatures.forEach(lvlFeatures => lvlFeatures.forEach(feature => this._addEntrySourcesToFilter(feature)))
			}
		});
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._miscFilter,
		];
		opts.isCompact = true;
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it._fMisc,
		)
	}
}
