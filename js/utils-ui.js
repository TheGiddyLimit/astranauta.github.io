class UiUtil {
	static getSearchNoResults () {
		return `<div class="ui-search__message"><i>No results.</i></div>`;
	}

	static getSearchLoading () {
		return `<div class="ui-search__message"><i>\u2022\u2022\u2022</i></div>`;
	}

	static getSearchEnter () {
		return `<div class="ui-search__message"><i>Enter a search.</i></div>`;
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
		UiUtil.bindTypingEnd(
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
			}, UiUtil.TYPE_TIMEOUT_MS);
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

	/**
	 * @param {string|Object} titleOrOpts Modal title, or an object of options, which are:
	 * @param {string} titleOrOpts.title Modal title.
	 * @param {boolean} titleOrOpts.fullHeight If the modal should take up (almost) the full height of the screen.
	 * @param {boolean} titleOrOpts.fullWidth If the modal should take up (almost) the full width of the screen.
	 * @param {boolean} titleOrOpts.noMinHeight If the modal should have no minimum height.
	 * @param {function} titleOrOpts.cbClose Callback run when the modal is closed.
	 * @param cbClose Callback run when the modal is closed.
	 * @returns JQuery Modal inner wrapper, to have content added as required.
	 */
	static getShow$Modal (titleOrOpts, cbClose) {
		const opts = typeof titleOrOpts === "string" ? {} : titleOrOpts;
		if (typeof titleOrOpts === "string") {
			opts.title = titleOrOpts;
			opts.cbClose = cbClose;
		} else if (cbClose) opts.cbClose = cbClose;

		// if the user closed the modal by clicking the "cancel" background, isDataEntered is false
		const handleCloseClick = async (isDataEntered, ...args) => {
			if (opts.cbClose) await opts.cbClose(isDataEntered, ...args);
			$modal.remove();
		};

		const $modal = $(`<div class="ui-modal__overlay">`);
		const $scroller = $(`<div class="ui-modal__scroller"/>`).data("close", (...args) => handleCloseClick(...args));
		const $modalInner = $(`<div class="ui-modal__inner ui-modal__inner--modal dropdown-menu${opts.fullWidth ? ` ui-modal__inner--large` : ""}${opts.fullHeight ? " full-height" : ""}"><h4>${opts.title}</h4><div data-r/></div>`)
			.swap($scroller)
			.appendTo($modal).click(e => e.stopPropagation());
		if (opts.noMinHeight) $modalInner.css("height", "initial");

		$modal.click(() => handleCloseClick(false));

		$(`body`).append($modal);
		return $scroller;
	}

	static addModal$Sep ($modalInner) {
		$modalInner.append(`<hr class="ui-modal__row-sep">`);
	}

	static _getAdd$Row ($modalInner, tag = "div") {
		return $(`<${tag} class="ui-modal__row"/>`).appendTo($modalInner);
	}

	static getAddModal$RowCb ($modalInner, labelText, objectWithProp, propName, helpText) {
		const $row = UiUtil._getAdd$Row($modalInner, "label").addClass(`ui-modal__row--cb`);
		if (helpText) $row.attr("title", helpText);
		$row.append(`<span>${labelText}</span>`);
		const $cb = $(`<input type="checkbox">`).appendTo($row)
			.prop("checked", objectWithProp[propName])
			.on("change", () => objectWithProp[propName] = $cb.prop("checked"));
		return $cb;
	}
}
UiUtil.SEARCH_RESULTS_CAP = 75;
UiUtil.TYPE_TIMEOUT_MS = 100; // auto-search after 100ms

class SearchUiUtil {
	static async pDoGlobalInit () {
		elasticlunr.clearStopWords();
		await EntryRenderer.item.populatePropertyAndTypeReference();
	}

	static _isNoHoverCat (cat) {
		return SearchUiUtil.NO_HOVER_CATEGORIES.has(cat);
	}

	static async pGetContentIndices (options) {
		options = options || {};

		const availContent = {};

		const data = await DataUtil.loadJSON("search/index.json");

		const additionalData = {};
		if (options.additionalIndices) {
			await Promise.all(options.additionalIndices.map(async add => additionalData[add] = await DataUtil.loadJSON(`search/index-${add}.json`)));
		}

		const alternateData = {};
		if (options.alternateIndices) {
			await Promise.all(options.alternateIndices.map(async alt => alternateData[alt] = await DataUtil.loadJSON(`search/index-alt-${alt}.json`)));
		}

		const fromDeepIndex = (d) => d.d; // flag for "deep indexed" content that refers to the same item

		availContent.ALL = elasticlunr(function () {
			this.addField("n");
			this.addField("s");
			this.setRef("id");
		});
		SearchUtil.removeStemmer(availContent.ALL);

		// Add main site index
		let ixMax = 0;

		const handleDataItem = (d, isAlternate) => {
			if (SearchUiUtil._isNoHoverCat(d.c) || fromDeepIndex(d)) return;
			d.cf = d.c === Parser.CAT_ID_CREATURE ? "Creature" : Parser.pageCategoryToFull(d.c);
			if (isAlternate) d.cf = `alt_${d.cf}`;
			if (!availContent[d.cf]) {
				availContent[d.cf] = elasticlunr(function () {
					this.addField("n");
					this.addField("s");
					this.setRef("id");
				});
				SearchUtil.removeStemmer(availContent[d.cf]);
			}
			if (!isAlternate) availContent.ALL.addDoc(d);
			availContent[d.cf].addDoc(d);
			ixMax = Math.max(ixMax, d.id);
		};

		data.forEach(d => handleDataItem(d));
		Object.values(additionalData).forEach(arr => arr.forEach(d => handleDataItem(d)));
		Object.values(alternateData).forEach(arr => arr.forEach(d => handleDataItem(d, true)));

		// Add homebrew
		Omnisearch.highestId = Math.max(ixMax, Omnisearch.highestId);

		const brewIndex = await BrewUtil.pGetSearchIndex();

		brewIndex.forEach(d => {
			if (SearchUiUtil._isNoHoverCat(d.c) || fromDeepIndex(d)) return;
			d.cf = Parser.pageCategoryToFull(d.c);
			d.cf = d.c === Parser.CAT_ID_CREATURE ? "Creature" : Parser.pageCategoryToFull(d.c);
			availContent.ALL.addDoc(d);
			availContent[d.cf].addDoc(d);
		});

		return availContent;
	}
}
SearchUiUtil.NO_HOVER_CATEGORIES = new Set([
	Parser.CAT_ID_ADVENTURE,
	Parser.CAT_ID_CLASS,
	Parser.CAT_ID_QUICKREF,
	Parser.CAT_ID_CLASS_FEATURE
]);

