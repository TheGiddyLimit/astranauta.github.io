window.onload = function load() {
	tabledefault = $("#stats").html();

	var racelist = racedata.compendium.race;

	for (var i = 0; i < racelist.length; i++) {
		var currace = racelist[i];
		var name = currace.name;
		const ability = utils_getAbilityData(currace.ability);
		const isChooseAbility = ability.asText.toLowerCase().includes("choose");
		$("ul.races").append("<li "+FLTR_SOURCE+"='"+currace.source+"' "+FLTR_SIZE+"='"+currace.size+"' "+FLTR_ABILITIES+"='"+ability.asFilterCollection+"' "+FLTR_ABILITIES_CHOOSE+"='"+isChooseAbility+"'><a id='"+i+"' href='#"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name col-xs-4'>"+name+"</span> <span class='ability col-xs-4'>"+ability.asText+"</span> <span class='size col-xs-2'>"+parse_sizeAbvToFull(currace.size)+"</span> <span class='source col-xs-2' title=\""+parse_sourceJsonToFull(currace.source)+"\">"+parse_sourceJsonToAbv(currace.source)+"</span></a></li>");

		addDropdownOption($("select.sourcefilter"), currace.source, parse_sourceJsonToFull(currace.source));
		addDropdownOption($("select.sizefilter"), currace.size, parse_sizeAbvToFull(currace.size));
	}

	$("select.sourcefilter option").sort(asc_sort).appendTo('select.sourcefilter');
	$("select.sourcefilter").val("All");

	$("select.sizefilter option").sort(asc_sort).appendTo('select.sizefilter');
	$("select.sizefilter").val("All");


	const list = search({
		valueNames: ['name', 'ability', 'size', 'source'],
		listClass: "races"
	});

	$("form#filtertools select").change(function(){
		var sourcefilter = $("select.sourcefilter").val();
		var sizefilter = $("select.sizefilter").val();
		var bonusfilter = $("select.bonusfilter").val();

		list.filter(function(item) {
			var rightsource = false;
			var rightsize = false;
			var rightbonuses = false;
			if (sourcefilter === "All" || item.elm.getAttribute(FLTR_SOURCE) === sourcefilter) rightsource = true;
			if (sizefilter === "All" || item.elm.getAttribute(FLTR_SIZE) === sizefilter) rightsize = true;
			const bonusList = item.elm.getAttribute(FLTR_ABILITIES).split(FLTR_LIST_SEP);
			rightbonuses = bonusfilter === "All" || bonusfilter === "Choose" && item.elm.getAttribute(FLTR_ABILITIES_CHOOSE) === "true" && bonusList.length === 6 || bonusList.includes(bonusfilter);
			if (rightsource && rightsize && rightbonuses) return true;
			return false;
		});
	});

	initHistory()
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	$("#stats td").show();

	var racelist = racedata.compendium.race;
	var currace = racelist[id];

	var name = currace.name;
	$("th#name").html(name);

	var size = parse_sizeAbvToFull (currace.size);
	$("td#size span").html(size);
	if (size === "") $("td#size").hide();

	var ability = utils_getAbilityData(currace.ability);
	$("td#ability span").html(ability.asText);

	var speed = currace.speed + (currace.speed === "Varies" ? "" : "ft. ");
	$("td#speed span").html(speed);
	if (speed === "") $("td#speed").hide();

	var traitlist = currace.trait;
	$("tr.trait").remove();

	let statsText = "<tr class='text'><td colspan='6'>";
	for (let n = 0; n < traitlist.length; ++n) {
		const trait = traitlist[n];

		const header = "<span class='name'>" + trait.name + ".</span> ";
		statsText += utils_combineText(traitlist[n].text, "p", header)
	}
	statsText += "</td></tr>";
	$('table#stats tbody tr:last').before(statsText);
}
