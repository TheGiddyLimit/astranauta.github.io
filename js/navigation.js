"use strict";

class NavBar {
	static init () {
		// render the visible elements ASAP
		window.addEventListener(
			"DOMContentLoaded",
			function () {
				NavBar.initElements();
				NavBar.highlightCurrentPage();
			}
		);
		window.addEventListener("load", NavBar.initHandlers);
	}

	static initElements () {
		const navBar = document.getElementById("navbar");

		addLi(navBar, "5etools.html", "Home");

		const ulRules = addDropdown(navBar, "Rules");
		addLi(ulRules, "quickreference.html", "Quick Reference");
		addLi(ulRules, "variantrules.html", "Variant & Optional Rules/Misc");
		addLi(ulRules, "tables.html", "Tables");
		addDivider(ulRules);
		addLi(ulRules, "book.html", "Dungeon Master's Guide", false, "DMG");
		addLi(ulRules, "book.html", "Monster Manual", false, "MM");
		addLi(ulRules, "book.html", "Player's Handbook", false, "PHB");
		addDivider(ulRules);
		addLi(ulRules, "book.html", "Guildmasters' Guide to Ravnica", false, "GGR");
		addLi(ulRules, "book.html", "Mordenkainen's Tome of Foes", false, "MTF");
		addLi(ulRules, "book.html", "Sword Coast Adventurer's Guide", false, "SCAG");
		addLi(ulRules, "book.html", "Volo's Guide to Monsters", false, "VGM");
		addLi(ulRules, "book.html", "Xanathar's Guide to Everything", false, "XGE");
		addDivider(ulRules);
		addLi(ulRules, "book.html", "Adventurers League", false, "AL");
		addDivider(ulRules);
		addLi(ulRules, "books.html", "View All/Homebrew");

		const ulPlayers = addDropdown(navBar, "Player Options");
		addLi(ulPlayers, "classes.html", "Classes");
		addLi(ulPlayers, "optionalfeatures.html", "Class Feature Options");
		addLi(ulPlayers, "backgrounds.html", "Backgrounds");
		addLi(ulPlayers, "feats.html", "Feats");
		addLi(ulPlayers, "races.html", "Races");
		addDivider(ulPlayers);
		addLi(ulPlayers, "statgen.html", "Statgen");
		addDivider(ulPlayers);
		addLi(ulPlayers, "lifegen.html", "This Is Your Life");
		addLi(ulPlayers, "names.html", "Names");

		const ulDms = addDropdown(navBar, "DM Tools");
		addLi(ulDms, "dmscreen.html", "DM Screen");
		addDivider(ulDms);
		const ulAdventures = addDropdown(ulDms, "Adventures", true);
		addLi(ulAdventures, "adventure.html", "Lost Mines of Phandelver", true, "LMoP");
		addLi(ulAdventures, "adventure.html", "Hoard of the Dragon Queen", true, "HotDQ");
		addLi(ulAdventures, "adventure.html", "Rise of Tiamat", true, "RoT");
		addLi(ulAdventures, "adventure.html", "Princes of the Apocalypse", true, "PotA");
		addLi(ulAdventures, "adventure.html", "Out of the Abyss", true, "OotA");
		addLi(ulAdventures, "adventure.html", "Curse of Strahd", true, "CoS");
		addLi(ulAdventures, "adventure.html", "Storm King's Thunder", true, "SKT");
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: The Sunless Citadel", true, "TftYP-TSC");
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: The Forge of Fury", true, "TftYP-TFoF");
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: The Hidden Shrine of Tamoachan", true, "TftYP-THSoT");
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: White Plume Mountain", true, "TftYP-WPM");
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: Dead in Thay", true, "TftYP-DiT");
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: Against the Giants", true, "TftYP-AtG");
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: Tomb of Horrors", true, "TftYP-ToH");
		addLi(ulAdventures, "adventure.html", "Tomb of Annihilation", true, "ToA");
		addLi(ulAdventures, "adventure.html", "The Tortle Package", true, "TTP");
		addLi(ulAdventures, "adventure.html", "Waterdeep: Dragon Heist", true, "WDH");
		addLi(ulAdventures, "adventure.html", "Lost Laboratory of Kwalish", true, "LLK");
		addLi(ulAdventures, "adventure.html", "Waterdeep: Dungeon of the Mad Mage", true, "WDMM");
		addLi(ulAdventures, "adventure.html", "Krenko's Way", true, "KKW");
		addDivider(ulAdventures);
		addLi(ulAdventures, "adventures.html", "View All/Homebrew");
		addLi(ulDms, "cultsboons.html", "Cults & Demonic Boons");
		addLi(ulDms, "objects.html", "Objects");
		addLi(ulDms, "ships.html", "Ships");
		addLi(ulDms, "trapshazards.html", "Traps & Hazards");
		addDivider(ulDms);
		addLi(ulDms, "crcalculator.html", "CR Calculator");
		addLi(ulDms, "encountergen.html", "Encounter Generator");
		addLi(ulDms, "lootgen.html", "Loot Generator");

		const ulReferences = addDropdown(navBar, "References");
		addLi(ulReferences, "bestiary.html", "Bestiary");
		addLi(ulReferences, "conditionsdiseases.html", "Conditions & Diseases");
		addLi(ulReferences, "deities.html", "Deities");
		addLi(ulReferences, "items.html", "Items");
		addLi(ulReferences, "rewards.html", "Other Rewards");
		addLi(ulReferences, "psionics.html", "Psionics");
		addLi(ulReferences, "spells.html", "Spells");

		const ulUtils = addDropdown(navBar, "Utilities");
		addLi(ulUtils, "blacklist.html", "Content Blacklist");
		addLi(ulUtils, "inittrackerplayerview.html", "Initiative Tracker Player View");
		addLi(ulUtils, "managebrew.html", "Manage All Homebrew");
		addDivider(ulUtils);
		addLi(ulUtils, "makebrew.html", "Homebrew Builder");
		addLi(ulUtils, "demo.html", "Renderer Demo");
		addLi(ulUtils, "converter.html", "Text Converter");
		addDivider(ulUtils);
		addLi(ulUtils, "roll20.html", "Roll20 Script Help");
		addLi(ulUtils, "makeshaped.html", "Roll20 Shaped Sheet JS Builder");

		addLi(navBar, "donate.html", "Donate");

		addNightModeToggle(navBar);

		/**
		 * Adds a new item to the navigation bar. Can be used either in root, or in a different UL.
		 * @param appendTo - Element to append this link to.
		 * @param aHref - Where does this link to.
		 * @param aText - What text does this link have.
		 * @param [isSide] - True if this item
		 * @param [aHash] - Optional hash to be appended to the base href
		 */
		function addLi (appendTo, aHref, aText, isSide, aHash) {
			const hashPart = aHash ? `#${aHash}`.toLowerCase() : "";

			const li = document.createElement("li");
			li.setAttribute("role", "presentation");
			li.setAttribute("id", aText.toLowerCase().replace(/\s+/g, ""));
			li.setAttribute("data-page", `${aHref}${hashPart}`);
			if (isSide) {
				li.onmouseenter = function () { NavBar.handleSideItemMouseEnter(this) }
			} else {
				li.onmouseenter = function () { NavBar.handleItemMouseEnter(this) };
				li.onclick = function () { NavBar._dropdowns.forEach(ele => ele.classList.remove("open")) }
			}

			const a = document.createElement("a");
			a.href = `${aHref}${hashPart}`;
			a.innerHTML = aText;

			li.appendChild(a);
			appendTo.appendChild(li);
		}

		function addDivider (appendTo) {
			const li = document.createElement("li");
			li.setAttribute("role", "presentation");
			li.className = "divider";

			appendTo.appendChild(li);
		}

		/**
		 * Adds a new dropdown starting list to the navigation bar
		 * @param {String} appendTo - Element to append this link to.
		 * @param {String} text - Dropdown text.
		 * @param {boolean} [isSide=false] - If this is a sideways dropdown.
		 */
		function addDropdown (appendTo, text, isSide = false) {
			const li = document.createElement("li");
			li.setAttribute("role", "presentation");
			li.className = "dropdown dropdown--navbar";
			if (isSide) {
				li.onmouseenter = function () { NavBar.handleSideItemMouseEnter(this); };
			} else {
				li.onmouseenter = function () { NavBar.handleItemMouseEnter(this); };
			}

			const a = document.createElement("a");
			a.className = "dropdown-toggle";
			a.href = "#";
			a.setAttribute("role", "button");
			a.onclick = function (event) { NavBar.handleDropdownClick(this, event, isSide); };
			if (isSide) {
				a.onmouseenter = function () { NavBar.handleSideDropdownMouseEnter(this); };
				a.onmouseleave = function () { NavBar.handleSideDropdownMouseLeave(this); };
			}
			a.innerHTML = `${text} <span class="caret ${isSide ? "caret--right" : ""}"></span>`;

			const ul = document.createElement("li");
			ul.className = `dropdown-menu ${isSide ? "dropdown-menu--side" : ""}`;
			ul.onclick = function (event) { event.stopPropagation(); };

			li.appendChild(a);
			li.appendChild(ul);
			appendTo.appendChild(li);
			return ul;
		}

		/**
		 * Special LI for the Day/Night Switcher
		 */
		function addNightModeToggle (appendTo) {
			const li = document.createElement("li");
			li.setAttribute("role", "presentation");

			const a = document.createElement("a");
			a.href = "#";
			a.className = "nightModeToggle";
			a.onclick = function (event) { event.preventDefault(); styleSwitcher.toggleActiveStyleSheet(); };
			a.innerHTML = styleSwitcher.getActiveStyleSheet() === StyleSwitcher.STYLE_DAY ? "Night Mode" : "Day Mode";

			li.appendChild(a);
			appendTo.appendChild(li);
		}
	}

