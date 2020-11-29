/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "routes";
    var _mark = "&bull;";
    var _cache = {}, _perm = {}, _tags = {};

    function _getcolumns(perm) {
	return 15 + perm.weeks;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.routes.title1, "</span>&nbsp;");
	ar.push("<a id='plugCycle' href='javascript:void(0);' onclick='PLUG.cycles(this)'>[&nbsp;-&nbsp;]</a>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	ar.push("<span id='usersFilter'>&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.users(this, 0.8)'>", lang.u_everyone, "</a></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.accounts(this)' class='important'>", lang.routes.route, "</a>");
	if( typeof ymaps != 'undefined' || (typeof google != 'undefined' && typeof google.maps != 'undefined') ) {
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.toggle(this)'>", lang.routes.map, "</a>");
	}
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table id='plugTable' width='100%' class='report'><thead><tr>");
	ar.push("<th rowspan='2' class='autoincrement'>", lang.num, "</th>");
	ar.push("<th rowspan='2'>", lang.a_code, "</th>");
	ar.push("<th rowspan='2'>", lang.a_name, "</th>");
	ar.push("<th width='380px' rowspan='2'>", lang.address, "</th>");
	ar.push("<th colspan='" + perm.weeks + "'>", lang.routes.weeks, "</th>");
	ar.push("<th colspan='7'>", lang.routes.days, "</th>");
	ar.push("<th rowspan='2'>", lang.intotal, "</th>");
	ar.push("<th rowspan='2'>", lang.chan_name, "</th>");
	ar.push("<th rowspan='2'>", lang.poten, "</th>");
	ar.push("<th width='95px' rowspan='2'>", lang.taskboard, "</th>");
	ar.push("</tr><tr>");
	for( var i = 1; i <= perm.weeks; i++ ) {
	    ar.push("<th width='20px'>", i,"</th>");
	}
	for( var i = 0, a = lang.calendar.firstDay; i < 7; i++, a++ ) {
	    ar.push("<th width='20px'>", lang.calendar.days.namesAbbr[a==7?0:a], "</th>");
	}
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead><tbody id='maintb'></tbody></table>");
	ar.push("<div id='plugMap' class='map'></div>");
	ar.push(CyclesPopup.container());
	ar.push(UsersPopup.container());
	ar.push(Dialog.container());
	return ar;
    }

    function _shielding(data, r) {
	if( r._code != 'route' ) {
	    r.cycle_id = data.cycle_id;
	}
	return r;
    }

    function _compilerows(routes, accounts, user_id) {
	var ar = [], idx = {}, i = 1;
	if( Array.isArray(routes) && Array.isArray(accounts) ) {
	    routes.forEach(function(r) {
		if( user_id == null || r.user_id == user_id ) {
		    idx[r.account_id] = true;
		}
	    });
	}
	if( Array.isArray(accounts) ) {
	    accounts.forEach(function(r) {
		if( !(idx[r.account_id] == true) ) {
		    r._code = "account";
		    r.user_id = user_id;
		    r._row_no = i;
		    ar.push(r);
		    i++;
		}
	    });
	}
	if( Array.isArray(routes) ) {
	    routes.forEach(function(r) {
		r._code = "route";
		r._row_no = i;
		ar.push(r);
		i++;
	    });
	}
	return ar;
    }

    function _getfilter() {
	var a = [];
	if( typeof _cache.userFilter == 'string' ) {
	    a.push("user_id={0}$ ".format_a(_cache.userFilter));
	}
	a.push(_tags.f.val());
	return Filter(a.join(' '), false, {
	    user_id:true,
	    dev_login:true,
	    u_name:true,
	    account_id:true,
	    a_code:true,
	    a_name:true,
	    address:true,
	    chan:true,
	    poten:true,
	    retail_chain:true,
	    ka_code:true,
	    region:true,
	    city:true
	});
    }

    function _a(r, def) {
	var days = 0, weeks = 0, rv;
	if( r.days ) {
	    r.days.forEach(function(arg, i, ar) {
		if( arg ) days++;
	    });
	}
	if( r.weeks ) {
	    r.weeks.forEach(function(arg, i, ar) {
		if( arg ) weeks++;
	    });
	}
	return (rv = days*weeks) ? rv : (typeof def == 'undefined' ? lang.dash : def);
    }

    function _getlalo(r) {
	return (r.latitude == null || r.longitude == null || (r.latitude === 0 && r.longitude === 0)) ?
	    null : [r.latitude, r.longitude];
    }

    function _getcenter(rows, user_id) {
	for( var i = 0, size = Array.isArray(rows) ? rows.length : 0, x, r; i < size; i++ ) {
	    r = rows[i];
	    if( (user_id == null || r.user_id == user_id) && (x = _getlalo(rows[i])) != null ) {
		return x;
	    }
	}
	return null;
    }

    function _getimage(name) {
	return G.getstaticref('drawable/' + name + '.png');
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='" + _getcolumns(perm) + "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], x = 0, z;
	for( var i = 0, k = 0, r = null, size = Array.isArray(data.rows) ? data.rows.length : 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    var style = (r.hidden || r.locked ? " strikethrough attention" : "");
		    style += (r._code == 'route' ? "" : " disabled");
		    ar.push("<tr", (typeof checked != 'undefined' && checked[r.row_id] ? " class='selected'" : ""), ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" + 
			r.row_id + "');event.stopPropagation();\">", r._row_no, "</td>");
		    ar.push("<td class='int'><a href='javascript:void(0);' onclick='PLUG.more(this, " + i + ")'>", 
			r.a_code, "</a></td>");
		    ar.push("<td class='string" + style + "'>", G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string delim2" + style + "'>", G.shielding(r.address), "</td>");
		    for( var a = 1; a <= perm.weeks; a++ ) {
			ar.push("<td class='bool" + (data.closed || r.hidden || a > data.weeks ? "" : " clickable") + 
			    (a == perm.weeks ? " delim2" : "") + "'" + (data.closed || r.hidden || a > data.weeks ? "" : 
			    " onclick='PLUG.setdrop(this,\"week\"," + i + "," + a + ")'") + ">", 
			    (r.weeks && r.weeks[a-1] ? _mark : ""), "</td>");
		    }
		    for( var a = 1, b; a <= 7; a++ ) {
			ar.push("<td class='bool footnote" + (data.closed || r.hidden ? "" : " clickable") + (a == 7 ? " delim2" : "") + 
			    "'" + (data.closed || r.hidden ? "" : " onclick='PLUG.setdrop(this,\"day\"," + i + "," + a + ")'") + 
			    " data-title='" + lang.calendar.days.names[a==7?0:a] + "'>", 
			    (r.days && r.days[a-1] ? _mark : ""), "</td>");
		    }
		    ar.push("<td class='int delim2' id='X-" + r._row_no + "'>", _a(r), "</td>");
		    ar.push("<td class='ref'>", G.shielding(r.chan), "</td>");
		    ar.push("<td class='ref'>", G.shielding(r.poten), "</td>");
		    if( !data.closed && r._code == 'route' ) {
			ar.push("<td class='ref'><a href='javascript:void(0);' onclick='PLUG.remove(this, " + i + ")'>",
			    (r._deleted ? lang.restore : lang.remove.ref), "</a></td>");
		    } else if( !data.closed && r._code == 'account' ) {
			ar.push("<td class='ref'><a href='javascript:void(0);' onclick='PLUG.add(this, " + i + ")'>",
			    lang.add, "</a></td>");
		    } else {
			ar.push("<td class='ref'>&nbsp;</td>");
		    }
		    ar.push("</tr>");
		    k++;
		}
		x++;
	    }
	}
	if( x > 0 ) {
	    total.html("&nbsp;(" + x + ")");
	}
	if( ar.length == 0 ) {
	    ar = _datamsg(lang.empty, perm);
	}
	if( (z = Math.floor(x/perm.rows) + ((x%perm.rows)?1:0)) > 1 /*pages: */ ) {
	    ar.push("<tr class='def'><td colspan='", _getcolumns(perm), "' class='navbar'>");
	    if( page > 1 ) {
		ar.push("&nbsp;<a href='javascript:PLUG.page(1)'>|&lt;</a>&nbsp;");
		ar.push("&nbsp;<a href='javascript:PLUG.page(", page-1, ")'>&lt;</a>&nbsp;");
	    }
	    if( page == 1 ) {
		ar.push("&nbsp;", page, "&nbsp;");
		ar.push("&nbsp;<a href='javascript:PLUG.page(", page+1, ")'>", page+1, "</a>");
		if( (page+2) <= z ) {
		    ar.push("&nbsp;&nbsp;<a href='javascript:PLUG.page(", page+2, ")'>", page+2, "</a>");
		}
	    } else if( page == z ) {
		if( (page-2) >= 1 ) {
		    ar.push("&nbsp;<a href='javascript:PLUG.page(", page-2, ")'>", page-2, "</a>&nbsp;");
		}
		ar.push("&nbsp;<a href='javascript:PLUG.page(", page-1, ")'>", page-1, "</a>&nbsp;");
		ar.push("&nbsp;", page);
	    } else {
		ar.push("&nbsp;<a href='javascript:PLUG.page(", page-1, ")'>", page-1, "</a>&nbsp;");
		ar.push("&nbsp;",page);
		if( (page+1) <= z ) {
		    ar.push("&nbsp;&nbsp;<a href='javascript:PLUG.page(", page+1, ")'>", page+1, "</a>");
		}
	    }
	    if( page < z ) {
		ar.push("&nbsp;&nbsp;<a href='javascript:PLUG.page(", page+1, ")'>&gt;</a>&nbsp;");
		ar.push("&nbsp;<a href='javascript:PLUG.page(", z, ")'>&gt;|</a>");
	    }
	    ar.push("</td></tr>");
	}

	return ar;
    }

    function _datareq(cycle_id) {
	var uri = {plug: _code};
	if( cycle_id != null ) {
	    uri.cycle_id = cycle_id;
	}
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getajax(uri), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		data.rows = _cache.expanded ? _compilerows(data.routes, data.accounts,
		    (Array.isArray(data.users) && data.users.length == 1) ? data.users[0].user_id : _cache.userFilter) 
		    : _compilerows(data.routes);
		_cache.data = data;
		//console.log(data);
		_tags.tbody.html(_datatbl(data, 1, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
		_tags.cycle.html(lang.routes.cycle.format_a(data.cycle_no, data.year));
		(Array.isArray(data.users) && data.users.length > 1) ? _tags.users.show() : _tags.users.hide();
		_cleanupmap();
		if( !_tags.map.isHidden() ) {
		    _compilemap();
		}
	    } else {
		_tags.tbody.html(_datamsg(lang.failure, _perm).join(""));
		_tags.cycle.html("[&nbsp;-&nbsp;]");
	    }
	    _tags.ts.html(G.getdatetime_l(new Date()));
	    ProgressDialog.hide();
	}).send();
    }

    function _page(page) {
	if( _cache.data != null ) {
	    ProgressDialog.show();
	    setTimeout(function() {
		_tags.tbody.html(_datatbl(_cache.data, page, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
		ProgressDialog.hide();
	    }, 0);
	}
    }

    function _datamap(data, f) {
	var a = new ymaps.GeoObjectCollection(), r, l;
	for( var i = 0, size = Array.isArray(data.rows) ? data.rows.length : 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) && (l = _getlalo(r)) != null ) {
		a.add(new ymaps.Placemark(l, 
		    { hintContent: "<b>{0}:&nbsp;{1}</b>&nbsp;{2}".format_a(r.a_code, G.shielding(r.a_name), G.shielding(r.address)), 
		    balloonContent: _detailsbody(data.b_date, r).join('') }, 
		    { iconLayout: 'default#image', iconImageHref: _getimage(r._code == 'route' ? 
			(_a(r,0) > 0 ? 'point-green' : 'point-gray') : 'point-white'), 
		    iconImageSize: [14, 14], iconImageOffset: [-7, -7] }
		));
	    }
	}
	return a;
    }

    function _cleanupmap() {
	if( _cache.map != null ) {
	    _cache.map.geoObjects.removeAll();
	    _cache.reloadingMap = true;
	}
    }

    function _compilemap(center) {
	if( _cache.map != null ) {
	    if( Array.isArray(center) ) {
		_cache.map.panTo(center);
	    }
	    _cache.map.geoObjects.add(_datamap(_cache.data, _getfilter()));
	    _cache.reloadingMap = null;
	}
    }

    function _setdrop(row, name, arg, onsuccess) {
	var x = row["{0}s".format_a(name)];
	var f = Array.isArray(x) && x[arg-1];
	if( typeof row.user_id == 'undefined' ) {
	    Toast.show(lang.routes.msg0);
	} else if( row._deleted == 1 ) {
	    Toast.show(lang.routes.msg1);
	} else if( row._code != 'route' ) {
	    Toast.show(lang.routes.msg2);
	} else if( (row.hidden || row.locked) && !f ) {
	    Toast.show(lang.routes.msg3);
	} else {
	    ProgressDialog.show();
	    G.xhr("PUT", G.getajax({
		    plug: _code, 
		    _datetime: G.getdatetime(new Date()), 
		    cmd: f ? ("drop/"+name) : ("set/"+name), 
		    user_id: row.user_id, 
		    cycle_id: row.cycle_id, 
		    account_id: row.account_id, 
		    arg: arg
		}), "json", function(xhr, data) {
		if( xhr.status == 200 && data.status == 'success' ) {
		    onsuccess(row);
		} else {
		    Toast.show(data.status == 'request_denied' ? lang.routes[name=="week"?'msg5':'msg4'] : lang.errors.runtime);
		}
		ProgressDialog.hide();
	    }).send();
	}
    }

    function _remove(row, onsuccess) {
	ProgressDialog.show();
	G.xhr("DELETE", G.getajax({
		plug: _code, 
		_datetime: G.getdatetime(new Date()), 
		cmd: row._deleted ? "restore" : "remove", 
		user_id: row.user_id, 
		cycle_id: row.cycle_id, 
		account_id: row.account_id
	    }), "", function(xhr) {
	    if( xhr.status == 200 ) {
		onsuccess(row);
	    } else {
		Toast.show(lang.errors.runtime);
	    }
	    ProgressDialog.hide();
	}).send();
    }

    function _add(row, onsuccess) {
	if( typeof row.user_id == 'undefined' || row.user_id == null ) {
	    Toast.show(lang.routes.msg0);
	    return;
	}
	ProgressDialog.show();
	G.xhr("POST", G.getajax({
		plug: _code, 
		_datetime: G.getdatetime(new Date()), 
		cmd: "add", 
		user_id: row.user_id, 
		cycle_id: row.cycle_id, 
		account_id: row.account_id
	    }), "json", function(xhr, data) {
	    if( xhr.status == 200 && typeof data.row_id != 'undefined' ) {
		data._code = 'route';
		data._row_no = row._row_no;
		onsuccess(data);
	    } else {
		Toast.show(lang.errors.runtime);
	    }
	    ProgressDialog.hide();
	}).send();
    }

    function _detailsbody(b, r) {
	var ar = [], offset = 86400000, x = 1;
	var t = (typeof b == 'date' ? b : Date.parseISO8601(b)).getTime();
	ar.push("<div>", "<b>{0}: {1}</b>".format_a(r.a_code, G.shielding(r.a_name)), "</div>");
	ar.push("<div>", G.shielding(r.address), "</div>");
	if( !String.isEmpty(r.chan) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.chan_name, G.shielding(r.chan)), "</div>");
	}
	if( !String.isEmpty(r.poten) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.poten, G.shielding(r.poten)), "</div>");
	}
	if( !String.isEmpty(r.u_name) ) {
	    ar.push("<div>", "<i>{0}: {1}</i>".format_a(G.shielding(r.dev_login, lang.dash), r.u_name), "</div>");
	}
	if( Array.isArray(r.weeks) && Array.isArray(r.days) ) {
	    ar.push("<br/>");
	    ar.push("<table width='100%' class='report'>");
	    ar.push("<thead><tr><th class='autoincrement'>", lang.num, "</th><th>", lang.route, "</th></tr></thead><tbody>");
	    r.weeks.forEach(function(arg0, week) {
		if( arg0 ) {
		    r.days.forEach(function(arg1, day) {
			if( arg1 ) {
			    ar.push("<tr><td class='autoincrement'>", x, "</td><td class='ref'>",
				G.getlongdate_l(new Date(t + offset*day + offset*7*week)), "</td></tr>");
			    x++;
			}
		    });
		}
	    });
	    if( x == 1 ) {
		ar.push("<tr class='def'><td colspan='2' class='ref'>", lang.none, "</td></tr>");
	    }
	    ar.push("</tbody></table>");
	}
	ar.push("<br/>");
	if( !String.isEmpty(r.author) ) {
	    ar.push("<div class='watermark'>", "{0}:&nbsp;{1}. {2}&nbsp;{3}".format_a(
		lang.author, r.author, lang.data_ts, r.updated_ts), "</div>");
	}
	return ar;
    }


