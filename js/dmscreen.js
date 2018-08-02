"use strict";

const UP = "UP";
const RIGHT = "RIGHT";
const LEFT = "LEFT";
const DOWN = "DOWN";
const AX_X = "AXIS_X";
const AX_Y = "AXIS_Y";

const TITLE_LOADING = "Loading...";

const PANEL_TYP_EMPTY = 0;
const PANEL_TYP_STATS = 1;
const PANEL_TYP_ROLLBOX = 2;
const PANEL_TYP_TEXTBOX = 3;
const PANEL_TYP_RULES = 4;
const PANEL_TYP_INITIATIVE_TRACKER = 5;
const PANEL_TYP_UNIT_CONVERTER = 6;
const PANEL_TYP_TUBE = 10;
const PANEL_TYP_TWITCH = 11;
const PANEL_TYP_TWITCH_CHAT = 12;
const PANEL_TYP_IMAGE = 20;
const PANEL_TYP_GENERIC_EMBED = 90;

class Board {
	constructor () {
		this.panels = {};
		this.exiledPanels = [];
		this.$creen = $(`.dm-screen`);
		this.width = this.getInitialWidth();
		this.height = this.getInitialHeight();
		this.sideMenu = new SideMenu(this);
		this.menu = new AddMenu();
		this.storage = StorageUtil.getStorage();
		this.isFullscreen = false;

		this.nextId = 1;
		this.hoveringPanel = null;
		this.availContent = {};
		this.availRules = {};
	}

	getInitialWidth () {
		const scW = this.$creen.width();
		return Math.ceil(scW / 400);
	}

	getInitialHeight () {
		const scH = this.$creen.height();
		return Math.ceil(scH / 300);
	}

	getNextId () {
		return this.nextId++;
	}

	get$creen () {
		return this.$creen;
	}

	getWidth () {
		return this.width;
	}

	getHeight () {
		return this.height;
	}

	setDimensions (width, height) {
		const oldWidth = this.width;
		const oldHeight = this.height;
		if (width) this.width = Math.max(width, 1);
		if (height) this.height = Math.max(height, 1);
		if (!(oldWidth === width && oldHeight === height)) {
			this.doAdjust$creenCss();
			if (width < oldWidth || height < oldHeight) this.doCullPanels(oldWidth, oldHeight);
			this.sideMenu.doUpdateDimensions();
		}
		this.doCheckFillSpaces();
	}

	doCullPanels (oldWidth, oldHeight) {
		for (let x = oldWidth - 1; x >= 0; x--) {
			for (let y = oldHeight - 1; y >= 0; y--) {
				const p = this.getPanel(x, y);
				if (!p) continue; // happens when a large panel gets shrunk
				if (x >= this.width && y >= this.height) {
					if (p.canShrinkBottom() && p.canShrinkRight()) {
						p.doShrinkBottom();
						p.doShrinkRight();
					} else p.exile();
				} else if (x >= this.width) {
					if (p.canShrinkRight()) p.doShrinkRight();
					else p.exile();
				} else if (y >= this.height) {
					if (p.canShrinkBottom()) p.doShrinkBottom();
					else p.exile();
				}
			}
		}
	}

	doAdjust$creenCss () {
		// assumes 7px grid spacing
		this.$creen.css({
			gridGap: 7,
			width: `calc(100% - ${this._getWidthAdjustment()}px)`,
			height: `calc(100% - ${this._getHeightAdjustment()}px)`,
			gridAutoColumns: `${(1 / this.width) * 100}%`,
			gridAutoRows: `${(1 / this.height) * 100}%`
		});
	}

	_getWidthAdjustment () {
		return (this.width - 1) * 7;
	}

	_getHeightAdjustment () {
		const panelPart = (this.height - 1) * 7;
		if (this.isFullscreen) return panelPart;
		else return 85 + panelPart; // 85 magical pixels
	}

	getPanelDimensions () {
		const w = this.$creen.outerWidth() + this._getWidthAdjustment();
		const h = this.$creen.outerHeight() + this._getHeightAdjustment();
		return {
			pxWidth: w / this.width,
			pxHeight: h / this.height
		};
	}

	doShowLoading () {
		$(`<div class="dm-screen-loading"><span class="initial-message">Loading...</span></div>`).css({
			gridColumnStart: "1",
			gridColumnEnd: String(this.width + 1),
			gridRowStart: "1",
			gridRowEnd: String(this.height + 1)
		}).appendTo(this.$creen);
	}

	doHideLoading () {
		this.$creen.find(`.dm-screen-loading`).remove();
	}

	initialise () {
		this.doAdjust$creenCss();
		this.doShowLoading();

		this.pLoadIndex()
			.then(() => {
				if (this.hasSavedStateUrl()) {
					this.doLoadUrlState();
					this.initUnloadHandler();
				} else if (this.hasSavedState()) {
					this.doLoadState();
					this.initUnloadHandler();
				} else {
					this.doCheckFillSpaces();
					this.initUnloadHandler();
				}
			});
	}

	initUnloadHandler () {
		window.onhashchange = () => this.doLoadUrlState();
		$(window).on("beforeunload", () => this.doSaveState());
	}

	pLoadIndex () {
		return new Promise((resolve, reject) => {
			elasticlunr.clearStopWords();
			EntryRenderer.item.populatePropertyAndTypeReference().then(() => DataUtil.loadJSON("data/bookref-dmscreen-index.json")).then((data) => {
				this.availRules.ALL = elasticlunr(function () {
					this.addField("b");
					this.addField("s");
					this.addField("p");
					this.addField("n");
					this.addField("h");
					this.setRef("id");
				});

				data.data.forEach(d => {
					d.n = data._meta.name[d.b];
					d.b = data._meta.id[d.b];
					d.s = data._meta.section[d.s];
					this.availRules.ALL.addDoc(d);
				});

				return DataUtil.loadJSON("search/index.json");
			}).then((data) => {
				function hasBadCat (d) {
					return d.c === Parser.CAT_ID_ADVENTURE || d.c === Parser.CAT_ID_CLASS || d.c === Parser.CAT_ID_QUICKREF;
				}

				function fromDeepIndex (d) {
					return d.d; // flag for "deep indexed" content that refers to the same item
				}

				this.availContent.ALL = elasticlunr(function () {
					this.addField("n");
					this.addField("s");
					this.setRef("id");
				});
				// Add main site index
				let ixMax = 0;
				data.forEach(d => {
					if (hasBadCat(d) || fromDeepIndex(d)) return;
					d.cf = d.c === Parser.CAT_ID_CREATURE ? "Creature" : Parser.pageCategoryToFull(d.c);
					if (!this.availContent[d.cf]) {
						this.availContent[d.cf] = elasticlunr(function () {
							this.addField("n");
							this.addField("s");
							this.setRef("id");
						});
					}
					this.availContent.ALL.addDoc(d);
					this.availContent[d.cf].addDoc(d);
					ixMax = Math.max(ixMax, d.id);
				});

				// Add homebrew
				Omnisearch.highestId = Math.max(ixMax, Omnisearch.highestId);
				BrewUtil.getSearchIndex().forEach(d => {
					if (hasBadCat(d) || fromDeepIndex(d)) return;
					d.cf = Parser.pageCategoryToFull(d.c);
					d.cf = d.c === Parser.CAT_ID_CREATURE ? "Creature" : Parser.pageCategoryToFull(d.c);
					this.availContent.ALL.addDoc(d);
					this.availContent[d.cf].addDoc(d);
				});

				// add tabs
				const omniTab = new AddMenuSearchTab(this.availContent);
				omniTab.setSpotlight(true);
				const ruleTab = new AddMenuSearchTab(this.availRules, "rules");
				const embedTab = new AddMenuVideoTab();
				const imageTab = new AddMenuImageTab();
				const specialTab = new AddMenuSpecialTab();

				this.menu.addTab(omniTab).addTab(ruleTab).addTab(imageTab).addTab(embedTab).addTab(specialTab);

				this.menu.render();

				this.sideMenu.render();

				resolve();
				this.doHideLoading();
			});
		});
	}

	getPanel (x, y) {
		return Object.values(this.panels).find(p => {
			// x <= pX < x+w && y <= pY < y+h
			return (p.x <= x) && (x < (p.x + p.width)) && (p.y <= y) && (y < (p.y + p.height));
		});
	}

	getPanels (x, y, w = 1, h = 1) {
		const out = [];
		for (let wOffset = 0; wOffset < w; ++wOffset) {
			for (let hOffset = 0; hOffset < h; ++hOffset) {
				out.push(this.getPanel(x + wOffset, y + hOffset));
			}
		}
		return out.filter(it => it);
	}

	getPanelPx (xPx, hPx) {
		const dim = this.getPanelDimensions();
		return this.getPanel(Math.floor(xPx / dim.pxWidth), Math.floor(hPx / dim.pxHeight));
	}

	setHoveringPanel (panel) {
		this.hoveringPanel = panel;
	}

	setVisiblyHoveringPanel (isVis) {
		Object.values(this.panels).forEach(p => p.removeHoverClass());
		if (isVis && this.hoveringPanel) this.hoveringPanel.addHoverClass();
	}

	exilePanel (id) {
		const panelK = Object.keys(this.panels).find(k => this.panels[k].id === id);
		if (panelK) {
			const toExile = this.panels[panelK];
			if (!toExile.getEmpty()) {
				delete this.panels[panelK];
				this.exiledPanels.unshift(toExile);
				const toDestroy = this.exiledPanels.splice(10);
				toDestroy.forEach(p => p.destroy());
				this.sideMenu.doUpdateHistory()
			} else this.destroyPanel(id);
		}
	}

	recallPanel (panel) {
		const ix = this.exiledPanels.findIndex(p => p.id === panel.id);
		if (~ix) this.exiledPanels.splice(ix, 1);
		this.panels[panel.id] = panel;
	}

	destroyPanel (id) {
		const panelK = Object.keys(this.panels).find(k => this.panels[k].id === id);
		if (panelK) delete this.panels[panelK];
	}

	doCheckFillSpaces () {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; ++y) {
				const pnl = this.getPanel(x, y);
				if (!pnl) {
					const nuPnl = new Panel(this, x, y);
					this.panels[nuPnl.id] = nuPnl;
				}
			}
		}
		Object.values(this.panels).forEach(p => p.render());
	}

	hasSavedStateUrl () {
		return window.location.hash.length;
	}

	doLoadUrlState () {
		if (window.location.hash.length) {
			const toLoad = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
			this.doReset();
			this.doLoadStateFrom(toLoad);
		}
		window.location.hash = "";
	}

	hasSavedState () {
		return !!((this.storage.getItem(DMSCREEN_STORAGE) || "").trim());
	}

	getSaveableState () {
		return {
			w: this.width,
			h: this.height,
			ps: Object.values(this.panels).map(p => p.getSaveableState()),
			ex: this.exiledPanels.map(p => p.getSaveableState())
		};
	}

	doSaveState () {
		this.storage.setItem(DMSCREEN_STORAGE, JSON.stringify(this.getSaveableState()));
	}

	doLoadStateFrom (toLoad) {
		// re-exile
		toLoad.ex.filter(Boolean).reverse().forEach(saved => {
			const p = Panel.fromSavedState(this, saved);
			if (p) {
				this.panels[p.id] = p;
				p.exile();
			}
		});
		this.setDimensions(toLoad.w, toLoad.h); // FIXME is this necessary?

		// reload
		// fill content first; empties can fill any remaining space
		toLoad.ps.filter(Boolean).filter(saved => saved.t !== PANEL_TYP_EMPTY).forEach(saved => {
			const p = Panel.fromSavedState(this, saved);
			if (p) this.panels[p.id] = p;
		});
		this.setDimensions(toLoad.w, toLoad.h);
	}

	doLoadState () {
		const purgeSaved = () => {
			window.alert("Error when loading DM screen! Purging saved data...");
			this.storage.removeItem(DMSCREEN_STORAGE);
		};

		const raw = this.storage.getItem(DMSCREEN_STORAGE);
		if (raw) {
			try {
				const toLoad = JSON.parse(raw);
				this.doLoadStateFrom(toLoad);
			} catch (e) {
				// on error, purge saved data and reset
				purgeSaved();
				setTimeout(() => {
					throw e
				});
			}
		}
	}

	doReset () {
		this.exiledPanels.forEach(p => p.destroy());
		this.exiledPanels = [];
		this.sideMenu.doUpdateHistory();
		Object.values(this.panels).forEach(p => p.destroy());
		this.panels = {};
		this.setDimensions(this.getInitialWidth(), this.getInitialHeight());
	}

	setHoveringButton (panel) {
		this.resetHoveringButton(panel);
		panel.$btnAddInner.addClass("faux-hover");
	}

	resetHoveringButton (panel) {
		Object.values(this.panels).forEach(p => {
			if (panel && panel.id === p.id) return;
			p.$btnAddInner.removeClass("faux-hover");
		})
	}

	addPanel (panel) {
		this.panels[panel.id] = panel;
		panel.render();
	}
}

class SideMenu {
	constructor (board) {
		this.board = board;
		this.$mnu = $(`.dm-sidemenu`);

		this.$mnu.on("mouseover", () => {
			this.board.setHoveringPanel(null);
			this.board.setVisiblyHoveringPanel(false);
			this.board.resetHoveringButton();
		});

		this.$iptWidth = null;
		this.$iptHeight = null;
		this.$wrpHistory = null;
	}

