"use strict";

window.onload = doPageInit;

class ConverterUi {
	constructor () {
		this._editorIn = null;
		this._editorOut = null;
		this._hasAppended = false;

		this._spellConverter = null;
		this._statblockConverter = null;
		this._tableConverter = null;

		this._menuAccess = null;

		this._saveInputDebounced = MiscUtil.debounce(() => StorageUtil.pSetForPage(ConverterUi.STORAGE_INPUT, this._editorIn.getValue()), 50);

		this._storedSettings = StorageUtil.syncGetForPage(ConverterUi.STORAGE_SETTINGS) || {};
		this._saveSettingsDebounced = MiscUtil.debounce(() => StorageUtil.syncSetForPage(ConverterUi.STORAGE_SETTINGS, this._storedSettings), 50);

		this._$selSource = null;
	}

	set spellConverter (spellConverter) { this._spellConverter = spellConverter; }

	set statblockConverter (statblockConverter) { this._statblockConverter = statblockConverter; }

	set tableConverter (tableConverter) { this._tableConverter = tableConverter; }

	async init () {
		this._editorIn = ace.edit("converter_input");
		this._editorIn.setOptions({
			wrap: true,
			showPrintMargin: false
		});
		try {
			const prevInput = await StorageUtil.pGetForPage(ConverterUi.STORAGE_INPUT);
			if (prevInput) this._editorIn.setValue(prevInput, -1);
		} catch (ignored) { setTimeout(() => { throw ignored; }) }
		this._editorIn.on("change", () => this._saveInputDebounced());

		this._editorOut = ace.edit("converter_output");
		this._editorOut.setOptions({
			wrap: true,
			showPrintMargin: false,
			readOnly: true
		});

		$(`#editable`).click(() => {
			if (confirm(`Edits will be overwritten as you parse new statblocks. Enable anyway?`)) this.outReadOnly = false;
		});

		$(`#save_local`).click(async () => {
			const output = this.outText;
			if (output && output.trim()) {
				try {
					const prop = this._storedSettings.parser === "Table" ? "table" : "monster";
					const entries = JSON.parse(`[${output}]`);

					const invalidSources = entries.map(it => !it.source || !BrewUtil.hasSourceJson(it.source) ? (it.name || it.caption || "(Unnamed)").trim() : false).filter(Boolean);
					if (invalidSources.length) {
						JqueryUtil.doToast({
							content: `One or more entries have missing or unknown sources: ${invalidSources.join(", ")}`,
							type: "danger"
						});
						return;
					}

					// ignore duplicates
					const _dupes = {};
					const dupes = [];
					const dedupedEntries = entries.map(it => {
						const lSource = it.source.toLowerCase();
						const lName = it.name.toLowerCase();
						_dupes[lSource] = _dupes[lSource] || {};
						if (_dupes[lSource][lName]) {
							dupes.push(it.name);
							return null;
						} else {
							_dupes[lSource][lName] = true;
							return it;
						}
					}).filter(Boolean);
					if (dupes.length) {
						JqueryUtil.doToast({
							type: "warning",
							content: `Ignored ${dupes.length} duplicate entr${dupes.length === 1 ? "y" : "ies"}`
						})
					}

					// handle overwrites
					const overwriteMeta = dedupedEntries.map(it => {
						const ix = (BrewUtil.homebrew[prop] || []).findIndex(bru => bru.name.toLowerCase() === it.name.toLowerCase() && bru.source.toLowerCase() === it.source.toLowerCase());
						if (~ix) {
							return {
								isOverwrite: true,
								ix,
								entry: it
							}
						} else return {entry: it, isOverwrite: false};
					}).filter(Boolean);
					const willOverwrite = overwriteMeta.map(it => it.isOverwrite).filter(Boolean);
					if (willOverwrite.length && !confirm(`This will overwrite ${willOverwrite.length} entr${willOverwrite.length === 1 ? "y" : "ies"}. Are you sure?`)) {
						return;
					}

					await Promise.all(overwriteMeta.map(meta => {
						if (meta.isOverwrite) {
							return BrewUtil.pUpdateEntryByIx(prop, meta.ix, MiscUtil.copy(meta.entry));
						} else {
							return BrewUtil.pAddEntry(prop, MiscUtil.copy(meta.entry));
						}
					}));

					JqueryUtil.doToast({
						type: "success",
						content: `Saved!`
					});

					Omnisearch.pAddToIndex("monster", overwriteMeta.filter(meta => !meta.isOverwrite).map(meta => meta.entry));
				} catch (e) {
					JqueryUtil.doToast({
						content: `Current output was not valid JSON!`,
						type: "danger"
					});
					setTimeout(() => { throw e });
				}
			} else {
				JqueryUtil.doToast({
					content: "Nothing to save!",
					type: "danger"
				});
			}
		});

		$(`#download`).click(() => {
			const output = this.outText;
			if (output && output.trim()) {
				try {
					const prop = this._storedSettings.parser === "Table" ? "table" : "monster";
					const out = {[prop]: JSON.parse(`[${output}]`)};
					DataUtil.userDownload(`converter-output`, out);
				} catch (e) {
					JqueryUtil.doToast({
						content: `Current output was not valid JSON. Downloading as <span class="code">.txt</span> instead.`,
						type: "warning"
					});
					DataUtil.userDownloadText(`converter-output.txt`, output);
					setTimeout(() => { throw e; });
				}
			} else {
				JqueryUtil.doToast({
					content: "Nothing to download!",
					type: "danger"
				});
			}
		});

		/**
		 * Wrap a function in an error handler which will wipe the error output, and append future errors to it.
		 * @param toRun
		 */
		const catchErrors = (toRun) => {
			try {
				$(`#lastWarnings`).hide().html("");
				$(`#lastError`).hide().html("");
				this._editorOut.resize();
				toRun();
			} catch (x) {
				const splitStack = x.stack.split("\n");
				const atPos = splitStack.length > 1 ? splitStack[1].trim() : "(Unknown location)";
				const message = `[Error] ${x.message} ${atPos}`;
				$(`#lastError`).show().html(message);
				this._editorOut.resize();
				setTimeout(() => { throw x });
			}
		};

		$("#parsestatblock").on("click", () => {
			catchErrors(() => {
				if (!this._hasAppended || confirm("You're about to overwrite multiple entries. Are you sure?")) {
					this._menuAccess.handleParse();
				}
			});
		});

		$(`#parsestatblockadd`).on("click", () => {
			catchErrors(() => this._menuAccess.handleParseAndAdd());
		});

		this.initSideMenu();
	}

