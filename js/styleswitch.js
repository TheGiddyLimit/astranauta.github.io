"use strict";

class StyleSwitcher {
	constructor () {
		this.currentStylesheet = StyleSwitcher.STYLE_DAY;
		this.loadStyleFromCookie();
	}

	setActiveStyleSheet (style) {
		const htmlClasses = document.documentElement.classList;
		const setMethod = style === StyleSwitcher.STYLE_DAY ? htmlClasses.remove : htmlClasses.add;
		setMethod.call(htmlClasses, StyleSwitcher.NIGHT_CLASS);

		StyleSwitcher.setButtonText(style);

		this.currentStylesheet = style;
		StyleSwitcher.createCookie(this.currentStylesheet);
	}

	static setButtonText (style) {
		const $button = StyleSwitcher.getButton();
		if (!$button || !$button.length) {
			return;
		}
		$button.html(`${style === StyleSwitcher.STYLE_DAY ? "Night" : "Day"} Mode`);
	}

	getActiveStyleSheet () {
		return this.currentStylesheet;
	}

	loadStyleFromCookie () {
		this.cookie = StyleSwitcher.readCookie();
		this.cookie = this.cookie ? this.cookie : StyleSwitcher.STYLE_DAY;
		this.setActiveStyleSheet(this.cookie);
	}

	static getButton () {
		if (!window.$) {
			return;
		}
		return $(".nightModeToggle");
	}

	static createCookie (value) {
		StyleSwitcher.storage.setItem(StyleSwitcher.STYLE_STORAGE, value);
	}

	static readCookie () {
		return StyleSwitcher.storage.getItem(StyleSwitcher.STYLE_STORAGE);
	}

	toggleActiveStyleSheet () {
		const newStyle = this.currentStylesheet === StyleSwitcher.STYLE_DAY ? StyleSwitcher.STYLE_NIGHT : StyleSwitcher.STYLE_DAY;
		this.setActiveStyleSheet(newStyle);
	}
}

StyleSwitcher.STYLE_STORAGE = "StyleSwitcher_style";
StyleSwitcher.STYLE_DAY = "day";
StyleSwitcher.STYLE_NIGHT = "night";
StyleSwitcher.NIGHT_CLASS = "night-mode";

try {
	StyleSwitcher.storage = window.localStorage;
} catch (e) { // cookies are disabled
	StyleSwitcher.storage = {
		getItem (k) {
			return StyleSwitcher.STYLE_DAY;
		},

		setItem (k, v) {}
	}
}

// NIGHT MODE ==========================================================================================================
const styleSwitcher = new StyleSwitcher();

window.addEventListener("unload", function () {
	const title = styleSwitcher.getActiveStyleSheet();
	StyleSwitcher.createCookie(title);
});
