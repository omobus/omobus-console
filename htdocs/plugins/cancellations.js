/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
/* private properties & methods */
    var _code = "cancellations";
    var _opt = {
	L: {lines: 8, length: 2, width: 4, radius: 6, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "auto"},
	S: {lines: 6, length: 1, width: 2, radius: 3, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "auto", left: "auto"},
	D: {lines: 8, length: 2, width: 2, radius: 5, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "32px", left: "550px"}
    };
    var _cache = { /*data, cal, y, m*/ }, _perm = null, _elem = null, _context = null;


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
	return 7;
    }

    function _getbody(perm) {
	return "<table class='headerbar' width='100%'><tr><td><h1>" + lang.cancellations.title + "&nbsp;<a id='plugmonth' "+
	    "href='javascript:PLUG.calendar.onshow();'>[&nbsp;-&nbsp;]</a>:&nbsp;&nbsp;<input id='plugfilter' type='text' " +
	    "placeholder='" + lang.everything + "' onkeyup='return PLUG.onfilter(this, event);' /></h1></td><td " +
	    "style='text-align: right;'>" + lang.received_ts + "&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>&nbsp;(" +
	    "<a id='refresh' href='javascript:PLUG.onrefresh();'>" + lang.refresh + "</a>)" +
	    (perm.add != null?("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:PLUG.add();'>" + lang.cancellations.title2 + "</a>"):"") +
	    "</td></tr></table>" +
	    "<table width='100%' class='report'><thead><tr>" + 
	    "<th class='autoincrement'>" + lang.num + "</th>" + 
	    "<th class='date'>" + lang.date + "</th>" + 
	    "<th>" + lang.u_name + "</th>" + 
	    "<th>" + lang.u_code + "</th>" + 
	    "<th>" + lang.cancellations.type + "</th>" + 
	    "<th>" + lang.note + "</th>" + 
	    "<th>" + lang.reject.cap + "</th>" + 
	    "</tr>" + G.thnums(_getcolumns()) + "</thead><tbody id=\"maintb\"></tbody></table>" +
	    "<div id='plugspin' style='display: none; padding-top: 30px;'></div>" +
	    "<div id='plugcal' class='ballon' onclick='javascript:PLUG.calendar.onhide();'>" +
	    "<div class='arrow'></div><div class='body' style='min-height: 30px;'>" +
	    "<div id='calspin' style='display:none; padding-top: 12px;'></div><div id='calbody'></div></div></div>" +
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

    function _failed_data(msg) {
	return ["<tr class='def'><td colspan='"+_getcolumns()+"' class='message'>"+msg+"</td></tr>"];
    }

    function _success_data(data, f, objcache, perm) {
	var ar = [], r;
	for( var i = 0, x = 1, size = data.cancellations ? data.cancellations.length : 0; i < size; i++ ) {
	    if( (r = data.cancellations[i]) != null && f.is(r) ) {
		ar.push("<tr" + (objcache.getchecked(r.doc_id) ? " class='selected'" : "") + ">");
		ar.push("<td style='cursor:pointer' class='autoincrement' onclick=\"PLUG.oncheckrow(this.parentNode,'" + r.doc_id +
		    "');event.stopPropagation();\">" + r.row_no + "</td>");
		ar.push("<td id='sR" + r.row_no + "' class='date" + (!r.hidden ? "" : " strikethrough attention") + "'>" + 
		    G.getdate_l(Date.parseISO8601(r.route_date)) + "</td>");
		ar.push("<td class='string'>" + r.u_name + "</td>");
		ar.push("<td class='string'>" + r.user_id + "</td>");
		ar.push("<td class='string'>" + G.shielding(r.canceling_type) + "</td>");
		ar.push("<td class='string'>" + G.shielding(r.note) + "</td>");
		ar.push("<td id='aR" + r.row_no + "' class='ref' style='width: 60px; white-space: nowrap;'>");
		if( r.hidden ) {
		    ar.push(perm.restore ? ("<a href='javascript:PLUG.restore(" + r.row_no + ",\"" + r.route_date + "\",\"" +
			r.user_id + "\");'>" + lang.restore.ref + "</a>") : lang.plus);
		} else {
		    ar.push(perm.reject ? ("<a href='javascript:PLUG.reject(" + r.row_no + ",\"" + r.route_date + "\",\"" +
			r.user_id + "\");'>" + lang.reject.ref + "</a>") : "");
		}
		ar.push("</td></tr>");
		x++;
	    }
	}
	if( ar.length == 0 ) {
	    ar = _failed_data(lang.empty);
	}
	return ar;
    }

    function _setdata(tbody, f) {
	var sp = new Spinner(_opt.L).spin(_elem.spin.get(0));
	_elem.spin.show(); tbody.hide();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getajax({plug: _code, year: _cache.y, month: _cache.m}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_cache.data = data;
		tbody.html(_success_data(data, f, _getobjcache(), _perm).join(""));
	    } else {
		tbody.html(_failed_data(lang.failure).join(""));
	    }
	    _elem.ts.text(G.getdatetime_l(new Date()));
	    tbody.show(); sp.stop(); _elem.spin.hide();
	}).send();
    }

    function _filterdata(tbody, f) {
	if( _cache.data != null ) {
	    var sp = new Spinner(_opt.L).spin(_elem.spin.get(0));
	    _elem.spin.show(); tbody.hide();
	    setTimeout(function() {
		tbody.html(_success_data(_cache.data, f, _getobjcache(), _perm).join(""));
		sp.stop(); _elem.spin.hide(); tbody.show();
	    }, 0);
	}
    }

    function _failed_calendar(msg) {
	return ["<br /><center>",msg,"</center><br />"];
    }

    function _success_calendar(rows, year, month) {
	var ar = [], i, size, r, flag = false;
	ar.push("<table class='monthlycalendar'>");
	for( i = 0, size = rows.length; i < size; i++ ) {
	    if( (r = rows[i]) != null ) {
		ar.push("<tr " + (year == r.y && month == r.m ? "class='selected'" : ("onclick='PLUG.calendar.onselect("+r.y+","+r.m+")'")) +
		    "><td>" + G.getlongmonth_l(new Date(r.y, r.m-1, 1)) + "</td><td class='r'>" + r.qty + "</td></tr>");
		flag = true;
	    }
	}
	ar.push("</table>");

	return !flag ? _failed_calendar(lang.empty) : ar;
    }

    function _setcalendar(body, spin) {
	if( _cache.cal != null ) {
	    body.html(_success_calendar(_cache.cal, _cache.y, _cache.m).join(""));
	} else {
	    var sp = new Spinner(_opt).spin(spin.get(0));
	    spin.show(); body.hide();
	    _cache.cal = null; // drop the internal cache
	    G.xhr("GET", G.getajax({plug: _code, calendar: true}), "json", function(xhr, data) {
		if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		    _cache.cal = data;
		    body.html(_success_calendar(data, _cache.y, _cache.m).join(""));
		} else {
		    body.html(_failed_calendar(lang.failure).join(""));
		}
		body.show();
		sp.stop(); spin.hide();
	    }).send();
	}
    }

    function _restore(tbody, row_no, user_id, route_date) {
	var tag = tbody.find("#aR"+row_no), tag2 = tbody.find("#sR"+row_no);
	var sp = new Spinner(_opt.S);
	tag.text(""); 
	tag.get(0).appendChild(sp.spin().el);
	G.xhr("PUT", G.getajax({plug: _code, user_id: user_id, route_date: route_date}), "", function(xhr) {
	    if( xhr.status == 200 ) {
		tag2.removeClass("date strikethrough attention"); tag2.addClass("date");
		_cache.data.cancellations[row_no-1].hidden = 0;
	    } else {
		//tag.text(lang.error);
	    }
	    sp.stop();
	}).send();
    }

    function _reject(tbody, row_no, user_id, route_date) {
	var tag = tbody.find("#aR"+row_no), tag2 = tbody.find("#sR"+row_no);
	var sp = new Spinner(_opt.S);
	tag.text("");
	tag.get(0).appendChild(sp.spin().el);
	G.xhr("DELETE", G.getajax({plug: _code, user_id: user_id, route_date: route_date}), "", function(xhr) {
	    if( xhr.status == 200 ) {
		tag.text(lang.plus);
		tag2.removeClass("date"); tag2.addClass("date strikethrough attention");
		_cache.data.cancellations[row_no-1].hidden = 1;
	    } else {
		//tag.text(lang.error);
	    }
	    sp.stop();
	}).send();
    }

    function _startdate(today, perm) {
	return new Date(new Date(today.getYear()+1900, today.getMonth(), today.getDate()).getTime() +
	    86400000*(perm&&perm.offset!=null?perm.offset:1));
    }

    function _stopdate(today, perm) {
	return new Date(today.getFullYear(), today.getMonth() + (perm&&perm.depth!=null?perm.depth:1) + 1, 0);
    }

    function _createContext(data, perm) {
	var today = new Date();
	var a = {
	    _b_date: _startdate(today, perm.add),
	    _e_date: _stopdate(today, perm.add),
	    _data: data,
	};
	a.u = null;
	a.t = data.types && data.types.length ? data.types[0] : null;
	a.b_date = a._b_date > today ? a._b_date : today;
	a.e_date = a.b_date;
	a.note = '';
	return a;
    }

    function _checkContext(context) {
	return context.u == null || context.t == null || G.getdate(context.b_date) > G.getdate(context.e_date);
    }

    function _getbox(context) {
	var a = [];
	a.push("<div style='width: 550px;' onclick='PLUG.hidepopup();event.stopPropagation();'>");
	a.push("<h1><span>" + lang.cancellations.title2 + "</span><span id='spin'></span></h1>");
	a.push("<div class='row'>" + lang.cancellations.notice + "</div>");
	a.push("<div id='msg' class='row attention gone'></div>");
	a.push("<div class='row'><span style='display:inline-block;width:135px;'>" + lang.u_name + ":&nbsp;</span><a id='user' href='javascript:PLUG.N.user();'>" +
	    lang.u_placeholder.toLowerCase() + "</a></div>");
	if( context.t != null ) {
	    a.push("<div class='row'><span style='display:inline-block;width:135px;'>" + lang.cancellations.type + ":&nbsp;</span><a id='type' " + 
		"href='javascript:PLUG.N.type();'>" + context.t.descr + "</a></div>");
	}
	a.push("<div class='row'><span style='display:inline-block;width:135px;'>" + lang.b_date + ":&nbsp;</span><a id='b_date' " + 
	    "href='javascript:PLUG.N.b_date();'>" + G.getlongdate_l(context.b_date).toLowerCase() + "</a></div>");
	a.push("<div class='row'><span style='display:inline-block;width:135px;'>" + lang.e_date + ":&nbsp;</span><a id='e_date' " + 
	    "href='javascript:PLUG.N.e_date();'>" + G.getlongdate_l(context.e_date).toLowerCase() + "</a></div>");
	a.push("<div class='row'><textarea rows='3' maxlength='254' autocomplete='off' oninput='PLUG.N.note(this.value)' placeholder='" +
	    lang.note_placeholder + "'></textarea></div>");
	a.push("<hr />");
	a.push("<div align='right'><button onclick='PLUG.hidebox();'>" + lang.back + "</button>&nbsp;&nbsp;<button id='commit' " +
	    "onclick='PLUG.save();' disabled='true'>" + lang.save + "</button></div>");
	a.push("<div id='popup' class='ballon' style='display: none; z-index: 99990;' onclick='PLUG.hidepopup();'>" +
	    "<div class='arrow'></div><div class='body' style='min-height: 30px;'></div></div>");
	a.push("</div>");
	return a;
    }

    function _getsimplelist(rows, selected, code, f, descr_cb, watermark_cb) {
	var ar = [], i, size, r;
	if( f ) {
	    ar.push("<div class='search'><input type='text' onclick='event.stopPropagation();' maxlength='96' autocomplete='off' " +
		"oninput='PLUG.N._f" + code + "(this.value)' placeholder='" + lang.search + "'></input></div>");
	}
	ar.push("<div class='simplelist'><table id='sl-data'>");
	for( i = 0, size = rows.length; i < size; i++ ) {
	    if( (r = rows[i]) != null ) {
		ar.push("<tr " + (selected(r) ? "class='selected'" : ("onclick='PLUG.N._set" + code +"(" + i + ")'")) +
		    "><td>" + (descr_cb != null ? descr_cb(r) : r.descr) + (watermark_cb != null ? watermark_cb(r) : "")
		    + "</td></tr>");
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
	_context = null;
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

    function _save(context, onsuccess) {
	_hidemsg(context._msg);
	if( context.u == null ) {
	    _showmsg(context._msg, lang.cancellations.msg0);
	} else if( context.t == null /*&& context.note.length == 0*/ ) {
	    _showmsg(context._msg, lang.cancellations.msg2);
	} else if( context.b_date > context.e_date ) {
	    _showmsg(context._msg, lang.cancellations.msg1);
	} else {
	    var sp = new Spinner(_opt.D).spin(context._spin.get(0));
	    var xhr = G.xhr("POST", G.getajax({plug: _code, user_id: context.u.user_id}), "", function(xhr) {
		_disable(context._commit, false);
		if( xhr.status == 200 ) {
		    onsuccess();
		} else {
		    _showmsg(context._msg, lang.cancellations.msg3);
		}
		sp.stop();
	    });
	    _disable(context._commit, true);
	    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	    xhr.send(G.formParamsURI({user_id: context.u.user_id, b_date: G.getdate(context.b_date), e_date: G.getdate(context.e_date), 
		canceling_type_id: context.t ? context.t.canceling_type_id : null, note: context.note}));
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
	refresh: function(y, m) {
	    _cache.y = y; _cache.m = m;
	    _elem.month.text(G.getlongmonth_l(new Date(y, m - 1, 1)).toLowerCase());
	    _setdata(_elem.tbody, new Filter(_elem.f.val()));
	},
	add: function() {
	    if( _cache.data && _perm && _perm.add ) {
		_context = _createContext(_cache.data, _perm);
		_showbox(_context, _elem.box, _getbox(_context));
	    }
	},
	restore: function(row_no, route_date, user_id) {
	    _restore(_elem.tbody, row_no, user_id, route_date);
	},
	reject: function(row_no, route_date, user_id) {
	    _reject(_elem.tbody, row_no, user_id, route_date);
        },
	hidebox: function() {
	    _hidepopup(_context._popup);
	    _hidebox(_elem.box);
	},
	hidepopup: function() {
	    _hidepopup(_context != null ? _context._popup : null);
	},
	save: function() {
	    _save(_context, function() {
		    _hidepopup(_context._popup);
		    _hidebox(_elem.box);
		    _setdata(_elem.tbody, new Filter(_elem.f.val()));
		}
	    );
	},

	onrefresh: function() {
	    _setdata(_elem.tbody, new Filter(_elem.f.val()));
	    _cache.cal = null;
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
			return r.dev_login == r.user_id ? "" : ("<br/><span class='watermark'>" + lang.u_code + ": " + 
			    G.shielding(r.user_id, lang.dash) + "</span>");
		    })
		);
	    },
	    type: function() {
		_showpopup(_context._popup, _elem.box.find("#type"), _getsimplelist(_context._data.types, function(r) {
			return _context.t && r.canceling_type_id == _context.t.canceling_type_id;
		    }, "type", false)
		);
	    },
	    b_date: function() {
		_context._cal = new DailyCalendar("PLUG.N._refb_date", "PLUG.N._setb_date").
		    setperiod(_context._b_date, _context._e_date);
		_showpopup(_context._popup, _elem.box.find("#b_date"), _context._cal.build(_context.b_date));
	    },
	    e_date: function() {
		_context._cal = new DailyCalendar("PLUG.N._refe_date", "PLUG.N._sete_date").
		    setperiod(_context.b_date, _context._e_date);
		_showpopup(_context._popup, _elem.box.find("#e_date"), _context._cal.build(_context.e_date));
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
	    _settype: function(i) {
		_context.t = _context._data.types[i];
		_elem.box.find("#type").text(_context.t.descr);
		_disable(_context._commit, _checkContext(_context));
		_hidemsg(_context._msg);
	    },
	    _refb_date: function(month, year) {
		_context._popup.find(".body").html(_context._cal.refresh(month, year).join(''));
	    },
	    _setb_date: function(date) {
		_context.b_date = date instanceof Date ? date : Date.parseISO8601(date);
		_elem.box.find("#b_date").text(G.getlongdate_l(_context.b_date).toLowerCase());
		_disable(_context._commit, _checkContext(_context));
		_hidemsg(_context._msg);
	    },
	    _refe_date: function(month, year) {
		_context._popup.find(".body").html(_context._cal.refresh(month, year).join(''));
	    },
	    _sete_date: function(date) {
		_context.e_date = date instanceof Date ? date : Date.parseISO8601(date);
		_elem.box.find("#e_date").text(G.getlongdate_l(_context.e_date).toLowerCase());
		_disable(_context._commit, _checkContext(_context));
		_hidemsg(_context._msg);
	    },
	    _fuser: function(value) {
		_filterSL(value, _context._data.users, _context._popup);
	    }
	},

	calendar: {
	    onshow: function() {
		if( _elem.cal.is(":visible") ) {
		    _elem.cal.hide();
		} else {
		    var pos = _elem.month.position();
		    _elem.cal.css({top: pos.top + _elem.month.height(), left: pos.left + (_elem.month.width()-_elem.cal.width())/2});
		    _elem.cal.show();
		    _setcalendar(_elem.cal.find("#calbody"), _elem.cal.find("#calspin"));
		}
	    },
	    onhide: function() {
		if( _elem.cal.is(":visible") ) {
		    _elem.cal.hide();
		}
	    },
	    onselect: function(y, m) {
		PLUG.refresh(y, m);
		history.pushState({y: y, m: m}, "", G.getref({plug: _code, y: y, m: m}));
	    }
	}
    }
})();


function startup(tag, y, m, perm) {
    tag.html(PLUG.get(perm));
    PLUG.set({
	body: tag,
	tbody: tag.find("#maintb"),
	spin: tag.find("#plugspin"),
	cal: tag.find("#plugcal"),
	month: tag.find("#plugmonth"),
	f: tag.find("#plugfilter"),
	ts: tag.find("#timestamp"),
	box: tag.find("#plugbox")
    }, perm);
    PLUG.refresh(y, m);
}

window.onpopstate = function(event) {
    if( event.state != null ) {
	PLUG.refresh(event.state.y, event.state.m);
    } else {
	var d = new Date();
	PLUG.refresh(d.getYear() + 1900,d.getMonth() + 1);
    }
}
