window.onload = function load() {
	tabledefault = $("#stats").html();

	monsters = monsterdata.compendium.monster;

	// parse all the monster data
	for (var i = 0; i < monsters.length; i++) {
		var name = monsters[i].name;
		var source = monsters[i].source;
		var fullsource = parse_sourceJsonToFull(source);
		var type = monsters[i].type;
		var cr = monsters[i].cr;

		let abvSource = parse_sourceJsonToAbv(source);
		let is3pp = source.includes("3pp");

		$("ul#monsters").append("<li "+FLTR_TYPE+"='"+type+"' "+FLTR_SOURCE+"='"+source+"' "+FLTR_CR+"='"+cr+"' "+FLTR_3PP+"='"+is3pp+"'><a id="+i+" href='#"+encodeURIComponent(name).toLowerCase().replace("'","%27")+"' title='"+name+"'><span class='name col-xs-4 col-xs-4-2'>"+name+"</span> <span title=\""+fullsource+"\" class='col-xs-1 col-xs-1-8 source source"+abvSource+"'>"+abvSource+"</span> <span class='type col-xs-4 col-xs-4-3'>"+type+"</span> <span class='col-xs-1 col-xs-1-7 text-align-center cr'>"+cr+"</span></a></li>");

		addDropdownOption($("select.typefilter"), type, parse_sourceJsonToFull(type));
		addDropdownOption($("select.sourcefilter"), source, fullsource);
		addDropdownOption($("select.crfilter"), cr, cr);

		$("select.sourcefilter option").sort(asc_sort).appendTo('select.sourcefilter');
		$("select.sourcefilter").val("All");
	}

	$("select.typefilter option").sort(asc_sort).appendTo('select.typefilter');
	$("select.typefilter").val("All");

	$("select.crfilter option").sort(asc_sort_cr).appendTo('select.crfilter');
	$("select.crfilter option[value=0]").before($("select.crfilter option[value=All]"));
	$("select.crfilter").val("All");

	const list = search({
		valueNames: ["name", "source", "type", "cr"]
	});

	initHistory();

	// filtering
	$("form#filtertools select").change(function(){
		var typefilter = $("select.typefilter").val();
		var sourcefilter = $("select.sourcefilter").val();
		var crfilter = $("select.crfilter").val();
		var thirdpartyfilter = $("select.pp3filter").val();

		list.filter(function(item) {
			var righttype = false;
			var rightsource = false;
			var rightcr = false;
			var rightparty = false;

			if (typefilter === "All" || item.elm.getAttribute(FLTR_TYPE) === typefilter) righttype = true;
			if (sourcefilter === "All" || item.elm.getAttribute(FLTR_SOURCE) === sourcefilter) rightsource = true;
			if (crfilter === "All" || item.elm.getAttribute(FLTR_CR) === crfilter) rightcr = true;
			if (thirdpartyfilter === "All") rightparty = true;
			if (thirdpartyfilter === "None" && item.elm.getAttribute(FLTR_3PP) === "false") rightparty = true;
			if (thirdpartyfilter === "Only" && item.elm.getAttribute(FLTR_3PP) === "true") rightparty = true;
			if (righttype && rightsource && rightcr && rightparty) return true;
			return false;
		});
	});

	$("#filtertools button.sort").on("click", function() {
		if ($(this).attr("sortby") === "asc") {
			$(this).attr("sortby", "desc");
		} else $(this).attr("sortby", "asc");
		list.sort($(this).attr("sort"), { order: $(this).attr("sortby"), sortFunction: sortmonsters });
	});

	// collapse/expand button
	$("button#expandcollapse").click(function() {
		$("main .row:eq(0) > div:eq(0)").toggleClass("col-sm-5").toggle();
		$("main .row:eq(0) > div:eq(1)").toggleClass("col-sm-12").toggleClass("col-sm-7");
		/*
			var i = $("main .row:eq(0) > div:eq(1) > div:eq(0)");
			if (i.css("maxHeight") === "100%") {
				i.css("maxHeight", "565px");
			} else i.css("maxHeight", "100%");
		*/
		return;
	})
}

