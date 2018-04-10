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

	/**
	 * Set the tag used to group rendered elements
	 * @param tag to use
	 */
	this.setWrapperTag = function (tag) {
		this.wrapperTag = tag;
	};

	/**
	 * Set the base url for rendered links.
	 * Usage: `renderer.setBaseUrl("https://www.cool.site/")` (note the "http" prefix and "/" suffix)
	 * @param url to use
	 */
	this.setBaseUrl = function (url) {
		this.baseUrl = url;
	};

	/**
	 * Other sections should be prefixed with a vertical divider
	 * @param bool
	 */
	this.setFirstSection = function (bool) {
		this._firstSection = bool;
	};

	// TODO convert params to options object
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
	 * @param prefix The (optional) prefix to be added to the textStack before whatever is added by the current call
	 * @param suffix The (optional) suffix to be added to the textStack after whatever is added by the current call
	 * @param forcePrefixSuffix force the prefix and suffix to be added (useful for the first call from external code)
	 */
	this.recursiveEntryRender = function (entry, textStack, depth, prefix, suffix, forcePrefixSuffix) {
		depth = depth === undefined || depth === null ? 0 : depth;
		if (entry.type === "section") depth = -1;
		prefix = prefix === undefined || prefix === null ? null : prefix;
		suffix = suffix === undefined || suffix === null ? null : suffix;
		forcePrefixSuffix = forcePrefixSuffix === undefined || forcePrefixSuffix === null ? false : forcePrefixSuffix;

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
							this.recursiveEntryRender(entry.items[i], textStack, depth + 1, `<li ${style ? `class="${style}"` : ""}>`, "</li>");
						}
						textStack.push("</ul>");
					}
					break;
				case "table":
					renderTable(this);
					break;
				case "inset":
					textStack.push(`<${this.wrapperTag} class="statsBlockInset">`);
					if (typeof entry.name !== 'undefined') textStack.push(`<span class="entry-title">${entry.name}</span>`);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, 2, "<p>", "</p>");
					}
					textStack.push(`</${this.wrapperTag}>`);
					break;
				case "insetReadaloud":
					textStack.push(`<${this.wrapperTag} class="statsBlockInsetReadaloud">`);
					if (typeof entry.name !== 'undefined') textStack.push(`<span class="entry-title">${entry.name}</span>`);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, 2, "<p>", "</p>");
					}
					textStack.push(`</${this.wrapperTag}>`);
					break;
				case "variant":
					textStack.push(`<${this.wrapperTag} class="statsBlockInset">`);
					textStack.push(`<span class="entry-title">Variant: ${entry.name}</span>`);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, 2, "<p>", "</p>");
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
					this.recursiveEntryRender(fauxEntry, textStack, 2, "<p>", "</p>");
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
					textStack.push(this.renderLink(entry));
					break;

				case "actions":
					textStack.push(`<${this.wrapperTag} class="${EntryRenderer.HEAD_2}"><span class="entry-title">${entry.name}.</span> `);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, depth, "<p>", "</p>");
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
					this.recursiveEntryRender(entry.entry, textStack, depth, `<p><span class="bold">${entry.name}</span> `, "</p>");
					renderSuffix();
					break;
				case "itemSpell":
					renderPrefix();
					this.recursiveEntryRender(entry.entry, textStack, depth, `<p>${entry.name}</span> `, "</p>");
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

			textStack.push("<table>");

			if (entry.caption !== undefined) {
				textStack.push(`<caption>${entry.caption}</caption>`);
			}
			textStack.push("<thead>");
			textStack.push("<tr>");

			if (entry.colLabels) {
				for (let i = 0; i < entry.colLabels.length; ++i) {
					textStack.push(`<th ${getTableThClassText(i)}>`);
					self.recursiveEntryRender(entry.colLabels[i], textStack, depth);
					textStack.push(`</th>`);
				}
			}

			textStack.push("</tr>");
			textStack.push("</thead>");
			textStack.push("<tbody>");

			for (let i = 0; i < entry.rows.length; ++i) {
				textStack.push("<tr>");
				const r = entry.rows[i];
				const roRender = r.type === "row" ? r.row : r;
				for (let j = 0; j < roRender.length; ++j) {
					let toRenderCell;
					if (roRender[j].type === "cell") {
						if (roRender[j].entry) {
							toRenderCell = roRender[j].entry;
						} else if (roRender[j].roll) {
							if (roRender[j].roll.entry) {
								toRenderCell = roRender[j].roll.entry;
							} else if (roRender[j].roll.exact) {
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
					return `data-roll-min="${convertZeros(ent.roll.exact || ent.roll.min)}" data-roll-max="${convertZeros(ent.roll.exact || ent.roll.max)}"`
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
			const headerSpan = entry.name !== undefined ? `<span class="entry-title">${self.renderEntry({type: "inline", entries: [entry.name]})}${inlineTitle ? "." : ""}</span> ` : "";

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
						self.recursiveEntryRender(entry.entries[i], textStack, nextDepth, "<p>", "</p>");
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
			if (isNonstandardSource(source)) outList.push(CLSS_NON_STANDARD_SOURCE);
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

					if (tag === "@bold" || tag === "@b" || tag === "@italic" || tag === "@i" || tag === "@skill" || tag === "@action") {
						switch (tag) {
							// FIXME remove "@link"
							case "@link":
								textStack.push(`<u>`);
								self.recursiveEntryRender(text, textStack, depth);
								textStack.push(`</u>`);
								break;

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
								const spl = rollText.toLowerCase().replace(/\s/g, "").split(/[+-]/g).map(s => s.trim());
								// recombine modifiers
								const toRoll = [];
								for (let i = 0; i < spl.length; ++i) {
									const it = spl[i];
									if (it.includes("d")) {
										const m = /^(\d+)?d(\d+)$/.exec(it);
										toRoll.push({
											number: Number(m[1]) || 1,
											faces: Number(m[2]),
											modifier: 0,
											hideModifier: true
										});
									} else {
										toRoll[toRoll.length - 1].modifier += Number(it);
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
									fauxEntry.href.subhashes = [{"key": "sub", "value": others[0].trim() + scSource}];
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
								fauxEntry.href.path = "conditions.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_CONDITIONS,
									source: source || SRC_PHB
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
						}
					}
				} else {
					textStack.push(s);
				}
			}
		}
	};

	this.renderLink = function (entry) {
		function getHoverString () {
			if (!entry.href.hover) return "";
			return `onmouseover="EntryRenderer.hover.show(event, this, '${entry.href.hover.page}', '${entry.href.hover.source}', '${UrlUtil.encodeForHash(entry.href.hash).replace(/'/g, "\\'")}')"`
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

	if (entry.rollable === true) return `<span class='roller' onclick="EntryRenderer.dice.rollerClick(this, ${pack(entry)}${name ? `, '${name.escapeQuotes()}'` : ""})">${toDisplay}</span>`;
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
	bindTabButtons: (...tabButtons) => {
		EntryRenderer._tabs = {};
		EntryRenderer._curTab = null;

		const $content = $("#pagecontent");
		const $wrpTab = $(`#stat-tabs`);

		$wrpTab.find(`.stat-tab-gen`).remove();
		EntryRenderer.utils._tabs[tabButtons[0].label] = tabButtons[0];
		EntryRenderer.utils._curTab = tabButtons[0];

		const toAdd = tabButtons.map((tb, i) => {
			const $t = $(`<span class="stat-tab ${i === 0 ? `stat-tab-sel` : ""} btn btn-default stat-tab-gen">${tb.label}</span>`);
			tb.$t = $t;
			$t.click(() => {
				const curTab = EntryRenderer.utils._curTab;
				const tabs = EntryRenderer.utils._tabs;

				if (curTab.label !== tb.label) {
					EntryRenderer.utils._curTab.$t.removeClass(`stat-tab-sel`);
					EntryRenderer.utils._curTab = tb;
					$t.addClass(`stat-tab-sel`);
					tabs[curTab.label].content = $content.children().detach();

					tabs[tb.label] = tb;
					if (!tabs[tb.label].content && tb.funcPopulate) {
						tb.funcPopulate();
					} else {
						$content.append(tabs[tb.label].content);
					}
					if (tb.funcChange) tb.funcChange();
				}
			});
			return $t;
		});

		toAdd.reverse().forEach($t => $wrpTab.prepend($t));
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
		entries.find(e => e.type === "list").items.unshift(abilityObjToListItem());

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
				<table class="summary">
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
		const prereqs = [
			(!prerequisites.patron || prerequisites.patron === STR_ANY) ? null : `${prerequisites.patron} patron`,
			(!prerequisites.pact || prerequisites.pact === STR_ANY || prerequisites.pact === STR_SPECIAL) ? null : Parser.invoPactToFull(prerequisites.pact),
			(!prerequisites.level || prerequisites.level === STR_ANY) ? null : `${Parser.levelToFull(prerequisites.level)} level`,
			(!prerequisites.feature || prerequisites.feature === STR_NONE) ? null : `${prerequisites.feature} feature`,
			(!prerequisites.spell || prerequisites.spell === STR_NONE) ? null : Parser.invoSpellToFull(prerequisites.spell)
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
				<table class="summary">
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
			${EntryRenderer.utils.getNameTr(deity, true, "", `, ${deity.title.toTitleCase()}`)}
			<tr><td colspan="6">
				<div class="summary-flexer">
					<p><b>Pantheon:</b> ${deity.pantheon}</p>
					${deity.category ? `<p><b>Category:</b> ${deity.category}</p>` : ""}
					<p><b>Alignment:</b> ${deity.alignment.map(a => Parser.alignmentAbvToFull(a)).join(" ")}</p>
					<p><b>Domains:</b> ${deity.domains.join(", ")}</p>
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
				<table class="summary">
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
	getCompactRenderedString: (it) => {
		const renderer = EntryRenderer.getDefaultRenderer();
		return `
			${EntryRenderer.utils.getNameTr(it, true)}
			<tr class="text"><td colspan="6"><i>${Parser.trapTypeToFull(it.trapType || "HAZ")}</i></td>
			<tr class="text"><td colspan="6">${renderer.renderEntry({entries: it.entries}, 2)}</td></tr>
		`;
	}
};

EntryRenderer.monster = {
	getLegendaryActionIntro: (mon) => {
		const legendaryActions = mon.legendaryActions || 3;
		const legendaryName = mon.name.split(",");
		return `${legendaryName[0]} can take ${legendaryActions} legendary action${legendaryActions > 1 ? "s" : ""}, choosing from the options below. Only one legendary action can be used at a time and only at the end of another creature's turn. ${legendaryName[0]} regains spent legendary actions at the start of its turn.`
	},

	getCompactRenderedString: (mon) => {
		const renderer = EntryRenderer.getDefaultRenderer();

		function makeAbilityRoller (ability) {
			const mod = Parser.getAbilityModifier(mon[ability]);
			return renderer.renderEntry(`{@dice 1d20${mod}|${mon[ability]} (${mod})|${Parser.attAbvToFull(ability)}`);
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
						<td>${mon.ac}</td>					
						<td>${mon.hp}</td>					
						<td>${Parser.getSpeedString(mon)}</td>					
						<td>${Parser.monCrToFull(mon.cr)}</td>					
					</tr>
				</table>			
			</td></tr>
			<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr><td colspan="6">
				<table class="summary">
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
					${mon.save ? `<p><b>Saving Throws:</b> ${mon.save}</p>` : ""}
					${mon.skill ? `<p><b>Skills:</b> ${Object.keys(mon.skill).sort().map(s => `${s.uppercaseFirst()} ${mon.skill[s]}`)}</p>` : ""}
					<p><b>Senses:</b> ${mon.senses ? `${mon.senses}, ` : ""}passive Perception ${mon.passive}</p>
					<p><b>Languages:</b> ${mon.languages ? mon.languages : `\u2014`}</p>
					${mon.vulnerable ? `<p><b>Damage Vuln.:</b> ${Parser.monImmResToFull(mon.vulnerable)}</p>` : ""}
					${mon.resist ? `<p><b>Damage Res.:</b> ${Parser.monImmResToFull(mon.resist)}</p>` : ""}
					${mon.immune ? `<p><b>Damage Imm.:</b> ${Parser.monImmResToFull(mon.immune)}</p>` : ""}
					${mon.conditionImmune ? `<p><b>Condition Imm.:</b> ${Parser.monCondImmToFull(mon.conditionImmune)}</p>` : ""}
				</div>
			</td></tr>
			${mon.trait ? `<tr><td colspan="6"><div class="border"></div></td></tr>
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
	/**
	 * Runs callback with itemList as argument
	 * @param callback
	 * @param urls optional overrides for default URLs
	 */
	buildList: function (callback, urls) {
		if (EntryRenderer.item._builtList) return callback(EntryRenderer.item._builtList);

		if (!urls) urls = {};
		let itemList;
		let basicItemList;
		let variantList;
		const propertyList = {};
		const typeList = {};

		// allows URLs to be overriden (used by roll20 script)
		const itemUrl = urls.items || "data/items.json";
		const basicItemUrl = urls.basicitems || "data/basicitems.json";
		const magicVariantUrl = urls.magicvariants || "data/magicvariants.json";

		DataUtil.loadJSON(itemUrl, addBasicItems);

		function addBasicItems (itemData) {
			itemList = itemData.item;
			DataUtil.loadJSON(basicItemUrl, addVariants);
		}

		function addVariants (basicItemData) {
			basicItemList = basicItemData.basicitem;
			const itemPropertyList = basicItemData.itemProperty;
			const itemTypeList = basicItemData.itemType;
			// Convert the property and type list JSONs into look-ups, i.e. use the abbreviation as a JSON property name
			for (let i = 0; i < itemPropertyList.length; i++) {
				propertyList[itemPropertyList[i].abbreviation] = itemPropertyList[i].name ? JSON.parse(JSON.stringify(itemPropertyList[i])) : {
					"name": itemPropertyList[i].entries[0].name.toLowerCase(),
					"entries": itemPropertyList[i].entries
				};
			}
			for (let i = 0; i < itemTypeList.length; i++) {
				typeList[itemTypeList[i].abbreviation] = itemTypeList[i].name ? JSON.parse(JSON.stringify(itemTypeList[i])) : {
					"name": itemTypeList[i].entries[0].name.toLowerCase(),
					"entries": itemTypeList[i].entries
				};
			}
			DataUtil.loadJSON(magicVariantUrl, mergeBasicItems);
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
			const priceRe = /^(\d+)(\w+)$/;
			for (let i = 0; i < itemList.length; i++) {
				const item = itemList[i];
				if (item.noDisplay) continue;
				if (itemList[i].type === "GV") itemList[i].category = "Generic Variant";
				if (itemList[i].category === undefined) itemList[i].category = "Other";
				if (item.entries === undefined) itemList[i].entries = [];
				if (item.type && typeList[item.type]) for (let j = 0; j < typeList[item.type].entries.length; j++) itemList[i].entries = pushObject(itemList[i].entries, typeList[item.type].entries[j]);
				if (item.property) {
					for (let j = 0; j < item.property.length; j++) if (propertyList[item.property[j]].entries) for (let k = 0; k < propertyList[item.property[j]].entries.length; k++) itemList[i].entries = pushObject(itemList[i].entries, propertyList[item.property[j]].entries[k]);
				}
				// The following could be encoded in JSON, but they depend on more than one JSON property; maybe fix if really bored later
				if (item.armor) {
					if (item.resist) itemList[i].entries = pushObject(itemList[i].entries, "You have resistance to " + item.resist + " damage while you wear this armor.");
					if (item.armor && item.stealth) itemList[i].entries = pushObject(itemList[i].entries, "The wearer has disadvantage on Stealth (Dexterity) checks.");
					if (item.type === "HA" && item.strength) itemList[i].entries = pushObject(itemList[i].entries, "If the wearer has a Strength score lower than " + item.strength + ", their speed is reduced by 10 feet.");
				} else if (item.resist) {
					if (item.type === "P") itemList[i].entries = pushObject(itemList[i].entries, "When you drink this potion, you gain resistance to " + item.resist + " damage for 1 hour.");
					if (item.type === "RG") itemList[i].entries = pushObject(itemList[i].entries, "You have resistance to " + item.resist + " damage while wearing this ring.");
				}
				if (item.type === "SCF") {
					if (item.scfType === "arcane") itemList[i].entries = pushObject(itemList[i].entries, "An arcane focus is a special item designed to channel the power of arcane spells. A sorcerer, warlock, or wizard can use such an item as a spellcasting focus, using it in place of any material component which does not list a cost.");
					if (item.scfType === "druid") itemList[i].entries = pushObject(itemList[i].entries, "A druid can use such a druidic focus as a spellcasting focus, using it in place of any material component that does not have a cost.");
					if (item.scfType === "holy") {
						itemList[i].entries = pushObject(itemList[i].entries, "A holy symbol is a representation of a god or pantheon.");
						itemList[i].entries = pushObject(itemList[i].entries, "A cleric or paladin can use a holy symbol as a spellcasting focus, using it in place of any material components which do not list a cost. To use the symbol in this way, the caster must hold it in hand, wear it visibly, or bear it on a shield.");
					}
				}

				// bind pointer to propertyList
				if (item.property) {
					item._allPropertiesPtr = propertyList;
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
					const m = priceRe.exec(item.value);
					if (m) {
						item.value = `${Number(m[1]).toLocaleString()}${m[2]}`;
					}
				}
			}
			EntryRenderer.item._builtList = itemList;
			callback(itemList);
		}

		function pushObject (targetObject, objectToBePushed) {
			const copiedObject = JSON.parse(JSON.stringify(targetObject));
			copiedObject.push(objectToBePushed);
			return copiedObject;
		}
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

EntryRenderer.hover = {
	linkCache: {},
	_isInit: false,
	_active: {},

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

	_makeWindow: () => {
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
		$(document)
			.on(mouseUpId, () => {
				if (drag.on) {
					drag.on = false;
					adjustPosition();
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
				// alternate teardown for 'x' button
				$ele.attr("data-hover-active", false);
				$hov.remove();
				$(document).off(mouseUpId);
				$(document).off(mouseMoveId);
				$(window).off(resizeId);
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
		else $hov.css("left", clientX || (vpOffsetL + $(ele).width() + 1));

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

		function reset () {
			EntryRenderer.hover._showInProgress = false;
			EntryRenderer.hover._curHovering = null;
		}
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

		let renderFunction;
		switch (page) {
			case UrlUtil.PG_SPELLS:
				renderFunction = EntryRenderer.spell.getCompactRenderedString;
				break;
			case UrlUtil.PG_ITEMS:
				renderFunction = EntryRenderer.item.getCompactRenderedString;
				break;
			case UrlUtil.PG_BESTIARY:
				renderFunction = EntryRenderer.monster.getCompactRenderedString;
				break;
			case UrlUtil.PG_CONDITIONS:
				renderFunction = EntryRenderer.condition.getCompactRenderedString;
				break;
			case UrlUtil.PG_BACKGROUNDS:
				renderFunction = EntryRenderer.background.getCompactRenderedString;
				break;
			case UrlUtil.PG_FEATS:
				renderFunction = EntryRenderer.feat.getCompactRenderedString;
				break;
			case UrlUtil.PG_INVOCATIONS:
				renderFunction = EntryRenderer.invocation.getCompactRenderedString;
				break;
			case UrlUtil.PG_PSIONICS:
				renderFunction = EntryRenderer.psionic.getCompactRenderedString;
				break;
			case UrlUtil.PG_REWARDS:
				renderFunction = EntryRenderer.reward.getCompactRenderedString;
				break;
			case UrlUtil.PG_RACES:
				renderFunction = EntryRenderer.race.getCompactRenderedString;
				break;
			case UrlUtil.PG_DEITIES:
				renderFunction = EntryRenderer.deity.getCompactRenderedString;
				break;
			case UrlUtil.PG_OBJECTS:
				renderFunction = EntryRenderer.object.getCompactRenderedString;
				break;
			case UrlUtil.PG_TRAPS_HAZARDS:
				renderFunction = EntryRenderer.traphazard.getCompactRenderedString;
				break;
			default:
				throw new Error(`No hover render function specified for page ${page}`)
		}
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

		function loadMultiSource (page, baseUrl, listProp) {
			if (!EntryRenderer.hover._isCached(page, source, hash)) {
				DataUtil.loadJSON(`${baseUrl}index.json`, (data) => {
					const procData = {};
					Object.keys(data).forEach(k => procData[k.toLowerCase()] = data[k]);
					DataUtil.loadJSON(`${baseUrl}${procData[source.toLowerCase()]}`, (data) => {
						data[listProp].forEach(it => {
							const itHash = UrlUtil.URL_TO_HASH_BUILDER[page](it);
							EntryRenderer.hover._addToCache(page, it.source, itHash, it)
						});
						EntryRenderer.hover._makeWindow();
					});
				});
			} else {
				EntryRenderer.hover._makeWindow();
			}
		}

		function loadSimple (page, jsonFile, listProp) {
			function populate (data, listProp) {
				data[listProp].forEach(it => {
					const itHash = UrlUtil.URL_TO_HASH_BUILDER[page](it);
					EntryRenderer.hover._addToCache(page, it.source, itHash, it)
				});
			}

			if (!EntryRenderer.hover._isCached(page, source, hash)) {
				DataUtil.loadJSON(`data/${jsonFile}`, (data) => {
					if (listProp instanceof Array) listProp.forEach(p => populate(data, p));
					else populate(data, listProp);
					EntryRenderer.hover._makeWindow();
				});
			} else {
				EntryRenderer.hover._makeWindow();
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
					EntryRenderer.item.buildList((allItems) => {
						allItems.forEach(item => {
							const itemHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](item);
							EntryRenderer.hover._addToCache(page, item.source, itemHash, item)
						});
						EntryRenderer.hover._makeWindow();
					});
				} else {
					EntryRenderer.hover._makeWindow();
				}
				break;
			}

			case UrlUtil.PG_CONDITIONS: {
				loadSimple(page, "conditions.json", "condition");
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
					DataUtil.loadJSON(`data/races.json`, (data) => {
						const merged = EntryRenderer.race.mergeSubraces(data.race);
						merged.forEach(race => {
							const raceHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](race);
							EntryRenderer.hover._addToCache(page, race.source, raceHash, race)
						});
						EntryRenderer.hover._makeWindow();
					});
				} else {
					EntryRenderer.hover._makeWindow();
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
		}
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
		EntryRenderer.hover.show({shiftKey: true, clientX: clientX}, $btnPop.get(), UrlUtil.getCurrentPage(), it.source, UrlUtil.autoEncodeHash(it), true);
	}
};

EntryRenderer.dice = {
	_$wrpRoll: null,
	_$minRoll: null,
	_$iptRoll: null,
	_$outRoll: null,
	_$head: null,
	_hist: [],
	_histIndex: null,
	_$lastRolledBy: null,

	isCrypto: () => {
		return typeof window !== "undefined" && typeof window.crypto !== "undefined";
	},

	randomise: (max) => {
		if (EntryRenderer.dice.isCrypto()) {
			return EntryRenderer.dice._randomise(1, max + 1);
		} else {
			return RollerUtil.roll(max) + 1;
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
			EntryRenderer.dice._$iptRoll.prop("placeholder", EntryRenderer.dice._randomPlaceholder())
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
				EntryRenderer.dice._hideBox();
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
			// otherwise, use the section title, where applicable
			titleMaybe = $(ele).closest(`div`).find(`.entry-title`).first().text();
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
			return document.title.replace("- 5etools", "").trim();
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
		if (!str.trim()) return;
		const toRoll = EntryRenderer.dice._parse(str);
		if (rolledBy.user) {
			EntryRenderer.dice._addHistory(str);
		}
		EntryRenderer.dice._handleRoll(toRoll, rolledBy);
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
			$out.append(`<div class="out-roll-item">Invalid roll!</div>`);
		}
		EntryRenderer.dice._scrollBottom();
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
}