/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
/* private properties & methods */
    var _code = "tickets";
    /*var _opt = {
	L: {lines: 8, length: 2, width: 4, radius: 6, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "auto"},
	D: {lines: 8, length: 2, width: 2, radius: 5, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "32px", left: "550px"}
    };*/
    var _cache = null, _perm = null, _elem = null, _context = null;


    function _showmsg(tag, msg) {
	tag.show(); tag.html(msg);
    }

    function _hidemsg(tag) {
	tag.hide(); tag.html("");
    }

    function _disable(tag, arg) {
	if( arg ) {
	    tag.attr("disabled", true);
	} else {
	    tag.removeAttr("disabled");
	}
    }

    function _getcolumns() {
	return 8;
    }

    function _getbody(perm) {
	return "<table class='headerbar' width='100%'><tr><td><h1>" + lang.tickets.title + ":&nbsp;&nbsp;" +
	    "<input id='plugfilter' type='text' placeholder='" + lang.everything + "' onkeyup='return PLUG.onfilter(this, event);' />" +
	    "</h1></td><td style='text-align: right;'>" + lang.received_ts + "&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>&nbsp;" +
	    "(<a href='javascript:PLUG.onrefresh();'>" + lang.refresh  + "</a>)" +
	    (perm.add != null?("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:PLUG.add();'>" + lang.tickets.title1 + "</a>"):"") +
	    "</td></tr></table>" +
	    "<table width='100%' class='report'><thead><tr>" + 
	    "<th>" + lang.tickets.ticket_id + "</th>" + 
	    "<th>" + lang.status + "</th>" + 
	    "<th>" + lang.tickets.issue + "</th>" + 
	    "<th>" + lang.note + "</th>" + 
	    "<th>" + lang.tickets.resolution + "</th>" + 
	    "<th>" + lang.u_name + "</th>" + 
	    "<th>" + lang.u_code + "</th>" + 
	    "<th>" + lang.tickets.date + "</th>" + 
	    "</tr>" + G.thnums(_getcolumns()) + "</thead><tbody id=\"maintb\"></tbody></table>" +
	    "<div id='plugspin' style='display: none; padding-top: 30px;'></div>" +
	    "<div id='plugbox' class='dialog' style='display: none;'></div>";
    }

    function _getobjcache() {
	return G.getobjcache(_code, null);
    }

    function _checkrow(tr, objcache, row_id) {
	if( tr.className == 'selected' ) {
	    tr.className = null;
	    objcache.setchecked(row_id);
	} else {
	    tr.className = 'selected';
	    objcache.setchecked(row_id, true);
	}
    }

    function _failed(msg) {
	return ["<tr class='def'><td colspan='" + _getcolumns() + "' class='message'>" + msg + "</td></tr>"];
    }

    function _success(data, f, objcache, perm) {
	var ar = [], r;
	for( var i = 0, x = 1, size = data.tickets ? data.tickets.length : 0; i < size; i++ ) {
	    if( (r = data.tickets[i]) != null && f.is(r) ) {
		ar.push("<tr" + (objcache.getchecked(r.ticket_id) ? " class='selected'" : "") + ">");
		ar.push("<td style='cursor:pointer' class='int' onclick=\"PLUG.oncheckrow(this.parentNode,'" + r.ticket_id +
		    "');event.stopPropagation();\">" + r.ticket_id + "</td>");
		ar.push("<td class='ref" + (r.closed != 1 && !perm.resolution ? " attention" : "") + "'>" + (r.closed == 1 ? 
		    lang.tickets.status1 : (perm.resolution ? ("<a href='javascript:PLUG.resolution(\"" + r.ticket_id + 
			"\"," + i + ");'>" + lang.tickets.status0 + "</a>") : lang.tickets.status0)) + "</td>");
		ar.push("<td class='string'>" + G.shielding(r.issue) + "</td>");
		ar.push("<td class='string'>" + G.shielding(r.note) + "</td>");
		ar.push("<td class='string'>" + G.shielding(r.resolution) + "</td>");
		ar.push("<td class='string'>" + r.u_name + "</td>");
		ar.push("<td class='int'>" + r.user_id + "</td>");
		ar.push("<td class='datetime'>" + G.getdatetime_l(Date.parseISO8601(r.fix_dt)) + "</td>");
		ar.push("</tr>");
		x++;
	    }
	}
	if( ar.length == 0 ) {
	    ar = _failed(lang.empty);
	}
	return ar;
    }

    function _setdata(tbody, f) {
	//var sp = new Spinner(_opt.L).spin(_elem.spin.get(0));
	//_elem.spin.show(); tbody.hide();
ProgressDialog.show();
	_cache = null; // drop the internal cache
	G.xhr("GET", G.getajax({plug: _code}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		tbody.html(_success(data, f, _getobjcache(), _perm).join(""));
		_cache = data;
	    } else {
		tbody.html(_failed(lang.failure).join(""));
	    }
	    _elem.ts.text(G.getdatetime_l(new Date()));
	    //tbody.show(); sp.stop(); _elem.spin.hide();
ProgressDialog.hide();
	}).send();
    }

    function _filterdata(tbody, f) {
	if( _cache != null ) {
	    //var sp = new Spinner(_opt.L).spin(_elem.spin.get(0));
	    //_elem.spin.show(); tbody.hide();
ProgressDialog.show();
	    setTimeout(function() {
		tbody.html(_success(_cache, f, _getobjcache(), _perm).join(""));
		//sp.stop(); _elem.spin.hide(); tbody.show();
ProgressDialog.hide();
	    }, 0);
	}
    }

    function _createContext(row, data) {
	var a = {
	    _data: data,
	    _row: row
	};
	if( row ) {
	    a.ticket_id = row.ticket_id;
	    a.note = '';
	} else {
	    a.u = null;
	    a.issue = null;
	    a.note = '';
	    a.closed = false;
	}
	return a;
    }

    function _checkContext(context) {
	return context.u == null || context.issue == null;
    }

    function _getboxN() {
	var a = [];
	a.push("<div style='width: 550px;' onclick='PLUG.hidepopup();event.stopPropagation();'>");
	a.push("<h1><span>" + lang.tickets.title2 + "</span><span id='spin'></span></h1>");
	a.push("<div class='row'>" + lang.tickets.closed_hint + "</div>");
	a.push("<div id='msg' class='row attention gone'></div>");
	a.push("<div class='row'><span style='display:inline-block;width:100px;'>" + lang.u_name + ":&nbsp;</span><a id='user' href='javascript:PLUG.N.user();'>" +
	    lang.u_placeholder + "</a></div>");
	a.push("<div class='row'><span style='display:inline-block;width:100px;'>" + lang.tickets.issue + ":&nbsp;</span><a id='issue' href='javascript:PLUG.N.issue();'>" +
	    lang.tickets.issue_placeholder + "</a></div>");
	a.push("<div id='hint' class='row' style='display:none;padding-left:30px;'></div>");

a.push("<div class='row'>");
a.push("<label class='checkbox'>");
a.push("<input type='checkbox' onchange='PLUG.N.closed(this.checked)' />");
a.push("<div class='checkbox__text'>", lang.tickets.closed, "</div>");
a.push("</label>");
a.push("</div>");

//	a.push("<div class='row'><span style='display:inline-block;width:100px;'>" + lang.tickets.closed + ":&nbsp;</span><input type='checkbox' " +
//	    "onchange='PLUG.N.closed(this.checked)'/></div>");
	a.push("<div class='row'><textarea rows='3' maxlength='254' autocomplete='off' oninput='PLUG.N.note(this.value)' placeholder='" +
	    lang.tickets.note_placeholder + "'></textarea></div>");
	a.push("<hr />");
	a.push("<div align='right'><button onclick='PLUG.hidebox();'>" + lang.back + "</button>&nbsp;&nbsp;<button id='commit' " +
	    "onclick='PLUG.saveticket();' disabled='true'>" + lang.save + "</button></div>");
	a.push("<div id='popup' class='ballon' style='display: none; z-index: 99990;' onclick='PLUG.hidepopup();'>" +
	    "<div class='arrow'></div><div class='body' style='min-height: 30px;'></div></div>");
	a.push("</div>");
	return a;
    }

    function _getboxR(r) {
	var a = [];
	a.push("<div style='width: 550px;'>");
	a.push("<h1><span>" + lang.tickets.title3.format_a(r.ticket_id) + "</span><span id='spin'></span></h1>");
	a.push("<div id='msg' class='row attention gone'></div>");
	a.push("<div><i>" + r.u_name + "</i></div>");
	a.push("<div>" + r.issue + "</div>");
	if( r.note.length ) {
	    a.push("<div class='row'>" + G.shielding(r.note) + "</div>");
	}
	a.push("<div class='row'><textarea rows='3' maxlength='255' autocomplete='off' oninput='PLUG.R.note(this.value)' placeholder='" +
	    lang.tickets.resolution_placeholder + "'></textarea></div>");
	a.push("<hr />");
	a.push("<div align='right'><button onclick='PLUG.hidebox();'>" + lang.back + "</button>&nbsp;&nbsp;<button id='commit' " +
	    "onclick='PLUG.saveresolution();' disabled='true'>" + lang.save + "</button></div>");
	a.push("</div>");
	return a;
    }

    function _getsimplelist(rows, selected, code, f, descr_cb, style_cb, watermark_cb) {
	var ar = [], i, size, r;
	if( f ) {
	    ar.push("<div class='search'><input type='text' onclick='event.stopPropagation();' maxlength='96' autocomplete='off' " +
		"oninput='PLUG.N._f" + code + "(this.value)' placeholder='" + lang.search + "'></input></div>");
	}
	ar.push("<div class='simplelist'><table id='sl-data'>");
	for( i = 0, size = rows.length; i < size; i++ ) {
	    if( (r = rows[i]) != null ) {
		ar.push("<tr " + (selected(r) ? "class='selected'" : ("onclick='PLUG.N._set" + code +"(" + i + ")'")) +
		    "><td " + (style_cb != null ? style_cb(r) : "") + ">" + (descr_cb != null ? descr_cb(r) : r.descr) + 
		    (watermark_cb != null ? watermark_cb(r) : "") + "</td></tr>");
	    }
	}
	ar.push("</table></div>");
	if( f ) {
	    ar.push("<div class='placeholder' style='display:none'></div>");
	}
	return ar;
    }

    function _showbox(context, box, ar) {
	box.html(ar.join(''));
	context._commit = box.find("#commit");
	context._spin = box.find("#spin");
	context._msg = box.find("#msg");
	context._popup = box.find("#popup");
	box.show();
    }

    function _hidebox(box) {
	if( box != null && box.is(":visible") ) {
	    box.hide();
	}
    }

    function _showpopup(popup, tag, ar) {
	if( popup.is(":visible") ) {
	    popup.hide();
	} else {
	    var pos = tag.position();
	    popup.find(".body").html(ar.join(''));
	    popup.css({top: pos.top + tag.height(), left: pos.left + (tag.width() - popup.width())/2});
	    popup.show();
	}
    }

    function _hidepopup(popup) {
	if( popup != null && popup.is(":visible") ) {
	    popup.hide();
	}
    }

    function _saveticket(context, onsuccess) {
	_hidemsg(context._msg);
	if( context.u == null ) {
	    _showmsg(context._msg, lang.tickets.msg1);
	} else if( context.issue == null ) {
	    _showmsg(context._msg, lang.tickets.msg2);
	} else {
ProgressDialog.show();
	    //var sp = new Spinner(_opt.D).spin(_context._spin.get(0));
	    var xhr = G.xhr("POST", G.getajax({plug: _code, user_id: context.u.user_id}), "", function(xhr) {
		_disable(context._commit, false);
		if( xhr.status == 200 ) {
		    onsuccess();
		} else {
		    _showmsg(msg, lang.tickets.msg3);
		}
		//sp.stop();
ProgressDialog.hide();
	    });
	    _disable(context._commit, true);
	    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	    xhr.send(G.formParamsURI({user_id: context.u.user_id, issue_id: context.issue.issue_id, 
		closed: context.closed?1:0, note: context.note}));
	}
    }

    function _saveresolution(context, onsuccess) {
	_hidemsg(context._msg);
	if( _perm.min_resolution_length > context.note.length ) {
	    _showmsg(context._msg, lang.tickets.msg4.format_a(_perm.min_resolution_length));
	} else {
ProgressDialog.show();
	    //var sp = new Spinner(_opt.D).spin(_context._spin.get(0));
	    var xhr = G.xhr("PUT", G.getajax({plug: _code, ticket_id: context.ticket_id}), "", function(xhr) {
		_disable(context._commit, false);
		if( xhr.status == 200 ) {
		    onsuccess();
		} else {
		    _showmsg(msg, lang.tickets.msg3);
		}
		//sp.stop();
ProgressDialog.hide();
	    });
	    _disable(context._commit, true);
	    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	    xhr.send(G.formParamsURI({ticket_id: context.ticket_id, note: context.note}));
	}
    }

    function _filterSL(value, ar, popup) {
	var tb = popup.find("#sl-data").get(0);
	var ph = popup.find(".placeholder").get(0);
	var f = new Filter(value, true);
	var empty = true;
	for( var i = 0; i < ar.length; i++ ) {
	    if( f.is(ar[i]) ) {
		tb.rows[i].style.display = null;
		empty = false;
	    } else {
		tb.rows[i].style.display = "none";
	    }
	}
	ph.style.display = empty ? null : "none";
	ph.innerHTML = empty ? lang.no_results.format_a(value) : "";
    }


