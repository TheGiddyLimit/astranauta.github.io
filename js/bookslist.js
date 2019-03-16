"use strict";

class BooksList {
	constructor (options) {
		this.contentsUrl = options.contentsUrl;
		this.sortFn = options.sortFn;
		this.dataProp = options.dataProp;
		this.enhanceRowDataFn = options.enhanceRowDataFn;
		this.rootPage = options.rootPage;
		this.rowBuilderFn = options.rowBuilderFn;

		this.list = null;
		this.dataIx = 0;
		this.dataList = [];
	}

	onPageLoad () {
		ExcludeUtil.pInitialise(); // don't await, as this is only used for search
		SortUtil.initHandleFilterButtonClicks();
		DataUtil.loadJSON(this.contentsUrl).then(this.onJsonLoad.bind(this));
	}

	onJsonLoad (data) {
		const sortFunction = (a, b, o) => self.sortFn(self.dataList, a, b, o);
		this.list = new List("listcontainer", {
			valueNames: ["name"],
			listClass: "books",
			sortFunction
		});

		const self = this;
		$("#filtertools").find("button.sort").click(function () {
			const $this = $(this);
			$('#filtertools').find('.caret').removeClass('caret--reverse caret');

			if ($this.attr("sortby") === "asc") {
				$this.find("span").addClass("caret caret--reverse");
				$this.attr("sortby", "desc");
			} else {
				$this.attr("sortby", "asc");
				$this.find("span").addClass("caret")
			}
			self.list.sort($this.data("sort"), {order: $this.attr("sortby"), sortFunction});
		});

		this.list.sort("name");
		$("#reset").click(function () {
			$("#search").val("");
			self.list.search();
			self.list.sort("name");
			self.list.filter();
			$(`.showhide`).each((i, ele) => {
				const $ele = $(ele);
				if (!$ele.data("hidden")) {
					BookUtil.indexListToggle(null, ele);
				}
			});
		});

		this.addData(data);
		BrewUtil.pAddBrewData()
			.then(handleBrew)
			.then(() => BrewUtil.pAddLocalBrewData())
			.catch(BrewUtil.pPurgeBrew)
			.then(() => BrewUtil.makeBrewButton("manage-brew"));
	}

	addData (data) {
		if (!data[this.dataProp] || !data[this.dataProp].length) return;

		this.dataList = this.dataList.concat(data[this.dataProp]);

		const $list = $("ul.books");
		let tempString = "";
		for (; this.dataIx < this.dataList.length; this.dataIx++) {
			const it = this.dataList[this.dataIx];
			if (this.enhanceRowDataFn) this.enhanceRowDataFn(it);

			tempString +=
				`<li ${FLTR_ID}="${this.dataIx}">
				<a href="${this.rootPage}#${UrlUtil.encodeForHash(it.id)}" title="${it.name}" class="book-name">
					<span class="full-width">
						${this.rowBuilderFn(it)}
					</span>
					<span class="showhide" onclick="BookUtil.indexListToggle(event, this)" data-hidden="true">[+]</span>
					<span class="source" style="display: none">${it.id}</span>
				</a>
				${BookUtil.makeContentsBlock({book: it, addPrefix: this.rootPage, defaultHidden: true})}
			</li>`;
		}
		const lastSearch = ListUtil.getSearchTermAndReset(this.list);
		$list.append(tempString);

		this.list.reIndex();
		if (lastSearch) this.list.search(lastSearch);
		this.list.sort("name");
	}
}
