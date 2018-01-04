"use strict";

let contentDefault;
let rulesList;
window.onload = function load () {
	contentDefault = $("#rulescontent").html();

	rulesList = rulesdata.compendium.rules;

	for (let i = 0; i < rulesList.length; i++) {
		const rule = rulesList[i];
		$("ul.rules." + rule.parentlist).append(
			`<li>
				<a id='${i}' href='#${encodeURI(rule.name).toLowerCase()}' title='${rule.name}'>
					<span class='name col-xs-12'>${rule.name}</span> 
					<span class='id' style='display: none;'>${rule.id.toString()}</span>
				</a>
			</li>`
		);
	}

	const listNames = [];
	for (let i = 0; i < rulesList.length; i++) {
		const toAdd = rulesList[i].parentlist;
		if ($.inArray(toAdd, listNames) === -1) listNames.push(toAdd);
	}
	const lists = [];
	listNames.forEach(ln => {
		lists.push(
			search({
				valueNames: ['name', 'id'],
				listClass: ln
			})
		)
	});

	$("ul.list.rules").each(function () {
		$(this).children("li").sort(function (a, b) {
			const sorta = $(a).children("span.id").text();
			const sortb = $(b).children("span.id").text();
			return (sorta > sortb) ? 1 : -1;
		}).appendTo(this);
	});

	initHistory();

	$("#listcontainer").find("h4").click(function () {
		$(this).next().slideToggle();
	}).css("cursor", "pointer");
};

function loadhash (id) {
	const contentArea = $("#rulescontent");
	contentArea.html(contentDefault);

	const currules = rulesList[id];

	contentArea.html(currules.htmlcontent);
	contentArea.prepend(`<h1>${currules.name}</h1>`)
}
