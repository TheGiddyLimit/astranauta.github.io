"use strict";

const MONTH_NAMES = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"
];

let adventures;

window.onload = function load () {
	loadJSON(CONTENTS_URL, onJsonLoad);
};

function onJsonLoad (data) {
	adventures = data.adventure;

	const adventuresList = $("ul.adventures");
	let tempString = "";
	for (let i = 0; i < adventures.length; i++) {
		const adv = adventures[i];
		// used for sorting
		adv._startLevel = adv.level.start || 20;
		adv._pubDate = new Date(adv.published);

		tempString +=
			`<li ${FLTR_ID}="${i}">
				<a href='adventure.html#${adv.id}' title='${adv.name}' class="adv-name">
					<span class='name'>
						<span class="col-xs-6 col-xs-6-2">${adv.name}</span>
						<span class="col-xs-2 col-xs-2-5 adv-detail">${adv.storyline}</span>
						<span class="col-xs-1 col-xs-1-3 adv-detail">${getLevelsStr(adv)}</span>
						<span class="col-xs-2 adv-detail">${getDateStr(adv)}</span>
					</span>
					<span class="showhide" onclick="advToggle(event, this)" data-hidden="true">[+]</span>
					<span class="source" style="display: none">${adv.id}</span>
				</a>
				${makeContentsBlock(adv, true, false, true)}
			</li>`;
	}
	adventuresList.append(tempString);

	const list = new List("listcontainer", {
		valueNames: ['name', 'source'],
		listClass: "adventures"
	});

	$("#filtertools").find("button.sort").on(EVNT_CLICK, function () {
		const $this = $(this);
		if ($this.attr("sortby") === "asc") {
			$this.attr("sortby", "desc");
		} else $this.attr("sortby", "asc");
		list.sort($this.data("sort"), {order: $this.attr("sortby"), sortFunction: sortAdventures});
	});

	list.sort("name");
	$("#reset").click(function () {
		$("#search").val("");
		list.search();
		list.sort("name");
		list.filter();
		$(`.showhide`).each((i, ele) => {
			const $ele = $(ele);
			if (!$ele.data("hidden")) {
				advToggle(null, ele);
			}
		});
	});

	function getLevelsStr (adv) {
		if (adv.level.custom) return adv.level.custom;
		return `Level ${adv.level.start}\u2013${adv.level.end}`
	}

	function getDateStr (adv) {
		const date = new Date(adv.published);
		return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
	}
}

function advToggle (evt, ele) {
	if (evt) {
		evt.stopPropagation();
		evt.preventDefault();
	}
	const $ele = $(ele);
	const $childList = $ele.closest(`li`).find(`ul.adv-contents`);
	if ($ele.data("hidden")) {
		$childList.show();
		$ele.data("hidden", false);
		$ele.html(`[\u2013]`);
	} else {
		$childList.hide();
		$ele.data("hidden", true);
		$ele.html(`[+]`);
	}
}

function sortAdventures (a, b, o) {
	a = adventures[a.elm.getAttribute(FLTR_ID)];
	b = adventures[b.elm.getAttribute(FLTR_ID)];

	if (o.valueName === "name") {
		return byName();
	}

	if (o.valueName === "storyline") {
		return orFallback(ascSort, "storyline");
	}

	if (o.valueName === "level") {
		return orFallback(ascSort, "_startLevel");
	}

	if (o.valueName === "published") {
		return orFallback(ascSortDate, "_pubDate");
	}

	function byName () {
		return ascSort(a.name, b.name);
	}

	function ascSortDate (a, b) {
		return b.getTime() - a.getTime();
	}

	function orFallback (func, prop) {
		const initial = func(a[prop], b[prop]);
		return initial !== 0 ? initial : byName();
	}
}