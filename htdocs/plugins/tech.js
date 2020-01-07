/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "tech";
    var _tabs = [], _selected = {tab:0,ref:null}, _refs = {}, _cache = {}, _tags = {};

    function _getcolumns() {
	var a = 17;
	if( typeof __allowedColumns == 'object' ) {
	    if( __allowedColumns.area ) a++;
	    if( __allowedColumns.department ) a++;
	    if( __allowedColumns.distributor ) a++;
	}
	return a;
    }

    function _getbody() {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.tech.title1, "</span>&nbsp;");
	ar.push("<a id='plugCal' href='javascript:void(0);' onclick='PLUG.calendar(this)'>[&nbsp;-&nbsp;]</a>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)");
	ar.push("<span id='usersGroup'>");
	ar.push("<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.everyone(this)'>", lang.tech.active_devices, "</a>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</span>");
	ar.push("<span id='detsGroup'>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<span id='plugUN'></span>:");
	_tabs.forEach(function(arg, idx) {
	    ar.push(idx == 0 ? "&nbsp&nbsp;" : "&nbsp&nbsp;|&nbsp;&nbsp;");
	    ar.push("<a href='javascript:void(0)' onclick='PLUG.tab(this,", idx,")'", idx == _selected.tab ? " class='selected'" : "", 
		">", arg.getcaption(), "</a>");
	});
	ar.push("<span id='refContainer'>&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.ref(this)'></a></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.back(this)'>", lang.u_everyone, "</a>");
	ar.push("</span>");
	ar.push("</td></tr></table>");
	ar.push("<div id='plugBody'></div>");
	ar.push(DaysPopup.container());
	ar.push(Popup.container());
	ar.push(Dialog.container());
	ar.push(Slideshow.container());
	ar.push(SlideshowSimple.container());
	return ar;
    }

    function _gettable() {
	var ar = [];
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th rowspan='2' class='autoincrement'>", lang.num, "</th>");
	ar.push("<th rowspan='2'>", lang.u_name, "</th>");
	ar.push("<th rowspan='2'>", lang.u_code, "</th>");
	ar.push("<th colspan='3'>", lang.workday, "</th>");
	ar.push("<th colspan='2'>", lang.tech.exchange.sync, "</th>");
	ar.push("<th colspan='2'>", lang.tech.exchange.docs, "</th>");
	ar.push("<th colspan='2'>", lang.tech.acts.title, "</th>");
	ar.push("<th colspan='2'>", lang.tech.docs.title, "</th>");
	if( typeof __allowedColumns == 'object' && __allowedColumns.area ) {
	    ar.push("<th rowspan='2'>", lang.area, "</th>");
	}
	if( typeof __allowedColumns == 'object' && __allowedColumns.department ) {
	    ar.push("<th rowspan='2' width='50px'>", lang.departmentAbbr, "</th>");
	}
	if( typeof __allowedColumns == 'object' && __allowedColumns.distributor ) {
	    ar.push("<th rowspan='2'>", lang.distributor, "</th>");
	}
	ar.push("<th rowspan='2' width='60px'>", lang.mileage, "</th>");
	ar.push("<th rowspan='2' width='50px'>", lang.tech.pause, "</th>");
	ar.push("<th rowspan='2'>", lang.dev_login, "</th>");
	ar.push("</tr><tr>");
	ar.push("<th>", lang.b_date, "</th>");
	ar.push("<th>", lang.e_date, "</th>");
	ar.push("<th>", lang.duration, "</th>");
	ar.push("<th Xwidth='40px'>", lang.tech.total, "</th>");
	ar.push("<th>", lang.tech.time, "</th>");
	ar.push("<th Xwidth='40px'>", lang.tech.total, "</th>");
	ar.push("<th>", lang.tech.time, "</th>");
	ar.push("<th Xwidth='40px'>", lang.tech.total, "</th>");
	ar.push("<th>", lang.tech.time, "</th>");
	ar.push("<th Xwidth='40px'>", lang.tech.total, "</th>");
	ar.push("<th>", lang.tech.time, "</th>");
	ar.push("</tr>", G.thnums(_getcolumns()), "</thead><tbody id='maintb'></tbody></table>");
	return ar;
    }

    function _getfilter() {
	var a = [];
	if( _cache.xfilters != null ) {
	    for( var name in _cache.xfilters ) {
		a.push(_cache.xfilters[name]);
	    }
	}
	a.push(_tags.f.val());
	return Filter(a.join(' '), false, {user_id:true, dev_login:true, u_name:true, pid:true, area:true, deps:true, distrs:true, pause:true});
    }

    function _datamsg(msg) {
	return ["<tr class='def'><td colspan='", _getcolumns(), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, total, date, f, checked) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, k, t, xs;
	var rx = new RegExp("['\"]", "g");
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		xs = r.indirect ? ' disabled' : '';
		k = "{0}${1}".format_a(G.getdate(_cache.date), r.row_id);
		ar.push("<tr class='clickable", (typeof checked != 'undefined' && checked[k]) ? " selected" : "", 
		    "' onclick='PLUG.more(\"", r.user_id, "\",\"", r.u_name, "\",\"", G.getdate(date), "\")'>");
		ar.push("<td class='autoincrement", xs,"' onclick='PLUG.checkrow(this.parentNode,\"", k, "\");event.stopPropagation();'>", 
		    r.row_no, "</td>");
		ar.push("<td class='string", xs,"'>", G.shielding(r.u_name), "</td>");
		t = G.shielding(r.code).replace(rx,' ');
		if( r.code.length > 15 ) {
		    ar.push("<td class='copyable int footnote{1}' data-title='{0}' onclick='PLUG.copy(\"{0}\");event.stopPropagation();'>".format_a(t, xs), 
			G.shielding(r.code).mtrunc(15), "</td>");
		} else {
		    ar.push("<td class='copyable int{1}' onclick='PLUG.copy(\"{0}\");event.stopPropagation();'>".format_a(t, xs), 
			G.shielding(r.code), "</td>");
		}
		ar.push("<td class='time", xs,"'>", G.shielding(r.wd_begin), "</td>");
		ar.push("<td class='time", xs,"'>", G.shielding(r.wd_end), "</td>");
		ar.push("<td class='time", xs,"'>", G.shielding(r.wd_duration), "</td>");
		ar.push("<td class='int", xs,"'>", G.getint_l(r.exch_sync_success_total), "</td>");
		ar.push("<td class='time", xs,"'>", G.shielding(r.exch_sync_success_time), "</td>");
		ar.push("<td class='int", xs,"'>", G.getint_l(r.exch_docs_success_total), "</td>");
		ar.push("<td class='time", xs,"'>", G.shielding(r.exch_docs_success_time), "</td>");
		ar.push("<td class='int", xs,"'>", G.getint_l(r.acts_total), "</td>");
		ar.push("<td class='time", xs,"'>", G.shielding(r.acts_time), "</td>");
		ar.push("<td class='int", xs,"'>", G.getint_l(r.docs_total), "</td>");
		ar.push("<td class='time", xs,"'>", G.shielding(r.docs_time), "</td>");
		if( typeof __allowedColumns == 'object' && __allowedColumns.area ) {
		    ar.push("<td class='ref", xs,"'>", G.shielding(r.area), "</td>");
		}
		if( typeof __allowedColumns == 'object' && __allowedColumns.department ) {
		    t = G.shielding(r.deps).replace(rx,' ');
		    if( !String.isEmpty(r.deps) && r.deps.length > 5 ) {
			ar.push("<td class='ref footnote{1}' data-title='{0}'>".format_a(t, xs), G.shielding(r.deps).trunc(5), "</td>");
		    } else {
			ar.push("<td class='ref", xs,"'>", G.shielding(r.deps), "</td>");
		    }
		}
		if( typeof __allowedColumns == 'object' && __allowedColumns.distributor ) {
		    t = G.shielding(r.distrs).replace(rx,' ');
		    if( !String.isEmpty(r.distrs) && r.distrs.length > 14 ) {
			ar.push("<td class='ref footnote{1}' data-title='{0}'>".format_a(t, xs), G.shielding(r.distrs).trunc(14), "</td>");
		    } else {
			ar.push("<td class='ref", xs,"'>", G.shielding(r.distrs), "</td>");
		    }
		}
		ar.push("<td class='int", xs,"'>", (r.dist != null && r.dist/1000 > 0 ? parseFloat(r.dist/1000.0).toFixed(1) : lang.dash), "</td>");
		ar.push("<td class='int", xs,"'>", (r.pause == null ? lang.dash : r.pause), "</td>");
		ar.push("<td class='int", xs,"'>", G.shielding(r.dev_login), "</td>");
		ar.push("</tr>");
		x++;
	    }
	}
	if( x > 0 ) {
	    total.html((x != size ? "&nbsp;&nbsp;({0}/{1})" : "&nbsp;&nbsp;({1})").format_a(x, size));
	} else {
	    total.html("");
	}
	if( ar.length == 0 ) {
	    ar = _datamsg(lang.empty);
	}
	if( typeof data.data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", _getcolumns(),"' class='watermark'>", lang.data_ts, "&nbsp;", data.data_ts, "</td></tr>");
	}
	return ar;
    }

    function _setdata() {
	if( _cache.data != null ) { // sets data from the internal cache
	    _tags.tbody.html(_datatbl(_cache.data, _tags.total, _cache.date, _getfilter(), _cache.checked).join(""));
	} else {
	    ProgressDialog.show();
	    _cache.data = null; // drops the internal cache
	    G.xhr("GET", G.getajax({plug: _code, code: "tech", date: G.getdate(_cache.date)}), "json", function(xhr, data) {
		if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		    _cache.data = data;
		    _tags.tbody.html(_datatbl(data, _tags.total, _cache.date, _getfilter(), _cache.checked).join(""));
		} else {
		    _tags.tbody.html(_datamsg(lang.failure).join(""));
		    _tags.total.html("");
		}
		ProgressDialog.hide();
		_setts();
	    }).send();
	}
    }

    function _filterdata() {
	if( _cache.data != null ) {
	    ProgressDialog.show();
	    setTimeout(function() {
		_tags.tbody.html(_datatbl(_cache.data, _tags.total, _cache.date, _getfilter(), _cache.checked).join(""));
		ProgressDialog.hide();
	    }, 0);
	}
    }

    function _settext(tag, str, max) {
	var a = G.shielding(str);
	if( max == null || typeof max == 'undefined' || max <= 0 ) {
	    tag.html(a);
	} else {
	    tag.html(a.trunc(max));
	    if( a.length > max ) {
		tag.setAttribute("data-title", a);
		tag.addClass('footnote_L');
	    } else {
		tag.removeAttribute("data-title");
		tag.removeClass('footnote_L');
	    }
	}
    }

    function _setts() {
	_tags.ts.html(G.getdatetime_l(new Date()));
    }

    function _setuname(u_name) {
	_settext(_tags.u, u_name, 18);
    }

    function _setcaldate(date) {
	_cache.date = date instanceof Date ? date : Date.parseISO8601(date);
	_tags.cal.html(G.getlongdate_l(_cache.date).toLowerCase());
    }

    function _dropcache() {
	_cache.data = null;
	_tabs.forEach(function(arg) { if( arg != null ) { arg.dropcache(); } });
	for( var key in _refs ) { _refs[key].dropcache(); }
    }

    function _setdet(refreshOnly) {
	var x;
	if(  _selected.tab >= 0 ) {
	    x = _tabs[_selected.tab];
	} else if( _selected.ref != null ) {
	    x = _selected.ref;
	} else {
	    return;
	}
	if( !(refreshOnly == true) ) {
	    _tags.body.html(x.getbody());
	}
	x.setdata(_tags.body, _cache.uid, _cache.date, _setts);
    }

    function _setdataordet() {
	if( _cache.uid != null ) {
	    _setdet(true);
	} else {
	    _setdata();
	}
    }

    function _hidePopups() {
	for( var name in _tags.popups) {
	    _tags.popups[name].hide();
	}
    }

    function _togglePopup(popup, tag, offset, oncreate) {
	var x;
	for( var name in _tags.popups) {
	    if( typeof popup != 'undefined' && name == popup ) {
		x = _tags.popups[name];
	    } else {
		_tags.popups[name].hide();
	    }
	}
	if( typeof popup != 'undefined' && x == null ) {
	    x = _tags.popups[popup] = oncreate(popup);
	}
	if( x != null ) {
	    x.toggle(tag, offset);
	}
    }

    function _unselectTabs() {
	var ar = _tags.groups.dets.getElementsByClassName('selected');
	for( var i = 0, size = ar == null ? 0 : ar.length; i < size; i++ ) {
	    ar[i].removeClass("selected");
	}
    }


    /* public properties & methods */
    return {
	registerTab: function(ptr) {
	    _tabs.push(ptr);
	},
	registerRef: function(name, ptr) {
	    _refs[name] = ptr;
	},
	containsRef: function(name) {
	    return _refs[name] != null;
	},
	getRef: function(name) {
	    return _refs[name];
	},

	startup: function(tag, u_id, u_name, date) {
	    tag.html(_getbody().join(""));
	    _tags.body = _("plugBody");
	    _tags.cal = _("plugCal");
	    _tags.ts = _("timestamp");
	    _tags.total = _("plugTotal");
	    _tags.f = _("plugFilter");
	    _tags.u = _("plugUN");
	    _tags.groups = {u: _("usersGroup"), dets: _("detsGroup")};
	    _tags.ref = _("refContainer");
	    _tags.popups = {};
	    _tags.popups["$"] = new Popup();
	    _setcaldate(date);
	    if( u_id == null ) {
		_cache.uid = null;
		_tags.groups.u.show();
		_tags.groups.dets.hide();
		_tags.body.html(_gettable().join(""));
		_tags.tbody = _("maintb");
		_setdata();
	    } else {
		_tags.f.value = u_id;
		_cache.uid = u_id;
		_tags.groups.u.hide();
		_tags.groups.dets.show();
		_setuname(u_name);
		_setdet();
	    }
	    _tags.ref.hide();
	},
	refresh: function() {
	    _hidePopups();
	    _dropcache();
	    _setdataordet();
	    if( typeof _tags.popups.cal != 'undefined' ) {
		_tags.popups.cal.dropCache();
	    }
	},
	navigate: function(date) {
	    _hidePopups();
	    _setcaldate(date);
	    _dropcache();
	    _setdataordet();
	},
	more: function(u_id, u_name, date) {
	    _hidePopups();
	    _tags.tbody = null;
	    _cache.uid = u_id;
	    _tags.groups.u.hide();
	    _tags.groups.dets.show();
	    _setuname(u_name);
	    _setdet();
	    window.scrollTo(0, 0);
	},
	back: function() {
	    _hidePopups();
	    _cache.uid = null;
	    _tags.groups.u.show();
	    _tags.groups.dets.hide();
	    _tags.body.html(_gettable().join(""));
	    _tags.tbody = _("maintb");
	    _setdata();
	},
	tab: function(tag, tabno) {
	    _hidePopups();
	    if( _selected.tab != tabno ) {
		_unselectTabs();
		tag.addClass("selected");
		_selected.tab = tabno;
		_setdet();
	    }
	},
	ref: function(tag) {
	    _hidePopups();
	    if( _selected.ref != null ) {
		_unselectTabs();
		tag.addClass("selected");
		_selected.tab = -1;
		_setdet();
	    }
	},
	selectRef: function(name) {
	    var ptr = _refs[name], a = _tags.ref.getElementsByTagName("a")[0];
	    if( ptr != null ) {
		_selected.ref = ptr;
		_settext(a, ptr.getcaption(), 15);
		PLUG.ref(a);
		_tags.ref.show();
	    }
	},
	filter: function(tag, ev) {
	    return Filter.onkeyup(tag, ev, function() {
		_filterdata()
	    });
	},
	everyone: function(tag) {
	    _hidePopups();
	    if( _cache.xfilters == null ) {
		_cache.xfilters = {};
	    }
	    if( tag.hasClass("important") ) {
		_cache.xfilters["pause"] = null;
		tag.removeClass('important');
	    } else {
		_cache.xfilters["pause"] = "pause=(0|1|2|3|4|5|6|7)$";
		tag.addClass('important');
	    }
	    _filterdata();
	},
	checkrow: function(tag, row_id) {
	    G.checkrow(tag, function(arg) {
		if( typeof _cache.checked == 'undefined' ) {
		    _cache.checked = {};
		}
		_cache.checked[row_id] = arg;
	    });
	},
	calendar: function(tag) {
	    _togglePopup("cal", tag, undefined, function(obj) {
		return DaysPopup(function(date) {
		    _setcaldate(date);
		    _dropcache();
		    _setdataordet();
		    history.replaceState({date: _cache.date}, "", G.getref({plug: _code, date: G.getdate(_cache.date)}));
		}, {date: _cache.date, uri: G.getajax({plug: _code, calendar: true})})
	    });
	},
	copy: function(text) {
	    navigator.clipboard.writeText(text);
	    Toast.show(lang.notices.clipboard);
	    console.log(text);
	},
	slideshow: function(blobs, position) {
	    var ar = [];
	    blobs.forEach(function(arg) { ar.push(G.getajax({plug: "tech", blob: "yes", blob_id: arg})); });
	    SlideshowSimple(ar, {idx: position}).show();
	}
    }
})();


function startup(u_id, u_name, date) {
    PLUG.startup(_('pluginContainer'), u_id, u_name, date);
}

function register(t, istab) {
    PLUG.register(t, istab);
}

window.onpopstate = function(event) {
    PLUG.navigate(event.state != null ? event.state.date : new Date());
}
