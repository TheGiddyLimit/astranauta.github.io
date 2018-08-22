"use strict";
const HASH_FEATURE = "f:";
const HASH_HIDE_FEATURES = "hideclassfs:";
const HASH_SHOW_FLUFF = "showfluff:";
const HASH_SOURCES = "sources:";
const HASH_BOOK_VIEW = "bookview:";

const CLSS_FEATURE_LINK = "feature-link";
const CLSS_ACTIVE = "active";
const CLSS_SUBCLASS_PILL = "sc-pill";
const CLSS_PANEL_LINK = "pnl-link";
const CLSS_CLASS_FEATURES_ACTIVE = "cf-active";
const CLSS_FLUFF_ACTIVE = "fluff-active";
const CLSS_SUBCLASS_PREFIX = "subclass-prefix";
const CLSS_CLASS_FEATURE = "class-feature";
const CLSS_CLASS_FLUFF = "class-fluff";
const CLSS_GAIN_SUBCLASS_FEATURE = "gain-subclass-feature";
const CLSS_FRESH_UA = "fresh-ua";

const ID_CLASS_FEATURES_TOGGLE = "cf-toggle";
const ID_FLUFF_TOGGLE = "fluff-toggle";
const ID_OTHER_SOURCES_TOGGLE = "os-toggle";

const STR_PROF_NONE = "none";
const STR_SOURCES_OFFICIAL = "0";
const STR_SOURCES_MIXED = "1";
const STR_SOURCES_ALL = "2";
const STRS_SOURCE_STATES = ["Official Sources", "Most Recent", "All Sources"];

const ATB_DATA_FEATURE_LINK = "data-flink";
const ATB_DATA_FEATURE_ID = "data-flink-id";
const ATB_DATA_SC_LIST = "data-subclass-list";

let subclassComparisonView;

// Exported to history.js, gets called on hash change
function loadhash (id) {
	HashLoad.loadhash(id);
}

// Exported to history.js
function loadsub (sub) {
	SubClassLoader.loadsub(sub);
}

// Exported to utils.js
function addClassData (data) {
	ClassData.addClassData(data);
}

// Exported to utils.js
function addSubclassData (data) {
	ClassData.addSubclassData(data)
}

class ClassDisplay {

}
ClassDisplay.curClass = null;

class FeatureTable {
	/**
	 * Get the value used to identify this subclass in the feature table
	 *
	 * @param scName
	 * @param scSource
	 * @returns {string}
	 */
	static getTableDataScData (scName, scSource) {
		return scName + ATB_DATA_PART_SEP + scSource;
	}
}

class ClassList {
	static handleFilterChange () {
		const f = filterBox.getValues();
		ClassList.classList.filter(function (item) {
			const c = ClassData.classes[$(item.elm).attr(FLTR_ID)];
			return filterBox.toDisplay(
				f,
				c._fSource
			);
		});
	}

	static addClasses (newClasses) {
		const lastSearch = ListUtil.getSearchTermAndReset(ClassList.classList);

		ClassList._appendClassesToList(newClasses);

		ClassList.classList.reIndex();
		if (lastSearch) ClassList.classList.search(lastSearch);
		ClassList.classList.sort("name");

		filterBox.render();
		ClassList.handleFilterChange();
	}

	static _appendClassesToList (newClasses) {
		const previousClassAmount = ClassData.classes.length - newClasses.length;
		const $classTable = $("ul.classes");
		let tempString = "";
		for (let i = 0; i < newClasses.length; i++) {
			const curClass = newClasses[i];
			if (ExcludeUtil.isExcluded(curClass.name, "class", curClass.source)) continue;

			curClass._fSource = BrewUtil.hasSourceJson(curClass.source) ? "Homebrew" : SourceUtil.isNonstandardSource(curClass.source) ? "Others" : "Core";
			sourceFilter.addIfAbsent(curClass._fSource);
			const id = i + previousClassAmount;
			tempString += ClassList._renderClass(curClass, id);
		}
		sourceFilter.items.sort(SortUtil.ascSort);
		$classTable.append(tempString);
	}

	static _renderClass (classToRender, id) {
		return `<li class="row" ${FLTR_ID}="${id}" ${classToRender.uniqueId ? `data-unique-id="${classToRender.uniqueId}"` : ""}>
				<a id='${id}' href="${HashLoad.getClassHash(classToRender)}" title="${classToRender.name}">
					<span class='name col-xs-8'>${classToRender.name}</span>
					<span class='source col-xs-4 text-align-center source${Parser.sourceJsonToAbv(classToRender.source)}' title="${Parser.sourceJsonToFull(classToRender.source)}">
						${Parser.sourceJsonToAbv(classToRender.source)}
					</span>
					<span class="uniqueid hidden">${classToRender.uniqueId ? classToRender.uniqueId : id}</span>
				</a>
			</li>`;
	}
}
ClassList.classList = undefined;

class ClassData {
	static addClassData (data) {
		const newClasses = data.class;
		if (!newClasses || !newClasses.length) return;

		ClassData.sortSubclasses(newClasses);

		newClasses.filter(c => SourceUtil.isNonstandardSource(c.source) || BrewUtil.hasSourceJson(c.source))
			.forEach(ClassData.markSameSourceSubclassesAsForceStandard);

		ClassData.classes = ClassData.classes.concat(newClasses);

		ClassList.addClasses(newClasses);

		History.hashChange();
	}

	static addSubclassData (data) {
		if (!data.subclass || !data.subclass.length) return;

		const scData = data.subclass;
		scData.forEach(subClass => {
			// get the class
			const c = ClassData.classes.find(c => c.name.toLowerCase() === subClass.class.toLowerCase() && (c.source.source || c.source).toLowerCase() === (subClass.classSource || SRC_PHB).toLowerCase());
			if (!c) {
				alert(`Could not add subclass; could not find class with name: ${subClass.class}`);
				return;
			}

			c.subclasses = c.subclasses.concat(subClass);

			ClassData.sortSubclasses([c]);
		});
		History.hashChange();
	}

	/**
	 * Sorts subclasses of the classes given
	 *
	 * @param classes an Array of classes
	 */
	static sortSubclasses (classes) {
		for (const c of classes) {
			c.subclasses = c.subclasses.sort((a, b) => SortUtil.ascSort(a.name, b.name));
		}
	}

	static markSameSourceSubclassesAsForceStandard (clazz) {
		clazz.subclasses.filter(subClass => subClass.source === clazz.source).forEach(subClass => subClass.source = {"source": subClass.source, "forceStandard": true});
	}

	static cleanScSource (source) {
		return Parser._getSourceStringFromSource(source);
	}

