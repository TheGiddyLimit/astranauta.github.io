const HASH_SUBCLASS = "subclass:";
const HASH_FEATURE = "feature:";

var tabledefault="";
var classtabledefault ="";

let classlist;

window.onload = function load() {
	let jsonURL = "data/classes.json";

	let request = new XMLHttpRequest();
	request.open('GET', jsonURL, true);
	request.overrideMimeType("application/json");
	request.onload = function() {
		let data = JSON.parse(this.response);

		classlist = data.class;

		tabledefault = $("#stats").html();
		statsprofdefault = $("#statsprof").html();
		classtabledefault = $("#classtable").html();

		for (let i = 0; i < classlist.length; i++) {
			var curclass = classlist[i];
			$("ul.classes").append("<li><a id='"+i+"' href='#"+encodeURI(curclass.name).toLowerCase()+"' title='"+curclass.name+"'><span class='name col-xs-9'>"+curclass.name+"</span><span class='source col-xs-3' title='"+parse_sourceJsonToFull(curclass.source)+"'>"+parse_sourceJsonToAbv(curclass.source)+"</span></a></li>");
		}

		const list = search({
			valueNames: ['name', 'source'],
			listClass: "classes"
		});

		initHistory()
	};
	request.send();
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	$("#statsprof").html(statsprofdefault);
	$("#classtable").html(classtabledefault);
	var curclass = classlist[id];

	$("th#name").html(curclass.name);

	$("td#hp div#hitdice span").html("1d"+curclass.hd);
	$("td#hp div#hp1stlevel span").html(curclass.hd+" + your Constitution modifier");
	$("td#hp div#hphigherlevels span").html("1d"+curclass.hd+" (or "+(curclass.hd/2+1)+") + your Constitution modifier per "+curclass.name+" level after 1st");

	$("td#prof div#saves span").html(curclass.proficiency);

	$("tr:has(.slotlabel)").hide();
	$("#classtable tr").not(":has(th)").append("<td class='featurebuffer'></td>");

	var subclasses = [];
	for (let i = curclass.autolevel.length-1; i >= 0; i--) {
		var curlevel = curclass.autolevel[i];

		// spell slots and table data
		if (!curlevel.feature) {
			if (curlevel.slots) {
				$("tr:has(.slotlabel)").show();
				if (curlevel.slots.__text) curlevel.slots = curlevel.slots.__text;
				var curslots = curlevel.slots.split(",");
				if (curslots[0] !== "0" && $("th.slotbuffer").attr("colspan") < 4) {
					$("#classtable td.border").attr("colspan", parseInt($("#classtable td.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("th.slotlabel").attr("colspan", curslots.length-1);
				if (curslots.length > 1) $(".featurebuffer").hide();

				for (var a = 0; a < curslots.length; a++) {
					if (curslots[a] === "0") continue;
					$(".spellslots"+a).show();
					$("tr#level"+curlevel._level+" td.spellslots"+a).html(curslots[a]);
				}
			}

			if (curlevel.spellsknown) {
				if (!$(".spellsknown").length) {
					$("th.spellslots0").after("<th class='spellsknown newfeature'>Spells Known</th>");
					$("td.spellslots0").after("<td class='spellsknown newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.spellsknown").html(curlevel.spellsknown);
			}


			if (curlevel.invocationsknown) {
				if (!$(".invocationsknown").length) {
					$("th.spellslots5").after("<th class='spellslots newfeature'>Spell Slots</th> <th class='slotlevel newfeature'>Slot Level</th> <th class='invocationsknown newfeature'>Invocations Known</th>");
					$("td.spellslots5").after("<td class='spellslots newfeature'></td> <td class='slotlevel newfeature'></td> <td class='invocationsknown newfeature'>Invocations Known</td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+3);
				}
				$(".spellslots5").hide();
				$("tr#level"+curlevel._level+" td.spellslots").html(curlevel.spellslots);
				$("tr#level"+curlevel._level+" td.slotlevel").html(curlevel.slotlevel);
				$("tr#level"+curlevel._level+" td.invocationsknown").html(curlevel.invocationsknown);
				$("tr:has(.slotlabel)").hide();
			}

			if (curlevel.rages) {
				if (!$(".rages").length) {
					$("th.spellslots0").before("<th class='rages newfeature'>Rages</th> <th class='ragedamage newfeature'>Rage Damage</th>");
					$("td.spellslots0").before("<td class='rages newfeature'></td> <td class='ragedamage newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+2);
				}
				$("tr#level"+curlevel._level+" td.rages").html(curlevel.rages);
				$("tr#level"+curlevel._level+" td.ragedamage").html(curlevel.ragedamage);
			}

			if (curlevel.martialarts) {
				if (!$(".kipoints").length) {
					$("th.pb").after("<th class='martialarts newfeature'>Martial Arts</th> <th class='kipoints newfeature'>Ki Points</th> <th class='unarmoredmovement newfeature'>Unarmored Movement</th>");
					$("td.pb").after("<td class='martialarts newfeature'></td> <td class='kipoints newfeature'></td> <td class='unarmoredmovement newfeature'></td>");
					$("#classtable td.border").attr("colspan", parseInt($("#classtable td.border").attr("colspan"))+3);
					$("th.slotbuffer").attr("colspan", $("th.slotbuffer").attr("colspan")+3);
				}
				$("tr#level"+curlevel._level+" td.martialarts").html(curlevel.martialarts);
				$("tr#level"+curlevel._level+" td.kipoints").html(curlevel.kipoints);
				$("tr#level"+curlevel._level+" td.unarmoredmovement").html(curlevel.unarmoredmovement);
			}

			if (curlevel.sneakattack) {
				if (!$(".sneakattack").length) {
					$("th.pb").after("<th class='sneakattack newfeature'>Sneak Attack</th>");
					$("td.pb").after("<td class='sneakattack newfeature'></td>");
					$("#classtable td.border").attr("colspan", parseInt($("#classtable td.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.sneakattack").html(curlevel.sneakattack);
			}

			if (curlevel.sorcerypoints) {
				if (!$(".sorcerypoints").length) {
					$("th.pb").after("<th class='sorcerypoints newfeature'>Sorcery Points</th>");
					$("td.pb").after("<td class='sorcerypoints newfeature'></td>");
					$("#classtable td.border").attr("colspan", parseInt($("#classtable td.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}

				$("tr#level"+curlevel._level+" td.sorcerypoints").html(curlevel.sorcerypoints);
			}

			if (curlevel.psilimit) {
				if (!$(".psilimit").length) {
					$("th.spellslots0").after("<th class='psilimit newfeature'>Psi Limit</th>");
					$("td.spellslots0").after("<td class='psilimit newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.psilimit").html(curlevel.psilimit);
			}

			if (curlevel.psipoints) {
				if (!$(".psipoints").length) {
					$("th.spellslots0").after("<th class='psipoints newfeature'>Psi Points</th>");
					$("td.spellslots0").after("<td class='psipoints newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.psipoints").html(curlevel.psipoints);
			}

			if (curlevel.disciplinesknown) {
				if (!$(".disciplinesknown").length) {
					$("th.spellslots0").after("<th class='disciplinesknown newfeature'>Disciplines Known</th>");
					$("td.spellslots0").after("<td class='disciplinesknown newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.disciplinesknown").html(curlevel.disciplinesknown);
			}

			if (curlevel.talentsknown) {
				if (!$(".talentsknown").length) {
					$("th.spellslots0").after("<th class='talentsknown newfeature'>Talents Known</th>");
					$("td.spellslots0").after("<td class='talentsknown newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.talentsknown").html(curlevel.talentsknown);
			}

			// other features
		} else for (let a = curlevel.feature.length-1; a >= 0; a--) {
			let curfeature = curlevel.feature[a];
			let link = curfeature.name === undefined ? a : encodeURIComponent(curfeature.name.toLowerCase());

			if (curfeature._optional === "YES") {
				subclasses.push(curfeature);
			}

			let styleClass = "";
			let isInlineHeader = curfeature.suboption === "2";
			let removeSubclassNamePrefix = curfeature.subclass !== undefined && curfeature.suboption === undefined;
			let hasSubclassPrefix = curfeature.subclass !== undefined && curfeature.suboption === "1";
			if (curfeature.subclass === undefined && curfeature.suboption === undefined) styleClass = "feature";
			else if (curfeature.subclass === undefined && curfeature.suboption !== undefined && curfeature._optional === "YES") styleClass = "optionalsubfeature sub" + curfeature.suboption;
			else if (curfeature.subclass === undefined && curfeature.suboption !== undefined) styleClass = "subfeature sub" + curfeature.suboption;
			else if (curfeature.subclass !== undefined && curfeature.suboption === undefined) styleClass = "subclassfeature";
			else if (curfeature.subclass !== undefined && curfeature.suboption !== undefined) styleClass = "subclasssubfeature sub" + curfeature.suboption;

			if (curfeature.name === "Starting Proficiencies") {
				$("td#prof div#armor span").html(curfeature.text[1].split(":")[1]);
				$("td#prof div#weapons span").html(curfeature.text[2].split(":")[1]);
				$("td#prof div#tools span").html(curfeature.text[3].split(":")[1]);
				$("td#prof div#skills span").html(curfeature.text[4].split(":")[1]);
				continue;
			}

			if (curfeature.name === "Starting Equipment") {
				$("#equipment div").html("<p>"+curfeature.text.join("</p><p>"));
				continue;
			}

			// write out list to class table
			var multifeature = "";
			if (curlevel.feature.length !== 1 && a !== 0) multifeature = ", ";
			let featureSpan = document.createElement(ELE_A);
			featureSpan.setAttribute(ATB_HREF, getFeatureHash(link));
			featureSpan.setAttribute(ATB_CLASS, "featurelink");
			featureSpan.addEventListener("click", function() {
				document.getElementById("feature"+link).scrollIntoView();
			})
			featureSpan.innerHTML = curfeature.name;
			if (curfeature._optional !== "YES" && curfeature.suboption === undefined) $("tr#level"+curlevel._level+" td.features").prepend(featureSpan).prepend(multifeature);

			// display features in bottom section
			var dataua = (curfeature.subclass !== undefined && curfeature.subclass.indexOf(" (UA)") !== -1) ? "true" : "false";
			let subclassPrefix = hasSubclassPrefix ? "<span class='subclass-prefix'>" + curfeature.subclass.split(": ")[1] +": </span>" : "";
			let dataSubclass = curfeature.subclass === undefined ? undefined : curfeature.subclass.toLowerCase();
			if (isInlineHeader) {
				let namePart = curfeature.name === undefined ? null : "<span id='feature" + link + "' class='inline-header'>" + subclassPrefix + curfeature.name + ".</span> ";
				$("#features").after("<tr><td colspan='6' class='_class_feature " + styleClass + "' data-subclass='" + dataSubclass + "' data-ua='" + dataua + "'>" + utils_combineText(curfeature.text, "p", namePart) + "</td></tr>");
			} else {
				let namePart = curfeature.name === undefined ? "" : "<strong id='feature" + link + "'>" + subclassPrefix + (removeSubclassNamePrefix ? curfeature.name.split(": ")[1] : curfeature.name) + "</strong>";
				let prerequisitePart = curfeature.prerequisite === undefined ? "" : "<p class='prerequisite'>Prerequisite: " + curfeature.prerequisite + "</p>";
				$("#features").after("<tr><td colspan='6' class='_class_feature " + styleClass + "' data-subclass='" + dataSubclass + "' data-ua='" + dataua + "'>" + namePart + prerequisitePart + utils_combineText(curfeature.text, "p") + "</td></tr>");
			}
		}

	}

	$("td.features, td.slots, td.newfeature").each(function() {
		if ($(this).html() === "") $(this).html("\u2014")
	});

	$("div#subclasses span").remove();
	for (let i = 0; i < subclasses.length; i++) {
		if (subclasses[i].issubclass === "YES") $("div#subclasses").prepend("<span data-subclass='"+(subclasses[i].name.toLowerCase())+"'><em style='display: none;'>"+subclasses[i].name.split(": ")[0]+": </em><span>"+subclasses[i].name.split(": ")[1]+"</span></span>");
	}

	$("#subclasses > span").sort(asc_sort).appendTo("#subclasses");
	$("#subclasses > span").click(function() {
		const name = $(this).children("span").text()
		window.location.hash = getSubclassedHash($(this), name)
	});

	function getSubclassedHash(subButton, name) {
		const outStack = [];
		const split = window.location.hash.split(",");

		if (subButton.hasClass("active")) {
			for (let i = 0; i < split.length; i++) {
				const hashPart = split[i];
				if (!hashPart.startsWith(HASH_SUBCLASS)) outStack.push(hashPart)
			}
		} else {
			let hasSubclassHash = false;
			const subclassLink = "subclass:" + encodeURIComponent(name).replace("'", "%27");

			for (let i = 0; i < split.length; i++) {
				const hashPart = split[i];
				if (!hashPart.startsWith(HASH_SUBCLASS)) outStack.push(hashPart);
				else {
					outStack.push(subclassLink);
					hasSubclassHash = true;
				}
			}

			if (!hasSubclassHash) outStack.push(subclassLink);
		}

		return outStack.join(",").toLowerCase();
	}

	function getFeatureHash(featureLink) {
		const hashFeatureLink = HASH_FEATURE + featureLink;
		const outStack = [];
		const split = window.location.hash.split(",");

		let hasFeature = false;

		for (let i = 0; i < split.length; i++) {
			const hashPart = split[i];
			if (!hashPart.startsWith(HASH_FEATURE)) outStack.push(hashPart);
			else {
				outStack.push(hashFeatureLink);
				hasFeature = true;
			}
		}

		if (!hasFeature) outStack.push(hashFeatureLink);

		return outStack.join(",").toLowerCase();
	}

	return;
}

let curSub = null;
function loadsub(sub) {
	let subclass = null;
	let feature = null;

	for (let i = 0; i < sub.length; i++) {
		let hashPart = sub[i];

		if (hashPart.startsWith(HASH_SUBCLASS)) subclass = hashPart.slice(HASH_SUBCLASS.length);
		if (hashPart.startsWith(HASH_FEATURE)) feature = hashPart.slice(HASH_FEATURE.length);
	}

	if (subclass !== null) {
		addFeatureHashes(subclass);

		let $el;
		let subClassSpanList = document.getElementById("subclasses").getElementsByTagName("span");
		for (let i = 0; i < subClassSpanList.length; ++i) {
			if (subClassSpanList[i].getAttribute('data-subclass') !== undefined && subClassSpanList[i].getAttribute('data-subclass') !== null
				&& subClassSpanList[i].getAttribute('data-subclass').includes(decodeURIComponent(subclass.toLowerCase()))) {
				$el = $(subClassSpanList[i]);
				break;
			}
		}

		if ($el.hasClass("active")) {
			$("._class_feature").show();
			$(".subclass-prefix").show();
			$el.removeClass("active");
		}

		$("#subclasses .active").removeClass("active");
		$el.addClass("active");

		$("._class_feature[data-subclass!='"+$el.text().toLowerCase()+"'][data-subclass!='undefined']").hide();
		$(".subclass-prefix").hide();
		$("._class_feature[data-subclass='"+$el.text().toLowerCase()+"']").show();
	} else {
		addFeatureHashes();
		$("#subclasses .active").removeClass("active");
		$("._class_feature").show();
		$(".subclass-prefix").show();
	}

	if (feature !== null && curSub === subclass) {
		document.getElementById("feature"+feature).scrollIntoView();
	}

	function addFeatureHashes (subclass) {
		subclass = (subclass === undefined || subclass === null) ? null : HASH_SUBCLASS + encodeURIComponent(subclass);
		let needsSubClass = subclass !== null;
		$(".featurelink").each(
			function() {
				const splitHash = this.href.split(",");
				const hashStack = [];

				for (let i = 0; i < splitHash.length; i++) {
					let hashPart = splitHash[i];

					if (hashPart.startsWith(HASH_SUBCLASS)) {
						if (subclass !== null) {
							hashStack.push(subclass);
							needsSubClass = false;
						}
					}
					else hashStack.push(hashPart);
				}

				if (needsSubClass) hashStack.push(subclass);

				this.href = hashStack.join(",")
			}
		)
	}

	curSub = subclass;
}
