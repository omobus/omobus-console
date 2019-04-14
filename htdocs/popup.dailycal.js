/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

function DaysPopup(selection, params /* = { container = "DOM container", date, uri = "AJAX request"} */) {
    if( !(this instanceof DaysPopup) ) {
	return new DaysPopup(selection, params);
    }
    if( params == null || typeof params == 'undefined' ) {
	params = { container: _("daysPopup") };
    }
    if( params.container == null || typeof params.container == 'undefined' ) {
	params.container = _("daysPopup");
    }
    if( !(params.container instanceof HTMLElement) ) {
	params.container = _(params.container);
    }

    this._container = params.container;
    this._body = params.container.getElementsByClassName('body')[0];
    this._selection = selection;
    this._uri = params.uri;
    this._date = params.date instanceof Date ? params.date : Date.parseISO8601(params.date);
    this._month = this._date.getMonth();
    this._year = this._date.getFullYear();
}


/* static functions: */

(function (DaysPopup, undefined) {
    DaysPopup.container = function(id) {
	return "<div id='" + (id == null || typeof id == 'undefined' ? "daysPopup" : id) +
	    "' class='ballon'><div class='arrow'></div><div class='body' style='min-height: 30px; width: 480px;'></div></div>";
    };
}(DaysPopup));



/* private functions: */

DaysPopup.prototype._ts = function(d) {
    return new Date(d.getYear()+1900, d.getMonth(), d.getDate()).getTime();
}

DaysPopup.prototype._getDaysInMonth = function(month, year) {
    var daysInMonth=[31,28,31,30,31,30,31,31,30,31,30,31];
    return (month==1)&&(year%4==0)&&((year%100!=0)||(year%400==0)) ? 29 : daysInMonth[month];
}

DaysPopup.prototype._checkexist = function(date) {
    return typeof this._index[date] != 'undefined';
}

DaysPopup.prototype._msg = function(msg) {
    return ["<br /><center>", msg, "</center><br />"];
}

DaysPopup.prototype._tbl = function() {
    var ar = [];
    var monthNames = lang.calendar.months.names;
    var days = this._getDaysInMonth(this._month, this._year);
    var firstDayDate = new Date(this._year, this._month, 1);
    var firstWeekDay = firstDayDate.getDay();
    var p_month = this._month == 0 ? 11 : this._month - 1;
    var p_year = p_month == 11 ? this._year - 1 : this._year;
    var p_days = this._getDaysInMonth(p_month, p_year);
    var n_month = this._month == 11 ? 0 : this._month + 1;
    var n_year = n_month == 0 ? this._year + 1 : this._year;
    var today = G.getdate(new Date());
    var selected = G.getdate(this._date);
    firstWeekDay = (firstWeekDay == 0 && firstDayDate) ? 7 : firstWeekDay;
    /* navigation bar: */
    ar.push("<table class='dailycalendar'>");
    ar.push("<tr>");
    if( G.getdate(new Date(this._year, this._month, 1)) > this._b_date ) {
	ar.push("<td class='month' X-month='", p_month, "' X-year='", p_year, "'>&laquo;&nbsp;", 
	    G.getlongmonth_l(new Date(p_year, p_month)), "</td>");
    } else {
	ar.push("<td class='none'>&nbsp;</td>");
    }
    ar.push("<td class='none current'>", G.getlongmonth_l(new Date(this._year, this._month)), "</td>");
    if( this._e_date > G.getdate(new Date(this._year, this._month, days)) ) {
	ar.push("<td class='month' X-month='", n_month, "' X-year='", n_year, "'>",
	    G.getlongmonth_l(new Date(n_year, n_month)), "&nbsp;&raquo;</td>");
    } else {
	ar.push("<td class='none'>&nbsp;</td>");
    }
    ar.push("</tr>");
    ar.push("</table>");
    /* calendar: */
    ar.push("<table class='dailycalendar'>");
    ar.push("<tr>");
    for( var i = lang.calendar.firstDay; i <= lang.calendar.lastDay; i++ ) {
	ar.push("<th>" + lang.calendar.days.namesAbbr[i] + "</th>");
    }
    ar.push("</tr>");
    for( var i = 1, z = lang.calendar.firstDay, a = 0; i <= 6 /*maximum rows*/; i++ ) {
	ar.push("<tr>");
	for( var j = lang.calendar.firstDay, s = '', e = false, t = '', cl = ''; j <= lang.calendar.lastDay; j++ ) {
	    if( z < firstWeekDay ) {
		e = this._checkexist(s = G.getdate(new Date(p_year, p_month, t = (p_days - firstWeekDay + z + 1))));
		cl = "other";
	    } else if( z >= firstWeekDay + days ) {
		a = a + 1;
		e = this._checkexist(s = G.getdate(new Date(n_year, n_month, t = a)));
		cl = "other";
	    } else {
		e = this._checkexist(s = G.getdate(new Date(this._year, this._month, t = (z - firstWeekDay + 1))));
		if( selected  == s ) {
		    cl = "selected";
		} else if( today == s ) {
		    cl = "today";
		} else {
		    cl = "";
		}
	    }
	    if( e ) {
		ar.push("<td class='", cl, " selectable' X-date='", s, "'>", t, "</th>");
	    } else {
		ar.push("<td class='", cl, " disabled'>", t, "</th>");
	    }
	    z++;
	}
	ar.push("</tr>");
    }
    ar.push("</table>");
    return ar;
}

