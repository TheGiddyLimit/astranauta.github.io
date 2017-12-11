"use strict";
const ITEMS_JSON_URL = "data/items.json";
const BASIC_ITEMS_JSON_URL = "data/basicitems.json";
const MAGIC_VARIANTS_JSON_URL = "data/magicvariants.json";
let tabledefault = "";
let itemList;
let basicItemList;
const propertyList = {};
const typeList = {};
let variantList;

window.onload = function load() {
	loadJSON(ITEMS_JSON_URL, addBasicItems);
};

function addBasicItems(itemData) {
	itemList = itemData.item;
	loadJSON(BASIC_ITEMS_JSON_URL, addVariants);
}

function addVariants(basicItemData) {
	basicItemList = basicItemData.basicitem;
	const itemPropertyList = basicItemData.itemProperty;
	const itemTypeList = basicItemData.itemType;
	// Convert the property and type list JSONs into look-ups, i.e. use the abbreviation as a JSON property name
	for (let i = 0; i < itemPropertyList.length; i++) propertyList[itemPropertyList[i].abbreviation] = itemPropertyList[i].name ? JSON.parse(JSON.stringify(itemPropertyList[i])) : {"name": itemPropertyList[i].entries[0].name.toLowerCase(), "entries": itemPropertyList[i].entries};
	for (let i = 0; i < itemTypeList.length; i++) typeList[itemTypeList[i].abbreviation] = itemTypeList[i].name ? JSON.parse(JSON.stringify(itemTypeList[i])): {"name": itemTypeList[i].entries[0].name.toLowerCase(), "entries": itemTypeList[i].entries};
	loadJSON(MAGIC_VARIANTS_JSON_URL, mergeBasicItems);
}

function mergeBasicItems(variantData) {
	variantList = variantData.variant;
	itemList = itemList.concat(basicItemList);
	for (let i = 0; i < variantList.length; i++) {
		variantList[i].tier = variantList[i].inherits.tier;
		variantList[i].rarity = variantList[i].inherits.rarity;
		variantList[i].source = variantList[i].inherits.source;
		variantList[i].page = variantList[i].inherits.page;
		if(!variantList[i].entries && variantList[i].inherits.entries) variantList[i].entries=JSON.parse(JSON.stringify(variantList[i].inherits.entries));
		if(variantList[i].requires.armor) variantList[i].armor = variantList[i].requires.armor
	}
	itemList = itemList.concat(variantList);
	for (let i = 0; i < basicItemList.length; i++) {
		const curBasicItem = basicItemList[i];
		basicItemList[i].category = "Basic";
		if(curBasicItem.entries === undefined) curBasicItem.entries=[];
		const curBasicItemName = curBasicItem.name.toLowerCase();
		for (let j = 0; j < variantList.length; j++) {
			const curVariant = variantList[j];
			const curRequires = curVariant.requires;
			let hasRequired = curBasicItemName.indexOf(" (") === -1;
			for (const requiredProperty in curRequires) if (curRequires.hasOwnProperty(requiredProperty) && curBasicItem[requiredProperty] !== curRequires[requiredProperty]) hasRequired=false;
			if (curVariant.excludes) {
				const curExcludes = curVariant.excludes;
				for (const excludedProperty in curExcludes) if (curExcludes.hasOwnProperty(excludedProperty) && curBasicItem[excludedProperty] === curExcludes[excludedProperty]) hasRequired=false;
			}
			if (hasRequired) {
				const curInherits = curVariant.inherits;
				const tmpBasicItem = JSON.parse(JSON.stringify(curBasicItem));
				delete tmpBasicItem.value; // Magic items do not inherit the value of the non-magical item
				tmpBasicItem.category = "Specific Variant";
				for (const inheritedProperty in curInherits) {
					if (curInherits.hasOwnProperty(inheritedProperty)) {
						if (inheritedProperty === "namePrefix") {
							tmpBasicItem.name = curInherits.namePrefix+tmpBasicItem.name;
						} else if (inheritedProperty === "nameSuffix") {
							tmpBasicItem.name += curInherits.nameSuffix;
						} else if (inheritedProperty === "entries") {
							for (let k = curInherits.entries.length-1; k > -1; k--) {
								let tmpText = curInherits.entries[k];
								if (typeof tmpText === "string") {
									if (tmpBasicItem.dmgType) tmpText = tmpText.replace(/{@dmgType}/g, Parser.dmgTypeToFull(tmpBasicItem.dmgType));
									if (curInherits.genericBonus) tmpText = tmpText.replace(/{@genericBonus}/g, curInherits.genericBonus);
									if (tmpText.indexOf("{@lowerName}") !== -1) tmpText = tmpText.split("{@lowerName}").join(curBasicItemName);
								}
								tmpBasicItem.entries.unshift(tmpText);
							}
						} else
							tmpBasicItem[inheritedProperty] = curInherits[inheritedProperty];
					}
				}
				itemList.push(tmpBasicItem);
			}
		}
	}
	enhanceItems();
}