	initSideMenu () {
		const $mnu = $(`.sidemenu`);
		const renderDivider = ($menu, heavy) => $menu.append(`<hr class="sidemenu__row__divider ${heavy ? "sidemenu__row__divider--heavy" : ""}">`);

		const prevParser = this._storedSettings.parser;

		const $wrpParser = $(`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label">Mode</div></div>`).appendTo($mnu);
		const $selParser = $(`
			<select class="form-control input-sm">
				<option>Statblock</option>
				<option>Spell</option>
				<option>Table</option>
			</select>
		`).appendTo($wrpParser).change(() => {
			this._storedSettings.parser = $selParser.val();
			this._saveSettingsDebounced();
			switch ($selParser.val()) {
				case "Statblock": renderStatblockSidemenu(); break;
				case "Spell": renderSpellSidemenu(); break;
				case "Table": renderTableSidemenu(); break;
			}
		});

		renderDivider($mnu, true);
		const $wrpCustom = $(`<div/>`).appendTo($mnu);

		//test spell menu
		const renderSpellSidemenu = () => {
			$(`#save_local`).hide();
			this._menuAccess = {};

			$wrpCustom.empty();
			$(`<div class="sidemenu__row split-v-center">
				<small>This parser is <span class="help" title="Notably poor at handling text split across multiple lines, as Carriage Return is used to separate blocks of text.">very particular</span> about its input. Use at your own risk.</small>
			</div>`).appendTo($wrpCustom);

			renderDivider($wrpCustom);

			const $wrpMode = $(`<div class="sidemenu__row flex-vh-center-around"/>`).appendTo($wrpCustom);
			const $selMode = $(`
					<select class="form-control input-sm select-inline">
							<option value="txt">Parse as Text</option>
							<option value="md" selected>Parse as Markdown</option>
					</select>
				`)
				.appendTo($wrpMode)
				.change(() => {
					this._storedSettings.spellMode = $selMode.val();
					this._saveSettingsDebounced();
				});
			const prevMode = this._storedSettings.spellMode;
			if (prevMode) $selMode.val(prevMode);

			const $wrpTitle = $(`<div class="sidemenu__row split-v-center"><label class="sidemenu__row__label sidemenu__row__label--cb-label" title="Should the creature's name be converted to title-case? Useful when pasting a name which is all-caps."><span>Title-Case Name</span></label></div>`).appendTo($wrpCustom);
			const $cbTitleCase = $(`<input type="checkbox" class="sidemenu__row__label__cb">`)
				.change(() => {
					this._storedSettings.spellTitleCase = $cbTitleCase.prop("checked");
					this._saveSettingsDebounced();
				})
				.appendTo($wrpTitle.find(`label`))
				.prop("checked", !!this._storedSettings.spellTitleCase);
			this._menuAccess.isTitleCase = () => !!$cbTitleCase.prop("checked");

			renderDivider($wrpCustom);

			const $wrpPage = $(`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label">Page</div></div>`).appendTo($wrpCustom);
			const $iptPage = $(`<input class="form-control input-sm" type="number" style="max-width: 9rem;">`)
				.change(() => {
					this._storedSettings.spellPage = $iptPage.val();
					this._saveSettingsDebounced();
				})
				.appendTo($wrpPage)
				.val(this._storedSettings.spellPage || "0");
			this._menuAccess.getPage = () => Number($iptPage.val());

			renderDivider($wrpCustom);

			const $wrpSource = $(`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label">Source</div></div>`).appendTo($wrpCustom);
			this._menuAccess.getSource = () => this._$selSource.val();

			const $wrpSourceOverlay = $(`<div class="h-100 w-100"/>`);
			let modalMeta = null;

			const rebuildStageSource = (options) => {
				SourceUiUtil.render({
					...options,
					$parent: $wrpSourceOverlay,
					cbConfirm: (source) => {
						const isNewSource = options.mode !== "edit";

						if (isNewSource) BrewUtil.addSource(source);
						else BrewUtil.updateSource(source);

						if (isNewSource) this._$selSource.append(`<option value="${source.json.escapeQuotes()}">${source.full.escapeQuotes()}</option>`);
						this._$selSource.val(source.json).change();
						if (modalMeta) modalMeta.doClose();
					},
					cbConfirmExisting: (source) => {
						this._$selSource.val(source.json).change();
						if (modalMeta) modalMeta.doClose();
					},
					cbCancel: () => {
						if (modalMeta) modalMeta.doClose();
					}
				});
			};

			this._allSources = (BrewUtil.homebrewMeta.sources || []).sort((a, b) => SortUtil.ascSortLower(a.full, b.full))
				.map(it => it.json);
			this._$selSource = $$`
			<select class="form-control input-sm">
				<option value="">(None)</option>
				${this._allSources.map(s => `<option value="${s.escapeQuotes()}">${Parser.sourceJsonToFull(s).escapeQuotes()}</option>`)}
			</select>`
				.appendTo($wrpSource)
				.change(() => {
					if (this._$selSource.val()) this._storedSettings.sourceJson = this._$selSource.val();
					else delete this._storedSettings.sourceJson;
					this._saveSettingsDebounced();
				});
			if (this._storedSettings.sourceJson && this._allSources.includes(this._storedSettings.sourceJson)) this._$selSource.val(this._storedSettings.sourceJson);
			else {
				this._storedSettings.sourceJson = null;
				this._$selSource[0].selectedIndex = 0;
			}

			const $btnSourceEdit = $(`<button class="btn btn-default btn-sm mr-2">Edit Selected Source</button>`)
				.click(() => {
					const curSourceJson = this._storedSettings.sourceJson;
					if (!curSourceJson) {
						JqueryUtil.doToast({type: "warning", content: "No source selected!"});
						return;
					}

					const curSource = BrewUtil.sourceJsonToSource(curSourceJson);
					if (!curSource) return;
					rebuildStageSource({mode: "edit", source: MiscUtil.copy(curSource)});
					modalMeta = UiUtil.getShowModal({
						fullHeight: true,
						isLarge: true,
						cbClose: () => $wrpSourceOverlay.detach()
					});
					$wrpSourceOverlay.appendTo(modalMeta.$modalInner);
				});
			$$`<div class="sidemenu__row">${$btnSourceEdit}</div>`.appendTo($wrpCustom);

			const $btnSourceAdd = $(`<button class="btn btn-default btn-sm">Add New Source</button>`).click(() => {
				rebuildStageSource({mode: "add"});
				modalMeta = UiUtil.getShowModal({
					fullHeight: true,
					isLarge: true,
					cbClose: () => $wrpSourceOverlay.detach()
				});
				$wrpSourceOverlay.appendTo(modalMeta.$modalInner);
			});
			$$`<div class="sidemenu__row">${$btnSourceAdd}</div>`.appendTo($wrpCustom);

			renderDivider($wrpCustom);

			const $wrpSample = $(`<div class="sidemenu__row flex-vh-center-around"/>`).appendTo($wrpCustom);
			$(`<button class="btn btn-sm btn-default">Sample Text</button>`)
				.appendTo($wrpSample).click(() => {
					this.inText = spellConverter.getSample("txt");
					$selMode.val("txt").change();
				});

			const _getSpellParseOptions = (isAppend) => ({
				cbWarning: this.showWarning.bind(this),
				cbOutput: (stats, append) => {
					this.doCleanAndOutput(stats, append);
				},
				source: this.source,
				pageNumber: this.pageNumber,
				isAppend,
				isTitleCaseName: this.menuAccess.isTitleCase()
			});

			this._menuAccess.handleParse = () => {
				const opts = _getSpellParseOptions(false);
				$selMode.val() === "txt" ? this._spellConverter.doParseText(this.inText, opts) : this._spellConverter.doParseMarkdown(this.inText, opts);
			};

			this._menuAccess.handleParseAndAdd = () => {
				const opts = _getSpellParseOptions(true);
				$selMode.val() === "txt" ? this._spellConverter.doParseText(this.inText, opts) : this._spellConverter.doParseMarkdown(this.inText, opts);
			};
		};

		const renderStatblockSidemenu = () => {
			$(`#save_local`).show();
			this._menuAccess = {};

			$wrpCustom.empty();
			$(`<div class="sidemenu__row split-v-center">
				<small>This parser is <span class="help" title="Notably poor at handling text split across multiple lines, as Carriage Return is used to separate blocks of text.">very particular</span> about its input. Use at your own risk.</small>
			</div>`).appendTo($wrpCustom);

			renderDivider($wrpCustom);

			const $wrpMode = $(`<div class="sidemenu__row flex-vh-center-around"/>`).appendTo($wrpCustom);
			const $selMode = $(`
					<select class="form-control input-sm select-inline">
							<option value="txt">Parse as Text</option>
							<option value="md" selected>Parse as Markdown</option>
					</select>
				`)
				.appendTo($wrpMode)
				.change(() => {
					this._storedSettings.statblockMode = $selMode.val();
					this._saveSettingsDebounced();
				});
			const prevMode = this._storedSettings.statblockMode;
			if (prevMode) $selMode.val(prevMode);

			const $wrpTitle = $(`<div class="sidemenu__row split-v-center"><label class="sidemenu__row__label sidemenu__row__label--cb-label" title="Should the creature's name be converted to title-case? Useful when pasting a name which is all-caps."><span>Title-Case Name</span></label></div>`).appendTo($wrpCustom);
			const $cbTitleCase = $(`<input type="checkbox" class="sidemenu__row__label__cb">`)
				.change(() => {
					this._storedSettings.statblockTitleCase = $cbTitleCase.prop("checked");
					this._saveSettingsDebounced();
				})
				.appendTo($wrpTitle.find(`label`))
				.prop("checked", !!this._storedSettings.statblockTitleCase);
			this._menuAccess.isTitleCase = () => !!$cbTitleCase.prop("checked");

			renderDivider($wrpCustom);

			const $wrpPage = $(`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label">Page</div></div>`).appendTo($wrpCustom);
			const $iptPage = $(`<input class="form-control input-sm" type="number" style="max-width: 9rem;">`)
				.change(() => {
					this._storedSettings.statblockPage = $iptPage.val();
					this._saveSettingsDebounced();
				})
				.appendTo($wrpPage)
				.val(this._storedSettings.statblockPage || "0");
			this._menuAccess.getPage = () => Number($iptPage.val());

			renderDivider($wrpCustom);

			const $wrpSource = $(`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label">Source</div></div>`).appendTo($wrpCustom);
			this._menuAccess.getSource = () => this._$selSource.val();

			const $wrpSourceOverlay = $(`<div class="h-100 w-100"/>`);
			let modalMeta = null;

			const rebuildStageSource = (options) => {
				SourceUiUtil.render({
					...options,
					$parent: $wrpSourceOverlay,
					cbConfirm: (source) => {
						const isNewSource = options.mode !== "edit";

						if (isNewSource) BrewUtil.addSource(source);
						else BrewUtil.updateSource(source);

						if (isNewSource) this._$selSource.append(`<option value="${source.json.escapeQuotes()}">${source.full.escapeQuotes()}</option>`);
						this._$selSource.val(source.json).change();
						if (modalMeta) modalMeta.doClose();
					},
					cbConfirmExisting: (source) => {
						this._$selSource.val(source.json).change();
						if (modalMeta) modalMeta.doClose();
					},
					cbCancel: () => {
						if (modalMeta) modalMeta.doClose();
					}
				});
			};

			this._allSources = (BrewUtil.homebrewMeta.sources || []).sort((a, b) => SortUtil.ascSortLower(a.full, b.full))
				.map(it => it.json);
			this._$selSource = $$`
			<select class="form-control input-sm">
				<option value="">(None)</option>
				${this._allSources.map(s => `<option value="${s.escapeQuotes()}">${Parser.sourceJsonToFull(s).escapeQuotes()}</option>`)}
			</select>`
				.appendTo($wrpSource)
				.change(() => {
					if (this._$selSource.val()) this._storedSettings.sourceJson = this._$selSource.val();
					else delete this._storedSettings.sourceJson;
					this._saveSettingsDebounced();
				});
			if (this._storedSettings.sourceJson && this._allSources.includes(this._storedSettings.sourceJson)) this._$selSource.val(this._storedSettings.sourceJson);
			else {
				this._storedSettings.sourceJson = null;
				this._$selSource[0].selectedIndex = 0;
			}

			const $btnSourceEdit = $(`<button class="btn btn-default btn-sm mr-2">Edit Selected Source</button>`)
				.click(() => {
					const curSourceJson = this._storedSettings.sourceJson;
					if (!curSourceJson) {
						JqueryUtil.doToast({type: "warning", content: "No source selected!"});
						return;
					}

					const curSource = BrewUtil.sourceJsonToSource(curSourceJson);
					if (!curSource) return;
					rebuildStageSource({mode: "edit", source: MiscUtil.copy(curSource)});
					modalMeta = UiUtil.getShowModal({
						fullHeight: true,
						isLarge: true,
						cbClose: () => $wrpSourceOverlay.detach()
					});
					$wrpSourceOverlay.appendTo(modalMeta.$modalInner);
				});
			$$`<div class="sidemenu__row">${$btnSourceEdit}</div>`.appendTo($wrpCustom);

			const $btnSourceAdd = $(`<button class="btn btn-default btn-sm">Add New Source</button>`).click(() => {
				rebuildStageSource({mode: "add"});
				modalMeta = UiUtil.getShowModal({
					fullHeight: true,
					isLarge: true,
					cbClose: () => $wrpSourceOverlay.detach()
				});
				$wrpSourceOverlay.appendTo(modalMeta.$modalInner);
			});
			$$`<div class="sidemenu__row">${$btnSourceAdd}</div>`.appendTo($wrpCustom);

			renderDivider($wrpCustom);

			const $wrpSample = $(`<div class="sidemenu__row flex-vh-center-around"/>`).appendTo($wrpCustom);
			$(`<button class="btn btn-sm btn-default">Sample Text</button>`)
				.appendTo($wrpSample).click(() => {
					this.inText = statblockConverter.getSample("txt");
					$selMode.val("txt").change();
				});
			$(`<button class="btn btn-sm btn-default">Sample Markdown</button>`)
				.appendTo($wrpSample).click(() => {
					this.inText = statblockConverter.getSample("md");
					$selMode.val("md").change();
				});

			const _getStatblockParseOptions = (isAppend) => ({
				cbWarning: this.showWarning.bind(this),
				cbOutput: (stats, append) => {
					this.doCleanAndOutput(stats, append);
				},
				source: this.source,
				pageNumber: this.pageNumber,
				isAppend,
				isTitleCaseName: this.menuAccess.isTitleCase()
			});

			this._menuAccess.handleParse = () => {
				const opts = _getStatblockParseOptions(false);
				$selMode.val() === "txt" ? this._statblockConverter.doParseText(this.inText, opts) : this._statblockConverter.doParseMarkdown(this.inText, opts);
			};

			this._menuAccess.handleParseAndAdd = () => {
				const opts = _getStatblockParseOptions(true);
				$selMode.val() === "txt" ? this._statblockConverter.doParseText(this.inText, opts) : this._statblockConverter.doParseMarkdown(this.inText, opts);
			};
		};

		const renderTableSidemenu = () => {
			$(`#save_local`).hide();
			this._menuAccess = {};

			$wrpCustom.empty();

			const $wrpMode = $(`<div class="sidemenu__row flex-vh-center-around"/>`).appendTo($wrpCustom);
			const $selMode = $(`
					<select class="form-control input-sm select-inline">
							<option value="html" selected>Parse as HTML</option>
							<option value="md">Parse as Markdown</option>
					</select>
				`)
				.appendTo($wrpMode)
				.change(() => {
					this._storedSettings.tableMode = $selMode.val();
					this._saveSettingsDebounced();
				});
			const prevMode = this._storedSettings.tableMode;
			if (prevMode) $selMode.val(prevMode);

			renderDivider($wrpCustom);

			const $wrpSample = $(`<div class="sidemenu__row split-v-center"/>`).appendTo($wrpCustom);

			$(`<button class="btn btn-sm btn-default">Sample HTML</button>`)
				.appendTo($wrpSample).click(() => {
					this.inText = tableConverter.showSample("html");
					$selMode.val("html").change();
				});
			$(`<button class="btn btn-sm btn-default">Sample Markdown</button>`)
				.appendTo($wrpSample).click(() => {
					this.inText = tableConverter.showSample("md");
					$selMode.val("md").change();
				});

			const _getTableParseOptions = (isAppend) => ({
				cbWarning: this.showWarning.bind(this),
				cbOutput: (table, append) => {
					this.doCleanAndOutput(table, append);
				},
				isAppend
			});

			this._menuAccess.handleParse = () => {
				const opts = _getTableParseOptions(false);
				if ($selMode.val() === "html") this._tableConverter.doParseHtml(this.inText, opts);
				else this._tableConverter.doParseMarkdown(this.inText, opts);
			};

			this._menuAccess.handleParseAndAdd = () => {
				const opts = _getTableParseOptions(true);
				if ($selMode.val() === "html") this._tableConverter.doParseHtml(this.inText, opts);
				else this._tableConverter.doParseMarkdown(this.inText, opts);
			};
		};

		if (prevParser) $selParser.val(prevParser).change();
		else renderStatblockSidemenu();
	}

