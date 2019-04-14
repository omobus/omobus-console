/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

function UsersPopup(users, selection, params /* params = { everyone: true|false, container = "DOM container"} */) {
    if( !(this instanceof UsersPopup) ) {
	return new UsersPopup(users, selection, params);
    }
    if( params == null || typeof params == 'undefined' ) {
	params = { everyone: true, container: _("usersPopup") };
    }
    if( params.container == null || typeof params.container == 'undefined' ) {
	params.container = _("usersPopup");
    }
    if( !(params.container instanceof HTMLElement) ) {
	params.container = _(params.container);
    }
    if( users == null || typeof users == 'undefined' || !Array.isArray(users) ) {
	users = [];
    }
    if( params.container.hasAttribute("X-uid") ) {
	users.forEach(function(arg) { 
	    if( arg.user_id == this ) {
		arg._selected = true;
	    }
	}, params.container.getAttribute("X-uid"));
    }

    var xtag, own = this;
    var onsearch = function(ev) { own._onsearch(this.value); };
    var onselect = function(ev) { own._onselect(this.getAttribute("X-rowno")); };
    var oneveryone = function(ev) { own._oneveryone(); };
    var body = params.container.getElementsByClassName('body')[0];
    body.html(this._get(users, params.everyone).join(""));
    this._container = params.container;
    this._tb = body.getElementsByClassName('simplelist')[0].firstChild;
    this._ph = body.getElementsByClassName('placeholder')[0];
    this._users = users;
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
	    };
	});
    }
    this._foreach(body.getElementsByTagName('a'), function(arg, i) {
	if( arg.getAttribute('name') == 'everyone' ) {
	    arg.onclick = oneveryone;
	}
    });
}


/* static functions: */

(function (UsersPopup, undefined) {
    UsersPopup.container = function(id) {
	return "<div id='" + (id == null || typeof id == 'undefined' ? "usersPopup" : id) + 
	    "' class='ballon'><div class='arrow'></div><div class='body' style='min-height: 30px;'></div></div>";
    };
}(UsersPopup));


/** private functions: **/

UsersPopup.prototype._get = function(rows, everyone) {
    var ar = [], r;
    //if( rows.length > 5 ) {
	ar.push("<div class='search'><input type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "'></input></div>");
    //}
    ar.push("<div class='placeholder'></div>");
    ar.push("<div class='simplelist'><table>");
    for( var i = 0, size = rows.length; i < size; i++ ) {
        if( (r = rows[i]) != null ) {
	    ar.push("<tr " + (r._selected ? "class='selected'" : "") + "><td " + (r.hidden ? "class='strikethrough'" : "") + ">",
		G.shielding(r.dev_login, lang.dash) + ": " + G.shielding(r.descr, lang.dash) +
		(r.dev_login == r.user_id ? "" : ("<br/><span class='watermark'>" + lang.u_code + ": " +
		G.shielding(r.user_id, lang.dash) + "</span>")), "</td></tr>");
        }
    }
    ar.push("</table></div>");
    if( everyone ) {
	ar.push("<br />");
	ar.push("<div class='r'><a name='everyone' href='javascript:void(0);'>", lang.u_everyone, "</a></div>");
    }
    return ar;
}

UsersPopup.prototype._foreach = function(tags, cb) {
    for( var i = 0, size = tags == null ? 0 : tags.length; i < size; i++ ) {
	cb(tags[i], i);
    }
}

UsersPopup.prototype._onsearch = function(value) {
    var f = Filter(value, true/*, {user_id:true,dev_login:true,descr:true}*/);
    var empty = true;
    for( var i = 0, size = this._users.length; i < size; i++ ) {
	if( f.is(this._users[i]) ) {
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

UsersPopup.prototype._onselect = function(index) {
    if( !this._users[index]._selected ) {
	this._foreach(this._tb.rows, function(arg) { arg.className = null; });
	this._tb.rows[index].className = "selected";
	this._users.forEach(function(arg) { arg._selected = null; });
	this._users[index]._selected = true;
	if( typeof this._selection == 'function' ) {
	    this._selection(this._users[index], index, this._users);
	}
	this._container.setAttribute('X-uid', this._users[index].user_id);
    }
}

UsersPopup.prototype._oneveryone = function() {
    var x = this._container.hasAttribute('X-uid');
    this._foreach(this._tb.rows, function(arg) { arg.className = null; });
    this._users.forEach(function(arg) { if( arg._selected == true ) { arg._selected = null; x = true; } });
    if( typeof this._selection == 'function' && x ) {
	this._selection();
    }
    this._container.removeAttribute('X-uid');
}

UsersPopup.prototype._show = function(arg, offset) {
    this._container.onclick = this._container.hide;
    this._container.show();
    this._container.popupDown(arg, typeof offset == 'undefined' ? offset : offset*2);
    this._container.getElementsByClassName('arrow')[0].style.left = "{0}%".format_a(
	typeof offset == 'undefined' ? 50 : offset*100);
}


/* public functions: */

UsersPopup.prototype.show = function(arg, offset) {
    if( this._container.isHidden() ) {
	this._show(arg, offset);
    }
}

UsersPopup.prototype.hide = function() {
    this._container.hide();
}

UsersPopup.prototype.toggle = function(arg, offset) {
    if( this._container.toggle() ) {
	this._show(arg, offset);
    }
}

UsersPopup.prototype.isHide = function() {
    return this._container.isHide();
}
