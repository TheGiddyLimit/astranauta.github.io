// ************************************************************************* //
// Strict mode should not be used, as the roll20 script depends on this file //
// ************************************************************************* //

// ENTRY RENDERING =====================================================================================================
/*
 * // EXAMPLE USAGE //
 *
 * const entryRenderer = new EntryRenderer();
 *
 * const topLevelEntry = mydata[0];
 * // prepare an array to hold the string we collect while recursing
 * const textStack = [];
 *
 * // recurse through the entry tree
 * entryRenderer.renderEntries(topLevelEntry, textStack);
 *
 * // render the final product by joining together all the collected strings
 * $("#myElement").html(toDisplay.join(""));
 */
function EntryRenderer () {
	this.wrapperTag = "div";
	this.baseUrl = "";

	this._subVariant = false;
	this._firstSection = true;
	this._headerIndex = 1;
	this._tagExportDict = null;
	this._roll20Ids = null;

	/**
	 * Set the tag used to group rendered elements
	 * @param tag to use
	 */
	this.setWrapperTag = function (tag) {
		this.wrapperTag = tag;
		return this;
	};

	/**
	 * Set the base url for rendered links.
	 * Usage: `renderer.setBaseUrl("https://www.cool.site/")` (note the "http" prefix and "/" suffix)
	 * @param url to use
	 */
	this.setBaseUrl = function (url) {
		this.baseUrl = url;
		return this;
	};

	/**
	 * Other sections should be prefixed with a vertical divider
	 * @param bool
	 */
	this.setFirstSection = function (bool) {
		this._firstSection = bool;
		return this;
	};

	/**
	 * Headers are ID'd using the attribute `data-title-index` using an incrementing int. This resets it to 1.
	 */
	this.resetHeaderIndex = function () {
		this._headerIndex = 1;
		return this;
	};

	/**
	 * Pass an object to have the renderer export lists of found @-tagged content during renders
	 *
	 * @param toObj the object to fill with exported data. Example results:
	 * 			{
	 *				commoner_mm: {page: "bestiary.html", source: "MM", hash: "commoner_mm"},
	 *				storm%20giant_mm: {page: "bestiary.html", source: "MM", hash: "storm%20giant_mm"},
 	 *				detect%20magic_phb: {page: "spells.html", source: "PHB", hash: "detect%20magic_phb"}
	 *			}
	 * 			These results intentionally match those used for hover windows, so can use the same cache/loading paths
	 */
	this.doExportTags = function (toObj) {
		this._tagExportDict = toObj;
		return this;
	};

	/**
	 * Reset/disable tag export
	 */
	this.resetExportTags = function () {
		this._tagExportDict = null;
		return this;
	};

	this.setRoll20Ids = function (roll20Ids) {
		this._roll20Ids = roll20Ids;
	};

	this.resetRoll20Ids = function () {
		this._roll20Ids = null;
	};

	// TODO provide a Roll20 mode (expose list of found monsters/etc to be imported; add links to these)
	// TODO general conditional rendering function -- make use of "data" property (see backgrounds JSON + backgrounds hover render)
	//      - can be used to clean up R20 script Subclass rendering when implemented
	/**
	 * Recursively walk down a tree of "entry" JSON items, adding to a stack of strings to be finally rendered to the
	 * page. Note that this function does _not_ actually do the rendering, see the example code above for how to display
	 * the result.
	 *
	 * @param entry An "entry" usually defined in JSON. A schema is available in tests/schema
	 * @param textStack A reference to an array, which will hold all our strings as we recurse
	 * @param depth The current recursion depth. Optional; default 0, or -1 for type "section" entries
	 * @param options
	 *          .prefix The (optional) prefix to be added to the textStack before whatever is added by the current call
	 *          .suffix The (optional) suffix to be added to the textStack after whatever is added by the current call
	 *          .forcePrefixSuffix force the prefix and suffix to be added (useful for the first call from external code)
	 */
	this.recursiveEntryRender = function (entry, textStack, depth, options) {
		depth = depth === undefined || depth === null ? 0 : depth;
		if (entry.type === "section") depth = -1;
		// process options
		if (!options) options = {};
		const prefix = options.prefix === undefined || options.prefix === null ? null : options.prefix;
		const suffix = options.suffix === undefined || options.suffix === null ? null : options.suffix;
		const forcePrefixSuffix = options.forcePrefixSuffix === undefined || options.forcePrefixSuffix === null ? false : options.forcePrefixSuffix;

		if (forcePrefixSuffix) renderPrefix();
		if (typeof entry === "object") {
			// the root entry (e.g. "Rage" in barbarian "classFeatures") is assumed to be of type "entries"
			const type = entry.type === undefined || entry.type === "section" ? "entries" : entry.type;
			switch (type) {
				// recursive
				case "entries":
					handleEntries(this);
					break;
				case "options":
					handleOptions(this);
					break;
				case "list":
					if (entry.items) {
						if (entry.name) textStack.push(`<p class="list-name">${entry.name}</p>`);
						textStack.push(`<ul ${entry.style ? `class="${entry.style}"` : ""}>`);
						for (let i = 0; i < entry.items.length; i++) {
							const style = getLiStyleClass(entry.items[i]);
							this.recursiveEntryRender(entry.items[i], textStack, depth + 1, {prefix: `<li ${style ? `class="${style}"` : ""}>`, suffix: "</li>"});
						}
						textStack.push("</ul>");
					}
					break;
				case "table":
					renderTable(this);
					break;
				case "inset":
					textStack.push(`<${this.wrapperTag} class="statsBlockInset">`);
					if (typeof entry.name !== 'undefined') textStack.push(`<span class="entry-title" data-title-index="${this._headerIndex++}">${entry.name}</span>`);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, 2, {prefix: "<p>", suffix: "</p>"});
					}
					textStack.push(`</${this.wrapperTag}>`);
					break;
				case "insetReadaloud":
					textStack.push(`<${this.wrapperTag} class="statsBlockInsetReadaloud">`);
					if (typeof entry.name !== 'undefined') textStack.push(`<span class="entry-title" data-title-index="${this._headerIndex++}">${entry.name}</span>`);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, 2, {prefix: "<p>", suffix: "</p>"});
					}
					textStack.push(`</${this.wrapperTag}>`);
					break;
				case "variant":
					textStack.push(`<${this.wrapperTag} class="statsBlockInset">`);
					textStack.push(`<span class="entry-title" data-title-index="${this._headerIndex++}">Variant: ${entry.name}</span>`);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, 2, {prefix: "<p>", suffix: "</p>"});
					}
					if (entry.variantSource) {
						textStack.push(EntryRenderer.utils._getPageTrText(entry.variantSource));
					}
					textStack.push(`</${this.wrapperTag}>`);
					break;
				case "variantSub": {
					// pretend this is an inline-header'd entry, but set a flag so we know not to add bold
					this._subVariant = true;
					const fauxEntry = entry;
					fauxEntry.type = "entries";
					this.recursiveEntryRender(fauxEntry, textStack, 2, {prefix: "<p>", suffix: "</p>"});
					this._subVariant = false;
					break;
				}
				case "quote":
					textStack.push(`<p><i>`);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack);
						if (i !== entry.entries.length - 1) textStack.push(`<br>`);
						else textStack.push(`</i>`);
					}
					textStack.push(`<span class="quote-by">\u2014 ${entry.by}${entry.from ? `, <i>${entry.from}</i>` : ""}</span>`);
					textStack.push(`</p>`);
					break;

				case "invocation":
					handleInvocation(this);
					break;
				case "patron":
					handlePatron(this);
					break;

				// block
				case "abilityDc":
					renderPrefix();
					textStack.push(`<span class='ability-block'><span>${entry.name} save DC</span> = 8 + your proficiency bonus + your ${utils_makeAttChoose(entry.attributes)}</span>`);
					renderSuffix();
					break;
				case "abilityAttackMod":
					renderPrefix();
					textStack.push(`<span class='ability-block'><span>${entry.name} attack modifier</span> = your proficiency bonus + your ${utils_makeAttChoose(entry.attributes)}</span>`);
					renderSuffix();
					break;
				case "abilityGeneric":
					renderPrefix();
					textStack.push(`<span class='ability-block'>${entry.name ? `<span>${entry.name}</span>  = ` : ""}${entry.text}${entry.attributes ? ` ${utils_makeAttChoose(entry.attributes)}` : ""}</span>`);
					renderSuffix();
					break;

				// inline
				case "inline":
					if (entry.entries) {
						for (let i = 0; i < entry.entries.length; i++) {
							this.recursiveEntryRender(entry.entries[i], textStack, depth);
						}
					}
					break;
				case "inlineBlock":
					renderPrefix();
					if (entry.entries) {
						for (let i = 0; i < entry.entries.length; i++) {
							this.recursiveEntryRender(entry.entries[i], textStack, depth);
						}
					}
					renderSuffix();
					break;
				case "bonus":
					textStack.push((entry.value < 0 ? "" : "+") + entry.value);
					break;
				case "bonusSpeed":
					textStack.push((entry.value < 0 ? "" : "+") + entry.value + "ft.");
					break;
				case "dice":
					textStack.push(EntryRenderer.getEntryDice(entry, entry.name));
					break;
				case "link":
					textStack.push(this.renderLink(this, entry));
					break;

				case "actions":
					textStack.push(`<${this.wrapperTag} class="${EntryRenderer.HEAD_2}"><span class="entry-title" data-title-index="${this._headerIndex++}">${entry.name}.</span> `);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, depth, {prefix: "<p>", suffix: "</p>"});
					}
					textStack.push(`</${this.wrapperTag}>`);
					break;

				case "attack":
					renderPrefix();
					textStack.push(`<i>${Parser.attackTypeToFull(entry.attackType)}:</i> `);
					for (let i = 0; i < entry.attackEntries.length; i++) {
						this.recursiveEntryRender(entry.attackEntries[i], textStack, depth);
					}
					textStack.push(` <i>Hit:</i> `);
					for (let i = 0; i < entry.hitEntries.length; i++) {
						this.recursiveEntryRender(entry.hitEntries[i], textStack, depth);
					}
					renderSuffix();
					break;

				// list items
				case "item":
					renderPrefix();
					textStack.push(`<p><span class="bold list-item-title">${entry.name}</span> `);
					if (entry.entry) this.recursiveEntryRender(entry.entry, textStack, depth, {prefix: "", suffix: ""});
					else if (entry.entries) entry.entries.forEach((nxt, i) => this.recursiveEntryRender(nxt, textStack, depth, {prefix: i > 0 ? `<span class="para-continue-indented">` : "", suffix: i > 0 ? "</span>" : ""}));
					textStack.push("</p>");
					renderSuffix();
					break;
				case "itemSub":
					renderPrefix();
					this.recursiveEntryRender(entry.entry, textStack, depth, {prefix: `<p><span class="italic list-item-title">${entry.name}</span> `, suffix: "</p>"});
					renderSuffix();
					break;
				case "itemSpell":
					renderPrefix();
					this.recursiveEntryRender(entry.entry, textStack, depth, {prefix: `<p>${entry.name} `, suffix: "</p>"});
					renderSuffix();
					break;

				// entire data records
				case "dataCreature":
					renderPrefix();
					textStack.push(`<table class="statsDataInset">`);
					textStack.push(`<thead><tr><th class="dataCreature__header" colspan="6" onclick="((ele) => {
						$(ele).find('.dataCreature__name').toggle(); 
						$(ele).find('.dataCreature__showHide').text($(ele).text().includes('+') ? '[\u2013]' : '[+]'); 
						$(ele).closest('table').find('tbody').toggle()
					})(this)">
						<span style="display: none;" class="dataCreature__name">${entry.dataCreature.name}</span>
						<span class="dataCreature__showHide">[\u2013]</span>
					</th></tr></thead><tbody>`);
					textStack.push(EntryRenderer.monster.getCompactRenderedString(entry.dataCreature, this));
					textStack.push(`</tbody></table>`);
					renderSuffix();
					break;

				// images
				case "image": {
					renderPrefix();
					if (entry.title) textStack.push(`<div class="img-title">${entry.title}</div>`);
					let href;
					if (entry.href.type === "internal") {
						const imgPart = `img/${entry.href.path}`;
						href = this.baseUrl !== "" ? `${this.baseUrl}${imgPart}` : UrlUtil.link(imgPart);
					}
					textStack.push(`
						<div class="img-wrapper">
						<a href="${href}" target='_blank' ${entry.title ? `title="${entry.title}"` : ""}>
							<img src="${href}" onload="EntryRenderer._onImgLoad()">
						</a>
						</div>
					`);
					renderSuffix();
					break;
				}
			}
		} else if (typeof entry === "string") { // block
			renderPrefix();
			renderString(this);
			renderSuffix();
		} else { // block
			// for ints or any other types which do not require specific rendering
			renderPrefix();
			textStack.push(entry);
			renderSuffix();
		}
		if (forcePrefixSuffix) renderSuffix();

		function renderPrefix () {
			if (prefix !== null) {
				textStack.push(prefix);
			}
		}

		function renderSuffix () {
			if (suffix !== null) {
				textStack.push(suffix);
			}
		}

		function renderTable (self) {
			// TODO add handling for rowLabel property

			textStack.push(`<table class="striped-odd">`);

			if (entry.caption !== undefined) {
				textStack.push(`<caption>${entry.caption}</caption>`);
			}
			textStack.push("<thead>");
			textStack.push("<tr>");

			let autoMkRoller = false;
			if (entry.colLabels) {
				autoMkRoller = entry.colLabels.length >= 2 && RollerUtil.isRollCol(entry.colLabels[0]);
				if (autoMkRoller) {
					// scan the first column to ensure all rollable
					const notRollable = entry.rows.find(it => {
						try {
							return !/\d+(-\d+)?/.exec(it[0]);
						} catch (e) {
							return true;
						}
					});
					if (notRollable) autoMkRoller = false;
				}

				for (let i = 0; i < entry.colLabels.length; ++i) {
					textStack.push(`<th ${getTableThClassText(i)}>`);
					self.recursiveEntryRender(autoMkRoller && i === 0 ? `{@dice ${entry.colLabels[i]}}` : entry.colLabels[i], textStack, depth);
					textStack.push(`</th>`);
				}
			}

			textStack.push("</tr>");
			textStack.push("</thead>");
			textStack.push("<tbody>");

			for (let i = 0; i < entry.rows.length; ++i) {
				textStack.push("<tr>");
				const r = entry.rows[i];
				let roRender = r.type === "row" ? r.row : r;
				for (let j = 0; j < roRender.length; ++j) {
					// preconvert rollables
					if (autoMkRoller && j === 0) {
						roRender = JSON.parse(JSON.stringify(roRender));
						const m = /(\d+)(-(\d+))?/.exec(roRender[j]); // should always match; validated earlier
						if (m[1] && !m[2]) {
							roRender[j] = {
								type: "cell",
								roll: {
									exact: Number(m[1])
								}
							};
							if (m[1][0] === "0") roRender[j].roll.pad = true;
						} else {
							roRender[j] = {
								type: "cell",
								roll: {
									min: Number(m[1]),
									max: Number(m[3])
								}
							};
							if (m[1][0] === "0" || m[3][0] === "0") roRender[j].roll.pad = true;
						}
					}

					let toRenderCell;
					if (roRender[j].type === "cell") {
						if (roRender[j].entry) {
							toRenderCell = roRender[j].entry;
						} else if (roRender[j].roll) {
							if (roRender[j].roll.entry) {
								toRenderCell = roRender[j].roll.entry;
							} else if (roRender[j].roll.exact !== undefined) {
								toRenderCell = roRender[j].roll.pad ? StrUtil.padNumber(roRender[j].roll.exact, 2, "0") : roRender[j].roll.exact;
							} else {
								toRenderCell = roRender[j].roll.pad ? `${StrUtil.padNumber(roRender[j].roll.min, 2, "0")}-${StrUtil.padNumber(roRender[j].roll.max, 2, "0")}` : `${roRender[j].roll.min}-${roRender[j].roll.max}`
							}
						}
					} else {
						toRenderCell = roRender[j];
					}
					textStack.push(`<td ${makeTableTdClassText(j)} ${getCellDataStr(roRender[j])} ${roRender[j].width ? `colspan="${roRender[j].width}"` : ""}>`);
					if (r.style === "row-indent-first" && j === 0) textStack.push(`<span class="tbl-tab-intent"/>`);
					self.recursiveEntryRender(toRenderCell, textStack, depth + 1);
					textStack.push("</td>");
				}
				textStack.push("</tr>");
			}

			textStack.push("</tbody>");
			if (entry.footnotes !== undefined) {
				textStack.push("<tfoot>");
				for (let i = 0; i < entry.footnotes.length; ++i) {
					textStack.push(`<tr><td colspan="99">`);
					self.recursiveEntryRender(entry.footnotes[i], textStack, depth + 1);
					textStack.push("</td></tr>");
				}
				textStack.push("</tfoot>");
			}
			textStack.push("</table>");

			function getCellDataStr (ent) {
				function convertZeros (num) {
					if (num === 0) return 100;
					return num;
				}
				if (ent.roll) {
					return `data-roll-min="${convertZeros(ent.roll.exact !== undefined ? ent.roll.exact : ent.roll.min)}" data-roll-max="${convertZeros(ent.roll.exact !== undefined ? ent.roll.exact : ent.roll.max)}"`
				}
				return "";
			}

			function getTableThClassText (i) {
				return entry.colStyles === undefined || i >= entry.colStyles.length ? "" : `class="${entry.colStyles[i]}"`;
			}

			function makeTableTdClassText (i) {
				if (entry.rowStyles !== undefined) {
					return entry.rowStyles === undefined || i >= entry.rowStyles.length ? "" : `class="${entry.rowStyles[i]}"`;
				} else {
					return getTableThClassText(i);
				}
			}
		}

		function handleEntries (self) {
			handleEntriesOptionsInvocationPatron(self, true);
		}

		function handleOptions (self) {
			if (entry.entries) {
				entry.entries = entry.entries.sort((a, b) => a.name && b.name ? SortUtil.ascSort(a.name, b.name) : a.name ? -1 : b.name ? 1 : 0);
				handleEntriesOptionsInvocationPatron(self, false);
			}
		}

		function handleInvocation (self) {
			handleEntriesOptionsInvocationPatron(self, true);
		}

		function handlePatron (self) {
			handleEntriesOptionsInvocationPatron(self, false);
		}

		function handleEntriesOptionsInvocationPatron (self, incDepth) {
			const inlineTitle = depth >= 2;
			const nextDepth = incDepth ? depth + 1 : depth;
			const styleString = getStyleString();
			const dataString = getDataString();
			const preReqText = getPreReqText(self);
			const headerSpan = entry.name !== undefined ? `<span class="entry-title" data-title-index="${self._headerIndex++}">${self.renderEntry({type: "inline", entries: [entry.name]})}${inlineTitle ? "." : ""}</span> ` : "";

			if (depth === -1) {
				if (!self._firstSection) {
					textStack.push(`<hr class="section-break">`);
				}
				self._firstSection = false;
			}

			if (entry.entries || entry.name) {
				textStack.push(`<${self.wrapperTag} ${dataString} ${styleString}>${headerSpan}${preReqText}`);
				if (entry.entries) {
					for (let i = 0; i < entry.entries.length; i++) {
						self.recursiveEntryRender(entry.entries[i], textStack, nextDepth, {prefix: "<p>", suffix: "</p>"});
					}
				}
				textStack.push(`</${self.wrapperTag}>`);
			}

			function getStyleString () {
				const styleClasses = [];
				styleClasses.push(_getStyleClass(entry.source));
				if (inlineTitle) {
					if (self._subVariant) styleClasses.push(EntryRenderer.HEAD_2_SUB_VARIANT);
					else styleClasses.push(EntryRenderer.HEAD_2);
				} else styleClasses.push(depth === -1 ? EntryRenderer.HEAD_NEG_1 : depth === 0 ? EntryRenderer.HEAD_0 : EntryRenderer.HEAD_1);
				if ((entry.type === "invocation" || entry.type === "patron") && entry.subclass !== undefined) styleClasses.push(CLSS_SUBCLASS_FEATURE);
				return styleClasses.length > 0 ? `class="${styleClasses.join(" ")}"` : "";
			}

			function getDataString () {
				let dataString = "";
				if (entry.type === "invocation" || entry.type === "patron") {
					const titleString = entry.source ? `title="Source: ${Parser.sourceJsonToFull(entry.source)}"` : "";
					if (entry.subclass !== undefined) dataString = `${ATB_DATA_SC}="${entry.subclass.name}" ${ATB_DATA_SRC}="${Parser._getSourceStringFromSource(entry.subclass.source)}" ${titleString}`;
					else dataString = `${ATB_DATA_SC}="${EntryRenderer.DATA_NONE}" ${ATB_DATA_SRC}="${EntryRenderer.DATA_NONE}" ${titleString}`;
				}
				return dataString;
			}

			function getPreReqText (self) {
				if (entry.prerequisite) {
					const tempStack = [];
					self.recursiveEntryRender({type: "inline", entries: [entry.prerequisite]}, tempStack);
					return `<span class="prerequisite">Prerequisite: ${tempStack.join("")}</span>`;
				}
				return "";
			}
		}

		function getLiStyleClass (item) {
			return `${_getStyleClass(item.source)}${item.type === "itemSpell" ? " spell-item" : ""}`;
		}

		function _getStyleClass (source) {
			const outList = [];
			if (SourceUtil.isNonstandardSource(source)) outList.push(CLSS_NON_STANDARD_SOURCE);
			if (BrewUtil.hasSourceJson(source)) outList.push(CLSS_HOMEBREW_SOURCE);
			return outList.join(" ");
		}

		function renderString (self) {
			const tagSplit = EntryRenderer.splitByTags(entry);
			for (let i = 0; i < tagSplit.length; i++) {
				const s = tagSplit[i];
				if (s === undefined || s === null || s === "") continue;
				if (s.charAt(0) === "@") {
					const [tag, text] = EntryRenderer.splitFirstSpace(s);

					if (tag === "@bold" || tag === "@b" || tag === "@italic" || tag === "@i" || tag === "@strike" || tag === "@s" || tag === "@note" || tag === "@skill" || tag === "@action") {
						switch (tag) {
							case "@b":
							case "@bold":
								textStack.push(`<b>`);
								self.recursiveEntryRender(text, textStack, depth);
								textStack.push(`</b>`);
								break;
							case "@i":
							case "@italic":
								textStack.push(`<i>`);
								self.recursiveEntryRender(text, textStack, depth);
								textStack.push(`</i>`);
								break;
							case "@s":
							case "@strike":
								textStack.push(`<s>`);
								self.recursiveEntryRender(text, textStack, depth);
								textStack.push(`</s>`);
								break;
							case "@note":
								textStack.push(`<i class="text-muted">`);
								self.recursiveEntryRender(text, textStack, depth);
								textStack.push(`</i>`);
								break;
							case "@action": // Convert this to a tag once the rules data are more navigable
								textStack.push(`<span title="${Parser.actionToExplanation(text)}" class="explanation">${text}</span>`);
								break;
							case "@skill": // Convert this to a tag once the rules data are more navigable
								textStack.push(`<span title="${Parser.skillToExplanation(text)}" class="explanation">${text}</span>`);
								break;
						}
					} else if (tag === "@dice" || tag === "@hit" || tag === "@chance") {
						const fauxEntry = {
							type: "dice",
							rollable: true
						};
						const [rollText, displayText, name] = text.split("|");
						if (displayText) fauxEntry.displayText = displayText;
						if (name) fauxEntry.name = name;

						switch (tag) {
							case "@dice": {
								// format: {@dice 1d2+3+4d5-6} // TODO do we need to handle e.g. 4d6+1-1d4+2 (negative dice exp)?
								const spl = rollText.toLowerCase().replace(/\s/g, "").replace(/-/g, "-NEG").split(/[+-]/g).map(s => s.trim());
								// recombine modifiers
								const toRoll = [];
								for (let i = 0; i < spl.length; ++i) {
									const it = spl[i];
									if (it.includes("d")) {
										const m = /^(NEG)?(\d+)?d(\d+)$/.exec(it);
										toRoll.push({
											number: Number(m[2]) || 1,
											faces: Number(m[3]),
											modifier: 0,
											hideModifier: true
										});
									} else {
										let neg = it.includes("NEG");
										toRoll[toRoll.length - 1].modifier += ((neg * -1) || 1) * Number(it.replace(/NEG/g, ""));
										toRoll[toRoll.length - 1].hideModifier = false;
									}
								}

								fauxEntry.toRoll = toRoll;
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							}
							case "@hit": {
								// format: {@hit +1} or {@hit -2}
								fauxEntry.toRoll = [
									{
										number: 1,
										faces: 20,
										modifier: Number(rollText),
										hideDice: true
									}
								];
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							}
							case "@chance": {
								// format: {@chance 25|25 percent|25% summoning chance}
								fauxEntry.toRoll = [
									{
										number: 1,
										faces: 100
									}
								];
								fauxEntry.successThresh = Number(rollText);
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							}
						}
					} else if (tag === "@filter") {
						// format: {@filter Warlock Spells|spells|level=1;2|class=Warlock}
						const [displayText, page, ...filters] = text.split("|");

						const fauxEntry = {
							type: "link",
							text: displayText,
							href: {
								type: "internal",
								path: `${page}.html`,
								hash: HASH_BLANK,
								subhashes: filters.map(f => {
									const [fname, fvals] = f.split("=").map(s => s.trim()).filter(s => s);
									return {
										key: `filter${fname}`,
										value: fvals.split(";").map(s => s.trim()).filter(s => s).join(HASH_SUB_LIST_SEP)
									}
								})
							}
						};
						self.recursiveEntryRender(fauxEntry, textStack, depth);
					} else if (tag === "@link") {
						const [displayText, url] = text.split("|");
						const fauxEntry = {
							type: "link",
							href: {
								type: "external",
								url: url
							},
							text: displayText
						};
						self.recursiveEntryRender(fauxEntry, textStack, depth);
					} else if (tag === "@5etools") {
						const [displayText, page, hash] = text.split("|");
						const fauxEntry = {
							type: "link",
							href: {
								type: "internal",
								path: page,
								hash: hash,
								hashPreEncoded: true
							},
							text: displayText
						};
						self.recursiveEntryRender(fauxEntry, textStack, depth);
					} else if (tag === "@book") {
						// format: {@book Display Text|DMG< |chapter< |section > >}
						const [displayText, book, chapter, section] = text.split("|");
						const hash = `${book}${chapter ? `${HASH_PART_SEP}${chapter}${section ? `${HASH_PART_SEP}${UrlUtil.encodeForHash(section)}` : ""}` : ""}`;
						const fauxEntry = {
							type: "link",
							href: {
								type: "internal",
								path: "book.html",
								hash,
								hashPreEncoded: true
							},
							text: displayText
						};
						self.recursiveEntryRender(fauxEntry, textStack, depth);
					} else {
						const [name, source, displayText, ...others] = text.split("|");
						const hash = `${name}${source ? `${HASH_LIST_SEP}${source}` : ""}`;

						const fauxEntry = {
							type: "link",
							href: {
								type: "internal",
								hash
							},
							text: (displayText || name)
						};
						switch (tag) {
							case "@spell":
								fauxEntry.href.path = "spells.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_SPELLS,
									source: source || SRC_PHB
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@item":
								fauxEntry.href.path = "items.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_ITEMS,
									source: source || SRC_DMG
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@class": {
								if (others.length) {
									const scSource = others.length > 1 ? `~${others[1].trim()}` : "~phb";
									fauxEntry.href.subhashes = [
										{key: "sub", value: others[0].trim() + scSource},
										{key: "sources", value: 2}
									];
									if (others.length > 2) {
										fauxEntry.href.subhashes.push({key: "f", value: others[2].trim()})
									}
								}
								fauxEntry.href.path = "classes.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							}
							case "@creature":
								fauxEntry.href.path = "bestiary.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_MM;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_BESTIARY,
									source: source || SRC_MM
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@condition":
								fauxEntry.href.path = "conditionsdiseases.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_CONDITIONS_DISEASES,
									source: source || SRC_PHB
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@disease":
								fauxEntry.href.path = "conditionsdiseases.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_CONDITIONS_DISEASES,
									source: source || SRC_DMG
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@background":
								fauxEntry.href.path = "backgrounds.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_BACKGROUNDS,
									source: source || SRC_PHB
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@race":
								fauxEntry.href.path = "races.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_RACES,
									source: source || SRC_PHB
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@invocation":
								fauxEntry.href.path = "invocations.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_INVOCATIONS,
									source: source || SRC_PHB
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@reward":
								fauxEntry.href.path = "rewards.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_REWARDS,
									source: source || SRC_DMG
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@feat":
								fauxEntry.href.path = "feats.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_FEATS,
									source: source || SRC_PHB
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@psionic":
								fauxEntry.href.path = "psionics.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_UATMC;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_PSIONICS,
									source: source || SRC_UATMC
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@object":
								fauxEntry.href.path = "objects.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_OBJECTS,
									source: source || SRC_DMG
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@boon":
							case "@cult":
								fauxEntry.href.path = "cultsboons.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_MTF;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_CULTS_BOONS,
									source: source || SRC_MTF
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
						}
					}
				} else {
					textStack.push(s);
				}
			}
		}
	};

	this.renderLink = function (self, entry) {
		function getHoverString () {
			if (!entry.href.hover) return "";
			const procHash = UrlUtil.encodeForHash(entry.href.hash).replace(/'/g, "\\'");
			if (self._tagExportDict) {
				self._tagExportDict[procHash] = {
					page: entry.href.hover.page,
					source: entry.href.hover.source,
					hash: procHash
				};
			}
			return `onmouseover="EntryRenderer.hover.mouseOver(event, this, '${entry.href.hover.page}', '${entry.href.hover.source}', '${procHash}')"`
		}

		let href;
		if (entry.href.type === "internal") {
			// baseURL is blank by default
			href = `${this.baseUrl}${entry.href.path}#`;
			if (entry.href.hash !== undefined) {
				href += entry.href.hashPreEncoded ? entry.href.hash : UrlUtil.encodeForHash(entry.href.hash);
			}
			if (entry.href.subhashes !== undefined) {
				for (let i = 0; i < entry.href.subhashes.length; i++) {
					const subHash = entry.href.subhashes[i];
					href += `${HASH_PART_SEP}${UrlUtil.encodeForHash(subHash.key)}${HASH_SUB_KV_SEP}`;
					if (subHash.value !== undefined) {
						href += UrlUtil.encodeForHash(subHash.value);
					} else {
						// TODO allow list of values
						href += subHash.values.map(v => UrlUtil.encodeForHash(v)).join(HASH_SUB_LIST_SEP);
					}
				}
			}
		} else if (entry.href.type === "external") {
			href = entry.href.url;
		}
		// overwrite href if there's an available Roll20 handout/character
		if (entry.href.hover && self._roll20Ids) {
			const procHash = UrlUtil.encodeForHash(entry.href.hash);
			const id = self._roll20Ids[procHash];
			if (id) {
				href = `http://journal.roll20.net/${id.type}/${id.roll20Id}`;
			}
		}
		return `<a href="${href}" target="_blank" ${getHoverString()}>${entry.text}</a>`;
	};

	// TODO convert params to options
	/**
	 * Helper function to render an entity using this renderer
	 * @param entry
	 * @param depth
	 * @returns {string}
	 */
	this.renderEntry = function (entry, depth = 0) {
		const tempStack = [];
		this.recursiveEntryRender(entry, tempStack, depth);
		return tempStack.join("");
	};
}

