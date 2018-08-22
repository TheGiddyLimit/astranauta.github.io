const fs = require('fs');
const ut = require('../js/utils.js');
const utS = require("../node/util-search-index");

const re = /{@(spell|item|class|creature|condition|disease|background|race|invocation|feat|reward|psionic|object|cult|boon|trap|hazard|deity|variantrule) (.*?)(\|(.*?))?(\|(.*?))?(\|.*?)?}/g;
let msg = ``;

const TAG_TO_PAGE = {
	"spell": UrlUtil.PG_SPELLS,
	"item": UrlUtil.PG_ITEMS,
	"class": UrlUtil.PG_CLASSES,
	"creature": UrlUtil.PG_BESTIARY,
	"condition": UrlUtil.PG_CONDITIONS_DISEASES,
	"disease": UrlUtil.PG_CONDITIONS_DISEASES,
	"background": UrlUtil.PG_BACKGROUNDS,
	"race": UrlUtil.PG_RACES,
	"invocation": UrlUtil.PG_INVOCATIONS,
	"reward": UrlUtil.PG_REWARDS,
	"feat": UrlUtil.PG_FEATS,
	"psionic": UrlUtil.PG_PSIONICS,
	"object": UrlUtil.PG_OBJECTS,
	"cult": UrlUtil.PG_CULTS_BOONS,
	"boon": UrlUtil.PG_CULTS_BOONS,
	"trap": UrlUtil.PG_TRAPS_HAZARDS,
	"hazard": UrlUtil.PG_TRAPS_HAZARDS,
	"deity": UrlUtil.PG_DEITIES,
	"variantrule": UrlUtil.PG_VARIATNRULES
};

const TAG_TO_DEFAULT_SOURCE = {
	"spell": "phb",
	"item": "dmg",
	"class": "phb",
	"creature": "mm",
	"condition": "phb",
	"disease": "dmg",
	"background": "phb",
	"race": "phb",
	"invocation": "phb",
	"reward": "dmg",
	"feat": "phb",
	"psionic": "UATheMysticClass",
	"object": "dmg",
	"cult": "mtf",
	"boon": "mtf",
	"trap": "dmg",
	"hazard": "dmg",
	"deity": "phb",
	"variantrule": "dmg"
};

function recursiveCheck (file) {
	if (file.endsWith(".json")) checkFile(file);
	else if (fs.lstatSync(file).isDirectory()) {
		fs.readdirSync(file).forEach(nxt => {
			recursiveCheck(`${file}/${nxt}`)
		})
	}
}

function checkFile (file) {
	const contents = fs.readFileSync(file, 'utf8');
	let match;
	// eslint-disable-next-line no-cond-assign
	while (match = re.exec(contents)) {
		const tag = match[1];
		const toEncode = [match[2]];

		if (tag === "deity") {
			toEncode.push();
			toEncode.push(match[4] || "forgotten realms");
			toEncode.push(match[6] || TAG_TO_DEFAULT_SOURCE[tag]);
		} else {
			toEncode.push(match[4] || TAG_TO_DEFAULT_SOURCE[tag]);
		}

		const url = `${TAG_TO_PAGE[tag]}#${UrlUtil.encodeForHash(toEncode)}`.toLowerCase().trim();
		if (!ALL_URLS.has(url)) {
			// scan for a list of similar entries, to aid debugging
			const similarUrls = [];
			const similar = /^\w+\.html#\w+/.exec(url);
			Array.from(ALL_URLS).forEach(it => {
				if (similar && it.startsWith(similar[0])) similarUrls.push(it)
			});
			msg += `Missing link: ${match[0]} in file ${file} (evaluates to "${url}")
Similar URLs were:
${JSON.stringify(similarUrls, null, 2)}
`;
		}
	}
}

const ALL_URLS = new Set();
utS.UtilSearchIndex.getIndex(false, true).forEach(it => {
	ALL_URLS.add(`${UrlUtil.categoryToPage(it.c)}#${it.u.toLowerCase().trim()}`);
});

console.log("##### Checking links in JSON #####");
recursiveCheck("./data");
if (msg) throw new Error(msg);
console.log("##### Link check complete #####");