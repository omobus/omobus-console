/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

function MonthsPopup(rows, selection, params /* params = { container: "DOM container", defaults: {y: ..., m: ...}} */) {
    if( !(this instanceof MonthsPopup) ) {
	return new MonthsPopup(rows, selection, params);
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
    if( rows == null || typeof rows == 'undefined' || !Array.isArray(rows) ) {
	rows = [];
    }
    if( params.container.hasAttribute("X-year") && params.container.hasAttribute("X-month") ) {
	rows.forEach(function(arg) { 
	    if( arg.year == this.y && arg.month == this.m ) {
		arg._selected = true;
	    }
	}, {y:params.container.getAttribute("X-year"), m:params.container.getAttribute("X-month")});
    } else if( typeof params.defaults == 'object' ) {
	rows.forEach(function(arg) { 
	    if( arg.year == this.y && arg.month == this.m ) {
		arg._selected = true;
	    }
	}, params.defaults);
    }

    const own = this;
    const onselect = function(ev) { own._onselect(this.getAttribute("X-rowno")); };
    const body = params.container.getElementsByClassName('body')[0];

    body.html(this._get(rows).join(""));
    this._container = params.container;
    this._tb = body.getElementsByClassName('simplelist')[0].firstChild;
    this._ph = body.getElementsByClassName('placeholder')[0];
    this._rows = rows;
    this._selection = selection;
    this._ph.hide();

    this._foreach(this._tb.rows, function(arg, i) {
	arg.setAttribute("X-rowno", i);
	arg.onclick = onselect;
    });
}


/* static functions: */

(function (MonthsPopup, undefined) {
    MonthsPopup.container = function(id) {
	var ar = [];
	ar.push("<div id='", id == null || typeof id == 'undefined' ? "monthspopupContainer" : id, "' class='ballon'>");
	ar.push("<div class='arrow'></div>");
	ar.push("<div class='body'></div>");
	ar.push("</div>");
	return ar.join('');
    };
}(MonthsPopup));


/** private functions: **/

MonthsPopup.prototype._get = function(rows) {
    var ar = [], r;
    ar.push("<div class='placeholder'></div>");
    ar.push("<div class='simplelist'><table>");
    for( var i = 0, size = rows.length; i < size; i++ ) {
        if( (r = rows[i]) != null ) {
	    ar.push("<tr " + (r._selected ? "class='selected'" : "") + "><td class='center'>",
		G.getlongmonth_l(new Date(r.year, r.month - 1, 1)), "</td></tr>");
        }
    }
    ar.push("</table></div>");
    return ar;
}

MonthsPopup.prototype._foreach = function(tags, cb) {
    for( var i = 0, size = tags == null ? 0 : tags.length; i < size; i++ ) {
	cb(tags[i], i);
    }
}

MonthsPopup.prototype._onselect = function(index) {
    if( !this._rows[index]._selected ) {
	this._foreach(this._tb.rows, function(arg) { arg.className = null; });
	this._tb.rows[index].className = "selected";
	this._rows.forEach(function(arg) { arg._selected = null; });
	this._rows[index]._selected = true;
	if( typeof this._selection == 'function' ) {
	    this._selection(this._rows[index], index, this._rows);
	}
	this._container.setAttribute('X-year', this._rows[index].year);
	this._container.setAttribute('X-month', this._rows[index].month);
    }
}

MonthsPopup.prototype._show = function(arg, offset) {
    this._container.onclick = this._container.hide;
    this._container.show();
    this._container.popupDown(arg, typeof offset == 'undefined' ? offset : offset*2);
    this._container.getElementsByClassName('arrow')[0].style.left = "{0}%".format_a(
	typeof offset == 'undefined' ? 50 : offset*100);
}

/* public functions: */

MonthsPopup.prototype.show = function(arg, offset) {
    if( this._container.isHidden() ) {
	this._show(arg, offset);
    }
}

MonthsPopup.prototype.hide = function() {
    this._container.hide();
}

MonthsPopup.prototype.toggle = function(arg, offset) {
    if( this._container.toggle() ) {
	this._show(arg, offset);
    }
}

MonthsPopup.prototype.isHidden = function() {
    return this._container.isHidden();
}
