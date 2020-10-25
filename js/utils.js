// ************************************************************************* //
// Strict mode should not be used, as the roll20 script depends on this file //
// Do not use classes                                                        //
// ************************************************************************* //
if (typeof module !== "undefined") require("./parser.js");

// in deployment, `IS_DEPLOYED = "<version number>";` should be set below.
IS_DEPLOYED = undefined;
VERSION_NUMBER = /* 5ETOOLS_VERSION__OPEN */"1.113.11"/* 5ETOOLS_VERSION__CLOSE */;
DEPLOYED_STATIC_ROOT = ""; // "https://static.5etools.com/"; // FIXME re-enable this when we have a CDN again
// for the roll20 script to set
IS_VTT = false;

IMGUR_CLIENT_ID = `abdea4de492d3b0`;

// TODO refactor into VeCt
HASH_PART_SEP = ",";
HASH_LIST_SEP = "_";
HASH_SUB_LIST_SEP = "~";
HASH_SUB_KV_SEP = ":";
HASH_BLANK = "blankhash";
HASH_SUB_NONE = "null";

VeCt = {
	STR_NONE: "None",
	STR_SEE_CONSOLE: "See the console (CTRL+SHIFT+J) for details.",

	HASH_MON_SCALED: "scaled",

	FILTER_BOX_SUB_HASH_SEARCH_PREFIX: "fbsr",

	JSON_HOMEBREW_INDEX: `homebrew/index.json`,

	STORAGE_HOMEBREW: "HOMEBREW_STORAGE",
	STORAGE_HOMEBREW_META: "HOMEBREW_META_STORAGE",
	STORAGE_EXCLUDES: "EXCLUDES_STORAGE",
	STORAGE_DMSCREEN: "DMSCREEN_STORAGE",
	STORAGE_DMSCREEN_TEMP_SUBLIST: "DMSCREEN_TEMP_SUBLIST",
	STORAGE_ROLLER_MACRO: "ROLLER_MACRO_STORAGE",
	STORAGE_ENCOUNTER: "ENCOUNTER_STORAGE",
	STORAGE_POINTBUY: "POINTBUY_STORAGE",

	DUR_INLINE_NOTIFY: 500,

	PG_NONE: "NO_PAGE",

	SYM_UI_SKIP: Symbol("uiSkip"),

	LOC_ORIGIN_CANCER: "https://5e.tools",
};

// STRING ==============================================================================================================
String.prototype.uppercaseFirst = String.prototype.uppercaseFirst || function () {
	const str = this.toString();
	if (str.length === 0) return str;
	if (str.length === 1) return str.charAt(0).toUpperCase();
	return str.charAt(0).toUpperCase() + str.slice(1);
};

String.prototype.lowercaseFirst = String.prototype.lowercaseFirst || function () {
	const str = this.toString();
	if (str.length === 0) return str;
	if (str.length === 1) return str.charAt(0).toLowerCase();
	return str.charAt(0).toLowerCase() + str.slice(1);
};

String.prototype.toTitleCase = String.prototype.toTitleCase || function () {
	let str = this.replace(/([^\W_]+[^\s-/]*) */g, m0 => m0.charAt(0).toUpperCase() + m0.substr(1).toLowerCase());

	// Require space surrounded, as title-case requires a full word on either side
	StrUtil._TITLE_LOWER_WORDS_RE = StrUtil._TITLE_LOWER_WORDS_RE = StrUtil.TITLE_LOWER_WORDS.map(it => new RegExp(`\\s${it}\\s`, "gi"));
	StrUtil._TITLE_UPPER_WORDS_RE = StrUtil._TITLE_UPPER_WORDS_RE = StrUtil.TITLE_UPPER_WORDS.map(it => new RegExp(`\\b${it}\\b`, "g"));

	const len = StrUtil.TITLE_LOWER_WORDS.length;
	for (let i = 0; i < len; i++) {
		str = str.replace(
			StrUtil._TITLE_LOWER_WORDS_RE[i],
			txt => txt.toLowerCase(),
		);
	}

	const len1 = StrUtil.TITLE_UPPER_WORDS.length;
	for (let i = 0; i < len1; i++) {
		str = str.replace(
			StrUtil._TITLE_UPPER_WORDS_RE[i],
			StrUtil.TITLE_UPPER_WORDS[i].toUpperCase(),
		);
	}

	return str;
};

String.prototype.toSentenceCase = String.prototype.toSentenceCase || function () {
	const out = [];
	const re = /([^.!?]+)([.!?]\s*|$)/gi;
	let m;
	do {
		m = re.exec(this);
		if (m) {
			out.push(m[0].toLowerCase().uppercaseFirst());
		}
	} while (m);
	return out.join("");
};