	static highlightCurrentPage () {
		let currentPage = window.location.pathname;
		currentPage = currentPage.substr(currentPage.lastIndexOf("/") + 1);

		if (!currentPage) currentPage = "5etools.html";

		let isSecondLevel = false;
		if (currentPage.toLowerCase() === "book.html" || currentPage.toLowerCase() === "adventure.html") {
			const hashPart = window.location.hash.split(",")[0];
			if (currentPage.toLowerCase() === "adventure.html") isSecondLevel = true;
			currentPage += hashPart.toLowerCase();
		}
		if (currentPage.toLowerCase() === "adventures.html") isSecondLevel = true;

		try {
			let current = document.querySelector(`li[data-page="${currentPage}"]`);
			if (current == null) {
				currentPage = currentPage.split("#")[0];
				if (NavBar.ALT_CHILD_PAGES[currentPage]) currentPage = NavBar.ALT_CHILD_PAGES[currentPage];
				current = document.querySelector(`li[data-page="${currentPage}"]`);
			}
			current.parentNode.childNodes.forEach(n => n.classList && n.classList.remove("active"));
			current.classList.add("active");

			let closestLi = current.parentNode;
			const setNearestParentActive = () => {
				while (closestLi !== null && (closestLi.nodeName !== "LI" || !closestLi.classList.contains("dropdown"))) closestLi = closestLi.parentNode;
				closestLi && closestLi.classList.add("active");
			};
			setNearestParentActive();
			if (isSecondLevel) {
				closestLi = closestLi.parentNode;
				setNearestParentActive();
			}
		} catch (ignored) { setTimeout(() => { throw ignored }); }
	}

