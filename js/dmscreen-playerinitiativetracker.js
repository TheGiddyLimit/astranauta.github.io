"use strict";

class InitiativeTrackerPlayer {
	static make$tracker (board, state) {
		const $meta = $(`<div class="initp__meta"/>`).hide();
		const $head = $(`<div class="initp__header"/>`).hide();
		const $rows = $(`<div class="initp__rows"/>`).hide();

		const $wrpTracker = $(`<div class="initp__wrp_active">
			<div data-r="$meta"/>
			<div data-r="$head"/>
			<div data-r="$rows"/>
		</div>`).swap({$meta, $head, $rows});

		const view = new InitiativeTrackerPlayerMessageHandlerScreen();
		view.setElements($meta, $head, $rows);

		const $btnConnectRemote = $(`<button class="btn btn-primary mb-2" style="min-width: 200px;">Connect to Remote Tracker</button>`)
			.click(() => {
				$btnConnectRemote.detach();
				$btnConnectLocal.detach();

				const $iptServerToken = $(`<input class="form-control input-sm code">`).disableSpellcheck();
				const $btnGenClientToken = $(`<button class="btn btn-primary btn-xs">Generate Client Token</button>`);
				const $iptClientToken = $(`<input class="form-control input-sm code copyable">`).disableSpellcheck();
				const $cbShortToken = $(`<input type="checkbox" checked>`);

				const $btnCancel = $(`<button class="btn btn-default btn-xs">Back</button>`)
					.click(() => {
						// restore original state
						$wrpClient.remove();
						$wrpInitial.append($btnConnectRemote).append($btnConnectLocal);
					});

				const $wrpClient = $(`<div class="flex-col full-width">
					<div class="flex-vh-center px-4 mb-2">
						<span style="min-width: fit-content;" class="mr-2">Server Token</span>
						<div data-r="$iptServerToken"/>
					</div>
					
					<div class="split px-4 mb-2">
						<label class="flex-label">
								<span class="mr-2 help" title="Turning this off will produce a client token which is roughly twice as long, but contains only standard characters.">Short client token</span>
								<div data-r="$cbShortToken"/>
						</label>
						<div data-r="$btnGenClientToken"/>					
					</div>
					
					<div class="flex-vh-center px-4 mb-2">
						<span style="min-width: fit-content;" class="mr-2">Client Token</span>
						<div data-r="$iptClientToken"/>
					</div>
					
					<div class="flex-vh-center px-4">
						<div data-r="$btnCancel"/>
					</div>
				</div>`).swap({$iptServerToken, $btnGenClientToken, $iptClientToken, $cbShortToken, $btnCancel}).appendTo($wrpInitial);

				const ui = new InitiativeTrackerPlayerUi(view, $iptServerToken, $btnGenClientToken, $iptClientToken, $cbShortToken);
				ui.init();
			});
		const $btnConnectLocal = $(`<button class="btn btn-primary" style="min-width: 200px;">Connect to Local Tracker</button>`)
			.click(() => {
				const existingTrackers = board.getPanelsByType(PANEL_TYP_INITIATIVE_TRACKER)
					.map(it => it.tabDatas.filter(td => td.type === PANEL_TYP_INITIATIVE_TRACKER).map(td => td.$content.find(`.dms__data_anchor`)))
					.flat();

				if (existingTrackers.length) {
					if (existingTrackers.length === 1) {
						existingTrackers[0].data("doConnectLocal")(view);
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

								await existingTrackers[Number($selTracker.val())].data("doConnectLocal")(view);

								// restore original state
								$btnCancel.remove(); $wrpSel.remove();
								$wrpInitial.append($btnConnectRemote).append($btnConnectLocal);
							});

						const $wrpSel = $(`<div class="flex-vh-center mb-2">
							<div data-r="$selTracker"/>
							<div data-r="$btnOk"/>
						</div>`).swap({$selTracker, $btnOk}).appendTo($wrpInitial);

						const $btnCancel = $(`<button class="btn btn-default btn-xs">Back</button>`)
							.click(() => {
								// restore original state
								$btnCancel.remove(); $wrpSel.remove();
								$wrpInitial.append($btnConnectRemote).append($btnConnectLocal);
							})
							.appendTo($wrpInitial);
					}
				} else {
					JqueryUtil.doToast({content: "No local trackers detected!", type: "warning"});
				}
			});

		const $wrpInitial = $(`<div class="flex-vh-center full-height flex-col">
			<div data-r="$btnConnectRemote"/>
			<div data-r="$btnConnectLocal"/>
		</div>`).swap({$btnConnectRemote, $btnConnectLocal}).appendTo($wrpTracker);
		view.$wrpInitial = $wrpInitial;

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
		this._$wrpInitial.hide();

		$(window).on("beforeunload", evt => {
			if (this._clientData.client.isActive) {
				const message = `The connection will be closed`;
				(evt || window.event).message = message;
				return message;
			}
		});
	}

	set $wrpInitial ($wrpInitial) { this._$wrpInitial = $wrpInitial; }
}