String.prototype.toSpellCase = String.prototype.toSpellCase || function () {
	return this.toLowerCase().replace(/(^|of )(bigby|otiluke|mordenkainen|evard|hadar|agathys|abi-dalzim|aganazzar|drawmij|leomund|maximilian|melf|nystul|otto|rary|snilloc|tasha|tenser|jim)('s|$| )/g, (...m) => `${m[1]}${m[2].toTitleCase()}${m[3]}`);
};

String.prototype.toCamelCase = String.prototype.toCamelCase || function () {
	return this.split(" ").map((word, index) => {
		if (index === 0) return word.toLowerCase();
		return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
	}).join("");
};

String.prototype.escapeQuotes = String.prototype.escapeQuotes || function () {
	return this.replace(/'/g, `&apos;`).replace(/"/g, `&quot;`);
};

String.prototype.qq = String.prototype.qq || function () {
	return this.escapeQuotes();
};

String.prototype.unescapeQuotes = String.prototype.unescapeQuotes || function () {
	return this.replace(/&apos;/g, `'`).replace(/&quot;/g, `"`);
};

String.prototype.uq = String.prototype.uq || function () {
	return this.unescapeQuotes();
};

String.prototype.encodeApos = String.prototype.encodeApos || function () {
	return this.replace(/'/g, `%27`);
};

/**
 * Calculates the Damerau-Levenshtein distance between two strings.
 * https://gist.github.com/IceCreamYou/8396172
 */
String.prototype.distance = String.prototype.distance || function (target) {
	let source = this; let i; let j;
	if (!source) return target ? target.length : 0;
	else if (!target) return source.length;

	const m = source.length; const n = target.length; const INF = m + n; const score = new Array(m + 2); const sd = {};
	for (i = 0; i < m + 2; i++) score[i] = new Array(n + 2);
	score[0][0] = INF;
	for (i = 0; i <= m; i++) {
		score[i + 1][1] = i;
		score[i + 1][0] = INF;
		sd[source[i]] = 0;
	}
	for (j = 0; j <= n; j++) {
		score[1][j + 1] = j;
		score[0][j + 1] = INF;
		sd[target[j]] = 0;
	}

	for (i = 1; i <= m; i++) {
		let DB = 0;
		for (j = 1; j <= n; j++) {
			const i1 = sd[target[j - 1]]; const j1 = DB;
			if (source[i - 1] === target[j - 1]) {
				score[i + 1][j + 1] = score[i][j];
				DB = j;
			} else {
				score[i + 1][j + 1] = Math.min(score[i][j], Math.min(score[i + 1][j], score[i][j + 1])) + 1;
			}
			score[i + 1][j + 1] = Math.min(score[i + 1][j + 1], score[i1] ? score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1) : Infinity);
		}
		sd[source[i - 1]] = i;
	}
	return score[m + 1][n + 1];
};

String.prototype.isNumeric = String.prototype.isNumeric || function () {
	return !isNaN(parseFloat(this)) && isFinite(this);
};

String.prototype.last = String.prototype.last || function () {
	return this[this.length - 1];
};

String.prototype.escapeRegexp = String.prototype.escapeRegexp || function () {
	return this.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
};

String.prototype.toUrlified = String.prototype.toUrlified || function () {
	return encodeURIComponent(this.toLowerCase()).toLowerCase();
};

String.prototype.toChunks = String.prototype.toChunks || function (size) {
	// https://stackoverflow.com/a/29202760/5987433
	const numChunks = Math.ceil(this.length / size)
	const chunks = new Array(numChunks)
	for (let i = 0, o = 0; i < numChunks; ++i, o += size) chunks[i] = this.substr(o, size);
	return chunks
};

Array.prototype.joinConjunct = Array.prototype.joinConjunct || function (joiner, lastJoiner, nonOxford) {
	if (this.length === 0) return "";
	if (this.length === 1) return this[0];
	if (this.length === 2) return this.join(lastJoiner);
	else {
		let outStr = "";
		for (let i = 0; i < this.length; ++i) {
			outStr += this[i];
			if (i < this.length - 2) outStr += joiner;
			else if (i === this.length - 2) outStr += `${(!nonOxford && this.length > 2 ? joiner.trim() : "")}${lastJoiner}`;
		}
		return outStr;
	}
};

StrUtil = {
	COMMAS_NOT_IN_PARENTHESES_REGEX: /,\s?(?![^(]*\))/g,
	COMMA_SPACE_NOT_IN_PARENTHESES_REGEX: /, (?![^(]*\))/g,

	uppercaseFirst: function (string) {
		return string.uppercaseFirst();
	},
	// Certain minor words should be left lowercase unless they are the first or last words in the string
	TITLE_LOWER_WORDS: ["a", "an", "the", "and", "but", "or", "for", "nor", "as", "at", "by", "for", "from", "in", "into", "near", "of", "on", "onto", "to", "with"],
	// Certain words such as initialisms or acronyms should be left uppercase
	TITLE_UPPER_WORDS: ["Id", "Tv", "Dm", "Ok"],

	padNumber: (n, len, padder) => {
		return String(n).padStart(len, padder);
	},

	elipsisTruncate (str, atLeastPre = 5, atLeastSuff = 0, maxLen = 20) {
		if (maxLen >= str.length) return str;

		maxLen = Math.max(atLeastPre + atLeastSuff + 3, maxLen);
		let out = "";
		let remain = maxLen - (3 + atLeastPre + atLeastSuff);
		for (let i = 0; i < str.length - atLeastSuff; ++i) {
			const c = str[i];
			if (i < atLeastPre) out += c;
			else if ((remain--) > 0) out += c;
		}
		if (remain < 0) out += "...";
		out += str.substring(str.length - atLeastSuff, str.length);
		return out;
	},

	toTitleCase (str) {
		return str.toTitleCase();
	},
};

CleanUtil = {
	getCleanJson (data, minify = false) {
		let str = minify ? JSON.stringify(data) : `${JSON.stringify(data, null, "\t")}\n`;
		return CleanUtil.getCleanString(str);
	},

	/**
	 * @param str
	 * @param isJsonDump If the string is intended to be re-parsed by `JSON.parse`
	 */
	getCleanString (str, isJsonDump = true) {
		str = str
			.replace(CleanUtil.SHARED_REPLACEMENTS_REGEX, (match) => CleanUtil.SHARED_REPLACEMENTS[match])
			.replace(/\u00AD/g, "") // soft hyphens
			.replace(/\s*(\.\s*\.\s*\.)/g, "$1");

		if (isJsonDump) {
			return str
				.replace(CleanUtil.STR_REPLACEMENTS_REGEX, (match) => CleanUtil.STR_REPLACEMENTS[match])
				.replace(/\s*(\\u2014|\\u2013)\s*/g, "$1");
		} else {
			return str
				.replace(CleanUtil.JSON_REPLACEMENTS_REGEX, (match) => CleanUtil.JSON_REPLACEMENTS[match])
				.replace(/[ ]*([\u2014\u2013])[ ]*/g, "$1");
		}
	},
};
CleanUtil.SHARED_REPLACEMENTS = {
	"’": "'",
	"…": "...",
	" ": " ", // non-breaking space
	"ﬀ": "ff",
	"ﬃ": "ffi",
	"ﬄ": "ffl",
	"ﬁ": "fi",
	"ﬂ": "fl",
	"Ĳ": "IJ",
	"ĳ": "ij",
	"Ǉ": "LJ",
	"ǈ": "Lj",
	"ǉ": "lj",
	"Ǌ": "NJ",
	"ǋ": "Nj",
	"ǌ": "nj",
	"ﬅ": "ft",
};
CleanUtil.STR_REPLACEMENTS = {
	"—": "\\u2014",
	"–": "\\u2013",
	"−": "\\u2212",
	"“": `\\"`,
	"”": `\\"`,
};
CleanUtil.JSON_REPLACEMENTS = {
	"“": `"`,
	"”": `"`,
};
CleanUtil.SHARED_REPLACEMENTS_REGEX = new RegExp(Object.keys(CleanUtil.SHARED_REPLACEMENTS).join("|"), "g");
CleanUtil.STR_REPLACEMENTS_REGEX = new RegExp(Object.keys(CleanUtil.STR_REPLACEMENTS).join("|"), "g");
CleanUtil.JSON_REPLACEMENTS_REGEX = new RegExp(Object.keys(CleanUtil.JSON_REPLACEMENTS).join("|"), "g");

// SOURCES =============================================================================================================
SourceUtil = {
	_subclassReprintLookup: {},
	async pInitSubclassReprintLookup () {
		SourceUtil._subclassReprintLookup = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/generated/gendata-subclass-lookup.json`);
	},

	isSubclassReprinted (className, classSource, subclassShortName, subclassSource) {
		const fromLookup = MiscUtil.get(SourceUtil._subclassReprintLookup, classSource, className, subclassSource, subclassShortName);
		return fromLookup ? fromLookup.isReprinted : false;
	},

	isAdventure (source) {
		if (source instanceof FilterItem) source = source.item;
		return Parser.SOURCES_ADVENTURES.has(source);
	},

	isCoreOrSupplement (source) {
		if (source instanceof FilterItem) source = source.item;
		return Parser.SOURCES_CORE_SUPPLEMENTS.has(source);
	},

	isNonstandardSource (source) {
		return source != null && !BrewUtil.hasSourceJson(source) && SourceUtil._isNonstandardSourceWiz(source);
	},

	_isNonstandardSourceWiz (source) {
		return source.startsWith(SRC_UA_PREFIX) || source.startsWith(SRC_PS_PREFIX) || source.startsWith(SRC_AL_PREFIX) || Parser.SOURCES_NON_STANDARD_WOTC.has(source);
	},

	getFilterGroup (source) {
		if (source instanceof FilterItem) source = source.item;
		if (BrewUtil.hasSourceJson(source)) return 2;
		return Number(SourceUtil.isNonstandardSource(source));
	},

	getAdventureBookSourceHref (source, page) {
		if (!source) return null;
		source = source.toLowerCase();

		// TODO this could be made to work with homebrew
		let docPage;
		if (Parser.SOURCES_AVAILABLE_DOCS_BOOK[source]) docPage = UrlUtil.PG_BOOK;
		else if (Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE[source]) docPage = UrlUtil.PG_ADVENTURE;
		if (!docPage) return null;

		return `${docPage}#${[source, page ? `page:${page}` : null].filter(Boolean).join(HASH_PART_SEP)}`;
	},
};

// CURRENCY ============================================================================================================
CurrencyUtil = {
	/**
	 * Convert 10 gold -> 1 platinum, etc.
	 * @param obj Object of the form {cp: 123, sp: 456, ...} (values optional)
	 * @param [opts]
	 * @param [opts.currencyConversionId] Currency conversion table ID.
	 * @param [opts.currencyConversionTable] Currency conversion table.
	 */
	doSimplifyCoins (obj, opts) {
		opts = opts || {};

		const conversionTable = opts.currencyConversionTable || Parser.getCurrencyConversionTable(opts.currencyConversionId);
		if (!conversionTable.length) return obj;

		const normalized = conversionTable
			.map(it => {
				return {
					...it,
					normalizedMult: 1 / it.mult,
				}
			})
			.sort((a, b) => SortUtil.ascSort(a.normalizedMult, b.normalizedMult));

		// Simplify currencies
		for (let i = 0; i < normalized.length - 1; ++i) {
			const coinCur = normalized[i].coin;
			const coinNxt = normalized[i + 1].coin;
			const coinRatio = normalized[i + 1].normalizedMult / normalized[i].normalizedMult;

			if (obj[coinCur] && Math.abs(obj[coinCur]) >= coinRatio) {
				const nxtVal = obj[coinCur] >= 0 ? Math.floor(obj[coinCur] / coinRatio) : Math.ceil(obj[coinCur] / coinRatio);
				obj[coinCur] = obj[coinCur] % coinRatio;
				obj[coinNxt] = (obj[coinNxt] || 0) + nxtVal;
			}
		}

		normalized
			.filter(coinMeta => obj[coinMeta.coin] === 0 || obj[coinMeta.coin] == null)
			.forEach(coinMeta => {
				// First set the value to null, in case we're dealing with a class instance that has setters
				obj[coinMeta.coin] = null;
				delete obj[coinMeta.coin];
			});

		return obj;
	},

	/**
	 * Convert a collection of coins into an equivalent value in copper.
	 * @param obj Object of the form {cp: 123, sp: 456, ...} (values optional)
	 */
	getAsCopper (obj) {
		return Parser.FULL_CURRENCY_CONVERSION_TABLE
			.map(currencyMeta => (obj[currencyMeta.coin] || 0) * (1 / currencyMeta.mult))
			.reduce((a, b) => a + b, 0);
	},
};

// CONVENIENCE/ELEMENTS ================================================================================================
Math.seed = Math.seed || function (s) {
	return function () {
		s = Math.sin(s) * 10000;
		return s - Math.floor(s);
	};
};

JqueryUtil = {
	_isEnhancementsInit: false,
	initEnhancements () {
		if (JqueryUtil._isEnhancementsInit) return;
		JqueryUtil._isEnhancementsInit = true;

		JqueryUtil.addSelectors();

		/**
		 * Template strings which can contain jQuery objects.
		 * Usage: $$`<div>Press this button: ${$btn}</div>`
		 * @return JQuery
		 */
		window.$$ = function (parts, ...args) {
			if (parts instanceof jQuery) {
				return (...passed) => {
					const parts2 = [...passed[0]];
					const args2 = passed.slice(1);
					parts2[0] = `<div>${parts2[0]}`;
					parts2.last(`${parts2.last()}</div>`);

					const $temp = $$(parts2, ...args2);
					$temp.children().each((i, e) => $(e).appendTo(parts));
					return parts;
				};
			} else {
				const $eles = [];
				let ixArg = 0;

				const handleArg = (arg) => {
					if (arg instanceof $) {
						$eles.push(arg);
						return `<${arg.tag()} data-r="true"></${arg.tag()}>`;
					} else if (arg instanceof HTMLElement) {
						return handleArg($(arg));
					} else return arg
				};

				const raw = parts.reduce((html, p) => {
					const myIxArg = ixArg++;
					if (args[myIxArg] == null) return `${html}${p}`;
					if (args[myIxArg] instanceof Array) return `${html}${args[myIxArg].map(arg => handleArg(arg)).join("")}${p}`;
					else return `${html}${handleArg(args[myIxArg])}${p}`;
				});
				const $res = $(raw);

				if ($res.length === 1) {
					if ($res.attr("data-r") === "true") return $eles[0];
					else $res.find(`[data-r=true]`).replaceWith(i => $eles[i]);
				} else {
					// Handle case where user has passed in a bunch of elements with no outer wrapper
					const $tmp = $(`<div></div>`);
					$tmp.append($res);
					$tmp.find(`[data-r=true]`).replaceWith(i => $eles[i]);
					return $tmp.children();
				}

				return $res;
			}
		};

		$.fn.extend({
			// avoid setting input type to "search" as it visually offsets the contents of the input
			disableSpellcheck: function () { return this.attr("autocomplete", "new-password").attr("autocapitalize", "off").attr("spellcheck", "false"); },
			tag: function () { return this.prop("tagName").toLowerCase(); },
			title: function (...args) { return this.attr("title", ...args); },
			placeholder: function (...args) { return this.attr("placeholder", ...args); },
			disable: function () { return this.attr("disabled", true); },

			/**
			 * Quickly set the innerHTML of the innermost element, without parsing the whole thing with jQuery.
			 * Useful for populating e.g. a table row.
			 */
			fastSetHtml: function (html) {
				if (!this.length) return this;
				let tgt = this[0];
				while (tgt.children.length) {
					tgt = tgt.children[0];
				}
				tgt.innerHTML = html;
				return this;
			},

			blurOnEsc: function () {
				return this.keydown(evt => {
					if (evt.which === 27) this.blur(); // escape
				});
			},

			hideVe: function () { return this.addClass("ve-hidden"); },
			showVe: function () { return this.removeClass("ve-hidden"); },
			toggleVe: function (val) {
				if (val === undefined) return this.toggleClass("ve-hidden", !this.hasClass("ve-hidden"));
				else return this.toggleClass("ve-hidden", !val);
			},
		});

		$.event.special.destroyed = {
			remove: function (o) {
				if (o.handler) o.handler();
			},
		}
	},

	addSelectors () {
		// Add a selector to match exact text (case insensitive) to jQuery's arsenal
		//   Note that the search text should be `trim().toLowerCase()`'d before being passed in
		$.expr[":"].textEquals = (el, i, m) => $(el).text().toLowerCase().trim() === m[3].unescapeQuotes();

		// Add a selector to match contained text (case insensitive)
		$.expr[":"].containsInsensitive = (el, i, m) => {
			const searchText = m[3];
			const textNode = $(el).contents().filter((i, e) => e.nodeType === 3)[0];
			if (!textNode) return false;
			const match = textNode.nodeValue.toLowerCase().trim().match(`${searchText.toLowerCase().trim().escapeRegexp()}`);
			return match && match.length > 0;
		};
	},

	showCopiedEffect ($ele, text = "Copied!", bubble) {
		const top = $(window).scrollTop();
		const pos = $ele.offset();

		const animationOptions = {
			top: "-=8",
			opacity: 0,
		};
		if (bubble) {
			animationOptions.left = `${Math.random() > 0.5 ? "-" : "+"}=${~~(Math.random() * 17)}`;
		}
		const seed = Math.random();
		const duration = bubble ? 250 + seed * 200 : 250;
		const offsetY = bubble ? 16 : 0;

		const $dispCopied = $(`<div class="clp__disp-copied"></div>`);
		$dispCopied
			.html(text)
			.css({
				top: (pos.top - 24) + offsetY - top,
				left: pos.left + ($ele.width() / 2),
			})
			.appendTo(document.body)
			.animate(
				animationOptions,
				{
					duration,
					complete: () => $dispCopied.remove(),
					progress: (_, progress) => { // progress is 0..1
						if (bubble) {
							const diffProgress = 0.5 - progress;
							animationOptions.top = `${diffProgress > 0 ? "-" : "+"}=40`;
							$dispCopied.css("transform", `rotate(${seed > 0.5 ? "-" : ""}${seed * 500 * progress}deg)`);
						}
					},
				},
			);
	},

	_dropdownInit: false,
	bindDropdownButton ($ele) {
		if (!JqueryUtil._dropdownInit) {
			JqueryUtil._dropdownInit = true;
			document.addEventListener("click", () => [...document.querySelectorAll(`.open`)].filter(ele => !(ele.className || "").split(" ").includes(`dropdown--navbar`)).forEach(ele => ele.classList.remove("open")));
		}
		$ele.click(() => setTimeout(() => $ele.parent().addClass("open"), 1)); // defer to allow the above to complete
	},

	_ACTIVE_TOAST: [],
	/**
	 * @param {Object|string} options
	 * @param {(jQuery|string)} options.content Toast contents. Supports jQuery objects.
	 * @param {string} options.type Toast type. Can be any Bootstrap alert type ("success", "info", "warning", or "danger").
	 */
	doToast (options) {
		if (typeof window === "undefined") return;

		if (typeof options === "string") {
			options = {
				content: options,
				type: "info",
			};
		}
		options.type = options.type || "info";

		const doCleanup = ($toast) => {
			$toast.removeClass("toast--animate");
			setTimeout(() => $toast.remove(), 85);
			JqueryUtil._ACTIVE_TOAST.splice(JqueryUtil._ACTIVE_TOAST.indexOf($toast), 1);
		};

		const $btnToastDismiss = $(`<button class="btn toast__btn-close"><span class="glyphicon glyphicon-remove"></span></button>`)
			.click(() => doCleanup($toast));

		const $toast = $$`
		<div class="toast toast--type-${options.type}">
			<div class="toast__wrp-content">${options.content}</div>
			<div class="toast__wrp-control">${$btnToastDismiss}</div>
		</div>`.prependTo($(`body`)).data("pos", 0);

		setTimeout(() => $toast.addClass(`toast--animate`), 5);
		setTimeout(() => doCleanup($toast), 5000);

		if (JqueryUtil._ACTIVE_TOAST.length) {
			JqueryUtil._ACTIVE_TOAST.forEach($oldToast => {
				const pos = $oldToast.data("pos");
				$oldToast.data("pos", pos + 1);
				if (pos === 2) doCleanup($oldToast);
			});
		}

		JqueryUtil._ACTIVE_TOAST.push($toast);
	},
};

if (typeof window !== "undefined") window.addEventListener("load", JqueryUtil.initEnhancements);

ObjUtil = {
	mergeWith (source, target, fnMerge, options = {depth: 1}) {
		if (!source || !target || typeof fnMerge !== "function") throw new Error("Must include a source, target and a fnMerge to handle merging");

		const recursive = function (deepSource, deepTarget, depth = 1) {
			if (depth > options.depth || !deepSource || !deepTarget) return;
			for (let prop of Object.keys(deepSource)) {
				deepTarget[prop] = fnMerge(deepSource[prop], deepTarget[prop], source, target);
				recursive(source[prop], deepTarget[prop], depth + 1);
			}
		};
		recursive(source, target, 1);
	},

	async pForEachDeep (source, pCallback, options = {depth: Infinity, callEachLevel: false}) {
		const path = [];
		const pDiveDeep = async function (val, path, depth = 0) {
			if (options.callEachLevel || typeof val !== "object" || options.depth === depth) {
				await pCallback(val, path, depth);
			}
			if (options.depth !== depth && typeof val === "object") {
				for (const key of Object.keys(val)) {
					path.push(key);
					await pDiveDeep(val[key], path, depth + 1);
				}
			}
			path.pop();
		};
		await pDiveDeep(source, path);
	},
};

// TODO refactor other misc utils into this
MiscUtil = {
	COLOR_HEALTHY: "#00bb20",
	COLOR_HURT: "#c5ca00",
	COLOR_BLOODIED: "#f7a100",
	COLOR_DEFEATED: "#cc0000",

	copy (obj) {
		return JSON.parse(JSON.stringify(obj));
	},

	async pCopyTextToClipboard (text) {
		function doCompatibilityCopy () {
			const $iptTemp = $(`<textarea class="clp__wrp-temp"></textarea>`)
				.appendTo(document.body)
				.val(text)
				.select();
			document.execCommand("Copy");
			$iptTemp.remove();
		}

		if (navigator && navigator.permissions) {
			try {
				const access = await navigator.permissions.query({name: "clipboard-write"});
				if (access.state === "granted" || access.state === "prompt") {
					await navigator.clipboard.writeText(text);
				} else doCompatibilityCopy();
			} catch (e) { doCompatibilityCopy(); }
		} else doCompatibilityCopy();
	},

	checkProperty (object, ...path) {
		for (let i = 0; i < path.length; ++i) {
			object = object[path[i]];
			if (object == null) return false;
		}
		return true;
	},

	get (object, ...path) {
		if (object == null) return null;
		for (let i = 0; i < path.length; ++i) {
			object = object[path[i]];
			if (object == null) return object;
		}
		return object;
	},

	set (object, ...pathAndVal) {
		if (object == null) return null;

		const val = pathAndVal.pop();
		if (!pathAndVal.length) return null;

		const len = pathAndVal.length;
		for (let i = 0; i < len; ++i) {
			const pathPart = pathAndVal[i];
			if (i === len - 1) object[pathPart] = val;
			else object = (object[pathPart] = object[pathPart] || {});
		}

		return val;
	},

	getOrSet (object, ...pathAndVal) {
		const existing = MiscUtil.get(object, ...pathAndVal);
		return existing || MiscUtil.set(object, ...pathAndVal);
	},

	mix: (superclass) => new MiscUtil._MixinBuilder(superclass),
	_MixinBuilder: function (superclass) {
		this.superclass = superclass;

		this.with = function (...mixins) {
			return mixins.reduce((c, mixin) => mixin(c), this.superclass);
		};
	},

	clearSelection () {
		if (document.getSelection) {
			document.getSelection().removeAllRanges();
			document.getSelection().addRange(document.createRange());
		} else if (window.getSelection) {
			if (window.getSelection().removeAllRanges) {
				window.getSelection().removeAllRanges();
				window.getSelection().addRange(document.createRange());
			} else if (window.getSelection().empty) {
				window.getSelection().empty();
			}
		} else if (document.selection) {
			document.selection.empty();
		}
	},

	randomColor () {
		let r; let g; let b;
		const h = RollerUtil.randomise(30, 0) / 30;
		const i = ~~(h * 6);
		const f = h * 6 - i;
		const q = 1 - f;
		switch (i % 6) {
			case 0: r = 1; g = f; b = 0; break;
			case 1: r = q; g = 1; b = 0; break;
			case 2: r = 0; g = 1; b = f; break;
			case 3: r = 0; g = q; b = 1; break;
			case 4: r = f; g = 0; b = 1; break;
			case 5: r = 1; g = 0; b = q; break;
		}
		return `#${`00${(~~(r * 255)).toString(16)}`.slice(-2)}${`00${(~~(g * 255)).toString(16)}`.slice(-2)}${`00${(~~(b * 255)).toString(16)}`.slice(-2)}`;
	},

	/**
	 * @param hex Original hex color.
	 * @param [opts] Options object.
	 * @param [opts.bw] True if the color should be returnes as black/white depending on contrast ratio.
	 * @param [opts.dark] Color to return if a "dark" color would contrast best.
	 * @param [opts.light] Color to return if a "light" color would contrast best.
	 */
	invertColor (hex, opts) {
		opts = opts || {};

		hex = hex.slice(1); // remove #

		let r = parseInt(hex.slice(0, 2), 16);
		let g = parseInt(hex.slice(2, 4), 16);
		let b = parseInt(hex.slice(4, 6), 16);

		// http://stackoverflow.com/a/3943023/112731
		const isDark = (r * 0.299 + g * 0.587 + b * 0.114) > 186;
		if (opts.dark && opts.light) return isDark ? opts.dark : opts.light;
		else if (opts.bw) return isDark ? "#000000" : "#FFFFFF";

		r = (255 - r).toString(16); g = (255 - g).toString(16); b = (255 - b).toString(16);
		return `#${[r, g, b].map(it => it.padStart(2, "0")).join("")}`;
	},

	scrollPageTop () {
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	},

	expEval (str) {
		// eslint-disable-next-line no-new-func
		return new Function(`return ${str.replace(/[^-()\d/*+.]/g, "")}`)();
	},

	parseNumberRange (input, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
		function errInvalid (input) {
			throw new Error(`Could not parse range input "${input}"`);
		}

		function errOutOfRange () {
			throw new Error(`Number was out of range! Range was ${min}-${max} (inclusive).`);
		}

		function isOutOfRange (num) {
			return num < min || num > max;
		}

		function addToRangeVal (range, num) {
			range.add(num);
		}

		function addToRangeLoHi (range, lo, hi) {
			for (let i = lo; i <= hi; ++i) range.add(i);
		}

		while (true) {
			if (input && input.trim()) {
				const clean = input.replace(/\s*/g, "");
				if (/^((\d+-\d+|\d+),)*(\d+-\d+|\d+)$/.exec(clean)) {
					const parts = clean.split(",");
					const out = new Set();

					for (const part of parts) {
						if (part.includes("-")) {
							const spl = part.split("-");
							const numLo = Number(spl[0]);
							const numHi = Number(spl[1]);

							if (isNaN(numLo) || isNaN(numHi) || numLo === 0 || numHi === 0 || numLo > numHi) errInvalid();

							if (isOutOfRange(numLo) || isOutOfRange(numHi)) errOutOfRange();

							if (numLo === numHi) addToRangeVal(out, numLo);
							else addToRangeLoHi(out, numLo, numHi);
						} else {
							const num = Number(part);
							if (isNaN(num) || num === 0) errInvalid();
							else {
								if (isOutOfRange(num)) errOutOfRange();
								addToRangeVal(out, num);
							}
						}
					}

					return out;
				} else errInvalid();
			} else return null;
		}
	},

	MONTH_NAMES: [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December",
	],
	dateToStr (date, short) {
		const month = MiscUtil.MONTH_NAMES[date.getMonth()];
		return `${short ? month.substring(0, 3) : month} ${Parser.getOrdinalForm(date.getDate())}, ${date.getFullYear()}`;
	},

	findCommonPrefix (strArr) {
		let prefix = null;
		strArr.forEach(s => {
			if (prefix == null) {
				prefix = s;
			} else {
				const minLen = Math.min(s.length, prefix.length);
				for (let i = 0; i < minLen; ++i) {
					const cp = prefix[i];
					const cs = s[i];
					if (cp !== cs) {
						prefix = prefix.substring(0, i);
						break;
					}
				}
			}
		});
		return prefix;
	},

	/**
	 * @param fgHexTarget Target/resultant color for the foreground item
	 * @param fgOpacity Desired foreground transparency (0-1 inclusive)
	 * @param bgHex Background color
	 */
	calculateBlendedColor (fgHexTarget, fgOpacity, bgHex) {
		const fgDcTarget = CryptUtil.hex2Dec(fgHexTarget);
		const bgDc = CryptUtil.hex2Dec(bgHex);
		return ((fgDcTarget - ((1 - fgOpacity) * bgDc)) / fgOpacity).toString(16);
	},

	/**
	 * Borrowed from lodash.
	 *
	 * @param func The function to debounce.
	 * @param wait Minimum duration between calls.
	 * @param options Options object.
	 * @return {Function} The debounced function.
	 */
	debounce (func, wait, options) {
		let lastArgs; let lastThis; let maxWait; let result; let timerId; let lastCallTime; let lastInvokeTime = 0; let leading = false; let maxing = false; let trailing = true;

		wait = Number(wait) || 0;
		if (typeof options === "object") {
			leading = !!options.leading;
			maxing = "maxWait" in options;
			maxWait = maxing ? Math.max(Number(options.maxWait) || 0, wait) : maxWait;
			trailing = "trailing" in options ? !!options.trailing : trailing;
		}

		function invokeFunc (time) {
			let args = lastArgs; let thisArg = lastThis;

			lastArgs = lastThis = undefined;
			lastInvokeTime = time;
			result = func.apply(thisArg, args);
			return result;
		}

		function leadingEdge (time) {
			lastInvokeTime = time;
			timerId = setTimeout(timerExpired, wait);
			return leading ? invokeFunc(time) : result;
		}

		function remainingWait (time) {
			let timeSinceLastCall = time - lastCallTime; let timeSinceLastInvoke = time - lastInvokeTime; let result = wait - timeSinceLastCall;
			return maxing ? Math.min(result, maxWait - timeSinceLastInvoke) : result;
		}

		function shouldInvoke (time) {
			let timeSinceLastCall = time - lastCallTime; let timeSinceLastInvoke = time - lastInvokeTime;

			return (lastCallTime === undefined || (timeSinceLastCall >= wait) || (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
		}

		function timerExpired () {
			const time = Date.now();
			if (shouldInvoke(time)) {
				return trailingEdge(time);
			}
			// Restart the timer.
			timerId = setTimeout(timerExpired, remainingWait(time));
		}

		function trailingEdge (time) {
			timerId = undefined;

			if (trailing && lastArgs) return invokeFunc(time);
			lastArgs = lastThis = undefined;
			return result;
		}

		function cancel () {
			if (timerId !== undefined) clearTimeout(timerId);
			lastInvokeTime = 0;
			lastArgs = lastCallTime = lastThis = timerId = undefined;
		}

		function flush () {
			return timerId === undefined ? result : trailingEdge(Date.now());
		}

		function debounced () {
			let time = Date.now(); let isInvoking = shouldInvoke(time);
			lastArgs = arguments;
			lastThis = this;
			lastCallTime = time;

			if (isInvoking) {
				if (timerId === undefined) return leadingEdge(lastCallTime);
				if (maxing) {
					// Handle invocations in a tight loop.
					timerId = setTimeout(timerExpired, wait);
					return invokeFunc(lastCallTime);
				}
			}
			if (timerId === undefined) timerId = setTimeout(timerExpired, wait);
			return result;
		}

		debounced.cancel = cancel;
		debounced.flush = flush;
		return debounced;
	},

	// from lodash
	throttle (func, wait, options) {
		let leading = true; let trailing = true;

		if (typeof options === "object") {
			leading = "leading" in options ? !!options.leading : leading;
			trailing = "trailing" in options ? !!options.trailing : trailing;
		}

		return this.debounce(func, wait, {leading, maxWait: wait, trailing});
	},

	pDelay (msecs, resolveAs) {
		return new Promise(resolve => setTimeout(() => resolve(resolveAs), msecs));
	},

	GENERIC_WALKER_ENTRIES_KEY_BLACKLIST: new Set(["caption", "type", "colLabels", "name", "colStyles", "style", "shortName", "subclassShortName"]),

	/**
	 * @param [opts]
	 * @param [opts.keyBlacklist]
	 * @param [opts.isAllowDeleteObjects] If returning `undefined` from an object handler should be treated as a delete.
	 * @param [opts.isAllowDeleteArrays] (Unimplemented) // TODO
	 * @param [opts.isAllowDeleteBooleans] (Unimplemented) // TODO
	 * @param [opts.isAllowDeleteNumbers] (Unimplemented) // TODO
	 * @param [opts.isAllowDeleteStrings] (Unimplemented) // TODO
	 * @param [opts.isDepthFirst] If array/object recursion should occur before array/object primitive handling.
	 * @param [opts.isNoModification] If the walker should not attempt to modify the data.
	 */
	getWalker (opts) {
		opts = opts || {};
		const keyBlacklist = opts.keyBlacklist || new Set();

		function applyHandlers (handlers, obj, lastKey, stack) {
			if (!(handlers instanceof Array)) handlers = [handlers];
			handlers.forEach(h => {
				const out = h(obj, lastKey, stack);
				if (!opts.isNoModification) obj = out;
			});
			return obj;
		}

		function runHandlers (handlers, obj, lastKey, stack) {
			if (!(handlers instanceof Array)) handlers = [handlers];
			handlers.forEach(h => h(obj, lastKey, stack));
		}

		const fn = (obj, primitiveHandlers, lastKey, stack) => {
			if (obj == null) {
				if (primitiveHandlers.null) return applyHandlers(primitiveHandlers.null, obj, lastKey, stack);
				return obj;
			}

			const doObjectRecurse = () => {
				Object.keys(obj).forEach(k => {
					const v = obj[k];
					if (!keyBlacklist.has(k)) {
						const out = fn(v, primitiveHandlers, k, stack);
						if (!opts.isNoModification) obj[k] = out;
					}
				});
			};

			const to = typeof obj;
			switch (to) {
				case undefined:
					if (primitiveHandlers.preUndefined) runHandlers(primitiveHandlers.preUndefined, obj, lastKey, stack);
					if (primitiveHandlers.undefined) {
						const out = applyHandlers(primitiveHandlers.undefined, obj, lastKey, stack);
						if (!opts.isNoModification) obj = out;
					}
					if (primitiveHandlers.postUndefined) runHandlers(primitiveHandlers.postUndefined, obj, lastKey, stack);
					return obj;
				case "boolean":
					if (primitiveHandlers.preBoolean) runHandlers(primitiveHandlers.preBoolean, obj, lastKey, stack);
					if (primitiveHandlers.boolean) {
						const out = applyHandlers(primitiveHandlers.boolean, obj, lastKey, stack);
						if (!opts.isNoModification) obj = out;
					}
					if (primitiveHandlers.postBoolean) runHandlers(primitiveHandlers.postBoolean, obj, lastKey, stack);
					return obj;
				case "number":
					if (primitiveHandlers.preNumber) runHandlers(primitiveHandlers.preNumber, obj, lastKey, stack);
					if (primitiveHandlers.number) {
						const out = applyHandlers(primitiveHandlers.number, obj, lastKey, stack);
						if (!opts.isNoModification) obj = out;
					}
					if (primitiveHandlers.postNumber) runHandlers(primitiveHandlers.postNumber, obj, lastKey, stack);
					return obj;
				case "string":
					if (primitiveHandlers.preString) runHandlers(primitiveHandlers.preString, obj, lastKey, stack);
					if (primitiveHandlers.string) {
						const out = applyHandlers(primitiveHandlers.string, obj, lastKey, stack);
						if (!opts.isNoModification) obj = out;
					}
					if (primitiveHandlers.postString) runHandlers(primitiveHandlers.postString, obj, lastKey, stack);
					return obj;
				case "object": {
					if (obj instanceof Array) {
						if (primitiveHandlers.preArray) runHandlers(primitiveHandlers.preArray, obj, lastKey, stack);
						if (opts.isDepthFirst) {
							if (stack) stack.push(obj);
							const out = obj.map(it => fn(it, primitiveHandlers, lastKey, stack));
							if (!opts.isNoModification) obj = out;
							if (stack) stack.pop();

							if (primitiveHandlers.array) {
								const out = applyHandlers(primitiveHandlers.array, obj, lastKey, stack);
								if (!opts.isNoModification) obj = out;
							}
						} else {
							if (primitiveHandlers.array) {
								const out = applyHandlers(primitiveHandlers.array, obj, lastKey, stack);
								if (!opts.isNoModification) obj = out;
							}
							const out = obj.map(it => fn(it, primitiveHandlers, lastKey, stack));
							if (!opts.isNoModification) obj = out;
						}
						if (primitiveHandlers.postArray) runHandlers(primitiveHandlers.postArray, obj, lastKey, stack);
						return obj;
					} else {
						if (primitiveHandlers.preObject) runHandlers(primitiveHandlers.preObject, obj, lastKey, stack);
						if (opts.isDepthFirst) {
							if (stack) stack.push(obj);
							doObjectRecurse();
							if (stack) stack.pop();

							if (primitiveHandlers.object) {
								const out = applyHandlers(primitiveHandlers.object, obj, lastKey, stack);
								if (!opts.isNoModification) obj = out;
							}
							if (obj == null) {
								if (!opts.isAllowDeleteObjects) throw new Error(`Object handler(s) returned null!`);
							}
						} else {
							if (primitiveHandlers.object) {
								const out = applyHandlers(primitiveHandlers.object, obj, lastKey, stack);
								if (!opts.isNoModification) obj = out;
							}
							if (obj == null) {
								if (!opts.isAllowDeleteObjects) throw new Error(`Object handler(s) returned null!`);
							} else {
								doObjectRecurse();
							}
						}
						if (primitiveHandlers.postObject) runHandlers(primitiveHandlers.postObject, obj, lastKey, stack);
						return obj;
					}
				}
				default: throw new Error(`Unhandled type "${to}"`);
			}
		};

		return {walk: fn};
	},

	pDefer (fn) {
		return (async () => fn())();
	},
};

// EVENT HANDLERS ======================================================================================================
EventUtil = {
	_mouseX: 0,
	_mouseY: 0,

	init () {
		document.addEventListener("mousemove", evt => {
			EventUtil._mouseX = evt.clientX;
			EventUtil._mouseY = evt.clientY;
		});
	},

	getClientX (evt) { return evt.touches && evt.touches.length ? evt.touches[0].clientX : evt.clientX; },
	getClientY (evt) { return evt.touches && evt.touches.length ? evt.touches[0].clientY : evt.clientY; },

	isInInput (evt) {
		return evt.target.nodeName === "INPUT" || evt.target.nodeName === "TEXTAREA"
			|| evt.target.getAttribute("contenteditable") === "true";
	},

	noModifierKeys (evt) { return !evt.ctrlKey && !evt.altKey && !evt.metaKey; },
};

if (typeof window !== "undefined") window.addEventListener("load", EventUtil.init);

// CONTEXT MENUS =======================================================================================================
ContextUtil = {
	_isInit: false,
	_menus: [],

	_init () {
		if (ContextUtil._isInit) return;
		ContextUtil._isInit = true;

		$(document.body).click(() => ContextUtil._menus.forEach(menu => menu.close()));
	},

	getMenu (actions) {
		ContextUtil._init();

		const menu = new ContextUtil.Menu(actions);
		ContextUtil._menus.push(menu);
		return menu;
	},

	deleteMenu (menu) {
		menu.remove();
		const ix = ContextUtil._menus.findIndex(it => it === menu);
		if (~ix) ContextUtil._menus.splice(ix, 1);
	},

	pOpenMenu (evt, menu, userData) {
		evt.preventDefault();
		evt.stopPropagation();

		ContextUtil._init();

		// Close any other open menus
		ContextUtil._menus.filter(it => it !== menu).forEach(it => it.close());

		return menu.pOpen(evt, userData);
	},

	Menu: function (actions) {
		this._actions = actions;
		this._pResult = null;
		this._resolveResult = null;

		this._userData = null;

		const $elesAction = this._actions.map(it => {
			if (it == null) return $(`<div class="my-1 w-100 ui-ctx__divider"></div>`);

			const $row = $$`<div class="py-1 px-5 ui-ctx__row ${it.isDisabled ? "disabled" : ""} ${it.style || ""}">${it.text}</div>`
				.click(async evt => {
					if (it.isDisabled) return;

					evt.preventDefault();
					evt.stopPropagation();

					this.close();

					const result = await it.fnAction(evt, this._userData);
					if (this._resolveResult) this._resolveResult(result);
				});
			if (it.title) $row.title(it.title);

			return $row;
		});

		this._$ele = $$`<div class="flex-col ui-ctx__wrp py-2">${$elesAction}</div>`
			.hideVe()
			.appendTo(document.body);

		this.remove = function () { this._$ele.remove(); }

		this.width = function () { return this._$ele.width(); }
		this.height = function () { return this._$ele.height(); }

		this.pOpen = function (evt, userData) {
			if (this._resolveResult) this._resolveResult(null);
			this._pResult = new Promise(resolve => {
				this._resolveResult = resolve;
			});
			this._userData = userData;

			this._$ele
				.css({
					position: "absolute",
					left: this._getMenuPosition(evt, "x"),
					top: this._getMenuPosition(evt, "y"),
				})
				.showVe();

			return this._pResult;
		}
		this.close = function () { this._$ele.hideVe(); }

		this._getMenuPosition = function (evt, axis) {
			const {fnMenuSize, propMousePos, fnWindowSize, fnScrollDir} = axis === "x"
				? {fnMenuSize: "width", propMousePos: "clientX", fnWindowSize: "width", fnScrollDir: "scrollLeft"}
				: {fnMenuSize: "height", propMousePos: "clientY", fnWindowSize: "height", fnScrollDir: "scrollTop"};

			const posMouse = evt[propMousePos];
			const szWin = $(window)[fnWindowSize]();
			const posScroll = $(window)[fnScrollDir]();
			let position = posMouse + posScroll;
			const szMenu = this[fnMenuSize]();
			// opening menu would pass the side of the page
			if (posMouse + szMenu > szWin && szMenu < posMouse) position -= szMenu;
			return position;
		}
	},

	/**
	 * @param text
	 * @param fnAction Action, which is passed its triggering click event as an argument.
	 * @param [opts] Options object.
	 * @param [opts.isDisabled] If this action is disabled.
	 * @param [opts.title] Help (title) text.
	 * @param [opts.style] Additional CSS classes to add (e.g. `ctx-danger`).
	 */
	Action: function (text, fnAction, opts) {
		opts = opts || {};

		this.text = text;
		this.fnAction = fnAction;

		this.isDisabled = opts.isDisabled;
		this.title = opts.title;
		this.style = opts.style;
	},
};

// LIST AND SEARCH =====================================================================================================
SearchUtil = {
	removeStemmer (elasticSearch) {
		const stemmer = elasticlunr.Pipeline.getRegisteredFunction("stemmer");
		elasticSearch.pipeline.remove(stemmer);
	},
};

// ENCODING/DECODING ===================================================================================================
UrlUtil = {
	encodeForHash (toEncode) {
		if (toEncode instanceof Array) return toEncode.map(it => `${it}`.toUrlified()).join(HASH_LIST_SEP);
		else return `${toEncode}`.toUrlified();
	},

	autoEncodeHash (obj) {
		const curPage = UrlUtil.getCurrentPage();
		const encoder = UrlUtil.URL_TO_HASH_BUILDER[curPage];
		if (!encoder) throw new Error(`No encoder found for page ${curPage}`);
		return encoder(obj);
	},

	getCurrentPage () {
		if (typeof window === "undefined") return VeCt.PG_NONE;
		const pSplit = window.location.pathname.split("/");
		let out = pSplit[pSplit.length - 1];
		if (!out.toLowerCase().endsWith(".html")) out += ".html";
		return out;
	},

	/**
	 * All internal URL construction should pass through here, to ensure `static.5etools.com` is used when required.
	 *
	 * @param href the link
	 */
	link (href) {
		function addGetParam (curr) {
			if (href.includes("?")) return `${curr}&v=${VERSION_NUMBER}`;
			else return `${curr}?v=${VERSION_NUMBER}`;
		}

		if (!IS_VTT && IS_DEPLOYED) return addGetParam(`${DEPLOYED_STATIC_ROOT}${href}`);
		else if (IS_DEPLOYED) return addGetParam(href);
		return href;
	},

	unpackSubHash (subHash, unencode) {
		// format is "key:value~list~sep~with~tilde"
		if (subHash.includes(HASH_SUB_KV_SEP)) {
			const keyValArr = subHash.split(HASH_SUB_KV_SEP).map(s => s.trim());
			const out = {};
			let k = keyValArr[0].toLowerCase();
			if (unencode) k = decodeURIComponent(k);
			let v = keyValArr[1].toLowerCase();
			if (unencode) v = decodeURIComponent(v);
			out[k] = v.split(HASH_SUB_LIST_SEP).map(s => s.trim());
			if (out[k].length === 1 && out[k] === HASH_SUB_NONE) out[k] = [];
			return out;
		} else {
			throw new Error(`Badly formatted subhash ${subHash}`)
		}
	},

	/**
	 * @param key The subhash key.
	 * @param values The subhash values.
	 * @param [opts] Options object.
	 * @param [opts.isEncodeBoth] If both the key and values should be URl encoded.
	 * @param [opts.isEncodeKey] If the key should be URL encoded.
	 * @param [opts.isEncodeValues] If the values should be URL encoded.
	 * @returns {string}
	 */
	packSubHash (key, values, opts) {
		opts = opts || {};
		if (opts.isEncodeBoth || opts.isEncodeKey) key = key.toUrlified();
		if (opts.isEncodeBoth || opts.isEncodeValues) values = values.map(it => it.toUrlified());
		return `${key}${HASH_SUB_KV_SEP}${values.join(HASH_SUB_LIST_SEP)}`;
	},

	categoryToPage (category) { return UrlUtil.CAT_TO_PAGE[category]; },
	categoryToHoverPage (category) { return UrlUtil.CAT_TO_HOVER_PAGE[category] || UrlUtil.categoryToPage(category); },

	bindLinkExportButton (filterBox, $btn) {
		$btn = $btn || ListUtil.getOrTabRightButton(`btn-link-export`, `magnet`);
		$btn.addClass("btn-copy-effect")
			.off("click")
			.on("click", async evt => {
				let url = window.location.href;

				const parts = filterBox.getSubHashes({isAddSearchTerm: true});
				parts.unshift(url);

				if (evt.shiftKey && ListUtil.sublist) {
					const toEncode = JSON.stringify(ListUtil.getExportableSublist());
					const part2 = UrlUtil.packSubHash(ListUtil.SUB_HASH_PREFIX, [toEncode], {isEncodeBoth: true});
					parts.push(part2);
				}

				await MiscUtil.pCopyTextToClipboard(parts.join(HASH_PART_SEP));
				JqueryUtil.showCopiedEffect($btn);
			})
			.title("Get Link to Filters (SHIFT adds List)")
	},

	mini: {
		compress (primitive) {
			const type = typeof primitive;
			if (primitive == null) return `x`;
			switch (type) {
				case "boolean": return `b${Number(primitive)}`;
				case "number": return `n${primitive}`;
				case "string": return `s${primitive.toUrlified()}`;
				default: throw new Error(`Unhandled type "${type}"`);
			}
		},

		decompress (raw) {
			const [type, data] = [raw.slice(0, 1), raw.slice(1)];
			switch (type) {
				case "x": return null;
				case "b": return !!Number(data);
				case "n": return Number(data);
				case "s": return String(data);
				default: throw new Error(`Unhandled type "${type}"`);
			}
		},
	},

	class: {
		getIndexedEntries (cls) {
			const out = [];
			let scFeatureI = 0;
			(cls.classFeatures || []).forEach((lvlFeatureList, ixLvl) => {
				// class features
				lvlFeatureList
					// don't add "you gain a subclass feature" or ASI's
					.filter(feature => !feature.gainSubclassFeature
						&& feature.name !== "Ability Score Improvement"
						&& feature.name !== "Proficiency Versatility")
					.forEach((feature, ixFeature) => {
						const name = Renderer.findName(feature);
						if (!name) { // tolerate missing names in homebrew
							if (BrewUtil.hasSourceJson(cls.source)) return;
							else throw new Error("Class feature had no name!");
						}
						out.push({
							_type: "classFeature",
							source: cls.source.source || cls.source,
							name,
							hash: `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls)}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({feature: {ixLevel: ixLvl, ixFeature: ixFeature}})}`,
							entry: feature,
							level: ixLvl + 1,
						})
					});

				// subclass features
				const ixGainSubclassFeatures = lvlFeatureList.findIndex(feature => feature.gainSubclassFeature);
				if (~ixGainSubclassFeatures) {
					cls.subclasses.forEach(sc => {
						const features = ((sc.subclassFeatures || [])[scFeatureI] || []);
						sc.source = sc.source || cls.source; // default to class source if required
						const tempStack = [];
						features.forEach(feature => {
							const subclassFeatureHash = `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls)}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({subclass: sc, feature: {ixLevel: ixLvl, ixFeature: ixGainSubclassFeatures}})}`;
							const name = Renderer.findName(feature);
							if (!name) { // tolerate missing names in homebrew
								if (BrewUtil.hasSourceJson(sc.source)) return;
								else throw new Error("Subclass feature had no name!");
							}
							tempStack.push({
								_type: "subclassFeature",
								name,
								subclassName: sc.name,
								subclassShortName: sc.shortName,
								source: sc.source.source || sc.source,
								hash: subclassFeatureHash,
								entry: feature,
								level: ixLvl + 1,
							});

							if (feature.entries) {
								const namedFeatureParts = feature.entries.filter(it => it.name);
								namedFeatureParts.forEach(it => {
									const lvl = ixLvl + 1;
									if (tempStack.find(existing => it.name === existing.name && lvl === existing.level)) return;
									tempStack.push({
										_type: "subclassFeaturePart",
										name: it.name,
										subclassName: sc.name,
										subclassShortName: sc.shortName,
										source: sc.source.source || sc.source,
										hash: subclassFeatureHash,
										entry: feature,
										level: lvl,
									});
								});
							}
						});
						out.push(...tempStack);
					});
					scFeatureI++;
				} else if (ixGainSubclassFeatures.length > 1) {
					setTimeout(() => { throw new Error(`Multiple subclass features gained at level ${ixLvl + 1} for class "${cls.name}" from source "${cls.source}"!`) });
				}
			});
			return out;
		},
	},

	getStateKeySubclass (sc) { return Parser.stringToSlug(`sub ${sc.shortName || sc.name} ${Parser.sourceJsonToAbv(sc.source)}`); },

	/**
	 * @param opts Options object.
	 * @param [opts.subclass] Subclass (or object of the form `{shortName: "str", source: "str"}`)
	 * @param [opts.feature] Object of the form `{ixLevel: 0, ixFeature: 0}`
	 */
	getClassesPageStatePart (opts) {
		const stateParts = [
			opts.subclass ? `${UrlUtil.getStateKeySubclass(opts.subclass)}=${UrlUtil.mini.compress(true)}` : null,
			opts.feature ? `feature=${UrlUtil.mini.compress(`${opts.feature.ixLevel}-${opts.feature.ixFeature}`)}` : "",
		].filter(Boolean);
		return stateParts.length ? UrlUtil.packSubHash("state", stateParts) : "";
	},
};

UrlUtil.PG_BESTIARY = "bestiary.html";
UrlUtil.PG_SPELLS = "spells.html";
UrlUtil.PG_BACKGROUNDS = "backgrounds.html";
UrlUtil.PG_ITEMS = "items.html";
UrlUtil.PG_CLASSES = "classes.html";
UrlUtil.PG_CONDITIONS_DISEASES = "conditionsdiseases.html";
UrlUtil.PG_FEATS = "feats.html";
UrlUtil.PG_OPT_FEATURES = "optionalfeatures.html";
UrlUtil.PG_PSIONICS = "psionics.html";
UrlUtil.PG_RACES = "races.html";
UrlUtil.PG_REWARDS = "rewards.html";
UrlUtil.PG_VARIANTRULES = "variantrules.html";
UrlUtil.PG_ADVENTURE = "adventure.html";
UrlUtil.PG_ADVENTURES = "adventures.html";
UrlUtil.PG_BOOK = "book.html";
UrlUtil.PG_BOOKS = "books.html";
UrlUtil.PG_DEITIES = "deities.html";
UrlUtil.PG_CULTS_BOONS = "cultsboons.html";
UrlUtil.PG_OBJECTS = "objects.html";
UrlUtil.PG_TRAPS_HAZARDS = "trapshazards.html";
UrlUtil.PG_QUICKREF = "quickreference.html";
UrlUtil.PG_MANAGE_BREW = "managebrew.html";
UrlUtil.PG_MAKE_BREW = "makebrew.html";
UrlUtil.PG_DEMO_RENDER = "renderdemo.html";
UrlUtil.PG_TABLES = "tables.html";
UrlUtil.PG_VEHICLES = "vehicles.html";
UrlUtil.PG_CHARACTERS = "characters.html";
UrlUtil.PG_ACTIONS = "actions.html";
UrlUtil.PG_LANGUAGES = "languages.html";
UrlUtil.PG_STATGEN = "statgen.html";
UrlUtil.PG_LIFEGEN = "lifegen.html";
UrlUtil.PG_NAMES = "names.html";
UrlUtil.PG_DM_SCREEN = "dmscreen.html";
UrlUtil.PG_CR_CALCULATOR = "crcalculator.html";
UrlUtil.PG_ENCOUNTERGEN = "encountergen.html";
UrlUtil.PG_LOOTGEN = "encountergen.html";
UrlUtil.PG_TEXT_CONVERTER = "converter.html";
UrlUtil.PG_CHANGELOG = "changelog.html";

UrlUtil.URL_TO_HASH_BUILDER = {};
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS_DISEASES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OPT_FEATURES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_PSIONICS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_REWARDS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VARIANTRULES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ADVENTURE] = (it) => UrlUtil.encodeForHash(it.id);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BOOK] = (it) => UrlUtil.encodeForHash(it.id);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_DEITIES] = (it) => UrlUtil.encodeForHash([it.name, it.pantheon, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CULTS_BOONS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OBJECTS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TRAPS_HAZARDS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TABLES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VEHICLES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ACTIONS] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_LANGUAGES] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
// region Fake pages (props)
UrlUtil.URL_TO_HASH_BUILDER["subclass"] = it => {
	const hashParts = [
		UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({name: it.className, source: it.classSource}),
		UrlUtil.packSubHash("state", [`${UrlUtil.getStateKeySubclass(it)}=${UrlUtil.mini.compress(true)}`]),
	].filter(Boolean);
	return Hist.util.getCleanHash(hashParts.join(HASH_PART_SEP));
};
UrlUtil.URL_TO_HASH_BUILDER["classFeature"] = (it) => UrlUtil.encodeForHash([it.name, it.className, it.classSource, it.level, it.source]);
UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"] = (it) => UrlUtil.encodeForHash([it.name, it.className, it.classSource, it.subclassShortName, it.subclassSource, it.level, it.source]);
UrlUtil.URL_TO_HASH_BUILDER["legendaryGroup"] = (it) => UrlUtil.encodeForHash([it.name, it.source]);
UrlUtil.URL_TO_HASH_BUILDER["legendarygroup"] = UrlUtil.URL_TO_HASH_BUILDER["legendaryGroup"];
// endregion

UrlUtil.PG_TO_NAME = {};
UrlUtil.PG_TO_NAME[UrlUtil.PG_BESTIARY] = "Bestiary";
UrlUtil.PG_TO_NAME[UrlUtil.PG_SPELLS] = "Spells";
UrlUtil.PG_TO_NAME[UrlUtil.PG_BACKGROUNDS] = "Backgrounds";
UrlUtil.PG_TO_NAME[UrlUtil.PG_ITEMS] = "Items";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CLASSES] = "Classes";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CONDITIONS_DISEASES] = "Conditions & Diseases";
UrlUtil.PG_TO_NAME[UrlUtil.PG_FEATS] = "Feats";
UrlUtil.PG_TO_NAME[UrlUtil.PG_OPT_FEATURES] = "Other Options and Features";
UrlUtil.PG_TO_NAME[UrlUtil.PG_PSIONICS] = "Psionics";
UrlUtil.PG_TO_NAME[UrlUtil.PG_RACES] = "Races";
UrlUtil.PG_TO_NAME[UrlUtil.PG_REWARDS] = "Supernatural Gifts & Rewards";
UrlUtil.PG_TO_NAME[UrlUtil.PG_VARIANTRULES] = "Optional, Variant, and Expanded Rules";
UrlUtil.PG_TO_NAME[UrlUtil.PG_ADVENTURES] = "Adventures";
UrlUtil.PG_TO_NAME[UrlUtil.PG_BOOKS] = "Books";
UrlUtil.PG_TO_NAME[UrlUtil.PG_DEITIES] = "Deities";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CULTS_BOONS] = "Cults & Supernatural Boons";
UrlUtil.PG_TO_NAME[UrlUtil.PG_OBJECTS] = "Objects";
UrlUtil.PG_TO_NAME[UrlUtil.PG_TRAPS_HAZARDS] = "Traps & Hazards";
UrlUtil.PG_TO_NAME[UrlUtil.PG_QUICKREF] = "Quick Reference";
UrlUtil.PG_TO_NAME[UrlUtil.PG_MANAGE_BREW] = "Homebrew Manager";
UrlUtil.PG_TO_NAME[UrlUtil.PG_MAKE_BREW] = "Homebrew Builder";
UrlUtil.PG_TO_NAME[UrlUtil.PG_DEMO_RENDER] = "Renderer Demo";
UrlUtil.PG_TO_NAME[UrlUtil.PG_TABLES] = "Tables";
UrlUtil.PG_TO_NAME[UrlUtil.PG_VEHICLES] = "Vehicles";
// UrlUtil.PG_TO_NAME[UrlUtil.PG_CHARACTERS] = "";
UrlUtil.PG_TO_NAME[UrlUtil.PG_ACTIONS] = "Actions";
UrlUtil.PG_TO_NAME[UrlUtil.PG_LANGUAGES] = "Languages";
UrlUtil.PG_TO_NAME[UrlUtil.PG_STATGEN] = "Stat Generator";
UrlUtil.PG_TO_NAME[UrlUtil.PG_LIFEGEN] = "This Is Your Life";
UrlUtil.PG_TO_NAME[UrlUtil.PG_NAMES] = "Names";
UrlUtil.PG_TO_NAME[UrlUtil.PG_DM_SCREEN] = "DM Screen";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CR_CALCULATOR] = "CR Calculator";
UrlUtil.PG_TO_NAME[UrlUtil.PG_ENCOUNTERGEN] = "Encounter Generator";
UrlUtil.PG_TO_NAME[UrlUtil.PG_LOOTGEN] = "Loot Generator";
UrlUtil.PG_TO_NAME[UrlUtil.PG_TEXT_CONVERTER] = "Text Converter";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CHANGELOG] = "Changelog";

