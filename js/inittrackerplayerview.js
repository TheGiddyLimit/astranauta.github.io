"use strict";

const STORAGE_SHORT_TOKEN = "st";

window.addEventListener("load", () => {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search

	const view = new InitiativeTrackerPlayerMessageHandlerPage();
	var ui = new InitiativeTrackerPlayerUi(view);
	const storedCbShortVal = StorageUtil.syncGetForPage(STORAGE_SHORT_TOKEN);

	const $iptServerToken = $(`#initp__ipt_server_token`).disableSpellcheck();
	const $btnConnectToServer = $(`#initp__btn_gen_client_token`);
	const $iptPlayerName = $(`#initp__ipt_player_name`).disableSpellcheck();

	$btnConnectToServer.click(async () => {
		ui.load($iptPlayerName.val(), $iptServerToken.val());
		ui.init();
		ui._clientPeer._connection.on("data", function (data) {
			view.handleMessage(data);
		})
	});

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
			const message = `The connection will be closed`;
			(evt || window.event).message = message;
			return message;
		});
	}
}