	static getSubclassFromPill ($pill) {
		return ClassDisplay.curClass.subclasses.find(sc => sc.name === $pill.data("subclass") && (sc.source.source || sc.source) === $pill.data("source"));
	}
}
ClassData.classes = [];

class FeatureDescription {
	static getSubclassStyles (sc) {
		const styleClasses = [CLSS_SUBCLASS_FEATURE];
		const nonStandard = SourceUtil.isNonstandardSource(sc.source) || SourceUtil.hasBeenReprinted(sc.shortName, sc.source);
		if (nonStandard) styleClasses.push(CLSS_NON_STANDARD_SOURCE);
		if (FeatureDescription.subclassIsFreshUa(sc)) styleClasses.push(CLSS_FRESH_UA);
		if (BrewUtil.hasSourceJson(ClassData.cleanScSource(sc.source))) styleClasses.push(CLSS_HOMEBREW_SOURCE);
		return styleClasses;
	}

	static subclassIsFreshUa (sc) {
		// only tag reprinted UA
		if (SourceUtil.isNonstandardSource(sc.source) || SourceUtil.hasBeenReprinted(sc.shortName, sc.source)) {
			// special cases
			if (sc.name === "Knowledge Domain (PSA)" && sc.source === SRC_PSA) return false;
			if (sc.name === "Deep Stalker (UA)" && sc.source === SRC_UALDR) return false;
			if (sc.name.includes("Favored Soul")) return false;
			if (sc.name === "Shadow (UA)" && sc.source === SRC_UALDR) return false;
			if (sc.name === "The Undying Light (UA)" && sc.source === SRC_UALDR) return false;

			const nonUa = ClassDisplay.curClass.subclasses.find(pub => !SourceUtil.isNonstandardSource(pub.source) && sc.name.replace(/(v\d+)?\s*\((UA|SCAG|PSA|Livestream)\)/, "").trim() === pub.name);
			if (nonUa) return false;
		}
		return true;
	}
}

