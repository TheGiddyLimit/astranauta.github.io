window.onload = function load() {
	tabledefault = $("#stats").html();

	const itemlist = itemdata.compendium.item;

	for (let i = 0; i < itemlist.length; i++) {

		let curitem = itemlist[i];
		if (curitem.type === "$") continue;

		let name = curitem.name;
		let rarity = curitem.rarity;
		let source = curitem.source;
		let sourceAbv = parse_sourceJsonToAbv(source);
		let sourceFull = parse_sourceJsonToFull(source);
		let type = curitem.type.split(",");

		for (let j = 0; j < type.length; j++) {
			type[j] = parse_itemTypeToAbv(type[j]);
			if (!$("select.typefilter option[value='"+type[j]+"']").length) $("select.typefilter").append("<option value='"+type[j]+"'>"+type[j]+"</option>");
		}

		$("ul.list."+(rarity !== "None" || curitem.reqAttune || type === "W" ? "magic" : "mundane")).append("<li><a id='"+i+"' href=\"#"+encodeURIComponent(name).toLowerCase().replace("'","%27")+"\" title=\""+name+"\"><span class='name col-xs-4'>"+name+"</span> <span class='type col-xs-4 col-xs-4-3'>"+type.join(", ")+"</span> <span class='sourcename col-xs-1 col-xs-1-7' title=\""+sourceFull+"\"><span class='source'>"+sourceAbv+"</span></span> <span class='rarity col-xs-2'>"+rarity+"</span></a></li>");

		if (!$("select.sourcefilter option[value='"+sourceAbv+"']").length) $("select.sourcefilter").append("<option title=\""+source+"\" value='"+sourceAbv+"'>"+sourceFull+"</option>");
		$("select.sourcefilter option").sort(asc_sort).appendTo("select.sourcefilter");
		$("select.sourcefilter").val("All");
	}

	const options = {
		valueNames: ["name", "source", "type", "rarity"],
		listClass: "mundane"
	};

	const mundanelist = search(options);
	options.listClass = "magic";
	const magiclist = search(options);

	$(".typefilter option").sort(asc_sort).appendTo(".typefilter");
	$("select.typefilter option[value=All]").prependTo(".typefilter");
	$(".typefilter").val("All");

	initHistory()

	$("form#filtertools select").change(function(){
		const typefilter = $("select.typefilter").val();
		const sourcefilter = $("select.sourcefilter").val();
		const rarityfilter = $("select.rarityfilter").val();

		mundanelist.filter(function(item) {
			const righttype = typefilter === "All" || item.values().type.indexOf(typefilter) !== -1;
			const rightsource = sourcefilter === "All" || item.values().source === sourcefilter;
			const rightrarity = rarityfilter === "All" || item.values().rarity === rarityfilter;
			return righttype && rightsource && rightrarity;
		});

		magiclist.filter(function(item) {
			const righttype = typefilter === "All" || item.values().type.indexOf(typefilter) !== -1;
			const rightsource = sourcefilter === "All" || item.values().source === sourcefilter;
			const rightrarity = rarityfilter === "All" || item.values().rarity === rarityfilter;
			return righttype && rightsource && rightrarity;
		});

	});

	$("#filtertools button.sort").on("click", function() {
		if ($(this).attr("sortby") === "asc") {
			$(this).attr("sortby", "desc");
		} else $(this).attr("sortby", "asc");
		magiclist.sort($(this).attr("sort"), { order: $(this).attr("sortby"), sortFunction: sortitems });
		mundanelist.sort($(this).attr("sort"), { order: $(this).attr("sortby"), sortFunction: sortitems });
	});

	$("#itemcontainer h3").not(":has(input)").click(function() {
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
}

function rarityValue(rarity) {
//Ordered by most frequently occuring rarities in the JSON
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

function sortitems(a, b, o) {
	if (o.valueName === "name") {
		return b._values.name.toLowerCase() > a._values.name.toLowerCase() ? 1 : -1;
	}

	if (o.valueName === "type") {
		if (b._values.type === a._values.type) return compareNames(a, b);
		return b._values.type.toLowerCase() > a._values.type.toLowerCase() ? 1 : -1;
	}

	if (o.valueName === "source") {
		if (b._values.source === a._values.source) return compareNames(a, b);
		return b._values.source.toLowerCase() > a._values.source.toLowerCase() ? 1 : -1;
	}

	if (o.valueName === "rarity") {
		if (b._values.rarity === a._values.rarity) return compareNames(a, b);
		return rarityValue(b._values.rarity) > rarityValue(a._values.rarity) ? 1 : -1;
	}

	return 1;
}

function emphasize (strongWords, normalWords) {
	return "<p><strong>"+strongWords+".</strong> "+normalWords+"</p>";
}

function loadhash (id) {
	const ammoGenericText="<p>If you use a weapon that has the ammunition property to make a melee attack, you treat the weapon as an improvised weapon. A sling must be loaded to deal any damage when used in this way.</p>";
	const ammoFirearmText=emphasize("Ammunition", "You can use a weapon that has the ammunition property to make a ranged attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one piece of ammunition. Drawing the ammunition from a quiver, case, or other container is part of the attack. The ammunition of a firearm is destroyed upon use.")+ammoGenericText;
	const ammoNormalText=emphasize("Ammunition", "You can use a weapon that has the ammunition property to make a ranged attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one piece of ammunition. Drawing the ammunition from a quiver, case, or other container is part of the attack. At the end of the battle, you can recover half your expended ammunition by taking a minute to search the battlefield.")+ammoGenericText;
	$("#currentitem").html(tabledefault);
	let curitem = itemdata.compendium.item[id];
	let attunetext = curitem.reqAttune
	let name = curitem.name;
	let rarity = curitem.rarity;
	let source = curitem.source;
	let textlist = curitem.text;
	let type = curitem.type.split(",");
	let value = curitem.value;
	let weight = curitem.weight;
	let texthtml = "";
	let notseenbonus=true;

	let sourceAbv = parse_sourceJsonToAbv(source);
	let sourceFull = parse_sourceJsonToFull(source);
	$("th#name").html("<span title=\""+sourceFull+"\" class='source source"+sourceAbv+"'>"+sourceAbv+"</span> "+name);
	$("td#source span").html(sourceFull+", page "+curitem.page);

	$("span#value").html("");
	if (value) {
		if (weight) value = value + ", ";
		$("td span#value").html(value);
	} else $("td span#value").html("");

	$("span#weight").html("");
	$("td span#weight").html(weight ? weight+(weight == 1 ? " lb." : " lbs.") : "");

	$("td span#attunement").html(attunetext ? "(Requires Attunement"+(attunetext === "YES" ? "" : " "+attunetext)+")" : "");

	$("tr.text").remove();

	if (textlist) {
		for (let n = 0; n < textlist.length; n++) {
			if (!textlist[n]) continue;
			let curtextstring = JSON.stringify (textlist[n]);
			if (textlist[n].istable === "YES") {
				texthtml += utils_makeTable(textlist[n]);
			} else {
				texthtml = texthtml + "<p>"+textlist[n].replace(/(Curse|Sentience|Personality)(\.|\:) /g, "<strong>$1.</strong> ")+"</p>";
			}
		}
	}

	$("td span#type").html("");
	$("span#damage").html("");
	$("span#damagetype").html("");
	for (let n = 0; n < type.length; n++) {
		let curtype = type[n];
		let indexResistance=name.indexOf(" Resistance");
		// FIXME need to add logic for handling potions and rings of resistance; probably add a "resist" property to the JSON
		// Look for: % of Life Stealing, % of Vengeance, % of Warning, % of Wounding, %, Mariner's %, Mind Blade %, Mind Carapace %, Mithral%, Nine Lives Stealer %, Quaal's Feather Token%, Vicious %, Vorpal %, Legendary Resistance, Luck, Wish, Attunement Optional, Rod of the Pact Keeper%, Handle "Word[s]: %", Scroll of Protection from %, Spell Scroll (%, type="SCF"(holy/arcane/druid) 
		if (n > 0) $("td span#type").append (", ");
		$("td span#type").append(parse_itemTypeToAbv(curtype));
		if (curtype === "MNT" || curtype === "VEH") {
			let speed=curitem.speed;
			let capacity=curitem.carryingcapacity;
			if (speed) $("span#damage").append("Speed="+speed);
			if (speed && capacity) $("span#damage").append(curtype === "MNT" ? ", " : "<br>");
			if (capacity) {
				$("span#damage").append("Carrying Capacity="+capacity);
				if (capacity.indexOf("ton") === -1 && capacity.indexOf("passenger") === -1) $("span#damage").append(capacity == 1 ? " lb." : " lbs.");
			}
		}
		if (curtype === "M" || curtype === "R" || curtype === "GUN") {
			$("span#damage").html(curitem.dmg1);
			if(curitem.dmgType) $("span#damagetype").html(parse_dmgTypeToFull(curitem.dmgType));
		}
		if (curtype === "LA" ||curtype === "MA"|| curtype === "HA") {
			if (curtype === "LA") $("span#damage").html("AC "+curitem.ac+" + Dex");
			if (curtype === "MA") $("span#damage").html("AC "+curitem.ac+" + Dex (max 2)");
			if (curtype === "HA") $("span#damage").html("AC "+curitem.ac);
			if (curitem.genericBonus) texthtml += "<p>You have a "+curitem.genericBonus+" bonus to AC while wearing this armor.</p>";
			if(indexResistance !== -1) {
				let indexElement = name.lastIndexOf(" ",indexResistance-1);
				texthtml += "<p>You have resistance to "+name.substr(indexElement,indexResistance-indexElement).toLowerCase()+" damage while you wear this armor.</p>";
			}
			if (curtype === "HA" && curitem.strength) texthtml += "<p>If the wearer has a Strength score lower than " + curitem.strength + ", their speed is reduced by 10 feet.</p>";
			if (curitem.adamantine === "YES") texthtml += "<p>This suit of armor is reinforced with adamantine, one of the hardest substances in existence. While you're wearing it, any critical hit against you becomes a normal hit.</p>";
			if (curitem.stealth === "YES") texthtml += "<p>The wearer has disadvantage on Stealth (Dexterity) checks.</p>";
		} else if (curtype === "A" || curtype === "AF") {
			if (curitem.genericBonus) texthtml += "<p>You have a "+curitem.genericBonus+" bonus to attack and damage rolls made with this piece of magic ammunition. Once it hits a target, the ammunition is no longer magical.</p>";
			texthtml += curtype === "A" ? ammoNormalText : ammoFirearmText;
		} else if (curtype === "S") {
			if (curitem.genericBonus) texthtml += "<p>While holding this shield, you have a "+curitem.genericBonus+" bonus to AC. This bonus is in addition to the shield's normal bonus to AC.</p>";
			$("span#damage").html("AC +"+curitem.ac);
		} else if (curtype === "M" || curtype === "MARW" || curtype === "R" || curtype === "SIMW") {
			if (curitem.genericBonus && notseenbonus) {
				if (curitem.dmg1) {
					texthtml += "<p>You have a "+curitem.genericBonus+" bonus to attack and damage rolls made with this weapon.</p>";
				} else {
					texthtml += "<p>You have a "+curitem.genericBonus+" bonus to attack rolls made with this weapon.</p>";
				}
				notseenbonus=false;
			}
		} else if (curtype === "AT") {
			texthtml += "<p>These special tools include the items needed to pursue a craft or trade. Proficiency with a set of artisan's tools lets you add your proficiency bonus to any ability checks you make using the tools in your craft. Each type of artisan's tools requires a separate proficiency.</p>";
		} else if (curtype === "GS") {
			texthtml += "<p>If you are proficient with a gaming set, you can add your proficiency bonus to ability checks you make to play a game with that set. Each type of gaming set requires a separate proficiency.</p>";
		} else if (curtype === "INS") {
			texthtml += "<p>If you have proficiency with a given musical instrument, you can add your proficiency bonus to any ability checks you make to play music with the instrument.</p><p>A bard can use a musical instrument as a spellcasting focus, substituting it for any material component that does not list a cost.</p><p>Each type of musical instrument requires a separate proficiency.</p>";
		} else if (curtype === "TG") {
			texthtml += "<p>Most wealth is not in coins. It is measured in livestock, grain, land, rights to collect taxes, or rights to resources (such as a mine or a forest).</p><p>Guilds, nobles, and royalty regulate trade. Chartered companies are granted rights to conduct trade along certain routes, to send merchant ships to various ports, or to buy or sell specific goods. Guilds set prices for the goods or services that they control, and determine who may or may not offer those goods and services. Merchants commonly exchange trade goods without using currency.</p>";
		}
		if (curtype === "R") texthtml += emphasize("Range", "A weapon that can be used to make a ranged attack has a range shown in parentheses after the ammunition or thrown property. The range lists two numbers. The first is the weapon's normal range in feet, and the second indicates the weapon's maximum range. When attacking a target beyond normal range, you have disadvantage on the attack roll. You can't attack a target beyond the weapon's long range.");
	}

	$("td span#rarity").html("");
	if (rarity) $("td span#rarity").html(", "+rarity);

	$("span#properties").html("");
	if (curitem.property) {
		let properties = curitem.property.split(",");
		$("span#damagetype").append(" - ");
		for (let i = 0; i < properties.length; i++) {
			let a = b = properties[i];
			a = parse_propertyToAbv (a);
			if (b === "V") {
				a = a + " (" + curitem.dmg2 + ")";
				texthtml += emphasize("Versatile", "This weapon can be used with one or two hands. A damage value in parentheses appears with the property \u2014 the damage when the weapon is used with two hands to make a melee attack.");
			}
			if (b === "T" || b === "A") a = a + " (" + curitem.range + "ft.)";
			if (b === "RLD") {
				a = a + " (" + curitem.reload + " shots)";
				texthtml += emphasize("Reload", "A limited number of shots can be made with a weapon that has the reload property. A character must then reload it using an action or a bonus action (the character's choice).");
			}
			if (i > 0) a = ", "+a;
			$("span#properties").append(a);
			if (b === "2H") texthtml += emphasize("Two-Handed", "This weapon requires two hands to use.");
			if (b === "A") texthtml += ammoNormalText;
			if (b === "AF") texthtml += ammoFirearmText;
			if (b === "BF") texthtml += emphasize("Burst Fire", "A weapon that has the burst fire property can make a single-target attack, or it can spray a 10-foot-cube area within normal range with shots. Each creature in the area must succeed on a DC 15 Dexterity saving throw or take the weapon's normal damage. This action uses ten pieces of ammunition.");
			if (b === "F") texthtml += emphasize("Finesse", "When making an attack with a finesse weapon, you use your choice of your Strength or Dexterity modifier for the attack and damage rolls. You must use the same modifier for both rolls.");
			if (b === "H") texthtml += emphasize("Heavy", "Small creatures have disadvantage on attack rolls with heavy weapons. A heavy weapon's size and bulk make it too large for a Small creature to use effectively.");
			if (b === "L") texthtml += emphasize("Light", "A light weapon is small and easy to handle, making it ideal for use when fighting with two weapons.");
			if (b === "LD") texthtml += emphasize("Loading", "Because of the time required to load this weapon, you can fire only one piece of ammunition from it when you use an action, bonus action, or reaction to fire it, regardless of the number of attacks you can normally make.");
			if (b === "R") texthtml += emphasize("Reach", "This weapon adds 5 feet to your reach when you attack with it.");
			if (b === "S") texthtml += name.substr(0,3) === "Net" ? emphasize("Special", "A Large or smaller creature hit by a net is restrained until it is freed. A net has no effect on creatures that are formless, or creatures that are Huge or larger. A creature can use its action to make a DC 10 Strength check, freeing itself or another creature within its reach on a success. Dealing 5 slashing damage to the net (AC 10) also frees the creature without harming it, ending the effect and destroying the net. When you use an action, bonus action, or reaction to attack with a net, you can make only one attack regardless of the number of attacks you can normally make.") : emphasize("Special", "You have disadvantage when you use a lance to attack a target within 5 feet of you. Also, a lance requires two hands to wield when you aren't mounted.");
			if (b === "T") texthtml += emphasize("Thrown.</strong> If a weapon has the thrown property, you can throw the weapon to make a ranged attack. If the weapon is a melee weapon, you use the same ability modifier for that attack roll and damage roll that you would use for a melee attack with the weapon. For example, if you throw a handaxe, you use your Strength, but if you throw a dagger, you can use either your Strength or your Dexterity, since the dagger has the finesse property.");
		}
	}

	$("tr#text").after("<tr class='text'><td colspan='6' class='text1'>"+texthtml+"</td></tr>");
}