UrlUtil.CAT_TO_PAGE = {};
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CREATURE] = UrlUtil.PG_BESTIARY;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SPELL] = UrlUtil.PG_SPELLS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_BACKGROUND] = UrlUtil.PG_BACKGROUNDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ITEM] = UrlUtil.PG_ITEMS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CLASS] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CLASS_FEATURE] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SUBCLASS] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SUBCLASS_FEATURE] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CONDITION] = UrlUtil.PG_CONDITIONS_DISEASES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_FEAT] = UrlUtil.PG_FEATS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ELDRITCH_INVOCATION] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_METAMAGIC] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_MANEUVER_BATTLEMASTER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_MANEUVER_CAVALIER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ARCANE_SHOT] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_OPTIONAL_FEATURE_OTHER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_FIGHTING_STYLE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_PSIONIC] = UrlUtil.PG_PSIONICS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_RACE] = UrlUtil.PG_RACES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_OTHER_REWARD] = UrlUtil.PG_REWARDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_VARIANT_OPTIONAL_RULE] = UrlUtil.PG_VARIANTRULES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ADVENTURE] = UrlUtil.PG_ADVENTURE;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_DEITY] = UrlUtil.PG_DEITIES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_OBJECT] = UrlUtil.PG_OBJECTS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_TRAP] = UrlUtil.PG_TRAPS_HAZARDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_HAZARD] = UrlUtil.PG_TRAPS_HAZARDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_QUICKREF] = UrlUtil.PG_QUICKREF;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CULT] = UrlUtil.PG_CULTS_BOONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_BOON] = UrlUtil.PG_CULTS_BOONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_DISEASE] = UrlUtil.PG_CONDITIONS_DISEASES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_TABLE] = UrlUtil.PG_TABLES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_TABLE_GROUP] = UrlUtil.PG_TABLES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_VEHICLE] = UrlUtil.PG_VEHICLES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_PACT_BOON] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ELEMENTAL_DISCIPLINE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ARTIFICER_INFUSION] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SHIP_UPGRADE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_INFERNAL_WAR_MACHINE_UPGRADE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ONOMANCY_RESONANT] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_RUNE_KNIGHT_RUNE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ALCHEMICAL_FORMULA] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_MANEUVER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ACTION] = UrlUtil.PG_ACTIONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_LANGUAGE] = UrlUtil.PG_LANGUAGES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_BOOK] = UrlUtil.PG_BOOK;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_PAGE] = null;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_LEGENDARY_GROUP] = null;

UrlUtil.CAT_TO_HOVER_PAGE = {};
UrlUtil.CAT_TO_HOVER_PAGE[Parser.CAT_ID_CLASS_FEATURE] = "classfeature";
UrlUtil.CAT_TO_HOVER_PAGE[Parser.CAT_ID_SUBCLASS_FEATURE] = "subclassfeature";

if (!IS_DEPLOYED && !IS_VTT && typeof window !== "undefined") {
	// for local testing, hotkey to get a link to the current page on the main site
	window.addEventListener("keypress", (e) => {
		if (EventUtil.noModifierKeys(e) && typeof d20 === "undefined") {
			if (e.key === "#") {
				const spl = window.location.href.split("/");
				window.prompt("Copy to clipboard: Ctrl+C, Enter", `https://noads.5e.tools/${spl[spl.length - 1]}`);
			}
		}
	});
}

// SORTING =============================================================================================================
SortUtil = {
	ascSort: (a, b) => {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}

		return SortUtil._ascSort(a, b);
	},

	ascSortProp: (prop, a, b) => { return SortUtil.ascSort(a[prop], b[prop]); },

	ascSortLower: (a, b) => {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}

		a = a ? a.toLowerCase() : a;
		b = b ? b.toLowerCase() : b;

		return SortUtil._ascSort(a, b);
	},

	ascSortLowerProp: (prop, a, b) => { return SortUtil.ascSortLower(a[prop], b[prop]); },

	// warning: slow
	ascSortNumericalSuffix (a, b) {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}

		function popEndNumber (str) {
			const spl = str.split(" ");
			return spl.last().isNumeric() ? [spl.slice(0, -1).join(" "), Number(spl.last().replace(Parser._numberCleanRegexp, ""))] : [spl.join(" "), 0];
		}

		const [aStr, aNum] = popEndNumber(a.item || a);
		const [bStr, bNum] = popEndNumber(b.item || b);
		const initialSort = SortUtil.ascSort(aStr, bStr);
		if (initialSort) return initialSort;
		return SortUtil.ascSort(aNum, bNum);
	},

	_ascSort: (a, b) => {
		if (b === a) return 0;
		return b < a ? 1 : -1;
	},

	ascSortDate (a, b) {
		return b.getTime() - a.getTime();
	},

	ascSortDateString (a, b) {
		return SortUtil.ascSortDate(new Date(a || "1970-01-0"), new Date(b || "1970-01-0"));
	},

	compareListNames (a, b) { return SortUtil._ascSort(a.name.toLowerCase(), b.name.toLowerCase()); },

	listSort (a, b, opts) {
		opts = opts || {sortBy: "name"};
		if (opts.sortBy === "name") return SortUtil.compareListNames(a, b);
		else return SortUtil._compareByOrDefault_compareByOrDefault(a, b, opts.sortBy);
	},

	_listSort_compareBy (a, b, sortBy) {
		const aValue = typeof a.values[sortBy] === "string" ? a.values[sortBy].toLowerCase() : a.values[sortBy];
		const bValue = typeof b.values[sortBy] === "string" ? b.values[sortBy].toLowerCase() : b.values[sortBy];

		return SortUtil._ascSort(aValue, bValue);
	},

	_compareByOrDefault_compareByOrDefault (a, b, sortBy) {
		return SortUtil._listSort_compareBy(a, b, sortBy) || SortUtil.compareListNames(a, b);
	},

	/**
	 * "Special Equipment" first, then alphabetical
	 */
	_MON_TRAIT_ORDER: [
		"special equipment",
		"shapechanger",
	],
	monTraitSort: (a, b) => {
		if (a.sort != null && b.sort != null) return a.sort - b.sort;
		if (a.sort != null && b.sort == null) return -1;
		if (a.sort == null && b.sort != null) return 1;

		if (!a.name && !b.name) return 0;
		const aClean = a.name.toLowerCase().trim();
		const bClean = b.name.toLowerCase().trim();

		const isOnlyA = a.name.endsWith(" Only)");
		const isOnlyB = b.name.endsWith(" Only)");
		if (!isOnlyA && isOnlyB) return -1;
		if (isOnlyA && !isOnlyB) return 1;

		const ixA = SortUtil._MON_TRAIT_ORDER.indexOf(aClean);
		const ixB = SortUtil._MON_TRAIT_ORDER.indexOf(bClean);
		if (~ixA && ~ixB) return ixA - ixB;
		else if (~ixA) return -1;
		else if (~ixB) return 1;
		else return SortUtil.ascSort(aClean, bClean);
	},

	_alignFirst: ["L", "C"],
	_alignSecond: ["G", "E"],
	alignmentSort: (a, b) => {
		if (a === b) return 0;
		if (SortUtil._alignFirst.includes(a)) return -1;
		if (SortUtil._alignSecond.includes(a)) return 1;
		if (SortUtil._alignFirst.includes(b)) return 1;
		if (SortUtil._alignSecond.includes(b)) return -1;
		return 0;
	},

	ascSortCr (a, b) {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}
		// always put unknown values last
		if (a === "Unknown") a = "998";
		if (b === "Unknown") b = "998";
		if (a === "\u2014" || a == null) a = "999";
		if (b === "\u2014" || b == null) b = "999";
		return SortUtil.ascSort(Parser.crToNumber(a), Parser.crToNumber(b));
	},

	ascSortAtts (a, b) {
		const aSpecial = a === "special";
		const bSpecial = b === "special";
		return aSpecial && bSpecial ? 0 : aSpecial ? 1 : bSpecial ? -1 : Parser.ABIL_ABVS.indexOf(a) - Parser.ABIL_ABVS.indexOf(b);
	},

	initBtnSortHandlers ($wrpBtnsSort, list) {
		function addCaret ($btnSort, direction) {
			$wrpBtnsSort.find(".caret").removeClass("caret");
			$btnSort.find(".caret_wrp").addClass("caret").toggleClass("caret--reverse", direction === "asc");
		}

		const $btnSort = $wrpBtnsSort.find(`.sort[data-sort="${list.sortBy}"]`);
		addCaret($btnSort, list.sortDir);

		$wrpBtnsSort.find(".sort").each((i, e) => {
			const $btnSort = $(e);
			$btnSort.click(evt => {
				evt.stopPropagation();
				const direction = list.sortDir === "asc" ? "desc" : "asc";
				addCaret($btnSort, direction);
				list.sort($btnSort.data("sort"), direction);
			});
		});
	},
};

