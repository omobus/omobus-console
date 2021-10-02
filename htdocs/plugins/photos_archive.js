/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "photos_archive";
    var _cache = {}, _perm = {}, _tags = {};

    function _getcolumns(perm) {
	var a = 16;
	if( perm.columns != null ) {
	    if( perm.columns.region == true ) a += 1;
	    if( perm.columns.channel == true ) a += 1;
	    if( perm.columns.potential == true ) a += 1;
	}
	return a;
    }

    function _getbody(y, years, perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr>");
	ar.push("<td><h1><span>", lang.photos_archive.title, "</span></h1></td>");
	ar.push("<td class='r'>");
	if( Array.isArray(years) && years.length > 0 ) {
	    ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	    ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.placements(this,0.7)' X-everything='",
		lang.placement_everything, "'>", lang.placement_everything, "</a>");
	    if( perm.columns != null && perm.columns.asp_type == true ) {
		ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.asp_types(this,0.7)' X-everything='",
		    lang.asp_type_everything, "'>", lang.asp_type_everything, "</a>");
	    }
	    if( perm.columns != null && perm.columns.brand == true ) {
		ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.brands(this,0.7)' X-everything='", 
		    lang.brand_everything, "'>", lang.brand_everything, "</a>");
	    }
	    if( perm.columns != null && perm.columns.photo_type == true ) {
		ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.photo_types(this,0.7)' X-everything='",
		    lang.photos.everything, "'>", lang.photos.everything, "</a>");
	    }
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
		lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	}
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th rowspan='2' class='autoincrement'>", lang.num, "</th>");
	ar.push("<th rowspan='2'>", lang.a_code, "</th>");
	ar.push("<th rowspan='2'><a href='javascript:void(0)' onclick='PLUG.retail_chains(this,0.2)'>", lang.a_name, "</a></th>");
	ar.push("<th rowspan='2'>", lang.address, "</th>");
	if( perm.columns != null && perm.columns.region == true ) {
	    ar.push("<th rowspan='2' class='sw95px'><a href='javascript:void(0)' onclick='PLUG.regions(this)'>", lang.region, "</a></th>");
	}
	if( perm.columns != null && perm.columns.channel == true ) {
	    ar.push("<th rowspan='2' class='sw95px'><a href='javascript:void(0)' onclick='PLUG.channels(this)'>", lang.chan_name, "</a></th>");
	}
	if( perm.columns != null && perm.columns.potential == true ) {
	    ar.push("<th rowspan='2' class='sw95px'><a href='javascript:void(0)' onclick='PLUG.potentials(this)'>", lang.poten, "</a></th>");
	}
	ar.push("<th id='plugYears' colspan='12' height='22px'>");
	if( Array.isArray(years) && years.length > 0 ) {
	    for( var i = 0, size = years.length; i < size; i++ ) {
		if( i > 0 ) {
		    ar.push("&nbsp;&nbsp;|&nbsp;&nbsp");
		}
		ar.push("<a href='javascript:void(0)' onclick='PLUG.moveto(this,", years[i], ")'",
		    years[i] == y ? " class='selected'" : "", ">", years[i], "</a>");
	    }
	} else {
	    ar.push(lang.photo);
	}
	ar.push("</th>");
	ar.push("</tr>", "<tr>");
	for( var i = 0; i < 12; i++ ) {
	    ar.push("<th width='30px'>", lang.calendar.months.namesAbbr[i], "</th>");
	}
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(ASPTypesPopup.container());
	ar.push(BrandsPopup.container());
	ar.push(ChannelsPopup.container());
	ar.push(PhotoTypesPopup.container());
	ar.push(PlacementsPopup.container());
	ar.push(PotentialsPopup.container());
	ar.push(RegionsPopup.container());
	ar.push(RetailChainsPopup.container());
	ar.push(Dialog.container());
	ar.push(SlideshowSimple.container());
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
	    "code", 
	    "a_name", 
	    "address", 
	    "chan_id", 
	    "chan", 
	    "poten_id", 
	    "poten",
	    "rc_id", 
	    "rc", 
	    "ka_type",
	    "region_id", 
	    "region",
	    "city_id", 
	    "city"
	]);
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z;
	data._rows = []; data._rowsVisible = []
	for( var i = 0, k = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    var xs = "";
		    if( r.hidden ) {
			xs = " strikethrough attention";
		    } else if ( r.locked ) {
			xs = " strikethrough";
		    }
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.account_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.account_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td class='int", xs, "'>", G.shielding(r.code), "</td>");
		    ar.push("<td class='string a_name", xs, "'>", G.shielding(r.descr), "</td>");
		    ar.push("<td class='string a_address", xs, "'>", G.shielding(r.address), "</td>");
		    if( perm.columns != null && perm.columns.region == true ) {
			ar.push("<td class='ref sw95px", xs, "'>", G.shielding(r.region), "</td>");
		    }
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px", xs, "'>", G.shielding(r.chan), "</td>");
		    }
		    if( perm.columns != null && perm.columns.potential == true ) {
			ar.push("<td class='ref sw95px", xs, "'>", G.shielding(r.poten), "</td>");
		    }
		    if( Array.isArray(r.photos) && r.photos.length == 12 ) {
			for( var nn = 0; nn < 12; nn++ ) {
			    if( r.photos[nn] > 0 ) {
				ar.push("<td class='int'><a href='javascript:void(0)' onclick='PLUG.more(", i, ",", nn+1, ")'>", 
				    r.photos[nn], "</a></td>");
			    } else {
				ar.push("<td class='int'>", lang.dash, "</td>");
			    }
			}
		    } else {
			for( var nn = 0; nn < 12; nn++ ) {
			    ar.push("<td class='int'>", lang.dash, "</td>");
			}
		    }
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
	    ar.push("<tr class='def'><td colspan='", _getcolumns(perm), "' class='watermark'>");
	    ar.push(lang.data_ts, "&nbsp;", data.data_ts);
	    if( typeof data.storage == 'string' ) {
		ar.push("&nbsp;(", G.shielding(data.storage), ")");
	    }
	    ar.push("</td></tr>");
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

    function _resolveLinks(ar, obj, k_name, cb) {
	if( Array.isArray(obj) && obj.length > 0 ) {
	    var idx = obj.createIndexBy(k_name);
	    ar.forEach(function(r) {
		var ptr = idx[r[k_name]];
		if( ptr != null && typeof cb != 'undefined' ) {
		    cb(r, ptr);
		}
	    });
	}
    }

    function _datareq() {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getdataref(_cache.params), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		if( data.objects != null && Array.isArray(data.rows) && data.rows.length > 0 ) {
		    _resolveLinks(data.rows, data.objects.regions, "region_id", function(r, ptr) {
			r.region = ptr.descr;
		    });
		    _resolveLinks(data.rows, data.objects.cities, "city_id", function(r, ptr) {
			r.city = ptr.descr;
		    });
		    _resolveLinks(data.rows, data.objects.retail_chains, "rc_id", function(r, ptr) {
			r.rc = ptr.descr;
			r.ka_type = ptr.ka_type;
		    });
		    _resolveLinks(data.rows, data.objects.channels, "chan_id", function(r, ptr) {
			r.chan = ptr.descr;
		    });
		    _resolveLinks(data.rows, data.objects.potentials, "poten_id", function(r, ptr) {
			r.poten = ptr.descr;
		    });
		    if( Array.isArray(data.objects.placements) ) {
			data.objects._placements = data.objects.placements.createIndexBy("placement_id");
		    }
		    if( Array.isArray(data.objects.asp_types) ) {
			data.objects._asp_types = data.objects.asp_types.createIndexBy("asp_type_id");
		    }
		    if( Array.isArray(data.objects.brands) ) {
			data.objects._brands = data.objects.brands.createIndexBy("brand_id");
		    }
		    if( Array.isArray(data.objects.photo_types) ) {
			data.objects._photo_types = data.objects.photo_types.createIndexBy("photo_type_id");
		    }
		    if( Array.isArray(data.objects.photo_params) ) {
			data.objects._photo_params = data.objects.photo_params.createIndexBy("photo_param_id");
		    }
		}
		_cache.data = data;
		_tags.tbody.html(_datatbl(data, 1, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
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

    function _onpopup2(tag, arg, keyname) {
	if( typeof arg == 'object' ) {
	    _cache.params[keyname] = arg[keyname];
	    tag.addClass('important');
	    tag.html(arg.descr.trunc(20));
	} else {
	    _cache.params[keyname] = null;
	    tag.removeClass('important')
	    tag.html(tag.getAttribute('X-everything'));
	}
	_datareq();
	_tags.popups = {};
    }

    function _getobject(name) {
	return (typeof _cache.data == 'undefined' || typeof _cache.data.objects == 'undefined') 
	    ? null : _cache.data.objects[name];
    }

    function _unselectYears() {
	var ar = _tags.years.getElementsByClassName('selected');
	for( var i = 0, size = ar == null ? 0 : ar.length; i < size; i++ ) {
	    ar[i].removeClass("selected");
	}
    }

    function _moretbl(r, month, hm) {
	var ar = [], d, c;
	ar.push("<table width='100%'>","<tr>","<td>");
	ar.push("<div>", "<b>{0}: {1}</b>".format_a(G.shielding(r.code), G.shielding(r.descr)), "</div>");
	ar.push("<div>", G.shielding(r.address), "</div>");
	if( !String.isEmpty(r.chan) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.chan_name, G.shielding(r.chan)), "</div>");
	}
	if( !String.isEmpty(r.poten) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.poten, G.shielding(r.poten)), "</div>");
	}
	if( !String.isEmpty(r.rc) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.rc_name, G.shielding(r.rc)), "</div>");
	}
	if( typeof r.cash_register == 'number' && r.cash_register > 0 ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.cash_registers, r.cash_register), "</div>");
	}
	ar.push("</td>", "<td width='10px'/>", "<td width='270px' style='text-align:right;'>");
	ar.push("<div>", "&nbsp;", "</div>");
	ar.push("</td>","</tr>","</table>");
	ar.push("<br/>");
	if( Array.isArray(r._photos) ) {
	    r._photos.forEach(function(x) {
		if( x.fix_month == month ) {
		    var xs = typeof x.revoked != 'undefined' && x.revoked ? ' strikethrough' : '';
		    if( d != x.fix_date ) {
			if( d != null ) {
			    ar.push("</table>");
			    ar.push("<hr/>");
			}
			ar.push("<div>");
			ar.push("<h2>", G.getlongdate_l(x.fix_date), "</h2>");
			ar.push("</div>");
			ar.push("<table width='100%' class='report'>");
			ar.push("<tr class='def'>");
			ar.push("<td class='divider'>", "&nbsp;", "</td>");
			ar.push("<td class='divider'>", lang.placement, "</td>");
			ar.push("<td class='divider'>", lang.brand, "</td>");
			ar.push("<td class='divider'>", lang.photos.type, "</td>");
			ar.push("<td class='divider'>", lang.photo, "</td>");
			ar.push("<td class='divider'>", lang.note, "</td>");
			ar.push("<td class='divider'>", "&nbsp;", "</td>");
			ar.push("</tr>");
			d = x.fix_date;
			c = 1;
		    }
		    ar.push("<tr>");
		    ar.push("<td class='ref' width='30px'>", c, "</td>");
		    ar.push("<td class='ref", xs, "' width='150px'>");
		    ar.push(G.shielding(x.placement));
		    if( !String.isEmpty(x.asp_type) ) {
			ar.push("<div class='row watermark'>", G.shielding(x.asp_type), "</div>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref", xs, "' width='100px'>", G.shielding(x.brand), "</td>");
		    ar.push("<td class='ref", xs, "' width='150px'>", G.shielding(x.photo_type), "</td>");
		    ar.push("<td class='ref' width='130px'>");
		    if( String.isEmpty(x.ref_id) ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<img class='clickable' onclick='PLUG.slideshow([\"", x.ref_id, "\"],1)' height='90px' src='",
			    G.getdataref({plug: _code, thumb: "yes", blob_id: x.ref_id}), "' />");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string", xs, "'>");
		    if( !String.isEmpty(x.doc_note) ) {
			ar.push("<div class='row'>", G.shielding(x.doc_note), "</div>");
		    }
		    if( Array.isArray(x.photo_params) && x.photo_params.length > 0 ) {
			if( !String.isEmpty(x.doc_note) ) {
			    ar.push("<hr/>");
			}
			x.photo_params.forEach(function(val, index) {
			    if( index > 0 ) { ar.push("<hr/>"); }
			    ar.push("<div class='row remark'>", G.shielding(val), "</div>");
			});
		    }
		    ar.push("<td class='ref' width='25px'><img class='clickable' onclick='PLUG.save(this,\"", x.ref_id, 
			"\")' height='20px' src='",G.getstaticref("drawable/download.png"), "'/></td>");
		    ar.push("</td>");
		    ar.push("</tr>");
		    c++;
		}
	    });
	    if( d != null ) {
		ar.push("</table>");
	    }
	}

	return ar;
    }

    function _morereq(row_no, month) {
	var txt = "{0} {1} {2}".format_a(lang.photos_archive.title1, lang.calendar.months.names[month-1].toLowerCase(), _cache.params.year);
	var hm = _cache.data.objects;
	var a = _cache.data.rows[row_no];
	if( a._photos != null ) {
	    Dialog({width: 880, title: txt, body: _moretbl(a, month).join('')}).show();
	} else {
	    ProgressDialog.show();
	    G.xhr("GET", G.getdataref(Object.assign({}, _cache.params, {account_id: a.account_id})), "json", function(xhr, data) {
		if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		    if( Array.isArray(data.photos) ) {
			data.photos.forEach(function(x) {
			    var ptr;
			    if( x.placement_id != null && hm._placements != null && (ptr = hm._placements[x.placement_id]) != null ) {
				x.placement = ptr.descr;
			    }
			    if( x.asp_type_id != null && hm._asp_types != null && (ptr = hm._asp_types[x.asp_type_id]) != null ) {
				x.asp_type = ptr.descr;
			    }
			    if( x.brand_id != null && hm._brands != null && (ptr = hm._brands[x.brand_id]) != null ) {
				x.brand = ptr.descr;
			    }
			    if( x.photo_type_id != null && hm._photo_types != null && (ptr = hm._photo_types[x.photo_type_id]) != null ) {
				x.photo_type = ptr.descr;
			    }
			    if( x.photo_param_ids != null && hm._photo_params != null ) {
				x.photo_params = [];
				for( var nn = 0; nn < x.photo_param_ids.length; nn++ ) {
				    if( (ptr = hm._photo_params[x.photo_param_ids[nn]]) != null ) {
					x.photo_params.push(ptr.descr);
				    }
				}
			    }
			});
		    }
		    a._photos = data.photos;
		    Dialog({width: 880, title: txt, body: _moretbl(a, month).join('')}).show();
		} else {
		    Toast.show(lang.errors.runtime);
		}
		ProgressDialog.hide();
	    }).send();
	}
    }

    function _saveJpeg(tag, ref_id) {
	var timerId = setInterval(function() { if( tag.isHidden() ) { tag.show(); } else { tag.hide(); }}, 350);
	G.xhr("GET", G.getdataref({plug: _code, blob_id: ref_id}), "blob", function(xhr) {
	    if( xhr.status == 200 ) {
		saveAs(xhr.response, ref_id + ".jpg");
	    }
	    clearInterval(timerId);
	    tag.show();
	}).send();
    }


