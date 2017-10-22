function parseschool (school) {
	if (school === "A") return "abjuration";
	if (school === "EV") return "evocation";
	if (school === "EN") return "enchantment";
	if (school === "I") return "illusion";
	if (school === "D") return "divination";
	if (school === "N") return "necromancy";
	if (school === "T") return "transmutation";
	if (school === "C") return "conjuration";
	return "";
}

function parsespelllevel (level) {
	if (isNaN (level)) return "";
	if (level === "0") return "cantrip";
	if (level === "2") return level+"nd";
	if (level === "3") return level+"rd";
	if (level === "1") return level+"st";
	return level+"th";
}

function normaliserange(range) {
	let out=0;
	let adjust = 0;
	range = range.toLowerCase();
	if (range === "self") return -1;
	if (range === "touch") return 2;
	if (range === "sight") return 2*5280*12; // typically a few miles out-of-doors; the following values are simply very large numbers appropriately ordered in size
	if (range === "unlimited on the same plane") return 900000000; // a value from BoLS, so that it still works if/when we add it back in
	if (range === "unlimited") return 900000001;
	if (range === "special") return 1000000000;
	if (range === "varies") return 1000000001;
	if (range.substr(0, 6) === "self (") {
		range = range.substr(6).replace("-"," ");
		adjust = 1; // This will make the "self (" ranges appear immediately after the equivalent non-self ranges
	}
	if (range.indexOf("line)") > -1) adjust += 1;
	if (range.indexOf("radius)") > -1) adjust += 2;
	if (range.indexOf("cone)") > -1) adjust += 3;
	if (range.indexOf("hemisphere)") > -1) adjust += 4;
	if (range.indexOf(" sphere)") > -1) adjust += 5;
	if (range.indexOf("cube)") > -1) adjust += 6;
	if (range.indexOf(" ") > -1) out = 12*parseInt(range.substr(0,range.indexOf(" "))); // convert the out value to inches (to make single feet range differences larger than any adjustment)
	if (range.indexOf("mile") > -1) out = out * 5280;
	return out+adjust;
}

