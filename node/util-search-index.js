const ut = require('../js/utils.js');
const er = require('../js/entryrender.js');
const od = require('../js/omnidexer.js');

UtilSearchIndex = {};

UtilSearchIndex._test_getBasicVariantItems = function () {
	if (!this.basicVariantItems) {
		const basics = require(`../data/basicitems.json`);
		const rawVariants = require(`../data/magicvariants.json`);
		const variants = rawVariants.variant.map(v => {
			return {
				source: v.inherits.source,
				nameSuffix: v.inherits.nameSuffix,
				namePrefix: v.inherits.namePrefix,
				requires: v.requires,
				excludes: v.excludes
			}
		});

		const out = [];
		basics.basicitem.forEach(b => {
			variants.forEach(v => {
				let hasRequired = b.name.indexOf(" (") === -1;
				hasRequired = hasRequired && Object.keys(v.requires).every(req => b[req] === v.requires[req]);
				if (v.excludes) {
					hasRequired = hasRequired && Object.keys(v.excludes).every(ex => b[ex] !== v.excludes[ex]);
				}

				if (hasRequired) {
					const copy = JSON.parse(JSON.stringify(b));
					if (v.namePrefix) copy.name = v.namePrefix + copy.name;
					if (v.nameSuffix) copy.name += v.nameSuffix;
					copy.source = v.source;
					out.push(copy);
				}
			})
		});

		this.basicVariantItems = out;
	}
	return this.basicVariantItems;
};

UtilSearchIndex.getIndex = function (doLogging = true, test_doExtraIndex = false) {
	const indexer = new od.Omnidexer();

	od.Omnidexer.TO_INDEX__FROM_INDEX_JSON.forEach(ti => {
		const index = require(`../data/${ti.dir}/index.json`);
		Object.values(index).forEach(j => {
			const absF = `../data/${ti.dir}/${j}`;
			const contents = require(absF);
			if (doLogging) console.log(`indexing ${absF}`);
			indexer.addToIndex(ti, contents, undefined, test_doExtraIndex);
		})
	});

	od.Omnidexer.TO_INDEX.forEach(ti => {
		const f = `../data/${ti.file}`;
		const j = require(f);

		function addData (j) {
			if (doLogging) console.log(`indexing ${f}`);
			indexer.addToIndex(ti, j, undefined, test_doExtraIndex);

			if (test_doExtraIndex && ti.test_extraIndex) {
				const extra = ti.test_extraIndex();
				extra.forEach(add => indexer.index.push(add));
			}
		}

		if (ti.postLoad) ti.postLoad(j, addData);
		else addData(j);
	});

	return indexer.getIndex();
};

module.exports.UtilSearchIndex = UtilSearchIndex;