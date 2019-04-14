/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

function Dialog(params /* params = { container = "DOM container", width, title, body, buttons}: */) {
    if( !(this instanceof Dialog) ) {
	return new Dialog(params);
    }
    if( params == null || typeof params == 'undefined' ) {
	params = { container: _("baseDialog") };
    }
    if( params.container == null || typeof params.container == 'undefined' ) {
	params.container = _("baseDialog");
    }
    if( !(params.container instanceof HTMLElement) ) {
	params.container = _(params.container);
    }
    if( params.width == null || typeof params.width == 'undefined' ) {
	params.width = 550;
    }
    var own = this, w = window.innerWidth, h = window.innerHeight, offset = 30, x;
    var onclose = function() { own.hide(); };
    this._container = params.container;
    params.container.html(this._get(params.title, params.body, params.buttons).join(""));
    /* initialize onclick: */
    this._foreach(params.container.getElementsByClassName("close"), function(arg) { arg.onclick = onclose; });
    /* extra styles: */
    x = params.container.firstChild;
    x.style.width = "{0}px".format_a(params.width >= w ? (w - 2*offset) : params.width);
    x.style.maxHeight = "{0}px".format_a(h - 2*offset);
    x = params.container.getElementsByClassName("scrollable")[0];
    x.style.maxHeight = "{0}px".format_a(h - 2*offset - /*title:*/70 - /*buttons:*/(params.buttons == null ? 0 : 40));
}


/* static functions: */

(function (Dialog, undefined) {
    Dialog.container = function(id) {
	return "<div id='" + (id == null || typeof id == 'undefined' ? "baseDialog" : id) + "' class='dialog'></div>";
    };
}(Dialog));


/** private functions: **/

Dialog.prototype._get = function(title, body, buttons) {
    var ar = [];
    ar.push("<div>");
    ar.push("<span class='close'>&times;</span>");
    ar.push("<h1><span>", title, "</span><span id='spin'></span></h1>");
    if( body != null ) {
	ar.push("<div class='scrollable'>");
	ar.push(Array.isArray(body) ? body.join("") : body);
	ar.push("</div>");
    }
    if( buttons != null ) {
	ar.push("<hr/>");
	ar.push(Array.isArray(buttons) ? buttons.join("") : buttons);
    }
    ar.push("</div>");
    return ar;
}

Dialog.prototype._foreach = function(tags, cb) {
    for( var i = 0, size = tags == null ? 0 : tags.length; i < size; i++ ) {
	cb(tags[i]);
    }
}

Dialog.prototype._onkeyup = function(ev) {
    var a = true;
    if( ev.keyCode == 13 ) {
	a = false;
    } else if( ev.keyCode == 27 ) {
	this.hide(); a = false;
    }
    return a;
}


/* public functions: */

Dialog.prototype.show = function() {
    var own = this, x, z;
    this._displayed = true;
    this._def_onkeyup = window.onkeyup;
    window.onkeyup = function(ev) { return own._onkeyup(ev); };
    this._container.show();
    x = this._container.firstChild;
    z = (window.innerHeight - x.offsetHeight)/2;
    if( z > 100 ) z = 100;
    else if( z < 30 ) z = 30;
    x.style.marginTop = "{0}px".format_a(z);
}

Dialog.prototype.hide = function() {
    this._container.hide();
    if( this._displayed == true ) {
	window.onkeyup = this._def_onkeyup;
    }
    this._displayed = false;
}
