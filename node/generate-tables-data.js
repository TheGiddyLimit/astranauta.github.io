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
		/*
		const temp = JSON.parse(fs.readFileSync(`path/to/some/file`, "utf-8"));
		temp.book[0].bookData = temp.bookData[0];
		return [temp.book[0]];
		 */

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

	search (path, chapterMeta, section, data, outStacks) {
		if (data.data && data.data.tableIgnore) return;
		if (data.entries) {
			const nxtSection = data.name || section;
			if (data.name) path.push(data.name);
			data.entries.forEach(ent => this.search(path, chapterMeta, nxtSection, ent, outStacks));
			if (data.name) path.pop();
		} else if (data.items) {
			if (data.name) path.push(data.name);
			data.items.forEach(item => this.search(path, chapterMeta, section, item, outStacks));
			if (data.name) path.pop();
		} else if (data.type === "table") {
			const cpy = MiscUtil.copy(data);
			const pathCpy = MiscUtil.copy(path);
			this._search__setMeta(cpy, chapterMeta, pathCpy, section);
			outStacks.table.push(cpy);
		} else if (data.type === "tableGroup") {
			const cpy = MiscUtil.copy(data);
			const pathCpy = MiscUtil.copy(path);
			this._search__setMeta(cpy, chapterMeta, pathCpy, section);
			outStacks.tableGroup.push(cpy);
		}
	}

	_search__setMeta (obj, chapterMeta, path, section) {
		obj.chapter = chapterMeta;
		obj.path = path;
		obj.section = section;
		obj.sectionIndex = this.getTableSectionIndex(chapterMeta.name, section);
	}

	static _cleanSectionName (name) {
		return name.replace(/^(?:Step )?[-\d]+[:.]?\s*/, "");
	}

	static _isSectionInTitle (sections, title) {
		return sections.some(section => title.toLowerCase().includes(section.toLowerCase()));
	}

	static _cleanData (table) {
		delete table.path;
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

		if (table.type === "table") delete table.type;
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
				const path = [];
				this.search(path, chapterMeta, book.name, chapter, stacks);
			});

			const tablesToAdd = stacks.table.map(it => {
				const cleanSections = it.path.map(section => GenTables._cleanSectionName(section));

				if (it.data && it.data.tableNamePrefix && it.caption) {
					it.name = `${it.data.tableNamePrefix}; ${it.caption}`;
				} else if (it.data && it.data.tableName) {
					it.name = it.data.tableName;
				} else if (it.caption) {
					if (GenTables._isSectionInTitle(cleanSections, it.caption)) {
						it.name = it.caption;
					} else {
						it.name = `${cleanSections.last()}; ${it.caption}`;
					}
				} else {
					if (it.sectionIndex === 1 && this.getTableSectionIndex(it.chapter.name, it.section, true) === 2) {
						it.name = cleanSections.last();
					} else {
						it.name = `${cleanSections.last()}; ${it.sectionIndex}`;
					}
				}

				it.source = book.id;
				GenTables._cleanData(it);
				return it;
			});

			const tableGroupsToAdd = stacks.tableGroup.map(it => {
				const cleanSections = it.path.map(section => GenTables._cleanSectionName(section));
				if (!it.name) throw new Error("Group had no name!");

				if (!GenTables._isSectionInTitle(cleanSections, it.name)) {
					it.name = `${cleanSections.last()}; ${it.name}`;
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
