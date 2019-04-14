/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

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
}


/* static functions: */

(function (Popup, undefined) {
    Popup.container = function(id) {
	return "<div id='" + (id == null || typeof id == 'undefined' ? "popupContainer" : id) + 
	    "' class='ballon'><div class='arrow'></div><div class='body' style='min-height: 30px;'></div></div>";
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

Popup.prototype.set = function(msg) {
    this._body.html(msg);
}

Popup.prototype.show = function(arg, msg, offset) {
    if( this._container.isHidden() ) {
	this._show(arg, offset);
    }
}

Popup.prototype.hide = function() {
    this._container.hide();
}

Popup.prototype.toggle = function(arg, offset) {
    if( this._container.toggle() ) {
	this._show(arg, offset);
    }
}

Popup.prototype.isHide = function() {
    return this._container.isHide();
}

Popup.prototype.position = function() {
    return this._container.position();
}
