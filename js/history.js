function hashchange(e) {
	const [link, ...sub] = window.location.hash.slice(1).split(',');

	if (!e || sub.length === 0) {
		const $el = $(`#listcontainer a[href='#${link.toLowerCase()}']`);
		loadhash($el.attr("id"));
		document.title = decodeURIComponent($el.attr("title")) + " - 5etools";
	}

	if (typeof loadsub === "function" && sub.length > 0)
		loadsub(sub)
}

function initHistory() {
	window.onhashchange = hashchange;
	if (window.location.hash.length) {
		hashchange();
	} else {
		location.replace($("#listcontainer .list a").attr('href'));
	}
}