// JSON LOADING ========================================================================================================
DataUtil = {
	_loading: {},
	_loaded: {},
	_merging: {},
	_merged: {},

	async _pLoad (url) {
		if (DataUtil._loading[url]) {
			await DataUtil._loading[url];
			return DataUtil._loaded[url];
		}

		DataUtil._loading[url] = new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();
			request.open("GET", url, true);
			request.overrideMimeType("application/json");
			request.onload = function () {
				try {
					DataUtil._loaded[url] = JSON.parse(this.response);
					resolve();
				} catch (e) {
					reject(new Error(`Could not parse JSON from ${url}: ${e.message}`));
				}
			};
			request.onerror = (e) => reject(new Error(`Error during JSON request: ${e.target.status}`));
			request.send();
		});

		await DataUtil._loading[url];
		return DataUtil._loaded[url];
	},

	async loadJSON (url, ...otherData) {
		const procUrl = UrlUtil.link(url);

		let ident = procUrl;
		let data;
		try {
			data = await DataUtil._pLoad(procUrl);
		} catch (e) {
			setTimeout(() => { throw e; })
		}

		// Fallback to the un-processed URL
		if (!data) {
			ident = url;
			data = await DataUtil._pLoad(url);
		}

		await DataUtil.pDoMetaMerge(ident, data);

		return data;
	},

	async pDoMetaMerge (ident, data, options) {
		DataUtil._merging[ident] = DataUtil._merging[ident] || DataUtil._pDoMetaMerge(ident, data, options);
		await DataUtil._merging[ident];
		return DataUtil._merged[ident];
	},

	_pDoMetaMerge_handleCopyProp (prop, arr, entry, options) {
		if (entry._copy) {
			switch (prop) {
				case "monster": return DataUtil.monster.pMergeCopy(arr, entry, options);
				case "monsterFluff": return DataUtil.monsterFluff.pMergeCopy(arr, entry, options);
				case "spell": return DataUtil.spell.pMergeCopy(arr, entry, options);
				case "spellFluff": return DataUtil.spellFluff.pMergeCopy(arr, entry, options);
				case "item": return DataUtil.item.pMergeCopy(arr, entry, options);
				case "itemFluff": return DataUtil.itemFluff.pMergeCopy(arr, entry, options);
				case "background": return DataUtil.background.pMergeCopy(arr, entry, options);
				case "race": return DataUtil.race.pMergeCopy(arr, entry, options);
				case "raceFluff": return DataUtil.raceFluff.pMergeCopy(arr, entry, options);
				case "deity": return DataUtil.deity.pMergeCopy(arr, entry, options);
				default: throw new Error(`No dependency _copy merge strategy specified for property "${prop}"`);
			}
		}
	},

	async _pDoMetaMerge (ident, data, options) {
		if (data._meta) {
			if (data._meta.dependencies) {
				await Promise.all(Object.entries(data._meta.dependencies).map(async ([prop, sources]) => {
					if (!data[prop]) return; // if e.g. monster dependencies are declared, but there are no monsters to merge with, bail out

					const toLoads = await Promise.all(sources.map(async source => DataUtil.pGetLoadableByMeta(prop, source)));
					const dependencyData = await Promise.all(toLoads.map(toLoad => DataUtil.loadJSON(toLoad)));
					const flatDependencyData = dependencyData.map(dd => dd[prop]).flat();
					await Promise.all(data[prop].map(entry => DataUtil._pDoMetaMerge_handleCopyProp(prop, flatDependencyData, entry, options)));
				}));
				delete data._meta.dependencies;
			}

			if (data._meta.internalCopies) {
				Promise.all(data._meta.internalCopies.map(async prop => {
					if (!data[prop]) return;
					await Promise.all(data[prop].map(entry => DataUtil._pDoMetaMerge_handleCopyProp(prop, data[prop], entry, options)));
				}));
				delete data._meta.internalCopies;
			}
		}

		if (data._meta && data._meta.otherSources) {
			await Promise.all(Object.entries(data._meta.otherSources).map(async ([prop, sources]) => {
				const toLoads = await Promise.all(Object.entries(sources).map(async ([source, findWith]) => ({
					findWith,
					url: await DataUtil.pGetLoadableByMeta(prop, source),
				})));

				const additionalData = await Promise.all(toLoads.map(async ({findWith, url}) => ({findWith, sourceData: await DataUtil.loadJSON(url)})));

				additionalData.forEach(dataAndSource => {
					const findWith = dataAndSource.findWith;
					const ad = dataAndSource.sourceData;
					const toAppend = ad[prop].filter(it => it.otherSources && it.otherSources.find(os => os.source === findWith));
					if (toAppend.length) data[prop] = (data[prop] || []).concat(toAppend);
				});
			}));
			delete data._meta.otherSources;
		}
		DataUtil._merged[ident] = data;
	},

	userDownload (filename, data) {
		if (typeof data !== "string") data = JSON.stringify(data, null, "\t");
		const a = document.createElement("a");
		const t = new Blob([data], {type: "text/json"});
		a.href = URL.createObjectURL(t);
		a.download = `${filename}.json`;
		a.target = "_blank";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	},

	getCleanFilename (filename) {
		return filename.replace(/[^-_a-zA-Z0-9]/g, "_");
	},

	getCsv (headers, rows) {
		function escapeCsv (str) {
			return `"${str.replace(/"/g, `""`).replace(/ +/g, " ").replace(/\n\n+/gi, "\n\n")}"`;
		}

		function toCsv (row) {
			return row.map(str => escapeCsv(str)).join(",");
		}

		return `${toCsv(headers)}\n${rows.map(r => toCsv(r)).join("\n")}`;
	},

	userDownloadText (filename, string) {
		const $a = $(`<a href="data:text/plain;charset=utf-8,${encodeURIComponent(string)}" download="${filename}" style="display: none;">DL</a>`);
		$(`body`).append($a);
		$a[0].click();
		$a.remove();
	},

	pUserUpload () {
		return new Promise(resolve => {
			const $iptAdd = $(`<input type="file" accept=".json" style="position: fixed; top: -100px; left: -100px; display: none;">`).on("change", (evt) => {
				const input = evt.target;

				const reader = new FileReader();
				reader.onload = () => {
					const text = reader.result;
					const json = JSON.parse(text);
					resolve(json);
				};

				reader.readAsText(input.files[0]);
			}).appendTo($(`body`));
			$iptAdd.click();
		});
	},

	cleanJson (cpy) {
		cpy.name = cpy._displayName || cpy.name;
		delete cpy.uniqueId;
		DataUtil.__cleanJsonObject(cpy);
		return cpy;
	},

	__cleanJsonObject (obj) {
		if (obj == null) return obj;
		if (typeof obj === "object") {
			if (obj instanceof Array) {
				obj.forEach(it => DataUtil.__cleanJsonObject(it));
			} else {
				Object.entries(obj).forEach(([k, v]) => {
					if (k.startsWith("_") || k === "customHashId") delete obj[k];
					else DataUtil.__cleanJsonObject(v);
				});
			}
		}
	},

	async pGetLoadableByMeta (key, value) {
		// TODO(future) allow value to be e.g. a string (assumed to be an official data's source); an object e.g. `{type: external, url: <>}`,...
		// TODO(future) have this return the data, not a URL
		// TODO(future) handle homebrew dependencies/refactor "monster" and "spell" + have this be the general form.
		switch (key) {
			case "monster": {
				const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/index.json`);
				if (index[value]) return `${Renderer.get().baseUrl}data/bestiary/${index[value]}`;
				const brewIndex = await DataUtil.brew.pLoadSourceIndex();
				if (!brewIndex[value]) throw new Error(`Bestiary index did not contain source "${value}"`);
				const urlRoot = await StorageUtil.pGet(`HOMEBREW_CUSTOM_REPO_URL`);
				const brewUrl = DataUtil.brew.getFileUrl(brewIndex[value], urlRoot);
				await BrewUtil.pDoHandleBrewJson((await DataUtil.loadJSON(brewUrl)), UrlUtil.getCurrentPage());
				return brewUrl;
			}
			case "monsterFluff": {
				const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/fluff-index.json`);
				if (!index[value]) throw new Error(`Bestiary fluff index did not contain source "${value}"`);
				return `${Renderer.get().baseUrl}data/bestiary/${index[value]}`;
			}
			case "spell": {
				const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/spells/index.json`);
				if (index[value]) return `${Renderer.get().baseUrl}data/spells/${index[value]}`;
				const brewIndex = await DataUtil.brew.pLoadSourceIndex();
				if (!brewIndex[value]) throw new Error(`Spell index did not contain source "${value}"`);
				const urlRoot = await StorageUtil.pGet(`HOMEBREW_CUSTOM_REPO_URL`);
				const brewUrl = DataUtil.brew.getFileUrl(brewIndex[value], urlRoot);
				await BrewUtil.pDoHandleBrewJson((await DataUtil.loadJSON(brewUrl)), UrlUtil.getCurrentPage());
				return brewUrl;
			}
			case "spellFluff": {
				const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/spells/fluff-index.json`);
				if (!index[value]) throw new Error(`Spell fluff index did not contain source "${value}"`);
				return `${Renderer.get().baseUrl}data/spells/${index[value]}`;
			}
			// case "item":
			// case "itemFluff":
			case "background": return `${Renderer.get().baseUrl}data/backgrounds.json`;
			// case "race":
			case "raceFluff": return `${Renderer.get().baseUrl}data/fluff-races.json`;
			// case "deity":
			default: throw new Error(`Could not get loadable URL for \`${JSON.stringify({key, value})}\``);
		}
	},

	generic: {
		_walker_replaceTxt: null,

		/**
		 * @param uid
		 * @param tag
		 * @param [opts]
		 * @param [opts.isLower] If the returned values should be lowercase.
		 */
		unpackUid (uid, tag, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [name, source, displayText, ...others] = uid.split("|").map(it => it.trim());

			source = Parser.getTagSource(tag, source);
			if (opts.isLower) source = source.toLowerCase();

			return {
				name,
				source,
				displayText,
				others,
			};
		},

		async _pMergeCopy (impl, page, entryList, entry, options) {
			if (entry._copy) {
				const hash = UrlUtil.URL_TO_HASH_BUILDER[page](entry._copy);
				const it = impl._mergeCache[hash] || DataUtil.generic._pMergeCopy_search(impl, page, entryList, entry, options);
				if (!it) return;
				// Handle recursive copy
				if (it._copy) await DataUtil.generic._pMergeCopy(impl, page, entryList, it, options);
				return DataUtil.generic._pApplyCopy(impl, MiscUtil.copy(it), entry, options);
			}
		},

		_pMergeCopy_search (impl, page, entryList, entry, options) {
			const entryHash = UrlUtil.URL_TO_HASH_BUILDER[page](entry._copy);
			return entryList.find(it => {
				const hash = UrlUtil.URL_TO_HASH_BUILDER[page](it);
				impl._mergeCache[hash] = it;
				return hash === entryHash;
			});
		},

		async _pApplyCopy (impl, copyFrom, copyTo, options = {}) {
			if (options.doKeepCopy) copyTo.__copy = MiscUtil.copy(copyFrom);

			// convert everything to arrays
			function normaliseMods (obj) {
				Object.entries(obj._mod).forEach(([k, v]) => {
					if (!(v instanceof Array)) obj._mod[k] = [v];
				});
			}

			const copyMeta = copyTo._copy || {};

			if (copyMeta._mod) normaliseMods(copyMeta);

			// fetch and apply any external traits -- append them to existing copy mods where available
			let racials = null;
			if (copyMeta._trait) {
				const traitData = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/traits.json`);
				racials = traitData.trait.find(t => t.name.toLowerCase() === copyMeta._trait.name.toLowerCase() && t.source.toLowerCase() === copyMeta._trait.source.toLowerCase());
				if (!racials) throw new Error(`Could not find traits to apply with name "${copyMeta._trait.name}" and source "${copyMeta._trait.source}"`);
				racials = MiscUtil.copy(racials);

				if (racials.apply._mod) {
					normaliseMods(racials.apply);

					if (copyMeta._mod) {
						Object.entries(racials.apply._mod).forEach(([k, v]) => {
							if (copyMeta._mod[k]) copyMeta._mod[k] = copyMeta._mod[k].concat(v);
							else copyMeta._mod[k] = v;
						});
					} else copyMeta._mod = racials.apply._mod;
				}

				delete copyMeta._trait;
			}

			const copyToRootProps = new Set(Object.keys(copyTo));

			// copy over required values
			Object.keys(copyFrom).forEach(k => {
				if (copyTo[k] === null) return delete copyTo[k];
				if (copyTo[k] == null) {
					if (impl._MERGE_REQUIRES_PRESERVE[k]) {
						if (copyTo._copy._preserve && copyTo._copy._preserve[k]) copyTo[k] = copyFrom[k];
					} else copyTo[k] = copyFrom[k];
				}
			});

			// apply any root racial properties after doing base copy
			if (racials && racials.apply._root) {
				Object.entries(racials.apply._root)
					.filter(([k, v]) => !copyToRootProps.has(k)) // avoid overwriting any real root properties
					.forEach(([k, v]) => copyTo[k] = v);
			}

			// mod helpers /////////////////
			function doEnsureArray (obj, prop) {
				if (!(obj[prop] instanceof Array)) obj[prop] = [obj[prop]];
			}

			function doMod_appendStr (modInfo, prop) {
				if (copyTo[prop]) copyTo[prop] = `${copyTo[prop]}${modInfo.joiner || ""}${modInfo.str}`;
				else copyTo[prop] = modInfo.str;
			}

			function doMod_replaceTxt (modInfo, prop) {
				if (!copyTo[prop]) return;

				DataUtil.generic._walker_replaceTxt = DataUtil.generic._walker_replaceTxt || MiscUtil.getWalker();
				const re = new RegExp(modInfo.replace, `g${modInfo.flags || ""}`);
				const handlers = {
					// TODO(Future) may need to have this handle replaces inside _some_ tags
					string: (str) => {
						const split = Renderer.splitByTags(str);
						const len = split.length;
						for (let i = 0; i < len; ++i) {
							if (split[i].startsWith("{@")) continue;
							split[i] = split[i].replace(re, modInfo.with);
						}
						return split.join("");
					},
				};

				// Handle any pure strings, e.g. `"legendaryHeader"`
				copyTo[prop] = copyTo[prop].map(it => {
					if (typeof it !== "string") return it;
					return DataUtil.generic._walker_replaceTxt.walk(it, handlers);
				});

				copyTo[prop].forEach(it => {
					if (it.entries) it.entries = DataUtil.generic._walker_replaceTxt.walk(it.entries, handlers);
					if (it.headerEntries) it.headerEntries = DataUtil.generic._walker_replaceTxt.walk(it.headerEntries, handlers);
					if (it.footerEntries) it.footerEntries = DataUtil.generic._walker_replaceTxt.walk(it.footerEntries, handlers);
				});
			}

			function doMod_prependArr (modInfo, prop) {
				doEnsureArray(modInfo, "items");
				copyTo[prop] = copyTo[prop] ? modInfo.items.concat(copyTo[prop]) : modInfo.items
			}

			function doMod_appendArr (modInfo, prop) {
				doEnsureArray(modInfo, "items");
				copyTo[prop] = copyTo[prop] ? copyTo[prop].concat(modInfo.items) : modInfo.items
			}

			function doMod_appendIfNotExistsArr (modInfo, prop) {
				doEnsureArray(modInfo, "items");
				if (!copyTo[prop]) return copyTo[prop] = modInfo.items;
				copyTo[prop] = copyTo[prop].concat(modInfo.items.filter(it => !copyTo[prop].some(x => CollectionUtil.deepEquals(it, x))));
			}

			function doMod_replaceArr (modInfo, prop, isThrow = true) {
				doEnsureArray(modInfo, "items");

				if (!copyTo[prop]) {
					if (isThrow) throw new Error(`Could not find "${prop}" array`);
					return false;
				}

				let ixOld;
				if (modInfo.replace.regex) {
					const re = new RegExp(modInfo.replace.regex, modInfo.replace.flags || "");
					ixOld = copyTo[prop].findIndex(it => it.name ? re.test(it.name) : typeof it === "string" ? re.test(it) : false);
				} else if (modInfo.replace.index != null) {
					ixOld = modInfo.replace.index;
				} else {
					ixOld = copyTo[prop].findIndex(it => it.name ? it.name === modInfo.replace : it === modInfo.replace);
				}

				if (~ixOld) {
					copyTo[prop].splice(ixOld, 1, ...modInfo.items);
					return true;
				} else if (isThrow) throw new Error(`Could not find "${prop}" item with name "${modInfo.replace}" to replace`);
				return false;
			}

			function doMod_replaceOrAppendArr (modInfo, prop) {
				const didReplace = doMod_replaceArr(modInfo, prop, false);
				if (!didReplace) doMod_appendArr(modInfo, prop);
			}

			function doMod_insertArr (modInfo, prop) {
				doEnsureArray(modInfo, "items");
				if (!copyTo[prop]) throw new Error(`Could not find "${prop}" array`);
				copyTo[prop].splice(modInfo.index, 0, ...modInfo.items);
			}

			function doMod_removeArr (modInfo, prop) {
				if (modInfo.names) {
					doEnsureArray(modInfo, "names");
					modInfo.names.forEach(nameToRemove => {
						const ixOld = copyTo[prop].findIndex(it => it.name === nameToRemove);
						if (~ixOld) copyTo[prop].splice(ixOld, 1);
						else {
							if (!modInfo.force) throw new Error(`Could not find "${prop}" item with name "${nameToRemove}" to remove`);
						}
					});
				} else if (modInfo.items) {
					doEnsureArray(modInfo, "items");
					modInfo.items.forEach(itemToRemove => {
						const ixOld = copyTo[prop].findIndex(it => it === itemToRemove);
						if (~ixOld) copyTo[prop].splice(ixOld, 1);
						else throw new Error(`Could not find "${prop}" item "${itemToRemove}" to remove`);
					});
				} else throw new Error(`One of "names" or "items" must be provided!`)
			}

			function doMod_calculateProp (modInfo, prop) {
				copyTo[prop] = copyTo[prop] || {};
				const toExec = modInfo.formula.replace(/<\$([^$]+)\$>/g, (...m) => {
					switch (m[1]) {
						case "prof_bonus": return Parser.crToPb(copyTo.cr);
						case "dex_mod": return Parser.getAbilityModNumber(copyTo.dex);
						default: throw new Error(`Unknown variable "${m[1]}"`);
					}
				});
				// eslint-disable-next-line no-eval
				copyTo[prop][modInfo.prop] = eval(toExec);
			}

			function doMod_scalarAddProp (modInfo, prop) {
				function applyTo (k) {
					const out = Number(copyTo[prop][k]) + modInfo.scalar;
					const isString = typeof copyTo[prop][k] === "string";
					copyTo[prop][k] = isString ? `${out >= 0 ? "+" : ""}${out}` : out;
				}

				if (!copyTo[prop]) return;
				if (modInfo.prop === "*") Object.keys(copyTo[prop]).forEach(k => applyTo(k));
				else applyTo(modInfo.prop);
			}

			function doMod_scalarMultProp (modInfo, prop) {
				function applyTo (k) {
					let out = Number(copyTo[prop][k]) * modInfo.scalar;
					if (modInfo.floor) out = Math.floor(out);
					const isString = typeof copyTo[prop][k] === "string";
					copyTo[prop][k] = isString ? `${out >= 0 ? "+" : ""}${out}` : out;
				}

				if (!copyTo[prop]) return;
				if (modInfo.prop === "*") Object.keys(copyTo[prop]).forEach(k => applyTo(k));
				else applyTo(modInfo.prop);
			}

			function doMod_addSenses (modInfo) {
				doEnsureArray(modInfo, "senses");
				copyTo.senses = copyTo.senses || [];
				modInfo.senses.forEach(sense => {
					let found = false;
					for (let i = 0; i < copyTo.senses.length; ++i) {
						const m = new RegExp(`${sense.type} (\\d+)`, "i").exec(copyTo.senses[i]);
						if (m) {
							found = true;
							// if the creature already has a greater sense of this type, do nothing
							if (Number(m[1]) < sense.type) {
								copyTo.senses[i] = `${sense.type} ${sense.range} ft.`;
							}
							break;
						}
					}

					if (!found) copyTo.senses.push(`${sense.type} ${sense.range} ft.`);
				});
			}

			function doMod_addSkills (modInfo) {
				copyTo.skill = copyTo.skill || [];
				Object.entries(modInfo.skills).forEach(([skill, mode]) => {
					// mode: 1 = proficient; 2 = expert
					const total = mode * Parser.crToPb(copyTo.cr) + Parser.getAbilityModNumber(copyTo[Parser.skillToAbilityAbv(skill)]);
					const asText = total >= 0 ? `+${total}` : `-${total}`;
					if (copyTo.skill && copyTo.skill[skill]) {
						// update only if ours is larger (prevent reduction in skill score)
						if (Number(copyTo.skill[skill]) < total) copyTo.skill[skill] = asText;
					} else copyTo.skill[skill] = asText;
				});
			}

			function doMod_addSpells (modInfo) {
				if (!copyTo.spellcasting) throw new Error(`Creature did not have a spellcasting property!`);

				// TODO could accept a "position" or "name" parameter should spells need to be added to other spellcasting traits
				const spellcasting = copyTo.spellcasting[0];

				if (modInfo.spells) {
					const spells = spellcasting.spells;

					Object.keys(modInfo.spells).forEach(k => {
						if (!spells[k]) spells[k] = modInfo.spells[k];
						else {
							// merge the objects
							const spellCategoryNu = modInfo.spells[k];
							const spellCategoryOld = spells[k];
							Object.keys(spellCategoryNu).forEach(kk => {
								if (!spellCategoryOld[kk]) spellCategoryOld[kk] = spellCategoryNu[kk];
								else {
									if (typeof spellCategoryOld[kk] === "object") {
										if (spellCategoryOld[kk] instanceof Array) spellCategoryOld[kk] = spellCategoryOld[kk].concat(spellCategoryNu[kk]).sort(SortUtil.ascSortLower);
										else throw new Error(`Object at key ${kk} not an array!`);
									} else spellCategoryOld[kk] = spellCategoryNu[kk];
								}
							});
						}
					});
				}

				if (modInfo.will) {
					modInfo.will.forEach(sp => (modInfo.will = modInfo.will || []).push(sp));
				}

				if (modInfo.daily) {
					for (let i = 1; i <= 9; ++i) {
						const e = `${i}e`;

						spellcasting.daily = spellcasting.daily || {};

						if (modInfo.daily[i]) {
							modInfo.daily[i].forEach(sp => (spellcasting.daily[i] = spellcasting.daily[i] || []).push(sp));
						}

						if (modInfo.daily[e]) {
							modInfo.daily[e].forEach(sp => (spellcasting.daily[e] = spellcasting.daily[e] || []).push(sp));
						}
					}
				}
			}

			function doMod_replaceSpells (modInfo) {
				if (!copyTo.spellcasting) throw new Error(`Creature did not have a spellcasting property!`);

				// TODO could accept a "position" or "name" parameter should spells need to be added to other spellcasting traits
				const spellcasting = copyTo.spellcasting[0];

				const handleReplace = (curSpells, replaceMeta, k) => {
					doEnsureArray(replaceMeta, "with");

					const ix = curSpells[k].indexOf(replaceMeta.replace);
					if (~ix) {
						curSpells[k].splice(ix, 1, ...replaceMeta.with);
						curSpells[k].sort(SortUtil.ascSortLower);
					} else throw new Error(`Could not find spell "${replaceMeta.replace}" to replace`);
				};

				if (modInfo.spells) {
					const trait0 = spellcasting.spells;
					Object.keys(modInfo.spells).forEach(k => { // k is e.g. "4"
						if (trait0[k]) {
							const replaceMetas = modInfo.spells[k];
							const curSpells = trait0[k];
							replaceMetas.forEach(replaceMeta => handleReplace(curSpells, replaceMeta, "spells"));
						}
					});
				}

				// TODO should be extended  to handle all non-slot-based spellcasters
				if (modInfo.daily) {
					for (let i = 1; i <= 9; ++i) {
						const e = `${i}e`;

						if (modInfo.daily[i]) {
							modInfo.daily[i].forEach(replaceMeta => handleReplace(spellcasting.daily, replaceMeta, i));
						}

						if (modInfo.daily[e]) {
							modInfo.daily[e].forEach(replaceMeta => handleReplace(spellcasting.daily, replaceMeta, e));
						}
					}
				}
			}

			function doMod_scalarAddHit (modInfo, prop) {
				if (!copyTo[prop]) return;
				copyTo[prop] = JSON.parse(JSON.stringify(copyTo[prop]).replace(/{@hit ([-+]?\d+)}/g, (m0, m1) => `{@hit ${Number(m1) + modInfo.scalar}}`))
			}

			function doMod_scalarAddDc (modInfo, prop) {
				if (!copyTo[prop]) return;
				copyTo[prop] = JSON.parse(JSON.stringify(copyTo[prop]).replace(/{@dc (\d+)}/g, (m0, m1) => `{@dc ${Number(m1) + modInfo.scalar}}`));
			}

			function doMod_maxSize (modInfo) {
				const ixCur = Parser.SIZE_ABVS.indexOf(copyTo.size);
				const ixMax = Parser.SIZE_ABVS.indexOf(modInfo.max);
				if (ixCur < 0 || ixMax < 0) throw new Error(`Unhandled size!`);
				copyTo.size = Parser.SIZE_ABVS[Math.min(ixCur, ixMax)]
			}

			function doMod_scalarMultXp (modInfo) {
				function getOutput (input) {
					let out = input * modInfo.scalar;
					if (modInfo.floor) out = Math.floor(out);
					return out;
				}

				if (copyTo.cr.xp) copyTo.cr.xp = getOutput(copyTo.cr.xp);
				else {
					const curXp = Parser.crToXpNumber(copyTo.cr);
					if (!copyTo.cr.cr) copyTo.cr = {cr: copyTo.cr};
					copyTo.cr.xp = getOutput(curXp);
				}
			}

			function doMod (modInfos, ...properties) {
				function handleProp (prop) {
					modInfos.forEach(modInfo => {
						if (typeof modInfo === "string") {
							switch (modInfo) {
								case "remove": return delete copyTo[prop];
								default: throw new Error(`Unhandled mode: ${modInfo}`);
							}
						} else {
							switch (modInfo.mode) {
								case "appendStr": return doMod_appendStr(modInfo, prop);
								case "replaceTxt": return doMod_replaceTxt(modInfo, prop);
								case "prependArr": return doMod_prependArr(modInfo, prop);
								case "appendArr": return doMod_appendArr(modInfo, prop);
								case "replaceArr": return doMod_replaceArr(modInfo, prop);
								case "replaceOrAppendArr": return doMod_replaceOrAppendArr(modInfo, prop);
								case "appendIfNotExistsArr": return doMod_appendIfNotExistsArr(modInfo, prop);
								case "insertArr": return doMod_insertArr(modInfo, prop);
								case "removeArr": return doMod_removeArr(modInfo, prop);
								case "calculateProp": return doMod_calculateProp(modInfo, prop);
								case "scalarAddProp": return doMod_scalarAddProp(modInfo, prop);
								case "scalarMultProp": return doMod_scalarMultProp(modInfo, prop);
								// bestiary specific
								case "addSenses": return doMod_addSenses(modInfo);
								case "addSkills": return doMod_addSkills(modInfo);
								case "addSpells": return doMod_addSpells(modInfo);
								case "replaceSpells": return doMod_replaceSpells(modInfo);
								case "scalarAddHit": return doMod_scalarAddHit(modInfo, prop);
								case "scalarAddDc": return doMod_scalarAddDc(modInfo, prop);
								case "maxSize": return doMod_maxSize(modInfo);
								case "scalarMultXp": return doMod_scalarMultXp(modInfo);
								default: throw new Error(`Unhandled mode: ${modInfo.mode}`);
							}
						}
					});
				}

				properties.forEach(prop => handleProp(prop));
				// special case for "no property" modifications, i.e. underscore-key'd
				if (!properties.length) handleProp();
			}

			// apply mods
			if (copyMeta._mod) {
				// pre-convert any dynamic text
				Object.entries(copyMeta._mod).forEach(([k, v]) => {
					copyMeta._mod[k] = JSON.parse(
						JSON.stringify(v)
							.replace(/<\$([^$]+)\$>/g, (...m) => {
								const parts = m[1].split("__");

								switch (parts[0]) {
									case "name": return copyTo.name;
									case "short_name":
									case "title_short_name": {
										return Renderer.monster.getShortName(copyTo, parts[0] === "title_short_name");
									}
									case "spell_dc": {
										if (!Parser.ABIL_ABVS.includes(parts[1])) throw new Error(`Unknown ability score "${parts[1]}"`);
										return 8 + Parser.getAbilityModNumber(Number(copyTo[parts[1]])) + Parser.crToPb(copyTo.cr);
									}
									case "to_hit": {
										if (!Parser.ABIL_ABVS.includes(parts[1])) throw new Error(`Unknown ability score "${parts[1]}"`);
										const total = Parser.crToPb(copyTo.cr) + Parser.getAbilityModNumber(Number(copyTo[parts[1]]));
										return total >= 0 ? `+${total}` : total;
									}
									case "damage_mod": {
										if (!Parser.ABIL_ABVS.includes(parts[1])) throw new Error(`Unknown ability score "${parts[1]}"`);
										const total = Parser.getAbilityModNumber(Number(copyTo[parts[1]]));
										return total === 0 ? "" : total > 0 ? ` +${total}` : ` ${total}`;
									}
									case "damage_avg": {
										const replaced = parts[1].replace(/(str|dex|con|int|wis|cha)/gi, (...m2) => Parser.getAbilityModNumber(Number(copyTo[m2[0]])));
										const clean = replaced.replace(/[^-+/*0-9.,]+/g, "");
										// eslint-disable-next-line no-eval
										return Math.floor(eval(clean));
									}
									default: return m[0];
								}
							}),
					);
				});

				Object.entries(copyMeta._mod).forEach(([prop, modInfos]) => {
					if (prop === "*") doMod(modInfos, "action", "reaction", "trait", "legendary", "mythic", "variant", "spellcasting", "legendaryHeader");
					else if (prop === "_") doMod(modInfos);
					else doMod(modInfos, prop);
				});
			}

			// add filter tag
			copyTo._isCopy = true;

			// cleanup
			delete copyTo._copy;
		},
	},

	monster: {
		_MERGE_REQUIRES_PRESERVE: {
			legendaryGroup: true,
			environment: true,
			soundClip: true,
			page: true,
			altArt: true,
			otherSources: true,
			variant: true,
			dragonCastingColor: true,
			srd: true,
			hasToken: true,
		},
		_mergeCache: {},
		async pMergeCopy (monList, mon, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.monster, UrlUtil.PG_BESTIARY, monList, mon, options);
		},

		async pPreloadMeta () {
			if (DataUtil.monster._isMetaLoaded) return;

			const legendaryGroups = await DataUtil.legendaryGroup.pLoadAll();
			DataUtil.monster.populateMetaReference({legendaryGroup: legendaryGroups});
			DataUtil.monster._isMetaLoaded = true;
		},

		async pLoadAll () {
			const [index, legendaryGroups] = await Promise.all([
				DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/index.json`),
				DataUtil.legendaryGroup.pLoadAll(),
			]);

			if (!DataUtil.monster._isMetaLoaded) {
				DataUtil.monster.populateMetaReference({legendaryGroup: legendaryGroups});
				DataUtil.monster._isMetaLoaded = true;
			}

			const allData = await Promise.all(Object.entries(index).map(async ([source, file]) => {
				const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/${file}`);
				return data.monster.filter(it => it.source === source);
			}));
			return allData.flat();
		},

		_isMetaLoaded: false,
		metaGroupMap: {},
		getMetaGroup (mon) {
			if (!mon.legendaryGroup || !mon.legendaryGroup.source || !mon.legendaryGroup.name) return null;
			return (DataUtil.monster.metaGroupMap[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name];
		},
		populateMetaReference (data) {
			(data.legendaryGroup || []).forEach(it => {
				(DataUtil.monster.metaGroupMap[it.source] =
					DataUtil.monster.metaGroupMap[it.source] || {})[it.name] =
					DataUtil.monster.metaGroupMap[it.source][it.name] || it;
			});
		},
	},

	monsterFluff: {
		_MERGE_REQUIRES_PRESERVE: {},
		_mergeCache: {},
		async pMergeCopy (monFlfList, monFlf, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.monsterFluff, UrlUtil.PG_BESTIARY, monFlfList, monFlf, options);
		},
	},

	spell: {
		_MERGE_REQUIRES_PRESERVE: {
			page: true,
			otherSources: true,
			srd: true,
		},
		_mergeCache: {},
		async pMergeCopy (spellList, spell, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.spell, UrlUtil.PG_SPELLS, spellList, spell, options);
		},

		async pLoadAll () {
			const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/spells/index.json`);
			const allData = await Promise.all(Object.entries(index).map(async ([source, file]) => {
				const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/spells/${file}`);
				return data.spell.filter(it => it.source === source);
			}));
			return allData.flat();
		},
	},

	spellFluff: {
		_MERGE_REQUIRES_PRESERVE: {},
		_mergeCache: {},
		async pMergeCopy (spellFlfList, spellFlf, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.spellFluff, UrlUtil.PG_SPELLS, spellFlfList, spellFlf, options);
		},
	},

	item: {
		_MERGE_REQUIRES_PRESERVE: {
			lootTables: true,
			tier: true,
			page: true,
			otherSources: true,
			srd: true,
		},
		_mergeCache: {},
		async pMergeCopy (itemList, item, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.item, UrlUtil.PG_ITEMS, itemList, item, options);
		},
	},

	itemFluff: {
		_MERGE_REQUIRES_PRESERVE: {},
		_mergeCache: {},
		async pMergeCopy (itemFlfList, itemFlf, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.itemFluff, UrlUtil.PG_ITEMS, itemFlfList, itemFlf, options);
		},
	},

	background: {
		_MERGE_REQUIRES_PRESERVE: {
			page: true,
			otherSources: true,
			srd: true,
		},
		_mergeCache: {},
		async pMergeCopy (bgList, bg, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.background, UrlUtil.PG_BACKGROUNDS, bgList, bg, options);
		},
	},

	race: {
		_MERGE_REQUIRES_PRESERVE: {
			subraces: true,
			page: true,
			otherSources: true,
			srd: true,
		},
		_mergeCache: {},
		async pMergeCopy (raceList, race, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.race, UrlUtil.PG_RACES, raceList, race, options);
		},
	},

	raceFluff: {
		_MERGE_REQUIRES_PRESERVE: {},
		_mergeCache: {},
		async pMergeCopy (raceFlfList, raceFlf, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.raceFluff, UrlUtil.PG_RACES, raceFlfList, raceFlf, options);
		},
	},

	class: {
		_pLoadingJson: null,
		_pLoadingRawJson: null,
		_loadedJson: null,
		_loadedRawJson: null,
		async loadJSON () {
			if (DataUtil.class._loadedJson) return DataUtil.class._loadedJson;

			DataUtil.class._pLoadingJson = (async () => {
				const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/class/index.json`);
				const allData = await Promise.all(Object.values(index).map(it => DataUtil.loadJSON(`${Renderer.get().baseUrl}data/class/${it}`)));

				const allDereferencedData = await Promise.all(allData.map(json => Promise.all((json.class || []).map(cls => DataUtil.class.pGetDereferencedClassData(cls)))));
				DataUtil.class._loadedJson = {class: allDereferencedData.flat()};
			})();
			await DataUtil.class._pLoadingJson;

			return DataUtil.class._loadedJson;
		},

		async loadRawJSON () {
			if (DataUtil.class._loadedRawJson) return DataUtil.class._loadedRawJson;

			DataUtil.class._pLoadingRawJson = (async () => {
				const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/class/index.json`);
				const allData = await Promise.all(Object.values(index).map(it => DataUtil.loadJSON(`${Renderer.get().baseUrl}data/class/${it}`)));

				DataUtil.class._loadedRawJson = {
					class: allData.map(it => it.class || []).flat(),
					classFeature: allData.map(it => it.classFeature || []).flat(),
					subclassFeature: allData.map(it => it.subclassFeature || []).flat(),
				};
			})();
			await DataUtil.class._pLoadingRawJson;

			return DataUtil.class._loadedRawJson;
		},

		/**
		 * @param uid
		 * @param [opts]
		 * @param [opts.isLower] If the returned values should be lowercase.
		 */
		unpackUidClassFeature (uid, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [name, className, classSource, level, source, displayText] = uid.split("|").map(it => it.trim());
			classSource = classSource || (opts.isLower ? SRC_PHB.toLowerCase() : SRC_PHB);
			source = source || classSource;
			level = Number(level)
			return {
				name,
				className,
				classSource,
				level,
				source,
				displayText,
			};
		},

		/**
		 * @param uid
		 * @param [opts]
		 * @param [opts.isLower] If the returned values should be lowercase.
		 */
		unpackUidSubclassFeature (uid, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [name, className, classSource, subclassShortName, subclassSource, level, source, displayText] = uid.split("|").map(it => it.trim());
			classSource = classSource || (opts.isLower ? SRC_PHB.toLowerCase() : SRC_PHB);
			subclassSource = subclassSource || (opts.isLower ? SRC_PHB.toLowerCase() : SRC_PHB);
			source = source || subclassSource;
			level = Number(level)
			return {
				name,
				className,
				classSource,
				subclassShortName,
				subclassSource,
				level,
				source,
				displayText,
			};
		},

		_mutEntryNestLevel (feature) {
			const depth = (feature.header == null ? 1 : feature.header) - 1;
			for (let i = 0; i < depth; ++i) {
				const nxt = {
					name: feature.name,
					page: feature.page,
					source: feature.source,
					type: "entries",
					entries: feature.entries,
				};
				if (!nxt.name) delete nxt.name;
				if (!nxt.page) delete nxt.page;
				if (!nxt.source) delete nxt.source;
				feature.entries = [nxt];
				delete feature.name;
				delete feature.page;
				delete feature.source;
			}
		},

		async pGetDereferencedClassData (cls) {
			// Gracefully handle legacy class data
			if (cls.classFeatures && cls.classFeatures.every(it => typeof it !== "string" && !it.classFeature)) return cls;

			cls = MiscUtil.copy(cls);

			const byLevel = {}; // Build a map of `level: [classFeature]`
			for (const classFeatureRef of (cls.classFeatures || [])) {
				const uid = classFeatureRef.classFeature ? classFeatureRef.classFeature : classFeatureRef;
				const {name, className, classSource, level, source} = DataUtil.class.unpackUidClassFeature(uid);
				if (!name || !className || !level || isNaN(level)) continue; // skip over broken links

				const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"]({name, className, classSource, level, source});

				// Skip blacklisted
				if (ExcludeUtil.isInitialised && ExcludeUtil.isExcluded(hash, "classFeature", source, {isNoCount: true})) continue;

				const classFeature = await Renderer.hover.pCacheAndGet("classFeature", source, hash, {isCopy: true});
				// skip over missing links
				if (!classFeature) {
					JqueryUtil.doToast({type: "danger", content: `Failed to find <code>classFeature</code> <code>${uid}</code>`});
					continue;
				}

				if (classFeatureRef.gainSubclassFeature) classFeature.gainSubclassFeature = true;
				// Remove sources to avoid colouring e.g. entire UA classes with the "spicy green" styling
				if (classFeature.source === cls.source) delete classFeature.source;

				DataUtil.class._mutEntryNestLevel(classFeature);

				const key = `${classFeature.level || 1}`;
				(byLevel[key] = byLevel[key] || []).push(classFeature);
			}

			const outClassFeatures = [];
			const maxLevel = Math.max(...Object.keys(byLevel).map(it => Number(it)));
			for (let i = 1; i <= maxLevel; ++i) {
				outClassFeatures[i - 1] = byLevel[i] || [];
			}
			cls.classFeatures = outClassFeatures;

			if (cls.subclasses) {
				const outSubclasses = [];
				for (const sc of cls.subclasses) {
					outSubclasses.push(await DataUtil.class.pGetDereferencedSubclassData(sc));
				}
				cls.subclasses = outSubclasses;
			}

			return cls;
		},

		async pGetDereferencedSubclassData (sc) {
			// Gracefully handle legacy class data
			if (sc.subclassFeatures && sc.subclassFeatures.every(it => typeof it !== "string" && !it.subclassFeature)) return sc;

			sc = MiscUtil.copy(sc);

			const byLevel = {}; // Build a map of `level: [subclassFeature]`

			for (const subclassFeatureRef of (sc.subclassFeatures || [])) {
				const uid = subclassFeatureRef.subclassFeature ? subclassFeatureRef.subclassFeature : subclassFeatureRef;
				const {name, className, classSource, subclassShortName, subclassSource, level, source} = DataUtil.class.unpackUidSubclassFeature(uid);
				if (!name || !className || !subclassShortName || !level || isNaN(level)) continue; // skip over broken links

				const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"]({name, className, classSource, subclassShortName, subclassSource, level, source});

				// Skip blacklisted
				if (ExcludeUtil.isInitialised && ExcludeUtil.isExcluded(hash, "subclassFeature", source, {isNoCount: true})) continue;

				const subclassFeature = await Renderer.hover.pCacheAndGet("subclassFeature", source, hash, {isCopy: true});
				// skip over missing links
				if (!subclassFeature) {
					JqueryUtil.doToast({type: "danger", content: `Failed to find <code>subclassFeature</code> <code>${uid}</code>`});
					continue;
				}

				// Remove sources to avoid colouring e.g. entire UA classes with the "spicy green" styling
				if (subclassFeature.source === sc.source) delete subclassFeature.source;

				DataUtil.class._mutEntryNestLevel(subclassFeature);

				const key = `${subclassFeature.level || 1}`;
				(byLevel[key] = byLevel[key] || []).push(subclassFeature);
			}

			sc.subclassFeatures = Object.keys(byLevel)
				.map(it => Number(it))
				.sort(SortUtil.ascSort)
				.map(k => byLevel[k]);

			return sc;
		},
	},

	deity: {
		_MERGE_REQUIRES_PRESERVE: {
			page: true,
			otherSources: true,
			srd: true,
		},
		_mergeCache: {},
		async pMergeCopy (deityList, deity, options) {
			return DataUtil.generic._pMergeCopy(DataUtil.deity, UrlUtil.PG_DEITIES, deityList, deity, options);
		},

		doPostLoad: function (data) {
			const PRINT_ORDER = [
				SRC_PHB,
				SRC_DMG,
				SRC_SCAG,
				SRC_VGM,
				SRC_MTF,
				SRC_ERLW,
			];

			const inSource = {};
			PRINT_ORDER.forEach(src => {
				inSource[src] = {};
				data.deity.filter(it => it.source === src).forEach(it => inSource[src][it.reprintAlias || it.name] = it); // TODO need to handle similar names
			});

			const laterPrinting = [PRINT_ORDER.last()];
			[...PRINT_ORDER].reverse().slice(1).forEach(src => {
				laterPrinting.forEach(laterSrc => {
					Object.keys(inSource[src]).forEach(name => {
						const newer = inSource[laterSrc][name];
						if (newer) {
							const old = inSource[src][name];
							old.reprinted = true;
							if (!newer._isEnhanced) {
								newer.previousVersions = newer.previousVersions || [];
								newer.previousVersions.push(old);
							}
						}
					});
				});

				laterPrinting.push(src);
			});
			data.deity.forEach(g => g._isEnhanced = true);
		},

		loadJSON: async function () {
			const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/deities.json`);
			DataUtil.deity.doPostLoad(data);
			return data;
		},
	},

	table: {
		async pLoadAll () {
			const datas = await Promise.all([`${Renderer.get().baseUrl}data/generated/gendata-tables.json`, `${Renderer.get().baseUrl}data/tables.json`].map(url => DataUtil.loadJSON(url)));
			const combined = {};
			datas.forEach(data => {
				Object.entries(data).forEach(([k, v]) => {
					if (combined[k] && combined[k] instanceof Array && v instanceof Array) combined[k] = combined[k].concat(v);
					else if (combined[k] == null) combined[k] = v;
					else throw new Error(`Could not merge keys for key "${k}"`);
				});
			});
			return combined;
		},
	},

	legendaryGroup: {
		async pLoadAll () {
			return (await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/legendarygroups.json`)).legendaryGroup;
		},
	},

	brew: {
		_getCleanUrlRoot (urlRoot) {
			if (urlRoot && urlRoot.trim()) {
				urlRoot = urlRoot.trim();
				if (!urlRoot.endsWith("/")) urlRoot = `${urlRoot}/`;
			} else urlRoot = `https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/`;
			return urlRoot;
		},

		async pLoadTimestamps (urlRoot) {
			urlRoot = DataUtil.brew._getCleanUrlRoot(urlRoot);
			return DataUtil.loadJSON(`${urlRoot}_generated/index-timestamps.json`);
		},

		async pLoadPropIndex (urlRoot) {
			urlRoot = DataUtil.brew._getCleanUrlRoot(urlRoot);
			return DataUtil.loadJSON(`${urlRoot}_generated/index-props.json`);
		},

		async pLoadSourceIndex (urlRoot) {
			urlRoot = DataUtil.brew._getCleanUrlRoot(urlRoot);
			return DataUtil.loadJSON(`${urlRoot}_generated/index-sources.json`);
		},

		getFileUrl (path, urlRoot) {
			urlRoot = DataUtil.brew._getCleanUrlRoot(urlRoot);
			return `${urlRoot}${path}`;
		},
	},
};

// ROLLING =============================================================================================================
RollerUtil = {
	isCrypto () {
		return typeof window !== "undefined" && typeof window.crypto !== "undefined";
	},

	randomise (max, min = 1) {
		if (min > max) return 0;
		if (max === min) return max;
		if (RollerUtil.isCrypto()) {
			return RollerUtil._randomise(min, max + 1);
		} else {
			return RollerUtil.roll(max) + min;
		}
	},

	rollOnArray (array) {
		return array[RollerUtil.randomise(array.length) - 1]
	},

	/**
	 * Cryptographically secure RNG
	 */
	_randomise: (min, max) => {
		const range = max - min;
		const bytesNeeded = Math.ceil(Math.log2(range) / 8);
		const randomBytes = new Uint8Array(bytesNeeded);
		const maximumRange = (2 ** 8) ** bytesNeeded;
		const extendedRange = Math.floor(maximumRange / range) * range;
		let i;
		let randomInteger;
		while (true) {
			window.crypto.getRandomValues(randomBytes);
			randomInteger = 0;
			for (i = 0; i < bytesNeeded; i++) {
				randomInteger <<= 8;
				randomInteger += randomBytes[i];
			}
			if (randomInteger < extendedRange) {
				randomInteger %= range;
				return min + randomInteger;
			}
		}
	},

	/**
	 * Result in range: 0 to (max-1); inclusive
	 * e.g. roll(20) gives results ranging from 0 to 19
	 * @param max range max (exclusive)
	 * @param fn funciton to call to generate random numbers
	 * @returns {number} rolled
	 */
	roll (max, fn = Math.random) {
		return Math.floor(fn() * max);
	},

	addListRollButton (isCompact) {
		const $btnRoll = $(`<button class="btn btn-default ${isCompact ? "px-2" : ""}" id="feelinglucky" title="Feeling Lucky?"><span class="glyphicon glyphicon-random"></span></button>`);
		$btnRoll.on("click", () => {
			const primaryLists = ListUtil.getPrimaryLists();
			if (primaryLists && primaryLists.length) {
				const allLists = primaryLists.filter(l => l.visibleItems.length);
				if (allLists.length) {
					const rollX = RollerUtil.roll(allLists.length);
					const list = allLists[rollX];
					const rollY = RollerUtil.roll(list.visibleItems.length);
					window.location.hash = $(list.visibleItems[rollY].ele).find(`a`).prop("hash");
				}
			}
		});

		$(`#filter-search-group`).find(`#reset`).before($btnRoll);
	},

	getColRollType (colLabel) {
		if (typeof colLabel !== "string") return false;
		if (/^{@dice [^}]+}$/.test(colLabel.trim())) return true;
		colLabel = Renderer.stripTags(colLabel);

		if (Renderer.dice.lang.getTree3(colLabel)) return RollerUtil.ROLL_COL_STANDARD;

		// Remove trailing variables, if they exist
		colLabel = colLabel.replace(RollerUtil._REGEX_ROLLABLE_COL_LABEL, "$1");
		if (Renderer.dice.lang.getTree3(colLabel)) return RollerUtil.ROLL_COL_VARIABLE;

		return 0;
	},

	getFullRollCol (lbl) {
		if (lbl.includes("@dice")) return lbl;

		if (Renderer.dice.lang.getTree3(lbl)) return `{@dice ${lbl}}`;

		// Try to split off any trailing variables, e.g. `d100 + Level` -> `d100`, `Level`
		const m = RollerUtil._REGEX_ROLLABLE_COL_LABEL.exec(lbl);
		if (!m) return lbl;

		return `{@dice ${m[1]}${m[2]}#$prompt_number:title=Enter a ${m[3].trim()}$#|${lbl}}`;
	},

	_DICE_REGEX_STR: "((([1-9]\\d*)?d([1-9]\\d*)(\\s*?[-+×x*÷/]\\s*?(\\d,\\d|\\d)+(\\.\\d+)?)?))+?",
};
RollerUtil.DICE_REGEX = new RegExp(RollerUtil._DICE_REGEX_STR, "g");
RollerUtil.REGEX_DAMAGE_DICE = /(\d+)( \((?:{@dice |{@damage ))([-+0-9d ]*)(}\) [a-z]+( \([-a-zA-Z0-9 ]+\))?( or [a-z]+( \([-a-zA-Z0-9 ]+\))?)? damage)/gi;
RollerUtil.REGEX_DAMAGE_FLAT = /(Hit: |{@h})([0-9]+)( [a-z]+( \([-a-zA-Z0-9 ]+\))?( or [a-z]+( \([-a-zA-Z0-9 ]+\))?)? damage)/gi;
RollerUtil._REGEX_ROLLABLE_COL_LABEL = /^(.*?\d)(\s*[-+/*^×÷]\s*)([a-zA-Z0-9 ]+)$/;
RollerUtil.ROLL_COL_NONE = 0;
RollerUtil.ROLL_COL_STANDARD = 1;
RollerUtil.ROLL_COL_VARIABLE = 2;

// STORAGE =============================================================================================================
// Dependency: localforage
StorageUtil = {
	_init: false,
	_initAsync: false,
	_fakeStorage: {},
	_fakeStorageAsync: {},

	getSyncStorage: () => {
		if (StorageUtil._init) {
			if (StorageUtil.__fakeStorage) return StorageUtil._fakeStorage;
			else return window.localStorage;
		}

		StorageUtil._init = true;
		try {
			window.localStorage.setItem("_test_storage", true);
			return window.localStorage;
		} catch (e) {
			// if the user has disabled cookies, build a fake version
			StorageUtil.__fakeStorage = true;
			StorageUtil._fakeStorage = {
				isSyncFake: true,
				getItem: k => StorageUtil.__fakeStorage[k],
				removeItem: k => delete StorageUtil.__fakeStorage[k],
				setItem: (k, v) => StorageUtil.__fakeStorage[k] = v,
			};
			return StorageUtil._fakeStorage;
		}
	},

	async getAsyncStorage () {
		if (StorageUtil._initAsync) {
			if (StorageUtil.__fakeStorageAsync) return StorageUtil._fakeStorageAsync;
			else return localforage;
		}

		const getInitFakeStorage = () => {
			StorageUtil.__fakeStorageAsync = {};
			StorageUtil._fakeStorageAsync = {
				pIsAsyncFake: true,
				async setItem (k, v) { StorageUtil.__fakeStorageAsync[k] = v; },
				async getItem (k) { return StorageUtil.__fakeStorageAsync[k]; },
				async removeItem (k) { delete StorageUtil.__fakeStorageAsync[k]; },
			};
			return StorageUtil._fakeStorageAsync;
		};

		if (typeof window !== "undefined") {
			try {
				// check if IndexedDB is available (i.e. not in Firefox private browsing)
				await new Promise((resolve, reject) => {
					const request = window.indexedDB.open("_test_db", 1);
					request.onerror = reject;
					request.onsuccess = resolve;
				});
				await localforage.setItem("_storage_check", true);
				return localforage;
			} catch (e) {
				return getInitFakeStorage();
			} finally {
				StorageUtil._initAsync = true;
			}
		} else return getInitFakeStorage();
	},

	// region Synchronous
	syncGet (key) {
		const rawOut = StorageUtil.getSyncStorage().getItem(key);
		if (rawOut && rawOut !== "undefined" && rawOut !== "null") return JSON.parse(rawOut);
		return null;
	},

	syncSet (key, value) {
		StorageUtil.getSyncStorage().setItem(key, JSON.stringify(value));
		StorageUtil._syncTrackKey(key)
	},

	syncRemove (key) {
		StorageUtil.getSyncStorage().removeItem(key);
		StorageUtil._syncTrackKey(key, true);
	},

	syncGetForPage (key) { return StorageUtil.syncGet(`${key}_${UrlUtil.getCurrentPage()}`); },
	syncSetForPage (key, value) { StorageUtil.syncSet(`${key}_${UrlUtil.getCurrentPage()}`, value); },

	isSyncFake () {
		return !!StorageUtil.getSyncStorage().isSyncFake
	},

	_syncTrackKey (key, isRemove) {
		const meta = StorageUtil.syncGet(StorageUtil._META_KEY) || {};
		if (isRemove) delete meta[key];
		else meta[key] = 1;
		StorageUtil.getSyncStorage().setItem(StorageUtil._META_KEY, JSON.stringify(meta));
	},

	syncGetDump () {
		const out = {};
		const meta = StorageUtil.syncGet(StorageUtil._META_KEY) || {};
		Object.entries(meta).filter(([key, isPresent]) => isPresent).forEach(([key]) => out[key] = StorageUtil.syncGet(key));
		return out;
	},

	syncSetFromDump (dump) {
		Object.entries(dump).forEach(([k, v]) => StorageUtil.syncSet(k, v));
	},
	// endregion

	// region Asynchronous
	async pIsAsyncFake () {
		const storage = await StorageUtil.getAsyncStorage();
		return !!storage.pIsAsyncFake;
	},

	async pSet (key, value) {
		StorageUtil._pTrackKey(key);
		const storage = await StorageUtil.getAsyncStorage();
		return storage.setItem(key, value);
	},

	async pGet (key) {
		const storage = await StorageUtil.getAsyncStorage();
		return storage.getItem(key);
	},

	async pRemove (key) {
		StorageUtil._pTrackKey(key, true);
		const storage = await StorageUtil.getAsyncStorage();
		return storage.removeItem(key);
	},

	getPageKey (key, page) { return `${key}_${page || UrlUtil.getCurrentPage()}`; },
	async pGetForPage (key) { return StorageUtil.pGet(StorageUtil.getPageKey(key)); },
	async pSetForPage (key, value) { return StorageUtil.pSet(StorageUtil.getPageKey(key), value); },
	async pRemoveForPage (key) { return StorageUtil.pRemove(StorageUtil.getPageKey(key)); },

	async _pTrackKey (key, isRemove) {
		const storage = await StorageUtil.getAsyncStorage();
		const meta = (await StorageUtil.pGet(StorageUtil._META_KEY)) || {};
		if (isRemove) delete meta[key];
		else meta[key] = 1;
		return storage.setItem(StorageUtil._META_KEY, meta);
	},

	async pGetDump () {
		const out = {};
		const meta = (await StorageUtil.pGet(StorageUtil._META_KEY)) || {};
		await Promise.all(Object.entries(meta).filter(([key, isPresent]) => isPresent).map(async ([key]) => out[key] = await StorageUtil.pGet(key)));
		return out;
	},

	async pSetFromDump (dump) {
		return Promise.all(Object.entries(dump).map(([k, v]) => StorageUtil.pSet(k, v)));
	},
	// endregion
};
StorageUtil._META_KEY = "_STORAGE_META_STORAGE";

// TODO transition cookie-like storage items over to this
SessionStorageUtil = {
	_fakeStorage: {},
	__storage: null,
	getStorage: () => {
		try {
			return window.sessionStorage;
		} catch (e) {
			// if the user has disabled cookies, build a fake version
			if (SessionStorageUtil.__storage) return SessionStorageUtil.__storage;
			else {
				return SessionStorageUtil.__storage = {
					isFake: true,
					getItem: (k) => {
						return SessionStorageUtil._fakeStorage[k];
					},
					removeItem: (k) => {
						delete SessionStorageUtil._fakeStorage[k];
					},
					setItem: (k, v) => {
						SessionStorageUtil._fakeStorage[k] = v;
					},
				};
			}
		}
	},

	isFake () {
		return SessionStorageUtil.getStorage().isSyncFake
	},

	setForPage: (key, value) => {
		SessionStorageUtil.set(`${key}_${UrlUtil.getCurrentPage()}`, value);
	},

	set (key, value) {
		SessionStorageUtil.getStorage().setItem(key, JSON.stringify(value));
	},

	getForPage: (key) => {
		return SessionStorageUtil.get(`${key}_${UrlUtil.getCurrentPage()}`);
	},

	get (key) {
		const rawOut = SessionStorageUtil.getStorage().getItem(key);
		if (rawOut && rawOut !== "undefined" && rawOut !== "null") return JSON.parse(rawOut);
		return null;
	},

	removeForPage: (key) => {
		SessionStorageUtil.remove(`${key}_${UrlUtil.getCurrentPage()}`)
	},

	remove (key) {
		SessionStorageUtil.getStorage().removeItem(key);
	},
};

// HOMEBREW ============================================================================================================
BrewUtil = {
	_PAGE: null, // Allow the current page to be forcibly specified externally

	homebrew: null,
	homebrewMeta: null,
	_lists: null,
	_sourceCache: null,
	_filterBox: null,
	_sourceFilter: null,
	_pHandleBrew: null,
	_lockHandleBrewJson: null,

	/**
	 * @param options Options object.
	 * @param [options.list] List.
	 * @param [options.lists] Lists.
	 * @param [options.filterBox] Filter box.
	 * @param [options.sourceFilter] Source filter.
	 * @param [options.pHandleBrew] Brew handling function.
	 */
	bind (options) {
		// provide ref to List.js instance
		if (options.list) BrewUtil._lists = [options.list];
		else if (options.lists) BrewUtil._lists = options.lists;
		// provide ref to FilterBox and Filter instance
		if (options.filterBox) BrewUtil._filterBox = options.filterBox;
		if (options.sourceFilter) BrewUtil._sourceFilter = options.sourceFilter;
		// allow external source for handleBrew
		if (options.pHandleBrew !== undefined) this._pHandleBrew = options.pHandleBrew;
	},

	async pAddBrewData () {
		if (BrewUtil.homebrew) {
			return BrewUtil.homebrew;
		} else {
			try {
				const homebrew = await StorageUtil.pGet(VeCt.STORAGE_HOMEBREW) || {};
				BrewUtil.homebrewMeta = StorageUtil.syncGet(VeCt.STORAGE_HOMEBREW_META) || {sources: []};
				BrewUtil.homebrewMeta.sources = BrewUtil.homebrewMeta.sources || [];

				BrewUtil.homebrew = homebrew;

				BrewUtil._resetSourceCache();

				return BrewUtil.homebrew;
			} catch (e) {
				BrewUtil.pPurgeBrew(e);
			}
		}
	},

	async pPurgeBrew (error) {
		JqueryUtil.doToast({
			content: "Error when loading homebrew! Purged homebrew data. (See the log for more information.)",
			type: "danger",
		});
		await StorageUtil.pRemove(VeCt.STORAGE_HOMEBREW);
		StorageUtil.syncRemove(VeCt.STORAGE_HOMEBREW_META);
		BrewUtil.homebrew = null;
		window.location.hash = "";
		BrewUtil.homebrew = {};
		BrewUtil.homebrewMeta = {sources: []};
		if (error) setTimeout(() => { throw error; });
	},

	async pAddLocalBrewData (callbackFn = async (d, page) => BrewUtil.pDoHandleBrewJson(d, page, null)) {
		if (!IS_VTT && !IS_DEPLOYED) {
			const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}${VeCt.JSON_HOMEBREW_INDEX}`);
			// auto-load from `homebrew/`, for custom versions of the site
			if (data.toImport.length) {
				const page = BrewUtil._PAGE || UrlUtil.getCurrentPage();
				const allData = await Promise.all(data.toImport.map(it => DataUtil.loadJSON(`homebrew/${it}`)));
				await Promise.all(allData.map(d => callbackFn(d, page)));
			}
		}
	},

	/**
	 * @param $appendTo Parent element
	 * @param [opts] Options object
	 * @param [opts.isModal]
	 * @param [opts.isShowAll]
	 */
	async _pRenderBrewScreen ($appendTo, opts) {
		opts = opts || {};

		const page = BrewUtil._PAGE || UrlUtil.getCurrentPage();

		const $brewList = $(`<div class="manbrew__current_brew flex-col h-100 mt-1"></div>`);

		await BrewUtil._pRenderBrewScreen_pRefreshBrewList($brewList);

		const $iptAdd = $(`<input multiple type="file" accept=".json" style="display: none;">`)
			.change(evt => {
				const input = evt.target;

				let readIndex = 0;
				const reader = new FileReader();
				reader.onload = async () => {
					const json = JSON.parse(reader.result);

					await DataUtil.pDoMetaMerge(CryptUtil.uid(), json);

					await BrewUtil.pDoHandleBrewJson(json, page, BrewUtil._pRenderBrewScreen_pRefreshBrewList.bind(this, $brewList));

					if (input.files[readIndex]) reader.readAsText(input.files[readIndex++]);
					else $(evt.target).val(""); // reset the input
				};
				reader.readAsText(input.files[readIndex++]);
			});

		const $btnLoadFromUrl = $(`<button class="btn btn-default btn-sm mr-2">Load from URL</button>`)
			.click(async () => {
				const enteredUrl = await InputUiUtil.pGetUserString({title: "Homebrew URL"});
				if (!enteredUrl || !enteredUrl.trim()) return;

				let parsedUrl;
				try {
					parsedUrl = new URL(enteredUrl);
				} catch (e) {
					JqueryUtil.doToast({
						content: `The provided URL does not appear to be valid.`,
						type: "danger",
					});
					return;
				}
				BrewUtil.addBrewRemote(null, parsedUrl.href).catch(err => {
					JqueryUtil.doToast({
						content: "Could not load homebrew from the provided URL.",
						type: "danger",
					});
					setTimeout(() => { throw err; });
				});
			});

		const $btnGet = $(`<button class="btn btn-info btn-sm">Get Homebrew</button>`)
			.click(() => BrewUtil._pHandleClickBtnGet(opts));

		const $btnCustomUrl = $(`<button class="btn btn-info btn-sm px-2" title="Set Custom Repository URL"><span class="glyphicon glyphicon-cog"></span></button>`)
			.click(async () => {
				const customBrewUtl = await StorageUtil.pGet(`HOMEBREW_CUSTOM_REPO_URL`);

				const nxtUrl = await InputUiUtil.pGetUserString({
					title: "Homebrew Repository URL (Blank for Default)",
					default: customBrewUtl,
				});

				if (nxtUrl == null) await StorageUtil.pRemove(`HOMEBREW_CUSTOM_REPO_URL`);
				else await StorageUtil.pSet(`HOMEBREW_CUSTOM_REPO_URL`, nxtUrl);
			});

		const $btnDelAll = opts.isModal ? null : BrewUtil._$getBtnDeleteAll();

		const $wrpBtns = $$`<div class="flex-vh-center no-shrink mobile__flex-col">
			<div class="flex-v-center mobile__mb-2">
				<div class="flex-v-center btn-group mr-2">
					${$btnGet}
					${$btnCustomUrl}
				</div>
				<label role="button" class="btn btn-default btn-sm mr-2">Upload File${$iptAdd}</label>
				${$btnLoadFromUrl}
			</div>
			<div class="flex-v-center">
				<a href="https://github.com/TheGiddyLimit/homebrew" class="flex-v-center" target="_blank" rel="noopener noreferrer"><button class="btn btn-default btn-sm">Browse Source Repository</button></a>
				${$btnDelAll}
			</div>
		</div>`;

		if (opts.isModal) {
			$$($appendTo)`
			${$brewList}
			${$wrpBtns.addClass("mb-2")}`
		} else {
			$$($appendTo)`
			${$wrpBtns.addClass("mb-3")}
			${$brewList}`
		}

		BrewUtil.addBrewRemote = async ($ele, jsonUrl, doUnescape) => {
			let cached;
			if ($ele) {
				cached = $ele.html();
				$ele.text("Loading...");
			}
			if (doUnescape) jsonUrl = jsonUrl.unescapeQuotes();
			const data = await DataUtil.loadJSON(`${jsonUrl}?${(new Date()).getTime()}`);
			await BrewUtil.pDoHandleBrewJson(data, page, BrewUtil._pRenderBrewScreen_pRefreshBrewList.bind(this, $brewList));
			if ($ele) {
				$ele.text("Done!");
				setTimeout(() => $ele.html(cached), VeCt.DUR_INLINE_NOTIFY);
			}
		};
	},

	async _pHandleClickBtnGet (opts) {
		const $btnToggleDisplayNonPageBrews = opts.isModal ? $(`<button class="btn btn-default btn-xs mr-2 ${opts.isShowAll ? "" : "active"}" disabled title="Hides homebrews which do not contain content relevant to this page.">Hide Unrelated</button>`) : null;

		const $btnAll = $(`<button class="btn btn-default btn-xs" disabled title="(Excluding samples)">Add All</button>`);

		const $ulRows = $$`<ul class="list"><li><div class="lst__wrp-cells"><span style="font-style: italic;">Loading...</span></div></li></ul>`;

		const $iptSearch = $(`<input type="search" class="search manbrew__search form-control w-100" placeholder="Find homebrew...">`)
			.keydown(evt => {
				switch (evt.which) {
					case 13: { // enter
						return $ulRows.find(`li`).first().find(`.manbrew__load_from_url`).click()
					}
					case 40: { // down
						const firstItem = list.visibleItems[0];
						if (firstItem) firstItem.ele.focus();
					}
				}
			});

		const {$modalInner, doClose} = UiUtil.getShowModal({
			isHeight100: true,
			title: `Get Homebrew`,
			isUncappedHeight: true,
			isWidth100: true,
			overlayColor: "transparent",
			isHeaderBorder: true,
		});

		$$($modalInner)`
		<div class="mt-1"><i>A list of homebrew available in the public repository. Click a name to load the homebrew, or view the source directly.<br>
		Contributions are welcome; see the <a href="https://github.com/TheGiddyLimit/homebrew/blob/master/README.md" target="_blank" rel="noopener noreferrer">README</a>, or stop by our <a href="https://discord.gg/nGvRCDs" target="_blank" rel="noopener noreferrer">Discord</a>.</i></div>
		<hr class="hr-1">
		<div class="flex-h-right mb-1">${$btnToggleDisplayNonPageBrews}${$btnAll}</div>
		${$iptSearch}
		<div class="filtertools manbrew__filtertools btn-group input-group input-group--bottom flex no-shrink">
			<button class="col-4 sort btn btn-default btn-xs" data-sort="name">Name</button>
			<button class="col-3 sort btn btn-default btn-xs" data-sort="author">Author</button>
			<button class="col-1-2 sort btn btn-default btn-xs" data-sort="category">Category</button>
			<button class="col-1-4 sort btn btn-default btn-xs" data-sort="modified">Modified</button>
			<button class="col-1-4 sort btn btn-default btn-xs" data-sort="added">Added</button>
			<button class="sort btn btn-default btn-xs ve-grow" disabled>Source</button>
		</div>
		${$ulRows}`;

		// populate list
		let dataList;
		function fnSort (a, b, o) {
			a = dataList[a.ix];
			b = dataList[b.ix];

			if (o.sortBy === "name") return byName();
			if (o.sortBy === "author") return orFallback(SortUtil.ascSortLower, "_brewAuthor");
			if (o.sortBy === "category") return orFallback(SortUtil.ascSortLower, "_brewCat");
			if (o.sortBy === "added") return orFallback(SortUtil.ascSort, "_brewAdded");
			if (o.sortBy === "modified") return orFallback(SortUtil.ascSort, "_brewModified");

			function byName () { return SortUtil.ascSortLower(a._brewName, b._brewName); }
			function orFallback (func, prop) { return func(a[prop], b[prop]) || byName(); }
		}

		const urlRoot = await StorageUtil.pGet(`HOMEBREW_CUSTOM_REPO_URL`);
		const [timestamps, propIndex] = await Promise.all([
			DataUtil.brew.pLoadTimestamps(urlRoot),
			DataUtil.brew.pLoadPropIndex(urlRoot),
		]);
		const props = opts.isShowAll ? BrewUtil.getPageProps(UrlUtil.PG_MANAGE_BREW) : BrewUtil.getPageProps();

		const seenPaths = new Set();

		dataList = [];
		props.forEach(prop => {
			Object.entries(propIndex[prop] || {})
				.forEach(([path, dir]) => {
					if (seenPaths.has(path)) return;
					seenPaths.add(path);
					dataList.push({
						download_url: DataUtil.brew.getFileUrl(path, urlRoot),
						path,
						name: path.split("/").slice(1).join("/"),
						_cat: BrewUtil.dirToProp(dir),
					})
				})
		});

		dataList.forEach(it => {
			const cleanFilename = it.name.trim().replace(/\.json$/, "");
			const spl = cleanFilename.split(";").map(it => it.trim());
			if (spl.length > 1) {
				it._brewName = spl[1];
				it._brewAuthor = spl[0];
			} else {
				it._brewName = cleanFilename;
				it._brewAuthor = "";
			}
		});
		dataList.sort((a, b) => SortUtil.ascSortLower(a._brewName, b._brewName));

		const list = new List({
			$iptSearch,
			$wrpList: $ulRows,
			fnSort,
			isUseJquery: true,
		});
		SortUtil.initBtnSortHandlers($modalInner.find(".manbrew__filtertools"), list);

		dataList.forEach((it, i) => {
			it._brewAdded = (timestamps[it.path] || {}).a || 0;
			it._brewModified = (timestamps[it.path] || {}).m || 0;
			it._brewCat = BrewUtil._pRenderBrewScreen_getDisplayCat(BrewUtil.dirToProp(it._cat));

			const timestampAdded = it._brewAdded ? MiscUtil.dateToStr(new Date(it._brewAdded * 1000), true) : "";
			const timestampModified = it._brewModified ? MiscUtil.dateToStr(new Date(it._brewModified * 1000), true) : "";

			const $btnAdd = $(`<span class="col-4 bold manbrew__load_from_url pl-0 clickable"></span>`)
				.text(it._brewName)
				.click(() => BrewUtil.addBrewRemote($btnAdd, it.download_url || "", true));

			const $li = $$`<li class="not-clickable lst--border lst__row--focusable" tabindex="1">
				<div class="lst__wrp-cells">
					${$btnAdd}
					<span class="col-3">${it._brewAuthor}</span>
					<span class="col-1-2 text-center">${it._brewCat}</span>
					<span class="col-1-4 text-center">${timestampModified}</span>
					<span class="col-1-4 text-center">${timestampAdded}</span>
					<span class="col-1 manbrew__source text-center pr-0"><a href="${it.download_url}" target="_blank" rel="noopener noreferrer">View Raw</a></span>
				</div>
			</li>`;

			$li.keydown(evt => {
				switch (evt.which) {
					case 13: { // enter
						return $btnAdd.click()
					}
					case 38: { // up
						const ixCur = list.visibleItems.indexOf(listItem);
						if (~ixCur) {
							const prevItem = list.visibleItems[ixCur - 1];
							if (prevItem) prevItem.ele.focus();
						} else {
							const firstItem = list.visibleItems[0];
							if (firstItem) firstItem.ele.focus();
						}
						return;
					}
					case 40: { // down
						const ixCur = list.visibleItems.indexOf(listItem);
						if (~ixCur) {
							const nxtItem = list.visibleItems[ixCur + 1];
							if (nxtItem) nxtItem.ele.focus();
						} else {
							const lastItem = list.visibleItems.last();
							if (lastItem) lastItem.ele.focus();
						}
					}
				}
			});

			const listItem = new ListItem(
				i,
				$li,
				it._brewName,
				{
					author: it._brewAuthor,
					category: it._brewCat,
					added: timestampAdded,
					modified: timestampAdded,
				},
				{
					$btnAdd,
					isSample: it._brewAuthor.toLowerCase().startsWith("sample -"),
				},
			);
			list.addItem(listItem);
		});

		list.init();

		$btnAll.prop("disabled", false).click(() => list.visibleItems.filter(it => !it.data.isSample).forEach(it => it.data.$btnAdd.click()));

		if ($btnToggleDisplayNonPageBrews) {
			$btnToggleDisplayNonPageBrews
				.prop("disabled", false)
				.click(() => {
					$btnToggleDisplayNonPageBrews.toggleClass("active");
					doClose();
					BrewUtil._pHandleClickBtnGet({
						...opts,
						isShowAll: !$btnToggleDisplayNonPageBrews.hasClass("active"),
					});
				});
		}

		$iptSearch.focus();
	},

	_$getBtnDeleteAll (isModal) {
		return $(`<button class="btn ${isModal ? "btn-xs" : "btn-sm ml-2"} btn-danger">Delete All</button>`)
			.click(async () => {
				if (!window.confirm("Are you sure?")) return;
				await StorageUtil.pSet(VeCt.STORAGE_HOMEBREW, {});
				StorageUtil.syncSet(VeCt.STORAGE_HOMEBREW_META, {});
				window.location.hash = "";
				location.reload();
			});
	},

	async _pCleanSaveBrew () {
		const cpy = MiscUtil.copy(BrewUtil.homebrew);
		BrewUtil._STORABLE.forEach(prop => {
			(cpy[prop] || []).forEach(ent => {
				Object.keys(ent).filter(k => k.startsWith("_")).forEach(k => delete ent[k]);
			});
		});
		await StorageUtil.pSet(VeCt.STORAGE_HOMEBREW, cpy);
	},

	async _pRenderBrewScreen_pDeleteSource ($brewList, source, doConfirm, isAllSources) {
		if (doConfirm && !window.confirm(`Are you sure you want to remove all homebrew${!isAllSources ? ` with${source ? ` source "${Parser.sourceJsonToFull(source)}"` : `out a source`}` : ""}?`)) return;

		const vetoolsSourceSet = new Set(BrewUtil._getActiveVetoolsSources().map(it => it.json));
		const isMatchingSource = (itSrc) => isAllSources || (itSrc === source || (source === undefined && !vetoolsSourceSet.has(itSrc) && !BrewUtil.hasSourceJson(itSrc)));

		await Promise.all(BrewUtil._getBrewCategories().map(async k => {
			const cat = BrewUtil.homebrew[k];
			const pDeleteFn = BrewUtil._getPDeleteFunction(k);
			const toDel = [];
			cat.filter(it => isMatchingSource(it.source)).forEach(it => toDel.push(it.uniqueId));
			await Promise.all(toDel.map(async uId => pDeleteFn(uId)));
		}));
		if (BrewUtil._lists) BrewUtil._lists.forEach(l => l.update());
		BrewUtil._persistHomebrewDebounced();
		BrewUtil.removeJsonSource(source);
		// remove the source from the filters and re-render the filter box
		if (BrewUtil._sourceFilter) BrewUtil._sourceFilter.removeItem(source);
		if (BrewUtil._filterBox) BrewUtil._filterBox.render();
		await BrewUtil._pRenderBrewScreen_pRefreshBrewList($brewList);
		window.location.hash = "";
		if (BrewUtil._filterBox) BrewUtil._filterBox.fireChangeEvent();
	},

	async _pRenderBrewScreen_pRefreshBrewList ($brewList) {
		function showSourceManager (source, showAll) {
			const $wrpBtnDel = $(`<div class="flex-v-center"></div>`);

			const {$modalInner, doClose} = UiUtil.getShowModal({
				isHeight100: true,
				title: `View/Manage ${source ? `Source Contents: ${Parser.sourceJsonToFull(source)}` : showAll ? "Entries from All Sources" : `Entries with No Source`}`,
				isUncappedHeight: true,
				isWidth100: true,
				overlayColor: "transparent",
				$titleSplit: $wrpBtnDel,
				isHeaderBorder: true,
			});

			const $cbAll = $(`<input type="checkbox">`);
			const $ulRows = $$`<ul class="list"></ul>`;
			const $iptSearch = $(`<input type="search" class="search manbrew__search form-control w-100 mt-1" placeholder="Search entries...">`);
			const $wrpBtnsSort = $$`<div class="filtertools manbrew__filtertools btn-group">
				<button class="col-6 sort btn btn-default btn-xs" data-sort="name">Name</button>
				<button class="col-5 sort btn btn-default btn-xs" data-sort="category">Category</button>
				<label class="wrp-cb-all pr-0 flex-vh-center mb-0 h-100">${$cbAll}</label>
			</div>`;
			$$($modalInner)`
				${$iptSearch}
				${$wrpBtnsSort}
				${$ulRows}`;

			let list;

			// populate list
			function populateList () {
				$ulRows.empty();

				list = new List({
					$iptSearch,
					$wrpList: $ulRows,
					fnSort: SortUtil.listSort,
				});

				ListUiUtil.bindSelectAllCheckbox($cbAll.off("change"), list);

				function mapCategoryEntry (cat, bru) {
					const out = {};
					out.name = bru.name;
					out.uniqueId = bru.uniqueId;
					out.extraInfo = "";
					switch (cat) {
						case "subclass":
							out.extraInfo = ` (${bru.class})`;
							break;
						case "subrace":
							out.extraInfo = ` (${(bru.race || {}).name})`;
							break;
						case "psionic":
							out.extraInfo = ` (${Parser.psiTypeToMeta(bru.type).short})`;
							break;
						case "itemProperty": {
							if (bru.entries) out.name = Renderer.findName(bru.entries);
							if (!out.name) out.name = bru.abbreviation;
							break;
						}
						case "adventureData":
						case "bookData": {
							const assocData = {
								"adventureData": "adventure",
								"bookData": "book",
							};
							out.name = (((BrewUtil.homebrew[assocData[cat]] || []).find(a => a.id === bru.id) || {}).name || bru.id);
						}
					}
					out.name = out.name || `(Unknown)`;
					return out;
				}

				const vetoolsSourceSet = new Set(BrewUtil._getActiveVetoolsSources().map(it => it.json));

				const isMatchingSource = (itSrc) => showAll || (itSrc === source || (source === undefined && !vetoolsSourceSet.has(itSrc) && !BrewUtil.hasSourceJson(itSrc)));
				BrewUtil._getBrewCategories().forEach(cat => {
					BrewUtil.homebrew[cat]
						.filter(it => isMatchingSource(it.source))
						.map(it => mapCategoryEntry(cat, it))
						.sort((a, b) => SortUtil.ascSort(a.name, b.name))
						.forEach((it, i) => {
							const dispCat = BrewUtil._pRenderBrewScreen_getDisplayCat(cat, true);

							const eleLi = document.createElement("li");
							eleLi.className = "row px-0";

							eleLi.innerHTML = `<label class="lst--border no-select mb-0 flex-v-center">
								<div class="col-6 bold">${it.name}</div>
								<div class="col-5 flex-vh-center">${dispCat}${it.extraInfo}</div>
								<div class="pr-0 col-1 flex-vh-center"><input type="checkbox" class="no-events"></div>
							</label>`;

							const listItem = new ListItem(
								i,
								eleLi,
								it.name,
								{
									category: dispCat,
									category_raw: cat,
								},
								{
									uniqueId: it.uniqueId,
									cbSel: eleLi.firstElementChild.children[2].firstElementChild,
								},
							);
							list.addItem(listItem);

							eleLi.addEventListener("click", evt => ListUiUtil.handleSelectClick(list, listItem, evt));
						});
				});
				$ulRows.empty();

				list.init();
				if (!list.items.length) $ulRows.append(`<h5 class="text-center">No results found.</h5>`);
				SortUtil.initBtnSortHandlers($wrpBtnsSort, list);
			}
			populateList();

			$(`<button class="btn btn-danger btn-xs">Delete Selected</button>`).on("click", async () => {
				const toDel = list.items.filter(it => $(it.ele).find(`input`).prop("checked")).map(it => ({...it.values, ...it.data}));

				if (!toDel.length) return;
				if (!window.confirm(`Are you sure you want to delete the ${toDel.length} selected item${toDel.length === 1 ? "" : "s"}?`)) return;

				if (toDel.length === list.items.length) {
					await BrewUtil._pRenderBrewScreen_pDeleteSource($brewList, source, false, false);
					doClose();
				} else {
					await Promise.all(toDel.map(async it => {
						const pDeleteFn = BrewUtil._getPDeleteFunction(it.category_raw);
						await pDeleteFn(it.uniqueId);
					}));
					if (BrewUtil._lists) BrewUtil._lists.forEach(l => l.update());
					BrewUtil._persistHomebrewDebounced();
					populateList();
					await BrewUtil._pRenderBrewScreen_pRefreshBrewList($brewList);
					window.location.hash = "";
				}
			}).appendTo($wrpBtnDel);

			$iptSearch.focus();
		}

		$brewList.empty();
		if (!BrewUtil.homebrew) return;

		const $iptSearch = $(`<input type="search" class="search manbrew__search form-control" placeholder="Search active homebrew...">`);
		const $wrpList = $(`<ul class="list-display-only brew-list brew-list--target manbrew__list"></ul>`);
		const $ulGroup = $(`<ul class="list-display-only brew-list brew-list--groups no-shrink" style="height: initial;"></ul>`);

		const list = new List({$iptSearch, $wrpList, isUseJquery: true});

		const $lst = $$`
			<div class="flex-col h-100">
				${$iptSearch}
				<div class="filtertools manbrew__filtertools btn-group input-group input-group--bottom flex no-shrink">
					<button class="col-5 sort btn btn-default btn-xs ve-grow" data-sort="source">Source</button>
					<button class="col-4 sort btn btn-default btn-xs" data-sort="authors">Authors</button>
					<button class="col-1 btn btn-default btn-xs" disabled>Origin</button>
					<button class="col-2 ve-grow btn btn-default btn-xs" disabled>&nbsp;</button>
				</div>
				<div class="flex w-100 h-100 overflow-y-auto relative">${$wrpList}</div>
			</div>
		`.appendTo($brewList);
		$ulGroup.appendTo($brewList);
		SortUtil.initBtnSortHandlers($lst.find(".manbrew__filtertools"), list);

		const createButtons = (src, $row) => {
			const $btnViewManage = $(`<button class="btn btn-sm btn-default">View/Manage</button>`)
				.on("click", () => {
					showSourceManager(src.json, src._all);
				});

			const $btnDeleteAll = $(`<button class="btn btn-danger btn-sm"><span class="glyphicon glyphicon-trash"></span></button>`)
				.on("click", () => BrewUtil._pRenderBrewScreen_pDeleteSource($brewList, src.json, true, src._all));

			$$`<div class="flex-h-right flex-v-center btn-group">
				${$btnViewManage}
				${$btnDeleteAll}
			</div>`.appendTo($row);
		};

		const brewSources = MiscUtil.copy(BrewUtil.getJsonSources())
			.filter(src => BrewUtil._isSourceRelevantForCurrentPage(src.json));
		brewSources.sort((a, b) => SortUtil.ascSort(a.full, b.full));

		brewSources.forEach((src, i) => {
			const validAuthors = (!src.authors ? [] : !(src.authors instanceof Array) ? [] : src.authors).join(", ");
			const isGroup = src._unknown || src._all;

			const $row = $(`<li class="row manbrew__row lst--border">
				<span class="col-5 manbrew__col--tall source manbrew__source">${isGroup ? "<i>" : ""}${src.full}${isGroup ? "</i>" : ""}</span>
				<span class="col-4 manbrew__col--tall authors">${validAuthors}</span>
				<${src.url ? "a" : "span"} class="col-1 manbrew__col--tall text-center" ${src.url ? `href="${src.url}" target="_blank" rel="noopener noreferrer"` : ""}>${src.url ? "View Source" : ""}</${src.url ? "a" : "span"}>
				<span class="hidden">${src.abbreviation}</span>
			</li>`);
			createButtons(src, $row);

			const listItem = new ListItem(
				i,
				$row,
				src.full,
				{
					authors: validAuthors,
					abbreviation: src.abbreviation,
				},
			);
			list.addItem(listItem);
		});

		const createGroupRow = (fullText, modeProp) => {
			const $row = $(`<div class="row manbrew__row flex-h-right">
				<div class="manbrew__col--tall source manbrew__source text-right"><i class="mr-3">${fullText}</i></div>
			</div>`);
			createButtons({[modeProp]: true}, $row);
			$ulGroup.append($row);
		};
		createGroupRow("Entries From All Sources", "_all");
		createGroupRow("Entries Without Sources", "_unknown");

		list.init();
		$iptSearch.focus();
	},

	_isSourceRelevantForCurrentPage (source) {
		const cats = BrewUtil.getPageProps();
		return !!cats.find(cat => !!(BrewUtil.homebrew[cat] || []).some(entry => (entry.inherits ? entry.inherits.source : entry.source) === source));
	},

	getPageProps (page) {
		page = BrewUtil._PAGE || page || UrlUtil.getCurrentPage();

		const _PG_SPELLS = ["spell"];
		const _PG_BESTIARY = ["monster", "legendaryGroup", "monsterFluff"];

		switch (page) {
			case UrlUtil.PG_SPELLS: return _PG_SPELLS;
			case UrlUtil.PG_CLASSES: return ["class", "subclass", "classFeature", "subclassFeature"];
			case UrlUtil.PG_BESTIARY: return _PG_BESTIARY;
			case UrlUtil.PG_BACKGROUNDS: return ["background"];
			case UrlUtil.PG_FEATS: return ["feat"];
			case UrlUtil.PG_OPT_FEATURES: return ["optionalfeature"];
			case UrlUtil.PG_RACES: return ["race", "raceFluff", "subrace"];
			case UrlUtil.PG_OBJECTS: return ["object"];
			case UrlUtil.PG_TRAPS_HAZARDS: return ["trap", "hazard"];
			case UrlUtil.PG_DEITIES: return ["deity"];
			case UrlUtil.PG_ITEMS: return ["item", "baseitem", "variant", "itemProperty", "itemType", "itemFluff"];
			case UrlUtil.PG_REWARDS: return ["reward"];
			case UrlUtil.PG_PSIONICS: return ["psionic"];
			case UrlUtil.PG_VARIANTRULES: return ["variantrule"];
			case UrlUtil.PG_CONDITIONS_DISEASES: return ["condition", "disease", "status"];
			case UrlUtil.PG_ADVENTURES: return ["adventure", "adventureData"];
			case UrlUtil.PG_BOOKS: return ["book", "bookData"];
			case UrlUtil.PG_TABLES: return ["table", "tableGroup"];
			case UrlUtil.PG_MAKE_BREW: return [
				..._PG_SPELLS,
				..._PG_BESTIARY,
				"makebrewCreatureTrait",
			];
			case UrlUtil.PG_MANAGE_BREW:
			case UrlUtil.PG_DEMO_RENDER: return BrewUtil._STORABLE;
			case UrlUtil.PG_VEHICLES: return ["vehicle"];
			case UrlUtil.PG_ACTIONS: return ["action"];
			case UrlUtil.PG_CULTS_BOONS: return ["cult", "boon"];
			case UrlUtil.PG_LANGUAGES: return ["language"];
			default: throw new Error(`No homebrew properties defined for category ${page}`);
		}
	},

	dirToProp (dir) {
		if (!dir) return "";
		else if (BrewUtil._STORABLE.includes(dir)) return dir;
		else {
			switch (dir) {
				case "creature": return "monster";
				case "collection": return dir;
				case "magicvariant": return "variant";
				case "makebrew": return "makebrewCreatureTrait";
			}
			throw new Error(`Directory was not mapped to a category: "${dir}"`);
		}
	},

	_pRenderBrewScreen_getDisplayCat (cat, isManager) {
		if (cat === "variantrule") return "Variant Rule";
		if (cat === "legendaryGroup") return "Legendary Group";
		if (cat === "optionalfeature") return "Optional Feature";
		if (cat === "adventure") return isManager ? "Adventure Contents/Info" : "Adventure";
		if (cat === "adventureData") return "Adventure Text";
		if (cat === "book") return isManager ? "Book Contents/Info" : "Book";
		if (cat === "bookData") return "Book Text";
		if (cat === "itemProperty") return "Item Property";
		if (cat === "baseitem") return "Base Item";
		if (cat === "variant") return "Magic Item Variant";
		if (cat === "monsterFluff") return "Monster Fluff";
		if (cat === "itemFluff") return "Item Fluff";
		if (cat === "makebrewCreatureTrait") return "Homebrew Builder Creature Trait";
		return cat.uppercaseFirst();
	},

	handleLoadbrewClick: async (ele, jsonUrl, name) => {
		const $ele = $(ele);
		if (!$ele.hasClass("rd__wrp-loadbrew--ready")) return; // an existing click is being handled
		const cached = $ele.html();
		const cachedTitle = $ele.title();
		$ele.title("");
		$ele.removeClass("rd__wrp-loadbrew--ready").html(`${name}<span class="glyphicon glyphicon-refresh rd__loadbrew-icon rd__loadbrew-icon--active"></span>`);
		jsonUrl = jsonUrl.unescapeQuotes();
		const data = await DataUtil.loadJSON(`${jsonUrl}?${(new Date()).getTime()}`);
		await BrewUtil.pDoHandleBrewJson(data, BrewUtil._PAGE || UrlUtil.getCurrentPage());
		$ele.html(`${name}<span class="glyphicon glyphicon-saved rd__loadbrew-icon"></span>`);
		setTimeout(() => $ele.html(cached).addClass("rd__wrp-loadbrew--ready").title(cachedTitle), 500);
	},

	async _pDoRemove (arrName, uniqueId, isChild) {
		function getIndex (arrName, uniqueId, isChild) {
			return BrewUtil.homebrew[arrName].findIndex(it => isChild ? it.parentUniqueId : it.uniqueId === uniqueId);
		}

		const index = getIndex(arrName, uniqueId, isChild);
		if (~index) {
			const toRemove = BrewUtil.homebrew[arrName][index];
			BrewUtil.homebrew[arrName].splice(index, 1);
			if (BrewUtil._lists) {
				BrewUtil._lists.forEach(l => l.removeItemByData(isChild ? "parentuniqueId" : "uniqueId", uniqueId));
			}
			return toRemove;
		}
	},

	_getPDeleteFunction (category) {
		switch (category) {
			case "spell":
			case "monster":
			case "monsterFluff":
			case "background":
			case "feat":
			case "optionalfeature":
			case "raceFluff":
			case "subrace":
			case "object":
			case "trap":
			case "hazard":
			case "deity":
			case "item":
			case "baseitem":
			case "variant":
			case "itemType":
			case "itemProperty":
			case "itemFluff":
			case "reward":
			case "psionic":
			case "variantrule":
			case "legendaryGroup":
			case "condition":
			case "disease":
			case "status":
			case "table":
			case "tableGroup":
			case "vehicle":
			case "action":
			case "cult":
			case "boon":
			case "language":
			case "class":
			case "makebrewCreatureTrait":
			case "classFeature":
			case "subclassFeature": return BrewUtil._genPDeleteGenericBrew(category);
			case "race": return BrewUtil._pDeleteRaceBrew;
			case "subclass": return BrewUtil._pDeleteSubclassBrew;
			case "adventure":
			case "book": return BrewUtil._genPDeleteGenericBookBrew(category);
			case "adventureData":
			case "bookData": return () => {}; // Do nothing, handled by deleting the associated book/adventure
			default: throw new Error(`No homebrew delete function defined for category ${category}`);
		}
	},

	async _pDeleteSubclassBrew (uniqueId) {
		let sc;
		let index = 0;
		for (; index < BrewUtil.homebrew.subclass.length; ++index) {
			if (BrewUtil.homebrew.subclass[index].uniqueId === uniqueId) {
				sc = BrewUtil.homebrew.subclass[index];
				break;
			}
		}

		if (sc) {
			const forClass = sc.class;
			BrewUtil.homebrew.subclass.splice(index, 1);
			BrewUtil._persistHomebrewDebounced();

			if (typeof ClassesPage === "undefined") return;
			await classesPage.pDeleteSubclassBrew(uniqueId, sc);
		}
	},

	async _pDeleteRaceBrew (uniqueId) {
		const removedRace = await BrewUtil._pDoRemove("race", uniqueId);
		if (!removedRace || !removedRace.subraces) return;
		if (typeof racesPage === "undefined" || !BrewUtil._lists) return;

		const subraceMetas = removedRace.subraces
			.map(it => ({name: it.name, source: it.source || removedRace.source}))
			.filter(it => it.name);
		if (!subraceMetas.length) return;

		const allAttachedRaces = racesPage.getMergedSubraces(uniqueId)
			.filter(it => subraceMetas.some(meta => meta.name === it._subraceName && meta.source === it.source))
			.filter(it => it.uniqueId);

		if (!allAttachedRaces) return;

		allAttachedRaces.forEach(attachedRace => {
			BrewUtil._lists.forEach(l => l.removeItemByData("uniqueId", attachedRace.uniqueId));
		});
	},

	_genPDeleteGenericBrew (category) {
		return async (uniqueId) => {
			await BrewUtil._pDoRemove(category, uniqueId);
		};
	},

	_genPDeleteGenericBookBrew (category) {
		return async (uniqueId) => {
			await BrewUtil._pDoRemove(category, uniqueId);
			await BrewUtil._pDoRemove(`${category}Data`, uniqueId, true);
		};
	},

	manageBrew: () => {
		const {$modalInner} = UiUtil.getShowModal({
			isHeight100: true,
			isWidth100: true,
			title: `Manage Homebrew`,
			isUncappedHeight: true,
			$titleSplit: BrewUtil._$getBtnDeleteAll(true),
			isHeaderBorder: true,
		});

		BrewUtil._pRenderBrewScreen($modalInner, {isModal: true});
	},

	async pAddEntry (prop, obj) {
		BrewUtil._mutUniqueId(obj);
		(BrewUtil.homebrew[prop] = BrewUtil.homebrew[prop] || []).push(obj);
		BrewUtil._persistHomebrewDebounced();
		return BrewUtil.homebrew[prop].length - 1;
	},

	async pRemoveEntry (prop, obj) {
		const ix = (BrewUtil.homebrew[prop] = BrewUtil.homebrew[prop] || []).findIndex(it => it.uniqueId === obj.uniqueId);
		if (~ix) {
			BrewUtil.homebrew[prop].splice(ix, 1);
			BrewUtil._persistHomebrewDebounced();
		} else throw new Error(`Could not find object with ID "${obj.uniqueId}" in "${prop}" list`);
	},

	getEntryIxByEntry (prop, obj) {
		return (BrewUtil.homebrew[prop] = BrewUtil.homebrew[prop] || []).findIndex(it => it.name === obj.name && it.source === obj.source);
	},

	async pUpdateEntryByIx (prop, ix, obj) {
		if (~ix && ix < BrewUtil.homebrew[prop].length) {
			BrewUtil._mutUniqueId(obj);
			BrewUtil.homebrew[prop].splice(ix, 1, obj);
			BrewUtil._persistHomebrewDebounced();
		} else throw new Error(`Index "${ix}" was not valid!`);
	},

	_mutUniqueId (obj) {
		delete obj.uniqueId; // avoid basing the hash on the previous hash
		obj.uniqueId = CryptUtil.md5(JSON.stringify(obj));
	},

	_DIRS: ["action", "adventure", "background", "book", "boon", "class", "condition", "creature", "cult", "deity", "disease", "feat", "hazard", "item", "language", "magicvariant", "makebrew", "object", "optionalfeature", "psionic", "race", "reward", "spell", /* "status", */ "subclass", "subrace", "table", "trap", "variantrule", "vehicle", "classFeature", "subclassFeature"],
	_STORABLE: ["class", "subclass", "classFeature", "subclassFeature", "spell", "monster", "legendaryGroup", "monsterFluff", "background", "feat", "optionalfeature", "race", "raceFluff", "subrace", "deity", "item", "baseitem", "variant", "itemProperty", "itemType", "itemFluff", "psionic", "reward", "object", "trap", "hazard", "variantrule", "condition", "disease", "status", "adventure", "adventureData", "book", "bookData", "table", "tableGroup", "vehicle", "action", "cult", "boon", "language", "makebrewCreatureTrait"],
	async pDoHandleBrewJson (json, page, pFuncRefresh) {
		page = BrewUtil._PAGE || page;
		await BrewUtil._lockHandleBrewJson.pLock();
		try {
			return BrewUtil._pDoHandleBrewJson(json, page, pFuncRefresh);
		} finally {
			BrewUtil._lockHandleBrewJson.unlock();
		}
	},

	async _pDoHandleBrewJson (json, page, pFuncRefresh) {
		page = BrewUtil._PAGE || page;

		function storePrep (arrName) {
			if (json[arrName] != null && !(json[arrName] instanceof Array)) return;
			if (json[arrName]) {
				json[arrName].forEach(it => BrewUtil._mutUniqueId(it));
			} else json[arrName] = [];
		}

		// prepare for storage
		BrewUtil._STORABLE.forEach(storePrep);

		const bookPairs = [
			["adventure", "adventureData"],
			["book", "bookData"],
		];
		bookPairs.forEach(([bookMetaKey, bookDataKey]) => {
			if (json[bookMetaKey] && json[bookDataKey]) {
				json[bookMetaKey].forEach(book => {
					const data = json[bookDataKey].find(it => it.id === book.id);
					if (data) {
						data.parentUniqueId = book.uniqueId;
					}
				});
			}
		});

		// store
		async function pCheckAndAdd (prop) {
			if (!BrewUtil.homebrew[prop]) BrewUtil.homebrew[prop] = [];
			if (!(json[prop] instanceof Array)) return [];
			if (IS_DEPLOYED || IS_VTT) {
				// in production mode, skip any existing brew
				const areNew = [];
				const existingIds = BrewUtil.homebrew[prop].map(it => it.uniqueId);
				json[prop].forEach(it => {
					if (!existingIds.find(id => it.uniqueId === id)) {
						BrewUtil.homebrew[prop].push(it);
						areNew.push(it);
					}
				});
				return areNew;
			} else {
				// in development mode, replace any existing brew
				const existing = {};
				BrewUtil.homebrew[prop].forEach(it => {
					existing[it.source] = (existing[it.source] || {});
					existing[it.source][it.name] = it.uniqueId;
				});
				const pDeleteFn = BrewUtil._getPDeleteFunction(prop);
				await Promise.all(json[prop].map(async it => {
					// Handle magic variants
					const itSource = it.inherits && it.inherits.source ? it.inherits.source : it.source;
					if (existing[itSource] && existing[itSource][it.name]) {
						await pDeleteFn(existing[itSource][it.name]);
					}
					BrewUtil.homebrew[prop].push(it);
				}));
				return json[prop];
			}
		}

		function checkAndAddMetaGetNewSources () {
			const areNew = [];
			if (json._meta) {
				if (!BrewUtil.homebrewMeta) BrewUtil.homebrewMeta = {sources: []};

				Object.keys(json._meta).forEach(k => {
					switch (k) {
						case "dateAdded":
						case "dateLastModified":
							break;
						case "sources": {
							const existing = BrewUtil.homebrewMeta.sources.map(src => src.json);
							json._meta.sources.forEach(src => {
								if (!existing.find(it => it === src.json)) {
									BrewUtil.homebrewMeta.sources.push(src);
									areNew.push(src);
								}
							});
							break;
						}
						default: {
							BrewUtil.homebrewMeta[k] = BrewUtil.homebrewMeta[k] || {};
							Object.assign(BrewUtil.homebrewMeta[k], json._meta[k]);
							break;
						}
					}
				});
			}
			return areNew;
		}

		let sourcesToAdd = json._meta ? json._meta.sources : [];
		const toAdd = {};
		BrewUtil._STORABLE.filter(k => json[k] instanceof Array).forEach(k => toAdd[k] = json[k]);
		BrewUtil.homebrew = BrewUtil.homebrew || {};
		sourcesToAdd = checkAndAddMetaGetNewSources(); // adding source(s) to Filter should happen in per-page addX functions
		await Promise.all(BrewUtil._STORABLE.map(async k => toAdd[k] = await pCheckAndAdd(k))); // only add if unique ID not already present
		BrewUtil._persistHomebrewDebounced(); // Debounce this for mass adds, e.g. "Add All"
		StorageUtil.syncSet(VeCt.STORAGE_HOMEBREW_META, BrewUtil.homebrewMeta);

		// wipe old cache
		BrewUtil._resetSourceCache();

		// display on page
		switch (page) {
			case UrlUtil.PG_SPELLS:
			case UrlUtil.PG_CLASSES:
			case UrlUtil.PG_BESTIARY:
			case UrlUtil.PG_BACKGROUNDS:
			case UrlUtil.PG_FEATS:
			case UrlUtil.PG_OPT_FEATURES:
			case UrlUtil.PG_RACES:
			case UrlUtil.PG_OBJECTS:
			case UrlUtil.PG_TRAPS_HAZARDS:
			case UrlUtil.PG_DEITIES:
			case UrlUtil.PG_ITEMS:
			case UrlUtil.PG_REWARDS:
			case UrlUtil.PG_PSIONICS:
			case UrlUtil.PG_VARIANTRULES:
			case UrlUtil.PG_CONDITIONS_DISEASES:
			case UrlUtil.PG_ADVENTURE:
			case UrlUtil.PG_ADVENTURES:
			case UrlUtil.PG_BOOK:
			case UrlUtil.PG_BOOKS:
			case UrlUtil.PG_TABLES:
			case UrlUtil.PG_VEHICLES:
			case UrlUtil.PG_ACTIONS:
			case UrlUtil.PG_CULTS_BOONS:
			case UrlUtil.PG_LANGUAGES:
				await (BrewUtil._pHandleBrew || handleBrew)(MiscUtil.copy(toAdd));
				break;
			case UrlUtil.PG_MAKE_BREW:
				if (BrewUtil._pHandleBrew) await BrewUtil._pHandleBrew(MiscUtil.copy(toAdd));
				break;
			case UrlUtil.PG_MANAGE_BREW:
			case UrlUtil.PG_DEMO_RENDER:
			case VeCt.PG_NONE:
				// No-op
				break;
			default:
				throw new Error(`No homebrew add function defined for category ${page}`);
		}

		if (pFuncRefresh) await pFuncRefresh();

		if (BrewUtil._filterBox && BrewUtil._sourceFilter) {
			const cur = BrewUtil._filterBox.getValues();
			if (cur.Source) {
				const toSet = JSON.parse(JSON.stringify(cur.Source));

				if (toSet._totals.yes || toSet._totals.no) {
					if (page === UrlUtil.PG_CLASSES) toSet["Core"] = 1;
					else sourcesToAdd.forEach(src => toSet[src.json] = 1);
					BrewUtil._filterBox.setFromValues({Source: toSet});
				}
			}
			if (BrewUtil._filterBox) BrewUtil._filterBox.fireChangeEvent();
		}
	},

	makeBrewButton: (id) => {
		$(`#${id}`).on("click", () => BrewUtil.manageBrew());
	},

	_getBrewCategories () {
		return Object.keys(BrewUtil.homebrew).filter(it => !it.startsWith("_"));
	},

	// region sources
	_buildSourceCache () {
		function doBuild () {
			if (BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.sources) {
				BrewUtil.homebrewMeta.sources.forEach(src => BrewUtil._sourceCache[src.json.toLowerCase()] = ({...src}));
			}
		}

		if (!BrewUtil._sourceCache) {
			BrewUtil._sourceCache = {};

			if (!BrewUtil.homebrewMeta) {
				const temp = StorageUtil.syncGet(VeCt.STORAGE_HOMEBREW_META) || {};
				temp.sources = temp.sources || [];
				BrewUtil.homebrewMeta = temp;
				doBuild();
			} else {
				doBuild();
			}
		}
	},

	_resetSourceCache () {
		BrewUtil._sourceCache = null;
	},

	removeJsonSource (source) {
		if (!source) return;
		source = source.toLowerCase();
		BrewUtil._resetSourceCache();
		const ix = BrewUtil.homebrewMeta.sources.findIndex(it => it.json.toLowerCase() === source);
		if (~ix) BrewUtil.homebrewMeta.sources.splice(ix, 1);
		StorageUtil.syncSet(VeCt.STORAGE_HOMEBREW_META, BrewUtil.homebrewMeta);
	},

	getJsonSources () {
		BrewUtil._buildSourceCache();
		return BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.sources ? BrewUtil.homebrewMeta.sources : [];
	},

	hasSourceJson (source) {
		if (!source) return false;
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		return !!BrewUtil._sourceCache[source];
	},

	sourceJsonToFull (source) {
		if (!source) return "";
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		return BrewUtil._sourceCache[source] ? BrewUtil._sourceCache[source].full || source : source;
	},

	sourceJsonToAbv (source) {
		if (!source) return "";
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		return BrewUtil._sourceCache[source] ? BrewUtil._sourceCache[source].abbreviation || source : source;
	},

	sourceJsonToDate (source) {
		if (!source) return "";
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		return BrewUtil._sourceCache[source] ? BrewUtil._sourceCache[source].dateReleased || source : source;
	},

	sourceJsonToSource (source) {
		if (!source) return null;
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		return BrewUtil._sourceCache[source] ? BrewUtil._sourceCache[source] : null;
	},

	sourceJsonToStyle (source) {
		if (!source) return "";
		source = source.toLowerCase();
		const color = BrewUtil.sourceJsonToColor(source);
		if (color) return `style="color: #${color}; border-color: #${color}; text-decoration-color: #${color};"`;
		return "";
	},

	sourceJsonToColor (source) {
		if (!source) return "";
		source = source.toLowerCase();
		BrewUtil._buildSourceCache();
		if (BrewUtil._sourceCache[source] && BrewUtil._sourceCache[source].color) {
			const validColor = BrewUtil.getValidColor(BrewUtil._sourceCache[source].color);
			if (validColor.length) return validColor;
			return "";
		} else return "";
	},

	getValidColor (color) {
		// Prevent any injection shenanigans
		return color.replace(/[^a-fA-F0-9]/g, "").slice(0, 8);
	},

	addSource (sourceObj) {
		BrewUtil._resetSourceCache();
		const exists = BrewUtil.homebrewMeta.sources.some(it => it.json === sourceObj.json);
		if (exists) throw new Error(`Source "${sourceObj.json}" already exists!`);
		(BrewUtil.homebrewMeta.sources = BrewUtil.homebrewMeta.sources || []).push(sourceObj);
		StorageUtil.syncSet(VeCt.STORAGE_HOMEBREW_META, BrewUtil.homebrewMeta);
	},

	updateSource (sourceObj) {
		BrewUtil._resetSourceCache();
		const ix = BrewUtil.homebrewMeta.sources.findIndex(it => it.json === sourceObj.json);
		if (!~ix) throw new Error(`Source "${sourceObj.json}" does not exist!`);
		const json = BrewUtil.homebrewMeta.sources[ix].json;
		BrewUtil.homebrewMeta.sources[ix] = {
			...sourceObj,
			json,
		};
		StorageUtil.syncSet(VeCt.STORAGE_HOMEBREW_META, BrewUtil.homebrewMeta);
	},

	_getActiveVetoolsSources () {
		if (BrewUtil.homebrew === null) throw new Error(`Homebrew was not initialized!`);

		const allActiveSources = new Set();
		Object.keys(BrewUtil.homebrew).forEach(k => BrewUtil.homebrew[k].forEach(it => it.source && allActiveSources.add(it.source)));
		return Object.keys(Parser.SOURCE_JSON_TO_FULL).map(k => ({
			json: k,
			full: Parser.SOURCE_JSON_TO_FULL[k],
			abbreviation: Parser.SOURCE_JSON_TO_ABV[k],
			dateReleased: Parser.SOURCE_JSON_TO_DATE[k],
		})).sort((a, b) => SortUtil.ascSort(a.full, b.full)).filter(it => allActiveSources.has(it.json));
	},
	// endregion

	/**
	 * Get data in a format similar to the main search index
	 */
	async pGetSearchIndex () {
		BrewUtil._buildSourceCache();
		const indexer = new Omnidexer(Omnisearch.highestId + 1);

		await BrewUtil.pAddBrewData();
		if (BrewUtil.homebrew) {
			const INDEX_DEFINITIONS = [Omnidexer.TO_INDEX__FROM_INDEX_JSON, Omnidexer.TO_INDEX];

			// Run these in serial, to prevent any ID race condition antics
			for (const IX_DEF of INDEX_DEFINITIONS) {
				for (const arbiter of IX_DEF) {
					if (!(BrewUtil.homebrew[arbiter.brewProp || arbiter.listProp] || []).length) continue;

					if (arbiter.pFnPreProcBrew) {
						const toProc = await arbiter.pFnPreProcBrew.bind(arbiter)(BrewUtil.homebrew);
						await indexer.pAddToIndex(arbiter, toProc)
					} else {
						await indexer.pAddToIndex(arbiter, BrewUtil.homebrew)
					}
				}
			}
		}

		return Omnidexer.decompressIndex(indexer.getIndex());
	},

	async pGetAdditionalSearchIndices (highestId, addiProp) {
		BrewUtil._buildSourceCache();
		const indexer = new Omnidexer(highestId + 1);

		await BrewUtil.pAddBrewData();
		if (BrewUtil.homebrew) {
			const INDEX_DEFINITIONS = [Omnidexer.TO_INDEX__FROM_INDEX_JSON, Omnidexer.TO_INDEX];

			await Promise.all(INDEX_DEFINITIONS.map(IXDEF => {
				return Promise.all(IXDEF
					.filter(ti => ti.additionalIndexes && (BrewUtil.homebrew[ti.listProp] || []).length)
					.map(ti => {
						return Promise.all(Object.entries(ti.additionalIndexes).filter(([prop]) => prop === addiProp).map(async ([prop, pGetIndex]) => {
							const toIndex = await pGetIndex(indexer, {[ti.listProp]: BrewUtil.homebrew[ti.listProp]});
							toIndex.forEach(add => indexer.pushToIndex(add));
						}));
					}));
			}));
		}
		return Omnidexer.decompressIndex(indexer.getIndex());
	},

	async pGetAlternateSearchIndices (highestId, altProp) {
		BrewUtil._buildSourceCache();
		const indexer = new Omnidexer(highestId + 1);

		await BrewUtil.pAddBrewData();
		if (BrewUtil.homebrew) {
			const INDEX_DEFINITIONS = [Omnidexer.TO_INDEX__FROM_INDEX_JSON, Omnidexer.TO_INDEX];

			for (const IXDEF of INDEX_DEFINITIONS) {
				const filteredIxDef = IXDEF.filter(ti => ti.alternateIndexes && (BrewUtil.homebrew[ti.listProp] || []).length);

				for (const ti of filteredIxDef) {
					const filteredAltIndexes = Object.entries(ti.alternateIndexes)
						.filter(([prop]) => prop === altProp);
					for (const tuple of filteredAltIndexes) {
						const [prop, pGetIndex] = tuple;
						await indexer.pAddToIndex(ti, BrewUtil.homebrew, {alt: ti.alternateIndexes[prop]})
					}
				}
			}
		}

		return Omnidexer.decompressIndex(indexer.getIndex());
	},

	__pPersistHomebrewDebounced: null,
	_persistHomebrewDebounced () {
		if (BrewUtil.__pPersistHomebrewDebounced == null) {
			BrewUtil.__pPersistHomebrewDebounced = MiscUtil.debounce(() => BrewUtil._pCleanSaveBrew(), 125);
		}
		BrewUtil.__pPersistHomebrewDebounced();
	},
};

// ID GENERATION =======================================================================================================
CryptUtil = {
	// region md5 internals
	// stolen from http://www.myersdaily.org/joseph/javascript/md5.js
	_md5cycle: (x, k) => {
		let a = x[0];
		let b = x[1];
		let c = x[2];
		let d = x[3];

		a = CryptUtil._ff(a, b, c, d, k[0], 7, -680876936);
		d = CryptUtil._ff(d, a, b, c, k[1], 12, -389564586);
		c = CryptUtil._ff(c, d, a, b, k[2], 17, 606105819);
		b = CryptUtil._ff(b, c, d, a, k[3], 22, -1044525330);
		a = CryptUtil._ff(a, b, c, d, k[4], 7, -176418897);
		d = CryptUtil._ff(d, a, b, c, k[5], 12, 1200080426);
		c = CryptUtil._ff(c, d, a, b, k[6], 17, -1473231341);
		b = CryptUtil._ff(b, c, d, a, k[7], 22, -45705983);
		a = CryptUtil._ff(a, b, c, d, k[8], 7, 1770035416);
		d = CryptUtil._ff(d, a, b, c, k[9], 12, -1958414417);
		c = CryptUtil._ff(c, d, a, b, k[10], 17, -42063);
		b = CryptUtil._ff(b, c, d, a, k[11], 22, -1990404162);
		a = CryptUtil._ff(a, b, c, d, k[12], 7, 1804603682);
		d = CryptUtil._ff(d, a, b, c, k[13], 12, -40341101);
		c = CryptUtil._ff(c, d, a, b, k[14], 17, -1502002290);
		b = CryptUtil._ff(b, c, d, a, k[15], 22, 1236535329);

		a = CryptUtil._gg(a, b, c, d, k[1], 5, -165796510);
		d = CryptUtil._gg(d, a, b, c, k[6], 9, -1069501632);
		c = CryptUtil._gg(c, d, a, b, k[11], 14, 643717713);
		b = CryptUtil._gg(b, c, d, a, k[0], 20, -373897302);
		a = CryptUtil._gg(a, b, c, d, k[5], 5, -701558691);
		d = CryptUtil._gg(d, a, b, c, k[10], 9, 38016083);
		c = CryptUtil._gg(c, d, a, b, k[15], 14, -660478335);
		b = CryptUtil._gg(b, c, d, a, k[4], 20, -405537848);
		a = CryptUtil._gg(a, b, c, d, k[9], 5, 568446438);
		d = CryptUtil._gg(d, a, b, c, k[14], 9, -1019803690);
		c = CryptUtil._gg(c, d, a, b, k[3], 14, -187363961);
		b = CryptUtil._gg(b, c, d, a, k[8], 20, 1163531501);
		a = CryptUtil._gg(a, b, c, d, k[13], 5, -1444681467);
		d = CryptUtil._gg(d, a, b, c, k[2], 9, -51403784);
		c = CryptUtil._gg(c, d, a, b, k[7], 14, 1735328473);
		b = CryptUtil._gg(b, c, d, a, k[12], 20, -1926607734);

		a = CryptUtil._hh(a, b, c, d, k[5], 4, -378558);
		d = CryptUtil._hh(d, a, b, c, k[8], 11, -2022574463);
		c = CryptUtil._hh(c, d, a, b, k[11], 16, 1839030562);
		b = CryptUtil._hh(b, c, d, a, k[14], 23, -35309556);
		a = CryptUtil._hh(a, b, c, d, k[1], 4, -1530992060);
		d = CryptUtil._hh(d, a, b, c, k[4], 11, 1272893353);
		c = CryptUtil._hh(c, d, a, b, k[7], 16, -155497632);
		b = CryptUtil._hh(b, c, d, a, k[10], 23, -1094730640);
		a = CryptUtil._hh(a, b, c, d, k[13], 4, 681279174);
		d = CryptUtil._hh(d, a, b, c, k[0], 11, -358537222);
		c = CryptUtil._hh(c, d, a, b, k[3], 16, -722521979);
		b = CryptUtil._hh(b, c, d, a, k[6], 23, 76029189);
		a = CryptUtil._hh(a, b, c, d, k[9], 4, -640364487);
		d = CryptUtil._hh(d, a, b, c, k[12], 11, -421815835);
		c = CryptUtil._hh(c, d, a, b, k[15], 16, 530742520);
		b = CryptUtil._hh(b, c, d, a, k[2], 23, -995338651);

		a = CryptUtil._ii(a, b, c, d, k[0], 6, -198630844);
		d = CryptUtil._ii(d, a, b, c, k[7], 10, 1126891415);
		c = CryptUtil._ii(c, d, a, b, k[14], 15, -1416354905);
		b = CryptUtil._ii(b, c, d, a, k[5], 21, -57434055);
		a = CryptUtil._ii(a, b, c, d, k[12], 6, 1700485571);
		d = CryptUtil._ii(d, a, b, c, k[3], 10, -1894986606);
		c = CryptUtil._ii(c, d, a, b, k[10], 15, -1051523);
		b = CryptUtil._ii(b, c, d, a, k[1], 21, -2054922799);
		a = CryptUtil._ii(a, b, c, d, k[8], 6, 1873313359);
		d = CryptUtil._ii(d, a, b, c, k[15], 10, -30611744);
		c = CryptUtil._ii(c, d, a, b, k[6], 15, -1560198380);
		b = CryptUtil._ii(b, c, d, a, k[13], 21, 1309151649);
		a = CryptUtil._ii(a, b, c, d, k[4], 6, -145523070);
		d = CryptUtil._ii(d, a, b, c, k[11], 10, -1120210379);
		c = CryptUtil._ii(c, d, a, b, k[2], 15, 718787259);
		b = CryptUtil._ii(b, c, d, a, k[9], 21, -343485551);

		x[0] = CryptUtil._add32(a, x[0]);
		x[1] = CryptUtil._add32(b, x[1]);
		x[2] = CryptUtil._add32(c, x[2]);
		x[3] = CryptUtil._add32(d, x[3]);
	},

	_cmn: (q, a, b, x, s, t) => {
		a = CryptUtil._add32(CryptUtil._add32(a, q), CryptUtil._add32(x, t));
		return CryptUtil._add32((a << s) | (a >>> (32 - s)), b);
	},

	_ff: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn((b & c) | ((~b) & d), a, b, x, s, t);
	},

	_gg: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn((b & d) | (c & (~d)), a, b, x, s, t);
	},

	_hh: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn(b ^ c ^ d, a, b, x, s, t);
	},

	_ii: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn(c ^ (b | (~d)), a, b, x, s, t);
	},

	_md51: (s) => {
		let n = s.length;
		let state = [1732584193, -271733879, -1732584194, 271733878];
		let i;
		for (i = 64; i <= s.length; i += 64) {
			CryptUtil._md5cycle(state, CryptUtil._md5blk(s.substring(i - 64, i)));
		}
		s = s.substring(i - 64);
		let tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
		tail[i >> 2] |= 0x80 << ((i % 4) << 3);
		if (i > 55) {
			CryptUtil._md5cycle(state, tail);
			for (i = 0; i < 16; i++) tail[i] = 0;
		}
		tail[14] = n * 8;
		CryptUtil._md5cycle(state, tail);
		return state;
	},

	_md5blk: (s) => {
		let md5blks = [];
		for (let i = 0; i < 64; i += 4) {
			md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
		}
		return md5blks;
	},

	_hex_chr: "0123456789abcdef".split(""),

	_rhex: (n) => {
		let s = "";
		for (let j = 0; j < 4; j++) {
			s += CryptUtil._hex_chr[(n >> (j * 8 + 4)) & 0x0F] + CryptUtil._hex_chr[(n >> (j * 8)) & 0x0F];
		}
		return s;
	},

	_add32: (a, b) => {
		return (a + b) & 0xFFFFFFFF;
	},
	// endregion

	hex: (x) => {
		for (let i = 0; i < x.length; i++) {
			x[i] = CryptUtil._rhex(x[i]);
		}
		return x.join("");
	},

	hex2Dec (hex) {
		return parseInt(`0x${hex}`);
	},

	md5: (s) => {
		return CryptUtil.hex(CryptUtil._md51(s));
	},

	/**
	 * Based on Java's implementation.
	 * @param obj An object to hash.
	 * @return {*} An integer hashcode for the object.
	 */
	hashCode (obj) {
		if (typeof obj === "string") {
			if (!obj) return 0;
			let h = 0;
			for (let i = 0; i < obj.length; ++i) h = 31 * h + obj.charCodeAt(i);
			return h;
		} else if (typeof obj === "number") return obj;
		else throw new Error(`No hashCode implementation for ${obj}`);
	},

	uid () { // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
		if (RollerUtil.isCrypto()) {
			return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
		} else {
			let d = Date.now();
			if (typeof performance !== "undefined" && typeof performance.now === "function") {
				d += performance.now();
			}
			return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
				const r = (d + Math.random() * 16) % 16 | 0;
				d = Math.floor(d / 16);
				return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
			});
		}
	},
};

