"use strict";

const CONTENTS_URL = "data/adventures.json";

window.onload = function load () {
	BookUtil.renderArea = $(`#pagecontent`);

	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());
	if (window.location.hash.length) BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message">Loading...</td></tr>`);
	else BookUtil.renderArea.append(`<tr><td colspan="6" class="initial-message">Select an adventure to begin</td></tr>`);
	BookUtil.renderArea.append(EntryRenderer.utils.getBorderTr());

	DataUtil.loadJSON(CONTENTS_URL).then(onJsonLoad);
};

let list;
let adventures = [];
let adI = 0;
function onJsonLoad (data) {
	const adventuresList = $("ul.contents");
	adventuresList.append($(`
		<li>
			<a href='adventures.html'>
				<span class='name'>\u21FD All Adventures</span>
			</a>
		</li>
	`));

	list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "contents"
	});

	BookUtil.baseDataUrl = "data/adventure/adventure-";
	BookUtil.homebrewIndex = "adventure";
	BookUtil.homebrewData = "adventureData";
	BookUtil.initLinkGrabbers();

	addAdventures(data);

	window.onhashchange = BookUtil.booksHashChange;
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(BrewUtil.pAddLocalBrewData)
		.catch(BrewUtil.purgeBrew)
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

	const adventuresList = $("ul.contents");
	let tempString = "";
	for (; adI < adventures.length; adI++) {
		const adv = adventures[adI];

		tempString +=
			`<li class="contents-item" data-bookid="${UrlUtil.encodeForHash(adv.id)}" style="display: none;">
				<a id="${adI}" href="#${adv.id},0" title="${adv.name}">
					<span class='name'>${adv.name}</span>
				</a>
				${BookUtil.makeContentsBlock({book: adv, addOnclick: true, defaultHeadersHidden: true})}
			</li>`;
	}
	adventuresList.append(tempString);
}