EntryRenderer.splitFirstSpace = function (string) {
	return [
		string.substr(0, string.indexOf(' ')),
		string.substr(string.indexOf(' ') + 1)
	];
};

EntryRenderer.splitByTags = function (string) {
	let tagDepth = 0;
	let inTag = false;
	let char, char2;
	const out = [];
	let curStr = "";
	for (let i = 0; i < string.length; ++i) {
		char = string.charAt(i);
		char2 = i < string.length - 1 ? string.charAt(i + 1) : null;

		switch (char) {
			case "{":
				if (char2 === "@") {
					if (tagDepth++ > 0) {
						curStr += char;
					} else {
						out.push(curStr);
						inTag = false;
						curStr = "";
					}
				} else {
					curStr += char;
				}
				break;
			case "}":
				if (--tagDepth === 0) {
					out.push(curStr);
					curStr = "";
				} else {
					curStr += char;
				}
				break;
			default:
				curStr += char;
		}
	}
	if (curStr.length > 0) out.push(curStr);

	return out;
};

EntryRenderer._getDiceString = function (diceItem, isDroll) {
	return `${!diceItem.hideDice || isDroll ? `${diceItem.number}d${diceItem.faces}` : ""}${!diceItem.hideModifier && diceItem.modifier !== undefined ? `${diceItem.modifier >= 0 ? "+" : ""}${diceItem.modifier}` : ""}`;
};

