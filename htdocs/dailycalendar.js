/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

/** OBSOLETE **/

function DailyCalendar(onrefresh, onselect) {
    this._onrefresh = onrefresh; this._onselect = onselect;
    this._index = [];
}

/* *** public functions: */

DailyCalendar.prototype.set = function(exist) {
    var ar = exist.sort(function(a, b) {
        var x = a["fix_date"], y = b["fix_date"];
        if( x > y ) return 1;
        if( x < y ) return -1;
        return 0;
    });
    this._index = exist.crateIndexBy("fix_date");
    this._b_date = ar.first().fix_date;
    this._e_date = ar.last().fix_date;
    //console.log("DailyCalendar: " + this._b_date + '; ' + this._e_date + '.');
    //console.log(this._index);
    return this;
}

DailyCalendar.prototype.setperiod = function(b, e) {
    if( !(b instanceof Date) ) {
	b = Date.parseISO8601(b);
    }
    if( !(e instanceof Date) ) {
	e = Date.parseISO8601(e);
    }
    this._b_date = G.getdate(b);
    this._e_date = G.getdate(e);
    for( var i = 0, t = this._ts(b), size = (this._ts(e)-t)/86400000; i <= size; i++ ) {
	this._index[G.getdate(new Date(t + 86400000*i))] = true;
    }
    //console.log("DailyCalendar: " + this._b_date + '; ' + this._e_date + '.');
    //console.log(this._index);
    return this;
}

DailyCalendar.prototype.build = function(arg) {
    this._date = arg instanceof Date ? arg : Date.parseISO8601(arg);
    return this._get(G.getdate(this._date), this._date.getMonth(), this._date.getFullYear());
}

DailyCalendar.prototype.refresh = function(month, year) {
    return this._get(G.getdate(this._date), month, year);
}


/* *** private functions: */

DailyCalendar.prototype._ts = function(d) {
    return new Date(d.getYear()+1900, d.getMonth(), d.getDate()).getTime();
}

DailyCalendar.prototype._getDaysInMonth = function(month, year) {
    var daysInMonth=[31,28,31,30,31,30,31,31,30,31,30,31];
    return (month==1)&&(year%4==0)&&((year%100!=0)||(year%400==0)) ? 29 : daysInMonth[month];
}

DailyCalendar.prototype._checkexist = function(date) {
    return typeof this._index[date] != 'undefined';
}

DailyCalendar.prototype._get = function(date, month, year) {
    var ar = [];
    var monthNames = lang.calendar.months.names;
    var days = this._getDaysInMonth(month, year);
    var firstDayDate = new Date(year, month, 1);
    var firstWeekDay = firstDayDate.getDay();
    var p_month = month == 0 ? 11 : month - 1;
    var p_year = p_month == 11 ? year - 1 : year;
    var p_days = this._getDaysInMonth(p_month, p_year);
    var n_month = month == 11 ? 0 : month + 1;
    var n_year = n_month == 0 ? year + 1 : year;
    var c = G.getdate(new Date());
    firstWeekDay = (firstWeekDay == 0 && firstDayDate) ? 7 : firstWeekDay;
    /* navigation bar */
    ar.push("<table class='dailycalendar'>");
    ar.push("<tr>");
    if( G.getdate(new Date(year, month, 1)) > this._b_date ) {
	ar.push("<td class='month' onclick='" + this._onrefresh + "(" + p_month + "," + p_year + ");event.stopPropagation();'>" + 
	    "&laquo;&nbsp;" + G.getlongmonth_l(new Date(p_year, p_month)) + "</td>");
    } else {
	ar.push("<td class='none'>&nbsp;</td>");
    }
    ar.push("<td class='none current'>" + G.getlongmonth_l(new Date(year, month)) + "</td>");
    if( this._e_date > G.getdate(new Date(year, month, days)) ) {
	ar.push("<td class='month' onclick='" + this._onrefresh + "(" + n_month + "," + n_year + ");event.stopPropagation();'>" +
	    G.getlongmonth_l(new Date(n_year, n_month)) + "&nbsp;&raquo;" + "</td>");
    } else {
	ar.push("<td class='none'>&nbsp;</td>");
    }
    ar.push("</tr>");
    ar.push("</table>");
    /* calendar */
    ar.push("<table class='dailycalendar'>");
    ar.push("<tr>");
    for( var i = 0; i < 7; i++ ) {
	ar.push("<th>" + lang.calendar.days.namesAbbr[i] + "</th>");
    }
    ar.push("</tr>");
    for( var i = 1, z = 0, a = 0; i <= 6; i++ ) {
	ar.push("<tr>");
	for( var j = 0, s = '', e = false, t = '', cl = ''; j < 7; j++ ) {
	    if( z < firstWeekDay ) {
		e = this._checkexist(s = G.getdate(new Date(p_year, p_month, t = (p_days - firstWeekDay + z + 1))));
		cl = "other";
	    } else if( z >= firstWeekDay + days ) {
		a = a + 1;
		e = this._checkexist(s = G.getdate(new Date(n_year, n_month, t = a)));
		cl = "other";
	    } else {
		e = this._checkexist(s = G.getdate(new Date(year, month, t = (z - firstWeekDay + 1))));
		if( date == s ) {
		    cl = "selected";
		} else if( c == s ) {
		    cl = "today";
		} else {
		    cl = "";
		}
	    }
	    if( e ) {
		ar.push("<td class='" + cl + " selectable' onclick='" + this._onselect + "(\"" + s + "\")'>" + t + "</th>");
	    } else {
		ar.push("<td class='" + cl + " disabled'>" + t + "</th>");
	    }
	    z++;
	}
	ar.push("</tr>");
    }
    ar.push("</table>");
    return ar;
}