window.onload = function load() {
	tabledefault = $("#stats").html();

	let spelllist = spelldata.compendium.spell;

	for (let i = 0; i < spelllist.length; i++) {
		let curspell = spelllist[i];
		let name = curspell.name;

		let leveltext = parsespelllevel(curspell.level);
		if (curspell.ritual === "YES") leveltext += " (ritual)";
		if (curspell.technomagic === "YES") leveltext += " (tech.)";
		if (!curspell.source) curspell.source = "PHB";
		if (!curspell.range) curspell.range = "Varies";

		let schooltext = parseschool(curspell.school);
		let toadd = "<li class='row'><a id='"+i+"' href='#"+encodeURIComponent(name).toLowerCase().replace("'","%27")+"' title='"+name+"'><span class='name col-xs-3 col-xs-3-7'>"+name+"</span> <span class='source col-xs-1' title=\""+parse_sourceJsonToFull(curspell.source)+"\">"+parse_sourceJsonToAbv(curspell.source)+"</span> <span class='level col-xs-1 col-xs-1-7'>"+leveltext+"</span> <span class='school col-xs-2 col-xs-2-5'>"+schooltext+"</span> <span class='classes' style='display: none'>"+curspell.classes+"</span> <span class='range col-xs-3 col-xs-3-1'>"+curspell.range+"</span></a></li>";
		$("ul.spells").append(toadd);

		if (!$("select.levelfilter:contains('"+parsespelllevel(curspell.level)+"')").length) {
			let levelFilterText = parsespelllevel(curspell.level);
			if (levelFilterText !== "cantrip") {
				levelFilterText = levelFilterText + " level";
			}
			$("select.levelfilter").append("<option value='"+curspell.level+"'>"+levelFilterText+"</option>");
		}

		if (!$("select.schoolfilter:contains('"+parseschool (curspell.school)+"')").length) {
			$("select.schoolfilter").append("<option value='"+parseschool (curspell.school)+"'>"+parseschool (curspell.school)+"</option>");
		}

		if (!$("select.sourcefilter:contains(\""+parse_sourceJsonToFull(curspell.source)+"\")").length) {
			$("select.sourcefilter").append("<option value='"+parse_sourceJsonToAbv(curspell.source)+"'>"+parse_sourceJsonToFull(curspell.source)+"</option>");
		}

		let classlist = curspell.classes.split(",");
		for (let a = 0; a < classlist.length; a++) {
			if (classlist[a][0] === " ") classlist[a] = classlist[a].replace(/^\s+|\s+$/g, "")
			if (!$("select.classfilter option[value='"+classlist[a]+"']").length) {
				$("select.classfilter").append("<option title=\""+classlist[a]+"\" value='"+classlist[a]+"'>"+classlist[a]+"</option>")
			}
		}

		if (!$("select.rangefilter:contains(\""+curspell.range+"\")").length) {
			$("select.rangefilter").append("<option value='"+normaliserange(curspell.range)+"'>"+curspell.range+"</option>");
		}
	}

	// Sort the filter boxes, and select "All"
	$("select.levelfilter option").sort(asc_sort).appendTo("select.levelfilter");
	$("select.levelfilter option[value=1]").before($("select.levelfilter option[value=All]"));
	$("select.levelfilter option[value=1]").before($("select.levelfilter option[value=0]"));
	$("select.levelfilter").val("All");

	$("select.schoolfilter option").sort(asc_sort).appendTo("select.schoolfilter");
	$("select.schoolfilter").val("All");

	$("select.classfilter option").sort(asc_sort).appendTo("select.classfilter");
	$("select.classfilter").val("All");

	$("select.sourcefilter option").sort(asc_sort).appendTo("select.sourcefilter");
	$("select.sourcefilter").val("All");

	$("select.rangefilter option").sort(asc_sort_range).appendTo("select.rangefilter");
	$("select.rangefilter").val("All");

	const list = search({
		valueNames: ["name", "source", "level", "school", "classes", "disciplinesearch", "range"],
		listClass: "spells"
	});

	if (window.location.hash.length) {
		window.onhashchange();
	} else $("#listcontainer a").get(0).click();

	$("form#filtertools select").change(function(){
		let levelfilter = $("select.levelfilter").val();
		if (levelfilter !== "All") {

			if (levelfilter[0] !== "d" && levelfilter[0] !== "t") {
				levelfilter = parsespelllevel (levelfilter);
				if ($(".ritualfilter").val() === "Rituals") levelfilter = levelfilter + " (ritual)"
			}
		} else if ($(".ritualfilter").val() === "Rituals") levelfilter = "(ritual)"

		let schoolfilter = $("select.schoolfilter").val();
		let classfilter = $("select.classfilter").val();
		let sourcefilter = $("select.sourcefilter").val();
		//let thirdpartyfilter = $("select.3ppfilter").val();
		let rangefilter = parseInt($("select.rangefilter").val()) || "All";

		list.filter(function(item) {
			let rightlevel = false;
			let rightschool = false;
			let rightclass = false;
			let rightsource = false;
			let rightparty = true;
			let rightrange = false;

			if (levelfilter === "All" || item.values().level.indexOf(levelfilter) !== -1) rightlevel = true;
			if (schoolfilter === "All" || item.values().school === schoolfilter) rightschool = true;
			let classes = item.values().classes.split(", ");
			for (let c = 0; c < classes.length; c++) {
				if (classes[c] === classfilter) rightclass = true;
			}
			if (classfilter === "All") rightclass = true;
			if (sourcefilter === "All" || item.values().source === sourcefilter) rightsource = true;
			//if (thirdpartyfilter === "All") rightparty = true;
			//if (thirdpartyfilter === "None" && item.values().source.indexOf("3pp") === -1) rightparty = true;
			//if (thirdpartyfilter === "Only" && item.values().source.indexOf("3pp") !== -1) rightparty = true;
			if (rangefilter === "All" || normaliserange(item.values().range) === rangefilter) rightrange = true;
			if (rightlevel && rightschool && rightclass && rightsource && rightparty && rightrange) return true;
			return false;
		});
	});

	$("#filtertools button.sort").on("click", function() {
		if ($(this).attr("sortby") === "asc") {
			$(this).attr("sortby", "desc");
		} else $(this).attr("sortby", "asc");
		list.sort($(this).data("sort"), { order: $(this).attr("sortby"), sortFunction: sortspells });
	});
};

