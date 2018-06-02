"use strict";

const JSON_URL = "data/books.json";

let books;

window.onload = function load () {
	BookUtil.renderArea = $(`#pagecontent`);

	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());
	if (window.location.hash.length) BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message">Loading...</td></tr>`);
	else BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message">Select a book to begin</td></tr>`);
	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());

	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

function onJsonLoad (data) {
	books = data.book;

	const allContents = $("ul.contents");

	let tempString = "";
	for (let i = 0; i < books.length; i++) {
		const book = books[i];

		tempString +=
			`<li class="contents-item" data-bookid="${UrlUtil.encodeForHash(book.id)}">
				<a id="${i}" href='#${book.id},0' title='${book.name}'>
					<span class='name'>${book.name}</span>
				</a>
				${BookUtil.makeContentsBlock({book: book, addOnclick: true, defaultHeadersHidden: true})}
			</li>`;
	}
	allContents.append(tempString);

	BookUtil.addHeaderHandles(true);

	const list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "contents"
	});

	BookUtil.baseDataUrl = "data/book/book-";
	BookUtil.bookIndex = books;

	window.onhashchange = BookUtil.booksHashChange;
	if (window.location.hash.length) {
		BookUtil.booksHashChange();
	} else {
		$(`.contents-item`).show();
	}
}
