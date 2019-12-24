"use strict";

class InitiativeTrackerPlayer {
	static make$tracker (board, state) {
		const $meta = $(`<div class="initp__meta"/>`).hide();
		const $head = $(`<div class="initp__header"/>`).hide();
		const $rows = $(`<div class="initp__rows"/>`).hide();

		const $wrpTracker = $$`<div class="initp__wrp_active">
			${$meta}
			${$head}
			${$rows}
		</div>`;

		const view = new InitiativeTrackerPlayerMessageHandlerScreen();
		view.setElements($meta, $head, $rows);

		var ui = new InitiativeTrackerPlayerUi(view);
		const $btnConnectRemote = $(`<button class="btn btn-primary mb-2" style="min-width: 200px;">Connect to Remote Tracker</button>`)
			.click(() => {
				$btnConnectRemote.detach();
				$btnConnectLocal.detach();

				const $iptServerToken = $(`<input class="form-control input-sm code">`).disableSpellcheck();
				const $btnGenConnect = $(`<button class="btn btn-primary btn-xs">Connect</button>`);
				const $iptPlayerName = $(`<input class="form-control input-sm code">`).disableSpellcheck();

				const $btnCancel = $(`<button class="btn btn-default btn-xs">Back</button>`)
					.click(() => {
						// restore original state
						$wrpClient.remove();
						view.$wrpInitial.append($btnConnectRemote).append($btnConnectLocal);
					});

				const $wrpClient = $$`<div class="flex-col w-100">
					<div class="flex-vh-center px-4 mb-2">
						<span style="min-width: fit-content;" class="mr-2">Server Token</span>
						${$iptServerToken}
					</div>
					
					<div class="split px-4 mb-2">
						${$btnGenConnect}					
					</div>
					
					<div class="flex-vh-center px-4 mb-2">
						<span style="min-width: fit-content;" class="mr-2">Player Name</span>
						${$iptPlayerName}
					</div>
					
					<div class="flex-vh-center px-4">
						${$btnCancel}
					</div>
				</div>`.appendTo(view.$wrpInitial);
				$btnGenConnect.click(async () => {
					ui.load($iptPlayerName.val(), $iptServerToken.val());
					ui.init();
					ui._clientPeer._connection.on("data", function (data) {
						view.handleMessage(data);
					})
				});
			});

		const $btnConnectLocal = $(`<button class="btn btn-primary" style="min-width: 200px;">Connect to Local Tracker</button>`)
			.click(() => {
				const existingTrackers = board.getPanelsByType(PANEL_TYP_INITIATIVE_TRACKER)
					.map(it => it.tabDatas.filter(td => td.type === PANEL_TYP_INITIATIVE_TRACKER).map(td => td.$content.find(`.dm__data-anchor`)))
					.flat();
				if (existingTrackers.length) {
					if (existingTrackers.length === 1) {
						const token = existingTrackers[0].data("doConnectLocal")(view);
						ui.load("Local", token);
						ui.init();
						ui._clientPeer._connection.on("data", function (data) {
							view.handleMessage(data);
						})
					} else {
						$btnConnectRemote.detach();
						$btnConnectLocal.detach();

						const $selTracker = $(`<select class="form-control input-xs mr-1">
							<option value="-1" disabled>Select a local tracker</option>
						</select>`).change(() => $selTracker.removeClass("error-background"));
						existingTrackers.forEach(($e, i) => $selTracker.append(`<option value="${i}">${$e.data("getSummary")()}</option>`));
						$selTracker.val("-1");

						const $btnOk = $(`<button class="btn btn-primary btn-xs">OK</button>`)
							.click(async () => {
								if ($selTracker.val() === "-1") return $selTracker.addClass("error-background");

								const token = existingTrackers[Number($selTracker.val())].data("doConnectLocal")(view);
								ui.load("Local", token);
								ui.init();
								ui._clientPeer._connection.on("data", function (data) {
									view.handleMessage(data);
								})
								// restore original state
								$btnCancel.remove(); $wrpSel.remove();
								view.$wrpInitial.append($btnConnectRemote).append($btnConnectLocal);
							});

						const $wrpSel = $$`<div class="flex-vh-center mb-2">
							${$selTracker}
							${$btnOk}
						</div>`.appendTo(view.$wrpInitial);

						const $btnCancel = $(`<button class="btn btn-default btn-xs">Back</button>`)
							.click(() => {
								// restore original state
								$btnCancel.remove(); $wrpSel.remove();
								view.$wrpInitial.append($btnConnectRemote).append($btnConnectLocal);
							})
							.appendTo(view.$wrpInitial);
					}
				} else {
					JqueryUtil.doToast({content: "No local trackers detected!", type: "warning"});
				}
			});

		view.$wrpInitial = $$`<div class="flex-vh-center h-100 flex-col dm__panel-bg">
			${$btnConnectRemote}
			${$btnConnectLocal}
		</div>`.appendTo($wrpTracker);

		return $wrpTracker;
	}
}

class InitiativeTrackerPlayerMessageHandlerScreen extends InitiativeTrackerPlayerMessageHandler {
	constructor () {
		super(true);

		this._$wrpInitial = null;
	}

	initUi () {
		if (this._isUiInit) return;
		this._isUiInit = true;

		this._$meta.show();
		this._$head.show();
		this._$rows.show();
		this._$wrpInitial.addClass("hidden");

		$(window).on("beforeunload", evt => {
			if (this._clientData.client.isActive) {
				const message = `The connection will be closed`;
				(evt || window.event).message = message;
				return message;
			}
		});
	}

	set $wrpInitial ($wrpInitial) { this._$wrpInitial = $wrpInitial; }
	get $wrpInitial () { return this._$wrpInitial; }
}
