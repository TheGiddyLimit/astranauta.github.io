class CreatureBuilder extends Builder {
	constructor () {
		super();

		this._bestiaryMetaRaw = null;
		// FUTURE mechanism to update this select/etc if the user creates/edits homebrew legendary groups
		this._bestiaryMetaCache = null;
		this._legendaryGroups = null;

		this._sourcesCache = []; // the JSON sources from the main UI
		this._$selSource = null;
		this._cbCache = null;

		this._state = this._getInitialState();
		this._meta = {}; // meta state

		this._$btnSave = null;

		this._$eles = {};

		this._renderOutputDebounced = MiscUtil.debounce(() => this._renderOutput(), 50);

		this._$sideMenuStageSaved = null;
		this._$sideMenuWrpList = null;
	}

	get ixBrew () { return this._meta.ixBrew; }
	set ixBrew (val) { this._meta.ixBrew = val; }

	async pInit () {
		this._bestiaryMetaRaw = await DataUtil.loadJSON("data/bestiary/meta.json");
		this._legendaryGroups = [...this._bestiaryMetaRaw.legendaryGroup, ...(BrewUtil.homebrew.legendaryGroup || [])];
		this._bestiaryMetaCache = {};
		this._legendaryGroups.forEach(it => (this._bestiaryMetaCache[it.source] = (this._bestiaryMetaCache[it.source] || {}))[it.name] = it);

		this._jsonCreature = await DataUtil.loadJSON("data/makebrew-creature.json");
		this._indexedTraits = elasticlunr(function () {
			this.addField("n");
			this.setRef("id");
		});
		SearchUtil.removeStemmer(this._indexedTraits);
		this._jsonCreature.trait.forEach((it, i) => this._indexedTraits.addDoc({
			n: it.name,
			id: i
		}));
	}

	renderSideMenu () {
		this._ui.$wrpSideMenu.empty();

		const $btnSearchCreature = $(`<button class="btn btn-xs btn-default">Load Official Creature</button>`)
			.click(() => {
				const searchItems = new SearchWidget(
					{Creature: SearchWidget.CONTENT_INDICES.Creature},
					async (page, source, hash) => {
						$modalInner.data("close")();
						const creature = MiscUtil.copy(await EntryRenderer.hover.pCacheAndGet(page, source, hash));
						creature.source = this._ui.source;
						this.setStateFromLoaded({s: creature, m: {}});
						this.renderInput();
						this.renderOutput();
					},
					{defaultCategory: "Creature"}
				);
				const $modalInner = UiUtil.getShow$Modal(
					"Select Creature",
					() => searchItems.$wrpSearch.detach()
				);
				$modalInner.append(searchItems.$wrpSearch)
			});
		$$`<div class="sidemenu__row">${$btnSearchCreature}</div>`.appendTo(this._ui.$wrpSideMenu);

		const $btnDownloadJson = $(`<button class="btn btn-default btn-xs mb-2">Download Creatures as JSON</button>`)
			.click(() => {
				const out = this._ui._getJsonOutputTemplate();
				out.monster = (BrewUtil.homebrew.monster || []).filter(mon => mon.source === this._ui.source).map(mon => DataUtil.cleanJson(MiscUtil.copy(mon)));
				DataUtil.userDownload(DataUtil.getCleanFilename(BrewUtil.sourceJsonToFull(this._ui.source)), out);
			});

		this._$sideMenuWrpList = $(`<div class="sidemenu__row flex-col">`);
		this._$sideMenuStageSaved = $$`<div>
		${PageUi.__$getSideMenuDivider().hide()}
		<div class="flex-v-center">${$btnDownloadJson}</div>
		${this._$sideMenuWrpList}
		</div>`.appendTo(this._ui.$wrpSideMenu);

		this._doUpdateSidemenu();
	}

	_doUpdateSidemenu () {
		this._$sideMenuWrpList.empty();

		const toList = MiscUtil.copy((BrewUtil.homebrew.monster || []).filter(mon => mon.source === this._ui.source))
			.sort((a, b) => SortUtil.ascSort(a.name, b.name));
		this._$sideMenuStageSaved.toggle(!!toList.length);

		toList.forEach(mon => {
			const ixBrew = BrewUtil.getEntryIxByName("monster", mon);

			const $btnEdit = $(`<button class="btn btn-xs btn-default mr-2" title="Edit"><span class="glyphicon glyphicon-pencil"/></button>`)
				.click(() => {
					if (this.getOnNavMessage() && !confirm("You have unsaved changes. Are you sure?")) return;
					this.setStateFromLoaded({s: MiscUtil.copy(mon), m: {ixBrew}});
					this.renderInput();
					this.renderOutput();
					this._saveTemp();
				});

			const contextId = ContextUtil.getNextGenericMenuId();
			const _CONTEXT_OPTIONS = [
				{
					name: "Duplicate",
					action: async () => {
						const copy = MiscUtil.copy(mon);

						const m = /^(.*?) \((\d+)\)$/.exec(mon.name.trim());
						if (m) copy.name = `${m[1]} (${Number(m[2]) + 1})`;
						else copy.name = `${copy.name} (1)`;
						await BrewUtil.pAddEntry("monster", copy);
						this._doUpdateSidemenu();
					}
				},
				{
					name: "Move to source...",
					action: async () => {
						const sources = MiscUtil.copy(BrewUtil.homebrewMeta.sources || []);

						const selection = await InputUiUtil.pGetUserEnum({
							values: sources.map(it => it.full),
							title: "Select a Source",
							default: sources.findIndex(it => this._ui.source === it.json)
						});

						if (selection != null) {
							this._ui.source = sources[selection].json;
							this.doHandleSourceUpdate();
							await this._pSaveBrew();
						}
					}
				},
				{
					name: "Download JSON",
					action: () => {
						const out = this._ui._getJsonOutputTemplate();
						out.monster = [DataUtil.cleanJson(MiscUtil.copy(mon))];
						DataUtil.userDownload(DataUtil.getCleanFilename(mon.name), out);
					}
				}
			];
			ContextUtil.doInitContextMenu(contextId, (evt, ele, $invokedOn, $selectedMenu) => {
				const val = Number($selectedMenu.data("ctx-id"));
				_CONTEXT_OPTIONS[val].action();
			}, _CONTEXT_OPTIONS.map(it => it.name));

			const $btnBurger = $(`<button class="btn btn-xs btn-default mr-2" title="More Options"><span class="glyphicon glyphicon-option-vertical"/></button>`)
				.click(evt => ContextUtil.handleOpenContextMenu(evt, $btnBurger, contextId));

			const $btnDelete = $(`<button class="btn btn-xs btn-danger" title="Delete"><span class="glyphicon glyphicon-trash"/></button>`)
				.click(async () => {
					if (confirm("Are you sure?")) {
						if (this.ixBrew === ixBrew) {
							this.isEntrySaved = false;
							this.ixBrew = null;
							this._mutSavedButtonText();
						}
						await BrewUtil.pRemoveEntry("monster", mon);
						this._doUpdateSidemenu();
					}
				});

			$$`<div class="flex-v-center split px-2 mb-2">
			<span>${mon.name}</span>
			<div>${$btnEdit}${$btnBurger}${$btnDelete}</div>
			</div>`.appendTo(this._$sideMenuWrpList);
		});
	}

	getOnNavMessage () {
		if (!this.isEntrySaved && ~this.ixBrew) return "You have unsaved changes! Are you sure you want to leave?";
		else return null;
	}

	_getInitialState () {
		return {
			name: "New Creature",
			size: "M",
			type: "aberration",
			source: this._ui ? this._ui.source : "",
			alignment: ["N"],
			ac: [10],
			hp: {average: 4, formula: "1d8"},
			speed: {walk: 30},
			str: 10,
			dex: 10,
			con: 10,
			int: 10,
			wis: 10,
			cha: 10,
			passive: 10,
			cr: "0"
		}
	}

	getSaveableState () {
		return {
			s: this._state,
			m: this._meta,
			_m: {
				isEntrySaved: this.isEntrySaved
			}
		}
	}

	setStateFromLoaded (state) {
		if (state && state.s && state.m) {
			// TODO validate state
			this._state = state.s;
			this._meta = state.m;

			// validate ixBrew
			if (state.m.ixBrew != null) {
				const expectedIx = (BrewUtil.homebrewMeta.sources || []).findIndex(it => it.json === state.s.source);
				if (!~expectedIx) state.m.ixBrew = null;
				else if (expectedIx !== state.m.ixBrew) state.m.ixBrew = expectedIx;
			}

			if (state._m && this.isEntrySaved != null) this.isEntrySaved = !!state._m.isEntrySaved;
			else this.isEntrySaved = state.m.ixBrew != null;

			this._mutSavedButtonText();
			this._saveTemp();
		}
	}

	_saveTemp () {
		// set our state to dirty, and trigger a save at a higher level
		this._isStateDirty = true;
		this._ui.doSaveDebounced();
	}

	async _pSaveBrew () {
		if (this.ixBrew != null) {
			await BrewUtil.pUpdateEntryByIx("monster", this.ixBrew, MiscUtil.copy(this._state));
			this.renderSideMenu();
		} else {
			this.ixBrew = await BrewUtil.pAddEntry("monster", MiscUtil.copy(this._state));
		}
		this.isEntrySaved = true;
		this._mutSavedButtonText();
		this._saveTemp();
	}

	_mutSavedButtonText () {
		if (this._$btnSave) this._$btnSave.text(this.isEntrySaved ? "Saved" : "Save *");
	}

	doHandleSourceUpdate () {
		const nuSource = this._ui.source;

		// if the source we were using is gone, update
		if (!this._sourcesCache.includes(nuSource)) {
			this._state.source = nuSource;
			this._sourcesCache = MiscUtil.copy(this._ui.allSources);

			const $cache = this._$selSource;
			this._$selSource = this.__$getSourceInput(this._cbCache);
			$cache.replaceWith(this._$selSource);
		}

		this.renderInput();
		this.renderOutput();
		this.renderSideMenu();
		this._saveTemp();
	}

	doHandleSourcesAdd () {
		(this._$eles.$selVariantSources || []).map($sel => {
			const currSrcJson = $sel.val();
			$sel.empty().append(`<option value="">(Same as Creature)</option>`);
			this._ui.allSources.forEach(srcJson => $sel.append(`<option value="${srcJson.escapeQuotes()}">${Parser.sourceJsonToFull(srcJson).escapeQuotes()}</option>`));

			if (this._ui.allSources.indexOf(currSrcJson)) $sel.val(currSrcJson);
			else $sel[0].selectedIndex = 0;

			return $sel;
		}).forEach($sel => $sel.change());
	}

	renderInput () {
		this._renderInputControls();
		this._renderInputMain();
	}

	_renderInputControls () {
		const $wrpControls = this._ui.$wrpInputControls.empty();

		this._$btnSave = BuilderUi.$getSaveButton().click(async () => {
			await this._pSaveBrew();
			this._doUpdateSidemenu();
		}).appendTo($wrpControls);

		BuilderUi.$getResetButton().click(() => {
			if (!confirm("Are you sure?")) return;
			this.setStateFromLoaded({s: this._getInitialState(), m: {}});
			this.renderInput();
			this.renderOutput();
			this._saveTemp();
		}).appendTo($wrpControls);
	}

	_renderInputMain () {
		const $wrp = this._ui.$wrpInput.empty();

		this._sourcesCache = MiscUtil.copy(this._ui.allSources);

		const cb = () => {
			RenderBestiary.updateParsed(this._state);

			// do post-processing
			TagAttack.tryTagAttacks(this._state);
			TagHit.tryTagHits(this._state);
			TraitActionTag.tryRun(this._state);
			LanguageTag.tryRun(this._state);
			SenseTag.tryRun(this._state);
			SpellcastingTypeTag.tryRun(this._state);
			DiceConvert.cleanHpDice(this._state);

			this.renderOutput();
			this._saveTemp();
			this.isEntrySaved = false;
			this._mutSavedButtonText();
		};
		this._cbCache = cb; // cache for use when updating sources

		BuilderUi.$getStateIptString("Name", cb, this._state, {nullable: false, callback: () => this.renderSideMenu()}, "name").appendTo($wrp);
		this._$selSource = this.__$getSourceInput(cb).appendTo($wrp);
		BuilderUi.$getStateIptEnum("Size", cb, this._state, {vals: Parser.SIZE_ABVS, fnDisplay: Parser.sizeAbvToFull, type: "string", nullable: false}, "size").appendTo($wrp);
		this.__$getTypeInput(cb).appendTo($wrp);
		this.__$getAlignmentInput(cb).appendTo($wrp);
		this.__$getAcInput(cb).appendTo($wrp);
		this.__$getHpInput(cb).appendTo($wrp);
		this.__$getSpeedInput(cb).appendTo($wrp);
		this.__$getAbilityScoreInput(cb).appendTo($wrp);
		this.__$getSaveInput(cb).appendTo($wrp);
		this.__$getSkillInput(cb).appendTo($wrp);
		BuilderUi.$getStateIptNumber("Passive Perception", cb, this._state, {}, "passive").appendTo($wrp);
		this.__$getVulnerableInput(cb).appendTo($wrp);
		this.__$getResistInput(cb).appendTo($wrp);
		this.__$getImmuneInput(cb).appendTo($wrp);
		this.__$getCondImmuneInput(cb).appendTo($wrp);
		this.__$getSenseInput(cb).appendTo($wrp);
		this.__$getLanguageInput(cb).appendTo($wrp);
		this.__$getCrInput(cb).appendTo($wrp);
		this.__$getSpellcastingInput(cb).appendTo($wrp);
		this.__$getTraitInput(cb).appendTo($wrp);
		this.__$getActionInput(cb).appendTo($wrp);
		this.__$getReactionInput(cb).appendTo($wrp);
		BuilderUi.$getStateIptNumber(
			"Legendary Action Count",
			cb,
			this._state,
			{
				title: "If specified, this will override the default number (3) of legendary actions available for the creature.",
				placeholder: "If left blank, defaults to 3."
			},
			"legendaryActions"
		).appendTo($wrp);
		BuilderUi.$getStateIptBoolean(
			"Name is Proper Noun",
			cb,
			this._state,
			{
				title: "If selected, the legendary action intro text for this creature will be formatted as though the creature's name is a proper noun (e.g. 'Tiamat can take...' vs 'The dragon can take...')."
			},
			"isNamedCreature"
		).appendTo($wrp);
		BuilderUi.$getStateIptEntries(
			"Legendary Action Intro",
			cb,
			this._state,
			{
				title: "If specified, this custom legendary action intro text will override the default.",
				placeholder: "If left blank, defaults to a generic intro."
			},
			"legendaryHeader"
		).appendTo($wrp);
		this.__$getLegendaryActionInput(cb).appendTo($wrp);
		this.__$getLegendaryGroupInput(cb).appendTo($wrp);
		this.__$getVariantInput(cb).appendTo($wrp);
		BuilderUi.$getStateIptBooleanArray("Environment", cb, this._state, {vals: Parser.ENVIRONMENTS, fnDisplay: StrUtil.uppercaseFirst}, "environment").appendTo($wrp);
		BuilderUi.$getStateIptString("Group", cb, this._state, {title: "The family this creature belongs to, e.g. 'Modrons' in the case of a Duodrone."}, "group").appendTo($wrp);
		BuilderUi.$getStateIptString("Sound Clip URL", cb, this._state, {type: "url"}, "soundClip").appendTo($wrp);
		BuilderUi.$getStateIptEnum(
			"Dragon Casting Color",
			cb,
			this._state,
			{
				vals: Object.keys(Parser.DRAGON_COLOR_TO_FULL).sort((a, b) => SortUtil.ascSort(Parser.dragonColorToFull(a), Parser.dragonColorToFull(b))),
				fnDisplay: (abv) => Parser.dragonColorToFull(abv).uppercaseFirst(),
				type: "string"
			},
			"dragonCastingColor"
		).appendTo($wrp);
		BuilderUi.$getStateIptBoolean("NPC", cb, this._state, {title: "If selected, this creature will be filtered out from the Bestiary list by default."}, "isNpc").appendTo($wrp);
		BuilderUi.$getStateIptBoolean("Familiar", cb, this._state, {title: "If selected, this creature will be included when filtering for 'Familiar' in the Bestiary."}, "familiar").appendTo($wrp);
		BuilderUi.$getStateIptStringArray(
			"Search Aliases",
			cb,
			this._state,
			{
				shortName: "Alias",
				title: "Alternate names for this creature, e.g. 'Illithid' as an alternative for 'Mind Flayer,' which can be searched in the Bestiary."
			},
			"alias"
		).appendTo($wrp);
		BuilderUi.$getStateIptNumber("Page", cb, this._state, {}, "page").appendTo($wrp);

		// excluded fields:
		// - otherSources: requires meta support
	}

	__$getSourceInput (cb) {
		return BuilderUi.$getStateIptEnum(
			"Source",
			cb,
			this._state,
			{
				vals: this._sourcesCache, fnDisplay: Parser.sourceJsonToFull, type: "string", nullable: false
			},
			"source"
		);
	}

	__$getTypeInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Type", {isMarked: true});

		const initial = this._state.type;
		const initialSwarm = !!initial.swarmSize;

		const setStateCreature = () => {
			if (tagRows.length) {
				const validTags = tagRows.map($tr => {
					const prefix = $tr.$iptPrefix.val().trim();
					const tag = $tr.$iptTag.val().trim();
					if (!tag) return null;
					if (prefix) return {tag, prefix};
					return tag;
				}).filter(Boolean);
				if (validTags.length) {
					this._state.type = {
						type: $selType.val(),
						tags: validTags
					};
				} else this._state.type = $selType.val();
			} else this._state.type = $selType.val();
			cb();
		};

		const setStateSwarm = () => {
			this._state.type = {
				type: $selType.val(),
				swarmSize: $selSwarmSize.val()
			};
			cb();
		};

		const $selMode = $(`<select class="form-control input-xs mb-2">
			<option value="0">Creature</option>
			<option value="1">Swarm</option>
		</select>`).val(initialSwarm ? "1" : "0").change(() => {
			switch ($selMode.val()) {
				case "0": {
					$stageType.show(); $stageSwarm.hide();
					setStateCreature();
					break;
				}
				case "1": {
					$stageType.hide(); $stageSwarm.show();
					setStateSwarm();
					break;
				}
			}
		}).appendTo($rowInner);

		const $selType = $(`<select class="form-control input-xs">${Parser.MON_TYPES.map(tp => `<option value="${tp}">${tp.uppercaseFirst()}</option>`).join("")}</select>`)
			.change(() => {
				switch ($selMode.val()) {
					case "0": setStateCreature(); break;
					case "1": setStateSwarm(); break;
				}
			})
			.appendTo($rowInner)
			.val(initial.type || initial);

		// TAG CONTROLS
		const tagRows = [];

		const $btnAddTag = $(`<button class="btn btn-xs btn-default">Add Tag</button>`)
			.click(() => {
				const $tagRow = CreatureBuilder.__$getTypeInput__getTagRow(null, tagRows, setStateCreature);
				$wrpTagRows.append($tagRow.$wrp);
			});

		const $initialTagRows = initial.tags ? initial.tags.map(tag => CreatureBuilder.__$getTypeInput__getTagRow(tag, tagRows, setStateCreature)) : null;

		const $wrpTagRows = $$`<div>${$initialTagRows ? $initialTagRows.map(it => it.$wrp) : ""}</div>`;
		const $stageType = $$`<div class="mt-2">
		${$wrpTagRows}
		<div>${$btnAddTag}</div>
		</div>`.appendTo($rowInner).toggle(!initialSwarm);

		// SWARM CONTROLS
		const $selSwarmSize = $(`<select class="form-control input-xs mt-2">${Parser.SIZE_ABVS.map(sz => `<option value="${sz}">${Parser.sizeAbvToFull(sz)}</option>`).join("")}</select>`)
			.change(() => {
				this._state.type.swarmSize = $selSwarmSize.val();
				cb();
			});
		const $stageSwarm = $$`<div>
		${$selSwarmSize}
		</div>`.appendTo($rowInner).toggle(initialSwarm);
		initialSwarm && $selSwarmSize.val(initial.swarmSize);

		return $row;
	}

	static __$getTypeInput__getTagRow (tag, tagRows, setStateCreature) {
		const $iptPrefix = $(`<input class="form-control input-xs form-control--minimal mr-2" placeholder="Prefix">`)
			.change(() => {
				$iptTag.removeClass("error-background");
				if ($iptTag.val().trim().length || !$iptPrefix.val().trim().length) setStateCreature();
				else $iptTag.addClass("error-background");
			});
		if (tag && tag.prefix) $iptPrefix.val(tag.prefix);
		const $iptTag = $(`<input class="form-control input-xs form-control--minimal mr-2" placeholder="Tag (lowercase)">`)
			.change(() => {
				$iptTag.removeClass("error-background");
				setStateCreature();
			});
		if (tag) $iptTag.val(tag.tag || tag);
		const $btnRemove = $(`<button class="btn btn-xs btn-danger" title="Remove Row"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => {
				tagRows.splice(tagRows.indexOf(out), 1);
				$wrp.empty().remove();
				setStateCreature();
			});
		const $wrp = $$`<div class="flex mb-2">${$iptPrefix}${$iptTag}${$btnRemove}</div>`;
		const out = {$wrp, $iptPrefix, $iptTag};
		tagRows.push(out);
		return out;
	}

	__$getAlignmentInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Alignment", {isMarked: true});

		const doUpdateState = () => {
			const raw = alignmentRows.map(row => row.getAlignment());
			if (raw.some(it => it.special != null || it.alignment) || raw.length > 1) {
				this._state.alignment = raw.map(it => {
					if (it.special != null || it.alignment) return it;
					else return {alignment: it};
				})
			} else this._state.alignment = raw[0];
			cb();
		};

		const alignmentRows = [];

		const $wrpRows = $(`<div/>`).appendTo($rowInner);

		if (this._state.alignment.some(it => it.special != null || it.alignment) || !~CreatureBuilder.__$getAlignmentInput__getAlignmentIx(this._state.alignment)) {
			this._state.alignment.forEach(alignment => CreatureBuilder.__$getAlignmentInput__getAlignmentRow(alignment, alignmentRows, doUpdateState).$wrp.appendTo($wrpRows));
		} else {
			CreatureBuilder.__$getAlignmentInput__getAlignmentRow(this._state.alignment, alignmentRows, doUpdateState).$wrp.appendTo($wrpRows)
		}

		const $wrpBtnAdd = $(`<div/>`).appendTo($rowInner);
		$(`<button class="btn btn-xs btn-default">Add Alignment</button>`)
			.appendTo($wrpBtnAdd)
			.click(() => {
				CreatureBuilder.__$getAlignmentInput__getAlignmentRow(null, alignmentRows, doUpdateState).$wrp.appendTo($wrpRows);
				doUpdateState();
			});

		return $row;
	}

	static __$getAlignmentInput__getAlignmentRow (alignment, alignmentRows, doUpdateState) {
		const initialMode = alignment && alignment.chance ? "1" : alignment && alignment.special ? "2" : "0";

		const getAlignment = () => {
			switch ($selMode.val()) {
				case "0": {
					return [...CreatureBuilder._ALIGNMENTS[$selAlign.val()]];
				}
				case "1": {
					return {
						alignment: [...CreatureBuilder._ALIGNMENTS[$selAlign.val()]],
						chance: Math.min(Math.max(0, Number($iptChance.val())), 100)
					}
				}
				case "2": {
					const specials = $iptSpecial.val().trim().split(",").map(it => it.trim()).filter(Boolean);
					return specials.length ? specials.map(it => ({special: it})) : {special: ""};
				}
			}
		};

		const $selMode = $(`<select class="form-control input-xs mb-2">
				<option value="0">Basic Alignment</option>
				<option value="1">Chance-Based Alignment</option>
				<option value="2">Special Alignment</option>
			</select>`).val(initialMode).change(() => {
			switch ($selMode.val()) {
				case "0": {
					$stageSingle.show(); $stageMultiple.hide(); $stageSpecial.hide();
					doUpdateState();
					break;
				}
				case "1": {
					$stageSingle.show(); $stageMultiple.show(); $stageSpecial.hide();
					doUpdateState();
					break;
				}
				case "2": {
					$stageSingle.hide(); $stageMultiple.hide(); $stageSpecial.show();
					doUpdateState();
					break;
				}
			}
		});

		// SINGLE CONTROLS ("multiple" also uses these)
		const $selAlign = $(`<select class="form-control input-xs mb-2">${CreatureBuilder._ALIGNMENTS.map((it, i) => it ? `<option value="${i}">${Parser.alignmentListToFull(it)}</option>` : `<option disabled>\u2014</option>`).join("")}</select>`)
			.change(() => doUpdateState());
		const $stageSingle = $$`<div>${$selAlign}</div>`.toggle(initialMode === "0" || initialMode === "1");
		initialMode === "0" && alignment && $selAlign.val(CreatureBuilder.__$getAlignmentInput__getAlignmentIx(alignment.alignment || alignment));
		initialMode === "1" && alignment && $selAlign.val(CreatureBuilder.__$getAlignmentInput__getAlignmentIx(alignment.alignment));

		// MULTIPLE CONTROLS
		const $iptChance = $(`<input type="number" class="form-control form-control--minimal input-xs mr-2" min="1" max="100" placeholder="Chance of alignment">`)
			.change(() => doUpdateState());
		const $stageMultiple = $$`<div class="mb-2 flex-v-center">${$iptChance}<span>%</span></div>`.toggle(initialMode === "1");
		initialMode === "1" && alignment && $iptChance.val(alignment.chance);

		// SPECIAL CONTROLS
		const $iptSpecial = $(`<input class="form-control input-xs form-control--minimal mb-2">`)
			.change(() => doUpdateState());
		const $stageSpecial = $$`<div>${$iptSpecial}</div>`.toggle(initialMode === "2");
		initialMode === "2" && alignment && $iptSpecial.val(alignment.special);

		const $btnRemove = $(`<button class="btn btn-xs btn-danger mkbru_mon__btn-rm-row mb-2" title="Remove Alignment"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => {
				alignmentRows.splice(alignmentRows.indexOf(out), 1);
				$wrp.empty().remove();
				doUpdateState();
			});

		const $wrp = $$`<div class="flex-col mkbru_mon__wrp-rows mkbru_mon__wrp-rows--removable">${$selMode}${$stageSingle}${$stageMultiple}${$stageSpecial}${$$`<div class="text-align-right">${$btnRemove}</div>`}</div>`;
		const out = {$wrp, getAlignment};
		alignmentRows.push(out);
		return out;
	}

	static __$getAlignmentInput__getAlignmentIx (alignment) {
		return CreatureBuilder._ALIGNMENTS.findIndex(it => CollectionUtil.setEq(new Set(it), new Set(alignment)))
	}

	__$getAcInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Armor Class", {isMarked: true});

		const doUpdateState = () => {
			this._state.ac = acRows.map($row => $row.getAc());
			cb();
		};

		const acRows = [];

		const $wrpRows = $(`<div/>`).appendTo($rowInner);
		this._state.ac.forEach(ac => CreatureBuilder.__$getAcInput__getAcRow(ac, acRows, doUpdateState).$wrp.appendTo($wrpRows));

		const $wrpBtnAdd = $(`<div/>`).appendTo($rowInner);
		$(`<button class="btn btn-xs btn-default">Add Armor Class Source</button>`)
			.appendTo($wrpBtnAdd)
			.click(() => {
				CreatureBuilder.__$getAcInput__getAcRow(null, acRows, doUpdateState).$wrp.appendTo($wrpRows);
				doUpdateState();
			});

		return $row;
	}

	static __$getAcInput__getAcRow (ac, acRows, doUpdateState) {
		const initialMode = ac && ac.from ? "1" : "0";

		const getAc = () => {
			const acValRaw = Number($iptAc.val().trim());
			const acVal = isNaN(acValRaw) ? 10 : acValRaw;
			const condition = $iptCond.val().trim();
			const braces = $cbBraces.prop("checked");

			const getBaseAC = () => {
				if (condition) {
					return {
						ac: acVal,
						condition,
						braces
					}
				} else return acVal;
			};

			switch ($selMode.val()) {
				case "0": {
					return getBaseAC();
				}
				case "1": {
					const froms = fromRows.map(it => it.getAcFrom()).filter(Boolean);
					if (froms.length) {
						const out = {
							ac: acVal,
							braces,
							from: froms
						};
						if (condition) out.condition = condition;
						return out;
					} else return getBaseAC();
				}
			}
		};

		const $selMode = $(`<select class="form-control input-xs mkbru_mon__ac-split">
				<option value="0">Unarmored</option>
				<option value="1">Armor Class From...</option>
			</select>`).val(initialMode).change(() => {
			switch ($selMode.val()) {
				case "0": {
					$stageFrom.hide();
					doUpdateState();
					break;
				}
				case "1": {
					$stageFrom.show();
					if (!fromRows.length) CreatureBuilder.__$getAcInput__getFromRow(null, fromRows, doUpdateState).$wrpFrom.appendTo($wrpFromRows);
					doUpdateState();
					break;
				}
			}
		});

		const $iptAc = $(`<input type="number" class="form-control form-control--minimal input-xs mr-2 mkbru_mon__ac-split">`)
			.val(ac ? ac.ac || ac : 10)
			.change(() => doUpdateState());

		const $iptCond = $(`<input class="form-control form-control--minimal input-xs" placeholder="when...">`)
			.change(() => doUpdateState());
		if (ac && ac.condition) $iptCond.val(ac.condition);
		const $cbBraces = $(`<input type="checkbox" class="mkbru__ipt-cb--plain">`)
			.change(() => doUpdateState());
		if (ac && ac.braces) $cbBraces.prop("checked", ac.braces);

		// "FROM" CONTROLS
		const fromRows = [];

		const $wrpFromRows = $(`<div/>`);
		if (ac && ac.from) ac.from.forEach(f => CreatureBuilder.__$getAcInput__getFromRow(f, fromRows, doUpdateState).$wrpFrom.appendTo($wrpFromRows));

		const $btnAddFrom = $(`<button class="btn btn-xs btn-default mb-2">Add Another Feature/Item</button>`)
			.click(() => {
				CreatureBuilder.__$getAcInput__getFromRow(null, fromRows, doUpdateState).$wrpFrom.appendTo($wrpFromRows);
				doUpdateState();
			});
		const $stageFrom = $$`<div class="mb-2 flex-col">
		${$wrpFromRows}
		${$$`<div>${$btnAddFrom}</div>`}
		</div>`.toggle(initialMode === "1");

		// REMOVE CONTROLS
		const $btnRemove = $(`<button class="btn btn-xs btn-danger mkbru_mon__btn-rm-row mb-2" title="Remove AC Source"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => {
				acRows.splice(acRows.indexOf(out), 1);
				$wrp.empty().remove();
				doUpdateState();
			});

		const $wrp = $$`<div class="flex-col mkbru_mon__wrp-rows mkbru_mon__wrp-rows--removable">
			<div class="flex-v-center mb-2">${$iptAc}${$selMode}</div>
			${$$`<div>${$stageFrom}</div>`}
			<div class="flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Condition</span>${$iptCond}</div>
			<label class="flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Surround with brackets</span>${$cbBraces}</label>
			${$$`<div class="text-align-right">${$btnRemove}</div>`}
			</div>`;
		const out = {$wrp, getAc};
		acRows.push(out);
		return out;
	}

	static __$getAcInput__getFromRow (from, fromRows, doUpdateState) {
		const getAcFrom = () => $iptFrom.val().trim();

		const $iptFrom = $(`<input class="form-control form-control--minimal input-xs mr-2" placeholder="From...">`)
			.change(() => doUpdateState());
		if (from) $iptFrom.val(from);

		const contextId = ContextUtil.getNextGenericMenuId();
		ContextUtil.doInitContextMenu(contextId, (evt, ele, $invokedOn, $selectedMenu) => {
			const val = Number($selectedMenu.data("ctx-id"));
			$iptFrom.val(CreatureBuilder._AC_COMMON[Object.keys(CreatureBuilder._AC_COMMON)[val]]);
			doUpdateState();
		}, Object.keys(CreatureBuilder._AC_COMMON));

		const $btnCommon = $(`<button class="btn btn-default btn-xs mr-2">Feature <span class="caret"></span></button>`)
			.click(evt => ContextUtil.handleOpenContextMenu(evt, $btnCommon, contextId));

		const $btnSearchItem = $(`<button class="btn btn-default btn-xs">Item</button>`)
			.click(() => {
				const searchItems = new SearchWidget(
					{Item: SearchWidget.CONTENT_INDICES.Item},
					(page, source, hash) => {
						const [encName, encSource] = hash.split(HASH_LIST_SEP);
						$iptFrom.val(`{@item ${decodeURIComponent(encName)}${encSource !== UrlUtil.encodeForHash(SRC_DMG) ? `|${decodeURIComponent(encSource)}` : ""}}`);
						doUpdateState();
						$modalInner.data("close")();
					},
					{defaultCategory: "Item"}
				);
				const $modalInner = UiUtil.getShow$Modal(
					"Select Item",
					() => searchItems.$wrpSearch.detach() // guarantee survival of rendered element
				);
				$modalInner.append(searchItems.$wrpSearch)
			});

		const $btnRemove = $(`<button class="btn btn-xs btn-danger mkbru_mon__btn-rm-row--nested-1 ml-2" title="Remove AC Feature/Item"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => {
				fromRows.splice(fromRows.indexOf(outFrom), 1);
				$wrpFrom.empty().remove();
				ContextUtil.doTeardownContextMenu(contextId);
				doUpdateState();
			});

		const $wrpFrom = $$`<div class="flex mb-2 mkbru_mon__wrp-rows--removable-nested-1">${$iptFrom}${$btnCommon}${$btnSearchItem}${$btnRemove}</div>`;

		const outFrom = {$wrpFrom, getAcFrom};
		fromRows.push(outFrom);
		return outFrom;
	}

	__$getHpInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Hit Points", {isMarked: true});

		const initialMode = this._state.hp.special != null ? "1" : "0";

		const doUpdateState = () => {
			switch ($selMode.val()) {
				case "0": {
					this._state.hp = {
						formula: $iptFormula.val(),
						average: Number($iptAverage.val())
					};
					break;
				}
				case "1": {
					this._state.hp = {special: $iptSpecial.val()};
					break;
				}
			}
			cb();
		};

		const $selMode = $(`<select class="form-control input-xs mb-2"><option value="0">Formula</option><option value="1">Custom</option></select>`)
			.appendTo($rowInner)
			.val(initialMode)
			.change(() => {
				switch ($selMode.val()) {
					case "0": $wrpFormula.show(); $wrpSpecial.hide(); break;
					case "1": $wrpFormula.hide(); $wrpSpecial.show(); break;
				}
				doUpdateState();
			});

		// FORMULA STAGE
		const $iptFormula = $(`<input class="form-control form-control--minimal input-xs text-align-right">`)
			.change(() => {
				if (!averageDirty) {
					const avg = EntryRenderer.dice.parseAverage($iptFormula.val());
					if (avg != null) $iptAverage.val(Math.floor(avg));
				}
				doUpdateState();
			});
		let averageDirty = false;
		const $iptAverage = $(`<input class="form-control form-control--minimal input-xs" type="number">`)
			.change(() => {
				averageDirty = true;
				doUpdateState();
			});
		const $wrpFormula = $$`<div class="flex-col">
		<div class="flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Formula</span>${$iptFormula}</div>
		<div class="flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Average</span>${$iptAverage}</div>
		</div>`.toggle(initialMode === "0").appendTo($rowInner);
		if (initialMode === "0") {
			$iptFormula.val(this._state.hp.formula);
			$iptAverage.val(this._state.hp.average);
		}

		// SPECIAL STAGE
		const $iptSpecial = $(`<input class="form-control form-control--minimal input-xs mb-2">`)
			.change(() => doUpdateState());
		const $wrpSpecial = $$`<div>${$iptSpecial}</div>`.toggle(initialMode === "1").appendTo($rowInner);
		if (initialMode === "1") $iptSpecial.val(this._state.hp.special);

		return $row;
	}

	__$getSpeedInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Speed", {isMarked: true});

		const $getRow = (name, prop) => {
			const doUpdateProp = () => {
				const speedRaw = $iptSpeed.val().trim();
				if (!speedRaw) {
					delete this._state.speed[prop];
					if (prop === "fly") delete this._state.speed.canHover
				} else {
					const speed = Number(speedRaw);
					const condition = $iptCond.val().trim();
					this._state.speed[prop] = (condition ? {number: speed, condition: condition} : speed);
					if (prop === "fly") this._state.speed.canHover = !!(condition && /(^|[^a-zA-Z])hover([^a-zA-Z]|$)/i.exec(condition));
				}
				cb();
			};

			const $iptSpeed = $(`<input class="form-control form-control--minimal input-xs mr-2" type="number">`)
				.change(() => doUpdateProp());
			const $iptCond = $(`<input class="form-control form-control--minimal input-xs" placeholder="${prop === "fly" ? "(hover)/when..." : "when..."}">`)
				.change(() => doUpdateProp());

			const initial = this._state.speed[prop];
			if (initial != null) {
				if (initial.condition != null) {
					$iptSpeed.val(initial.number);
					$iptCond.val(initial.condition);
				} else $iptSpeed.val(initial);
			}

			return $$`<div class="flex-v-center mb-2">
			<span class="mr-2 mkbru__sub-name--33">${name}</span>
			<div class="flex-v-center">${$iptSpeed}<span class="mr-2">ft.</span>${$iptCond}</div>
			</div>`;
		};

		$$`<div class="flex-col">
		${$getRow("Walk", "walk")}
		${$getRow("Burrow", "burrow")}
		${$getRow("Climb", "climb")}
		${$getRow("Fly", "fly")}
		${$getRow("Swim", "swim")}
		</div>`.appendTo($rowInner);

		return $row;
	}

	__$getAbilityScoreInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Ability Scores", {isMarked: true});

		const $getRow = (name, prop) => {
			const $iptAbil = $(`<input class="form-control form-control--minimal input-xs" type="number">`)
				.val(this._state[prop])
				.change(() => {
					this._state[prop] = Number($iptAbil.val());
					cb();
				});

			return $$`<div class="flex-v-center mb-2">
			<span class="mr-2 mkbru__sub-name--33">${name}</span>
			${$iptAbil}
			</div>`;
		};

		Parser.ABIL_ABVS.forEach(abv => $getRow(Parser.attAbvToFull(abv), abv).appendTo($rowInner));

		return $row;
	}

	__$getSaveInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Saving Throws", {isMarked: true});

		const $getRow = (name, prop) => {
			const $iptSave = $(`<input class="form-control form-control--minimal input-xs" type="number">`)
				.change(() => {
					const raw = $iptSave.val();
					if (raw && raw.trim()) {
						const num = Number(raw);
						const formatted = num < 0 ? `${num}` : `+${num}`;
						if (this._state.save) this._state.save[prop] = formatted;
						else this._state.save = {[prop]: formatted};
					} else {
						if (this._state.save) {
							delete this._state.save[prop];
							if (Object.keys(this._state.save).length === 0) delete this._state.save;
						}
					}
					cb();
				});

			if ((this._state.save || {})[prop]) $iptSave.val(this._state.save[prop].replace(/^\+/, "")); // remove leading plus sign

			return $$`<div class="flex-v-center mb-2">
			<span class="mr-2 mkbru__sub-name--33">${name}</span>
			${$iptSave}
			</div>`;
		};

		Parser.ABIL_ABVS.forEach(abv => $getRow(Parser.attAbvToFull(abv), abv).appendTo($rowInner));

		return $row;
	}

	__$getSkillInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Skills", {isMarked: true});

		const $getRow = (name, prop) => {
			const $iptSkill = $(`<input class="form-control form-control--minimal input-xs" type="number">`)
				.change(() => {
					const raw = $iptSkill.val();
					if (raw && raw.trim()) {
						const num = Number(raw);
						const formatted = num < 0 ? `${num}` : `+${num}`;
						if (this._state.skill) this._state.skill[prop] = formatted;
						else this._state.skill = {[prop]: formatted};
					} else {
						if (this._state.skill) {
							delete this._state.skill[prop];
							if (Object.keys(this._state.skill).length === 0) delete this._state.skill;
						}
					}
					cb();
				});

			if ((this._state.skill || {})[prop]) $iptSkill.val(this._state.skill[prop].replace(/^\+/, "")); // remove leading plus sign

			return $$`<div class="flex-v-center mb-2">
			<span class="mr-2 mkbru__sub-name--33">${name}</span>
			${$iptSkill}
			</div>`;
		};

		Object.keys(Parser.SKILL_TO_ATB_ABV).sort(SortUtil.ascSort).forEach(skill => $getRow(skill.toTitleCase(), skill).appendTo($rowInner));

		return $row;
	}

	__$getVulnerableInput (cb) {
		return this.__$getDefencesInput(cb, "Damage Vulnerabilities", "Vulnerability", "vulnerable")
	}

	__$getResistInput (cb) {
		return this.__$getDefencesInput(cb, "Damage Resistances", "Resistance", "resist")
	}

	__$getImmuneInput (cb) {
		return this.__$getDefencesInput(cb, "Damage Immunities", "Immunity", "immune")
	}

	__$getCondImmuneInput (cb) {
		return this.__$getDefencesInput(cb, "Condition Immunities", "Immunity", "conditionImmune")
	}

	__$getDefencesInput (cb, rowName, shortName, prop) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple(rowName, {isMarked: true});

		const groups = [];
		const $wrpGroups = $(`<div/>`).appendTo($rowInner);
		const $wrpControls = $(`<div/>`).appendTo($rowInner);

		const doUpdateState = () => {
			const out = groups.map(it => it.getState());
			// flatten a single group if there's no meta-information
			if (out.length === 1 && !out[0].note && !out[0].preNote) this._state[prop] = [...out[0][prop]];
			else this._state[prop] = out;
			cb();
		};

		const doAddGroup = data => {
			const group = CreatureBuilder.__$getDefencesInput__getNodeGroup(shortName, prop, groups, doUpdateState, 0, data);
			groups.push(group);
			group.$ele.appendTo($wrpGroups);
		};

		const $btnAddGroup = $(`<button class="btn btn-xs btn-default mr-2">Add Group</button>`)
			.appendTo($wrpControls)
			.click(() => doAddGroup());

		if (this._state[prop]) {
			// convert flat arrays into wrapped objects
			if (this._state[prop].some(it => it[prop] == null)) doAddGroup({[prop]: this._state[prop]});
			else this._state[prop].forEach(dmgType => doAddGroup(dmgType));
		}

		return $row;
	}

	static __$getDefencesInput__getNodeGroup (shortName, prop, groups, doUpdateState, depth, initial) {
		const children = [];
		const getState = () => {
			const out = {
				[prop]: children.map(it => it.getState())
			};
			if ($iptNotePre.val().trim()) out.preNote = $iptNotePre.val().trim();
			if ($iptNotePost.val().trim()) out.note = $iptNotePost.val().trim();
			return out;
		};

		const addChild = (child, doUpdate = true) => {
			if (child == null) return;
			children.push(child);

			children.sort((a, b) => {
				// sort specials and groups to the bottom, in that order
				// `.order` ensures no non-deterministic shuffling occurs
				if ((a.type === "group" || a.type === "special") && a.type === b.type) return b.order - a.order;
				else if (a.type === "group" && b.type === "special") return 1;
				else if (a.type === "special" && b.type === "group") return -1;
				else if (a.type === "group" || a.type === "special") return 1;
				else if (b.type === "group" || b.type === "special") return -1;
				else return SortUtil.ascSort(a.type, b.type) || b.order - a.order;
			}).forEach(child => {
				child.$ele.detach();
				$wrpChildren.append(child.$ele);
			});

			if (doUpdate) doUpdateState();
		};

		const contextId = ContextUtil.getNextGenericMenuId();
		const optionsList = prop === "conditionImmune" ? Parser.CONDITIONS : Parser.DMG_TYPES;
		ContextUtil.doInitContextMenu(contextId, (evt, ele, $invokedOn, $selectedMenu) => {
			const val = Number($selectedMenu.data("ctx-id"));
			const child = (() => {
				const alreadyExists = (type) => children.some(ch => ch.type === type);

				if (val < optionsList.length) {
					if (alreadyExists(optionsList[val])) return null;
					return CreatureBuilder.__$getDefencesInput__getNodeItem(shortName, children, doUpdateState, optionsList[val]);
				} else if (val === optionsList.length) {
					if (alreadyExists("special")) return null;
					return CreatureBuilder.__$getDefencesInput__getNodeItem(shortName, children, doUpdateState, "special");
				}
			})();

			addChild(child);
		}, [...optionsList.map(it => it.toTitleCase()), null, "Special"]);

		const $btnAddChild = $(`<button class="btn btn-xs btn-default mr-2">Add ${shortName}</button>`)
			.click((evt) => ContextUtil.handleOpenContextMenu(evt, $btnAddChild, contextId));
		const $btnAddChildGroup = $(`<button class="btn btn-xs btn-default mr-2">Add Child Group</button>`)
			.click(() => addChild(CreatureBuilder.__$getDefencesInput__getNodeGroup(shortName, prop, children, doUpdateState, depth + 1)));
		const $iptNotePre = $(`<input class="form-control input-xs form-control--minimal mr-2" placeholder="Pre- note">`)
			.change(() => doUpdateState());
		const $iptNotePost = $(`<input class="form-control input-xs form-control--minimal mr-2" placeholder="Post- note">`)
			.change(() => doUpdateState());
		const $btnRemove = $(`<button class="btn btn-xs btn-danger ${depth ? "" : "mkbru_mon__btn-rm-row"}" title="Remove ${shortName} Group"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => {
				groups.splice(groups.indexOf(out), 1);
				$ele.remove();
				doUpdateState();
			});

		const $wrpChildren = $(`<div class="flex-col"/>`);
		const $wrpControls = $$`<div class="mb-2 flex-v-center">${$btnAddChild}${$btnAddChildGroup}${$iptNotePre}${$iptNotePost}${$btnRemove}</div>`;

		const $ele = (() => {
			const $base = $$`<div class="flex-col ${depth ? "" : "mkbru_mon__wrp-rows mkbru_mon__wrp-rows--removable"}">${$wrpControls}${$wrpChildren}</div>`;
			if (!depth) return $base;
			else return $$`<div class="flex-v-center full-width"><div class="mkbru_mon__row-indent"/>${$base}</div>`
		})();

		if (initial) {
			$iptNotePre.val(initial.preNote || "");
			$iptNotePost.val(initial.note || "");
			initial[prop].forEach(dmgType => {
				if (typeof dmgType === "string") addChild(CreatureBuilder.__$getDefencesInput__getNodeItem(shortName, children, doUpdateState, dmgType), false);
				else if (dmgType.special != null) addChild(CreatureBuilder.__$getDefencesInput__getNodeItem(shortName, children, doUpdateState, "special", dmgType.special), false);
				else addChild(CreatureBuilder.__$getDefencesInput__getNodeGroup(shortName, prop, children, doUpdateState, depth + 1, dmgType), false);
			});
		}

		const out = {getState, $ele, type: "group", order: CreatureBuilder._rowSortOrder++};
		return out;
	}

	static __$getDefencesInput__getNodeItem (shortName, children, doUpdateState, type, value) {
		const $btnRemove = $(`<button class="btn btn-xxs btn-danger" title="Remove ${shortName} Entry"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => {
				children.splice(children.indexOf(out), 1);
				$ele.remove();
				doUpdateState();
			});

		const {$ele, getState} = (() => {
			switch (type) {
				case "special": {
					const $iptSpecial = $(`<input class="form-control form-control--minimal input-xs mr-2">`)
						.change(() => doUpdateState());
					if (value != null) $iptSpecial.val(value);

					return {
						$ele: $$`<div class="mb-2 split flex-v-center mkbru__wrp-btn-xxs">${$iptSpecial}${$btnRemove}</div>`,
						getState: () => ({special: $iptSpecial.val()})
					}
				}
				default: {
					return {
						$ele: $$`<div class="mb-2 split flex-v-center mkbru__wrp-btn-xxs"><span class="mr-2">&bull; ${type.uppercaseFirst()}</span>${$btnRemove}</div>`,
						getState: () => type
					}
				}
			}
		})();

		const out = {$ele, getState, type, order: CreatureBuilder._rowSortOrder++};
		return out;
	}

	__$getSenseInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Senses");

		const doUpdateState = () => {
			const raw = $iptSenses.val().trim();
			if (!raw) delete this._state.senses;
			else this._state.senses = raw;
			cb();
		};

		const $iptSenses = $(`<input class="form-control input-xs form-control--minimal mr-2">`)
			.change(() => doUpdateState());
		if (this._state.senses && this._state.senses.trim()) $iptSenses.val(this._state.senses);

		const contextId = ContextUtil.getNextGenericMenuId();
		const _CONTEXT_ENTRIES = ["Blindsight", "Darkvision", "Tremorsense", "Truesight"];
		ContextUtil.doInitContextMenu(contextId, async (evt, ele, $invokedOn, $selectedMenu) => {
			const val = Number($selectedMenu.data("ctx-id"));
			const sense = _CONTEXT_ENTRIES[val].toLowerCase();

			const feet = await InputUiUtil.pGetUserNumber({min: 0, int: true, title: "Enter the Number of Feet"});
			if (feet == null) return;

			const curr = $iptSenses.val().trim();
			const toAdd = `${sense} ${feet} ft.`;
			$iptSenses.val(curr ? `${curr}, ${toAdd}` : toAdd);

			doUpdateState();
		}, _CONTEXT_ENTRIES);

		const $btnAddGeneric = $(`<button class="btn btn-xs btn-default mr-2 mkbru_mon__btn-add-sense-language">Add Sense</button>`)
			.click((evt) => ContextUtil.handleOpenContextMenu(evt, $btnAddGeneric, contextId));

		const $btnSort = BuilderUi.$getSplitCommasSortButton($iptSenses, doUpdateState);

		$$`<div class="flex-v-center">${$iptSenses}${$btnAddGeneric}${$btnSort}</div>`.appendTo($rowInner);

		return $row;
	}

	__$getLanguageInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Languages");

		const doUpdateState = () => {
			const raw = $iptLanguages.val().trim();
			if (!raw) delete this._state.languages;
			else this._state.languages = raw;
			cb();
		};

		const $iptLanguages = $(`<input class="form-control input-xs form-control--minimal mr-2">`)
			.change(() => doUpdateState());
		if (this._state.languages && this._state.languages.trim()) $iptLanguages.val(this._state.languages);

		const availLanguages = Object.entries(this._bestiaryMetaRaw.language).filter(([k, v]) => !CreatureBuilder._LANGUAGE_BLACKLIST.has(k))
			.map(([k, v]) => v === "Telepathy" ? "telepathy" : v); // lowercase telepathy

		const $btnAddGeneric = $(`<button class="btn btn-xs btn-default mr-2 mkbru_mon__btn-add-sense-language">Add Language</button>`)
			.click(async () => {
				const language = await InputUiUtil.pGetUserString({
					title: "Enter a Language",
					default: "Common",
					autocomplete: availLanguages
				});

				if (language != null) {
					const curr = $iptLanguages.val().trim();
					$iptLanguages.val(curr ? `${curr}, ${language}` : language);

					doUpdateState();
				}
			});

		const $btnSort = BuilderUi.$getSplitCommasSortButton($iptLanguages, doUpdateState, {bottom: [/telepathy/i]});

		$$`<div class="flex-v-center">${$iptLanguages}${$btnAddGeneric}${$btnSort}</div>`.appendTo($rowInner);

		return $row;
	}

	__$getCrInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Challenge Rating", {isMarked: true});

		const initialMode = this._state.cr.lair ? "1" : this._state.cr.coven ? "2" : "0";

		const $selMode = $(`<select class="form-control input-xs mb-2">
			<option value="0">Basic Challenge Rating</option>
			<option value="1">Has Lair Challenge Rating</option>
			<option value="2">Has Coven Challenge Rating</option>
		</select>`).val(initialMode).change(() => {
			switch ($selMode.val()) {
				case "0": {
					$stageLair.hide(); $stageCoven.hide();
					this._state.cr = $selCr.val();
					break;
				}
				case "1": {
					$stageLair.show(); $stageCoven.hide();
					this._state.cr = {
						cr: $selCr.val(),
						lair: $selCrLair.val()
					};
					break;
				}
				case "2": {
					$stageLair.hide(); $stageCoven.show();
					this._state.cr = {
						cr: $selCr.val(),
						coven: $selCrCoven.val()
					};
					break;
				}
			}
			cb();
		}).appendTo($rowInner);

		// BASIC CONTROLS
		const $selCr = $(`<select class="form-control input-xs mb-2">${Parser.CRS.map(it => `<option>${it}</option>`).join("")}</select>`)
			.val(this._state.cr.cr || this._state.cr).change(() => {
				if ($selMode.val() === "0") this._state.cr = $selCr.val();
				else this._state.cr.cr = $selCr.val();
				cb();
			});
		$$`<div>${$selCr}</div>`.appendTo($rowInner);

		// LAIR CONTROLS
		const $selCrLair = $(`<select class="form-control input-xs">${Parser.CRS.map(it => `<option>${it}</option>`).join("")}</select>`)
			.change(() => {
				this._state.cr.lair = $selCrLair.val();
				cb();
			});
		const $stageLair = $$`<div class="flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--33">While in lair</span>${$selCrLair}</div>`
			.appendTo($rowInner).toggle(initialMode === "1");
		initialMode === "1" && $selCrLair.val(this._state.cr.cr);

		// COVEN CONTROLS
		const $selCrCoven = $(`<select class="form-control input-xs">${Parser.CRS.map(it => `<option>${it}</option>`).join("")}</select>`)
			.change(() => {
				this._state.cr.coven = $selCrCoven.val();
				cb();
			});
		const $stageCoven = $$`<div class="flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--33">While in coven</span>${$selCrCoven}</div>`
			.appendTo($rowInner).toggle(initialMode === "2");
		initialMode === "2" && $selCrCoven.val(this._state.cr.cr);

		return $row;
	}

	__$getSpellcastingInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Spellcasting", {isMarked: true});

		const traitRows = [];
		const $wrpRows = $(`<div/>`).appendTo($rowInner);
		const $wrpControls = $(`<div/>`).appendTo($rowInner);

		const $btnAddRow = $(`<button class="btn btn-xs btn-default">Add Spellcasting Trait</button>`)
			.appendTo($wrpControls)
			.click(() => {
				doAddTrait();
				doUpdateState();
			});

		const doUpdateState = () => {
			if (!traitRows.length) delete this._state.spellcasting;
			else this._state.spellcasting = traitRows.map(r => r.getState());
			cb();
		};

		const doAddTrait = trait => {
			const row = CreatureBuilder.__$getSpellcastingInput__getTraitRow(traitRows, doUpdateState, trait);
			traitRows.push(row);
			row.$ele.appendTo($wrpRows);
		};

		if (this._state.spellcasting) this._state.spellcasting.forEach(sc => doAddTrait(sc));

		return $row;
	}

	static __$getSpellcastingInput__getTraitRow (traitRows, doUpdateState, trait) {
		const getState = () => {
			const out = {
				name: $iptName.val().trim()
			};

			if ($btnToggleHeader.hasClass("active")) out.headerEntries = BuilderUi.getTextAsEntries($iptHeader.val());
			if (out.headerEntries && !out.headerEntries.length) delete out.headerEntries;
			if ($btnToggleFooter.hasClass("active")) out.footerEntries = BuilderUi.getTextAsEntries($iptFooter.val());
			if (out.footerEntries && !out.footerEntries.length) delete out.footerEntries;

			const deepMerge = (target, k, v) => {
				const curr = target[k];
				if (curr == null) target[k] = v;
				else {
					if (typeof v === "object") {
						if (v instanceof Array) target[k] = curr.concat(v);
						else Object.entries(v).forEach(([kSub, vSub]) => deepMerge(curr, kSub, vSub));
					}
				}
			};

			spellRows.forEach(sr => {
				const rowState = sr.getState(); // returns part of a "spellcasting" item; e.g. `{daily: {1e: [...]} }`
				if (rowState == null) return;

				Object.entries(rowState).forEach(([k, v]) => deepMerge(out, k, v));
			});

			SpellcastingTraitConvert.mutSpellcastingAbility(out);

			// auto-hide innately cast spells embedded in the header
			if (out.headerEntries) {
				const strHeader = JSON.stringify(out.headerEntries);
				if (/can innately cast {@spell /i.test(strHeader)) out.hidden = [/per day/i.test(strHeader) ? "daily" : "will"];
				else delete out.hidden;
			} else delete out.hidden;

			return out;
		};

		const spellRows = [];
		const doAddSpellRow = (meta, data) => {
			const row = CreatureBuilder.__$getSpellcastingInput__getSpellGenericRow(spellRows, doUpdateState, meta, data);
			spellRows.push(row);
			row.$ele.appendTo($wrpSubRows);
		};

		const $iptName = $(`<input class="form-control form-control--minimal input-xs mr-2" placeholder="Trait name">`)
			.change(() => doUpdateState());
		$iptName.val(trait ? trait.name : "Spellcasting");

		const $btnToggleHeader = $(`<button class="btn btn-xs btn-default mr-2">Header</button>`)
			.click(() => {
				$btnToggleHeader.toggleClass("active");
				$iptHeader.toggle($btnToggleHeader.hasClass("active"));
				doUpdateState();
			})
			.toggleClass("active", !!(trait && trait.headerEntries));

		const $btnToggleFooter = $(`<button class="btn btn-xs btn-default mr-2">Footer</button>`)
			.click(() => {
				$btnToggleFooter.toggleClass("active");
				$iptFooter.toggle($btnToggleFooter.hasClass("active"));
				doUpdateState();
			})
			.toggleClass("active", !!(trait && trait.footerEntries));

		const contextId = ContextUtil.getNextGenericMenuId();
		const _CONTEXT_ENTRIES = [
			{
				display: "Cantrips",
				type: "0",
				mode: "cantrip"
			},
			{
				display: "\uD835\uDC65th level spells",
				mode: "level"
			},
			null,
			{
				display: "Constant effects",
				type: "constant",
				mode: "basic"
			},
			{
				display: "At will spells",
				type: "will",
				mode: "basic"
			},
			{
				display: "\uD835\uDC65/day (/each) spells",
				type: "daily",
				mode: "frequency"
			},
			null,
			{
				display: "\uD835\uDC65/rest (/each) spells",
				type: "rest",
				mode: "frequency"
			},
			{
				display: "\uD835\uDC65/week (/each) spells",
				type: "week",
				mode: "frequency"
			}
		];
		ContextUtil.doInitContextMenu(contextId, async (evt, ele, $invokedOn, $selectedMenu) => {
			const val = Number($selectedMenu.data("ctx-id"));
			const contextMeta = _CONTEXT_ENTRIES.filter(Boolean)[val];

			// prevent double-adding
			switch (contextMeta.type) {
				case "constant":
				case "will":
					if (spellRows.some(it => it.type === contextMeta.type)) return;
					break;
			}

			const meta = {mode: contextMeta.mode, type: contextMeta.type};
			if (contextMeta.mode === "level") {
				const level = await InputUiUtil.pGetUserNumber({min: 1, int: true});
				if (level == null) return;
				meta.level = level;
			}

			// prevent double-adding, round 2
			switch (contextMeta.mode) {
				case "cantrip":
				case "level":
					if (spellRows.some(it => it.type === meta.level)) return;
					break;
			}

			doAddSpellRow(meta);
			doUpdateState();
		}, _CONTEXT_ENTRIES.map(it => it ? it.display : it));

		const $btnAddSpell = $(`<button class="btn btn-xs btn-default">Add...</button>`)
			.click((evt) => ContextUtil.handleOpenContextMenu(evt, $btnAddSpell, contextId));

		const $iptHeader = $(`<textarea class="form-control form-control--minimal mkbru__ipt-textarea mb-2" placeholder="Header text"/>`)
			.toggle(!!(trait && trait.headerEntries))
			.change(() => doUpdateState());
		if (trait && trait.headerEntries) $iptHeader.val(BuilderUi.getEntriesAsText(trait.headerEntries));

		const $iptFooter = $(`<textarea class="form-control form-control--minimal mkbru__ipt-textarea mb-2" placeholder="Footer text"/>`)
			.toggle(!!(trait && trait.footerEntries))
			.change(() => doUpdateState());
		if (trait && trait.footerEntries) $iptFooter.val(BuilderUi.getEntriesAsText(trait.footerEntries));

		const $wrpControls = $$`<div class="flex-v-center mb-2">${$iptName}${$btnToggleHeader}${$btnToggleFooter}${$btnAddSpell}</div>`;
		const $wrpSubRows = $$`<div class="flex-col"></div>`;
		const $wrpSubRowsOuter = $$`<div class="flex-col">${$iptHeader}${$wrpSubRows}${$iptFooter}</div>`;

		const $btnRemove = $(`<button class="btn btn-xs btn-danger" title="Remove Trait"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => {
				traitRows.splice(traitRows.indexOf(out), 1);
				$ele.empty().remove();
				doUpdateState();
			});

		const $ele = $$`<div class="flex-col mkbru_mon__wrp-rows">
		${$wrpControls}
		${$wrpSubRowsOuter}
		<div class="text-align-right mb-2">${$btnRemove}</div>
		</div>`;

		if (trait) {
			const handleFrequency = prop => Object.entries(trait[prop])
				.forEach(([k, v]) => doAddSpellRow({mode: "frequency", type: prop, each: k.endsWith("e"), count: Number(k[0])}, v));

			if (trait.constant) doAddSpellRow({mode: "basic", type: "constant"}, trait.constant);
			if (trait.will) doAddSpellRow({mode: "basic", type: "will"}, trait.will);
			if (trait.daily) handleFrequency("daily");
			if (trait.rest) handleFrequency("rest");
			if (trait.weekly) handleFrequency("weekly");
			if (trait.spells) {
				Object.entries(trait.spells).forEach(([k, v]) => {
					const level = Number(k);
					if (k === "0") doAddSpellRow({mode: "cantrip", type: level}, v.spells);
					else doAddSpellRow({mode: "level", type: level, lower: v.lower, slots: v.slots, level}, v.spells);
				});
			}
		}

		const out = {$ele, getState};
		return out;
	}

	static __$getSpellcastingInput__getSpellGenericRow (spellRows, doUpdateState, meta, data) {
		const setValueByPath = (root, keyPath, value) => {
			for (let i = 0; i < keyPath.length - 1; ++i) root = (root[keyPath[i]] = root[keyPath[i]] || {});
			root[keyPath.last()] = value;
		};

		const rowItems = [];
		const getState = () => {
			const childState = rowItems.map(ri => ri.getState());
			if (childState.length) {
				const keyPath = metaPart.getKeyPath();
				const out = {};
				setValueByPath(out, keyPath, childState);

				if (metaPart.getAdditionalData) {
					const additionalData = metaPart.getAdditionalData();
					additionalData.filter(it => it.value != null).forEach(it => setValueByPath(out, it.keyPath, it.value))
				}

				return out;
			} else return null;
		};

		const $wrpItems = $(`<div class="flex-col"/>`);

		const $btnAdd = $(`<button class="btn btn-xxs btn-default mr-2" title="Add Spell"><span class="glyphicon glyphicon-plus"/></button>`)
			.click(async () => {
				const options = {};

				if (meta.level) options.level = meta.level;
				if (meta.mode === "cantrip") options.level = 0;

				if (metaPart.filterIgnoreLevel && metaPart.filterIgnoreLevel()) delete options.level;

				const spell = await BuilderUi.pGetUserSpellSearch(options);
				if (spell) {
					addItem(spell);
					doUpdateState();
				}
			});

		const $btnRemove = $(`<button class="btn btn-xxs btn-danger" title="Remove Spell Group"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => {
				spellRows.splice(spellRows.indexOf(out), 1);
				$ele.empty().remove();
				doUpdateState();
			});

		const addItem = spell => {
			const item = CreatureBuilder.__$getSpellcastingInput__getSpellGenericRow__getRowItem(rowItems, doUpdateState, spell);
			rowItems.push(item);

			// sort the rows and re-arrange them as required
			rowItems.forEach(it => it._sortString = EntryRenderer.stripTags(it.getState())); // should always return an entry string
			rowItems.sort((a, b) => SortUtil.ascSortLower(a._sortString, b._sortString) || b.order - a.order)
				.forEach(rowItem => {
					rowItem.$ele.detach();
					$wrpItems.append(rowItem.$ele);
				});
		};

		const metaPart = (() => {
			const out = {};

			switch (meta.mode) {
				case "basic": {
					out.$ele = $$`<i>${meta.type === "constant" ? "Constant Effects" : "At Will"}</i>`;
					out.getKeyPath = () => [meta.type];
					break;
				}

				case "frequency": {
					const $iptFreq = $(`<input class="form-control form-control--minimal input-xs mkbru_mon__spell-header-ipt" type="number" min="1" max="9">`)
						.change(() => doUpdateState());
					if (data) $iptFreq.val(meta.count || 1);
					else $iptFreq.val(1);

					const $cbEach = $(`<input class="mkbru__ipt-cb mkbru__ipt-cb--small-offset" type="checkbox">`)
						.prop("checked", data && meta.each)
						.change(() => doUpdateState());

					const name = (() => {
						switch (meta.type) {
							case "daily": return "/Day";
							case "rest": return "/Rest";
							case "weekly": return "/Week"
						}
					})();

					out.$ele = $$`<div class="split mkbru_mon__spell-header-wrp mr-4">
					${$iptFreq}
					<span class="mr-2 italic">${name}</span>
					<label class="flex-v-baseline text-muted small ml-auto"><span class="mr-1">(Each? </span>${$cbEach}<span>)</span></label>
					</div>`;

					out.getKeyPath = () => [meta.type, `${Math.max(Math.min(9, Math.round(Number($iptFreq.val()))), 1)}${$cbEach.prop("checked") ? "e" : ""}`];

					break;
				}

				case "cantrip": {
					out.$ele = $$`<i>Cantrips</i>`;
					out.getKeyPath = () => ["spells", "0", "spells"];
					break;
				}

				case "level": {
					const $iptSlots = $(`<input type="number" class="form-control form-control--minimal input-xs mkbru_mon__spell-header-ipt mr-2">`)
						.val(meta.slots || 0)
						.change(() => doUpdateState());

					const $cbWarlock = $(`<input type="checkbox" class="mkbru__ipt-cb">`)
						.prop("checked", !!meta.lower)
						.change(() => doUpdateState());

					out.$ele = $$`<div class="split mkbru_mon__spell-header-wrp mr-4">
					<div class="italic">${Parser.spLevelToFull(meta.level)}-level Spells</div>
					<div class="flex-v-center text-muted small ml-auto"><span>(</span>${$iptSlots}<span class="mr-2">Slots</span></div>
					<div class="mkbru_mon__spell-header-divider mr-2"/>
					<label class="flex-v-center text-muted small"><span class="mr-1">Warlock?</span>${$cbWarlock}<span>)</span></label>
					</div>`;
					out.getKeyPath = () => ["spells", `${meta.level}`, "spells"];
					out.getAdditionalData = () => {
						return [
							{
								keyPath: ["spells", `${meta.level}`, "slots"],
								value: Number($iptSlots.val())
							},
							{
								keyPath: ["spells", `${meta.level}`, "lower"],
								value: $cbWarlock.prop("checked") ? 1 : null
							}
						]
					};
					out.filterIgnoreLevel = () => $cbWarlock.prop("checked");
				}
			}

			return out;
		})();

		const $ele = $$`<div class="flex-col">
		<div class="split flex-v-center mb-2">
			${metaPart.$ele}
			<div class="flex-v-center mkbru__wrp-btn-xxs">${$btnAdd}${$btnRemove}</div>
		</div>
		${$wrpItems}
		<div class="mkbru_mon__spell-divider mb-2"/>
		</div>`;

		if (data) data.forEach(spell => addItem(spell));

		const out = {$ele, getState, type: meta.type};
		return out;
	}

	static __$getSpellcastingInput__getSpellGenericRow__getRowItem (rowItems, doUpdateState, spellEntry) {
		const getHtml = () => `&bull; ${EntryRenderer.getDefaultRenderer().renderEntry(spellEntry)}`;

		const $iptSpell = $(`<input class="form-control form-control--minimal input-xs mr-2">`)
			.val(spellEntry)
			.change(() => {
				spellEntry = $iptSpell.val();
				$wrpRender.html(getHtml());
				doUpdateState();
			})
			.hide();

		const $btnToggleEdit = $(`<button class="btn btn-xxs btn-default mr-2" title="Toggle Edit Mode"><span class="glyphicon glyphicon-pencil"/></button>`)
			.click(() => {
				$btnToggleEdit.toggleClass("active");
				$iptSpell.toggle($btnToggleEdit.hasClass("active"));
				$wrpRender.toggle(!$btnToggleEdit.hasClass("active"));
			});

		const $wrpRender = $(`<div class="mr-2">${getHtml()}</div>`);

		const $btnRemove = $(`<button class="btn btn-xxs btn-danger" title="Remove Spell"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => {
				rowItems.splice(rowItems.indexOf(out), 1);
				$ele.empty().remove();
				doUpdateState();
			});

		const $ele = $$`<div class="split flex-v-center mb-2 mkbru_mon__spell-wrp-edit">
		${$wrpRender}${$iptSpell}
		<div class="flex-v-center mkbru__wrp-btn-xxs">${$btnToggleEdit}${$btnRemove}</div>
		</div>`;

		const getState = () => spellEntry;

		const out = {$ele, getState, order: CreatureBuilder._rowSortOrder++};
		return out;
	}

	__$getTraitInput (cb) {
		return this.__$getGenericEntryInput(cb, {
			name: "Traits",
			shortName: "Trait",
			prop: "trait",
			canReorder: false,
			generators: [
				{
					name: "Add Predefined Trait",
					action: () => {
						let traitIndex;
						return new Promise(resolve => {
							const searchItems = new SearchWidget(
								{Trait: this._indexedTraits},
								async (ix) => {
									traitIndex = ix;
									$modalInner.data("close")(true);
								},
								{
									defaultCategory: "Trait",
									searchOptions: {
										fields: {
											n: {boost: 5, expand: true}
										},
										expand: true
									},
									fnTransform: (doc) => doc.id
								}
							);
							const $modalInner = UiUtil.getShow$Modal(
								"Select a Trait",
								(isDataEntered) => {
									searchItems.$wrpSearch.detach();
									if (!isDataEntered) return resolve(null);
									const trait = MiscUtil.copy(this._jsonCreature.trait[traitIndex]);
									trait.entries = JSON.parse(JSON.stringify(trait.entries).replace(/<\$name\$>/gi, this._state.name));
									resolve(trait);
								}
							);
							$modalInner.append(searchItems.$wrpSearch)
						})
					}
				}
			]
		});
	}

	__$getActionInput (cb) {
		return this.__$getGenericEntryInput(cb,
			{
				name: "Actions",
				shortName: "Action",
				prop: "action",
				generators: [
					{
						name: "Generate Attack",
						action: () => {
							return new Promise(resolve => {
								const $modalInner = UiUtil.getShow$Modal({
									title: "Generate Attack",
									cbClose: async (isDataEntered) => {
										if (!isDataEntered) return resolve(null);
										const data = await getFormData();
										if (!data) return resolve(null);
										resolve(data);
									},
									fullHeight: true
								});

								const $iptName = $(`<input class="form-control form-control--minimal input-xs mr-2" placeholder="Weapon">`);
								const $cbMelee = $(`<input type="checkbox" class="mkbru__ipt-cb--plain">`)
									.change(() => $stageMelee.toggle($cbMelee.prop("checked")))
									.prop("checked", true);
								const $cbRanged = $(`<input type="checkbox" class="mkbru__ipt-cb--plain">`)
									.change(() => $stageRanged.toggle($cbRanged.prop("checked")));
								const $cbFinesse = $(`<input type="checkbox" class="mkbru__ipt-cb--plain">`);
								const $cbVersatile = $(`<input type="checkbox" class="mkbru__ipt-cb--plain">`)
									.change(() => $stageVersatile.toggle($cbVersatile.prop("checked")));
								const $cbBonusDamage = $(`<input type="checkbox" class="mkbru__ipt-cb--plain">`)
									.change(() => $stageBonusDamage.toggle($cbBonusDamage.prop("checked")));

								const $iptMeleeRange = $(`<input class="form-control form-control--minimal input-xs" type="number" value="5">`);
								const $iptMeleeDamDiceCount = $(`<input class="form-control form-control--minimal input-xs mr-2" type="number" placeholder="Number of Dice" min="1" value="1">`);
								const $iptMeleeDamDiceNum = $(`<input class="form-control form-control--minimal input-xs mr-2" type="number" placeholder="Dice Type" value="6">`);
								const $iptMeleeDamType = $(`<input class="form-control form-control--minimal input-xs" placeholder="Melee Damage Type" autocomplete="off">`)
									.typeahead({source: Parser.DMG_TYPES});
								const $stageMelee = $$`<div class="flex-col"><hr class="hr--sm">
								<div class="flex-v-center mb-2"><span class="mr-2 no-shrink">Melee Range (ft.)</span>${$iptMeleeRange}</div>
								<div class="flex-v-center mb-2">${$iptMeleeDamDiceCount}<span class="mr-2">d</span>${$iptMeleeDamDiceNum}${$iptMeleeDamType}</div>
								</div>`;

								const $iptRangedShort = $(`<input class="form-control form-control--minimal input-xs mr-2" type="number">`);
								const $iptRangedLong = $(`<input class="form-control form-control--minimal input-xs" type="number">`);
								const $iptRangedDamDiceCount = $(`<input class="form-control form-control--minimal input-xs mr-2" type="number" placeholder="Number of Dice" min="1" value="1">`);
								const $iptRangedDamDiceNum = $(`<input class="form-control form-control--minimal input-xs mr-2" type="number" placeholder="Dice Type" value="6">`);
								const $iptRangedDamType = $(`<input class="form-control form-control--minimal input-xs" placeholder="Ranged Damage Type">`)
									.typeahead({source: Parser.DMG_TYPES});
								const $stageRanged = $$`<div class="flex-col"><hr class="hr--sm">
								<div class="flex-v-center mb-2">
									<span class="mr-2 no-shrink">Short Range (ft.)</span>${$iptRangedShort}
									<span class="mr-2 no-shrink">Long Range (ft.)</span>${$iptRangedLong}
								</div>
								<div class="flex-v-center mb-2">${$iptRangedDamDiceCount}<span class="mr-2">d</span>${$iptRangedDamDiceNum}${$iptRangedDamType}</div>
								</div>`.hide();

								const $iptVersatileDamDiceCount = $(`<input class="form-control form-control--minimal input-xs mr-2" type="number" placeholder="Number of Dice" min="1" value="1">`);
								const $iptVersatileDamDiceNum = $(`<input class="form-control form-control--minimal input-xs mr-2" type="number" placeholder="Dice Type" value="8">`);
								const $iptVersatileDamType = $(`<input class="form-control form-control--minimal input-xs" placeholder="Two-Handed Damage Type">`)
									.typeahead({source: Parser.DMG_TYPES});
								const $stageVersatile = $$`<div class="flex-col"><hr class="hr--sm">
								<div class="flex-v-center mb-2">${$iptVersatileDamDiceCount}<span class="mr-2">d</span>${$iptVersatileDamDiceNum}${$iptVersatileDamType}</div>
								</div>`.hide();

								const $iptBonusDamDiceCount = $(`<input class="form-control form-control--minimal input-xs mr-2" type="number" placeholder="Number of Dice" min="1" value="1">`);
								const $iptBonusDamDiceNum = $(`<input class="form-control form-control--minimal input-xs mr-2" type="number" placeholder="Dice Type" value="6">`);
								const $iptBonusDamType = $(`<input class="form-control form-control--minimal input-xs" placeholder="Bonus Damage Type">`)
									.typeahead({source: Parser.DMG_TYPES});
								const $stageBonusDamage = $$`<div class="flex-col"><hr class="hr--sm">
								<div class="flex-v-center mb-2">${$iptBonusDamDiceCount}<span class="mr-2">d</span>${$iptBonusDamDiceNum}${$iptBonusDamType}</div>
								</div>`.hide();

								const $btnConfirm = $(`<button class="btn btn-sm btn-default">Add</button>`)
									.click(() => {
										if (!$cbMelee.prop("checked") && !$cbRanged.prop("checked")) {
											return JqueryUtil.doToast({type: "warning", content: "At least one of 'Melee' or 'Ranged' must be selected!"});
										} else $modalInner.data("close")(true);
									});

								const getFormData = async () => {
									const cr = this._state.cr.cr || this._state.cr;
									const pb = await InputUiUtil.pGetUserNumber({
										title: "Enter Proficiency Bonus",
										min: 2,
										int: true,
										default: Parser.crToPb(cr) || 2
									});
									const abilMod = Parser.getAbilityModNumber($cbFinesse.prop("checked") ? this._state.dex : this._state.str);
									const [melee, ranged] = [$cbMelee.prop("checked") ? "mw" : false, $cbRanged.prop("checked") ? "rw" : false];

									const ptAtk = `{@atk ${[melee ? "mw" : null, ranged ? "rw" : null].filter(Boolean).join(",")}}`;
									const ptHit = `{@hit ${pb + abilMod}} to hit`;
									const ptRange = [
										melee ? `reach ${$iptMeleeRange.val().trim() || 5} ft.` : null,
										ranged ? (() => {
											const vShort = $iptRangedShort.val().trim();
											const vLong = $iptRangedLong.val().trim();
											if (!vShort && !vLong) return `unlimited range`;
											if (!vShort) return `range ${vLong}/${vLong} ft.`;
											if (!vLong) return `range ${vShort}/${vShort} ft.`;
											return `range ${vShort}/${vLong} ft.`;
										})() : null
									].filter(Boolean).join(" or ");

									const getDamageDicePt = ($iptNum, $iptFaces) => {
										const num = Number($iptNum.val()) || 1;
										const faces = Number($iptFaces.val()) || 6;
										return `${Math.floor(num * ((faces + 1) / 2))} (${num}d${faces})`;
									};
									const getDamageTypePt = ($ipDamType) => $ipDamType.val().trim() ? ` ${$ipDamType.val().trim()}` : "";
									const ptDamage = [
										$cbMelee.prop("checked") ? `${getDamageDicePt($iptMeleeDamDiceCount, $iptMeleeDamDiceNum)}${getDamageTypePt($iptMeleeDamType)} damage${$cbRanged.prop("checked") ? ` in melee` : ""}` : null,
										$cbRanged.prop("checked") ? `${getDamageDicePt($iptRangedDamDiceCount, $iptRangedDamDiceNum)}${getDamageTypePt($iptRangedDamType)} damage${$cbMelee.prop("checked") ? ` at range` : ""}` : null,
										$cbVersatile.prop("checked") ? `${getDamageDicePt($iptVersatileDamDiceCount, $iptVersatileDamDiceNum)}${getDamageTypePt($iptVersatileDamType)} damage if used with both hands` : null
									].filter(Boolean).join(", or ");
									const ptDamageFull = $cbBonusDamage.prop("checked") ? `${ptDamage}, plus ${getDamageDicePt($iptBonusDamDiceCount, $iptBonusDamDiceNum)}${getDamageTypePt($iptBonusDamType)} damage` : ptDamage;

									return {
										name: $iptName.val().trim() || "Unarmed Strike",
										entries: [
											`${ptAtk} ${ptHit}, ${ptRange}, one target. {@h}${ptDamageFull}.`
										]
									};
								};

								$$`<div class="flex-col">
								<div class="flex-v-center mb-2">
									${$iptName}
									<label class="flex-v-center mr-2"><span class="mr-2">Melee</span>${$cbMelee}</label>
									<label class="flex-v-center"><span class="mr-2">Ranged</span>${$cbRanged}</label>
								</div>
								<div class="flex-v-center">
									<label class="flex-v-center mr-2"><span class="mr-2">Finesse</span>${$cbFinesse}</label>
									<label class="flex-v-center mr-2"><span class="mr-2">Versatile</span>${$cbVersatile}</label>
									<label class="flex-v-center"><span class="mr-2">Bonus Damage</span>${$cbBonusDamage}</label>
								</div>
								${$stageMelee}
								${$stageRanged}
								${$stageVersatile}
								${$stageBonusDamage}
								<div class="flex-v-center mt-2">${$btnConfirm}</div>
								</div>`.appendTo($modalInner)
							});
						}
					}
				]
			});
	}

	__$getReactionInput (cb) {
		return this.__$getGenericEntryInput(cb, {name: "Reactions", shortName: "Reaction", prop: "reaction"});
	}

	__$getLegendaryActionInput (cb) {
		return this.__$getGenericEntryInput(cb, {name: "Legendary Actions", shortName: "Legendary Action", prop: "legendary"});
	}

	__$getGenericEntryInput (cb, options) {
		if (options.canReorder == null) options.canReorder = true;

		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple(options.name, {isMarked: true});

		const doUpdateState = () => {
			const raw = entryRows.map(row => row.getState()).filter(Boolean);
			if (raw && raw.length) this._state[options.prop] = raw;
			else delete this._state[options.prop];
			cb();
		};

		const doUpdateOrder = !options.canReorder ? null : () => {
			entryRows.forEach(it => it.$ele.detach().appendTo($wrpRows));
			doUpdateState();
			cb();
		};

		const entryRows = [];

		const $wrpRows = $(`<div/>`).appendTo($rowInner);

		const $wrpBtnAdd = $(`<div/>`).appendTo($rowInner);
		$(`<button class="btn btn-xs btn-default">Add ${options.shortName}</button>`)
			.appendTo($wrpBtnAdd)
			.click(() => {
				this.__$getGenericEntryInput__getEntryRow(doUpdateState, doUpdateOrder, {prop: options.prop, shortName: options.shortName}, entryRows).$ele.appendTo($wrpRows);
				doUpdateState();
			});

		if (options.generators) {
			options.generators.forEach(gen => {
				$(`<button class="btn btn-xs btn-default ml-2">${gen.name}</button>`)
					.appendTo($wrpBtnAdd)
					.click(async () => {
						const entry = await gen.action();
						if (entry != null) {
							this.__$getGenericEntryInput__getEntryRow(doUpdateState, doUpdateOrder, {prop: options.prop, shortName: options.shortName}, entryRows, entry)
								.$ele.appendTo($wrpRows);
							doUpdateState();
						}
					});
			})
		}

		if (this._state[options.prop]) this._state[options.prop].forEach(entry => this.__$getGenericEntryInput__getEntryRow(doUpdateState, doUpdateOrder, {prop: options.prop, shortName: options.shortName}, entryRows, entry).$ele.appendTo($wrpRows));

		return $row;
	}

	__$getGenericEntryInput__getEntryRow (doUpdateState, doUpdateOrder, options, entryRows, entry) {
		const getState = () => {
			const out = {
				name: $iptName.val().trim(),
				entries: BuilderUi.getTextAsEntries($iptEntries.val())
			};

			// additional state for variant inputs
			if (options.prop === "variant") out.type = "variant";
			if (sourceControls) {
				const rawSourceState = sourceControls.getState();
				if (rawSourceState) out.variantSource = rawSourceState;
			}

			if (!out.name || !out.entries || !out.entries.length) return null;

			// do post-processing
			RechargeConvert.tryConvertRecharge(out);
			DiceConvert.convertTraitActionDice(out);

			return out;
		};

		const $iptName = $(`<input class="form-control form-control--minimal input-xs" placeholder="${options.shortName} name">`)
			.change(() => doUpdateState());
		if (entry && entry.name) $iptName.val(entry.name.trim());

		const $btnUp = doUpdateOrder ? $(`<button class="btn btn-xs btn-default mkbru_mon__btn-up-row ml-2" title="Move Up"><span class="glyphicon glyphicon-arrow-up"/></button>`)
			.click(() => {
				const ix = entryRows.indexOf(out);
				const cache = entryRows[ix - 1];
				entryRows[ix - 1] = out;
				entryRows[ix] = cache;
				doUpdateOrder();
			}) : null;

		const $btnDown = doUpdateOrder ? $(`<button class="btn btn-xs btn-default mkbru_mon__btn-down-row ml-2" title="Move Down"><span class="glyphicon glyphicon-arrow-down"/></button>`)
			.click(() => {
				const ix = entryRows.indexOf(out);
				const cache = entryRows[ix + 1];
				entryRows[ix + 1] = out;
				entryRows[ix] = cache;
				doUpdateOrder();
			}) : null;

		const $iptEntries = $(`<textarea class="form-control form-control--minimal mkbru__ipt-textarea mb-2"/>`)
			.change(() => doUpdateState());

		if (entry && entry.entries) $iptEntries.val(BuilderUi.getEntriesAsText(entry.entries));

		const $btnRemove = $(`<button class="btn btn-xs btn-danger mb-2" title="Remove ${options.shortName}"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => {
				entryRows.splice(entryRows.indexOf(out), 1);
				$ele.empty().remove();
				doUpdateState();
			});

		const sourceControls = options.prop === "variant" ? (() => {
			const getState = () => {
				const out = {
					source: $selVariantSource.val(),
					page: Number($iptPage.val())
				};
				if (!out.source) return null;
				if (!out.page) delete out.page;
				return out;
			};

			const $selVariantSource = $(`<select class="form-control input-xs"><option value="">(Same as creature)</option></select>`)
				.change(() => doUpdateState());

			// TODO this should update on global source changes
			this._ui.allSources.forEach(srcJson => $selVariantSource.append(`<option value="${srcJson.escapeQuotes()}">${Parser.sourceJsonToFull(srcJson).escapeQuotes()}</option>`));

			const $iptPage = $(`<input type="number" class="form-control form-control--minimal input-xs" min="0">`)
				.change(() => doUpdateState());

			if (entry && entry.variantSource && BrewUtil.hasSourceJson(entry.variantSource.source)) {
				$selVariantSource.val(entry.variantSource);
				if (entry.variantSource.page) $iptPage.val(entry.variantSource.page);
			}

			(this._$eles.$selVariantSources = this._$eles.$selVariantSources || []).push($selVariantSource);

			const $ele = $$`<div class="flex-col">
			<div class="flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Source</span>${$selVariantSource}</div>
			<div class="flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Page</span>${$iptPage}</div>
			</div>`;

			return {$ele, getState};
		})() : null;

		const $ele = $$`<div class="flex-col mkbru_mon__wrp-rows mkbru_mon__wrp-rows--removable">
		<div class="split flex-v-center mb-2">
			${$iptName}
			<div class="flex-v-center">${$btnUp}${$btnDown}</div>
		</div>
		${sourceControls ? sourceControls.$ele : null}
		<div class="flex-v-center">${$iptEntries}</div>
		<div class="text-align-right">${$btnRemove}</div>
		</div>`;

		const out = {$ele, getState};
		entryRows.push(out);
		return out;
	}

	__$getLegendaryGroupInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Legendary Group");

		const _GROUPS = this._legendaryGroups
			.map(({name, source}) => ({name, source}))
			.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));

		const $selGroup = $(`<select class="form-control form-control--minimal input-xs"><option value="-1">None</option></select>`)
			.change(() => {
				const ix = Number($selGroup.val());
				if (~ix) this._state.legendaryGroup = _GROUPS[ix];
				else delete this._state.legendaryGroup;
				cb();
			})
			.appendTo($rowInner);

		_GROUPS.filter(it => it.source).forEach((g, i) => $selGroup.append(`<option value="${i}">${g.name}${g.source === SRC_MM ? "" : ` [${Parser.sourceJsonToAbv(g.source)}]`}</option>`));

		if (this._state.legendaryGroup) {
			const ix = _GROUPS.findIndex(it => it.name === this._state.legendaryGroup.name && it.source === this._state.legendaryGroup.source);
			$selGroup.val(`${ix}`);
		}

		return $row;
	}

	__$getVariantInput (cb) {
		return this.__$getGenericEntryInput(cb, {name: "Variants", shortName: "Variant", prop: "variant"});
	}

	__$getEnvironmentInput (cb) {
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple("Environment");

		const doUpdateState = () => {
			const raw = $iptEnvironment.val().trim();
			if (!raw) delete this._state.environment;
			else this._state.environment = raw;
			cb();
		};

		const $iptEnvironment = $(`<input class="form-control input-xs form-control--minimal mr-2">`)
			.change(() => doUpdateState());
		if (this._state.environment && this._state.environment.trim()) $iptEnvironment.val(this._state.environment);

		const contextId = ContextUtil.getNextGenericMenuId();
		const _CONTEXT_ENTRIES = ["arctic", "coastal", "desert", "forest", "grassland", "hill", "mountain", "swamp", "underdark", "underwater", "urban"];
		ContextUtil.doInitContextMenu(contextId, async (evt, ele, $invokedOn, $selectedMenu) => {
			const val = Number($selectedMenu.data("ctx-id"));
			const env = _CONTEXT_ENTRIES[val].toLowerCase();

			const curr = $iptEnvironment.val().trim();
			$iptEnvironment.val(curr ? `${curr}, ${env}` : env);

			doUpdateState();
		}, _CONTEXT_ENTRIES);

		const $btnAddGeneric = $(`<button class="btn btn-xs btn-default mr-2">Add Environment</button>`)
			.click((evt) => ContextUtil.handleOpenContextMenu(evt, $btnAddGeneric, contextId));

		const $btnSort = BuilderUi.$getSplitCommasSortButton($iptEnvironment, doUpdateState);

		$$`<div class="flex-v-center">${$iptEnvironment}${$btnAddGeneric}${$btnSort}</div>`.appendTo($rowInner);

		return $row;
	}

	renderOutput () {
		this._renderOutputDebounced();
		this._mutSavedButtonText();
	}

	_renderOutput () {
		const $wrp = this._ui.$wrpOutput.empty();

		const $tblMon = $(`<table class="stats monster/">`).appendTo($wrp);
		RenderBestiary.$getRenderedCreature(this._state, this._bestiaryMetaCache).appendTo($tblMon);
	}
}
CreatureBuilder._ALIGNMENTS = [
	["U"],
	["A"],
	null,
	["L", "G"],
	["N", "G"],
	["C", "G"],
	["L", "N"],
	["N"],
	["C", "N"],
	["L", "E"],
	["N", "E"],
	["C", "E"],
	null,
	["G"],
	["L"],
	["C"],
	["E"],
	null,
	["L", "G", "NY", "E"],
	["C", "G", "NY", "E"],
	["L", "NX", "C", "G"],
	["L", "NX", "C", "E"],
	["NX", "NY", "N"],
	null,
	["NX", "C", "G", "NY", "E"],
	["L", "NX", "C", "NY", "G"],
	["L", "NX", "C", "NY", "E"],
	["NX", "L", "G", "NY", "E"]
];
CreatureBuilder._AC_COMMON = {
	"Unarmored Defense": "unarmored defense",
	"Natural Armor": "natural armor"
};
CreatureBuilder._LANGUAGE_BLACKLIST = new Set(["CS", "X", "XX"]);
CreatureBuilder._rowSortOrder = 0;

const creatureBuilder = new CreatureBuilder();

ui.creatureBuilder = creatureBuilder;
creatureBuilder.ui = ui;
