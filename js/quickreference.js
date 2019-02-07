"use strict";

// NOTE: This file is generated with the Node script `generate-quick-reference.js`
const JSON_URL = "data/generated/bookref-quick.json";

let reference;

window.onload = function load () {
	BookUtil.renderArea = $(`#pagecontent`);

	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());
	if (window.location.hash.length) BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message">Loading...</td></tr>`);
	else BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message">Select a section to begin</td></tr>`);
	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());

	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	Omnisearch.addScrollTopFloat();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

function onJsonLoad (data) {
	reference = [data.reference["bookref-quick"]];
	BookUtil.contentType = "document";

	const allContents = $("ul.contents");
	let tempString = "";
	for (let i = 0; i < reference.length; i++) {
		const book = reference[i];

		tempString += BookUtil.getContentsItem(i, book, {book, addOnclick: true});
	}
	allContents.append(tempString);

	BookUtil.addHeaderHandles(false);

	const list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "contents"
	});

	BookUtil.baseDataUrl = "data/generated/";
	BookUtil.bookIndex = reference;
	BookUtil.referenceId = "bookref-quick";
	BookUtil.initLinkGrabbers();

	window.onhashchange = BookUtil.booksHashChange;
	if (window.location.hash.length) {
		BookUtil.booksHashChange();
	} else {
		window.location.hash = "#bookref-quick";
	}
}
