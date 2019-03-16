"use strict";

class InitiativeTracker {
	static make$Tracker (board, state) {
		const ALPHA = "ALPHA";
		const NUM = "NUMBER";
		const ASC = "ASC";
		const DESC = "DESC";

		const _propDefaultFalse = (savedVal) => !!savedVal;
		const _propDefaultTrue = (savedVal) => savedVal == null ? true : !!savedVal;

		const cfg = {
			sort: state.s || NUM,
			dir: state.d || DESC,
			isLocked: false,
			isRollHp: _propDefaultFalse(state.m),
			importIsRollGroups: _propDefaultTrue(state.g),
			importIsAddPlayers: _propDefaultTrue(state.p),
			importIsAppend: _propDefaultFalse(state.a),
			statsAddColumns: _propDefaultFalse(state.k),
			playerInitShowExactHp: _propDefaultFalse(state.piH),
			playerInitHideNewMonster: _propDefaultTrue(state.piV),
			playerInitShowOrdinals: _propDefaultFalse(state.piO),
			playerInitShortTokens: _propDefaultTrue(state.piS),
			statsCols: state.c || []
		};

		const $wrpTracker = $(`<div class="dm-init dms__data_anchor"/>`);

		// Unused; to be considered for other applications
		const handleResize = () => {
			// if ($wrpTracker.width() > 420) { // approx width of a long name + controls
			// 	$wrpTracker.find(`.dm-init-row-mid`).show();
			// } else {
			// 	$wrpTracker.find(`.dm-init-row-mid`).hide();
			// }
		};
		board.reactor.on("panelResize", handleResize);
		$wrpTracker.on("destroyed", () => board.reactor.off("panelResize", handleResize));

		const p2pMeta = {rows: [], serverInfo: null};
		const _sendStateToClients = () => {
			if (p2pMeta.serverInfo === null) return;

			p2pMeta.rows = p2pMeta.rows.filter(r => !r.isDeleted);
			p2pMeta.serverInfo = p2pMeta.serverInfo.filter(r => {
				if (r.isDeleted) {
					r.server.close();
					return false;
				} else return true;
			});

			const toSend = getPlayerFriendlyState();
			try {
				p2pMeta.serverInfo.filter(info => info.server.isActive).forEach(info => info.server.sendMessage(toSend));
			} catch (e) { setTimeout(() => { throw e; }) }
		};
		const sendStateToClientsDebounced = MiscUtil.debounce(_sendStateToClients, 100); // long delay to avoid network spam

		const doUpdateExternalStates = () => {
			board.doSaveStateDebounced();
			sendStateToClientsDebounced();
		};

		const makeImportSettingsModal = () => {
			const $modalInner = UiUtil.getShow$Modal("Import Settings", () => doUpdateExternalStates());
			UiUtil.addModal$Sep($modalInner);
			UiUtil.getAddModal$RowCb($modalInner, "Roll creature hit points", cfg, "isRollHp");
			UiUtil.getAddModal$RowCb($modalInner, "Roll groups of creatures together", cfg, "importIsRollGroups");
			UiUtil.getAddModal$RowCb($modalInner, "Add players", cfg, "importIsAddPlayers");
			UiUtil.getAddModal$RowCb($modalInner, "Add to existing tracker state", cfg, "importIsAppend");
		};

		// initialise "upload" context menu
		const contextId = ContextUtil.getNextGenericMenuId();
		ContextUtil.doInitContextMenu(contextId, (evt, ele, $invokedOn, $selectedMenu) => {
			switch (Number($selectedMenu.data("ctx-id"))) {
				case 0:
					EncounterUtil.pGetSavedState().then(savedState => {
						if (savedState) convertAndLoadBestiaryList(savedState.data);
						else {
							JqueryUtil.doToast({
								content: `No saved encounter! Please first go to the Bestiary and create one.`,
								type: "warning"
							});
						}
					});
					break;
				case 1:
					DataUtil.userUpload((json) => {
						if (json) convertAndLoadBestiaryList(json);
					});
					break;
				case 2:
					makeImportSettingsModal();
					break;
			}
		}, ["From Current Bestiary Encounter", "From Bestiary Encounter File", null, "Import Settings"]);

		const $wrpTop = $(`<div class="dm-init-wrp-header-outer"/>`).appendTo($wrpTracker);
		const $wrpHeader = $(`
			<div class="dm-init-wrp-header">
				<div class="dm-init-row-lhs dm-init-header">
					<div class="full-width">Creature/Status</div>
				</div>

				<div class="dm-init-row-mid"/>

				<div class="dm-init-row-rhs">
					<div class="dm-init-header dm-init-header--input dm-init-header--input-wide" title="Hit Points">HP</div>
					<div class="dm-init-header dm-init-header--input" title="Initiative Score">#</div>
					<div style="width: 43px;"/>
				</div>
			</div>
		`).appendTo($wrpTop);

		const $wrpEntries = $(`<div class="dm-init-wrp-entries"/>`).appendTo($wrpTop);

		const $wrpControls = $(`<div class="dm-init-wrp-controls"/>`).appendTo($wrpTracker);

		const $wrpAddNext = $(`<div class="flex"/>`).appendTo($wrpControls);
		const $wrpAdd = $(`<div class="btn-group flex"/>`).appendTo($wrpAddNext);
		const $btnAdd = $(`<button class="btn btn-primary btn-xs dm-init-lockable" title="Add Player"><span class="glyphicon glyphicon-plus"/></button>`).appendTo($wrpAdd);
		const $btnAddMonster = $(`<button class="btn btn-success btn-xs dm-init-lockable mr-2" title="Add Monster"><span class="glyphicon glyphicon-print"/></button>`).appendTo($wrpAdd);
		$(`<button class="btn btn-default btn-xs mr-2" title="Next Turn"><span class="glyphicon glyphicon-step-forward"/></button>`).appendTo($wrpAddNext)
			.click(() => setNextActive());
		const $iptRound = $(`<input class="form-control ipt-sm dm_init__rounds" type="number" min="1" title="Round">`)
			.val(state.n || 1)
			.change(() => doUpdateExternalStates())
			.appendTo($wrpAddNext);

		const $wrpSort = $(`<div class="btn-group flex"/>`).appendTo($wrpControls);
		$(`<button title="Sort Alphabetically" class="btn btn-default btn-xs"><span class="glyphicon glyphicon-sort-by-alphabet"/></button>`).appendTo($wrpSort)
			.click(() => {
				if (cfg.sort === ALPHA) flipDir();
				else cfg.sort = ALPHA;
				doSort(ALPHA);
			});
		$(`<button title="Sort Numerically" class="btn btn-default btn-xs"><span class="glyphicon glyphicon-sort-by-order"/></button>`).appendTo($wrpSort)
			.click(() => {
				if (cfg.sort === NUM) flipDir();
				else cfg.sort = NUM;
				doSort(NUM);
			});

		const $wrpUtils = $(`<div class="flex"/>`).appendTo($wrpControls);
		$(`<button class="btn btn-primary btn-xs mr-2" title="Player Window"><span class="glyphicon glyphicon-user"/></button>`)
			.appendTo($wrpUtils)
			.click(() => {
				const $modalInner = UiUtil.getShow$Modal({
					title: "Configure Player View",
					fullWidth: true,
					fullHeight: true,
					cbClose: () => {
						if (p2pMeta.rows.length) p2pMeta.rows.forEach(row => row.$row.detach());
					}
				});

				const $wrpHelp = UiUtil._getAdd$Row($modalInner, "div");
				const $btnAltGenAll = $(`<button class="btn btn-primary btn-text-insert">Generate All</button>`).click(() => $btnGenServerTokens.click());
				const $btnAltCopyAll = $(`<button class="btn btn-primary btn-text-insert">Copy Server Tokens</button>`).click(() => $btnCopyServers.click());
				$(`<div class="row full-width">
					<div class="col-12">
						<p>
						The Player View is part of a peer-to-peer (i.e., serverless) system to allow players to connect to a DM's initiative tracker. Players should use the <a href="inittrackerplayerview.html">Initiative Tracker Player View</a> page to connect to the DM's instance. As a DM, the usage is as follows:
						<ol>
								<li>Add the required number of players, and input (preferably unique) player names.</li>
								<li>Click "<div data-r="$btnAltGenAll"/>," which will generate a "server token" per player. You can click "<div data-r="$btnAltCopyAll"/>" to copy them all as a single block of text, or click on the "Server Token" values to copy them individually. Distribute these tokens to your players (via a messaging service of your choice; we recommend <a href="https://discordapp.com/">Discord</a>). Each player should paste their token into the <a href="inittrackerplayerview.html">Initiative Tracker Player View</a>, following the instructions provided therein.</li>
								<li>
									Get a resulting "client token" from each player via a messaging service of your choice. Then, either:
									<ol type="a">
										<li>Click the "Accept Multiple Clients" button, and paste in text containing multiple client tokens. <b>This will try to find tokens in <i>any</i> text, ignoring everything else.</b> Pasting a chatroom log (containing, for example, usernames and timestamps mixed with tokens) is the expected usage.</li>
										<li>Paste each token into the appropriate "Client Token" field and "Accept Client" on each. A token can be identified by the slugified player name in the first few characters.</li>
									</ol>
								</li>
							</ol>
						</p>
						<p>Once a player's client has been "accepted," it will receive updates from the DM's tracker. <i>Please note that this system is highly experimental. Your experience may vary.</i></p>
					</div>
				</div>`).swap({$btnAltGenAll, $btnAltCopyAll}).appendTo($wrpHelp);

				UiUtil.addModal$Sep($modalInner);

				const $wrpTop = UiUtil._getAdd$Row($modalInner, "div");

				const $btnAddClient = $(`<button class="btn btn-xs btn-primary" title="Add Client">Add Player</button>`).click(() => addClientRow());

				const $btnCopyServers = $(`<button class="btn btn-xs btn-primary" title="Copy any available server tokens to the clipboard">Copy Server Tokens</button>`)
					.click(async () => {
						const targetRows = p2pMeta.rows.filter(it => !it.isDeleted && !it.$iptTokenClient.attr("disabled"));
						if (!targetRows.length) {
							JqueryUtil.doToast({
								content: `No free server tokens to copy. Generate some!`,
								type: "warning"
							});
						} else {
							await MiscUtil.pCopyTextToClipboard(targetRows.map(it => it.$iptTokenServer.val()).join("\n\n"));
							JqueryUtil.showCopiedEffect($btnGenServerTokens);
						}
					});

				const $btnAcceptClients = $(`<button class="btn btn-xs btn-primary" title="Open a prompt into which text containing client tokens can be pasted">Accept Multiple Clients</button>`)
					.click(() => {
						const $modalInnerAccept = UiUtil.getShow$Modal({title: "Accept Multiple Clients"});

						const $iptText = $(`<textarea class="form-control dm_init__pl_textarea block mb-2"/>`)
							.keydown(() => $iptText.removeClass("error-background"));

						const $btnAccept = $(`<button class="btn btn-xs btn-primary block text-align-center" title="Add Client">Accept Multiple Clients</button>`)
							.click(async () => {
								$iptText.removeClass("error-background");
								const txt = $iptText.val();
								if (!txt.trim() || !PeerUtil.containsAnyTokens(txt)) {
									$iptText.addClass("error-background");
								} else {
									const connected = await PeerUtil.pConnectClientsToServers(p2pMeta.serverInfo, txt);
									board.doBindAlertOnNavigation();
									connected.forEach(serverInfo => {
										serverInfo.rowMeta.$iptTokenClient.val(serverInfo._tempTokenToDisplay || "").attr("disabled", true);
										serverInfo.rowMeta.$btnAcceptClientToken.attr("disabled", true);
										delete serverInfo._tempTokenToDisplay;
									});
									$modalInnerAccept.data("close")();
									sendStateToClientsDebounced();
								}
							});

						$(`<div>
							<p>Paste text containing one or more client tokens, and click "Accept Multiple Clients"</p>
							<div data-r="$iptText"/>
							<div class="flex-vh-center"><div data-r="$btnAccept"/></div>
						</div>`).swap({$iptText, $btnAccept}).appendTo($modalInnerAccept)
					});

				$(`
					<div class="row full-width">
						<div class="col-12">
							<div class="flex-inline-v-center mr-2">
								<span class="mr-1">Add a player (client):</span>
								<div data-r="$btnAddClient"/>
							</div>
							<div class="flex-inline-v-center mr-2">
								<span class="mr-1">Copy all un-paired server tokens:</span>
								<div data-r="$btnCopyServers"/>
							</div>
							<div class="flex-inline-v-center mr-2">
								<span class="mr-1">Mass-accept clients:</span>
								<div data-r="$btnAcceptClients"/>
							</div>
						</div>
					</div>
				`).swap({$btnAddClient, $btnCopyServers, $btnAcceptClients}).appendTo($wrpTop);

				UiUtil.addModal$Sep($modalInner);

				const $btnGenServerTokens = $(`<button class="btn btn-primary btn-xs">Generate All</button>`)
					.click(() => pGetServerTokens(p2pMeta.rows));

				UiUtil._getAdd$Row($modalInner, "div")
					.append(`
					<div class="row full-width">
						<div class="col-2 bold">Player Name</div>
						<div class="col-3-5 bold">Server Token</div>
						<div class="col-1 text-align-center"><div data-r="$btnGenServerTokens"/></div>
						<div class="col-3-5 bold">Client Token</div>
					</div>
				`).swap({$btnGenServerTokens});

				const _get$rowTemplate = () => $(`
					<div class="row full-width mb-2 flex">
						<div class="col-2"><div data-r="$iptName"/></div>
						<div class="col-3-5"><div data-r="$iptTokenServer"/></div>
						<div class="col-1 flex-vh-center"><div data-r="$btnGenServerToken"/></div>
						<div class="col-3-5"><div data-r="$iptTokenClient"/></div>
						<div class="col-1-5 flex-vh-center"><div data-r="$btnAcceptClientToken"/></div>
						<div class="col-0-5 flex-vh-center"><div data-r="$btnDeleteClient"/></div>
					</div>
				`);

				const addClientRow = () => {
					const rowMeta = {id: CryptUtil.uid()};

					const $iptName = $(`<input class="form-control input-sm">`)
						.keydown(evt => {
							$iptName.removeClass("error-background");
							if (evt.which === 13) $btnGenServerToken.click();
						});

					const $iptTokenServer = $(`<input class="form-control input-sm copyable code" readonly disabled>`)
						.click(async () => {
							await MiscUtil.pCopyTextToClipboard($iptTokenServer.val());
							JqueryUtil.showCopiedEffect($iptTokenServer);
						}).disableSpellcheck();

					const $btnGenServerToken = $(`<button class="btn btn-xs btn-primary" title="Generate Server Token">Generate</button>`)
						.click(() => pGetServerTokens([rowMeta]));

					const $iptTokenClient = $(`<input class="form-control input-sm code" disabled>`)
						.keydown(evt => {
							$iptTokenClient.removeClass("error-background");
							if (evt.which === 13) $btnAcceptClientToken.click();
						}).disableSpellcheck();

					const $btnAcceptClientToken = $(`<button class="btn btn-xs btn-primary" title="Accept Client Token" disabled>Accept Client</button>`)
						.click(async () => {
							const token = $iptTokenClient.val();
							if (PeerUtil.isValidToken(token)) {
								try {
									await PeerUtil.pConnectClientsToServers([rowMeta.serverInfo], token);
									board.doBindAlertOnNavigation();
									$iptTokenClient.prop("disabled", true);
									$btnAcceptClientToken.prop("disabled", true);
									sendStateToClientsDebounced();
								} catch (e) {
									JqueryUtil.doToast({
										content: `Failed to accept client token! Are you sure it was valid? (See the log for more details.)`,
										type: "danger"
									});
									setTimeout(() => { throw e; });
								}
							} else $iptTokenClient.addClass("error-background");
						});

					const $btnDeleteClient = $(`<button class="btn btn-xs btn-danger"><span class="glyphicon glyphicon-trash"/></button>`)
						.click(() => {
							rowMeta.$row.remove();
							rowMeta.isDeleted = true;
							if (rowMeta.serverInfo) {
								rowMeta.serverInfo.server.close();
								rowMeta.serverInfo.isDeleted = true;
							}

							if (!$wrpRowsInner.find(`.row`).length) addClientRow();
						});

					rowMeta.$row = _get$rowTemplate().swap({
						$iptName,
						$iptTokenServer,
						$btnGenServerToken,
						$iptTokenClient,
						$btnAcceptClientToken,
						$btnDeleteClient
					}).appendTo($wrpRowsInner);

					rowMeta.$iptName = $iptName;
					rowMeta.$iptTokenServer = $iptTokenServer;
					rowMeta.$btnGenServerToken = $btnGenServerToken;
					rowMeta.$iptTokenClient = $iptTokenClient;
					rowMeta.$btnAcceptClientToken = $btnAcceptClientToken;
					p2pMeta.rows.push(rowMeta);

					return rowMeta;
				};

				const $wrpRows = UiUtil._getAdd$Row($modalInner, "div");
				const $wrpRowsInner = $(`<div class="full-width"/>`).appendTo($wrpRows);

				if (p2pMeta.rows.length) p2pMeta.rows.forEach(row => row.$row.appendTo($wrpRowsInner));
				else addClientRow();
			});

		// nop on receiving a message; we want to send only
		// TODO expand this, to allow e.g. players to set statuses or assign damage/healing (at DM approval?)
		const _DM_MESSAGE_RECEIVER = () => {};
		const _DM_ERROR_HANDLER = function (err) {
			if (!this.isClosed) {
				JqueryUtil.doToast({
					content: `Server error:\n${err ? err.message || err : "(Unknown error)"}`,
					type: "danger"
				});
			}
		};

		const pGetServerTokens = async rowMetas => {
			const targetRows = rowMetas.filter(it => !it.isDeleted).filter(it => !it.isActive);
			if (targetRows.every(it => it.isActive)) {
				return JqueryUtil.doToast({
					content: "No rows require Server Token generation!",
					type: "warning"
				});
			}

			let anyInvalidNames = false;
			targetRows.forEach(r => {
				r.$iptName.removeClass("error-background");
				if (!r.$iptName.val().trim()) {
					anyInvalidNames = true;
					r.$iptName.addClass("error-background");
				}
			});
			if (anyInvalidNames) return;

			const names = targetRows.map(r => {
				r.isActive = true;

				r.$iptName.attr("disabled", true);
				r.$btnGenServerToken.attr("disabled", true);

				return r.$iptName.val();
			});

			if (p2pMeta.serverInfo) {
				await p2pMeta.serverInfo;

				const serverInfo = await PeerUtil.pInitialiseServersAddToExisting(
					names,
					p2pMeta.serverInfo,
					_DM_MESSAGE_RECEIVER,
					_DM_ERROR_HANDLER,
					{shortTokens: !!cfg.playerInitShortTokens}
				);

				return targetRows.map((r, i) => {
					r.name = serverInfo[i].name;
					r.serverInfo = serverInfo[i];
					r.$iptTokenServer.val(serverInfo[i].textifiedSdp).attr("disabled", false);

					serverInfo[i].rowMeta = r;

					r.$iptTokenClient.attr("disabled", false);
					r.$btnAcceptClientToken.attr("disabled", false);

					return serverInfo[i].textifiedSdp;
				});
			} else {
				p2pMeta.serverInfo = new Promise(async resolve => {
					p2pMeta.serverInfo = await PeerUtil.pInitialiseServers(names, _DM_MESSAGE_RECEIVER, _DM_ERROR_HANDLER, {shortTokens: !!cfg.playerInitShortTokens});

					targetRows.forEach((r, i) => {
						r.name = p2pMeta.serverInfo[i].name;
						r.serverInfo = p2pMeta.serverInfo[i];
						r.$iptTokenServer.val(p2pMeta.serverInfo[i].textifiedSdp).attr("disabled", false);

						p2pMeta.serverInfo[i].rowMeta = r;

						r.$iptTokenClient.attr("disabled", false);
						r.$btnAcceptClientToken.attr("disabled", false);
					});

					resolve();
				});

				await p2pMeta.serverInfo;
				return targetRows.map(r => r.serverInfo.textifiedSdp);
			}
		};

		$wrpTracker.data("doConnectLocal", async (clientView) => {
			// generate a stub/fake row meta
			const rowMeta = {
				id: CryptUtil.uid(),
				$row: $(),
				$iptName: $(`<input value="local">`),
				$iptTokenServer: $(),
				$btnGenServerToken: $(),
				$iptTokenClient: $(),
				$btnAcceptClientToken: $()
			};

			p2pMeta.rows.push(rowMeta);

			const serverTokens = await pGetServerTokens([rowMeta]);
			const clientData = await PeerUtil.pInitialiseClient(
				serverTokens[0],
				msg => clientView.handleMessage(msg),
				() => {} // ignore local errors
			);
			clientView.clientData = clientData;
			await PeerUtil.pConnectClientsToServers([rowMeta.serverInfo], clientData.textifiedSdp);
			sendStateToClientsDebounced();
		});

		const $wrpLockSettings = $(`<div class="btn-group flex"/>`).appendTo($wrpUtils);
		const $btnLock = $(`<button class="btn btn-danger btn-xs" title="Lock Tracker"><span class="glyphicon glyphicon-lock"></span></button>`).appendTo($wrpLockSettings);
		$btnLock.on("click", () => {
			if (cfg.isLocked) {
				$btnLock.removeClass("btn-success").addClass("btn-danger");
				$(".dm-init-lockable").toggleClass("disabled");
				$("input.dm-init-lockable").prop('disabled', false);
			} else {
				$btnLock.removeClass("btn-danger").addClass("btn-success");
				$(".dm-init-lockable").toggleClass("disabled");
				$("input.dm-init-lockable").prop('disabled', true);
			}
			cfg.isLocked = !cfg.isLocked;
			handleStatColsChange();
		});

		$(`<button class="btn btn-default btn-xs mr-2"><span class="glyphicon glyphicon-cog"></span></button>`)
			.appendTo($wrpLockSettings)
			.click(() => {
				const $modalInner = UiUtil.getShow$Modal(
					"Settings",
					() => {
						handleStatColsChange();
						doUpdateExternalStates();
					}
				);
				UiUtil.addModal$Sep($modalInner);
				UiUtil.getAddModal$RowCb($modalInner, "Roll hit points", cfg, "isRollHp");
				UiUtil.addModal$Sep($modalInner);
				UiUtil.getAddModal$RowCb($modalInner, "Player View: Show exact HP", cfg, "playerInitShowExactHp");
				UiUtil.getAddModal$RowCb($modalInner, "Player View: Auto-hide new monsters", cfg, "playerInitHideNewMonster");
				UiUtil.getAddModal$RowCb($modalInner, "Player View: Show ordinals", cfg, "playerInitShowOrdinals", "For example, if you add two Goblins, one will be Goblin (1) and the other Goblin (2), rather than having identical names.");
				UiUtil.getAddModal$RowCb($modalInner, "Player View: Shorten server tokens", cfg, "playerInitShortTokens", "Server tokens will be roughly half as many characters, but will contain non-standard characters.");
				UiUtil.addModal$Sep($modalInner);

				const $cbStats = UiUtil.getAddModal$RowCb($modalInner, "Additional Columns", cfg, "statsAddColumns");
				const $wrpTblStatsHead = UiUtil._getAdd$Row($modalInner, "div")
					.addClass("ui-modal__row--stats-header")
					// intentional difference in column widths compared to the rows, to position the long header
					//  ("Editable?") correctly
					.append(`
						<div class="row dm_init__stats_row">
							<div class="col-1-3"/>
							<div class="col-4-9">Auto-Fill With...</div>
							<div class="col-2-5">Abbreviation</div>
							<div class="col-1-7 text-align-center">Editable?</div>
						</div>
					`);
				const $wrpTblStats = UiUtil._getAdd$Row($modalInner, "div").addClass("ui-modal__row--stats");

				(() => {
					const $wrpStatsRows = $(`<div class="dm_init__stats_rows mb-2"/>`).appendTo($wrpTblStats);
					const $wrpBtn = $(`<div class="text-align-center"/>`).appendTo($wrpTblStats);

					const addRow = (thisCfg) => {
						if (!thisCfg) { // if new row
							thisCfg = {
								id: CryptUtil.uid(),
								p: "", // populate with...
								po: null, // populate with... (previous value)
								a: "", // abbreviation
								e: true, // editable
								v: false, // is player-visible
								o: cfg.statsCols.filter(it => !it.isDeleted).length + 1 // order
							};
							cfg.statsCols.push(thisCfg);
						}

						const $selPre = $(`
								<select class="form-control input-xs">
									<option value="">(None)</option>
									${Object.entries(InitiativeTracker.STAT_COLUMNS).map(([k, v]) => v.isHr ? `<option disabled>\u2014</option>` : `<option value="${k}">${v.name}</option>`)}
								</select>
							`).change(() => {
							const sel = InitiativeTracker.STAT_COLUMNS[$selPre.val()] || {};
							thisCfg.a = sel.abv || "";
							$iptAbv.val(thisCfg.a);
							thisCfg.po = thisCfg.p || null;
							thisCfg.p = $selPre.val() || "";

							doUpdateExternalStates();
						});
						if (thisCfg.p) {
							$selPre.val(thisCfg.p);
						}

						const $iptAbv = $(`<input class="form-control input-xs" value="${(thisCfg.a || "").escapeQuotes()}">`).change(() => {
							thisCfg.a = $iptAbv.val();
							doUpdateExternalStates();
						});

						const $cbEditable = $(`<input type="checkbox">`).prop("checked", !!thisCfg.e).change(() => {
							thisCfg.e = $cbEditable.prop("checked");
							doUpdateExternalStates();
						});

						const $btnVisible = InitiativeTracker.get$btnPlayerVisible(thisCfg.v, () => {
							thisCfg.v = $btnVisible.hasClass("btn-primary");
							doUpdateExternalStates();
						});

						const $btnDel = $(`<button class="btn btn-xs btn-danger"><span class="glyphicon glyphicon-trash"/></button>`).click(() => {
							$row.remove();
							thisCfg.isDeleted = true;
							if (!$wrpTblStats.find(`.dm_init__stats_row`).length) {
								addRow();
							}
							doUpdateExternalStates();
						});

						const saveOrders = () => {
							const curr = {};
							$wrpTblStats.find(`.dm_init__stats_row`).each((i, e) => curr[$(e).attr("data-id")] = i);
							cfg.statsCols.forEach(it => {
								const newOrder = curr[it.id];
								if (newOrder != null) {
									it.o = newOrder;
								} else {
									it.o = -1;
								}
							});
						};

						const $btnUp = $(`<button class="btn btn-xs btn-default"><span class="glyphicon glyphicon-arrow-up"/></button>`).click(() => {
							if ($row.prev().length) {
								$row.prev().before($row);
								saveOrders();
								doUpdateExternalStates();
							}
						});

						const $btnDown = $(`<button class="btn btn-xs btn-default"><span class="glyphicon glyphicon-arrow-down dm_init__stats_down"/></button>`).click(() => {
							if ($row.next().length) {
								$row.next().after($row);
								saveOrders();
								doUpdateExternalStates();
							}
						});

						const $row = $(`
							<div class="row dm_init__stats_row dm_init__stats_row--item" data-id="${thisCfg.id}">
								<div class="col-1-3 btn-group text-align-center dm_init__stats_up_down"><div data-r="$btnUp"/><div data-r="$btnDown"/></div>
								<div class="col-1-3 dm_init__stats_up_down--spacer"></div>

								<div class="col-4-9"><div data-r="$selPre"/></div>
								<div class="col-2-8"><div data-r="$iptAbv"/></div>
								<div class="col-1 text-align-center"><div data-r="$cbEditable"/></div>
								<div class="col-1 text-align-center"><div data-r="$btnVisible"/></div>
								<div class="col-1 text-align-center dm_init__stats_del"><div data-r="$btnDel"/></div>
							</div>
						`).appendTo($wrpStatsRows).swap({$selPre, $iptAbv, $cbEditable, $btnVisible, $btnDel, $btnUp, $btnDown});
					};

					$(`<button class="btn btn-xs btn-default"><span class="glyphicon-plus glyphicon dm_init__stats_add"/></button>`)
						.appendTo($wrpBtn)
						.click(() => {
							addRow();
						});

					if (!cfg.statsCols.length) addRow();
					else cfg.statsCols.forEach(it => addRow(it));
				})();

				$cbStats.change(() => {
					$wrpTblStatsHead.toggle($cbStats.prop("checked"));
					$wrpTblStats.toggle($cbStats.prop("checked"));
				});
				$wrpTblStatsHead.toggle($cbStats.prop("checked"));
				$wrpTblStats.toggle($cbStats.prop("checked"));
			});

		const $wrpLoadReset = $(`<div class="btn-group"/>`).appendTo($wrpUtils);
		const $btnLoad = $(`<button title="Import an encounter from the Bestiary" class="btn btn-success btn-xs dm-init-lockable"><span class="glyphicon glyphicon-upload"/></button>`).appendTo($wrpLoadReset)
			.click((evt) => {
				if (cfg.isLocked) return;
				ContextUtil.handleOpenContextMenu(evt, $btnLoad, contextId);
			});
		$(`<button title="Reset" class="btn btn-danger btn-xs dm-init-lockable"><span class="glyphicon glyphicon-trash"/></button>`).appendTo($wrpLoadReset)
			.click(() => {
				if (cfg.isLocked) return;
				confirm("Are you sure?") && doReset();
			});

		$btnAdd.on("click", () => {
			if (cfg.isLocked) return;
			makeRow({isVisible: true});
			doSort(cfg.sort);
			checkSetFirstActive();
		});

		$btnAddMonster.on("click", () => {
			if (cfg.isLocked) return;
			const flags = {
				doClickFirst: false,
				isWait: false
			};

			const $modal = $(`<div class="ui-modal__overlay">`);
			const $modalInner = $(`<div class="ui-modal__inner dropdown-menu">`).appendTo($modal);
			const doClose = () => $modal.remove();
			$modal.on("click", doClose);
			$modalInner.on("click", (e) => e.stopPropagation());
			$(`body`).append($modal);

			const $controls = $(`<div class="split" style="flex-shrink: 0"/>`).appendTo($modalInner);
			const $srch = $(`<input class="ui-search__ipt-search search form-control" autocomplete="off" placeholder="Search...">`).appendTo($controls);
			const $wrpCount = $(`
				<div class="ui-search__ipt-search-sub-wrp" style="padding-right: 0;">
					<div style="margin-right: 7px;">Add</div>
					<label class="ui-search__ipt-search-sub-lbl"><input type="radio" name="mon-count" class="ui-search__ipt-search-sub-ipt" value="1" checked> 1</label>
					<label class="ui-search__ipt-search-sub-lbl"><input type="radio" name="mon-count" class="ui-search__ipt-search-sub-ipt" value="2"> 2</label>
					<label class="ui-search__ipt-search-sub-lbl"><input type="radio" name="mon-count" class="ui-search__ipt-search-sub-ipt" value="3"> 3</label>
					<label class="ui-search__ipt-search-sub-lbl"><input type="radio" name="mon-count" class="ui-search__ipt-search-sub-ipt" value="5"> 5</label>
					<label class="ui-search__ipt-search-sub-lbl"><input type="radio" name="mon-count" class="ui-search__ipt-search-sub-ipt" value="8"> 8</label>
					<label class="ui-search__ipt-search-sub-lbl"><input type="radio" name="mon-count" class="ui-search__ipt-search-sub-ipt" value="-1"> <input type="number" class="form-control ui-search__ipt-search-sub-ipt-custom" value="13" min="1"></label>
				</div>
			`).appendTo($controls);
			$wrpCount.find(`.ui-search__ipt-search-sub-ipt-custom`).click(function () {
				$wrpCount.find(`.ui-search__ipt-search-sub-ipt[value=-1]`).prop("checked", true);
				$(this).select();
			});
			const getCount = () => {
				const val = $wrpCount.find(`[name="mon-count"]`).filter(":checked").val();
				if (val === "-1") return Number($wrpCount.find(`.ui-search__ipt-search-sub-ipt-custom`).val());
				return Number(val);
			};

			const $wrpCbRoll = $(`<label class="ui-search__ipt-search-sub-wrp"> Roll HP</label>`).appendTo($controls);
			const $cbRoll = $(`<input type="checkbox">`).prop("checked", cfg.isRollHp).on("change", () => cfg.isRollHp = $cbRoll.prop("checked")).prependTo($wrpCbRoll);
			const $results = $(`<div class="ui-search__wrp-results"/>`).appendTo($modalInner);

			const showMsgIpt = () => {
				flags.isWait = true;
				$results.empty().append(UiUtil.getSearchEnter());
			};

			const showMsgDots = () => $results.empty().append(UiUtil.getSearchLoading());

			const showNoResults = () => {
				flags.isWait = true;
				$results.empty().append(UiUtil.getSearchNoResults());
			};

			const doSearch = () => {
				const srch = $srch.val().trim();
				const MAX_RESULTS = 75; // hard cap results

				const index = board.availContent["Creature"];
				const results = index.search(srch, {
					fields: {
						n: {boost: 5, expand: true},
						s: {expand: true}
					},
					bool: "AND",
					expand: true
				});
				const resultCount = results.length ? results.length : index.documentStore.length;
				const toProcess = results.length ? results : Object.values(index.documentStore.docs).slice(0, 75).map(it => ({doc: it}));

				$results.empty();
				if (toProcess.length) {
					const handleClick = (r) => {
						const name = r.doc.n;
						const source = r.doc.s;
						const count = getCount();
						if (isNaN(count) || count < 1) return;

						makeRow({
							nameOrMeta: name,
							source,
							isRollHp: $cbRoll.prop("checked")
						});
						if (count > 1) {
							for (let i = 1; i < count; ++i) {
								makeRow({
									nameOrMeta: name,
									source,
									isRollHp: $cbRoll.prop("checked")
								});
							}
						}
						doSort(cfg.sort);
						checkSetFirstActive();
						doUpdateExternalStates();
						doClose();
					};

					const get$Row = (r) => {
						return $(`
							<div class="ui-search__row">
								<span>${r.doc.n}</span>
								<span>${r.doc.s ? `<i title="${Parser.sourceJsonToFull(r.doc.s)}">${Parser.sourceJsonToAbv(r.doc.s)}${r.doc.p ? ` p${r.doc.p}` : ""}</i>` : ""}</span>
							</div>
						`);
					};

					if (flags.doClickFirst) {
						handleClick(toProcess[0]);
						flags.doClickFirst = false;
						return;
					}

					const res = toProcess.slice(0, MAX_RESULTS); // hard cap at 75 results

					res.forEach(r => get$Row(r).on("click", () => handleClick(r)).appendTo($results));

					if (resultCount > MAX_RESULTS) {
						const diff = resultCount - MAX_RESULTS;
						$results.append(`<div class="ui-search__row ui-search__row--readonly">...${diff} more result${diff === 1 ? " was" : "s were"} hidden. Refine your search!</div>`);
					}
				} else {
					if (!srch.trim()) showMsgIpt();
					else showNoResults();
				}
			};

			UiUtil.bindAutoSearch($srch, {
				flags: flags,
				search: doSearch,
				showWait: showMsgDots
			});

			$srch.focus();
			doSearch();
		});

		function getStatColsState ($row) {
			return $row.find(`.dm_init__stat`).map((i, e) => {
				return {
					v: $(e).find(`input`).val(),
					id: $(e).attr("data-id")
				};
			}).get();
		}

		function getSaveableState () {
			const rows = $wrpEntries.find(`.dm-init-row`).map((i, e) => {
				const $row = $(e);
				const $conds = $row.find(`.init__cond`);
				const $iptDisplayName = $row.find(`input.displayName`);
				const n = $iptDisplayName.length ? {
					n: $row.find(`input.name`).val(),
					d: $iptDisplayName.val(),
					s: $row.find(`input.scaledCr`).val() || ""
				} : $row.find(`input.name`).val();
				return {
					n,
					k: getStatColsState($row),
					h: $row.find(`input.hp`).val(),
					g: $row.find(`input.hp-max`).val(),
					i: $row.find(`input.score`).val(),
					a: 0 + $row.hasClass(`dm-init-row-active`),
					s: $row.find(`input.source`).val(),
					c: $conds.length ? $conds.map((i, e) => $(e).data("getState")()).get() : [],
					v: $row.find(`.dm_init__btn_eye`).hasClass(`btn-primary`)
				}
			}).get();
			return {
				r: rows,
				s: cfg.sort,
				d: cfg.dir,
				m: cfg.isRollHp,
				g: cfg.importIsRollGroups,
				p: cfg.importIsAddPlayers,
				a: cfg.importIsAppend,
				k: cfg.statsAddColumns,
				piH: cfg.playerInitShowExactHp,
				piV: cfg.playerInitHideNewMonster,
				piO: cfg.playerInitShowOrdinals,
				piS: cfg.playerInitShortTokens,
				c: cfg.statsCols.filter(it => !it.isDeleted),
				n: $iptRound.val()
			};
		}

		function getPlayerFriendlyState () {
			const visibleStatsCols = cfg.statsCols.filter(it => !it.isDeleted && it.v).map(({id, a, o}) => ({id, a, o})); // id, abbreviation, order

			const rows = $wrpEntries.find(`.dm-init-row`).map((i, e) => {
				const $row = $(e);

				// if the row is player-hidden
				if (!$row.find(`.dm_init__btn_eye`).hasClass(`btn-primary`)) return false;

				const statCols = getStatColsState($row);
				const statsVals = statCols.filter(it => visibleStatsCols.find(sc => sc.id === it.id));

				const $conds = $row.find(`.init__cond`);

				const out = {
					n: $row.find(`input.name`).val(),
					i: $row.find(`input.score`).val(),
					a: 0 + $row.hasClass(`dm-init-row-active`),
					c: $conds.length ? $conds.map((i, e) => $(e).data("getState")()).get() : [],
					k: statsVals
				};

				const hp = Number($row.find(`input.hp`).val());
				const hpMax = Number($row.find(`input.hp-max`).val());
				if (cfg.playerInitShowExactHp) {
					out.h = hp;
					out.g = hpMax;
				} else {
					out.hh = isNaN(hp) || isNaN(hpMax) ? -1 : InitiativeTrackerUtil.getWoundLevel(100 * hp / hpMax);
				}
				if (cfg.playerInitShowOrdinals) out.o = $row.find(`.dm_init__number`).attr("data-number");

				return out;
			}).get().filter(Boolean);
			return {
				r: rows,
				c: visibleStatsCols,
				n: $iptRound.val()
			};
		}

		$wrpTracker.data("getState", getSaveableState);
		$wrpTracker.data("getSummary", () => {
			const nameList = $wrpEntries.find(`.dm-init-row`).map((i, e) => $(e).find(`input.name`).val()).get();
			return `${nameList.length} creature${nameList.length === 1 ? "" : "s"} ${nameList.length ? `(${nameList.slice(0, 3).join(", ")}${nameList.length > 3 ? "..." : ""})` : ""}`
		});

		function setNextActive () {
			const $rows = $wrpEntries.find(`.dm-init-row`);

			const $rowsActive = $rows.filter(`.dm-init-row-active`).each((i, e) => {
				const $e = $(e);

				// tick down any conditions
				const $conds = $e.find(`.init__cond`);
				if ($conds.length) $conds.each((i, e) => $(e).data("doTickDown")());

				$e.removeClass(`dm-init-row-active`);
			});

			let ix = $rows.index($rowsActive.get($rowsActive.length - 1)) + 1;

			const nxt = $rows.get(ix++);
			if (nxt) {
				const $nxt = $(nxt);
				let $curr = $nxt;
				do {
					// if names and initiatives are the same, skip forwards (groups of monsters)
					if ($curr.find(`input.name`).val() === $nxt.find(`input.name`).val() &&
						$curr.find(`input.score`).val() === $nxt.find(`input.score`).val()) {
						$curr.addClass(`dm-init-row-active`);
						const curr = $rows.get(ix++);
						if (curr) $curr = $(curr);
						else $curr = null;
					} else break;
				} while ($curr);
			} else checkSetFirstActive();
			doUpdateExternalStates();
		}

		function makeRow (opts) {
			let {
				nameOrMeta,
				hp,
				hpMax,
				init,
				isActive,
				source,
				conditions,
				rollHp,
				statsCols,
				isVisible
			} = Object.assign({
				nameOrMeta: "",
				hp: "",
				hpMax: "",
				init: "",
				conditions: [],
				rollHp: false,
				isVisible: !cfg.playerInitHideNewMonster
			}, opts || {});

			const isMon = !!source;
			if (nameOrMeta instanceof Object) {
				// unpack saved
				nameOrMeta.name = nameOrMeta.name || nameOrMeta.n;
				nameOrMeta.displayName = nameOrMeta.displayName || nameOrMeta.d;
				nameOrMeta.scaledTo = nameOrMeta.scaledTo || (nameOrMeta.s ? Number(nameOrMeta.s) : null);
			}
			const displayName = nameOrMeta instanceof Object ? nameOrMeta.displayName : null;
			const name = nameOrMeta instanceof Object ? nameOrMeta.name : nameOrMeta;

			const $wrpRow = $(`<div class="dm-init-row ${isActive ? "dm-init-row-active" : ""}"/>`);

			const $wrpLhs = $(`<div class="dm-init-row-lhs"/>`).appendTo($wrpRow);
			const $iptName = $(`<input class="form-control input-sm name dm-init-name dm-init-lockable dm-init-row-input ${isMon ? "hidden" : ""}" placeholder="Name" value="${name}">`).appendTo($wrpLhs);
			$iptName.on("change", () => doSort(ALPHA));
			if (isMon) {
				const $rows = $wrpEntries.find(`.dm-init-row`);
				const curMon = $rows.find(".init-wrp-creature").filter((i, e) => $(e).parent().find(`input.name`).val() === name && $(e).parent().find(`input.source`).val() === source);
				let monNum = null;
				if (curMon.length) {
					if (curMon.length === 1) {
						const r = $(curMon.get(0));
						r.find(`.init-wrp-creature-link`).append(`<span data-number="1" class="dm_init__number">(1)</span>`);
						monNum = 2;
					} else {
						monNum = curMon.map((i, e) => $(e).find(`span[data-number]`).data("number")).get().reduce((a, b) => Math.max(Number(a), Number(b)), 0) + 1;
					}
				}

				const getLink = () => {
					if (typeof nameOrMeta === "string" || nameOrMeta.scaledTo == null) return EntryRenderer.getDefaultRenderer().renderEntry(`{@creature ${name}|${source}}`);
					else {
						const parts = [name, source, displayName, Parser.numberToCr(nameOrMeta.scaledTo)];
						return EntryRenderer.getDefaultRenderer().renderEntry(`{@creature ${parts.join("|")}}`);
					}
				};

				const $monName = $(`
					<div class="init-wrp-creature split">
						<span class="init-wrp-creature-link">
							${$(getLink()).attr("tabindex", "-1")[0].outerHTML}
							${monNum ? ` <span data-number="${monNum}" class="dm_init__number">(${monNum})</span>` : ""}
						</span>
					</div>
				`).appendTo($wrpLhs);
				$(`<button class="btn btn-success btn-xs dm-init-lockable" title="Add Another (SHIFT for Roll New)" tabindex="-1"><span class="glyphicon glyphicon-plus"></span></button>`)
					.click((evt) => {
						if (cfg.isLocked) return;
						makeRow({
							nameOrMeta,
							init: evt.shiftKey ? "" : $iptScore.val(),
							isActive: $wrpRow.hasClass("dm-init-row-active"),
							source,
							rollHp: cfg.isRollHp,
							statsCols: evt.shiftKey ? null : getStatColsState($wrpRow),
							isVisible: $wrpRow.find(`.dm_init__btn_eye`).hasClass("btn-primary")
						});
						doSort(cfg.sort);
					}).appendTo($monName);
				$(`<input class="source hidden" value="${source}">`).appendTo($wrpLhs);

				if (nameOrMeta instanceof Object && nameOrMeta.scaledTo) {
					$(`<input class="displayName hidden" value="${displayName}">`).appendTo($wrpLhs);
					$(`<input class="scaledCr hidden" value="${nameOrMeta.scaledTo}">`).appendTo($wrpLhs);
				}
			}

			function addCondition (name, color, turns) {
				const $cond = InitiativeTrackerUtil.get$condition({
					name,
					color,
					turns,
					onStateChange: () => doUpdateExternalStates()
				});
				$cond.appendTo($conds);
			}

			const $wrpConds = $(`<div class="split"/>`).appendTo($wrpLhs);
			const $conds = $(`<div class="init__wrp_conds"/>`).appendTo($wrpConds);
			$(`<button class="btn btn-warning btn-xs dm-init-row-btn dm-init-row-btn-flag" title="Add Condition" tabindex="-1"><span class="glyphicon glyphicon-flag"/></button>`)
				.appendTo($wrpConds)
				.on("click", () => {
					const $modal = $(`<div class="ui-modal__inner dropdown-menu" style="height: initial"/>`);
					const $wrpModal = $(`<div class="ui-modal__overlay">`).appendTo($(`body`)).click(() => $wrpModal.remove());
					$modal.appendTo($wrpModal);
					const $modalInner = $(`<div class="modal__inner"/>`).appendTo($modal).click((evt) => evt.stopPropagation());

					const $wrpRows = $(`<div class="dm-init-modal-wrp-rows"/>`).appendTo($modalInner);

					const conds = InitiativeTrackerUtil.CONDITIONS;
					for (let i = 0; i < conds.length; i += 3) {
						const $row = $(`<div class="row mb-2"/>`).appendTo($wrpRows);
						const populateCol = (cond) => {
							const $col = $(`<div class="col-4 text-align-center"/>`).appendTo($row);
							if (cond) {
								$(`<button class="btn btn-default btn-xs btn-dm-init-cond" style="background-color: ${cond.color} !important;">${cond.name}</button>`).appendTo($col).click(() => {
									$iptName.val(cond.name);
									$iptColor.val(cond.color);
								});
							}
						};
						[conds[i], conds[i + 1], conds[i + 2]].forEach(populateCol);
					}

					$wrpRows.append(`<hr>`);

					$(`<div class="row mb-2">
						<div class="col-5">Name (optional)</div>
						<div class="col-2 text-align-center">Color</div>
						<div class="col-5">Duration (optional)</div>
					</div>`).appendTo($wrpRows);
					const $controls = $(`<div class="row mb-2"/>`).appendTo($wrpRows);
					const [$wrpName, $wrpColor, $wrpTurns] = [...new Array(3)].map((it, i) => $(`<div class="col-${i === 1 ? 2 : 5} text-align-center"/>`).appendTo($controls));
					const $iptName = $(`<input class="form-control">`)
						.on("keydown", (e) => {
							if (e.which === 13) $btnAdd.click();
						})
						.appendTo($wrpName);
					const $iptColor = $(`<input class="form-control" type="color" value="${MiscUtil.randomColor()}">`).appendTo($wrpColor);
					const $iptTurns = $(`<input class="form-control" type="number" step="1" min="1" placeholder="Unlimited">`)
						.on("keydown", (e) => {
							if (e.which === 13) $btnAdd.click();
						})
						.appendTo($wrpTurns);
					const $wrpAdd = $(`<div class="row">`).appendTo($wrpRows);
					const $wrpAddInner = $(`<div class="col-12 text-align-center">`).appendTo($wrpAdd);
					const $btnAdd = $(`<button class="btn btn-primary">Set Condition</button>`)
						.click(() => {
							addCondition($iptName.val().trim(), $iptColor.val(), $iptTurns.val());
							$wrpModal.remove();
						})
						.appendTo($wrpAddInner);
				});

			$(`<div class="dm-init-row-mid"/>`).appendTo($wrpRow);

			const $wrpRhs = $(`<div class="dm-init-row-rhs"/>`).appendTo($wrpRow);
			const hpVals = {
				curHp: hp,
				maxHp: hpMax
			};

			const doUpdateHpColors = () => {
				const woundLevel = InitiativeTrackerUtil.getWoundLevel(100 * Number($iptHp.val()) / Number($iptHpMax.val()));
				if (~woundLevel) {
					const woundMeta = InitiativeTrackerUtil.getWoundMeta(woundLevel);
					$iptHp.css("color", woundMeta.color);
					$iptHpMax.css("color", woundMeta.color);
				} else {
					$iptHp.css("color", "");
					$iptHpMax.css("color", "");
				}
			};

			const $iptHp = $(`<input class="form-control input-sm hp dm-init-row-input text-align-right dm_init__hp dm_init__hp--current" value="${hpVals.curHp}">`)
				.change(() => {
					handleMathInput($iptHp, "curHp");
					doUpdateExternalStates();
					doUpdateHpColors();
				})
				.click(() => $iptHp.select())
				.appendTo($wrpRhs);
			$wrpRhs.append(`<div class="dm_init__hp_slash">/</div>`);
			const $iptHpMax = $(`<input class="form-control input-sm hp-max dm-init-row-input dm_init__hp dm_init__hp--max" value="${hpVals.maxHp}">`)
				.change(() => {
					handleMathInput($iptHpMax, "maxHp");
					doUpdateExternalStates();
					doUpdateHpColors();
				})
				.click(() => $iptHpMax.select())
				.appendTo($wrpRhs);

			doUpdateHpColors();

			const $iptScore = $(`<input class="form-control input-sm score dm-init-lockable dm-init-row-input text-align-center dm_init__ipt--rhs" type="number" value="${init}">`)
				.on("change", () => doSort(NUM))
				.click(() => $iptScore.select())
				.appendTo($wrpRhs);

			if (isMon && (hpVals.curHp === "" || hpVals.maxHp === "" || init === "")) {
				const doUpdate = () => {
					const m = EntryRenderer.hover._getFromCache(UrlUtil.PG_BESTIARY, source, hash);

					// set or roll HP
					if (!rollHp && m.hp.average) {
						hpVals.curHp = hpVals.maxHp = m.hp.average;
						$iptHp.val(hpVals.curHp);
						$iptHpMax.val(hpVals.maxHp);
					} else if (rollHp && m.hp.formula) {
						const roll = EntryRenderer.dice.roll2(m.hp.formula, {
							user: false,
							name: getRollName(m),
							label: "HP"
						});
						hpVals.curHp = hpVals.maxHp = roll;
						$iptHp.val(roll);
						$iptHpMax.val(roll);
					}

					// roll initiative
					if (!init) {
						$iptScore.val(rollInitiative(m));
					}

					doUpdateHpColors();
				};

				const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY]({name: name, source: source});
				if (EntryRenderer.hover._isCached(UrlUtil.PG_BESTIARY, source, hash)) doUpdate();
				else {
					EntryRenderer.hover._doFillThenCall(UrlUtil.PG_BESTIARY, source, hash, () => {
						if (!hpVals.curHp) doUpdate();
					});
				}
			}

			const handleMathInput = ($ipt, prop) => {
				const nxt = $ipt.val().trim();
				if (nxt && /^[-+0-9]*$/.exec(hpVals[prop]) && /^[-+0-9]*$/.exec(nxt)) {
					const m = /^[+-]\d+/.exec(nxt);
					const parts = nxt.split(/([+-]\d+)/).filter(it => it);
					let temp = 0;
					parts.forEach(p => temp += Number(p));
					if (m) {
						hpVals[prop] = Number(hpVals[prop]) + temp;
					} else if (/[-+]/.exec(nxt)) {
						hpVals[prop] = temp;
					} else {
						hpVals[prop] = Number(nxt);
					}
					$ipt.val(hpVals[prop]);
				} else hpVals[prop] = nxt;
			};

			InitiativeTracker.get$btnPlayerVisible(isVisible, doUpdateExternalStates, "dm-init-row-btn", "dm_init__btn_eye")
				.appendTo($wrpRhs);

			$(`<button class="btn btn-danger btn-xs dm-init-row-btn dm-init-lockable" title="Delete" tabindex="-1"><span class="glyphicon glyphicon-trash"/></button>`)
				.appendTo($wrpRhs)
				.on("click", () => {
					if (cfg.isLocked) return;
					if ($wrpRow.hasClass(`dm-init-row-active`) && $wrpEntries.find(`.dm-init-row`).length > 1) setNextActive();
					$wrpRow.remove();
					doUpdateExternalStates();
				});

			populateRowStatCols($wrpRow, statsCols);
			conditions.forEach(c => addCondition(c.name, c.color, c.turns));
			$wrpRow.appendTo($wrpEntries);

			doUpdateExternalStates();

			return $wrpRow;
		}