// COLLECTIONS =========================================================================================================
CollectionUtil = {
	ObjectSet: class ObjectSet {
		constructor () {
			this.map = new Map();
			this[Symbol.iterator] = this.values;
		}
		// Each inserted element has to implement _toIdString() method that returns a string ID.
		// Two objects are considered equal if their string IDs are equal.
		add (item) {
			this.map.set(item._toIdString(), item);
		}

		values () {
			return this.map.values();
		}
	},

	setEq (a, b) {
		if (a.size !== b.size) return false;
		for (const it of a) if (!b.has(it)) return false;
		return true;
	},

	setDiff (set1, set2) {
		return new Set([...set1].filter(it => !set2.has(it)));
	},

	deepEquals (a, b) {
		if (CollectionUtil._eq_sameValueZeroEqual(a, b)) return true;
		if (a && b && typeof a === "object" && typeof b === "object") {
			if (CollectionUtil._eq_isPlainObject(a) && CollectionUtil._eq_isPlainObject(b)) return CollectionUtil._eq_areObjectsEqual(a, b);
			const arrayA = Array.isArray(a);
			const arrayB = Array.isArray(b);
			if (arrayA || arrayB) return arrayA === arrayB && CollectionUtil._eq_areArraysEqual(a, b);
			const setA = a instanceof Set;
			const setB = b instanceof Set;
			if (setA || setB) return setA === setB && CollectionUtil.setEq(a, b);
			return CollectionUtil._eq_areObjectsEqual(a, b);
		}
		return false;
	},

	// This handles the NaN != NaN case; ignore linter complaints
	// eslint-disable-next-line no-self-compare
	_eq_sameValueZeroEqual: (a, b) => a === b || (a !== a && b !== b),
	_eq_isPlainObject: (value) => value.constructor === Object || value.constructor == null,
	_eq_areObjectsEqual (a, b) {
		const keysA = Object.keys(a);
		const {length} = keysA;
		if (Object.keys(b).length !== length) return false;
		for (let i = 0; i < length; i++) {
			if (!b.hasOwnProperty(keysA[i])) return false;
			if (!CollectionUtil.deepEquals(a[keysA[i]], b[keysA[i]])) return false;
		}
		return true;
	},
	_eq_areArraysEqual (a, b) {
		const {length} = a;
		if (b.length !== length) return false;
		for (let i = 0; i < length; i++) if (!CollectionUtil.deepEquals(a[i], b[i])) return false;
		return true;
	},
};

