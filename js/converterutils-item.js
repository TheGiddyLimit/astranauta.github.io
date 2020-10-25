"use strict";

class ConverterUtilsItem {}
ConverterUtilsItem.BASIC_WEAPONS = [
	"club",
	"dagger",
	"greatclub",
	"handaxe",
	"javelin",
	"light hammer",
	"mace",
	"quarterstaff",
	"sickle",
	"spear",
	"light crossbow",
	"dart",
	"shortbow",
	"sling",
	"battleaxe",
	"flail",
	"glaive",
	"greataxe",
	"greatsword",
	"halberd",
	"lance",
	"longsword",
	"maul",
	"morningstar",
	"pike",
	"rapier",
	"scimitar",
	"shortsword",
	"trident",
	"war pick",
	"warhammer",
	"whip",
	"blowgun",
	"hand crossbow",
	"heavy crossbow",
	"longbow",
	"net",
];
ConverterUtilsItem.BASIC_ARMORS = [
	"padded armor",
	"leather armor",
	"studded leather armor",
	"hide armor",
	"chain shirt",
	"scale mail",
	"breastplate",
	"half plate armor",
	"ring mail",
	"chain mail",
	"splint armor",
	"plate armor",
	"shield",
];

class ChargeTag {
	static _checkAndTag (obj, opts) {
		opts = opts || {};

		const strEntries = JSON.stringify(obj.entries);
		const mCharges = /(?:have|has|with) (\d+|{@dice .*?}) charge/gi.exec(strEntries);
		if (!mCharges) return;

		const ix = mCharges.index;
		obj.charges = isNaN(Number(mCharges[1])) ? mCharges[1] : Number(mCharges[1]);

		if (opts.cbInfo) {
			const ixMin = Math.max(0, ix - 10);
			const ixMax = Math.min(strEntries.length, ix + 10);
			opts.cbInfo(obj, strEntries, ixMin, ixMax);
		}
	}

	static tryRun (it, opts) {
		if (it.entries) this._checkAndTag(it, opts);
		if (it.inherits && it.inherits.entries) this._checkAndTag(it.inherits, opts);
	}
}

class RechargeTypeTag {
	static _checkAndTag (obj, opts) {
		if (!obj.entries) return;

		const strEntries = JSON.stringify(obj.entries, null, 2);

		const mDawn = /charges? at dawn|charges? daily at dawn|charges? each day at dawn|charges and regains all of them at dawn|charges and regains[^.]+each dawn|recharging them all each dawn|charges that are replenished each dawn/gi.exec(strEntries);
		if (mDawn) return obj.recharge = "dawn";

		const mDusk = /charges? daily at dusk|charges? each day at dusk/gi.exec(strEntries);
		if (mDusk) return obj.recharge = "dusk";

		const mMidnight = /charges? daily at midnight|Each night at midnight[^.]+charges/gi.exec(strEntries);
		if (mMidnight) return obj.recharge = "midnight";

		if (opts.cbMan) opts.cbMan(obj.name, obj.source);
	}

	static tryRun (it, opts) {
		if (it.charges) this._checkAndTag(it, opts);
		if (it.inherits && it.inherits.charges) this._checkAndTag(it.inherits, opts);
	}
}