EntryRenderer.getEntryDice = function (entry, name) {
	function getDiceAsStr () {
		if (entry.successThresh) return `${entry.successThresh} percent`;
		else return entry.toRoll.map(d => EntryRenderer._getDiceString(d)).join("+");
	}

	function pack (obj) {
		return `'${JSON.stringify(obj).escapeQuotes()}'`;
	}

	const toDisplay = entry.displayText ? entry.displayText : getDiceAsStr();

	if (entry.rollable === true) return `<span class='roller render-roller' title="${name ? `${name.escapeQuotes()}` : ""}" onclick="EntryRenderer.dice.rollerClick(this, ${pack(entry)}${name ? `, '${name.escapeQuotes()}'` : ""})">${toDisplay}</span>`;
	else return toDisplay;
};

EntryRenderer.utils = {
	getBorderTr: (optText) => {
		return `<tr><th class="border" colspan="6">${optText || ""}</th></tr>`;
	},

	getDividerTr: () => {
		return `<tr><td class="divider" colspan="6"><div></div></td></tr>`;
	},

	getSourceSubText (it) {
		return it.sourceSub ? ` \u2014 ${it.sourceSub}` : "";
	},

	getNameTr: (it, addPageNum, prefix, suffix) => {
		return `<tr>
					<th class="name" colspan="6">
						<div class="name-inner">
							<span class="stats-name">${prefix || ""}${it.name}${suffix || ""}</span>
							<span class="stats-source source${it.source}" title="${Parser.sourceJsonToFull(it.source)}${EntryRenderer.utils.getSourceSubText(it)}">
								${Parser.sourceJsonToAbv(it.source)}${addPageNum && it.page ? ` p${it.page}` : ""}
							</span>
						</div>
					</th>
				</tr>`;
	},

	getPageTr: (it) => {
		return `<td colspan=6>${EntryRenderer.utils._getPageTrText(it)}</td>`;
	},

	_getPageTrText: (it) => {
		const addSourceText = it.additionalSources && it.additionalSources.length ? `. Additional information from ${it.additionalSources.map(as => `<i title="${Parser.sourceJsonToFull(as.source)}">${Parser.sourceJsonToAbv(as.source)}</i>, page ${as.page}`).join("; ")}.` : "";
		const sourceSub = EntryRenderer.utils.getSourceSubText(it);
		return it.page ? `<b>Source: </b> <i title="${Parser.sourceJsonToFull(it.source)}${sourceSub}">${Parser.sourceJsonToAbv(it.source)}${sourceSub}</i>, page ${it.page}${addSourceText}` : ""
	},

	tabButton: (label, funcChange, funcPopulate) => {
		return {
			label: label,
			funcChange: funcChange,
			funcPopulate: funcPopulate
		};
	},

	_tabs: {},
	_curTab: null,
	_prevTab: null,
	bindTabButtons: (...tabButtons) => {
		EntryRenderer.utils._tabs = {};
		EntryRenderer.utils._prevTab = EntryRenderer.utils._curTab;
		EntryRenderer.utils._curTab = null;

		const $content = $("#pagecontent");
		const $wrpTab = $(`#stat-tabs`);

		$wrpTab.find(`.stat-tab-gen`).remove();

		let initialTab = null;
		const toAdd = tabButtons.map((tb, i) => {
			const toSel = (!EntryRenderer.utils._prevTab && i === 0) || (EntryRenderer.utils._prevTab && EntryRenderer.utils._prevTab.label === tb.label);
			const $t = $(`<span class="stat-tab ${toSel ? `stat-tab-sel` : ""} btn btn-default stat-tab-gen">${tb.label}</span>`);
			tb.$t = $t;
			$t.click(() => {
				const curTab = EntryRenderer.utils._curTab;
				const tabs = EntryRenderer.utils._tabs;

				if (!curTab || curTab.label !== tb.label) {
					if (curTab) curTab.$t.removeClass(`stat-tab-sel`);
					EntryRenderer.utils._curTab = tb;
					$t.addClass(`stat-tab-sel`);
					if (curTab) tabs[curTab.label].content = $content.children().detach();

					tabs[tb.label] = tb;
					if (!tabs[tb.label].content && tb.funcPopulate) {
						tb.funcPopulate();
					} else {
						$content.append(tabs[tb.label].content);
					}
					if (tb.funcChange) tb.funcChange();
				}
			});
			if (EntryRenderer.utils._prevTab && EntryRenderer.utils._prevTab.label === tb.label) initialTab = $t;
			return $t;
		});

		toAdd.reverse().forEach($t => $wrpTab.prepend($t));
		(initialTab || toAdd[toAdd.length - 1]).click();
	}
};

EntryRenderer.feat = {
	getPrerequisiteText: function (prereqList, isShorthand, doMakeAsArray) {
		isShorthand = isShorthand === undefined || isShorthand === null ? false : isShorthand;
		doMakeAsArray = doMakeAsArray === undefined || doMakeAsArray === null ? false : doMakeAsArray;
		const outStack = [];
		if (prereqList === undefined || prereqList === null) return "";
		for (let i = 0; i < prereqList.length; ++i) {
			const pre = prereqList[i];
			if (pre.race !== undefined) {
				for (let j = 0; j < pre.race.length; ++j) {
					if (isShorthand) {
						const DASH = "-";
						const raceNameParts = pre.race[j].name.split(DASH);
						let raceName = [];
						for (let k = 0; k < raceNameParts.length; ++k) {
							raceName.push(raceNameParts[k].uppercaseFirst());
						}
						raceName = raceName.join(DASH);
						outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
					} else {
						const raceName = j === 0 ? pre.race[j].name.uppercaseFirst() : pre.race[j].name;
						outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
					}
				}
			}
			if (pre.ability !== undefined) {
				// this assumes all ability requirements are the same (13), correct as of 2017-10-06
				let attCount = 0;
				for (let j = 0; j < pre.ability.length; ++j) {
					for (const att in pre.ability[j]) {
						if (!pre.ability[j].hasOwnProperty(att)) continue;
						if (isShorthand) {
							outStack.push(att.uppercaseFirst() + (attCount === pre.ability.length - 1 ? " 13+" : ""));
						} else {
							outStack.push(Parser.attAbvToFull(att) + (attCount === pre.ability.length - 1 ? " 13 or higher" : ""));
						}
						attCount++;
					}
				}
			}
			if (pre.proficiency !== undefined) {
				// only handles armor proficiency requirements,
				for (let j = 0; j < pre.proficiency.length; ++j) {
					for (const type in pre.proficiency[j]) { // type is armor/weapon/etc.
						if (!pre.proficiency[j].hasOwnProperty(type)) continue;
						if (type === "armor") {
							if (isShorthand) {
								outStack.push("prof " + Parser.armorFullToAbv(pre.proficiency[j][type]) + " armor");
							} else {
								outStack.push("Proficiency with " + pre.proficiency[j][type] + " armor");
							}
						}
					}
				}
			}
			if (pre.spellcasting) {
				if (isShorthand) {
					outStack.push("Spellcasting");
				} else {
					outStack.push("The ability to cast at least one spell");
				}
			}
			if (pre.special) {
				if (isShorthand) outStack.push("Special");
				else {
					const renderer = EntryRenderer.getDefaultRenderer();
					outStack.push(renderer.renderEntry(pre.special));
				}
			}
		}
		if (doMakeAsArray) {
			return outStack;
		} else {
			if (isShorthand) return outStack.join("/");
			else return StrUtil.joinPhraseArray(outStack, ", ", " or ");
		}
	},

	mergeAbilityIncrease: function (feat) {
		const entries = feat.entries;
		const abilityObj = feat.ability;
		if (!abilityObj || feat._hasMergedAbility) return;
		feat._hasMergedAbility = true;
		const targetList = entries.find(e => e.type === "list");
		if (targetList) targetList.items.unshift(abilityObjToListItem());
		else {
			// this should never happen, but display sane output anyway, and throw an out-of-order exception
			entries.unshift(abilityObjToListItem());
			setTimeout(() => {
				throw new Error(`Could not find object of type "list" in "entries" for feat "${feat.name}" from source "${feat.source}" when merging ability scores! Reformat the feat to include a "list"-type entry.`);
			}, 1);
		}

		function abilityObjToListItem () {
			const TO_MAX_OF_TWENTY = ", to a maximum of 20.";
			const abbArr = [];
			if (!abilityObj.choose) {
				Object.keys(abilityObj).forEach(ab => abbArr.push(`Increase your ${Parser.attAbvToFull(ab)} score by ${abilityObj[ab]}${TO_MAX_OF_TWENTY}`));
			} else {
				const choose = abilityObj.choose;
				for (let i = 0; i < choose.length; ++i) {
					if (choose[i].from.length === 6) {
						if (choose[i].textreference) { // only used in "Resilient"
							abbArr.push(`Increase the chosen ability score by ${choose[i].amount}${TO_MAX_OF_TWENTY}`);
						} else {
							abbArr.push(`Increase one ability score of your choice by ${choose[i].amount}${TO_MAX_OF_TWENTY}`);
						}
					} else {
						const from = choose[i].from;
						const amount = choose[i].amount;
						const abbChoices = [];
						for (let j = 0; j < from.length; ++j) {
							abbChoices.push(Parser.attAbvToFull(from[j]));
						}
						const abbChoicesText = StrUtil.joinPhraseArray(abbChoices, ", ", " or ");
						abbArr.push(`Increase your ${abbChoicesText} by ${amount}${TO_MAX_OF_TWENTY}`);
					}
				}
			}
			return abbArr.join(" ");
		}
	},

	getCompactRenderedString: (feat) => {
		const renderer = EntryRenderer.getDefaultRenderer();
		const renderStack = [];

		const prerequisite = EntryRenderer.feat.getPrerequisiteText(feat.prerequisite);
		renderStack.push(`
			${EntryRenderer.utils.getNameTr(feat, true)}
			<tr class='text'><td colspan='6' class='text'>
			${prerequisite ? `<p><i>Prerequisite: ${prerequisite}</i></p>` : ""}
		`);
		renderer.recursiveEntryRender({entries: feat.entries}, renderStack, 2);
		renderStack.push(`</td></tr>`);

		return renderStack.join("");
	}
};

EntryRenderer.getDefaultRenderer = () => {
	if (!EntryRenderer.defaultRenderer) {
		EntryRenderer.defaultRenderer = new EntryRenderer();
	}
	return EntryRenderer.defaultRenderer;
};

EntryRenderer.spell = {
	getCompactRenderedString: (spell) => {
		const renderer = EntryRenderer.getDefaultRenderer();
		const renderStack = [];

		renderStack.push(`
			${EntryRenderer.utils.getNameTr(spell, true)}
			<tr><td colspan="6">
				<table class="summary striped-even">
					<tr>
						<th colspan="1">Level</th>
						<th colspan="1">School</th>
						<th colspan="2">Casting Time</th>
						<th colspan="2">Range</th>
					</tr>	
					<tr>
						<td colspan="1">${Parser.spLevelToFull(spell.level)}${Parser.spMetaToFull(spell.meta)}</td>
						<td colspan="1">${Parser.spSchoolAbvToFull(spell.school)}</td>
						<td colspan="2">${Parser.spTimeListToFull(spell.time)}</td>
						<td colspan="2">${Parser.spRangeToFull(spell.range)}</td>
					</tr>
					<tr>
						<th colspan="4">Components</th>
						<th colspan="2">Duration</th>
					</tr>	
					<tr>
						<td colspan="4">${Parser.spComponentsToFull(spell.components)}</td>
						<td colspan="2">${Parser.spDurationToFull(spell.duration)}</td>
					</tr>
				</table>
			</td></tr>
		`);

		renderStack.push(`<tr class='text'><td colspan='6' class='text'>`);
		const entryList = {type: "entries", entries: spell.entries};
		renderer.recursiveEntryRender(entryList, renderStack, 1);
		if (spell.entriesHigherLevel) {
			const higherLevelsEntryList = {type: "entries", entries: spell.entriesHigherLevel};
			renderer.recursiveEntryRender(higherLevelsEntryList, renderStack, 2);
		}
		renderStack.push(`</td></tr>`);

		return renderStack.join("");
	},

	getRenderedString: (spell, renderer) => {
		const renderStack = [];

		renderStack.push(`
			${EntryRenderer.utils.getBorderTr()}
			${EntryRenderer.utils.getNameTr(spell)}
			<tr><td class="levelschoolritual" colspan="6"><span>${Parser.spLevelSchoolMetaToFull(spell.level, spell.school, spell.meta)}</span></td></tr>
			<tr><td class="castingtime" colspan="6"><span class="bold">Casting Time: </span>${Parser.spTimeListToFull(spell.time)}</td></tr>
			<tr><td class="range" colspan="6"><span class="bold">Range: </span>${Parser.spRangeToFull(spell.range)}</td></tr>
			<tr><td class="components" colspan="6"><span class="bold">Components: </span>${Parser.spComponentsToFull(spell.components)}</td></tr>
			<tr><td class="range" colspan="6"><span class="bold">Duration: </span>${Parser.spDurationToFull(spell.duration)}</td></tr>
			${EntryRenderer.utils.getDividerTr()}
		`);

		const entryList = {type: "entries", entries: spell.entries};
		renderStack.push(`<tr class='text'><td colspan='6' class='text'>`);
		renderer.recursiveEntryRender(entryList, renderStack, 1);
		if (spell.entriesHigherLevel) {
			const higherLevelsEntryList = {type: "entries", entries: spell.entriesHigherLevel};
			renderer.recursiveEntryRender(higherLevelsEntryList, renderStack, 2);
		}
		renderStack.push(`</td></tr>`);

		renderStack.push(`<tr class="text"><td class="classes" colspan="6"><span class="bold">Classes: </span>${Parser.spMainClassesToFull(spell.classes)}</td></tr>`);

		if (spell.classes.fromSubclass) {
			const currentAndLegacy = Parser.spSubclassesToCurrentAndLegacyFull(spell.classes);
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Subclasses: </span>${currentAndLegacy[0]}</td></tr>`);
			if (currentAndLegacy[1]) {
				renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted"><span class="bold">Subclasses (legacy): </span>${currentAndLegacy[1]}</section></td></tr>`);
			}
		}

		if (spell.scrollNote) {
			renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted">`);
			renderer.recursiveEntryRender(
				`{@italic Note: Both the {@class ${STR_FIGHTER} (${STR_ELD_KNIGHT})} and the {@class ${STR_ROGUE} (${STR_ARC_TCKER})} spell lists include all {@class ${STR_WIZARD}} spells. Spells of 5th level or higher may be cast with the aid of a spell scroll or similar.}`
				, renderStack, 2);
			renderStack.push(`</section></td></tr>`);
		}

		renderStack.push(`
			${EntryRenderer.utils.getPageTr(spell)}
			${EntryRenderer.utils.getBorderTr()}
		`);

		return renderStack.join("");
	}
};

EntryRenderer.condition = {
	getCompactRenderedString: (cond) => {
		const renderer = EntryRenderer.getDefaultRenderer();
		const renderStack = [];

		renderStack.push(`
			${EntryRenderer.utils.getNameTr(cond, true)}
			<tr class="text"><td colspan="6">
		`);
		renderer.recursiveEntryRender({entries: cond.entries}, renderStack);
		renderStack.push(`</td></tr>`);

		return renderStack.join("");
	}
};

EntryRenderer.background = {
	getCompactRenderedString: (bg) => {
		const renderer = EntryRenderer.getDefaultRenderer();
		const renderStack = [];

		renderStack.push(`
			${EntryRenderer.utils.getNameTr(bg, true)}
			<tr class="text"><td colspan="6">
		`);
		if (bg.skillProficiencies) {
			renderer.recursiveEntryRender({name: "Skill Proficiencies", entries: [bg.skillProficiencies]}, renderStack, 2);
		}
		renderer.recursiveEntryRender({entries: bg.entries.filter(it => it.data && it.data.isFeature)}, renderStack, 1);
		renderStack.push(`</td></tr>`);

		return renderStack.join("");
	}
};