	render () {
		const renderDivider = () => {
			this.$mnu.append(`<hr class="dm-sidemenu-row-divider">`);
		};

		const $wrpResizeW = $(`<div class="dm-sidemenu-row"><div class="dm-sidemenu-row-label">Width</div></div>`).appendTo(this.$mnu);
		const $iptWidth = $(`<input class="form-control" type="number" value="${this.board.width}">`).appendTo($wrpResizeW);
		this.$iptWidth = $iptWidth;
		const $wrpResizeH = $(`<div class="dm-sidemenu-row"><div class="dm-sidemenu-row-label">Height</div></div>`).appendTo(this.$mnu);
		const $iptHeight = $(`<input class="form-control" type="number" value="${this.board.height}">`).appendTo($wrpResizeH);
		this.$iptHeight = $iptHeight;
		const $btnSetDim = $(`<div class="btn btn-primary">Set Dimensions</div>`).appendTo(this.$mnu);
		$btnSetDim.on("click", () => {
			const w = Number($iptWidth.val());
			const h = Number($iptHeight.val());
			if ((w > 10 || h > 10) && !window.confirm("That's a lot of panels. You sure?")) return;
			this.board.setDimensions(w, h);
		});
		renderDivider();

		const $wrpFullscreen = $(`<div class="dm-sidemenu-row-alt"></div>`).appendTo(this.$mnu);
		const $btnFullscreen = $(`<div class="btn btn-primary">Toggle Fullscreen</div>`).appendTo($wrpFullscreen);
		$btnFullscreen.on("click", () => {
			this.board.isFullscreen = !this.board.isFullscreen;
			if (this.board.isFullscreen) $(`body`).addClass(`dm-screen-fullscreen`);
			else $(`body`).removeClass(`dm-screen-fullscreen`);
			this.board.doAdjust$creenCss();
		});
		renderDivider();

		const $wrpSaveLoadFile = $(`<div class="dm-sidemenu-row-alt"/>`).appendTo(this.$mnu);
		const $btnSaveFile = $(`<div class="btn btn-primary">Save to File</div>`).appendTo($wrpSaveLoadFile);
		$btnSaveFile.on("click", () => {
			DataUtil.userDownload(`dm-screen`, this.board.getSaveableState());
		});
		const $btnLoadFile = $(`<div class="btn btn-primary">Load from File</div>`).appendTo($wrpSaveLoadFile);
		$btnLoadFile.on("click", () => {
			DataUtil.userUpload((json) => {
				this.board.doReset();
				this.board.doLoadStateFrom(json);
			});
		});
		renderDivider();

		const $wrpSaveLoadLink = $(`<div class="dm-sidemenu-row-alt"/>`).appendTo(this.$mnu);
		const $btnSaveLink = $(`<div class="btn btn-primary">Save to URL</div>`).appendTo($wrpSaveLoadLink);
		$btnSaveLink.on("click", () => {
			const encoded = `${window.location.href.split("#")[0]}#${encodeURIComponent(JSON.stringify(this.board.getSaveableState()))}`;
			copyText(encoded);
			showCopiedEffect($btnSaveLink);
		});
		renderDivider();

		const $btnReset = $(`<div class="btn btn-danger">Reset Screen</div>`).appendTo(this.$mnu);
		$btnReset.on("click", () => {
			if (window.confirm("Are you sure?")) {
				this.board.doReset();
			}
		});
		renderDivider();

		const $wrpHistory = $(`<div class="dm-sidemenu-history"/>`).appendTo(this.$mnu);
		this.$wrpHistory = $wrpHistory;
	}

	doUpdateDimensions () {
		this.$iptWidth.val(this.board.width);
		this.$iptHeight.val(this.board.height);
	}

	doUpdateHistory () {
		this.board.exiledPanels.forEach(p => p.get$ContentWrapper().detach());
		this.$wrpHistory.children().remove();
		if (this.board.exiledPanels.length) {
			const $wrpHistHeader = $(`<div class="dm-sidemenu-row"><span style="font-variant: small-caps;">Recently Removed</span></div>`).appendTo(this.$wrpHistory);
			const $btnHistClear = $(`<div class="btn btn-danger">Clear</div>`).appendTo($wrpHistHeader);
			$btnHistClear.on("click", () => {
				this.board.exiledPanels = [];
				this.doUpdateHistory();
			});
		}
		this.board.exiledPanels.forEach((p, i) => {
			const $wrpHistItem = $(`<div class="dm-sidemenu-history-item"/>`).appendTo(this.$wrpHistory);
			const $cvrHistItem = $(`<div class="dm-sidemenu-history-item-cover"/>`).appendTo($wrpHistItem);
			const $btnRemove = $(`<div class="panel-history-control-remove-wrapper"><span class="panel-history-control-remove glyphicon glyphicon-remove" title="Remove"/></div>`).appendTo($cvrHistItem);
			const $ctrlMove = $(`<div class="panel-history-control-middle" title="Move"/>`).appendTo($cvrHistItem);

			$btnRemove.on("click", () => {
				this.board.exiledPanels.splice(i, 1);
				this.doUpdateHistory();
			});

			const $contents = p.get$ContentWrapper();
			$wrpHistItem.append($contents);

			$ctrlMove.on("mousedown touchstart", (e) => {
				this.board.setVisiblyHoveringPanel(true);
				const $body = $(`body`);
				MiscUtil.clearSelection();
				$body.css("userSelect", "none");

				const w = $contents.width();
				const h = $contents.height();
				const offset = $contents.offset();
				const offsetX = e.clientX - offset.left;
				const offsetY = e.clientY - offset.top;

				$body.append($contents);
				$(`.panel-control`).hide();
				$contents.css("overflow-y", "hidden");
				Panel.setMovingCss(e, $contents, w, h, offsetX, offsetY, 61);
				$wrpHistItem.css("box-shadow", "none");
				$btnRemove.hide();
				$ctrlMove.hide();
				this.board.get$creen().addClass("board-content-hovering");
				p.get$Content().addClass("panel-content-hovering");

				Panel.bindMovingEvents(this.board, $contents, offsetX, offsetY);

				$(document).on("mouseup touchend", () => {
					this.board.setVisiblyHoveringPanel(false);
					$(document).off("mousemove touchmove").off("mouseup touchend");

					$body.css("userSelect", "");
					$contents.css("overflow-y", "");
					Panel.unsetMovingCss($contents);
					$wrpHistItem.css("box-shadow", "");
					$btnRemove.show();
					$ctrlMove.show();
					this.board.get$creen().removeClass("board-content-hovering");
					p.get$Content().removeClass("panel-content-hovering");

					if (!this.board.hoveringPanel || p.id === this.board.hoveringPanel.id) $wrpHistItem.append($contents);
					else {
						this.board.recallPanel(p);
						const her = this.board.hoveringPanel;
						if (her.getEmpty()) {
							her.setFromPeer(p.getPanelMeta(), p.$content);
							p.destroy();
						} else {
							const herMeta = her.getPanelMeta();
							const $herContent = her.get$Content();
							her.setFromPeer(p.getPanelMeta(), p.get$Content());
							p.setFromPeer(herMeta, $herContent);
							p.exile();
						}
						// clean any lingering hidden scrollbar
						her.$pnl.removeClass("panel-mode-move");
						her.doShowJoystick();
						this.doUpdateHistory();
					}
					MiscUtil.clearSelection();
				});
			});
		});
	}
}

class Panel {
	constructor (board, x, y, width = 1, height = 1, title = "") {
		this.id = board.getNextId();
		this.board = board;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.title = title;
		this.isDirty = true;
		this.isContentDirty = false;
		this.isLocked = false; // unused
		this.type = 0;
		this.contentMeta = null; // info used during saved state re-load
		this.isMousedown = false;
		this.isTabs = false;
		this.tabIndex = null;
		this.tabDatas = [];

		this.$btnAdd = null;
		this.$btnAddInner = null;
		this.$content = null;
		this.joyMenu = null;
		this.$pnl = null;
		this.$pnlWrpContent = null;
		this.$pnlTitle = null;
		this.$pnlAddTab = null;
		this.$pnlWrpTabs = null;
		this.$pnlTabs = null;
	}

	static fromSavedState (board, saved) {
		const existing = board.getPanels(saved.x, saved.y, saved.w, saved.h);
		if (saved.t === PANEL_TYP_EMPTY && existing.length) return null; // cull empties
		else if (existing.length) existing.forEach(p => p.destroy()); // prefer more recent panels
		const p = new Panel(board, saved.x, saved.y, saved.w, saved.h);
		p.render();

		function loadState (saved, skipSetTab) {
			switch (saved.t) {
				case PANEL_TYP_EMPTY:
					return p;
				case PANEL_TYP_STATS: {
					const page = saved.c.p;
					const source = saved.c.s;
					const hash = saved.c.u;
					p.doPopulate_Stats(page, source, hash, skipSetTab);
					return p;
				}
				case PANEL_TYP_RULES: {
					const book = saved.c.b;
					const chapter = saved.c.c;
					const header = saved.c.h;
					p.doPopulate_Rules(book, chapter, header, skipSetTab);
					return p;
				}
				case PANEL_TYP_ROLLBOX:
					EntryRenderer.dice.bindDmScreenPanel(p);
					return p;
				case PANEL_TYP_TEXTBOX:
					p.doPopulate_TextBox(saved.s.x);
					return p;
				case PANEL_TYP_INITIATIVE_TRACKER:
					p.doPopulate_InitiativeTracker(saved.s);
					return p;
				case PANEL_TYP_UNIT_CONVERTER:
					p.doPopulate_UnitConverter(saved.s);
					return p;
				case PANEL_TYP_TUBE:
					p.doPopulate_YouTube(saved.c.u);
					return p;
				case PANEL_TYP_TWITCH:
					p.doPopulate_Twitch(saved.c.u);
					return p;
				case PANEL_TYP_TWITCH_CHAT:
					p.doPopulate_TwitchChat(saved.c.u);
					return p;
				case PANEL_TYP_GENERIC_EMBED:
					p.doPopulate_GenericEmbed(saved.c.u);
					return p;
				case PANEL_TYP_IMAGE:
					p.doPopulate_Image(saved.c.u);
					return p;
				default:
					throw new Error(`Unhandled panel type ${saved.t}`);
			}
		}

		if (saved.a) {
			p.isTabs = true;
			p.doRenderTabs();
			saved.a.forEach(tab => loadState(tab, true));
			p.setActiveTab(saved.b);
		} else {
			loadState(saved);
		}
		return p;
	}

	static _get$eleLoading (message = "Loading") {
		return $(`<div class="panel-content-wrapper-inner"><div class="panel-tab-message loading-spinner"><i>${message}...</i></div></div>`);
	}

	static setMovingCss (evt, $ele, w, h, offsetX, offsetY, zIndex) {
		$ele.css({
			width: w,
			height: h,
			position: "fixed",
			top: evt.clientY - offsetY,
			left: evt.clientX - offsetX,
			zIndex: zIndex,
			pointerEvents: "none",
			transform: "rotate(-4deg)",
			background: "none"
		});
	}

	static unsetMovingCss ($ele) {
		$ele.css({
			width: "",
			height: "",
			position: "",
			top: "",
			left: "",
			zIndex: "",
			pointerEvents: "",
			transform: "",
			background: ""
		});
	}

	static bindMovingEvents (board, $content, offsetX, offsetY) {
		$(document).off("mousemove touchmove").off("mouseup touchend");
		$(document).on("mousemove touchmove", (e) => {
			board.setVisiblyHoveringPanel(true);
			$content.css({
				top: e.clientY - offsetY,
				left: e.clientX - offsetX
			});
		});
	}

	static isNonExilableType (type) {
		return type === PANEL_TYP_ROLLBOX || type === PANEL_TYP_TUBE || type === PANEL_TYP_TWITCH;
	}

	doPopulate_Empty (ixOpt) {
		this.close$TabContent(ixOpt);
	}

	doPopulate_Loading (message) {
		return this.set$ContentTab(
			PANEL_TYP_EMPTY,
			null,
			Panel._get$eleLoading(message),
			TITLE_LOADING
		);
	}

	doPopulate_Stats (page, source, hash) {
		const meta = {p: page, s: source, u: hash};
		const ix = this.set$TabLoading(
			PANEL_TYP_STATS,
			meta
		);
		EntryRenderer.hover._doFillThenCall(
			page,
			source,
			hash,
			() => {
				const fn = EntryRenderer.hover._pageToRenderFn(page);
				const it = EntryRenderer.hover._getFromCache(page, source, hash);
				this.set$Tab(
					ix,
					PANEL_TYP_STATS,
					meta,
					$(`<div class="panel-content-wrapper-inner"><table class="stats">${fn(it)}</table></div>`),
					it.name
				);
			}
		);
	}

	doPopulate_Rules (book, chapter, header) {
		const meta = {b: book, c: chapter, h: header};
		const ix = this.set$TabLoading(
			PANEL_TYP_RULES,
			meta
		);
		RuleLoader.pFill(book).then(() => {
			const rule = RuleLoader.getFromCache(book, chapter, header);
			const it = EntryRenderer.rule.getCompactRenderedString(rule);
			this.set$Tab(
				ix,
				PANEL_TYP_RULES,
				meta,
				$(`<div class="panel-content-wrapper-inner"><table class="stats">${it}</table></div>`),
				rule.name || ""
			);
		});
	}

	set$ContentTab (type, contentMeta, $content, title) {
		const ix = this.isTabs ? this.getNextTabIndex() : 0;
		return this.set$Tab(ix, type, contentMeta, $content, title);
	}

	doPopulate_Rollbox () {
		this.set$ContentTab(
			PANEL_TYP_ROLLBOX,
			null,
			$(`<div class="panel-content-wrapper-inner"/>`).append(EntryRenderer.dice.get$Roller().addClass("rollbox-panel")),
			"Dice Roller"
		);
	}

