"use strict";

class LegendaryGroupBuilder extends Builder {
	constructor () {
		super({
			titleSidebarLoadExisting: "Load Existing Legendary Group",
			titleSidebarDownloadJson: "Download Legendary Groups as JSON",
			prop: "legendaryGroup",
			titleSelectDefaultSource: "(Same as Legendary Group)",
		});

		this._renderOutputDebounced = MiscUtil.debounce(() => this._renderOutput(), 50);
	}

	async pHandleSidebarLoadExistingClick () {
		const result = await SearchWidget.pGetUserLegendaryGroupSearch();
		if (result) {
			const legGroup = MiscUtil.copy(await Renderer.hover.pCacheAndGet(result.page, result.source, result.hash));
			return this.pHandleSidebarLoadExistingData(legGroup);
		}
	}

	async pHandleSidebarLoadExistingData (legGroup) {
		legGroup.source = this._ui.source;

		delete legGroup.uniqueId;

		this.setStateFromLoaded({s: legGroup, m: this.getInitialMetaState()});

		this.renderInput();
		this.renderOutput();
	}

	_getInitialState () {
		return {
			name: "New Legendary Group",
			lairActions: [],
			regionalEffects: [],
			mythicEncounter: [],
			source: this._ui ? this._ui.source : "",
		}
	}

	setStateFromLoaded (state) {
		if (state && state.s && state.m) {
			this.__state = state.s;
			this.__meta = state.m;
		}
	}

	doHandleSourcesAdd () { /* No-op */ }

	_renderInputImpl () {
		this.renderInputControls();
		this._renderInputMain();
	}

	_renderInputMain () {
		this._sourcesCache = MiscUtil.copy(this._ui.allSources);
		const $wrp = this._ui.$wrpInput.empty();
		this.doCreateProxies();

		const _cb = () => {
			// Prefer numerical pages if possible
			if (!isNaN(this._state.page)) this._state.page = Number(this._state.page);

			// do post-processing
			TagCondition.tryTagConditions(this._state, true);

			this.renderOutput();
			this.doUiSave();
			this.isEntrySaved = false;
			this.mutSavedButtonText();
		};
		const cb = MiscUtil.debounce(_cb, 33);
		this._cbCache = cb; // cache for use when updating sources

		// initialise tabs
		this._resetTabs("input");
		const tabs = ["Info", "Lair Actions", "Regional Effects", "Mythic Encounter"].map((it, ix) => this._getTab(ix, it, {hasBorder: true, tabGroup: "input", stateObj: this._meta, cbTabChange: this.doUiSave.bind(this)}));
		const [infoTab, lairActionsTab, regionalEffectsTab, mythicEncounterTab] = tabs;
		$$`<div class="flex-v-center w-100 no-shrink ui-tab__wrp-tab-heads--border">${tabs.map(it => it.$btnTab)}</div>`.appendTo($wrp);
		tabs.forEach(it => it.$wrpTab.appendTo($wrp));

		// INFO
		BuilderUi.$getStateIptString("Name", cb, this._state, {nullable: false, callback: () => this.renderSideMenu()}, "name").appendTo(infoTab.$wrpTab);
		this._$selSource = this.$getSourceInput(cb).appendTo(infoTab.$wrpTab);

		// LAIR ACTIONS
		this.__$getLairActionsInput(cb).appendTo(lairActionsTab.$wrpTab);

		// REGIONAL EFFECTS
		this.__$getRegionalEffectsInput(cb).appendTo(regionalEffectsTab.$wrpTab);

		// MYTHIC ENCOUNTER
		this.__$getMythicEncounterEffectsInput(cb).appendTo(mythicEncounterTab.$wrpTab);
	}

	__$getLairActionsInput (cb) {
		return BuilderUi.$getStateIptEntries("Lair Actions", cb, this._state, {}, "lairActions");
	}

	__$getRegionalEffectsInput (cb) {
		return BuilderUi.$getStateIptEntries("Regional Effects", cb, this._state, {}, "regionalEffects");
	}

	__$getMythicEncounterEffectsInput (cb) {
		return BuilderUi.$getStateIptEntries("Mythic Encounter", cb, this._state, {}, "mythicEncounter");
	}

	renderOutput () {
		this._renderOutputDebounced();
		this.mutSavedButtonText();
	}

	_renderOutput () {
		const $wrp = this._ui.$wrpOutput.empty();

		// initialise tabs
		this._resetTabs("output");
		const tabs = ["Legendary Group", "Data"].map((it, ix) => this._getTab(ix, it, {tabGroup: "output", stateObj: this._meta, cbTabChange: this.doUiSave.bind(this)}));
		const [legGroupTab, dataTab] = tabs;
		$$`<div class="flex-v-center w-100 no-shrink">${tabs.map(it => it.$btnTab)}</div>`.appendTo($wrp);
		tabs.forEach(it => it.$wrpTab.appendTo($wrp));

		// Legendary Group
		const $tblLegGroup = $(`<table class="stats"/>`).appendTo(legGroupTab.$wrpTab);
		RenderBestiary.$getRenderedLegendaryGroup(this._state).appendTo($tblLegGroup);

		// Data
		const $tblData = $(`<table class="stats stats--book mkbru__wrp-output-tab-data"/>`).appendTo(dataTab.$wrpTab);
		const asCode = Renderer.get().render({
			type: "entries",
			entries: [
				{
					type: "code",
					name: `Data`,
					preformatted: JSON.stringify(DataUtil.cleanJson(MiscUtil.copy(this._state)), null, "\t"),
				},
			],
		});
		$tblData.append(Renderer.utils.getBorderTr());
		$tblData.append(`<tr><td colspan="6">${asCode}</td></tr>`);
		$tblData.append(Renderer.utils.getBorderTr());
	}

	async pDoPostSave () { ui.creatureBuilder.updateLegendaryGroups(); }
	async pDoPostDelete () { ui.creatureBuilder.updateLegendaryGroups(); }
}

const legendaryGroupBuilder = new LegendaryGroupBuilder();

ui.legendaryGroupBuilder = legendaryGroupBuilder;
legendaryGroupBuilder.ui = ui;
