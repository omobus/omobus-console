/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "quests";
    var _cache = {}, _perm = {}, _tags = {};

    function _getcolumns(perm) {
	let x = 10, c = perm.columns || {};
	if( c.channel == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.quests.title1, "</span>&nbsp;");
	ar.push("<a id='plugCal' href='javascript:void(0);' onclick='PLUG.calendar(this)'>[&nbsp;-&nbsp;]</a>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.xlsx(this)'>", lang.export.xlsx, "</a>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th>", lang.num, "</th>");
	ar.push("<th>", lang.created_date, "</th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.users(this,\"user\",0.2)'>", lang.u_name, "</a></th>");
	ar.push("<th>", lang.a_code, "</th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.retail_chains(this)'>", lang.a_name, "</a></th>");
	ar.push("<th>", lang.address, "</th>");
	if( perm.columns != null && perm.columns.channel == true ) {
	    ar.push("<th><a href='javascript:void(0)' onclick='PLUG.channels(this)'>", lang.chan_name, "</a></th>");
	}
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.qnames(this, 0.6)'>", lang.qname, "</a></th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.qrows(this, 0.65)'>", lang.qrow, "</a></th>");
	ar.push("<th>", lang.qvalue, "</th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(MonthsPopup.container());
	ar.push(ChannelsPopup.container());
	ar.push(QuestNamesPopup.container());
	ar.push(QuestRowsPopup.container());
	ar.push(RetailChainsPopup.container());
	ar.push(UsersPopup.container());
	ar.push(UsersPopup.container("headsPopup"));
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
	    fix_dt:true, 
	    user_id:true, dev_login:true, u_name:true, 
	    account_id:true, a_code:true, a_name:true, address:true, 
	    chan_id: true, chan:true, 
	    poten:true, 
	    rc_id:true, rc:true, ka_code:true, 
	    region:true, 
	    city:true, 
	    qname_id:true,
	    qrow_id:true,
	    head_id:true
	});
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z;
	data._rows = [];
	for( var i = 0, k = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.row_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.row_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td class='date delim'>", G.getdatetime_l(Date.parseISO8601(r.fix_dt)), "</td>");
		    ar.push("<td class='string sw95px delim'>", G.shielding(r.u_name), "</td>");
		    ar.push("<td class='int'>", G.shielding(r.a_code), "</td>");
		    ar.push("<td class='string a_name'>", G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string a_address" + (perm.columns != null && perm.columns.channel == true ? "" : " delim") + 
			"'>", G.shielding(r.address), "</td>");
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px delim'>", G.shielding(r.chan), "</td>");
		    }
		    ar.push("<td class='ref Xsw95px'>")
		    if( !String.isEmpty(r.qname) ) {
			ar.push("<div class='row'>", G.shielding(r.qname), "</div>");
		    }
		    if( !String.isEmpty(r.qpath) ) {
			if( !String.isEmpty(r.qname) ) {
			    ar.push("<hr/>");
			}
			ar.push("<div class='row watermark'>", G.shielding(r.qpath), "</div>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string note'>", G.shielding(r.qrow), "</td>");
		    ar.push("<td class='delim int'>", G.shielding(r.value), "</td>");
		    ar.push("<td class='string sw95px'>", G.shielding(r.head_name), "</td>");
		    ar.push("</tr>");
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
			ws.cell("N{0}".format_a(i + offset)).value(r.qname);
			ws.cell("O{0}".format_a(i + offset)).value(r.qrow_id);
			ws.cell("P{0}".format_a(i + offset)).value(r.qpath);
			ws.cell("Q{0}".format_a(i + offset)).value(r.qrow);
			ws.cell("R{0}".format_a(i + offset)).value(r.value);
			ws.cell("S{0}".format_a(i + offset)).value(r.head_name);
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
	qnames: function(tag, offset) {
	    _togglePopup("qnames", tag, offset, function(obj) {
		return QuestNamesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "qname_id");
		})
	    });
	},
	qrows: function(tag, offset) {
	    _togglePopup("qrows", tag, offset, function(obj) {
		return QuestRowsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "qrow_id");
		})
	    });
	},
	xlsx: function() {
	    _toxlsx();
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