EntryRenderer.invocation = {
	getPrerequisiteText: (prerequisites, orMode) => {
		if (!prerequisites) return "";
		const prereqs = [
			(!prerequisites.patron || prerequisites.patron === STR_ANY) ? null : `${prerequisites.patron} patron`,
			(!prerequisites.pact || prerequisites.pact === STR_ANY || prerequisites.pact === STR_SPECIAL) ? null : Parser.invoPactToFull(prerequisites.pact),
			(!prerequisites.level || prerequisites.level === STR_ANY) ? null : `${Parser.levelToFull(prerequisites.level)} level`,
			(!prerequisites.feature || prerequisites.feature === STR_NONE) ? null : `${prerequisites.feature} feature`,
			(!prerequisites.spell || prerequisites.spell === STR_NONE) ? null : prerequisites.spell instanceof Array ? CollectionUtil.joinConjunct(prerequisites.spell.map(sp => Parser.invoSpellToFull(sp)), ", ", " or ") : Parser.invoSpellToFull(prerequisites.spell)
		].filter(f => f);
		if (prerequisites.or && !orMode) prerequisites.or.map(p => EntryRenderer.invocation.getPrerequisiteText(p, true)).forEach(s => prereqs.push(s));
		if (orMode) return prereqs.join(" or ");
		else return prereqs.length ? `Prerequisites: ${prereqs.join(", ")}` : "";
	},

	getCompactRenderedString: (invo) => {
		const renderer = EntryRenderer.getDefaultRenderer();
		const renderStack = [];

		const prereqs = EntryRenderer.invocation.getPrerequisiteText(invo.prerequisites);
		renderStack.push(`
			${EntryRenderer.utils.getNameTr(invo, true)}
			<tr class="text"><td colspan="6">
			${prereqs ? `<p><i>${prereqs}</i></p>` : ""}
		`);
		renderer.recursiveEntryRender({entries: invo.entries}, renderStack, 1);
		renderStack.push(`</td></tr>`);

		return renderStack.join("");
	}
};

EntryRenderer.reward = {
	getRenderedString: (reward) => {
		const renderer = EntryRenderer.getDefaultRenderer();
		const renderStack = [];
		renderer.recursiveEntryRender({entries: reward.entries}, renderStack, 1);
		return `<tr class='text'><td colspan='6'>${renderStack.join("")}</td></tr>`;
	},

	getCompactRenderedString: (reward) => {
		return `
			${EntryRenderer.utils.getNameTr(reward, true)}
			${EntryRenderer.reward.getRenderedString(reward)}
		`;
	}
};

EntryRenderer.race = {
	getCompactRenderedString: (race) => {
		const renderer = EntryRenderer.getDefaultRenderer();
		const renderStack = [];

		const ability = utils_getAbilityData(race.ability);
		renderStack.push(`
			${EntryRenderer.utils.getNameTr(race, true)}
			<tr><td colspan="6">
				<table class="summary striped-even">
					<tr>
						<th class="col-xs-4 text-align-center">Ability Sores</th>
						<th class="col-xs-4 text-align-center">Size</th>
						<th class="col-xs-4 text-align-center">Speed</th>
					</tr>
					<tr>
						<td class="text-align-center">${ability.asText}</td>
						<td class="text-align-center">${Parser.sizeAbvToFull(race.size)}</td>
						<td class="text-align-center">${Parser.getSpeedString(race)}</td>
					</tr>
				</table>
			</td></tr>
			<tr class='text'><td colspan='6'>
		`);
		renderer.recursiveEntryRender({type: "entries", entries: race.entries}, renderStack, 1);
		renderStack.push("</td></tr>");

		return renderStack.join("");
	},

	mergeSubraces: (races) => {
		const out = [];
		races.forEach(r => {
			Array.prototype.push.apply(out, EntryRenderer.race._mergeSubrace(r));
		});
		return out;
	},

	_mergeSubrace: (race) => {
		if (race.subraces) {
			const srCopy = JSON.parse(JSON.stringify(race.subraces));
			const out = [];

			srCopy.forEach(s => {
				const cpy = JSON.parse(JSON.stringify(race));
				cpy._baseName = cpy.name;
				cpy._baseSource = cpy.source;
				delete cpy.subraces;

				// merge names, abilities, entries
				if (s.name) {
					cpy.name = `${cpy.name} (${s.name})`;
					delete s.name;
				}
				if (s.ability) {
					if (!cpy.ability) cpy.ability = {};
					cpy.ability = Object.assign(cpy.ability, s.ability);
					delete s.ability;
				}
				if (s.entries) {
					s.entries.forEach(e => {
						if (e.data && e.data.overwrite) {
							const toOverwrite = cpy.entries.findIndex(it => it.name.toLowerCase().trim() === e.data.overwrite.toLowerCase().trim());
							cpy.entries[toOverwrite] = e;
						} else {
							cpy.entries.push(e);
						}
					});
					delete s.entries;
				}

				// overwrite everything else
				Object.assign(cpy, s);

				out.push(cpy);
			});
			return out;
		} else {
			return [race];
		}
	}
};

EntryRenderer.deity = {
	getCompactRenderedString: (deity) => {
		const renderer = EntryRenderer.getDefaultRenderer();
		return `
			${EntryRenderer.utils.getNameTr(deity, true, "", deity.title ? `, ${deity.title.toTitleCase()}` : "")}
			<tr><td colspan="6">
				<div class="summary-flexer">
					<p><b>Pantheon:</b> ${deity.pantheon}</p>
					${deity.category ? `<p><b>Category:</b> ${deity.category}</p>` : ""}
					<p><b>Alignment:</b> ${deity.alignment.map(a => Parser.alignmentAbvToFull(a)).join(" ")}</p>
					<p><b>Domains:</b> ${deity.domains.join(", ")}</p>
					${deity.province ? `<p><b>Province:</b> ${deity.province}</p>` : ""}
					${deity.altNames ? `<p><b>Alternate Names:</b> ${deity.altNames.join(", ")}</p>` : ""}
					<p><b>Symbol:</b> ${deity.symbol}</p>
				</div>
			</td>
			${deity.entries ? `<tr><td colspan="6"><div class="border"></div></td></tr><tr><td colspan="6">${renderer.renderEntry({entries: deity.entries}, 1)}</td></tr>` : ""}
		`;
	}
};

EntryRenderer.object = {
	getCompactRenderedString: (obj) => {
		const renderer = EntryRenderer.getDefaultRenderer();
		return `
			${EntryRenderer.utils.getNameTr(obj, true)}
			<tr><td colspan="6">
				<table class="summary striped-even">
					<tr>
						<th class="col-xs-3 text-align-center">Type</th>
						<th class="col-xs-3 text-align-center">AC</th>
						<th class="col-xs-3 text-align-center">HP</th>
						<th class="col-xs-3 text-align-center">Damage Imm.</th>
					</tr>
					<tr>
						<td class="text-align-center">${Parser.sizeAbvToFull(obj.size)} object</td>					
						<td class="text-align-center">${obj.ac}</td>
						<td class="text-align-center">${obj.hp}</td>
						<td class="text-align-center">${obj.immune}</td>
					</tr>
				</table>			
			</td></tr>
			<tr class="text"><td colspan="6">
			${obj.entries ? renderer.renderEntry({entries: obj.entries}, 2) : ""}
			${obj.actionEntries ? renderer.renderEntry({entries: obj.actionEntries}, 2) : ""}
			</td></tr>
		`;
	}
};

EntryRenderer.traphazard = {
	getSubtitle (it) {
		const type = it.trapType || "HAZ";
		switch (type) {
			case "SMPL":
			case "CMPX":
				return `${Parser.trapTypeToFull(type)} (${Parser.tierToFullLevel(it.tier)}, ${Parser.threatToFull(it.threat)} threat)`;
			default:
				return Parser.trapTypeToFull(type);
		}
	},

	getSimplePart (renderer, it) {
		if (it.trapType === "SMPL") {
			return renderer.renderEntry({
				entries: [
					{
						type: "entries",
						name: "Trigger",
						entries: it.trigger
					},
					{
						type: "entries",
						name: "Effect",
						entries: it.effect
					},
					{
						type: "entries",
						name: "Countermeasures",
						entries: it.countermeasures
					}
				]
			}, 1);
		}
		return "";
	},

	getComplexPart (renderer, it) {
		if (it.trapType === "CMPX") {
			return renderer.renderEntry({
				entries: [
					{
						type: "entries",
						name: "Trigger",
						entries: it.trigger
					},
					{
						type: "entries",
						name: "Initiative",
						entries: [`The trap acts on ${Parser.trapInitToFull(it.initiative)}${it.initiativeNote ? ` (${it.initiativeNote})` : ""}.`]
					},
					it.eActive ? {
						type: "entries",
						name: "Active Elements",
						entries: it.eActive
					} : null,
					it.eDynamic ? {
						type: "entries",
						name: "Dynamic Elements",
						entries: it.eDynamic
					} : null,
					it.eConstant ? {
						type: "entries",
						name: "Constant Elements",
						entries: it.eConstant
					} : null,
					{
						type: "entries",
						name: "Countermeasures",
						entries: it.countermeasures
					}
				].filter(it => it)
			}, 1);
		}
		return "";
	},

	getCompactRenderedString: (it) => {
		const renderer = EntryRenderer.getDefaultRenderer();
		return `
			${EntryRenderer.utils.getNameTr(it, true)}
			<tr class="text"><td colspan="6"><i>${EntryRenderer.traphazard.getSubtitle(it)}</i>${EntryRenderer.traphazard.getSimplePart(renderer, it)}${EntryRenderer.traphazard.getComplexPart(renderer, it)}</td>
			<tr class="text"><td colspan="6">${renderer.renderEntry({entries: it.entries}, 2)}</td></tr>
		`;
	}
};

EntryRenderer.cultboon = {
	doRenderCultParts (it, renderer, renderStack) {
		if (it.goal || it.cultists || it.signaturespells) {
			const fauxList = {
				type: "list",
				style: "list-hang-notitle",
				items: []
			};
			if (it.goal) {
				fauxList.items.push({
					type: "item",
					name: "Goals:",
					entry: it.goal.entry
				});
			}

			if (it.cultists) {
				fauxList.items.push({
					type: "item",
					name: "Typical Cultists:",
					entry: it.cultists.entry
				});
			}
			if (it.signaturespells) {
				fauxList.items.push({
					type: "item",
					name: "Signature Spells:",
					entry: it.signaturespells.entry
				});
			}
			renderer.recursiveEntryRender(fauxList, renderStack, 2);
		}
	},

	doRenderBoonParts (it, renderer, renderStack) {
		const benefits = {type: "list", style: "list-hang-notitle", items: []};
		benefits.items.push({
			type: "item",
			name: "Ability Score Adjustment:",
			entry: it.ability ? it.ability.entry : "None"
		});
		benefits.items.push({
			type: "item",
			name: "Signature Spells:",
			entry: it.signaturespells ? it.signaturespells.entry : "None"
		});
		renderer.recursiveEntryRender(benefits, renderStack, 1);
	},

	getCompactRenderedString: (it) => {
		const renderer = EntryRenderer.getDefaultRenderer();

		const renderStack = [];
		if (it._type === "c") {
			EntryRenderer.cultboon.doRenderCultParts(it, renderer, renderStack);
			renderer.recursiveEntryRender({entries: it.entries}, renderStack, 2);
			return `${EntryRenderer.utils.getNameTr(it, true)}
				<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
				<tr class='text'><td colspan='6' class='text'>${renderStack.join("")}</td></tr>`;
		} else if (it._type === "b") {
			EntryRenderer.cultboon.doRenderBoonParts(it, renderer, renderStack);
			renderer.recursiveEntryRender({entries: it.entries}, renderStack, 1);
			return `${EntryRenderer.utils.getNameTr(it, true)}
			<tr class='text'><td colspan='6'>${renderStack.join("")}</td></tr>`;
		}
	}
};

EntryRenderer.monster = {
	getLegendaryActionIntro: (mon) => {
		const legendaryActions = mon.legendaryActions || 3;
		const legendaryName = mon.name.split(",");
		return `${mon.isNamedCreature ? "" : "The "}${legendaryName[0]} can take ${legendaryActions} legendary action${legendaryActions > 1 ? "s" : ""}, choosing from the options below. Only one legendary action can be used at a time and only at the end of another creature's turn. ${mon.isNamedCreature ? "" : "The "}${legendaryName[0]} regains spent legendary actions at the start of its turn.`
	},

	getCompactRenderedString: (mon, renderer) => {
		renderer = renderer || EntryRenderer.getDefaultRenderer();

		function makeAbilityRoller (ability) {
			const mod = Parser.getAbilityModifier(mon[ability]);
			return renderer.renderEntry(`{@dice 1d20${mod}|${mon[ability]} (${mod})|${Parser.attAbvToFull(ability)}`);
		}

		function makeSkillRoller (name, mod) {
			return renderer.renderEntry(`${name} {@dice 1d20${mod}|${mod}|${name}`);
		}

		function makeSaveRoller (attr, mod) {
			return renderer.renderEntry(`${attr.uppercaseFirst()} {@dice 1d20${mod}|${mod}|${Parser.attAbvToFull([attr])} save`);
		}

		function getSection (title, key, depth) {
			return mon[key] ? `
			<tr class="mon-sect-header"><td colspan="6"><span>${title}</span></td></tr>
			<tr class="text compact"><td colspan="6">
			${key === "legendary" && mon.legendary ? `<p>${EntryRenderer.monster.getLegendaryActionIntro(mon)}</p>` : ""}
			${mon[key].map(it => it.rendered || renderer.renderEntry(it, depth)).join("")}
			</td></tr>
			` : ""
		}

		const renderStack = [];

		renderStack.push(`
			${EntryRenderer.utils.getNameTr(mon, true)}
			<tr><td colspan="6"><i>${Parser.sizeAbvToFull(mon.size)}, ${Parser.monTypeToFullObj(mon.type).asText}, ${Parser.alignmentListToFull(mon.alignment).toLowerCase()}</i></td></tr>
			<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr><td colspan="6">
				<table class="summary-noback">
					<tr>
						<th>Armor Class</th>
						<th>Hit Points</th>
						<th>Speed</th>
						<th>Challenge Rating</th>
					</tr>
					<tr>
						<td>${Parser.acToFull(mon.ac)}</td>					
						<td>${EntryRenderer.monster.getRenderedHp(mon.hp)}</td>					
						<td>${Parser.getSpeedString(mon)}</td>					
						<td>${Parser.monCrToFull(mon.cr)}</td>					
					</tr>
				</table>			
			</td></tr>
			<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr><td colspan="6">
				<table class="summary striped-even">
					<tr>
						<th class="col-xs-2 text-align-center">STR</th>
						<th class="col-xs-2 text-align-center">DEX</th>
						<th class="col-xs-2 text-align-center">CON</th>
						<th class="col-xs-2 text-align-center">INT</th>
						<th class="col-xs-2 text-align-center">WIS</th>
						<th class="col-xs-2 text-align-center">CHA</th>
					</tr>	
					<tr>
						<td class="text-align-center">${makeAbilityRoller("str")}</td>
						<td class="text-align-center">${makeAbilityRoller("dex")}</td>
						<td class="text-align-center">${makeAbilityRoller("con")}</td>
						<td class="text-align-center">${makeAbilityRoller("int")}</td>
						<td class="text-align-center">${makeAbilityRoller("wis")}</td>
						<td class="text-align-center">${makeAbilityRoller("cha")}</td>
					</tr>
				</table>
			</td></tr>
			<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr><td colspan="6">
				<div class="summary-flexer">
					${mon.save ? `<p><b>Saving Throws:</b> ${Object.keys(mon.save).map(s => makeSaveRoller(s, mon.save[s])).join(", ")}</p>` : ""}
					${mon.skill ? `<p><b>Skills:</b> ${Object.keys(mon.skill).sort().map(s => makeSkillRoller(s.uppercaseFirst(), mon.skill[s])).join(", ")}</p>` : ""}
					<p><b>Senses:</b> ${mon.senses ? `${mon.senses}, ` : ""}passive Perception ${mon.passive}</p>
					<p><b>Languages:</b> ${mon.languages ? mon.languages : `\u2014`}</p>
					${mon.vulnerable ? `<p><b>Damage Vuln.:</b> ${Parser.monImmResToFull(mon.vulnerable)}</p>` : ""}
					${mon.resist ? `<p><b>Damage Res.:</b> ${Parser.monImmResToFull(mon.resist)}</p>` : ""}
					${mon.immune ? `<p><b>Damage Imm.:</b> ${Parser.monImmResToFull(mon.immune)}</p>` : ""}
					${mon.conditionImmune ? `<p><b>Condition Imm.:</b> ${Parser.monCondImmToFull(mon.conditionImmune)}</p>` : ""}
				</div>
			</td></tr>
			${mon.trait || mon.spellcasting ? `<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr class="text compact"><td colspan="6">
			${EntryRenderer.monster.getOrderedTraits(mon, renderer).map(it => it.rendered || renderer.renderEntry(it, 3)).join("")}
			</td></tr>` : ""}
			${getSection("Actions", "action", 3)}
			${getSection("Reactions", "reaction", 3)}
			${getSection("Legendary Actions", "legendary", 3)}
			${mon.variant ? `
			<tr class="text compact"><td colspan="6">
			${mon.variant.map(it => it.rendered || renderer.renderEntry(it)).join("")}
			</td></tr>
			` : ""}
		`);

		return renderStack.join("");
	},

	getRenderedHp: (hp) => {
		return hp.special ? hp.special : EntryRenderer.getDefaultRenderer().renderEntry(`${hp.average} ({@dice ${hp.formula}|${hp.formula}|Hit Points})`);
	},

	getSpellcastingRenderedTraits: (mon, renderer) => {
		const out = [];
		const spellcasting = mon.spellcasting;
		for (let i = 0; i < spellcasting.length; i++) {
			const renderStack = [];
			let spellList = spellcasting[i];
			const toRender = [{type: "entries", name: spellList.name, entries: spellList.headerEntries ? JSON.parse(JSON.stringify(spellList.headerEntries)) : []}];
			if (spellList.constant || spellList.will || spellList.rest || spellList.daily || spellList.weekly) {
				const tempList = {type: "list", "style": "list-hang-notitle", items: []};
				if (spellList.constant) tempList.items.push({type: "itemSpell", name: `Constant:`, entry: spellList.constant.join(", ")});
				if (spellList.will) tempList.items.push({type: "itemSpell", name: `At will:`, entry: spellList.will.join(", ")});
				if (spellList.rest) {
					for (let j = 9; j > 0; j--) {
						let rest = spellList.rest;
						if (rest[j]) tempList.items.push({type: "itemSpell", name: `${j}/rest:`, entry: rest[j].join(", ")});
						const jEach = `${j}e`;
						if (rest[jEach]) tempList.items.push({type: "itemSpell", name: `${j}/rest each:`, entry: rest[jEach].join(", ")});
					}
				}
				if (spellList.daily) {
					for (let j = 9; j > 0; j--) {
						let daily = spellList.daily;
						if (daily[j]) tempList.items.push({type: "itemSpell", name: `${j}/day:`, entry: daily[j].join(", ")});
						const jEach = `${j}e`;
						if (daily[jEach]) tempList.items.push({type: "itemSpell", name: `${j}/day each:`, entry: daily[jEach].join(", ")});
					}
				}
				if (spellList.weekly) {
					for (let j = 9; j > 0; j--) {
						let weekly = spellList.weekly;
						if (weekly[j]) tempList.items.push({type: "itemSpell", name: `${j}/week:`, entry: weekly[j].join(", ")});
						const jEach = `${j}e`;
						if (weekly[jEach]) tempList.items.push({type: "itemSpell", name: `${j}/week each:`, entry: weekly[jEach].join(", ")});
					}
				}
				toRender[0].entries.push(tempList);
			}
			if (spellList.spells) {
				const tempList = {type: "list", "style": "list-hang-notitle", items: []};
				for (let j = 0; j < 10; j++) {
					let spells = spellList.spells[j];
					if (spells) {
						let lower = spells.lower;
						let levelCantrip = `${Parser.spLevelToFull(j)}${(j === 0 ? "s" : " level")}`;
						let slotsAtWill = ` (at will)`;
						let slots = spells.slots;
						if (slots >= 0) slotsAtWill = slots > 0 ? ` (${slots} slot${slots > 1 ? "s" : ""})` : ``;
						if (lower) {
							levelCantrip = `${Parser.spLevelToFull(lower)}-${levelCantrip}`;
							if (slots >= 0) slotsAtWill = slots > 0 ? ` (${slots} ${Parser.spLevelToFull(j)}-level slot${slots > 1 ? "s" : ""})` : ``;
						}
						tempList.items.push({type: "itemSpell", name: `${levelCantrip} ${slotsAtWill}:`, entry: spells.spells.join(", ")})
					}
				}
				toRender[0].entries.push(tempList);
			}
			if (spellList.footerEntries) toRender.push({type: "entries", entries: spellList.footerEntries});
			renderer.recursiveEntryRender({type: "entries", entries: toRender}, renderStack, 2);
			out.push({name: spellList.name, rendered: renderStack.join("")});
		}
		return out;
	},

	getOrderedTraits: (mon, renderer) => {
		let trait = mon.trait ? JSON.parse(JSON.stringify(mon.trait)) : null;
		if (mon.spellcasting) {
			const spellTraits = EntryRenderer.monster.getSpellcastingRenderedTraits(mon, renderer);
			// weave spellcasting in with other traits
			trait = trait ? trait.concat(spellTraits) : spellTraits;
		}
		if (trait) return trait.sort((a, b) => SortUtil.monTraitSort(a.name, b.name));
	},

	getSkillsString (mon) {
		function doSortMapJoinSkillKeys (obj, keys, joinWithOr) {
			const toJoin = keys.sort(SortUtil.ascSort).map(s => `${s.uppercaseFirst()} ${obj[s]}`);
			return joinWithOr ? CollectionUtil.joinConjunct(toJoin, ", ", ", or ") : toJoin.join(", ")
		}

		const skills = doSortMapJoinSkillKeys(mon.skill, Object.keys(mon.skill).filter(k => k !== "other"));
		if (mon.skill.other) {
			const others = mon.skill.other.map(it => {
				if (it.oneOf) {
					return `plus one of the following: ${doSortMapJoinSkillKeys(it.oneOf, Object.keys(it.oneOf), true)}`
				}
				throw new Error(`Unhandled monster "other" skill properties!`)
			});
			return `${skills}, ${others.join(", ")}`
		} else return skills;
	}
};

