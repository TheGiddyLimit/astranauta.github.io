"use strict";

class Blacklist {
	static getDisplayCategory (cat) {
		if (cat === "variantrule") return "Variant Rule";
		if (cat === "optionalfeature") return "Optional Feature";
		if (cat === "variant") return "Magic Item Variant";
		if (cat === "classFeature") return "Class Feature";
		if (cat === "subclassFeature") return "Subclass Feature";
		return cat.uppercaseFirst();
	}

	static getDisplayValues (category, source) {
		const displaySource = source === "*" ? source : Parser.sourceJsonToFullCompactPrefix(source);
		const displayCategory = category === "*" ? category : Blacklist.getDisplayCategory(category);
		return {displaySource, displayCategory};
	}

	static _renderList () {
		ExcludeUtil.getList()
			.sort((a, b) => SortUtil.ascSort(a.source, b.source) || SortUtil.ascSort(a.category, b.category) || SortUtil.ascSort(a.displayName, b.displayName))
			.forEach(({displayName, hash, category, source}) => Blacklist._addListItem(displayName, hash, category, source));
		Blacklist._list.init();
		Blacklist._list.update();
	}

	static _getDisplayNamePrefix_classFeature (it) { return `${it.className} ${it.level}: ` }
	static _getDisplayNamePrefix_subclassFeature (it) { return `${it.className} (${it.subclassShortName}) ${it.level}: ` }

	static async pInitialise () {
		const $iptSearch = $(`#search`);
		Blacklist._list = new List({
			$iptSearch,
			$wrpList: $(`.blacklist`),
			isUseJquery: true,
		});
		Blacklist._listId = 1;

		const FILES = [
			"backgrounds.json",
			"cultsboons.json",
			"deities.json",
			"feats.json",
			"magicvariants.json",
			"optionalfeatures.json",
			"objects.json",
			"psionics.json",
			"races.json",
			"rewards.json",
			"trapshazards.json",
			"variantrules.json",
		];

		const $selSource = $(`#bl-source`);
		const $selCategory = $(`#bl-category`);
		const $selName = $(`#bl-name`);

		const data = {};

		function mergeData (fromRec) {
			Object.keys(fromRec).filter(it => !Blacklist._IGNORED_CATEGORIES.has(it))
				.forEach(k => data[k] ? data[k] = data[k].concat(fromRec[k]) : data[k] = fromRec[k])
		}

		// LOAD DATA ===============================================================================
		// bestiary
		mergeData({monster: await DataUtil.monster.pLoadAll()});

		// spells
		mergeData({spell: await DataUtil.spell.pLoadAll()});

		// classes
		const classData = await DataUtil.class.loadRawJSON();
		for (const c of classData.class) {
			const classHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](c);

			const subBlacklist = classData.classFeature
				.filter(it => it.className === c.name && it.classSource === c.source)
				.map(it => {
					const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](it);
					const displayName = `${Blacklist._getDisplayNamePrefix_subclassFeature(it)}${it.name}`;
					return {displayName, hash, category: "classFeature", source: it.source};
				});
			MiscUtil.set(Blacklist._SUB_BLACKLIST_ENTRIES, "class", classHash, subBlacklist);