class SpellTag {
	static _checkAndTag (obj, opts) {
		const strEntries = JSON.stringify(obj.entries);

		const outSet = new Set();

		const regexps = [ // uses m[1]
			/duplicate the effect of the {@spell ([^}]*)} spell/gi,
			/a creature is under the effect of a {@spell ([^}]*)} spell/gi,
			/(?:gain(?:s)?|under|produces) the (?:[a-zA-Z\\"]+ )?effect of (?:the|a|an) {@spell ([^}]*)} spell/gi,
			/functions as the {@spell ([^}]*)} spell/gi,
			/as with the {@spell ([^}]*)} spell/gi,
			/as if using a(?:n)? {@spell ([^}]*)} spell/gi,
			/cast a(?:n)? {@spell ([^}]*)} spell/gi,
			/as a(?:n)? \d..-level {@spell ([^}]*)} spell/gi,
			/cast(?:(?: a version of)? the)? {@spell ([^}]*)}/gi,
			/cast the \d..-level version of {@spell ([^}]*)}/gi,
			/{@spell ([^}]*)} \([^)]*\d+ charge(?:s)?\)/gi,
		];

		const regexpsSeries = [ // uses m[0]
			/emanate the [^.]* spell/gi,
			/cast one of the following [^.]*/gi,
			/can be used to cast [^.]*/gi,
			/you can([^.]*expend[^.]*)? cast [^.]* (and|or) [^.]*/gi,
			/you can([^.]*)? cast [^.]* (and|or) [^.]* from the weapon/gi,
		];

		const addTaggedSpells = str => str.replace(/{@spell ([^}]*)}/gi, (...m) => outSet.add(m[1].toSpellCase()));

		regexps.forEach(re => {
			strEntries.replace(re, (...m) => outSet.add(m[1].toSpellCase()));
		});

		regexpsSeries.forEach(re => {
			strEntries.replace(re, (...m) => addTaggedSpells(m[0]));
		});

		// region Tag spells in tables
		const walker = MiscUtil.getWalker();
		const walkerHandlers = {
			obj: [
				(obj) => {
					if (obj.type !== "table") return obj;

					// Require the table to have the string "spell" somewhere in its caption/column labels
					const hasSpellInCaption = obj.caption && /spell/i.test(obj.caption);
					const hasSpellInColLabels = obj.colLabels && obj.colLabels.some(it => /spell/i.test(it));
					if (!hasSpellInCaption && !hasSpellInColLabels) return obj;

					(obj.rows || []).forEach(r => {
						r.forEach(c => addTaggedSpells(c));
					});

					return obj
				},
			],
		};
		const cpy = MiscUtil.copy(obj);
		walker.walk(cpy, walkerHandlers);
		// endregion

		obj.attachedSpells = [...outSet];
		if (!obj.attachedSpells.length) delete obj.attachedSpells;
	}

	static tryRun (it, opts) {
		if (it.entries) this._checkAndTag(it, opts);
		if (it.inherits && it.inherits.entries) this._checkAndTag(it.inherits, opts);
	}
}

