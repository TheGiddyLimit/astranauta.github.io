"use strict";
// TODO have the roller section be placeable in the grid as a special tile
// TODO have custom tiles for e.g. plaintext notes?

const UP = "UP";
const RIGHT = "RIGHT";
const LEFT = "LEFT";
const DOWN = "DOWN";
const AX_X = "AXIS_X";
const AX_Y = "AXIS_Y";

class Board {
	constructor () {
		this.width = 5;
		this.height = 3;
		this.panels = {}; // flat panel structure because I'm a fucking maniac
		this.$creen = $(`.dm-screen`);

		this.nextId = 1;
		this.hoveringPanel = null;
	}

	doAdjust$CreenCss () {
		// assumes 7px grid spacing
		this.$creen.css({
			gridGap: 7,
			width: `calc(100% - ${(this.width - 1) * 7}px)`,
			height: `calc(100% - ${(this.height - 1) * 7}px)`
		});
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

	setWidth (width) {
		this.width = Math.min(width, 1);
		this.doCullPanels();
	}

	setHeight (height) {
		this.height = Math.min(height, 1);
		this.doCullPanels();
	}

	getPanelDimensions () {
		const w = this.$creen.width();
		const h = this.$creen.height();
		return {
			pxWidth: w / this.width,
			pxHeight: h / this.height
		};
	}

	/**
	 * Destroys any panels completely outside the viewing area, and shrinks any partially outside
	 */
	doCullPanels () {

	}

	initialise () {
		this.doAdjust$CreenCss();
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; ++y) {
				const pnl = new Panel(this, x, y);

				// TODO dummy content
				if (pnl.id === 8) {
					const fireball = data.spell.find(it => it.name === "Fireball");
					pnl.set$Content($(`<div class="panel-content-wrapper-inner"><table class="stats">${EntryRenderer.spell.getCompactRenderedString(fireball)}</table></div>`));
				} else {
					pnl.set$Content($(`<div class="dummy-content">${pnl.id}</div>`));
				}

				this.panels[pnl.id] = pnl;
			}
		}
		Object.values(this.panels).forEach(p => p.render());
	}

	getPanel (x, y) {
		return Object.values(this.panels).find(p => {
			// x <= pX < x+w && y <= pY < y+h
			return (p.x <= x) && (x < (p.x + p.width)) && (p.y <= y) && (y < (p.y + p.height));
		});
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
}