	doPopulate_InitiativeTracker (state = {}) {
		this.set$ContentTab(
			PANEL_TYP_INITIATIVE_TRACKER,
			state,
			$(`<div class="panel-content-wrapper-inner"/>`).append(InitiativeTracker.make$Tracker(this.board, state)),
			"Initiative Tracker"
		);
	}

	doPopulate_UnitConverter (state = {}) {
		this.set$ContentTab(
			PANEL_TYP_UNIT_CONVERTER,
			state,
			$(`<div class="panel-content-wrapper-inner"/>`).append(UnitConverter.make$Converter(this.board, state)),
			"Unit Converter"
		);
	}

	doPopulate_TextBox (content) {
		this.set$ContentTab(
			PANEL_TYP_TEXTBOX,
			null,
			$(`<div class="panel-content-wrapper-inner"/>`).append(NoteBox.make$Notebox(content)),
			"Notes"
		);
	}

	doPopulate_YouTube (url) {
		const meta = {u: url};
		this.set$ContentTab(
			PANEL_TYP_TUBE,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}?autoplay=1&enablejsapi=1&modestbranding=1&iv_load_policy=3" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen /></div>`),
			"YouTube"
		);
	}

	doPopulate_Twitch (url) {
		const meta = {u: url};
		this.set$ContentTab(
			PANEL_TYP_TWITCH,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}" frameborder="0"  scrolling="no" allowfullscreen/></div>`),
			"Twitch"
		);
	}

	doPopulate_TwitchChat (url) {
		const meta = {u: url};
		this.set$ContentTab(
			PANEL_TYP_TWITCH_CHAT,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}" frameborder="0"  scrolling="no"/></div>`),
			"Twitch Chat"
		);
	}

	doPopulate_GenericEmbed (url) {
		const meta = {u: url};
		this.set$ContentTab(
			PANEL_TYP_GENERIC_EMBED,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}"/></div>`),
			"Embed"
		);
	}

	doPopulate_Image (url, ixOpt) {
		const meta = {u: url};
		const $wrpPanel = $(`<div class="panel-content-wrapper-inner"/>`);
		const $wrpImage = $(`<div class="panel-content-wrapper-img"/>`).appendTo($wrpPanel);
		const $img = $(`<img src="${url}">`).appendTo($wrpImage);
		const $iptReset = $(`<div class="panel-zoom-reset btn btn-xs btn-default"><span class="glyphicon glyphicon-refresh"/></div>`).appendTo($wrpPanel);
		const $iptRange = $(`<input type="range" class="panel-zoom-slider">`).appendTo($wrpPanel);
		this.set$ContentTab(
			PANEL_TYP_IMAGE,
			meta,
			$wrpPanel,
			"Image",
			ixOpt
		);
		$img.panzoom({
			$reset: $iptReset,
			$zoomRange: $iptRange,
			minScale: 0.1,
			maxScale: 8,
			duration: 100
		});
	}
	// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	getTopNeighbours () {
		return [...new Array(this.width)]
			.map((blank, i) => i + this.x).map(x => this.board.getPanel(x, this.y - 1))
			.filter(p => p);
	}

	getRightNeighbours () {
		const rightmost = this.x + this.width;
		return [...new Array(this.height)].map((blank, i) => i + this.y)
			.map(y => this.board.getPanel(rightmost, y))
			.filter(p => p);
	}

	getBottomNeighbours () {
		const lowest = this.y + this.height;
		return [...new Array(this.width)].map((blank, i) => i + this.x)
			.map(x => this.board.getPanel(x, lowest))
			.filter(p => p);
	}

	getLeftNeighbours () {
		return [...new Array(this.height)].map((blank, i) => i + this.y)
			.map(y => this.board.getPanel(this.x - 1, y))
			.filter(p => p);
	}
	// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	hasRowTop () {
		return this.y > 0;
	}

	hasColumnRight () {
		return (this.x + this.width) < this.board.getWidth();
	}

	hasRowBottom () {
		return (this.y + this.height) < this.board.getHeight();
	}

	hasColumnLeft () {
		return this.x > 0;
	}
	// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	hasSpaceTop () {
		const hasLockedNeighbourTop = this.getTopNeighbours().filter(p => p.getLocked()).length;
		return this.hasRowTop() && !hasLockedNeighbourTop;
	}

	hasSpaceRight () {
		const hasLockedNeighbourRight = this.getRightNeighbours().filter(p => p.getLocked()).length;
		return this.hasColumnRight() && !hasLockedNeighbourRight;
	}

	hasSpaceBottom () {
		const hasLockedNeighbourBottom = this.getBottomNeighbours().filter(p => p.getLocked()).length;
		return this.hasRowBottom() && !hasLockedNeighbourBottom;
	}

	hasSpaceLeft () {
		const hasLockedNeighbourLeft = this.getLeftNeighbours().filter(p => p.getLocked()).length;
		return this.hasColumnLeft() && !hasLockedNeighbourLeft;
	}
	// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	canShrinkTop () {
		return this.height > 1 && !this.getLocked();
	}

	canShrinkRight () {
		return this.width > 1 && !this.getLocked();
	}

	canShrinkBottom () {
		return this.height > 1 && !this.getLocked();
	}

	canShrinkLeft () {
		return this.width > 1 && !this.getLocked();
	}
	// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	doShrinkTop () {
		this.height -= 1;
		this.y += 1;
		this.setDirty(true);
		this.render();
	}

	doShrinkRight () {
		this.width -= 1;
		this.setDirty(true);
		this.render();
	}

	doShrinkBottom () {
		this.height -= 1;
		this.setDirty(true);
		this.render();
	}

	doShrinkLeft () {
		this.width -= 1;
		this.x += 1;
		this.setDirty(true);
		this.render();
	}
	// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	canBumpTop () {
		if (!this.hasRowTop()) return false; // if there's no row above, we can't bump up a row
		if (!this.getTopNeighbours().filter(p => !p.getEmpty()).length) return true; // if there's a row above and it's empty, we can bump
		// if there's a row above and it has non-empty panels, we can bump if they can all bump
		return !this.getTopNeighbours().filter(p => !p.getEmpty()).filter(p => !p.canBumpTop()).length;
	}

	canBumpRight () {
		if (!this.hasColumnRight()) return false;
		if (!this.getRightNeighbours().filter(p => !p.getEmpty()).length) return true;
		return !this.getRightNeighbours().filter(p => !p.getEmpty()).filter(p => !p.canBumpRight()).length;
	}

	canBumpBottom () {
		if (!this.hasRowBottom()) return false;
		if (!this.getBottomNeighbours().filter(p => !p.getEmpty()).length) return true;
		return !this.getBottomNeighbours().filter(p => !p.getEmpty()).filter(p => !p.canBumpBottom()).length;
	}

	canBumpLeft () {
		if (!this.hasColumnLeft()) return false;
		if (!this.getLeftNeighbours().filter(p => !p.getEmpty()).length) return true;
		return !this.getLeftNeighbours().filter(p => !p.getEmpty()).filter(p => !p.canBumpLeft()).length;
	}
	// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	doBumpTop () {
		this.getTopNeighbours().filter(p => p.getEmpty()).forEach(p => p.destroy());
		this.getTopNeighbours().filter(p => !p.getEmpty()).forEach(p => p.doBumpTop());
		this.y -= 1;
		this.setDirty(true);
		this.render();
	}

	doBumpRight () {
		this.getRightNeighbours().filter(p => p.getEmpty()).forEach(p => p.destroy());
		this.getRightNeighbours().filter(p => !p.getEmpty()).forEach(p => p.doBumpRight());
		this.x += 1;
		this.setDirty(true);
		this.render();
	}

	doBumpBottom () {
		this.getBottomNeighbours().filter(p => p.getEmpty()).forEach(p => p.destroy());
		this.getBottomNeighbours().filter(p => !p.getEmpty()).forEach(p => p.doBumpBottom());
		this.y += 1;
		this.setDirty(true);
		this.render();
	}

	doBumpLeft () {
		this.getLeftNeighbours().filter(p => p.getEmpty()).forEach(p => p.destroy());
		this.getLeftNeighbours().filter(p => !p.getEmpty()).forEach(p => p.doBumpLeft());
		this.x -= 1;
		this.setDirty(true);
		this.render();
	}
	// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	getPanelMeta () {
		return {
			type: this.type,
			contentMeta: this.contentMeta,
			title: this.title,
			isTabs: this.isTabs,
			tabIndex: this.tabIndex,
			tabDatas: this.tabDatas
		}
	}

	setPanelMeta (type, contentMeta) {
		this.type = type;
		this.contentMeta = contentMeta;
	}

	getEmpty () {
		return this.$content == null;
	}

	getLocked () {
		return this.isLocked;
	}

	getMousedown () {
		return this.isMousedown;
	}

	setMousedown (isMousedown) {
		this.isMousedown = isMousedown;
	}

	setDirty (dirty) {
		this.isDirty = dirty;
	}

	setHasTabs (hasTabs) {
		this.isTabs = hasTabs;
	}

	setContentDirty (dirty) {
		this.setDirty.bind(this)(dirty);
		this.isContentDirty = true;
	}

	doShowJoystick () {
		this.joyMenu.doShow();
		this.$pnl.addClass(`panel-mode-move`);
	}

	doHideJoystick () {
		this.joyMenu.doHide();
		this.$pnl.removeClass(`panel-mode-move`);
	}

	doRenderTitle () {
		const displayText = this.title !== TITLE_LOADING &&
			(this.type === PANEL_TYP_STATS || this.type === PANEL_TYP_RULES) ? this.title : "";

		this.$pnlTitle.text(displayText);
		if (!displayText) this.$pnlTitle.addClass("hidden");
		else this.$pnlTitle.removeClass("hidden");
	}

	doRenderTabs () {
		if (this.isTabs) {
			this.$pnlWrpTabs.css({display: "flex"});
			this.$pnlWrpContent.addClass("panel-content-wrapper-tabs");
			this.$pnlAddTab.addClass("hidden");
		} else {
			this.$pnlWrpTabs.css({display: ""});
			this.$pnlWrpContent.removeClass("panel-content-wrapper-tabs");
			this.$pnlAddTab.removeClass("hidden");
		}
	}

	getReplacementPanel () {
		const replacement = new Panel(this.board, this.x, this.y, this.width, this.height);

		if (this.tabDatas.length > 1 && this.tabDatas.filter(it => !it.isDeleted && (Panel.isNonExilableType(it.type))).length) {
			const prevTabIx = this.tabDatas.findIndex(it => !it.isDeleted);
			if (~prevTabIx) {
				this.setActiveTab(prevTabIx);
			}
			// otherwise, it should be the currently displayed panel, and so will be destroyed on exile

			this.tabDatas.filter(it => it.type === PANEL_TYP_ROLLBOX).forEach(it => {
				it.isDeleted = true;
				EntryRenderer.dice.unbindDmScreenPanel();
			});
		}

		this.exile();
		this.board.addPanel(replacement);
		this.board.doCheckFillSpaces();
		return replacement;
	}

	render () {
		const doApplyPosCss = ($ele) => {
			// indexed from 1 instead of zero...
			return $ele.css({
				gridColumnStart: String(this.x + 1),
				gridColumnEnd: String(this.x + 1 + this.width),

				gridRowStart: String(this.y + 1),
				gridRowEnd: String(this.y + 1 + this.height)
			});
		};

		const openAddMenu = () => {
			this.board.menu.doOpen();
			this.board.menu.setPanel(this);
			if (!this.board.menu.hasActiveTab()) this.board.menu.setFirstTabActive();
			else if (this.board.menu.getActiveTab().doTransitionActive) this.board.menu.getActiveTab().doTransitionActive();
		};

		function doInitialRender () {
			const $pnl = $(`<div data-panelId="${this.id}" class="dm-screen-panel" empty="true"/>`);
			this.$pnl = $pnl;
			const $ctrlBar = $(`<div class="panel-control-bar"/>`).appendTo($pnl);
			this.$pnlTitle = $(`<div class="panel-control-bar panel-control-title"/>`).appendTo($pnl);
			this.$pnlAddTab = $(`<div class="panel-control-bar panel-control-addtab"><div class="panel-control-icon glyphicon glyphicon-plus" title="Add Tab"/></div>`).click(() => {
				this.setHasTabs(true);
				this.setDirty(true);
				this.render();
				openAddMenu();
			}).appendTo($pnl);

			const $ctrlMove = $(`<div class="panel-control-icon glyphicon glyphicon-move" title="Move"/>`).appendTo($ctrlBar);
			$ctrlMove.on("click", () => {
				$pnl.find(`.panel-control`).toggle();
				$pnl.find(`.btn-panel-add`).toggle();
				$pnl.toggleClass(`panel-mode-move`);
			});
			const $ctrlEmpty = $(`<div class="panel-control-icon glyphicon glyphicon-remove" title="Empty"/>`).appendTo($ctrlBar);
			$ctrlEmpty.on("click", () => {
				this.getReplacementPanel();
			});

			const joyMenu = new JoystickMenu(this);
			this.joyMenu = joyMenu;
			joyMenu.initialise();

			const $wrpContent = $(`<div class="panel-content-wrapper"/>`).appendTo($pnl);
			const $wrpBtnAdd = $(`<div class="panel-add"/>`).appendTo($wrpContent);
			const $btnAdd = $(`<span class="btn-panel-add glyphicon glyphicon-plus"/>`).on("click", () => {
				openAddMenu();
			}).appendTo($wrpBtnAdd);
			this.$btnAdd = $wrpBtnAdd;
			this.$btnAddInner = $btnAdd;
			this.$pnlWrpContent = $wrpContent;

			const $wrpTabs = $(`<div class="content-tab-bar"/>`).appendTo($pnl);
			const $wrpTabsInner = $(`<div class="content-tab-bar-inner"/>`).on("wheel", (evt) => {
				const delta = evt.originalEvent.deltaY;
				const curr = $wrpTabsInner.scrollLeft();
				$wrpTabsInner.scrollLeft(Math.max(0, curr + delta));
			}).appendTo($wrpTabs);
			const $btnTabAdd = $(`<div class="btn btn-default content-tab"><span class="glyphicon glyphicon-plus"/></div>`)
				.click(() => openAddMenu()).appendTo($wrpTabsInner);
			this.$pnlWrpTabs = $wrpTabs;
			this.$pnlTabs = $wrpTabsInner;

			if (this.$content) $wrpContent.append(this.$content);

			doApplyPosCss($pnl).appendTo(this.board.get$creen());
			this.isDirty = false;
		}

		if (this.isDirty) {
			if (!this.$pnl) doInitialRender.bind(this)();
			else {
				doApplyPosCss(this.$pnl);
				this.doRenderTitle();
				this.doRenderTabs();

				if (this.isContentDirty) {
					this.$pnlWrpContent.clear();
					if (this.$content) this.$pnlWrpContent.append(this.$content);
					this.isContentDirty = false;
				}
			}
			this.isDirty = false;
		}
	}

	getPos () {
		const offset = this.$pnl.offset();
		return {
			top: offset.top,
			left: offset.left,
			width: this.$pnl.outerWidth(),
			height: this.$pnl.outerHeight()
		};
	}

	getAddButtonPos () {
		const offset = this.$btnAddInner.offset();
		return {
			top: offset.top,
			left: offset.left,
			width: this.$btnAddInner.outerWidth(),
			height: this.$btnAddInner.outerHeight()
		};
	}

	doCloseTab (ixOpt) {
		if (this.isTabs) {
			this.close$TabContent(ixOpt);
		}

		// closing the last tab flips this, so we may need to do it in either case
		if (!this.isTabs) {
			const replacement = new Panel(this.board, this.x, this.y, this.width, this.height);
			this.exile();
			this.board.addPanel(replacement);
			this.board.doCheckFillSpaces();
		}
	}

	close$TabContent (ixOpt = 0) {
		return this.set$Tab(-1 * (ixOpt + 1), PANEL_TYP_EMPTY, null, null, null);
	}

	set$Content (type, contentMeta, $content, title) {
		this.type = type;
		this.contentMeta = contentMeta;
		this.$content = $content;
		this.title = title;

		this.$pnlWrpContent.children().detach();
		if ($content === null) this.$pnlWrpContent.append(this.$btnAdd);
		else this.$pnlWrpContent.append($content);
		this.$pnl.attr("empty", !$content);
		this.doRenderTitle();
		this.doRenderTabs();
	}

	setFromPeer (hisMeta, $hisContent) {
		this.isTabs = hisMeta.isTabs;
		this.tabIndex = hisMeta.tabIndex;
		this.tabDatas = hisMeta.tabDatas;

		this.set$Tab(hisMeta.tabIndex, hisMeta.type, hisMeta.contentMeta, $hisContent, hisMeta.title);
		hisMeta.tabDatas
			.forEach((it, ix) => {
				if (!it.isDeleted && it.$tabButton) {
					// regenerate tab buttons to refer to the correct tab
					it.$tabButton.remove();
					it.$tabButton = this._get$BtnSelTab(ix, it.title);
					this.$pnlTabs.children().last().before(it.$tabButton);
				}
			});
	}

	getNextTabIndex () {
		return this.tabDatas.length;
	}

	set$TabLoading (type, contentMeta) {
		return this.set$ContentTab(
			type,
			contentMeta,
			Panel._get$eleLoading(),
			TITLE_LOADING
		);
	}

	_get$BtnSelTab (ix, title) {
		title = title || "[Untitled]";
		const $btnSelTab = $(`<div class="btn btn-default content-tab"><span class="content-tab-title">${title}</span></div>`)
			.on("mousedown", (evt) => {
				if (evt.which === 1) {
					this.setActiveTab(ix);
				} else if (evt.which === 2) {
					this.doCloseTab(ix);
				}
			});
		const $btnCloseTab = $(`<span class="glyphicon glyphicon-remove content-tab-remove"/>`)
			.on("mousedown", (evt) => {
				evt.stopPropagation();
				this.doCloseTab(ix);
			}).appendTo($btnSelTab);
		return $btnSelTab;
	}

	set$Tab (ix, type, contentMeta, $content, title) {
		if (ix === null) ix = 0;
		if (ix < 0) {
			const ixPos = Math.abs(ix + 1);
			const td = this.tabDatas[ixPos];
			if (td) {
				td.isDeleted = true;
				if (td.$tabButton) td.$tabButton.detach();
			}
		} else {
			const $btnOld = (this.tabDatas[ix] || {}).$tabButton; // preserve tab button
			this.tabDatas[ix] = {
				type: type,
				contentMeta: contentMeta,
				$content: $content,
				title: title
			};
			if ($btnOld) this.tabDatas[ix].$tabButton = $btnOld;

			const doAdd$BtnSelTab = (ix, title) => {
				const $btnSelTab = this._get$BtnSelTab(ix, title);
				this.$pnlTabs.children().last().before($btnSelTab);
				return $btnSelTab;
			};

			if (!this.tabDatas[ix].$tabButton) this.tabDatas[ix].$tabButton = doAdd$BtnSelTab(ix, title);
			else this.tabDatas[ix].$tabButton.find(`.content-tab-title`).text(title);
		}

		this.setActiveTab(ix);
		return ix;
	}

	setActiveTab (ix) {
		if (ix < 0) {
			const handleNoTabs = () => {
				this.isTabs = false;
				this.tabIndex = 0;
				this.set$Content(PANEL_TYP_EMPTY, null, null);
			};

			if (this.isTabs) {
				const prevTabIx = this.tabDatas.findIndex(it => !it.isDeleted);
				if (~prevTabIx) {
					this.setActiveTab(prevTabIx);
				} else handleNoTabs();
			} else handleNoTabs();
		} else {
			this.tabIndex = ix;
			const tabData = this.tabDatas[ix];
			this.set$Content(tabData.type, tabData.contentMeta, tabData.$content, tabData.title);
		}
	}

	get$ContentWrapper () {
		return this.$pnlWrpContent;
	}

	get$Content () {
		return this.$content
	}

	exile () {
		if (Panel.isNonExilableType(this.type)) this.destroy();
		else {
			if (this.$pnl) this.$pnl.detach();
			this.board.exilePanel(this.id);
		}
	}

	destroy () {
		if (this.type === PANEL_TYP_ROLLBOX) EntryRenderer.dice.unbindDmScreenPanel();
		if (this.$pnl) this.$pnl.remove();
		this.board.destroyPanel(this.id);
	}

	addHoverClass () {
		this.$pnl.addClass("faux-hover");
	}

	removeHoverClass () {
		this.$pnl.removeClass("faux-hover");
	}

	getSaveableState () {
		const out = {
			x: this.x,
			y: this.y,
			w: this.width,
			h: this.height,
			t: this.type
		};

		function getSaveableContent (type, contentMeta, $content) {
			switch (type) {
				case PANEL_TYP_EMPTY:
					return null;

				case PANEL_TYP_ROLLBOX:
					return {
						t: type
					};
				case PANEL_TYP_STATS:
					return {
						t: type,
						c: {
							p: contentMeta.p,
							s: contentMeta.s,
							u: contentMeta.u
						}
					};
				case PANEL_TYP_RULES:
					return {
						t: type,
						c: {
							b: contentMeta.b,
							c: contentMeta.c,
							h: contentMeta.h
						}
					};
				case PANEL_TYP_TEXTBOX:
					return {
						t: type,
						s: {
							x: $content ? $content.find(`textarea`).val() : ""
						}
					};
				case PANEL_TYP_INITIATIVE_TRACKER: {
					return {
						t: type,
						s: $content.find(`.dm-init`).data("getState")()
					};
				}
				case PANEL_TYP_UNIT_CONVERTER: {
					return {
						t: type,
						s: $content.find(`.dm-unitconv`).data("getState")()
					};
				}
				case PANEL_TYP_TUBE:
				case PANEL_TYP_TWITCH:
				case PANEL_TYP_TWITCH_CHAT:
				case PANEL_TYP_GENERIC_EMBED:
				case PANEL_TYP_IMAGE:
					return {
						t: type,
						c: {
							u: contentMeta.u
						}
					};
				default:
					throw new Error(`Unhandled panel type ${this.type}`);
			}
		}

		const toSave = getSaveableContent(this.type, this.contentMeta, this.$content);
		if (toSave) Object.assign(out, toSave);

		if (this.isTabs) {
			out.a = this.tabDatas.filter(it => !it.isDeleted).map(td => getSaveableContent(td.type, td.contentMeta, td.$content));
			// offset saved tabindex by number of deleted tabs that come before
			let delCount = 0;
			for (let i = 0; i < this.tabIndex; ++i) {
				if (this.tabDatas[i].isDeleted) delCount++;
			}
			out.b = this.tabIndex - delCount;
		}

		return out;
	}
}