/* public properties & methods */
    return {
	startup: function(tags, y, years, perm) {
	    _perm = perm;
	    _perm.rows = perm.rows == null || perm.rows <= 0 ? 100 : perm.rows;
	    _tags = tags;
	    _tags.body.html(_getbody(y, years, perm).join(""));
	    _tags.tbody = _("maintb");
	    _tags.f = _("plugFilter");
	    _tags.ts = _("timestamp");
	    _tags.total = _("plugTotal");
	    _tags.years = _("plugYears");
	    _tags.popups = {};
	    _cache.params = {};
	    if( years == null ) {
		_tags.tbody.html(_datamsg(lang.failure, _perm).join(""));
	    } else if( !Array.isArray(years) || years.length == 0 ) {
		_tags.tbody.html(_datamsg(lang.empty, _perm).join(""));
	    } else {
		_cache.params.plug = _code;
		_cache.params.year = y;
		_datareq();
	    }
	},
	refresh: function() {
	    _togglePopup();
	    _tags.popups = {};
	    _datareq();
	},
	filter: function(tag, ev) {
	    return Filter.onkeyup(tag, ev, function() {
		_togglePopup();
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
	moveto: function(tag, y) {
	    _togglePopup();
	    if( _cache.params.year != y ) {
		_unselectYears()
		tag.addClass('selected');
		_cache.params.year = y;
		_tags.popups = {};
		_datareq();
		history.replaceState(_cache.params, "", G.getdefref({plug: _code, year: _cache.params.year}));
	    }
	},
	regions: function(tag, offset) {
	    _togglePopup("regions", tag, offset, function(obj) {
		return RegionsPopup(_getobject(obj), function(arg, i, ar) {
		    _onpopup(tag, arg, "region_id");
		})
	    });
	},
	channels: function(tag, offset) {
	    _togglePopup("channels", tag, offset, function(obj) {
		return ChannelsPopup(_getobject(obj), function(arg, i, ar) {
		    _onpopup(tag, arg, "chan_id");
		})
	    });
	},
	potentials: function(tag, offset) {
	    _togglePopup("potentials", tag, offset, function(obj) {
		return PotentialsPopup(_getobject(obj), function(arg, i, ar) {
		    _onpopup(tag, arg, "poten_id");
		})
	    });
	},
	retail_chains: function(tag, offset) {
	    _togglePopup("retail_chains", tag, offset, function(obj) {
		return RetailChainsPopup(_getobject(obj), function(arg, i, ar) {
		    _onpopup(tag, arg, "rc_id");
		})
	    });
	},
	placements: function(tag, offset) {
	    _togglePopup("placements", tag, offset, function(obj) {
		return PlacementsPopup(_getobject(obj), function(arg, i, ar) {
		    _onpopup2(tag, arg, "placement_id");
		})
	    });
	},
	asp_types: function(tag, offset) {
	    _togglePopup("asp_types", tag, offset, function(obj) {
		return ASPTypesPopup(_getobject(obj), function(arg, i, ar) {
		    _onpopup2(tag, arg, "asp_type_id");
		})
	    });
	},
	brands: function(tag, offset) {
	    _togglePopup("brands", tag, offset, function(obj) {
		return BrandsPopup(_getobject(obj), function(arg, i, ar) {
		    _onpopup2(tag, arg, "brand_id");
		})
	    });
	},
	photo_types: function(tag, offset) {
	    _togglePopup("photo_types", tag, offset, function(obj) {
		return PhotoTypesPopup(_getobject(obj), function(arg, i, ar) {
		    _onpopup2(tag, arg, "photo_type_id");
		})
	    });
	},
	more: function(arg0, arg1) {
	    _morereq(arg0, arg1);
	},
	slideshow: function(blobs, position) {
	    var ar = [];
	    blobs.forEach(function(arg) { ar.push(G.getdataref({plug: _code, blob_id: arg})); });
	    SlideshowSimple(ar, {idx: position}).show();
	},
	save: function(tag, ref_id) {
	    _saveJpeg(tag, ref_id);
	}
    }
})();


function startup(y, years, perm) {
    PLUG.startup({body: _('pluginContainer')}, y, years, perm);
}

window.onpopstate = function(event) {
    window.location.reload(true);
}