Array.prototype.last = Array.prototype.last || function (arg) {
	if (arg !== undefined) this[this.length - 1] = arg;
	else return this[this.length - 1];
};

Array.prototype.filterIndex = Array.prototype.filterIndex || function (fnCheck) {
	const out = [];
	this.forEach((it, i) => {
		if (fnCheck(it)) out.push(i);
	});
	return out;
};

Array.prototype.equals = Array.prototype.equals || function (array2) {
	const array1 = this;
	if (!array1 && !array2) return true;
	else if ((!array1 && array2) || (array1 && !array2)) return false;

	let temp = [];
	if ((!array1[0]) || (!array2[0])) return false;
	if (array1.length !== array2.length) return false;
	let key;
	// Put all the elements from array1 into a "tagged" array
	for (let i = 0; i < array1.length; i++) {
		key = `${(typeof array1[i])}~${array1[i]}`; // Use "typeof" so a number 1 isn't equal to a string "1".
		if (temp[key]) temp[key]++;
		else temp[key] = 1;
	}
	// Go through array2 - if same tag missing in "tagged" array, not equal
	for (let i = 0; i < array2.length; i++) {
		key = `${(typeof array2[i])}~${array2[i]}`;
		if (temp[key]) {
			if (temp[key] === 0) return false;
			else temp[key]--;
		} else return false;
	}
	return true;
};

