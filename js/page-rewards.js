var tabledefault = "";

window.onload = function load() {
	tabledefault = $("#stats").html();
	var rewardlist = rewarddata;

	for (var i = 0; i < rewardlist.length; i++) {
		var curreward = rewardlist[i];
		var name = curreward.name;
		let displayName = curreward.type === "Demonic" ? "Demonic Boon: " + curreward.name : curreward.name;
		$("ul.rewards").append("<li class='row'><a id='"+i+"' href='#"+encodeURIComponent(name).toLowerCase().replace("'","%27")+"' title='"+name+"'><span class='name col-xs-10'>"+displayName+"</span> <span class='source col-xs-2' title=\""+parse_sourceJsonToFull(curreward.source)+"\">"+parse_sourceJsonToAbv(curreward.source)+"</span></a></li>");
	}

	const list = search({
		valueNames: ["name", "source"],
		listClass: "rewards"
	});

	$("#filtertools select").change(function(e) {
		const type = this.value
		if (type === "All")
			return list.filter()

		list.filter(item => item.values().name.startsWith(type))
	})

	if (window.location.hash.length) {
		window.onhashchange();
	} else $("#listcontainer a").get(0).click();
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
