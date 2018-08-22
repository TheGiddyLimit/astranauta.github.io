"use strict";

const JSON_URL = "data/names.json";

let nameList;
const renderer = EntryRenderer.getDefaultRenderer();

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
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
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

	const list = ListUtil.search({
		valueNames: ["name"],
		listClass: "names"
	});

	History.init(true);
}

function showHideList (ele) {
	const $ele = $(ele);
	$ele.next(`ul`).toggle();
}

function loadhash (id) {
	renderer.setFirstSection(true);

	const [iLoad, jLoad] = id.split(",").map(n => Number(n));
	const race = nameList[iLoad];
	const table = race.tables[jLoad].table;
	const tableName = getTableName(race, race.tables[jLoad]);
	const diceType = race.tables[jLoad].diceType;

	let htmlText = `
		<tr>
			<td colspan="6">
				<table class="striped-odd">
					<caption>${tableName}</caption>
					<thead>
						<tr>
							<th class="col-xs-2 text-align-center">
								<span class="roller" onclick="rollAgainstTable('${iLoad}', '${jLoad}')">d${diceType}</span>
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
	$("#pagecontent").html(htmlText);
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

	rollTable._rMax = rollTable.rMax == null ? Math.max(...rollTable.filter(it => it.min != null).map(it => it.min), ...rollTable.filter(it => it.max != null).map(it => it.max)) : rollTable.rMax;
	rollTable._rMin = rollTable._rMin == null ? Math.min(...rollTable.filter(it => it.min != null).map(it => it.min), ...rollTable.filter(it => it.max != null).map(it => it.max)) : rollTable._rMin;

	const roll = RollerUtil.randomise(rollTable._rMax, rollTable._rMin);

	let result;
	for (let i = 0; i < rollTable.length; i++) {
		const row = rollTable[i];
		const trueMin = row.max != null && row.max < row.min ? row.max : row.min;
		const trueMax = row.max != null && row.max > row.min ? row.max : row.min;
		if (roll >= trueMin && roll <= trueMax) {
			result = getRenderedText(row.enc);
			break;
		}
	}

	// add dice results
	result = result.replace(RollerUtil.DICE_REGEX, function (match) {
		const r = EntryRenderer.dice.parseRandomise(match);
		return `<span class="roller" onclick="reroll(this)">${match}</span> (<span class="result">${r.total}</span>)`
	});

	EntryRenderer.dice.addRoll({name: `${race.race} - ${table.option}`}, `<span><strong>${pad(roll)}</strong> ${result}</span>`);
}

function reroll (ele) {
	const $ele = $(ele);
	const resultRoll = EntryRenderer.dice.parseRandomise($ele.html());
	$ele.next(".result").html(resultRoll.total)
}