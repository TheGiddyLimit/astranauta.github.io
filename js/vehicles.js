"use strict";

class VehiclesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterVehicles();
		super({
			dataSource: "data/vehicles.json",
			dataSourceFluff: "data/fluff-vehicles.json",

			pageFilter,

			listClass: "vehicles",

			sublistClass: "subvehicles",

			dataProps: ["vehicle"],
		});
	}

	getListItem (it, vhI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${UrlUtil.autoEncodeHash(it)}" class="lst--border">
			<span class="bold col-6 pl-0">${it.name}</span>
			<span class="col-4 text-center">${Parser.vehicleTypeToFull(it.vehicleType)}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			vhI,
			eleLi,
			it.name,
			{
				hash,
				source,
				vehicleType: it.vehicleType,
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : vhI,
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => this._pageFilter.toDisplay(f, this._dataList[item.ix]));
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const $ele = $(`<li class="row"><a href="#${hash}" class="lst--border">
			<span class="bold col-8 pl-0">${it.name}</span>
			<span class="col-4 pr-0 text-center">${Parser.vehicleTypeToFull(it.vehicleType)}</span>
		</a></li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				vehicleType: it.vehicleType,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const veh = this._dataList[id];
		const $content = $(`#pagecontent`).empty();
		const $floatToken = $(`#float-token`).empty();

		function buildStatsTab () {
			const hasToken = veh.tokenUrl || veh.hasToken;
			if (hasToken) {
				const imgLink = Renderer.vehicle.getTokenUrl(veh);
				$floatToken.append(`<a href="${imgLink}" target="_blank" rel="noopener noreferrer"><img src="${imgLink}" id="token_image" class="token" alt="${veh.name}"></a>`);
			}

			$content.append(RenderVehicles.$getRenderedVehicle(veh));
		}

		function buildFluffTab (isImageTab) {
			return Renderer.utils.pBuildFluffTab({
				isImageTab,
				$content,
				entity: veh,
				pFnGetFluff: Renderer.vehicle.pGetFluff,
			});
		}

		const statTab = Renderer.utils.tabButton(
			"Item",
			() => $floatToken.show(),
			buildStatsTab,
		);
		const infoTab = Renderer.utils.tabButton(
			"Info",
			() => $floatToken.hide(),
			buildFluffTab,
		);
		const picTab = Renderer.utils.tabButton(
			"Images",
			() => $floatToken.hide(),
			() => buildFluffTab(true),
		);

		Renderer.utils.bindTabButtons(statTab, infoTab, picTab);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const vehiclesPage = new VehiclesPage();
window.addEventListener("load", () => vehiclesPage.pOnLoad());
