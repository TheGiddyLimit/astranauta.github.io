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

let tableDefault;
let statsProfDefault;
let classTableDefault;

let classes;
let list;
let subclassComparisonView;

const jsonURL = "data/classes.json";

const renderer = new EntryRenderer();

window.onload = function load () {
	tableDefault = $("#pagecontent").html();
	statsProfDefault = $("#statsprof").html();
	classTableDefault = $("#classtable").html();

	DataUtil.loadJSON(jsonURL, onJsonLoad);
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

function cleanScSource (source) {
	return Parser._getSourceStringFromSource(source);
}

function setSourceState (toState) {
	const hash = window.location.hash;
	if (hash.includes(HASH_SOURCES)) {
		// handle old hash style
		History.cleanSetHash(hash.replace(/sources:(\d|true|false)/, `${HASH_SOURCES}${toState}`));
	} else {
		History.cleanSetHash(`${hash}${HASH_PART_SEP}${HASH_SOURCES}${toState}`)
	}
}

const sourceFilter = new Filter({
	header: FilterBox.SOURCE_HEADER,
	minimalUI: true,
	items: ["Core", "Others"],
	selFn: (it) => it === "Core"
});
const filterBox = initFilterBox(sourceFilter);
function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ['name', 'source', 'uniqueid'],
		listClass: "classes"
	});

	const invocFeature = data.class
		.find(it => it.name === "Warlock" && it.source === SRC_PHB).classFeatures[1]
		.find(f => f.name === "Eldritch Invocations");
	if (invocFeature) {
		const toRemove = invocFeature.entries.findIndex(it => it.type === "options");
		const toSwitch = invocFeature.entries.findIndex(it => it.includes("Your invocation options are detailed at the end of the class description."));
		if (toRemove !== -1 && toSwitch !== -1) {
			invocFeature.entries[toSwitch] = {
				type: "inlineBlock",
				entries: [
					"At 2nd level, you gain two eldritch invocations of your choice. See the ",
					{
						"type": "link",
						"href": {
							"type": "internal",
							"path": "invocations.html"
						},
						"text": "Invocations page"
					},
					" for the list of available options. When you gain certain warlock levels, you gain additional invocations of your choice."
				]
			};
			invocFeature.entries.splice(toRemove, 1);
		}
	}
	addClassData(data);

	BrewUtil.addBrewData(handleBrew);
	BrewUtil.makeBrewButton("manage-brew");
	BrewUtil.bindList(list);
	BrewUtil.bindFilters(filterBox, sourceFilter);

	function handleBrew (homebrew) {
		addClassData(homebrew);
		addSubclassData(homebrew);
	}

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	History.init();
	initCompareMode();
	initReaderMode();

	History.initialLoad = false;
	filterBox.render();
	handleFilterChange()
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const c = classes[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			c._fSource
		);
	});
}

