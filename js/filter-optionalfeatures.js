"use strict";

class PageFilterOptionalFeatures extends PageFilter {
	// region static
	static _filterFeatureTypeSort (a, b) {
		return SortUtil.ascSort(Parser.optFeatureTypeToFull(a.item), Parser.optFeatureTypeToFull(b.item))
	}
	// endregion

	constructor () {
		super();

		this._typeFilter = new Filter({
			header: "Feature Type",
			items: ["AI", "ED", "EI", "MM", "MV", "MV:B", "OTH", "FS:F", "FS:B", "FS:P", "FS:R", "PB"],
			displayFn: Parser.optFeatureTypeToFull,
			itemSortFn: PageFilterOptionalFeatures._filterFeatureTypeSort,
		});
		this._pactFilter = new Filter({
			header: "Pact Boon",
			items: ["Blade", "Chain", "Tome"],
			displayFn: Parser.prereqPactToFull,
		});
		this._patronFilter = new Filter({
			header: "Otherworldly Patron",
			items: ["The Archfey", "The Fiend", "The Great Old One", "The Hexblade", "The Raven Queen", "The Seeker"],
			displayFn: Parser.prereqPatronToShort,
		});
		this._spellFilter = new Filter({
			header: "Spell",
			items: ["eldritch blast", "hex/curse"],
			displayFn: StrUtil.toTitleCase,
		});
		this._featureFilter = new Filter({
			header: "Feature",
			displayFn: StrUtil.toTitleCase,
		});
		this._levelFilter = new Filter({
			header: "Level",
			itemSortFn: SortUtil.ascSortNumericalSuffix,
			nests: [],
		});
		this._prerequisiteFilter = new MultiFilter({
			header: "Prerequisite",
			filters: [
				this._pactFilter,
				this._patronFilter,
				this._spellFilter,
				this._levelFilter,
				this._featureFilter,
			],
		});
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["SRD"], isSrdFilter: true});
	}

	mutateForFilters (it) {
		it.featureType = it.featureType || "OTH";
		if (it.prerequisite) {
			it._sPrereq = true;
			it._fPrereqPact = it.prerequisite.filter(it => it.pact).map(it => {
				this._pactFilter.addItem(it.pact);
				return it.pact;
			});
			it._fPrereqPatron = it.prerequisite.filter(it => it.patron).map(it => {
				this._patronFilter.addItem(it.patron);
				return it.patron;
			});
			it._fprereqSpell = it.prerequisite.filter(it => it.spell).map(it => {
				const mapped = (it.spell || []).map(it => it.split("#")[0].split("|")[0]);
				this._spellFilter.addItem(mapped);
				return mapped;
			});
			it._fprereqFeature = it.prerequisite.filter(it => it.feature).map(it => {
				this._featureFilter.addItem(it.feature);
				return it.feature;
			});
			it._fPrereqLevel = it.prerequisite.filter(it => it.level).map(it => {
				const lvlMeta = it.level;

				let item;
				let className;
				if (typeof lvlMeta === "number") {
					className = `(No Class)`;
					item = new FilterItem({
						item: `Level ${lvlMeta}`,
						nest: className,
					});
				} else {
					className = lvlMeta.class ? lvlMeta.class.name : `(No Class)`;
					item = new FilterItem({
						item: `${lvlMeta.class ? className : ""}${lvlMeta.subclass ? ` (${lvlMeta.subclass.name})` : ""} Level ${lvlMeta.level}`,
						nest: className,
					});
				}

				this._levelFilter.addNest(className, {isHidden: true});
				this._levelFilter.addItem(item);
				return item;
			});
		}

		if (it.featureType instanceof Array) {
			it._dFeatureType = it.featureType.map(ft => Parser.optFeatureTypeToFull(ft));
			it._lFeatureType = it.featureType.join(", ");
			it.featureType.sort((a, b) => SortUtil.ascSortLower(Parser.optFeatureTypeToFull(a), Parser.optFeatureTypeToFull(b)));
		} else {
			it._dFeatureType = Parser.optFeatureTypeToFull(it.featureType);
			it._lFeatureType = it.featureType;
		}

		it._fMisc = it.srd ? ["SRD"] : [];
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
		this._typeFilter.addItem(it.featureType);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._prerequisiteFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it.featureType,
			[
				it._fPrereqPact,
				it._fPrereqPatron,
				it._fprereqSpell,
				it._fPrereqLevel,
				it._fprereqFeature,
			],
			it._fMisc,
		)
	}
}
