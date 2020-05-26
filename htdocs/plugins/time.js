/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "time";
    var _cache = {}, _perm = {}, _tags = {};
    var _morecolumns2 = 6;

    function _getcolumns(perm) {
	let x = 19, c = perm.columns || {};
	if( c.area == true ) x++;
	if( c.department == true ) x++;
	if( c.distributor == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.time.title1, "</span>&nbsp;");
	ar.push("<a id='plugCal' href='javascript:void(0);' onclick='PLUG.calendar(this)'>[&nbsp;-&nbsp;]</a>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)");
	ar.push("<span id='usersGroup'>");
	ar.push("<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</span>");
	ar.push("<span id='moreGroup'>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<span id='plugUN'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.back(this)'>", lang.u_everyone, "</a>");
	ar.push("</span>");
	ar.push("</td></tr></table>");
	ar.push("<div id='usersContainer'>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th>", lang.u_name, "</th>");
	ar.push("<th width='80px'>", lang.dev_login, "</th>");
	ar.push("<th>", lang.myAbbr, "</th>");
	ar.push("<th class='symbol'>", "&#x2691;", "</th>");
	ar.push("<th>", "%", "</th>");
	ar.push("<th>", lang.scheduled, "</th>");
	ar.push("<th>", lang.closed, "</th>");
	ar.push("<th>", "%", "</th>");
	ar.push("<th>", lang.route_compliance.other, "</th>");
	ar.push("<th class='symbol'>", "&#x2713;", "</th>");
	ar.push("<th class='symbol'>", "&#x2717;", "</th>");
	ar.push("<th id='rule0'>", lang.less_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule1'>", lang.more_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule2'>", lang.more_meter.format_a(lang.dash), "</th>");
	ar.push("<th class='symbol'>", "&#x2692;", "</th>");
ar.push("<th>", "Days", "</th>");
	ar.push("<th width='55px'>", lang.mileageAbbr, "</th>");
	if( perm.columns != null && perm.columns.area == true ) {
	    ar.push("<th>", lang.area, "</th>");
	}
	if( perm.columns != null && perm.columns.department == true ) {
	    ar.push("<th>", lang.departmentAbbr, "</th>");
	}
	if( perm.columns != null && perm.columns.distributor == true ) {
	    ar.push("<th>", lang.distributor, "</th>");
	}
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody>");
	ar.push("</table>");
	ar.push("</div>");
	ar.push("<div id='moreContainer'>");
	ar.push("<table width='100%'>","<tbody>","<tr>");
	ar.push("<td width='49%' valign='top'>");

	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th rowspan='2' class='autoincrement'>", lang.num, "</th>");
	ar.push("<th rowspan='2' class='date'>", lang.date, "</th>");
	ar.push("<th colspan='4'>", lang.route_compliance.wd, "</th>");
	ar.push("<th colspan='9'>", lang.route, "</th>");
	ar.push("</tr><tr>");
	ar.push("<th>", lang.b_date, "</th>");
	ar.push("<th>", lang.e_date, "</th>");
	ar.push("<th>", lang.duration, "</th>");
	ar.push("<th class='time symbol'>", "&#x2692;", "</th>");
	ar.push("<th>", lang.scheduled, "</th>");
	ar.push("<th>", lang.closed, "</th>");
	ar.push("<th>", lang.pending, "</th>");
	ar.push("<th>", lang.route_compliance.other, "</th>");
	ar.push("<th class='symbol'>", "&#x2713;", "</th>");
	ar.push("<th class='symbol'>", "&#x2717;", "</th>");
	ar.push("<th id='rule0'>", lang.less_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule1'>", lang.more_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule2'>", lang.more_meter.format_a(lang.dash), "</th>");
	ar.push("</tr>", G.thnums(15/*_getcolumns(perm)*/), "</thead>");
	ar.push("<tbody id='moretb1'></tbody>");
	ar.push("</table>");


	ar.push("</td>");
	ar.push("<td width='2%'/>");
	ar.push("<td width='49%' valign='top'>");


	ar.push("<table width='100%' class='report'>","<thead>","<tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th>", lang.a_name, "</th>");
	ar.push("<th>", lang.address, "</th>");
	ar.push("<th>", lang.chan_name, "</th>");
	ar.push("<th>", lang.poten, "</th>");
	ar.push("<th class='symbol'>", "&#x2691;", "</th>");

	ar.push("</tr>", G.thnums(_morecolumns2), "</thead>");
	ar.push("<tbody id='moretb2'></tbody>");
	ar.push("</table>");


	ar.push("</td>");
	ar.push("</tr>","</tbody>","</table>");
	ar.push("</div>");
	ar.push(MonthsPopup.container());
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
	    user_id:true, 
	    dev_login:true, 
	    u_name:true, 
	    head_id:true,
	    area: true,
	    departments:true,
	    distributors:true
	});
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, t;
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		ar.push("<tr class='clickable" + (typeof checked != 'undefined' && checked[r.user_id] ? " selected'" : "") +
		    "' onclick='PLUG.more(" + r.row_no + ")'>");
		ar.push("<td class='autoincrement clickable' onclick='PLUG.checkrow(this.parentNode,\"" +
		    r.user_id + "\");event.stopPropagation();'>", r.row_no, "</td>");
		ar.push("<td class='string u_name'>", G.shielding(r.u_name), "</td>");
		ar.push("<td class='ref'>", String.isEmpty(r.dev_login) ? G.shielding(r.user_id).mtrunc(12) : r.dev_login, "</td>");
		ar.push("<td class='int' width='40px'>", G.getint_l(r._a,0), "</td>");
		ar.push("<td class='int' width='40px'>");
		if( r._v > 0 ) {
		    if( r._v != r._vwv ) {
			ar.push(G.getint_l(r._v), "<sup>&nbsp;({0})</sup>".format_a(r._vwv - r._v));
		    } else {
			ar.push(G.getint_l(r._v));
		    }
		} else {
		    ar.push(lang.dash);
		}
		ar.push("</td>");
		if( r._a > 0 ) {
		    const t = 100.0*r._vwv/r._a;
		    ar.push("<td class='int", t > 90 ? "" : " attention", "' width='50px'>", G.getpercent_l(t.toFixed(1)), "</td>");
		} else {
		    ar.push("<td class='int' width='50px'>", lang.dash, "</td>");
		}
		ar.push("<td class='int' width='40px'>");
		if( r._scheduled > 0 && r._discarded > 0 ) {
		    ar.push(G.getint_l(r._scheduled,0), "<sup>&nbsp;(-{0})</sup>".format_a(r._discarded));
		} else {
		    ar.push(G.getint_l(r._scheduled,0));
		}
		ar.push("</td>");
		ar.push("<td class='int' width='40px'>", G.getint_l(r._closed > 0 ? r._closed : null), "</td>");
		if( r._scheduled > 0 && r._discarded > 0 ) {
		    if( r._scheduled > r._discarded ) {
			const t = 100.0*r._closed/(r._scheduled - r._discarded);
			ar.push("<td class='int", t >= 100 ? "" : " attention", "' width='50px'>", G.getpercent_l(t.toFixed(1)), "</td>");
		    } else {
			ar.push("<td class='int' width='50px'>", lang.dash, "</td>");
		    }
		} else if( r._scheduled > 0 ) {
		    const t = 100.0*r._closed/r._scheduled;
		    ar.push("<td class='int", t >= 100 ? "" : " attention", "' width='50px'>", G.getpercent_l(t.toFixed(1)), "</td>");
		} else {
		    ar.push("<td class='int' width='50px'>", lang.dash, "</td>");
		}
		ar.push("<td class='int' width='40px'>", G.getint_l(r._other > 0 ? r._other : null), "</td>");
		ar.push("<td class='int' width='40px'>", G.getint_l(r._accepted > 0 ? r._accepted : null), "</td>");
		ar.push("<td class='int", r._rejected > 0 ? " attention" : "", "' width='40px'>", 
		    G.getint_l(r._rejected > 0 ? r._rejected : null), "</td>");
		ar.push("<td class='int", r._warn_min_duration > 0 ? " attention" : "", "' width='40px'>",
		    G.getint_l(r._warn_min_duration > 0 ? r._warn_min_duration : null), "</td>");
		ar.push("<td class='int' width='40px'>", G.getint_l(r._warn_max_duration > 0 ? r._warn_max_duration : null), "</td>");
		ar.push("<td class='int", r._warn_max_distance > 0 ? " attention" : "", "' width='40px'>",
		    G.getint_l(r._warn_max_distance > 0 ? r._warn_max_distance : null), "</td>");
		ar.push("<td class='time'>", r._instore_duration > 0 && r._days > 0 ? Number.HHMM(r._instore_duration/r._days) : lang.dash, "</td>");
		ar.push("<td class='int' width='40px'>", G.getint_l(r._days,0), "</td>");
		ar.push("<td class='int'>", r._mileage/1000 > 0 ? (r._mileage/1000.0).toFixed(1) : lang.dash, "</td>");
		if( perm.columns != null && perm.columns.area == true ) {
		    ar.push("<td class='ref sw95px'>", G.shielding(r.area), "</td>");
		}
		if( perm.columns != null && perm.columns.department == true ) {
		    var t = []
		    for( let i = 0, size = Array.isEmpty(r.departments) ? 0 : r.departments.length; i < size; i++ ) {
			if( i == 2 ) {
			    t.push("&mldr;");
			    break;
			} else if( i == 0 ) {
			    t.push("<div class='row'>", G.shielding(r.departments[i]), "</div>");
			} else {
			    t.push("<div class='row remark'>", G.shielding(r.departments[i]), "</div>");
			}
		    }
		    ar.push("<td class='ref Xsw95px'>", t.join(''), "</td>");
		}
		if( perm.columns != null && perm.columns.distributor == true ) {
		    var t = []
		    for( let i = 0, size = Array.isEmpty(r.distributors) ? 0 : r.distributors.length; i < size; i++ ) {
			if( i == 2 ) {
			    t.push("&mldr;");
			    break;
			} else if( i == 0 ) {
			    t.push("<div class='row'>", G.shielding(r.distributors[i]), "</div>");
			} else {
			    t.push("<div class='row remark'>", G.shielding(r.distributors[i]), "</div>");
			}
		    }
		    ar.push("<td class='ref sw95px'>", t.join(''), "</td>");
		}
		ar.push("<td class='string u_name'>", G.shielding(r.head_name), "</td>");
		ar.push("</tr>");
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
	    ar.push("<tr class='def'><td colspan='", _getcolumns(perm),"' class='watermark'>", lang.data_ts, "&nbsp;", data.data_ts, "</td></tr>");
	}
	return ar;
    }



    function _moremsg(msg, cols) {
	return ["<tr class='def'><td colspan='", _morecolumns2, "' class='message'>", msg, "</td></tr>"];
    }

    function _moretbl1(rows, rules, data_ts) {
	var ar = [], r, t;
	for( var i = 0, size = Array.isArray(rows) ? rows.length : 0; i < size; i++ ) {
	    if( (r = rows[i]) != null ) {
		const fn = [];
		const rule_b = r.rules == null || r.rules.wd == null || r.rules.wd.begin == null ? rules.wd.begin : r.rules.wd.begin;
		const rule_e = r.rules == null || r.rules.wd == null || r.rules.wd.end == null ? rules.wd.end : r.rules.wd.end;
		const disabled = !(r.scheduled > 0 || r.other > 0) || r.canceled > 0 ? " disabled" : "";
		const violations = (disabled != "" || r.violations == null || (!r.violations.gps && !r.violations.tm)) ? "" : " attention footnote";
		if( r.violations != null && r.violations.gps ) { fn.push(lang.violations.gps); }
		if( r.violations != null && r.violations.tm ) { fn.push(lang.violations.tm); }
		ar.push("<tr>");
		ar.push("<td class='autoincrement", violations, disabled, fn.isEmpty() ? "'>" : ("' data-title='" + fn.join(" + ") + "'>"),
		    i + 1, "</td>");
/*	if( r.alive != null && r.alive ) {
	    ar.push("<td class='delim int'><a href='", G.getref({plug:'tech',user_id:r.user_id,date:G.getdate(_cache.date)}),
	    "'>", r.dev_login, "</a></td>");
	} else {
	    ar.push("<td class='delim int", disabled, "'>", G.shielding(r.user_id).mtrunc(12), "</td>");
	}*/
ar.push("<td class='date", "", "'>", G.getdate_l(Date.parseISO8601(r.route_date)), "</td>");

		if( !(r.scheduled > 0 || r.other > 0) ) {
		    ar.push("<td class='delim ref disabled' colspan='13'>", R.none, "</td>");
		} else if( r.canceled > 0 ) {
		    ar.push("<td class='delim ref disabled' colspan='13'>", G.shielding(r.canceling_note), "</td>");
		} else {
		    t = G.gettime_l(Date.parseISO8601(r.b_dt));
		    ar.push("<td class='time", rule_b != null && t > rule_b ? " attention" : "", "'>", t, "</td>");
		    t = G.gettime_l(Date.parseISO8601(r.e_dt));
		    ar.push("<td class='time", rule_e != null && rule_e > t ? " attention" : "", "'>", t, "</td>");
		    ar.push("<td class='time'>", G.shielding(Number.HHMM(r.duration)), "</td>");
		    ar.push("<td class='time'>", G.shielding(Number.HHMM(r.instore_duration)), "</td>");

//+ mileage !!!

ar.push("<td class='int' width='40px'>", r.scheduled > 0 ? (G.getint_l(r.scheduled) +
			(r.discarded > 0 ? "<sup>&nbsp;(-{0})</sup>".format_a(r.discarded) : "")) : lang.dash, "</td>");
		    ar.push("<td class='int' width='40px'>", G.getint_l(r.closed > 0 ? r.closed : null), "</td>");
		    ar.push("<td class='int' width='40px'>", G.getint_l(r.pending > 0 ? r.pending : null), "</td>");
		    ar.push("<td class='int' width='40px'>", G.getint_l(r.other > 0 ? r.other : null), "</td>");
		    ar.push("<td class='int' width='40px'>", G.getint_l(r.accepted > 0 ? r.accepted : null), "</td>");
		    ar.push("<td class='int", r.rejected > 0 ? " attention" : "", "' 'width='40px'>",
			G.getint_l(r.rejected > 0 ? r.rejected : null), "</td>");
		    ar.push("<td class='int", r.warn_min_duration > 0 ? " attention" : "", "' 'width='40px'>",
			G.getint_l(r.warn_min_duration > 0 ? r.warn_min_duration : null), "</td>");
		    ar.push("<td class='int' width='40px'>", G.getint_l(r.warn_max_duration > 0 ? r.warn_max_duration : null), "</td>");
		    ar.push("<td class='int", r.warn_max_distance > 0 ? " attention" : "", "' width='40px'>",
			G.getint_l(r.warn_max_distance > 0 ? r.warn_max_distance : null), "</td>");
		}
		ar.push("</tr>");
	    }
	}
	if( ar.length == 0 ) {
	    ar = _moremsg(lang.empty, _morecolumns2);
	}
	if( typeof data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", /*_morecolumns2*/15, "' class='watermark'>", lang.data_ts, "&nbsp;", data_ts, "</td></tr>");
	}
	return ar;
    }

    function _moretbl2(rows, data_ts) {
	var ar = [], r;
	for( var i = 0, size = Array.isArray(rows) ? rows.length : 0; i < size; i++ ) {
	    if( (r = rows[i]) != null ) {
		const x = typeof r.v == 'undefined' || r.v == 0 ? " attention" : "";
		ar.push("<tr>");
		ar.push("<td class='autoincrement", x, "'>", i + 1, "</td>");
		ar.push("<td class='string a_name", x, "'>", G.shielding(r.descr), "</td>");
		ar.push("<td class='string address", x, "'>", G.shielding(r.address), "</td>");
		ar.push("<td class='ref", x, "'>", G.shielding(r.chan_name), "</td>");
		ar.push("<td class='ref", x, "'>", G.shielding(r.poten_name), "</td>");
		ar.push("<td class='int", x, "' width='40px'>");
		if( r.v > 0 ) {
		    if( r.v != r.vwv ) {
			ar.push(G.getint_l(r.v), "<sup>&nbsp;({0})</sup>".format_a(r.vwv||0 - r.v));
		    } else {
			ar.push(G.getint_l(r.v));
		    }
		} else {
		    ar.push(lang.dash);
		}
		ar.push("</td>");
		ar.push("</tr>");
	    }
	}
	if( ar.length == 0 ) {
	    ar = _moremsg(lang.empty, _morecolumns2);
	}
	if( typeof data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", _morecolumns2, "' class='watermark'>", lang.data_ts, "&nbsp;", data_ts, "</td></tr>");
	}
	return ar;
    }






    function _datareq(y, m) {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getajax({plug: _code, year: y, month: m}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		(data.rows||[]).forEach(function(ptr) {
		    if( !Array.isEmpty(ptr.accounts) ) {
			ptr._a = ptr.accounts.length;
			ptr._v = 0;
			ptr._vwv = 0
			ptr.accounts.forEach(function(arg) {
			    if( arg.v > 0 /* visited */ ) {
				ptr._v++;
			    }
			    if( arg.vwv > 0 /* visited-without-violations */ ) {
				ptr._vwv++;
			    }
			});
		    }
		    if( !Array.isEmpty(ptr.days) ) {
			ptr._scheduled = 0;
			ptr._closed = 0;
			ptr._discarded = 0;
			ptr._other = 0;
			ptr._accepted = 0;
			ptr._rejected = 0;
			ptr._warn_min_duration = 0;
			ptr._warn_max_duration = 0;
			ptr._warn_max_distance = 0;
			ptr._days = 0;
			ptr._duration = 0;
			ptr._instore_duration = 0;
			ptr._mileage = 0;
			ptr.days.forEach(function(arg) {
			    if( arg.scheduled > 0 && arg.scheduled != arg.canceled ) {
				ptr._scheduled += arg.scheduled||0;
				ptr._closed += arg.closed||0;
				ptr._discarded += arg.discarded||0;
				ptr._other += arg.other||0;
				ptr._accepted += arg.accepted||0;
				ptr._rejected += arg.rejected||0;
				ptr._warn_min_duration += arg.warn_min_duration||0;
				ptr._warn_max_duration += arg.warn_max_duration||0;
				ptr._warn_max_distance += arg.warn_max_distance||0;
// только если есть закрытые посещения или other !?
ptr._days++;
				ptr._duration += arg.duration||0;
				ptr._instore_duration += arg.instore_duration||0;
				ptr._mileage += arg.mileage||0;
			    } else if( arg.scheduled == null || arg.scheduled == 0 ) {
				ptr._other += arg.other||0;
				ptr._accepted += arg.accepted||0;
				ptr._rejected += arg.rejected||0;
				ptr._warn_min_duration += arg.warn_min_duration||0;
				ptr._warn_max_duration += arg.warn_max_duration||0;
				ptr._warn_max_distance += arg.warn_max_distance||0;
				ptr._days++;
				ptr._duration += arg.duration||0;
				ptr._instore_duration += arg.instore_duration||0;
				ptr._mileage += arg.mileage||0;
			    }
			});
		    }
		});


console.log(data);


		_cache.data = data;
		_tags.tbody.html(_datatbl(data, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
		_tags.rule0.text(lang.less_min.format_a(typeof data.rules == 'object' ? data.rules.duration.min : lang.dash));
		_tags.rule1.text(lang.more_min.format_a(typeof data.rules == 'object' ? data.rules.duration.max : lang.dash));
		_tags.rule2.text(lang.more_meter.format_a(typeof data.rules == 'object' ? data.rules.distance.max : lang.dash));
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

    function _filterdata() {
	if( _cache.data != null ) {
	    ProgressDialog.show();
	    setTimeout(function() {
		_tags.tbody.html(_datatbl(_cache.data, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
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
	_filterdata();
    }

    function _switchTo(more) {
	_togglePopup();
	if( more == true ) {
	    _tags.groups.u.hide();
	    _tags.containers.u.hide();
	    _tags.groups.m.show();
	    _tags.containers.m.show();
	} else {
	    _tags.groups.u.show();
	    _tags.containers.u.show();
	    _tags.groups.m.hide();
	    _tags.containers.m.hide();
	}
    }

/* public properties & methods */
    return {
	startup: function(tags, y, m, perm) {
	    _perm = perm;
	    _tags = tags;
	    _tags.body.html(_getbody(perm).join(""));
	    _tags.tbody = _("maintb");
	    _tags.moretb1 = _("moretb1");
	    _tags.moretb2 = _("moretb2");

	    _tags.cal = _("plugCal");
	    _tags.f = _("plugFilter");
	    _tags.ts = _("timestamp");
	    _tags.total = _("plugTotal");
	    _tags.groups = {u: _("usersGroup"), m: _("moreGroup")};
	    _tags.containers = {u: _("usersContainer"), m: _("moreContainer")};
	    _tags.rule0 = _("rule0");
	    _tags.rule1 = _("rule1");
	    _tags.rule2 = _("rule2");

	    _tags.popups = {};
	    _datareq(y, m);
	    _switchTo(false);
	},
	refresh: function() {
	    _togglePopup();
	    _tags.popups = {};
	    _datareq(_cache.y, _cache.m);
	},
	filter: function(tag, ev) {
	    _togglePopup();
	    return Filter.onkeyup(tag, ev, function() {
		_filterdata();
	    });
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
	more: function(row_no) {
	    const r = _cache.data.rows[row_no-1];
_tags.moretb1.html(_moretbl1(r.days, _cache.data.rules, _cache.data.data_ts).join(""));
_tags.moretb2.html(_moretbl2(r.accounts, _cache.data.data_ts).join(""));
	    _switchTo(true);
	},
	back: function() {
	    _switchTo(false);
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
