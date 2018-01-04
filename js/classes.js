"use strict";
const HASH_FEATURE = "f:";
const HASH_HIDE_FEATURES = "hideclassfs:";
const HASH_ALL_SOURCES = "allsrc:";

const CLSS_FEATURE_LINK = "feature-link";
const CLSS_ACTIVE = "active";
const CLSS_SUBCLASS_PILL = "sc-pill";
const CLSS_CLASS_FEATURES_ACTIVE = "cf-active";
const CLSS_OTHER_SOURCES_ACTIVE = "os-active";
const CLSS_SUBCLASS_PREFIX = "subclass-prefix";
const CLSS_CLASS_FEATURE = "class-feature";
const CLSS_GAIN_SUBCLASS_FEATURE = "gain-subclass-feature";
const ID_CLASS_FEATURES_TOGGLE = "cf-toggle";
const ID_OTHER_SOURCES_TOGGLE = "os-toggle";

const STR_PROF_NONE = "none";

const ATB_DATA_FEATURE_LINK = "data-flink";
const ATB_DATA_FEATURE_ID = "data-flink-id";
const ATB_DATA_SC_LIST = "data-subclass-list";

let tableDefault;
let statsProfDefault;
let classTableDefault;

let classes;

const jsonURL = "data/classes.json";

const renderer = new EntryRenderer();

window.onload = function load () {
	loadJSON(jsonURL, onJsonLoad);
};

function getClassHash (aClass) {
	return `#${UrlUtil.autoEncodeHash(aClass)}`;
}

function getEncodedSubclass (name, source) {
	return `${UrlUtil.encodeForHash(name)}${HASH_SUB_LIST_SEP}${UrlUtil.encodeForHash(source)}`;
}

function getTableDataScData (scName, scSource) {
	return scName + ATB_DATA_PART_SEP + scSource;
}

function onJsonLoad (data) {
	classes = data.class;

	// alphabetically sort subclasses
	for (const c of classes) {
		c.subclasses = c.subclasses.sort((a, b) => ascSort(a.name, b.name));
	}

	// for any non-standard source classes, mark subclasses from the same source as "forceStandard"
	classes.filter(c => isNonstandardSource(c.source)).forEach(c => c.subclasses.filter(sc => sc.source === c.source).forEach(sc => sc.source = {"source": sc.source, "forceStandard": true}));

	tableDefault = $("#stats").html();
	statsProfDefault = $("#statsprof").html();
	classTableDefault = $("#classtable").html();

	const classTable = $("ul.classes");
	let tempString = "";
	for (let i = 0; i < classes.length; i++) {
		const curClass = classes[i];
		tempString +=
			`<li>
				<a id='${i}' href='${getClassHash(curClass)}' title='${curClass.name}'>
					<span class='name col-xs-8'>${curClass.name}</span>
					<span class='source col-xs-4 text-align-center source${Parser.sourceJsonToAbv(curClass.source)}' title='${Parser.sourceJsonToFull(curClass.source)}'>${Parser.sourceJsonToAbv(curClass.source)}</span>
				</a>
			</li>`;
	}
	classTable.append(tempString);

	const list = search({
		valueNames: ['name', 'source'],
		listClass: "classes"
	});

	initHistory()
}