DaysPopup.prototype._L = function() {
    var sp, own;
    if( !(this._loaded == true) ) {
	own = this;
	this._body.html("");
	this._loaded == false;
	sp = spinnerLarge(this._body, "60%", "50%");
	G.xhr("GET", this._uri, "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && Array.isArray(data) ) {
		if( data.isEmpty() ) {
		    own._body.html(["<br /><center>", lang.empty, "</center><br />"].join(""));
		} else {
		    own._index = data.createIndex();
		    own._b_date = data.first();
		    own._e_date = data.last();
		    own._update();
		    own._loaded = true;
		}
	    } else {
		own._body.html(["<br /><center>", lang.failure, "</center><br />"].join(""));
	    }
	    sp.stop();
        }).send();
    }
}

DaysPopup.prototype._foreach = function(tags, cb) {
    for( var i = 0, size = tags == null ? 0 : tags.length; i < size; i++ ) {
	cb(tags[i], i);
    }
}

DaysPopup.prototype._update = function() {
    var tbl, own = this;
    var onrefresh = function(ev) { own._onrefresh(this); ev.stopPropagation(); };
    var onselect = function(ev) { own._onselect(this); };
    this._body.html(own._tbl().join(""));
    if( (tbl = own._body.getElementsByTagName('table')[0]) != null ) {
	this._foreach(tbl.rows, function(r) {
	    own._foreach(r.cells, function(arg) {
		if( arg.hasClass('month') ) { arg.onclick = onrefresh; }
	    });
	});
    }
    if( (tbl = own._body.getElementsByTagName('table')[1]) != null ) {
	this._foreach(tbl.rows, function(r) {
	    own._foreach(r.cells, function(arg) {
		if( arg.hasClass('selectable') ) { arg.onclick = onselect; }
	    });
	});
    }
}

DaysPopup.prototype._onrefresh = function(tag) {
    this._month = parseInt(tag.getAttribute("X-month"));
    this._year = parseInt(tag.getAttribute("X-year"));
    this._update();
}

DaysPopup.prototype._onselect = function(tag) {
    var date = Date.parseISO8601(tag.getAttribute("X-date"));
    if( typeof this._selection == 'function' ) {
	this._selection(date);
    }
    this._month = date.getMonth();
    this._year = date.getYear() + 1900;
    this._date = date;
    this._update();
}

DaysPopup.prototype._show = function(arg) {
    this._container.onclick = this._container.hide;
    this._container.show();
    this._container.popupDown(arg);
    this._L();
}


/* public functions: */

DaysPopup.prototype.show = function(arg) {
    if( this._container.isHidden() ) {
	this._show(arg);
    }
}

DaysPopup.prototype.hide = function() {
    this._container.hide();
}

DaysPopup.prototype.toggle = function(arg) {
    if( this._container.toggle() ) {
	this._show(arg);
    }
}

DaysPopup.prototype.isHide = function() {
    return this._container.isHide();
}

DaysPopup.prototype.dropCache = function() {
    this._loaded = null;
}
