/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "additions";
    var _cache = {}, _perm = {}, _tags = {};
    var _statusColumn = 2;

    function _getcolumns(perm) {
	let x = 10, c = perm.columns || {};
	if( perm.validate == true ) x++;
	if( perm.reject == true ) x++;
	if( c.channel == true ) x++;
	if( c.addition_type == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.additions.title, "</span>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th class='date'>", lang.created_date, "</th>");
	ar.push("<th class='bool'>", "&#x2610;", "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"user\",0.2)'>", lang.u_name, "</a></th>");
	ar.push("<th>", lang.a_code, "</th>");
	ar.push("<th>", lang.a_name, "</th>");
	ar.push("<th>", lang.address, "</th>");
	if( perm.columns != null && perm.columns.channel == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.channels(this)'>", lang.chan_name, "</a></th>");
	}
	if( perm.columns != null && perm.columns.addition_type == true ) {
	    ar.push("<th width='190px'><a href='javascript:void(0)' onclick='PLUG.types(this,0.75)'>", lang.additions.types, "</th>");
	}
	if( perm.validate ) {
	    ar.push("<th width='27px' class='symbol'>", "&#x2713;", "</th>");
	}
	if( perm.reject ) {
	    ar.push("<th width='27px' class='symbol'>", "&#x2421;", "</th>");
	}
	ar.push("<th>", lang.note, "</th>");
	ar.push("<th>", lang.photo, "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(AdditionTypesPopup.container());
	ar.push(ChannelsPopup.container());
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
	    a_code:true, a_name:true, address:true, geo_address:true,
	    chan_id:true, chan:true, 
	    addition_type_id:true, addition_type:true, 
	    head_id:true
	});
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z;
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.doc_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.doc_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td class='date", r.rejected ? " disabled" : "", "'>", 
			G.getdatetime_l(Date.parseISO8601(r.fix_dt)), "</td>");
		    if( r.rejected ) {
			ar.push("<td class='bool footnote' data-title='", lang.additions.rejected, "'>", "&#x2715;", "</td>");
		    } else if( r.validated && (r.v_name || r.v_code) ) {
			ar.push("<td class='bool footnote' data-title='", lang.additions.accepted[0].format_a(G.shielding(r.v_name || r.v_code)),
			    "'>", lang.plus, "</td>");
		    } else if( r.validated ) {
			ar.push("<td class='bool footnote' data-title='", lang.additions.accepted[1], "'>", lang.plus, "</td>");
		    } else {
			ar.push("<td class='bool'>", "&nbsp", "</td>");
		    }
		    ar.push("<td class='string sw95px", r.rejected ? " disabled" : "", "'>", G.shielding(r.u_name), "</td>");
		    ar.push("<td class='string", r.rejected ? " disabled" : "", "'>", G.shielding(r.a_code), "</td>");
		    ar.push("<td class='string a_name", r.rejected ? " disabled" : "", "'>");
		    ar.push(G.shielding(r.a_name));
		    if( !String.isEmpty(r.number) ) {
			ar.push("<hr/><div class='row remark'><i>", G.shielding(r.number), "</i></div>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string a_address", r.rejected ? " disabled" : "", "'>");
		    if( !String.isEmpty(r.address) ) {
			ar.push("<div class='row'>", G.shielding(r.address), "</div>");
		    }
		    if( !String.isEmpty(r.geo_address) ) {
			ar.push("<hr/><div class='row remark'><i>", G.shielding(r.geo_address), "</i></div>");
		    }
		    ar.push("</td>");
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px", r.rejected ? " disabled" : "", "'>", G.shielding(r.chan), "</td>");
		    }
		    if( perm.columns != null && perm.columns.addition_type == true ) {
			ar.push("<td class='ref sw95px", r.rejected ? " disabled" : "","'>", G.shielding(r.addition_type), "</td>");
		    }
		    if( perm.validate ) {
			if( !r.validated && !r.rejected ) {
			    ar.push("<td class='ref footnote' data-title='{0}'>".format_a(lang.additions.accept),
				"<a class='symbol' href='javascript:void(0)' onclick='PLUG.validate(this,{0},\"{1}\")'>"
				    .format_a(r.row_no, r.doc_id), "&#x2713", "</a>", "</td>");
			} else {
			    ar.push("<td class='ref'>","</td>");
			}
		    }
		    if( perm.reject ) {
			if( !r.rejected ) {
			    ar.push("<td class='ref footnote' data-title='{0}'>".format_a(lang.additions.reject),
				"<a class='attention symbol' href='javascript:void(0)' onclick='PLUG.reject(this,{0},\"{1}\")'>"
				    .format_a(r.row_no, r.doc_id), "&#x2715", "</a>", "</td>");
			} else {
			    ar.push("<td class='ref'>","</td>");
			}
		    }
		    ar.push("<td class='ref note", r.rejected ? " disabled" : "","'>");
		    if( Array.isArray(r.attrs) ) {
			r.attrs.forEach(function(arg0, arg1, arg2) {
			    ar.push("<div class='row'>", G.shielding(arg0), "</div>");
			});
		    }
		    if( !String.isEmpty(r.note) ) {
			ar.push("<div class='row'><i>", G.shielding(r.note), "</i></div>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref'>");
		    if( Array.isArray(r.photos) ) {
			r.photos.forEach(function(arg0, arg1, arg2) {
			    ar.push("<p><a href='javascript:void(0)' onclick='PLUG.slideshow([" + arg2.join(',') + "]," +
				(arg1+1) + ")'>[&nbsp;" + (arg1+1) + "&nbsp;]</a></p>");
			});
		    }
		    ar.push("</td>");
		    ar.push("<td class='string", r.rejected ? " disabled" : "","'>", G.shielding(r.head_name), "</td>");
		    ar.push("</tr>");
		}
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

    function _datareq() {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getajax({plug: _code}), "json", function(xhr, data) {
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

    function _changeStatus(self, method, row_no, doc_id) {
	ProgressDialog.show();
	self.style.visibility = 'hidden';
	G.xhr(method, G.getajax({plug: _code, doc_id: doc_id, _datetime: G.getdatetime(new Date())}), "", function(xhr) {
	    if( xhr.status == 200 ) {
		_cache.data.rows[row_no-1][method == 'PUT' ? 'validated' : 'rejected'] = true;
		for(var i = 0, cells = self.parentNode.parentNode.cells, size = cells.length; i < size; i++ ) {
		    var x = cells[i];
		    if( i == _statusColumn ) {
			x.html(method == 'PUT' ? lang.plus : '&#x2715');
			x.removeClass('disabled');
			x.addClass('footnote');
			x.setAttribute('data-title', method == 'PUT' ? lang.additions.accepted[1] : lang.additions.rejected);
		    } else {
			if( method != 'PUT' )  {
			    x.addClass('disabled');
			} else {
			    x.removeClass('disabled');
			}
		    }
		}
		self.parentNode.removeClass('footnote');
		self.remove();
	    } else {
		self.style.visibility = 'visible';
		Toast.show(lang.errors.runtime);
	    }
	    ProgressDialog.hide();
	}).send();
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
	types: function(tag, offset) {
	    _togglePopup("types", tag, offset, function(obj) {
		return AdditionTypesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "addition_type_id");
		})
	    });
	},
	slideshow: function(blobs, position) {
	    var ar = [];
	    blobs.forEach(function(arg) { ar.push(G.getajax({plug: _code, blob: "yes", blob_id: arg})); });
	    SlideshowSimple(ar, {idx: position}).show();
	},
	validate: function(tag, row_no, doc_id) {
	    _changeStatus(tag, "PUT", row_no, doc_id);
	},
	reject: function(tag, row_no, doc_id) {
	    _changeStatus(tag, "DELETE", row_no, doc_id);
	}
    }
})();


function startup(perm) {
    PLUG.startup({body: _('pluginContainer')}, perm);
}