	get menuAccess () {
		return this._menuAccess;
	}

	showWarning (text) {
		$(`#lastWarnings`).show().append(`<div>[Warning] ${text}</div>`);
		this._editorOut.resize();
	}

	doCleanAndOutput (obj, append) {
		const asCleanString = CleanUtil.getCleanJson(obj);
		if (append) {
			this.outText = `${asCleanString},\n${ui.outText}`;
			this._hasAppended = true;
		} else {
			this.outText = asCleanString;
			this._hasAppended = false;
		}
	}

	set outReadOnly (val) { this._editorOut.setOptions({readOnly: val}); }

	get outText () { return this._editorOut.getValue(); }

	set outText (text) { return this._editorOut.setValue(text, -1); }

	get inText () { return CleanUtil.getReplacedQuotesText((this._editorIn.getValue() || "").trim()); }

	set inText (text) { return this._editorIn.setValue(text, -1); }

	get pageNumber () { return this._menuAccess.getPage() ? Number(this._menuAccess.getPage()) : undefined; }

	get source () { return this._menuAccess.getSource(); }
}
ConverterUi.STORAGE_INPUT = "converterInput";
ConverterUi.STORAGE_SETTINGS = "converterSettings";

class TableConverter {
	showSample (format) {
		switch (format) {
			case "html": return TableConverter.SAMPLE_HTML;
			case "md": return TableConverter.SAMPLE_MARKDOWN;
			default: throw new Error(`Unknown format "${format}"`)
		}
	}

