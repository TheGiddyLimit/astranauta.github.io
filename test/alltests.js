const fs = require('fs');
const Validator = require('jsonschema').Validator;
const validator = new Validator();
const helperFile = "entry.json";
validator.addSchema(require(`./schema/${helperFile}`), "/Entry");

const TESTS_PASSED = 0;
const TESTS_FAILED = 1;

const results = [];

// Loop through each non-helper schema and push all validation results.
fs.readdirSync("./test/schema")
	.filter(file => file.endsWith(".json")) // ignore directories
	.forEach(file => {
	if (file !== helperFile) {
		console.log(`Testing data/${file}`.padEnd(50), `against schema/${file}`);
		const result = validator.validate(require(`../data/${file}`), require(`./schema/${file}`));
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
				const result = validator.validate(require(`../data/${category}/${dataFile}`), require(`./schema/${category}/${schema}`));
				checkHandleError(result);
				results.push(result);
			})
		})
	});

// Reporting
console.log("All schema tests passed.");
process.exit(TESTS_PASSED);

/**
 * Fail-fast
 * @param result a result to check
 */
function checkHandleError(result) {
	if (!result.valid) {
		console.error(JSON.stringify(result.errors, null, 2));
		console.warn(`Tests failed`);
		process.exit(TESTS_FAILED);
	}
}
