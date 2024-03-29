/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

function Popup(container) {
    if( !(this instanceof Popup) ) {
	return new Popup(container);
    }
    if( container == null || typeof container == 'undefined' ) {
	container = _("popupContainer");
    }
    if( !(container instanceof HTMLElement) ) {
	container = _(container);
    }
    this._container = container;
    this._body = container.getElementsByClassName('body')[0];
    this._spinner = container.getElementsByClassName('spinner')[0];
}


/* static functions: */

(function (Popup, undefined) {
    Popup.container = function(id) {
	var ar = [];
	ar.push("<div id='", id == null || typeof id == 'undefined' ? "popupContainer" : id, "' class='ballon'>");
	ar.push("<div class='arrow'></div>");
	ar.push("<span class='close'>&times;</span>");
	ar.push("<div class='spinner'></div>");
	ar.push("<div class='body'></div>");
	ar.push("</div>");
	return ar.join('');
    };
}(Popup));


/** private functions: **/

Popup.prototype._show = function(arg, offset) {
    this._container.onclick = this._container.hide;
    this._container.show();
    this._container.popupDown(arg, typeof offset == 'undefined' ? offset : offset*2);
    this._container.getElementsByClassName('arrow')[0].style.left = "{0}%".format_a(
	typeof offset == 'undefined' ? 50 : offset*100);
}


/* public functions: */

Popup.prototype.set = function(msg, width) {
    const t = typeof width;
    if( t == 'string' ) {
	this._body.style.width = width;
    } else if( t == 'number' ) {
	this._body.style.width = '{0}px'.format_a(width);
    }
    this._body.html(Array.isArray(msg) ? msg.join('') : msg);
}

Popup.prototype.show = function(arg, offset, onShowListener) {
    if( this._container.isHidden() ) {
	if( typeof onShowListener == 'function' ) {
	    onShowListener(this);
	}
	this._show(arg, offset);
    }
}

Popup.prototype.hide = function() {
    this._spinner.hide();
    this._container.hide();
}

Popup.prototype.toggle = function(arg, offset, onShowListener) {
    if( this._container.toggle() ) {
	if( typeof onShowListener == 'function' ) {
	    onShowListener(this);
	}
	this._show(arg, offset);
    } else {
	this._spinner.hide();
    }
}

Popup.prototype.isHidden = function() {
    return this._container.isHidden();
}

Popup.prototype.position = function() {
    return this._container.position();
}

Popup.prototype.startSpinner = function() {
    if( this._spinner.isHidden() ) {
	this._spinner.show();
    }
}

Popup.prototype.stopSpinner = function() {
    this._spinner.hide();
}
