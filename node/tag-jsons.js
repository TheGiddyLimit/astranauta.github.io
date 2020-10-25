const fs = require("fs");
require("../js/utils.js");
require("../js/render.js");
require("../js/render-dice.js");
const ut = require("./util.js");
const {TaggerUtils, SkillTag, ActionTag, SenseTag, TagCondition, DiceConvert} = require("../js/converterutils");

const ARGS = {};

/**
 * Args:
 * file="./data/my-file.json"
 * filePrefix="./data/dir/"
 */
class ArgParser {
	static parse () {
		process.argv
			.slice(2)
			.forEach(arg => {
				let [k, v] = arg.split("=").map(it => it.trim()).filter(Boolean);
				if (v == null) ARGS[k] = true;
				else {
					v = v
						.replace(/^"(.*)"$/, "$1")
						.replace(/^'(.*)'$/, "$1")
					;

					if (!isNaN(v)) ARGS[k] = Number(v);
					else ARGS[k] = v;
				}
			});
	}
}
ArgParser.parse();

const BLACKLIST_FILE_PREFIXES = [
	...ut.FILE_PREFIX_BLACKLIST,

	// specific files
	"demo.json",
];

const LAST_KEY_WHITELIST = new Set([
	"entries",
	"entry",
	"items",
	"entriesHigherLevel",
	"rows",
	"row",
	"fluff",
]);

class TagJsons {
	static async pInit () {
		SpellTag.init();
		await ItemTag.pInit();
	}

	static run () {
		let files = ut.listFiles({dir: `./data`, blacklistFilePrefixes: BLACKLIST_FILE_PREFIXES});
		if (ARGS.file) {
			files = files.filter(f => f === ARGS.file);
			if (!files.length) throw new Error(`File "${ARGS.file}" not found!`);
		}
		if (ARGS.filePrefix) {
			files = files.filter(f => f.startsWith(ARGS.filePrefix));
			if (!files.length) throw new Error(`No file with prefix "${ARGS.filePrefix}" found!`);
		}

		files.forEach(file => {
			console.log(`Tagging file "${file}"`)
			const json = ut.readJson(file);

			if (json instanceof Array) return;

			Object.keys(json)
				.forEach(k => {
					json[k] = TagJsons.WALKER.walk(
						json[k],
						{
							object: (obj, lastKey) => {
								if (lastKey != null && !LAST_KEY_WHITELIST.has(lastKey)) return obj

								obj = TagCondition.tryRunBasic(obj);
								obj = SkillTag.tryRun(obj);
								obj = ActionTag.tryRun(obj);
								obj = SenseTag.tryRun(obj);
								obj = SpellTag.tryRun(obj);
								obj = ItemTag.tryRun(obj);
								obj = TableTag.tryRun(obj);
								obj = DiceConvert.getTaggedEntry(obj);

								return obj;
							},
						},
					);
				});

			const outPath = file.replace("./data/", "./trash/");
			const dirPart = outPath.split("/").slice(0, -1).join("/");
			fs.mkdirSync(dirPart, {recursive: true});
			fs.writeFileSync(outPath, CleanUtil.getCleanJson(json));
		});
	}
}
TagJsons.WALKER = MiscUtil.getWalker({keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST});

class SpellTag {
	static init () {
		const spellIndex = ut.readJson(`./data/spells/index.json`);
		Object.entries(spellIndex).forEach(([source, filename]) => {
			if (SourceUtil.isNonstandardSource(source)) return;

			const spellData = ut.readJson(`./data/spells/${filename}`);
			spellData.spell.forEach(sp => {
				SpellTag._SPELL_NAMES[sp.name.toLowerCase()] = {name: sp.name, source: sp.source};
			});
		});

		SpellTag._SPELL_NAME_REGEX = new RegExp(`(${Object.keys(SpellTag._SPELL_NAMES).join("|")}) (spell)`, "gi");
		SpellTag._SPELL_NAME_REGEX_AND = new RegExp(`(${Object.keys(SpellTag._SPELL_NAMES).join("|")}) (and {@spell)`, "gi");
	}

	static tryRun (it) {
		return TagJsons.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@spell"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag,
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		return strMod
			.replace(SpellTag._SPELL_NAME_REGEX, (...m) => {
				const spellMeta = SpellTag._SPELL_NAMES[m[1].toLowerCase()];
				return `{@spell ${m[1]}${spellMeta.source !== SRC_PHB ? `|${spellMeta.source}` : ""}} ${m[2]}`;
			})
			.replace(SpellTag._SPELL_NAME_REGEX_AND, (...m) => {
				const spellMeta = SpellTag._SPELL_NAMES[m[1].toLowerCase()];
				return `{@spell ${m[1]}${spellMeta.source !== SRC_PHB ? `|${spellMeta.source}` : ""}} ${m[2]}`;
			})
		;
	}
}
SpellTag._SPELL_NAMES = {};
SpellTag._SPELL_NAME_REGEX = null;
SpellTag._SPELL_NAME_REGEX_AND = null;

class ItemTag {
	static async pInit () {
		const itemArr = await Renderer.item.pBuildList({isAddGroups: true});

		const toolTypes = new Set(["AT", "GS", "INS", "T"]);
		const tools = itemArr.filter(it => toolTypes.has(it.type) && !SourceUtil.isNonstandardSource(it.source));
		tools.forEach(tool => {
			ItemTag._ITEM_NAMES_TOOLS[tool.name.toLowerCase()] = {name: tool.name, source: tool.source};
		});

		ItemTag._ITEM_NAMES_REGEX_TOOLS = new RegExp(`(^|\\W)(${tools.map(it => it.name).join("|")})(\\W|$)`, "gi");
	}

	static tryRun (it) {
		return TagJsons.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@item"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag,
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		return strMod
			.replace(ItemTag._ITEM_NAMES_REGEX_TOOLS, (...m) => {
				const toolMeta = ItemTag._ITEM_NAMES_TOOLS[m[2].toLowerCase()];
				return `${m[1]}{@item ${m[2]}${toolMeta.source !== SRC_DMG ? `|${toolMeta.source}` : ""}}${m[3]}`;
			})
		;
	}
}
ItemTag._ITEM_NAMES_TOOLS = {};
ItemTag._ITEM_NAMES_REGEX_TOOLS = null;

class TableTag {
	static tryRun (it) {
		return TagJsons.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@table"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag,
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		return strMod
			.replace(/Wild Magic Surge table/g, `{@table Wild Magic Surge|PHB} table`)
		;
	}
}

async function main () {
	ut.patchLoadJson();
	await TagJsons.pInit();
	TagJsons.run();
	ut.unpatchLoadJson();
}

main().then(() => console.log("Run complete.")).catch(e => { throw e; });
