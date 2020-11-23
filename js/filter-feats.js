"use strict";

class PageFilterFeats extends PageFilter {
	// region static
	// endregion

	constructor () {
		super();
		this._levelFilter = new RangeFilter({
			header: 'Level',
			min: 1,
			max: 20,
			isLabelled: true
		});
		this._typeFilter = new Filter({header: 'Type'})
		this._ancestryFilter = new Filter({header: 'Ancestries'})
		this._archetypeFilter = new Filter({header: 'Archetypes'})
		this._classFilter = new Filter({header: 'Classes'})
		this._skillFilter = new Filter({header: 'Skills'})
		this._miscFilter  = new Filter({
			header: 'Miscellaneous',
			items: ["Has Trigger", "Has Frequency", "Has Prerequisite", "Has Requirements", "Has Cost", "Has Special"]
		});
		this._timeFilter = new Filter({
			header: "Activity",
			items: [
				Parser.SP_TM_PF_A,
				Parser.SP_TM_PF_AA,
				Parser.SP_TM_PF_AAA,
				Parser.SP_TM_PF_F,
				Parser.SP_TM_PF_R
			],
			displayFn: Parser.spTimeUnitToFull,
			itemSortFn: null
		});
	}

	mutateForFilters (feat) {
		feat._slPrereq = (feat.prerequisites || `\u2014`).uppercaseFirst();
		feat._fType = []
		if (feat.fclass !== false) {
			feat._slType = 'Class'
			feat._fType.push('Class')
		}
		if (feat.fancestry !== false) {
			feat._slType = 'Ancestry'
			feat._fType.push('Ancestry')
		}
		if (feat.fgeneral !== false) {
			feat._slType = 'General'
			feat._fType.push('General')
		}
		if (feat.fskill !== false) {
			feat._slType = 'Skill'
			feat._fType.push('Skill')
		}
		if (feat.farchetype !== false) {
			feat._slType = 'Archetype'
			feat._fType.push('Archetype')
		}
		feat._fTime = feat.activity != null ? feat.activity.unit : ""
		feat._fMisc = []
		if (feat.prerequisites != null) feat._fMisc.push('Has Prerequisites')
		if (feat.trigger != null) feat._fMisc.push('Has Trigger')
		if (feat.frequency != null) feat._fMisc.push('Has Frequency')
		if (feat.requirements != null) feat._fMisc.push('Has Requirements')
		if (feat.cost != null) feat._fMisc.push('Has Cost')
		if (feat.special != null) feat._fMisc.push('Has Special')

	}

	addToFilters (feat, isExcluded) {
		if (isExcluded) return;

		this._typeFilter.addItem(feat._fType);
		if (typeof(feat.fancestry) !== "boolean") this._ancestryFilter.addItem(feat.fancestry);
		if (typeof(feat.farchetype) !== "boolean") this._archetypeFilter.addItem(feat.farchetype);
		if (typeof(feat.fclass) !== "boolean") this._classFilter.addItem(feat.fclass);
		if (typeof(feat.fskill) !== "boolean") this._skillFilter.addItem(feat.fskill);
		this._sourceFilter.addItem(feat.source);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._levelFilter,
			this._ancestryFilter,
			this._archetypeFilter,
			this._classFilter,
			this._skillFilter,
			this._timeFilter,
			this._miscFilter
		];
	}

	toDisplay (values, ft) {
		return this._filterBox.toDisplay(
			values,
			ft.source,
			ft._fType,
			ft.level,
			ft.fancestry,
			ft.farchetype,
			ft.fclass,
			ft.fskill,
			ft._fTime,
			ft._fMisc
		)
	}
}