function loadhash (id) {
	$("#stats").html(tableDefault);
	$("#statsprof").html(statsProfDefault);
	$("#classtable").html(classTableDefault);
	const curClass = classes[id];

	const isUaClass = isNonstandardSource(curClass.source);

	// name
	$("th#nameTable").html(curClass.name);
	$("th#nameSummary").html(curClass.name);

	// SUMMARY SIDEBAR =================================================================================================
	// hit dice and HP
	$("td#hp div#hitdice span").html(EntryRenderer.getEntryDice(curClass.hd));
	$("td#hp div#hp1stlevel span").html(curClass.hd.faces + " + your Constitution modifier");
	$("td#hp div#hphigherlevels span").html(`${EntryRenderer.getEntryDice(curClass.hd)} (or ${(curClass.hd.faces / 2 + 1)}) + your Constitution modifier per ${curClass.name} level after 1st`);

	// save proficiency
	$("td#prof div#saves span").html(curClass.proficiency.map(p => Parser.attAbvToFull(p)).join(", "));

	// starting proficiencies
	const sProfs = curClass.startingProficiencies;
	const profSel = $("td#prof");
	profSel.find("div#armor span").html(sProfs.armor === undefined ? STR_PROF_NONE : sProfs.armor.map(a => a === "light" || a === "medium" || a === "heavy" ? a + " armor" : a).join(", "));
	profSel.find("div#weapons span").html(sProfs.weapons === undefined ? STR_PROF_NONE : sProfs.weapons.map(w => w === "simple" || w === "martial" ? w + " weapons" : w).join(", "));
	profSel.find("div#tools span").html(sProfs.tools === undefined ? STR_PROF_NONE : sProfs.tools.join(", "));
	profSel.find("div#skills span").html(sProfs.skills === undefined ? STR_PROF_NONE : getSkillProfString(sProfs.skills));

	function getSkillProfString (skills) {
		const numString = Parser.numberToString(skills.choose);
		return skills.from.length === 18 ? `Choose any ${numString}.` : `Choose ${numString} from ${joinConjunct(skills.from, ", ", ", and ")}.`
	}

	// starting equipment
	const sEquip = curClass.startingEquipment;
	const fromBackground = sEquip.additionalFromBackground ? "<p>You start with the following items, plus anything provided by your background.</p>" : "";
	const defList = sEquip.default.length === 0 ? "" : `<ul><li>${sEquip.default.join("</li><li>")}</ul>`;
	const goldAlt = sEquip.goldAlternative === undefined ? "" : `<p>Alternatively, you may start with ${sEquip.goldAlternative} gp to buy your own equipment.</p>`;
	$("#equipment").find("div").html(`${fromBackground}${defList}${goldAlt}`);

	// FEATURE TABLE ===================================================================================================
	const tData = curClass.classTableGroups;
	const groupHeaders = $("#groupHeaders");
	const colHeaders = $("#colHeaders");
	const levelTrs = [];
	for (let i = 0; i < tData.length; i++) {
		const tGroup = tData[i];

		const hasTitle = tGroup.title !== undefined;
		let subclassData = "";
		if (tGroup.subclasses !== undefined) {
			subclassData = `${ATB_DATA_SC_LIST}="${tGroup.subclasses.map(s => getTableDataScData(s.name, s.source)).join(ATB_DATA_LIST_SEP)}"`;
		}
		groupHeaders.append(`<th ${hasTitle ? `class="colGroupTitle"` : ""} colspan="${tGroup.colLabels.length}" ${subclassData}>${hasTitle ? tGroup.title : ""}</th>`);

		for (let j = 0; j < tGroup.colLabels.length; j++) {
			const lbl = tGroup.colLabels[j];
			colHeaders.append(`<th class="centred-col" ${subclassData}>${lbl}</th>`)
		}

		for (let j = 0; j < 20; j++) {
			const tr = $(`#level${j + 1}`);
			levelTrs[j] = tr;
			for (let k = 0; k < tGroup.rows[j].length; k++) {
				let entry = tGroup.rows[j][k];
				if (entry === 0) entry = "\u2014";
				const stack = [];
				renderer.recursiveEntryRender(entry, stack, "", "");
				tr.append(`<td class="centred-col" ${subclassData}>${stack.join("")}</td>`)
			}
		}
	}

	// FEATURE DESCRIPTIONS ============================================================================================
	const renderStack = [];
	const topBorder = $("#ftTopBorder");
	let subclassIndex = 0; // the subclass array is not 20 elements
	for (let i = 0; i < 20; i++) {
		// track class table feature names
		const tblLvlFeatures = levelTrs[i].find(".features");
		const featureNames = [];

		// add class features to render stack
		const lvlFeatureList = curClass.classFeatures[i];
		for (let j = 0; j < lvlFeatureList.length; j++) {
			const feature = lvlFeatureList[j];
			const featureId = `${HASH_FEATURE}${UrlUtil.encodeForHash(feature.name)}_${i}`;

			const featureLinkPart = `${HASH_FEATURE}${UrlUtil.encodeForHash(feature.name)}${i}`;
			const featureLink = $(`<a href="${getClassHash(curClass)}${HASH_PART_SEP}${featureLinkPart}" class="${CLSS_FEATURE_LINK}" ${ATB_DATA_FEATURE_LINK}="${featureLinkPart}" ${ATB_DATA_FEATURE_ID}="${featureId}">${feature.name}</a>`);
			featureLink.click(function () {
				document.getElementById(featureId).scrollIntoView();
			});
			if (feature.type !== "inset") featureNames.push(featureLink);

			const styleClasses = [CLSS_CLASS_FEATURE];
			if (feature.gainSubclassFeature) styleClasses.push(CLSS_GAIN_SUBCLASS_FEATURE);

			renderer.recursiveEntryRender(feature, renderStack, 0, `<tr id="${featureId}" class="${styleClasses.join(" ")}"><td colspan="6">`, `</td></tr>`, true);

			// add subclass features to render stack if appropriate
			if (feature.gainSubclassFeature) {
				for (let k = 0; k < curClass.subclasses.length; k++) {
					const subClass = curClass.subclasses[k];
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

						const styleClasses = [CLSS_SUBCLASS_FEATURE];
						const hideSource = isNonstandardSource(subClass.source) || hasBeenReprinted(subClass.shortName, subClass.source);
						if (hideSource) styleClasses.push(CLSS_NON_STANDARD_SOURCE);
						renderer.recursiveEntryRender(subFeature, renderStack, 0, `<tr class="${styleClasses.join(" ")}" ${ATB_DATA_SC}="${subClass.name}" ${ATB_DATA_SRC}="${subClass.source}"><td colspan="6">`, `</td></tr>`, true);
					}
				}
				subclassIndex++;
			}
		}

		// render class table feature names
		if (featureNames.length === 0) tblLvlFeatures.html("\u2014");
		else {
			for (let j = 0; j < featureNames.length; j++) {
				tblLvlFeatures.append(featureNames[j]);
				if (j < featureNames.length - 1) tblLvlFeatures.append(", ");
			}
		}
	}
	topBorder.after(renderStack.join(""));

	// hide UA/other sources by default
	$(`.${CLSS_NON_STANDARD_SOURCE}`).not(`.${CLSS_SUBCLASS_PILL}`).hide();

	// CLASS FEATURE/UA/SUBCLASS PILL BUTTONS ==========================================================================
	const subclassPillWrapper = $("div#subclasses");
	// remove any from previous class
	subclassPillWrapper.find("span").remove();

	// show/hide class features pill
	makeGenericTogglePill("Class Features", CLSS_CLASS_FEATURES_ACTIVE, ID_CLASS_FEATURES_TOGGLE, HASH_HIDE_FEATURES, true);

	// show/hide UA/other sources
	const allSourcesToggle = makeGenericTogglePill("All Sources", CLSS_OTHER_SOURCES_ACTIVE, ID_OTHER_SOURCES_TOGGLE, HASH_ALL_SOURCES, false);

	// spacer before the subclass pills
	subclassPillWrapper.append($(`<span class="divider">`));

	// subclass pills
	const subClasses = curClass.subclasses
		.map(sc => ({"name": sc.name, "source": sc.source, "shortName": sc.shortName}))
		.sort(function (a, b) {
			return ascSort(a.shortName, b.shortName)
		});
	for (let i = 0; i < subClasses.length; i++) {
		const nonStandardSource = isNonstandardSource(subClasses[i].source) || hasBeenReprinted(subClasses[i].shortName, subClasses[i].source);
		const styleClasses = [CLSS_ACTIVE, CLSS_SUBCLASS_PILL];
		if (nonStandardSource) styleClasses.push(CLSS_NON_STANDARD_SOURCE);
		const pillText = hasBeenReprinted(subClasses[i].shortName, subClasses[i].source) ? `${subClasses[i].shortName} (${Parser.sourceJsonToAbv(subClasses[i].source)})` : subClasses[i].shortName;
		const pill = $(`<span class="${styleClasses.join(" ")}" ${ATB_DATA_SC}="${subClasses[i].name}" ${ATB_DATA_SRC}="${subClasses[i].source}" title="Source: ${Parser.sourceJsonToFull(subClasses[i].source)}"><span>${pillText}</span></span>`);
		pill.click(function () {
			handleSubclassClick($(this).hasClass(CLSS_ACTIVE), subClasses[i].name, subClasses[i].source);
		});
		if (nonStandardSource) pill.hide();
		subclassPillWrapper.append(pill);
	}

	// call loadsub with a blank sub-hash, to ensure the right content is displayed
	loadsub("");

	// helper functions
	function makeGenericTogglePill (pillText, pillActiveClass, pillId, hashKey, defaultActive) {
		const pill = $(`<span id="${pillId}"><span>${pillText}</span></span>`);
		if (defaultActive) pill.addClass(pillActiveClass);
		subclassPillWrapper.append(pill);
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

			window.location.hash = outStack.join(HASH_PART_SEP).toLowerCase();
		}
	}

	function handleSubclassClick (isPillActive, subclassName, subclassSource) {
		const outStack = [];
		const split = window.location.hash.split(HASH_PART_SEP);

		const encodedSubClass = getEncodedSubclass(subclassName, subclassSource);
		const subclassLink = HASH_SUBCLASS + encodedSubClass;

		if (isPillActive && window.location.hash.includes(HASH_SUBCLASS)) {
			for (let i = 0; i < split.length; i++) {
				const hashPart = split[i];
				if (!hashPart.startsWith(HASH_SUBCLASS)) outStack.push(hashPart);
				else {
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
				if (!hashPart.startsWith(HASH_SUBCLASS)) outStack.push(hashPart);
				else {
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

		window.location.hash = outStack.join(HASH_PART_SEP).toLowerCase();
	}
}

let prevFeature = null;

function loadsub (sub) {
	const curHash = window.location.hash;

	let subclasses = null;
	let feature = null;
	let hideClassFeatures = null;
	let showAllSources = null;

	for (let i = 0; i < sub.length; i++) {
		const hashPart = sub[i];

		if (hashPart.startsWith(HASH_SUBCLASS)) subclasses = hashPart.slice(HASH_SUBCLASS.length).split(HASH_LIST_SEP);
		if (hashPart.startsWith(HASH_FEATURE)) feature = hashPart;
		if (hashPart.startsWith(HASH_HIDE_FEATURES)) hideClassFeatures = hashPart.slice(HASH_HIDE_FEATURES.length) === "true";
		if (hashPart.startsWith(HASH_ALL_SOURCES)) showAllSources = hashPart.slice(HASH_ALL_SOURCES.length) === "true";
	}

	const hideOtherSources = showAllSources === null || showAllSources === false;

	// deselect any pills that would be hidden
	if (subclasses !== null && hideOtherSources) {
		const toDeselect = [];
		$(`.${CLSS_SUBCLASS_PILL}.${CLSS_NON_STANDARD_SOURCE}.${CLSS_ACTIVE}`).each(function () {
			const $this = $(this);
			const thisSc = getEncodedSubclass($this.attr(ATB_DATA_SC), $this.attr(ATB_DATA_SRC));
			if ($.inArray(subclasses, thisSc)) {
				toDeselect.push(thisSc)
			}
		});
		const toKeep = subclasses.filter(sc => toDeselect.indexOf(sc) < 0);
		if (toKeep.length !== subclasses.length) {
			const newHashStack = [];
			for (let i = 0; i < sub.length; i++) {
				const hashPart = sub[i];

				if (!hashPart.startsWith(HASH_SUBCLASS)) newHashStack.push(hashPart);
				else if (toKeep.length > 0) newHashStack.push(HASH_SUBCLASS + toKeep.join(HASH_LIST_SEP))
			}
			const curParts = _getHashParts();
			if (curParts.length > 1) {
				const newParts = [curParts[0]].concat(newHashStack);
				window.location.hash = HASH_START + newParts.join(HASH_PART_SEP);
			}
			return;
		}
	}

	if (subclasses !== null) {
		updateClassTableLinks();

		const $toShow = [];
		const $toHide = [];
		const $subClassSpanList = $(`.${CLSS_SUBCLASS_PILL}`);
		$subClassSpanList.each(
			function () {
				const $this = $(this);
				const thisSc = getEncodedSubclass($this.attr(ATB_DATA_SC), $this.attr(ATB_DATA_SRC));
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

		if ($toShow.length === 0) {
			hideAllSubclasses();
		} else {
			const otherSrcSubFeat = $(`div.${CLSS_NON_STANDARD_SOURCE}`);
			const shownInTable = [];

			$.each($toShow, function (i, v) {
				v.addClass(CLSS_ACTIVE);
				$(`.${CLSS_SUBCLASS_FEATURE}[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).show();
				if (hideOtherSources) otherSrcSubFeat.filter(`[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).hide();
				else otherSrcSubFeat.filter(`[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).show();

				const asInTable = getTableDataScData(v.attr(ATB_DATA_SC), v.attr(ATB_DATA_SRC));
				shownInTable.push(asInTable);
				handleTableGroups(shownInTable, asInTable, true);
			});

			$.each($toHide, function (i, v) {
				v.removeClass(CLSS_ACTIVE);
				$(`.${CLSS_SUBCLASS_FEATURE}[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).hide();
				otherSrcSubFeat.filter(`[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).hide();

				const asInTable = getTableDataScData(v.attr(ATB_DATA_SC), v.attr(ATB_DATA_SRC));
				handleTableGroups(shownInTable, asInTable, false);
			});

			if (hideOtherSources) {
				otherSrcSubFeat.not(`.${CLSS_SUBCLASS_FEATURE}`).filter(`:not([${ATB_DATA_SC}]):not([${ATB_DATA_SRC}])`).hide();
				otherSrcSubFeat.not(`.${CLSS_SUBCLASS_FEATURE}`).filter(`[${ATB_DATA_SC}="${EntryRenderer.DATA_NONE}"][${ATB_DATA_SRC}="${EntryRenderer.DATA_NONE}"]`).hide();
			} else {
				otherSrcSubFeat.not(`.${CLSS_SUBCLASS_FEATURE}`).filter(`:not([${ATB_DATA_SC}]):not([${ATB_DATA_SRC}])`).show();
				otherSrcSubFeat.not(`.${CLSS_SUBCLASS_FEATURE}`).filter(`[${ATB_DATA_SC}="${EntryRenderer.DATA_NONE}"][${ATB_DATA_SRC}="${EntryRenderer.DATA_NONE}"]`).show();
			}
		}

		// show subclass prefixes if we're displaying more than 1 subclass
		if ($toShow.length !== 1) {
			$(`.${CLSS_SUBCLASS_PREFIX}`).show();
		} else {
			$(`.${CLSS_SUBCLASS_PREFIX}`).hide();
		}
	} else {
		hideAllSubclasses();
	}

	// hide class features as required
	const cfToggle = $(`#${ID_CLASS_FEATURES_TOGGLE}`);
	const allCf = $(`.${CLSS_CLASS_FEATURE}`);
	const toToggleCf = allCf.not(`.${CLSS_GAIN_SUBCLASS_FEATURE}`);
	const isHideClassFeatures = hideClassFeatures !== null && hideClassFeatures;
	// if showing no subclass and hiding class features, hide the "gain a feature at this level" labels
	if (isHideClassFeatures && subclasses === null) {
		allCf.hide();
		$(`#please-select-message`).addClass("showing");
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

	// show UA/etc pills as required
	const srcToggle = $(`#${ID_OTHER_SOURCES_TOGGLE}`);
	const toToggleSrc = $(`.${CLSS_SUBCLASS_PILL}.${CLSS_NON_STANDARD_SOURCE}`);
	if (hideOtherSources) {
		srcToggle.removeClass(CLSS_OTHER_SOURCES_ACTIVE);
		toToggleSrc.hide();
	} else {
		srcToggle.addClass(CLSS_OTHER_SOURCES_ACTIVE);
		toToggleSrc.show();
	}

	// scroll to the linked feature if required
	if (feature !== null && (prevFeature === null || prevFeature !== feature)) {
		document.getElementById($(`[${ATB_DATA_FEATURE_LINK}="${feature}"]`)[0].getAttribute(ATB_DATA_FEATURE_ID)).scrollIntoView();
		prevFeature = feature;
	}

	updateClassTableLinks();

	function handleTableGroups (shownInTable, tableDataTag, show) {
		$(`[data-subclass-list]`).each(
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
						if (show) $this.show();
						else $this.hide();
						break;
					}
				}
			}
		);
	}

	function updateClassTableLinks () {
		const hashParts = curHash.slice(1).split(HASH_PART_SEP);
		const outParts = [];
		for (let i = 0; i < hashParts.length; i++) {
			const part = hashParts[i];
			if (!part.startsWith(HASH_FEATURE)) outParts.push(part);
		}
		$(`.${CLSS_FEATURE_LINK}`).each(
			function () {
				const $this = $(this);
				this.href = HASH_START + outParts.join(HASH_PART_SEP) + HASH_PART_SEP + $this.attr(ATB_DATA_FEATURE_LINK);
			}
		)
	}

	function hideAllSubclasses () {
		updateClassTableLinks();
		$(`.${CLSS_SUBCLASS_PILL}`).removeClass(CLSS_ACTIVE);
		$(`.${CLSS_SUBCLASS_FEATURE}`).hide();
		$(`.${CLSS_SUBCLASS_PREFIX}`).hide();
		const allNonstandard = $(`div.${CLSS_NON_STANDARD_SOURCE}`);
		allNonstandard.hide();
		// if we're showing features from other sources, make sure these stay visible
		if (!hideOtherSources) {
			allNonstandard.not(`.${CLSS_SUBCLASS_FEATURE}`).not(`.${CLSS_SUBCLASS_PILL}`).show();
		}
		// hide all table col groups
		// TODO add handling for non-standard sources if UA non-caster->caster subclass are introduced
		$(`[data-subclass-list]`).each(
			function () {
				$(this).hide();
			}
		);
	}
}
