/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "joint_routes";
    var _cache = {}, _perm = {}, _tags = {};

    function _fmtcontact(d) {
	return lang.personFormat.format({name: G.shielding(d.name), patronymic: G.shielding(d.patronymic), surname: G.shielding(d.surname)});
    }

    function _getcolumns(perm) {
	return 14;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.joint_routes.title1, "</span>&nbsp;");
	ar.push("<a id='plugCal' href='javascript:void(0);' onclick='PLUG.calendar(this)'>[&nbsp;-&nbsp;]</a>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.xlsx(this)'>", lang.export.xlsx, "</a>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th class='date'>", lang.date, "</th>");
	ar.push("<th>", lang.u_code, "</th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.users(this,\"employee\",0.2)'>", lang.u_name, "</a></th>");
	ar.push("<th class='time'>", lang.b_date, "</th>");
	ar.push("<th class='time'>", lang.e_date, "</th>");
	ar.push("<th>", lang.duration, "</th>");
	ar.push("<th>", lang.joint_routes.v, "</th>");
	ar.push("<th>", lang.joint_routes.duration, "</th>");
	ar.push("<th width='90px'>", lang.sla.result, "</th>");
	ar.push("<th>", lang.joint_routes.note0, "</th>");
	ar.push("<th>", lang.joint_routes.note1, "</th>");
	ar.push("<th>", lang.joint_routes.note2, "</th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.users(this,\"author\",0.90)'>", lang.author, "</a></th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(MonthsPopup.container());
	ar.push(UsersPopup.container("employeesPopup"));
	ar.push(UsersPopup.container("authorsPopup"));
	ar.push(Dialog.container());
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
	return Filter(a.join(' '), false, ["fix_date", "employee_id", "employee", "author_id"]);
    }

    function _detailsbody(r) {
	var ar = [];
	if( r.rejected ) {
	    ar.push("<div class='row attention'>", lang.joint_routes.notice1, "</div>");
	}
	if( !String.isEmpty(r.note0) ) {
	    ar.push("<div class='watermark'><i>(", lang.joint_routes.note0.toLowerCase(), ")</i></div>");
	    ar.push("<div>", G.shielding(r.note0), "</div>");
	}
	if( !String.isEmpty(r.note1) ) {
	    ar.push("<div class='watermark'><i>(", lang.joint_routes.note1.toLowerCase(), ")</i></div>");
	    ar.push("<div>", G.shielding(r.note1), "</div>");
	}
	if( !String.isEmpty(r.note2) ) {
	    ar.push("<div class='watermark'><i>(", lang.joint_routes.note2.toLowerCase(), ")</i></div>");
	    ar.push("<div>", G.shielding(r.note2), "</div>");
	}
	ar.push("<br/>");
	ar.push("<table width='100%' class='report'>");
	ar.push("<thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th>", lang.sla.criteria, "</th>");
	r.accounts.forEach(function(v, i) {
	    ar.push("<th width='20px'>*<sup>", i + 1, "</sup></th>");
	});
	ar.push("<th width='50px'>", lang.sla.score, "</th>");
	ar.push("<th>", lang.note, "</th>");
	ar.push("</tr></thead><tbody>");
	if( Array.isArray(r.criterias) ) {
	    r.criterias.forEach(function(x, i) {
		var z = x.fix_dt > r.fix_dt ? " attention" : "";
		var note;
		ar.push("<tr>");
		ar.push("<td class='autoincrement" + z + "'>", i + 1, "</td>");
		ar.push("<td class='string" + z + "'>", G.shielding(x.descr), "</td>");
		r.accounts.forEach(function(v, j) {
		    var ptr = r.scores[v.account_id] != null ? r.scores[v.account_id][x.rating_criteria_id] : null;
		    if( ptr == null ) {
			ar.push("<td class='int'>", "&nbsp;", "</td>");
		    } else {
			note = ptr.note;
			ar.push("<td class='int" + z + (String.isEmpty(note) ? "" : " footnote") + "'" + (String.isEmpty(note) ? "" : " data-title='{0}'".format_a(note)) + ">", 
			    G.getint_l(ptr.score), "</td>");
		    }
		});
		ar.push("<td class='int" + z + "'>", /*G.getint_l(*/x.score/*)*/, "</td>");
		ar.push("<td class='string" + z + "'>", G.shielding(note), "</td>");
		ar.push("</tr>");
	    });
	}
	ar.push("</tbody><tfoot>");
	ar.push("<tr class='def'><td colspan='", r.closed + 4,"' class='watermark'>", "{0}:&nbsp;{1}. {2}&nbsp;{3}".format_a(
	    lang.author, r.author, lang.data_ts, G.getdatetime_l(Date.parseISO8601(r.fix_dt))), "</td></tr>");
	ar.push("</tfoot></table>");
	ar.push("<br/>");
	ar.push("<table width='100%' class='report'>");
	r.accounts.forEach(function(v, i) {
	    ar.push("<tr class='def'>");
	    ar.push("<td class='autoincrement'>*<sup>", i + 1, "</sup></td>");
	    ar.push("<td class='int'>", lang.minutes.format_a(v.duration), "</td>");
	    ar.push("<td class='int'>", G.shielding(v.a_code), "</td>");
	    ar.push("<td class='string'>", G.shielding(v.a_name), "</td>");
	    ar.push("<td class='string'>", G.shielding(v.address), "</td>");
	    ar.push("</tr>");
	});
	ar.push("</table>");
	ar.push("<br/>");
	return ar;
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
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.row_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.row_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td class='date'>", G.getdate_l(Date.parseISO8601(r.fix_date)), "</td>");
		    ar.push("<td class='int'>", G.shielding(r.employee_id), "</td>");
		    ar.push("<td class='string u_name'>", G.shielding(r.employee), "</td>");
		    ar.push("<td class='time'>", G.gettime_l(Date.parseISO8601(r.jr_begin)), "</td>");
		    ar.push("<td class='time'>", G.gettime_l(Date.parseISO8601(r.jr_end)), "</td>");
		    ar.push("<td class='time'>", G.shielding(r.jr_duration), "</td>");
		    ar.push("<td class='int'>", G.shielding(r.closed), "</td>");
		    ar.push("<td class='time'>", G.shielding(r.duration), "</td>");
		    ar.push("<td class='int'>", "<a href='javascript:PLUG.more(" + r.row_no + ");'>", G.getnumeric_l(r.assessment, 2),
			"</a>", "<hr/>", "<div class='row watermark'>", G.getpercent_l(r.sla), "</div>", "</td>");
		    ar.push("<td class='string" + (r.rejected ? " strikethrough attention footnote" : "") + "'" + 
			(r.rejected ? " data-title='{0}'".format_a(lang.joint_routes.notice0) : "") + ">", G.shielding(r.note0), "</td>");
		    ar.push("<td class='string" + (r.rejected ? " strikethrough attention footnote" : "") + "'" + 
			(r.rejected ? " data-title='{0}'".format_a(lang.joint_routes.notice0) : "") + ">", G.shielding(r.note1), "</td>");
		    ar.push("<td class='string" + (r.rejected ? " strikethrough attention footnote" : "") + "'" + 
			(r.rejected ? " data-title='{0}'".format_a(lang.joint_routes.notice0) : "") + ">", G.shielding(r.note2), "</td>");
		    ar.push("<td class='string u_name'>", G.shielding(r.author), "</td>");
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
		    var offset = 3;
		    var ws = wb.sheet(0);
		    wb.properties()._node.children = [];
		    wb.property('Title', lang.joint_routes.title);
		    wb.property('Author', __AUTHOR__);
		    wb.property('Description', "{0} {1}".format_a(lang.data_ts, data_ts));
		    ws.name(_code);
		    for( var i = 0, size = Math.min(ar.length,1048576 - offset), x; i < size; i++ ) {
			r = ar[i];
			ws.cell("A{0}".format_a(i + offset)).value(r.row_no);
			ws.cell("B{0}".format_a(i + offset)).value(Date.parseISO8601(r.fix_dt));
			ws.cell("C{0}".format_a(i + offset)).value(r.employee_id);
			ws.cell("D{0}".format_a(i + offset)).value(r.employee);
			ws.cell("E{0}".format_a(i + offset)).value(G.gettime_l(Date.parseISO8601(r.jr_begin)));
			ws.cell("F{0}".format_a(i + offset)).value(G.gettime_l(Date.parseISO8601(r.jr_end)));
			ws.cell("G{0}".format_a(i + offset)).value(r.jr_duration);
			ws.cell("H{0}".format_a(i + offset)).value(r.closed);
			ws.cell("I{0}".format_a(i + offset)).value(r.duration);
			ws.cell("J{0}".format_a(i + offset)).value(r.assessment);
			ws.cell("K{0}".format_a(i + offset)).value(G.getpercent_l(r.sla));
			ws.cell("L{0}".format_a(i + offset)).value(r.note0);
			ws.cell("M{0}".format_a(i + offset)).value(r.note1);
			ws.cell("N{0}".format_a(i + offset)).value(r.note2);
			ws.cell("O{0}".format_a(i + offset)).value(r.author);
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
	more: function(row_no) {
	    var r = _cache.data.rows[row_no-1];
	    Dialog({width: 800, title: "{0}, {1}: {2} ({3})".format_a(
		G.shielding(r.employee),
		lang.sla.result,
		G.getnumeric_l(r.assessment, 2),
		G.getpercent_l(r.sla)
	    ), body: _detailsbody(r)}).show();
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
