"use strict";

const JSON_URL = "data/demo.json";
const STORAGE_LOCATION = "demoInput";

window.onload = loadJson;

function loadJson () {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	DataUtil.loadJSON(JSON_URL).then(initDemo)
}

async function initDemo (data) {
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
		wrap: true,
		showPrintMargin: false,
		tabSize: 2
	});

	function demoRender () {
		$msg.html("");
		const renderStack = [];
		let json;
		try {
			json = JSON.parse(editor.getValue());
		} catch (e) {
			$msg.html(`Invalid JSON! We recommend using <a href="https://jsonlint.com/" target="_blank" rel="noopener">JSONLint</a>.`);
			setTimeout(() => {
				throw e
			});
		}

		renderer.setFirstSection(true);
		renderer.resetHeaderIndex();
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
		editor.selection.moveCursorToPosition({row: 0, column: 0});
	}

	try {
		const prevInput = await StorageUtil.pGetForPage(STORAGE_LOCATION);
		if (prevInput) {
			editor.setValue(prevInput, -1);
			demoRender();
		} else demoReset();
	} catch (ignored) {
		setTimeout(() => { throw ignored; });
		demoReset();
	}

	const renderAndSaveDebounced = MiscUtil.debounce(() => {
		demoRender();
		StorageUtil.pSetForPage(STORAGE_LOCATION, editor.getValue());
	}, 150);

	$btnReset.on("click", () => {
		demoReset();
	});
	$btnRender.on("click", () => {
		demoRender();
	});
	editor.on("change", () => {
		renderAndSaveDebounced();
	});
}
