const fs = require("fs");
let contents = [];
let check = true; // check the content instead of generating the full JSON
let brief = false; // display the "spellcasting" JSON
let fileInclude = "bestiary-"; // default to all bestiary files
const args = process.argv.slice(2); // omit the first two arguments (node and the path to this script)
let usage = [];

for (let i = 0; i < args.length; i++) {
	if (args[i] === "--brief") {
		brief = true;
	} else if (args[i] === "--generate") {
		check = false;
	} else if (args[i] === "-F") {
		fileInclude += args[i + 1];
	}
}
if (!check) brief = false; // if we're generating the full JSON then do not also display "spellcasting" too

function recursiveCheck (file) {
	if (file.includes(fileInclude)) checkFile(file);
	else if (fs.lstatSync(file).isDirectory()) {
		fs.readdirSync(file).forEach(nxt => {
			recursiveCheck(`${file}/${nxt}`)
		})
	}
}

function checkFile (file) {
	// if (check) console.log(file);
	usage = [];
	count = 0;
	contents = JSON.parse(fs.readFileSync(file, "utf8"));
	for (let i = 0; i < contents.monster.length; i++) {
		let monster = contents.monster[i];
		let name = monster.name;
		if (monster.trait) {
			traitJSON = JSON.stringify(monster.trait);
			if (traitJSON.indexOf("cast") !== -1) console.log(`${file}: ${name} has cast in trait`);
			if (traitJSON.indexOf("spell") !== -1) console.log(`${file}: ${name} has spell in trait`);
		}
		if (monster.action) {
			traitJSON = JSON.stringify(monster.action);
			if (traitJSON.indexOf("cast") !== -1) console.log(`${file}: ${name} has cast in action`);
			if (traitJSON.indexOf("spell") !== -1) console.log(`${file}: ${name} has spell in action`);
		}
		if (monster.reaction) {
			traitJSON = JSON.stringify(monster.reaction);
			if (traitJSON.indexOf("cast") !== -1) console.log(`${file}: ${name} has cast in reaction`);
			if (traitJSON.indexOf("spell") !== -1) console.log(`${file}: ${name} has spell in reaction`);
		}
		if (monster.legendary) {
			traitJSON = JSON.stringify(monster.legendary);
			if (traitJSON.indexOf("cast") !== -1) console.log(`${file}: ${name} has cast in legendary`);
			if (traitJSON.indexOf("spell") !== -1) console.log(`${file}: ${name} has spell in legendary`);
		}
		// if (monster.trait) for (let j = 0; j < monster.trait.length; j++) if (monster.trait[j].attack) count++;
		// if (monster.action) for (let j = 0; j < monster.action.length; j++) if (monster.action[j].attack) count++;
		// if (monster.reaction) for (let j = 0; j < monster.reaction.length; j++) if (monster.reaction[j].attack) count++;
		// if (monster.trait) for (let j = 0; j < monster.trait.length; j++) if (monster.trait[j].text) parseAttack(name, monster.trait[j].text);
		// if (monster.action) for (let j = 0; j < monster.action.length; j++) if (monster.action[j].text) parseAttack(name, monster.action[j].text);
		// if (monster.reaction) for (let j = 0; j < monster.reaction.length; j++) if (monster.reaction[j].text) parseAttack(name, monster.reaction[j].text);
	}
	if (count) console.log(file, count);
	// if (check) console.log(JSON.stringify(usage.sort(), null, 2));
}

function parseAttack (name, text) {
	for (let i = 0; i < text.length; i++) {
		var actiontext = text[i];
		var action_desc = actiontext; // required for later reduction of information dump.
		// attack parsing
		if (actiontext.indexOf(" Attack:") > -1) {
			var attacktype = "";
			var attacktype2 = "";
			if (actiontext.indexOf(" Weapon Attack:") > -1) {
				attacktype = actiontext.split(" Weapon Attack:")[0];
				attacktype2 = " Weapon Attack:";
			} else if (actiontext.indexOf(" Spell Attack:") > -1) {
				attacktype = actiontext.split(" Spell Attack:")[0];
				attacktype2 = " Spell Attack:";
			}
			var attackrange = "";
			var rangetype = "";
			if (attacktype.indexOf("Melee") > -1) {
				attackrange = (actiontext.match(/reach (.*?),/) || ["", ""])[1];
				rangetype = "Reach";
			} else {
				attackrange = (actiontext.match(/range (.*?),/) || ["", ""])[1];
				rangetype = "Range";
			}
			var tohit = (actiontext.match(/\+(.*) to hit/) || ["", ""])[1];
			var damage = "";
			var damagetype = "";
			var damage2 = "";
			var damagetype2 = "";
			var onhit = "";
			damageregex = /\d+ \((\d+d\d+\s?(?:\+|-)?\s?\d*)\) (\S+ )?damage/g;
			damagesearches = damageregex.exec(actiontext);
			if (damagesearches) {
				onhit = damagesearches[0];
				damage = damagesearches[1];
				damagetype = (damagesearches[2] != null) ? damagesearches[2].trim() : "";
				damagesearches = damageregex.exec(actiontext);
				if (damagesearches) {
					onhit += " plus ".concat(damagesearches[0]);
					damage2 = damagesearches[1];
					damagetype2 = (damagesearches[2] != null) ? damagesearches[2].trim() : "";
				}
			}
			onhit = onhit.trim();
			var attacktarget = (actiontext.match(/\.,(?!.*\.,)(.*)\. Hit:/) || ["", ""])[1];
			// Cut the information dump in the description
			var atk_desc_simple_regex = /Hit: \d+ \((\d+d\d+\s?(?:\+|-)?\s?\d*)\) (\S+ )?damage\.(.*)/g;
			var atk_desc_complex_regex = /(Hit:.*)/g;
			// is it a simple attack (just 1 damage type)?
			var match_simple_atk = atk_desc_simple_regex.exec(actiontext);
			if (match_simple_atk != null) {
				// if yes, then only display special effects, if any
				action_desc = match_simple_atk[3].trim();
			} else {
				// if not, simply cut everything before "Hit:" so there are no details lost.
				var match_compl_atk = atk_desc_complex_regex.exec(actiontext);
				if (match_compl_atk != null) action_desc = match_compl_atk[1].trim();
			}
			var tohitrange = "+".concat([tohit, ", ", rangetype, " ", attackrange, ", ", attacktarget, "."]);
			if (usage.indexOf(onhit) === -1) usage.push(onhit);
		}
	}
}

recursiveCheck("./data/bestiary");
