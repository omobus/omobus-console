/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

function MonthsPopup(selection, params /* params = { container = "DOM container", year, month, uri = "AJAX request"} */) {
    if( !(this instanceof MonthsPopup) ) {
	return new MonthsPopup(selection, params);
    }
    if( params == null || typeof params == 'undefined' ) {
	params = { container: _("monthspopupContainer") };
    }
    if( params.container == null || typeof params.container == 'undefined' ) {
	params.container = _("monthspopupContainer");
    }
    if( !(params.container instanceof HTMLElement) ) {
	params.container = _(params.container);
    }

    this._container = params.container;
    this._body = params.container.getElementsByClassName('body')[0];
    this._spinner = params.container.getElementsByClassName('spinner')[0];
    this._selection = selection;
    this._uri = params.uri;
    this._year = params.year;
    this._month = params.month;
}


/* static functions: */

(function (MonthsPopup, undefined) {
    MonthsPopup.container = function(id) {
	var ar = [];
	ar.push("<div id='", id == null || typeof id == 'undefined' ? "monthspopupContainer" : id, "' class='ballon'>");
	ar.push("<div class='arrow'></div>");
	//ar.push("<span class='close'>&times;</span>");
	ar.push("<div class='spinner'></div>");
	ar.push("<div class='body' style='min-height: 30px;'></div>");
	ar.push("</div>");
	return ar.join('');
    };
}(MonthsPopup));



/* private functions: */

MonthsPopup.prototype._msg = function(msg) {
    return ["<br /><center>", msg, "</center><br />"];
}

MonthsPopup.prototype._tbl = function(rows, year, month) {
    var ar = [], r, flag = false;
    ar.push("<div class='simplelist'><table>");
    for( var i = 0, size = rows.length; i < size; i++ ) {
	if( (r = rows[i]) != null ) {
	    ar.push("<tr X-year='{3}' X-month='{4}' {0}><td>{1}</td><td class='r'>{2}</td></tr>".format_a(
		(year == r.y && month == r.m) ? " class='selected'" : "",
		G.getlongmonth_l(new Date(r.y, r.m - 1, 1)),
		r.rows, r.y, r.m
	    ));
	    flag = true;
	}
    }
    ar.push("</table></div>");

    return !flag ? ["<br /><center>", lang.empty, "</center><br />"] : ar;
}

MonthsPopup.prototype._L = function() {
    var own, onselect;
    if( !(this._loaded == true) ) {
	own = this;
	onselect = function(ev) { own._onselect(this.getAttribute("X-rowno")); };
	this._spinner.show();
	this._loaded == false;
	G.xhr("GET", this._uri, "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		own._body.html(own._tbl(data, own._year, own._month).join(""));
		own._tb = own._body.getElementsByTagName('table')[0];
		if( own._tb != null ) {
		    own._foreach(own._tb.rows, function(arg, i) {
			arg.setAttribute("X-rowno", i);
			arg.onclick = onselect;
		    });
		    own._loaded = true;
		}
	    } else {
		own._body.html(["<br /><center>", lang.failure, "</center><br />"].join(""));
	    }
	    own._spinner.hide();
        }).send();
    }
}

MonthsPopup.prototype._foreach = function(tags, cb) {
    for( var i = 0, size = tags == null ? 0 : tags.length; i < size; i++ ) {
	cb(tags[i], i);
    }
}

MonthsPopup.prototype._onselect = function(index) {
    if( !(this._tb.rows[index].className == 'selected') ) {
	this._foreach(this._tb.rows, function(arg) { arg.className = null; });
	this._tb.rows[index].className = "selected";
	this._year = this._tb.rows[index].getAttribute("X-year");
	this._month = this._tb.rows[index].getAttribute("X-month");
	if( typeof this._selection == 'function' ) {
	    this._selection(this._year, this._month);
	}
    }
}

MonthsPopup.prototype._show = function(arg) {
    this._container.onclick = this._container.hide;
    this._container.show();
    this._container.popupDown(arg);
    this._L();
}


/* public functions: */

MonthsPopup.prototype.show = function(arg) {
    if( this._container.isHidden() ) {
	this._show(arg);
    }
}

MonthsPopup.prototype.hide = function() {
    this._container.hide();
}

MonthsPopup.prototype.toggle = function(arg) {
    if( this._container.toggle() ) {
	this._show(arg);
    }
}

MonthsPopup.prototype.isHidden = function() {
    return this._container.isHidden();
}
