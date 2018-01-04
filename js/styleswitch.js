"use strict";
const DAY_CSS =
	`
header {
	color: white;
	background-color: rgb(0, 107, 196);
}

header p.lead {
	color: lightgrey;
}

ul.list li:hover {
	background: lightgrey;
}

table#stats,
table#statsprof {
	background: #fdf1dc;
}

table#stats table tbody tr:nth-child(odd) {
	background: #e4d8c3;
}

th.border {
	border: 1px solid black;
	background: #e69a28;
}

tr.text td {
	;
	color: black !important;
}

table#stats td#typerarityattunement {
	color: black;
}

tr.text td {
	color: black !important;
}

table#stats td#sizetypealignment {
	color: black;
}

tr.trait td,
tr.action td,
tr.reaction td,
tr.legendary td {
	color: black !important;
}

.f-all-out,
.omnisearch-output {
	background: #fff;
}

#output {
	background: lightgrey;
}

.f-all-out > p:nth-child(odd),
.omnisearch-output p:nth-child(odd) {
	background: #f4f4f4;
}

div.omnisearch-pagination-wrapper > .pg-control:hover {
	color: #337ab7;
}

#crcalc label span.explanation {
	border: 1px solid lightgrey;
}

#msbcr tr:nth-child(even) {
	background: lightgrey;
}

#croutput {
	background: lightgrey;
}

/* section: class features */

td._class_feature.feature strong {
	color: #922610;
}

td._class_feature.subfeature strong {
	color: #922610;
}

td._class_feature.subfeature.sub2 span.inline-header {
	color: #922610;
	font-family: serif;
	font-weight: bold;
	font-style: italic;
}

table#stats td._class_feature table th {
	color: black;
}

/* end section: class features */

#classtable table {
	background: #fdf1dc;
}

#classtable table th {
	color: black;
}

#classtable table tr:nth-child(odd) td,
#rulescontent table tbody tr:nth-child(odd) td {
	background: lightgrey;
}

#rulescontent caption {
	color: black;
}

div#subclasses>span {
	background: lightgrey;
}

tr.trait td {
	color: black !important;
}

li.adventure-contents-item > ul > li.active,
li.adventure-contents-item > ul > ul.active > li > a {
	background: #f0f0f0;
}

li.adventure-contents-item > ul > ul.active > li > a:hover {
	background: lightgrey;
}

ul.list.adventures ul a:hover,
ul.list.contents > li a:hover,
ul.list.contents > li > ul.adv-contents > li > a > span:hover,
ul.list.contents > li > ul.adv-contents > li > a > span:hover {
	background: lightgrey;
}

ul.list.contents > li > ul.adv-contents > li a:hover {
	background: initial;
}

ul.list.adventures >  li > a > span.showhide:hover,
ul.list.adventures >  li > a > span.name:hover {
	background: lightgrey;
}
`;
const NIGHT_CSS =
	`
header {
	color: white;
	background-color: transparent;
}

header p.lead {
	color: black;
}

body {
	color: grey;
	background: #222 url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAABGBAMAAACDAP+3AAAAGFBMVEUfHx8eHh4dHR0bGxshISEiIiIlJSUjIyM9IpsJAAAFjUlEQVR4AT3UuZLcOBaF4QuI2XJxboIhF/eQFe1WovoBAAqccpkaZpc5+4yrXa8/RGpx/lrIXPjFCYjTp9z8REqF4VYNWB3Av3zQJ6b6xBwlKB/9kRkCjXVwGH3ziK5UcjFHVkmgY6osiBsGDFfseqq2ZbTz7E00qBDpzOxnD7ToABeros1vM6MX0rBQaG1ith1A/HJkvkHxsPGJ82dP8vVCyWmbyPTaAfGzg40bgIdrv2f3pBVPycUcufx+BSUUWDuCZi6zBqdM50ElKYPODqtLDjc31rBb9CZ59lbN/JScuMxHLUBcGiy6QRH9zpwgZGhRj8qSydPVgNNVgbWqYX3HbM9K2rqTnKVmsmwKWzc1ffEd20+Zq3Ji65kl6TSjALNvzmJt4Pi2f1etytGJmy5erLAgbNY4bjykC3YCLIS3nSZMKgwRsBarWgjdeVzIEDzpTkoOUArTF4WFXYHwxY585sT0nmTYMxmXfs8fzwswfnam8TMU49bvqSRnyRPnqlno4tVQQiH2A9Za8tNTfXQ0lxbSxUaZna0uLlj9Q0XzD96CpsOZUftolINKBWJpAOoAJC0T6QqZnOtfvcfJFcDrD4Cuy5Hng316XrqzJ204HynyHwWed6i+XGF40Uw2T7Lc71HyssngEOrgONfBY7wvW0UZdVAma5xmSNjRp3xkvKJkW6aSg7PK4K0+mbKqYB0WYBgWwxCXiS74zBCVlEFpYQDEwjcA1qccb5yO6ZL8ozt/h3wHSCdWzLuqxU2ZZ9ev9MvRMbMvV9BQgN0qrFjlkzPQanI9nuaGCokVK2LV1Y2egyY1aFQGxjM9I7RBBAgyGEJtpKHP0lUySSeWCpyKHMT2pmM/vyP55u2Rw5lcSeabAfgiG5TPDX3uP3QvcoSipJXQByUCjS4C8VXqxEEZOJxzmJoyogFNJBRsCJs2XmoWWrWFqTsnbwtSn43gNFTTob9/SEpaPJNhUBKDGoZGCMINxvBv8vuKbb//lg/sK0wfPgBica/QsSk5F3KK4Ui6Yw+uv4+DWEOFbhdPOnbY5PLFpzrZMhakeqomY0Vz0TO+elQGTWdCk1IYFAOaoZg0IJQhT+YreXF+yia+O1cgtGufjXxQw28f85RPXfd15zv13ABoD15kB7FKJ/7pbHKP6+9TgNgkVj68NeV8Tp24f7OOndCgJzR3RNJBPNFReCmstMVqvjjzBoeK4GOFoBN32CPxu+4TwwBDa4DJTe/OU9c9ku7EGyfOVxh+fw9g/AATxPqKTEXJKEdCIBkB4iBUlO6MjUrWi6M5Kz31YAqFsYaCeB0KJC5d1+foo3LQWSfRaDrwdAQrMEC27yDZXJf7TlOJ2Bczr1di3OWvZB6XrvvqPuWJPDk9dAHgm7LvuZJTEdKqO3J3XgostArEnvkqgUznx3PX7cSzz1FXZyvakTA4XVVMbCPFPK1cFj66S0WoqQI1XG2uoU7CMPquO2VaUDJFQMdVgXKD2bpz6ufzzxXbxszHQ9fGO/F7A998yBQG6cShE+P+Pk7t1FwfF1QHN1Eui1VapRxCdj8tCtI1bog1Fo011Sx9u3o6c9bufI6wAT26Av9xJ+WWpTKbbBPp3K/1LbC4Vuhv396RCbJw4untjxVPndj+dIB9dVD8z2dylZ+6vMeJwbYChHJkvHV2J3fdHsJPASeHhrXq6QheXu1nBhUr5u6ryT0I13BFKD01ViZ/n3oaziRG7c6Ayg7g1LPeztNdT36ueMqcN4XGv3finjfv+7I/kMJ4d046MUanOA1QtMH1kLlfFasm99NiutSw63yNDeH4zeL1Uu8XKHNfcThPSSNwchGMbgUETScwkCcK77pH2jsgrAssvVyB8FLJ7GrmwyD8eVqsHoY/FwIv9T7lPu9+Yf8/9+w4nS1ma78AAAAASUVORK5CYII=) repeat scroll left top !important;
}

h1,
h2,
h3,
h4,
h5,
h6 {
	color: grey;
}

.nav>li>a:focus,
.nav>li>a:hover {
	text-decoration: none;
	background-color: transparent;
}

.nav .open>a,
.nav .open>a:focus,
.nav .open>a:hover {
	background-color: transparent;
	border-color: #337ab7;
}

.btn-default {
	background-color: transparent !important;
	color: grey;
}

.dropdown-menu {
	background-color: #1a1a1a;
	color: grey;
}

.dropdown-menu>li>a {
	color: grey;
}

input.search {
	width: 62%;
	background-color: transparent !important;
}

input#omnisearch-input {
	background-color: transparent !important;
}

ul.list li:hover {
	background: black;
}

table#stats,
table#statsprof {
	background: #272727;
}

th.border {
	border: 1px solid #6f6f6f;
	background: #565656;
}

tr.text td {
	color: grey !important;
}

table#stats td#typerarityattunement {
	color: grey;
}

tr.text td {
	color: grey !important;
}

table#stats td#sizetypealignment {
	color: grey;
}

tr.trait td,
tr.action td,
tr.reaction td,
tr.legendary td {
	color: grey !important;
}

#output {
	background: rgba(0, 0, 0, 0.31);;
}

.f-all-wrapper > input,
.f-all-out,
.omnisearch-output {
	background: #303030;
}

.f-all-out > p:nth-child(odd),
.omnisearch-output p:nth-child(odd) {
	background: #202020;
}

div.omnisearch-pagination-wrapper > .pg-control:hover {
	color: #999;
}

#crcalc label span.explanation {
	border: 1px solid black;
}

#msbcr tr:nth-child(even) {
	background: rgba(0, 0, 0, 0.31);
}

#croutput {
	background: rgba(0, 0, 0, 0.31);
}

/* section: class features */

td._class_feature.feature strong {
	color: #337ab7;
}

td._class_feature.subfeature strong {
	color: #337ab7;
}

td._class_feature.subfeature.sub2 span.inline-header {
	color: #337ab7;
	font-family: serif;
	font-weight: bold;
	font-style: italic;
}

table#stats td._class_feature table th {
	color: grey;
}

/* end section: class features */

#classtable table {
	background: #272727;
}

#classtable table th {
	color: grey;
}

#classtable .colGroupTitle::after{	
	border-color: #ababab;
}

ul.list.adventures > li:nth-child(odd) > a,
#stats table tbody tr:nth-child(odd),
#classtable table tr:nth-child(odd) td,
#rulescontent table tbody tr:nth-child(odd) td,
ul.list li:nth-child(odd),
ul.list.encounters > li > ul > li:nth-child(odd),
ul.list.names > li > ul > li:nth-child(odd),
#monsterfeatures tr:nth-child(odd),
ul.adv-headers li:nth-child(odd) {
	background: rgba(0, 0, 0, 0.31);
}

li.adventure-contents-item > ul > li.active,
li.adventure-contents-item > ul > ul.active > li > a {
	background: #303030;
}

ul.list.encounters > li > span:first-child,
ul.list.names > li > span:first-child {
	color: #999;
}

ul.list.encounters > li > ul > li > a:hover,
ul.list.names > li > ul > li > a:hover,
ul.adv-headers > li > a:hover,
li.adventure-contents-item > ul > ul.active > li > a:hover,
ul.list.contents > li > ul.adv-contents > li > a > span:hover,
ul.list.contents > li > ul.adv-contents > li > a > span:hover,
ul.list.contents > li > ul.adv-headers a:hover,
ul.list.adventures ul a:hover,
ul.list.adventures >  li > a > span.showhide:hover,
ul.list.adventures >  li > a > span.name:hover,
ul.list li:nth-child(odd):hover {
	background: black;
}

ul.list.encounters li:nth-child(odd),
ul.list.names li:nth-child(odd),
ul.list.adventures > li:nth-child(odd),
ul.adv-contents > li:nth-child(odd),
ul.list.contents > li:nth-child(odd) {
	background: none;
}

ul.list.encounters li:nth-child(odd):hover,
ul.list.adventures li:nth-child(odd):hover,
ul.adv-contents li:nth-child(odd):hover,
ul.list.names li:nth-child(odd):hover {
	background: none;
}

ul.list li {
	border-bottom: none;
}

#rulescontent caption {
	color: grey;
}

div#subclasses>span {
	background: black;
}

tr.trait td {
	color: grey !important;
}

::-webkit-scrollbar-thumb {
	background: #475B6B;
}

/**** Search and filter bar ****/
.mini-view {
	background: #343434;
	background: linear-gradient(to top, #ccc, #343434 1px);
}

.dropdown-menu-filter .pill-grid .filter-pill {
	background: transparent;
}

.dropdown-menu-filter .pill-grid .filter-pill:hover:not([state]) {
	background: #323232;
}

.list-disabled-overlay::after {
	background: rgba(34, 34, 34, 0.65);
}

table#stats div.statsBlockInset {
	background-color: #323431;
}

`;

