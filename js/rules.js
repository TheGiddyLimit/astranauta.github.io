window.onload = function load() {
	contentdefault = $("#rulescontent").html();

	var ruleslist = rulesdata.compendium.rules;

	for (var i = 0; i < ruleslist.length; i++) {
		var currules = ruleslist[i];
		var name = currules.name;
		var basedon = "";
		var rulesid = currules.id.toString();
		$("ul.rules."+currules.parentlist).append("<li><a id='"+i+"' href='#"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name col-xs-12'>"+name+"</span> <span class='id' style='display: none;'>"+rulesid+"</span></a></li>");
	}

	var options = {
		valueNames: ['name', 'id'],
		listClass: "rules"
	}

	const list = new List("listcontainer", options);
	list.sort ("name");

	$("ul.list.rules").each(function() {
		$(this).children("li").sort(function(a, b) {
			var sorta = $(a).children("span.id").text();
			var sortb = $(b).children("span.id").text();
			return (sorta > sortb) ? 1 : -1;
		}).appendTo(this);
	});

	initHistory()

	// reset button
	$("button#reset").click(function() {
		$("#filtertools select").val("All");
		$("#search").val("");
		list.search("");
		list.filter();
		list.sort("names");
		list.update();
	})

	$("#listcontainer h4").click(function() {
		$(this).next().slideToggle();
	}).css("cursor", "pointer");
}

function loadhash (id) {
	$("#rulescontent").html(contentdefault);

	var ruleslist = rulesdata.compendium.rules;
	var currules = ruleslist[id];

	$("#rulescontent").html(currules.htmlcontent);
	$("#rulescontent").prepend(`<h1>`+currules.name+`</h1>`)
}