/* public properties & methods */
    return {
	get: function(perm) {
	    return _getbody(perm);
	},
	set: function(elem, perm) {
	    _elem = elem; _perm = perm;
	},
	refresh: function() {
	    _setdata(_elem.tbody, new Filter(_elem.f.val()));
	},
	add: function() {
	    if( _cache && _perm && _perm.add ) {
		_context = _createContext(null, _cache);
		_showbox(_context, _elem.box, _getboxN());
	    }
	},
	resolution: function(arg0, arg1) {
	    if( _cache && _perm && _perm.resolution ) {
		_context = _createContext(_cache.tickets[arg1], _cache);
		_showbox(_context, _elem.box, _getboxR(_context._row));
	    }
	},
	hidebox: function() {
	    _hidebox(_elem.box, _context._popup);
	},
	hidepopup: function() {
	    _hidepopup(_context._popup);
	},
	saveticket: function() {
	    _saveticket(_context, function() {
		    _hidebox(_elem.box, _context._popup);
		    _setdata(_elem.tbody, new Filter(_elem.f.val()));
		}
	    );
	},
	saveresolution: function() {
	    _saveresolution(_context, function() {
		    _hidebox(_elem.box, null);
		    _setdata(_elem.tbody, new Filter(_elem.f.val()));
		}
	    );
	},

	onrefresh: function() {
	    _setdata(_elem.tbody, new Filter(_elem.f.val()));
	},
	onfilter: function(tag, ev) {
	    var a = true;
	    if( ev.keyCode == 13 ) {
		_filterdata(_elem.tbody, new Filter(_elem.f.val())); a = false;
	    } else if( ev.keyCode == 27 ) {
		_filterdata(_elem.tbody, new Filter(_elem.f.val())); tag.blur();
	    }
	    return a;
	},
	oncheckrow: function(tr, row_id) {
	    _checkrow(tr, _getobjcache(), row_id);
	},

	N: {
	    user: function() {
		_showpopup(_context._popup, _elem.box.find("#user"), _getsimplelist(_context._data.users, function(r) {
			return _context.u && r.user_id == _context.u.user_id;
		    }, "user", true, function(r) {
			return G.shielding(r.dev_login, lang.dash) + ": " + G.shielding(r.descr, lang.dash);
		    }, function(r) {
			return r.hidden ? "class='strikethrough'" : "";
		    }, function(r) {
			return r.dev_login == r.user_id ? "" : ("<br/><span class='watermark'>" + lang.u_code + ": " + 
			    G.shielding(r.user_id, lang.dash) + "</span>");
		    })
		);
	    },
	    issue: function() {
		_showpopup(_context._popup, _elem.box.find("#issue"), _getsimplelist(_context._data.issues, function(r) {
			return _context.issue && r.issue_id == _context.issue.issue_id;
		    }, "issue", false)
		);
	    },
	    closed: function(checked) {
		_context.closed = checked;
		_disable(_context._commit, _checkContext(_context));
		_hidemsg(_context._msg);
	    },
	    note: function(value) {
		_context.note = value;
		_disable(_context._commit, _checkContext(_context));
		_hidemsg(_context._msg);
	    },
	    _setuser: function(i) {
		_context.u = _context._data.users[i];
		_elem.box.find("#user").text(G.shielding(_context.u.dev_login, lang.dash) + ": " + 
		    G.shielding(_context.u.descr, lang.dash));
		_disable(_context._commit, _checkContext(_context));
		_hidemsg(_context._msg);
	    },
	    _setissue: function(i) {
		var tag = _elem.box.find("#hint");
		_context.issue = _context._data.issues[i];
		_elem.box.find("#issue").text(_context.issue.descr);
		tag.html(_context.issue.hint);
		tag.show();
		_disable(_context._commit, _checkContext(_context));
		_hidemsg(_context._msg);
	    },
	    _fuser: function(value) {
		_filterSL(value, _context._data.users, _context._popup);
	    }
	},

	/* resolution dialog */
	R: {
	    note: function(value) {
		_context.note = value;
		_disable(_context._commit, _context.note.length == 0);
		_hidemsg(_context._msg);
	    }
	}
    }
})();


function startup(tag, perm) {
    tag.html(PLUG.get(perm));
    PLUG.set({
	body: tag,
	tbody: tag.find("#maintb"),
	spin: tag.find("#plugspin"),
	f: tag.find("#plugfilter"),
	ts: tag.find("#timestamp"),
	box: tag.find("#plugbox")
    }, perm);
    PLUG.refresh();
}