	static initHandlers () {
		NavBar._dropdowns = [...document.getElementById("navbar").querySelectorAll(`li.dropdown--navbar`)];
		document.addEventListener("click", () => NavBar._dropdowns.forEach(ele => ele.classList.remove("open")));
		document.addEventListener("mousemove", evt => {
			NavBar._mouseX = evt.clientX;
			NavBar._mouseY = evt.clientY;
		});

		NavBar._clearAllTimers();
	}

	static handleDropdownClick (ele, event, isSide) {
		event.preventDefault();
		event.stopPropagation();
		if (isSide) return;
		NavBar._openDropdown(ele);
	}

	static _openDropdown (fromLink) {
		const noRemove = new Set();
		let parent = fromLink.parentNode;
		parent.classList.add("open");
		noRemove.add(parent);

		while (parent.nodeName !== "NAV") {
			parent = parent.parentNode;
			if (parent.nodeName === "LI") {
				parent.classList.add("open");
				noRemove.add(parent);
			}
		}

		NavBar._dropdowns.filter(ele => !noRemove.has(ele)).forEach(ele => ele.classList.remove("open"));
	}

	static handleItemMouseEnter (ele) {
		const $ele = $(ele);
		const timerIds = $ele.siblings("[data-timer-id]").map((i, e) => ({$ele: $(e), timerId: $(e).data("timer-id")})).get();
		timerIds.forEach(({$ele, timerId}) => {
			if (NavBar._timersOpen[timerId]) {
				clearTimeout(NavBar._timersOpen[timerId]);
				delete NavBar._timersOpen[timerId];
			}

			if (!NavBar._timersClose[timerId] && $ele.hasClass("open")) {
				const getTimeoutFn = () => {
					if (NavBar._timerMousePos[timerId]) {
						const [xStart, yStart] = NavBar._timerMousePos[timerId];
						// for generalised use, this should be made check against the bounding box for the side menu
						// and possibly also check Y pos; e.g.
						// || NavBar._mouseY > yStart + NavBar.MIN_MOVE_PX
						if (NavBar._mouseX > xStart + NavBar.MIN_MOVE_PX) {
							NavBar._timerMousePos[timerId] = [NavBar._mouseX, NavBar._mouseY];
							NavBar._timersClose[timerId] = setTimeout(() => getTimeoutFn(), NavBar.DROP_TIME / 2);
						} else {
							$ele.removeClass("open");
							delete NavBar._timersClose[timerId];
						}
					} else {
						$ele.removeClass("open");
						delete NavBar._timersClose[timerId];
					}
				};

				NavBar._timersClose[timerId] = setTimeout(() => getTimeoutFn(), NavBar.DROP_TIME);
			}
		});
	}