class JoystickMenu {
	constructor (panel) {
		this.panel = panel;

		this.$ctrls = null;
	}

	initialise () {
		this.panel.$pnl.on("mouseover", () => this.panel.board.setHoveringPanel(this.panel));
		this.panel.$pnl.on("mouseout", () => this.panel.board.setHoveringPanel(null));

		const $ctrlMove = $(`<div class="panel-control panel-control-middle"/>`);
		const $ctrlXpandUp = $(`<div class="panel-control panel-control-top"/>`);
		const $ctrlXpandRight = $(`<div class="panel-control panel-control-right"/>`);
		const $ctrlXpandDown = $(`<div class="panel-control panel-control-bottom"/>`);
		const $ctrlXpandLeft = $(`<div class="panel-control panel-control-left"/>`);
		const $ctrlBg = $(`<div class="panel-control panel-control-bg"/>`);
		this.$ctrls = [$ctrlMove, $ctrlXpandUp, $ctrlXpandRight, $ctrlXpandDown, $ctrlXpandLeft, $ctrlBg];

		$ctrlMove.on("mousedown touchstart", (e) => {
			this.panel.board.setVisiblyHoveringPanel(true);
			const $body = $(`body`);
			MiscUtil.clearSelection();
			$body.css("userSelect", "none");
			if (!this.panel.$content) return;

			const w = this.panel.$content.width();
			const h = this.panel.$content.height();
			const childH = this.panel.$content.children().first().height();
			const offset = this.panel.$content.offset();
			const offsetX = e.clientX - offset.left;
			const offsetY = h > childH ? childH / 2 : (e.clientY - offset.top);

			$body.append(this.panel.$content);
			$(`.panel-control`).hide();
			Panel.setMovingCss(e, this.panel.$content, w, h, offsetX, offsetY, 52);
			this.panel.board.get$creen().addClass("board-content-hovering");
			this.panel.$content.addClass("panel-content-hovering");
			this.panel.$pnl.addClass("pnl-content-tab-bar-hidden");
			// clean any lingering hidden scrollbar
			this.panel.$pnl.removeClass("panel-mode-move");

			Panel.bindMovingEvents(this.panel.board, this.panel.$content, offsetX, offsetY);

			$(document).on("mouseup touchend", () => {
				this.panel.board.setVisiblyHoveringPanel(false);
				$(document).off("mousemove touchmove").off("mouseup touchend");

				$body.css("userSelect", "");
				Panel.unsetMovingCss(this.panel.$content);
				this.panel.board.get$creen().removeClass("board-content-hovering");
				this.panel.$content.removeClass("panel-content-hovering");
				this.panel.$pnl.removeClass("pnl-content-tab-bar-hidden");
				// clean any lingering hidden scrollbar
				this.panel.$pnl.removeClass("panel-mode-move");

				if (!this.panel.board.hoveringPanel || this.panel.id === this.panel.board.hoveringPanel.id) {
					this.panel.$pnlWrpContent.append(this.panel.$content);
					this.panel.doShowJoystick();
				} else {
					const her = this.panel.board.hoveringPanel;
					// TODO this should ideally peel off the selected tab and transfer it to the target pane, instead of swapping
					const herMeta = her.getPanelMeta();
					const $herContent = her.get$Content();
					her.setFromPeer(this.panel.getPanelMeta(), this.panel.get$Content());
					this.panel.setFromPeer(herMeta, $herContent);

					this.panel.doHideJoystick();
					her.doShowJoystick();
				}
				MiscUtil.clearSelection();
			});
		});

		function xpandHandler (dir) {
			MiscUtil.clearSelection();
			$(`body`).css("userSelect", "none");
			$(`.panel-control`).hide();
			$(`.panel-control-bar`).addClass("xpander-active");
			$ctrlBg.show();
			this.panel.$pnl.addClass("panel-mode-move");
			switch (dir) {
				case UP:
					$ctrlXpandUp.show();
					break;
				case RIGHT:
					$ctrlXpandRight.show();
					break;
				case DOWN:
					$ctrlXpandDown.show();
					break;
				case LEFT:
					$ctrlXpandLeft.show();
					break;
			}
			const axis = dir === RIGHT || dir === LEFT ? AX_X : AX_Y;

			const pos = this.panel.$pnl.offset();
			const dim = this.panel.board.getPanelDimensions();
			let numPanelsCovered = 0;
			const initGCS = this.panel.$pnl.css("gridColumnStart");
			const initGCE = this.panel.$pnl.css("gridColumnEnd");
			const initGRS = this.panel.$pnl.css("gridRowStart");
			const initGRE = this.panel.$pnl.css("gridRowEnd");

			this.panel.$pnl.css({
				zIndex: 52,
				boxShadow: "0 0 12px 0 #000000a0"
			});

			$(document).off("mousemove touchmove").off("mouseup touchend");

			$(document).on("mousemove touchmove", (e) => {
				let delta = 0;
				const px = axis === AX_X ? dim.pxWidth : dim.pxHeight;
				switch (dir) {
					case UP:
						delta = pos.top - e.clientY;
						break;
					case RIGHT:
						delta = e.clientX - (pos.left + (px * this.panel.width));
						break;
					case DOWN:
						delta = e.clientY - (pos.top + (px * this.panel.height));
						break;
					case LEFT:
						delta = pos.left - e.clientX;
						break;
				}

				numPanelsCovered = Math.ceil((delta / px));
				const canShrink = axis === AX_X ? this.panel.width - 1 : this.panel.height - 1;
				if (canShrink + numPanelsCovered <= 0) numPanelsCovered = -canShrink;

				switch (dir) {
					case UP:
						if (numPanelsCovered > this.panel.y) numPanelsCovered = this.panel.y;
						this.panel.$pnl.css({
							gridRowStart: String(this.panel.y + (1 - numPanelsCovered)),
							gridRowEnd: String(this.panel.y + 1 + this.panel.height)
						});
						break;
					case RIGHT:
						if (numPanelsCovered > (this.panel.board.width - this.panel.width) - this.panel.x) numPanelsCovered = (this.panel.board.width - this.panel.width) - this.panel.x;
						this.panel.$pnl.css({
							gridColumnEnd: String(this.panel.x + 1 + this.panel.width + numPanelsCovered)
						});
						break;
					case DOWN:
						if (numPanelsCovered > (this.panel.board.height - this.panel.height) - this.panel.y) numPanelsCovered = (this.panel.board.height - this.panel.height) - this.panel.y;
						this.panel.$pnl.css({
							gridRowEnd: String(this.panel.y + 1 + this.panel.height + numPanelsCovered)
						});
						break;
					case LEFT:
						if (numPanelsCovered > this.panel.x) numPanelsCovered = this.panel.x;
						this.panel.$pnl.css({
							gridColumnStart: String(this.panel.x + (1 - numPanelsCovered)),
							gridColumnEnd: String(this.panel.x + 1 + this.panel.width)
						});
						break;
				}
			});

			$(document).on("mouseup touchend", () => {
				$(document).off("mousemove touchmove").off("mouseup touchend");

				$(`body`).css("userSelect", "");
				this.panel.$pnl.find(`.panel-control`).show();
				$(`.panel-control-bar`).removeClass("xpander-active");
				this.panel.$pnl.css({
					zIndex: "",
					boxShadow: "",
					gridColumnStart: initGCS,
					gridColumnEnd: initGCE,
					gridRowStart: initGRS,
					gridRowEnd: initGRE
				});

				const canShrink = axis === AX_X ? this.panel.width - 1 : this.panel.height - 1;
				if (canShrink + numPanelsCovered <= 0) numPanelsCovered = -canShrink;
				if (numPanelsCovered === 0) return;
				const isGrowth = !!~Math.sign(numPanelsCovered);
				if (isGrowth) {
					switch (dir) {
						case UP:
							if (!this.panel.hasSpaceTop()) return;
							break;
						case RIGHT:
							if (!this.panel.hasSpaceRight()) return;
							break;
						case DOWN:
							if (!this.panel.hasSpaceBottom()) return;
							break;
						case LEFT:
							if (!this.panel.hasSpaceLeft()) return;
							break;
					}
				}

				for (let i = Math.abs(numPanelsCovered); i > 0; --i) {
					switch (dir) {
						case UP: {
							if (isGrowth) {
								const tNeighbours = this.panel.getTopNeighbours();
								if (tNeighbours.filter(it => it.getEmpty()).length === tNeighbours.length) {
									tNeighbours.forEach(p => p.destroy());
								} else {
									tNeighbours.forEach(p => {
										if (p.canBumpTop()) p.doBumpTop();
										else if (p.canShrinkBottom()) p.doShrinkBottom();
										else p.exile();
									});
								}
							}
							this.panel.height += Math.sign(numPanelsCovered);
							this.panel.y -= Math.sign(numPanelsCovered);
							break;
						}
						case RIGHT: {
							if (isGrowth) {
								const rNeighbours = this.panel.getRightNeighbours();
								if (rNeighbours.filter(it => it.getEmpty()).length === rNeighbours.length) {
									rNeighbours.forEach(p => p.destroy());
								} else {
									rNeighbours.forEach(p => {
										if (p.canBumpRight()) p.doBumpRight();
										else if (p.canShrinkLeft()) p.doShrinkLeft();
										else p.exile();
									});
								}
							}
							this.panel.width += Math.sign(numPanelsCovered);
							break;
						}
						case DOWN: {
							if (isGrowth) {
								const bNeighbours = this.panel.getBottomNeighbours();
								if (bNeighbours.filter(it => it.getEmpty()).length === bNeighbours.length) {
									bNeighbours.forEach(p => p.destroy());
								} else {
									bNeighbours.forEach(p => {
										if (p.canBumpBottom()) p.doBumpBottom();
										else if (p.canShrinkTop()) p.doShrinkTop();
										else p.exile();
									});
								}
							}
							this.panel.height += Math.sign(numPanelsCovered);
							break;
						}
						case LEFT: {
							if (isGrowth) {
								const lNeighbours = this.panel.getLeftNeighbours();
								if (lNeighbours.filter(it => it.getEmpty()).length === lNeighbours.length) {
									lNeighbours.forEach(p => p.destroy());
								} else {
									lNeighbours.forEach(p => {
										if (p.canBumpLeft()) p.doBumpLeft();
										else if (p.canShrinkRight()) p.doShrinkRight();
										else p.exile();
									});
								}
							}
							this.panel.width += Math.sign(numPanelsCovered);
							this.panel.x -= Math.sign(numPanelsCovered);
							break;
						}
					}
				}
				this.panel.setDirty(true);
				this.panel.render();
				this.panel.board.doCheckFillSpaces();
				MiscUtil.clearSelection();
			});
		}

		$ctrlXpandUp.on("mousedown touchstart", xpandHandler.bind(this, UP));
		$ctrlXpandRight.on("mousedown touchstart", xpandHandler.bind(this, RIGHT));
		$ctrlXpandLeft.on("mousedown touchstart", xpandHandler.bind(this, LEFT));
		$ctrlXpandDown.on("mousedown touchstart", xpandHandler.bind(this, DOWN));

		this.panel.$pnl.append($ctrlBg).append($ctrlMove).append($ctrlXpandUp).append($ctrlXpandRight).append($ctrlXpandDown).append($ctrlXpandLeft);
	}

