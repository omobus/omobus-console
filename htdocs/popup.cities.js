/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

function CitiesPopup(rows, selection, params /* params = { everything: true|false, container = "DOM container"} */) {
    if( !(this instanceof CitiesPopup) ) {
	return new CitiesPopup(rows, selection, params);
    }
    if( params == null || typeof params == 'undefined' ) {
	params = { everything: true, container: _("citiesPopup") };
    }
    if( params.container == null || typeof params.container == 'undefined' ) {
	params.container = _("citiesPopup");
    }
    if( !(params.container instanceof HTMLElement) ) {
	params.container = _(params.container);
    }
    if( rows == null || typeof rows == 'undefined' || !Array.isArray(rows) ) {
	rows = [];
    }
    if( params.container.hasAttribute("X-uid") ) {
	rows.forEach(function(arg) { 
	    if( arg.city_id == this ) {
		arg._selected = true;
	    }
	}, params.container.getAttribute("X-uid"));
    }

    var xtag, own = this;
    var onsearch = function(ev) { own._onsearch(this.value); };
    var onselect = function(ev) { own._onselect(this.getAttribute("X-rowno")); };
    var oneverything = function(ev) { own._oneverything(); };
    var body = params.container.getElementsByClassName('body')[0];
    body.html(this._get(rows, params.everything).join(""));
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
    if( (xtag = body.getElementsByClassName('search')[0]) != null ) {
	this._foreach(xtag.childNodes, function(arg) { 
	    if( params.container.hasAttribute("X-search") ) {
		own._onsearch(params.container.getAttribute("X-search"));
		arg.value = params.container.getAttribute("X-search");
	    }
	    arg.onclick = function(ev) { ev.stopPropagation(); };
	    arg.oninput = onsearch;
	    arg.onkeyup = function(ev) { 
		if( ev.keyCode == 13 ) {
		    this.blur(); 
		} else if( ev.keyCode == 27 ) {
		    if( this.value != '' ) {
			this.value = ''; own._onsearch(this.value);
		    } else {
			this.blur();
		    }
		}
		ev.stopPropagation();
	    };
	});
    }
    this._foreach(body.getElementsByTagName('a'), function(arg, i) {
	if( arg.getAttribute('name') == 'citiesEverything' ) {
	    arg.onclick = oneverything;
	}
    });
}


/* static functions: */

(function (CitiesPopup, undefined) {
    CitiesPopup.container = function(id) {
	return "<div id='" + (id == null || typeof id == 'undefined' ? "citiesPopup" : id) + 
	    "' class='ballon'><div class='arrow'></div><div class='body' style='min-height: 30px;'></div></div>";
    };
}(CitiesPopup));


/** private functions: **/

CitiesPopup.prototype._get = function(rows, everything) {
    var ar = [], r;
    //if( rows.length > 5 ) {
	ar.push("<div class='search'><input type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "'></input></div>");
    //}
    ar.push("<div class='placeholder'></div>");
    ar.push("<div class='simplelist'><table>");
    for( var i = 0, size = rows.length; i < size; i++ ) {
        if( (r = rows[i]) != null ) {
	    ar.push("<tr ", r._selected ? "class='selected'" : "", ">");
	    ar.push("<td ", r.hidden ? "class='strikethrough'" : "", ">");
	    ar.push(G.shielding(r.descr, lang.dash));
	    if( !String.isEmpty(r.territory) ) {
		ar.push("<br/><span class='watermark'>", G.shielding(r.territory), "</span>");
	    }
	    ar.push("</td>");
	    ar.push("</tr>");
        }
    }
    ar.push("</table></div>");
    if( everything ) {
	ar.push("<br />");
	ar.push("<div class='r'><a name='citiesEverything' href='javascript:void(0);'>", lang.city_everything, "</a></div>");
    }
    return ar;
}

CitiesPopup.prototype._foreach = function(tags, cb) {
    for( var i = 0, size = tags == null ? 0 : tags.length; i < size; i++ ) {
	cb(tags[i], i);
    }
}

CitiesPopup.prototype._onsearch = function(value) {
    var f = Filter(value, true);
    var empty = true;
    for( var i = 0, size = this._rows.length; i < size; i++ ) {
	if( f.is(this._rows[i]) ) {
	    this._tb.rows[i].show();
	    empty = false;
	} else {
	    this._tb.rows[i].hide();
	}
    }
    if( empty ) {
	this._ph.html(lang.no_results.format_a(value));
	this._ph.show();
    } else {
	this._ph.hide();
    }
    this._container.setAttribute('X-search', value);
}

CitiesPopup.prototype._onselect = function(index) {
    if( !this._rows[index]._selected ) {
	this._foreach(this._tb.rows, function(arg) { arg.className = null; });
	this._tb.rows[index].className = "selected";
	this._rows.forEach(function(arg) { arg._selected = null; });
	this._rows[index]._selected = true;
	if( typeof this._selection == 'function' ) {
	    this._selection(this._rows[index], index, this._rows);
	}
	this._container.setAttribute('X-uid', this._rows[index].city_id);
    }
}

CitiesPopup.prototype._oneverything = function() {
    var x = this._container.hasAttribute('X-uid');
    this._foreach(this._tb.rows, function(arg) { arg.className = null; });
    this._rows.forEach(function(arg) { if( arg._selected == true ) { arg._selected = null; x = true; } });
    if( typeof this._selection == 'function' && x ) {
	this._selection();
    }
    this._container.removeAttribute('X-uid');
}

CitiesPopup.prototype._show = function(arg, offset) {
    this._container.onclick = this._container.hide;
    this._container.show();
    this._container.popupDown(arg, typeof offset == 'undefined' ? offset : offset*2);
    this._container.getElementsByClassName('arrow')[0].style.left = "{0}%".format_a(
	typeof offset == 'undefined' ? 50 : offset*100);
}


/* public functions: */

CitiesPopup.prototype.show = function(arg, offset) {
    if( this._container.isHidden() ) {
	this._show(arg, offset);
    }
}

CitiesPopup.prototype.hide = function() {
    this._container.hide();
}

CitiesPopup.prototype.toggle = function(arg, offset) {
    if( this._container.toggle() ) {
	this._show(arg, offset);
    }
}

CitiesPopup.prototype.isHidden = function() {
    return this._container.isHidden();
}
