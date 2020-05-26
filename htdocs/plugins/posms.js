/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "posms";
    var _cache = {}, _perm = {}, _tags = {}, _F = false /* abort export photos */;

    function _getcolumns(perm) {
	let x = 11, c = perm.columns || {};
	if( c.channel == true ) x++;
	if( c.brand == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.posms.title1, "</span>&nbsp;");
	ar.push("<a id='plugCal' href='javascript:void(0);' onclick='PLUG.calendar(this)'>[&nbsp;-&nbsp;]</a>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.xlsx(this)'>", lang.export.xlsx, "</a>");
	if( perm.zip ) {
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.zip(this,_(\"L\"),_(\"progress\"))'>", 
		lang.export.photo, "</a><span id='L' style='display: none;'><span id='progress'></span>&nbsp;(<a href='javascript:void(0)' " + 
		"onclick='PLUG.abort();'>", lang.abort, "</a>)</span>");
	}
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th class='date'>", lang.created_date, "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"user\",0.2)'>", lang.u_name, "</a></th>");
	ar.push("<th>", lang.a_code, "</th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.retail_chains(this)'>", lang.a_name, "</a></th>");
	ar.push("<th>", lang.address, "</th>");
	if( perm.columns != null && perm.columns.channel == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.channels(this)'>", lang.chan_name, "</a></th>");
	}
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.placements(this,0.6)'>", lang.placement, "</a></th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.posms(this, 0.65)'>", lang.pos_material, "</a></th>");
	if( perm.columns != null && perm.columns.brand == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.brands(this,0.6)'>", lang.brand, "</a></th>");
	}
	ar.push("<th>", lang.photo, "</th>");
	ar.push("<th>", lang.note, "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(MonthsPopup.container());
	ar.push(BrandsPopup.container());
	ar.push(ChannelsPopup.container());
	ar.push(PlacementsPopup.container());
	ar.push(POSMaterialsPopup.container());
	ar.push(RetailChainsPopup.container());
	ar.push(UsersPopup.container());
	ar.push(UsersPopup.container("headsPopup"));
	ar.push(Slideshow.container());
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
	return Filter(a.join(' '), false, {
	    doc_id:true,
	    fix_dt:true, 
	    user_id:true, dev_login:true, u_name:true,
	    account_id:true, a_code:true, a_name:true, address:true, 
	    chan_id:true, chan:true, 
	    poten:true,
	    rc_id:true, rc:true, ka_code:true,
	    region:true, city:true, 
	    placement_id:true, placement:true,
	    posm_id:true, posm:true,
	    brand_id:true, brand:true,
	    head_id:true, 
	    doc_note:true});
    }

    function _getexplain(r, perm) {
	var ar = [];
	ar.push("<div>", lang.a_code, ":&nbsp;", G.shielding(r.a_code), "</div>");
	ar.push("<h1>", G.shielding(r.a_name), "</h1>");
	ar.push("<div>", G.shielding(r.address), "</div>");
	if( !String.isEmpty(r.rc) ) {
	    ar.push("<div>", lang.rc_name, ":&nbsp;", G.shielding(r.rc), "</div>");
	}
	if( !String.isEmpty(r.chan) ) {
	    ar.push("<div>", lang.chan_name, ":&nbsp;", G.shielding(r.chan), "</div>");
	}
	if( !String.isEmpty(r.poten) ) {
	    ar.push("<div>", lang.poten, ":&nbsp;", G.shielding(r.poten), "</div>");
	}
	ar.push("<hr/>");
	ar.push("<div>", lang.placement, ":&nbsp;", G.shielding(r.placement, lang.dash), "</div>");
	ar.push("<div>", lang.pos_material, ":&nbsp;", G.shielding(r.posm, lang.dash), "</div>");
	if( !String.isEmpty(r.brand) ) {
	    ar.push("<div>", lang.brand, ":&nbsp;", G.shielding(r.brand), "</div>");
	}
	if( !String.isEmpty(r.doc_note) ) {
	    ar.push("<div>", G.shielding(r.doc_note), "</div>");
	}
	ar.push("<hr/>");
	ar.push("<div>", lang.u_name, ":&nbsp;", G.shielding(r.u_name), "</div>");
	ar.push("<div>", lang.head_name, ":&nbsp;", G.shielding(r.head_name, lang.dash), "</div>");
	ar.push("<div>", lang.fix_dt, ":&nbsp;", G.getdatetime_l(Date.parseISO8601(r.fix_dt)), "</div>");
	if( perm.target == true && (typeof r.revoked == 'undefined' || !r.revoked) ) {
	    ar.push("<br/><br/>");
	    ar.push("<div id='spin:", r.blob_id, "' class='spinner'></div>");
	    ar.push("<h2>", lang.targets.title2, "</h2>");
	    ar.push("<div>", lang.notices.target, "</div>");
	    ar.push("<div class='row attention gone' id='alert:", r.blob_id, "'></div>");
	    ar.push("<div class='row'>");
	    ar.push("<input id='sub:", r.blob_id, "' type='text' maxlength='128' autocomplete='off' oninput='PLUG.target.set(",
		r.blob_id, ",\"sub\",this.value)' placeholder='", lang.targets.subject.placeholder, "'/>");
	    ar.push("</div>");
	    ar.push("<div class='row'>");
	    ar.push("<textarea id='msg:", r.blob_id, "' rows='5' maxlength='2048' autocomplete='off' oninput='PLUG.target.set(", r.blob_id,
		",\"msg\",this.value)' placeholder='", lang.targets.body.placeholder, "'></textarea>");
	    ar.push("</div>");
	    ar.push("<div class='row'>");
	    ar.push("<label class='checkbox'>");
	    ar.push("<input type='checkbox' id='strict:", r.blob_id, "' onchange='PLUG.target.set(", r.blob_id, ",\"strict\",this.checked)' />");
	    ar.push("<div class='checkbox__text'>", lang.targets.strict, "</div>");
	    ar.push("</label>");
	    ar.push("</div>");
	    ar.push("<div class='row'>");
	    ar.push("<label class='checkbox'>");
	    ar.push("<input type='checkbox' id='urgent:", r.blob_id, "' onchange='PLUG.target.set(", r.blob_id, ",\"urgent\",this.checked)'",
		perm.urgent == true ? "" : " disabled='disabled'", " />");
	    ar.push("<div class='checkbox__text'>", lang.targets.urgent, "</div>");
	    ar.push("</label>");
	    ar.push("</div>");
	    ar.push("<br/>");
	    ar.push("<div align='center'><button id='commit:", r.blob_id, "' onclick='PLUG.target.create(\"", r.doc_id, "\",", r.blob_id,
		");' disabled='true'>", lang.save, "</button></div>");
	}
	return ar;
    }

    function _getslides(d, rows, func, perm) {
	var ar = [], r, idx;
	for( var i = 0, x = 0, size = rows == null ? 0 : rows.length; i < size; i++ ) {
	    if( (r = rows[i]) != null && (func == null || func(d, r)) ) {
		if( d.doc_id == r.doc_id ) {
		    idx = x;
		}
		ar.push({ref: G.getajax({plug: _code, blob: "yes", blob_id: r.blob_id}), explain: _getexplain(r, perm).join("")});
		x++;
	    }
	}
	return {idx: idx+1, ar: ar};
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z, xs;
	data._rows = []; data._rowsVisible = []
	for( var i = 0, k = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    xs = typeof r.revoked != 'undefined' && r.revoked ? ' strikethrough' : '';
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.doc_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.doc_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td class='date delim", xs, "'>", G.getdatetime_l(Date.parseISO8601(r.fix_dt)), "</td>");
		    ar.push("<td class='string delim sw95px", xs, "'>", G.shielding(r.u_name), "</td>");
		    ar.push("<td class='ref", xs, "'><span onclick='PLUG.slideshow_a(" + i + ")'>", 
			G.shielding(r.a_code), "</span></td>");
		    ar.push("<td class='string a_name", xs, "'>", G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string a_address", perm.columns != null && perm.columns.channel == true ? "" : " delim", xs, 
			"'>", G.shielding(r.address), "</td>");
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref delim sw95px", xs, "'>", G.shielding(r.chan), "</td>");
		    }
		    ar.push("<td class='ref sw95px", xs, "'>", G.shielding(r.placement), "</td>");
		    ar.push("<td class='string note'>", G.shielding(r.posm), "</td>");
		    if( perm.columns != null && perm.columns.brand == true ) {
			ar.push("<td class='ref sw95px", xs, "'>", G.shielding(r.brand), "</td>");
		    }
		    ar.push("<td class='ref'>");
		    if( r.blob_id == null || r.blob_id == "" ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<img class='clickable' onclick='PLUG.slideshow(" + i + ")' height='90px' " + (k>=20?"data-src='":"src='") + 
			    G.getajax({plug: _code, blob: "yes", thumb: "yes", blob_id: r.blob_id}) + "' />");
		    }
		    ar.push("</td>");
		    ar.push("<td class='delim string note", xs, "'>");
		    if( !String.isEmpty(r.doc_note) ) {
			ar.push("<div class='row'>", G.shielding(r.doc_note), "</div>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string sw95px", xs, "'>", G.shielding(r.head_name), "</td>");
		    ar.push("</tr>");
		    data._rowsVisible.push(r);
		    k++;
		}
		data._rows.push(r);
		x++;
	    }
	}
	if( x > 0 ) {
	    total.html((x != size ? "&nbsp;&nbsp;({0}/{1})" : "&nbsp;&nbsp;({1})").format_a(x, size));
	} else {
	    total.html("");
	}
	if( ar.length == 0 ) {
	    ar = _datamsg(lang.empty, perm);
	}
	if( typeof data.data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='" + _getcolumns(perm) + "' class='watermark'>" + lang.data_ts + 
		"&nbsp;" + data.data_ts + "</td></tr>");
	}
	if( (z = Math.floor(x/perm.rows) + ((x%perm.rows)?1:0)) > 1 /*pages: */ ) {
	    ar.push("<tr class='def'><td colspan='" + _getcolumns(perm) + "' class='navbar'>");
	    if( page > 1 ) {
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(1)'>|&lt;</a>&nbsp;");
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page-1,")'>&lt;</a>&nbsp;");
	    }
	    if( page == 1 ) {
		ar.push("&nbsp;",page,"&nbsp;");
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page+1,")'>",page+1,"</a>");
		if( (page+2) <= z ) {
		    ar.push("&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page+2,")'>",page+2,"</a>");
		}
	    } else if( page == z ) {
		if( (page-2) >= 1 ) {
		    ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page-2,")'>",page-2,"</a>&nbsp;");
		}
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page-1,")'>",page-1,"</a>&nbsp;");
		ar.push("&nbsp;",page);
	    } else {
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page-1,")'>",page-1,"</a>&nbsp;");
		ar.push("&nbsp;",page);
		if( (page+1) <= z ) {
		    ar.push("&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page+1,")'>",page+1,"</a>");
		}
	    }
	    if( page < z ) {
		ar.push("&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page+1,")'>&gt;</a>&nbsp;");
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",z,")'>&gt;|</a>");
	    }
	    ar.push("</td></tr>");
	}
	return ar;
    }

    function _datareq(y, m) {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getajax({plug: _code, year: y, month: m}), "json-js", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_cache.data = data;
		_tags.tbody.html(_datatbl(data, 1, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
		new LazyLoad();
	    } else {
		_tags.tbody.html(_datamsg(lang.failure, _perm).join(""));
		_tags.total.html("");
	    }
	    _tags.ts.html(G.getdatetime_l(new Date()));
	    ProgressDialog.hide();
	}).send();
	_cache.y = y; _cache.m = m;
	_tags.cal.html(G.getlongmonth_l(new Date(y, m - 1, 1)).toLowerCase());
    }

    function _page(page) {
	if( _cache.data != null ) {
	    ProgressDialog.show();
	    setTimeout(function() {
		_tags.tbody.html(_datatbl(_cache.data, page, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
		new LazyLoad();
		ProgressDialog.hide();
	    }, 0);
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

    function _onpopup(tag, arg, keyname, filterkey) {
	if( _cache.xfilters == null ) {
	    _cache.xfilters = {};
	}
	if( filterkey == null || typeof filterkey == 'undefined' ) {
	    filterkey = keyname;
	}
	if( typeof arg == 'object' ) {
	    _cache.xfilters[filterkey] = Filter.escape(filterkey, arg[keyname]);
	    tag.addClass('important');
	} else {
	    _cache.xfilters[filterkey] = null;
	    tag.removeClass('important')
	}
	_page(1);
    }

    function _getparam(key) {
	if( _cache.targets == null ) {
	    _cache.targets = {};
	    _cache.targets[key] = {};
	} else if( _cache.targets[key] == null ) {
	    _cache.targets[key] = {};
	}
	return _cache.targets[key];
    }

    function _checktarget(tag, params) {
	tag.disabled = String.isEmpty(params.sub) || String.isEmpty(params.msg);
    }

    function _createtarget(tags, doc_id, params) {
	/* check params: */
	tags.alarm.hide();
	if( String.isEmpty(params.sub) ) {
	    tags.alarm.html(lang.errors.target.sub);
	    tags.alarm.show();
	} else if( String.isEmpty(params.msg) ) {
	    tags.alarm.html(lang.errors.target.body);
	    tags.alarm.show();
	} else {
	    var xhr = G.xhr("POST", G.getajax({plug: _code, doc_id: doc_id}), "", function(xhr) {
		if( xhr.status == 200 ) {
		    params.sub = null;
		    params.msg = null;
		    params.strict = null;
		    params.urgent = null;
		    tags.sub.value = "";
		    tags.msg.value = "";
		    tags.strict.checked = false;
		    tags.urgent.checked = false;
		    Toast.show(lang.success.target);
		} else {
		    tags.commit.disabled = false;
		    tags.alarm.html(xhr.status == 409 ? lang.errors.target.exist : lang.errors.runtime);
		    tags.alarm.show();
		}
		tags.spin.hide();
	    });
	    tags.spin.show();
	    params.doc_id = doc_id;
	    params._datetime = G.getdatetime(new Date());
	    tags.commit.disabled = true;
	    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	    xhr.send(G.formParamsURI(params));
	}
    }

    function _slideshow(params) {
        _cache.targets = {};
        Slideshow(params.ar, {idx:params.idx}).show();
    }

    function _toxlsx() {
	var ar = [], data_ts;
	var func = function(data_ts, ar, templ) {
	    XlsxPopulate.fromDataAsync(templ)
		.then(wb => {
		    var offset = 4;
		    var ws = wb.sheet(0);
		    wb.properties()._node.children = [];
		    wb.property('Title', lang.photos.title);
		    wb.property('Author', __AUTHOR__);
		    ws.name(_code);
		    ws.cell("A1").value("{0} {1}".format_a(lang.data_ts, data_ts));
		    for( var i = 0, size = Math.min(ar.length,1048576 - offset), x; i < size; i++ ) {
			r = ar[i];
			ws.cell("A{0}".format_a(i + offset)).value(r.row_no);
			ws.cell("B{0}".format_a(i + offset)).value(Date.parseISO8601(r.fix_dt));
			ws.cell("C{0}".format_a(i + offset)).value(r.dev_login);
			ws.cell("D{0}".format_a(i + offset)).value(r.u_name);
			ws.cell("E{0}".format_a(i + offset)).value(r.a_code);
			ws.cell("F{0}".format_a(i + offset)).value(r.a_name);
			ws.cell("G{0}".format_a(i + offset)).value(r.address);
			ws.cell("H{0}".format_a(i + offset)).value(r.chan);
			ws.cell("I{0}".format_a(i + offset)).value(r.poten);
			ws.cell("J{0}".format_a(i + offset)).value(r.region);
			ws.cell("K{0}".format_a(i + offset)).value(r.city);
			ws.cell("L{0}".format_a(i + offset)).value(r.rc);
			ws.cell("M{0}".format_a(i + offset)).value(r.ka_code);
			ws.cell("N{0}".format_a(i + offset)).value(r.placement);
			ws.cell("O{0}".format_a(i + offset)).value(r.brand);
			ws.cell("P{0}".format_a(i + offset)).value(r.posm_id);
			ws.cell("Q{0}".format_a(i + offset)).value(r.posm);
			if( typeof r.ref != 'undefined' ) {
			    ws.cell("R{0}".format_a(i + offset)).value("[ 1 ]")
				.style({ fontColor: "0563c1", underline: true })
				.hyperlink({ hyperlink: G.getphotoref(r.ref,true) });
			}
			ws.cell("S{0}".format_a(i + offset)).value(r.doc_note);
			ws.cell("T{0}".format_a(i + offset)).value(r.head_name);
			ws.cell("U{0}".format_a(i + offset)).value(r.revoked ? 1 : 0);
			if( r.revoked ) {
			    ws.range("A{0}:T{0}".format_a(i + offset)).style("strikethrough", true);
			}
		    }
		    wb.outputAsync()
			.then(function(blob) {
			    saveAs(blob, "{0}.xlsx".format_a(_code));
			    ProgressDialog.hide();
			})
		})
		.catch(function(err) {
		    ProgressDialog.hide();
		    Toast.show(lang.errors.xlsx);
		    console.log(err);
		});
	}
	if( _cache.data != null && Array.isArray(_cache.data._rows) ) {
	    _cache.data._rows.forEach(function(r, i) {
		ar.push(r);
	    });
	    data_ts = _cache.data.data_ts;
	}
	ProgressDialog.show();
	if( _cache.xlsx == null ) {
	    G.xhr("GET", G.getstaticref("assets/{0}.xlsx".format_a(_code)), "arraybuffer", function(xhr, data) {
		if( xhr.status == 200 && data != null ) {
		    func(data_ts, ar, data);
		    _cache.xlsx = data;
		} else {
		    ProgressDialog.hide();
		    Toast.show(lang.errors.not_found);
		}
	    }).send();
	} else {
	    func(data_ts, ar, _cache.xlsx);
	}
    }


/* public properties & methods */
    return {
	startup: function(tags, y, m, perm) {
	    _perm = perm;
	    _perm.rows = perm.rows == null || perm.rows <= 0 ? 100 : perm.rows;
	    _tags = tags;
	    _tags.body.html(_getbody(perm).join(""));
	    _tags.tbody = _("maintb");
	    _tags.cal = _("plugCal");
	    _tags.f = _("plugFilter");
	    _tags.ts = _("timestamp");
	    _tags.total = _("plugTotal");
	    _tags.popups = {};
	    _datareq(y, m);
	},
	refresh: function() {
	    _togglePopup();
	    _tags.popups = {};
	    _datareq(_cache.y, _cache.m);
	},
	filter: function(tag, ev) {
	    _togglePopup();
	    return Filter.onkeyup(tag, ev, function() {
		_page(1);
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
	calendar: function(tag) {
	    _togglePopup("cal", tag, undefined, function(obj) {
		return MonthsPopup(function(y, m) {
		    var tmp = _tags.popups[obj];
		    _datareq(y, m);
		    history.replaceState({y:y, m:m}, "", G.getref({plug: _code, year: y, month: m}));
		    _tags.popups = {}; _tags.popups[obj] = tmp;
		}, {year: _cache.y, month: _cache.m, uri: G.getajax({plug: _code, calendar: true})})
	    });
	},
	users: function(tag, type, offset) {
	    _togglePopup(type+"s", tag, offset, function(obj) {
		return UsersPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "user_id", type+"_id");
		}, {container:type+"sPopup", everyone:true})
	    });
	},
	channels: function(tag, offset) {
	    _togglePopup("channels", tag, offset, function(obj) {
		return ChannelsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "chan_id");
		})
	    });
	},
	retail_chains: function(tag, offset) {
	    _togglePopup("retail_chains", tag, offset, function(obj) {
		return RetailChainsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "rc_id");
		})
	    });
	},
	placements: function(tag, offset) {
	    _togglePopup("placements", tag, offset, function(obj) {
		return PlacementsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "placement_id");
		})
	    });
	},
	posms: function(tag, offset) {
	    _togglePopup("posms", tag, offset, function(obj) {
		return POSMaterialsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "posm_id");
		})
	    });
	},
	brands: function(tag, offset) {
	    _togglePopup("brands", tag, offset, function(obj) {
		return BrandsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "brand_id");
		})
	    });
	},
	slideshow_a: function(arg) {
	    _slideshow(_getslides(_cache.data.rows[arg], _cache.data._rowsVisible, function(arg0, arg1) {
		    return arg0.account_id == arg1.account_id;
		}, _perm));
	},
	slideshow: function(arg) {
	    _slideshow(_getslides(_cache.data.rows[arg], _cache.data._rowsVisible, null, _perm));
	},
	xlsx: function() {
	    _toxlsx();
	},
	zip: function(tag0, tag1, span) {
	    var ar = [];
	    if( _cache.data != null && Array.isArray(_cache.data._rows) ) {
		_cache.data._rows.forEach(function(r, i) {
		    if( r.blob_id != null ) {
			ar.push({params: r, blob_id: r.blob_id});
		    }
		});
	    }
	    _F = false;
	    G.tozip(_code, ar, _perm.zip != null ? _perm.zip.photo : null, _perm.zip != null ? _perm.zip.max : null, 
		function() {return _F;}, tag0, tag1, span);
	},
	abort: function() {
	    _F = true;
	},
	target: {
	    set: function(blob_id, arg0, arg1) {
		var p = _getparam(blob_id);
		p[arg0] = arg1;
		_checktarget(_("commit:{0}".format_a(blob_id)), p);
		_("alert:{0}".format_a(blob_id)).hide();
	    },
	    create: function(doc_id, blob_id) {
		_createtarget({
		    commit: _("commit:{0}".format_a(blob_id)), 
		    alarm: _("alert:{0}".format_a(blob_id)), 
		    sub: _("sub:{0}".format_a(blob_id)), 
		    msg: _("msg:{0}".format_a(blob_id)), 
		    strict: _("strict:{0}".format_a(blob_id)),
		    urgent: _("urgent:{0}".format_a(blob_id)),
		    spin: _("spin:{0}".format_a(blob_id))
		}, doc_id, _cache.targets[blob_id]);
	    }
	}
    }
})();


function startup(params, perm) {
    if( params == null || typeof params != 'object' || typeof params.y == 'undefined' || typeof params.m == 'undefined' ) {
	var d = new Date();
	PLUG.startup({body: _('pluginContainer')}, d.getFullYear(), d.getMonth() + 1, perm);
    } else {
	PLUG.startup({body: _('pluginContainer')}, params.y, params.m, perm);
    }
}

window.onpopstate = function(event) {
    window.location.reload(true);
}
