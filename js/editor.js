window.onload = loadeditor

function loadeditor() {
	$('#editor').trumbowyg();


	$("#generatecode").click(function() {
		var code = $("#editor").html();
		code = code.replace(/\n|\t/g, ' ');
		code = code.replace(/"/g, '\\"');
		code = code.replace(/'/g, "\\u2019");
		$("#code").html(code);
	})

}