	/**
	 * Parses tables from HTML.
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 */
	doParseHtml (inText, options) {
		if (!inText || !inText.trim()) return options.cbWarning("No input!");

		const handleTable = ($table, caption) => {
			const tbl = {
				type: "table",
				caption,
				colLabels: [],
				colStyles: [],
				rows: []
			};

			const getCleanHeaderText = ($ele) => {
				let txt = $ele.text().trim();

				// if it's all-uppercase, title-case it
				if (txt.toUpperCase() === txt) txt = txt.toTitleCase();

				return txt;
			};

			// Caption
			if ($table.find(`caption`)) {
				tbl.caption = $table.find(`caption`).text().trim();
			}

			// Columns
			if ($table.find(`thead`)) {
				const $headerRows = $table.find(`thead tr`);
				if ($headerRows.length !== 1) options.cbWarning(`Table header had ${$headerRows.length} rows!`);
				$headerRows.each((i, r) => {
					const $r = $(r);
					if (i === 0) { // use first tr as column headers
						$r.find(`th, td`).each((i, h) => tbl.colLabels.push(getCleanHeaderText($(h))));
					} else { // use others as rows
						const row = [];
						$r.find(`th, td`).each((i, h) => row.push(getCleanHeaderText($(h))));
						if (row.length) tbl.rows.push(row);
					}
				});
				$table.find(`thead`).remove();
			} else if ($table.find(`th`)) {
				$table.find(`th`).each((i, h) => tbl.colLabels.push(getCleanHeaderText($(h))));
				$table.find(`th`).parent().remove();
			}

			// Rows
			const handleTableRow = (i, r) => {
				const $r = $(r);
				const row = [];
				$r.find(`td`).each((i, cell) => {
					const $cell = $(cell);
					row.push($cell.text().trim());
				});
				tbl.rows.push(row);
			};

			if ($table.find(`tbody`)) {
				$table.find(`tbody tr`).each(handleTableRow);
			} else {
				$table.find(`tr`).each(handleTableRow);
			}

			MarkdownConverter.postProcessTable(tbl);
			options.cbOutput(tbl, options.isAppend);
		};

		const $input = $(inText);
		if ($input.is("table")) {
			handleTable($input);
		} else {
			// TODO pull out any preceding text to use as the caption; pass this in
			const caption = "";
			$input.find("table").each((i, e) => {
				const $table = $(e);
				handleTable($table, caption);
			});
		}
	}

