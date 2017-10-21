window.onhashchange = function hashchange(e) {
	const [link, ...sub] = window.location.hash.slice(1).split(',');

	if (!e || sub.length === 0) {
		const $list = $("#listcontainer");
		const $el = $list.find(`a[href='#${link.toLowerCase()}']`);
		loadhash($el.attr("id"));
		document.title = decodeURIComponent($el.attr("title")) + " - 5etools";
	}

	if (typeof loadsub === "function" && sub.length > 0) loadsub(sub)
};
