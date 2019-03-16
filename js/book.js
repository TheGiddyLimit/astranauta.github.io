"use strict";

const JSON_URL = "data/books.json";

window.onload = function load () {
	BookUtil.renderArea = $(`#pagecontent`);

	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());
	BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message book-loading-message">Loading...</td></tr>`);
	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());

	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	Omnisearch.addScrollTopFloat();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

let list;
let books = [];
let bkI = 0;
function onJsonLoad (data) {
	$("ul.contents").append($(`<li><a href='books.html'><span class='name'>\u21FD All Books</span></a></li>`));
	const list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "contents"
	});

	BookUtil.baseDataUrl = "data/book/book-";
	BookUtil.homebrewIndex = "book";
	BookUtil.homebrewData = "bookData";
	BookUtil.initLinkGrabbers();

	addBooks(data);

	$(`.book-head-message`).text(`Select a book from the list on the left`);
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
	addBooks(homebrew);
	BookUtil.addHeaderHandles(true);
	return Promise.resolve();
}

function addBooks (data) {
	if (!data.book || !data.book.length) return;

	books = books.concat(data.book);
	BookUtil.bookIndex = books;
	BookUtil.contentType = "book";

	const allContents = $("ul.contents");
	let tempString = "";
	for (; bkI < books.length; bkI++) {
		const book = books[bkI];

		tempString += BookUtil.getContentsItem(bkI, book, {book, addOnclick: true, defaultHeadersHidden: true});
	}
	allContents.append(tempString);
}
