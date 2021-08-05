/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "contacts";
    var _cache = {}, _perm = {}, _tags = {};


    function _fmtcontact(d) {
	return lang.personFormat.format({name: G.shielding(d.name), patronymic: G.shielding(d.patronymic), surname: G.shielding(d.surname)});
    }

    function _getcolumns(perm) {
	let x = 11, c = perm.columns || {};
	if( c.channel == true ) x++;
	if( c.loyalty == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.contacts.title, "</span>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.xlsx(this)'>", lang.export.xlsx, "</a>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th>", lang.contact, "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.jobs(this, 0.30)'>", lang.job_title, "</a></th>");
	if( perm.columns != null && perm.columns.loyalty == true ) {
	    ar.push("<th width='65px'><a href='javascript:void(0)' onclick='PLUG.levels(this, 0.30)'>", lang.loyalty_level, "</a></th>");
	}
	ar.push("<th width='95px'>", lang.mobile, "</th>");
	ar.push("<th>", lang.email, "</th>");
	ar.push("<th>", lang.a_code, "</th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.retail_chains(this)'>", lang.a_name, "</a></th>");
	ar.push("<th>", lang.address, "</th>");
	if( perm.columns != null && perm.columns.channel == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.channels(this)'>", lang.chan_name, "</a></th>");
	}
	ar.push("<th>", lang.note, "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"author\",0.90)'>", lang.author, "</a></th>");
	ar.push("<th>", "&#9850;", "</th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(ChannelsPopup.container());
	ar.push(RetailChainsPopup.container());
	ar.push(JobTitlesPopup.container());
	ar.push(LoyaltyLevelsPopup.container());
	ar.push(UsersPopup.container("authorsPopup"));
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
	    account_id: true, 
	    a_code: true, 
	    a_name: true, 
	    address: true,
	    chan_id: true, 
	    chan: true,
	    poten: true,
	    rc_id: true, 
	    rc: true, 
	    ka_type: true,
	    region: true,
	    city: true,
	    contact_id: true,
	    name: true, 
	    surname: true, 
	    patronymic: true, 
	    mobile: true, 
	    email: true,
	    job_title_id: true, 
	    job_title: true,
	    loyalty_level_id: true,
	    extra_info: true,
	    author_id: true, 
	    author: true
	});
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z;
	data._rows = [];
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    var xs = "";
		    if( r.a_hidden ) {
			xs = " strikethrough attention";
		    } else if ( r.a_locked ) {
			xs = " strikethrough";
		    }
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.contact_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.contact_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td class='string'>", _fmtcontact(r), "</td>");
		    if( r.locked ) {
			ar.push("<td class='ref strikethrough footnote' data-title='", lang.contacts.footnote0, "'>", 
			    G.shielding(r.job_title), "</td>");
		    } else {
			ar.push("<td class='ref'>", G.shielding(r.job_title), "</td>");
		    }
		    if( perm.columns != null && perm.columns.loyalty == true ) {
			ar.push("<td class='ref'>", G.shielding(r.loyalty_level), "</td>");
		    }
		    ar.push("<td class='int'>", G.shielding(r.mobile), "</td>");
		    ar.push("<td class='int'>", G.shielding(r.email), "</td>");
		    ar.push("<td class='int", xs, "'>", G.shielding(r.a_code), "</td>");
		    ar.push("<td class='string a_name", xs, "'>", G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string a_address", xs, "'>", G.shielding(r.address), "</td>");
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px'>", G.shielding(r.chan), "</td>");
		    }
		    ar.push("<td class='string note'>", G.shielding(r.extra_info), "</td>");
		    ar.push("<td class='string sw95px'>", G.shielding(r.author), "</td>");
		    ar.push("<td width='14px' class='int'>", r._isaliendata ? "&#9850;" : "&nbsp;", "</td>");
		    ar.push("</tr>");
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

    function _datareq() {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getdataref({plug: _code}), "json", function(xhr, data) {
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
		    for( var i = 0, size = Math.min(ar.length,1048576 - offset), x; i < size; i++ ) {
			r = ar[i];
			ws.cell("A{0}".format_a(i + offset)).value(r.row_no);
			ws.cell("B{0}".format_a(i + offset)).value(r.contact_id);
			ws.cell("C{0}".format_a(i + offset)).value(_fmtcontact(r));
			ws.cell("D{0}".format_a(i + offset)).value(r.job_title);
			ws.cell("E{0}".format_a(i + offset)).value(r.loyalty_level);
			ws.cell("F{0}".format_a(i + offset)).value(r.mobile);
			ws.cell("G{0}".format_a(i + offset)).value(r.email);
			ws.cell("H{0}".format_a(i + offset)).value(r.a_code);
			ws.cell("I{0}".format_a(i + offset)).value(r.a_name);
			ws.cell("J{0}".format_a(i + offset)).value(r.address);
			ws.cell("K{0}".format_a(i + offset)).value(r.chan);
			ws.cell("L{0}".format_a(i + offset)).value(r.poten);
			ws.cell("M{0}".format_a(i + offset)).value(r.region);
			ws.cell("N{0}".format_a(i + offset)).value(r.city);
			ws.cell("O{0}".format_a(i + offset)).value(r.rc);
			ws.cell("P{0}".format_a(i + offset)).value(r.ka_type);
			ws.cell("Q{0}".format_a(i + offset)).value(r.doc_note);
			ws.cell("R{0}".format_a(i + offset)).value(r.author);
			ws.cell("S{0}".format_a(i + offset)).value(/*Date.parseISO8601(*/r.updated_ts/*)*/);
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
	jobs: function(tag, offset) {
	    _togglePopup("job_titles", tag, offset, function(obj) {
		return JobTitlesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "job_title_id");
		})
	    });
	},
	levels: function(tag, offset) {
	    _togglePopup("loyalty_levels", tag, offset, function(obj) {
		return LoyaltyLevelsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "loyalty_level_id");
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