			for (const sc of (c.subclasses || [])) {
				// init className and classSource
				sc.className = sc.className || c.name
				sc.classSource = sc.classSource || c.source;
				sc.source = sc.source || c.source;
				sc.shortName = sc.shortName || sc.name;

				const subclassHash = UrlUtil.URL_TO_HASH_BUILDER["subclass"](sc);

				const subBlacklist = classData.subclassFeature
					.filter(it => it.className === c.name && it.classSource === c.source && it.subclassShortName === sc.shortName && it.subclassSource === sc.source)
					.map(it => {
						const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](it);
						const displayName = `${Blacklist._getDisplayNamePrefix_subclassFeature(it)}${it.name}`;
						return {displayName, hash, category: "subclassFeature", source: it.source};
					});
				MiscUtil.set(Blacklist._SUB_BLACKLIST_ENTRIES, "subclass", subclassHash, subBlacklist);
			}
		}
		classData.subclass = classData.subclass || [];
		classData.class.forEach(c => classData.subclass = classData.subclass.concat(c.subclasses || []));
		mergeData(classData);

		// everything else
		const promises = FILES.map(url => DataUtil.loadJSON(`data/${url}`));
		promises.push(async () => ({item: await Renderer.items.pBuildList({isAddGroups: true})}));
		const contentData = await Promise.all(promises);
		contentData.forEach(d => {
			if (d.race) d.race = Renderer.race.mergeSubraces(d.race);
			if (d.variant) d.variant.forEach(it => it.source = it.source || it.inherits.source);
			mergeData(d);
		});

		// PROCESS DATA ============================================================================
		const sourceSet = new Set();
		const catSet = new Set();
		Object.keys(data).forEach(cat => {
			catSet.add(cat);
			const arr = data[cat];
			arr.forEach(it => sourceSet.has(it.source) || sourceSet.add(it.source));
		});

		[...sourceSet]
			.sort((a, b) => SortUtil.ascSort(Parser.sourceJsonToFull(a), Parser.sourceJsonToFull(b)))
			.forEach(source => $selSource.append(`<option value="${source}">${Parser.sourceJsonToFull(source)}</option>`));

		[...catSet]
			.sort((a, b) => SortUtil.ascSort(Blacklist.getDisplayCategory(a), Blacklist.getDisplayCategory(b)))
			.forEach(cat => $selCategory.append(`<option value="${cat}">${Blacklist.getDisplayCategory(cat)}</option>`));

		function onSelChange () {
			function populateName (arr, cat) {
				let copy;
				switch (cat) {
					case "subclass": {
						copy = arr
							.map(it => ({name: it.name, source: it.source, className: it.className, classSource: it.classSource, shortName: it.shortName}))
							.sort((a, b) => SortUtil.ascSortLower(a.className, b.className) || SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
						break;
					}
					case "classFeature": {
						copy = arr
							.map(it => ({name: it.name, source: it.source, className: it.className, classSource: it.classSource, level: it.level}))
							.sort((a, b) => SortUtil.ascSortLower(a.className, b.className) || SortUtil.ascSort(a.level, b.level) || SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
						break;
					}
					case "subclassFeature": {
						copy = arr
							.map(it => ({name: it.name, source: it.source, className: it.className, classSource: it.classSource, level: it.level, subclassShortName: it.subclassShortName, subclassSource: it.subclassSource}))
							.sort((a, b) => SortUtil.ascSortLower(a.className, b.className) || SortUtil.ascSortLower(a.subclassShortName, b.subclassShortName) || SortUtil.ascSort(a.level, b.level) || SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
						break;
					}
					default: {
						copy = arr.map(({name, source}) => ({name, source})).sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source))
						break;
					}
				}
				const dupes = new Set();
				let temp = "";
				copy.forEach((it, i) => {
					let hash;
					let prefix = "";
					switch (cat) {
						case "subclass": hash = UrlUtil.URL_TO_HASH_BUILDER["subclass"](it); prefix = `${it.className}: `; break;
						case "classFeature": hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](it); prefix = Blacklist._getDisplayNamePrefix_classFeature(it); break;
						case "subclassFeature": hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](it); prefix = Blacklist._getDisplayNamePrefix_subclassFeature(it); break;
					}
					if (!hash) hash = UrlUtil.encodeForHash([it.name, it.source]);
					const displayName = `${prefix}${it.name}${(dupes.has(it.name) || (copy[i + 1] && copy[i + 1].name === it.name)) ? ` (${Parser.sourceJsonToAbv(it.source)})` : ""}`;

					temp += `<option value="${hash.escapeQuotes()}|${displayName.escapeQuotes()}">${displayName.escapeQuotes()}</option>`;
					dupes.add(it.name);
				});
				$selName.append(temp);
			}

			const cat = $selCategory.val();
			$selName.empty();
			$selName.append(`<option value="*|*">*</option>`);
			if (cat !== "*") {
				const source = $selSource.val();
				if (source === "*") populateName(data[cat], cat);
				else populateName(data[cat].filter(it => it.source === source), cat);
			}
		}

		$selSource.change(onSelChange);
		$selCategory.change(onSelChange);

		Blacklist._renderList();

		const $page = $(`#main_content`);
		$page.find(`.loading`).prop("disabled", false);
		$page.find(`.loading-temp`).remove();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	static _addListItem (displayName, hash, category, source) {
		const display = Blacklist.getDisplayValues(category, source);

		const id = Blacklist._listId++;

		const $btnRemove = $(`<button class="btn btn-xxs btn-danger m-1">Remove</button>`)
			.click(() => {
				Blacklist.remove(id, hash, category, source);
			});

		const $ele = $$`<li class="row no-click flex-v-center lst--border">
			<span class="col-5">${Parser.sourceJsonToFull(source)}</span>
			<span class="col-3">${display.displayCategory}</span>
			<span class="bold col-3">${displayName}</span>
			<span class="col-1 text-center">${$btnRemove}</span>
		</li>`;

		const listItem = new ListItem(
			id,
			$ele,
			displayName,
			{category: display.displayCategory},
			{
				displayName: displayName,
				hash: hash,
				category: category,
				source: source,
			},
		);

		Blacklist._list.addItem(listItem);
	}

	static add () {
		const $selSource = $(`#bl-source`);
		const $selCategory = $(`#bl-category`);
		const $selName = $(`#bl-name`);

		const source = $selSource.val();
		const category = $selCategory.val();
		const [hash, displayName] = $selName.val().split("|");

		if (source === "*" && category === "*" && hash === "*" && !window.confirm("This will exclude all content from all list pages. Are you sure?")) return;

		if (ExcludeUtil.addExclude(displayName, hash, category, source)) {
			Blacklist._addListItem(displayName, hash, category, source);

			const subBlacklist = MiscUtil.get(Blacklist._SUB_BLACKLIST_ENTRIES, category, hash);
			if (subBlacklist) {
				subBlacklist.forEach(it => {
					const {displayName, hash, category, source} = it;
					ExcludeUtil.addExclude(displayName, hash, category, source)
					Blacklist._addListItem(displayName, hash, category, source);
				});
			}

			Blacklist._list.update();
		}
	}

	static addAllUa () {
		$(`#bl-source`).find(`option`).each((i, e) => {
			const val = $(e).val();
			if (val === "*" || !SourceUtil.isNonstandardSource(val)) return;

			if (ExcludeUtil.addExclude("*", "*", "*", val)) {
				Blacklist._addListItem("*", "*", "*", val);
			}
		});
		Blacklist._list.update();
	}

	static removeAllUa () {
		$(`#bl-source`).find(`option`).each((i, e) => {
			const val = $(e).val();
			if (val === "*" || !SourceUtil.isNonstandardSource(val)) return;
			this._removeSourceByOptionValue(val);
		});
	}

	static addAllSources () {
		$(`#bl-source`).find(`option`).each((i, e) => {
			const val = $(e).val();
			if (val === "*") return;

			if (ExcludeUtil.addExclude("*", "*", "*", val)) {
				Blacklist._addListItem("*", "*", "*", val);
			}
		});
		Blacklist._list.update();
	}

	static removeAllSources () {
		$(`#bl-source`).find(`option`).each((i, e) => {
			const val = $(e).val();
			if (val === "*") return;
			this._removeSourceByOptionValue(val);
		});
	}

	static _removeSourceByOptionValue (val) {
		const item = Blacklist._list.items.find(it => it.data.hash === "*" && it.data.category === "*" && it.data.source === val);
		if (item) {
			Blacklist.remove(item.ix, "*", "*", val)
		}
	}

	static remove (ix, hash, category, source) {
		ExcludeUtil.removeExclude(hash, category, source);
		Blacklist._list.removeItem(ix);
		Blacklist._list.update();
	}

	static export () {
		const filename = `content-blacklist`;
		DataUtil.userDownload(filename, JSON.stringify({blacklist: ExcludeUtil.getList()}, null, "\t"));
	}

	static import (evt) {
		function loadSaved (event, additive) {
			const input = event.target;

			const reader = new FileReader();
			reader.onload = async () => {
				const text = reader.result;
				const json = JSON.parse(text);

				// clear list display
				Blacklist._list.removeAllItems();
				Blacklist._list.update();

				// update storage
				if (!additive) await ExcludeUtil.pSetList(json.blacklist || []);
				else await ExcludeUtil.pSetList(ExcludeUtil.getList().concat(json.blacklist || []));

				// render list display
				Blacklist._renderList();

				$iptAdd.remove();
			};
			reader.readAsText(input.files[0]);
		}

		const additive = evt.shiftKey;
		const $iptAdd = $(`<input type="file" accept=".json" style="position: fixed; top: -100px; left: -100px; display: none;">`).on("change", (evt) => {
			loadSaved(evt, additive);
		}).appendTo($(`body`));
		$iptAdd.click();
	}

	static reset () {
		ExcludeUtil.resetExcludes();
		Blacklist._list.removeAllItems();
		Blacklist._list.update();
	}
}
Blacklist._IGNORED_CATEGORIES = new Set([
	"_meta",
	"linkedLootTables",
]);
Blacklist._SUB_BLACKLIST_ENTRIES = {};

window.addEventListener("load", async () => {
	await ExcludeUtil.pInitialise();
	Blacklist.pInitialise();
});