class HashLoad {
	static loadhash (id) {
		renderer.setFirstSection(true);

		$("#pagecontent").html(tableDefault);
		$("#statsprof").html(statsProfDefault);
		$("#classtable").html(classTableDefault);

		$(`#msg-no-class-selected`).remove();
		$(`#classtable`).show();
		$(`#button-wrapper`).show();
		$(`#statsprof`).show();
		$(`#sticky-nav`).show();

		ClassDisplay.curClass = ClassData.classes[id];

		// name
		$("th#nameTable").html(ClassDisplay.curClass.name);
		$("th#nameSummary").html(ClassDisplay.curClass.name);
		if (ClassDisplay.curClass.authors) {
			$("th#author").html(`By ${ClassDisplay.curClass.authors.join(", ")}`).show();
		} else {
			$("th#author").html("").hide();
		}

		// SUMMARY SIDEBAR =================================================================================================
		// hit dice and HP
		const hdEntry = {toRoll: [ClassDisplay.curClass.hd], rollable: true};
		$("td#hp div#hitdice span").html(EntryRenderer.getEntryDice(hdEntry, "Hit die"));
		$("td#hp div#hp1stlevel span").html(ClassDisplay.curClass.hd.faces + " + your Constitution modifier");
		$("td#hp div#hphigherlevels span").html(`${EntryRenderer.getEntryDice(hdEntry, "Hit die")} (or ${
			(ClassDisplay.curClass.hd.faces / 2 + 1)}) + your Constitution modifier per ${ClassDisplay.curClass.name} level after 1st`);

		// save proficiency
		$("td#prof div#saves span").html(ClassDisplay.curClass.proficiency.map(p => Parser.attAbvToFull(p)).join(", "));

		// starting proficiencies
		const sProfs = ClassDisplay.curClass.startingProficiencies;
		const profSel = $("td#prof");
		profSel.find("div#armor span")
			.html(sProfs.armor === undefined ? STR_PROF_NONE : sProfs.armor.map(a => a === "light" || a === "medium" || a === "heavy" ? a + " armor" : a).join(", "));
		profSel.find("div#weapons span")
			.html(sProfs.weapons === undefined ? STR_PROF_NONE : sProfs.weapons.map(w => w === "simple" || w === "martial" ? w + " weapons" : w).join(", "));
		profSel.find("div#tools span").html(sProfs.tools === undefined ? STR_PROF_NONE : sProfs.tools.join(", "));
		profSel.find("div#skills span").html(sProfs.skills === undefined ? STR_PROF_NONE : getSkillProfString(sProfs.skills));

		function getSkillProfString (skills) {
			const numString = Parser.numberToString(skills.choose);
			return skills.from.length === 18 ? `Choose any ${numString}.` : `Choose ${numString} from ${skills.from.joinConjunct(", ", " and ")}.`
		}

		// starting equipment
		const sEquip = ClassDisplay.curClass.startingEquipment;
		const fromBackground = sEquip.additionalFromBackground ? "<p>You start with the following items, plus anything provided by your background.</p>" : "";
		const defList = sEquip.default.length === 0 ? "" : `<ul><li>${sEquip.default.map(it => EntryRenderer.getDefaultRenderer().renderEntry(it)).join("</li><li>")}</ul>`;
		const goldAlt = sEquip.goldAlternative === undefined ? "" : `<p>Alternatively, you may start with ${sEquip.goldAlternative} gp to buy your own equipment.</p>`;
		$("#equipment").find("div").html(`${fromBackground}${defList}${goldAlt}`);

		// FEATURE TABLE ===================================================================================================
		renderer.resetHeaderIndex();
		const tData = ClassDisplay.curClass.classTableGroups;
		const groupHeaders = $("#groupHeaders");
		const colHeaders = $("#colHeaders");
		const levelTrs = [];
		for (let i = 0; i < tData.length; i++) {
			const tGroup = tData[i];

			const hasTitle = tGroup.title !== undefined;
			let subclassData = "";
			if (tGroup.subclasses !== undefined) {
				subclassData =
					`${ATB_DATA_SC_LIST}="${tGroup.subclasses.map(s => FeatureTable.getTableDataScData(s.name, ClassData.cleanScSource(s.source))).join(ATB_DATA_LIST_SEP)}"`;
			}
			groupHeaders.append(`<th ${hasTitle ? `class="colGroupTitle"` : ""} colspan="${tGroup.colLabels.length}" ${subclassData}>${hasTitle ? tGroup.title : ""}</th>`);

			for (let j = 0; j < tGroup.colLabels.length; j++) {
				let lbl = renderer.renderEntry(tGroup.colLabels[j]);
				colHeaders.append(`<th class="centred-col" ${subclassData}>${lbl}</th>`)
			}

			for (let j = 0; j < tGroup.rows.length; j++) {
				const tr = $(`#level${j + 1}`);
				levelTrs[j] = tr;
				for (let k = 0; k < tGroup.rows[j].length; k++) {
					let entry = tGroup.rows[j][k];
					if (entry === 0) entry = "\u2014";
					const stack = [];
					renderer.recursiveEntryRender(entry, stack);
					tr.append(`<td class="centred-col" ${subclassData}>${stack.join("")}</td>`)
				}
			}
		}

		// FEATURE DESCRIPTIONS & FLUFF ============================================================================================
		const renderStack = [];
		renderer.setFirstSection(true);
		const topBorder = $("#ftTopBorder");

		// FLUFF
		if (ClassDisplay.curClass.fluff) {
			renderer.recursiveEntryRender({type: "section", name: ClassDisplay.curClass.name, entries: ClassDisplay.curClass.fluff}, renderStack, 0,
				{prefix: `<tr class="text ${CLSS_CLASS_FLUFF}"><td colspan="6">`, suffix: `</td></tr>`, forcePrefixSuffix: true});
		}

		// FEATURE DESCRIPTIONS
		let subclassIndex = 0; // the subclass array is not 20 elements
		for (let i = 0; i < levelTrs.length; i++) {
			// track class table feature names
			const tblLvlFeatures = levelTrs[i].find(".features");
			// used to build class table
			const featureLinks = [];

			// add class features to render stack
			const lvlFeatureList = ClassDisplay.curClass.classFeatures[i];
			for (let j = 0; j < lvlFeatureList.length; j++) {
				const feature = lvlFeatureList[j];
				const idLevelPart = UrlUtil.encodeForHash(` ${i + 1}`);
				const featureId = `${HASH_FEATURE}${UrlUtil.encodeForHash(feature.name)}${idLevelPart}`;

				const featureLinkPart = `${HASH_FEATURE}${UrlUtil.encodeForHash(feature.name)}${idLevelPart}`;
				const featureLink = $(`<a href="${HashLoad.getClassHash(
					ClassDisplay.curClass)}${HASH_PART_SEP}${featureLinkPart}" class="${CLSS_FEATURE_LINK}" ${ATB_DATA_FEATURE_LINK}="${featureLinkPart}" ${ATB_DATA_FEATURE_ID}="${featureId}">${feature.name}</a>`);
				featureLink.click(function () {
					document.getElementById(featureId).scrollIntoView();
				});
				if (feature.type !== "inset") featureLinks.push(featureLink);

				const styleClasses = [CLSS_CLASS_FEATURE, "linked-titles--classes"];
				if (feature.gainSubclassFeature) styleClasses.push(CLSS_GAIN_SUBCLASS_FEATURE);

				renderer.recursiveEntryRender(feature, renderStack, 0, {prefix: `<tr id="${featureId}" class="${styleClasses.join(" ")}"><td colspan="6">`, suffix: `</td></tr>`, forcePrefixSuffix: true});

				// add subclass features to render stack if appropriate
				if (feature.gainSubclassFeature) {
					for (let k = 0; k < ClassDisplay.curClass.subclasses.length; k++) {
						const subClass = ClassDisplay.curClass.subclasses[k];

						if (ExcludeUtil.isExcluded(subClass.name, "subclass", subClass.source)) continue;

						for (let l = 0; l < subClass.subclassFeatures[subclassIndex].length; l++) {
							const subFeature = subClass.subclassFeatures[subclassIndex][l];

							// if this is not the subclass intro, add the subclass to the feature name
							// this will only be shown if there are multiple subclasses displayed
							if (subFeature.name === undefined) {
								for (let m = 0; m < subFeature.entries.length; m++) {
									const childEntry = subFeature.entries[m];
									if (childEntry.name !== undefined && !childEntry.name.startsWith(`<span class="${CLSS_SUBCLASS_PREFIX}">`)) {
										childEntry.name = `<span class="${CLSS_SUBCLASS_PREFIX}">${subClass.name}: </span>${childEntry.name}`;
									}
								}
							}

							const styleClasses = FeatureDescription.getSubclassStyles(subClass);
							renderer.recursiveEntryRender(subFeature, renderStack, 0, {
								prefix: `<tr class="text ${styleClasses.join(" ")}" ${ATB_DATA_SC}="${subClass.name}" ${ATB_DATA_SRC}="${
									ClassData.cleanScSource(subClass.source)}"><td colspan="6">`,
								suffix: `</td></tr>`,
								forcePrefixSuffix: true
							});
						}
					}
					subclassIndex++;
				}
			}

			// render class table feature names
			if (featureLinks.length === 0) {
				tblLvlFeatures.html("\u2014");
			} else {
				featureLinks.forEach(($it, j) => {
					tblLvlFeatures.append($it);
					if (j < featureLinks.length - 1) tblLvlFeatures.append(", ");
				});
			}
		}
		topBorder.after(renderStack.join(""));

		// hide UA/other sources by default
		$(`.${CLSS_NON_STANDARD_SOURCE}`).not(`.${CLSS_SUBCLASS_PILL}`).not(`.${CLSS_PANEL_LINK}`).hide();

		// CLASS FEATURE/UA/SUBCLASS PILL BUTTONS ==========================================================================
		HashLoad.subclassPillWrapper = $("div#subclasses");
		// remove any from previous class
		HashLoad.subclassPillWrapper.find("span").remove();

		// show/hide class features pill
		HashLoad.makeGenericTogglePill("Class Features", CLSS_CLASS_FEATURES_ACTIVE, ID_CLASS_FEATURES_TOGGLE, HASH_HIDE_FEATURES, true, "Toggle class features");
		if (ClassDisplay.curClass.fluff) HashLoad.makeGenericTogglePill("Detail Info", CLSS_FLUFF_ACTIVE, ID_FLUFF_TOGGLE, HASH_SHOW_FLUFF, false, "Toggle class detail information (Source: Xanathar's Guide to Everything)");

		// show/hide UA/other sources
		HashLoad.makeSourceCyclePill();

		// spacer before the subclass pills
		HashLoad.addPillDivider();

		// subclass pills
		const subClasses = ClassDisplay.curClass.subclasses
			.filter(sc => !ExcludeUtil.isExcluded(sc.name, "subclass", sc.source))
			.map(sc => ({name: sc.name, source: sc.source, shortName: sc.shortName}))
			.sort(function (a, b) {
				return SortUtil.ascSort(a.shortName, b.shortName)
			});
		for (let i = 0; i < subClasses.length; i++) {
			const subClass = subClasses[i];
			const nonStandardSource = SourceUtil.isNonstandardSource(subClass.source) || SourceUtil.hasBeenReprinted(subClass.shortName, subClass.source);
			const styleClasses = [CLSS_ACTIVE, CLSS_SUBCLASS_PILL];
			if (nonStandardSource) styleClasses.push(CLSS_NON_STANDARD_SOURCE);
			if (FeatureDescription.subclassIsFreshUa(subClass)) styleClasses.push(CLSS_FRESH_UA);
			if (BrewUtil.hasSourceJson(ClassData.cleanScSource(subClass.source))) styleClasses.push(CLSS_HOMEBREW_SOURCE);
			const pillText = SourceUtil.hasBeenReprinted(subClass.shortName, subClass.source) ? `${subClass.shortName} (${Parser.sourceJsonToAbv(subClass.source)})`
				: subClass.shortName;
			const pill = $(`<span class="${styleClasses.join(" ")}" ${ATB_DATA_SC}="${subClass.name}" ${ATB_DATA_SRC}="${
				ClassData.cleanScSource(subClass.source)}" title="Source: ${Parser.sourceJsonToFull(subClass.source)}"><span>${pillText}</span></span>`);
			pill.click(function () {
				HashLoad.handleSubclassClick($(this).hasClass(CLSS_ACTIVE), subClasses[i].name, ClassData.cleanScSource(subClasses[i].source));
			});
			if (nonStandardSource) pill.hide();
			HashLoad.subclassPillWrapper.append(pill);
		}

		// spacer before "Feeling Lucky" pill
		HashLoad.addPillDivider();
		HashLoad.makeFeelingLuckyPill();

		// call loadsub with a blank sub-hash, to ensure the right content is displayed
		loadsub([]);
	}

