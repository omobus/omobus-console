/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

function _(arg) {
    return document.getElementById(arg);
}

/* internal functions & parameters: */

HTMLElement.prototype._displayCache = {}

HTMLElement.prototype._getRealDisplay = function(elem) {
    if( elem.currentStyle ) {
	return elem.currentStyle.display;
    } else if( window.getComputedStyle ) {
	return window.getComputedStyle(elem, null).getPropertyValue('display');
    }
}

HTMLElement.prototype._getOffsetSum = function() {
    var top = 0, left = 0, elem = this;
    while( elem ) {
	top = top + parseInt(elem.offsetTop);
	left = left + parseInt(elem.offsetLeft);
	elem = elem.offsetParent;
    }
    return { top: top, left: left, height: this.offsetHeight, width: this.offsetWidth };
}

HTMLElement.prototype._getOffsetRect = function() {
    var box = this.getBoundingClientRect();
    var body = document.body;
    var docElem = document.documentElement;
    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;
    var top  = box.top +  scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;
    return { top: Math.round(top), left: Math.round(left), height: this.offsetHeight, width: this.offsetWidth };
}

/* extra element functionality: */

if( !HTMLElement.prototype.removeClass ) {
    HTMLElement.prototype.removeClass = function(remove) {
	var newClassName = "", classes;
	classes = this.className.split(" ");
	for(var i = 0; i < classes.length; i++) {
	    if(classes[i] !== remove) {
		newClassName += classes[i] + " ";
	    }
	}
	this.className = newClassName.trim();
    }
}

if( !HTMLElement.prototype.hasClass ) {
    HTMLElement.prototype.hasClass = function(name) {
	var classes = this.className.split(" ");
	for(var i = 0; i < classes.length; i++) {
	    if( classes[i] == name ) {
		return true;
	    }
	}
	return false;
    }
}

if( !HTMLElement.prototype.addClass ) {
    HTMLElement.prototype.addClass = function(name) {
	if( !this.hasClass(name) ) {
	    this.className = (this.className.trim() + " " + name.trim()).trim();
	}
    }
}

HTMLElement.prototype.html = function(arg) {
    this.innerHTML = arg;
}

HTMLElement.prototype.text = function(arg) {
    this.innerText = arg;
}

HTMLElement.prototype.val = function() {
    return this.value;
}

HTMLElement.prototype.fade = function(type, ms, cb) {
    var isIn = type === 'in',
	opacity = isIn ? 0.0 : 1.0,
	gap = 0.01,
	interval = ms * gap,
	self = this;

    if( isIn ) {
	this.show();
	this.style.opacity = opacity;
    }

    var fading = window.setInterval(function() {
	opacity = isIn ? opacity + gap : opacity - gap;
	if( opacity <= 0 ) {
	    opacity = 0;
	    self.hide();
	    window.clearInterval(fading);
	    if( cb ) cb();
	} else if ( opacity >= 1 ) {
	    opacity = 1.0;
	    window.clearInterval(fading);
	    if( cb ) cb();
	}
	self.style.opacity = opacity;
    }, interval);
}

HTMLElement.prototype.fadeIn = function(ms, cb) {
    this.fade('in', ms, cb);
}

HTMLElement.prototype.fadeOut = function(ms, cb) {
    this.fade('out', ms, cb);
}

HTMLElement.prototype.hide = function() {
    if( !this.getAttribute('displayOld') ) {
	this.setAttribute("displayOld", this.style.display);
    }
    this.style.display = "none";
}

HTMLElement.prototype.isHidden = function() {
    var width = this.offsetWidth, height = this.offsetHeight, tr = this.nodeName.toLowerCase() === "tr";
    return (width === 0 && height === 0 && !tr) ? true : ((width > 0 && height > 0 && !tr) ? false : getRealDisplay(this));
}

HTMLElement.prototype.toggle = function() {
    var a = this.isHidden();
    a ? this.show() : this.hide();
    return a;
}

HTMLElement.prototype.show = function() {
    var rd = this._getRealDisplay(this);

    if( rd != 'none') {
	return;
    }

    var old = this.getAttribute("displayOld");
    this.style.display = old || "";

    if( rd === "none" ) {
	var nodeName = this.nodeName, body = document.body, display;

	if ( this._displayCache[nodeName] ) {
	    display = this._displayCache[nodeName];
	} else {
	    var testElem = document.createElement(nodeName);
	    body.appendChild(testElem);
	    display = this._getRealDisplay(testElem);

	    if( display === "none" ) {
		display = "block";
	    }

	    body.removeChild(testElem);
	    this._displayCache[nodeName] = display;
	}

	this.setAttribute('displayOld', display);
	this.style.display = display;
    }
}

HTMLElement.prototype.position = function() {
    return this.getBoundingClientRect ? this._getOffsetRect() : this._getOffsetSum();
}

HTMLElement.prototype.width = function() {
    return this.offsetWidth;
}

HTMLElement.prototype.height = function() {
    return this.offsetHeight;
}

HTMLElement.prototype.popupDown = function(arg, offset) {
    var p = arg.position();
    this.style.top = "{0}px".format_a(p.top + p.height);
    this.style.left = "{0}px".format_a(p.left + (p.width - this.width()*(offset == null || typeof offset != 'number' ? 1.0 : offset))/2);
}
