/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "trainings";
    var _cache = {}, _perm = {}, _tags = {}, _F = false /* abort exporting photos */;;

    function _fmtcontact(d) {
	return lang.personFormat.format({name: G.shielding(d.name), patronymic: G.shielding(d.patronymic), surname: G.shielding(d.surname)});
    }

    function _getcolumns(perm) {
	return 12 + (perm.columns == null ? 0 : (
	    (perm.columns.channel == true ? 1 : 0) + 
	    (perm.columns.brand == true ? 1 : 0) +
	    (perm.columns.head == true ? 1 : 0)
	));
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.trainings.title1, "</span>&nbsp;");
	ar.push("<a id='plugCal' href='javascript:void(0);' onclick='PLUG.calendar(this)'>[&nbsp;-&nbsp;]</a>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	if( perm.csv ) {
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.csv(this)'>", lang.export.csv, "</a>");
	}
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
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.tms(this, 0.6)'>", lang.training_material, "</a></th>");
	if( perm.columns != null && perm.columns.brand == true ) {
	    ar.push("<th><a href='javascript:void(0)' onclick='PLUG.brands(this, 0.65)'>", lang.brand, "</a></th>");
	}
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.contacts(this, 0.65)'>", lang.contact, "</a></th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.jobs(this, 0.70)'>", lang.job_title, "</a></th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.types(this, 0.85)'>", lang.training_type, "</a></th>");
	ar.push("<th>", lang.photo, "</th>");
	ar.push("<th>", lang.note, "</th>");
	if( perm.columns != null && perm.columns.head == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	}
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(MonthsPopup.container());
	ar.push(BrandsPopup.container());
	ar.push(ChannelsPopup.container());
	ar.push(ContactsPopup.container());
	ar.push(JobTitlesPopup.container());
	ar.push(RetailChainsPopup.container());
	ar.push(TrainingMaterialsPopup.container());
	ar.push(TrainingTypesPopup.container());
	ar.push(UsersPopup.container());
	ar.push(UsersPopup.container("headsPopup"));
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
	return Filter(a.join(' '), false, {
	    doc_id:true,
	    fix_dt:true, 
	    user_id:true, dev_login:true, u_name:true, 
	    account_id:true, a_code:true, a_name:true, address:true, 
	    chan_id: true, chan:true, 
	    poten:true, 
	    rc_id:true, rc:true, ka_code:true, 
	    region:true, 
	    city:true, 
	    tm_id:true,
	    brand_id:true,
	    contact_id:true,
	    job_title_id:true,
	    training_type_id:true,
	    doc_note:true,
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
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.doc_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.doc_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td class='date delim'>", G.getdatetime_l(Date.parseISO8601(r.fix_dt)), "</td>");
		    ar.push("<td class='string sw95px delim'>", G.shielding(r.u_name), "</td>");
		    ar.push("<td class='int'>", G.shielding(r.a_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string note" + (perm.columns != null && perm.columns.channel == true ? "" : " delim") + 
			"'>", G.shielding(r.address), "</td>");
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px delim'>", G.shielding(r.chan), "</td>");
		    }
		    ar.push("<td class='string note'>", G.shielding(r.tm), "</td>");
		    if( perm.columns != null && perm.columns.brand == true ) {
			ar.push("<td class='ref'>", G.shielding(r.brand), "</td>");
		    }
		    ar.push("<td class='string'>", _fmtcontact(r), "</td>");
		    ar.push("<td class='ref'>", G.shielding(r.job_title), "</td>");
		    ar.push("<td class='ref'>", G.shielding(r.training_type), "</td>");
		    ar.push("<td class='ref'>");
		    if( Array.isArray(r.photos) ) {
			r.photos.forEach(function(arg0, arg1, arg2) {
			    ar.push("<p><a href='javascript:void(0)' onclick='PLUG.slideshow([" + arg2.join(',') + "]," +
				(arg1+1) + ")'>[&nbsp;" + (arg1+1) + "&nbsp;]</a></p>");
			});
		    }
		    ar.push("</td>");
		    ar.push("<td class='string note" + (perm.columns != null && perm.columns.head == true ? " delim" : "") + 
			"'>", G.shielding(r.doc_note), "</td>");
		    if( perm.columns != null && perm.columns.head == true ) {
			ar.push("<td class='string sw95px'>", G.shielding(r.head_name), "</td>");
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
	var sp;
	_tags.tbody.hide();
	_tags.total.html("");
	sp = spinnerLarge(_tags.body, "50%", "50%");
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getajax({plug: _code, year: y, month: m}), "json-js", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_cache.data = data;
		_tags.tbody.html(_datatbl(data, 1, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
	    } else {
		_tags.tbody.html(_datamsg(lang.failure, _perm).join(""));
	    }
	    _tags.ts.html(G.getdatetime_l(new Date()));
	    _tags.tbody.show();
	    sp.stop();
	}).send();
	_cache.y = y; _cache.m = m;
	_tags.cal.html(G.getlongmonth_l(new Date(y, m - 1, 1)).toLowerCase());
    }

    function _page(page) {
	var sp;
	if( _cache.data != null ) {
	    _tags.tbody.hide();
	    _tags.total.html("");
	    sp = spinnerLarge(_tags.body, "50%", "50%");
	    setTimeout(function() {
		_tags.tbody.html(_datatbl(_cache.data, page, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
		_tags.tbody.show();
		sp.stop();
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
	tms: function(tag, offset) {
	    _togglePopup("tms", tag, offset, function(obj) {
		return TrainingMaterialsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "tm_id");
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
	contacts: function(tag, offset) {
	    _togglePopup("contacts", tag, offset, function(obj) {
		return ContactsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "contact_id");
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
	types: function(tag, offset) {
	    _togglePopup("types", tag, offset, function(obj) {
		return TrainingTypesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "training_type_id");
		})
	    });
	},
	slideshow: function(blobs, position) {
	    var ar = [];
	    blobs.forEach(function(arg) { ar.push(G.getajax({plug: _code, blob: "yes", blob_id: arg})); });
	    SlideshowSimple(ar, {idx: position}).show();
	},
	csv: function() {
	    var ar = [];
	    if( _cache.data != null && Array.isArray(_cache.data._rows) ) {
		_cache.data._rows.forEach(function(r, i) {
		    ar.push(r);
		});
	    }
	    G.tocsv(_code, ar, _perm.csv);
	},
	zip: function(tag0, tag1, span) {
	    var ar = [], exist = {};
	    if( _cache.data != null && Array.isArray(_cache.data._rows) ) {
		_cache.data._rows.forEach(function(r, i) {
		    if( r.photos != null ) {
			for( var n = 0, size = r.photos.length; n < size; n++ ) {
			    ar.push({params: r, blob_id: r.photos[n]});
			}
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


function startup(tag, y, m, perm) {
    PLUG.startup({body: tag}, y, m, perm);
}

window.onpopstate = function(event) {
    window.location.reload(true);
}
