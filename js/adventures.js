"use strict";

class Adventures {
	static sortAdventures (dataList, a, b, o) {
		a = dataList[a.elm.getAttribute(FLTR_ID)];
		b = dataList[b.elm.getAttribute(FLTR_ID)];

		if (o.valueName === "name") return byName();
		if (o.valueName === "storyline") return orFallback(SortUtil.ascSort, "storyline");
		if (o.valueName === "level") return orFallback(SortUtil.ascSort, "_startLevel");
		if (o.valueName === "published") return orFallback(ascSortDate, "_pubDate");

		function byName () {
			return SortUtil.ascSort(a.name, b.name);
		}

		function ascSortDate (a, b) {
			return b.getTime() - a.getTime();
		}

		function orFallback (func, prop) {
			const initial = func(a[prop] || "", b[prop] || "");
			return initial || byName();
		}
	}

	static getLevelsStr (adv) {
		if (adv.level.custom) return adv.level.custom;
		return `Level ${adv.level.start}\u2013${adv.level.end}`
	}

	static getDateStr (adv) {
		const date = new Date(adv.published);
		return MiscUtil.dateToStr(date);
	}
}
const adventuresList = new BooksList({
	contentsUrl: "data/adventures.json",
	sortFn: Adventures.sortAdventures,
	dataProp: "adventure",
	enhanceRowDataFn: (adv) => {
		adv._startLevel = adv.level.start || 20;
		adv._pubDate = new Date(adv.published);
	},
	rootPage: "adventure.html",
	rowBuilderFn: (adv) => {
		return `<span class="col-6-2 name">${adv.name}</span>
		<span class="col-2-5 adv-detail">${adv.storyline || "\u2014"}</span>
		<span class="col-1-3 adv-detail">${Adventures.getLevelsStr(adv)}</span>
		<span class="col-2 adv-detail">${Adventures.getDateStr(adv)}</span>`;
	}
});

window.onload = adventuresList.onPageLoad.bind(adventuresList);

function handleBrew (homebrew) {
	adventuresList.addData(homebrew);
	return Promise.resolve();
}
