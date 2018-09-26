var $$filterButtonFunction = function (target, $this = $(this), direction) {
	if (!direction) {
		direction = $this.hasClass("asc") || $this.attr("data-sortby") === "asc" ? "asc" : "desc";
	}

	$(target).find(".caret").removeClass("caret");
	$this.find("span").addClass("caret")
		.toggleClass("caret-reverse", direction === "asc");
};

$("#filtertools").find("button.sort").click(function () { $$filterButtonFunction.call(this, "#filtertools"); });