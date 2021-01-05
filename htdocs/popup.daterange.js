/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

function DateRangePopup(min, max, selection, params /* params = {b_date = '2020-05-01', e_date = '2020-05-05', container = "DOM container"} */) {
    if( !(this instanceof DateRangePopup) ) {
	return new DateRangePopup(min, max, selection, params);
    }
    if( params == null || typeof params == 'undefined' ) {
	params = { container: _("daterangePopup") };
    }
    if( params.container == null || typeof params.container == 'undefined' ) {
	params.container = _("daterangePopup");
    }
    if( !(params.container instanceof HTMLElement) ) {
	params.container = _(params.container);
    }

    this._container = params.container;
    this._selection = selection;
    this._dates = {
	min: min instanceof Date ? min : Date.parseISO8601(min),
	max: max instanceof Date ? max : Date.parseISO8601(max),
	b_date: params.b_date instanceof Date ? params.b_date : Date.parseISO8601(params.b_date),
	e_date: params.e_date instanceof Date ? params.e_date : Date.parseISO8601(params.e_date)
    };
    this._month = (this._dates.b_date||this._dates.e_date||this._dates.min).getMonth();
    this._year = (this._dates.b_date||this._dates.e_date||this._dates.min).getFullYear();
    this._body = params.container.getElementsByClassName('body')[0];

    this._update();
}

/* static functions: */

(function (DateRangePopup, undefined) {
    DateRangePopup.container = function(id) {
	var ar = [];
	ar.push("<div id='", id == null || typeof id == 'undefined' ? "daterangePopup" : id, "' class='ballon'>");
	ar.push("<div class='arrow'></div>");
	ar.push("<div class='body' style='min-height: 30px; width: 480px;'></div>");
	ar.push("</div>");
	return ar.join('');
    };

    DateRangePopup.cleanup = function(id) {
    };
}(DateRangePopup));


/** private functions: **/

DateRangePopup.prototype._foreach = function(tags, cb) {
    for( var i = 0, size = tags == null ? 0 : tags.length; i < size; i++ ) {
	cb(tags[i], i);
    }
}

DateRangePopup.prototype._getDaysInMonth = function(month, year) {
    var daysInMonth=[31,28,31,30,31,30,31,31,30,31,30,31];
    return (month==1)&&(year%4==0)&&((year%100!=0)||(year%400==0)) ? 29 : daysInMonth[month];
}

DateRangePopup.prototype._update = function() {
    var tbl, own = this;
    var onrefresh = function(ev) { own._onrefresh(this); ev.stopPropagation(); };
    var onselect = function(ev) { own._onselect(this); ev.stopPropagation(); };
    this._body.html(this._get().join(""));
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

DateRangePopup.prototype._onrefresh = function(tag) {
    this._month = parseInt(tag.getAttribute("X-month"));
    this._year = parseInt(tag.getAttribute("X-year"));
    this._update();
}

DateRangePopup.prototype._onselect = function(tag) {
    var f = false;
    var date = Date.parseISO8601(tag.getAttribute("X-date"));

    if( this._dates.b_date == null && this._dates.e_date == null ) {
	this._dates.b_date = date;
    } else if( this._dates.b_date != null && this._dates.e_date != null ) {
	this._dates.b_date = date;
	this._dates.e_date = null;
    } else if( this._dates.b_date != null && this._dates.b_date > date ) {
	this._dates.e_date = this._dates.b_date;
	this._dates.b_date = date;
	f = true;
    } else {
	this._dates.e_date = date;
	f = true;
    }
    this._update();

    if( typeof this._selection == 'function' && f ) {
	this._selection(this._dates.b_date, this._dates.e_date);
	this.hide();
    }
}

DateRangePopup.prototype._get = function() {
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
    var min = G.getdate(this._dates.min);
    var max = G.getdate(this._dates.max);
    var b_date = this._dates.b_date == null ? null : G.getdate(this._dates.b_date);
    var e_date = this._dates.b_date == null ? null : G.getdate(this._dates.e_date);
    firstWeekDay = (firstWeekDay == 0 && firstDayDate) ? 7 : firstWeekDay;
    /* navigation bar: */
    ar.push("<table class='dailycalendar'>");
    ar.push("<tr>");
    if( G.getdate(new Date(this._year, this._month, 1)) > min ) {
	ar.push("<td class='month' X-month='", p_month, "' X-year='", p_year, "'>&laquo;&nbsp;",
	    G.getlongmonth_l(new Date(p_year, p_month)), "</td>");
    } else {
	ar.push("<td class='none'>&nbsp;</td>");
    }
    ar.push("<td class='none current'>", G.getlongmonth_l(new Date(this._year, this._month)), "</td>");
    if( max > G.getdate(new Date(this._year, this._month, days)) ) {
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
		s = G.getdate(new Date(p_year, p_month, t = (p_days - firstWeekDay + z + 1)));
		e = min <= s && s <= max;
		cl = "other";
	    } else if( z >= firstWeekDay + days ) {
		a = a + 1;
		s = G.getdate(new Date(n_year, n_month, t = a));
		e = min <= s && s <= max;
		cl = "other";
	    } else {
		s = G.getdate(new Date(this._year, this._month, t = (z - firstWeekDay + 1)));
		e = min <= s && s <= max;
		cl = today == s ? "today" : "";
	    }
	    if( b_date != null && b_date == s ) {
		cl = "selected";
	    } else if( e_date != null && e_date == s ) {
		cl = "selected";
	    } else if( b_date != null && e_date != null && b_date < s && s < e_date ) {
		cl = "selected";
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
//    ar.push("<br/>");
//    ar.push("<div align='right'>", "<button id='jjjj' disabled='true'>", "lang.save", "</button>", "</div>");
    return ar;
}

DateRangePopup.prototype._show = function(arg, offset) {
    this._container.onclick = this._container.hide;
    this._container.show();
    this._container.popupDown(arg, typeof offset == 'undefined' ? offset : offset*2);
    this._container.getElementsByClassName('arrow')[0].style.left = "{0}%".format_a(
	typeof offset == 'undefined' ? 50 : offset*100);
}

/* public functions: */

DateRangePopup.prototype.show = function(arg, offset) {
    if( this._container.isHidden() ) {
	this._show(arg, offset);
    }
}

DateRangePopup.prototype.hide = function() {
    this._container.hide();
}

DateRangePopup.prototype.toggle = function(arg, offset) {
    if( this._container.toggle() ) {
	this._show(arg, offset);
    }
}

DateRangePopup.prototype.isHidden = function() {
    return this._container.isHidden();
}