/* public properties & methods */
    return {
	startup: function(tags, cycle_id, perm) {
	    _perm = perm;
	    _perm.weeks = perm.weeks == null || perm.weeks <= 0 ? 4 : perm.weeks;
	    _perm.rows = perm.rows == null || perm.rows <= 0 ? 100 : perm.rows;
	    _tags = tags;
	    _tags.body.html(_getbody(perm).join(""));
	    _tags.tbody = _("maintb");
	    _tags.cycle = _("plugCycle");
	    _tags.f = _("plugFilter");
	    _tags.users = _("usersFilter");
	    _tags.ts = _("timestamp");
	    _tags.total = _("plugTotal");
	    _tags.map = _("plugMap");
	    _tags.tbl = _("plugTable");
	    _datareq(cycle_id);
	},
	refresh: function() {
	    if( _cache.cyclesPopup != null ) {
		_cache.cyclesPopup.hide();
	    }
	    if( _cache.usersPopup != null ) {
		_cache.usersPopup.hide();
	    }
	    _datareq(_cache.data == null ? null : _cache.data.cycle_id);
	    _cache.cyclesPopup = null;
	    _cache.usersPopup = null;
	},
	filter: function(tag, ev) {
	    return Filter.onkeyup(tag, ev, function() {
		_page(1);
		_cleanupmap();
		if( !_tags.map.isHidden() ) _compilemap();
	    });
	},
	page: function(arg) {
	    _page(arg);
	    window.scrollTo(0, 0);
	},
	checkrow: function(tag, row_id) {
	    G.checkrow(tag, function(arg) {
		if( typeof _cache.checked == 'undefined' ) {
		    _cache.checked = {};
		}
		_cache.checked[row_id] = arg;
	    });
	},
	cycles: function(tag) {
	    if( _cache.usersPopup != null ) {
		_cache.usersPopup.hide();
	    }
	    if( _cache.cyclesPopup == null ) {
		_cache.cyclesPopup = CyclesPopup(function(cycle_id) {
		    _datareq(cycle_id);
		    history.pushState({cycle_id: cycle_id}, "", G.getref({plug: _code, cycle_id: cycle_id}));
		}, {cycle_id: _cache.data.cycle_id, uri: G.getajax({plug: _code, cycles: true})});
	    }
	    _cache.cyclesPopup.toggle(tag);
	},
	users: function(tag, offset) {
	    if( _cache.cyclesPopup != null ) {
		_cache.cyclesPopup.hide();
	    }
	    if( _cache.usersPopup == null ) {
		_cache.usersPopup = UsersPopup(_cache.data.users, function(arg, i, ar) {
		    _cache.userFilter = typeof arg == 'object' ? arg.user_id : null;
		    _cache.data.rows = _cache.expanded ? 
			_compilerows(_cache.data.routes, _cache.data.accounts, _cache.userFilter) : 
			_compilerows(_cache.data.routes);
		    tag.html(_cache.userFilter == null ? lang.u_everyone : G.shielding(arg.descr));
		    _cache.userFilter == null ? tag.removeClass('important') : tag.addClass('important');
		    _page(1);
		    _cleanupmap();
		    if( !_tags.map.isHidden() ) _compilemap(_getcenter(_cache.data.routes, _cache.userFilter));
		});
	    }
	    _cache.usersPopup.toggle(tag, offset);
	},
	accounts: function(tag) {
	    if( _cache.cyclesPopup != null ) {
		_cache.cyclesPopup.hide();
	    }
	    if( _cache.usersPopup != null ) {
		_cache.usersPopup.hide();
	    }
	    if( _cache.expanded ) {
		_cache.data.rows = _compilerows(_cache.data.routes);
		_cache.expanded = null;
		tag.addClass('important');
	    } else {
		_cache.data.rows = _compilerows(_cache.data.routes, _cache.data.accounts, _cache.userFilter);
		_cache.expanded = true;
		tag.removeClass('important')
	    }
	    _page(1);
	    _cleanupmap();
	    if( !_tags.map.isHidden() ) _compilemap();
	},
	toggle: function(tag) {
	    if( _cache.cyclesPopup != null ) {
		_cache.cyclesPopup.hide();
	    }
	    if( _cache.usersPopup != null ) {
		_cache.usersPopup.hide();
	    }
	    if( tag.hasAttribute("X-map") ) {
		_tags.map.hide();
		_tags.tbl.show();
		tag.removeClass('important')
		tag.removeAttribute("X-map");
	    } else {
		var opt = {zoom: 2, controls:['typeSelector', 'searchControl', 'fullscreenControl', 'zoomControl']};
		if( (opt.center = _getcenter(_cache.data.routes)) != null ) {
		    opt.zoom = 12;
		} else if( (opt.center = _getcenter(_cache.data.accounts)) != null ) {
		    opt.zoom = 9;
		} else {
		    opt.center = [55.76, 37.64];
		}
		_tags.tbl.hide();
		_tags.map.show();
		_tags.map.style.height = "{0}px".format_a((window.innerHeight - _tags.map.offsetTop - 5));
		if( _cache.map == null ) {
		    ymaps.ready(function() {
			_cache.map = new ymaps.Map(_tags.map, opt);
			_compilemap();
		    });
		} else if( _cache.reloadingMap ) {
		    _compilemap();
		}
		tag.addClass('important');
		tag.setAttribute("X-map", "enabled");
	    }
	},
	setdrop: function(tag, name, row_no, arg) {
	    _setdrop(_shielding(_cache.data, _cache.data.rows[row_no]), name, arg, function(row) {
		var x = _("X-{0}".format_a(row._row_no));
		var ref = row["{0}s".format_a(name)];
		tag.html(ref[arg-1] ? '' : _mark);
		ref[arg-1] = ref[arg-1] ? 0 : 1;
		x.html(_a(row));
		_cleanupmap();
	    });
	},
	remove: function(tag, row_no) {
	    _remove(_cache.data.rows[row_no], function(row) {
		var x = _("X-{0}".format_a(row._row_no));
		row._deleted = row._deleted ? 0 : 1;
		tag.html(row._deleted ? lang.restore.ref : lang.remove.ref);
		x.removeClass('attention');
	    });
	},
	add: function(tag, row_no) {
	    _add(_shielding(_cache.data, _cache.data.rows[row_no]), function(row) {
		if( !Array.isArray(_cache.data.routes) ) {
		    _cache.data.routes = [];
		}
		_cache.data.routes.splice(0, 0, row);
		_cache.data.rows[row_no] = row;
		tag.html(lang.remove.ref);
		tag.setAttribute("onclick", "PLUG.remove(this,{0})".format_a(row_no));
		tag.parentNode.parentNode.childNodes.forEach(function(x) {
		    x.removeClass('disabled');
		});
	    });
	},
	more: function(tag, row_no) {
	    //console.log(_cache.data.rows[row_no]);
	    Dialog({width: 500, title: lang.extra_info, body: _detailsbody(_cache.data.b_date, _cache.data.rows[row_no])}).show();
	}
    }
})();


function startup(tag, cycle_id, perm) {
    PLUG.startup({body: tag}, cycle_id, perm);
}

window.onpopstate = function(event) {
    PLUG.refresh(event.state != null ? event.state.cycle_id : null);
}
