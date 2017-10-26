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

function normalisetime(time) {
	if (time === "1 action") return 0;
	if (time === "1 action or 8 hours") return 1;
	if (time === "1 bonus action") return 2;
	if (time === "1 reaction") return 3;
	if (time === "1 reaction ...") return 4;
	let offset=time.indexOf(" ");
	if (offset < 0) return 100000;
	let multiplier=1;
	if (time.indexOf("round") > -1) multiplier=6;
	if (time.indexOf("minute") > -1) multiplier=60;
	if (time.indexOf("hour") > -1) multiplier=3600;
	return multiplier*Number(time.substr(0,offset));
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

function trimcastingtime(time) {
	return time.indexOf(", which you take") > -1 ? time.substr(0, time.indexOf(", which you take")).trim()+" ..." : time.trim();
}

const META_RITUAL = "Rituals";
const META_TECHNOMAGIC = "Technomagic";

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
		const classlist = curspell.classes.split(",");
		for (let a = 0; a < classlist.length; a++) {
			addDropdownOption($("select.classfilter"), parse_stringToSlug(classlist[a].trim()), classlist[a].trim());
			classlist[a] = parse_stringToSlug(classlist[a].trim());
		}
		const classFilterList = classlist.join(FLTR_LIST_SEP);
		const metaTags = [];
		if (curspell.ritual === "YES") metaTags.push(META_RITUAL);
		if (curspell.technomagic === "YES") metaTags.push(META_TECHNOMAGIC);
		const metaTagsString = metaTags.join(FLTR_LIST_SEP);
		let action = trimcastingtime(curspell.time).split(" ")[1];
		if (action.charAt(action.length-1) === "s") action = action.substr(0, action.length-1);

		let toadd = "<li class='row' "+FLTR_LEVEL+"='"+curspell.level+"' "+FLTR_SCHOOL+"='"+curspell.school+"' "+FLTR_SOURCE+"='"+curspell.source+"' "+FLTR_RANGE+"='"+normaliserange(curspell.range)+"' "+FLTR_CLASS+"='"+classFilterList+"' "+FLTR_META+"='"+metaTagsString+"' "+FLTR_ACTION+"='"+action+"'><a id='"+i+"' href='#"+encodeURIComponent(name).toLowerCase().replace("'","%27")+"' title=\""+name+"\"><span class='name col-xs-3 col-xs-3-5'>"+name+"</span> <span class='source col-xs-1' title=\""+parse_sourceJsonToFull(curspell.source)+"\">"+parse_sourceJsonToAbv(curspell.source)+"</span> <span class='level col-xs-1 col-xs-1-7'>"+leveltext+"</span> <span class='time col-xs-1 col-xs-1-7'>"+trimcastingtime(curspell.time)+"</span> <span class='school col-xs-1 col-xs-1-7'>"+parseschool(curspell.school)+"</span> <span class='classes' style='display: none'>"+curspell.classes+"</span> <span class='range col-xs-2 col-xs-2-4'>"+curspell.range+"</span></a></li>";
		$("ul.spells").append(toadd);

		const spellFilterText = parsespelllevel(curspell.level) === "cantrip" ? parsespelllevel(curspell.level) : parsespelllevel(curspell.level) + " level";
		addDropdownOption($("select.levelfilter"), curspell.level, spellFilterText);
		addDropdownOption($("select.schoolfilter"), curspell.school, parseschool(curspell.school));
		addDropdownOption($("select.sourcefilter"), curspell.source, parse_sourceJsonToFull(curspell.source));
		addDropdownOption($("select.rangefilter"), normaliserange(curspell.range).toString(), curspell.range);
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
		valueNames: ["name", "source", "level", "time", "school", "range", "classes", "disciplinesearch"],
		listClass: "spells"
	});

	initHistory();

	$("form#filtertools select").change(function(){
		let sourcefilter = $("select.sourcefilter").val();
		let levelfilter = $("select.levelfilter").val();
		let timefilter = $("select.timefilter").val();
		let schoolfilter = $("select.schoolfilter").val();
		let rangefilter = $("select.rangefilter").val();
		let metaFilter = $("select.metafilter").val();
		let classfilter = $("select.classfilter").val();
		//let thirdpartyfilter = $("select.3ppfilter").val();

		list.filter(function(item) {
			let rightsource = false;
			let rightlevel = false;
			let righttime = false;
			let rightschool = false;
			let rightrange = false;
			let rightMeta = false;
			let rightclass = false;
			let rightparty = true;

			if (sourcefilter === "All" || item.elm.getAttribute(FLTR_SOURCE) === sourcefilter) rightsource = true;
			if (levelfilter === "All" || item.elm.getAttribute(FLTR_LEVEL) === levelfilter) rightlevel = true;
			if (timefilter === "All" || item.elm.getAttribute(FLTR_ACTION) === timefilter) righttime = true;
			if (schoolfilter === "All" || item.elm.getAttribute(FLTR_SCHOOL) === schoolfilter) rightschool = true;
			if (rangefilter === "All" || item.elm.getAttribute(FLTR_RANGE).toString() === rangefilter) rightrange = true;
			if (metaFilter === "All" || item.elm.getAttribute(FLTR_META).split(FLTR_LIST_SEP).includes(metaFilter)) rightMeta = true;


			let classes = item.elm.getAttribute(FLTR_CLASS).split(FLTR_LIST_SEP);
			for (let c = 0; c < classes.length; c++) {
				if (classes[c] === classfilter) rightclass = true;
			}
			if (classfilter === "All") rightclass = true;

			//if (thirdpartyfilter === "All") rightparty = true;
			//if (thirdpartyfilter === "None" && item.values().source.indexOf("3pp") === -1) rightparty = true;
			//if (thirdpartyfilter === "Only" && item.values().source.indexOf("3pp") !== -1) rightparty = true;
			if (rightsource && rightlevel && righttime && rightschool && rightrange && rightclass && rightparty && rightMeta) return true;
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

	if (o.valueName === "level") {
		let alevel = a._values.level.replace(" ", "").replace("cantrip", "0")[0];
		let blevel = b._values.level.replace(" ", "").replace("cantrip", "0")[0];
		alevel = (alevel.length < 2 ? "0" + alevel : alevel) + (a._values.level.includes("ritual") ? " 1" : "") + (a._values.level.includes("tech") ? " 2" : "");
		blevel = (blevel.length < 2 ? "0" + blevel : blevel) + (b._values.level.includes("ritual") ? " 1" : "") + (b._values.level.includes("tech") ? " 2" : "");
		if (blevel === alevel) return compareNames(a, b);
		return blevel > alevel ? 1 : -1;
	}

	if (o.valueName === "time") {
		if (normalisetime(b._values.time) === normalisetime(a._values.time)) return compareNames(a, b);
		return normalisetime(b._values.time) > normalisetime(a._values.time) ? 1 : -1;
	}

	if (o.valueName === "school") {
		if (b._values.school.toLowerCase() === a._values.school.toLowerCase()) return compareNames(a, b);
		return b._values.school.toLowerCase() > a._values.school.toLowerCase() ? 1 : -1;
	}

	if (o.valueName === "range") {
		if (normaliserange(b._values.range) === normaliserange(a._values.range)) return compareNames(a, b);
		return normaliserange(b._values.range) > normaliserange(a._values.range) ? 1 : -1;
	}

	return 0;
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
