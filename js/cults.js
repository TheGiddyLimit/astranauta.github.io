var tabledefault = "";

window.onload = function load() {
	tabledefault = $("#stats").html();
	var cultlist = cultdata;

	for (var i = 0; i < cultlist.length; i++) {
		var curcult = cultlist[i];
		var name = curcult.name;
		$("ul.cults").append("<li><a id='"+i+"' href='#"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name' title='"+name+"'>"+name+"</span></a></li>");
	}

	const list = search({
		valueNames: ['name'],
		listClass: "cults"
	});

	initHistory()
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	var cultlist = cultdata;
	var curcult = cultlist[id];

	var name = curcult.name;
	$("th#name").html(name);

	$("tr.text").remove();

	var textlist = curcult.text;
	var texthtml = "";

	if (curcult.goal !== undefined) texthtml += utils_combineText(curcult.goal.text, "p", "<span class='bold'>Goals:</span> ");
	if (curcult.cultists !== undefined) texthtml += utils_combineText(curcult.cultists.text, "p", "<span class='bold'>Typical Cultist:</span> ");
	if (curcult.signaturespells !== undefined) texthtml += utils_combineText(curcult.signaturespells.text, "p", "<span class='bold'>Signature Spells:</span> ");
	texthtml += utils_combineText(textlist, "p");

	$("tr#text").after("<tr class='text'><td colspan='6'>"+texthtml+"</td></tr>");
}
