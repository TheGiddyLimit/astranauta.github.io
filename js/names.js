"use strict";

const JSON_URL = "data/names.json";

let nameList;
const renderer = new EntryRenderer();

function makeContentsBlock (i, loc) {
	let out =
		"<ul>";

	loc.tables.forEach((t, j) => {
		const tableName = getTableName(loc, t);
		out +=
			`<li>
				<a id="${i},${j}" href="#${UrlUtil.encodeForHash([loc.race, loc.source, t.option])}" title="${tableName}">${tableName}</a>
			</li>`;
	});

	out +=
		"</ul>";
	return out;
}

function getTableName (loc, table) {
	return `${loc.race} - ${table.option}`;
}

window.onload = function load () {
	loadJSON(JSON_URL, onJsonLoad);
};

function onJsonLoad (data) {
	nameList = data.name;

	const namesList = $("ul.names");
	let tempString = "";
	for (let i = 0; i < nameList.length; i++) {
		const loc = nameList[i];

		tempString +=
			`<li>
				<span class="name" onclick="showHideList(this)" title="Source: ${Parser.sourceJsonToFull(loc.source)}">${loc.race}</span>
				${makeContentsBlock(i, loc)}
			</li>`;
	}
	namesList.append(tempString);

	const list = search({
		valueNames: ["name"],
		listClass: "names"
	});

	initHistory();
}

function showHideList (ele) {
	const $ele = $(ele);
	$ele.next(`ul`).toggle();
}

function loadhash (id) {
	const [iLoad, jLoad] = id.split(",").map(n => Number(n));
	const race = nameList[iLoad];
	const table = race.tables[jLoad].table;
	const tableName = getTableName(race, race.tables[jLoad]);

	let htmlText = `
		<tr>
			<td colspan="6">
				<table>
					<caption>${tableName}</caption>
					<thead>
						<tr>
							<th class="col-xs-2 text-align-center">
								<span class="roller" onclick="rollAgainstTable('${iLoad}', '${jLoad}')">d100</span>
							</th>
							<th class="col-xs-10">Name</th>
						</tr>
					</thead>`;

	for (let i = 0; i < table.length; i++) {
		const range = table[i].min === table[i].max ? pad(table[i].min) : `${pad(table[i].min)}-${pad(table[i].max)}`;
		htmlText += `<tr><td class="text-align-center">${range}</td><td>${getRenderedText(table[i].enc)}</td></tr>`;
	}

	htmlText += `
				</table>
			</td>
		</tr>`;
	$("#stats").html(htmlText);
}

function pad (number) {
	return String(number).padStart(2, "0");
}

function getRenderedText (rawText) {
	if (rawText.indexOf("{@") !== -1) {
		const stack = [];
		renderer.recursiveEntryRender(rawText, stack);
		return stack.join("");
	} else return rawText;
}

function rollAgainstTable (iLoad, jLoad) {
	iLoad = Number(iLoad);
	jLoad = Number(jLoad);
	const race = nameList[iLoad];
	const table = race.tables[jLoad];
	const rollTable = table.table;

	const die = "1d100";
	const roll = droll.roll(die);
	roll.total = roll.total - 1; // -1 since droll thinks d100's go from 1-100

	let result;
	for (let i = 0; i < rollTable.length; i++) {
		const row = rollTable[i];
		if (roll.total >= row.min && (row.max === undefined || roll.total <= row.max)) {
			result = getRenderedText(row.enc);
			break;
		}
	}

	// add dice results
	result = result.replace(DICE_REGEX, function (match) {
		const resultRoll = droll.roll(match);
		return `<span class="roller" onclick="reroll(this)">${match}</span> <span class="result">(${resultRoll.total})</span>`
	});

	$("div#output").prepend(
		`<span>${race.race} - ${table.option}: <em>${die}</em> rolled <strong>${pad(roll.total)}</strong> \u2014 ${result}<br></span>`).show();
	$("div#output > span:eq(5)").remove();
}

function reroll (ele) {
	const $ele = $(ele);
	const resultRoll = droll.roll($ele.html());
	$ele.next(".result").html(`(${resultRoll.total})`)
}