function pushObject(targetObject, objectToBePushed) {
	const copiedObject = JSON.parse(JSON.stringify(targetObject));
	copiedObject.push(objectToBePushed);
	return copiedObject;
}

function enhanceItems() {
	for (let i = 0; i < itemList.length; i++) {
		const item = itemList[i];
		if (item.noDisplay) continue;
		if (itemList[i].type === "GV") itemList[i].category = "Generic Variant";
		if (itemList[i].category === undefined) itemList[i].category = "Other";
		if (item.entries === undefined) itemList[i].entries=[];
		if (item.type && typeList[item.type]) for (let j = 0; j < typeList[item.type].entries.length; j++) itemList[i].entries = pushObject(itemList[i].entries,typeList[item.type].entries[j]);
		if (item.property) {
			const properties = item.property.split(",");
			for (let j = 0; j < properties.length; j++) if (propertyList[properties[j]].entries) for (let k = 0; k < propertyList[properties[j]].entries.length; k++) itemList[i].entries = pushObject(itemList[i].entries,propertyList[properties[j]].entries[k]);
		}
		//The following could be encoded in JSON, but they depend on more than one JSON property; maybe fix if really bored later
		if (item.armor) {
			if (item.resist) itemList[i].entries = pushObject(itemList[i].entries,"You have resistance to "+item.resist+" damage while you wear this armor.");
			if (item.armor && item.stealth) itemList[i].entries = pushObject(itemList[i].entries,"The wearer has disadvantage on Stealth (Dexterity) checks.");
			if (item.type === "HA" && item.strength) itemList[i].entries = pushObject(itemList[i].entries,"If the wearer has a Strength score lower than " + item.strength + ", their speed is reduced by 10 feet.");
		} else if (item.resist) {
			if (item.type === "P") itemList[i].entries = pushObject(itemList[i].entries,"When you drink this potion, you gain resistance to "+item.resist+" damage for 1 hour.");
			if (item.type === "RG") itemList[i].entries = pushObject(itemList[i].entries,"You have resistance to "+item.resist+" damage while wearing this ring.");
		}
		if (item.type === "SCF") {
			if (item.scfType === "arcane") itemList[i].entries = pushObject(itemList[i].entries,"An arcane focus is a special item designed to channel the power of arcane spells. A sorcerer, warlock, or wizard can use such an item as a spellcasting focus, using it in place of any material component which does not list a cost.");
			if (item.scfType === "druid") itemList[i].entries = pushObject(itemList[i].entries,"A druid can use such a druidic focus as a spellcasting focus, using it in place of any material component that does not have a cost.");
			if (item.scfType === "holy") {
				itemList[i].entries = pushObject(itemList[i].entries,"A holy symbol is a representation of a god or pantheon.");
				itemList[i].entries = pushObject(itemList[i].entries,"A cleric or paladin can use a holy symbol as a spellcasting focus, using it in place of any material components which do not list a cost. To use the symbol in this way, the caster must hold it in hand, wear it visibly, or bear it on a shield.");
			}
		}
	}
	populateTablesAndFilters();
}

