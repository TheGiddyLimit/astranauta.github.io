"use strict";
// TODO have the roller section be placeable in the grid as a special tile
// TODO have custom tiles for e.g. plaintext notes?

const UP = "UP";
const RIGHT = "RIGHT";
const LEFT = "LEFT";
const DOWN = "DOWN";
const AX_X = "AXIS_X";
const AX_Y = "AXIS_Y";

const PANEL_TYP_EMPTY = 0;
const PANEL_TYP_STATS = 1;
const PANEL_TYP_TUBE = 10;
const PANEL_TYP_TWITCH = 11;
const PANEL_TYP_TWITCH_CHAT = 12;
const PANEL_TYP_IMAGE = 20;
const PANEL_TYP_GENERIC_EMBED = 90;

class Board {
	constructor () {
		this.panels = {}; // flat panel structure because I'm a fucking maniac
		this.$creen = $(`.dm-screen`);
		this.width = this.getInitialWidth();
		this.height = this.getInitialHeight();
		this.sideMenu = new SideMenu(this);
		this.menu = new AddMenu();
		this.storage = StorageUtil.getStorage();

		this.nextId = 1;
		this.hoveringPanel = null;
		this.availContent = {};
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
					} else p.destroy();
				} else if (x >= this.width) {
					if (p.canShrinkRight()) p.doShrinkRight();
					else p.destroy();
				} else if (y >= this.height) {
					if (p.canShrinkBottom()) p.doShrinkBottom();
					else p.destroy();
				}
			}
		}
	}

	doAdjust$creenCss () {
		// assumes 7px grid spacing
		this.$creen.css({
			gridGap: 7,
			width: `calc(100% - ${(this.width - 1) * 7}px)`,
			height: `calc(100% - ${85 + (this.height - 1) * 7}px)`, // 85 magical pixels
			gridAutoColumns: `${(1 / this.width) * 100}%`,
			gridAutoRows: `${(1 / this.height) * 100}%`
		});
	}

	getPanelDimensions () {
		const w = this.$creen.width();
		const h = this.$creen.height();
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
			gridRowEnd: String(this.height + 1),
		}).appendTo(this.$creen);
	}

	doHideLoading () {
		this.$creen.find(`.dm-screen-loading`).remove();
	}

	initialise () {
		this.doAdjust$creenCss();
		this.doShowLoading();
		const fnCallback = this.hasSavedState() ? () => {
			this.doLoadState();
			this.initUnloadHandler();
		} : () => {
			this.doCheckFillSpaces();
			this.initUnloadHandler();
		};
		this.doLoadIndex(fnCallback)
	}

	initUnloadHandler () {
		$(window).on("beforeunload", () => this.doSaveState());
	}

	doLoadIndex (fnCallback) {
		DataUtil.loadJSON("search/index.json").then((data) => {
			function hasBadCat (d) {
				return d.c === Parser.CAT_ID_ADVENTURE || d.c === Parser.CAT_ID_CLASS || d.c === Parser.CAT_ID_QUICKREF;
			}

			function fromDeepIndex (d) {
				return d.d; // flag for "deep indexed" content that refers to the same item
			}

			elasticlunr.clearStopWords();
			this.availContent.ALL = elasticlunr(function () {
				this.addField("n");
				this.addField("s");
				this.setRef("id");
			});
			// Add main site index
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
			});

			// Add homebrew
			BrewUtil.getSearchIndex().forEach(d => {
				if (hasBadCat(d) || fromDeepIndex(d)) return;
				d.cf = Parser.pageCategoryToFull(d.c);
				this.availContent.ALL.addDoc(d);
				this.availContent[d.cf].addDoc(d);
			});

			// add tabs
			const omniTab = new AddMenuSearchTab("Search", this.availContent);
			omniTab.setSpotlight(true);
			const embedTab = new AddMenuVideoTab("Embed");
			const imageTab = new AddMenuImageTab("Image");

			this.menu.addTab(omniTab).addTab(imageTab).addTab(embedTab);

			this.menu.render();

			this.sideMenu.render();

			fnCallback.bind(this)();
			this.doHideLoading();
		});
	}

	getPanel (x, y) {
		return Object.values(this.panels).find(p => {
			// x <= pX < x+w && y <= pY < y+h
			return (p.x <= x) && (x < (p.x + p.width)) && (p.y <= y) && (y < (p.y + p.height));
		});
	}

	getPanelPx (xPx, hPx) {
		const dim = this.getPanelDimensions();
		return this.getPanel(Math.floor(xPx / dim.pxWidth), Math.floor(hPx / dim.pxHeight));
	}

	setHoveringPanel (panel) {
		this.hoveringPanel = panel;
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

	hasSavedState () {
		return !!((this.storage.getItem(DMSCREEN_STORAGE) || "").trim());
	}

	doSaveState () {
		const toSave = {
			w: this.width,
			h: this.height,
			ps: Object.values(this.panels).map(p => p.getSaveableState())
		};
		this.storage.setItem(DMSCREEN_STORAGE, JSON.stringify(toSave));
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
				toLoad.ps.filter(Boolean).forEach(saved => {
					const p = Panel.fromSavedState(this, saved);
					this.panels[p.id] = p;
				});
				this.setDimensions(toLoad.w, toLoad.h);
			} catch (e) {
				// on error, purge all brew and reset hash
				purgeSaved();
				throw e;
			}
		}
	}

	doReset () {
		Object.values(this.panels).forEach(p => p.destroy());
		this.setDimensions(this.getInitialWidth(), this.getInitialHeight());
	}

	setHoveringButton(panel) {
		this.resetHoveringButton(panel);
		panel.$btnAddInner.addClass("faux-hover");
	}

	resetHoveringButton(panel) {
		Object.values(this.panels).forEach(p => {
			if (panel && panel.id === p.id) return;
			p.$btnAddInner.removeClass("faux-hover");
		})
	}
}

