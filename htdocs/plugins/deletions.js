/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "deletions";
    var _cache = {}, _perm = {}, _tags = {};
    var _statusColumn = 2;

    function _getcolumns(perm) {
	let x = 10, c = perm.columns || {};
	if( perm.validate == true ) x++;
	if( perm.reject == true ) x++;
	if( c.channel == true ) x++;
	if( c.potential == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.deletions.title, "</span>");
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
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.retail_chains(this)'>", lang.a_name, "</a></th>");
	ar.push("<th>", lang.address, "</th>");
	if( perm.columns != null && perm.columns.channel == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.channels(this)'>", lang.chan_name, "</a></th>");
	}
	if( perm.columns != null && perm.columns.potential == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.potens(this)'>", lang.poten, "</a></th>");
	}
	if( perm.validate ) {
	    ar.push("<th width='27px' class='symbol'>", "&#x2713;", "</th>");
	}
	if( perm.reject ) {
	    ar.push("<th width='27px' class='symbol'>", "&#x2715", "</th>");
	}
	ar.push("<th>", lang.photo, "</th>");
	ar.push("<th>", lang.note, "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(ChannelsPopup.container());
	ar.push(PotentialsPopup.container());
	ar.push(RetailChainsPopup.container());
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
	    "poten_id", 
	    "poten",
	    "rc_id", 
	    "rc", 
	    "ka_type", 
	    "region", 
	    "city", 
	    "head_id"
	]);
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z;
	for( var i = 0, k = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.account_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.account_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td class='date", r.rejected ? " disabled" : "", "'>", 
			G.getdatetime_l(Date.parseISO8601(r.fix_dt)), "</td>");
		    if( r.rejected ) {
			ar.push("<td class='bool footnote' data-title='", lang.deletions.rejected, "'>", "&#x2715;", "</td>");
		    } else if( r.validated && (r.v_name || r.v_code) ) {
			ar.push("<td class='bool footnote' data-title='", lang.deletions.accepted[0].format_a(G.shielding(r.v_name || r.v_code)),
			    "'>", lang.plus, "</td>");
		    } else if( r.validated ) {
			ar.push("<td class='bool footnote' data-title='", lang.deletions.accepted[1], "'>", lang.plus, "</td>");
		    } else {
			ar.push("<td class='bool'>", "&nbsp", "</td>");
		    }
		    ar.push("<td class='string sw95px", r.rejected ? " disabled" : "", "'>", 
			G.shielding(r.u_name), "</td>");
		    ar.push("<td class='int", r.closed ? " strikethrough attention" : "", r.rejected ? " disabled" : "", "'>", 
			G.shielding(r.a_code), "</td>");
		    ar.push("<td class='string a_name", r.closed ? " strikethrough attention" : "", r.rejected ? " disabled" : "", "'>", 
			G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string address", r.closed ? " strikethrough attention" : "", r.rejected ? " disabled" : "", 
			"'>", G.shielding(r.address), "</td>");
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px", r.rejected ? " disabled" : "", "'>", G.shielding(r.chan), "</td>");
		    }
		    if( perm.columns != null && perm.columns.potential == true ) {
			ar.push("<td class='ref sw95px", r.rejected ? " disabled" : "", "'>", G.shielding(r.poten), "</td>");
		    }
		    if( perm.validate ) {
			if( !r.validated /*&& !r.rejected*/ && !r.closed ) {
			    ar.push("<td class='ref footnote' data-title='{0}'>".format_a(lang.deletions.accept),
				"<a class='symbol' href='javascript:void(0)' onclick='PLUG.validate(this,{0},\"{1}\")'>"
				    .format_a(r.row_no, r.account_id), "&#x2713", "</a>", "</td>");
			} else {
			    ar.push("<td class='ref'>","</td>");
			}
		    }
		    if( perm.reject ) {
			if( !r.rejected ) {
			    ar.push("<td class='ref footnote' data-title='{0}'>".format_a(lang.deletions.reject),
				"<a class='attention symbol' href='javascript:void(0)' onclick='PLUG.reject(this,{0},\"{1}\")'>"
				    .format_a(r.row_no, r.account_id), "&#x2715", "</a>", "</td>");
			} else {
			    ar.push("<td class='ref'>","</td>");
			}
		    }
		    ar.push("<td class='ref'>");
		    if( String.isEmpty(r.photo) ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<img class='clickable' onclick='PLUG.slideshow(" + r.photo + ")' height='90px' " + (k>=20?"data-src='":"src='") +
			    G.getdataref({plug: _code, blob: "yes", thumb: "yes", blob_id: r.photo}) + "' />");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string note'>", G.shielding(r.note), "</td>");
		    ar.push("<td class='string sw95px", r.rejected ? " disabled" : "","'>", G.shielding(r.head_name), "</td>");
		    ar.push("</tr>");
		    k++;
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
	G.xhr("GET", G.getdataref({plug: _code}), "json", function(xhr, data) {
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

    function _changeStatus(self, method, row_no, account_id) {
	ProgressDialog.show();
	self.style.visibility = 'hidden';
	G.xhr(method, G.getdataref({plug: _code, account_id: account_id, _datetime: G.getdatetime(new Date())}), "", function(xhr) {
	    if( xhr.status == 200 ) {
		_cache.data.rows[row_no-1][method == 'PUT' ? 'validated' : 'rejected'] = true;
		for(var i = 0, cells = self.parentNode.parentNode.cells, size = cells.length; i < size; i++ ) {
		    var x = cells[i];
		    if( i == _statusColumn ) {
			x.html(method == 'PUT' ? lang.plus : '&#x2715');
			x.removeClass('disabled');
			x.addClass('footnote');
			x.setAttribute('data-title', method == 'PUT' ? lang.deletions.accepted[1] : lang.deletions.rejected);
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
	potens: function(tag, offset) {
	    _togglePopup("potentials", tag, offset, function(obj) {
		return PotentialsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "poten_id");
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
	slideshow: function(blob_id) {
	    SlideshowSimple([G.getdataref({plug: _code, blob: "yes", blob_id: blob_id})]).show();
	},
	validate: function(tag, row_no, account_id) {
	    _changeStatus(tag, "PUT", row_no, account_id);
	},
	reject: function(tag, row_no, account_id) {
	    _changeStatus(tag, "DELETE", row_no, account_id);
	}
    }
})();


function startup(perm) {
    PLUG.startup({body: _('pluginContainer')}, perm);
}
