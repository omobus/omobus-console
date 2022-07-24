/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "prices";
    var _cache = {}, _perm = {}, _tags = {}, _F = false /* abort export photos */;

    function _getcolumns(perm) {
	let x = 15, c = perm.columns || {};
	if( c.channel == true ) x++;
	if( c.brand == true ) x++;
	if( c.category == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.prices.title1, "</span>&nbsp;");
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
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.latest(this)'>", lang.latest, "</a>");
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
	if( perm.columns != null && perm.columns.brand == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.brands(this)'>", lang.brand, "</a></th>");
	}
	if( perm.columns != null && perm.columns.category == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.categories(this)'>", lang.categ_name, "</a></th>");
	}
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.products(this,0.8)'>", lang.prod_name, "</a></th>");
	ar.push("<th class='numeric' width='45px'>", lang.price, "</th>");
	ar.push("<th class='numeric' width='45px'>", lang.promo, "</th>");
	ar.push("<th class='bool'>", lang.discount, "</th>");
	ar.push("<th class='numeric' width='45px'>", lang.rrp, "</th>");
	ar.push("<th>", lang.photo, "</th>");
	ar.push("<th>", lang.note, "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	ar.push("<th class='bool' width='35px'>", "&#x267A;", "</th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(MonthsPopup.container());
	ar.push(SlideshowSimple.container());
	ar.push(BrandsPopup.container());
	ar.push(CategoriesPopup.container());
	ar.push(ChannelsPopup.container());
	ar.push(ProductsPopup.container());
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
	return Filter(a.join(' '), false, [
	    "fix_dt", 
	    "user_id", 
	    "dev_login", 
	    "u_name", 
	    "account_id", 
	    "a_code", 
	    "a_name", 
	    "address", 
	    "chan_id", 
	    "chan", 
	    "poten", 
	    "rc_id", 
	    "rc", 
	    "ka_type", 
	    "region", 
	    "city", 
	    "brand_id", 
	    "brand",
	    "categ_id", 
	    "categ",
	    "prod_id", 
	    "p_code", 
	    "prod",
	    "note",
	    "head_id",
	    "_isLatest"
	]);
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
		    if( perm.columns != null && perm.columns.brand == true ) {
			ar.push("<td class='ref sw95px'>", G.shielding(r.brand), "</td>");
		    }
		    if( perm.columns != null && perm.columns.category == true ) {
			ar.push("<td class='ref sw95px'>", G.shielding(r.categ), "</td>");
		    }
		    ar.push("<td class='string note'>", G.shielding(r.prod), "</td>");
		    ar.push("<td class='int'>", G.getcurrency_l(r.price), "</td>");
		    ar.push("<td class='int'>", G.getcurrency_l(r.promo), "</td>");
		    ar.push("<td class='bool'>", r.discount ? lang.plus : "&nbsp;", "</td>");
		    ar.push("<td class='int'>", G.getcurrency_l(r.rrp), "</td>");
		    ar.push("<td class='ref'>");
		    if( String.isEmpty(r.blob_id) ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<img class='clickable' onclick='PLUG.slideshow(" + r.blob_id + ")' height='90px' " + (k>=20?"data-src='":"src='") +
			    G.getdataref({plug: _code, blob: "yes", thumb: "yes", blob_id: r.blob_id}) + "' />");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string note delim'>", G.shielding(r.note), "</td>");
		    ar.push("<td class='string sw95px'>", G.shielding(r.head_name), "</td>");
		    ar.push("<td class='bool'>", String.isEmpty(r.scratch) ? "" : "&#x267A;", "</td>");
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

    function _markLatestRows(rows) {
	var idx = {};
	if( !Array.isEmpty(rows) ) {
	    rows.forEach(function(arg) {
		const t = G.getdate(arg.fix_dt);
		if( arg.account_id in idx ) {
		    if( t > idx[ arg.account_id ] ) {
			idx[ arg.account_id ] = t;
		    }
		} else {
		    idx[ arg.account_id ] = t;
		}
	    });
	    rows.forEach(function(arg) {
		if( idx[ arg.account_id ] == G.getdate(arg.fix_dt) ) {
		    arg._isLatest = 1;
		}
	    });
	}
    }

    function _datareq(y, m) {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getdataref({plug: _code, year: y, month: m}), "json-js", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_cache.data = data;
		_markLatestRows(data.rows);
		//console.log(data);
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

    function _latest(tag) {
	if( _cache.xfilters == null ) {
	    _cache.xfilters = {};
	}
	if( tag.hasClass("important") ) {
	    _cache.xfilters["_isLatest"] = null;
	    tag.removeClass('important');
	} else {
	    _cache.xfilters["_isLatest"] = "_isLatest=1$";
	    tag.addClass('important');
	}
	_page(1);
    }

    function _toxlsx() {
	var ar = [], data_ts;
	var func = function(data_ts, ar, templ) {
	    XlsxPopulate.fromDataAsync(templ)
		.then(wb => {
		    var offset = 3;
		    var ws = wb.sheet(0);
		    wb.properties()._node.children = [];
		    wb.property('Title', lang.prices.title);
		    wb.property('Author', __AUTHOR__);
		    wb.property('Description', "{0} {1}".format_a(lang.data_ts, data_ts));
		    ws.name(_code);
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
			ws.cell("M{0}".format_a(i + offset)).value(r.ka_type);
			ws.cell("N{0}".format_a(i + offset)).value(r.categ);
			ws.cell("O{0}".format_a(i + offset)).value(r.brand);
			ws.cell("P{0}".format_a(i + offset)).value(r.p_code);
			ws.cell("Q{0}".format_a(i + offset)).value(r.prod);
			ws.cell("R{0}".format_a(i + offset)).value(r.price);
			ws.cell("S{0}".format_a(i + offset)).value(r.promo);
			ws.cell("T{0}".format_a(i + offset)).value(r.discount ? "+" : "");
			ws.cell("U{0}".format_a(i + offset)).value(r.units);
			ws.cell("V{0}".format_a(i + offset)).value(r.rrp);
			if( typeof r.ref != 'undefined' ) {
			    ws.cell("W{0}".format_a(i + offset)).value("[ 1 ]")
				.style({ fontColor: "0563c1", underline: true })
				.hyperlink({ hyperlink: G.getphotoref(r.ref,true) });
			}
			ws.cell("X{0}".format_a(i + offset)).value(r.note);
			ws.cell("Y{0}".format_a(i + offset)).value(r.head_name);
			ws.cell("Z{0}".format_a(i + offset)).value(String.isEmpty(r.scratch) ? "" : "♺");
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
		    history.replaceState({y:y, m:m}, "", G.getdefref({plug: _code, year: y, month: m}));
		    _tags.popups = {}; _tags.popups[obj] = tmp;
		}, {year: _cache.y, month: _cache.m, uri: G.getdataref({plug: _code, calendar: true})})
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
	brands: function(tag, offset) {
	    _togglePopup("brands", tag, offset, function(obj) {
		return BrandsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "brand_id");
		})
	    });
	},
	categories: function(tag, offset) {
	    _togglePopup("categories", tag, offset, function(obj) {
		return CategoriesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "categ_id");
		})
	    });
	},
	products: function(tag, offset) {
	    _togglePopup("products", tag, offset, function(obj) {
		return ProductsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "prod_id");
		})
	    });
	},
	latest: function(tag) {
	    _togglePopup();
	    _latest(tag);
	},
	slideshow: function(blob_id) {
	    SlideshowSimple([G.getdataref({plug: _code, blob: "yes", blob_id: blob_id})]).show();
	},
	xlsx: function() {
	    _toxlsx();
	},
	zip: function(tag0, tag1, span) {
	    var ar = [];
	    if( _cache.data != null && Array.isArray(_cache.data._rows) ) {
		_cache.data._rows.forEach(function(r, i) {
		    if( !String.isEmpty(r.blob_id) ) {
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
