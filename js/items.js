var mundanelist;
var magiclist;

window.onload = function load() {
	tabledefault = $("#stats").html();

	var itemlist = itemdata.compendium.item;

	for (var i = 0; i < itemlist.length; i++) {

		var curitem = itemlist[i];
		if (curitem.type === "$") continue;

		var name = curitem.name;
		var rarity = curitem.rarity;
		var source = curitem.source;
		var sourceAbv = parse_sourceJsonToAbv(source);
		var sourceFull = parse_sourceJsonToFull(source);
		var type = curitem.type.split(",");

		for (var j = 0; j < type.length; j++) {
			type[j] = parse_itemTypeToAbv (type[j]);
			if (!$("select.typefilter option[value='"+type[j]+"']").length) {
				$("select.typefilter").append("<option value='"+type[j]+"'>"+type[j]+"</option>")
			}
		}

		if (!rarity) rarity = "None";
		var destinationlist = "ul.list."+(rarity !== "None" || curitem.reqAttune || type === "W" ? "magic" : "mundane");

		$(destinationlist).append("<li><a id='"+i+"' href=\"#"+encodeURIComponent(name).toLowerCase().replace("'","%27")+"\" title=\""+name+"\"><span class='name col-xs-4'>"+name+"</span> <span class='type col-xs-4 col-xs-4-3'>"+type.join(", ")+"</span> <span class='sourcename col-xs-1 col-xs-1-7' title=\""+sourceFull+"\"><span class='source'>"+sourceAbv+"</span></span> <span class='rarity col-xs-2'>"+rarity+"</span></a></li>");

		if (!$("select.sourcefilter option[value='"+sourceAbv+"']").length) $("select.sourcefilter").append("<option title=\""+source+"\" value='"+sourceAbv+"'>"+sourceFull+"</option>");
		$("select.sourcefilter option").sort(asc_sort).appendTo("select.sourcefilter");
		$("select.sourcefilter").val("All");
	}

	var options = {
		valueNames: ["name", "source", "type", "rarity"],
		listClass: "mundane"
	};

	mundanelist = search(options);
	options.listClass = "magic";
	magiclist = search(options);

	$(".typefilter option").sort(asc_sort).appendTo(".typefilter");
	$("select.typefilter option[value=All]").prependTo(".typefilter");
	$(".typefilter").val("All");

	initHistory()

	$("form#filtertools select").change(function(){
		var typefilter = $("select.typefilter").val();
		var sourcefilter = $("select.sourcefilter").val().replace(" ","");
		var rarityfilter = $("select.rarityfilter").val();

		mundanelist.filter(function(item) {
			var righttype = false;
			var rightsource = false;
			var rightrarity = false;
			if (typefilter === "All" || item.values().type.indexOf(typefilter) !== -1) righttype = true;
			if (sourcefilter === "All" || item.values().source === sourcefilter) rightsource = true;
			if (rarityfilter === "All" || item.values().rarity === rarityfilter) rightrarity = true;
			if (righttype && rightsource && rightrarity) return true;
			return false;
		});

		magiclist.filter(function(item) {
			var righttype = false;
			var rightsource = false;
			var rightrarity = false;
			if (typefilter === "All" || item.values().type.indexOf(typefilter) !== -1) righttype = true;
			if (sourcefilter === "All" || item.values().source === sourcefilter) rightsource = true;
			if (rarityfilter === "All" || item.values().rarity === rarityfilter) rightrarity = true;
			if (righttype && rightsource && rightrarity) return true;
			return false;
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
	if (rarity === "None") return 0;
	if (rarity === "Common") return 1;
	if (rarity === "Uncommon") return 2;
	if (rarity === "Rare") return 3;
	if (rarity === "Very Rare") return 4;
	if (rarity === "Legendary") return 5;
	if (rarity === "Artifact") return 6;
	if (rarity === "Unknown") return 7;
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

function loadhash (id) {
	$("#currentitem").html(tabledefault);
	var curitem = itemdata.compendium.item[id];
	var name = curitem.name;
	var source = curitem.source;

	sourceAbv = parse_sourceJsonToAbv(source);
	sourceFull = parse_sourceJsonToFull(source);
	$("th#name").html("<span title=\""+sourceFull+"\" class='source source"+sourceAbv+"'>"+sourceAbv+"</span> "+name);
	$("td#source span").html(sourceFull+", page "+curitem.page);

	$("span#value").html("");
	if (curitem.value) {
		var value = curitem.value;
		if (curitem.weight) value = value + ", ";
		$("td span#value").html(value);
	} else $("td span#value").html("");

	$("span#weight").html("");
	var weight = curitem.weight;
	$("td span#weight").html(weight ? weight+(weight == 1 ? " lb." : " lbs.") : "");

	var attunetext = curitem.reqAttune
	$("td span#attunement").html(attunetext ? "(Requires Attunement"+(attunetext === "YES" ? "" : " "+attunetext)+")" : "");

	var textlist = curitem.text;
	$("tr.text").remove();
	var texthtml = "";

	if (textlist) {
		for (let n = 0; n < textlist.length; n++) {
			if (!textlist[n]) continue;
			let curtextstring = JSON.stringify (textlist[n]);
			if (textlist[n].istable === "YES") {
				texthtml += utils_makeTable(textlist[n]);
			} else {
				texthtml = texthtml + "<p>"+textlist[n].replace(/(Curse|Sentience|Personality)(\.|\:) /g, '<strong>$1.</strong> ')+"</p>";
			}
		}
	}

	$("td span#type").html("");
	$("span#damage").html("");
	$("span#damagetype").html("");
	var type = curitem.type.split(",");
	let notseenbonus=true;
	const ammoGenericText="<p>If you use a weapon that has the ammunition property to make a melee attack, you treat the weapon as an improvised weapon. A sling must be loaded to deal any damage when used in this way.</p>";
	const ammoFirearmText="<p><strong>Ammunition.</strong> You can use a weapon that has the ammunition property to make a ranged attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one piece of ammunition. Drawing the ammunition from a quiver, case, or other container is part of the attack. The ammunition of a firearm is destroyed upon use.</p>"+ammoGenericText;
	const ammoNormalText="<p><strong>Ammunition.</strong> You can use a weapon that has the ammunition property to make a ranged attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one piece of ammunition. Drawing the ammunition from a quiver, case, or other container is part of the attack. At the end of the battle, you can recover half your expended ammunition by taking a minute to search the battlefield.</p>"+ammoGenericText;
	for (var n = 0; n < type.length; n++) {
		var curtype = type[n];
		let indexResistance=name.indexOf(" Resistance");
		// FIXME need to add logic for handling potions and rings of resistance; probably add a "resist" property to the JSON
		// Look for: % of Life Stealing, % of Vengeance, % of Warning, % of Wounding, %, % for type=WD, Mariner's %, Mind Blade %, Mind Carapace %, Mithral%, Nine Lives Stealer %, Quaal's Feather Token%, Vicious %, Vorpal %, Legendary Resistance, Luck, Wish, Attunement Optional, Handle "Word[s]: %", type=TG
		if (n > 0) $("td span#type").append (", ");
		$("td span#type").append(parse_itemTypeToAbv(curtype));
		if (curtype === "M" || curtype === "R" || curtype === "GUN") {
			$("span#damage").html(curitem.dmg1);
			if(curitem.dmgType) $("span#damagetype").html(parse_dmgTypeToFull(curitem.dmgType));
		}
		if (curtype === "S") $("span#damage").html("AC +"+curitem.ac);
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
		} else if (curtype === "M" || curtype === "MARW" || curtype === "R" || curtype === "SIMW") {
			if (curitem.genericBonus && notseenbonus) {
				if (curitem.dmg1) {
					texthtml += "<p>You have a "+curitem.genericBonus+" bonus to attack and damage rolls made with this weapon.</p>";
				} else {
					texthtml += "<p>You have a "+curitem.genericBonus+" bonus to attack rolls made with this weapon.</p>";
				}
				notseenbonus=false;
			}
		} else if (curtype === "INS") texthtml += "<p>If you have proficiency with a given musical instrument, you can add your proficiency bonus to any ability checks you make to play music with the instrument.</p><p>A bard can use a musical instrument as a spellcasting focus, substituting it for any material component that does not list a cost.</p><p>Each type of musical instrument requires a separate proficiency.</p>";
		if (curtype === "R") texthtml += "<p><strong>Range.</strong> A weapon that can be used to make a ranged attack has a range shown in parentheses after the ammunition or thrown property. The range lists two numbers. The first is the weapon's normal range in feet, and the second indicates the weapon's maximum range. When attacking a target beyond normal range, you have disadvantage on the attack roll. You can't attack a target beyond the weapon's long range.</p>";
	}

	$("td span#rarity").html("");
	var rarity = curitem.rarity;
	if (rarity) $("td span#rarity").html(", "+rarity);

	$("span#properties").html("");
	if (curitem.property) {
		var properties = curitem.property.split(",");
		$("span#damagetype").append(" - ");
		for (var i = 0; i < properties.length; i++) {
			var a = b = properties[i];
			a = parse_propertyToAbv (a);
			if (b === "V") a = a + " (" + curitem.dmg2 + ")";
			if (b === "T" || b === "A") a = a + " (" + curitem.range + "ft.)";
			if (b === "RLD") a = a + " (" + curitem.reload + " shots)";
			if (i > 0) a = ", "+a;
			$("span#properties").append(a);
			if (b === "2H") texthtml += "<p><strong>Two-Handed.</strong> This weapon requires two hands to use.</p>";
			if (b === "A") texthtml += ammoNormalText;
			if (b === "AF") texthtml += ammoFirearmText;
			if (b === "BF") texthtml += "<p><strong>Burst Fire.</strong> A weapon that has the burst fire property can make a single-target attack, or it can spray a 10-foot-cube area within normal range with shots. Each creature in the area must succeed on a DC 15 Dexterity saving throw or take the weapon's normal damage. This action uses ten pieces of ammunition.";
			if (b === "F") texthtml += "<p><strong>Finesse.</strong> When making an attack with a finesse weapon, you use your choice of your Strength or Dexterity modifier for the attack and damage rolls. You must use the same modifier for both rolls.</p>";
			if (b === "H") texthtml += "<p><strong>Heavy.</strong> Small creatures have disadvantage on attack rolls with heavy weapons. A heavy weapon's size and bulk make it too large for a Small creature to use effectively.</p>";
			if (b === "L") texthtml += "<p><strong>Light.</strong> A light weapon is small and easy to handle, making it ideal for use when fighting with two weapons.</p>";
			if (b === "LD") texthtml += "<p><strong>Loading.</strong> Because of the time required to load this weapon, you can fire only one piece of ammunition from it when you use an action, bonus action, or reaction to fire it, regardless of the number of attacks you can normally make.";
			if (b === "R") texthtml += "<p><strong>Reach.</strong> This weapon adds 5 feet to your reach when you attack with it.</p>";
			if (b === "RLD") texthtml += "<p><strong>Reload.</strong> A limited number of shots can be made with a weapon that has the reload property. A character must then reload it using an action or a bonus action (the character's choice).</p>";
			if (b === "S") texthtml += name.substr(0,3) === "Net" ? "<p><strong>Special</strong> A Large or smaller creature hit by a net is restrained until it is freed. A net has no effect on creatures that are formless, or creatures that are Huge or larger. A creature can use its action to make a DC 10 Strength check, freeing itself or another creature within its reach on a success. Dealing 5 slashing damage to the net (AC 10) also frees the creature without harming it, ending the effect and destroying the net. When you use an action, bonus action, or reaction to attack with a net, you can make only one attack regardless of the number of attacks you can normally make.</p>" : "<p><strong>Special.</strong> You have disadvantage when you use a lance to attack a target within 5 feet of you. Also, a lance requires two hands to wield when you aren't mounted.</p>";
			if (b === "T") texthtml += "<p><strong>Thrown.</strong> If a weapon has the thrown property, you can throw the weapon to make a ranged attack. If the weapon is a melee weapon, you use the same ability modifier for that attack roll and damage roll that you would use for a melee attack with the weapon. For example, if you throw a handaxe, you use your Strength, but if you throw a dagger, you can use either your Strength or your Dexterity, since the dagger has the finesse property.</p>";
			if (b === "V") texthtml += "<p><strong>Versatile.</strong> This weapon can be used with one or two hands. A damage value in parentheses appears with the property \u2014 the damage when the weapon is used with two hands to make a melee attack.</p>";
		}
	}

	$("tr#text").after("<tr class='text'><td colspan='6' class='text1'>"+texthtml+"</td></tr>");
}
