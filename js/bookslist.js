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
		DataUtil.loadJSON(this.contentsUrl).then(this.onJsonLoad.bind(this));
	}

	onJsonLoad (data) {
		var list;
		this.list = new List("listcontainer", {
			valueNames: ["name", "source"],
			listClass: "books"
		});
		list = this.list;

		$("#filtertools").find("button.sort").on(EVNT_CLICK, function (evt) {
			const $this = $(this);
			$('#filtertools').find('.caret').removeClass('caret-reverse caret');

			if ($this.attr("sortby") === "asc") {
				$this.find('span').addClass("caret caret-reverse");
				$this.attr("sortby", "desc");
			} else {
				$this.attr("sortby", "asc");
				$this.find('span').addClass("caret")
			}
			$this.list.sort($this.data("sort"), {order: $this.attr("sortby"), sortFunction: this.sortFn});
		});

		this.list.sort("name");
		$("#reset").click(function () {
			$("#search").val("");
			this.list.search();
			this.list.sort("name");
			this.list.filter();
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
			.then(BrewUtil.pAddLocalBrewData)
			.catch(BrewUtil.purgeBrew)
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
				<a href="${this.rootPage}#${it.id}" title="${it.name}" class="book-name">
					<span class='name full-width'>
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