class Panel {
	constructor (board, x, y) {
		this.id = board.getNextId();
		this.board = board;
		this.x = x;
		this.y = y;
		this.width = 1;
		this.height = 1;
		this.isDirty = true;
		this.isContentDirty = false;
		this.isLocked = false;

		this.$content = null;

		this.$pnl = null;
		this.$pnlWrpContent = null;
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
			/*
			TODO controls... hm... let me see...
			- delete (really an "Empty") - X in the top-right of the title bar?
			- move it about by click-dragging?
			- resize it by click-dragging edge regions?

			LOCKS ARE BAD - THEY REQUIRE YOU TO REMEMBER TO LOCK/UNLOCK
			RADIAL MENU
			 */

			const $pnl = $(`<div class="dm-screen-panel"/>`);
			this.$pnl = $pnl;
			const $ctrlBar = $(`<div class="panel-control-bar"/>`).appendTo($pnl);

			const $ctrlEmpty = $(`<div class="delete-icon glyphicon glyphicon-remove"/>`).appendTo($ctrlBar);
			$ctrlEmpty.on("click", () => {
				this.set$Content(null, true);
			});

			const joyMenu = new JoystickMenu(this);
			joyMenu.initialise();

			const $wrpContent = $(`<div class="panel-content-wrapper"/>`).appendTo($pnl);
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

	set$Content ($content, doUpdateElements) {
		this.$content = $content;
		if (doUpdateElements) {
			if (!$content) this.$pnlWrpContent.empty();
			else this.$pnlWrpContent.append($content);
		}
	}

	get$Content () {
		return this.$content
	}

	destroy () {
		if (this.$pnl) this.$pnl.remove();
		this.board.destroyPanel(this.id);
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

		$ctrlMove.on("mousedown", (e) => {
			const $body = $(`body`);
			MiscUtil.clearSelection();
			$body.css("userSelect", "none");
			if (!this.panel.$content) return;

			const w = this.panel.$content.width();
			const h = this.panel.$content.height();
			const offset = this.panel.$content.offset();
			const offsetX = e.clientX - offset.left;
			const offsetY = e.clientY - offset.top;

			$body.append(this.panel.$content);
			$ctrlMove.hide();
			$ctrlXpandUp.hide();
			$ctrlXpandRight.hide();
			$ctrlXpandDown.hide();
			$ctrlXpandLeft.hide();
			this.panel.$content.css({
				width: w,
				height: h,
				position: "fixed",
				top: e.clientY,
				left: e.clientX,
				zIndex: 102,
				pointerEvents: "none",
				transform: "rotate(-4deg)",
				background: "none"
			});
			this.panel.$content.addClass("panel-content-hovering");

			$(document).off("mousemove").off("mouseup");

			$(document).on("mousemove", (e) => {
				this.panel.$content.css({
					top: e.clientY - offsetY,
					left: e.clientX - offsetX
				});
			});

			$(document).on("mouseup", () => {
				$(document).off("mousemove").off("mouseup");

				$ctrlMove.show();
				$ctrlXpandUp.show();
				$ctrlXpandRight.show();
				$ctrlXpandDown.show();
				$ctrlXpandLeft.show();
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
				this.panel.$content.removeClass("panel-content-hovering");

				if (!this.panel.board.hoveringPanel || this.panel.id === this.panel.board.hoveringPanel.id) {
					this.panel.$pnlWrpContent.append(this.panel.$content);
				} else {
					const her = this.panel.board.hoveringPanel;
					if (her.getEmpty()) {
						her.set$Content(this.panel.$content, true);
						this.panel.set$Content(null, true);
						this.panel.$content = null;
					} else {
						const $herContent = her.get$Content();
						const $myContent = this.panel.$content;
						her.set$Content($myContent, true);
						this.panel.set$Content($herContent, true);
					}
				}
				MiscUtil.clearSelection();
			});
		});

		function xpandHandler (dir) {
			MiscUtil.clearSelection();
			$(`body`).css("userSelect", "none");
			const axis = dir === RIGHT || dir === LEFT ? AX_X : AX_Y;

			const pos = this.panel.$pnl.offset();
			const dim = this.panel.board.getPanelDimensions();
			let numPanelsCovered = 0;
			const initGCS = this.panel.$pnl.css("gridColumnStart");
			const initGCE = this.panel.$pnl.css("gridColumnEnd");
			const initGRS = this.panel.$pnl.css("gridRowStart");
			const initGRE = this.panel.$pnl.css("gridRowEnd");

			this.panel.$pnl.css({
				zIndex: 102,
				boxShadow: "0 0 12px 0 #000000a0"
			});

			$(document).off("mousemove").off("mouseup");

			$(document).on("mousemove", (e) => {
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
				if (axis === AX_X && this.panel.width <= 1) numPanelsCovered = Math.max(0, numPanelsCovered);
				if (axis === AX_Y && this.panel.height <= 1) numPanelsCovered = Math.max(0, numPanelsCovered);

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

			$(document).on("mouseup", () => {
				$(document).off("mousemove").off("mouseup");

				$(`body`).css("userSelect", "");
				this.panel.$pnl.css({
					zIndex: "",
					boxShadow: "",
					gridColumnStart: initGCS,
					gridColumnEnd: initGCE,
					gridRowStart: initGRS,
					gridRowEnd: initGRE
				});

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

		$ctrlXpandUp.on("mousedown", xpandHandler.bind(this, UP));
		$ctrlXpandRight.on("mousedown", xpandHandler.bind(this, RIGHT));
		$ctrlXpandLeft.on("mousedown", xpandHandler.bind(this, LEFT));
		$ctrlXpandDown.on("mousedown", xpandHandler.bind(this, DOWN));

		this.panel.$pnl.append($ctrlMove).append($ctrlXpandUp).append($ctrlXpandRight).append($ctrlXpandDown).append($ctrlXpandLeft);
	}
}

// radial shit
class RadialMenu {
	constructor (x, y) {
		this.x = x;
		this.y = y;
		this.currentChild = null;
	}

	open () {

	}

	close () {
		if (this.currentChild) this.closeChild();
	}

	openChild (child) {
		this.currentChild = child();
		child.open();
	}

	closeChild () {
		if (this.currentChild) this.currentChild.close();
		this.currentChild = null;
	}
}

const data = {};
window.addEventListener("load", () => {
	// FIXME have a better method of doing this -- callbacks for content to individual panels?
	const FILES = [
		"backgrounds.json",
		"classes.json",
		"cultsboons.json",
		"deities.json",
		"feats.json",
		"invocations.json",
		"objects.json",
		"psionics.json",
		"races.json",
		"rewards.json",
		"trapshazards.json",
		"variantrules.json"
	];

	function mergeData (fromRec) {
		Object.keys(fromRec).forEach(k => data[k] ? data[k] = data[k].concat(fromRec[k]) : data[k] = fromRec[k])
	}

	DataUtil.loadJSON(`data/bestiary/index.json`)
		.then(index => Promise.all(Object.values(index).map(f => DataUtil.loadJSON(`data/bestiary/${f}`))))
		.then(monData => {
			monData.forEach(d => {
				mergeData(d);
			});
			Promise.resolve();
		}).then(() => DataUtil.loadJSON(`data/spells/index.json`))
		.then(index => Promise.all(Object.values(index).map(f => DataUtil.loadJSON(`data/spells/${f}`))))
		.then(spellData => {
			spellData.forEach(d => {
				mergeData(d);
			});
			Promise.resolve();
		}).then(() => {
		const promises = FILES.map(url => DataUtil.loadJSON(`data/${url}`));
		promises.push(EntryRenderer.item.promiseData());
		return Promise.all(promises).then(retData => {
			retData.forEach(d => {
				if (d.race) d.race = EntryRenderer.race.mergeSubraces(d.race);
				if (d.class) {
					d.class.forEach(c => c.subclasses.forEach(sc => sc.class = c.name));
					d.subclass = d.subclass || [];
					d.class.forEach(c => {
						d.subclass = d.subclass.concat(c.subclasses)
					});
				}
				mergeData(d);
			});


			const screen = new Board();
			screen.initialise();
		})
	});
});
