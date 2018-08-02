"use strict";

class GenUtil {
	static getFromTable (table, roll) {
		const it = {};
		Object.assign(it, table.find(it => {
			return it.min === roll || (it.max && roll >= it.min && roll <= it.max);
		}));
		Object.keys(it).forEach(k => {
			if (typeof it[k] === "function") {
				it[k] = it[k]();
			}
		});
		return it;
	}
}