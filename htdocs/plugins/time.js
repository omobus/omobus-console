/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "time";
    var _cache = {}, _perm = {}, _tags = {};

    function _getcolumns(perm) {
	let x = 20, c = perm.columns || {};
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
	ar.push("<span id='moreGroup' class='gone'>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.uncovered(this)'>", lang.time.uncovered, "</a>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.back(this)'>", lang.u_everyone, "</a>");
	ar.push("</span>");
	ar.push("</td></tr></table>");
	/* users page: */
	ar.push("<div id='usersContainer'>");
	ar.push("<table width='100%' class='report'>", "<thead>", "<tr>");
	ar.push("<th rowspan='2' class='autoincrement'>", lang.num, "</th>");
	ar.push("<th rowspan='2'>", lang.u_name, "</th>");
	ar.push("<th rowspan='2'>", lang.dev_login, "</th>");
	ar.push("<th colspan='3'>", lang.my, "</th>");
	ar.push("<th colspan='8'>", lang.route, "</th>");
	ar.push("<th colspan='4'>", lang.route_compliance.wd, "</th>");
	ar.push("<th rowspan='2'>", lang.mileageTotalAbbr, "</th>");
	if( perm.columns != null && perm.columns.area == true ) {
	    ar.push("<th rowspan='2'>", lang.area, "</th>");
	}
	if( perm.columns != null && perm.columns.department == true ) {
	    ar.push("<th rowspan='2'>", lang.departmentAbbr, "</th>");
	}
	if( perm.columns != null && perm.columns.distributor == true ) {
	    ar.push("<th rowspan='2'>", lang.distributor, "</th>");
	}
	ar.push("<th rowspan='2'><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	ar.push("</tr>", "<tr>");
	ar.push("<th>", lang.myAbbr, "</th>");
	ar.push("<th class='symbol footnote' data-title='", lang.time.coverage, "'>", "&#x2691;", "</th>");
	ar.push("<th>", "%", "</th>");
	ar.push("<th>", lang.scheduled, "</th>");
	ar.push("<th>", lang.closed, "</th>");
	ar.push("<th>", "%", "</th>");
	ar.push("<th class='footnote' data-title='", lang.time.accepted, "'>", "&#x2713;", "</th>");
	ar.push("<th class='footnote' data-title='", lang.time.rejected, "'>", "&#x2717;", "</th>");
	ar.push("<th id='rule0'>", lang.less_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule1'>", lang.more_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule2'>", lang.more_meter.format_a(lang.dash), "</th>");
	ar.push("<th class='symbol footnote' data-title='", lang.time.timing, "'>", "&#x2692;", "</th>");
	ar.push("<th>", "%", "</th>");
	ar.push("<th>", lang.days, "</th>");
	ar.push("<th width='55px'>", lang.mileageAbbr, "</th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'>", "</tbody>");
	ar.push("</table>");
	ar.push("</div>");
	/* more page: */
	ar.push("<div id='moreContainer' class='gone'>");
	ar.push("<table width='100%'>","<tbody>","<tr>");
	ar.push("<td width='49%' valign='top'>");
	ar.push("<table  width='100%' class='report'>");
	ar.push("<tbody id='moretb0'>", "</tbody>");
	ar.push("</table>");
	ar.push("<br/>");
	ar.push("<table width='100%' class='report'>", "<thead>", "<tr>");
	ar.push("<th rowspan='2' colspan='2' class='autoincrement'>", "&#x2637;", "</th>");
	ar.push("<th colspan='5'>", lang.route_compliance.wd, "</th>");
	ar.push("<th colspan='9'>", lang.route, "</th>");
	ar.push("</tr>", "<tr>");
	ar.push("<th>", lang.b_date, "</th>");
	ar.push("<th>", lang.e_date, "</th>");
	ar.push("<th>", lang.duration, "</th>");
	ar.push("<th class='symbol footnote' data-title='", lang.time.timing, "'>", "&#x2692;", "</th>");
	ar.push("<th>", lang.mileageAbbr, "</th>");
	ar.push("<th>", lang.scheduled, "</th>");
	ar.push("<th>", lang.closed, "</th>");
	ar.push("<th>", lang.pending, "</th>");
	ar.push("<th class='footnote' data-title='", lang.time.accepted, "'>", "&#x2713;", "</th>");
	ar.push("<th class='footnote' data-title='", lang.time.rejected, "'>", "&#x2717;", "</th>");
	ar.push("<th id='rule0m'>", lang.less_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule1m'>", lang.more_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule2m'>", lang.more_meter.format_a(lang.dash), "</th>");
	ar.push("</tr>", G.thnums(15), "</thead>");
	ar.push("<tbody id='moretb1'>", "</tbody>");
	ar.push("</table>");
	ar.push("</td>");
	ar.push("<td width='2%'/>");
	ar.push("<td width='49%' valign='top'>");
	ar.push("<table width='100%' class='report'>", "<thead>", "<tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th>", lang.a_name, "</th>");
	ar.push("<th>", lang.address, "</th>");
	ar.push("<th>", lang.chan_name, "</th>");
	ar.push("<th>", lang.poten, "</th>");
	ar.push("<th class='symbol'>", "&#x2691;", "</th>");
	ar.push("</tr>", G.thnums(6), "</thead>");
	ar.push("<tbody id='moretb2'></tbody>");
	ar.push("</table>");
	ar.push("</td>");
	ar.push("</tr>", "</tbody>", "</table>");
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
	return Filter(a.join(' '), false, [
	    "user_id", 
	    "dev_login", 
	    "u_name", 
	    "head_id",
	    "area",
	    "departments\.[0-9]+",
	    "distributors\.[0-9]+"
	]);
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, t;
	var sensibleAlarms = ((new Date().getTime() - Date.parseISO8601(data.e_date).getTime())/(1000*60*60*24)) >= 10;
	var rx = new RegExp("['\"]", "g");
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		ar.push("<tr class='clickable" + (typeof checked != 'undefined' && checked[r.user_id] ? " selected'" : "") +
		    "' onclick='PLUG.more(" + r.row_no + ")'>");
		ar.push("<td class='autoincrement clickable' onclick='PLUG.checkrow(this.parentNode,\"" +
		    r.user_id + "\");event.stopPropagation();'>", r.row_no, "</td>");
		ar.push("<td class='string u_name'>", G.shielding(r.u_name), "</td>");
		ar.push("<td class='delim int'>", G.shielding(r.dev_login), "</td>");
		ar.push("<td class='smallint'>", G.getint_l(r._a,0), "</td>");
		ar.push("<td class='smallint'>");
		if( r._v > 0 ) {
		    if( r._v != r._vwv ) {
			ar.push("<span class='footnote' data-title='{2}'>{0}<sup>&nbsp;({1})</sup></span>".format_a(
			    G.getint_l(r._v), r._vwv - r._v, lang.time.violations));
		    } else {
			ar.push(G.getint_l(r._v));
		    }
		} else {
		    ar.push(lang.dash);
		}
		ar.push("</td>");
		if( r._a > 0 ) {
		    t = 100.0*r._vwv/r._a;
		    ar.push("<td class='delim int", /*t > 90 ? "" : " attention",*/ "' width='50px'>", G.getpercent_l(t.toFixed(1)), "</td>");
		} else {
		    ar.push("<td class='delim int' width='50px'>", lang.dash, "</td>");
		}
		if( !(r._scheduled > 0 || r._other > 0) ) {
		    ar.push("<td class='delim ref disabled' colspan='8'>", lang.route_compliance.none.toLowerCase(), "</td>");
		} else {
		    ar.push("<td class='smallint'>");
		    if( r._scheduled > 0 && r._discarded > 0 ) {
			ar.push( "<span class='footnote' data-title='{2}'>{0}<sup>&nbsp;(-{1})</sup></span>".format_a(
			    G.getint_l(r._scheduled,0), r._discarded, lang.time.discarded));
		    } else {
			ar.push(G.getint_l(r._scheduled,0));
		    }
		    ar.push("</td>");
		    ar.push("<td class='smallint'>");
		    if( r._closed > 0 || r._other > 0 ) {
			if( r._other > 0 ) {
			    ar.push("<span class='footnote' data-title='{2}'>{0}<sup>&nbsp;(+{1})</sup></span>".format_a(
				G.getint_l(r._closed), r._other, lang.time.other));
			} else {
			    ar.push(G.getint_l(r._closed));
			}
		    } else {
			ar.push(lang.dash);
		    }
		    ar.push("</td>");
		    if( r._scheduled > 0 && r._discarded > 0 ) {
			if( r._scheduled > r._discarded ) {
			    t = 100.0*r._closed/(r._scheduled - r._discarded);
			    ar.push("<td class='int", (!sensibleAlarms || t >= 100) ? "" : " violation", "' width='50px'>", 
				G.getpercent_l(t.toFixed(1)), "</td>");
			} else {
			    ar.push("<td class='int' width='50px'>", lang.dash, "</td>");
			}
		    } else if( r._scheduled > 0 ) {
			t = 100.0*r._closed/r._scheduled;
			ar.push("<td class='int", (!sensibleAlarms || t >= 100) ? "" : " violation", "' width='50px'>", 
			    G.getpercent_l(t.toFixed(1)), "</td>");
		    } else {
			ar.push("<td class='int' width='50px'>", lang.dash, "</td>");
		    }
		    ar.push("<td class='smallint'>", r._accepted > 0 ? G.getint_l(r._accepted) : lang.dash, "</td>");
		    ar.push("<td class='smallint", r._rejected > 0 ? " attention" : "", "'>", 
			r._rejected > 0 ? G.getint_l(r._rejected) : lang.dash, "</td>");
		    ar.push("<td class='smallint", r._warn_min_duration > 0 ? " attention" : "", "'>",
			r._warn_min_duration > 0 ? G.getint_l(r._warn_min_duration) : lang.dash, "</td>");
		    ar.push("<td class='smallint'>", r._warn_max_duration > 0 ? G.getint_l(r._warn_max_duration) : lang.dash, "</td>");
		    ar.push("<td class='delim smallint", r._warn_max_distance > 0 ? " attention" : "", "'>",
			r._warn_max_distance > 0 ? G.getint_l(r._warn_max_distance) : lang.dash, "</td>");
		}
		if( r._days > 0 ) {
		    const rule_t = r.rules == null || r.rules.wd == null || r.rules.wd.timing == null ? data.rules.wd.timing : r.rules.wd.timing;
		    t = Number.HHMM(r._instore_duration/r._days);
		    ar.push("<td class='time", rule_t != null && t < rule_t ? " violation" : "", "'>", G.shielding(t, lang.dash), "</td>");
		    if( rule_t == null ) {
			ar.push("<td class='int'>", lang.dash, "</td>");
		    } else if( t >= rule_t ) {
			ar.push("<td class='int'>", G.getpercent_l(100), "</td>");
		    } else {
			t = rule_t.split(':');
			ar.push("<td class='int'>", G.getpercent_l((100.0*(r._instore_duration/r._days)/((+t[0])*60+(+t[1]))).toFixed(1)), "</td>");
		    }
		    ar.push("<td class='smallint'>", G.getint_l(r._days,0), "</td>");
		    ar.push("<td class='delim int'>", r._mileage/1000 > 0 ? (r._mileage/1000.0).toFixed(1) : lang.dash, "</td>");
		} else {
		    ar.push("<td class='delim ref disabled' colspan='4'>", lang.none.toLowerCase(), "</td>");
		}
		ar.push("<td class='delim int'>", r._total_mileage/1000 > 0 ? (r._total_mileage/1000.0).toFixed(1) : lang.dash, "</td>");
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
	return ["<tr class='def'><td colspan='", cols, "' class='message'>", msg, "</td></tr>"];
    }

    function _moretbl0(data) {
	var ar = [], info = [];
	if( !String.isEmpty(data.head_name) ) {
	    ar.push("<tr>",
		"<th>", lang.head_name, ":</th>",
		"<th colspan='3'>", G.shielding(data.head_name), "</th>",
		"</tr>");
	}
	if( !String.isEmpty(data.email) ) {
	    info.push("<a class='ref' href='mailto:{0}'>{0}</a>".format_a(G.shielding(data.email)));
	}
	if( !String.isEmpty(data.mobile) ) {
	    info.push(G.shielding(data.mobile));
	}
	ar.push("<tr>",
	    "<th width='49%'>", lang.u_name, ":</th>",
	    "<th colspan='3' width='51%'>", "<b>", G.shielding(data.u_name, lang.dash), "</b>", 
		info.length > 0 ? ("<br/>"+info.join('&nbsp;&nbsp;')) : "", "</th>",
	    "</tr>");
	if( !Array.isEmpty(data._wdays) ) {
	    const t = []
	    data._wdays.forEach(function(arg0, arg1, arg2) {
		if( arg0 > 0 ) {
		    t.push(lang.calendar.days.namesAbbr[arg1 + 1]);;
		}
	    });
	    ar.push("<tr>",
		"<th>", lang.wdays, ":</th>",
		"<th colspan='3'>", t.join('&nbsp;&nbsp;'), "</th>",
		"</tr>");
	}
	ar.push("<tr>",
	    "<th>", lang.dev_login, ":</th>",
	    "<th colspan='3'>", G.shielding(data.dev_login, lang.dash), "</th>",
	    "</tr>");
	ar.push("<tr>",
	    "<th>", lang.u_code, ":</th>",
	    "<th colspan='3'>", G.shielding(data.user_id), "</th>",
	    "</tr>");
	if( !String.isEmpty(data.area) ) {
	    ar.push("<tr>",
		"<th>", lang.area, ":</th>",
		"<th colspan='3'>", G.shielding(data.area), "</th>",
		"</tr>");
	}
	if( !String.isEmpty(data.agency) ) {
	    ar.push("<tr>",
		"<th>", lang.agency, ":</th>",
		"<th colspan='3'>", G.shielding(data.agency), "</th>",
		"</tr>");
	}
	if( !Array.isEmpty(data.departments) ) {
	    const t = []
	    data.departments.forEach(function(arg0, arg1, arg2) {
		t.push(G.shielding(arg0));
	    });
	    ar.push("<tr>",
		"<th>", lang.department, ":</th>",
		"<th colspan='3'>", t.join('<br/>'), "</th>",
		"</tr>");
	}
	if( !Array.isEmpty(data.distributors) ) {
	    const t = []
	    data.distributors.forEach(function(arg0, arg1, arg2) {
		t.push(G.shielding(arg0));
	    });
	    ar.push("<tr>",
		"<th>", lang.distributor, ":</th>",
		"<th colspan='3'>", t.join('<br/>'), "</th>",
		"</tr>");
	}
	if( data._a > 0 ) {
	    ar.push("<tr>");
	    ar.push("<td class='ref' width='49%'>", lang.my, ":</td>");
	    ar.push("<td class='int' width='17%'>", G.getint_l(data._a,0), "</td>");
	    if( data._v > 0 ) {
		if( data._v != data._vwv ) {
		    ar.push("<td class='smallint' width='17%'>", "<span class='symbol'>&#x2691;</span>&nbsp;&nbsp;",
			"<span class='footnote' data-title='{2}'>{0}<sup>&nbsp;({1})</sup></span>".
			    format_a(data._v, data._vwv - data._v, lang.time.violations), 
			"</td>");
		    ar.push("<td class='int' width='17%'>", G.getpercent_l((100.0*data._vwv/data._a).toFixed(1)), "</td>");
		} else {
		    ar.push("<td class='int' width='17%'>", "<span class='symbol'>&#x2691;</span>&nbsp;&nbsp;{0}".
			format_a(data._v), "</td>");
		    ar.push("<td class='int' width='17%'>", G.getpercent_l((100.0*data._v/data._a).toFixed(1)), "</td>");
		}
	    } else {
		ar.push("<td class='int' width='17%'>", "<span class='symbol'>&#x2691;</span>&nbsp;&nbsp;<i>{0}</i>".format_a(lang.none), "</td>");
		ar.push("<td class='int' width='17%'>", lang.dash, "</td>");
	    }
	    ar.push("</tr>");
	}
	if( data._days > 0 ) {
	    ar.push("<tr>",
		"<td class='ref' width='49%'>", lang.route_compliance.wd, ":</td>",
		"<td class='int' width='17%'>", "<span class='symbol'>&#x2692;</span>&nbsp;&nbsp;", 
		    data._instore_duration > 0 ? Number.HHMM(data._instore_duration/data._days) : lang.dash, 
		"</td>",
		"<td class='int' width='17%'>", lang.num_of_days.format_a(G.getint_l(data._days,0)), "</td>",
		"<td class='int' width='17%'>", data._mileage/1000 > 0 ? lang.kilometers.format_a((data._mileage/1000.0).toFixed(1)) : lang.dash, "</td>",
		"</tr>");
	}
	if( data._scheduled > 0 ) {
	    ar.push("<tr>");
	    ar.push("<td class='ref' width='49%'>", lang.route, ":</td>");
	    if( data._scheduled > 0 && data._discarded > 0 ) {
		ar.push("<td class='smallint' width='17%'>", "<span class='footnote' data-title='{2}'>{0}<sup>&nbsp;(-{1})</sup><span>".format_a(
		    G.getint_l(data._scheduled,0), data._discarded, lang.time.discarded), "</td>");
	    } else {
		ar.push("<td class='int' width='17%'>", G.getint_l(data._scheduled,0), "</td>");
	    }
	    ar.push("<td class='int' width='17%'>", data._closed > 0 ? G.getint_l(data._closed) : lang.dash, "</td>");
	    if( data._scheduled > 0 && data._discarded > 0 ) {
		if( data._scheduled > data._discarded ) {
		    ar.push("<td class='int' width='17%'>", G.getpercent_l((100.0*data._closed/(data._scheduled - data._discarded)).toFixed(1)), "</td>");
		} else {
		    ar.push("<td class='int' width='17%'>", lang.dash, "</td>");
		}
	    } else if( data._scheduled > 0 ) {
		ar.push("<td class='int' width='17%'>", G.getpercent_l((100.0*data._closed/data._scheduled).toFixed(1)), "</td>");
	    } else {
		ar.push("<td class='int' width='17%'>", lang.dash, "</td>");
	    }
	    ar.push("</tr>");
	}
	if( data._total_mileage/1000 > 0 ) {
	    ar.push("<tr>",
		"<td class='ref'>", lang.mileageTotal, ":</td>",
		"<td class='int' colspan='3'>", lang.kilometers.format_a((data._total_mileage/1000.0).toFixed(1)), "</td>",
		"</tr>");
	}
	return ar;
    }

    function _moretbl1(data, rules, data_ts) {
	var ar = [], r, t;
	var rx = new RegExp("['\"]", "g");
	for( var i = 0, size = Array.isArray(data.days) ? data.days.length : 0; i < size; i++ ) {
	    if( (r = data.days[i]) != null ) {
		const fn = [];
		const d = Date.parseISO8601(r.route_date);
		const rule_b = r.rules == null || r.rules.wd == null || r.rules.wd.begin == null ? rules.wd.begin : r.rules.wd.begin;
		const rule_e = r.rules == null || r.rules.wd == null || r.rules.wd.end == null ? rules.wd.end : r.rules.wd.end;
		const rule_t = r.rules == null || r.rules.wd == null || r.rules.wd.timing == null ? rules.wd.timing : r.rules.wd.timing;
		const disabled = !(r.scheduled > 0 || r.other > 0) || r.canceled > 0 ? " disabled" : "";
		const violations = (disabled != "" || r.violations == null || (!r.violations.gps && !r.violations.tm && !r.violations.oom)) 
		    ? "" : " violation footnote";
		if( r.violations != null && r.violations.gps ) { fn.push(lang.violations.gps); }
		if( r.violations != null && r.violations.tm ) { fn.push(lang.violations.tm); }
		if( r.violations != null && r.violations.oom ) { fn.push(lang.violations.oom); }
		ar.push("<tr>");
		ar.push("<td class='autoincrement", violations, disabled, fn.isEmpty() ? "'>" : ("' data-title='" + fn.join(" + ") + "'>"));
		if( r.alive != null && r.alive ) {
		    ar.push("<a target='_blank' href='", G.getdefref({plug:'tech',user_id:data.user_id,date:r.route_date}), 
			"'>", d.getDate(), "</a>");
		} else {
		    ar.push(d.getDate());
		}
		ar.push("</td>");
		t = ["ref"];
		if( !(r.wday > 0) ) { t.push("disabled"); }
		if( !String.isEmpty(r.wdaymv) ) { t.push("footnote"); }
		ar.push("<td class='", t.join(" "), "'", String.isEmpty(r.wdaymv) ? "" : " data-title='{0}'".format_a(G.shielding(r.wdaymv).
		    replace(rx,' ')), ">", lang.calendar.days.namesAbbr[d.getDay()], "</td>");
		if( r.canceled > 0 ) {
		    ar.push("<td class='ref disabled' colspan='13'>", G.shielding(r.canceling_note), "</td>");
		} else {
		    if( r.route_begin == null || r.route_end == null ) {
			ar.push("<td class='ref disabled' colspan='5'>", lang.none.toLowerCase(), "</td>");
		    } else {
			t = G.gettime_l(Date.parseISO8601(r.route_begin));
			ar.push("<td class='time", rule_b != null && t > rule_b ? " attention" : "", "'>", t, "</td>");
			t = G.gettime_l(Date.parseISO8601(r.route_end));
			ar.push("<td class='time", rule_e != null && rule_e > t ? " attention" : "", "'>", t, "</td>");
			ar.push("<td class='time'>", G.shielding(Number.HHMM(r.route_duration)), "</td>");
			t = Number.HHMM(r.instore_duration);
			ar.push("<td class='time", rule_t != null && t < rule_t ? " attention" : "", "'>", G.shielding(t), "</td>");
			ar.push("<td class='int'>", r.mileage/1000 > 0 ? (r.mileage/1000.0).toFixed(1) : lang.dash, "</td>");
		    }
		    ar.push("<td class='smallint'>");
		    if( r.scheduled > 0 ) {
			if( r.discarded > 0 ) {
			    ar.push("<span class='footnote' data-title='{2}'>{0}<sup>&nbsp;(-{1})</sup></span>".format_a(
				G.getint_l(r.scheduled), r.discarded, lang.time.discarded));
			} else {
			    ar.push(G.getint_l(r.scheduled));
			}
		    } else {
			ar.push(lang.dash);
		    }
		    ar.push("</td>");
		    ar.push("<td class='smallint'>");
		    if( r.closed > 0 || r.other > 0 ) {
			if( r.other > 0 ) {
			    ar.push("<span class='footnote' data-title='{2}'>{0}<sup>&nbsp;(+{1})</sup></span>".format_a(
				G.getint_l(r.closed,0), r.other, lang.time.other));
			} else {
			    ar.push(G.getint_l(r.closed));
			}
		    } else {
			ar.push(lang.dash);
		    } 
		    ar.push("</td>");
		    ar.push("<td class='smallint'>", r.pending > 0 ? G.getint_l(r.pending) : lang.dash, "</td>");
		    ar.push("<td class='smallint'>", r.accepted > 0 ? G.getint_l(r.accepted) : lang.dash, "</td>");
		    ar.push("<td class='smallint", r.rejected > 0 ? " attention" : "", "'>",
			r.rejected > 0 ? G.getint_l(r.rejected) : lang.dash, "</td>");
		    ar.push("<td class='smallint", r.warn_min_duration > 0 ? " attention" : "", "'>",
			r.warn_min_duration > 0 ? G.getint_l(r.warn_min_duration) : lang.dash, "</td>");
		    ar.push("<td class='smallint'>", r.warn_max_duration > 0 ? G.getint_l(r.warn_max_duration) : lang.dash, "</td>");
		    ar.push("<td class='smallint", r.warn_max_distance > 0 ? " attention" : "", "'>",
			r.warn_max_distance > 0 ? G.getint_l(r.warn_max_distance) : lang.dash, "</td>");
		}
		ar.push("</tr>");
	    }
	}
	if( ar.length == 0 ) {
	    ar = _moremsg(lang.empty, 15);
	}
	if( typeof data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", 15, "' class='watermark'>", lang.data_ts, "&nbsp;", data_ts, "</td></tr>");
	}
	return ar;
    }

    function _moretbl2(data, page, f, data_ts) {
	const maxrows = 25;
	var ar = [], x = 0, r, z;
	for( var i = 0, size = Array.isArray(data.accounts) ? data.accounts.length : 0; i < size; i++ ) {
	    if( (r = data.accounts[i]) != null && (f != true || typeof r.v == 'undefined' || r.v == 0) ) {
		if( (page-1)*maxrows <= x && x < page*maxrows ) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement", typeof r.v == 'undefined' || r.v == 0 ? " incomplete" : "", "'>", i + 1, "</td>");
		    ar.push("<td class='string a_name'>", G.shielding(r.descr), "</td>");
		    ar.push("<td class='string address'>", G.shielding(r.address), "</td>");
		    ar.push("<td class='ref'>", G.shielding(r.chan_name), "</td>");
		    ar.push("<td class='ref'>", G.shielding(r.poten_name), "</td>");
		    ar.push("<td class='smallint'>");
		    if( r.v > 0 ) {
			if( r.v != r.vwv ) {
			    ar.push(G.getint_l(r.v), "<sup>&nbsp;({0})</sup>".format_a((r.vwv||0) - r.v));
			} else {
			    ar.push(G.getint_l(r.v));
			}
		    } else {
			ar.push(lang.dash);
		    }
		    ar.push("</td>");
		    ar.push("</tr>");
		}
		x++;
	    }
	}
	if( ar.length == 0 ) {
	    ar = _moremsg(lang.empty, 6);
	}
	if( typeof data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", 6, "' class='watermark'>", lang.data_ts, "&nbsp;", data_ts, "</td></tr>");
	}
	if( (z = Math.floor(x/maxrows) + ((x%maxrows)?1:0)) > 1 /*pages: */ ) {
	    ar.push("<tr class='def'><td colspan='", 6, "' class='navbar'>");
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

    function _datareq(y, m, u) {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getdataref({plug: _code, year: y, month: m}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' && data.code == 'time' ) {
		//console.log(data);
		Array.forEach(data.rows, function(ptr) {
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
			ptr._wdays = [1,1,1,1,1,1,1];
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
			ptr._total_mileage = 0;
			if( ptr.rules != null && !Array.isEmpty(ptr.rules.wdays) && ptr.rules.wdays.length == 7 ) {
			    ptr._wdays = ptr.rules.wdays;
			} else if( data.rules != null && !Array.isEmpty(data.rules.wdays) && data.rules.wdays.length == 7 ) {
			    ptr._wdays = data.rules.wdays;
			}
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
				ptr._days += ((arg.closed||0) + (arg.other||0)) > 0 ? 1 : 0;
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
				ptr._days += arg.wday > 0 ? 1 : 0;
				ptr._duration += arg.duration||0;
				ptr._instore_duration += arg.instore_duration||0;
				ptr._mileage += arg.mileage||0;
			    }
			    ptr._total_mileage += arg.total_mileage||0;
			});
		    }
		});
		_cache.data = data;
		_tags.tbody.html(_datatbl(data, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
		_tags.rule0.forEach(function(arg) { arg.text(lang.less_min.format_a(typeof data.rules == 'object' ? data.rules.duration.min : lang.dash)) });;
		_tags.rule1.forEach(function(arg) { arg.text(lang.more_min.format_a(typeof data.rules == 'object' ? data.rules.duration.max : lang.dash)) });
		_tags.rule2.forEach(function(arg) { arg.text(lang.more_meter.format_a(typeof data.rules == 'object' ? data.rules.distance.max : lang.dash)) });
		_switchTo(typeof u == 'undefined' || u == null ? null : (data.rows||[]).find(k => k.user_id == u));
	    } else {
		_tags.tbody.html(_datamsg(xhr.status == 200 ? lang.empty : lang.failure, _perm).join(""));
		_tags.total.html("");
		_switchTo();
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

    function _switchTo(r) {
	const more = typeof r != 'undelined' && r != null;
	_togglePopup();
	_tags.moretb0.html(more == true ? _moretbl0(r).join("") : "");
	_tags.moretb1.html(more == true ? _moretbl1(r, _cache.data.rules, _cache.data.data_ts).join("") : "");
	_tags.moretb2.html(more == true ? _moretbl2(r, 1, _cache.uncovered, _cache.data.data_ts).join("") : "");
	_tags.summary.forEach(function(arg) { if( more == true ) { arg.hide(); } else { arg.show(); } });
	_tags.more.forEach(function(arg) { if( more == true ) { arg.show(); } else { arg.hide(); } });
	_cache.u = more ? r.user_id : null;
	_cache.ptr = more ? r : null;
    }

    function _historyState(y, m, u) {
	var p1 = {y:y, m:m}, p2 = {plug: _code, year: y, month: m};
	if( typeof u != 'undefined' && u != null ) {
	    p1.u = u; p2.user_id = u;
	}
	history.replaceState(p1, "", G.getdefref(p2));
    }

    function _morepage(arg) {
	_tags.moretb2.html(_moretbl2(_cache.ptr, arg, _cache.uncovered, _cache.data.data_ts).join(""));
    }


/* public properties & methods */
    return {
	startup: function(tags, y, m, u, perm) {
	    _perm = perm;
	    _tags = tags;
	    _tags.body.html(_getbody(perm).join(""));
	    _tags.tbody = _("maintb");
	    _tags.moretb0 = _("moretb0");
	    _tags.moretb1 = _("moretb1");
	    _tags.moretb2 = _("moretb2");
	    _tags.cal = _("plugCal");
	    _tags.f = _("plugFilter");
	    _tags.ts = _("timestamp");
	    _tags.total = _("plugTotal");
	    _tags.summary = [_("usersGroup"), _("usersContainer")];
	    _tags.more = [_("moreGroup"), _("moreContainer")];
	    _tags.rule0 = [_("rule0"), _("rule0m")];
	    _tags.rule1 = [_("rule1"), _("rule1m")];
	    _tags.rule2 = [_("rule2"), _("rule2m")];
	    _tags.popups = {};
	    _datareq(y, m, u);
	},
	refresh: function() {
	    _togglePopup();
	    _tags.popups = {};
	    _datareq(_cache.y, _cache.m, _cache.u);
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
		    _datareq(y, m, _cache.u);
		    _historyState(y, m, _cache.u);
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
	    _switchTo(_cache.data.rows[row_no-1]);
	    _historyState(_cache.y, _cache.m, _cache.u);
	    window.scrollTo(0, 0);
	},
	back: function() {
	    _switchTo();
	    _historyState(_cache.y, _cache.m, _cache.u);
	},
	page: function(arg) {
	    _morepage(arg);
	    window.scrollTo(0, 0);
	},
	uncovered: function(tag) {
	    if( tag.hasClass("important") ) {
		_cache.uncovered = null;
		tag.removeClass('important');
	    } else {
		_cache.uncovered = true;
		tag.addClass('important');
	    }
	    _morepage(1);
	}
    }
})();


function startup(params, perm) {
    if( params == null || typeof params != 'object' || typeof params.y == 'undefined' || typeof params.m == 'undefined' ) {
	var d = new Date();
	PLUG.startup({body: _('pluginContainer')}, d.getFullYear(), d.getMonth() + 1, null, perm);
    } else {
	PLUG.startup({body: _('pluginContainer')}, params.y, params.m, params.u, perm);
    }
}

window.onpopstate = function(event) {
    window.location.reload(true);
}
