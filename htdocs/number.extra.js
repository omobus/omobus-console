/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

/* static functions: */

(function (Number, undefined) {
    Number.HHMM = function(arg) {
	return arg == null ? null : arg.HHMM();
    };
}(Number));


/* public functions: */

Number.prototype.HHMM = function() {
    var mins_num = this;
    var hours   = Math.floor(mins_num / 60);
    var minutes = Math.floor((mins_num - ((hours * 3600)) / 60));
    var seconds = Math.floor((mins_num * 60) - (hours * 3600) - (minutes * 60));
    return "{0}:{1}".format_a(hours.toString().padStart(2,'0'), minutes.toString().padStart(2,'0'));
}