class SideMenu {
	constructor (board) {
		this.board = board;
		this.$mnu = $(`.dm-sidemenu`);

		this.$iptWidth = null;
		this.$iptHeight = null;
	}

	render () {
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

		this.$mnu.append(`<hr class="dm-sidemenu-row-divider">`);

		const $btnReset = $(`<div class="btn btn-danger">Reset Screen</div>`).appendTo(this.$mnu);
		$btnReset.on("click", () => {
			if (window.confirm("Are you sure?")) {
				this.board.doReset();
			}
		})
	}

	doUpdateDimensions () {
		this.$iptWidth.val(this.board.width);
		this.$iptHeight.val(this.board.height);
	}
}

class Panel {
	constructor (board, x, y, width = 1, height = 1) {
		this.id = board.getNextId();
		this.board = board;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.isDirty = true;
		this.isContentDirty = false;
		this.isLocked = false;
		this.type = 0;
		this.contentMeta = null; // info used during saved state re-load

		this.$btnAdd = null;
		this.$btnAddInner = null;
		this.$content = null;

		this.$pnl = null;
		this.$pnlWrpContent = null;
	}

	static fromSavedState (board, saved) {
		const p = new Panel(board, saved.x, saved.y, saved.w, saved.h);
		p.render();
		switch (saved.t) {
			case PANEL_TYP_EMPTY:
				return p;
			case PANEL_TYP_STATS: {
				const page = saved.c.p;
				const source = saved.c.s;
				const hash = saved.c.u;
				p.doPopulate_Stats(page, source, hash);
				return p;
			}
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

	static _get$eleLoading () {
		return $(`<div class="panel-content-wrapper-inner"><div class="panel-tab-message loading-spinner"><i>Loading...</i></div></div>`);
	}

	doPopulate_Empty () {
		this.reset$Content(true);
	}

	doPopulate_Loading () {
		this.set$Content(
			PANEL_TYP_EMPTY,
			null,
			Panel._get$eleLoading(),
			true
		);
	}

	doPopulate_Stats (page, source, hash) {
		const meta = {p: page, s: source, u: hash};
		this.set$Content(
			PANEL_TYP_STATS,
			meta,
			Panel._get$eleLoading(),
			true
		);
		EntryRenderer.hover._doFillThenCall(
			page,
			source,
			hash,
			() => {
				const fn = EntryRenderer.hover._pageToRenderFn(page);
				const it = EntryRenderer.hover._getFromCache(page, source, hash);
				this.set$Content(
					PANEL_TYP_STATS,
					meta,
					$(`<div class="panel-content-wrapper-inner"><table class="stats">${fn(it)}</table></div>`),
					true
				);
			}
		);
	}

	doPopulate_YouTube (url) {
		const meta = {u: url};
		this.set$Content(
			PANEL_TYP_TUBE,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen/></div>`),
			true
		);
	}

	doPopulate_Twitch (url) {
		const meta = {u: url};
		this.set$Content(
			PANEL_TYP_TWITCH,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}" frameborder="0"  scrolling="no" allowfullscreen/></div>`),
			true
		);
	}

	doPopulate_TwitchChat (url) {
		const meta = {u: url};
		this.set$Content(
			PANEL_TYP_TWITCH_CHAT,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}" frameborder="0"  scrolling="no"/></div>`),
			true
		);
	}

