const fs = require('fs');
const ut = require("../js/utils");

class GenTables {
	constructor () {
		this.sectionOrders = {};
	}

	static get BOOK_BLACKLIST () {
		return [];
	}

	loadBooks () {
		const index = JSON.parse(fs.readFileSync(`./data/books.json`, "utf-8"));
		return index.book.map(idx => {
			if (!GenTables.BOOK_BLACKLIST[idx.id]) {
				idx.bookData = JSON.parse(fs.readFileSync(`./data/book/book-${idx.id.toLowerCase()}.json`, "utf-8"));
				return idx;
			}
		}).filter(it => it);
	}

	getTableSectionIndex (chapterName, sectionName, dryRun) {
		((this.sectionOrders[chapterName] =
			this.sectionOrders[chapterName] || {})[sectionName] =
			this.sectionOrders[chapterName][sectionName] || 1);
		const val = this.sectionOrders[chapterName][sectionName];
		if (!dryRun) this.sectionOrders[chapterName][sectionName]++;
		return val;
	}

	search (chapterMeta, section, data, outStacks) {
		if (data.data && data.data.tableIgnore) return;
		if (data.entries) {
			const nxtSection = data.name || section;
			data.entries.forEach(ent => this.search(chapterMeta, nxtSection, ent, outStacks));
		} else if (data.items) {
			data.items.forEach(item => this.search(chapterMeta, section, item, outStacks));
		} else if (data.type === "table") {
			const cpy = MiscUtil.copy(data);
			this._search__setMeta(cpy, chapterMeta, section);
			outStacks.table.push(cpy);
		} else if (data.type === "tableGroup") {
			const cpy = MiscUtil.copy(data);
			this._search__setMeta(cpy, chapterMeta, section);
			outStacks.tableGroup.push(cpy);
		}
	}

	_search__setMeta (obj, chapterMeta, section) {
		obj.chapter = chapterMeta;
		obj.section = section;
		obj.sectionIndex = this.getTableSectionIndex(chapterMeta.name, section);
	}

	static _cleanSectionName (name) {
		return name.replace(/^(?:Step )?[-\d]+[:.]?\s*/, "");
	}

	static _isSectionInTitle (section, title) {
		return title.toLowerCase().includes(section.toLowerCase())
	}

	static _cleanData (table) {
		delete table.section;
		delete table.sectionIndex;

		// clean chapter
		if (table.data && table.data.tableChapterIgnore) {
			delete table.chapter;
		} else {
			const chapterOut = {};
			chapterOut.name = table.chapter.name;
			chapterOut.ordinal = table.chapter.ordinal;
			chapterOut.index = table.chapter.index;
			table.chapter = chapterOut;
		}

		delete table.data;
	}

	run () {
		const books = this.loadBooks();
		let tables = [];
		let tableGroups = [];

		books.forEach(book => {
			const stacks = {table: [], tableGroup: []};
			book.bookData.data.forEach((chapter, i) => {
				const chapterMeta = book.contents[i];
				chapterMeta.index = i;
				this.search(chapterMeta, book.name, chapter, stacks);
			});

			const tablesToAdd = stacks.table.map(it => {
				const cleanSection = GenTables._cleanSectionName(it.section);

				if (it.caption) {
					if (GenTables._isSectionInTitle(cleanSection, it.caption)) {
						it.name = it.caption;
					} else {
						it.name = `${cleanSection}; ${it.caption}`;
					}
				} else {
					if (it.sectionIndex === 1 && this.getTableSectionIndex(it.chapter.name, it.section, true) === 2) {
						it.name = cleanSection;
					} else {
						it.name = `${cleanSection}; ${it.sectionIndex}`;
					}
				}

				it.source = book.id;
				GenTables._cleanData(it);
				return it;
			});

			const tableGroupsToAdd = stacks.tableGroup.map(it => {
				const cleanSection = GenTables._cleanSectionName(it.section);
				if (!it.name) throw new Error("Group had no name!");

				if (!GenTables._isSectionInTitle(cleanSection, it.name)) {
					it.name = `${cleanSection}; ${it.name}`;
				}

				it.source = book.id;
				GenTables._cleanData(it);
				return it;
			});

			tables = tables.concat(tablesToAdd);
			tableGroups = tableGroups.concat(tableGroupsToAdd);
		});

		const toSave = JSON.stringify({table: tables, tableGroup: tableGroups});
		fs.writeFileSync(`./data/generated/gendata-tables.json`, toSave, "utf-8");
	}
}

const generator = new GenTables();
generator.run();