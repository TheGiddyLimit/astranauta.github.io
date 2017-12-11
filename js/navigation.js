window.addEventListener('load', navigation, false);
window.addEventListener('load', currentPage, false);

function currentPage(){
	var currentPage = window.location.pathname;
	currentPage = currentPage.slice(1);

	var current = document.querySelectorAll('a[href="'+currentPage+'"]');
	current[0].parentNode.className = 'active';

	var parent = current[0].parentNode.parentNode.parentNode;
	if(parent.tagName === 'LI'){
		var dropdown = document.getElementById(parent.id);
		dropdown.className = 'dropdown active';
	}
}

function navigation() {
	LI('navbar','5etools.html','5eTools');
	LI('navbar','rules.html','Rules');

	LIDropdown('navbar','players','dropdown');
	A('players','playerOption','dropdown-toggle','dropdown','#','button','true','false',"Player Options <span class='caret'></span>");
	UL('players','ul_players','dropdown-menu');
	LI('ul_players','classes.html','Classes');
	LI('ul_players','backgrounds.html','Backgrounds');
	LI('ul_players','feats.html','Feats');
	LI('ul_players','races.html','Races');
	LI('ul_players','names.html','Names');

	LIDropdown('navbar','dms','dropdown');
	A('dms','dmOption','dropdown-toggle','dropdown','#','button','true','false',"DM Tools <span class='caret'></span>");
	UL('dms','ul_dms','dropdown-menu');
	LI('ul_dms','crcalculator.html','CR Calculator');
	LISpecial('ul_dms','http://kobold.club','Encounter Builder','_blank','I could literally never build something better than Kobold Fight Club');
	LI('ul_dms','encountergen.html','Encounter Generator');
	LI('ul_dms','lootgen.html','Loot Generator');

	LIDropdown('navbar','references','dropdown');
	A('references','references','dropdown-toggle','dropdown','#','button','true','false',"References <span class='caret'></span>");
	UL('references','ul_references','dropdown-menu');
	LI('ul_references','bestiary.html','Bestiary');
	LI('ul_references','conditions.html','Conditions');
	LI('ul_references','cults.html','Cults');
	LI('ul_references','items.html','Items');
	LI('ul_references','rewards.html','Other Rewards');
	LI('ul_references','psionics.html','Psionics');
	LI('ul_references','spells.html','Spells');
	LI('ul_references','invocations.html','Invocations');
	LI('ul_references','variantrules.html','Variant Rules');

	LI('navbar','statgen.html','Statgen');

	LIDropdown('navbar','utils','dropdown');
	A('utils','utils','dropdown-toggle','dropdown','#','button','true','false',"Utilities <span class='caret'></span>");
	UL('utils','ul_utils','dropdown-menu');
	LI('ul_utils','converter.html','Stat Block to JSON');
	LI('ul_utils','editor.html','WYSIWYG Editor');

	LISwitcher('navbar','daynightMode','nightModeToggle','#','styleSwitcher.toggleActiveStyleSheet(); return false;');

	function A(append_to_id, _id, _class, _datatoggle, _href, _role, _ariahaspop, _ariaexpanded, _text){
		var a = document.createElement('a');
		a.id = _id;
		a.className = _class;
		a.setAttribute('data-toggle',_datatoggle);
		a.href = _href;
		a.setAttribute('role',_role);
		a.setAttribute('aria-haspopup', _ariahaspop);
		a.setAttribute('aria-expanded', _ariaexpanded);
		a.innerHTML  = _text;

		var appendTo = document.getElementById(append_to_id);
		appendTo.appendChild(a);
	}

	function UL(append_to_id, ul_id, _class) {
		var ul = document.createElement('ul');
		ul.id = ul_id;
		ul.className = _class;

		var appendTo = document.getElementById(append_to_id);
		appendTo.appendChild(ul);
	}

	function LI(append_to_id, a_href, a_text) {
		var a = document.createElement('a');
		a.href = a_href;
		a.innerHTML = a_text;

		var li = document.createElement('li');
		li.id = a_text.toLowerCase().replace(/\s+/g, '');
		li.setAttribute('role','presentation');
		li.appendChild(a);

		var appendTo = document.getElementById(append_to_id);
		appendTo.appendChild(li);
	}

	function LISpecial(append_to_id, a_href, a_text, a_target, a_title) {
		var a = document.createElement('a');
		a.href = a_href;
		a.setAttribute('target',a_target);
		a.setAttribute('title',a_title);
		a.innerHTML = a_text;

		var li = document.createElement('li');
		li.id = a_text.toLowerCase().replace(/\s+/g, '');
		li.setAttribute('role','presentation');
		li.appendChild(a);

		var appendTo = document.getElementById(append_to_id);
		appendTo.appendChild(li);
	}

	function LIDropdown(append_to_id, li_id, _class) {
		var li = document.createElement('li');
		li.id = li_id;
		li.setAttribute('role','presentation');
		li.className = _class;

		var appendTo = document.getElementById(append_to_id);
		appendTo.appendChild(li);
	}
	
	function LISwitcher(append_to_id, li_id, a_class, a_href, a_onclick){
		var a = document.createElement('a');
		a.href = a_href;
		a.className = a_class;
		a.setAttribute('onclick',a_onclick);
		a.innerHTML = styleSwitcher.getActiveStyleSheet() === StyleSwitcher.STYLE_DAY ? "Night Mode" : "Day Mode";
		
		var li = document.createElement('li');
		li.id = li_id;
		li.setAttribute('role','presentation');
		li.appendChild(a);
		
		var appendTo = document.getElementById(append_to_id);
		appendTo.appendChild(li);
	}
}
