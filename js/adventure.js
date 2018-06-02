"use strict";

const CONTENTS_URL = "data/adventures.json";

let adventures;

window.onload = function load () {
	BookUtil.renderArea = $(`#pagecontent`);

	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());
	if (window.location.hash.length) BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message">Loading...</td></tr>`);
	else BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message">Select an adventure to begin</td></tr>`);
	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());

	DataUtil.loadJSON(CONTENTS_URL).then(onJsonLoad);
};

function onJsonLoad (data) {
	adventures = data.adventure;

	const adventuresList = $("ul.contents");
	adventuresList.append($(`
		<li>
			<a href='adventures.html'>
				<span class='name'>\u21FD All Adventures</span>
			</a>
		</li>
	`));

	let tempString = "";
	for (let i = 0; i < adventures.length; i++) {
		const adv = adventures[i];

		tempString +=
			`<li class="contents-item" data-bookid="${UrlUtil.encodeForHash(adv.id)}" style="display: none;">
				<a id="${i}" href='#${adv.id},0' title='${adv.name}'>
					<span class='name'>${adv.name}</span>
				</a>
				${BookUtil.makeContentsBlock({book: adv, addOnclick: true, defaultHeadersHidden: true})}
			</li>`;
	}
	adventuresList.append(tempString);

	BookUtil.addHeaderHandles(true);

	const list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "contents"
	});

	BookUtil.baseDataUrl = "data/adventure/adventure-";
	BookUtil.bookIndex = adventures;

	window.onhashchange = BookUtil.booksHashChange;
	if (window.location.hash.length) {
		BookUtil.booksHashChange();
	} else {
		$(`.contents-item`).show();
	}
}