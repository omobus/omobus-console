/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "whereis";
    var _cache = {}, _perm = {}, _tags = {};

    function _getcolumns(perm) {
	let x = 6, c = perm.columns || {};
	if( c.brand == true ) x++;
	if( c.category == true ) x++;
	if( c.channel == true ) x++;
	if( c.phone == true ) x++;
	if( c.region == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'>", "<tr>");
	ar.push("<td>", "<h1>", lang.whereis.title, "</h1>", "</td>");
	ar.push("<td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.xlsx(this)'>", lang.export.xlsx, "</a>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td>");
	ar.push("</tr>", "</table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th>", lang.a_code, "</th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.retail_chains(this)'>", lang.a_name, "</a></th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.cities(this)'>", lang.address, "</a></th>");
	if( perm.columns != null && perm.columns.region == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.regions(this)'>", lang.region, "</a></th>");
	}
	if( perm.columns != null && perm.columns.channel == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.channels(this)'>", lang.chan_name, "</a></th>");
	}
	if( perm.columns != null && perm.columns.phone == true ) {
	    ar.push("<th width='95px'>", lang.phone, "</th>");
	}
	if( perm.columns != null && perm.columns.brand == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.brands(this)'>", lang.brand, "</a></th>");
	}
	if( perm.columns != null && perm.columns.category == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.categories(this)'>", lang.categ_name, "</a></th>");
	}
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.products(this,0.8)'>", lang.prod_name, "</a></th>");
	ar.push("<th class='date'>", lang.date, "</th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(BrandsPopup.container());
	ar.push(CategoriesPopup.container());
	ar.push(ChannelsPopup.container());
	ar.push(CitiesPopup.container());
	ar.push(ProductsPopup.container());
	ar.push(RegionsPopup.container());
	ar.push(RetailChainsPopup.container());
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
	    "account_id", 
	    "a_code", 
	    "a_name", 
	    "address", 
	    "brand_id", 
	    "brand",
	    "categ_id", 
	    "categ",
	    "chan_id", 
	    "chan", 
	    "city_id",
	    "city", 
	    "region_id",
	    "region",
	    "rc_id", 
	    "rc", 
	    "ka_type", 
	    "prod_id", 
	    "p_code", 
	    "p_name"
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
		    var xs = "";
		    if( r.a_hidden ) {
			xs = " strikethrough attention";
		    } else if ( r.a_locked ) {
			xs = " strikethrough";
		    }
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.row_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.row_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td class='int", xs, "'>", G.shielding(r.a_code), "</td>");
		    ar.push("<td class='string a_name", xs, "'>", G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string a_address", xs, "'>", G.shielding(r.address), "</td>");
		    if( perm.columns != null && perm.columns.region == true ) {
			ar.push("<td class='ref sw95px delim'>", G.shielding(r.region), "</td>");
		    }
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px delim'>", G.shielding(r.chan), "</td>");
		    }
		    if( perm.columns != null && perm.columns.phone == true ) {
			ar.push("<td class='ref sw95px delim'>", G.shielding(r.phone), "</td>");
		    }
		    if( perm.columns != null && perm.columns.brand == true ) {
			ar.push("<td class='ref sw95px'>", G.shielding(r.brand), "</td>");
		    }
		    if( perm.columns != null && perm.columns.category == true ) {
			ar.push("<td class='ref sw95px'>", G.shielding(r.categ), "</td>");
		    }
		    ar.push("<td class='string note'>", G.shielding(r.p_name), "</td>");
		    ar.push("<td class='date'>", G.getdate_l(Date.parseISO8601(r.fix_date)), "</td>");
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

    function _compileRowset(data) {
	const ar = [];
	const i_accounts = Array.createIndexBy(data.accounts, "account_id");
	const i_brands = Array.createIndexBy(data.brands, "brand_id");
	const i_categories = Array.createIndexBy(data.categories, "categ_id");
	const i_channels = Array.createIndexBy(data.channels, "chan_id");
	const i_cities = Array.createIndexBy(data.cities, "city_id");
	const i_regions = Array.createIndexBy(data.regions, "region_id");
	const i_products = Array.createIndexBy(data.products, "prod_id");
	const i_retail_chains = Array.createIndexBy(data.retail_chains, "rc_id");

	if( !Array.isEmpty(data.whereis) ) {
	    data.whereis.forEach(function(arg, i) {
		const a = i_accounts[arg.account_id] || {};
		const p = i_products[arg.prod_id] || {};
		const b = i_brands[p.brand_id] || {};
		const c = i_categories[p.categ_id] || {};
		const h = i_channels[a.chan_id] || {};
		const k = i_cities[a.city_id] || {};
		const e = i_regions[a.region_id] || {};
		const r = i_retail_chains[a.rc_id] || {};
		const x = {}
		x.row_id = murmurhash3_32_gc("{0}+{1}+{2}".format_a(arg.account_id, arg.prod_id, arg.fix_date), 1);
		x.row_no = i + 1;
		x.fix_date = arg.fix_date;
		x.account_id = a.account_id;
		x.a_code = a.code;
		x.a_name = a.descr;
		x.address = a.address;
		x.phone = a.phone;
		x.a_hidden = a.hidden;
		x.a_locked = a.locked;
		x.prod_id = p.prod_id;
		x.p_code = p.code;
		x.p_name = p.descr;
		x.brand_id = b.brand_id;
		x.brand = b.descr;
		x.categ_id = c.categ_id;
		x.categ = c.descr;
		x.chan_id = h.chan_id;
		x.chan = h.descr;
		x.rc_id = r.rc_id;
		x.rc = r.descr;
		x.ka_type = r.ka_type;
		x.region_id = e.region_id;
		x.region = e.descr;
		x.city_id = k.city_id;
		x.city = k.descr;
		ar.push(x);
	    });
	}

	return {
	    data_ts: data.data_ts,
	    rows: ar,
	    brands: data.brands,
	    categories: data.categories,
	    channels: data.channels,
	    cities: data.cities,
	    regions: data.regions,
	    products: data.products,
	    retail_chains: data.retail_chains
	}
    }

    function _datareq() {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getdataref({plug: _code}), "json-js", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_cache.data = _compileRowset(data);
		//console.log(data);
		//console.log(_cache.data);
		_tags.tbody.html(_datatbl(_cache.data, 1, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
	    } else {
		_tags.tbody.html(_datamsg(lang.failure, _perm).join(""));
		_tags.total.html("");
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
		    var offset = 3;
		    var ws = wb.sheet(0);
		    wb.properties()._node.children = [];
		    wb.property('Title', lang.whereis.title);
		    wb.property('Author', __AUTHOR__);
		    wb.property('Description', "{0} {1}".format_a(lang.data_ts, data_ts));
		    ws.name(_code);
		    for( var i = 0, size = Math.min(ar.length,1048576 - offset), x; i < size; i++ ) {
			r = ar[i];
			ws.cell("A{0}".format_a(i + offset)).value(r.row_no);
			ws.cell("B{0}".format_a(i + offset)).value(r.a_code);
			ws.cell("C{0}".format_a(i + offset)).value(r.a_name);
			ws.cell("D{0}".format_a(i + offset)).value(r.address);
			ws.cell("E{0}".format_a(i + offset)).value(r.chan);
			ws.cell("F{0}".format_a(i + offset)).value(r.poten);
			ws.cell("G{0}".format_a(i + offset)).value(r.region);
			ws.cell("H{0}".format_a(i + offset)).value(r.city);
			ws.cell("I{0}".format_a(i + offset)).value(r.rc);
			ws.cell("J{0}".format_a(i + offset)).value(r.ka_type);
			ws.cell("K{0}".format_a(i + offset)).value(r.categ);
			ws.cell("L{0}".format_a(i + offset)).value(r.brand);
			ws.cell("M{0}".format_a(i + offset)).value(r.p_code);
			ws.cell("N{0}".format_a(i + offset)).value(r.p_name);
			ws.cell("O{0}".format_a(i + offset)).value(Date.parseISO8601(r.fix_date));
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
	startup: function(tags, perm) {
	    _perm = perm;
	    _perm.rows = perm.rows == null || perm.rows <= 0 ? 100 : perm.rows;
	    _tags = tags;
	    _tags.body.html(_getbody(perm).join(""));
	    _tags.tbody = _("maintb");
	    _tags.f = _("plugFilter");
	    _tags.ts = _("timestamp");
	    _tags.total = _("plugTotal");
	    _tags.popups = {};
	    _datareq();
	},
	refresh: function() {
	    _togglePopup();
	    _tags.popups = {};
	    _datareq();
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
	channels: function(tag, offset) {
	    _togglePopup("channels", tag, offset, function(obj) {
		return ChannelsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "chan_id");
		})
	    });
	},
	cities: function(tag, offset) {
	    _togglePopup("cities", tag, offset, function(obj) {
		return CitiesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "city_id");
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
	regions: function(tag, offset) {
	    _togglePopup("regions", tag, offset, function(obj) {
		return RegionsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "region_id");
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
	xlsx: function() {
	    _toxlsx();
	}
    }
})();


function startup(perm) {
    PLUG.startup({body: _('pluginContainer')}, perm);
}