function rarityValue(rarity) { //Ordered by most frequently occuring rarities in the JSON
	if (rarity === "Rare") return 3;
	if (rarity === "None") return 0;
	if (rarity === "Uncommon") return 2;
	if (rarity === "Very Rare") return 4;
	if (rarity === "Legendary") return 5;
	if (rarity === "Artifact") return 6;
	if (rarity === "Unknown") return 7;
	if (rarity === "Common") return 1;
	return 0;
}

function sortItems(a, b, o) {
	if (o.valueName === "name") {
		return b._values.name.toLowerCase() > a._values.name.toLowerCase() ? 1 : -1;
	} else if (o.valueName === "type") {
		if (b._values.type === a._values.type) return compareNames(a, b);
		return b._values.type.toLowerCase() > a._values.type.toLowerCase() ? 1 : -1;
	} else if (o.valueName === "source") {
		if (b._values.source === a._values.source) return compareNames(a, b);
		return b._values.source.toLowerCase() > a._values.source.toLowerCase() ? 1 : -1;
	} else if (o.valueName === "rarity") {
		if (b._values.rarity === a._values.rarity) return compareNames(a, b);
		return rarityValue(b._values.rarity) > rarityValue(a._values.rarity) ? 1 : -1;
	} else return 1;
}

function deselectFilter(deselectProperty, deselectValue) {
	return function(val) {
		if (window.location.hash.length) {
			const itemProperty = itemList[getSelectedListElement().attr("id")][deselectProperty];
			if (itemProperty === deselectValue) {
				return deselNoHash();
			} else {
				return val === deselectValue && itemProperty !== val;
			}
		} else {
			return deselNoHash();
		}

		function deselNoHash() {
			return val === deselectValue;
		}
	}
}

