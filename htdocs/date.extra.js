/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

/* static functions: */

(function (Date, undefined) {
    var numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ];
    Date.parseISO8601 = function (date) {
        var d = null, struct, minutesOffset = 0;

        // ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
        // before falling back to any implementation-specific date parsing, so that’s what we do, even if native
        // implementations could be faster
        //                                              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
        if( date != null && date != '' && (struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d*))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date)) ) {
            // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
            for (var i = 0, k; (k = numericKeys[i]); ++i) {
                struct[k] = +struct[k] || 0;
            }

            // allow undefined days and months
            struct[2] = (+struct[2] || 1) - 1;
            struct[3] = +struct[3] || 1;

            if (struct[8] !== 'Z' && struct[9] !== undefined) {
                minutesOffset = /*struct[10] * 60 +*/ struct[11];

                if (struct[9] === '+') {
                    minutesOffset = 0 - minutesOffset;
                }
            }

            d = new Date(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], /*struct[7]*/0);
        }

        return d;
    };
}(Date));


/* public functions: */

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|MMMM|yy(?:yy)?|([HhMsTt])\1?|[LloZ]|"[^"]*"|'[^']*'/g; //"
    var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
    var timezoneClip = /[^-+\dA-Z]/g;
    var pad = function (val, len) {
	    val = String(val);
	    len = len || 2;
	    while (val.length < len) val = "0" + val;
	    return val;
	};

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc, culture) {
        if( date == null || isNaN(date) ) throw SyntaxError("invalid date");
	if( mask == null || isNaN(date) ) throw SyntaxError("invalid mask");
	if( culture == null ) throw SyntaxError("invalid culture parameters");

	var cal = culture.calendar;
	var _ = utc ? "getUTC" : "get";
	var d = date[_ + "Date"]();
	var D = date[_ + "Day"]();
	var m = date[_ + "Month"]();
	var y = date[_ + "FullYear"]();
	var H = date[_ + "Hours"]();
	var M = date[_ + "Minutes"]();
	var s = date[_ + "Seconds"]();
	var L = date[_ + "Milliseconds"]();
	var o = utc ? 0 : date.getTimezoneOffset();
	var flags = {
		d:    d,
		dd:   pad(d),
		ddd:  cal.days.namesAbbr[D],
		dddd: cal.days.names[D],
		m:    m + 1,
		mm:   pad(m + 1),
		mmm:  cal.months.namesAbbr[m],
		mmmm: cal.months.names[m],
		MMMM: cal.monthsGenitive.names[m],
		yy:   String(y).slice(2),
		yyyy: y,
		h:    H % 12 || 12,
		hh:   pad(H % 12 || 12),
		H:    H,
		HH:   pad(H),
		M:    M,
		MM:   pad(M),
		s:    s,
		ss:   pad(s),
		l:    pad(L, 3),
		L:    pad(L > 99 ? Math.round(L / 10) : L),
		t:    H < 12 ? "a"  : "p",
		tt:   H < 12 ? "am" : "pm",
		T:    H < 12 ? "A"  : "P",
		TT:   H < 12 ? "AM" : "PM",
		Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
		o: (o > 0 ? "-" : "+") + pad(Math.abs(o)/60) + ":" + pad(Math.abs(o-(o/60)*60))
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();


Date.prototype.format = function (mask, utc, culture) {
    return dateFormat(this, mask, utc, culture);
};
