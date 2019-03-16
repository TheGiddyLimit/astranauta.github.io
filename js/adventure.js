"use strict";

const CONTENTS_URL = "data/adventures.json";

window.onload = function load () {
	BookUtil.renderArea = $(`#pagecontent`);

	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());
	BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message book-loading-message">Loading...</td></tr>`);
	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());

	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	Omnisearch.addScrollTopFloat();
	DataUtil.loadJSON(CONTENTS_URL).then(onJsonLoad);
};

let list;
let adventures = [];
let adI = 0;
function onJsonLoad (data) {
	$("ul.contents").append($(`<li><a href='adventures.html'><span class='name'>\u21FD All Adventures</span></a></li>`));

	list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "contents"
	});

	BookUtil.baseDataUrl = "data/adventure/adventure-";
	BookUtil.homebrewIndex = "adventure";
	BookUtil.homebrewData = "adventureData";
	BookUtil.initLinkGrabbers();

	addAdventures(data);

	$(`.book-head-message`).text(`Select an adventure from the list on the left`);
	$(`.book-loading-message`).text(`Select a book to begin`);

	window.onhashchange = BookUtil.booksHashChange;
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(() => BrewUtil.pAddLocalBrewData())
		.catch(BrewUtil.pPurgeBrew)
		.then(() => {
			if (window.location.hash.length) {
				BookUtil.booksHashChange();
			} else {
				$(`.contents-item`).show();
			}
		});
}

function handleBrew (homebrew) {
	addAdventures(homebrew);
	BookUtil.addHeaderHandles(true);
	return Promise.resolve();
}

function addAdventures (data) {
	if (!data.adventure || !data.adventure.length) return;

	adventures = adventures.concat(data.adventure);
	BookUtil.bookIndex = adventures;
	BookUtil.contentType = "adventure";

	const adventuresList = $("ul.contents");
	let tempString = "";
	for (; adI < adventures.length; adI++) {
		const adv = adventures[adI];

		tempString += BookUtil.getContentsItem(adI, adv, {book: adv, addOnclick: true, defaultHeadersHidden: true});
	}
	adventuresList.append(tempString);
}
