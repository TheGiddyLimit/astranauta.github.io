class RenderBestiary {
	static _getRenderedSection (sectionTrClass, sectionEntries, sectionLevel) {
		const renderer = EntryRenderer.getDefaultRenderer();
		const renderStack = [];
		if (sectionTrClass === "legendary") {
			const cpy = MiscUtil.copy(sectionEntries).map(it => {
				if (it.name && it.entries) {
					it.name = `${it.name}.`;
					it.type = it.type || "item";
				}
				return it;
			});
			const toRender = {type: "list", style: "list-hang-notitle", items: cpy};
			renderer.recursiveEntryRender(toRender, renderStack, sectionLevel);
		} else {
			sectionEntries.forEach(e => {
				if (e.rendered) renderStack.push(e.rendered);
				else renderer.recursiveEntryRender(e, renderStack, sectionLevel + 1);
			});
		}
		return `<tr class='${sectionTrClass}'><td colspan='6' class="mon__sect-row-inner">${renderStack.join("")}</td></tr>`;
	}

	static _getPronunciationButton (mon) {
		const basename = mon.soundClip.substr(mon.soundClip.lastIndexOf("/") + 1);

		return `<button class="btn btn-xs btn-default btn-name-pronounce">
			<span class="glyphicon glyphicon-volume-up name-pronounce-icon"></span>
			<audio class="name-pronounce">
			   <source src="${mon.soundClip}" type="audio/mpeg">
			   <source src="audio/bestiary/${basename}" type="audio/mpeg">
			</audio>
		</button>`;
	}

	static updateParsed (mon) {
		delete mon._pTypes;
		delete mon._pCr;
		RenderBestiary.initParsed(mon);
	}

	static initParsed (mon) {
		mon._pTypes = mon._pTypes || Parser.monTypeToFullObj(mon.type); // store the parsed type
		mon._pCr = mon._pCr || (mon.cr === undefined ? "Unknown" : (mon.cr.cr || mon.cr));
	}

	/**
	 * @param {Object} mon Creature data.
	 * @param {Object} meta Legendary metadata.
	 * @param {Object} options
	 * @param {jQuery} options.$btnScaleCr CR scaler button.
	 * @param {jQuery} options.$btnResetScaleCr CR scaler reset button.
	 */
	static $getRenderedCreature (mon, meta, options) {
		options = options || {};
		const renderer = EntryRenderer.getDefaultRenderer();
		RenderBestiary.initParsed(mon);

		const trait = EntryRenderer.monster.getOrderedTraits(mon, renderer);
		const legGroup = mon.legendaryGroup ? (meta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name] : null;

		const renderedVariants = (() => {
			const dragonVariant = EntryRenderer.monster.getDragonCasterVariant(renderer, mon);
			const variants = mon.variant;
			if (!variants && !dragonVariant) return null;
			else {
				const rStack = [];
				(variants || []).forEach(v => renderer.recursiveEntryRender(v, rStack));
				if (dragonVariant) rStack.push(dragonVariant);
				return `<td colspan=6>${rStack.join("")}</td>`;
			}
		})();

		const renderedSources = (() => {
			const srcCpy = {
				source: mon.source,
				sourceSub: mon.sourceSub,
				page: mon.page,
				otherSources: mon.otherSources,
				additionalSources: mon.additionalSources,
				externalSources: mon.externalSources
			};
			const additional = mon.additionalSources ? JSON.parse(JSON.stringify(mon.additionalSources)) : [];
			if (mon.variant && mon.variant.length > 1) {
				mon.variant.forEach(v => {
					if (v.variantSource) {
						additional.push({
							source: v.variantSource.source,
							page: v.variantSource.page
						})
					}
				})
			}
			srcCpy.additionalSources = additional;

			const pageTrInner = EntryRenderer.utils._getPageTrText(srcCpy);
			if (mon.environment && mon.environment.length) {
				return [pageTrInner, `<i>Environment: ${mon.environment.sort(SortUtil.ascSortLower).map(it => it.toTitleCase()).join(", ")}</i>`];
			} else {
				return [pageTrInner];
			}
		})();

		return $$`
		${EntryRenderer.utils.getBorderTr()}
		<tr><th class="name mon__name--token" colspan="6">
			<span class="stats-name copyable" onclick="EntryRenderer.utils._pHandleNameClick(this, '${mon.source.escapeQuotes()}')">${mon._displayName || mon.name}</span>
			${mon.soundClip ? RenderBestiary._getPronunciationButton(mon) : ""}
			<span class="stats-source ${Parser.sourceJsonToColor(mon.source)}" title="${Parser.sourceJsonToFull(mon.source)}${EntryRenderer.utils.getSourceSubText(mon)}">${Parser.sourceJsonToAbv(mon.source)}</span>
		</th></tr>
		<tr><td colspan="6" class="mon__size-type-alignment">
			<i>${Parser.sizeAbvToFull(mon.size)} ${mon._pTypes.asText}, ${Parser.alignmentListToFull(mon.alignment).toLowerCase()}</i>
		</td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		
		<tr><td colspan="6"><strong>Armor Class</strong> ${Parser.acToFull(mon.ac)}</td></tr>
		<tr><td colspan="6"><div class="mon__wrp_hp"><strong>Hit Points</strong> ${EntryRenderer.monster.getRenderedHp(mon.hp)}</div></td></tr>
		<tr><td colspan="6"><strong>Speed</strong> ${Parser.getSpeedString(mon)}</td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		
		<tr class="mon__ability-names">
			<th>STR</th><th>DEX</th><th>CON</th><th>INT</th><th>WIS</th><th>CHA</th>
		</tr>
		<tr class="mon__ability-scores">
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.str)}|${mon.str} (${Parser.getAbilityModifier(mon.str)})|Strength}`)}</td>
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.dex)}|${mon.dex} (${Parser.getAbilityModifier(mon.dex)})|Dexterity}`)}</td>
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.con)}|${mon.con} (${Parser.getAbilityModifier(mon.con)})|Constitution}`)}</td>
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.int)}|${mon.int} (${Parser.getAbilityModifier(mon.int)})|Intelligence}`)}</td>
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.wis)}|${mon.wis} (${Parser.getAbilityModifier(mon.wis)})|Wisdom}`)}</td>
			<td>${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.cha)}|${mon.cha} (${Parser.getAbilityModifier(mon.cha)})|Charisma}`)}</td>
		</tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		
		${mon.save ? `<tr><td colspan="6"><strong>Saving Throws</strong> ${Object.keys(mon.save).map(it => EntryRenderer.monster.getSave(renderer, it, mon.save[it])).join(", ")}</td></tr>` : ""}
		${mon.skill ? `<tr><td colspan="6"><strong>Skills</strong> ${EntryRenderer.monster.getSkillsString(renderer, mon)}</td></tr>` : ""}
		${mon.vulnerable ? `<tr><td colspan="6"><strong>Damage Vulnerabilities</strong> ${Parser.monImmResToFull(mon.vulnerable)}</td></tr>` : ""}
		${mon.resist ? `<tr><td colspan="6"><strong>Damage Resistances</strong> ${Parser.monImmResToFull(mon.resist)}</td></tr>` : ""}
		${mon.immune ? `<tr><td colspan="6"><strong>Damage Immunities</strong> ${Parser.monImmResToFull(mon.immune)}</td></tr>` : ""}
		${mon.conditionImmune ? `<tr><td colspan="6"><strong>Condition Immunities</strong> ${Parser.monCondImmToFull(mon.conditionImmune)}</td></tr>` : ""}
		<tr><td colspan="6"><strong>Senses</strong> ${mon.senses ? `${EntryRenderer.monster.getRenderedSenses(mon.senses)},` : ""} passive Perception ${mon.passive || "\u2014"}</td></tr>
		<tr><td colspan="6"><strong>Languages</strong> ${mon.languages || "\u2014"}</td></tr>
		
		<tr><td colspan="6" style="position: relative;"><strong>Challenge</strong>
			<span>${Parser.monCrToFull(mon.cr)}</span>
			${options.$btnScaleCr || ""}
			${options.$btnResetScaleCr || ""}
		</td></tr>
		
		${trait ? `<tr><td class="divider" colspan="6"><div></div></td></tr>${RenderBestiary._getRenderedSection("trait", trait, 1)}` : ""}
		${mon.action ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Actions</span></td></tr>
		${RenderBestiary._getRenderedSection("action", mon.action, 1)}` : ""}
		${mon.reaction ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Reactions</span></td></tr>
		${RenderBestiary._getRenderedSection("reaction", mon.reaction, 1)}` : ""}
		${mon.legendary ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Legendary Actions</span></td></tr>
		<tr class='legendary'><td colspan='6'><span class='name'></span> <span>${EntryRenderer.monster.getLegendaryActionIntro(mon)}</span></td></tr>
		${RenderBestiary._getRenderedSection("legendary", mon.legendary, 1)}` : ""}
		
		${legGroup && legGroup.lairActions ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Lair Actions</span></td></tr>
		${RenderBestiary._getRenderedSection("lairaction", legGroup.lairActions, -1)}` : ""}
		${legGroup && legGroup.regionalEffects ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Regional Effects</span></td></tr>
		${RenderBestiary._getRenderedSection("regionaleffect", legGroup.regionalEffects, -1)}` : ""}
		
		${renderedVariants ? `<tr>${renderedVariants}</tr>` : ""}
		${renderedSources.length === 2
		? `<tr><td colspan="4">${renderedSources[0]}</td><td colspan="2" class="text-align-right mr-2">${renderedSources[1]}</td></tr>`
		: `<tr><td colspan="6">${renderedSources[0]}</td></tr>`}
		${EntryRenderer.utils.getBorderTr()}`;
	}
}
