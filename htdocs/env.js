/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

function isEnvironmentCorrect() {
    return document.addEventListener && window.XMLHttpRequest && window.FormData && window.File && window.FileReader && window.FileList && window.Blob &&
	navigator.userAgent.indexOf("Trident") < 0 /* not (Microsoft Internet Explorer) */;
}