function sortspells(a, b, o) {
	if (o.valueName === "name") {
		return compareNames(a, b);
	}

	if (o.valueName === "source") {
		if (b._values.source.toLowerCase() === a._values.source.toLowerCase()) return compareNames(a, b);
		return b._values.source.toLowerCase() > a._values.source.toLowerCase() ? 1 : -1;
	}

	if (o.valueName === "school") {
		if (b._values.school.toLowerCase() === a._values.school.toLowerCase()) return compareNames(a, b);
		return b._values.school.toLowerCase() > a._values.school.toLowerCase() ? 1 : -1;
	}

	if (o.valueName === "level") {
		let alevel = a._values.level.replace(" ", "").replace("cantrip", "0")[0];
		let blevel = b._values.level.replace(" ", "").replace("cantrip", "0")[0];
		alevel = (alevel.length < 2 ? "0" + alevel : alevel) + (a._values.level.includes("ritual") ? " 1" : "") + (a._values.level.includes("tech") ? " 2" : "");
		blevel = (blevel.length < 2 ? "0" + blevel : blevel) + (b._values.level.includes("ritual") ? " 1" : "") + (b._values.level.includes("tech") ? " 2" : "");
		if (blevel === alevel) return compareNames(a, b);
		return blevel > alevel ? 1 : -1;
	}

	if (o.valueName === "range") {
		if (normaliserange(b._values.range) === normaliserange(a._values.range)) return compareNames(a, b);
		return normaliserange(b._values.range) > normaliserange(a._values.range) ? 1 : -1;
	}

	return 0;

	function compareNames(a, b) {
		if (b._values.name.toLowerCase() === a._values.name.toLowerCase()) return 0;
		else if (b._values.name.toLowerCase() > a._values.name.toLowerCase()) return 1;
		else if (b._values.name.toLowerCase() < a._values.name.toLowerCase()) return -1;
	}
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	let curspell = spelldata.compendium.spell[id];

	$("th#name").html("<span title=\""+parse_sourceJsonToFull(curspell.source)+"\" class='source source"+curspell.source+"'>"+curspell.source+"</span> "+curspell.name);

	$("td span#school").html(parseschool(curspell.school));
	if (curspell.level === "0") {
		$("td span#school").css("textTransform", "capitalize");
		$("td span#level").css("textTransform", "lowercase!important");
		$("td span#level").html(" cantrip").detach().appendTo("td span#school");
	} else {
		$("td span#school").css("textTransform", "lowercase");
		$("td span#level").html(parsespelllevel (curspell.level)+"-level");
	}

	if (curspell.ritual === "YES") {
		$("td span#ritual").show();
	} else $("td span#ritual").hide();

	if (curspell.technomagic === "YES") {
		$("td span#technomagic").show();
	} else $("td span#technomagic").hide();

	$("td#components span").html(curspell.components);
	$("td#range span").html(curspell.range);
	$("td#castingtime span").html(curspell.time);
	$("td#duration span").html(curspell.duration);

	$("tr.text").remove();
	let textlist = curspell.text;
	let texthtml = "";

	if (textlist[0].length === 1) {
		texthtml = "<p>"+textlist+"</p>";
	} else for (let i = 0; i < textlist.length; i++) {
		// FIXME this information should be kept in JSON instead of being parsed out
		if (textlist[i].istable === "YES") {
			texthtml += utils_makeTable(textlist[i]);
		} else {
			if (!textlist[i]) continue;
			texthtml = texthtml + "<p>" + textlist[i].replace("At Higher Levels: ", "<strong>At Higher Levels:</strong> ") + "</p>";
		}
	}
	$("tr#text").after("<tr class='text'><td colspan='6' class='text'>"+texthtml+"</td></tr>");

	$("td#classes span").html(curspell.classes);

	return;
}
