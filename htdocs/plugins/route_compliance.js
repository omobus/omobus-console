/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "route_compliance";
    var _cache = {}, _perm = null, _tags = {};
    var R = lang[_code];

    function _getcolumns(perm) {
	return 17 + (perm.columns == null ? 0 : (
	    (perm.columns.workday == true ? 3 : 0) +
	    (perm.columns.head == true ? 1 : 0) +
	    (perm.columns.mileage == true ? 1 : 0)
	));
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
	if( perm.csv ) {
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.csv(this)'>", lang.export.csv, "</a>");
	}
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th rowspan='2' class='autoincrement'>", lang.num, "</th>");
	ar.push("<th rowspan='2'>", lang.u_name, "</th>");
	ar.push("<th rowspan='2' width='80px'>", lang.dev_login, "</th>");
	if( perm.columns != null && perm.columns.workday == true ) {
	    ar.push("<th colspan='3'>", lang.workday, "</th>");
	}
	ar.push("<th colspan='4'>", R.wd, "</th>");
	ar.push("<th colspan='7'>", lang.route, "</th>");
	//ar.push("<th rowspan='2'>", lang.area, "</th>");
	if( perm.columns != null && perm.columns.head == true ) {
	    ar.push("<th rowspan='2' width='160px'>", lang.head_name, "</th>");
	}
	if( perm.columns != null && perm.columns.mileage == true ) {
	    ar.push("<th rowspan='2' width='55px'>", lang.mileage, "</th>");
	}
	ar.push("<th colspan='3'>", R.power, "</th>");
	ar.push("</tr><tr>");
	if( perm.columns != null && perm.columns.workday == true ) {
	    ar.push("<th>", lang.b_date, "</th>");
	}
	if( perm.columns != null && perm.columns.workday == true ) {
	    ar.push("<th>", lang.e_date, "</th>");
	}
	if( perm.columns != null && perm.columns.workday == true ) {
	    ar.push("<th>", lang.duration, "</th>");
	}
	ar.push("<th>", lang.b_date, "</th>");
	ar.push("<th>", lang.e_date, "</th>");
	ar.push("<th>", lang.duration, "</th>");
	ar.push("<th class='symbol'>", "&#x2692;", "</th>");
	ar.push("<th>", lang.scheduled, "</th>");
	ar.push("<th>", lang.closed, "</th>");
	ar.push("<th>", lang.pending, "</th>");
	ar.push("<th>", R.other, "</th>");
	ar.push("<th id='rule0'>", lang.less_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule1'>", lang.more_min.format_a(lang.dash), "</th>");
	ar.push("<th id='rule2'>", lang.more_meter.format_a(lang.dash), "</th>");
	ar.push("<th>", lang.b_date, "</th>");
	ar.push("<th>", lang.e_date, "</th>");
	ar.push("<th>", R.chargings, "</th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead><tbody id=\"maintb\"></tbody></table>");
	ar.push(DaysPopup.container());
	return ar;
    }

    function _getfilter() {
	return Filter(_tags.f.val(), false, {user_id:true, dev_login:true, u_name:true, head_name:true, area: true});
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
		var rule_b = r.rules == null || r.rules.wd.begin == null ? data.rules.wd.begin : r.rules.wd.begin;
		var rule_e = r.rules == null || r.rules.wd.end == null ? data.rules.wd.end : r.rules.wd.end;
		var disabled = !(r.scheduled > 0 || r.other > 0) || r.canceled > 0 ? " disabled" : "";
		var violations = (disabled != "" || r.violations == null || (!r.violations.gps && !r.violations.tm)) ? "" : " attention footnote";
		if( r.violations.gps ) { fn.push(lang.violations.gps); }
		if( r.violations.tm ) { fn.push(lang.violations.tm); }
		ar.push("<tr" + (typeof checked != 'undefined' && checked[r.user_id] ? " class='selected'" : "") + ">");
		ar.push("<td class='autoincrement clickable' onclick='PLUG.checkrow(this.parentNode,\"" +
		    r.user_id + "\");event.stopPropagation();'>", r.row_no, "</td>");
		ar.push("<td class='string", violations, disabled, fn.isEmpty() ? "'>" : ("' data-title='" + fn.join(" + ") + "'>"), 
		    G.shielding(r.u_name), "</td>");
		if( r.alive != null && r.alive ) {
		    ar.push("<td class='delim int'><a href='", G.getref({plug:'tech',user_id:r.user_id,date:G.getdate(_cache.date)}), 
			"'>", r.dev_login, "</a></td>");
		} else {
		    ar.push("<td class='delim int", disabled, "'>", G.shielding(r.user_id).mtrunc(12), "</td>");
		}
		if( !(r.scheduled > 0 || r.other > 0) ) {
		    ar.push("<td class='delim ref disabled' colspan='", (perm.columns != null && perm.columns.workday == true)?14:11, "'>", 
			R.none, "</td>");
		} else if( r.canceled > 0 ) {
		    ar.push("<td class='delim ref disabled' colspan='", (perm.columns != null && perm.columns.workday == true)?14:11, "'>", 
			G.shielding(r.canceling_note), "</td>");
		} else {
		    if( perm.columns != null && perm.columns.workday == true ) {
			r._wd_begin = G.gettime_l(Date.parseISO8601(r.wd_begin));
			ar.push("<td class='time", rule_b != null && r._wd_begin>rule_b ? " attention" : "", "'>", r._wd_begin, "</td>");
			r._wd_end = G.gettime_l(Date.parseISO8601(r.wd_end));
			ar.push("<td class='time", rule_e != null && rule_e>r._wd_end ? " attention" : "", "'>", r._wd_end, "</td>");
			ar.push("<td class='delim time'>", G.shielding(r.wd_duration), "</td>");
		    }
		    r._rd_begin = G.gettime_l(Date.parseISO8601(r.rd_begin));
		    ar.push("<td class='time", rule_b != null && r._rd_begin>rule_b ? " attention" : "", "'>", r._rd_begin, "</td>");
		    r._rd_end = G.gettime_l(Date.parseISO8601(r.rd_end));
		    ar.push("<td class='time", rule_e != null && rule_e>r._rd_end ? " attention" : "", "'>", r._rd_end, "</td>");
		    ar.push("<td class='time'>", G.shielding(r.rd_duration), "</td>");
		    ar.push("<td class='delim time'>", G.shielding(r.duration), "</td>");
		    ar.push("<td class='int' style='width: 40px;'>", r.scheduled > 0 ? (G.getint_l(r.scheduled) + 
			(r.discarded > 0 ? "<sup>&nbsp;(-{0})</sup>".format_a(r.discarded) : "")) : lang.dash, "</td>");
		    ar.push("<td class='int' style='width: 40px;'>", r.closed > 0 ? G.getint_l(r.closed) : lang.dash, "</td>");
		    ar.push("<td class='int' style='width: 40px;'>", r.pending > 0 ? G.getint_l(r.pending) : lang.dash, "</td>");
		    ar.push("<td class='int' style='width: 40px;'>", r.other > 0 ? G.getint_l(r.other) : lang.dash, "</td>");
		    ar.push("<td class='int", r.warn_min_duration == 0 ? "" : " attention", "' style='width: 40px;'>", 
			r.warn_min_duration > 0 ? G.getint_l(r.warn_min_duration) : lang.dash, "</td>");
		    ar.push("<td class='int' style='width: 40px;'>", r.warn_max_duration > 0 ? G.getint_l(r.warn_max_duration) : lang.dash, "</td>");
		    ar.push("<td class='delim int", r.warn_max_distance == 0 ? "" : " attention", "' style='width: 40px;'>", 
			r.warn_max_distance > 0 ? G.getint_l(r.warn_max_distance) : lang.dash, "</td>");
		}
		//ar.push("<td class='ref'>", G.shielding(r.area), "</td>");
		if( perm.columns != null && perm.columns.head == true ) {
		    ar.push("<td class='string", disabled, "'>", G.shielding(r.head_name), "</td>");
		}
		if( perm.columns != null && perm.columns.mileage == true ) {
		    ar.push("<td class='int'>", r.mileage/1000 > 0 ? parseFloat(r.mileage/1000.0).toFixed(1) : lang.dash, "</td>");
		}
		ar.push("<td class='int", disabled==""&&r.power!=null&&r.power.begin!=null&&(data.rules.power>r.power.begin||r.power.begin===255) ? " attention" : "",
		   disabled, "'>", G.getpercent_l(r.power!=null?_fixpower(r.power.begin):null), "</td>");
		ar.push("<td class='int", disabled, "'>", G.getpercent_l(r.power!=null?_fixpower(r.power.end):null), "</td>");
		ar.push("<td class='int", disabled, "'>", G.shielding(r.power!=null?r.power.chargings:null), "</td>");
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
	G.xhr("GET", G.getajax({plug: _code, code: "tech", date: G.getdate(_cache.date)}), "json", function(xhr, data) {
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
		    history.replaceState({date: _cache.date}, "", G.getref({plug: _code, date: G.getdate(_cache.date)}));
		}, {date: date, uri: G.getajax({plug: _code, calendar: true})});
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
		_filterdata()
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
	csv: function() {
	    var ar = [], f = Filter(_tags.f.val());
	    if( _cache.data != null ) {
		_cache.data.rows.forEach(function(r, i) {
		    if( f.is(r) ) ar.push(r);
		});
	    }
	    G.tocsv(_code, ar, _perm.csv);
	}
    }
})();


function startup(date, perm) {
    PLUG.startup(_('pluginContainer'), date, perm);
}

window.onpopstate = function(event) {
    PLUG.refresh(event.state != null ? event.state.date : new Date());
}