EntryRenderer.item = {
	getDamageAndPropertiesText: function (item) {
		const type = item.type || "";
		let damage = "";
		let damageType = "";
		if (item.weaponCategory) {
			if (item.dmg1) damage = utils_makeRoller(item.dmg1);
			if (item.dmgType) damageType = Parser.dmgTypeToFull(item.dmgType);
		} else if (type === "LA" || type === "MA" || type === "HA") {
			damage = "AC " + item.ac + (type === "LA" ? " + Dex" : type === "MA" ? " + Dex (max 2)" : "");
		} else if (type === "S") {
			damage = "AC +" + item.ac;
		} else if (type === "MNT" || type === "VEH" || type === "SHP") {
			const speed = item.speed;
			const capacity = item.carryingcapacity;
			if (speed) damage += "Speed: " + speed;
			if (speed && capacity) damage += type === "MNT" ? ", " : "<br>";
			if (capacity) {
				damage += "Carrying Capacity: " + capacity;
				if (capacity.indexOf("ton") === -1 && capacity.indexOf("passenger") === -1) damage += Number(capacity) === 1 ? " lb." : " lbs.";
			}
			if (type === "SHP") {
				damage += `<br>Crew ${item.crew}, AC ${item.vehAc}, HP ${item.vehHp}${item.vehDmgThresh ? `, Damage Threshold ${item.vehDmgThresh}` : ""}`;
			}
		}

		function sortProperties (a, b) {
			return SortUtil.ascSort(item._allPropertiesPtr[a].name, item._allPropertiesPtr[b].name)
		}

		let propertiesTxt = "";
		if (item.property) {
			const properties = item.property.sort(sortProperties);
			for (let i = 0; i < properties.length; i++) {
				const prop = properties[i];
				let a = item._allPropertiesPtr[prop].name;
				if (prop === "V") a = `${a} (${utils_makeRoller(item.dmg2)})`;
				if (prop === "T" || prop === "A" || prop === "AF") a = `${a} (${item.range}ft.)`;
				if (prop === "RLD") a = `${a} (${item.reload} shots)`;
				a = (i > 0 ? ", " : item.dmg1 ? "- " : "") + a;
				propertiesTxt += a;
			}
		}
		return [damage, damageType, propertiesTxt];
	},

	getCompactRenderedString: function (item) {
		const renderer = EntryRenderer.getDefaultRenderer();

		const renderStack = [];

		renderStack.push(EntryRenderer.utils.getNameTr(item, true));

		renderStack.push(`<tr><td class="typerarityattunement" colspan="6">${item.typeText}${`${item.tier ? `, ${item.tier}` : ""}${item.rarity ? `, ${item.rarity}` : ""}`} ${item.reqAttune || ""}</td>`);

		const [damage, damageType, propertiesTxt] = EntryRenderer.item.getDamageAndPropertiesText(item);
		renderStack.push(`<tr><td colspan="2">${item.value ? item.value + (item.weight ? ", " : "") : ""}${Parser.itemWeightToFull(item)}</td><td class="damageproperties" colspan="4">${damage} ${damageType} ${propertiesTxt}</tr>`);

		if (item.entries && item.entries.length) {
			renderStack.push(EntryRenderer.utils.getDividerTr());
			renderStack.push(`<tr class='text'><td colspan='6' class='text'>`);
			const entryList = {type: "entries", entries: item.entries};
			renderer.recursiveEntryRender(entryList, renderStack, 1);
			renderStack.push(`</td></tr>`);
		}

		return renderStack.join("");
	},

	_builtList: null,
	_propertyList: {},
	_typeList: {},
	_addProperty (p) {
		EntryRenderer.item._propertyList[p.abbreviation] = p.name ? JSON.parse(JSON.stringify(p)) : {
			"name": p.entries[0].name.toLowerCase(),
			"entries": p.entries
		};
	},
	_addType (t) {
		EntryRenderer.item._typeList[t.abbreviation] = t.name ? JSON.parse(JSON.stringify(t)) : {
			"name": t.entries[0].name.toLowerCase(),
			"entries": t.entries
		};
	},
	_addBrewPropertiesAndTypes () {
		BrewUtil.addBrewData((brew) => {
			(brew.itemProperty || []).forEach(p => EntryRenderer.item._addProperty(p));
			(brew.itemType || []).forEach(t => EntryRenderer.item._addType(t));
		});
	},
	/**
	 * Runs callback with itemList as argument
	 * @param callback
	 * @param urls optional overrides for default URLs
	 * @addGroups whether item groups should be included
	 */
	buildList: function (callback, urls, addGroups) {
		if (EntryRenderer.item._builtList) return callback(EntryRenderer.item._builtList);

		if (!urls) urls = {};
		let itemList;
		let basicItemList;
		let variantList;

		// allows URLs to be overriden (used by roll20 script)
		const itemUrl = urls.items || `${EntryRenderer.getDefaultRenderer().baseUrl}data/items.json`;
		const basicItemUrl = urls.basicitems || `${EntryRenderer.getDefaultRenderer().baseUrl}data/basicitems.json`;
		const magicVariantUrl = urls.magicvariants || `${EntryRenderer.getDefaultRenderer().baseUrl}data/magicvariants.json`;

		DataUtil.loadJSON(itemUrl).then(addBasicItems);

		function addBasicItems (itemData) {
			itemList = itemData.item;
			if (addGroups) itemList = itemList.concat(itemData.itemGroup || []);
			DataUtil.loadJSON(basicItemUrl).then(addVariants);
		}

		function addVariants (basicItemData) {
			basicItemList = basicItemData.basicitem;
			// Convert the property and type list JSONs into look-ups, i.e. use the abbreviation as a JSON property name
			basicItemData.itemProperty.forEach(p => EntryRenderer.item._addProperty(p));
			basicItemData.itemType.forEach(t => EntryRenderer.item._addType(t));
			EntryRenderer.item._addBrewPropertiesAndTypes();
			DataUtil.loadJSON(magicVariantUrl).then(mergeBasicItems);
		}

		function mergeBasicItems (variantData) {
			variantList = variantData.variant;
			itemList = itemList.concat(basicItemList);
			for (let i = 0; i < variantList.length; i++) {
				variantList[i].tier = variantList[i].inherits.tier;
				variantList[i].rarity = variantList[i].inherits.rarity;
				variantList[i].source = variantList[i].inherits.source;
				variantList[i].page = variantList[i].inherits.page;
				if (!variantList[i].entries && variantList[i].inherits.entries) variantList[i].entries = JSON.parse(JSON.stringify(variantList[i].inherits.entries));
				if (variantList[i].requires.armor) variantList[i].armor = variantList[i].requires.armor;
				if (variantList[i].inherits.resist) variantList[i].resist = variantList[i].inherits.resist;
				if (variantList[i].inherits.reqAttune) variantList[i].reqAttune = variantList[i].inherits.reqAttune;
			}
			itemList = itemList.concat(variantList);
			for (let i = 0; i < basicItemList.length; i++) {
				const curBasicItem = basicItemList[i];
				basicItemList[i].category = "Basic";
				if (curBasicItem.entries === undefined) curBasicItem.entries = [];
				const curBasicItemName = curBasicItem.name.toLowerCase();
				for (let j = 0; j < variantList.length; j++) {
					const curVariant = variantList[j];
					const curRequires = curVariant.requires;
					let hasRequired = curBasicItemName.indexOf(" (") === -1;
					for (const requiredProperty in curRequires) if (curRequires.hasOwnProperty(requiredProperty) && curBasicItem[requiredProperty] !== curRequires[requiredProperty]) hasRequired = false;
					if (curVariant.excludes) {
						const curExcludes = curVariant.excludes;
						for (const excludedProperty in curExcludes) if (curExcludes.hasOwnProperty(excludedProperty) && curBasicItem[excludedProperty] === curExcludes[excludedProperty]) hasRequired = false;
					}
					if (hasRequired) {
						const curInherits = curVariant.inherits;
						const tmpBasicItem = JSON.parse(JSON.stringify(curBasicItem));
						delete tmpBasicItem.value; // Magic items do not inherit the value of the non-magical item
						tmpBasicItem.category = "Specific Variant";
						for (const inheritedProperty in curInherits) {
							if (curInherits.hasOwnProperty(inheritedProperty)) {
								if (inheritedProperty === "namePrefix") {
									tmpBasicItem.name = curInherits.namePrefix + tmpBasicItem.name;
								} else if (inheritedProperty === "nameSuffix") {
									tmpBasicItem.name += curInherits.nameSuffix;
								} else if (inheritedProperty === "entries") {
									for (let k = curInherits.entries.length - 1; k > -1; k--) {
										let tmpText = curInherits.entries[k];
										if (typeof tmpText === "string") {
											if (tmpBasicItem.dmgType) tmpText = tmpText.replace(/{@dmgType}/g, Parser.dmgTypeToFull(tmpBasicItem.dmgType));
											if (curInherits.genericBonus) tmpText = tmpText.replace(/{@genericBonus}/g, curInherits.genericBonus);
											if (tmpText.indexOf("{@lowerName}") !== -1) tmpText = tmpText.split("{@lowerName}").join(curBasicItemName);
										}
										tmpBasicItem.entries.unshift(tmpText);
									}
								} else tmpBasicItem[inheritedProperty] = curInherits[inheritedProperty];
							}
						}
						itemList.push(tmpBasicItem);
					}
				}
			}
			enhanceItems();
		}

		function enhanceItems () {
			for (let i = 0; i < itemList.length; i++) {
				const item = itemList[i];
				EntryRenderer.item.enhanceItem(item);
			}
			EntryRenderer.item._builtList = itemList;
			callback(itemList);
		}
	},

	_priceRe: /^(\d+)(\w+)$/,
	enhanceItem (item) {
		item._isEnhanced = true;
		if (item.noDisplay) return;
		if (item.type === "GV") item.category = "Generic Variant";
		if (item.category === undefined) item.category = "Other";
		if (item.entries === undefined) item.entries = [];
		if (item.type && EntryRenderer.item._typeList[item.type]) for (let j = 0; j < EntryRenderer.item._typeList[item.type].entries.length; j++) item.entries.push(EntryRenderer.item._typeList[item.type].entries[j]);
		if (item.property) {
			item.property.forEach(p => {
				if (!EntryRenderer.item._propertyList[p]) throw new Error(`Item property ${p} not found. You probably meant to load the property/type reference first; see \`EntryRenderer.item.populatePropertyAndTypeReference()\`.`);
				if (EntryRenderer.item._propertyList[p].entries) {
					EntryRenderer.item._propertyList[p].entries.forEach(e => {
						item.entries.push(e);
					})
				}
			});
		}
		// The following could be encoded in JSON, but they depend on more than one JSON property; maybe fix if really bored later
		if (item.armor) {
			if (item.resist) item.entries.push("You have resistance to " + item.resist + " damage while you wear this armor.");
			if (item.armor && item.stealth) item.entries.push("The wearer has disadvantage on Stealth (Dexterity) checks.");
			if (item.type === "HA" && item.strength) item.entries.push("If the wearer has a Strength score lower than " + item.strength + ", their speed is reduced by 10 feet.");
		} else if (item.resist) {
			if (item.type === "P") item.entries.push("When you drink this potion, you gain resistance to " + item.resist + " damage for 1 hour.");
			if (item.type === "RG") item.entries.push("You have resistance to " + item.resist + " damage while wearing this ring.");
		}
		if (item.type === "SCF") {
			if (item.scfType === "arcane") item.entries.push("An arcane focus is a special item designed to channel the power of arcane spells. A sorcerer, warlock, or wizard can use such an item as a spellcasting focus, using it in place of any material component which does not list a cost.");
			if (item.scfType === "druid") item.entries.push("A druid can use such a druidic focus as a spellcasting focus, using it in place of any material component that does not have a cost.");
			if (item.scfType === "holy") {
				item.entries.push("A holy symbol is a representation of a god or pantheon.");
				item.entries.push("A cleric or paladin can use a holy symbol as a spellcasting focus, using it in place of any material components which do not list a cost. To use the symbol in this way, the caster must hold it in hand, wear it visibly, or bear it on a shield.");
			}
		}

		// bind pointer to propertyList
		if (item.property) {
			item._allPropertiesPtr = EntryRenderer.item._propertyList;
		}

		// bake in types
		const type = [];
		if (item.wondrous) type.push("Wondrous Item");
		if (item.technology) type.push(item.technology);
		if (item.age) type.push(item.age);
		if (item.weaponCategory) type.push(item.weaponCategory + " Weapon");
		if (item.type) type.push(Parser.itemTypeToAbv(item.type));
		if (item.poison) type.push("Poison");
		item.procType = type;
		item.typeText = type.join(", ");

		// bake in attunement
		let attunement = "No";
		if (item.reqAttune !== undefined) {
			if (item.reqAttune === "YES") {
				attunement = "Yes";
				item.reqAttune = "(Requires Attunement)"
			} else if (item.reqAttune === "OPTIONAL") {
				attunement = "Optional";
				item.reqAttune = "(Attunement Optional)"
			} else if (item.reqAttune.toLowerCase().startsWith("by")) {
				attunement = "By...";
				item.reqAttune = "(Requires Attunement " + item.reqAttune + ")";
			} else {
				attunement = "Yes"; // throw any weird ones in the "Yes" category (e.g. "outdoors at night")
				item.reqAttune = "(Requires Attunement " + item.reqAttune + ")";
			}
		}
		item.attunementCategory = attunement;

		// format price nicely
		// 5 characters because e.g. XXXgp is fine
		if (item.value && item.value.length > 5) {
			const m = EntryRenderer.item._priceRe.exec(item.value);
			if (m) {
				item.value = `${Number(m[1]).toLocaleString()}${m[2]}`;
			}
		}
	},

	promiseData: (urls, addGroups) => {
		return new Promise((resolve, reject) => {
			EntryRenderer.item.buildList((data) => resolve({item: data}), urls, addGroups);
		});
	},

	populatePropertyAndTypeReference: () => {
		return DataUtil.loadJSON(`${EntryRenderer.getDefaultRenderer().baseUrl}data/basicitems.json`).then(data => {
			try {
				data.itemProperty.forEach(p => EntryRenderer.item._addProperty(p));
				data.itemType.forEach(t => EntryRenderer.item._addType(t));
				EntryRenderer.item._addBrewPropertiesAndTypes();
				Promise.resolve();
			} catch (e) {
				Promise.reject(e);
			}
		});
	}
};