	/**
	 * Parses tables from Markdown.
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 */
	doParseMarkdown (inText, options) {
		if (!inText || !inText.trim()) return options.cbWarning("No input!");

		const lines = inText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split(/\n/g);
		const stack = [];
		let cur = null;
		lines.forEach(l => {
			if (l.trim().startsWith("##### ")) {
				if (cur && cur.lines.length) stack.push(cur);
				cur = {caption: l.trim().replace(/^##### /, ""), lines: []};
			} else {
				cur = cur || {lines: []};
				cur.lines.push(l);
			}
		});
		if (cur && cur.lines.length) stack.push(cur);

		const toOutput = stack.map(tbl => MarkdownConverter.getConvertedTable(tbl.lines, tbl.caption)).reverse();
		toOutput.forEach((out, i) => {
			if (options.isAppend) options.cbOutput(out, true);
			else {
				if (i === 0) options.cbOutput(out, false);
				else options.cbOutput(out, true);
			}
		});
	}
}
TableConverter.SAMPLE_HTML =
`<table>
  <thead>
    <tr>
      <td><p><strong>Character Level</strong></p></td>
      <td><p><strong>Low Magic Campaign</strong></p></td>
      <td><p><strong>Standard Campaign</strong></p></td>
      <td><p><strong>High Magic Campaign</strong></p></td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><p>1st–4th</p></td>
      <td><p>Normal starting equipment</p></td>
      <td><p>Normal starting equipment</p></td>
      <td><p>Normal starting equipment</p></td>
    </tr>
    <tr>
      <td><p>5th–10th</p></td>
      <td><p>500 gp plus 1d10 × 25 gp, normal starting equipment</p></td>
      <td><p>500 gp plus 1d10 × 25 gp, normal starting equipment</p></td>
      <td><p>500 gp plus 1d10 × 25 gp, one uncommon magic item, normal starting equipment</p></td>
    </tr>
    <tr>
      <td><p>11th–16th</p></td>
      <td><p>5,000 gp plus 1d10 × 250 gp, one uncommon magic item, normal starting equipment</p></td>
      <td><p>5,000 gp plus 1d10 × 250 gp, two uncommon magic items, normal starting equipment</p></td>
      <td><p>5,000 gp plus 1d10 × 250 gp, three uncommon magic items, one rare item, normal starting equipment</p></td>
    </tr>
    <tr>
      <td><p>17th–20th</p></td>
      <td><p>20,000 gp plus 1d10 × 250 gp, two uncommon magic items, normal starting equipment</p></td>
      <td><p>20,000 gp plus 1d10 × 250 gp, two uncommon magic items, one rare item, normal starting equipment</p></td>
      <td><p>20,000 gp plus 1d10 × 250 gp, three uncommon magic items, two rare items, one very rare item, normal starting equipment</p></td>
    </tr>
  </tbody>
</table>`;
TableConverter.SAMPLE_MARKDOWN =
`| Character Level | Low Magic Campaign                                                                | Standard Campaign                                                                                | High Magic Campaign                                                                                                     |
|-----------------|-----------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| 1st–4th         | Normal starting equipment                                                         | Normal starting equipment                                                                        | Normal starting equipment                                                                                               |
| 5th–10th        | 500 gp plus 1d10 × 25 gp, normal starting equipment                               | 500 gp plus 1d10 × 25 gp, normal starting equipment                                              | 500 gp plus 1d10 × 25 gp, one uncommon magic item, normal starting equipment                                            |
| 11th–16th       | 5,000 gp plus 1d10 × 250 gp, one uncommon magic item, normal starting equipment   | 5,000 gp plus 1d10 × 250 gp, two uncommon magic items, normal starting equipment                 | 5,000 gp plus 1d10 × 250 gp, three uncommon magic items, one rare item, normal starting equipment                       |
| 17th–20th       | 20,000 gp plus 1d10 × 250 gp, two uncommon magic items, normal starting equipment | 20,000 gp plus 1d10 × 250 gp, two uncommon magic items, one rare item, normal starting equipment | 20,000 gp plus 1d10 × 250 gp, three uncommon magic items, two rare items, one very rare item, normal starting equipment |`;

const spellConverter = new SpellConverter();
const statblockConverter = new StatblockConverter();
const tableConverter = new TableConverter();
const ui = new ConverterUi();

ui.spellConverter = spellConverter;
ui.statblockConverter = statblockConverter;
ui.tableConverter = tableConverter;

async function doPageInit () {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	await BrewUtil.pAddBrewData(); // init homebrew
	const spellData = await SpellcastingTraitConvert.pGetSpellData();
	SpellcastingTraitConvert.init(spellData);
	ui.init();
}
