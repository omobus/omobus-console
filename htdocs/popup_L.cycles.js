/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

function CyclesPopup(selection, params /* params = { container = "DOM container", cycle_id = "selected cycle", uri = "AJAX request"} */) {
    if( !(this instanceof CyclesPopup) ) {
	return new CyclesPopup(selection, params);
    }
    if( params == null || typeof params == 'undefined' ) {
	params = { container: _("cyclespopupContainer") };
    }
    if( params.container == null || typeof params.container == 'undefined' ) {
	params.container = _("cyclespopupContainer");
    }
    if( !(params.container instanceof HTMLElement) ) {
	params.container = _(params.container);
    }

    var own = this;
    var onselect = function(ev) { own._onselect(this.getAttribute("X-rowno")); };
    this._container = params.container;
    this._body = params.container.getElementsByClassName('body')[0];
    this._spinner = params.container.getElementsByClassName('spinner')[0];
    this._selection = selection;
    this._uri = params.uri;
    this._cycle_id = params.cycle_id;
}


/* static functions: */

(function (CyclesPopup, undefined) {
    CyclesPopup.container = function(id) {
	var ar = [];
	ar.push("<div id='", id == null || typeof id == 'undefined' ? "cyclespopupContainer" : id, "' class='ballon'>");
	ar.push("<div class='arrow'></div>");
	//ar.push("<span class='close'>&times;</span>");
	ar.push("<div class='spinner'></div>");
	ar.push("<div class='body' style='min-height: 30px;'></div>");
	ar.push("</div>");
	return ar.join('');
    };
}(CyclesPopup));


/* private functions: */

CyclesPopup.prototype._msg = function(msg) {
    return ["<br /><center>", msg, "</center><br />"];
}

CyclesPopup.prototype._tbl = function(rows, cycle_id) {
    var ar = [], r, flag = false;
    ar.push("<div class='simplelist'><table>");
    for( var i = 0, size = rows.length; i < size; i++ ) {
	if( (r = rows[i]) != null ) {
	    ar.push("<tr X-cid='{5}' {0}><td>{1}</td><td><img width='15px' src='{4}'/></td><td class='r'>{2} - {3}</td></tr>".format_a(
		cycle_id == r.cycle_id ? " class='selected'" : "",
		lang.routes.cycle.format_a(r.cycle_no, r.year),
		G.getdate_l(Date.parseISO8601(r.b_date)),
		G.getdate_l(Date.parseISO8601(r.e_date)),
		r.closed ? G.getstaticref("drawable/locked.png") : "",
		r.cycle_id
	    ));
	    flag = true;
	}
    }
    ar.push("</table></div>");

    return !flag ? ["<br /><center>", lang.empty, "</center><br />"] : ar;
}

CyclesPopup.prototype._L = function() {
    var own, onselect;
    if( !(this._loaded == true) ) {
	own = this;
	onselect = function(ev) { own._onselect(this.getAttribute("X-rowno")); };
	this._spinner.show();
	this._loaded == false;
	G.xhr("GET", this._uri, "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		own._body.html(own._tbl(data, own._cycle_id).join(""));
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

CyclesPopup.prototype._foreach = function(tags, cb) {
    for( var i = 0, size = tags == null ? 0 : tags.length; i < size; i++ ) {
	cb(tags[i], i);
    }
}

CyclesPopup.prototype._onselect = function(index) {
    if( !(this._tb.rows[index].className == 'selected') ) {
	this._foreach(this._tb.rows, function(arg) { arg.className = null; });
	this._tb.rows[index].className = "selected";
	this._cycle_id = this._tb.rows[index].getAttribute("X-cid");
	if( typeof this._selection == 'function' ) {
	    this._selection(this._cycle_id);
	}
    }
}

CyclesPopup.prototype._show = function(arg) {
    this._container.onclick = this._container.hide;
    this._container.show();
    this._container.popupDown(arg);
    this._L();
}


/* public functions: */

CyclesPopup.prototype.show = function(arg) {
    if( this._container.isHidden() ) {
	this._show(arg);
    }
}

CyclesPopup.prototype.hide = function() {
    this._container.hide();
}

CyclesPopup.prototype.toggle = function(arg) {
    if( this._container.toggle() ) {
	this._show(arg);
    }
}

CyclesPopup.prototype.isHidden = function() {
    return this._container.isHidden();
}