EntryRenderer.psionic = {
	enhanceMode: (mode) => {
		if (!mode.enhanced) {
			mode.name = `${mode.name} ${getModeSuffix(mode, false)}`;

			if (mode.submodes) {
				mode.submodes.forEach(sm => {
					sm.name = `${sm.name} ${getModeSuffix(sm, true)}`;
				});
			}

			mode.enhanced = true;
		}

		function getModeSuffix (mode, subMode) {
			subMode = subMode === undefined || subMode === null ? false : subMode;
			const modeTitleArray = [];
			const bracketPart = getModeTitleBracketPart();
			if (bracketPart !== null) modeTitleArray.push(bracketPart);
			if (subMode) return `${modeTitleArray.join(" ")}`;
			else return `${modeTitleArray.join(" ")}</span>`;

			function getModeTitleBracketPart () {
				const modeTitleBracketArray = [];

				if (mode.cost) modeTitleBracketArray.push(getModeTitleCost());
				if (mode.concentration) modeTitleBracketArray.push(getModeTitleConcentration());

				if (modeTitleBracketArray.length === 0) return null;
				return `(${modeTitleBracketArray.join("; ")})`;

				function getModeTitleCost () {
					const costMin = mode.cost.min;
					const costMax = mode.cost.max;
					const costString = costMin === costMax ? costMin : `${costMin}-${costMax}`;
					return `${costString} psi`;
				}

				function getModeTitleConcentration () {
					return `conc., ${mode.concentration.duration} ${mode.concentration.unit}.`
				}
			}
		}
	},

	getTalentText: (psionic, renderer) => {
		const renderStack = [];
		renderer.recursiveEntryRender(({entries: psionic.entries, type: "entries"}), renderStack);
		return renderStack.join("");
	},

	getDisciplineText: (psionic, renderer) => {
		const modeStringArray = [];
		for (let i = 0; i < psionic.modes.length; ++i) {
			modeStringArray.push(EntryRenderer.psionic.getModeString(psionic, renderer, i));
		}

		return `${EntryRenderer.psionic.getDescriptionString(psionic, renderer)}${EntryRenderer.psionic.getFocusString(psionic, renderer)}${modeStringArray.join(STR_EMPTY)}`;
	},

	getDescriptionString: (psionic, renderer) => {
		return `<p>${renderer.renderEntry({type: "inline", entries: [psionic.description]})}</p>`;
	},

	getFocusString: (psionic, renderer) => {
		return `<p><span class='psi-focus-title'>Psychic Focus.</span> ${renderer.renderEntry({type: "inline", entries: [psionic.focus]})}</p>`;
	},

	getModeString: (psionic, renderer, modeIndex) => {
		const mode = psionic.modes[modeIndex];
		EntryRenderer.psionic.enhanceMode(mode, false);

		const renderStack = [];
		renderer.recursiveEntryRender(mode, renderStack, 3);
		const modeString = renderStack.join("");
		if (psionic.modes[modeIndex].submodes === undefined) return modeString;
		const subModeString = getSubModeString();
		return `${modeString}${subModeString}`;

		function getSubModeString () {
			const subModes = psionic.modes[modeIndex].submodes;

			const fauxEntry = {
				type: "list",
				style: "list-hang-notitle",
				items: []
			};

			for (let i = 0; i < subModes.length; ++i) {
				fauxEntry.items.push({
					type: "item",
					name: subModes[i].name,
					entry: subModes[i].entries.join("<br>")
				});
			}
			const renderStack = [];
			renderer.recursiveEntryRender(fauxEntry, renderStack, 4);
			return renderStack.join("");
		}
	},

	getCompactRenderedString: (psionic) => {
		const renderer = EntryRenderer.getDefaultRenderer();

		const typeOrderStr = psionic.type === "T" ? Parser.psiTypeToFull(psionic.type) : `${psionic.order} ${Parser.psiTypeToFull(psionic.type)}`;
		const bodyStr = psionic.type === "T" ? EntryRenderer.psionic.getTalentText(psionic, renderer) : EntryRenderer.psionic.getDisciplineText(psionic, renderer);

		return `
			${EntryRenderer.utils.getNameTr(psionic, true)}
			<tr class="text"><td colspan="6">
			<p><i>${typeOrderStr}</i></p>
			${bodyStr}
			</td></tr>
		`;
	}
};

EntryRenderer.rule = {
	getCompactRenderedString (rule) {
		return `
			<tr><td colspan="6">
			${EntryRenderer.getDefaultRenderer().setFirstSection(true).renderEntry(rule)}
			</td></tr>
		`;
	}
};

EntryRenderer.variantrule = {
	getCompactRenderedString (rule) {
		return `
			<tr><td colspan="6">
			${EntryRenderer.getDefaultRenderer().setFirstSection(true).renderEntry(rule)}
			</td></tr>
		`;
	}
};

