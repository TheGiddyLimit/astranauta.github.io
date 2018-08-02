const fs = require('fs');
const git = require('simple-git')();

const FILES_TO_REPLACE_VERSION_IN = ['5etools.html'];
const VERSION_MARKER_START = '<!--5ETOOLS_VERSION__FOOTER_OPEN-->';
const VERSION_MARKER_END = '<!--5ETOOLS_VERSION__FOOTER_CLOSE-->';
const VERSION_REPLACE_REGEXP = new RegExp(VERSION_MARKER_START + '.*?' + VERSION_MARKER_END, 'g');

const version = process.env.npm_package_version;
const versionReplaceString = VERSION_MARKER_START + process.env.npm_package_version + VERSION_MARKER_END;
console.log('Replacing version in files ', FILES_TO_REPLACE_VERSION_IN, ' with ', version);

function createReplaceVersionCallback (fileName) {
	return (err, fileContents) => {
		if (err) {
			console.error('Error while reading file to replace version in:', err);
			process.exit(1);
		}

		const contentsWithReplacedVersion = fileContents.replace(VERSION_REPLACE_REGEXP, versionReplaceString);

		fs.writeFile(fileName, contentsWithReplacedVersion, 'utf8', createVersionReplacedCallback(fileName));
	};
}

function createVersionReplacedCallback (fileName) {
	return (err) => {
		if (err) {
			console.error('Error while writing file with replaced version: ', err);
			process.exit(1);
		}

		git.add(fileName, () => {
			console.log(arguments)
		})
	};
}

FILES_TO_REPLACE_VERSION_IN.forEach(fileName => {
	fs.readFile(fileName, 'utf8', createReplaceVersionCallback(fileName));
});