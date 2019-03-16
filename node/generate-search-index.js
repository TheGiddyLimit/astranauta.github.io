const fs = require('fs');
const utS = require("./util-search-index");

async function main () {
	console.log("Creating primary index...");
	const index = await utS.UtilSearchIndex.pGetIndex();
	fs.writeFileSync("search/index.json", JSON.stringify(index), "utf8");
	console.log("Creating secondary index: Items...");
	const indexItems = await utS.UtilSearchIndex.pGetIndexAdditionalItem();
	fs.writeFileSync("search/index-item.json", JSON.stringify(indexItems), "utf8");
	console.log("Creating alternate index: Spells...");
	const indexAltSpells = await utS.UtilSearchIndex.pGetIndexAlternate("spell");
	fs.writeFileSync("search/index-alt-spell.json", JSON.stringify(indexAltSpells), "utf8");
}

return main();