EntryRenderer.hover = {
	linkCache: {},
	_isInit: false,
	_active: {},

	_dmScreen: null,
	bindDmScreen (screen) {
		this._dmScreen = screen;
	},

	_addToCache: (page, source, hash, item) => {
		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		if (!EntryRenderer.hover.linkCache[page]) EntryRenderer.hover.linkCache[page] = [];
		const pageLvl = EntryRenderer.hover.linkCache[page];
		if (!pageLvl[source]) pageLvl[source] = [];
		const srcLvl = pageLvl[source];
		srcLvl[hash] = item;
	},

	_getFromCache: (page, source, hash) => {
		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		return EntryRenderer.hover.linkCache[page][source][hash];
	},

	_isCached: (page, source, hash) => {
		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		return EntryRenderer.hover.linkCache[page] && EntryRenderer.hover.linkCache[page][source] && EntryRenderer.hover.linkCache[page][source][hash];
	},

	_doFillThenCall: (page, source, hash, callbackFn) => {
		/**
		 * @param data the data
		 * @param listProp list property in the data
		 * @param itemModifier optional function to run per item; takes listProp and an item as parameters
		 */
		function loadPopulate (data, listProp, itemModifier) {
			data[listProp].forEach(it => {
				const itHash = UrlUtil.URL_TO_HASH_BUILDER[page](it);
				if (itemModifier) itemModifier(listProp, it);
				EntryRenderer.hover._addToCache(page, it.source, itHash, it)
			});
		}

		function loadMultiSource (page, baseUrl, listProp) {
			if (!EntryRenderer.hover._isCached(page, source, hash)) {
				BrewUtil.addBrewData((data) => {
					if (!data[listProp]) return;
					loadPopulate(data, listProp);
				});
				DataUtil.loadJSON(`${EntryRenderer.getDefaultRenderer().baseUrl}${baseUrl}index.json`).then((data) => {
					const procData = {};
					Object.keys(data).forEach(k => procData[k.toLowerCase()] = data[k]);
					DataUtil.loadJSON(`${EntryRenderer.getDefaultRenderer().baseUrl}${baseUrl}${procData[source.toLowerCase()]}`).then((data) => {
						loadPopulate(data, listProp);
						callbackFn();
					});
				});
			} else {
				callbackFn();
			}
		}

		function loadSimple (page, jsonFile, listProp, itemModifier) {
			if (!EntryRenderer.hover._isCached(page, source, hash)) {
				BrewUtil.addBrewData((data) => {
					if (!data[listProp]) return;
					loadPopulate(data, listProp, itemModifier);
				});
				DataUtil.loadJSON(`${EntryRenderer.getDefaultRenderer().baseUrl}data/${jsonFile}`).then((data) => {
					if (listProp instanceof Array) listProp.forEach(p => loadPopulate(data, p, itemModifier));
					else loadPopulate(data, listProp, itemModifier);
					callbackFn();
				});
			} else {
				callbackFn();
			}
		}

		switch (page) {
			case UrlUtil.PG_SPELLS: {
				loadMultiSource(page, `data/spells/`, "spell");
				break;
			}

			case UrlUtil.PG_BESTIARY: {
				loadMultiSource(page, `data/bestiary/`, "monster");
				break;
			}

			case UrlUtil.PG_ITEMS: {
				if (!EntryRenderer.hover._isCached(page, source, hash)) {
					BrewUtil.addBrewData((data) => {
						if (!data.item) return;
						data.item.forEach(it => {
							if (!it._isEnhanced) EntryRenderer.item.enhanceItem(it);
							const itHash = UrlUtil.URL_TO_HASH_BUILDER[page](it);
							EntryRenderer.hover._addToCache(page, it.source, itHash, it)
						});
					});
					EntryRenderer.item.buildList((allItems) => {
						allItems.forEach(item => {
							const itemHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](item);
							EntryRenderer.hover._addToCache(page, item.source, itemHash, item)
						});
						callbackFn();
					}, {}, true);
				} else {
					callbackFn();
				}
				break;
			}

			case UrlUtil.PG_BACKGROUNDS: {
				loadSimple(page, "backgrounds.json", "background");
				break;
			}
			case UrlUtil.PG_FEATS: {
				loadSimple(page, "feats.json", "feat");
				break;
			}
			case UrlUtil.PG_INVOCATIONS: {
				loadSimple(page, "invocations.json", "invocation");
				break;
			}
			case UrlUtil.PG_PSIONICS: {
				loadSimple(page, "psionics.json", "psionic");
				break;
			}
			case UrlUtil.PG_REWARDS: {
				loadSimple(page, "rewards.json", "reward");
				break;
			}
			case UrlUtil.PG_RACES: {
				if (!EntryRenderer.hover._isCached(page, source, hash)) {
					BrewUtil.addBrewData((data) => {
						if (!data.race) return;
						loadPopulate(data, "race");
					});
					DataUtil.loadJSON(`${EntryRenderer.getDefaultRenderer().baseUrl}data/races.json`).then((data) => {
						const merged = EntryRenderer.race.mergeSubraces(data.race);
						merged.forEach(race => {
							const raceHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](race);
							EntryRenderer.hover._addToCache(page, race.source, raceHash, race)
						});
						callbackFn();
					});
				} else {
					callbackFn();
				}
				break;
			}
			case UrlUtil.PG_DEITIES: {
				loadSimple(page, "deities.json", "deity");
				break;
			}
			case UrlUtil.PG_OBJECTS: {
				loadSimple(page, "objects.json", "object");
				break;
			}
			case UrlUtil.PG_TRAPS_HAZARDS: {
				loadSimple(page, "trapshazards.json", ["trap", "hazard"]);
				break;
			}
			case UrlUtil.PG_VARIATNRULES: {
				loadSimple(page, "variantrules.json", "variantrule");
				break;
			}
			case UrlUtil.PG_CULTS_BOONS: {
				loadSimple(page, "cultsboons.json", ["cult", "boon"], (listProp, item) => item._type = listProp === "cult" ? "c" : "b");
				break;
			}
			case UrlUtil.PG_CONDITIONS_DISEASES: {
				loadSimple(page, "conditionsdiseases.json", ["condition", "disease"], (listProp, item) => item._type = listProp === "condition" ? "c" : "d");
				break;
			}
			default:
				throw new Error(`No load function defined for page ${page}`);
		}
	},

	_teardownWindow: (hoverId) => {
		const obj = EntryRenderer.hover._active[hoverId];
		if (obj) {
			obj.$ele.attr("data-hover-active", false);
			obj.$hov.remove();
			$(document).off(obj.mouseUpId);
			$(document).off(obj.mouseMoveId);
			$(window).off(obj.resizeId);
		}
		delete EntryRenderer.hover._active[hoverId];
	},

	_makeWindow () {
		if (!EntryRenderer.hover._curHovering) {
			reset();
			return;
		}
		const hoverId = EntryRenderer.hover._curHovering.hoverId;
		const ele = EntryRenderer.hover._curHovering.ele;
		const page = EntryRenderer.hover._curHovering.cPage;
		const source = EntryRenderer.hover._curHovering.cSource;
		const hash = EntryRenderer.hover._curHovering.cHash;
		const permanent = EntryRenderer.hover._curHovering.permanent;
		const clientX = EntryRenderer.hover._curHovering.clientX;

		// if we've outrun the loading, restart
		if (!EntryRenderer.hover._isCached(page, source, hash)) {
			EntryRenderer.hover._showInProgress = false;
			if ((new Date().getTime() - 5000) > EntryRenderer.hover.startTime) throw new Error(`Hover content for ${page}#${hash} took too long to load! Could this be a typo?`);
			// pass a fake "event"
			EntryRenderer.hover.show({shiftKey: permanent}, ele, page, source, hash);
			return;
		}

		const toRender = EntryRenderer.hover._getFromCache(page, source, hash);
		const content = EntryRenderer.hover._curHovering.renderFunction(toRender);

		$(ele).attr("data-hover-active", true);

		const offset = $(ele).offset();
		const vpOffsetT = offset.top - $(document).scrollTop();
		const vpOffsetL = offset.left - $(document).scrollLeft();

		const fromBottom = vpOffsetT > $(window).height() / 2;
		const fromRight = vpOffsetL > $(window).width() / 2;

		const $hov = $(`<div class="hoverbox" style="right: -600px"/>`);

		const $body = $(`body`);
		const $ele = $(ele);

		$ele.on("mouseleave", (evt) => {
			EntryRenderer.hover._cleanWindows();
			if (!($brdrTop.attr("data-perm") === "true") && !evt.shiftKey) {
				teardown();
			} else {
				$(ele).attr("data-hover-active", true);
				// use attr to let the CSS see it
				$brdrTop.attr("data-perm", true);
				delete EntryRenderer.hover._active[hoverId];
			}
		});

		const $stats = $(`<table class="stats"></table>`);
		$stats.append(content);
		let drag = {};
		const $brdrTop = $(`<div class="hoverborder top" ${permanent ? `data-perm="true"` : ""} data-hover-id="${hoverId}"></div>`)
			.on("mousedown", (evt) => {
				$hov.css("z-index", 201); // temporarily display it on top
				drag.on = true;
				drag.startX = evt.clientX;
				drag.startY = evt.clientY;
				drag.baseTop = parseFloat($hov.css("top"));
				drag.baseLeft = parseFloat($hov.css("left"));
			}).on("click", () => {
				$hov.css("z-index", ""); // remove the temporary z-boost...
				$hov.parent().append($hov); // ...and properly bring it to the front
			});
		const mouseUpId = `mouseup.${hoverId}`;
		const mouseMoveId = `mousemove.${hoverId}`;
		const resizeId = `resize.${hoverId}`;

		function isOverHoverTarget (evt, target) {
			return evt.clientX >= target.left && evt.clientX <= target.left + target.width && evt.clientY >= target.top && evt.clientY <= target.top + target.height;
		}

		$(document)
			.on(mouseUpId, (evt) => {
				if (drag.on) {
					drag.on = false;
					adjustPosition();

					// handle DM screen integration
					if (this._dmScreen) {
						const panel = this._dmScreen.getPanelPx(evt.clientX, evt.clientY);
						if (!panel) return;
						this._dmScreen.setHoveringPanel(panel);
						const target = panel.getAddButtonPos();

						if (isOverHoverTarget(evt, target)) {
							panel.doPopulate_Stats(page, source, hash);
							altTeardown();
						}
						this._dmScreen.resetHoveringButton();
					}
				}
			})
			.on(mouseMoveId, (evt) => {
				if (drag.on) {
					const diffX = drag.startX - evt.clientX;
					const diffY = drag.startY - evt.clientY;
					$hov.css("left", drag.baseLeft - diffX);
					$hov.css("top", drag.baseTop - diffY);
					drag.startX = evt.clientX;
					drag.startY = evt.clientY;
					drag.baseTop = parseFloat($hov.css("top"));
					drag.baseLeft = parseFloat($hov.css("left"));

					// handle DM screen integration
					if (this._dmScreen) {
						const panel = this._dmScreen.getPanelPx(evt.clientX, evt.clientY);
						if (!panel) return;
						this._dmScreen.setHoveringPanel(panel);
						const target = panel.getAddButtonPos();

						if (isOverHoverTarget(evt, target)) this._dmScreen.setHoveringButton(panel);
						else this._dmScreen.resetHoveringButton();
					}
				}
			});
		$(window).on(resizeId, () => {
			adjustPosition(true);
		});

		const $hovTitle = $(`<span class="window-title">${toRender.name}</span>`);
		$brdrTop.attr("data-display-title", false);
		$brdrTop.on("dblclick", () => {
			const curState = $brdrTop.attr("data-display-title");
			$brdrTop.attr("data-display-title", curState === "false");
			$brdrTop.attr("data-perm", true);
			delete EntryRenderer.hover._active[hoverId];
		});
		$brdrTop.append($hovTitle);
		const $btnClose = $(`<span class="delete-icon glyphicon glyphicon-remove"></span>`)
			.on("click", (evt) => {
				evt.stopPropagation();
				altTeardown();
			});
		$brdrTop.append($btnClose);
		$hov.append($brdrTop)
			.append($stats)
			.append(`<div class="hoverborder"></div>`);

		$body.append($hov);
		if (!permanent) {
			EntryRenderer.hover._active[hoverId] = {
				$hov: $hov,
				$ele: $ele,
				resizeId: resizeId,
				mouseUpId: mouseUpId,
				mouseMoveId: mouseMoveId
			};
		}

		if (fromBottom) $hov.css("top", vpOffsetT - $hov.height());
		else $hov.css("top", vpOffsetT + $(ele).height() + 1);

		if (fromRight) $hov.css("left", (clientX || vpOffsetL) - $hov.width());
		else $hov.css("left", (clientX || (vpOffsetL + $(ele).width())) + 5);

		adjustPosition(true);

		$(ele).css("cursor", "");
		reset();

		function adjustPosition (first) {
			// readjust position...
			// ...if vertically clipping off screen
			const hvTop = parseFloat($hov.css("top"));
			if (hvTop < 0) {
				$hov.css("top", 0);
			} else if (hvTop >= $(window).height() - EntryRenderer.hover._BAR_HEIGHT) {
				$hov.css("top", $(window).height() - EntryRenderer.hover._BAR_HEIGHT);
			}
			// ...if horizontally clipping off screen
			const hvLeft = parseFloat($hov.css("left"));
			if (hvLeft < 0) {
				$hov.css("left", 0)
			} else if (hvLeft + $hov.width() > $(window).width()) {
				$hov.css("left", Math.max($(window).width() - $hov.width(), 0));
			}
		}

		function teardown () {
			EntryRenderer.hover._teardownWindow(hoverId);
		}

		function altTeardown () {
			// alternate teardown for 'x' button
			$ele.attr("data-hover-active", false);
			$hov.remove();
			$(document).off(mouseUpId);
			$(document).off(mouseMoveId);
			$(window).off(resizeId);
			delete EntryRenderer.hover._active[hoverId];
		}

		function reset () {
			EntryRenderer.hover._showInProgress = false;
			EntryRenderer.hover._curHovering = null;
		}
	},

	_pageToRenderFn (page) {
		switch (page) {
			case UrlUtil.PG_SPELLS:
				return EntryRenderer.spell.getCompactRenderedString;
			case UrlUtil.PG_ITEMS:
				return EntryRenderer.item.getCompactRenderedString;
			case UrlUtil.PG_BESTIARY:
				return EntryRenderer.monster.getCompactRenderedString;
			case UrlUtil.PG_CONDITIONS_DISEASES:
				return EntryRenderer.condition.getCompactRenderedString;
			case UrlUtil.PG_BACKGROUNDS:
				return EntryRenderer.background.getCompactRenderedString;
			case UrlUtil.PG_FEATS:
				return EntryRenderer.feat.getCompactRenderedString;
			case UrlUtil.PG_INVOCATIONS:
				return EntryRenderer.invocation.getCompactRenderedString;
			case UrlUtil.PG_PSIONICS:
				return EntryRenderer.psionic.getCompactRenderedString;
			case UrlUtil.PG_REWARDS:
				return EntryRenderer.reward.getCompactRenderedString;
			case UrlUtil.PG_RACES:
				return EntryRenderer.race.getCompactRenderedString;
			case UrlUtil.PG_DEITIES:
				return EntryRenderer.deity.getCompactRenderedString;
			case UrlUtil.PG_OBJECTS:
				return EntryRenderer.object.getCompactRenderedString;
			case UrlUtil.PG_TRAPS_HAZARDS:
				return EntryRenderer.traphazard.getCompactRenderedString;
			case UrlUtil.PG_VARIATNRULES:
				return EntryRenderer.variantrule.getCompactRenderedString;
			case UrlUtil.PG_CULTS_BOONS:
				return EntryRenderer.cultboon.getCompactRenderedString;
			default:
				return null;
		}
	},

	startTime: null,
	mouseOver (evt, ele, page, source, hash, isPopout) {
		EntryRenderer.hover.startTime = new Date().getTime();
		EntryRenderer.hover.show(evt, ele, page, source, hash, isPopout);
	},

	_BAR_HEIGHT: 16,
	_showInProgress: false,
	_hoverId: 1,
	_popoutId: -1,
	_curHovering: null,
	show: (evt, ele, page, source, hash, isPopout) => {
		if (!EntryRenderer.hover._isInit) {
			EntryRenderer.hover._isInit = true;
			$(`body`).on("click", () => {
				EntryRenderer.hover._cleanWindows();
			});
		}

		// don't show on mobile
		if ($(window).width() <= 1024 && !evt.shiftKey) return;

		let hoverId;
		if (isPopout) {
			// always use a new hover ID if popout
			hoverId = EntryRenderer.hover._popoutId--;
			$(ele).attr("data-hover-id", hoverId);
		} else {
			const curHoverId = $(ele).attr("data-hover-id");
			if (curHoverId) {
				hoverId = Number(curHoverId);
			} else {
				hoverId = EntryRenderer.hover._hoverId++;
				$(ele).attr("data-hover-id", hoverId);
			}
		}

		const alreadyHovering = $(ele).attr("data-hover-active");
		const $curWin = $(`.hoverborder[data-hover-id="${hoverId}"]`);
		if (alreadyHovering === "true" && $curWin.length) return;

		const renderFunction = EntryRenderer.hover._pageToRenderFn(page);
		if (!renderFunction) throw new Error(`No hover render function specified for page ${page}`);
		EntryRenderer.hover._curHovering = {
			hoverId: hoverId,
			ele: ele,
			renderFunction: renderFunction,
			cPage: page,
			cSource: source,
			cHash: hash,
			permanent: evt.shiftKey,
			clientX: evt.clientX
		};

		// return if another event chain is handling the event
		if (EntryRenderer.hover._showInProgress) {
			return;
		}

		EntryRenderer.hover._showInProgress = true;
		$(ele).css("cursor", "wait");

		// clean up any old event listeners
		$(ele).off("mouseleave");

		// clean up any abandoned windows
		EntryRenderer.hover._cleanWindows();

		// cancel hover if the mouse leaves
		$(ele).on("mouseleave", () => {
			if (!EntryRenderer.hover._curHovering || !EntryRenderer.hover._curHovering.permanent) {
				EntryRenderer.hover._curHovering = null;
			}
		});

		EntryRenderer.hover._doFillThenCall(page, source, hash, EntryRenderer.hover._makeWindow.bind(EntryRenderer.hover));
	},

	_cleanWindows: () => {
		const ks = Object.keys(EntryRenderer.hover._active);
		ks.forEach(hovId => EntryRenderer.hover._teardownWindow(hovId));
	},

	bindPopoutButton: (toList) => {
		const $btnPop = ListUtil.getOrTabRightButton(`btn-popout`, `new-window`)
			.off("click")
			.attr("title", "Popout Window");
		$btnPop.on("click", (evt) => {
			if (History.lastLoadedId !== null) {
				EntryRenderer.hover.doPopout($btnPop, toList, History.lastLoadedId, evt.clientX);
			}
		});
	},

	doPopout: ($btnPop, list, index, clientX) => {
		$btnPop.attr("data-hover-active", false);
		const it = list[index];
		EntryRenderer.hover.mouseOver({shiftKey: true, clientX: clientX}, $btnPop.get(), UrlUtil.getCurrentPage(), it.source, UrlUtil.autoEncodeHash(it), true);
	}
};

