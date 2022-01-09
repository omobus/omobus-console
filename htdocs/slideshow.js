/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

function Slideshow(rows /*[{ref:"uri",explain:"text"},...]*/, params /* = { container: "DOM container", idx: selected photo }*/) {
    if( !(this instanceof Slideshow) ) {
	return new Slideshow(rows, params);
    }
    if( !Array.isArray(rows) || rows.length == 0 ) {
	throw "Unable to create slideshow. Input array is empty!";
    }
    if( params == null || typeof params == 'undefined' ) {
	params = { container: _("slideshow") };
    }
    if( params.container == null || typeof params.container == 'undefined' ) {
	params.container = _("slideshow");
    }
    if( !(params.container instanceof HTMLElement) ) {
	params.container = _(params.container);
    }
    var own = this, w = window.innerWidth, h = window.innerHeight;
    var onclose = function() { own.hide(); };
    var onnext = function() { own.next(); };
    var onprev = function() { own.prev(); };
    this._container = params.container;
    params.container.html(this._get(params.container, rows, w, h).join(""));
    this._slides(params.idx || 1);
    /* initialize onclick: */
    this._foreach(params.container.getElementsByClassName("close"), function(arg) { arg.onclick = onclose; });
    this._foreach(params.container.getElementsByClassName("next"), function(arg) { arg.onclick = onnext; });
    this._foreach(params.container.getElementsByClassName("prev"), function(arg) { arg.onclick = onprev; });
    /* extra styles: */
    this._foreach(params.container.getElementsByTagName("img"), function(arg) { 
	arg.style.maxHeight = "{0}px".format_a(h - 60 - 10);
	arg.style.maxWidth = "{0}px".format_a(w - 550);
    });
}


/* static functions: */

(function (Slideshow, undefined) {
    Slideshow.container = function(id) {
	return "<div id='" + (id == null || typeof id == 'undefined' ? "slideshow" : id) + "' class='slideshow'></div>";
    };
}(Slideshow));


/** private functions: **/

Slideshow.prototype._get = function(tag, rows, w, h) {
    var ar = [], r, i, x;
    ar.push("<span class='close'>&times;</span>");
    ar.push("<div>");
    for( i = 0, x = 0, size = rows.length; i < size; i++ ) {
	if( (r = rows[i]) != null && r.ref != null && r.explain != null ) {
	    x++;
	    ar.push("<div class='slide'>");
	    ar.push("<div class='numbertext'>", x, " / ", size, "</div>");
	    ar.push("<table width='", w-90, "' height='", h-60, "' class='container'>");
	    ar.push("<tr>");
	    ar.push("<td class='explain'>", r.explain, "</td>");
	    ar.push("<td><img class='fade' data-original='", r.ref, "'/></td>");
	    ar.push("</tr>");
	    ar.push("</table>");
	    ar.push("</div>");
	}
    }
    if( x > 1 ) {
	ar.push("<a class='prev'>&#10094;</a>");
	ar.push("<a class='next'>&#10095;</a>");
    }
    ar.push("</div>");
    return ar;
}

Slideshow.prototype._foreach = function(tags, cb) {
    for( var i = 0, size = tags == null ? 0 : tags.length; i < size; i++ ) {
	cb(tags[i]);
    }
}

Slideshow.prototype._slides = function(n) {
    var slides = this._container.getElementsByClassName("slide");
    if( n > slides.length ) { 
	this._index = 1;
    } else if( n < 1 ) { 
	this._index = slides.length; 
    } else {
	this._index = n;
    }
    this._foreach(slides, function(arg) { arg.style.display = "none"; });
    this._foreach(slides[this._index-1].getElementsByTagName("img"), function(arg) { 
	    if( arg.hasAttribute("data-original") ) {
		arg.setAttribute("src", arg.getAttribute("data-original"));
		arg.removeAttribute("data-original");
	    }
	});
    slides[this._index-1].style.display = "block";
}

Slideshow.prototype._onkeyup = function(ev) {
    var a = true;
    if( ev.keyCode == 13 ) {
	a = false;
    } else if( ev.keyCode == 27 ) {
	this.hide();
    } else if( ev.keyCode == 37 /*left*/) {
	this.prev(); a = false;
    } else if( ev.keyCode == 39 /* right */) {
	this.next(); a = false;
    } else if( ev.keyCode == 38 /* up */ || ev.keyCode == 40 /* down*/ ) {
	a = false;
    }
    return a;
}


/* public functions: */

Slideshow.prototype.show = function() {
    var own = this;
    this._displayed = true;
    this._def_onkeyup = window.onkeyup;
    window.onkeyup = function(ev) { return own._onkeyup(ev); };
    this._container.show();
}

Slideshow.prototype.hide = function() {
    this._container.hide();
    if( this._displayed == true ) {
	window.onkeyup = this._def_onkeyup;
    }
    this._displayed = false;
}

Slideshow.prototype.next = function() {
    this._slides(this._index + 1);
}

Slideshow.prototype.prev = function() {
    this._slides(this._index - 1);
}