class InputUiUtil {
	/**
	 * @param options Options.
	 * @param options.min Minimum value.
	 * @param options.max Maximum value.
	 * @param options.int If the value returned should be an integer.
	 * @param options.title Prompt title.
	 * @param options.default Default value.
	 * @return {Promise<number>} A promise which resolves to the number if the user entered one, or null otherwise.
	 */
	static pGetUserNumber (options) {
		options = options || {};
		return new Promise(resolve => {
			const $iptNumber = $(`<input class="form-control mb-2 text-align-right" type="number" ${options.min ? `min="${options.min}"` : ""} ${options.max ? `max="${options.max}"` : ""} ${options.default != null ? `value="${options.default}"` : ""}>`)
				.keydown(evt => {
					// return key
					if (evt.which === 13) $modalInner.data("close")(true);
					evt.stopPropagation();
				});
			const $btnOk = $(`<button class="btn btn-default">Enter</button>`)
				.click(() => $modalInner.data("close")(true));
			const $modalInner = UiUtil.getShow$Modal({
				title: options.title || "Enter a Number",
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) resolve(null);
					const raw = $iptNumber.val();
					if (!raw.trim()) return null;
					let num = Number(raw) || 0;
					if (options.min) num = Math.max(options.min, num);
					if (options.max) num = Math.min(options.max, num);
					if (options.int) resolve(Math.round(num));
					else resolve(num);
				}
			});
			$iptNumber.appendTo($modalInner);
			$$`<div class="flex-vh-center">${$btnOk}</div>`.appendTo($modalInner);
			$iptNumber.focus();
			$iptNumber.select();
		});
	}

	/**
	 * @param options Options.
	 * @param options.values Array of enum values.
	 * @param options.placeholder Placeholder text.
	 * @param options.title Prompt title.
	 * @param options.default Default selected index.
	 * @return {Promise<number>} A promise which resolves to the index of the item the user selected, or null otherwise.
	 */
	static pGetUserEnum (options) {
		options = options || {};
		return new Promise(resolve => {
			const $selEnum = $(`<select class="form-control mb-2"><option value="-1" disabled>${options.placeholder || "Select..."}</option></select>`);

			options.values.forEach((v, i) => $(`<option value="${i}"/>`).text(v).appendTo($selEnum));
			if (options.default != null) $selEnum.val(options.default);
			else $selEnum[0].selectedIndex = 0;

			const $btnOk = $(`<button class="btn btn-default">Confirm</button>`)
				.click(() => $modalInner.data("close")(true));

			const $modalInner = UiUtil.getShow$Modal({
				title: options.title || "Select an Option",
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) resolve(null);
					const ix = Number($selEnum.val());
					resolve(~ix ? ix : null);
				}
			});
			$selEnum.appendTo($modalInner);
			$$`<div class="flex-vh-center">${$btnOk}</div>`.appendTo($modalInner);
			$selEnum.focus();
		});
	}

	/**
	 * @param options Options.
	 * @param options.title Prompt title.
	 * @param options.default Default value.
	 * @param options.autocomplete Array of autocomplete strings. REQUIRES INCLUSION OF THE TYPEAHEAD LIBRARY.
	 * @return {Promise<String>} A promise which resolves to the string if the user entered one, or null otherwise.
	 */
	static pGetUserString (options) {
		options = options || {};
		return new Promise(resolve => {
			const $iptStr = $(`<input class="form-control mb-2" ${options.default != null ? `value="${options.default}"` : ""}>`)
				.keydown(async evt => {
					if (options.autocomplete) {
						// prevent double-binding the return key if we have autocomplete enabled
						await MiscUtil.pDelay(17); // arbitrary delay to allow dropdown to render (~1000/60, i.e. 1 60 FPS frame)
						if ($modalInner.find(`.typeahead.dropdown-menu`).is(":visible")) return;
					}
					// return key
					if (evt.which === 13) $modalInner.data("close")(true);
					evt.stopPropagation();
				});
			if (options.autocomplete && options.autocomplete.length) $iptStr.typeahead({source: options.autocomplete});
			const $btnOk = $(`<button class="btn btn-default">Enter</button>`)
				.click(() => $modalInner.data("close")(true));
			const $modalInner = UiUtil.getShow$Modal({
				title: options.title || "Enter Text",
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) resolve(null);
					const raw = $iptStr.val();
					if (!raw.trim()) return null;
					else resolve(raw);
				}
			});
			$iptStr.appendTo($modalInner);
			$$`<div class="flex-vh-center">${$btnOk}</div>`.appendTo($modalInner);
			$iptStr.focus();
			$iptStr.select();
		});
	}
}
