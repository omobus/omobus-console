/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "confirmations";
    var _cache = {}, _perm = {}, _tags = {}, _F = false /* abort export photos */, _onlyUnchecked = null;

    function _getcolumns(perm) {
	let x = 11, c = perm.columns || {};
	if( c.channel == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.confirmations.title1, "</span>&nbsp;");
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
	if( perm.remark ) {
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.toggle(this)'>",
		lang.remark.unchecked, "</a>");
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
	ar.push("<th>", lang.targets.subject.caption, "</th>");
	ar.push("<th>", lang.photo, "</th>");
	ar.push("<th width='260px'><a href='javascript:void(0)' onclick='PLUG.confirmation_types(this,0.65)'>", lang.targets_compliance.confirmations, "</a></th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"author\",0.9)'>", lang.author, "</a></th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(Popup.container());
	ar.push(MonthsPopup.container());
	ar.push(ConfirmationTypesPopup.container());
	ar.push(ChannelsPopup.container());
	ar.push(RetailChainsPopup.container());
	ar.push(UsersPopup.container());
	ar.push(UsersPopup.container("authorsPopup"));
	ar.push(UsersPopup.container("headsPopup"));
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
	    "doc_id",
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
	    "confirmation_type_id", 
	    "confirm",
	    "doc_note",
	    "target_id", 
	    "subject", 
	    "body", 
	    "b_date", 
	    "e_date", 
	    "succeeded",
	    "author_id",
	    "head_id",
	    "remark.status"
	]);
    }

    function _targettbl(r) {
	var ar = [], z;
	ar.push("<div>", G.shielding(r.target_type), "</div>");
	ar.push("<div>", "{0}:&nbsp;<i>{1}</i>&nbsp;-&nbsp;<i>{2}</i>".format_a(lang.validity, G.getlongday_l(Date.parseISO8601(r.b_date)),
	    G.getlongday_l(Date.parseISO8601(r.e_date))), "</div>");
	ar.push("<hr />");
	ar.push("<div>", G.shielding(r.body), "</div>");
	ar.push("<hr />");
	ar.push("<div class='r watermark'>", "{0} / {1}".format_a(G.shielding(r.target_id), r.updated_ts), "</div>");
	return ar;
    }

    function _remarktbl() {
	var ar = [];
	ar.push("<h1>", lang.remark.caption, "</h1>");
	ar.push("<div onclick='event.stopPropagation();'>");
	ar.push("<p>");
	ar.push("<div class='row'>", lang.notices.remark, "</div>");
	ar.push("</p>");
	ar.push("<div class='row attention gone' id='re:alert'></div>");
	ar.push("<div class='row'><textarea id='re:note' rows='3' maxlength='1024' autocomplete='off' placeholder='",
	    lang.remark.placeholder, "'></textarea></div>");
	ar.push("<br/>");
	ar.push("<div align='center'>");
	ar.push("<button id='re:accept' disabled='true'>", lang.remark.accept, "</button>");
	ar.push("&nbsp;&nbsp;");
	ar.push("<button id='re:reject' disabled='true'>", lang.remark.reject, "</button>");
	ar.push("</div>");
	ar.push("</div>");
	return ar;
    }

    function _remarkNote(type, note) {
	var n = [];
	if( !String.isEmpty(type) ) {
	    n.push(G.shielding(type));
	}
	if( !String.isEmpty(note) ) {
	    n.push(G.shielding(note));
	}
	return n;
    }

    function _remarkStyle(r) {
	var xs = [], n;
	if( typeof r != 'undefined' ) {
	    if( r.status == 'accepted' || r.status == 'rejected' ) {
		xs.push(" ", r.status, " footnote_L' data-title='", lang.remark[r.status]);
		if( (n = _remarkNote(r.type, r.note)).length > 0 ) {
		    xs.push(": ", n.join(". "), ".");
		}
	    }
	}
	return xs;
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z;
	data._rows = [];
	for( var i = 0, k = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) && (_onlyUnchecked == null || typeof r.remark == 'undefined') ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    var b = 1, blobs = [];
		    if( !(r.blob_id == null || r.blob_id == "") ) {
			blobs.push(r.blob_id);
		    }
		    if( Array.isArray(r.photos) ) {
			r.photos.forEach(function(arg) {
			    blobs.push(arg);
			});
		    }
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.doc_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.doc_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td class='date'>", G.getdatetime_l(Date.parseISO8601(r.fix_dt)), "</td>");
		    ar.push("<td class='string sw95px'>", G.shielding(r.u_name), "</td>");
		    ar.push("<td class='int'>", G.shielding(r.a_code), "</td>");
		    ar.push("<td class='string a_name'>", G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string address'>", G.shielding(r.address), "</td>");
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px'>", G.shielding(r.chan), "</td>");
		    }
		    ar.push("<td class='ref'><span onclick='PLUG.more(this," + r.row_no + ",0.70)'>", G.shielding(r.subject), "</span></td>");
		    ar.push("<td class='ref'>");
		    if( r.blob_id == null || r.blob_id == "" ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<img class='clickable' onclick='PLUG.slideshow([" + blobs.join(',') + "]," + b + ")' height='90px' " +
			    (k>=20?"data-src='":"src='") + G.getdataref({plug: _code, blob: "yes", thumb: "yes", blob_id: r.blob_id}) + "'/>");
			b++;
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref", _remarkStyle(r.remark).join(''), "'>");
		    ar.push("<div>");
		    ar.push("<div class='row'>");
		    if( perm.remark == true ) {
			ar.push("<span onclick='PLUG.remark(this," + r.row_no + ",0.80)'>");
		    }
		    ar.push(G.shielding(r.confirm, lang.dash));
		    if( perm.remark == true ) {
			ar.push("</span>");
		    }
		    ar.push("</div>");
		    if( !String.isEmpty(r.doc_note) ) {
			ar.push("<div class='row'><b>", G.shielding(r.doc_note), "</b></div>");
		    }
		    if( Array.isArray(r.photos) ) {
			ar.push("<div class='row'>");
			r.photos.forEach(function(arg1, index1, array1) {
			    if( index1 > 0 ) {
				ar.push("&nbsp;&nbsp;");
			    }
			    ar.push("<a href='javascript:void(0)' onclick='PLUG.slideshow([" + blobs.join(',') + "]," + b + ")'>[&nbsp;" +
				(index1+1) + "&nbsp;]</a>");
			    b++;
			});
			ar.push("</div>");
		    }
		    ar.push("</div>");
		    ar.push("</td>");
		    ar.push("<td class='string sw95px'>", G.shielding(r.head_name), "</td>");
		    ar.push("<td class='string sw95px'>", G.shielding(r.author_name), "</td>");
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
	G.xhr("GET", G.getdataref({plug: _code, year: y, month: m}), "json-js", function(xhr, data) {
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
	    _tags.more.hide();
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

    function _toxlsx() {
	var ar = [], data_ts;
	var func = function(data_ts, ar, templ) {
	    XlsxPopulate.fromDataAsync(templ)
		.then(wb => {
		    var offset = 3;
		    var ws = wb.sheet(0);
		    wb.properties()._node.children = [];
		    wb.property('Title', lang.confirmations.title);
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
			ws.cell("N{0}".format_a(i + offset)).value(r.target_id);
			ws.cell("O{0}".format_a(i + offset)).value(r.subject);
			ws.cell("P{0}".format_a(i + offset)).value(r.body);
			ws.cell("Q{0}".format_a(i + offset)).value(r.target_type);
			ws.cell("R{0}".format_a(i + offset)).value(Date.parseISO8601(r.b_date));
			ws.cell("S{0}".format_a(i + offset)).value(Date.parseISO8601(r.e_date));
			if( typeof r.ref != 'undefined' ) {
			    ws.cell("T{0}".format_a(i + offset)).value("[ 1 ]")
				.style({ fontColor: "0563c1", underline: true })
				.hyperlink({ hyperlink: G.getphotoref(r.ref,true) });
			}
			ws.cell("U{0}".format_a(i + offset)).value(r.confirm);
			ws.cell("V{0}".format_a(i + offset)).value(r.succeeded);
			if( Array.isArray(r.refs) && r.refs.length > 0 ) {
			    const n = ["W","X","Y","Z","AA","AB"];
			    r.refs.forEach(function(val, index) {
				ws.cell("{1}{0}".format_a(i + offset,n[index])).value("[ {0} ]".format_a(index + 1))
				    .style({ fontColor: "0563c1", underline: true })
				    .hyperlink({ hyperlink: G.getphotoref(r.refs[index],true) });
			    });
			}
			ws.cell("AC{0}".format_a(i + offset)).value(r.doc_note);
			ws.cell("AD{0}".format_a(i + offset)).value(r.head_name);
			ws.cell("AE{0}".format_a(i + offset)).value(r.author_name);
			if( typeof r.remark != 'undefined' ) {
			    ws.cell("AF{0}".format_a(i + offset)).value(r.remark.status);
			    ws.cell("AG{0}".format_a(i + offset)).value(r.remark.type);
			    ws.cell("AH{0}".format_a(i + offset)).value(r.remark.note);
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
	    _tags.more = new Popup();
	    _tags.popups = {};
	    _cache.remarks = {}
	    _datareq(y, m);
	},
	refresh: function() {
	    _togglePopup();
	    _tags.popups = {};
	    _tags.more.hide();
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
		    _tags.more.hide();
		}, {year: _cache.y, month: _cache.m, uri: G.getdataref({plug: _code, calendar: true})})
	    });
	},
	toggle: function(tag) {
	    if( _onlyUnchecked == null ) {
		_onlyUnchecked = true;
		tag.addClass('important');
	    } else {
		_onlyUnchecked = null;
		tag.removeClass('important');
	    }
	    _page(1);
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
	confirmation_types: function(tag, offset) {
	    _togglePopup("confirmation_types", tag, offset, function(obj) {
		return ConfirmationTypesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "confirmation_type_id");
		})
	    });
	},
	more: function(tag, row_no, offset) {
	    var u = 'more:{0}'.format_a(row_no);
	    if( _cache._more_row_no != null && _cache._more_row_no != u ) {
		_tags.more.hide();
	    }
	    _tags.more.set(_targettbl(_cache.data.rows[row_no-1]).join(''));
	    _tags.more.toggle(tag, offset);
	    _cache._more_row_no = u;
	},
	remark: function(tag, row_no, offset) {
	    var reaccept, rereject, renote, realert;
	    var u = 'remark:{0}'.format_a(row_no);
	    var r = _cache.data.rows[row_no-1];
	    var ptr = _cache.remarks[r.doc_id] || {status:(r.remark||{}).status,note:null};
	    var commit = function(self, method) {
		var params = {doc_id: r.doc_id, _datetime: G.getdatetime(new Date())};
		var xhr = G.xhr(method, G.getdataref({plug: _code}), "", function(xhr) {
		    if( xhr.status == 200 ) {
			ptr.status = method == 'PUT' ? 'accepted' : /*method == 'DELETE'*/'rejected';
			var n, cell = tag.parentNode.parentNode.parentNode;
			cell.removeClass('accepted');
			cell.removeClass('rejected');
			cell.addClass(ptr.status);
			cell.addClass('footnote_L');
			if( (n = _remarkNote(ptr.type, ptr.note)).length > 0 ) {
			    cell.setAttribute('data-title', "{0}: {1}.".format_a(lang.remark[ptr.status], n.join(". ")));
			} else {
			    cell.setAttribute('data-title', lang.remark[ptr.status]);
			}
			_tags.more.hide();
			Toast.show(lang.success.remark);
			r.remark = ptr;
			ptr = null;
			_cache.remarks[r.doc_id] = null;
		    } else {
			enable();
			alarm(xhr.status == 409 ? lang.errors.remark.exist : lang.errors.runtime);
		    }
		    _tags.more.stopSpinner();
		});
		_tags.more.startSpinner();
		disable();
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		if( typeof ptr.note != 'undefined' && !String.isEmpty(ptr.note) ) {
		    params.note = ptr.note;
		}
		xhr.send(G.formParamsURI(params));
	    }
	    var alarm = function(arg) {
		realert.html(arg);
		realert.show();
	    }
	    var enable = function() {
		reaccept.disabled = ptr.status == 'accepted';
		rereject.disabled = ptr.status == 'rejected' || String.isEmpty(ptr.note);
		renote.disabled = false;
	    }
	    var disable = function() {
		reaccept.disabled = true;
		rereject.disabled = true;
		renote.disabled = true;
	    }
	    if( _cache._more_row_no != null && _cache._more_row_no != u ) {
		_tags.more.hide();
	    }
	    _tags.more.set(_remarktbl().join(''));
	    realert = _("re:alert");
	    renote = _("re:note");
	    reaccept = _("re:accept");
	    rereject = _("re:reject");
	    renote.oninput = function() {
		ptr.note = this.value.trim();
		enable();
		realert.hide();
	    }
	    if( ptr.status != 'accepted' ) {
		reaccept.onclick = function() {
		    realert.hide();
		    commit(this, "PUT");
		}
	    }
	    if( ptr.status != 'rejected' ) {
		rereject.onclick = function() {
		    realert.hide();
		    if( String.isEmpty(ptr.note) ) {
			alarm(lang.errors.remark.note);
		    } else {
			commit(this, "DELETE");
		    }
		}
	    }
	    if( ptr.note != null ) {
		renote.text(ptr.note);
	    }
	    _tags.more.toggle(tag, offset);
	    _cache._more_row_no = u;
	    _cache.remarks[r.doc_id] = ptr;
	    enable();
	},
	slideshow: function(blobs, position) {
	    var ar = [];
	    blobs.forEach(function(arg) { ar.push(G.getdataref({plug: _code, blob: "yes", blob_id: arg})); });
	    SlideshowSimple(ar, {idx: position}).show();
	},
	xlsx: function() {
	    _toxlsx();
	},
	zip: function(tag0, tag1, span) {
	    var ar = [];
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
