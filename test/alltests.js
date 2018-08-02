const fs = require('fs');
const Validator = require('jsonschema').Validator;
const validator = new Validator();
const helperFile = "entry.json";
const bestiaryFile = "bestiary/bestiary.json";
validator.addSchema(require(`./schema/${helperFile}`), "/Entry");
validator.addSchema(require(`./schema/${bestiaryFile}`), "/Bestiary");
const TESTS_PASSED = 0;
const TESTS_FAILED = 1;
let results = [];
const expected = [];
const expectedDirs = {};
const existing = [];

require("./check-links");

function loadJSON (file) {
	const data = fs.readFileSync(file, "utf8")
		.replace(/^\uFEFF/, ""); // strip BOM
	return JSON.parse(data);
}

// FIXME use something that doesn't attach object prototypes -- https://github.com/tdegrunt/jsonschema/issues/261
// TODO modular argument system?
if (process.argv[2] !== "noschema") {
	console.log(`##### Validating the JSON schemata #####`);
	// Loop through each non-helper schema and push all validation results.
	fs.readdirSync("./test/schema")
		.filter(file => file.endsWith(".json")) // ignore directories
		.forEach(file => {
			if (file !== helperFile) {
				console.log(`Testing data/${file}`.padEnd(50), `against schema/${file}`);
				const result = validator.validate(loadJSON(`./data/${file}`), require(`./schema/${file}`));
				checkHandleError(result);
				results.push(result);
			}
		});

	fs.readdirSync(`./test/schema`)
		.filter(category => !category.endsWith(".json")) // only directories
		.forEach(category => {
			console.log(`Testing category ${category}`);
			const schemas = fs.readdirSync(`./test/schema/${category}`);
			fs.readdirSync(`./data/${category}`).forEach(dataFile => {
				schemas.filter(schema => dataFile.startsWith(schema.split(".")[0])).forEach(schema => {
					console.log(`Testing data/${category}/${dataFile}`.padEnd(50), `against schema/${category}/${schema}`);
					const result = validator.validate(loadJSON(`./data/${category}/${dataFile}`), require(`./schema/${category}/${schema}`));
					checkHandleError(result);
					results.push(result);
				});
			});
		});

	console.log(`All schema tests passed.`);
}

console.log(`##### Reconciling the PNG tokens against the bestiary JSON #####`);

// Loop through each bestiary JSON file push the list of expected PNG files.
fs.readdirSync("./data/bestiary")
	.filter(file => file.startsWith("bestiary") && file.endsWith(".json"))
	.forEach(file => {
		const result = JSON.parse(fs.readFileSync(`./data/bestiary/${file}`));
		result.monster.forEach(m => {
			if (fs.existsSync(`./img/${m.source}`)) expected.push(`${m.source}/${m.name.replace(/"/g, "")}.png`);
			else expectedDirs[m.source] = true;
		});
	});

// Loop through each bestiary-related img directory and push the list of files in each.
fs.readdirSync("./img")
	.filter(file => !file.endsWith(".git"))
	.filter(file => !file.endsWith(".gitignore"))
	.filter(file => !file.endsWith(".png"))
	.forEach(dir => {
		if (dir !== "adventure" && dir !== "deities" && dir !== "variantrules" && dir !== "rules" && dir !== "objects" && dir !== "bestiary" && dir !== "roll20" && dir !== "book") {
			fs.readdirSync(`./img/${dir}`).forEach(file => {
				existing.push(`${dir.replace("(", "").replace(")", "")}/${file}`);
			})
		}
	});

results = [];
expected.forEach(function (i) {
	if (existing.indexOf(i) === -1) results.push(`${i} is missing`);
});
existing.forEach(function (i) {
	if (expected.indexOf(i) === -1) results.push(`${i} is extra`);
});
Object.keys(expectedDirs).forEach(k => results.push(`Directory ${k} doesn't exist!`));
results.sort(function (a, b) {
	return a.toLowerCase().localeCompare(b.toLowerCase());
}).forEach(function (i) {
	console.log(i);
});

process.exit(TESTS_PASSED);

/**
 * Fail-fast
 * @param result a result to check
 */
function checkHandleError (result) {
	if (!result.valid) {
		console.error(JSON.stringify(result.errors, null, 2));
		console.warn(`Tests failed`);
		process.exit(TESTS_FAILED);
	}
}
