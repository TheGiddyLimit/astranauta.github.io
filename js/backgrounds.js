var tabledefault = "";

window.onload = function load () {
	tabledefault = $("#stats").html();
	var bglist = backgrounddata.compendium.background;

	for (var i = 0; i < bglist.length; i++) {
		var curbg = bglist[i];
		var name = curbg.name;
		$("ul.backgrounds").append("<li "+FLTR_SOURCE+"='"+curbg.source+"'><a id='"+i+"' href='#"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name col-xs-9'>"+name.replace("Variant ","")+"</span> <span class='source col-xs-3' title='"+parse_sourceJsonToFull(curbg.source)+"'>"+parse_sourceJsonToAbv(curbg.source)+"</span></a></li>");

		addDropdownOption($("select.sourcefilter"), parse_sourceJsonToAbv(curbg.source), parse_sourceJsonToFull(curbg.source))
	}

	$("select.sourcefilter option").sort(asc_sort).appendTo('select.sourcefilter');
	$("select.sourcefilter").val("All");

	const list = search({
		valueNames: ['name', 'source'],
		listClass: "backgrounds"
	});

	$("form#filtertools select").change(function(){
		var sourcefilter = $("select.sourcefilter").val();

		list.filter(function(item) {
			if (sourcefilter === "All" || item.elm.getAttribute(FLTR_SOURCE) === sourcefilter) return true;
			return false;
		});
	});


	initHistory()
};

function loadhash (id) {
	$("#stats").html(tabledefault);
	var bglist = backgrounddata.compendium.background;
	var curbg = bglist[id];

	var name = curbg.name;
	$("th#name").html(name);

	var traitlist = curbg.trait;
	$("tr.trait").remove();
	for (var n = traitlist.length-1; n >= 0; n--) {
		var traitname = traitlist[n].name;

		var texthtml = "";
		let headerText = "<span class='name'>"+traitname+".</span> ";

		texthtml += utils_combineText(traitlist[n].text, "p", headerText);

		var subtraitlist = traitlist[n].subtrait;
		if (subtraitlist !== undefined) {
			var k = 0;
			var subtrait;

			for (var j = 0; j < subtraitlist.length; j++) {
				texthtml = texthtml + "<p class='subtrait'>";
				subtrait = subtraitlist[j];
				texthtml = texthtml + "<span class='name'>"+subtrait.name+".</span> ";
				for (k = 0; k < subtrait.text.length; k++) {
					if (!subtrait.text[k]) continue;
					if (k === 0) {
						texthtml = texthtml + "<span>" + subtrait.text[k] + "</span>";
					} else {
						texthtml = texthtml + "<p class='subtrait'>" + subtrait.text[k] + "</p>";
					}
				}
				texthtml = texthtml + "</p>";
			}
		}

		$("tr#traits").after("<tr class='trait'><td colspan='6'>"+texthtml+"</td></tr>");
	}

}
