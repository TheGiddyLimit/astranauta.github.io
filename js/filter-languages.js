"use strict";

class PageFilterLanguages extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._typeFilter = new Filter({header: "Type", items: ["standard", "exotic", "secret"], itemSortFn: null, displayFn: StrUtil.uppercaseFirst});
		this._scriptFilter = new Filter({header: "Script", displayFn: StrUtil.uppercaseFirst});
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["Has Fonts", "SRD"], isSrdFilter: true});
	}

	mutateForFilters (it) {
		it._fMisc = it.fonts ? ["Has Fonts"] : [];
		if (it.srd) it._fMisc.push("SRD");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
		this._scriptFilter.addItem(it.script);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._scriptFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it.type,
			it.script,
			it._fMisc,
		)
	}
}
