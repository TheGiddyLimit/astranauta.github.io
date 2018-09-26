var $$filterButtonFunction = function (evt) {
  console.log('evt:', evt);
	var $this = $(this);
	var sorted = $this.hasClass("asc")

	$("#filtertools").find(".caret").removeClass("caret");
	$this.find("span").addClass("caret")
		.toggleClass("caret-reverse", $this.hasClass("asc"));
};

$("#filtertools-mundane").find("button.sort").on(EVNT_CLICK, $$filterButtonFunction);
$("#filtertools-magic").find("button.sort").on(EVNT_CLICK, $$filterButtonFunction);
$("#filtertools").find("button.sort").on(EVNT_CLICK, $$filterButtonFunction);