	doShow () {
		this.$ctrls.forEach($c => $c.show());
	}

	doHide () {
		this.$ctrls.forEach($c => $c.hide());
	}
}

class AddMenu {
	constructor () {
		this.tabs = [];

		this.$menu = null;
		this.$tabView = null;
		this.activeTab = null;
		this.pnl = null; // panel where an add button was last clicked
	}

	addTab (tab) {
		tab.setMenu(this);
		this.tabs.push(tab);
		return this;
	}

	get$Menu () {
		return this.$menu;
	}

	setActiveTab (tab) {
		this.$menu.find(`.panel-addmenu-tab-head`).attr(`active`, false);
		if (this.activeTab) this.activeTab.get$Tab().detach();
		this.activeTab = tab;
		this.$tabView.append(tab.get$Tab());
		tab.$head.attr(`active`, true);

		if (tab.doTransitionActive) tab.doTransitionActive();
	}

	hasActiveTab () {
		return this.activeTab !== null;
	}

	getActiveTab () {
		return this.activeTab;
	}

	setFirstTabActive () {
		const t = this.tabs[0];
		this.setActiveTab(t);
	}

	render () {
		if (!this.$menu) {
			const $menu = $(`<div class="panel-addmenu">`);
			this.$menu = $menu;
			const $menuInner = $(`<div class="panel-addmenu-inner dropdown-menu">`).appendTo($menu);
			const $tabBar = $(`<div class="panel-addmenu-bar"/>`).appendTo($menuInner);
			const $tabView = $(`<div class="panel-addmenu-view"/>`).appendTo($menuInner);
			this.$tabView = $tabView;

			this.tabs.forEach(t => {
				t.render();
				const $head = $(`<div class="btn btn-default panel-addmenu-tab-head">${t.label}</div>`).appendTo($tabBar);
				if (t.getSpotlight()) $head.addClass("btn-spotlight");
				const $body = $(`<div class="panel-addmenu-tab-body"/>`).appendTo($tabBar);
				$body.append(t.get$Tab);
				t.$head = $head;
				t.$body = $body;
				$head.on("click", () => this.setActiveTab(t));
			});

			$menu.on("click", () => this.doClose());
			$menuInner.on("click", (e) => e.stopPropagation());
		}
	}

	setPanel (pnl) {
		this.pnl = pnl;
	}

	getPanel () {
		return this.pnl;
	}

	doClose () {
		this.$menu.detach();
	}

	doOpen () {
		$(`body`).append(this.$menu);
	}
}

class AddMenuTab {
	constructor (label) {
		this.label = label;
		this.spotlight = false;

		this.$tab = null;
		this.menu = null;
	}

	get$Tab () {
		return this.$tab;
	}

	genTabId (type) {
		return `tab-${type}-${this.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "_")}`;
	}

	setMenu (menu) {
		this.menu = menu;
	}

	setSpotlight (spotlight) {
		this.spotlight = spotlight;
	}

	getSpotlight () {
		return this.spotlight;
	}
}

class AddMenuVideoTab extends AddMenuTab {
	constructor () {
		super("Embed");
		this.tabId = this.genTabId("tube");
	}

	render () {
		if (!this.$tab) {
			const $tab = $(`<div class="panel-tab-list-wrapper underline-tabs" id="${this.tabId}"/>`);

			const $wrpYT = $(`<div class="tab-body-row"/>`).appendTo($tab);
			const $iptUrlYT = $(`<input class="form-control" placeholder="Paste YouTube URL">`).appendTo($wrpYT);
			const $btnAddYT = $(`<div class="btn btn-primary">Embed</div>`).appendTo($wrpYT);
			$btnAddYT.on("click", () => {
				let url = $iptUrlYT.val().trim();
				const m = /https?:\/\/(www\.)?youtube\.com\/watch\?v=(.*?)(&.*$|$)/.exec(url);
				if (url && m) {
					url = `https://www.youtube.com/embed/${m[2]}`;
					this.menu.pnl.doPopulate_YouTube(url);
					this.menu.doClose();
					$iptUrlYT.val("");
				} else {
					alert(`Please enter a URL of the form: "https://www.youtube.com/watch?v=XXXXXXX"`);
				}
			});

			const $wrpTwitch = $(`<div class="tab-body-row"/>`).appendTo($tab);
			const $iptUrlTwitch = $(`<input class="form-control" placeholder="Paste Twitch URL">`).appendTo($wrpTwitch);
			const $btnAddTwitch = $(`<div class="btn btn-primary">Embed</div>`).appendTo($wrpTwitch);
			const $btnAddTwitchChat = $(`<div class="btn btn-primary">Embed Chat</div>`).appendTo($wrpTwitch);
			const getTwitchM = (url) => {
				return /https?:\/\/(www\.)?twitch\.tv\/(.*?)(\?.*$|$)/.exec(url);
			};
			$btnAddTwitch.on("click", () => {
				let url = $iptUrlTwitch.val().trim();
				const m = getTwitchM(url);
				if (url && m) {
					url = `http://player.twitch.tv/?channel=${m[2]}`;
					this.menu.pnl.doPopulate_Twitch(url);
					this.menu.doClose();
					$iptUrlTwitch.val("");
				} else {
					alert(`Please enter a URL of the form: "https://www.twitch.tv/XXXXXX"`);
				}
			});

			$btnAddTwitchChat.on("click", () => {
				let url = $iptUrlTwitch.val().trim();
				const m = getTwitchM(url);
				if (url && m) {
					url = `http://www.twitch.tv/embed/${m[2]}/chat`;
					this.menu.pnl.doPopulate_TwitchChat(url);
					this.menu.doClose();
					$iptUrlTwitch.val("");
				} else {
					alert(`Please enter a URL of the form: "https://www.twitch.tv/XXXXXX"`);
				}
			});

			const $wrpGeneric = $(`<div class="tab-body-row"/>`).appendTo($tab);
			const $iptUrlGeneric = $(`<input class="form-control" placeholder="Paste any URL">`).appendTo($wrpGeneric);
			const $btnAddGeneric = $(`<div class="btn btn-primary">Embed</div>`).appendTo($wrpGeneric);
			$btnAddGeneric.on("click", () => {
				let url = $iptUrlGeneric.val().trim();
				if (url) {
					this.menu.pnl.doPopulate_GenericEmbed(url);
					this.menu.doClose();
				} else {
					alert(`Please enter a URL`);
				}
			});

			this.$tab = $tab;
		}
	}
}

class AddMenuImageTab extends AddMenuTab {
	constructor () {
		super("Image");
		this.tabId = this.genTabId("image");
	}