// sorting for form filtering
function sortmonsters(a, b, o) {
	if (o.valueName === "name") {
		return ((b._values.name.toLowerCase()) > (a._values.name.toLowerCase())) ? 1 : -1;
	}

	if (o.valueName === "type") {
		return ((b._values.type.toLowerCase()) > (a._values.type.toLowerCase())) ? 1 : -1;
	}

	if (o.valueName === "source") {
		return ((b._values.source.toLowerCase()) > (a._values.source.toLowerCase())) ? 1 : -1;
	}

	if (o.valueName === "cr") {
		let acr = a._values.cr.replace("CR ", "").replace(" ", "")
		let bcr = b._values.cr.replace("CR ", "").replace(" ", "")
		if (acr === "1/2") acr = "-1";
		if (bcr === "1/2") bcr = "-1";
		if (acr === "1/4") acr = "-2";
		if (bcr === "1/4") bcr = "-2";
		if (acr === "1/8") acr = "-3";
		if (bcr === "1/8") bcr = "-3";
		if (acr === "0") acr = "-4";
		if (bcr === "0") bcr = "-4";
		return (parseInt(bcr) > parseInt(acr)) ? 1 : -1;
	}

	return 1;

}

// load selected monster stat block
function loadhash (id) {
	$("#stats").html(tabledefault);
	var mon = monsterdata.compendium.monster[id];
	var name = mon.name;
	var source = mon.source;
	var fullsource = parse_sourceJsonToFull(source);
	var type = mon.type;
	source = parse_sourceJsonToAbv(source);

	imgError = function(x) {
		$(x).parent().siblings(".source").css("margin-right", "-4.8em");
		$(x).remove();
		return;
	}

	$("th#name").html("<span title=\""+fullsource+"\" class='source source"+source+"'>"+source+"<br></span> <a href='img/"+source+"/"+name+".png' target='_blank'><img src='img/"+source+"/"+name+".png' class='token' onerror='imgError(this)'></a>"+name);

	$("td span#size").html(parse_sizeAbvToFull (mon.size));

	$("td span#type").html(type);

	$("td span#alignment").html(mon.alignment);

	$("td span#ac").html(mon.ac);

	$("td span#hp").html(mon.hp);

	$("td span#speed").html(mon.speed);

	$("td#str span.score").html(mon.str);
	$("td#str span.mod").html(getAbilityModifier (mon.str));

	$("td#dex span.score").html(mon.dex);
	$("td#dex span.mod").html(getAbilityModifier (mon.dex));

	$("td#con span.score").html(mon.con);
	$("td#con span.mod").html(getAbilityModifier (mon.con));

	$("td#int span.score").html(mon.int);
	$("td#int span.mod").html(getAbilityModifier (mon.int));

	$("td#wis span.score").html(mon.wis);
	$("td#wis span.mod").html(getAbilityModifier (mon.wis));

	$("td#cha span.score").html(mon.cha);
	$("td#cha span.mod").html(getAbilityModifier (mon.cha));

	var saves = mon.save;
	if (saves && saves.length > 0) {
		$("td span#saves").parent().show();
		$("td span#saves").html(saves);
	} else {
		$("td span#saves").parent().hide();
	}

	var skills = mon.skill;
	if (skills && skills.length > 0 && skills[0]) {
		$("td span#skills").parent().show();
		$("td span#skills").html(skills);
	} else {
		$("td span#skills").parent().hide();
	}

	var dmgvuln = mon.vulnerable;
	if (dmgvuln && dmgvuln.length > 0) {
		$("td span#dmgvuln").parent().show();
		$("td span#dmgvuln").html(dmgvuln);
	} else {
		$("td span#dmgvuln").parent().hide();
	}

	var dmgres = mon.resist;
	if (dmgres && dmgres.length > 0) {
		$("td span#dmgres").parent().show();
		$("td span#dmgres").html(dmgres);
	} else {
		$("td span#dmgres").parent().hide();
	}

	var dmgimm = mon.immune;
	if (dmgimm && dmgimm.length > 0) {
		$("td span#dmgimm").parent().show();
		$("td span#dmgimm").html(dmgimm);
	} else {
		$("td span#dmgimm").parent().hide();
	}

	var conimm = mon.conditionImmune;
	if (conimm && conimm.length > 0) {
		$("td span#conimm").parent().show();
		$("td span#conimm").html(conimm);
	} else {
		$("td span#conimm").parent().hide();
	}

	var senses = mon.senses;
	if (senses && senses.length > 0) {
		$("td span#senses").html(senses+", ");
	} else {
		$("td span#senses").html("");
	}

	var passive = mon.passive;
	if (passive && passive.length > 0) {
		$("td span#pp").html(passive)
	}

	var languages = mon.languages;
	if (languages && languages.length > 0) {
		$("td span#languages").html(languages);
	} else {
		$("td span#languages").html("\u2014");
	}

	var cr = mon.cr;
	$("td span#cr").html(cr);
	$("td span#xp").html(parse_crToXp(cr));

	var traits = mon.trait;
	$("tr.trait").remove();

	if (traits) for (var i = traits.length-1; i >= 0; i--) {
		var traitname = traits[i].name;

		var traittext = traits[i].text;
		var traittexthtml = "";
		var renderedcount = 0;
		for (var n = 0; n < traittext.length; n++) {
			if (!traittext[n]) continue;

			renderedcount++;
			var firstsecond = ""
			if (renderedcount === 1) firstsecond = "first ";
			if (renderedcount === 2) firstsecond = "second ";

			var spells = "";
			if (traitname.indexOf("Spellcasting") !== -1 && traittext[n].indexOf(": ") !== -1) spells = "spells";
			if (traitname.indexOf("Variant") !== -1 && traitname.indexOf("Coven") !== -1 && traittext[n].indexOf(": ") !== -1) spells = "spells";

			traittexthtml = traittexthtml + "<p class='"+firstsecond+spells+"'>"+traittext[n].replace(/\u2022\s?(?=C|\d|At\swill)/g,"");+"</p>";
		}

		$("tr#traits").after("<tr class='trait'><td colspan='6' class='trait"+i+"'><span class='name'>"+traitname+".</span> "+traittexthtml+"</td></tr>");

		// parse spells, make hyperlinks
		$("tr.trait").children("td").children("p.spells").each(function() {
			let spellslist = $(this).html();
			if (spellslist[0] === "*") return;
			spellslist = spellslist.split(": ")[1].split(/\, (?!\+|\dd|appears|inside gems)/g);
			for (let i = 0; i < spellslist.length; i++) {
				spellslist[i] = "<a href='spells.html#"+encodeURIComponent((spellslist[i].replace(/(\*)| \(([^\)]+)\)/g,""))).toLowerCase().replace("'","%27")+"' target='_blank'>"+spellslist[i]+"</a>";
				if (i !== spellslist.length-1) spellslist[i] = spellslist[i]+", ";
			}

			$(this).html($(this).html().split(": ")[0]+": "+spellslist.join(""))
		});
	}

	let actions = mon.action;
	$("tr.action").remove();

	if (actions && actions.length) for (let i = actions.length-1; i >= 0; i--) {
		let actionname = actions[i].name;
		let actiontext = actions[i].text;
		let actiontexthtml = "";
		let renderedcount = 0;
		for (let n = 0; n < actiontext.length; n++) {
			if (!actiontext[n]) continue;

			renderedcount++;
			let firstsecond = ""
			if (renderedcount === 1) firstsecond = "first ";
			if (renderedcount === 2) firstsecond = "second ";

			actiontexthtml = actiontexthtml + "<p class='"+firstsecond+"'>"+actiontext[n]+"</p>";
		}

		$("tr#actions").after("<tr class='action'><td colspan='6' class='action"+i+"'><span class='name'>"+actionname+".</span> "+actiontexthtml+"</td></tr>");
	}

	let reactions = mon.reaction;
	$("tr#reactions").hide();
	$("tr.reaction").remove();

	if (reactions && (reactions.text || reactions.length)) {

		$("tr#reactions").show();

		if (!reactions.length) {
			let reactionname = reactions.name;
			let reactiontext = reactions.text;
			let reactiontexthtml = "";
			let renderedcount = 0
			for (let n = 0; n < reactiontext.length; n++) {
				if (!reactiontext[n]) continue;

				renderedcount++;
				let firstsecond = ""
				if (renderedcount === 1) firstsecond = "first ";
				if (renderedcount === 2) firstsecond = "second ";

				reactiontexthtml = reactiontexthtml + "<p class='"+firstsecond+"'>"+reactiontext[n]+"</p>";
			}

			$("tr#reactions").after("<tr class='reaction'><td colspan='6' class='reaction0'><span class='name'>"+reactionname+".</span> "+reactiontexthtml+"</td></tr>");
		}

		if (reactions.length) for (let i = reactions.length-1; i >= 0; i--) {
			let reactionname = reactions[i].name;

			let reactiontext = reactions[i].text;
			let reactiontexthtml = "<span>"+reactiontext+"</span>";
			for (let n = 1; n < reactiontext.length; n++) {
				if (!reactiontext[n]) continue;
				reactiontexthtml = reactiontexthtml + "<p>"+reactiontext[n]+"</p>";
			}

			$("tr#reactions").after("<tr class='reaction'><td colspan='6' class='reaction"+i+"'><span class='name'>"+reactionname+".</span> "+reactiontexthtml+"</td></tr>");
		}
	}

	let legendaries = mon.legendary;
	$("tr.legendary").remove();
	$("tr#legendaries").hide();
	if (legendaries && legendaries.length) {
		$("tr#legendaries").show();

		let legendarydescription = "<span>"+name+" can take 3 legendary actions, choosing from the options below. Only one legendary action can be used at a time and only at the end of another creature's turn. "+name+" regains spent legendary actions at the start of his turn."

		for (let i = legendaries.length-1; i >= 0; i--) {
			let legendaryname = "";
			let legendarytext = legendaries[i].text;
			let legendarytexthtml = "";

			if (legendaries[i].name) {
				legendaryname = legendaries[i].name+".";
			}

			let renderedcount = 0
			for (let n = 0; n < legendarytext.length; n++) {
				if (!legendarytext[n]) continue;

				renderedcount++;
				let firstsecond = ""
				if (renderedcount === 1) firstsecond = "first ";
				if (renderedcount === 2) firstsecond = "second ";

				legendarytexthtml = legendarytexthtml + "<p class='"+firstsecond+"'>"+legendarytext[n]+"</p>";
			}

			$("tr#legendaries").after("<tr class='legendary'><td colspan='6' class='legendary"+i+"'><span class='name'>"+legendaryname+"</span> "+legendarytexthtml+"</td></tr>");
		}

		if ($("tr.legendary").length && !$("tr.legendary span.name:empty").length && !$("tr.legendary span.name:contains(Legendary Actions)").length) {
			$("tr#legendaries").after("<tr class='legendary'><td colspan='6' class='legendary0'><span class='name'></span> <span>"+name+" can take 3 legendary actions, choosing from the options below. Only one legendary action can be used at a time and only at the end of another creature's turn. "+name+" regains spent legendary actions at the start of his turn.</span></td></tr>");
		}

	}

	// add click links for rollables
	$("#stats #abilityscores td").each(function() {
		$(this).wrapInner("<span class='roller' data-roll='1d20"+$(this).children(".mod").html()+"'></span>");
	});

	$("#skills,#saves").each(function() {
		$(this).html($(this).html().replace(/\+\d+/g, "<span class='roller' data-roll='1d20$&'>$&</span>"))
	});

	// inline rollers
	$("#stats p, #stats span#hp").each(function() {
		$(this).html($(this).html().replace(/\d+d\d+(\s?(\-|\+)\s?\d+\s?)?/g, "<span class='roller' data-roll='$&'>$&</span>"));
		$(this).html($(this).html().replace(/(\-|\+)\d+(?= to hit)/g, "<span class='roller' data-roll='1d20$&'>$&</span>"))
	});

	$(".spells span.roller").contents().unwrap();
	$("#stats span.roller").click(function() {
		var roll =$(this).attr("data-roll").replace(/\s+/g, "");
		var rollresult =  droll.roll(roll);
		var name = $("#name").clone().children().remove().end().text();
		$("div#output").prepend("<span>"+name + ": <em>"+roll+"</em> rolled for <strong>"+rollresult.total+"</strong> (<em>"+rollresult.rolls.join(", ")+"</em>)<br></span>").show();
		$("div#output span:eq(5)").remove();
	})
}
