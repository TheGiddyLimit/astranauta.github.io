class LangDemoUi {
	static init () {
		$(`#btn__roll`).click(() => LangDemoUi.run("roll"));
		$(`#btn__avg`).click(() => LangDemoUi.run("avg"));
		$(`#btn__min`).click(() => LangDemoUi.run("min"));
		$(`#btn__max`).click(() => LangDemoUi.run("max"));
		$(`#btn__validate`).click(async () => {
			const msg = Renderer.dice.lang.validate3(LangDemoUi._$ipt.val());
			LangDemoUi._handleInvalidMessage(msg);
		});

		// region select sample
		const $selSample = $(`#sel__sample`);
		LangDemoUi._SAMPLES.forEach((it, i) => {
			$selSample.append(`<option value="${i}">${it.name}</option>`);
		});
		$selSample.change(() => {
			const sample = LangDemoUi._SAMPLES[$selSample.val()];
			LangDemoUi._$ipt.val(sample.code).change();
		});
		$selSample.val("-1");
		// endregion

		// region input
		LangDemoUi._$ipt = $(`#ipt`);
		LangDemoUi._$ipt.change(() => {
			StorageUtil.syncSetForPage("input", LangDemoUi._$ipt.val());
		});
		const prevInput = StorageUtil.syncGetForPage("input");
		if (prevInput && prevInput.trim()) LangDemoUi._$ipt.val(prevInput.trim());
		// endregion
	}

	static _handleInvalidMessage (msg) {
		if (msg) JqueryUtil.doToast({content: `Invalid \u2014 ${msg}`, type: "danger"});
		else JqueryUtil.doToast({content: `Valid!`, type: "success"});
	}

	static run (mode) {
		const ipt = LangDemoUi._$ipt.val().trim();

		// Check if valid, but continue execution regardless to ease debugging
		const invalidMsg = Renderer.dice.lang.validate3(ipt);
		if (invalidMsg) LangDemoUi._handleInvalidMessage(invalidMsg);

		const $dispOutLexed = $(`#out_lexed`).html("");
		const $dispOutParsed = $(`#out_parsed`).html("");
		const $dispOutResult = $(`#out_result`).html("");

		const lexed = Renderer.dice.lang._lex3(ipt);

		$dispOutLexed.html(lexed.map(it => it ? it.toDebugString() : "").join("\n"));

		const parsed = Renderer.dice.lang._parse3(lexed);

		$dispOutParsed.html(`${parsed}`);

		if (mode === "roll") {
			const meta = {
				html: [],
				text: [],
				allMax: [],
				allMin: [],
			};
			const result = parsed.evl(meta);
			$dispOutResult.text(result);
			$(`#wrp_context`).html(meta.html);
		} else {
			const result = parsed[mode]();
			$dispOutResult.text(result);
			$(`#wrp_context`).html("");
		}
	}
}
LangDemoUi._$ipt = null;
LangDemoUi._$wrpContext = null;
LangDemoUi._metasContext = [];
LangDemoUi._SAMPLES = [
	{
		name: "Empty",
		code: `



`,
	},
	{
		name: "Number",
		code: `1`,
	},
	{
		name: "Sum",
		code: `1 + 1`,
	},
	{
		name: "Multiplication",
		code: `2 * 3`,
	},
	{
		name: "Exponent",
		code: `3^3^2  # Should equal 19683`,
	},
	{
		name: "Parentheses",
		code: `(2 + 3) * 4`, // 20
	},
];

window.addEventListener("load", () => LangDemoUi.init());