function addClassData (data) {
	if (!data.class || !data.class.length) return;

	// alphabetically sort subclasses
	for (const c of data.class) {
		c.subclasses = c.subclasses.sort((a, b) => SortUtil.ascSort(a.name, b.name));
	}

	// for any non-standard source classes, mark subclasses from the same source as "forceStandard"
	data.class.filter(c => isNonstandardSource(c.source) || BrewUtil.hasSourceJson(c.source)).forEach(c => c.subclasses.filter(sc => sc.source === c.source).forEach(sc => sc.source = {"source": sc.source, "forceStandard": true}));

	let i = 0;
	if (!classes) {
		classes = data.class;
	} else {
		i = classes.length;
		classes = classes.concat(data.class);
	}

	const classTable = $("ul.classes");
	let tempString = "";
	for (; i < classes.length; i++) {
		const curClass = classes[i];
		curClass._fSource = isNonstandardSource(curClass.source) ? "Others" : "Core";
		tempString +=
			`<li class="row" ${FLTR_ID}="${i}" ${curClass.uniqueId ? `data-unique-id="${curClass.uniqueId}"` : ""}>
				<a id='${i}' href='${getClassHash(curClass)}' title='${curClass.name}'>
					<span class='name col-xs-8'>${curClass.name}</span>
					<span class='source col-xs-4 text-align-center source${Parser.sourceJsonToAbv(curClass.source)}' title='${Parser.sourceJsonToFull(curClass.source)}'>${Parser.sourceJsonToAbv(curClass.source)}</span>
					<span class="uniqueid hidden">${curClass.uniqueId ? curClass.uniqueId : i}</span>
				</a>
			</li>`;
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	classTable.append(tempString);
	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");

	if (!History.initialLoad) {
		filterBox.render();
		handleFilterChange();
	}
}

function getSubclassStyles (sc) {
	const styleClasses = [CLSS_SUBCLASS_FEATURE];
	const nonStandard = isNonstandardSource(sc.source) || hasBeenReprinted(sc.shortName, sc.source);
	if (nonStandard) styleClasses.push(CLSS_NON_STANDARD_SOURCE);
	if (subclassIsFreshUa(sc)) styleClasses.push(CLSS_FRESH_UA);
	if (BrewUtil.hasSourceJson(cleanScSource(sc.source))) styleClasses.push(CLSS_HOMEBREW_SOURCE);
	return styleClasses;
}

function subclassIsFreshUa (sc) {
	// only tag reprinted UA
	if (isNonstandardSource(sc.source) || hasBeenReprinted(sc.shortName, sc.source)) {
		// special cases
		if (sc.name === "Knowledge Domain (PSA)" && sc.source === SRC_PSA) return false;
		if (sc.name === "Deep Stalker (UA)" && sc.source === SRC_UALDR) return false;
		if (sc.name.includes("Favored Soul")) return false;
		if (sc.name === "Shadow (UA)" && sc.source === SRC_UALDR) return false;
		if (sc.name === "The Undying Light (UA)" && sc.source === SRC_UALDR) return false;

		const nonUa = curClass.subclasses.find(pub => !isNonstandardSource(pub.source) && sc.name.replace(/(v\d+)?\s*\((UA|SCAG|PSA|Livestream)\)/, "").trim() === pub.name);
		if (nonUa) return false;
	}
	return true;
}

function addSubclassData (data) {
	if (!data.subclass || !data.subclass.length) return;

	const scData = data.subclass;
	scData.forEach(subClass => {
		// get the class
		const c = classes.find(c => c.name.toLowerCase() === subClass.class.toLowerCase());
		if (!c) {
			alert(`Could not add subclass; could not find class with name: ${subClass.class}`);
			return;
		}

		c.subclasses = c.subclasses.concat(subClass);

		// sort subclasses
		c.subclasses = c.subclasses.sort((a, b) => SortUtil.ascSort(a.name, b.name));
	});
	History.hashChange();
}

let curClass;
function loadhash (id) {
	$("#pagecontent").html(tableDefault);
	$("#statsprof").html(statsProfDefault);
	$("#classtable").html(classTableDefault);
	curClass = classes[id];

	// name
	$("th#nameTable").html(curClass.name);
	$("th#nameSummary").html(curClass.name);
	if (curClass.authors) {
		$("th#author").html(`By ${curClass.authors.join(", ")}`).show();
	} else {
		$("th#author").html("").hide();
	}

	// SUMMARY SIDEBAR =================================================================================================
	// hit dice and HP
	const hdEntry = {toRoll: [curClass.hd], rollable: true};
	$("td#hp div#hitdice span").html(EntryRenderer.getEntryDice(hdEntry, "Hit die"));
	$("td#hp div#hp1stlevel span").html(curClass.hd.faces + " + your Constitution modifier");
	$("td#hp div#hphigherlevels span").html(`${EntryRenderer.getEntryDice(hdEntry, "Hit die")} (or ${(curClass.hd.faces / 2 + 1)}) + your Constitution modifier per ${curClass.name} level after 1st`);

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
		return skills.from.length === 18 ? `Choose any ${numString}.` : `Choose ${numString} from ${CollectionUtil.joinConjunct(skills.from, ", ", ", and ")}.`
	}

	// starting equipment
	const sEquip = curClass.startingEquipment;
	const fromBackground = sEquip.additionalFromBackground ? "<p>You start with the following items, plus anything provided by your background.</p>" : "";
	const defList = sEquip.default.length === 0 ? "" : `<ul><li>${sEquip.default.join("</li><li>")}</ul>`;
	const goldAlt = sEquip.goldAlternative === undefined ? "" : `<p>Alternatively, you may start with ${sEquip.goldAlternative} gp to buy your own equipment.</p>`;
	$("#equipment").find("div").html(`${fromBackground}${defList}${goldAlt}`);

	// FEATURE TABLE ===================================================================================================
	renderer.resetHeaderIndex();
	const tData = curClass.classTableGroups;
	const groupHeaders = $("#groupHeaders");
	const colHeaders = $("#colHeaders");
	const levelTrs = [];
	for (let i = 0; i < tData.length; i++) {
		const tGroup = tData[i];

		const hasTitle = tGroup.title !== undefined;
		let subclassData = "";
		if (tGroup.subclasses !== undefined) {
			subclassData = `${ATB_DATA_SC_LIST}="${tGroup.subclasses.map(s => getTableDataScData(s.name, cleanScSource(s.source))).join(ATB_DATA_LIST_SEP)}"`;
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
				renderer.recursiveEntryRender(entry, stack, "", "");
				tr.append(`<td class="centred-col" ${subclassData}>${stack.join("")}</td>`)
			}
		}
	}

	// FEATURE DESCRIPTIONS & FLUFF ====================================================================================
	const renderStack = [];
	renderer.setFirstSection(true);
	const topBorder = $("#ftTopBorder");

	// FLUFF
	if (curClass.fluff) {
		renderer.recursiveEntryRender({type: "section", name: curClass.name, entries: curClass.fluff}, renderStack, 0, `<tr class="text ${CLSS_CLASS_FLUFF}"><td colspan="6">`, `</td></tr>`, true);
	}

	// FEATURE DESCRIPTIONS
	let subclassIndex = 0; // the subclass array is not 20 elements
	for (let i = 0; i < levelTrs.length; i++) {
		// track class table feature names
		const tblLvlFeatures = levelTrs[i].find(".features");
		// used to build class table
		const featureLinks = [];

		// add class features to render stack
		const lvlFeatureList = curClass.classFeatures[i];
		for (let j = 0; j < lvlFeatureList.length; j++) {
			const feature = lvlFeatureList[j];
			const idLevelPart = UrlUtil.encodeForHash(` ${i + 1}`);
			const featureId = `${HASH_FEATURE}${UrlUtil.encodeForHash(feature.name)}${idLevelPart}`;

			const featureLinkPart = `${HASH_FEATURE}${UrlUtil.encodeForHash(feature.name)}${idLevelPart}`;
			const featureLink = $(`<a href="${getClassHash(curClass)}${HASH_PART_SEP}${featureLinkPart}" class="${CLSS_FEATURE_LINK}" ${ATB_DATA_FEATURE_LINK}="${featureLinkPart}" ${ATB_DATA_FEATURE_ID}="${featureId}">${feature.name}</a>`);
			featureLink.click(function () {
				document.getElementById(featureId).scrollIntoView();
			});
			if (feature.type !== "inset") featureLinks.push(featureLink);

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

						const styleClasses = getSubclassStyles(subClass);
						renderer.recursiveEntryRender(subFeature, renderStack, 0, `<tr class="${styleClasses.join(" ")}" ${ATB_DATA_SC}="${subClass.name}" ${ATB_DATA_SRC}="${cleanScSource(subClass.source)}"><td colspan="6">`, `</td></tr>`, true);
					}
				}
				subclassIndex++;
			}
		}

		// render class table feature names
		if (featureLinks.length === 0) tblLvlFeatures.html("\u2014");
		else {
			featureLinks.forEach(($it, j) => {
				tblLvlFeatures.append($it);
				if (j < featureLinks.length - 1) tblLvlFeatures.append(", ");
			})
		}
	}
	topBorder.after(renderStack.join(""));

	// hide UA/other sources by default
	$(`.${CLSS_NON_STANDARD_SOURCE}`).not(`.${CLSS_SUBCLASS_PILL}`).not(`.${CLSS_PANEL_LINK}`).hide();

	// CLASS FEATURE/UA/SUBCLASS PILL BUTTONS ==========================================================================
	const subclassPillWrapper = $("div#subclasses");
	// remove any from previous class
	subclassPillWrapper.find("span").remove();

	// show/hide class features pill
	makeGenericTogglePill("Class Features", CLSS_CLASS_FEATURES_ACTIVE, ID_CLASS_FEATURES_TOGGLE, HASH_HIDE_FEATURES, true, "Toggle class features");
	makeGenericTogglePill("Detail Info", CLSS_FLUFF_ACTIVE, ID_FLUFF_TOGGLE, HASH_SHOW_FLUFF, false, "Toggle class detail information (Source: Xanathar's Guide to Everything)");

	// show/hide UA/other sources
	makeSourceCyclePill();

	// spacer before the subclass pills
	subclassPillWrapper.append($(`<span class="divider">`));

	// subclass pills
	const subClasses = curClass.subclasses
		.map(sc => ({"name": sc.name, "source": sc.source, "shortName": sc.shortName}))
		.sort(function (a, b) {
			return SortUtil.ascSort(a.shortName, b.shortName)
		});
	for (let i = 0; i < subClasses.length; i++) {
		const nonStandardSource = isNonstandardSource(subClasses[i].source) || hasBeenReprinted(subClasses[i].shortName, subClasses[i].source);
		const styleClasses = [CLSS_ACTIVE, CLSS_SUBCLASS_PILL];
		if (nonStandardSource) styleClasses.push(CLSS_NON_STANDARD_SOURCE);
		if (subclassIsFreshUa(subClasses[i])) styleClasses.push(CLSS_FRESH_UA);
		if (BrewUtil.hasSourceJson(cleanScSource(subClasses[i].source))) styleClasses.push(CLSS_HOMEBREW_SOURCE);
		const pillText = hasBeenReprinted(subClasses[i].shortName, subClasses[i].source) ? `${subClasses[i].shortName} (${Parser.sourceJsonToAbv(subClasses[i].source)})` : subClasses[i].shortName;
		const pill = $(`<span class="${styleClasses.join(" ")}" ${ATB_DATA_SC}="${subClasses[i].name}" ${ATB_DATA_SRC}="${cleanScSource(subClasses[i].source)}" title="Source: ${Parser.sourceJsonToFull(subClasses[i].source)}"><span>${pillText}</span></span>`);
		pill.click(function () {
			handleSubclassClick($(this).hasClass(CLSS_ACTIVE), subClasses[i].name, cleanScSource(subClasses[i].source));
		});
		if (nonStandardSource) pill.hide();
		subclassPillWrapper.append(pill);
	}

	// call loadsub with a blank sub-hash, to ensure the right content is displayed
	loadsub([]);

	function makeSourceCyclePill () {
		const $pill = $(`<span title="Cycle through source types" id="${ID_OTHER_SOURCES_TOGGLE}" data-state="0" style="min-width: 8em;"><span>${STRS_SOURCE_STATES[0]}</span></span>`);
		subclassPillWrapper.append($pill);
		$pill.click(() => {
			let state = Number($pill.attr("data-state"));
			if (++state > 2) state = 0;
			$pill.attr("data-state", state);
			$pill.find(`span`).text(STRS_SOURCE_STATES[state]);
			setSourceState(state);
		});
	}

	// helper functions
	function makeGenericTogglePill (pillText, pillActiveClass, pillId, hashKey, defaultActive, title) {
		const pill = $(`<span title="${title}" id="${pillId}"><span>${pillText}</span></span>`);
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

			History.cleanSetHash(outStack.join(HASH_PART_SEP));
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

		History.cleanSetHash(outStack.join(HASH_PART_SEP));
	}
}

