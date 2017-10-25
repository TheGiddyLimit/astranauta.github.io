var tabledefault = "";

window.onload = function load() {
	tabledefault = $("#stats").html();
	var rewardlist = rewarddata;

	for (var i = 0; i < rewardlist.length; i++) {
		var curreward = rewardlist[i];
		var name = curreward.name;
		let displayName = curreward.type === "Demonic" ? "Demonic Boon: " + curreward.name : curreward.name;
		$("ul.rewards").append("<li class='row' "+FLTR_SOURCE+"='"+curreward.source+"'><a id='"+i+"' href='#"+encodeURIComponent(name).toLowerCase().replace("'","%27")+"' title='"+name+"'><span class='name col-xs-10'>"+displayName+"</span> <span class='source col-xs-2' title='"+parse_sourceJsonToFull(curreward.source)+"'>"+parse_sourceJsonToAbv(curreward.source)+"</span></a></li>");

		addDropdownOption($("select.sourcefilter"), curreward.source, parse_sourceJsonToFull(curreward.source));
	}

	$("select.sourcefilter option").sort(asc_sort).appendTo('select.sourcefilter');
	$("select.sourcefilter").val("All");

	const list = search({
		valueNames: ["name", "source"],
		listClass: "rewards"
	});

	$("#filtertools select").change(function(e) {
		const typeFilter = $("select.typefilter").val();
		const sourceFilter = $("select.sourcefilter").val();

		list.filter(item => {
			const rightType = typeFilter === "All" || item.values().name.startsWith(typeFilter);
			const rightSource = sourceFilter === "All" || item.elm.getAttribute(FLTR_SOURCE) === sourceFilter;
			return rightType && rightSource;
		})
	})

	initHistory()
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	var rewardlist = rewarddata;
	var curreward = rewardlist[id];

	var name = curreward.type === "Demonic" ? "Demonic Boon: " + curreward.name : curreward.name;
	$("th#name").html("<span title=\""+parse_sourceJsonToFull(curreward.source)+"\" class='source source"+parse_sourceJsonToAbv(curreward.source)+"'>"+parse_sourceJsonToAbv(curreward.source)+"</span> "+name);

	$("tr.text").remove();

	var textlist = curreward.text;
	var texthtml = "";

	if (curreward.ability !== undefined) texthtml += utils_combineText(curreward.ability.text, "p", "<span class='bold'>Ability Score Adjustment:</span> ");
	if (curreward.signaturespells !== undefined) texthtml += utils_combineText(curreward.signaturespells.text, "p", "<span class='bold'>Signature Spells:</span> ");
	texthtml += utils_combineText(textlist, "p");

	$("tr#text").after("<tr class='text'><td colspan='6'>"+texthtml+"</td></tr>");
}
