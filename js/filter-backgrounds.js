"use strict";

class PageFilterBackgrounds extends PageFilter {
	constructor () {
		super();

		this._skillFilter = new Filter({header: "Skill Proficiencies", displayFn: StrUtil.toTitleCase});
		this._toolFilter = new Filter({header: "Tool Proficiencies", displayFn: StrUtil.toTitleCase});
		this._languageFilter = new Filter({header: "Language Proficiencies", displayFn: it => it === "anyStandard" ? "Any Standard" : StrUtil.toTitleCase(it)});
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["SRD"], isSrdFilter: true});
	}

	mutateForFilters (bg) {
		const skillDisplay = Renderer.background.getSkillSummary(bg.skillProficiencies, true, bg._fSkills = []);
		Renderer.background.getToolSummary(bg.toolProficiencies, true, bg._fTools = []);
		Renderer.background.getLanguageSummary(bg.languageProficiencies, true, bg._fLangs = []);
		bg._fMisc = bg.srd ? ["SRD"] : [];
		bg._skillDisplay = skillDisplay;
	}

	addToFilters (bg, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(bg.source);
		this._skillFilter.addItem(bg._fSkills);
		this._toolFilter.addItem(bg._fTools);
		this._languageFilter.addItem(bg._fLangs);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._skillFilter,
			this._toolFilter,
			this._languageFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, bg) {
		return this._filterBox.toDisplay(
			values,
			bg.source,
			bg._fSkills,
			bg._fTools,
			bg._fLangs,
			bg._fMisc,
		)
	}
}