	static handleSideItemMouseEnter (ele) {
		const timerId = $(ele).closest(`li.dropdown`).data("timer-id");
		if (NavBar._timersClose[timerId]) {
			clearTimeout(NavBar._timersClose[timerId]);
			delete NavBar._timersClose[timerId];
			delete NavBar._timerMousePos[timerId];
		}
	}

	static handleSideDropdownMouseEnter (ele) {
		const $ele = $(ele);
		const timerId = $ele.parent().data("timer-id") || NavBar._timerId++;
		$ele.parent().attr("data-timer-id", timerId);

		if (NavBar._timersClose[timerId]) {
			clearTimeout(NavBar._timersClose[timerId]);
			delete NavBar._timersClose[timerId];
		}

		if (!NavBar._timersOpen[timerId]) {
			NavBar._timersOpen[timerId] = setTimeout(() => {
				NavBar._openDropdown(ele);
				delete NavBar._timersOpen[timerId];
				NavBar._timerMousePos[timerId] = [NavBar._mouseX, NavBar._mouseY];
			}, NavBar.DROP_TIME);
		}
	}

	static handleSideDropdownMouseLeave (ele) {
		const $ele = $(ele);
		if (!$ele.parent().data("timer-id")) return;
		const timerId = $ele.parent().data("timer-id");
		clearTimeout(NavBar._timersOpen[timerId]);
		delete NavBar._timersOpen[timerId];
	}

	static _clearAllTimers () {
		Object.entries(NavBar._timersOpen).forEach(([k, v]) => {
			clearTimeout(v);
			delete NavBar._timersOpen[k];
		});
	}
}
NavBar.DROP_TIME = 250;
NavBar.MIN_MOVE_PX = 7;
NavBar.ALT_CHILD_PAGES = {
	"book.html": "books.html",
	"adventure.html": "adventures.html"
};
NavBar._timerId = 1;
NavBar._timersOpen = {};
NavBar._timersClose = {};
NavBar._timerMousePos = {};
NavBar._mouseX = null;
NavBar._mouseY = null;
NavBar.init();
