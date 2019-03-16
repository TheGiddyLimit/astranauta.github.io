"use strict";

const STORAGE_SHORT_TOKEN = "st";

window.addEventListener("load", () => {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search

	const view = new InitiativeTrackerPlayerMessageHandlerPage();
	const storedCbShortVal = StorageUtil.syncGetForPage(STORAGE_SHORT_TOKEN);

	const $iptServerToken = $(`#initp__ipt_server_token`).disableSpellcheck();
	const $btnGenClientToken = $(`#initp__btn_gen_client_token`);
	const $iptClientToken = $(`#initp__ipt_client_token`).disableSpellcheck();
	const $cbShortToken = $(`#initp__cb_short`)
		.change(() => StorageUtil.syncSetForPage(STORAGE_SHORT_TOKEN, $cbShortToken.prop("checked")))
		.prop("checked", storedCbShortVal == null ? true : storedCbShortVal);

	const ui = new InitiativeTrackerPlayerUi(view, $iptServerToken, $btnGenClientToken, $iptClientToken, $cbShortToken);
	ui.init();

	const $body = $(`body`);
	$body.on("keypress", (e) => {
		if (((e.key === "f") && noModifierKeys(e))) {
			if (MiscUtil.isInInput(e)) return;
			e.preventDefault();

			if (view.isActive) $body.toggleClass("is-fullscreen");
		}
	});
});

class InitiativeTrackerPlayerMessageHandlerPage extends InitiativeTrackerPlayerMessageHandler {
	constructor () {
		super(false);
	}

	initUi () {
		if (this._isUiInit) return;

		this._isUiInit = true;
		$(`.initp__initial`).remove();
		$(`.initp__wrp_active`).show();

		this._$meta = $(`.initp__meta`);
		this._$head = $(`.initp__header`);
		this._$rows = $(`.initp__rows`);

		$(window).on("beforeunload", evt => {
			if (this._clientData.client.isActive) {
				const message = `The connection will be closed`;
				(evt || window.event).message = message;
				return message;
			}
		});
	}
}