	render () {
		if (!this.$tab) {
			const $tab = $(`<div class="panel-tab-list-wrapper underline-tabs" id="${this.tabId}"/>`);

			const $wrpImgur = $(`<div class="tab-body-row"/>`).appendTo($tab);
			$(`<span>Imgur (Anonymous Upload) <i class="text-muted">(accepts <a href="https://help.imgur.com/hc/articles/115000083326" target="_blank">imgur-friendly formats</a>)</i></span>`).appendTo($wrpImgur);
			const $iptFile = $(`<input type="file" class="hidden">`).on("change", (evt) => {
				const input = evt.target;
				const reader = new FileReader();
				reader.onload = () => {
					const base64 = reader.result.replace(/.*,/, "");
					$.ajax({
						url: "https://api.imgur.com/3/image",
						type: "POST",
						data: {
							image: base64,
							type: "base64"
						},
						headers: {
							Accept: "application/json",
							Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
						},
						success: (data) => {
							this.menu.pnl.doPopulate_Image(data.data.link, ix);
						},
						error: (error) => {
							try {
								alert(`Failed to upload: ${JSON.parse(error.responseText).data.error}`);
							} catch (e) {
								alert("Failed to upload: Unknown error");
								setTimeout(() => {
									throw e
								});
							}
							this.menu.pnl.doPopulate_Empty(ix);
						}
					});
				};
				reader.onerror = () => {
					this.menu.pnl.doPopulate_Empty(ix);
				};
				reader.fileName = input.files[0].name;
				reader.readAsDataURL(input.files[0]);
				const ix = this.menu.pnl.doPopulate_Loading("Uploading"); // will be null if not in tabbed mode
				this.menu.doClose();
			}).appendTo($tab);
			const $btnAdd = $(`<div class="btn btn-primary">Upload</div>`).appendTo($wrpImgur);
			$btnAdd.on("click", () => {
				$iptFile.click();
			});
			$(`<hr class="tab-body-row-sep"/>`).appendTo($tab);

			const $wrpUtl = $(`<div class="tab-body-row"/>`).appendTo($tab);
			const $iptUrl = $(`<input class="form-control" placeholder="Paste image URL">`).appendTo($wrpUtl);
			const $btnAddUrl = $(`<div class="btn btn-primary">Add</div>`).appendTo($wrpUtl);
			$btnAddUrl.on("click", () => {
				let url = $iptUrl.val().trim();
				if (url) {
					this.menu.pnl.doPopulate_Image(url);
					this.menu.doClose();
				} else {
					alert(`Please enter a URL`);
				}
			});

			this.$tab = $tab;
		}
	}
}

class AddMenuSpecialTab extends AddMenuTab {
	constructor () {
		super("Special");
		this.tabId = this.genTabId("special");
	}

	render () {
		if (!this.$tab) {
			const $tab = $(`<div class="panel-tab-list-wrapper underline-tabs" id="${this.tabId}"/>`);

			const $wrpRoller = $(`<div class="tab-body-row"><span>Dice Roller <i class="text-muted">(pins the existing dice roller to a panel)</i></span></div>`).appendTo($tab);
			const $btnRoller = $(`<div class="btn btn-primary">Pin</div>`).appendTo($wrpRoller);
			$btnRoller.on("click", () => {
				EntryRenderer.dice.bindDmScreenPanel(this.menu.pnl);
				this.menu.doClose();
			});
			$(`<hr class="tab-body-row-sep"/>`).appendTo($tab);

			const $wrpTracker = $(`<div class="tab-body-row"><span>Initiative Tracker</span></div>`).appendTo($tab);
			const $btnTracker = $(`<div class="btn btn-primary">Add</div>`).appendTo($wrpTracker);
			$btnTracker.on("click", () => {
				this.menu.pnl.doPopulate_InitiativeTracker();
				this.menu.doClose();
			});
			$(`<hr class="tab-body-row-sep"/>`).appendTo($tab);

			const $wrpText = $(`<div class="tab-body-row"><span>Basic Text Box <i class="text-muted">(for a feature-rich editor, embed a Google Doc or similar)</i></span></div>`).appendTo($tab);
			const $btnText = $(`<div class="btn btn-primary">Add</div>`).appendTo($wrpText);
			$btnText.on("click", () => {
				this.menu.pnl.doPopulate_TextBox();
				this.menu.doClose();
			});
			$(`<hr class="tab-body-row-sep"/>`).appendTo($tab);

			const $wrpConverter = $(`<div class="tab-body-row"><span>Imperial-Metric Unit Converter</span></div>`).appendTo($tab);
			const $btnConverter = $(`<div class="btn btn-primary">Add</div>`).appendTo($wrpConverter);
			$btnConverter.on("click", () => {
				this.menu.pnl.doPopulate_UnitConverter();
				this.menu.doClose();
			});

			this.$tab = $tab;
		}
	}
}

class AddMenuListTab extends AddMenuTab {
	constructor (label, content) {
		super(label);
		this.tabId = this.genTabId("list");
		this.content = content;

		this.list = null;
	}

	render () {
		if (!this.$tab) {
			const $tab = $(`<div class="panel-tab-list-wrapper" id="${this.tabId}"/>`);
			const $srch = $(`<input class="panel-tab-search search form-control" autocomplete="off" placeholder="Search list...">`).appendTo($tab);
			const $list = $(`<div class="list panel-tab-list"/>`).appendTo($tab);
			let temp = "";
			this.content.forEach(d => {
				temp += `<div class="panel-tab-list-item"><span class="name">${d.n}</span></div>`;
			});
			$list.append(temp);
			this.$tab = $tab;
			this.$srch = $srch;
			this.$list = $list;
		}
	}

	doTransitionActive () {
		setTimeout(() => {
			if (!tab.list) {
				tab.list = new List(tab.tabId, {
					valueNames: ["name"],
					listClass: "panel-tab-list"
				});
			}
		}, 1);
	}
}

class AddMenuSearchTab extends AddMenuTab {
	constructor (indexes, subType = "content") {
		super(subType === "content" ? "Content" : "Rules");
		this.tabId = this.genTabId(subType === "content" ? "content" : "rules");
		this.indexes = indexes;
		this.cat = "ALL";
		this.subType = subType;

		this.$selCat = null;
		this.$srch = null;
		this.$results = null;
		this.showMsgIpt = null;
		this.doSearch = null;
	}

	render () {
		const flags = {
			doClickFirst: false,
			isWait: false
		};

		this.showMsgIpt = () => {
			flags.isWait = true;
			this.$results.empty().append(DmScreenUtil.getSearchEnter());
		};

		const showMsgDots = () => {
			this.$results.empty().append(DmScreenUtil.getSearchLoading());
		};

		const showNoResults = () => {
			flags.isWait = true;
			this.$results.empty().append(DmScreenUtil.getSearchEnter());
		};

		this.doSearch = () => {
			const srch = this.$srch.val().trim();
			const MAX_RESULTS = 75; // hard cap results

			const searchOptions = this.subType === "content"
				? {
					fields: {
						n: {boost: 5, expand: true},
						s: {expand: true}
					},
					bool: "AND",
					expand: true
				}
				: {
					fields: {
						h: {boost: 5, expand: true},
						s: {expand: true}
					},
					bool: "AND",
					expand: true
				};

			const index = this.indexes[this.cat];
			const results = index.search(srch, searchOptions);
			const resultCount = results.length ? results.length : index.documentStore.length;
			const toProcess = results.length ? results : Object.values(index.documentStore.docs).slice(0, 75).map(it => ({doc: it}));

			this.$results.empty();
			if (toProcess.length) {
				const handleClick = (r) => {
					if (this.subType === "content") {
						const page = UrlUtil.categoryToPage(r.doc.c);
						const source = r.doc.s;
						const hash = r.doc.u;

						this.menu.pnl.doPopulate_Stats(page, source, hash);
					} else {
						this.menu.pnl.doPopulate_Rules(r.doc.b, r.doc.p, r.doc.h);
					}
					this.menu.doClose();
				};

				const get$Row = (r) => {
					if (this.subType === "content") {
						return $(`
							<div class="panel-tab-results-row">
								<span>${r.doc.n}</span>
								<span>${r.doc.s ? `<i title="${Parser.sourceJsonToFull(r.doc.s)}">${Parser.sourceJsonToAbv(r.doc.s)}${r.doc.p ? ` p${r.doc.p}` : ""}</i>` : ""}</span>
							</div>
						`);
					} else {
						return $(`
							<div class="panel-tab-results-row">
								<span>${r.doc.h}</span>
								<span><i>${r.doc.n}, ${r.doc.s}</i></span>
							</div>
						`);
					}
				};

				if (flags.doClickFirst) {
					handleClick(toProcess[0]);
					flags.doClickFirst = false;
					return;
				}

				const res = toProcess.slice(0, MAX_RESULTS); // hard cap at 75 results

				res.forEach(r => {
					get$Row(r).on("click", () => handleClick(r)).appendTo(this.$results);
				});

				if (resultCount > MAX_RESULTS) {
					const diff = resultCount - MAX_RESULTS;
					this.$results.append(`<div class="panel-tab-results-row panel-tab-results-row-display-only">...${diff} more result${diff === 1 ? " was" : "s were"} hidden. Refine your search!</div>`);
				}
			} else {
				if (!srch.trim()) this.showMsgIpt();
				else showNoResults();
			}
		};

		if (!this.$tab) {
			const $tab = $(`<div class="panel-tab-list-wrapper" id="${this.tabId}"/>`);
			const $wrpCtrls = $(`<div class="panel-tab-controls"/>`).appendTo($tab);

			const $selCat = $(`
				<select class="form-control panel-tab-cat">
					<option value="ALL">All Categories</option>
				</select>
			`).appendTo($wrpCtrls);
			Object.keys(this.indexes).sort().filter(it => it !== "ALL").forEach(it => $selCat.append(`<option value="${it}">${it}</option>`));
			$selCat.on("change", () => {
				this.cat = $selCat.val();
				this.doSearch();
			});

			const $srch = $(`<input class="panel-tab-search search form-control" autocomplete="off" placeholder="Search...">`).appendTo($wrpCtrls);
			const $results = $(`<div class="panel-tab-results"/>`).appendTo($tab);

			DmScreenUtil.bindAutoSearch($srch, {
				flags: flags,
				search: this.doSearch,
				showWait: showMsgDots
			});

			this.$tab = $tab;
			this.$selCat = $selCat;
			this.$srch = $srch;
			this.$results = $results;

			this.doSearch();
		}
	}

	doTransitionActive () {
		this.$srch.val("").focus();
		if (this.doSearch) this.doSearch();
	}
}

class RuleLoader {
	static pFill (book) {
		return DataUtil.loadJSON(`data/${book}.json`).then(data => new Promise((resolve) => {
			const $$$ = RuleLoader.cache;

			Object.keys(data.data).forEach(b => {
				const ref = data.data[b];
				if (!$$$[b]) $$$[b] = {};
				ref.forEach((c, i) => {
					if (!$$$[b][i]) $$$[b][i] = {};
					c.entries.forEach(s => {
						$$$[b][i][s.name] = s;
					});
				})
			});

			resolve();
		}));
	}

	static getFromCache (book, chapter, header) {
		return RuleLoader.cache[book][chapter][header];
	}
}
RuleLoader.cache = {};

class InitiativeTracker {
	static getConditions () {
		return [
			{
				name: "Blinded",
				color: "#434343"
			},
			{
				name: "Charmed",
				color: "#f01789"
			},
			{
				name: "Concentrating",
				color: "#009f7a",
				condName: null
			},
			{
				name: "Deafened",
				color: "#c7d0d3"
			},
			{
				name: "Drunk",
				color: "#ffcc00"
			},
			{
				name: "Exhausted",
				color: "#947a47",
				condName: "Exhaustion"
			},
			{
				name: "Frightened",
				color: "#c9ca18"
			},
			{
				name: "Grappled",
				color: "#8784a0"
			},
			{
				name: "Incapacitated",
				color: "#3165a0"
			},
			{
				name: "Invisible",
				color: "#7ad2d6"
			},
			{
				name: "!!On Fire!!",
				color: "#ff6800",
				condName: null
			},
			{
				name: "Paralyzed",
				color: "#c00900"
			},
			{
				name: "Petrified",
				color: "#a0a0a0"
			},
			{
				name: "Poisoned",
				color: "#4dc200"
			},
			{
				name: "Prone",
				color: "#5e60a0"
			},
			{
				name: "Restrained",
				color: "#d98000"
			},
			{
				name: "Stunned",
				color: "#a23bcb"
			},
			{
				name: "Unconscious",
				color: "#1c2383"
			}
		];
	}