Array.prototype.partition = Array.prototype.partition || function (fnIsValid) {
	return this.reduce(([pass, fail], elem) => fnIsValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]], [[], []]);
};

Array.prototype.getNext = Array.prototype.getNext || function (curVal) {
	let ix = this.indexOf(curVal);
	if (!~ix) throw new Error("Value was not in array!");
	if (++ix >= this.length) ix = 0;
	return this[ix];
};

Array.prototype.shuffle = Array.prototype.shuffle || function () {
	for (let i = 0; i < 10000; ++i) this.sort(() => Math.random() - 0.5);
	return this;
};

/** Map each array item to a k:v pair, then flatten them into one object. */
Array.prototype.mergeMap = Array.prototype.mergeMap || function (fnMap) {
	return this.map((...args) => fnMap(...args)).reduce((a, b) => Object.assign(a, b), {});
};

/** Map each item via an async function, awaiting for each to complete before starting the next. */
Array.prototype.pSerialAwaitMap = Array.prototype.pSerialAwaitMap || async function (fnMap) {
	const out = [];
	const len = this.length;
	for (let i = 0; i < len; ++i) out.push(await fnMap(this[i], i));
	return out;
};

Array.prototype.unique = Array.prototype.unique || function (fnGetProp) {
	const seen = new Set();
	return this.filter((...args) => {
		const val = fnGetProp ? fnGetProp(...args) : args[0];
		if (seen.has(val)) return false;
		seen.add(val);
		return true;
	});
};

