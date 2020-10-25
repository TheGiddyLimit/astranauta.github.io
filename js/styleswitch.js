"use strict";

class StyleSwitcher {
	constructor () {
		this.currentStylesheet = StyleSwitcher._STYLE_DAY;
		this._setActiveDayNight(StyleSwitcher.storage.getItem(StyleSwitcher._STORAGE_DAY_NIGHT) || StyleSwitcher._getDefaultStyleDayNight());
		this._setActiveWide(StyleSwitcher.storage.getItem(StyleSwitcher._STORAGE_WIDE) === "true");
	}

	static _setButtonText (btnClassName, text) {
		[...document.getElementsByClassName(btnClassName)].forEach(ele => ele.innerHTML = text)
	}

	// region Night Mode
	_setActiveDayNight (style) {
		const htmlClasses = document.documentElement.classList;
		const setMethod = style === StyleSwitcher._STYLE_DAY ? htmlClasses.remove : htmlClasses.add;
		setMethod.call(htmlClasses, StyleSwitcher.NIGHT_CLASS);

		StyleSwitcher._setButtonText("nightModeToggle", `${style === StyleSwitcher._STYLE_DAY ? "Night" : "Day"} Mode`);

		this.currentStylesheet = style;
		StyleSwitcher.storage.setItem(StyleSwitcher._STORAGE_DAY_NIGHT, this.currentStylesheet);
	}

	getActiveDayNight () {
		return this.currentStylesheet;
	}

	static _getDefaultStyleDayNight () {
		if (window.matchMedia("(prefers-color-scheme: dark)").matches) return StyleSwitcher.STYLE_NIGHT;
		return StyleSwitcher._STYLE_DAY;
	}

	toggleDayNight () {
		const newStyle = this.currentStylesheet === StyleSwitcher._STYLE_DAY ? StyleSwitcher.STYLE_NIGHT : StyleSwitcher._STYLE_DAY;
		this._setActiveDayNight(newStyle);
	}
	// endregion

	// region Wide Mode
	_setActiveWide (isActive) {
		const existing = document.getElementById(StyleSwitcher._WIDE_ID);
		if (!isActive) {
			document.documentElement.classList.remove(StyleSwitcher._WIDE_ID);
			if (existing) existing.parentNode.removeChild(existing);
		} else {
			document.documentElement.classList.add(StyleSwitcher._WIDE_ID);
			if (!existing) {
				const eleScript = document.createElement(`style`);
				eleScript.id = StyleSwitcher._WIDE_ID;
				eleScript.innerHTML = `
				/* region Book/Adventure pages */
				@media only screen and (min-width: 1600px) {
					#listcontainer.book-contents {
						position: relative;
					}

					.book-contents ul.contents {
						position: sticky;
					}
				}
				/* endregion */

				/* region Overwrite Bootstrap containers */
				@media (min-width: 768px) {
					.container {
						width: 100%;
					}
				}

				@media (min-width: 992px) {
					.container {
						width: 100%;
					}
				}

				@media (min-width: 1200px) {
					.container {
						width: 100%;
					}
				}
				/* endregion */`;
				document.documentElement.appendChild(eleScript);
			}
		}
		StyleSwitcher._setButtonText("wideModeToggle", isActive ? "Disable Wide Mode" : "Enable Wide Mode (Experimental)");
		StyleSwitcher.storage.setItem(StyleSwitcher._STORAGE_WIDE, isActive);
	}

	toggleWide () {
		if (this.getActiveWide()) this._setActiveWide(false);
		else this._setActiveWide(true);
	}

	getActiveWide () { return document.getElementById(StyleSwitcher._WIDE_ID) != null; }
	// endregion
}
StyleSwitcher._STORAGE_DAY_NIGHT = "StyleSwitcher_style";
StyleSwitcher._STORAGE_WIDE = "StyleSwitcher_style-wide";
StyleSwitcher._STYLE_DAY = "day";
StyleSwitcher.STYLE_NIGHT = "night";
StyleSwitcher.NIGHT_CLASS = "night-mode";
StyleSwitcher._WIDE_ID = "style-switch__wide";

try {
	StyleSwitcher.storage = window.localStorage;
} catch (e) { // cookies are disabled
	StyleSwitcher.storage = {
		getItem () {
			return StyleSwitcher._STYLE_DAY;
		},

		setItem (k, v) {},
	}
}

const styleSwitcher = new StyleSwitcher();