	static makeSourceCyclePill () {
		const $pill = $(`<span title="Cycle through source types" id="${ID_OTHER_SOURCES_TOGGLE}" data-state="0" style="min-width: 8em;"><span>${
			STRS_SOURCE_STATES[0]}</span></span>`);
		HashLoad.subclassPillWrapper.append($pill);
		$pill.click(() => {
			let state = Number($pill.attr("data-state"));
			if (++state > 2) state = 0;
			$pill.attr("data-state", state);
			$pill.find(`span`).text(STRS_SOURCE_STATES[state]);
			HashLoad.setSourceState(state);
		});
	}

	// helper functions
	static makeGenericTogglePill (pillText, pillActiveClass, pillId, hashKey, defaultActive, title) {
		const pill = $(`<span title="${title}" id="${pillId}"><span>${pillText}</span></span>`);
		if (defaultActive) pill.addClass(pillActiveClass);
		HashLoad.subclassPillWrapper.append(pill);
		pill.click(function () {
			let active = $(this).hasClass(pillActiveClass);
			if (!defaultActive) active = !active;
			handleToggleFeaturesClicks(active)
		});
		return pill;

		function handleToggleFeaturesClicks (isPillActive) {
			const outStack = [];
			const split = window.location.hash.split(HASH_PART_SEP);

			for (let i = 0; i < split.length; i++) {
				const hashPart = split[i];
				if (!hashPart.startsWith(hashKey)) outStack.push(hashPart);
			}
			if (isPillActive) {
				outStack.push(hashKey + "true")
			} else {
				outStack.push(hashKey + "false")
			}

			HashLoad.cleanSetHash(outStack.join(HASH_PART_SEP));
		}
	}

	static addPillDivider () {
		HashLoad.subclassPillWrapper.append($(`<span class="divider">`));
	}

	static makeFeelingLuckyPill () {
		const $pill = $(`<span title="Feeling Lucky?" class="sc-pill-feeling-lucky"><span class="glyphicon glyphicon-random"></span></span>`);
		HashLoad.subclassPillWrapper.append($pill);
		$pill.click(() => {
			const [link, ...sub] = History._getHashParts();
			const outStack = [link];
			let singleSelected = null;
			sub.filter(hashPart => {
				if (!hashPart.startsWith(HASH_SUBCLASS)) return true;
				else if (!hashPart.includes(HASH_LIST_SEP) && hashPart.length) singleSelected = hashPart.slice(HASH_SUBCLASS.length);
			}).forEach(hashPart => outStack.push(hashPart));
			const hashes = $(`.${CLSS_SUBCLASS_PILL}`).filter(`:visible`)
				.map((i, e) => HashLoad.getEncodedSubclass($(e).attr(`data-subclass`), $(e).attr(`data-source`))).get();

			const getRolled = () => hashes[RollerUtil.roll(hashes.length)];

			if (singleSelected == null || hashes.length === 1) outStack.push(`${HASH_SUBCLASS}${getRolled()}`);
			else if (hashes.length > 1) {
				let rolled;
				do {
					rolled = getRolled()
				} while (rolled === singleSelected);
				outStack.push(`${HASH_SUBCLASS}${rolled}`);
			}
			HashLoad.cleanSetHash(outStack.join(HASH_PART_SEP));
		});
	}

	static handleSubclassClick (isPillActive, subclassName, subclassSource) {
		const outStack = [];
		const split = window.location.hash.split(HASH_PART_SEP);

		const encodedSubClass = HashLoad.getEncodedSubclass(subclassName, subclassSource);
		const subclassLink = HASH_SUBCLASS + encodedSubClass;

		if (isPillActive && window.location.hash.includes(HASH_SUBCLASS)) {
			for (let i = 0; i < split.length; i++) {
				const hashPart = split[i];
				if (!hashPart.startsWith(HASH_SUBCLASS)) {
					outStack.push(hashPart);
				} else {
					const subClassStack = [];
					const subClasses = hashPart.substr(HASH_SUBCLASS.length).split(HASH_LIST_SEP);
					for (let j = 0; j < subClasses.length; j++) {
						const subClass = subClasses[j];
						if (subClass !== encodedSubClass) subClassStack.push(subClass);
					}
					if (subClassStack.length > 0) outStack.push(HASH_SUBCLASS + subClassStack.join(HASH_LIST_SEP));
				}
			}
		} else {
			let hasSubclassHash = false;

			for (let i = 0; i < split.length; i++) {
				const hashPart = split[i];
				if (!hashPart.startsWith(HASH_SUBCLASS)) {
					outStack.push(hashPart);
				} else {
					const subClassStack = [];
					const subClasses = hashPart.substr(HASH_SUBCLASS.length).split(HASH_LIST_SEP);
					for (let j = 0; j < subClasses.length; j++) {
						const subClass = subClasses[j];
						if (subClass !== encodedSubClass) subClassStack.push(subClass);
					}
					subClassStack.push(encodedSubClass);
					if (subClassStack.length > 0) outStack.push(HASH_SUBCLASS + subClassStack.join(HASH_LIST_SEP));

					hasSubclassHash = true;
				}
			}

			if (!hasSubclassHash) outStack.push(subclassLink);
		}

		HashLoad.cleanSetHash(outStack.join(HASH_PART_SEP));
	}

	static getClassHash (aClass) {
		return `#${UrlUtil.autoEncodeHash(aClass)}`;
	}

