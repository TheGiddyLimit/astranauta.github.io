const fs = require("fs");
require("../js/utils");
const Ajv = require("ajv");

const ajv = new Ajv();

function loadJSON (file) {
	const data = fs.readFileSync(file, "utf8")
		.replace(/^\uFEFF/, ""); // strip BOM
	return JSON.parse(data);
}

function handleError () {
	const out = JSON.stringify(ajv.errors, null, 2);
	console.error(out);
	console.warn(`Tests failed`);
	fs.writeFileSync("../log-test-json.json", out, "utf-8");
	return false;
}

// add any implicit data to the JSON
function addImplicits (obj, lastKey) {
	if (typeof obj === "object") {
		if (obj == null) return;
		if (obj instanceof Array) obj.forEach(d => addImplicits(d, lastKey));
		else {
			// "obj.mode" will be set if this is in a "_copy" etc block
			if (lastKey === "spellcasting" && !obj.mode) obj.type = obj.type || "spellcasting";

			Object.entries(obj).forEach(([k, v]) => addImplicits(v, k));
		}
	}
}

function preprocess (schema) {
	function deepMerge (a, b) {
		if (typeof a !== "object" || typeof b !== "object") return;
		if ((a instanceof Array && !(b instanceof Array)) || (!(a instanceof Array) && b instanceof Array)) return console.warn(`Could not merge:\n${JSON.stringify(a)}\n${JSON.stringify(b)}`);

		const bKeys = new Set(Object.keys(b));
		Object.keys(a).forEach(ak => {
			if (bKeys.has(ak)) {
				const av = a[ak];
				const bv = b[ak];

				const bType = typeof bv;

				switch (bType) {
					case "boolean":
					case "number":
					case "string": a[ak] = bv; break; // if we have a primitive, overwrite
					case "object": {
						if (bv instanceof Array) a[ak] = bv; // if we have an array, overwrite
						else deepMerge(av, bv); // otherwise, go deeper
						break;
					}
					default: throw new Error(`Impossible!`);
				}

				bKeys.delete(ak); // mark key as merged
			}
		});
		// any properties in B that aren't in A simply get added to A
		bKeys.forEach(bk => a[bk] = b[bk]);
	}

	function findReplace$$Merge (obj) {
		if (typeof obj === "object") {
			if (obj instanceof Array) return obj.map(d => findReplace$$Merge(d));
			else {
				Object.entries(obj).forEach(([k, v]) => {
					if (k === "$$merge") {
						const merged = {};
						v.forEach(toMerge => {
							// handle any mergeable children
							toMerge = findReplace$$Merge(toMerge);
							// resolve references
							toMerge = (() => {
								if (!toMerge.$ref) return toMerge;
								else {
									const [file, path] = toMerge.$ref.split("#");
									const pathParts = path.split("/").filter(Boolean);

									let refData;
									if (file) {
										const externalSchema = loadJSON(file);
										refData = MiscUtil.get(externalSchema, ...pathParts);
									} else {
										refData = MiscUtil.get(schema, ...pathParts);
									}

									if (!refData) throw new Error(`Could not find referenced data!`);
									return refData;
								}
							})();
							// merge
							deepMerge(merged, toMerge);
						});
						delete obj[k];
						deepMerge(obj, merged);
					} else obj[k] = findReplace$$Merge(v);
				});
				return obj;
			}
		} else return obj;
	}
	findReplace$$Merge(schema);
	return schema;
}

async function main () {
	console.log(`##### Validating JSON against schemata #####`);

	// a probably-unnecessary directory shift to ensure the JSON schema internal references line up
	const cacheDir = process.cwd();
	process.chdir(`${cacheDir}/test/schema`);

	const PRELOAD_SINGLE_FILE_SCHEMAS = [
		"trapshazards.json",
		"objects.json",
		"items.json",
	];

	ajv.addSchema(preprocess(loadJSON("spells/spell.json", "utf8")), "spell.json");
	ajv.addSchema(preprocess(loadJSON("bestiary/bestiary.json", "utf8")), "bestiary.json");
	PRELOAD_SINGLE_FILE_SCHEMAS.forEach(schemaName => {
		ajv.addSchema(preprocess(loadJSON(schemaName, "utf8")), schemaName);
	})
	ajv.addSchema(preprocess(loadJSON("entry.json", "utf8")), "entry.json");
	ajv.addSchema(preprocess(loadJSON("util.json", "utf8")), "util.json");

	// Get schema files, ignoring directories
	const schemaFiles = fs.readdirSync(`${cacheDir}/test/schema`)
		.filter(file => file.endsWith(".json"));

	const SCHEMA_BLACKLIST = new Set(["entry.json", "util.json"]);

	for (let i = 0; i < schemaFiles.length; ++i) {
		const schemaFile = schemaFiles[i];
		if (!SCHEMA_BLACKLIST.has(schemaFile)) {
			const dataFile = schemaFile; // data and schema filenames match

			console.log(`Testing data/${dataFile}`.padEnd(50), `against schema/${schemaFile}`);

			const data = loadJSON(`${cacheDir}/data/${dataFile}`);
			// Avoid re-adding schemas we have already loaded
			if (!PRELOAD_SINGLE_FILE_SCHEMAS.includes(schemaFile)) {
				const schema = loadJSON(schemaFile, "utf8");
				ajv.addSchema(preprocess(schema), schemaFile);
			}

			addImplicits(data);
			const valid = ajv.validate(schemaFile, data);
			if (!valid) return handleError(valid);
		}
	}

	// Get schema files in directories
	const schemaDirectories = fs.readdirSync(`${cacheDir}/test/schema`)
		.filter(category => !category.endsWith(".json"));

	for (let i = 0; i < schemaDirectories.length; ++i) {
		const schemaDir = schemaDirectories[i];
		console.log(`Testing category ${schemaDir}`);
		const schemaFiles = fs.readdirSync(`${cacheDir}/test/schema/${schemaDir}`);

		const dataFiles = fs.readdirSync(`${cacheDir}/data/${schemaDir}`);
		for (let i = 0; i < dataFiles.length; ++i) {
			const dataFile = dataFiles[i];

			const relevantSchemaFiles = schemaFiles.filter(schema => dataFile.startsWith(schema.split(".")[0]));
			for (let i = 0; i < relevantSchemaFiles.length; ++i) {
				const schemaFile = relevantSchemaFiles[i];

				console.log(`Testing data/${schemaDir}/${dataFile}`.padEnd(50), `against schema/${schemaDir}/${schemaFile}`);

				const data = loadJSON(`${cacheDir}/data/${schemaDir}/${dataFile}`);
				const schema = loadJSON(`${cacheDir}/test/schema/${schemaDir}/${schemaFile}`, "utf8");
				// only add the schema if we didn't do so already for this category
				if (!ajv.getSchema(schemaFile)) ajv.addSchema(preprocess(schema), schemaFile);

				addImplicits(data);
				const valid = ajv.validate(schemaFile, data);
				if (!valid) return handleError(valid);
			}
		}
	}

	console.log(`All schema tests passed.`);
	process.chdir(cacheDir); // restore working directory

	return true;
}

module.exports = main();
