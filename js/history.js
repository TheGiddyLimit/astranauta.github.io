window.onhashchange = function hashchange(e) {
	const splitHash = window.location.hash.slice(1).split(',');
	const link = splitHash[0];
	const sub = splitHash.slice(1);

	const $list = $("#listcontainer");
	const $el = $list.find(`a[href='#${link.toLowerCase()}']`);
	loadhash($el.attr("id"));
	document.title = decodeURIComponent($el.attr("title")) + " - 5etools";

	loadsub(sub)
};