EntryRenderer.dice = {
	SYSTEM_USER: {
		name: "Avandra" // goddess of luck
	},

	_$wrpRoll: null,
	_$minRoll: null,
	_$iptRoll: null,
	_$outRoll: null,
	_$head: null,
	_hist: [],
	_histIndex: null,
	_$lastRolledBy: null,
	_storage: null,

	_panel: null,
	bindDmScreenPanel (panel) {
		if (EntryRenderer.dice._panel) { // there can only be one roller box
			EntryRenderer.dice.unbindDmScreenPanel();
		}
		EntryRenderer.dice._showBox();
		EntryRenderer.dice._panel = panel;
		panel.doPopulate_Rollbox();
	},

	unbindDmScreenPanel () {
		if (EntryRenderer.dice._panel) {
			$(`body`).append(EntryRenderer.dice._$wrpRoll);
			EntryRenderer.dice._panel.reset$Content();
			EntryRenderer.dice._panel = null;
			EntryRenderer.dice._hideBox();
			EntryRenderer.dice._$wrpRoll.removeClass("rollbox-panel");
		}
	},

	get$Roller () {
		return EntryRenderer.dice._$wrpRoll;
	},

	isCrypto: () => {
		return typeof window !== "undefined" && typeof window.crypto !== "undefined";
	},

	randomise: (max, min = 1) => {
		if (EntryRenderer.dice.isCrypto()) {
			return EntryRenderer.dice._randomise(min, max + min);
		} else {
			return RollerUtil.roll(max) + min;
		}
	},

	/**
	 * Cryptographically secure RNG
	 */
	_randomise: (min, max) => {
		const range = max - min;
		const bytesNeeded = Math.ceil(Math.log2(range) / 8);
		const randomBytes = new Uint8Array(bytesNeeded);
		const maximumRange = Math.pow(Math.pow(2, 8), bytesNeeded);
		const extendedRange = Math.floor(maximumRange / range) * range;
		let i;
		let randomInteger;
		while (true) {
			window.crypto.getRandomValues(randomBytes);
			randomInteger = 0;
			for (i = 0; i < bytesNeeded; i++) {
				randomInteger <<= 8;
				randomInteger += randomBytes[i];
			}
			if (randomInteger < extendedRange) {
				randomInteger %= range;
				return min + randomInteger;
			}
		}
	},

	parseRandomise: (str) => {
		if (!str.trim()) return null;
		const toRoll = EntryRenderer.dice._parse(str);
		if (toRoll) {
			return EntryRenderer.dice._rollParsed(toRoll);
		} else {
			return null;
		}
	},

	_showBox: () => {
		if (EntryRenderer.dice._$wrpRoll.css("display") !== "flex") {
			EntryRenderer.dice._$minRoll.hide();
			EntryRenderer.dice._$wrpRoll.css("display", "flex");
			EntryRenderer.dice._$iptRoll.prop("placeholder", `${EntryRenderer.dice._randomPlaceholder()} or "/help"`);
		}
	},

	_hideBox: () => {
		EntryRenderer.dice._$minRoll.show();
		EntryRenderer.dice._$wrpRoll.css("display", "");
	},

	_DICE: [4, 6, 8, 10, 12, 20, 100],
	_randomPlaceholder: () => {
		const count = EntryRenderer.dice.randomise(10);
		const faces = EntryRenderer.dice._DICE[EntryRenderer.dice.randomise(EntryRenderer.dice._DICE.length - 1)];
		const mod = (EntryRenderer.dice.randomise(3) - 2) * EntryRenderer.dice.randomise(10);
		return `${count}d${faces}${mod < 0 ? mod : mod > 0 ? `+${mod}` : ""}`;
	},

	init: () => {
		const $wrpRoll = $(`<div class="rollbox"/>`);
		const $minRoll = $(`<div class="rollbox-min"><span class="glyphicon glyphicon-chevron-up"></span></div>`).on("click", () => {
			EntryRenderer.dice._showBox();
		});
		const $head = $(`<div class="head-roll"><span class="hdr-roll">Dice Roller</span><span class="delete-icon glyphicon glyphicon-remove"></span></div>`)
			.on("click", () => {
				if (!EntryRenderer.dice._panel) EntryRenderer.dice._hideBox();
			});
		const $outRoll = $(`<div class="out-roll">`);
		const $iptRoll = $(`<input class="ipt-roll form-control" autocomplete="off" spellcheck="false">`)
			.on("keypress", (e) => {
				if (e.which === 13) { // return
					EntryRenderer.dice.roll($iptRoll.val(), {
						user: true,
						name: "Anon"
					});
					$iptRoll.val("");
				}
				e.stopPropagation();
			}).on("keydown", (e) => {
				// arrow keys only work on keydown
				if (e.which === 38) { // up arrow
					EntryRenderer.dice._prevHistory()
				} else if (e.which === 40) { // down arrow
					EntryRenderer.dice._nextHistory()
				}
			});
		$wrpRoll.append($head).append($outRoll).append($iptRoll);

		EntryRenderer.dice._$wrpRoll = $wrpRoll;
		EntryRenderer.dice._$minRoll = $minRoll;
		EntryRenderer.dice._$head = $head;
		EntryRenderer.dice._$outRoll = $outRoll;
		EntryRenderer.dice._$iptRoll = $iptRoll;

		$(`body`).append($minRoll).append($wrpRoll);

		EntryRenderer.dice.storage = JSON.parse(StorageUtil.getStorage().getItem(ROLLER_MACRO_STORAGE) || "{}");
	},

	_prevHistory: () => {
		EntryRenderer.dice._histIndex--;
		EntryRenderer.dice._cleanHistoryIndex();
		EntryRenderer.dice._$iptRoll.val(EntryRenderer.dice._hist[EntryRenderer.dice._histIndex]);
	},

	_nextHistory: () => {
		EntryRenderer.dice._histIndex++;
		EntryRenderer.dice._cleanHistoryIndex();
		EntryRenderer.dice._$iptRoll.val(EntryRenderer.dice._hist[EntryRenderer.dice._histIndex]);
	},

	_cleanHistoryIndex: () => {
		if (!EntryRenderer.dice._hist.length) {
			EntryRenderer.dice._histIndex = null;
		} else {
			EntryRenderer.dice._histIndex = Math.min(EntryRenderer.dice._hist.length, Math.max(EntryRenderer.dice._histIndex, 0))
		}
	},

	_addHistory: (str) => {
		EntryRenderer.dice._hist.push(str);
		// point index at the top of the stack
		EntryRenderer.dice._histIndex = EntryRenderer.dice._hist.length;
	},

	_scrollBottom: () => {
		EntryRenderer.dice._$outRoll.scrollTop(1e10);
	},

	rollerClick: (ele, packed, name) => {
		const $ele = $(ele);
		const entry = JSON.parse(packed);
		function attemptToGetTitle () {
			// try use table caption
			let titleMaybe = $(ele).closest(`table`).find(`caption`).text();
			if (titleMaybe) return titleMaybe;
			// ty use list item title
			titleMaybe = $(ele).parent().children(`.list-item-title`).text();
			if (titleMaybe) return titleMaybe;
			// try use stats table name row
			titleMaybe = $(ele).closest(`table.stats`).children(`tbody`).first().children(`tr`).first().find(`th.name .stats-name`).text();
			if (titleMaybe) return titleMaybe;
			// otherwise, use the section title, where applicable
			titleMaybe = $(ele).closest(`div`).children(`.entry-title`).first().text();
			if (titleMaybe) {
				titleMaybe = titleMaybe.replace(/[.,:]$/, "");
			}
			return titleMaybe;
		}

		function attemptToGetName () {
			const $hov = $ele.closest(`.hoverbox`);
			if ($hov.length) {
				return $hov.find(`.stats-name`).first().text();
			}
			const $roll = $ele.closest(`.out-roll-wrp`);
			if ($roll.length) {
				return $roll.data("name");
			}
			let name = document.title.replace("- 5etools", "").trim();
			return name === "DM Screen" ? "Dungeon Master" : name;
		}

		function getThRoll (total) {
			const $td = $ele.closest(`table`).find(`td`).filter((i, e) => {
				const $e = $(e);
				return total >= Number($e.data("roll-min")) && total <= Number($e.data("roll-max"));
			});
			if ($td.length && $td.nextAll().length) {
				return $td.nextAll().get().map(ele => ele.innerHTML).join(" | ");
			}
		}

		const rolledBy = {
			name: attemptToGetName(),
			label: name || attemptToGetTitle(ele)
		};
		if ($ele.parent().is("th")) {
			EntryRenderer.dice.rollEntry(
				entry,
				rolledBy,
				getThRoll
			);
		} else {
			EntryRenderer.dice.rollEntry(
				entry,
				rolledBy
			);
		}
	},

	roll: (str, rolledBy) => {
		str = str.trim();
		if (!str) return;
		if (rolledBy.user) EntryRenderer.dice._addHistory(str);

		if (str.startsWith("/")) EntryRenderer.dice._handleCommand(str, rolledBy);
		else if (str.startsWith("#")) EntryRenderer.dice._handleSavedRoll(str, rolledBy);
		else {
			const toRoll = EntryRenderer.dice._parse(str);
			EntryRenderer.dice._handleRoll(toRoll, rolledBy);
		}
	},

	rollEntry: (entry, rolledBy, cbMessage) => {
		const toRoll = {
			dice: entry.toRoll.map(it => ({
				neg: false,
				num: it.number,
				faces: it.faces
			})),
			mod: entry.toRoll.map(it => it.modifier || 0).reduce((a, b) => a + b, 0),
			successThresh: entry.successThresh
		};
		EntryRenderer.dice._handleRoll(toRoll, rolledBy, cbMessage);
	},

	_handleRoll: (toRoll, rolledBy, cbMessage) => {
		EntryRenderer.dice._showBox();
		EntryRenderer.dice._checkHandleName(rolledBy.name);
		const $out = EntryRenderer.dice._$lastRolledBy;

		if (toRoll) {
			const v = EntryRenderer.dice._rollParsed(toRoll);
			const lbl = rolledBy.label && (!rolledBy.name || rolledBy.label.trim().toLowerCase() !== rolledBy.name.trim().toLowerCase()) ? rolledBy.label : null;

			const totalPart = toRoll.successThresh
				? `<span class="roll">${v.total > 100 - toRoll.successThresh ? "success" : "failure"}</span>`
				: `<span class="roll ${v.allMax ? "roll-max" : v.allMin ? "roll-min" : ""}">${v.total}</span>`;
			$out.append(`
				<div class="out-roll-item" title="${rolledBy.name ? `${rolledBy.name} \u2014 ` : ""}${lbl ? `${lbl}: ` : ""}${v.rolls.map((r, i) => `${r.neg ? "-" : i === 0 ? "" : "+"}(${r.num}d${r.faces}${r.drops ? `d${r.drops}${r.drop}` : ""})`).join("")}${v.modStr}">
					${lbl ? `<span class="roll-label">${lbl}: </span>` : ""}
					${totalPart}
					<span class="all-rolls text-muted">
						${EntryRenderer.dice.getDiceSummary(v)}
					</span>
					${cbMessage ? `<span class="message">${cbMessage(v.total)}</span>` : ""}
				</div>`);
		} else {
			$out.append(`<div class="out-roll-item">Invalid input! Try &quot;/help&quot;</div>`);
		}
		EntryRenderer.dice._scrollBottom();
	},

	_showMessage (message, rolledBy) {
		EntryRenderer.dice._showBox();
		EntryRenderer.dice._checkHandleName(rolledBy.name);
		const $out = EntryRenderer.dice._$lastRolledBy;
		$out.append(`<div class="out-roll-item">${message}</div>`);
		EntryRenderer.dice._scrollBottom();
	},

	_handleCommand (com, rolledBy) {
		EntryRenderer.dice._showMessage(`<span class="out-roll-item-code">${com}</span>`, rolledBy); // parrot the user's command back to them
		const PREF_MACRO = "/macro";
		function showInvalid () {
			EntryRenderer.dice._showMessage("Invalid input! Try &quot;/help&quot;", EntryRenderer.dice.SYSTEM_USER);
		}

		function checkLength (arr, desired) {
			return arr.length === desired;
		}

		function save () {
			StorageUtil.set(ROLLER_MACRO_STORAGE, EntryRenderer.dice.storage);
		}

		if (com === "/help") {
			EntryRenderer.dice._showMessage(
				`Use <span class="out-roll-item-code">${PREF_MACRO} list</span> to list saved macros.<br>
				Use <span class="out-roll-item-code">${PREF_MACRO} add myName 1d2+3</span> to add (or update) a macro. Macro names should not contain spaces or hashes.<br>
				Use <span class="out-roll-item-code">${PREF_MACRO} remove myName</span> to remove a macro.<br>
				Use <span class="out-roll-item-code">#myName</span> to roll a macro.`,
				EntryRenderer.dice.SYSTEM_USER
			);
		} else if (com.startsWith(PREF_MACRO)) {
			const [_, mode, ...others] = com.split(/\s+/);

			if (!["list", "add", "remove"].includes(mode)) showInvalid();
			else {
				switch (mode) {
					case "list":
						if (checkLength(others, 0)) {
							Object.keys(EntryRenderer.dice.storage).forEach(name => {
								EntryRenderer.dice._showMessage(`<span class="out-roll-item-code">#${name}</span> \u2014 ${EntryRenderer.dice.storage[name]}`, EntryRenderer.dice.SYSTEM_USER);
							})
						} else {
							showInvalid();
						}
						break;
					case "add": {
						if (checkLength(others, 2)) {
							const [name, macro] = others;
							if (name.includes(" ") || name.includes("#")) showInvalid();
							else {
								EntryRenderer.dice.storage[name] = macro;
								save();
								EntryRenderer.dice._showMessage(`Saved macro <span class="out-roll-item-code">#${name}</span>`, EntryRenderer.dice.SYSTEM_USER);
							}
						} else {
							showInvalid();
						}
						break;
					}
					case "remove":
						if (checkLength(others, 1)) {
							if (EntryRenderer.dice.storage[others[0]]) {
								delete EntryRenderer.dice.storage[others[0]];
								save();
								EntryRenderer.dice._showMessage(`Removed macro <span class="out-roll-item-code">#${others[0]}</span>`, EntryRenderer.dice.SYSTEM_USER);
							} else {
								EntryRenderer.dice._showMessage(`Macro <span class="out-roll-item-code">#${others[0]}</span> not found`, EntryRenderer.dice.SYSTEM_USER);
							}
						} else {
							showInvalid();
						}
						break;
				}
			}
		} else showInvalid();
	},

	_handleSavedRoll (id, rolledBy) {
		id = id.replace(/^#/, "");
		const macro = EntryRenderer.dice.storage[id];
		if (macro) {
			const toRoll = EntryRenderer.dice._parse(macro);
			EntryRenderer.dice._handleRoll(toRoll, rolledBy);
		} else EntryRenderer.dice._showMessage(`Macro <span class="out-roll-item-code">#${id}</span> not found`, EntryRenderer.dice.SYSTEM_USER);
	},

	getDiceSummary: (v, textOnly) => {
		return `${v.rolls.map((r, i) => `${r.neg ? "-" : i === 0 ? "" : "+"}(${r.rolls.join("+")}${r.dropped ? `${textOnly ? "" : `<span style="text-decoration: red line-through;">`}+${r.dropped.join("+")}${textOnly ? "" : `</span>`}` : ""})`).join("")}${v.modStr}`;
	},

	addRoll: (rolledBy, msgText) => {
		if (!msgText.trim()) return;
		EntryRenderer.dice._showBox();
		EntryRenderer.dice._checkHandleName(rolledBy.name);
		EntryRenderer.dice._$outRoll.prepend(`<div class="out-roll-item" title="${rolledBy.name || ""}">${msgText}</div>`);
		EntryRenderer.dice._scrollBottom();
	},

	_checkHandleName: (name) => {
		if (!EntryRenderer.dice._$lastRolledBy || EntryRenderer.dice._$lastRolledBy.data("name") !== name) {
			EntryRenderer.dice._$outRoll.prepend(`<div class="text-muted out-roll-id">${name}</div>`);
			EntryRenderer.dice._$lastRolledBy = $(`<div class="out-roll-wrp"/>`).data("name", name);
			EntryRenderer.dice._$outRoll.prepend(EntryRenderer.dice._$lastRolledBy);
		}
	},

	rollDice: (count, faces) => {
		const out = [];
		for (let i = 0; i < count; ++i) {
			out.push(EntryRenderer.dice.randomise(faces));
		}
		return out;
	},

	_rollParsed: (parsed) => {
		if (!parsed) return null;

		let rolls = [];
		if (parsed.dice) {
			rolls = parsed.dice.map(d => {
				function dropRolls (r) {
					if (!d.drops) return [r, []];
					let toSlice;
					if (d.drops === "h") {
						toSlice = [...r].sort().reverse();
					} else if (d.drops === "l") {
						toSlice = [...r].sort();
					}
					const toDrop = toSlice.slice(0, d.drop);
					const keepStack = [];
					const dropStack = [];
					r.forEach(it => {
						const di = toDrop.indexOf(it);
						if (~di) {
							toDrop.splice(di, 1);
							dropStack.push(it);
						} else {
							keepStack.push(it);
						}
					});
					return [keepStack, dropStack];
				}

				const r = EntryRenderer.dice.rollDice(d.num, d.faces);
				const [keepR, dropR] = dropRolls(r);

				const total = keepR.reduce((a, b) => a + b, 0);
				const max = (d.num - d.drop) * d.faces;
				return {
					rolls: keepR,
					dropped: dropR.length ? dropR : null,
					total: (-(d.neg || -1)) * total,
					isMax: total === max,
					isMin: total === (d.num - d.drop), // i.e. all 1's
					neg: d.neg,
					num: d.num,
					faces: d.faces,
					mod: d.mod,
					drop: d.drop,
					drops: d.drops
				}
			});
		}
		return {
			rolls: rolls,
			total: rolls.map(it => it.total).reduce((a, b) => a + b, 0) + (parsed.mod || 0),
			modStr: parsed.mod ? `${parsed.mod < 0 ? "" : "+"}${parsed.mod}` : "",
			allMax: parsed.dice && parsed.dice.length && rolls.every(it => it.isMax),
			allMin: parsed.dice && parsed.dice.length && rolls.every(it => it.isMin)
		}
	},

	_parse: (str) => {
		str = str.replace(/\s/g, "").toLowerCase();
		const mods = [];
		str = str.replace(/(([+-]+)\d+)(?=[^d]|$)|(([+-]+|^)\d+$)|(([+-]+|^)\d+(?=[+-]))/g, (m0) => {
			mods.push(m0);
			return "";
		});
		function cleanOperators (str) {
			let len;
			let nextLen;
			do {
				len = str.length;
				str = str.replace(/--/g, "+").replace(/\+\++/g, "+").replace(/-\+/g, "-").replace(/\+-/g, "-");
				nextLen = str.length;
			} while (len !== nextLen);
			return str;
		}

		const totalMods = mods.map(m => Number(cleanOperators(m))).reduce((a, b) => a + b, 0);

		function isNumber (char) {
			return char >= "0" && char <= "9";
		}

		function getNew () {
			return {
				neg: false,
				num: 1,
				faces: 20
			};
		}

		const S_INIT = -1;
		const S_NONE = 0;
		const S_COUNT = 1;
		const S_FACES = 2;

		const stack = [];

		let state = str.length ? S_NONE : S_INIT;
		let cur = getNew();
		let temp = "";
		let c;
		let drop = false;
		for (let i = 0; i < str.length; ++i) {
			c = str.charAt(i);

			switch (state) {
				case S_NONE:
					if (c === "-") {
						cur.neg = !cur.neg;
					} else if (isNumber(c)) {
						temp += c;
						state = S_COUNT;
					} else if (c === "d") {
						state = S_FACES;
					} else if (c !== "+") {
						return null;
					}
					break;
				case S_COUNT:
					if (isNumber(c)) {
						temp += c;
					} else if (c === "d") {
						if (temp) {
							cur.num = Number(temp);
							temp = "";
						}
						state = S_FACES;
					} else {
						return null;
					}
					break;
				case S_FACES:
					if (isNumber(c)) {
						temp += c;
					} else if (c === "d") {
						if (!drop) {
							if (temp) {
								drop = true;
								cur.faces = Number(temp);
								if (!cur.num || !cur.faces) return null;
								temp = "";
							} else {
								return null;
							}
						} else return null;
					} else if (c === "l") {
						if (drop) {
							cur.drops = "l";
						} else return null;
					} else if (c === "h") {
						if (drop) {
							cur.drops = "h";
						} else return null;
					} else if (c === "+") {
						if (temp) {
							if (drop) cur.drop = Number(temp);
							else cur.faces = Number(temp);

							if (!cur.num || !cur.faces || (cur.drop && (cur.drop >= cur.num))) return null;
							stack.push(cur);
							cur = getNew();
							temp = "";
							state = S_NONE;
						} else {
							return null;
						}
					} else if (c === "-") {
						if (temp) {
							if (drop) cur.drop = Number(temp);
							else cur.faces = Number(temp);

							if (!cur.num || !cur.faces || (cur.drop && (cur.drop >= cur.num))) return null;
							stack.push(cur);
							cur = getNew();
							cur.neg = true;
							temp = "";
							state = S_NONE;
						} else {
							return null;
						}
					} else {
						return null;
					}
					break;
			}
		}
		switch (state) {
			case S_NONE:
				return null;
			case S_COUNT:
				return null;
			case S_FACES:
				if (temp) {
					if (drop) cur.drop = Number(temp);
					else cur.faces = Number(temp);
					if (cur.drop && (cur.drop >= cur.num)) return null;
				} else {
					return null;
				}
				break;
		}
		if (state !== S_INIT) {
			if (!cur.num || !cur.faces) return null;
			stack.push(cur);
		}

		return {dice: stack, mod: totalMods};
	}
};
if (!IS_ROLL20 && typeof window !== "undefined") {
	window.addEventListener("load", EntryRenderer.dice.init);
}

/**
 * Recursively find all the names of entries, useful for indexing
 * @param nameStack an array to append the names to
 * @param entry the base entry
 */
EntryRenderer.getNames = function (nameStack, entry) {
	if (entry.name) nameStack.push(entry.name);
	if (entry.entries) {
		for (const eX of entry.entries) {
			EntryRenderer.getNames(nameStack, eX);
		}
	} else if (entry.items) {
		for (const eX of entry.items) {
			EntryRenderer.getNames(nameStack, eX);
		}
	}
};

EntryRenderer._onImgLoad = function () {
	if (typeof onimgload === "function") onimgload()
};

EntryRenderer.HEAD_NEG_1 = "statsBlockSectionHead";
EntryRenderer.HEAD_0 = "statsBlockHead";
EntryRenderer.HEAD_1 = "statsBlockSubHead";
EntryRenderer.HEAD_2 = "statsInlineHead";
EntryRenderer.HEAD_2_SUB_VARIANT = "statsInlineHeadSubVariant";
EntryRenderer.DATA_NONE = "data-none";

if (typeof module !== "undefined") {
	module.exports.EntryRenderer = EntryRenderer;
	global.EntryRenderer = EntryRenderer;
}