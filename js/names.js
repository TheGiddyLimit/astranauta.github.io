"use strict";

const tablePage = new TablePage({
	jsonUrl: "data/names.json",
	dataProp: "name",
	listClass: "names",
	tableCol1: "Name",
	fnGetTableName: (meta, table) => `${meta.name} - ${table.option}`,
	fnGetTableHash: (meta, table) => UrlUtil.encodeForHash([meta.name, meta.source, table.option]),
});

window.addEventListener("load", tablePage.pInit.bind(tablePage));
