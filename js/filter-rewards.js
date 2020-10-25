"use strict";

class PageFilterRewards extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._typeFilter = new Filter({
			header: "Type",
			items: [
				"Blessing",
				"Boon",
				"Charm",
			],
		});
	}

	mutateForFilters (it) {
		// No-op
	}

	addToFilters (reward, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(reward.source);
		this._typeFilter.addItem(reward.type);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
		];
	}

	toDisplay (values, r) {
		return this._filterBox.toDisplay(
			values,
			r.source,
			r.type,
		)
	}
}
