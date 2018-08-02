"use strict";

window.addEventListener(
	'load',
	function () {
		navigation();
		currentPage();
	}, false
);

const CHILD_PAGES = {
	"adventure.html": "adventures.html"
};

function currentPage () {
	let currentPage = window.location.pathname;
	currentPage = currentPage.substr(currentPage.lastIndexOf('/') + 1);

	if (!currentPage) currentPage = "5etools.html";
	if (CHILD_PAGES[currentPage]) currentPage = CHILD_PAGES[currentPage];

	if (currentPage.toLowerCase() === "book.html") {
		const hashPart = window.location.hash.split(",")[0];
		if (hashPart) {
			currentPage += hashPart.toLowerCase();
		}
	}

	const current = $(`li[data-page="${currentPage}"]`);
	current.addClass("active");
	current.siblings().removeClass("active");
	current.parent().closest("li").addClass("active");
}

function navigation () {
	LI('navbar', '5etools.html', 'Home');

	LIDropdown('navbar', 'rules', 'dropdown');
	A('rules', 'ruleOption', 'dropdown-toggle', 'dropdown', '#', 'button', 'true', 'false', "Rules <span class='caret'></span>");
	UL('rules', 'ul_rules', 'dropdown-menu');
	LI('ul_rules', 'quickreference.html', 'Quick Reference');
	LI('ul_rules', 'variantrules.html', 'Variant & Optional Rules');
	LIDivider('ul_rules');
	LI('ul_rules', 'book.html', "Dungeon Master's Guide", "DMG");
	LI('ul_rules', 'book.html', "Monster Manual", "MM");
	LI('ul_rules', 'book.html', "Player's Handbook", "PHB");
	LIDivider('ul_rules');
	LI('ul_rules', 'book.html', "Mordenkainen's Tome of Foes", "MTF");
	LI('ul_rules', 'book.html', "Sword Coast Adventurer's Guide", "SCAG");
	LI('ul_rules', 'book.html', "Volo's Guide to Monsters", "VGM");
	LI('ul_rules', 'book.html', "Xanathar's Guide to Everything", "XGE");
	LIDivider('ul_rules');
	LI('ul_rules', 'book.html', "Adventurers League", "AL");

	LIDropdown('navbar', 'players', 'dropdown');
	A('players', 'playerOption', 'dropdown-toggle', 'dropdown', '#', 'button', 'true', 'false', "Player Options <span class='caret'></span>");
	UL('players', 'ul_players', 'dropdown-menu');
	LI('ul_players', 'classes.html', 'Classes');
	LI('ul_players', 'backgrounds.html', 'Backgrounds');
	LI('ul_players', 'feats.html', 'Feats');
	LI('ul_players', 'invocations.html', 'Invocations');
	LI('ul_players', 'races.html', 'Races');
	LI('ul_players', 'lifegen.html', 'This Is Your Life');
	LI('ul_players', 'names.html', 'Names');

	LIDropdown('navbar', 'dms', 'dropdown');
	A('dms', 'dmOption', 'dropdown-toggle', 'dropdown', '#', 'button', 'true', 'false', "DM Tools <span class='caret'></span>");
	UL('dms', 'ul_dms', 'dropdown-menu');
	LI('ul_dms', 'adventures.html', 'Adventures');
	LI('ul_dms', 'crcalculator.html', 'CR Calculator');
	LI('ul_dms', 'cultsboons.html', 'Cults & Demonic Boons');
	LI('ul_dms', 'dmscreen.html', 'DM Screen');
	LISpecial('ul_dms', 'https://kobold.club', 'Encounter Builder', '_blank', 'We could literally never build something better than Kobold Fight Club');
	LI('ul_dms', 'encountergen.html', 'Encounter Generator');
	LI('ul_dms', 'lootgen.html', 'Loot Generator');
	LI('ul_dms', 'objects.html', 'Objects');
	LI('ul_dms', 'trapshazards.html', 'Traps & Hazards');

	LIDropdown('navbar', 'references', 'dropdown');
	A('references', 'references', 'dropdown-toggle', 'dropdown', '#', 'button', 'true', 'false', "References <span class='caret'></span>");
	UL('references', 'ul_references', 'dropdown-menu');
	LI('ul_references', 'bestiary.html', 'Bestiary');
	LI('ul_references', 'conditionsdiseases.html', 'Conditions & Diseases');
	LI('ul_references', 'deities.html', 'Deities');
	LI('ul_references', 'items.html', 'Items');
	LI('ul_references', 'rewards.html', 'Other Rewards');
	LI('ul_references', 'psionics.html', 'Psionics');
	LI('ul_references', 'spells.html', 'Spells');

	LI('navbar', 'statgen.html', 'Statgen', "rolled");

	LIDropdown('navbar', 'utils', 'dropdown');
	A('utils', 'utils', 'dropdown-toggle', 'dropdown', '#', 'button', 'true', 'false', "Utilities <span class='caret'></span>");
	UL('utils', 'ul_utils', 'dropdown-menu');
	LI('ul_utils', 'blacklist.html', 'Content Blacklist');
	LI('ul_utils', 'converter.html', 'Stat Block to JSON');
	LI('ul_utils', 'demo.html', 'Renderer Demo');
	LI('ul_utils', 'roll20.html', 'Roll20 Script Help');
	LI('ul_utils', 'makeshaped.html', 'Roll20 Shaped Sheet JS Builder');

	LISwitcher('navbar', 'daynightMode', 'nightModeToggle', '#', 'styleSwitcher.toggleActiveStyleSheet(); return false;');

	/**
	 * Adds a link for the LIDropdowns
	 * @param {String} append_to_id - Which ID does this link belong too .
	 * @param {String} _id - What ID should this link have.
	 * @param {String} _class - What class(es) should this link have.
	 * @param {String} _datatoggle - What type of datatoggle.
	 * @param {String} _href - Where does this link to.
	 * @param {String} _role - Specific role.
	 * @param {String} _ariahaspop - Aria has pop.
	 * @param {String} _ariaexpanded - Default state.
	 * @param {String} _text - Text of the link.
	 */
	function A (append_to_id, _id, _class, _datatoggle, _href, _role, _ariahaspop, _ariaexpanded, _text) {
		const a = document.createElement('a');
		a.id = _id;
		a.className = _class;
		a.setAttribute('data-toggle', _datatoggle);
		a.href = _href;
		a.setAttribute('role', _role);
		a.setAttribute('aria-haspopup', _ariahaspop);
		a.setAttribute('aria-expanded', _ariaexpanded);
		a.innerHTML = _text;

		const appendTo = document.getElementById(append_to_id);
		appendTo.appendChild(a);
	}

	/**
	 * Adds a new list to the navigation bar
	 * @param {String} append_to_id - Which ID does this link belong too .
	 * @param {String} ul_id - What ID should this UL have.
	 * @param {String} _class - What class(es) should this link have.
	 */
	function UL (append_to_id, ul_id, _class) {
		const ul = document.createElement('ul');
		ul.id = ul_id;
		ul.className = _class;

		const appendTo = document.getElementById(append_to_id);
		appendTo.appendChild(ul);
	}

	/**
	 * Adds a new item to the navigation bar. Can be used either in root, or in a different UL.
	 * @param append_to_id - Which ID does this link belong too .
	 * @param a_href - Where does this link to.
	 * @param a_text - What text does this link have.
	 * @param a_hash - Optional hash to be appended to the base href
	 */
	function LI (append_to_id, a_href, a_text, a_hash) {
		const hashPart = a_hash ? `#${a_hash}`.toLowerCase() : "";
		$(`#${append_to_id}`)
			.append(`
				<li role="presentation" id="${a_text.toLowerCase().replace(/\s+/g, '')}" data-page="${a_href}${hashPart}">
					<a href="${a_href}${hashPart}">${a_text}</a>
				</li>
			`);
	}

	function LIDivider (append_to_id) {
		$(`#${append_to_id}`).append(`<li role="presentation" class="divider"></li>`);
	}

	/**
	 * Adds a new outbound item to the navigation bar. Can be used either in root, or in a different UL.
	 * @param {String} append_to_id - Which ID does this link belong too .
	 * @param {String} a_href - Where does this link to.
	 * @param {String} a_text - What text does this link have.
	 * @param {String} a_target - Where does this link target too.
	 * @param {String} a_title - What subtext does this link have.
	 */
	function LISpecial (append_to_id, a_href, a_text, a_target, a_title) {
		const $li = `
			<li role="presentation">
				<a href="${a_href}" target="${a_target}" title="${a_title}" class="dropdown-ext-link">
					<span>${a_text}</span>
					<span class="glyphicon glyphicon-log-out"></span>
				</a>
			</li>
		`;

		const $appendTo = $(`#${append_to_id}`);
		$appendTo.append($li);
	}

	/**
	 * Adds a new dropdown starting list to the navigation bar
	 * @param {String} append_to_id - Which ID does this link belong too .
	 * @param {String} li_id - What ID should this LI have.
	 * @param {String} _class - What class(es) should this LI have.
	 */
	function LIDropdown (append_to_id, li_id, _class) {
		const li = document.createElement('li');
		li.id = li_id;
		li.setAttribute('role', 'presentation');
		li.className = _class;

		const appendTo = document.getElementById(append_to_id);
		appendTo.appendChild(li);
	}

	/**
	 * Special LI for the Day/Night Switcher
	 * @param {String} append_to_id - Which ID does this link belong too .
	 * @param {String} li_id - What ID should this LI have.
	 * @param {String} a_class - What class(es) should this link have.
	 * @param {String} a_href - Where does this link to.
	 * @param {String} a_class - What should the link do when you click on it.
	 */
	function LISwitcher (append_to_id, li_id, a_class, a_href, a_onclick) {
		const a = document.createElement('a');
		a.href = a_href;
		a.className = a_class;
		a.setAttribute('onclick', a_onclick);
		a.innerHTML = styleSwitcher.getActiveStyleSheet() === StyleSwitcher.STYLE_DAY ? "Night Mode" : "Day Mode";

		const li = document.createElement('li');
		li.id = li_id;
		li.setAttribute('role', 'presentation');
		li.appendChild(a);

		const appendTo = document.getElementById(append_to_id);
		appendTo.appendChild(li);
	}
}
