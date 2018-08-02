"use strict";

const JSON_URL = "data/demo.json";

window.onload = loadJson;

function loadJson () {
	DataUtil.loadJSON(JSON_URL).then(initDemo)
}

function initDemo (data) {
	const defaultJson = data.data[0];

	const renderer = new EntryRenderer();
	const $msg = $(`#message`);
	const $in = $(`#jsoninput`);
	const $out = $(`#pagecontent`);

	const $btnRender = $(`#demoRender`);
	const $btnReset = $(`#demoReset`);

	// init editor
	const editor = ace.edit("jsoninput");
	editor.setOptions({
		wrap: true
	});

	function demoRender () {
		$msg.html("");
		const renderStack = [];
		let json;
		try {
			json = JSON.parse(editor.getValue());
		} catch (e) {
			$msg.html(`Invalid JSON! We recommend using <a href="https://jsonlint.com/" target="_blank">JSONLint</a>.`);
			setTimeout(() => {
				throw e
			});
		}

		renderer.recursiveEntryRender(json, renderStack);
		$out.html(`
			<tr><th class="border" colspan="6"></th></tr>
			<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
			<tr><th class="border" colspan="6"></th></tr>		
		`)
	}

	function demoReset () {
		editor.setValue(JSON.stringify(defaultJson, null, "\t"));
		editor.clearSelection();
		demoRender();
	}

	demoReset();

	$btnReset.on("click", () => {
		demoReset();
	});
	$btnRender.on("click", () => {
		demoRender();
	});
	$in.on("change", () => {
		demoRender();
	});
}