let prevFeature = null;
let prevSub = null;
function loadsub (sub) {
	const curHash = window.location.hash;

	let subclasses = null;
	let feature = null;
	let hideClassFeatures = null;
	let showFluff = null;
	let sources = null;
	let bookView = null;
	let comparisonView = null;

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

	const hideAllSources = !ClassBookView.active && (sources === null || sources === STR_SOURCES_OFFICIAL);
	const hideSomeSources = !ClassBookView.active && sources === STR_SOURCES_MIXED;

	// deselect any pills that would be hidden
	if (subclasses !== null && (hideAllSources || hideSomeSources)) {
		const toDeselect = [];
		const $toCheckBase = $(`.${CLSS_SUBCLASS_PILL}.${CLSS_NON_STANDARD_SOURCE}.${CLSS_ACTIVE}`);
		const $toCheck = hideAllSources ? $toCheckBase : $toCheckBase.not(`.${CLSS_FRESH_UA}`);
		$toCheck.each(function () {
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
			const curParts = History._getHashParts();
			if (curParts.length > 1) {
				const newParts = [curParts[0]].concat(newHashStack);
				History.cleanSetHash(HASH_START + newParts.join(HASH_PART_SEP));
			}
			return;
		}
	}

	if (subclasses !== null) {
		updateClassTableLinks();
		updateNavLinks();

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

		ClassBookView.updateVisible($toShow, $toHide);

		if ($toShow.length === 0) {
			hideAllSubclasses();
		} else {
			const otherSrcSubFeat = $(`#pagecontent`).find(`div.${CLSS_NON_STANDARD_SOURCE}`);
			const shownInTable = [];

			$.each($toShow, function (i, v) {
				v.addClass(CLSS_ACTIVE);
				$(`.${CLSS_SUBCLASS_FEATURE}[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).show();
				if (hideAllSources || hideSomeSources) otherSrcSubFeat.filter(`[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).hide();
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
		hideAllSubclasses();
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
		if (!showFluff) $(`#please-select-message`).addClass("showing");
		else $(`#please-select-message`).removeClass("showing");
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
	if (feature !== null && (prevFeature === null || prevFeature !== feature)) {
		document.getElementById($(`[${ATB_DATA_FEATURE_LINK}="${feature}"]`)[0].getAttribute(ATB_DATA_FEATURE_ID)).scrollIntoView();
		prevFeature = feature;
	}

	updateClassTableLinks();
	updateNavLinks();

	if (bookView) ClassBookView.open();
	else ClassBookView.teardown();

	if (comparisonView && subclassComparisonView) subclassComparisonView.open();
	else if (subclassComparisonView) subclassComparisonView.teardown();

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

	function updateNavLinks () {
		function makeScroller ($nav, idClass, displayText, scrollTo) {
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
			if (typeof navClass != 'undefined') {
				$(`<div class="nav-item ${navClass}">${displayText}</div>`).on("click", () => {
					const $it = $(`[data-title-index="${scrollTo}"]`);
					if ($it.get()[0]) $it.get()[0].scrollIntoView();
				}).appendTo($nav);
			}
		}

		if (!CollectionUtil.arrayEq(prevSub, sub)) { // checking array equality is faster than hitting the DOM
			setTimeout(() => {
				const $nav = $(`#sticky-nav`);
				const $navBody = $nav.find(`.nav-body`).empty();
				$nav.find(`.nav-head`).find(`div`).off("click").on("click", () => {
					// $navBody.toggle();
					$nav.remove();
				});
				const $titles = $(`.entry-title`);
				$titles.each((i, e) => {
					const $e = $(e);
					const pClass = $e.parent().attr("class").trim();
					if (pClass === "statsInlineHead") return; // consider enabling these for e.g. maneuvers?
					if (!$e.is(":visible")) return;
					const displayText = $e.contents().filter(function () {
						return this.nodeType === 3;
					})[0].nodeValue.replace(/[:.]$/g, "");
					const scrollTo = $e.data("title-index");
					makeScroller($navBody, pClass, displayText, scrollTo);
				});
			}, 5); // delay hack to allow rendering to catch up
		}
		prevSub = sub;
	}

	function hideAllSubclasses () {
		updateClassTableLinks();
		updateNavLinks();
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
		$(`[data-subclass-list]`).each(
			function () {
				$(this).hide();
			}
		);
	}
}

function initCompareMode () {
	subclassComparisonView = new BookModeView(
		"compview", $(`#btn-comparemode`), "Please select some subclasses first",
		($tbl) => {
			const renderStack = [];
			const numScLvls = curClass.subclasses[0].subclassFeatures.length;
			for (let i = 0; i < numScLvls; ++i) {
				renderStack.push(`<tr>`);
				curClass.subclasses.forEach((sc, j) => {
					renderStack.push(`<td class="subclass-features-${j} ${getSubclassStyles(sc).join(" ")}">`);
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
			curClass.subclasses.forEach((sc, i) => {
				const $pill = $(`.sc-pill[data-subclass="${sc.name}"]`);
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

const ClassBookView = {
	SUBHASH: `${HASH_BOOK_VIEW}true`,
	bookViewActive: false,
	_$body: null,
	_$wrpBook: null,
	_$bkTbl: null,
	_$scToggles: {},

	open: () => {
		function tglCf ($bkTbl, $cfToggle) {
			$bkTbl.find(`.class-features`).toggle();
			$cfToggle.toggleClass("cf-active");
		}

		function hashTeardown () {
			History.cleanSetHash(window.location.hash.replace(ClassBookView.SUBHASH, ""));
		}

		if (ClassBookView.active) return;
		ClassBookView.active = true;

		setSourceState(STR_SOURCES_ALL);

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
		renderer.recursiveEntryRender({type: "section", name: curClass.name}, renderStack, 0, `<tr><td colspan="6">`, `</td></tr>`, true);

		renderStack.push(`<tr class="class-features"><td colspan="6">`);
		curClass.classFeatures.forEach(lvl => {
			lvl.forEach(cf => {
				renderer.recursiveEntryRender(cf, renderStack);
			});
		});
		renderStack.push(`</td></tr>`);

		curClass.subclasses.forEach((sc, i) => {
			renderStack.push(`<tr class="subclass-features-${i} ${getSubclassStyles(sc).join(" ")}"><td colspan="6">`);
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

		curClass.subclasses.forEach((sc, i) => {
			const name = hasBeenReprinted(sc.shortName, sc.source) ? `${sc.shortName} (${Parser.sourceJsonToAbv(sc.source)})` : sc.shortName;
			const styles = getSubclassStyles(sc);
			const $pill = $(`.sc-pill[data-subclass="${sc.name}"][data-source="${sc.source}"]`);

			const $scToggle = $(`<span class="pnl-link active ${styles.join(" ")}" title="Source: ${Parser.sourceJsonToFull(sc.source)}" data-i="${i}" data-bk-subclass="${sc.name}" data-bk-source="${sc.source}">${name}</span>`).on("click", () => {
				ClassBookView.tglSc($bkTbl, $scToggle, i);
				$pill.click();
			});

			if (!($pill.hasClass("active"))) {
				ClassBookView.tglSc($bkTbl, $scToggle, i);
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
	},

	teardown: () => {
		if (ClassBookView.active) {
			ClassBookView._$bkTbl = null;
			ClassBookView._$scToggles = {};

			ClassBookView._$body.css("overflow", "");
			ClassBookView._$wrpBook.remove();
			ClassBookView.active = false;
		}
	},

	tglSc: ($bkTbl, $scToggle, i) => {
		$bkTbl.find(`.subclass-features-${i}`).toggle();
		$scToggle.toggleClass("active");
	},

	updateVisible: ($toShow, $toHide) => {
		function doUpdate ($list, show) {
			$list.map($p => {
				const $it = ClassBookView._$wrpBook.find(`.pnl-link[data-bk-subclass="${$p.attr(ATB_DATA_SC)}"][data-bk-source="${$p.attr(ATB_DATA_SRC)}"]`);
				if ($it.length) {
					const index = $it.data("i");
					const $real = ClassBookView._$scToggles[index];
					if (show && !$real.hasClass("active")) {
						ClassBookView.tglSc(ClassBookView._$bkTbl, $real, Number(index));
					} if (!show && $real.hasClass("active")) {
						ClassBookView.tglSc(ClassBookView._$bkTbl, $real, Number(index));
					}
				}
			});
		}

		if (ClassBookView.active) {
			// $toShow/$toHide are lists of subclass pills
			doUpdate($toShow, true);
			doUpdate($toHide, false);
		}
	}
};

function initReaderMode () {
	$(`#btn-readmode`).on("click", () => {
		History.cleanSetHash(`${window.location.hash}${HASH_PART_SEP}${ClassBookView.SUBHASH}`);
	});
}
