"use strict";

class Books {
	static sortBooks (dataList, a, b) {
		a = dataList[a.elm.getAttribute(FLTR_ID)];
		b = dataList[b.elm.getAttribute(FLTR_ID)];
		return SortUtil.ascSort(a.name, b.name);
	}
}

const booksList = new BooksList({
	contentsUrl: "data/books.json",
	sortFn: Books.sortBooks,
	dataProp: "book",
	rootPage: "book.html",
	rowBuilderFn: (bk) => {
		return `<span class="col-12 name">${bk.name}</span>`;
	}
});

window.onload = booksList.onPageLoad.bind(booksList);

function handleBrew (homebrew) {
	booksList.addData(homebrew);
	return Promise.resolve();
}