class BonusTag {
	static _runOn (obj, prop, opts) {
		opts = opts || {};
		let strEntries = JSON.stringify(obj.entries);

		// Clean the root--"inherits" data may have specific bonuses as per the variant (e.g. +3 weapon -> +3) that
		//   we don't want to remove.
		// Legacy "bonus" data will be cleaned up if an updated bonus type is found.
		if (prop !== "inherits") {
			delete obj.bonusWeapon;
			delete obj.bonusWeaponAttack;
			delete obj.bonusAc;
			delete obj.bonusSavingThrow;
			delete obj.bonusSpellAttack;
		}

		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on) [^.]*(?:attack|hit) and damage rolls)/ig, (...m) => {
			if (m[0].toLowerCase().includes("spell")) return m[0];

			obj.bonusWeapon = `+${m[1]}`;
			return opts.isVariant ? `{=bonusWeapon}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on) [^.]*(?:attack rolls|hit))/ig, (...m) => {
			if (obj.bonusWeapon) return m[0];
			if (m[0].toLowerCase().includes("spell")) return m[0];

			obj.bonusWeaponAttack = `+${m[1]}`;
			return opts.isVariant ? `{=bonusWeaponAttack}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on)(?: your)? [^.]*(?:AC|Armor Class|armor class))/g, (...m) => {
			obj.bonusAc = `+${m[1]}`;
			return opts.isVariant ? `{=bonusAc}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on) [^.]*saving throws)/g, (...m) => {
			obj.bonusSavingThrow = `+${m[1]}`;
			return opts.isVariant ? `{=bonusSavingThrow}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on) [^.]*spell attack rolls)/g, (...m) => {
			obj.bonusSpellAttack = `+${m[1]}`;
			return opts.isVariant ? `{=bonusSpellAttack}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(BonusTag._RE_BASIC_WEAPONS, (...m) => {
			obj.bonusWeapon = `+${m[1]}`;
			return opts.isVariant ? `{=bonusWeapon}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(BonusTag._RE_BASIC_ARMORS, (...m) => {
			obj.bonusAc = `+${m[1]}`;
			return opts.isVariant ? `{=bonusAc}${m[2]}` : m[0];
		});

		// region Homebrew
		// "this weapon is a {@i dagger +1}"
		strEntries = strEntries.replace(/({@i(?:tem)? )([^}]+ )\+(\d+)((?:|[^}]+)?})/, (...m) => {
			const ptItem = m[2].trim().toLowerCase();
			if (ConverterUtilsItem.BASIC_WEAPONS.includes(ptItem)) {
				obj.bonusWeapon = `+${m[3]}`;
				return opts.isVariant ? `${m[1]}${m[2]}{=bonusWeapon}${m[2]}` : m[0];
			} else if (ConverterUtilsItem.BASIC_ARMORS.includes(ptItem)) {
				obj.bonusAc = `+${m[3]}`;
				return opts.isVariant ? `${m[1]}${m[2]}{=bonusAc}${m[2]}` : m[0];
			}
			return m[0];
		});

		// Damage roll with no attack roll
		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on) [^.]*damage rolls)/ig, (...m) => {
			if (obj.bonusWeapon) return m[0];

			obj.bonusWeaponDamage = `+${m[1]}`;
			return opts.isVariant ? `{=bonusWeaponDamage}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(/(grants )\+\s*(\d)((?: to| on)?(?: your)? [^.]*(?:AC|Armor Class|armor class))/g, (...m) => {
			obj.bonusAc = `+${m[2]}`;
			return opts.isVariant ? `${m[1]}{=bonusAc}${m[3]}` : m[0];
		});
		// endregion

		// If the bonus weapon attack and damage are identical, combine them
		if (obj.bonusWeaponAttack && obj.bonusWeaponDamage && obj.bonusWeaponAttack === obj.bonusWeaponDamage) {
			obj.bonusWeapon = obj.bonusWeaponAttack;
			delete obj.bonusWeaponAttack;
			delete obj.bonusWeaponDamage;
		}

		obj.entries = JSON.parse(strEntries);
	}

	static tryRun (it, opts) {
		if (it.inherits && it.inherits.entries) this._runOn(it.inherits, "inherits", opts)
		else if (it.entries) this._runOn(it, null, opts);
	}
}
BonusTag._RE_BASIC_WEAPONS = new RegExp(`\\+\\s*(\\d)(\\s+(?:${ConverterUtilsItem.BASIC_WEAPONS.join("|")}|weapon))`);
BonusTag._RE_BASIC_ARMORS = new RegExp(`\\+\\s*(\\d)(\\s+(?:${ConverterUtilsItem.BASIC_ARMORS.join("|")}|armor))`);

class BasicTextClean {
	static tryRun (it, opts) {
		const walker = MiscUtil.getWalker({keyBlacklist: new Set(["type"])});
		walker.walk(it, {
			array: (arr) => {
				return arr.filter(it => {
					if (typeof it !== "string") return true;

					if (/^\s*Proficiency with .*? allows you to add your proficiency bonus to the attack roll for any attack you make with it\.\s*$/i.test(it)) return false;
					if (/^\s*A shield is made from wood or metal and is carried in one hand\. Wielding a shield increases your Armor Class by 2. You can benefit from only one shield at a time\.\s*$/i.test(it)) return false;

					return true;
				})
			},
		})
	}
}

class ItemMiscTag {
	static tryRun (it, opts) {
		if (!(it.entries || (it.inherits && it.inherits.entries))) return;

		const isInherits = !it.entries && it.inherits.entries;
		const tgt = it.entries ? it : it.inherits;

		const strEntries = JSON.stringify(it.entries || it.inherits.entries);

		strEntries.replace(/"Sentience"/, (...m) => tgt.sentient = true);
		strEntries.replace(/"Curse"/, (...m) => tgt.curse = true);

		strEntries.replace(/you[^.]* (gain|have)? proficiency/gi, (...m) => tgt.grantsProficiency = true);
		strEntries.replace(/you gain[^.]* following proficiencies/gi, (...m) => tgt.grantsProficiency = true);
		strEntries.replace(/you are[^.]* considered proficient/gi, (...m) => tgt.grantsProficiency = true);
		strEntries.replace(/[Yy]ou can speak( and understand)? [A-Z]/g, (...m) => tgt.grantsProficiency = true);
	}
}

if (typeof module !== "undefined") {
	module.exports = {
		ConverterUtilsItem,
		ChargeTag,
		RechargeTypeTag,
		SpellTag,
		BonusTag,
		BasicTextClean,
		ItemMiscTag,
	};
}