		const populateRowStatCols = ($row, statsCols) => {
			const $mid = $row.find(`.dm-init-row-mid`);

			if (!cfg.statsAddColumns) return $mid.empty();

			const name = $row.find(`.name`).val();
			const source = $row.find(`.source`).val();
			const isMon = !!source;

			const existing = (() => {
				const existing = {};
				if (statsCols) {
					statsCols.forEach(it => existing[it.id] = {id: it.id, v: it.v});
				} else {
					$mid.find(`.dm_init__stat`).each((i, e) => {
						const $e = $(e);
						const id = $e.attr("data-id");
						existing[id] = {
							v: $e.find(`input`).val(),
							id
						};
					});
				}
				return existing;
			})();

			$mid.empty();

			cfg.statsCols.forEach(c => {
				const $ipt = $(`<input class="form-control input-sm dm_init__stat_ipt text-align-center" ${!cfg.isLocked && (c.e || !isMon) ? "" : "disabled"}>`)
					.change(() => doUpdateExternalStates());

				const populateFromBlock = () => {
					const meta = InitiativeTracker.STAT_COLUMNS[c.p];
					if (isMon && meta) {
						const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY]({name: name, source: source});
						const populateStats = async () => {
							const mon = await EntryRenderer.hover.pCacheAndGet(UrlUtil.PG_BESTIARY, source, hash);
							$ipt.val(meta.get(mon));
							doUpdateExternalStates();
						};
						populateStats();
					}
				};

				if (c.p && c.po && isMon) { // on changing populate type, re-populate
					populateFromBlock();
				} else if (existing[c.id]) { // otherwise (or for players) use existing value
					$ipt.val(existing[c.id].v);
				} else if (c.p) { // otherwise, populate
					populateFromBlock();
				}

				$mid.append(`<div class="dm_init__stat" data-id="${c.id}"><div data-r/></div>`).swap($ipt);
			});
		};

		const handleStatColsChange = () => {
			// remove any deleted records; apply order
			cfg.statsCols = cfg.statsCols.filter(it => !it.isDeleted).sort((a, b) => a.o - b.o);

			const $wrpHead = $wrpHeader.find(`.dm-init-row-mid`).empty();

			if (cfg.statsAddColumns) {
				cfg.statsCols.forEach(c => {
					$wrpHead.append(`<div class="dm_init__stat_head" ${c.p && InitiativeTracker.STAT_COLUMNS[c.p] ? `title="${InitiativeTracker.STAT_COLUMNS[c.p].name}"` : ""}>${c.a || ""}</div>`);
				});
			}

			const $rows = $wrpEntries.find(`.dm-init-row`);
			$rows.each((i, e) => {
				populateRowStatCols($(e));
			});
			cfg.statsCols.forEach(c => c.po = null);
		};

		function checkSetFirstActive () {
			if ($wrpEntries.find(`.dm-init-row`).length && !$wrpEntries.find(`.dm-init-row-active`).length) {
				const $rows = $wrpEntries.find(`.dm-init-row`);
				const $first = $($rows.get(0));
				$first.addClass(`dm-init-row-active`);
				if ($rows.length > 1) {
					for (let i = 1; i < $rows.length; ++i) {
						const $nxt = $($rows.get(i));
						if ($nxt.find(`input.name`).val() === $first.find(`input.name`).val() &&
							$nxt.find(`input.score`).val() === $first.find(`input.score`).val()) {
							$nxt.addClass(`dm-init-row-active`);
						} else break;
					}
				}
				$iptRound.val(Number($iptRound.val() || 0) + 1);

				doUpdateExternalStates();
			}
		}

		function doSort (mode) {
			if (cfg.sort !== mode) return;
			const sorted = $wrpEntries.find(`.dm-init-row`).sort((a, b) => {
				let aVal = $(a).find(`input.${cfg.sort === ALPHA ? "name" : "score"}`).val();
				let bVal = $(b).find(`input.${cfg.sort === ALPHA ? "name" : "score"}`).val();
				let first = 0;
				let second = 0;
				if (cfg.sort === NUM) {
					aVal = Number(aVal);
					bVal = Number(bVal);
					first = cfg.dir === ASC ? SortUtil.ascSort(aVal, bVal) : SortUtil.ascSort(bVal, aVal);
				} else {
					let aVal2 = 0;
					let bVal2 = 0;

					const $aNum = $(a).find(`span[data-number]`);
					if ($aNum.length) aVal2 = $aNum.data("number");
					const $bNum = $(b).find(`span[data-number]`);
					if ($bNum.length) bVal2 = $bNum.data("number");

					first = cfg.dir === ASC ? SortUtil.ascSort(aVal, bVal) : SortUtil.ascSort(bVal, aVal);
					second = cfg.dir === ASC ? SortUtil.ascSort(aVal2, bVal2) : SortUtil.ascSort(bVal2, aVal2);
				}
				return first || second;
			});
			$wrpEntries.append(sorted);
			doUpdateExternalStates();
		}

		function flipDir () {
			cfg.dir = cfg.dir === ASC ? DESC : ASC;
		}

		function doReset () {
			$wrpEntries.empty();
			cfg.sort = NUM;
			cfg.dir = DESC;
			$(`.dm_init__rounds`).val(1);
			doUpdateExternalStates();
		}

		let firstLoad = true;
		function loadState (state, noReset) {
			if (!firstLoad && !noReset) doReset();
			firstLoad = false;

			(state.r || []).forEach(r => {
				makeRow({
					nameOrMeta: r.n,
					hp: r.h,
					hpMax: r.g,
					init: r.i,
					isActive: r.a,
					source: r.s,
					conditions: r.c,
					statsCols: r.k,
					isVisible: r.v
				});
			});
			doSort(cfg.sort);
			checkSetFirstActive();
			handleStatColsChange();
			doUpdateExternalStates();
			if (!firstLoad && !noReset) $(`.dm_init__rounds`).val(1);
		}

		function getRollName (monster) {
			return `Initiative Tracker \u2014 ${monster.name}`;
		}

		function rollInitiative (monster) {
			return EntryRenderer.dice.roll2(`1d20${Parser.getAbilityModifier(monster.dex)}`, {
				user: false,
				name: getRollName(monster),
				label: "Initiative"
			});
		}

		function getOrRollHp (monster) {
			if (!cfg.isRollHp && monster.hp.average) {
				return `${monster.hp.average}`;
			} else if (cfg.isRollHp && monster.hp.formula) {
				return `${EntryRenderer.dice.roll2(monster.hp.formula, {
					user: false,
					name: getRollName(monster),
					label: "HP"
				})}`;
			}
			return "";
		}

		function convertAndLoadBestiaryList (bestiaryList) {
			const toLoad = {
				s: "NUM",
				d: "DESC",
				m: false,
				g: true,
				r: []
			};

			if (cfg.importIsAddPlayers) {
				if (bestiaryList.a) { // advanced encounter builder
					if (bestiaryList.d) {
						const colNameIndex = {};
						(bestiaryList.c || []).forEach((colName, i) => colNameIndex[i] = (colName || "").toLowerCase());

						// mark all old stats cols for deletion
						cfg.statsCols.forEach(col => col.isDeleted = true);

						const colIndex = {};
						let hpIndex = null;
						(bestiaryList.c || []).forEach((colName, i) => {
							if ((colName || "").toLowerCase() === "hp") {
								hpIndex = i;
								return;
							}

							const newCol = {
								id: CryptUtil.uid(),
								p: "", // populate with...
								po: null, // populate with... (previous value)
								a: colName || "", // abbreviation
								e: true, // editable
								v: false, // player-visible
								o: i
							};
							colIndex[i] = newCol;
							cfg.statsCols.push(newCol);
						});

						bestiaryList.d.forEach(playerDetails => {
							const row = {
								n: playerDetails.n || "", // name
								i: "", // score
								a: 0, // is active?
								c: [], // conditions
								v: true
							};

							if (playerDetails.x && playerDetails.x.length) { // extra stats
								row.k = playerDetails.x.map((val, i) => {
									if (i === hpIndex) return null;
									return {id: colIndex[i].id, v: val || ""};
								}).filter(Boolean);

								if (hpIndex != null) {
									row.h = row.g = (playerDetails.x[hpIndex] || "").trim();
								} else row.h = row.g = "";
							} else row.h = row.g = "";

							toLoad.r.push(row);
						});
					}
				} else {
					if (bestiaryList.p) {
						bestiaryList.p.forEach(playerGroup => {
							[...new Array(playerGroup.count || 1)].forEach(() => {
								toLoad.r.push({
									n: ``,
									h: "",
									g: "",
									i: "",
									a: 0,
									c: [],
									v: true
								});
							});
						});
					}
				}
			}

			// convert Bestiary sublist files
			if (bestiaryList.items && bestiaryList.sources) bestiaryList.l = {items: bestiaryList.items, sources: bestiaryList.sources};

			if (bestiaryList.l && bestiaryList.l.items) {
				Promise.all(bestiaryList.l.items.map(it => {
					const count = Number(it.c);
					const hash = it.h;
					const scaling = (() => {
						if (it.uid) {
							const m = /_([\d.,]+)$/.exec(it.uid);
							if (m) {
								return Number(m[1]);
							} else return null;
						} else return null;
					})();
					const source = hash.split(HASH_LIST_SEP)[1];
					return new Promise(resolve => {
						EntryRenderer.hover.pCacheAndGet(UrlUtil.PG_BESTIARY, source, hash)
							.then(mon => {
								if (scaling != null) {
									ScaleCreature.scale(mon, scaling).then(scaled => {
										resolve({
											count,
											monster: scaled
										});
									});
								} else {
									resolve({
										count,
										monster: mon
									});
								}
							});
					})
				})).then((data) => {
					data.forEach(it => {
						const groupInit = cfg.importIsRollGroups ? rollInitiative(it.monster) : null;
						const groupHp = cfg.importIsRollGroups ? getOrRollHp(it.monster) : null;
						[...new Array(it.count || 1)].forEach(() => {
							const hp = `${cfg.importIsRollGroups ? groupHp : getOrRollHp(it.monster)}`;
							toLoad.r.push({
								n: {
									name: it.monster.name,
									displayName: it.monster._displayName,
									scaledTo: it.monster._isScaledCr
								},
								i: `${cfg.importIsRollGroups ? groupInit : rollInitiative(it.monster)}`,
								a: 0,
								s: it.monster.source,
								c: [],
								h: hp,
								g: hp
							});
						});
					});
					loadState(toLoad, cfg.importIsAppend);
					handleStatColsChange();
				});
			} else {
				loadState(toLoad, cfg.importIsAppend);
				handleStatColsChange();
			}
		}

		loadState(state);
		doSort(cfg.sort);

		return $wrpTracker;
	}

	static get$btnPlayerVisible (isVisible, fnOnClick, ...additionalClasses) {
		const $btnVisible = $(`<button class="btn ${isVisible ? `btn-primary` : `btn-default`} btn-xs ${additionalClasses.join(" ")}" title="${isVisible ? "Shown" : "Hidden"} in player view" tabindex="-1"><span class="glyphicon ${isVisible ? `glyphicon-eye-open` : `glyphicon-eye-close`}"/></button>`)
			.on("click", () => {
				$btnVisible.toggleClass("btn-primary").toggleClass("btn-default");
				$btnVisible.find(`.glyphicon`).toggleClass("glyphicon-eye-open").toggleClass("glyphicon-eye-close");
				$btnVisible.attr("title", $btnVisible.hasClass("btn-primary") ? "Shown in Player View" : "Hidden in Player View");
				fnOnClick();
			});
		return $btnVisible;
	}
}
InitiativeTracker._GET_STAT_COLUMN_HR = () => ({isHr: true});
InitiativeTracker.STAT_COLUMNS = {
	hpFormula: {
		name: "HP Formula",
		get: mon => (mon.hp || {}).formula
	},
	armorClass: {
		name: "Armor Class",
		abv: "AC",
		get: mon => mon.ac[0] ? (mon.ac[0].ac || mon.ac[0]) : null
	},
	passivePerception: {
		name: "Passive Perception",
		abv: "PP",
		get: mon => mon.passive
	},
	speed: {
		name: "Speed",
		abv: "SPD",
		get: mon => Math.max(0, ...Object.values(mon.speed || {})
			.map(it => it.number ? it.number : it)
			.filter(it => typeof it === "number"))
	},
	spellDc: {
		name: "Spell DC",
		abv: "DC",
		get: mon => Math.max(0, ...(mon.spellcasting || [])
			.filter(it => it.headerEntries)
			.map(it => {
				return it.headerEntries.map(it => {
					const found = [0];
					it.replace(/DC (\d+)/g, (...m) => found.push(Number(m[1])));
					return Math.max(...found);
				}).filter(Boolean)
			}))
	},
	legendaryActions: {
		name: "Legendary Actions",
		abv: "LA",
		get: mon => mon.legendaryActions || mon.legendary ? 3 : null
	},
	hr0: InitiativeTracker._GET_STAT_COLUMN_HR(),
	...(() => {
		const out = {};
		Parser.ABIL_ABVS.forEach(it => {
			out[`${it}Save`] = {
				name: `${Parser.attAbvToFull(it)} Save`,
				abv: it.toUpperCase(),
				get: mon => mon.save && mon.save[it] ? mon.save[it] : Parser.getAbilityModifier(mon[it])
			};
		});
		return out;
	})(),
	hr1: InitiativeTracker._GET_STAT_COLUMN_HR(),
	...(() => {
		const out = {};
		Parser.ABIL_ABVS.forEach(it => {
			out[`${it}Bonus`] = {
				name: `${Parser.attAbvToFull(it)} Bonus`,
				abv: it.toUpperCase(),
				get: mon => Parser.getAbilityModifier(mon[it])
			};
		});
		return out;
	})(),
	hr2: InitiativeTracker._GET_STAT_COLUMN_HR(),
	...(() => {
		const out = {};
		Parser.ABIL_ABVS.forEach(it => {
			out[`${it}Score`] = {
				name: `${Parser.attAbvToFull(it)} Score`,
				abv: it.toUpperCase(),
				get: mon => mon[it]
			};
		});
		return out;
	})(),
	hr3: InitiativeTracker._GET_STAT_COLUMN_HR(),
	...(() => {
		const out = {};
		Object.keys(Parser.SKILL_TO_ATB_ABV).sort(SortUtil.ascSort).forEach(s => {
			out[s.toCamelCase()] = {
				name: s.toTitleCase(),
				abv: Parser.skillToShort(s).toUpperCase(),
				get: mon => mon.skill && mon.skill[s] ? mon.skill[s] : Parser.getAbilityModifier(mon[Parser.skillToAbilityAbv(s)])
			};
		});
		return out;
	})()
};