	static make$Tracker (board, state) {
		const ALPHA = "ALPHA";
		const NUM = "NUMBER";
		const ASC = "ASC";
		const DESC = "DESC";

		let sort = state.s || NUM;
		let dir = state.d || DESC;
		let isLocked = false;

		const $wrpTracker = $(`<div class="dm-init"/>`);

		const $wrpTop = $(`<div style="display: flex; flex-direction: column;"/>`).appendTo($wrpTracker);
		const $wrpHeader = $(`
			<div class="dm-init-wrp-header">
				<div class="dm-init-header">Creature/Status</div>
				<div class="dm-init-row-rhs" style="margin-right: 9px;">
					<div class="dm-init-header" title="Hit Points">HP</div>
					<div class="dm-init-header" title="Initiative Score">#</div>
					<div style="width: 24px;"/>
				</div>
			</div>
		`).appendTo($wrpTop);

		const $wrpEntries = $(`<div class="dm-init-wrp-entries"/>`).appendTo($wrpTop);

		const $wrpControls = $(`<div class="dm-init-wrp-controls"/>`).appendTo($wrpTracker);

		const $wrpLock = $(`<div/>`).appendTo($wrpControls);
		const $btnLock = $(`<div class="btn btn-danger" title="Lock Tracker"><span class="glyphicon glyphicon-lock"></span></div>`).appendTo($wrpLock);
		$btnLock.on("click", () => {
			if (isLocked) {
				$btnLock.removeClass("btn-success").addClass("btn-danger");
				$(".dm-init-lockable").toggleClass("disabled");
				$("input.dm-init-lockable").prop('disabled', false);
			} else {
				$btnLock.removeClass("btn-danger").addClass("btn-success");
				$(".dm-init-lockable").toggleClass("disabled");
				$("input.dm-init-lockable").prop('disabled', true);
			}
			isLocked = !isLocked;
		});

		const $wrpAddNext = $(`<div/>`).appendTo($wrpControls);
		const $btnAdd = $(`<div class="btn btn-primary dm-init-lockable" title="Add Player" style="margin-right: 7px;"><span class="glyphicon glyphicon-plus"></span></div>`).appendTo($wrpAddNext);
		const $btnAddMonster = $(`<div class="btn btn-success dm-init-lockable" title="Add Monster" style="margin-right: 7px;"><span class="glyphicon glyphicon-print"></span></div>`).appendTo($wrpAddNext);
		const $btnNext = $(`<div class="btn btn-default" title="Next Turn"><span class="glyphicon glyphicon-step-forward"></span></div>`).appendTo($wrpAddNext);
		$btnNext.on("click", () => setNextActive());

		const $wrpSort = $(`<div/>`).appendTo($wrpControls);
		const $btnSortAlpha = $(`<div title="Sort Alphabetically" class="btn btn-default" style="margin-right: 7px;"><span class="glyphicon glyphicon-sort-by-alphabet"></span></div>`).appendTo($wrpSort);
		$btnSortAlpha.on("click", () => {
			if (sort === ALPHA) flipDir();
			else sort = ALPHA;
			doSort(ALPHA);
		});
		const $btnSortNum = $(`<div title="Sort Numerically" class="btn btn-default"><span class="glyphicon glyphicon-sort-by-order"></span></div>`).appendTo($wrpSort);
		$btnSortNum.on("click", () => {
			if (sort === NUM) flipDir();
			else sort = NUM;
			doSort(NUM);
		});
		const $btnReset = $(`<div title="Reset" class="btn btn-danger dm-init-lockable"><span class="glyphicon glyphicon-trash"></span></div>`).appendTo($wrpControls);
		$btnReset.on("click", () => {
			if (isLocked) return;
			$wrpEntries.empty();
			sort = NUM;
			dir = DESC;
		});

		$btnAdd.on("click", () => {
			if (isLocked) return;
			makeRow();
			doSort(sort);
			checkSetActive();
		});

		$btnAddMonster.on("click", () => {
			if (isLocked) return;
			const flags = {
				doClickFirst: false,
				isWait: false
			};

			const $menu = $(`<div class="panel-addmenu">`);
			const $menuInner = $(`<div class="panel-addmenu-inner dropdown-menu">`).appendTo($menu);
			const doClose = () => $menu.remove();
			$menu.on("click", doClose);
			$menuInner.on("click", (e) => e.stopPropagation());
			$(`body`).append($menu);

			const $controls = $(`<div class="split" style="flex-shrink: 0"/>`).appendTo($menuInner);
			const $srch = $(`<input class="panel-tab-search search form-control" autocomplete="off" placeholder="Search...">`).appendTo($controls);
			const $wrpCbRoll = $(`<label class="panel-tab-search-checkbox"> Roll HP</label>`).appendTo($controls);
			const $cbRoll = $(`<input type="checkbox">`).prop("checked", InitiativeTracker._uiRollHp).on("change", () => InitiativeTracker._uiRollHp = $cbRoll.prop("checked")).prependTo($wrpCbRoll);
			const $results = $(`<div class="panel-tab-results"/>`).appendTo($menuInner);

			this.showMsgIpt = () => {
				flags.isWait = true;
				$results.empty().append(DmScreenUtil.getSearchEnter());
			};

			const showMsgDots = () => $results.empty().append(DmScreenUtil.getSearchLoading());

			const showNoResults = () => {
				flags.isWait = true;
				$results.empty().append(DmScreenUtil.getSearchNoResults());
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
						makeRow(name, "", "", false, source, [], $cbRoll.prop("checked"));
						doSort(sort);
						checkSetActive();
						doClose();
					};

					const get$Row = (r) => {
						return $(`
							<div class="panel-tab-results-row">
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
						$results.append(`<div class="panel-tab-results-row panel-tab-results-row-display-only">...${diff} more result${diff === 1 ? " was" : "s were"} hidden. Refine your search!</div>`);
					}
				} else {
					if (!srch.trim()) showMsgIpt();
					else showNoResults();
				}
			};

			DmScreenUtil.bindAutoSearch($srch, {
				flags: flags,
				search: doSearch,
				showWait: showMsgDots
			});

			doSearch();
		});

		$wrpTracker.data("getState", () => {
			const rows = $wrpEntries.find(`.dm-init-row`).map((i, e) => {
				const $conds = $(e).find(`.dm-init-cond`);
				return {
					n: $(e).find(`input.name`).val(),
					h: $(e).find(`input.hp`).val(),
					i: $(e).find(`input.score`).val(),
					a: 0 + $(e).hasClass(`dm-init-row-active`),
					s: $(e).find(`input.source`).val(),
					c: $conds.length ? $conds.map((i, e) => $(e).data("getState")()).get() : []
				}
			}).get();
			return {
				r: rows,
				s: sort,
				d: dir,
				m: InitiativeTracker._uiRollHp
			};
		});

		InitiativeTracker._uiRollHp = !!state.m;
		(state.r || []).forEach(r => {
			makeRow(r.n, r.h, r.i, r.a, r.s, r.c);
		});
		checkSetActive();

		function setNextActive () {
			const $rows = $wrpEntries.find(`.dm-init-row`);
			const ix = $rows.index($rows.filter(`.dm-init-row-active`).get(0));
			const $curr = $($rows.get(ix));
			$curr.removeClass(`dm-init-row-active`);

			// tick down any conditions
			const $conds = $curr.find(`.dm-init-cond`);
			if ($conds.length) $conds.each((i, e) => $(e).data("doTickDown")());

			const nxt = $rows.get(ix + 1);
			if (nxt) {
				$(nxt).addClass(`dm-init-row-active`);
				// if names and initiatives are the same, skip forwards (groups of monsters)
				if ($curr.find(`input.name`).val() === $(nxt).find(`input.name`).val() &&
					$curr.find(`input.score`).val() === $(nxt).find(`input.score`).val()) {
					setTimeout(() => setNextActive(), 30); // add a small delay for visibility
				}
			} else {
				$($rows.get(0)).addClass(`dm-init-row-active`);
			}
		}

		function makeRow (name = "", hp = "", init = "", isActive, source, conditions = [], rollHp = false) {
			const isMon = !!source;

			const $wrpRow = $(`<div class="dm-init-row ${isActive ? "dm-init-row-active" : ""}"/>`);

			const $wrpLhs = $(`<div class="dm-init-row-lhs"/>`).appendTo($wrpRow);
			const $iptName = $(`<input class="form-control input-sm name dm-init-lockable ${isMon ? "hidden" : ""}" placeholder="Name" value="${name}">`).appendTo($wrpLhs);
			$iptName.on("change", () => doSort(ALPHA));
			if (isMon) {
				const $rows = $wrpEntries.find(`.dm-init-row`);
				const curr = $rows.find(".init-wrp-creature").filter((i, e) => $(e).parent().find(`input.name`).val() === name && $(e).parent().find(`input.source`).val() === source);
				let monNum = null;
				if (curr.length) {
					if (curr.length === 1) {
						const r = $(curr.get(0));
						r.find(`.init-wrp-creature-link`).append(` <span data-number="1">(1)</span>`);
						monNum = 2;
					} else {
						monNum = curr.map((i, e) => $(e).find(`span[data-number]`).data("number")).get().reduce((a, b) => Math.max(Number(a), Number(b)), 0) + 1;
					}
				}

				const $monName = $(`
					<div class="init-wrp-creature split">
						<span class="init-wrp-creature-link">
							${EntryRenderer.getDefaultRenderer().renderEntry(`{@creature ${name}|${source}}`)}
							${monNum ? ` <span data-number="${monNum}">(${monNum})</span>` : ""}
						</span>
					</div>
				`).appendTo($wrpLhs);
				const $btnAnother = $(`<div class="btn btn-success btn-xs dm-init-lockable" title="Add Another (SHIFT for Roll New)"><span class="glyphicon glyphicon-plus"></span></div>`)
					.click((evt) => {
						if (isLocked) return;
						makeRow(name, "", evt.shiftKey ? "" : $iptScore.val(), false, source, [], InitiativeTracker._uiRollHp);
					}).appendTo($monName);
				$(`<input class="source hidden" value="${source}">`).appendTo($wrpLhs);
			}

			function addCondition (name, color, turns) {
				const state = {
					name: name,
					color: color,
					turns: turns ? Number(turns) : null
				};

				const tickDown = (fromClick) => {
					if (fromClick && state.turns == null) $cond.data("doRemove")(); // remove permanent conditions
					if (state.turns == null) return;
					else state.turns--;
					if (state.turns <= 0) $cond.data("doRemove")();
					else $cond.data("doRender")(fromClick);
				};

				const tickUp = (fromClick) => {
					if (fromClick && state.turns == null) state.turns = 0; // convert permanent condition
					if (state.turns == null) return;
					else state.turns++;
					$cond.data("doRender")(fromClick);
				};

				const render = (fromClick) => {
					const turnsText = `${state.turns} turn${state.turns > 1 ? "s" : ""} remaining`;
					const ttpText = state.name && state.turns ? `${state.name.escapeQuotes()} (${turnsText})` : state.name ? state.name.escapeQuotes() : state.turns ? turnsText : "";
					const getBar = () => {
						const style = state.turns == null || state.turns > 3
							? `background-image: linear-gradient(45deg, ${state.color} 41.67%, transparent 41.67%, transparent 50%, ${state.color} 50%, ${state.color} 91.67%, transparent 91.67%, transparent 100%); background-size: 8.49px 8.49px;`
							: `background: ${state.color};`;
						return `<div class="dm-init-cond-bar" style="${style}"/>`
					};
					const inner = state.turns
						? [...new Array(Math.min(state.turns, 3))].map(it => getBar()).join("")
						: getBar();
					$cond.attr("title", ttpText);

					$cond.tooltip({trigger: "hover"});
					if (ttpText) {
						// update tooltips
						$cond.tooltip("enable").tooltip("fixTitle");
						if (fromClick) $cond.tooltip("show");
					} else $cond.tooltip("disable");

					$cond.html(inner);
				};

				const $cond = $(`<div class="dm-init-cond"/>`)
					.data("doRender", render)
					.data("doRemove", () => $cond.tooltip("destroy").remove())
					.data("doTickDown", tickDown)
					.data("doTickUp", tickUp)
					.data("getState", () => JSON.parse(JSON.stringify(state)))
					.on("contextmenu", (e) => e.ctrlKey || (e.preventDefault() || tickUp(true)))
					.click(() => tickDown(true))
					.appendTo($conds);
				if (name) {
					const cond = InitiativeTracker.getConditions().find(it => it.condName !== null && it.name.toLowerCase() === name.toLowerCase().trim());
					if (cond) {
						$cond.on("mouseover", (evt) => {
							if (evt.shiftKey) {
								evt.shiftKey = false;
								EntryRenderer.hover.mouseOver(
									evt,
									$cond[0],
									UrlUtil.PG_CONDITIONS_DISEASES,
									SRC_PHB,
									UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS_DISEASES]({name: cond.condName || cond.name, source: SRC_PHB})
								);
							}
						})
					}
				}
				render();
			}

			const $wrpConds = $(`<div class="split"/>`).appendTo($wrpLhs);
			const $conds = $(`<div class="dm-init-wrp-conds"/>`).appendTo($wrpConds);
			const $btnCond = $(`<div class="btn btn-warning btn-xs dm-init-row-btn dm-init-row-btn-flag" title="Add Condition"><span class="glyphicon glyphicon-flag"/></div>`)
				.appendTo($wrpConds)
				.on("click", () => {
					const $modal = $(`<div class="panel-addmenu-inner dropdown-menu" style="height: initial"/>`);
					const $wrpModal = $(`<div class="panel-addmenu">`).appendTo($(`body`)).click(() => $wrpModal.remove());
					$modal.appendTo($wrpModal);
					const $modalInner = $(`<div class="modal-inner"/>`).appendTo($modal).click((evt) => evt.stopPropagation());

					const $wrpRows = $(`<div class="dm-init-modal-wrp-rows"/>`).appendTo($modalInner);

					const conds = InitiativeTracker.getConditions();
					for (let i = 0; i < conds.length; i += 3) {
						const $row = $(`<div class="row mb-2"/>`).appendTo($wrpRows);
						const populateCol = (cond) => {
							const $col = $(`<div class="col-xs-4 text-align-center"/>`).appendTo($row);
							if (cond) {
								const $btnCond = $(`<button class="btn btn-default btn-xs btn-dm-init-cond" style="background-color: ${cond.color} !important;">${cond.name}</button>`).appendTo($col).click(() => {
									$iptName.val(cond.name);
									$iptColor.val(cond.color);
								});
							}
						};
						[conds[i], conds[i + 1], conds[i + 2]].forEach(populateCol);
					}

					$wrpRows.append(`<hr>`);

					$(`<div class="row mb-2">
						<div class="col-xs-5">Name (optional)</div>
						<div class="col-xs-2 text-align-center">Color</div>
						<div class="col-xs-5">Duration (optional)</div>
					</div>`).appendTo($wrpRows);
					const $controls = $(`<div class="row mb-2"/>`).appendTo($wrpRows);
					const [$wrpName, $wrpColor, $wrpTurns] = [...new Array(3)].map((it, i) => $(`<div class="col-xs-${i === 1 ? 2 : 5} text-align-center"/>`).appendTo($controls));
					const $iptName = $(`<input class="form-control">`).appendTo($wrpName);
					const $iptColor = $(`<input class="form-control" type="color" value="${MiscUtil.randomColor()}">`).appendTo($wrpColor);
					const $iptTurns = $(`<input class="form-control" type="number" step="1" min="1" placeholder="Unlimited">`).appendTo($wrpTurns);
					const $wrpAdd = $(`<div class="row">`).appendTo($wrpRows);
					const $wrpAddInner = $(`<div class="col-xs-12 text-align-center">`).appendTo($wrpAdd);
					const $btnAdd = $(`<button class="btn btn-primary">Set Condition</button>`)
						.click(() => {
							addCondition($iptName.val().trim(), $iptColor.val(), $iptTurns.val());
							$wrpModal.remove();
						})
						.appendTo($wrpAddInner);
				});

			const $wrpRhs = $(`<div class="dm-init-row-rhs"/>`).appendTo($wrpRow);
			let curHp = hp;

			const $iptHp = $(`<input class="form-control input-sm hp" placeholder="HP" value="${curHp}">`).appendTo($wrpRhs);
			const $iptScore = $(`<input class="form-control input-sm score dm-init-lockable" placeholder="#" type="number" value="${init}">`).on("change", () => doSort(NUM)).appendTo($wrpRhs);

			if (isMon && (curHp === "" || init === "")) {
				const doUpdate = () => {
					const m = EntryRenderer.hover._getFromCache(UrlUtil.PG_BESTIARY, source, hash);
					const rollName = `Initiative Tracker \u2014 ${m.name}`;

					// set or roll HP
					if (!rollHp && m.hp.average) {
						curHp = m.hp.average;
						$iptHp.val(curHp);
					} else if (rollHp && m.hp.formula) {
						curHp = EntryRenderer.dice.roll(m.hp.formula, {
							user: false,
							name: rollName,
							label: "HP"
						});
						$iptHp.val(curHp);
					}

					// roll initiative
					if (!init) {
						const init = EntryRenderer.dice.roll(`1d20${Parser.getAbilityModifier(m.dex)}`, {
							user: false,
							name: rollName,
							label: "Initiative"
						});

						$iptScore.val(init)
					}
				};

				const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY]({name: name, source: source});
				if (EntryRenderer.hover._isCached(UrlUtil.PG_BESTIARY, source, hash)) doUpdate();
				else {
					EntryRenderer.hover._doFillThenCall(UrlUtil.PG_BESTIARY, source, hash, () => {
						if (!curHp) doUpdate();
					});
				}
			}

			$iptHp.on("change", () => {
				const nxt = $iptHp.val().trim();
				if (nxt && /^[-+0-9]*$/.exec(curHp) && /^[-+0-9]*$/.exec(nxt)) {
					const m = /^[+-]\d+/.exec(nxt);
					const parts = nxt.split(/([+-]\d+)/).filter(it => it);
					let temp = 0;
					parts.forEach(p => temp += Number(p));
					if (m) {
						curHp = Number(curHp) + temp;
					} else if (/[-+]/.exec(nxt)) {
						curHp = temp;
					} else {
						curHp = Number(nxt);
					}
					$iptHp.val(curHp);
				}
			});

			const $btnDel = $(`<div class="btn btn-danger btn-xs dm-init-row-btn dm-init-lockable" title="Delete"><span class="glyphicon glyphicon-trash"/></div>`)
				.appendTo($wrpRhs)
				.on("click", () => {
					if (isLocked) return;
					if ($wrpRow.hasClass(`dm-init-row-active`) && $wrpEntries.find(`.dm-init-row`).length > 1) setNextActive();
					$wrpRow.remove();
				});

			conditions.forEach(c => addCondition(c.name, c.color, c.turns));
			$wrpRow.appendTo($wrpEntries);
		}

		function checkSetActive () {
			if ($wrpEntries.find(`.dm-init-row`).length && !$wrpEntries.find(`.dm-init-row-active`).length) $($wrpEntries.find(`.dm-init-row`).get(0)).addClass(`dm-init-row-active`);
		}

		function doSort (mode) {
			if (sort !== mode) return;
			const sorted = $wrpEntries.find(`.dm-init-row`).sort((a, b) => {
				let aVal = $(a).find(`input.${sort === ALPHA ? "name" : "score"}`).val();
				let bVal = $(b).find(`input.${sort === ALPHA ? "name" : "score"}`).val();
				if (sort === NUM) {
					aVal = Number(aVal);
					bVal = Number(bVal);
				}
				return dir === ASC ? SortUtil.ascSort(aVal, bVal) : SortUtil.ascSort(bVal, aVal);
			});
			$wrpEntries.append(sorted);
		}

		function flipDir () {
			dir = dir === ASC ? DESC : ASC;
		}

		doSort(sort);

		return $wrpTracker;
	}
}
InitiativeTracker._uiRollHp = false;

class NoteBox {
	static make$Notebox (content) {
		const $iptText = $(`<textarea class="panel-content-textarea" placeholder="Supports embedding (CTRL-click the text to activate the embed):\n • Clickable rollers,  [[1d20+2]]\n • Tags (as per the Demo page), {@creature goblin}">${content || ""}</textarea>`)
			.on("mousedown", (evt) => {
				if (evt.ctrlKey) {
					setTimeout(() => {
						const txt = $iptText[0];
						if (txt.selectionStart === txt.selectionEnd) {
							const doDesel = (pos = 0) => {
								setTimeout(() => txt.setSelectionRange(pos, pos), 1);
							};

							const pos = txt.selectionStart;
							const text = txt.value;
							const l = text.length;
							let beltStack = [];
							let braceStack = [];
							let belts = 0;
							let braces = 0;
							let beltsAtPos = null;
							let bracesAtPos = null;
							let lastBeltPos = null;
							let lastBracePos = null;
							outer:
							for (let i = 0; i < l; ++i) {
								const c = text[i];
								switch (c) {
									case "[":
										belts = Math.min(belts + 1, 2);
										if (belts === 2) beltStack = [];
										lastBeltPos = i;
										break;
									case "]":
										belts = Math.max(belts - 1, 0);
										if (belts === 0 && i > pos) break outer;
										break;
									case "{":
										if (text[i + 1] === "@") {
											braces = 1;
											braceStack = [];
											lastBracePos = i;
										}
										break;
									case "}":
										braces = 0;
										if (i > pos) break outer;
										break;
									default:
										if (belts === 2) {
											beltStack.push(c);
										}
										if (braces) {
											braceStack.push(c);
										}
								}
								if (i === pos) {
									beltsAtPos = belts;
									bracesAtPos = braces;
								}
							}

							if (beltsAtPos === 2 && belts === 0) {
								const str = beltStack.join("");
								if (/^([1-9]\d*)?d([1-9]\d*)(\s?[+-]\s?\d+)?$/i.exec(str)) {
									EntryRenderer.dice.roll(str.replace(`[[`, "").replace(`]]`, ""), {
										user: false,
										name: "DM Screen"
									});
									doDesel(lastBeltPos);
								}
							} else if (bracesAtPos === 1 && braces === 0) {
								const str = braceStack.join("");
								const tag = str.split(" ")[0].replace(/^@/, "");
								if (EntryRenderer.HOVER_TAG_TO_PAGE[tag]) {
									const r = EntryRenderer.getDefaultRenderer().renderEntry(`{${str}`);
									evt.type = "mouseover";
									evt.shiftKey = true;
									$(r).trigger(evt);
								}
								doDesel(lastBracePos);
							}
						}
					}, 1); // defer slightly to allow text to be selected
				}
			});

		return $iptText;
	}
}

class UnitConverter {
	static make$Converter (board, state) {
		const units = [
			new UnitConverterUnit("Feet", "0.305", "Metres", "3.28"),
			new UnitConverterUnit("Miles", "1.61", "Kilometres", "0.620"),
			new UnitConverterUnit("Pounds", "0.454", "Kilograms", "2.20"),
			new UnitConverterUnit("Gallons", "3.79", "Litres", "0.264")
		];

		let ixConv = state.c || 0;
		let dirConv = state.d || 0;

		const $wrpConverter = $(`<div class="dm-unitconv split-column"/>`);

		const $tblConvert = $(`<table class="table-striped"/>`).appendTo($wrpConverter);
		const $tbodyConvert = $(`<tbody/>`).appendTo($tblConvert);
		units.forEach((u, i) => {
			const $tr = $(`<tr class="row clickable"/>`).appendTo($tbodyConvert);
			const clickL = () => {
				ixConv = i;
				dirConv = 0;
				updateDisplay();
			};
			const clickR = () => {
				ixConv = i;
				dirConv = 1;
				updateDisplay();
			};
			$(`<td class="col-xs-3">${u.n1}</td>`).click(clickL).appendTo($tr);
			$(`<td class="col-xs-3 code">×${u.x1.padStart(5)}</td>`).click(clickL).appendTo($tr);
			$(`<td class="col-xs-3">${u.n2}</td>`).click(clickR).appendTo($tr);
			$(`<td class="col-xs-3 code">×${u.x2.padStart(5)}</td>`).click(clickR).appendTo($tr);
		});

		const $wrpIpt = $(`<div class="split wrp-ipt"/>`).appendTo($wrpConverter);

		const $wrpLeft = $(`<div class="split-column wrp-ipt-inner"/>`).appendTo($wrpIpt);
		const $lblLeft = $(`<span class="bold"/>`).appendTo($wrpLeft);
		const $iptLeft = $(`<textarea class="ipt form-control">${state.i || ""}</textarea>`).appendTo($wrpLeft);

		const $btnSwitch = $(`<div class="btn btn-primary btn-switch">⇆</div>`).click(() => {
			dirConv = Number(!dirConv);
			updateDisplay();
		}).appendTo($wrpIpt);

		const $wrpRight = $(`<div class="split-column wrp-ipt-inner"/>`).appendTo($wrpIpt);
		const $lblRight = $(`<span class="bold"/>`).appendTo($wrpRight);
		const $iptRight = $(`<textarea class="ipt form-control" disabled/>`).appendTo($wrpRight);

		const updateDisplay = () => {
			const it = units[ixConv];
			const [lblL, lblR] = dirConv === 0 ? [it.n1, it.n2] : [it.n2, it.n1];
			$lblLeft.text(lblL);
			$lblRight.text(lblR);
			handleInput();
		};

		const mMaths = /^([0-9.+\-*/ ()])*$/;
		const handleInput = () => {
			const showInvalid = () => {
				$iptLeft.addClass(`ipt-invalid`);
				$iptRight.val("");
			};
			const showValid = () => {
				$iptLeft.removeClass(`ipt-invalid`);
			};

			const val = $iptLeft.val();
			if (!val && !val.trim()) {
				showValid();
				$iptRight.val("");
			} else if (mMaths.exec(val)) {
				showValid();
				const it = units[ixConv];
				const mL = [Number(it.x1), Number(it.x2)][dirConv];
				try {
					/* eslint-disable */
					const total = eval(val);
					/* eslint-enable */
					$iptRight.val(total * mL);
				} catch (e) {
					$iptLeft.addClass(`ipt-invalid`);
					$iptRight.val("")
				}
			} else showInvalid();
		};

		DmScreenUtil.bindTypingEnd($iptLeft, handleInput);

		updateDisplay();

		$wrpConverter.data("getState", () => {
			return {
				c: ixConv,
				d: dirConv,
				i: $iptLeft.val()
			};
		});

		return $wrpConverter;
	}
}

class UnitConverterUnit {
	constructor (n1, x1, n2, x2) {
		this.n1 = n1;
		this.x1 = x1;
		this.n2 = n2;
		this.x2 = x2;
	}
}

class DmScreenUtil {
	static getSearchNoResults () {
		return `<div class="panel-tab-message"><i>No results.</i></div>`;
	}

	static getSearchLoading () {
		return `<div class="panel-tab-message"><i>\u2022\u2022\u2022</i></div>`;
	}

	static getSearchEnter () {
		return `<div class="panel-tab-message"><i>Enter a search.</i></div>`;
	}

	/**
	 * @param $srch input element
	 * @param opt should contain:
	 *  `search` -- function which runs search
	 *  `flags` -- object which contains:
	 *    `isWait` -- flag tracking "waiting for user to stop typing"
	 *    `doClickFirst` -- flag tracking "should first result get clicked"
	 *  `showWait` -- function which displays loading dots
	 */
	static bindAutoSearch ($srch, opt) {
		DmScreenUtil.bindTypingEnd(
			$srch,
			() => {
				opt.search();
			},
			(e) => {
				if (e.which === 13) {
					opt.flags.doClickFirst = true;
					opt.search();
				}
			},
			() => {
				if (opt.flags.isWait) {
					opt.flags.isWait = false;
					opt.showWait();
				}
			},
			() => {
				if ($srch.val() && $srch.val().trim().length) opt.search();
			}
		);
	}

	static bindTypingEnd ($ipt, fnKeyup, fnKeypress, fnKeydown, fnClick) {
		let typeTimer;
		$ipt.on("keyup", (e) => {
			clearTimeout(typeTimer);
			typeTimer = setTimeout(() => {
				fnKeyup(e);
			}, DmScreenUtil.TYPE_TIMEOUT_MS);
		});
		$ipt.on("keypress", (e) => {
			if (fnKeypress) fnKeypress(e);
		});
		$ipt.on("keydown", (e) => {
			if (fnKeydown) fnKeydown(e);
			clearTimeout(typeTimer);
		});
		$ipt.on("click", () => {
			if (fnClick) fnClick();
		});
	}
}
DmScreenUtil.TYPE_TIMEOUT_MS = 100; // auto-search after 100ms

window.addEventListener("load", () => {
	// expose it for dbg purposes
	window.DM_SCREEN = new Board();
	EntryRenderer.hover.bindDmScreen(window.DM_SCREEN);
	window.DM_SCREEN.initialise();
});
