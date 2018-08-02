"use strict";

// NOTE: This file is generated with the Node script `generate-quick-reference.js`
const JSON_URL = "data/bookref-quick.json";

let reference;

window.onload = function load () {
	BookUtil.renderArea = $(`#pagecontent`);

	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());
	if (window.location.hash.length) BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message">Loading...</td></tr>`);
	else BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message">Select a section to begin</td></tr>`);
	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());

	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

function onJsonLoad (data) {
	reference = [data.reference["bookref-quick"]];

	const allContents = $("ul.contents");
	let tempString = "";
	for (let i = 0; i < reference.length; i++) {
		const book = reference[i];

		tempString +=
			`<li class="contents-item" data-bookid="${UrlUtil.encodeForHash(book.id)}">
				<a id="${i}" href="#${book.id},0" title="${book.name}">
					<span class='name'>${book.name}</span>
				</a>
				${BookUtil.makeContentsBlock({book: book, addOnclick: true})}
			</li>`;
	}
	allContents.append(tempString);

	BookUtil.addHeaderHandles(false);

	const list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "contents"
	});

	BookUtil.baseDataUrl = "data/";
	BookUtil.bookIndex = reference;
	BookUtil.referenceId = "bookref-quick";

	window.onhashchange = BookUtil.booksHashChange;
	if (window.location.hash.length) {
		BookUtil.booksHashChange();
	} else {
		window.location.hash = "#bookref-quick,0";
	}
}
