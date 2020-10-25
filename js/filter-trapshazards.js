"use strict";

class PageFilterTrapsHazards extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._typeFilter = new Filter({
			header: "Type",
			items: [
				"MECH",
				"MAG",
				"SMPL",
				"CMPX",
				"HAZ",
				"WTH",
				"ENV",
				"WLD",
				"GEN",
			],
			displayFn: Parser.trapHazTypeToFull,
			itemSortFn: filterTypeSort,
		});
	}

	mutateForFilters (it) {
		it.trapHazType = it.trapHazType || "HAZ";
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
		this._typeFilter.addItem(it.trapHazType);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it.trapHazType,
		)
	}
}