function populateTablesAndFilters() {
	tabledefault = $("#stats").html();

	const sourceFilter = getSourceFilter();
	const typeFilter = new Filter({header: "Type", deselFn: deselectFilter("type", "$")});
	const tierFilter = new Filter({header: "Tier", items: ["None", "Minor", "Major"]});
	const rarityFilter = new Filter({header: "Rarity", items: ["None", "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact", "Unknown"]});
	const attunementFilter = new Filter({header: "Attunement", items: ["Yes", "By...", "Optional", "No"]});
	const categoryFilter = new Filter({header: "Category", items: ["Basic", "Generic Variant", "Specific Variant", "Other"], deselFn: deselectFilter("category", "Specific Variant")});

	const filterBox = initFilterBox(sourceFilter, typeFilter, tierFilter, rarityFilter, attunementFilter, categoryFilter);
	const liList = {mundane:"", magic:""}; // store the <li> tag content here and change the DOM once for each property after the loop

	for (let i = 0; i < itemList.length; i++) {
		const curitem = itemList[i];
		const name = curitem.name;
		const rarity = curitem.rarity;
		const category = curitem.category;
		const source = curitem.source;
		const sourceAbv = Parser.sourceJsonToAbv(source);
		const sourceFull = Parser.sourceJsonToFull(source);
		const type = [];
		if (curitem.wondrous) type.push("Wondrous Item");
		if (curitem.technology) type.push(curitem.technology);
		if (curitem.age) type.push(curitem.age);
		if (curitem.weaponCategory) type.push(curitem.weaponCategory+" Weapon");
		if (curitem.type) type.push(Parser.itemTypeToAbv(curitem.type));
		curitem.typeText = type.join(", "); // for loadhash to use
		const tierTags = [];
		tierTags.push(curitem.tier ? curitem.tier : "None");
		let attunement = "No";
		if (curitem.reqAttune !== undefined) {
			if (curitem.reqAttune === "YES") {
				attunement = "Yes";
				curitem.reqAttune = "(Requires Attunement)"
			} else if (curitem.reqAttune === "OPTIONAL") {
				attunement = "Optional";
				curitem.reqAttune = "(Attunement Optional)"
			} else if (curitem.reqAttune.toLowerCase().startsWith("by")) {
				attunement = "By...";
				curitem.reqAttune = "(Requires Attunement "+curitem.reqAttune+")";
			} else {
				attunement = "Yes"; // throw any weird ones in the "Yes" category (e.g. "outdoors at night")
				curitem.reqAttune = "(Requires Attunement "+curitem.reqAttune+")";
			}
		}
		// for filter to use
		curitem._fTypes = type;
		curitem._fTier = tierTags;
		curitem._fAttunement = attunement;

		liList[rarity === "None" || rarity === "Unknown" || category === "Basic" ? "mundane" : "magic"] += `
			<li ${FLTR_ID}=${i}>
				<a id='${i}' href="#${encodeForHash(name)}_${encodeForHash(source)}" title="${name}">
					<span class='name col-xs-4'>${name}</span>
					<span class='type col-xs-4 col-xs-4-3'>${type.join(", ")}</span>
					<span class='source col-xs-1 col-xs-1-7 source${sourceAbv}' title="${sourceFull}">${sourceAbv}</span>
					<span class='rarity col-xs-2'>${rarity}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(source);
		type.forEach(t => typeFilter.addIfAbsent(t));
		tierTags.forEach(tt => tierFilter.addIfAbsent(tt));
	}
	// populate table
	$("ul.list.mundane").append(liList.mundane);
	$("ul.list.magic").append(liList.magic);
	// sort filters
	sourceFilter.items.sort(ascSort);
	typeFilter.items.sort(ascSort);

	const options = {
		valueNames: ["name", "source", "type", "rarity"],
		listClass: "mundane"
	};

	const mundanelist = search(options);
	options.listClass = "magic";
	const magiclist = search(options);

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function listFilter(item) {
		const f = filterBox.getValues();
		const i = itemList[$(item.elm).attr(FLTR_ID)];

		return sourceFilter.toDisplay(f, i.source) &&
		typeFilter.toDisplay(f, i._fTypes) &&
		tierFilter.toDisplay(f, i._fTier) &&
		rarityFilter.toDisplay(f, i.rarity) &&
		attunementFilter.toDisplay(f, i._fAttunement) &&
		categoryFilter.toDisplay(f, i.category);
	}

	function handleFilterChange() {
		mundanelist.filter(listFilter);
		magiclist.filter(listFilter);

		hideListIfEmpty(mundanelist, $(`.ele-mundane`));
		hideListIfEmpty(magiclist, $(`.ele-magic`));
	}

	function hideListIfEmpty(list, $eles) {
		if (list.visibleItems.length === 0) {
			$eles.hide();
		} else {
			$eles.show();
		}
	}

	$("#filtertools").find("button.sort").on("click", function() {
		$(this).attr("sortby", $(this).attr("sortby") === "asc" ? "desc" : "asc");
		magiclist.sort($(this).attr("sort"), { order: $(this).attr("sortby"), sortFunction: sortItems });
		mundanelist.sort($(this).attr("sort"), { order: $(this).attr("sortby"), sortFunction: sortItems });
	});

	$("#itemcontainer").find("h3").not(":has(input)").click(function() {
		if ($(this).next("ul.list").css("max-height") === "500px") {
			$(this).siblings("ul.list").animate({
				maxHeight: "250px",
				display: "block"
			});
			return;
		}
		$(this).next("ul.list").animate({
			maxHeight: "500px",
			display: "block"
		}).siblings("ul.list").animate({
			maxHeight: "0",
			display: "none"
		})
	});

	addListShowHide();
	initHistory();
	handleFilterChange();
}

const renderer = new EntryRenderer();
function loadhash (id) {
	$("#currentitem").html(tabledefault);
	const item = itemList[id];
	const source = item.source;
	const sourceFull = Parser.sourceJsonToFull(source);
	$("th#name").html(`<span class="stats-name">${item.name}</span><span class="stats-source source${item.source}" title="${Parser.sourceJsonToFull(item.source)}">${Parser.sourceJsonToAbv(item.source)}</span>`);
	$("td#source span").html(`${sourceFull}, page ${item.page}`);

	$("td span#value").html(item.value ? item.value+(item.weight ? ", " : "") : "");
	$("td span#weight").html(item.weight ? item.weight+(item.weight == 1 ? " lb." : " lbs.") : "");
	$("td span#rarity").html((item.tier ? ", "+item.tier : "")+(item.rarity ? ", "+item.rarity : ""));
	$("td span#attunement").html(item.reqAttune ? item.reqAttune : "");
	$("td span#type").html(item.typeText);

	$("span#damage").html("");
	$("span#damagetype").html("");
	const type = item.type || "";
	if (item.weaponCategory) {
		if(item.dmg1) $("span#damage").html(utils_makeRoller(item.dmg1));
		if(item.dmgType) $("span#damagetype").html(Parser.dmgTypeToFull(item.dmgType));
	} else if (type === "LA" ||type === "MA"|| type === "HA") {
		$("span#damage").html("AC "+item.ac+(type === "LA" ? " + Dex" : type === "MA" ? " + Dex (max 2)" : ""));
	} else if (type === "S") {
		$("span#damage").html("AC +"+item.ac);
	} else if (type === "MNT" || type === "VEH") {
		const speed=item.speed;
		const capacity=item.carryingcapacity;
		if (speed) $("span#damage").append("Speed="+speed);
		if (speed && capacity) $("span#damage").append(type === "MNT" ? ", " : "<br>");
		if (capacity) {
			$("span#damage").append("Carrying Capacity="+capacity);
			if (capacity.indexOf("ton") === -1 && capacity.indexOf("passenger") === -1) $("span#damage").append(capacity == 1 ? " lb." : " lbs.");
		}
	}

	$("span#properties").html("");
	if (item.property) {
		const properties = item.property.split(",");
		for (let i = 0; i < properties.length; i++) {
			const prop = properties[i];
			let a = propertyList[prop].name;
			if (prop === "V") a = `${a} (${utils_makeRoller(item.dmg2)})`;
			if (prop === "T" || prop === "A" || prop === "AF") a = `${a} (${item.range}ft.)`;
			if (prop === "RLD") a = `${a} (${item.reload} shots)`;
			a = (i > 0 ? ", " : item.dmg1 ? "- " : "") + a;
			$("span#properties").append(a);
		}
	}

	$("tr.text").remove();
	const entryList = {type: "entries", entries: item.entries};
	const renderStack = [];
	renderer.recursiveEntryRender(entryList, renderStack, 1);
	$("tr#text").after(`<tr class='text'><td colspan='6' class='text1'>${utils_makeRoller(renderStack.join("")).split(item.name.toLowerCase()).join("<i>"+item.name.toLowerCase()+"</i>")}</td></tr>`);

	$(".items span.roller").contents().unwrap();
	$("#stats span.roller").click(function() {
		const roll =$(this).attr("data-roll").replace(/\s+/g, "");
		const rollresult =  droll.roll(roll);
		const name = $(".stats-name").text();
		$("div#output").prepend(`<span>${name}: <em>${roll}</em> rolled for <strong>${rollresult.total}</strong> (<em>${rollresult.rolls.join(", ")}</em>)<br></span>`).show();
		$("div#output span:eq(5)").remove();
	})
}