	doPopulate_GenericEmbed (url) {
		const meta = {u: url};
		this.set$Content(
			PANEL_TYP_GENERIC_EMBED,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}"/></div>`),
			true
		);
	}

	doPopulate_Image (url) {
		const meta = {u: url};
		this.set$Content(
			PANEL_TYP_IMAGE,
			meta,
			$(`<div class="panel-content-wrapper-inner"><div class="panel-content-wrapper-img"><img src="${url}"></div></div>`),
			true
		);
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	getPanelMeta () {
		return {
			type: this.type,
			contentMeta: this.contentMeta
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

	setDirty (dirty) {
		this.isDirty = dirty;
	}

	setContentDirty (dirty) {
		this.setDirty.bind(this)(dirty);
		this.isContentDirty = true;
	}

	doShowJoystick () {
		this.$pnl.find(`.panel-control`).show();
		this.$pnl.find(`.btn-panel-add`).hide();
		this.$pnl.addClass(`panel-mode-move`);
	}

	doHideJoystick () {
		this.$pnl.find(`.panel-control`).hide();
		this.$pnl.find(`.btn-panel-add`).show();
		this.$pnl.removeClass(`panel-mode-move`);
	}

	render () {
		function doApplyPosCss ($ele) {
			// indexed from 1 instead of zero...
			return $ele.css({
				gridColumnStart: String(this.x + 1),
				gridColumnEnd: String(this.x + 1 + this.width),

				gridRowStart: String(this.y + 1),
				gridRowEnd: String(this.y + 1 + this.height),
			});
		}

		function doInitialRender () {
			const $pnl = $(`<div data-panelId="${this.id}" class="dm-screen-panel" empty="true"/>`);
			this.$pnl = $pnl;
			const $ctrlBar = $(`<div class="panel-control-bar"/>`).appendTo($pnl);

			const $ctrlMove = $(`<div class="panel-control-icon glyphicon glyphicon-move" title="Move"/>`).appendTo($ctrlBar);
			$ctrlMove.on("click", () => {
				$pnl.find(`.panel-control`).toggle();
				$pnl.find(`.btn-panel-add`).toggle();
				$pnl.toggleClass(`panel-mode-move`);
			});
			const $ctrlEmpty = $(`<div class="panel-control-icon glyphicon glyphicon-remove" title="Empty"/>`).appendTo($ctrlBar);
			$ctrlEmpty.on("click", () => {
				this.reset$Content(true);
				$pnl.find(`.panel-control`).hide();
				$pnl.find(`.btn-panel-add`).show();
				$pnl.removeClass(`panel-mode-move`);
			});

			const joyMenu = new JoystickMenu(this);
			joyMenu.initialise();

			const $wrpContent = $(`<div class="panel-content-wrapper"/>`).appendTo($pnl);
			const $wrpBtnAdd = $(`<div class="panel-add"/>`).appendTo($wrpContent);
			const $btnAdd = $(`<span class="btn-panel-add glyphicon glyphicon-plus"/>`).on("click", () => {
				this.board.menu.doOpen();
				this.board.menu.setPanel(this);
				if (!this.board.menu.hasActiveTab()) this.board.menu.setFirstTabActive();
				else {
					const fn = this.board.menu.getActiveTab().doTransitionActive;
					if (fn) fn();
				}
			}).appendTo($wrpBtnAdd);
			this.$btnAdd = $wrpBtnAdd;
			this.$btnAddInner = $btnAdd;
			this.$pnlWrpContent = $wrpContent;

			if (this.$content) $wrpContent.append(this.$content);

			doApplyPosCss.bind(this)($pnl).appendTo(this.board.get$creen());
		}

		if (this.isDirty) {
			if (!this.$pnl) doInitialRender.bind(this)();
			else {
				doApplyPosCss.bind(this)(this.$pnl);

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

	getAddButtonPos() {
		const offset = this.$btnAddInner.offset();
		return {
			top: offset.top,
			left: offset.left,
			width: this.$btnAddInner.outerWidth(),
			height: this.$btnAddInner.outerHeight()
		};
	}

	reset$Content (doUpdateElements) {
		this.set$Content(PANEL_TYP_EMPTY, null, null, doUpdateElements);
	}

	set$Content (type, contentMeta, $content, doUpdateElements) {
		this.type = type;
		this.contentMeta = contentMeta;
		this.$content = $content;
		if (doUpdateElements) {
			this.$pnlWrpContent.children().detach();
			if ($content === null) this.$pnlWrpContent.append(this.$btnAdd);
			else this.$pnlWrpContent.append($content);
			this.$pnl.attr("empty", !$content);
		}
	}

	get$Content () {
		return this.$content
	}

	destroy () {
		if (this.$pnl) this.$pnl.remove();
		this.board.destroyPanel(this.id);
	}

	getSaveableState () {
		const out = {
			x: this.x,
			y: this.y,
			w: this.width,
			h: this.height,
			t: this.type
		};

		switch (this.type) {
			case PANEL_TYP_EMPTY:
				break;
			case PANEL_TYP_STATS:
				out.c = {
					p: this.contentMeta.p,
					s: this.contentMeta.s,
					u: this.contentMeta.u
				};
				break;
			case PANEL_TYP_TUBE:
			case PANEL_TYP_TWITCH:
			case PANEL_TYP_TWITCH_CHAT:
			case PANEL_TYP_GENERIC_EMBED:
			case PANEL_TYP_IMAGE:
				out.c = {
					u: this.contentMeta.u
				};
				break;
			default:
				throw new Error(`Unhandled panel type ${this.type}`);
		}

		return out;
	}
}

class JoystickMenu {
	constructor (panel) {
		this.panel = panel;
	}

	initialise () {
		this.panel.$pnl.on("mouseover", () => {
			this.panel.board.setHoveringPanel(this.panel);
		});

		const $ctrlMove = $(`<div class="panel-control panel-control-middle"/>`);
		const $ctrlXpandUp = $(`<div class="panel-control panel-control-top"/>`);
		const $ctrlXpandRight = $(`<div class="panel-control panel-control-right"/>`);
		const $ctrlXpandDown = $(`<div class="panel-control panel-control-bottom"/>`);
		const $ctrlXpandLeft = $(`<div class="panel-control panel-control-left"/>`);
		const $ctrlBg = $(`<div class="panel-control panel-control-bg"/>`);

		$ctrlMove.on("mousedown touchstart", (e) => {
			const $body = $(`body`);
			MiscUtil.clearSelection();
			$body.css("userSelect", "none");
			if (!this.panel.$content) return;

			const w = this.panel.$content.width();
			const h = this.panel.$content.height();
			const childH = this.panel.$content.children().first().height();
			const offset = this.panel.$content.offset();
			const offsetX = e.clientX - offset.left;
			const offsetY = h > childH ? childH / 2: (e.clientY - offset.top);

			$body.append(this.panel.$content);
			$(`.panel-control`).hide();
			this.panel.$content.css({
				width: w,
				height: h,
				position: "fixed",
				top: e.clientY,
				left: e.clientX,
				zIndex: 52,
				pointerEvents: "none",
				transform: "rotate(-4deg)",
				background: "none"
			});
			this.panel.board.get$creen().addClass("board-content-hovering");
			this.panel.$content.addClass("panel-content-hovering");
			this.panel.$pnl.removeClass("panel-mode-move");

			$(document).off("mousemove touchmove").off("mouseup touchend");

			$(document).on("mousemove touchmove", (e) => {
				this.panel.$content.css({
					top: e.clientY - offsetY,
					left: e.clientX - offsetX
				});
			});

			$(document).on("mouseup touchend", () => {
				$(document).off("mousemove touchmove").off("mouseup touchend");

				$body.css("userSelect", "");
				this.panel.$content.css({
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
				this.panel.board.get$creen().removeClass("board-content-hovering");
				this.panel.$content.removeClass("panel-content-hovering");

				if (!this.panel.board.hoveringPanel || this.panel.id === this.panel.board.hoveringPanel.id) {
					this.panel.$pnlWrpContent.append(this.panel.$content);
					this.panel.doShowJoystick();
				} else {
					const her = this.panel.board.hoveringPanel;
					if (her.getEmpty()) {
						her.set$Content(
							this.panel.type,
							this.panel.contentMeta,
							this.panel.$content,
							true
						);
						this.panel.reset$Content(true);
					} else {
						const herMeta = her.getPanelMeta();
						const $herContent = her.get$Content();
						her.set$Content(this.panel.type, this.panel.contentMeta, this.panel.$content, true);
						this.panel.set$Content(herMeta.type, herMeta.contentMeta, $herContent, true);
					}
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
							gridRowEnd: String(this.panel.y + 1 + this.panel.height),
						});
						break;
					case RIGHT:
						if (numPanelsCovered > (this.panel.board.width - this.panel.width) - this.panel.x) numPanelsCovered = (this.panel.board.width - this.panel.width) - this.panel.x;
						this.panel.$pnl.css({
							gridColumnEnd: String(this.panel.x + 1 + this.panel.width + numPanelsCovered),
						});
						break;
					case DOWN:
						if (numPanelsCovered > (this.panel.board.height - this.panel.height) - this.panel.y) numPanelsCovered = (this.panel.board.height - this.panel.height) - this.panel.y;
						this.panel.$pnl.css({
							gridRowEnd: String(this.panel.y + 1 + this.panel.height + numPanelsCovered),
						});
						break;
					case LEFT:
						if (numPanelsCovered > this.panel.x) numPanelsCovered = this.panel.x;
						this.panel.$pnl.css({
							gridColumnStart: String(this.panel.x + (1 - numPanelsCovered)),
							gridColumnEnd: String(this.panel.x + 1 + this.panel.width),
						});
						break;
				}
			});

			$(document).on("mouseup touchend", () => {
				$(document).off("mousemove touchmove").off("mouseup touchend");

				$(`body`).css("userSelect", "");
				this.panel.$pnl.find(`.panel-control`).show();
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
				const isGrowth = ~Math.sign(numPanelsCovered);
				if (isGrowth) {
					// TODO flare locked
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
						case UP:
							if (isGrowth) {
								this.panel.getTopNeighbours().forEach(p => {
									if (p.canShrinkBottom()) p.doShrinkBottom();
									else p.destroy();
								});
							}
							this.panel.height += Math.sign(numPanelsCovered);
							this.panel.y -= Math.sign(numPanelsCovered);
							break;
						case RIGHT:
							if (isGrowth) {
								this.panel.getRightNeighbours().forEach(p => {
									if (p.canShrinkLeft()) p.doShrinkLeft();
									else p.destroy();
								});
							}
							this.panel.width += Math.sign(numPanelsCovered);
							break;
						case DOWN:
							if (isGrowth) {
								this.panel.getBottomNeighbours().forEach(p => {
									if (p.canShrinkTop()) p.doShrinkTop();
									else p.destroy();
								});
							}
							this.panel.height += Math.sign(numPanelsCovered);
							break;
						case LEFT:
							if (isGrowth) {
								this.panel.getLeftNeighbours().forEach(p => {
									if (p.canShrinkRight()) p.doShrinkRight();
									else p.destroy();
								});
							}
							this.panel.width += Math.sign(numPanelsCovered);
							this.panel.x -= Math.sign(numPanelsCovered);
							break;
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
		return `tab-${type}-${this.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "_")}`;
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
	constructor (label) {
		super(label);
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
	constructor (label) {
		super(label);
		this.tabId = this.genTabId("image");
	}

	render () {
		if (!this.$tab) {
			const $tab = $(`<div class="panel-tab-list-wrapper underline-tabs" id="${this.tabId}"/>`);

			const $wrpImgur = $(`<div class="tab-body-row"/>`).appendTo($tab);
			$(`<span>Imgur (Anonymous Upload) <i class="text-muted">Accepts <a href="https://help.imgur.com/hc/articles/115000083326">formats imgur accepts</a>.</i></span>`).appendTo($wrpImgur);
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
							this.menu.pnl.doPopulate_Image(data.data.link);
						},
						error: (error) => {
							try {
								alert(`Failed to upload: ${JSON.parse(error.responseText).data.error}`);
							} catch (e) {
								alert("Failed to upload: Unknown error");
							}
							this.menu.pnl.doPopulate_Empty();
						}
					});
				};
				reader.onerror = () => {
					this.menu.pnl.doPopulate_Empty();
				};
				reader.fileName = input.files[0].name;
				reader.readAsDataURL(input.files[0]);
				this.menu.pnl.doPopulate_Loading();
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
	constructor (label, indexes) {
		super(label);
		this.tabId = this.genTabId("search");
		this.indexes = indexes;
		this.cat = "ALL";

		this.$selCat = null;
		this.$srch = null;
		this.$results = null;
		this.showMsgIpt = null;
	}

	render () {
		let doClickFirst = false;
		let isWait = false;

		this.showMsgIpt = () =>  {
			isWait = true;
			this.$results.empty().append(`<div class="panel-tab-message"><i>Enter a search.</i></div>`);
		};

		const showMsgDots = () => {
			this.$results.empty().append(`<div class="panel-tab-message"><i>\u2022\u2022\u2022</i></div>`);
		};

		const showNoResults = () => {
			isWait = true;
			this.$results.empty().append(`<div class="panel-tab-message"><i>No results.</i></div>`);
		};

		const doSearch = () => {
			const srch = this.$srch.val();
			const results = this.indexes[this.cat].search(srch, {
				fields: {
					n: {boost: 5, expand: true},
					s: {expand: true}
				},
				bool: "AND",
				expand: true
			});

			this.$results.empty();
			if (results.length) {
				const handleClick = (r) => {
					const page = UrlUtil.categoryToPage(r.doc.c);
					const source = r.doc.s;
					const hash = r.doc.u;

					this.menu.pnl.doPopulate_Stats(page, source, hash);
					this.menu.doClose();
				};

				if (doClickFirst) {
					handleClick(results[0]);
					doClickFirst = false;
					return;
				}

				const res = results.slice(0, 75); // hard cap at 75 results

				res.forEach(r => {
					$(`
						<div class="panel-tab-results-row">
							<span>${r.doc.n}</span>
							<span>${r.doc.s ? `<i title="${Parser.sourceJsonToFull(r.doc.s)}">${Parser.sourceJsonToAbv(r.doc.s)}${r.doc.p ? ` p${r.doc.p}` : ""}</i>` : ""}</span>
						</div>
					`).on("click", () => handleClick(r)).appendTo(this.$results);
				});

				if (results.length > res.length) {
					const diff = results.length - res.length;
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
			$selCat.on("change", () => this.cat = $selCat.val());

			const $srch = $(`<input class="panel-tab-search search form-control" autocomplete="off" placeholder="Search...">`).appendTo($wrpCtrls);
			const $results = $(`<div class="panel-tab-results"/>`).appendTo($tab);

			// auto-search after 100ms
			const TYPE_TIMEOUT_MS = 100;
			let typeTimer;
			$srch.on("keyup", () => {
				clearTimeout(typeTimer);
				typeTimer = setTimeout(() => {
					doSearch();
				}, TYPE_TIMEOUT_MS);
			});
			$srch.on("keydown", () => {
				if (isWait) {
					isWait = false;
					showMsgDots();
				}
				clearTimeout(typeTimer)
			});
			$srch.on("click", () => {
				if ($srch.val() && $srch.val().trim().length) doSearch();
			});
			$srch.on("keypress", (e) => {
				if (e.which === 13) {
					doClickFirst = true;
					doSearch();
				}
			});

			this.$tab = $tab;
			this.$selCat = $selCat;
			this.$srch = $srch;
			this.$results = $results;

			this.showMsgIpt();
		}
	}

	doTransitionActive () {
		this.$srch.val("").focus();
		if (this.showMsgIpt) this.showMsgIpt();
	}
}

window.addEventListener("load", () => {
	// expose it for dbg purposes
	window.DM_SCREEN = new Board();
	EntryRenderer.hover.bindDmScreen(window.DM_SCREEN);
	window.DM_SCREEN.initialise();
});
