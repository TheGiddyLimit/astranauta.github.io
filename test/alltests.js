const Validator = require('jsonschema').Validator;

const TESTS_PASSED = 0;
const TESTS_FAILED = 1;

validateSchema();

function validateSchema(){
	const validator = new Validator();
	attachHelperSchemaTo(validator);

	let errors = [];
	const results = [];

	// Push all validation results here
	results.push(validateClassesWith(validator));

	results.forEach( (result) => {
		if(!result.valid){
			errors = errors.concat(result.errors);
		}
	});


	// Reporting
	if(errors.length > 0){
		console.error(errors);
		console.warn(`Tests failed: ${errors.length}`);
		process.exit(TESTS_FAILED);
	}
	else{
		console.log("All schema tests passed.");
		process.exit(TESTS_PASSED);
	}
}

/**
 * Reads and attaches all necessary helper subschemae 
 * to a Validator object.
 * @param  {jsonschema.Validator} validator The validator to attach the good stuff to
 * @return {void}
 */
function attachHelperSchemaTo(validator){
	const entrySchema = require("./schema/entry.json");
	validator.addSchema(entrySchema, "/Entry");
}

/**
 * Validates classes.json using its corresponding schema
 * @return {jsonschema.Result} The result of the validation.
 */
function validateClassesWith(validator){
	const classesSchema = require("./schema/classes.json");
	const classes = require("../data/classes.json")
	return validator.validate(classes, classesSchema);

}