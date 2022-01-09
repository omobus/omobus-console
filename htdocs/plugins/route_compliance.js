/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "route_compliance";
    var _cache = {}, _perm = null, _tags = {};
    var R = lang[_code];

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
	ar.push("<span>", R.title1, "</span>&nbsp;");
	ar.push("<a id='plugCal' href='javascript:void(0);' onclick='PLUG.calendar(this)'>[&nbsp;-&nbsp;]</a>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)");
	ar.push("<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th rowspan='2' class='autoincrement'>", lang.num, "</th>");
	ar.push("<th rowspan='2'>", lang.u_name, "</th>");
	ar.push("<th rowspan='2'>", lang.dev_login, "</th>");
	ar.push("<th colspan='5'>", R.wd, "</th>");
	ar.push("<th colspan='8'>", lang.route, "</th>");
	if( perm.columns != null && perm.columns.area == true ) {
	    ar.push("<th rowspan='2'>", lang.area, "</th>");
	}
	if( perm.columns != null && perm.columns.department == true ) {
	    ar.push("<th rowspan='2'>", lang.departmentAbbr, "</th>");
	}
	if( perm.columns != null && perm.columns.distributor == true ) {
	    ar.push("<th rowspan='2'>", lang.distributor, "</th>");
	}
	ar.push("<th rowspan='2'>", lang.head_name, "</th>");
	ar.push("<th colspan='3'>", R.power, "</th>");
	ar.push("</tr><tr>");
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
	ar.push("<th id='rule0'>", lang.less_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule1'>", lang.more_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule2'>", lang.more_meter.format_a(lang.dash), "</th>");
	ar.push("<th>", lang.b_date, "</th>");
	ar.push("<th>", lang.e_date, "</th>");
	ar.push("<th>", "&#x1f50c;", "</th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead><tbody id=\"maintb\"></tbody></table>");
	ar.push(DaysPopup.container());
	return ar;
    }

    function _getfilter() {
	return Filter(_tags.f.val(), false, [
	    "user_id", 
	    "dev_login", 
	    "u_name", 
	    "head_name", 
	    "area",
	    "departments\.[0-9]+",
	    "distributors\.[0-9]+"
	]);
    }

    function _fixpower(arg) {
	return arg == null ? null : (arg === 255 ? '~0' : arg);
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, total, date, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, t;
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		var fn = [];
		var rule_b = r.rules == null || r.rules.wd == null || r.rules.wd.begin == null ? data.rules.wd.begin : r.rules.wd.begin;
		var rule_e = r.rules == null || r.rules.wd == null || r.rules.wd.end == null ? data.rules.wd.end : r.rules.wd.end;
		var disabled = !(r.scheduled > 0 || r.other > 0) || r.canceled > 0 ? " disabled" : "";
		var violations = (disabled != "" || r.violations == null || (!r.violations.gps && !r.violations.tm && !r.violations.oom)) 
		    ? "" : " violation footnote";
		if( r.violations.gps ) { fn.push(lang.violations.gps); }
		if( r.violations.tm ) { fn.push(lang.violations.tm); }
		if( r.violations.oom ) { fn.push(lang.violations.oom); }
		ar.push("<tr" + (typeof checked != 'undefined' && checked[r.user_id] ? " class='selected'" : "") + ">");
		ar.push("<td class='autoincrement clickable", violations, disabled, fn.isEmpty() ? "'" : ("' data-title='" + fn.join(" + ") + "'"),
		    " onclick='PLUG.checkrow(this.parentNode,\"", r.user_id, "\");event.stopPropagation();'>", r.row_no, "</td>");
		ar.push("<td class='string u_name", disabled, "'>", G.shielding(r.u_name), "</td>");
		ar.push("<td class='int delim", disabled, "'>");
		if( r.alive != null && r.alive ) {
		    ar.push("<a target='_blank' href='", G.getdefref({plug:'tech',user_id:r.user_id,date:G.getdate(_cache.date)}), 
			"'>", G.shielding(r.dev_login), "</a>");
		} else {
		    ar.push(G.shielding(r.dev_login));
		}
		ar.push("</td>");
		if( !(r.scheduled > 0 || r.other > 0) ) {
		    ar.push("<td class='delim ref disabled' colspan='13'>", R.none.toLowerCase(), "</td>");
		} else if( r.canceled > 0 ) {
		    ar.push("<td class='delim ref disabled' colspan='13'>", G.shielding(r.canceling_note), "</td>");
		} else {
		    if( r.route_begin != null || r.route_end != null ) {
			t = G.gettime_l(Date.parseISO8601(r.route_begin));
			ar.push("<td class='time", rule_b != null && t > rule_b ? " attention" : "", "'>", t, "</td>");
			t = G.gettime_l(Date.parseISO8601(r.route_end));
			ar.push("<td class='time", rule_e != null && rule_e > t ? " attention" : "", "'>", t, "</td>");
			ar.push("<td class='time'>", G.shielding(Number.HHMM(r.route_duration)), "</td>");
			ar.push("<td class='time'>", G.shielding(Number.HHMM(r.instore_duration)), "</td>");
			ar.push("<td class='delim int' width='55px'>", r.mileage/1000 > 0 ? (r.mileage/1000.0).toFixed(1) : lang.dash, "</td>");
		    } else {
			ar.push("<td class='delim ref disabled' colspan='5'>", lang.none.toLowerCase(), "</td>");
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
		    ar.push("<td class='delim smallint", r.warn_max_distance > 0 ? " attention" : "", "'>", 
			r.warn_max_distance > 0 ? G.getint_l(r.warn_max_distance) : lang.dash, "</td>");
		}
		if( perm.columns != null && perm.columns.area == true ) {
		    ar.push("<td class='ref sw95px", disabled, "'>", G.shielding(r.area), "</td>");
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
		    ar.push("<td class='ref Xsw95px", disabled, "'>", t.join(''), "</td>");
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
		    ar.push("<td class='ref sw95px", disabled, "'>", t.join(''), "</td>");
		}
		ar.push("<td class='delim string u_name", disabled, "'>", G.shielding(r.head_name), "</td>");
		ar.push("<td class='int", disabled==""&&r.power!=null&&r.power.begin!=null&&(data.rules.power>r.power.begin||r.power.begin===255) ? " attention" : "",
		    disabled, "' width='40px'>", r.power != null ? G.getpercent_l(_fixpower(r.power.begin)) : lang.dash, "</td>");
		ar.push("<td class='int", disabled, "' width='40px'>", r.power != null? G.getpercent_l(_fixpower(r.power.end)) : lang.dash, "</td>");
		ar.push("<td class='int", disabled, "' width='40px'>", r.power != null && r.power.chargings > 0 ? G.getint_l(r.power.chargings) : lang.dash, "</td>");
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

    function _datareq() {
	ProgressDialog.show();
	_cache.data = null; // drops the internal cache
	G.xhr("GET", G.getdataref({plug: _code, code: "tech", date: G.getdate(_cache.date)}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_cache.data = data;
		_tags.tbody.html(_datatbl(data, _tags.total, _cache.date, _getfilter(), _cache.checked, _perm).join(""));
		_tags.rule0.text(lang.less_min.format_a(typeof data.rules == 'object' ? data.rules.duration.min : lang.dash));
		_tags.rule1.text(lang.more_min.format_a(typeof data.rules == 'object' ? data.rules.duration.max : lang.dash));
		_tags.rule2.text(lang.more_meter.format_a(typeof data.rules == 'object' ? data.rules.distance.max : lang.dash));
	    } else {
		_tags.tbody.html(_datamsg(lang.failure, _perm).join(""));
		_tags.total.html("");
	    }
	    ProgressDialog.hide();
	    _tags.ts.html(G.getdatetime_l(new Date()));
	}).send();
    }

    function _filterdata() {
	if( _cache.data != null ) {
	    ProgressDialog.show();
	    setTimeout(function() {
		_tags.tbody.html(_datatbl(_cache.data, _tags.total, _cache.date, _getfilter(), _cache.checked, _perm).join(""));
		ProgressDialog.hide();
	    }, 0);
	}
    }

    function _dropcache() {
	_cache.data = null;
    }

    function _setcaldate(date) {
	_cache.date = date instanceof Date ? date : Date.parseISO8601(date);
	_tags.cal.html(G.getlongdate_l(_cache.date).toLowerCase());
    }


/* public properties & methods */
    return {
	startup: function(tag, date, perm) {
	    tag.html(_getbody(perm).join(""));
	    _tags.body = tag;
	    _tags.tbody = _("maintb");
	    _tags.cal = _("plugCal");
	    _tags.ts = _("timestamp");
	    _tags.total = _("plugTotal");
	    _tags.f = _("plugFilter");
	    _tags.rule0 = _("rule0");
	    _tags.rule1 = _("rule1");
	    _tags.rule2 = _("rule2");
	    _tags.popup = DaysPopup(function(date) {
		    _setcaldate(date); _dropcache(); _datareq();
		    history.replaceState({date: _cache.date}, "", G.getdefref({plug: _code, date: G.getdate(_cache.date)}));
		}, {date: date, uri: G.getdataref({plug: _code, calendar: true})});
	    _perm = perm;
	    _setcaldate(date);
	    _datareq();
	},
	refresh: function() {
	    _dropcache();
	    _datareq();
	    _tags.popup.dropCache();
	    _tags.popup.hide();
	},
	navigate: function(date) {
	    _tags.popup.hide();
	    _setcaldate(date);
	    _datareq();
	},
	filter: function(tag, ev) {
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
	    _tags.popup.toggle(tag);
	},
	copy: function(text) {
	    navigator.clipboard.writeText(text);
	    Toast.show(lang.notices.clipboard);
	    console.log(text);
	}
    }
})();


function startup(date, perm) {
    PLUG.startup(_('pluginContainer'), date, perm);
}

window.onpopstate = function(event) {
    PLUG.refresh(event.state != null ? event.state.date : new Date());
}
