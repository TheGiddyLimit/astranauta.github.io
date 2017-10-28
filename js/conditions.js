var tabledefault = "";

window.onload = function load() {
	tabledefault = $("#stats").html();
	var conditionlist = conditiondata;

	for (var i = 0; i < conditionlist.length; i++) {
		var curcondition = conditionlist[i];
		var name = curcondition.name;
		$("ul.conditions").append("<li><a id='"+i+"' href='#"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name' title='"+name+"'>"+name+"</span></a></li>");
	}

	const list = search({
		valueNames: ['name'],
		listClass: "conditions"
	});

	initHistory()
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	var conditionlist = conditiondata;
	var curcondition = conditionlist[id];

	var name = curcondition.name;
	$("th#name").html(name);

	$("tr.text").remove();

	$("tr#text").after("<tr class='text'><td colspan='6'>"+utils_combineText(curcondition.text, "p")+"</td></tr>");
}