	static getEncodedSubclass (name, source) {
		return `${UrlUtil.encodeForHash(name)}${HASH_SUB_LIST_SEP}${UrlUtil.encodeForHash(source)}`;
	}

	static cleanSetHash (toSet) {
		window.location.hash = toSet.replace(/,+/g, ",").replace(/,$/, "").toLowerCase();
	}

	static setSourceState (toState) {
		const hash = window.location.hash;
		if (hash.includes(HASH_SOURCES)) {
			// handle old hash style
			HashLoad.cleanSetHash(hash.replace(/sources:(\d|true|false)/, `${HASH_SOURCES}${toState}`));
		} else {
			HashLoad.cleanSetHash(`${hash}${HASH_PART_SEP}${HASH_SOURCES}${toState}`)
		}
	}
}
HashLoad.subclassPillWrapper = undefined;

class SubClassLoader {
	static loadsub (sub) {
		let subclasses = null;
		let feature = null;
		let hideClassFeatures = null;
		let showFluff = null;
		let sources = null;
		let bookView = null;
		let comparisonView = null;

		SubClassLoader.partCache = null;

		function sliceTrue (hashPart, findString) {
			return hashPart.slice(findString.length) === "true";
		}

		for (let i = 0; i < sub.length; i++) {
			const hashPart = sub[i];

			if (hashPart.startsWith(HASH_SUBCLASS)) subclasses = hashPart.slice(HASH_SUBCLASS.length).split(HASH_LIST_SEP);
			if (hashPart.startsWith(HASH_FEATURE)) feature = hashPart;
			if (hashPart.startsWith(HASH_HIDE_FEATURES)) hideClassFeatures = sliceTrue(hashPart, HASH_HIDE_FEATURES);
			if (hashPart.startsWith(HASH_SHOW_FLUFF)) showFluff = sliceTrue(hashPart, HASH_SHOW_FLUFF);
			if (hashPart.startsWith(HASH_SOURCES)) sources = hashPart.slice(HASH_SOURCES.length);
			if (hashPart.startsWith(HASH_BOOK_VIEW)) bookView = sliceTrue(hashPart, HASH_BOOK_VIEW);
			if (subclassComparisonView && hashPart.startsWith(subclassComparisonView.hashKey)) comparisonView = sliceTrue(hashPart, `${subclassComparisonView.hashKey}:`);
		}

		const hideAllSources = !ClassBookView.bookViewActive && (sources === null || sources === STR_SOURCES_OFFICIAL);
		const hideSomeSources = !ClassBookView.bookViewActive && sources === STR_SOURCES_MIXED;

		// deselect any pills that would be hidden
		if (subclasses !== null && (hideAllSources || hideSomeSources)) {
			const toDeselect = [];
			const $toCheckBase = $(`.${CLSS_SUBCLASS_PILL}.${CLSS_NON_STANDARD_SOURCE}.${CLSS_ACTIVE}`);
			const $toCheck = hideAllSources ? $toCheckBase : $toCheckBase.not(`.${CLSS_FRESH_UA}`);
			$toCheck.each(function () {
				const $this = $(this);
				const thisSc = HashLoad.getEncodedSubclass($this.attr(ATB_DATA_SC), $this.attr(ATB_DATA_SRC));
				if ($.inArray(subclasses, thisSc)) {
					toDeselect.push(thisSc)
				}
			});
			const toKeep = subclasses.filter(sc => toDeselect.indexOf(sc) < 0);
			if (toKeep.length !== subclasses.length) {
				const newHashStack = [];
				for (let i = 0; i < sub.length; i++) {
					const hashPart = sub[i];

					if (!hashPart.startsWith(HASH_SUBCLASS)) {
						newHashStack.push(hashPart);
					} else if (toKeep.length > 0) newHashStack.push(HASH_SUBCLASS + toKeep.join(HASH_LIST_SEP))
				}
				const curParts = History._getHashParts();
				if (curParts.length > 1) {
					const newParts = [curParts[0]].concat(newHashStack);
					HashLoad.cleanSetHash(HASH_START + newParts.join(HASH_PART_SEP));
				}
				return;
			}
		}

		if (subclasses !== null) {
			SubClassLoader.updateClassTableLinks();
			SubClassLoader.updateNavLinks(sub);

			const $toShow = [];
			const $toHide = [];
			const $subClassSpanList = $(`.${CLSS_SUBCLASS_PILL}`);
			$subClassSpanList.each(
				function () {
					const $this = $(this);
					const thisSc = HashLoad.getEncodedSubclass($this.attr(ATB_DATA_SC), $this.attr(ATB_DATA_SRC));
					let shown = false;

					for (let j = 0; j < subclasses.length; j++) {
						const sc = subclasses[j].toLowerCase();
						if (sc.trim() === thisSc) {
							shown = true;
							break;
						}
					}
					if (shown) {
						$toShow.push($this);
					} else {
						$toHide.push($this);
					}
				}
			);

			ClassBookView.updateVisible($toShow, $toHide);

			if ($toShow.length === 0) {
				SubClassLoader.hideAllSubclasses(sub, hideAllSources);
			} else {
				const otherSrcSubFeat = $(`#pagecontent`).find(`div.${CLSS_NON_STANDARD_SOURCE}`);
				const shownInTable = [];

				$.each($toShow, function (i, v) {
					v.addClass(CLSS_ACTIVE);
					$(`.${CLSS_SUBCLASS_FEATURE}[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).show();
					if (hideAllSources || hideSomeSources) {
						otherSrcSubFeat.filter(`[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).hide();
					} else {
						otherSrcSubFeat.filter(`[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).show();
					}

					const asInTable = FeatureTable.getTableDataScData(v.attr(ATB_DATA_SC), v.attr(ATB_DATA_SRC));
					shownInTable.push(asInTable);
					SubClassLoader.handleTableGroups(shownInTable, asInTable, true);
				});

				$.each($toHide, function (i, v) {
					v.removeClass(CLSS_ACTIVE);
					$(`.${CLSS_SUBCLASS_FEATURE}[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).hide();
					otherSrcSubFeat.filter(`[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).hide();

					const asInTable = FeatureTable.getTableDataScData(v.attr(ATB_DATA_SC), v.attr(ATB_DATA_SRC));
					SubClassLoader.handleTableGroups(shownInTable, asInTable, false);
				});

				const $spicy_NotScFeature_NoSubclassNoSource = otherSrcSubFeat.not(`.${CLSS_SUBCLASS_FEATURE}`).filter(`:not([${ATB_DATA_SC}]):not([${ATB_DATA_SRC}])`);
				const $spicy_NotScFeature_NoneSubclassNoneSource = otherSrcSubFeat.not(`.${CLSS_SUBCLASS_FEATURE}`).filter(`[${ATB_DATA_SC}="${EntryRenderer.DATA_NONE}"][${ATB_DATA_SRC}="${EntryRenderer.DATA_NONE}"]`);
				if (hideAllSources) {
					$spicy_NotScFeature_NoSubclassNoSource.hide();
					$spicy_NotScFeature_NoneSubclassNoneSource.hide();
				} else {
					$spicy_NotScFeature_NoSubclassNoSource.show();
					$spicy_NotScFeature_NoneSubclassNoneSource.show();
				}
			}

			// show subclass prefixes if we're displaying more than 1 subclass
			if ($toShow.length !== 1) {
				$(`.${CLSS_SUBCLASS_PREFIX}`).show();
			} else {
				$(`.${CLSS_SUBCLASS_PREFIX}`).hide();
			}
		} else {
			SubClassLoader.hideAllSubclasses(sub, hideAllSources);
			ClassBookView.updateVisible([], $(`.${CLSS_SUBCLASS_PILL}`).map((i, e) => $(e)).get());
		}

		// hide class features as required
		const cfToggle = $(`#${ID_CLASS_FEATURES_TOGGLE}`);
		const allCf = $(`#pagecontent`).find(`.${CLSS_CLASS_FEATURE}`);
		const toToggleCf = allCf.not(`.${CLSS_GAIN_SUBCLASS_FEATURE}`);
		const isHideClassFeatures = hideClassFeatures !== null && hideClassFeatures;
		// if showing no subclass and hiding class features, hide the "gain a feature at this level" labels
		if (isHideClassFeatures && subclasses === null) {
			allCf.hide();
			if (!showFluff) {
				$(`#please-select-message`).addClass("showing");
			} else {
				$(`#please-select-message`).removeClass("showing");
			}
		} else {
			allCf.show();
			$(`#please-select-message`).removeClass("showing");
		}
		if (isHideClassFeatures) {
			cfToggle.removeClass(CLSS_CLASS_FEATURES_ACTIVE);
			toToggleCf.hide();
		} else {
			cfToggle.addClass(CLSS_CLASS_FEATURES_ACTIVE);
			toToggleCf.show();
		}

		// show fluff as required
		const fluffToggle = $(`#${ID_FLUFF_TOGGLE}`);
		const fluff = $(`#pagecontent`).find(`.${CLSS_CLASS_FLUFF}`);
		if (!showFluff) {
			fluffToggle.removeClass(CLSS_FLUFF_ACTIVE);
			fluff.hide();
		} else {
			fluffToggle.addClass(CLSS_FLUFF_ACTIVE);
			fluff.show();
		}

		// show UA/etc pills as required
		const srcToggle = $(`#${ID_OTHER_SOURCES_TOGGLE}`);
		const toToggleSrc = $(`.${CLSS_SUBCLASS_PILL}.${CLSS_NON_STANDARD_SOURCE}`).not(`.${CLSS_PANEL_LINK}`);
		if (hideAllSources) {
			srcToggle.find(`span`).text(STRS_SOURCE_STATES[0]);
			srcToggle.attr("data-state", STR_SOURCES_OFFICIAL);
			toToggleSrc.hide();
		} else if (hideSomeSources) {
			srcToggle.find(`span`).text(STRS_SOURCE_STATES[1]);
			srcToggle.attr("data-state", STR_SOURCES_MIXED);
			toToggleSrc.show().not(`.${CLSS_FRESH_UA}`).hide();
		} else {
			srcToggle.find(`span`).text(STRS_SOURCE_STATES[2]);
			srcToggle.attr("data-state", STR_SOURCES_ALL);
			toToggleSrc.show();
		}

		// scroll to the linked feature if required
		if (feature !== null && (SubClassLoader.prevFeature === null || SubClassLoader.prevFeature !== feature)) {
			document.getElementById($(`[${ATB_DATA_FEATURE_LINK}="${feature}"]`)[0].getAttribute(ATB_DATA_FEATURE_ID)).scrollIntoView();
			SubClassLoader.prevFeature = feature;
		}

		SubClassLoader.updateClassTableLinks();
		SubClassLoader.updateNavLinks(sub);

		if (bookView) {
			ClassBookView.open();
		} else {
			ClassBookView.teardown();
		}

		if (comparisonView && subclassComparisonView) {
			subclassComparisonView.open();
		} else if (subclassComparisonView) {
			subclassComparisonView.teardown();
		}
	}

	static handleTableGroups (shownInTable, tableDataTag, show) {
		$(`[${ATB_DATA_SC_LIST}]`).each(
			function () {
				const $this = $(this);
				const scs = $this.attr(ATB_DATA_SC_LIST).split(ATB_DATA_LIST_SEP);

				// if another class has shown this item, don't hide it
				if (!show) {
					for (let i = 0; i < scs.length; i++) {
						const sc = scs[i];
						if ($.inArray(sc, shownInTable) !== -1) {
							return;
						}
					}
				}

				for (let i = 0; i < scs.length; i++) {
					const sc = scs[i];
					if (sc === tableDataTag) {
						if (show) {
							$this.show();
						} else {
							$this.hide();
						}
						break;
					}
				}
			}
		);
	}

	static getFeatureLink (featurePart) {
		if (!SubClassLoader.partCache) {
			const curHash = window.location.hash;
			const hashParts = curHash.slice(1).split(HASH_PART_SEP);
			SubClassLoader.partCache = [];
			for (let i = 0; i < hashParts.length; i++) {
				const part = hashParts[i];
				if (!part.startsWith(HASH_FEATURE)) SubClassLoader.partCache.push(part);
			}
		}
		return HASH_START + SubClassLoader.partCache.join(HASH_PART_SEP) + HASH_PART_SEP + featurePart;
	}

	static updateClassTableLinks () {
		$(`.${CLSS_FEATURE_LINK}`).each(
			function () {
				const $this = $(this);
				this.href = SubClassLoader.getFeatureLink($this.attr(ATB_DATA_FEATURE_LINK));
			}
		)
	}

	static hideAllSubclasses (curSub, hideAllSources) {
		SubClassLoader.updateClassTableLinks();
		SubClassLoader.updateNavLinks(curSub);
		const $pgContent = $(`#pagecontent`);
		$(`.${CLSS_SUBCLASS_PILL}`).removeClass(CLSS_ACTIVE);
		$pgContent.find(`.${CLSS_SUBCLASS_FEATURE}`).hide();
		$(`.${CLSS_SUBCLASS_PREFIX}`).hide();
		const allNonstandard = $pgContent.find(`div.${CLSS_NON_STANDARD_SOURCE}`);
		allNonstandard.hide();
		// if we're showing features from other sources, make sure these stay visible
		if (!hideAllSources) {
			allNonstandard.not(`.${CLSS_SUBCLASS_FEATURE}`).not(`.${CLSS_SUBCLASS_PILL}`).show();
		}
		// hide all table col groups
		// TODO add handling for non-standard sources if UA non-caster->caster subclass are introduced
		$(`[${ATB_DATA_SC_LIST}]`).each(
			function () {
				$(this).hide();
			}
		);
	}

	static updateNavLinks (sub) {
		function makeScroller ($nav, idTr, parentTr, idClass, displayText, scrollTo) {
			let navClass;
			switch (idClass) {
				case "statsBlockSectionHead":
					navClass = "n1";
					break;
				case "statsBlockHead":
					navClass = "n2";
					break;
				case "statsBlockSubHead":
					navClass = "n3";
					break;
			}
			if (typeof navClass !== "undefined") {
				const subClass = parentTr.length ? parentTr.hasClass("subclass-feature") : false;
				const ua = parentTr.length ? parentTr.hasClass("spicy-sauce") : false;
				const brew = parentTr.length ? parentTr.hasClass("refreshing-brew") : false;
				$(`<div class="nav-item ${navClass} ${brew ? "purple" : ua ? "green" : subClass ? "blue" : ""}">${displayText}</div>`).on("click", () => {
					if (idTr.length) {
						window.location.hash = SubClassLoader.getFeatureLink(idTr.attr("id"))
					}

					const $it = $(`[data-title-index="${scrollTo}"]`);
					if ($it.get()[0]) $it.get()[0].scrollIntoView();
				}).appendTo($nav);
			}
		}

		if (!CollectionUtil.arrayEq(SubClassLoader.prevSub, sub)) { // checking array equality is faster than hitting the DOM
			setTimeout(() => {
				const $nav = $(`#sticky-nav`);
				const $hr = $nav.find(`hr`);
				const $navBody = $nav.find(`.nav-body`).empty();
				const $navHead = $nav.find(`.nav-head`);
				$navHead.find(`div`).off("click").on("click", () => {
					$navBody.toggle();
					$hr.toggle();
					const nextState = Number(!Number($navHead.attr("data-state")));
					$navHead.attr("data-state", nextState);
				});
				const $titles = $(`.entry-title`);
				$titles.each((i, e) => {
					const $e = $(e);
					const pClass = $e.parent().attr("class").trim();
					if (pClass === "statsInlineHead") return; // consider enabling these for e.g. maneuvers?
					if (!$e.is(":visible")) return;
					const idTr = $e.closest(`tr[id]`);
					const pTr = $e.closest(`tr`);
					const textNodes = $e.find(`.entry-title-inner`).contents().filter(function () {
						return this.nodeType === 3;
					});
					if (!textNodes.length) return;
					const displayText = textNodes[0].nodeValue.replace(/[:.]$/g, "");
					const scrollTo = $e.data("title-index");
					makeScroller($navBody, idTr, pTr, pClass, displayText, scrollTo);
				});
			}, 5); // delay hack to allow rendering to catch up
		}
		SubClassLoader.prevSub = sub;
	}
}
SubClassLoader.prevFeature = null;
SubClassLoader.prevSub = null;
SubClassLoader.partCache = null;

function initCompareMode () {
	subclassComparisonView = new BookModeView(
		"compview", $(`#btn-comparemode`), "Please select some subclasses first",
		($tbl) => {
			const renderStack = [];
			const numScLvls = ClassDisplay.curClass.subclasses[0].subclassFeatures.length;
			for (let i = 0; i < numScLvls; ++i) {
				renderStack.push(`<tr class="text">`);
				ClassDisplay.curClass.subclasses.filter(sc => !ExcludeUtil.isExcluded(sc.name, "subclass", sc.source)).forEach((sc, j) => {
					renderStack.push(`<td class="subclass-features-${j} ${FeatureDescription.getSubclassStyles(sc).join(" ")}">`);
					sc.subclassFeatures[i].forEach(f => {
						renderer.recursiveEntryRender(f, renderStack);
					});
					renderStack.push(`</td>`);
				});
				renderStack.push(`</tr>`);
				renderStack.push(`<tr><th colspan="6"><hr></th></tr>`);
			}
			$tbl.append(renderStack.join(""));

			let numShown = 0;
			ClassDisplay.curClass.subclasses.filter(sc => !ExcludeUtil.isExcluded(sc.name, "subclass", sc.source)).forEach((sc, i) => {
				const $pill = $(`.sc-pill[data-subclass="${sc.name}"][data-source="${sc.source.source || sc.source}"]`);
				if (!($pill.hasClass("active"))) {
					$tbl.find(`.subclass-features-${i}`).hide();
				} else {
					numShown++;
				}
			});

			$tbl.find(`tr > td > div`).css("width", "400px");

			return numShown;
		}
	);
}

class ClassBookView {
	static open () {
		function tglCf ($bkTbl, $cfToggle) {
			$bkTbl.find(`.class-features`).toggle();
			$cfToggle.toggleClass("cf-active");
		}

		function hashTeardown () {
			HashLoad.cleanSetHash(window.location.hash.replace(ClassBookView.SUBHASH, ""));
		}

		if (ClassBookView.bookViewActive) return;
		ClassBookView.bookViewActive = true;

		HashLoad.setSourceState(STR_SOURCES_ALL);

		const $body = $(`body`);
		const $wrpBook = $(`<div class="book-mode"/>`);
		ClassBookView._$body = $body;
		ClassBookView._$wrpBook = $wrpBook;

		$body.css("overflow", "hidden");

		// main panel
		const $pnlContent = $(`<div class="pnl-content"/>`);
		const $bkTbl = $(`<table class="stats stats-book"/>`);
		ClassBookView._$bkTbl = $bkTbl;
		const $brdTop = $(`<tr><th class="border close-border" colspan="6"><div/></th></tr>`);
		const $btnClose = $(`<span class="delete-icon glyphicon glyphicon-remove"></span>`)
			.on("click", () => {
				hashTeardown();
			});
		$brdTop.find(`div`).append($btnClose);
		$bkTbl.append($brdTop);

		const renderStack = [];
		renderer.setFirstSection(true);
		renderer.recursiveEntryRender({type: "section", name: ClassDisplay.curClass.name}, renderStack, 0, {prefix: `<tr><td colspan="6">`, suffix: `</td></tr>`, forcePrefixSuffix: true});

		renderStack.push(`<tr class="text class-features"><td colspan="6">`);
		ClassDisplay.curClass.classFeatures.forEach(lvl => {
			lvl.forEach(cf => {
				renderer.recursiveEntryRender(cf, renderStack);
			});
		});
		renderStack.push(`</td></tr>`);

		ClassDisplay.curClass.subclasses.filter(sc => !ExcludeUtil.isExcluded(sc.name, "subclass", sc.source)).forEach((sc, i) => {
			renderStack.push(`<tr class="subclass-features-${i} ${FeatureDescription.getSubclassStyles(sc).join(" ")}"><td colspan="6">`);
			sc.subclassFeatures.forEach(lvl => {
				lvl.forEach(f => {
					renderer.recursiveEntryRender(f, renderStack);
				});
			});
			renderStack.push(`</td></tr>`);
		});
		renderStack.push(EntryRenderer.utils.getBorderTr());
		$bkTbl.append(renderStack.join(""));
		$pnlContent.append($bkTbl);

		// menu panel
		const $pnlMenu = $(`<div class="pnl-menu"/>`);
		const $cfPill = $(`#${ID_CLASS_FEATURES_TOGGLE}`);

		const $cfToggle = $(`<span class="pnl-link cf-active">Class Features</span>`).on("click", () => {
			tglCf($bkTbl, $cfToggle);
			$cfPill.click();
		});

		if (!($cfPill.hasClass("cf-active"))) {
			tglCf($bkTbl, $cfToggle);
		}

		$pnlMenu.append($cfToggle);

		ClassDisplay.curClass.subclasses.filter(sc => !ExcludeUtil.isExcluded(sc.name, "subclass", sc.source)).forEach((sc, i) => {
			const name = SourceUtil.hasBeenReprinted(sc.shortName, sc.source) ? `${sc.shortName} (${Parser.sourceJsonToAbv(sc.source)})` : sc.shortName;
			const styles = FeatureDescription.getSubclassStyles(sc);
			const $pill = $(`.sc-pill[data-subclass="${sc.name}"][data-source="${sc.source.source || sc.source}"]`);

			const $scToggle = $(`<span class="pnl-link active ${styles.join(" ")}" title="Source: ${Parser.sourceJsonToFull(sc.source)}" data-i="${i}" data-bk-subclass="${
				sc.name}" data-bk-source="${sc.source.source || sc.source}">${name}</span>`).on("click", () => {
				ClassBookView._toggleSubclass($bkTbl, $scToggle, i);
				$pill.click();
			});

			if (!($pill.hasClass("active"))) {
				ClassBookView._toggleSubclass($bkTbl, $scToggle, i);
			}

			ClassBookView._$scToggles[String(i)] = $scToggle;
			$pnlMenu.append($scToggle);
		});

		const $menClose = $(`<span class="pnl-link pnl-link-close">\u21FD Close</span>`).on("click", () => {
			hashTeardown();
		});
		$pnlMenu.append($menClose);

		// right (blank) panel
		const $pnlBlank = $(`<div class="pnl-menu pnl-menu-pad"/>`);

		$wrpBook.append($pnlMenu).append($pnlContent).append($pnlBlank);
		$body.append($wrpBook);
	}

	static teardown () {
		if (ClassBookView.bookViewActive) {
			ClassBookView._$bkTbl = null;
			ClassBookView._$scToggles = {};

			ClassBookView._$body.css("overflow", "");
			ClassBookView._$wrpBook.remove();
			ClassBookView.bookViewActive = false;
		}
	}

	static _toggleSubclass ($bkTbl, $scToggle, i) {
		$bkTbl.find(`.subclass-features-${i}`).toggle();
		$scToggle.toggleClass("active");
	}

	static updateVisible ($toShow, $toHide) {
		function doUpdate ($list, show) {
			$list.map($p => {
				const $it = ClassBookView._$wrpBook.find(`.pnl-link[data-bk-subclass="${$p.attr(ATB_DATA_SC)}"][data-bk-source="${$p.attr(ATB_DATA_SRC)}"]`);
				if ($it.length) {
					const index = $it.data("i");
					const $real = ClassBookView._$scToggles[index];
					if (show && !$real.hasClass("active")) {
						ClassBookView._toggleSubclass(ClassBookView._$bkTbl, $real, Number(index));
					}
					if (!show && $real.hasClass("active")) {
						ClassBookView._toggleSubclass(ClassBookView._$bkTbl, $real, Number(index));
					}
				}
			});
		}

		if (ClassBookView.bookViewActive) {
			// $toShow/$toHide are lists of subclass pills
			doUpdate($toShow, true);
			doUpdate($toHide, false);
		}
	}

	static initButton () {
		$(`#btn-readmode`).on("click", () => {
			HashLoad.cleanSetHash(`${window.location.hash}${HASH_PART_SEP}${ClassBookView.SUBHASH}`);
		});
	}
}
ClassBookView.SUBHASH = `${HASH_BOOK_VIEW}true`;
ClassBookView.bookViewActive = false;
ClassBookView._$body = null;
ClassBookView._$wrpBookUnder = null;
ClassBookView._$wrpBook = null;
ClassBookView._$bkTbl = null;
ClassBookView._$scToggles = {};

function initLinkGrabbers () {
	$(`body`).on(`click`, `.linked-titles--classes > td > * > .entry-title .entry-title-inner`, function () {
		const $this = $(this);
		const fTag = $this.closest(`tr`).attr("id");

		const hash = `${window.location.hash.slice(1).split(HASH_PART_SEP)
			.filter(it => !it.startsWith(HASH_FEATURE)).join(HASH_PART_SEP)}${HASH_PART_SEP}${fTag}`;

		copyText(`${window.location.href.split("#")[0]}#${hash}`);
		showCopiedEffect($this);
	});
}

const renderer = EntryRenderer.getDefaultRenderer();

const sourceFilter = new Filter({
	header: FilterBox.SOURCE_HEADER,
	minimalUI: true,
	items: ["Core", "Others"],
	selFn: (it) => it === "Core" || it === "Homebrew"
});

const filterBox = initFilterBox(sourceFilter);
// filtering function
$(filterBox).on(
	FilterBox.EVNT_VALCHANGE,
	ClassList.handleFilterChange
);

ClassList.classList = ListUtil.search({
	valueNames: ['name', 'source', 'uniqueid'],
	listClass: "classes"
});

BrewUtil.makeBrewButton("manage-brew");
BrewUtil.bind({list: ClassList.classList, filterBox, sourceFilter});

initCompareMode();
initLinkGrabbers();
ClassBookView.initButton();
ExcludeUtil.initialise();

let tableDefault = $("#pagecontent").html();
let statsProfDefault = $("#statsprof").html();
let classTableDefault = $("#classtable").html();

DataUtil.class.loadJSON().then((data) => {
	addClassData(data);

	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(BrewUtil.pAddLocalBrewData)
		.catch(BrewUtil.purgeBrew)
		.then(() => {
			RollerUtil.addListRollButton();
			History.init(true);
		});
});

function handleBrew (homebrew) {
	addClassData(homebrew);
	addSubclassData(homebrew);
	return Promise.resolve();
}