Array.prototype.zip = Array.prototype.zip || function (otherArray) {
	const out = [];
	const len = Math.max(this.length, otherArray.length);
	for (let i = 0; i < len; ++i) {
		out.push([this[i], otherArray[i]]);
	}
	return out;
};

Array.prototype.nextWrap = Array.prototype.nextWrap || function (item) {
	const ix = this.indexOf(item);
	if (~ix) {
		if (ix + 1 < this.length) return this[ix + 1];
		else return this[0];
	} else return this.last();
};

Array.prototype.prevWrap = Array.prototype.prevWrap || function (item) {
	const ix = this.indexOf(item);
	if (~ix) {
		if (ix - 1 >= 0) return this[ix - 1];
		else return this.last();
	} else return this[0];
};

Array.prototype.sum = Array.prototype.sum || function () {
	let tmp = 0;
	const len = this.length;
	for (let i = 0; i < len; ++i) tmp += this[i];
	return tmp;
};

Array.prototype.mean = Array.prototype.mean || function () {
	return this.sum() / this.length;
};

Array.prototype.meanAbsoluteDeviation = Array.prototype.meanAbsoluteDeviation || function () {
	const mean = this.mean();
	return (this.map(num => Math.abs(num - mean)) || []).mean();
};

// OVERLAY VIEW ========================================================================================================
/**
 * Relies on:
 * - page implementing HashUtil's `loadSubHash` with handling to show/hide the book view based on hashKey changes
 * - page running no-argument `loadSubHash` when `hashchange` occurs
 *
 * @param opts Options object.
 * @param opts.hashKey to use in the URL so that forward/back can open/close the view
 * @param opts.$openBtn jQuery-selected button to bind click open/close
 * @param opts.noneVisibleMsg "error" message to display if user has not selected any viewable content
 * @param opts.pageTitle Title.
 * @param opts.state State to modify when opening/closing.
 * @param opts.stateKey Key in state to set true/false when opening/closing.
 * @param opts.popTblGetNumShown function which should populate the view with HTML content and return the number of items displayed
 * @param [opts.hasPrintColumns] True if the overlay should contain a dropdown for adjusting print columns.
 * @constructor
 */
function BookModeView (opts) {
	opts = opts || {};
	const {hashKey, $openBtn, noneVisibleMsg, pageTitle, popTblGetNumShown, isFlex, state, stateKey} = opts;

	if (hashKey && stateKey) throw new Error();

	this.hashKey = hashKey;
	this.stateKey = stateKey;
	this.state = state;
	this.$openBtn = $openBtn;
	this.noneVisibleMsg = noneVisibleMsg;
	this.popTblGetNumShown = popTblGetNumShown;

	this.active = false;
	this._$body = null;
	this._$wrpBook = null;

	this._$wrpRenderedContent = null;
	this._$wrpNoneShown = null;
	this._doRenderContent = null; // N.B. currently unused, but can be used to refresh the contents of the view

	this.$openBtn.off("click").on("click", () => {
		if (this.stateKey) {
			this.state[this.stateKey] = true;
		} else {
			Hist.cleanSetHash(`${window.location.hash}${HASH_PART_SEP}${this.hashKey}${HASH_SUB_KV_SEP}true`);
		}
	});

	this._doHashTeardown = () => {
		if (this.stateKey) {
			this.state[this.stateKey] = false;
		} else {
			Hist.cleanSetHash(window.location.hash.replace(`${this.hashKey}${HASH_SUB_KV_SEP}true`, ""));
		}
	};

	this._renderContent = async ($wrpContent, $dispName, $wrpControlsToPass) => {
		this._$wrpRenderedContent = this._$wrpRenderedContent
			? this._$wrpRenderedContent.empty()
			: $$`<div class="bkmv__scroller h-100 overflow-y-auto ${isFlex ? "flex" : ""}">${$wrpContent}</div>`.appendTo(this._$wrpBook);

		const numShown = await this.popTblGetNumShown($wrpContent, $dispName, $wrpControlsToPass);

		if (numShown) {
			if (this._$wrpNoneShown) {
				this._$wrpNoneShown.remove();
				this._$wrpNoneShown = null;
			}
		} else {
			if (!this._$wrpNoneShown) {
				const $btnClose = $(`<button class="btn btn-default">Close</button>`)
					.click(() => this._doHashTeardown());

				this._$wrpNoneShown = $$`<div class="w-100 flex-col no-shrink bkmv__footer mb-3">
					<div class="mb-2 flex-vh-center"><span class="initial-message">${this.noneVisibleMsg}</span></div>
					<div class="flex-vh-center">${$btnClose}</div>
				</div>`.appendTo(this._$wrpBook);
			}
		}
	};

	// NOTE: Avoid using `flex` css, as it doesn't play nice with printing
	this.pOpen = async () => {
		if (this.active) return;
		this.active = true;
		document.title = `${pageTitle} - 5etools`;

		this._$body = $(`body`);
		this._$wrpBook = $(`<div class="bkmv"></div>`);

		this._$body.css("overflow", "hidden");
		this._$body.addClass("bkmv-active");

		const $btnClose = $(`<span class="delete-icon glyphicon glyphicon-remove"></span>`)
			.click(() => this._doHashTeardown());
		const $dispName = $(`<div></div>`); // pass this to the content function to allow it to set a main header
		$$`<div class="bkmv__spacer-name split-v-center no-shrink">${$dispName}${$btnClose}</div>`.appendTo(this._$wrpBook);

		// region controls
		// Optionally usable "controls" section at the top of the pane
		const $wrpControls = $(`<div class="w-100 flex-col bkmv__wrp-controls"></div>`)
			.appendTo(this._$wrpBook);

		let $wrpControlsToPass = $wrpControls;
		if (opts.hasPrintColumns) {
			$wrpControls.addClass("px-2 mt-2");

			const injectPrintCss = (cols) => {
				$(`#bkmv__print-style`).remove();
				$(`<style media="print" id="bkmv__print-style">.bkmv__wrp { column-count: ${cols}; }</style>`)
					.appendTo($(document.body))
			};

			const lastColumns = StorageUtil.syncGetForPage(BookModeView._BOOK_VIEW_COLUMNS_K);

			const $selColumns = $(`<select class="form-control input-sm">
				<option value="0">Two (book style)</option>
				<option value="1">One</option>
			</select>`)
				.change(() => {
					const val = Number($selColumns.val());
					if (val === 0) injectPrintCss(2);
					else injectPrintCss(1);

					StorageUtil.syncSetForPage(BookModeView._BOOK_VIEW_COLUMNS_K, val);
				});
			if (lastColumns != null) $selColumns.val(lastColumns);
			$selColumns.change();

			$wrpControlsToPass = $$`<div class="w-100 flex">
				<div class="flex-vh-center"><div class="mr-2 no-wrap help--subtle" title="Applied when printing the page.">Print columns:</div>${$selColumns}</div>
			</div>`.appendTo($wrpControls);
		}
		// endregion

		const $wrpContent = $(`<div class="bkmv__wrp p-2"></div>`);

		await this._renderContent($wrpContent, $dispName, $wrpControlsToPass);

		this._pRenderContent = () => this._renderContent($wrpContent, $dispName, $wrpControlsToPass);

		this._$body.append(this._$wrpBook);
	};

	this.teardown = () => {
		if (this.active) {
			this._$body.css("overflow", "");
			this._$body.removeClass("bkmv-active");
			this._$wrpBook.remove();
			this.active = false;

			this._$wrpRenderedContent = null;
			this._$wrpNoneShown = null;
			this._pRenderContent = null;
		}
	};

	this.pHandleSub = (sub) => {
		if (this.stateKey) return; // Assume anything with state will handle this itself.

		const bookViewHash = sub.find(it => it.startsWith(this.hashKey));
		if (bookViewHash && UrlUtil.unpackSubHash(bookViewHash)[this.hashKey][0] === "true") return this.pOpen();
		else this.teardown();
	};
}
BookModeView._BOOK_VIEW_COLUMNS_K = "bookViewColumns";

// CONTENT EXCLUSION ===================================================================================================
ExcludeUtil = {
	isInitialised: false,
	_excludes: null,

	async pInitialise () {
		ExcludeUtil.pSave = MiscUtil.throttle(ExcludeUtil._pSave, 50);
		try {
			ExcludeUtil._excludes = await StorageUtil.pGet(VeCt.STORAGE_EXCLUDES) || [];
			ExcludeUtil._excludes = ExcludeUtil._excludes.filter(it => it.hash); // remove legacy rows
		} catch (e) {
			JqueryUtil.doToast({
				content: "Error when loading content blacklist! Purged blacklist data. (See the log for more information.)",
				type: "danger",
			});
			try {
				await StorageUtil.pRemove(VeCt.STORAGE_EXCLUDES);
			} catch (e) {
				setTimeout(() => { throw e });
			}
			ExcludeUtil._excludes = null;
			window.location.hash = "";
			setTimeout(() => { throw e });
		}
		ExcludeUtil.isInitialised = true;
	},

	getList () {
		return ExcludeUtil._excludes || [];
	},

	async pSetList (toSet) {
		ExcludeUtil._excludes = toSet;
		await ExcludeUtil.pSave();
	},

	_excludeCount: 0,
	/**
	 * @param hash
	 * @param category
	 * @param source
	 * @param [opts]
	 * @param [opts.isNoCount]
	 */
	isExcluded (hash, category, source, opts) {
		if (!ExcludeUtil._excludes || !ExcludeUtil._excludes.length) return false;
		if (!source) throw new Error(`Entity had no source!`);
		opts = opts || {};

		source = source.source || source;
		const out = !!ExcludeUtil._excludes.find(row => (row.source === "*" || row.source === source) && (row.category === "*" || row.category === category) && (row.hash === "*" || row.hash === hash));
		if (out && !opts.isNoCount) ++ExcludeUtil._excludeCount;
		return out;
	},

	checkShowAllExcluded (list, $pagecontent) {
		if ((!list.length && ExcludeUtil._excludeCount) || (list.length > 0 && list.length === ExcludeUtil._excludeCount)) {
			$pagecontent.html(`
				<tr><th class="border" colspan="6"></th></tr>
				<tr><td colspan="6" class="initial-message">(Content <a href="blacklist.html">blacklisted</a>)</td></tr>
				<tr><th class="border" colspan="6"></th></tr>
			`);
		}
	},

	addExclude (displayName, hash, category, source) {
		if (!ExcludeUtil._excludes.find(row => row.source === source && row.category === category && row.hash === hash)) {
			ExcludeUtil._excludes.push({displayName, hash, category, source});
			ExcludeUtil.pSave();
			return true;
		}
		return false;
	},

	removeExclude (hash, category, source) {
		const ix = ExcludeUtil._excludes.findIndex(row => row.source === source && row.category === category && row.hash === hash);
		if (~ix) {
			ExcludeUtil._excludes.splice(ix, 1);
			ExcludeUtil.pSave();
		}
	},

	async _pSave () {
		return StorageUtil.pSet(VeCt.STORAGE_EXCLUDES, ExcludeUtil._excludes);
	},

	// The throttled version, available post-initialisation
	async pSave () { /* no-op */ },

	resetExcludes () {
		ExcludeUtil._excludes = [];
		ExcludeUtil.pSave();
	},
};

// ENCOUNTERS ==========================================================================================================
EncounterUtil = {
	async pGetInitialState () {
		if (await EncounterUtil._pHasSavedStateLocal()) {
			if (await EncounterUtil._hasSavedStateUrl()) {
				return {
					type: "url",
					data: EncounterUtil._getSavedStateUrl(),
				};
			} else {
				return {
					type: "local",
					data: await EncounterUtil._pGetSavedStateLocal(),
				};
			}
		} else return null;
	},

	_hasSavedStateUrl () {
		return window.location.hash.length && Hist.getSubHash(EncounterUtil.SUB_HASH_PREFIX) != null;
	},

	_getSavedStateUrl () {
		let out = null;
		try {
			out = JSON.parse(decodeURIComponent(Hist.getSubHash(EncounterUtil.SUB_HASH_PREFIX)));
		} catch (e) {
			setTimeout(() => {
				throw e;
			});
		}
		Hist.setSubhash(EncounterUtil.SUB_HASH_PREFIX, null);
		return out;
	},

	async _pHasSavedStateLocal () {
		return !!StorageUtil.pGet(VeCt.STORAGE_ENCOUNTER);
	},

	async _pGetSavedStateLocal () {
		try {
			return await StorageUtil.pGet(VeCt.STORAGE_ENCOUNTER);
		} catch (e) {
			JqueryUtil.doToast({
				content: "Error when loading encounters! Purged encounter data. (See the log for more information.)",
				type: "danger",
			});
			await StorageUtil.pRemove(VeCt.STORAGE_ENCOUNTER);
			setTimeout(() => { throw e; });
		}
	},

	async pDoSaveState (toSave) {
		StorageUtil.pSet(VeCt.STORAGE_ENCOUNTER, toSave);
	},

	async pGetSavedState () {
		const saved = await StorageUtil.pGet(EncounterUtil.SAVED_ENCOUNTER_SAVE_LOCATION);
		return saved || {};
	},

	getEncounterName (encounter) {
		if (encounter.l && encounter.l.items && encounter.l.items.length) {
			const largestCount = encounter.l.items.sort((a, b) => SortUtil.ascSort(Number(b.c), Number(a.c)))[0];
			const name = decodeURIComponent(largestCount.h.split(HASH_LIST_SEP)[0]).toTitleCase();
			return `Encounter with ${name} ×${largestCount.c}`;
		} else return "(Unnamed Encounter)"
	},
};
EncounterUtil.SUB_HASH_PREFIX = "encounter";
EncounterUtil.SAVED_ENCOUNTER_SAVE_LOCATION = "ENCOUNTER_SAVED_STORAGE";

// EXTENSIONS ==========================================================================================================
ExtensionUtil = {
	ACTIVE: false,

	_doSend (type, data) {
		const detail = MiscUtil.copy({type, data});
		window.dispatchEvent(new CustomEvent("rivet.send", {detail}));
	},

	async pDoSendStats (evt, ele) {
		const $parent = $(ele).closest(`th.rnd-name`);
		const page = $parent.attr("data-page");
		const source = $parent.attr("data-source");
		const hash = $parent.attr("data-hash");
		const extensionData = $parent.attr("data-extension");

		if (page && source && hash) {
			let toSend = await Renderer.hover.pCacheAndGet(page, source, hash);

			if (extensionData) {
				switch (page) {
					case UrlUtil.PG_BESTIARY: {
						toSend = await ScaleCreature.scale(toSend, Number(extensionData));
					}
				}
			}

			ExtensionUtil._doSend("entity", {page, entity: toSend, isTemp: !!evt.shiftKey});
		}
	},

	doSendRoll (data) { ExtensionUtil._doSend("roll", data); },
};
if (typeof window !== "undefined") window.addEventListener("rivet.active", () => ExtensionUtil.ACTIVE = true);

// TOKENS ==============================================================================================================
TokenUtil = {
	handleStatblockScroll (event, ele) {
		$(`#token_image`)
			.toggle(ele.scrollTop < 32)
			.css({
				opacity: (32 - ele.scrollTop) / 32,
				top: -ele.scrollTop,
			})
	},
}

// LOCKS ===============================================================================================================
VeLock = function () {
	this._lockMeta = null;

	this.pLock = async () => {
		while (this._lockMeta) await this._lockMeta.lock;
		let unlock = null;
		const lock = new Promise(resolve => unlock = resolve);
		this._lockMeta = {
			lock,
			unlock,
		}
	};

	this.unlock = () => {
		const lockMeta = this._lockMeta;
		if (lockMeta) {
			this._lockMeta = null;
			lockMeta.unlock();
		}
	};
}
BrewUtil._lockHandleBrewJson = new VeLock();

// MISC WEBPAGE ONLOADS ================================================================================================
if (!IS_VTT && typeof window !== "undefined") {
	if (location.origin === VeCt.LOC_ORIGIN_CANCER) {
		const ivsCancer = [];

		window.addEventListener("load", () => {
			$(`.page__header`).addClass(`page__header--pride`);

			let isPadded = false;
			let anyFound = false;
			[
				"div-gpt-ad-5etools35927", // main banner
				"div-gpt-ad-5etools35930", // side banner
				"div-gpt-ad-5etools35928", // sidebar top
				"div-gpt-ad-5etools35929", // sidebar bottom
				"div-gpt-ad-5etools36159", // bottom floater
				"div-gpt-ad-5etools36834", // mobile middle
			].forEach(id => {
				const iv = setInterval(() => {
					const $wrp = $(`#${id}`);
					if (!$wrp.length) return;
					if (!$wrp.children().length) return;
					if ($wrp.children()[0].tagName === "SCRIPT") return;
					const $tgt = $wrp.closest(".cancer__anchor").find(".cancer__disp-cancer");
					if ($tgt.length) {
						anyFound = true;
						$tgt.css({display: "flex"}).text("Advertisements");
						clearInterval(iv);
					}
				}, 250);

				ivsCancer.push(iv);
			});

			const ivPad = setInterval(() => {
				if (!anyFound) return;
				if (isPadded) return;
				isPadded = true;
				// Pad the bottom of the page so the adhesive unit doesn't overlap the content
				$(`.view-col-group--cancer`).append(`<div class="w-100 no-shrink" style="height: 110px;"></div>`)
			}, 300);
			ivsCancer.push(ivPad);
		});

		// Hack to lock the ad space at original size--prevents the screen from shifting around once loaded
		setTimeout(() => {
			const $wrp = $(`.cancer__wrp-leaderboard-inner`);
			const h = $wrp.outerHeight();
			$wrp.css({height: h});
			ivsCancer.forEach(iv => clearInterval(iv));
		}, 5000);
	} else {
		window.addEventListener("load", () => $(`.cancer__anchor`).remove());
	}

	// window.addEventListener("load", () => {
	// 	$(`.cancer__sidebar-rhs-inner--top`).append(`<div class="TEST_RHS_TOP"></div>`)
	// 	$(`.cancer__sidebar-rhs-inner--bottom`).append(`<div class="TEST_RHS_BOTTOM"></div>`)
	// });
}

_Donate = {
	// TAG Disabled until further notice
	/*
	init () {
		if (IS_DEPLOYED) {
			DataUtil.loadJSON(`https://get.5etools.com/money.php`).then(dosh => {
				const pct = Number(dosh.donated) / Number(dosh.Goal);
				$(`#don-total`).text(`€${dosh.Goal}`);
				if (isNaN(pct)) {
					throw new Error(`Was not a number! Values were ${dosh.donated} and ${dosh.Goal}`);
				} else {
					const $bar = $(`.don__bar_inner`);
					$bar.css("width", `${Math.min(Math.ceil(100 * pct), 100)}%`).html(pct !== 0 ? `€${dosh.donated}&nbsp;` : "");
					if (pct >= 1) $bar.css("background-color", "lightgreen");
				}
			}).catch(noDosh => {
				$(`#don-wrapper`).remove();
				throw noDosh;
			});
		}
	},

	async pNotDonating () {
		const isFake = await StorageUtil.pIsAsyncFake();
		const isNotDonating = await StorageUtil.pGet("notDonating");
		return isFake || isNotDonating;
	},
	*/

	// region Test code, please ignore
	cycleLeader (ele) {
		const modes = [{width: 970, height: 90}, {width: 970, height: 250}, {width: 320, height: 50}, {width: 728, height: 90}];
		_Donate._cycleMode(ele, modes);
	},

	cycleSide (ele) {
		const modes = [{width: 300, height: 250}, {width: 300, height: 600}];
		_Donate._cycleMode(ele, modes);
	},

	_cycleMode (ele, modes) {
		const $e = $(ele);
		const pos = $e.data("pos") || 0;
		const mode = modes[pos];
		$e.css(mode);
		$e.text(`${mode.width}*${mode.height}`);
		$e.data("pos", (pos + 1) % modes.length)
	},
	// endregion
};