class StyleSwitcher {
	constructor () {
		this.currentStylesheet = this.STYLE_DAY;
		this.dynamicStyleEle = document.getElementById("dynamicStyle");
	}

	setActiveStyleSheet (title) {
		if (title !== StyleSwitcher.STYLE_DAY && title !== StyleSwitcher.STYLE_NIGHT) title = StyleSwitcher.STYLE_DAY;
		this.dynamicStyleEle.innerHTML = title === StyleSwitcher.STYLE_DAY ? DAY_CSS : NIGHT_CSS;
		this.currentStylesheet = title;
	}

	getActiveStyleSheet () {
		return this.currentStylesheet;
	}

	static createCookie (value) {
		Cookies.set("style", value, {expires: 365});
	}

	static readCookie () {
		return Cookies.get("style");
	}

	toggleActiveStyleSheet () {
		if (this.currentStylesheet === StyleSwitcher.STYLE_DAY) this.setActiveStyleSheet(StyleSwitcher.STYLE_NIGHT);
		else this.setActiveStyleSheet(StyleSwitcher.STYLE_DAY);

		$(".nightModeToggle").html(this.currentStylesheet === StyleSwitcher.STYLE_DAY ? "Night Mode" : "Day Mode");
	}
}

StyleSwitcher.STYLE_DAY = "day";
StyleSwitcher.STYLE_NIGHT = "night";

// NIGHT MODE ==========================================================================================================
const styleSwitcher = new StyleSwitcher();
// load user's preferred CSS
styleSwitcher.cookie = StyleSwitcher.readCookie();
styleSwitcher.cookie = styleSwitcher.cookie ? styleSwitcher.cookie : StyleSwitcher.STYLE_DAY;
styleSwitcher.setActiveStyleSheet(styleSwitcher.cookie);

window.addEventListener("unload", function () {
	const title = styleSwitcher.getActiveStyleSheet();
	StyleSwitcher.createCookie(title);
});
