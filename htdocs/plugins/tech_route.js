/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var __route = (function() {
    /* private properties & methods */
    var _cache = {}; // internal cache object for preventing reloading data

    function _fixpower(arg) {
	return arg == null ? null : (arg === 255 ? '~0' : arg);
    }

    function _optcols() {
	var a = 0;
	if( typeof __allowedColumns == 'object' ) {
	    if( __allowedColumns.channel ) a++;
	    if( __allowedColumns.potential ) a++;
	}
	return a;
    }

    function _getcolumns() {
	return 16 + _optcols();
    }

    function _gettable() {
	var ar = [];
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th class='bool'>", lang.scheduled, "</th>");
	ar.push("<th class='bool'>", lang.closed, "</th>");
	ar.push("<th class='bool'>", lang.canceled, "</th>");
	ar.push("<th>", lang.a_code, "</th>");
	ar.push("<th>", lang.a_name, "</th>");
	ar.push("<th>", lang.address, "</th>");
	if( typeof __allowedColumns == 'object' ) {
	    if( __allowedColumns.channel ) {
		ar.push("<th>", lang.chan_name, "</th>");
	    }
	    if( __allowedColumns.potential ) {
		ar.push("<th>", lang.poten, "</th>");
	    }
	}
	ar.push("<th class='timesec'>", lang.b_date, "</th>");
	ar.push("<th class='timesec'>", lang.e_date, "</th>");
	ar.push("<th width='45px'>", lang.tech.route.duration, "</th>");
	ar.push("<th width='75px' colspan='2'>", lang.dist, "</th>");
	ar.push("<th width='45px'>", lang.mileageAbbr, "</th>");
	ar.push("<th>", lang.activity_type, "</th>");
	ar.push("<th class='bool' colspan='2'>", "&#8281;", "</th>");
	ar.push("</tr>", G.thnums(_getcolumns()), "</thead>");
	ar.push("<tbody id='xztb'></tbody></table>");
	ar.push("<div id='routeStats'></div>");
	return ar;
    }

    function _addition(r) {
	var ar = [];
	if( !String.isEmpty(r.tax_number) ) { ar.push(G.shielding(r.tax_number)); }
	ar.push("{0} {1}.".format_a(G.shielding(r.account), G.shielding(r.address)));
	if( !String.isEmpty(r.addition_type) ) { ar.push("<i>{0}</i>: <u>{1}</u>.".format_a(lang.addition_type, G.shielding(r.addition_type))); }
	if( !String.isEmpty(r.chan) )          { ar.push("<i>{0}</i>: <u>{1}</u>.".format_a(lang.chan_name, G.shielding(r.chan))); }
	if( !String.isEmpty(r.doc_note) )      { ar.push("<i>{0}</i>: <u>{1}</u>.".format_a(lang.note, G.shielding(r.doc_note))); }
	if( Array.isArray(r.attrs) )           { ar.push("<i>{0}</i>: <u>{1}</u>.".format_a(lang.attributes, G.shielding(r.attrs.join(', ')))); }
	return ar;
    }

    function _canceling(r) {
	var ar = [];
	if( !String.isEmpty(r.canceling_type) ) { ar.push(G.shielding(r.canceling_type)); }
	if( !String.isEmpty(r.canceling_note) ) { ar.push(G.shielding(r.canceling_note)); }
	return ar;
    }

    function _deletion(r) {
	var ar = [];
	if( !String.isEmpty(r.doc_note) ) { 
	    ar.push(":");
	    ar.push(G.shielding(r.doc_note));
	}
	if( !String.isEmpty(r.blob_id) ) {
	    ar.push("({0})".format_a(G.shielding(lang.tech.route.photo)));
	}
	return ar;
    }

    function _discard(r) {
	var ar = [];
	if( !String.isEmpty(r.type) )     { ar.push(G.shielding(r.type)); }
	if( !String.isEmpty(r.doc_note) ) { ar.push(G.shielding(r.doc_note)); }
	return ar;
    }

    function _pending(r) {
	var ar = [];
	if( !String.isEmpty(r.type) )     { ar.push(G.shielding(r.type)); }
	if( !String.isEmpty(r.doc_note) ) { ar.push(G.shielding(r.doc_note)); }
	return ar;
    }

    function _unsched(r) {
	var ar = [];
	if( !String.isEmpty(r.type) )     { ar.push(G.shielding(r.type)); }
	if( !String.isEmpty(r.doc_note) ) { ar.push(G.shielding(r.doc_note)); }
	return ar;
    }

    function _zstatusStyle(r) {
	var xs = [];
	if( r.zstatus == 'accepted' || r.zstatus == 'rejected' ) {
	    xs.push(" ", r.zstatus, " footnote' data-title='", lang.zstatus[r.zstatus].format_a(G.shielding(r.zauthor,"-"),G.shielding(r.activity_type,"-").toLowerCase()));
	    if( !String.isEmpty(r.znote) ) {
		xs.push(": ", G.shielding(r.znote));
	    }
	}
	return xs;
    }

    function _datatbl(data, u_id, date, checked) {
	var ar = [], z, r, k, ptr;
	for( var i = 0, size = Array.isArray(data._c) ? data._c.length : 0; i < size; i++ ) {
	    z = data._c[i]; r = z.ptr;
	    k = "{0}${1}${2}".format_a(u_id, G.getdate(date), r.row_id);
	    if( z._t == "route" ) {
		a = data.my_accounts[r.account_id] || {};
		ar.push("<tr ", (typeof checked != 'undefined' && checked[k]) ? "class='selected'" : "", ">");
		ar.push("<td class='clickable autoincrement' onclick='__route.checkrow(this.parentNode,\"", k, "\")'>", r.row_no, "</td>");
		ptr = data.pendings == null ? null : data.pendings[r.account_id];
		ar.push("<td class='bool", ptr == null ? "" : (" footnote' data-title='" + lang.tech.route.pending.format_a(_pending(ptr).join('. '))), "'>",
		    r.route == null ? "" : ("+" + (r.sched_no && r.closed ? ("<sup>"+r.sched_no+"</sup>") : ptr == null ? "" : ("<sup>&#10059;</sup>"))), 
		    "</td>");
if( typeof data.zstatusChangeable != 'undefined' /*&& data.zstatusChangeable*/ && r.strict && r.closed && r.guid ) {
		    ar.push("<td class='bool ref clickable", _zstatusStyle(r).join(''), "' onclick='__route.zstatus(this,\"", r.user_id, "\",", i, ",\"", r.guid, "\",0.10)'>", 
			"<span>+</span>", "</td>");
		} else {
		    ar.push("<td class='bool", _zstatusStyle(r).join(''), "'>", r.closed == null ? "" : "+", "</td>");
		}
		ar.push("<td class='bool", r.canceled == null ? "" : " footnote' data-title='{0}.".format_a(_canceling(r).join(". ")), "'>", 
		    r.canceled == null ? "" : "+", "</td>");
		ar.push("<td class='int'>");
		if( data._x != null && data._x.hasOwnProperty(r.account_id) ) {
		    ar.push("<a href='javascript:void(0)' onclick='__route.more1(\"", u_id, "\",\"", r.account_id, "\")'>", G.shielding(a.a_code), "</a>");
		} else {
		    ar.push(G.shielding(a.a_code));
		}
		ar.push("</td>");
		ptr = data.deletions == null ? null : data.deletions[r.account_id];
		ar.push("<td class='string", ptr == null ? "" : " strikethrough footnote' data-title='{0}{1}.".format_a(lang.tech.route.deletion,_deletion(ptr).join(' ')), 
		    (ptr == null || String.isEmpty(ptr.blob_id)) ? "" : 
			"' onclick='PLUG.slideshow([{0}],1)".format_a(ptr.blob_id),
		    "'>", G.shielding(a.descr), "</td>");
		ar.push("<td class='string'>", G.shielding(a.address), "</td>");
		if( typeof __allowedColumns == 'object' ) {
		    if( __allowedColumns.channel ) {
			ar.push("<td class='ref'>", G.shielding(a.chan), "</td>");
		    }
		    if( __allowedColumns.potential ) {
			ar.push("<td class='ref'>", G.shielding(a.poten), "</td>");
		    }
		}
		ar.push("<td class='timesec'>", _tm(date, Date.parseISO8601(r.b_dt)), "</td>");
		ar.push("<td class='timesec'>", _tm(date, Date.parseISO8601(r.e_dt)), "</td>");
		ar.push("<td class='int", (r.strict == null || r.strict == 0 || r.duration == null || data.rules == null || (data.rules.duration.min <= r.duration && 
		    r.duration <= data.rules.duration.max)) ? "" : " attention", "'>", r.duration == null ? "" : r.duration, "</td>");
		ar.push("<td class='int", (r.strict == null || r.strict == 0 || r.dist == null || data.rules == null || data.rules.distance.max >= r.dist) ? 
		    "" : " attention", "' Xwidth='50px;'>", r.closed ? G.getint_l(r.dist) : "", "</td>");
		ar.push("<td class='int", (r.strict == null || r.strict == 0 || r.dist_e == null || data.rules == null || data.rules.distance.max >= r.dist_e) ? 
		    "" : " attention", "' Xwidth='50px;'>", r.closed ? G.getint_l(r.dist_e) : "", "</td>");
		ar.push("<td class='int'>", (r.mileage != null && r.mileage/1000 > 0 ? parseFloat(r.mileage/1000.0).toFixed(1) : "&nbsp;"), "</td>");
		ptr = data.discards == null ? null : data.discards[r.account_id];
		ar.push("<td class='ref", ptr == null ? "" : (" strikethrough footnote_L' data-title='" + lang.tech.route.discard.format_a(_discard(ptr).join('. '))),
		    "'>", G.shielding(r.activity_type), "</td>");
		if( String.isEmpty(r.extra_info) ) {
		    ar.push("<td class='bool'>", "&nbsp;", "</td>");
		} else {
		    ar.push("<td class='bool footnote_L' data-title='{0}: {1}.".format_a(lang.repentance, G.shielding(r.extra_info)), 
			"' width='30px'>", "&#x1F613;", "</td>");
		}
		ar.push("<td class='bool'>");
		if( typeof r.docs != 'undefined' && r.docs > 0 ) {
		    if( data._d != null && data._d.hasOwnProperty("{0}:{1}".format_a(r.account_id,r.a_cookie)) ) {
			ar.push("<a href='javascript:void(0)' onclick='__route.more2(\"", u_id, "\",\"", r.account_id, "\",\"", r.a_cookie, "\")'>", 
			    G.getint_l(r.docs), "</a>"); 
		    } else {
			ar.push(G.getint_l(r.docs));
		    }
		} else if( data._d != null && data._d.hasOwnProperty("{0}:{1}".format_a(r.account_id,r.a_cookie)) ) {
		    ar.push("<a href='javascript:void(0)' onclick='__route.more2(\"", u_id, "\",\"", r.account_id, "\",\"", r.a_cookie, "\")'>", 
			"*", "</a>"); 
		} else {
		    ar.push("&nbsp;");
		}
		ar.push("</td>");
		ar.push("</tr>");
	    } else if( z._t == "unsched" ) {
		ar.push("<tr class='clickable'", (typeof checked != 'undefined' && checked[k]) ? "class='selected' " : "",
		    " onclick='__route.checkrow(this,\"", k, "\")'>");
		ar.push("<td colspan='5'>", lang.tech.route.unsched, "</td>");
		ar.push("<td colspan='", 2 + _optcols(), "'>", _unsched(r).join(". "), "</td>");
		ar.push("<td colspan='2' class='datetime'>", _tm(date, Date.parseISO8601(r.fix_dt)), "</td>");
		ar.push("<td colspan='7'>&nbsp;</td>");
		ar.push("</tr>");
	    } else if( z._t == "addition" ) {
		var blobs = []
		if( Array.isArray(r.photos) ) {
		    r.photos.forEach(function(arg0, arg1, arg2) {
			blobs.push("<a href='javascript:void(0)' onclick='PLUG.slideshow([{0}],{1})'>[&nbsp;{2}&nbsp;]</a>".
			    format_a(arg2.join(','), arg1+1, arg1+1));
		    });
		}
		ar.push("<tr class='clickable'", (typeof checked != 'undefined' && checked[k]) ? "class='selected' " : "",
		    " onclick='__route.checkrow(this,\"", k, "\")'>");
		ar.push("<td colspan='5'>", lang.tech.route.addition, "</td>");
		ar.push("<td colspan='", 2 + _optcols(), "'>", _addition(r).join(' '), "</td>");
		ar.push("<td colspan='2' class='datetime'>", _tm(date, Date.parseISO8601(r.fix_dt)), "</td>");
		ar.push("<td colspan='7' class='ref'", Array.isArray(r.photos) ? " onclick='event.stopPropagation();'" : "", ">", 
		    Array.isArray(r.photos) ? blobs.join("&nbsp;&nbsp;") : "&nbsp;", "</td>");
		ar.push("</tr>");
	    } else if( z._t == "joint" ) {
		ar.push("<tr class='watermark'>");
		ar.push("<td colspan='5'>&nbsp;</td>");
		ar.push("<td colspan='", 2 + _optcols(), "'>", (r.state =='begin' ? lang.tech.route.joint.b : lang.tech.route.joint.e).
		    format_a(G.shielding(r.e_name)), "</td>");
		ar.push("<td colspan='2' class='datetime'>", _tm(date, Date.parseISO8601(r.fix_dt)), "</td>");
		ar.push("<td colspan='7'>&nbsp;</td>");
		ar.push("</tr>");
	    }
	}
	if( ar.length == 0 ) {
	    ar = ["<tr class='def'><td colspan='", _getcolumns(), "' class='message'>", lang.empty, "</td></tr>"];
	}
	if( typeof data.data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", _getcolumns(), "' class='watermark'>", lang.data_ts, "&nbsp;", data.data_ts, "</td></tr>");
	}

	return ar;
    }

    function _statstbl(data) {
	var ar = [], violations = [], devids = [], info = [], cancellation = [], alive = true, docs;
	if( String.isEmpty(data.user_id) ) {
	    return ar;
	}
	if( data.packets == null || data.packets.count == null || data.packets.count == 0 ) {
	    alive = false;
	}
	if( data.cancellation != null ) {
	    if( !String.isEmpty(data.cancellation.type) ) {
		cancellation.push(data.cancellation.type);
	    }
	    if( !String.isEmpty(data.cancellation.note) ) {
		cancellation.push(data.cancellation.note);
	    }
	}
	if( data.violations != null ) {
	    if( data.violations.gps_off ) {
		violations.push(lang.violations.gps);
	    }
	    if( data.violations.tm_changed ) {
		violations.push(lang.violations.tm);
	    }
	    if( data.violations.oom ) {
		violations.push(lang.violations.oom);
	    }
	}
	if( Array.isArray(data.user_documents) ) {
	    docs = {};
	    data.user_documents.forEach(function(arg) {
		var ptr;
		if( (ptr = docs[arg.doc_type]) == null ) {
		    docs[arg.doc_type] = ptr = {count: 0, inprogress: 0, duration: 0};
		}
		ptr.count++;
		ptr.inprogress += (String.isEmpty(arg.doc_id) ? 1 : 0);
		ptr.duration += arg.duration;
	    });
	}
	if( Array.isArray(data.dev_ids) ) {
	    data.dev_ids.forEach(function(arg0, arg1, arg2) { 
		devids.push((arg2.length > 1 ? "({1})&nbsp;{0}" : "{0}").format_a(G.shielding(arg0), arg1+1)); 
	    });
	}
	ar.push("<br/>");
	ar.push("<table width='100%'><tr>");
	ar.push("<td width='49%' valign='top'>");
	/* system statistics */
	ar.push("<table  width='100%' class='report'>");
	if( !String.isEmpty(data.dev_login) ) {
	    ar.push("<tr>",
		"<th>", lang.dev_login, ":</th>",
		"<th class='ref' colspan='2' width='260px'>", G.shielding(data.dev_login, lang.dash), "</th>",
		"</tr>");
	}
	ar.push("<tr>",
	    "<th>", lang.u_code, ":</th>",
	    "<th class='ref' colspan='2' width='260px'>", G.shielding(data.user_id), "</th>",
	    "</tr>");
	if( Array.isArray(data.dev_ids) ) {
	    ar.push("<tr>",
		"<th>", lang.dev_id, ":</th>",
		"<th class='ref", Array.isArray(data.dev_ids) && data.dev_ids.length > 1 ? " attention" : "" , "' colspan='2' width='260px'>", 
		    devids.join('<br/>'), "</th>",
		"</tr>");
	}
	if( alive ) {
	    ar.push("<tr>",
		"<td>", lang.tech.route.packets.title, ":</td>",
		"<td class='int' colspan='2' width='260px'>", lang.tech.route.packets.value.format_a(data.packets.count, G.shielding(data.packets.time)), "</td>",
		"</tr>");
	}
	if( alive && data.traffics != null ) {
	    ar.push("<tr>",
		"<td>", lang.tech.route.traffics.omobus, ":</td>",
		"<td class='int' width='130px'>", data.traffics.omobus_tx_bytes ? "&uarr;&nbsp;{0}".format_a(G.fileSize(data.traffics.omobus_tx_bytes)) : lang.dash, "</td>",
		"<td class='int' width='130px'>", data.traffics.omobus_rx_bytes ? "&darr;&nbsp;{0}".format_a(G.fileSize(data.traffics.omobus_rx_bytes)) : lang.dash, "</td>",
		"</tr>");
	    ar.push("<tr>",
		"<td>", lang.tech.route.traffics.total, ":</td>",
		"<td class='int' width='130px'>", data.traffics.total_tx_bytes ? "&uarr;&nbsp;{0}".format_a(G.fileSize(data.traffics.total_tx_bytes)) : lang.dash, "</td>",
		"<td class='int' width='130px'>", data.traffics.total_rx_bytes ? "&darr;&nbsp;{0}".format_a(G.fileSize(data.traffics.total_rx_bytes)) : lang.dash, "</td>",
		"</tr>");
	    ar.push("<tr>",
		"<td>", lang.tech.route.traffics.mobile, ":</td>",
		"<td class='int' width='130px'>", data.traffics.mobile_tx_bytes ? "&uarr;&nbsp;{0}".format_a(G.fileSize(data.traffics.mobile_tx_bytes)) : lang.dash, "</td>",
		"<td class='int' width='130px'>", data.traffics.mobile_rx_bytes ? "&darr;&nbsp;{0}".format_a(G.fileSize(data.traffics.mobile_rx_bytes)) : lang.dash, "</td>",
		"</tr>");
	}
	if( alive && data.power != null ) {
	    ar.push("<tr>",
		"<td>", lang.tech.route.power.format_a(data.rules != null ? G.shielding(data.rules.wd.b, lang.dash) : lang.dash), ":</td>",
		"<td class='int", data.power.b !=null && (data.rules.power > data.power.b || data.power.b === 255) ? " attention" : "",
		    "' colspan='2' width='260px'>", G.getpercent_l(_fixpower(data.power.b)), "</td>",
		"</tr>");
	    ar.push("<tr>",
		"<td>", lang.tech.route.power.format_a(data.rules != null ? G.shielding(data.rules.wd.e, lang.dash) : lang.dash), ":</td>",
		"<td class='int' colspan='2' width='260px'>", G.getpercent_l(_fixpower(data.power.e)), "</td>",
		"</tr>");
	    ar.push("<tr>",
		"<td>", lang.tech.route.chargings.format_a(data.rules != null ? G.shielding(data.rules.wd.b, lang.dash) : lang.dash, 
		    data.rules != null ? G.shielding(data.rules.wd.e, lang.dash) : lang.dash), ":</td>",
		"<td class='int' colspan='2' width='260px'>", "{0}{1}".format_a(G.getint_l(data.power.chargings), 
		    data.power.power_save ? "<hr/>***POWER SAVE***" : ""), "</td>",
		"</tr>");
	}
	if( alive && data.exchanges != null ) {
	    ar.push("<tr>",
		"<td>", lang.tech.route.exchange.sync, ":</td>",
		"<td class='int'>", data.exchanges.sync.success ? data.exchanges.sync.success : lang.dash, "</td>", 
		"<td class='int'>", data.exchanges.sync.failed ? "&#x1F622;&nbsp;{0}".format_a(data.exchanges.sync.failed) : lang.dash, "</td>",
		"</tr>");
	    ar.push("<tr>",
		"<td>", lang.tech.route.exchange.downloaded, ":</td>",
		"<td class='int'>", data.exchanges.sync.packets ? data.exchanges.sync.packets : lang.dash, "</td>",
		"<td class='int'>", data.exchanges.sync.corrupted ? "&#x1F622;&nbsp;{0}".format_a(data.exchanges.sync.corrupted) : lang.dash, "</td>",
		"</tr>");
	    ar.push("<tr>",
		"<td>", lang.tech.route.exchange.docs, ":</td>",
		"<td class='int'>", data.exchanges.docs.success ? data.exchanges.docs.success : lang.dash, "</td>",
		"<td class='int'>", data.exchanges.docs.failed ? "&#x1F622;&nbsp;{0}".format_a(data.exchanges.docs.failed) : lang.dash, "</td>",
		"</tr>");
	    ar.push("<tr>",
		"<td>", lang.tech.route.exchange.uploaded, ":</td>",
		"<td class='int' colspan='2'>", data.exchanges.docs.packets ? data.exchanges.docs.packets : lang.dash, "</td>",
		"</tr>");
	}
	if( alive && !Array.isEmpty(data.trace) ) {
	    let x = 0;
	    data.trace.forEach(function(arg) { if( arg.control_point == 1 ) { x++; } });
	    ar.push("<tr>",
		"<td>", lang.tech.route.positions.title, ":</td>",
		"<td class='int' colspan='2' width='260px'>", 
		lang.tech.route.positions.value.format_a(data.trace.length, x, G.gettime_l(data.trace.last().fix_dt)), 
		"</td>",
		"</tr>");
	}
	ar.push("</table>");
	ar.push("</td>");
	/* delimeter: */
	ar.push("<td width='2%'></td>");
	/* route stats: */
	ar.push("<td width='49%' valign='top'>");
	ar.push("<table  width='100%' class='report'>");
	if( !String.isEmpty(data.head_name) ) {
	    ar.push("<tr>",
		"<th>", lang.head_name, ":</th>",
		"<th class='ref' colspan='3'>", G.shielding(data.head_name), "</th>",
		"</tr>");
	}
	if( !String.isEmpty(data.email) ) {
	    info.push("<a href='mailto:{0}'>{0}</a>".format_a(G.shielding(data.email)));
	}
	if( !String.isEmpty(data.mobile) ) {
	    info.push(G.shielding(data.mobile));
	}
	ar.push("<tr>",
	    "<th>", lang.u_name, ":</th>",
	    "<th class='ref' colspan='3'>", "<b>", G.shielding(data.u_name, lang.dash), "</b>",
		info.length > 0 ? ("<br/>"+info.join('&nbsp;&nbsp;')) : "", "</th>",
	    "</tr>");
	if( !String.isEmpty(data.country) ) {
	    ar.push("<tr>",
		"<th>", lang.country, ":</th>",
		"<th class='ref' colspan='3'>", G.shielding(data.country), "</th>",
		"</tr>");
	}
	if( !String.isEmpty(data.area) ) {
	    ar.push("<tr>",
		"<th>", lang.area, ":</th>",
		"<th class='ref' colspan='3'>", G.shielding(data.area), "</th>",
		"</tr>");
	}
	if( !String.isEmpty(data.agency) ) {
	    ar.push("<tr>",
		"<th>", lang.agency, ":</th>",
		"<th class='ref' colspan='3'>", G.shielding(data.agency), "</th>",
		"</tr>");
	}
	if( Array.isArray(data.departments) && data.departments.length > 0 ) {
	    var t = []
	    data.departments.forEach(function(arg0, arg1, arg2) { 
		t.push(G.shielding(arg0)); 
	    });
	    ar.push("<tr>",
		"<th>", lang.department, ":</th>",
		"<th class='ref' colspan='3'>", t.join('<br/>'), "</th>",
		"</tr>");
	}
	if( Array.isArray(data.distributors) && data.distributors.length > 0 ) {
	    var t = []
	    data.distributors.forEach(function(arg0, arg1, arg2) { 
		t.push(G.shielding(arg0)); 
	    });
	    ar.push("<tr>",
		"<th>", lang.distributor, ":</th>",
		"<th class='ref' colspan='3'>", t.join('<br/>'), "</th>",
		"</tr>");
	}
	if( !Array.isEmpty(cancellation) ) {
	    ar.push("<tr>",
		"<td>", lang.tech.route.cancellation, ":</td>", 
		"<td class='ref attention' colspan='3'>", cancellation.join("<br/>"), "</td>",
		"</tr>");
	}
	if( alive ) {
	    ar.push("<tr>",
		"<td>", lang.workday, ":</td>", 
		"<td class='int' width='80px'>", (data.wd != null && data.wd.b != null) ? G.gettime_l(data.wd.b) : lang.dash, "</td>",
		"<td class='int' width='80px'>", (data.wd != null && data.wd.e != null) ? G.gettime_l(data.wd.e) : lang.dash, "</td>",
		"<td class='int' width='140px'>", (data.wd != null && data.wd.b != null && data.wd.e != null) ? lang.minutes.format_a(
		    Math.round((Date.parseISO8601(data.wd.e)-Date.parseISO8601(data.wd.b))/60000)) : lang.dash,"</td>",
		"</tr>");
	}
	if( alive ) {
	    ar.push("<tr>",
		"<td>", lang.route_compliance.wd, ":</td>", 
		"<td class='int' width='80px'>", (data.rd != null && data.rd.b != null) ? G.gettime_l(data.rd.b) : lang.dash, "</td>",
		"<td class='int' width='80px'>", (data.rd != null && data.rd.e != null) ? G.gettime_l(data.rd.e) : lang.dash, "</td>",
		"<td class='int' width='140px'>", (data.rd != null && data.rd.b != null && data.rd.e != null) ? "{0} ({1})".format_a(
		    lang.minutes.format_a(Math.round((Date.parseISO8601(data.rd.e)-Date.parseISO8601(data.rd.b))/60000)), 
			lang.minutes.format_a(data.rd.indoor)) 
		    : lang.dash,"</td>",
		"</tr>");
	}
	if( alive && data.wd != null && data.wd.mileage != null && data.wd.mileage/1000 > 0 ) {
	    ar.push("<tr>",
		"<td>", lang.mileageTotal, ":</td>", 
		"<td class='int' colspan='3'>", lang.kilometers.format_a(parseFloat(data.wd.mileage/1000.0).toFixed(1)), "</td>",
		"</tr>");
	}
	if( alive && data.rd != null && data.rd.mileage != null && data.rd.mileage/1000 > 0 ) {
	    ar.push("<tr>",
		"<td>", lang.route_mileage, ":</td>", 
		"<td class='int' colspan='3'>", lang.kilometers.format_a(parseFloat(data.rd.mileage/1000.0).toFixed(1)), "</td>",
		"</tr>");
	}
	if( alive && !violations.isEmpty() ) {
	    ar.push("<tr>",
		"<td>", lang.violations._caption, ":</td>", 
		"<td class='ref attention' colspan='3'>", violations.join("<hr/>"), "</td>",
		"</tr>");
	}
	if( alive && docs != null ) {
	    ar.push("<tr class='def'>",
		"<td colspan='4' class='divider'>", lang.tech.route.docs, "</td>",
		"</tr>");
	    for( var k in docs ) {
		var ptr = docs[k];
		ar.push("<tr>");
		if( (ptr.count - ptr.inprogress) > 0 && PLUG.containsRef(k) ) {
		    ar.push("<td class='ref_L'><span onclick='PLUG.selectRef(\"", k, "\")'>", lang.doctypes[k], "</span>:</td>");
		} else {
		    ar.push("<td>", lang.doctypes[k], ":</td>");
		}
		ar.push("<td class='int' width='80px'>", ptr.count, "</td>");
		ar.push("<td class='int", ptr.inprogress ? " attention footnote" : "", "'", ptr.inprogress ? " data-title='{0}'".format_a(lang.tech.route.not_delivered) : ""," width='80px'>", 
			ptr.inprogress ? "&#x021AA;&nbsp;{0}".format_a(ptr.inprogress) : lang.dash, "</td>");
		ar.push("<td class='int' width='140px'>", (ptr.duration < 60 ? lang.seconds : lang.minutes).format_a(ptr.duration < 60 ? ptr.duration : Math.round(ptr.duration/60)), "</td>");
		ar.push("</tr>");
	    }
	}
	ar.push("</table>");
	ar.push("</td>");
	ar.push("</tr></table>");

	return ar;
    }

    function _moretbl1(data, account_id) {
	const duration = function(arg) {
	    let d = 0;
	    arg.forEach(function(e) { d += e.duration || 0; });
	    return d;
	}
	let ar = [], a = data.my_accounts[account_id] || {}, xs;
	ar.push("<table width='100%'>","<tr>","<td>");
	ar.push("<div>", "<b>{0}: {1}</b>".format_a(G.shielding(a.a_code), G.shielding(a.descr)), "</div>");
	ar.push("<div>", G.shielding(a.address), "</div>");
	if( !String.isEmpty(a.chan) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.chan_name, G.shielding(a.chan)), "</div>");
	}
	if( !String.isEmpty(a.poten) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.poten, G.shielding(a.poten)), "</div>");
	}
	if( !String.isEmpty(a.rc) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.rc_name, G.shielding(a.rc)), "</div>");
	}
	ar.push("</td>", "<td width='10px'/>", "<td width='270px' style='text-align:right;'>");
	ar.push("<div>", "{0}: {1}".format_a(lang.u_code, G.shielding(data.user_id)), "</div>");
	ar.push("<div>", "{0}: {1}".format_a(lang.dev_login, G.shielding(data.dev_login)), "</div>");
	ar.push("<div>", "{0}: <b>{1}</b>".format_a(lang.date, G.getdate_l(data.date)), "</div>");
	ar.push("</td>","</tr>","</table>");
	ar.push("<br/>");
	((data._x[account_id] || [])._refs || []).forEach(function(element, index) {
	    let r = element.ref, t = element._t, f = typeof __availabilityColumns == 'object' ? __availabilityColumns : {};
	    if( index > 0 ) {
		ar.push("<hr/>");
	    }
	    if( t == "#av" ) {
		ar.push("<div>");
		ar.push("<h2>", lang.availability, "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(r.duration)), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider footnote' width='25px' data-title='", lang.matrix, "'>", lang.matrixAbbr, "</td>");
		if( f.checkup ) {
		    ar.push("<td class='divider' width='55px'>", lang.exist, "</td>");
		    //ar.push("<td class='divider' width='25px'>", "&nbsp;", "</td>");
		}
		if( f.presence ) {
		    ar.push("<td class='divider' width='70px'>", lang.facing, "</td>");
		    ar.push("<td class='divider' width='70px'>", lang.shelf_stock, "</td>");
		    //ar.push("<td class='divider' width='25px'>", "&nbsp;", "</td>");
		}
		if( f.stock ) {
		    ar.push("<td class='divider' width='70px'>", lang.stock, "</td>");
		    //ar.push("<td class='divider' width='25px'>", "&nbsp;", "</td>");
		}
		if( f.oos ) {
		    ar.push("<td class='divider'>", lang.oos_type, "</td>");
		    ar.push("<td class='divider'>", lang.note, "</td>");
		}
		ar.push("</tr>");
		r.rows.forEach(function(arg0, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='bool'>", arg0.hasOwnProperty("matrix") ? lang.matrixAbbr : "", "</td>");
		    if( f.checkup ) {
			if( arg0.hasOwnProperty("checkup") ) {
			    ar.push("<td class='bool'>", arg0.checkup.exist == 1 ? lang.plus : (arg0.checkup.exist == 2 ? lang.shortage : lang.dash), "</td>");
			    //ar.push("<td class='bool'>", String.isEmpty(arg0.checkup.scratch) ? "" : "&#x267A;", "</td>");
			} else {
			    ar.push("<td class='bool'>", "</td>");
			    //ar.push("<td class='bool'>", "</td>");
			}
		    }
		    if( f.presence ) {
			if( arg0.hasOwnProperty("presence") ) {
			    ar.push("<td class='int'>", G.getint_l(arg0.presence.facing), "</td>");
			    ar.push("<td class='int'>", G.getint_l(arg0.presence.stock), "</td>");
			    //ar.push("<td class='bool'>", String.isEmpty(arg0.presence.scratch) ? "" : "&#x267A;", "</td>");
			} else {
			    ar.push("<td class='int'>", "</td>");
			    ar.push("<td class='int'>", "</td>");
			    //ar.push("<td class='bool'>", "</td>");
			}
		    }
		    if( f.stock ) {
			if( arg0.hasOwnProperty("stock") ) {
			    ar.push("<td class='int'>", G.getint_l(arg0.stock.stock), "</td>");
			    //ar.push("<td class='bool'>", String.isEmpty(arg0.stock.scratch) ? "" : "&#x267A;", "</td>");
			} else {
			    ar.push("<td class='int'>", "</td>");
			    //ar.push("<td class='bool'>", "</td>");
			}
		    }
		    if( f.oos ) {
			if( arg0.hasOwnProperty("oos") ) {
			    ar.push("<td class='ref'>", G.shielding(arg0.oos.oos_type), "</td>");
			    ar.push("<td class='string'>", G.shielding(arg0.oos.note), "</td>");
			} else {
			    ar.push("<td class='ref'>", "</td>");
			    ar.push("<td class='string'>", "</td>");
			}
		    }
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "advt" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(r.duration)), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.pos_material, "</td>");
		ar.push("<td class='divider'>", lang.placement, "</td>");
		ar.push("<td class='divider'>", lang.exist, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.posm), "</td>");
		    ar.push("<td class='ref'>", G.shielding(arg0.placement), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.qty), "</td>");
		    ar.push("<td class='bool'>", String.isEmpty(arg0.scratch) ? "" : "&#x267A;", "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "audit" ) {
		r.forEach(function(e, index) {
		    if( index > 0 ) {
			ar.push("<hr/>");
		    }
		    ar.push("<div>");
		    ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), 
			"<span class='r'>", "{0}. <i>{1}</i>: {2}".format_a(G.shielding(e.categ).trunc(30), lang.sla.result, G.getpercent_l(e.sla)),
			"</span>", "</h2>");
		    ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(e.duration)), "</span>");
		    ar.push("</div>");
		    ar.push("<table width='100%' class='report'>");
		    ar.push("<tr class='def'>");
		    ar.push("<td class='divider'>", lang.num, "</td>");
		    ar.push("<td class='divider'>", lang.sla.criteria, "</td>");
		    ar.push("<td class='divider' width='50px'>", lang.sla.score, "</td>");
		    ar.push("<td class='divider'>", lang.note, "</td>");
		    ar.push("<td class='divider' width='50px'>", lang.photo, "</td>");
		    ar.push("</tr>");
		    e.rows.forEach(function(arg0, arg1, arg3) {
			ar.push("<tr>");
			ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
			ar.push("<td class='string'>", G.shielding(arg0.descr), "</td>");
			ar.push("<td class='int'>", G.getint_l(arg0.score), "</td>");
			ar.push("<td class='string'>", G.shielding(arg0.note), "</td>");
			if( arg1 == 0 ) {
			    ar.push("<td class='ref def' rowspan='", arg3.length, "'>");
			    if( Array.isArray(e.photos) ) {
				e.photos.forEach(function(arg0, arg1, arg2) {
				    ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
					(arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
				});
			    }
			    ar.push("</td>");
			}
			ar.push("</tr>");
		    });
		    ar.push("</table>");
		});
	    } else if( t == "checkup" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(r.duration)), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider'>", lang.exist, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='bool'>", arg0.exist == 1 ? lang.plus : (arg0.exist == 2 ? lang.shortage : lang.dash), "</td>");
		    ar.push("<td class='bool'>", String.isEmpty(arg0.scratch) ? "" : "&#x267A;", "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "comment" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(duration(r))), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.comments.type, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		r.forEach(function(e, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='string' width='250px'>", G.shielding(e.comment_type), "</td>");
		    ar.push("<td class='string'>", G.shielding(e.doc_note), "</td>");
		    ar.push("<td class='ref' width='95px'>");
		    if( String.isEmpty(e.blob_id) ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<a href='javascript:void(0);' onclick='PLUG.slideshow([\"", e.blob_id, "\"],1)'>",
			    lang.view, "</a>");
		    }
		    ar.push("</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "confirmation" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(duration(r))), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider' width='150px'>", lang.targets.subject.caption, "</td>");
		ar.push("<td class='divider'>", lang.targets.body.caption, "</td>");
		ar.push("<td class='divider'>", lang.validity, "</td>");
		ar.push("<td class='divider' width='180px'>", lang.confirmations.type, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		r.forEach(function(e, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='string'>", G.shielding(e.subject), "<div class='watermark'>", G.shielding(e.target_type), "</div></td>");
		    ar.push("<td class='string'>", G.shielding(e.body), "</td>");
		    ar.push("<td class='date'>", G.getdate_l(e.b_date), "<div class='watermark'>", G.getdate_l(e.e_date), "</div></td>");
		    ar.push("<td class='ref'>", G.shielding(e.confirm), "<div class='watermark'>", G.shielding(e.doc_note), "</div></td>");
		    ar.push("<td class='ref'>");
		    if( Array.isArray(e.photos) ) {
			e.photos.forEach(function(arg0, arg1, arg2) {
			    ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
				(arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
			});
		    }
		    ar.push("</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "oos" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(r.duration)), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider'>", lang.oos_type, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='ref'>", G.shielding(arg0.oos_type), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.note), "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "order" ) {
		r.forEach(function(e, index) {
		    if( index > 0 ) {
			ar.push("<hr/>");
		    }
		    ar.push("<div>");
		    ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), 
			"<span class='r'>", "{0}. <i>{1}</i>: {2}".format_a(G.shielding(e.order_type).trunc(20), lang.amount, G.getcurrency_l(e.amount)),
			"</span>", "</h2>");
		    ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(e.duration)), "</span>");
		    ar.push("</div>");
		    ar.push("<table width='100%' class='report'>");
		    ar.push("<tr class='def'>");
		    ar.push("<td class='divider'>", lang.num, "</td>");
		    ar.push("<td class='divider'>", lang.code, "</td>");
		    ar.push("<td class='divider'>", lang.prod_name, "</td>");
		    ar.push("<td class='divider' width='95px'>", lang.price, "</td>");
		    ar.push("<td class='divider' width='55px'>", lang.qty, "</td>");
		    ar.push("<td class='divider'>", lang.pack, "</td>");
		    ar.push("<td class='divider' width='65px'>", lang.discount, "</td>");
		    ar.push("<td class='divider' width='95px'>", lang.amount, "</td>");
		    ar.push("</tr>");
		    e.rows.forEach(function(arg0) {
			ar.push("<tr>");
			ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
			ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
			ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
			ar.push("<td class='numeric'>", G.getcurrency_l(arg0.unit_price), "</td>");
			ar.push("<td class='int'>", G.getint_l(arg0.qty), "</td>");
			ar.push("<td class='int'>", G.shielding(arg0.pack_name), "</td>");
			ar.push("<td class='int'>", arg0.discount > 0 ? G.getpercent_l(arg0.discount) : lang.dash, "</td>");
			ar.push("<td class='numeric'>", G.getcurrency_l(arg0.amount), "</td>");
			ar.push("</tr>");
		    });
		    ar.push("</table>");
		});
	    } else if( t == "photo" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(duration(r))), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.placement, "</td>");
		ar.push("<td class='divider'>", lang.brand, "</td>");
		ar.push("<td class='divider'>", lang.photos.type, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("</tr>");
		r.forEach(function(e, row_no) {
		    xs = typeof e.revoked != 'undefined' && e.revoked ? ' strikethrough' : '';
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='ref", xs, "' width='200px'>");
		    ar.push(G.shielding(e.placement));
		    if( !String.isEmpty(e.asp_type) ) {
			ar.push("<div class='row watermark'>", G.shielding(e.asp_type), "</div>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref", xs, "' width='100px'>", G.shielding(e.brand), "</td>");
		    ar.push("<td class='ref", xs, "' width='200px'>", G.shielding(e.photo_type), "</td>");
		    ar.push("<td class='ref' width='130px'>");
		    if( String.isEmpty(e.blob_id) ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<img class='clickable' onclick='PLUG.slideshow([", e.blob_id, "],1)' height='90px' src='",
			    G.getdataref({plug: "tech", blob: "yes", thumb: "yes", blob_id: e.blob_id}), "' />");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string", xs, "'>");
		    if( !String.isEmpty(e.doc_note) ) {
			ar.push("<div class='row'>", G.shielding(e.doc_note), "</div>");
		    }
		    if( !Array.isEmpty(e.photo_params) ) {
			if( !String.isEmpty(e.doc_note) ) {
			    ar.push("<hr/>");
			}
			e.photo_params.forEach(function(val, index) {
			    if( index > 0 ) { ar.push("<hr/>"); }
			    ar.push("<div class='row remark'>", G.shielding(val), "</div>");
			});
		    }
		    ar.push("</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "posm" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(duration(r))), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.placement, "</td>");
		ar.push("<td class='divider'>", lang.pos_material, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("</tr>");
		r.forEach(function(e, row_no) {
		    xs = typeof e.revoked != 'undefined' && e.revoked ? ' strikethrough' : '';
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='ref", xs, "' width='200px'>", G.shielding(e.placement), "</td>");
		    ar.push("<td class='ref", xs, "' width='300px'>", G.shielding(e.posm), "</td>");
		    ar.push("<td class='ref' width='130px'>");
		    if( String.isEmpty(e.blob_id) ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<img class='clickable' onclick='PLUG.slideshow([", e.blob_id, "],1)' height='90px' src='",
			    G.getdataref({plug: "tech", blob: "yes", thumb: "yes", blob_id: e.blob_id}), "' />");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string", xs, "'>", G.shielding(e.doc_note), "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "presence" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(r.duration)), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider' width='75px'>", lang.facing, "</td>");
		ar.push("<td class='divider' width='75px'>", lang.shelf_stock, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.facing), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.stock), "</td>");
		    ar.push("<td class='bool'>", String.isEmpty(arg0.scratch) ? "" : "&#x267A;", "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "presentation" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(duration(r))), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider' width='450px'>", lang.training_material, "</td>");
		ar.push("<td class='divider' width='75px'>", lang.participants, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		r.forEach(function(e, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='ref'>");
		    if( Array.isArray(e.tms) ) {
			e.tms.forEach(function(arg0, arg1) {
			    if( arg1 > 0 ) {
				ar.push("<br/>");
			    }
			    ar.push(G.shielding(arg0));
			});
		    }
		    ar.push("</td>");
		    ar.push("<td class='int'>", G.getint_l(e.participants), "</td>");
		    ar.push("<td class='string'>", G.shielding(e.doc_note), "</td>");
		    ar.push("<td class='ref'>");
		    if( Array.isArray(e.photos) ) {
			e.photos.forEach(function(arg0, arg1, arg2) {
			    ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
				(arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
			});
		    }
		    ar.push("</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "price" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(r.duration)), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider' width='85px'>", lang.price, "</td>");
		ar.push("<td class='divider' width='85px'>", lang.promo, "</td>");
		ar.push("<td class='divider' width='35px'>", lang.discount, "</td>");
		ar.push("<td class='divider' width='85px'>", lang.rrp, "</td>");
		ar.push("<td class='divider' width='35px'>", lang.photo, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='int'>", G.getcurrency_l(arg0.price), "</td>");
		    ar.push("<td class='int'>", G.getcurrency_l(arg0.promo), "</td>");
		    ar.push("<td class='bool'>", (arg0.discount ? lang.plus : "&nbsp;"), "</td>");
		    ar.push("<td class='int'>", G.getcurrency_l(arg0.rrp), "</td>");
		    ar.push("<td class='ref'>");
		    if( String.isEmpty(arg0.blob_id) ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<a href='javascript:void(0);' onclick='PLUG.slideshow([\"", arg0.blob_id, "\"],1)'>",
			    "[&nbsp;1&nbsp;]", "</a>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.note), "</td>");
		    ar.push("<td class='bool'>", String.isEmpty(arg0.scratch) ? "" : "&#x267A;", "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "promo" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(duration(r))), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.categ_name, "</td>");
		ar.push("<td class='divider'>", lang.brand, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider'>", lang.promos.type, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		r.forEach(function(e, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='ref'>", G.shielding(e.categ), "</td>");
		    ar.push("<td class='ref'>", G.shielding(e.brand), "</td>");
		    ar.push("<td class='ref'>", G.shielding(e.prod), "</td>");
		    ar.push("<td class='ref'>");
		    if( Array.isArray(e.promo_types) ) {
			e.promo_types.forEach(function(arg0, arg1) {
			    if( arg1 > 0 ) {
				ar.push("<br/>");
			    }
			    ar.push(G.shielding(arg0));
			});
		    }
		    ar.push("</td>");
		    ar.push("<td class='string'>", G.shielding(e.doc_note), "</td>");
		    ar.push("<td class='ref'>");
		    if( Array.isArray(e.photos) ) {
			e.photos.forEach(function(arg0, arg1, arg2) {
			    ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
				(arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
			});
		    }
		    ar.push("</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "quest" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(r.duration)), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.qname, "</td>");
		ar.push("<td class='divider'>", lang.qpath, "</td>");
		ar.push("<td class='divider'>", lang.qrow, "</td>");
		ar.push("<td class='divider'>", lang.qvalue, "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='ref'>", G.shielding(arg0.qname), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.qpath), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.qrow), "</td>");
		    ar.push("<td class='ref'>", G.shielding(arg0.value), "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "rating" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), 
		    "<span class='r'>", "{0}. <i>{1}</i>: {2} ({3})".format_a(G.shielding(r.e_name), lang.sla.result, G.getnumeric_l(r.assessment, 2),
			G.getpercent_l(r.sla)), "</span>", "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(r.duration)), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.sla.criteria, "</td>");
		ar.push("<td class='divider' width='50px'>", lang.sla.score, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.descr), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.score), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.note), "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "reclamation" ) {
		r.forEach(function(e, index) {
		    if( index > 0 ) {
			ar.push("<hr/>");
		    }
		    ar.push("<div>");
		    ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), 
			"<span class='r'>", "<i>{0}</i>: {1}".format_a(lang.amount, G.getcurrency_l(e.amount)),
			"</span>", "</h2>");
		    ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(e.duration)), "</span>");
		    ar.push("</div>");
		    ar.push("<table width='100%' class='report'>");
		    ar.push("<tr class='def'>");
		    ar.push("<td class='divider'>", lang.num, "</td>");
		    ar.push("<td class='divider'>", lang.code, "</td>");
		    ar.push("<td class='divider'>", lang.prod_name, "</td>");
		    ar.push("<td class='divider' width='95px'>", lang.price, "</td>");
		    ar.push("<td class='divider' width='55px'>", lang.qty, "</td>");
		    ar.push("<td class='divider'>", lang.pack, "</td>");
		    ar.push("<td class='divider' width='95px'>", lang.amount, "</td>");
		    ar.push("<td class='divider'>", lang.reclamation_type, "</td>");
		    ar.push("</tr>");
		    e.rows.forEach(function(arg0) {
			ar.push("<tr>");
			ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
			ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
			ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
			ar.push("<td class='numeric'>", G.getcurrency_l(arg0.unit_price), "</td>");
			ar.push("<td class='int'>", G.getint_l(arg0.qty), "</td>");
			ar.push("<td class='int'>", G.shielding(arg0.pack_name), "</td>");
			ar.push("<td class='numeric'>", G.getcurrency_l(arg0.amount), "</td>");
			ar.push("<td class='ref'>", G.shielding(arg0.reclamation_type), "</td>");
			ar.push("</tr>");
		    });
		    ar.push("</table>");
		});
	    } else if( t == "shelf" ) {
		r.forEach(function(e, index) {
		    if( index > 0 ) {
			ar.push("<hr/>");
		    }
		    ar.push("<div>");
		    ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), 
			"<span class='r'>", "{0}: {1} / {2}".format_a(G.shielding(e.categ).trunc(30), G.getpercent_l(e.sos), G.getpercent_l(e.soa)),
			"</span>", "</h2>");
		    ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(e.duration)), "</span>");
		    ar.push("</div>");
		    ar.push("<table width='100%' class='report'>");
		    ar.push("<tr class='def'>");
		    ar.push("<td class='divider'>", lang.num, "</td>");
		    ar.push("<td class='divider'>", lang.brand, "</td>");
		    ar.push("<td class='divider' width='75px'>", lang.facing, "</td>");
		    ar.push("<td class='divider' width='75px'>", lang.assortment, "</td>");
		    ar.push("<td class='divider' width='50px'>", lang.photo, "</td>");
		    ar.push("</tr>");
		    e.rows.forEach(function(arg0, arg1, arg3) {
			ar.push("<tr>");
			ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
			ar.push("<td class='string'>", G.shielding(arg0.descr, lang.other), "</td>");
			ar.push("<td class='int'>", G.getint_l(arg0.facing), "</td>");
			ar.push("<td class='int'>", G.getint_l(arg0.assortment), "</td>");
			if( arg1 == 0 ) {
			    ar.push("<td class='ref def' rowspan='", arg3.length, "'>");
			    if( Array.isArray(e.photos) ) {
				e.photos.forEach(function(arg0, arg1, arg2) {
				    ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
					(arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
				});
			    }
			    ar.push("</td>");
			}
			ar.push("</tr>");
		    });
		    ar.push("</table>");
		});
	    } else if( t == "stock" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(r.duration)), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider' width='75px'>", lang.stock, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.stock), "</td>");
		    ar.push("<td class='bool'>", String.isEmpty(arg0.scratch) ? "" : "&#x267A;", "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "target" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(duration(r))), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.targets.subject.caption, "</td>");
		ar.push("<td class='divider'>", lang.targets.body.caption, "</td>");
		ar.push("<td class='divider'>", lang.validity, "</td>");
		ar.push("<td class='divider'>", lang.targets.type, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		r.forEach(function(e, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='string' width='150px'>", G.shielding(e.subject), "</td>");
		    ar.push("<td class='string'>", G.shielding(e.doc_note), "</td>");
		    ar.push("<td class='date'>", G.getdate_l(e.b_date), "<div class='watermark'>", G.getdate_l(e.e_date), "</div></td>");
		    ar.push("<td class='ref' width='180px'>", G.shielding(e.target_type), "</td>");
		    ar.push("<td class='ref' width='95px'>");
		    if( String.isEmpty(e.blob_id) ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<a href='javascript:void(0);' onclick='PLUG.slideshow([\"", e.blob_id, "\"],1)'>",
			    lang.view, "</a>");
		    }
		    ar.push("</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( t == "training" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0}".format_a(lang.doctypes[t]), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.time_spent, lang.seconds.format_a(duration(r))), "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.training_type, "</td>");
		ar.push("<td class='divider' width='300px'>", lang.training_material, "</td>");
		ar.push("<td class='divider' width='250px'>", lang.contact, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		r.forEach(function(e, row_no) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", row_no + 1, "</td>");
		    ar.push("<td class='autoincrement'>", G.shielding(e.training_type), "</td>");
		    ar.push("<td class='ref'>");
		    if( Array.isArray(e.tms) ) {
			e.tms.forEach(function(arg0, arg1) {
			    if( arg1 > 0 ) {
				ar.push("<br/>");
			    }
			    ar.push(G.shielding(arg0));
			});
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref'>");
		    if( Array.isArray(e.contacts) ) {
			e.contacts.forEach(function(arg0, arg1) {
			    if( arg1 > 0 ) {
				ar.push("<br/>");
			    }
			    ar.push(lang.personFormat.format({name: G.shielding(arg0.name), patronymic: G.shielding(arg0.patronymic), 
				surname: G.shielding(arg0.surname)}).trim());
			});
		    }
		    ar.push("</td>");
		    ar.push("<td class='string'>", G.shielding(e.doc_note), "</td>");
		    ar.push("<td class='ref'>");
		    if( Array.isArray(e.photos) ) {
			e.photos.forEach(function(arg0, arg1, arg2) {
			    ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
				(arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
			});
		    }
		    ar.push("</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    }
	});
	ar.push("<br/>");
	return ar;
    }

    function _moretbl2(data, account_id, a_cookie) {
	let ar = [], a = data.my_accounts[account_id] || {}, xs;
	let b = data.route.find(function(e) { return e.account_id == account_id && e.a_cookie == a_cookie; });
	ar.push("<table width='100%'>","<tr>","<td>");
	ar.push("<div>", "<b>{0}: {1}</b>".format_a(G.shielding(a.a_code), G.shielding(a.descr)), "</div>");
	ar.push("<div>", G.shielding(a.address), "</div>");
	if( !String.isEmpty(a.chan) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.chan_name, G.shielding(a.chan)), "</div>");
	}
	if( !String.isEmpty(a.poten) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.poten, G.shielding(a.poten)), "</div>");
	}
	if( !String.isEmpty(a.rc) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.rc_name, G.shielding(a.rc)), "</div>");
	}
	ar.push("</td>", "<td width='10px'/>", "<td width='270px' style='text-align:right;'>");
	ar.push("<div>", "{0}: {1}".format_a(lang.u_code, G.shielding(data.user_id)), "</div>");
	ar.push("<div>", "{0}: {1}".format_a(lang.dev_login, G.shielding(data.dev_login)), "</div>");
	ar.push("<div>", "<i>{0}</i>".format_a(G.shielding(b.activity_type)), "</div>");
	ar.push("<div>", "{0}: <b>{1}</b> ({2} - {3})".format_a(lang.date, G.getdate_l(data.date),
	    G.gettime_l(b.b_dt), G.gettime_l(b.e_dt)), "</div>");
	ar.push("<div>", "{0}: {1}".format_a(lang.cookie, G.shielding(b.a_cookie)), "</div>");
	ar.push("</td>","</tr>","</table>");
	ar.push("<br/>");
	(data._d["{0}:{1}".format_a(account_id, a_cookie)] || []).forEach(function(r, index) {
	    if( index > 0 ) {
		ar.push("<hr/>");
	    }
	    if( r._t == "advt" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.pos_material, "</td>");
		ar.push("<td class='divider'>", lang.placement, "</td>");
		ar.push("<td class='divider'>", lang.exist, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.posm), "</td>");
		    ar.push("<td class='ref'>", G.shielding(arg0.placement), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.qty), "</td>");
		    ar.push("<td class='bool'>", String.isEmpty(arg0.scratch) ? "" : "&#x267A;", "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "audit" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), 
		    "<span class='r'>", "{0}. <i>{1}</i>: {2}".format_a(G.shielding(r.categ).trunc(20), lang.sla.result, G.getpercent_l(r.sla)),
		    "</span>", "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.sla.criteria, "</td>");
		ar.push("<td class='divider' width='50px'>", lang.sla.score, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider' width='50px'>", lang.photo, "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0, arg1, arg3) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.descr), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.score), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.note), "</td>");
		    if( arg1 == 0 ) {
			ar.push("<td class='ref def' rowspan='", arg3.length, "'>");
			if( Array.isArray(r.photos) ) {
			    r.photos.forEach(function(arg0, arg1, arg2) {
				ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
				    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
			    });
			}
			ar.push("</td>");
		    }
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "checkup" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider'>", lang.exist, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='bool'>", arg0.exist == 1 ? lang.plus : (arg0.exist == 2 ? lang.shortage : lang.dash), "</td>");
		    ar.push("<td class='bool'>", String.isEmpty(arg0.scratch) ? "" : "&#x267A;", "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "comment" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.comments.type, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		ar.push("<tr>");
		ar.push("<td class='string' width='250px'>", G.shielding(r.comment_type), "</td>");
		ar.push("<td class='string'>", G.shielding(r.doc_note), "</td>");
		ar.push("<td class='ref' width='95px'>");
		if( String.isEmpty(r.blob_id) ) {
		    ar.push("&nbsp;");
		} else {
		    ar.push("<a href='javascript:void(0);' onclick='PLUG.slideshow([\"", r.blob_id, "\"],1)'>",
			lang.view, "</a>");
		}
		ar.push("</td>");
		ar.push("</tr>");
		ar.push("</table>");
	    } else if( r._t == "confirmation" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider' width='150px'>", lang.targets.subject.caption, "</td>");
		ar.push("<td class='divider'>", lang.targets.body.caption, "</td>");
		ar.push("<td class='divider'>", lang.validity, "</td>");
		ar.push("<td class='divider' width='180px'>", lang.confirmations.type, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		ar.push("<tr>");
		ar.push("<td class='string'>", G.shielding(r.subject), "<div class='watermark'>", G.shielding(r.target_type), "</div></td>");
		ar.push("<td class='string'>", G.shielding(r.body), "</td>");
		ar.push("<td class='date'>", G.getdate_l(r.b_date), "<div class='watermark'>", G.getdate_l(r.e_date), "</div></td>");
		ar.push("<td class='ref'>", G.shielding(r.confirm), "<div class='watermark'>", G.shielding(r.doc_note), "</div></td>");
		ar.push("<td class='ref'>");
		if( Array.isArray(r.photos) ) {
		    r.photos.forEach(function(arg0, arg1, arg2) {
			ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
			    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
		    });
		}
		ar.push("</td>");
		ar.push("</tr>");
		ar.push("</table>");
	    } else if( r._t == "deletion" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		ar.push("<tr>");
		ar.push("<td class='string'>", G.shielding(r.doc_note), "</td>");
		ar.push("<td class='ref' width='95px'>");
		if( String.isEmpty(r.blob_id) ) {
		    ar.push("&nbsp;");
		} else {
		    ar.push("<a href='javascript:void(0);' onclick='PLUG.slideshow([\"", r.blob_id, "\"],1)'>",
			lang.view, "</a>");
		}
		ar.push("</td>");
		ar.push("</tr>");
		ar.push("</table>");
	    } else if( r._t == "oos" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider'>", lang.oos_type, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='ref'>", G.shielding(arg0.oos_type), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.note), "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "order" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), 
		    "<span class='r'>", "{0}. <i>{1}</i>: {2}".format_a(G.shielding(r.order_type).trunc(20), lang.amount, G.getcurrency_l(r.amount)),
		    "</span>", "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider' width='95px'>", lang.price, "</td>");
		ar.push("<td class='divider' width='55px'>", lang.qty, "</td>");
		ar.push("<td class='divider'>", lang.pack, "</td>");
		ar.push("<td class='divider' width='65px'>", lang.discount, "</td>");
		ar.push("<td class='divider' width='95px'>", lang.amount, "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='numeric'>", G.getcurrency_l(arg0.unit_price), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.qty), "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.pack_name), "</td>");
		    ar.push("<td class='int'>", arg0.discount > 0 ? G.getpercent_l(arg0.discount) : lang.dash, "</td>");
		    ar.push("<td class='numeric'>", G.getcurrency_l(arg0.amount), "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "photo" ) {
		xs = typeof r.revoked != 'undefined' && r.revoked ? ' strikethrough' : '';
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.placement, "</td>");
		ar.push("<td class='divider'>", lang.brand, "</td>");
		ar.push("<td class='divider'>", lang.photos.type, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("</tr>");
		ar.push("<tr>");
		ar.push("<td class='ref", xs, "' width='200px'>");
		ar.push(G.shielding(r.placement));
		if( !String.isEmpty(r.asp_type) ) {
			ar.push("<div class='row watermark'>", G.shielding(r.asp_type), "</div>");
		}
		ar.push("</td>");
		ar.push("<td class='ref", xs, "' width='100px'>", G.shielding(r.brand), "</td>");
		ar.push("<td class='ref", xs, "' width='200px'>", G.shielding(r.photo_type), "</td>");
		ar.push("<td class='ref' width='130px'>");
		if( String.isEmpty(r.blob_id) ) {
		    ar.push("&nbsp;");
		} else {
		    ar.push("<img class='clickable' onclick='PLUG.slideshow([", r.blob_id, "],1)' height='90px' src='",
			G.getdataref({plug: "tech", blob: "yes", thumb: "yes", blob_id: r.blob_id}), "' />");
		}
		ar.push("</td>");
		ar.push("<td class='string", xs, "'>");
		if( !String.isEmpty(r.doc_note) ) {
			ar.push("<div class='row'>", G.shielding(r.doc_note), "</div>");
		}
		if( !Array.isEmpty(r.photo_params) ) {
		    if( !String.isEmpty(r.doc_note) ) {
			ar.push("<hr/>");
		    }
		    r.photo_params.forEach(function(val, index) {
			if( index > 0 ) { ar.push("<hr/>"); }
			ar.push("<div class='row remark'>", G.shielding(val), "</div>");
		    });
		}
		ar.push("</td>");
		ar.push("</tr>");
		ar.push("</table>");
	    } else if( r._t == "posm" ) {
		xs = typeof r.revoked != 'undefined' && r.revoked ? ' strikethrough' : '';
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.placement, "</td>");
		ar.push("<td class='divider'>", lang.pos_material, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("</tr>");
		ar.push("<tr>");
		ar.push("<td class='ref", xs, "' width='200px'>", G.shielding(r.placement), "</td>");
		ar.push("<td class='ref", xs, "' width='300px'>", G.shielding(r.posm), "</td>");
		ar.push("<td class='ref' width='130px'>");
		if( String.isEmpty(r.blob_id) ) {
		    ar.push("&nbsp;");
		} else {
		    ar.push("<img class='clickable' onclick='PLUG.slideshow([", r.blob_id, "],1)' height='90px' src='",
			G.getdataref({plug: "tech", blob: "yes", thumb: "yes", blob_id: r.blob_id}), "' />");
		}
		ar.push("</td>");
		ar.push("<td class='string", xs, "'>", G.shielding(r.doc_note), "</td>");
		ar.push("</tr>");
		ar.push("</table>");
	    } else if( r._t == "presence" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider' width='75px'>", lang.facing, "</td>");
		ar.push("<td class='divider' width='75px'>", lang.shelf_stock, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.facing), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.stock), "</td>");
		    ar.push("<td class='bool'>", String.isEmpty(arg0.scratch) ? "" : "&#x267A;", "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "presentation" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider' width='450px'>", lang.training_material, "</td>");
		ar.push("<td class='divider' width='75px'>", lang.participants, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		ar.push("<tr>");
		ar.push("<td class='ref'>");
		if( Array.isArray(r.tms) ) {
		    r.tms.forEach(function(arg0, arg1) {
			if( arg1 > 0 ) {
			    ar.push("<br/>");
			}
			ar.push(G.shielding(arg0));
		    });
		}
		ar.push("</td>");
		ar.push("<td class='int'>", G.getint_l(r.participants), "</td>");
		ar.push("<td class='string'>", G.shielding(r.doc_note), "</td>");
		ar.push("<td class='ref'>");
		if( Array.isArray(r.photos) ) {
		    r.photos.forEach(function(arg0, arg1, arg2) {
			ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
			    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
		    });
		}
		ar.push("</td>");
		ar.push("</tr>");
		ar.push("</table>");
	    } else if( r._t == "price" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider' width='85px'>", lang.price, "</td>");
		ar.push("<td class='divider' width='85px'>", lang.promo, "</td>");
		ar.push("<td class='divider' width='35px'>", lang.discount, "</td>");
		ar.push("<td class='divider' width='85px'>", lang.rrp, "</td>");
		ar.push("<td class='divider' width='35px'>", lang.photo, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='int'>", G.getcurrency_l(arg0.price), "</td>");
		    ar.push("<td class='int'>", G.getcurrency_l(arg0.promo), "</td>");
		    ar.push("<td class='bool'>", (arg0.discount ? lang.plus : "&nbsp;"), "</td>");
		    ar.push("<td class='int'>", G.getcurrency_l(arg0.rrp), "</td>");
		    ar.push("<td class='ref'>");
		    if( String.isEmpty(arg0.blob_id) ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<a href='javascript:void(0);' onclick='PLUG.slideshow([\"", arg0.blob_id, "\"],1)'>",
			    "[&nbsp;1&nbsp;]", "</a>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.note), "</td>");
		    ar.push("<td class='bool'>", String.isEmpty(arg0.scratch) ? "" : "&#x267A;", "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "promo" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.categ_name, "</td>");
		ar.push("<td class='divider'>", lang.brand, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider'>", lang.promos.type, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		ar.push("<tr>");
		ar.push("<td class='ref'>", G.shielding(r.categ), "</td>");
		ar.push("<td class='ref'>", G.shielding(r.brand), "</td>");
		ar.push("<td class='ref'>", G.shielding(r.prod), "</td>");
		ar.push("<td class='ref'>");
		if( Array.isArray(r.promo_types) ) {
		    r.promo_types.forEach(function(arg0, arg1) {
			if( arg1 > 0 ) {
			    ar.push("<br/>");
			}
			ar.push(G.shielding(arg0));
		    });
		}
		ar.push("</td>");
		ar.push("<td class='string'>", G.shielding(r.doc_note), "</td>");
		ar.push("<td class='ref'>");
		if( Array.isArray(r.photos) ) {
		    r.photos.forEach(function(arg0, arg1, arg2) {
			ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
			    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
		    });
		}
		ar.push("</td>");
		ar.push("</tr>");
		ar.push("</table>");
	    } else if( r._t == "quest" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.qname, "</td>");
		ar.push("<td class='divider'>", lang.qpath, "</td>");
		ar.push("<td class='divider'>", lang.qrow, "</td>");
		ar.push("<td class='divider'>", lang.qvalue, "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='ref'>", G.shielding(arg0.qname), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.qpath), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.qrow), "</td>");
		    ar.push("<td class='ref'>", G.shielding(arg0.value), "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "rating" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), 
		    "<span class='r'>", "{0}. <i>{1}</i>: {2} ({3})".format_a(G.shielding(r.e_name), lang.sla.result, G.getnumeric_l(r.assessment, 2),
			G.getpercent_l(r.sla)), "</span>", "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.sla.criteria, "</td>");
		ar.push("<td class='divider' width='50px'>", lang.sla.score, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0, arg1) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.descr), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.score), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.note), "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "reclamation" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), 
		    "<span class='r'>", "<i>{0}</i>: {1}".format_a(lang.amount, G.getcurrency_l(r.amount)),
		    "</span>", "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider' width='95px'>", lang.price, "</td>");
		ar.push("<td class='divider' width='55px'>", lang.qty, "</td>");
		ar.push("<td class='divider'>", lang.pack, "</td>");
		ar.push("<td class='divider' width='95px'>", lang.amount, "</td>");
		ar.push("<td class='divider'>", lang.reclamation_type, "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='numeric'>", G.getcurrency_l(arg0.unit_price), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.qty), "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.pack_name), "</td>");
		    ar.push("<td class='numeric'>", G.getcurrency_l(arg0.amount), "</td>");
		    ar.push("<td class='ref'>", G.shielding(arg0.reclamation_type), "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "shelf" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), 
		    "<span class='r'>", "{0}: {1} / {2}".format_a(G.shielding(r.categ).trunc(20), G.getpercent_l(r.sos), G.getpercent_l(r.soa)),
		    "</span>", "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.brand, "</td>");
		ar.push("<td class='divider' width='75px'>", lang.facing, "</td>");
		ar.push("<td class='divider' width='75px'>", lang.assortment, "</td>");
		ar.push("<td class='divider' width='50px'>", lang.photo, "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0, arg1, arg3) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.descr, lang.other), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.facing), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.assortment), "</td>");
		    if( arg1 == 0 ) {
			ar.push("<td class='ref def' rowspan='", arg3.length, "'>");
			if( Array.isArray(r.photos) ) {
			    r.photos.forEach(function(arg0, arg1, arg2) {
				ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
				    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
			    });
			}
			ar.push("</td>");
		    }
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "stock" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.num, "</td>");
		ar.push("<td class='divider'>", lang.code, "</td>");
		ar.push("<td class='divider'>", lang.prod_name, "</td>");
		ar.push("<td class='divider' width='75px'>", lang.stock, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.stock), "</td>");
		    ar.push("<td class='bool'>", String.isEmpty(arg0.scratch) ? "" : "&#x267A;", "</td>");
		    ar.push("</tr>");
		});
		ar.push("</table>");
	    } else if( r._t == "target" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider'>", lang.targets.subject.caption, "</td>");
		ar.push("<td class='divider'>", lang.targets.body.caption, "</td>");
		ar.push("<td class='divider'>", lang.validity, "</td>");
		ar.push("<td class='divider'>", lang.targets.type, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		ar.push("<tr>");
		ar.push("<td class='string' width='150px'>", G.shielding(r.subject), "</td>");
		ar.push("<td class='string'>", G.shielding(r.doc_note), "</td>");
		ar.push("<td class='date'>", G.getdate_l(r.b_date), "<div class='watermark'>", G.getdate_l(r.e_date), "</div></td>");
		ar.push("<td class='ref' width='180px'>", G.shielding(r.target_type), "</td>");
		ar.push("<td class='ref' width='95px'>");
		if( String.isEmpty(r.blob_id) ) {
		    ar.push("&nbsp;");
		} else {
		    ar.push("<a href='javascript:void(0);' onclick='PLUG.slideshow([\"", r.blob_id, "\"],1)'>",
			lang.view, "</a>");
		}
		ar.push("</td>");
		ar.push("</tr>");
		ar.push("</table>");
	    } else if( r._t == "training" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), 
		    "<span class='r'>", G.shielding(r.training_type).trunc(20), "</span>", "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td class='divider' width='300px'>", lang.training_material, "</td>");
		ar.push("<td class='divider' width='300px'>", lang.contact, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		ar.push("<tr>");
		ar.push("<td class='ref'>");
		if( Array.isArray(r.tms) ) {
		    r.tms.forEach(function(arg0, arg1) {
			if( arg1 > 0 ) {
			    ar.push("<br/>");
			}
			ar.push(G.shielding(arg0));
		    });
		}
		ar.push("</td>");
		ar.push("<td class='ref'>");
		if( Array.isArray(r.contacts) ) {
		    r.contacts.forEach(function(arg0, arg1) {
			if( arg1 > 0 ) {
			    ar.push("<br/>");
			}
			ar.push(lang.personFormat.format({name: G.shielding(arg0.name), patronymic: G.shielding(arg0.patronymic), 
			    surname: G.shielding(arg0.surname)}).trim());
		    });
		}
		ar.push("</td>");
		ar.push("<td class='string'>", G.shielding(r.doc_note), "</td>");
		ar.push("<td class='ref'>");
		if( Array.isArray(r.photos) ) {
		    r.photos.forEach(function(arg0, arg1, arg2) {
			ar.push("<div class='ref'><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
			    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></div>");
		    });
		}
		ar.push("</td>");

		ar.push("</tr>");
		ar.push("</table>");
	    } else if( r._t == "wish" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), 
		    "&nbsp;&nbsp;&nbsp;(", lang.seconds.format_a(r.duration), ")", "</span>");
		ar.push("</div>");
		ar.push("<table width='100%' class='report'>");
		ar.push("<tr class='def'>");
		ar.push("<td colspan='", __routeWeeks, "' class='divider'>", lang.routes.weeks, "</td>");
		ar.push("<td colspan='7' class='divider'>", lang.routes.days, "</td>");
		ar.push("<td rowspan='2' class='divider'>", lang.note, "</td>");
		ar.push("</tr>");
		ar.push("<tr class='def'>");
		for( let i = 1; i <= __routeWeeks; i++ ) {
		    ar.push("<td width='20px' class='divider'>", i,"</td>");
		}
		for( let i = 0, a = lang.calendar.firstDay; i < 7; i++, a++ ) {
		    ar.push("<td width='20px' class='divider'>", lang.calendar.days.namesAbbr[a==7?0:a], "</td>");
		}
		ar.push("</tr>");
		ar.push("<tr>");
		for( let a = 1, f = Array.isArray(r.weeks); a <= __routeWeeks; a++ ) {
		    ar.push("<td class='bool'>", f && r.weeks[a-1] ? "&bull;" : "", "</td>");
		}
		for( let a = 1, f = Array.isArray(r.days); a <= 7; a++ ) {
		    ar.push("<td class='bool'>", f && r.days[a-1] ? "&bull;" : "", "</td>");
		}
		ar.push("<td class='string'>", G.shielding(r.doc_note), "</td>");
		ar.push("</tr>");
		ar.push("</table>");
	    } else {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), "</h2>");
		ar.push("<span class='watermark'>", "{0}: {1}".format_a(lang.fix_time, G.getlongtime_l(r.fix_dt)), "</span>");
		ar.push("</div>");
		ar.push("<br/>");
	    }
	});
	ar.push("<br/>");
	return ar;
    }

    function _zstatustbl(data) {
	var ar = [];
	ar.push("<h1>", lang.zstatus.caption, "</h1>");
	ar.push("<div onclick='event.stopPropagation();'>");
	ar.push("<p>");
	for( var i = 0; i < lang.notices.zstatus.length; i++ ) {
	    ar.push("<div class='row'>", lang.notices.zstatus[i], "</div>");
	}
	ar.push("</p>");
	ar.push("<div class='row attention gone' id='zalert'></div>");
	ar.push("<div class='row'><textarea id='znote' rows='6' maxlength='1024' autocomplete='off' placeholder='", 
	    lang.zstatus.placeholder, "'></textarea></div>");
	ar.push("<br/>");
	ar.push("<div align='center'>");
	ar.push("<button id='zaccept' disabled='true'>", lang.zstatus.accept, "</button>");
	ar.push("&nbsp;&nbsp;");
	ar.push("<button id='zreject' disabled='true'>", lang.zstatus.reject, "</button>");
	ar.push("</div>");
	ar.push("</div>");
	return ar;
    }

    function _compile_route(data) {
	var ar = [];
	var fn = function(obj) {
	    if( ar.every(function(element, index, array) {
		if( element._z == null || element._z.localeCompare(this._z) >= 0 ) {
		    array.splice(index, 0, this);
		    return false;
		}
		return true;
	    }, obj) ) {
		ar.push(obj);
	    }
	}
	if( Array.isArray(data.route) ) {
	    data.route.forEach(function(element, index, array) {
		ar.push({_z:element.b_dt, _t:"route", ptr:element});
	    });
	}
	if( Array.isArray(data.additions) ) {
	    data.additions.forEach(function(element, index, array) {
		fn({_z:element.fix_dt, _t:"addition", ptr:element});
	    });
	}
	if( Array.isArray(data.unsched) ) {
	    data.unsched.forEach(function(element, index, array) {
		fn({_z:element.fix_dt, _t:"unsched", ptr:element});
	    });
	}
	if( Array.isArray(data.reviews) ) {
	    data.reviews.forEach(function(element, index, array) {
		fn({_z:element.fix_dt, _t:"review", ptr:element});
	    });
	}
	if( Array.isArray(data.joints) ) {
	    data.joints.forEach(function(element, index, array) {
		fn({_z:element.fix_dt, _t:"joint", ptr:element});
	    });
	}

	return ar;
    }

    function _compile_docs(data) {
	const obj = {};
	const cb = function(code, a_id, ptr) {
	    let x;
	    if( !String.isEmpty(ptr.fix_dt) && !String.isEmpty(ptr.doc_no) && !String.isEmpty(ptr.a_cookie) ) {
		const z = "{0}:{1}".format_a(a_id, ptr.a_cookie);
		if( !obj.hasOwnProperty(z) ) {
		    x = obj[z] = [];
		} else {
		    x = obj[z];
		}
		if( x.every(function(element, index, array) {
		    if( element.fix_dt.localeCompare(this.fix_dt) >= 0 ) {
			array.splice(index, 0, this);
			return false;
		    }
		    return true;
		}, ptr) ) {
		    x.push(ptr);
		}
		ptr._t = code;
	    }
	}
	const fn = function(code) {
	    let x, z;
	    if( (x = data["{0}s".format_a(code)] || data[code] || data["{0}es".format_a(code)]) != null ) {
		for( var k in x ) {
		    if( (z = x[k]) != null ) {
			if( Array.isArray(z) ) {
			    z.forEach(function(element, index, array) { 
				cb(code, k, element); 
			    });
			} else {
			    cb(code, k, z);
			}
		    }
		}
	    }
	}

	fn("advt");
	fn("audit");
	fn("checkup");
	fn("comment");
	fn("confirmation");
	fn("deletion");
	fn("oos");
	fn("order");
	fn("photo");
	fn("posm");
	fn("presence");
	fn("presentation");
	fn("price");
	fn("promo");
	fn("quest");
	fn("rating");
	fn("reclamation");
	fn("shelf");
	fn("stock");
	fn("target");
	fn("training");
	fn("wish");

	return obj;
    }

    function _compile_results(data) {
	const obj = {}, rv = {};
	const cb = function(code, a_id, ptr, agg) {
	    let f = true, x, t;
	    if( !String.isEmpty(ptr.fix_dt) && !String.isEmpty(ptr.doc_no) ) {
		if( !obj.hasOwnProperty(a_id) ) {
		    obj[a_id] = {};
		    x = obj[a_id][code] = [];
		} else if( !obj[a_id].hasOwnProperty(code) ) {
		    x = obj[a_id][code] = [];
		} else {
		    x = obj[a_id][code];
		    f = false;
		}
		if( ptr.hasOwnProperty("_pkey") ) {
		    /* grouping by document */
		    t = x.findIndex(function(element1) {
			return element1._pkey == ptr._pkey && element1.fix_dt.localeCompare(ptr.fix_dt) < 0;
		    });
		    if( t >= 0 ) {
			x.splice(t, 1);
		    }
		    x.push(ptr);
		} else if( !Array.isEmpty(ptr.rows) && ptr.rows.first().hasOwnProperty("_pkey") ) {
		    /* grouping by rows */
		    if( f ) {
			x = obj[a_id][code] = {};
			if( typeof agg == 'function' ) {
			    agg(ptr, x);
			}
			x.fix_dt = ptr.fix_dt;
			x.duration = ptr.duration;
			x.rows = ptr.rows.clone();
		    } else {
			ptr.rows.forEach(function(element1, index, array) {
			    let j = x.rows.findIndex(function(element2) {
				return element1._pkey == element2._pkey;
			    });
			    if( j >= 0 ) {
				x.rows[j] = element1;
			    } else {
				x.rows.push(element1);
			    }
			});
			if( typeof agg == 'function' ) {
			    agg(ptr, x);
			}
			x.fix_dt = ptr.fix_dt;
			x.duration += ptr.duration;
		    }
		} else {
		    /* without grouping */
		    x.push(ptr);
		}
	    }
	}
	const fn = function(code, agg) {
	    let x, z;
	    if( (x = (data["{0}s".format_a(code)] || data[code] || data["{0}es".format_a(code)])) != null ) {
		for( const k in x ) {
		    if( (z = x[k]) != null ) {
			if( Array.isArray(z) ) {
			    z.forEach(function(element, index, array) { 
				cb(code, k, element, agg);
			    });
			} else {
			    cb(code, k, z, agg);
			}
		    }
		}
		/* adding ref to the ordering list */
		for( const k in obj ) {
		    if( (z = obj[k]) != null && z.hasOwnProperty(code) ) {
			if( !Array.isArray(z._refs) ) {
			    z._refs = [];
			}
			z._refs.push({_t:code,ref:z[code]});
		    }
		}
	    }
	}
	/* aggregate [checkups], [presences], [stocks] and [oos] rows */
	const agg = function(ar /*result*/, rows /*source*/, name) {
	    rows.forEach(function(element1, index, array) {
		let u, j = ar.findIndex(function(element2) {
		    return element1._pkey == element2._pkey;
		});
		if( j < 0 ) {
		    u = {
			_pkey: element1._pkey,
			p_code: element1.p_code, 
			prod: element1.prod
		    };
		    ar.push(u);
		} else {
		    u = ar[j];
		}
		u[name] = element1;
	    });
	};

	/* #1 */
	fn("order");
	fn("reclamation");
	/* #2 */
	fn("rating", function(arg0, arg1) { arg1.e_name = arg0.e_name; arg1.sla = arg0.sla; arg1.assessment = arg0.assessment; });
	fn("audit");
	/* #3 */
	fn("checkup");
	fn("presence");
	fn("stock");
	fn("oos");
	fn("price");
	fn("photo");
	fn("posm");
	fn("confirmation");
	fn("shelf");
	fn("advt");
	/* #4 */
	fn("target");
	fn("training");
	fn("presentation");
	fn("promo");
	fn("comment");
	fn("quest");

	/* aggregate matrices, checkup, presences, stocks and oos rows */
	if( typeof __availabilityColumns == 'object' ) {
	    for( const k in obj ) {
		let z = obj[k], av = {duration:0,rows:[]}, f = false;
		/* add matrices: */
		if( data.hasOwnProperty("matrices") ) {
		    if( (o = data.matrices[k]) != null && Array.isArray(o) ) {
			agg(av.rows, o, "matrix");
		    }
		}
		/* aggregate matrices, checkup, presences, stocks and oos rows */ 
		["checkup","presence","stock","oos"].forEach(function(arg) {
		    if( z.hasOwnProperty(arg) ) {
			const ptr = z[arg];
			av.duration += ptr.duration;
			agg(av.rows, ptr.rows, arg);
			/*
			z._refs.splice(z._refs.findIndex(function(element1) {
			    return element1._t == arg;
			}), 1);
			delete z[arg];
			*/
			f = true;
		    }
		});
		av.rows.sort(function(a, b) {
		    if( a.prod > b.prod ) return 1;
		    if( a.prod < b.prod ) return -1;
		    return 0;
		});
		av.rows.forEach(function(element1, index) {
		    element1.row_no = index;
		})
		z._av = av;
		if( f ) {
		    z._refs./*push*/unshift({_t:"#av",ref:av});
		}
	    }
	}

	return obj;
    }

    function _tm(arg0, arg1) {
	return G.getdate(arg0) == G.getdate(arg1) ? G.getlongtime_l(arg1) : G.getdatetime_l(arg1);
    }


    /* public properties & methods */
    return {
	getcaption: function() { return lang.tech.route.title0; },
	getbody: function() { return _gettable().join(""); },

	setdata: function(body, user_id, date, cb) {
	    var tbody = _("xztb"), stats = _("routeStats");
	    if( typeof _cache.data == 'undefined' ) {
		_cache.data = {};
	    }
	    if( _cache.data[user_id] != null ) { // sets data from the internal cache
		var ptr = _cache.data[user_id];
		tbody.html(_datatbl(ptr, user_id, date, _cache.checked).join(""));
		stats.html(_statstbl(ptr).join(""));
	    } else {
		ProgressDialog.show();
		_cache.data[user_id] = null; // drops the internal cache
		G.xhr("GET", G.getdataref({plug: "tech", code: "tech_route", user_id: user_id, date: G.getdate(date)}), "json", function(xhr, data) {
		    if( xhr.status == 200 &&  data != null && typeof data == 'object' ) {
			data._c = _compile_route(data);
			data._d = _compile_docs(data);
			data._x = _compile_results(data);
			//console.log(data);
			_cache.data[user_id] = data;
			tbody.html(_datatbl(data, user_id, date, _cache.checked).join(""));
			stats.html(_statstbl(data).join(""));
		    } else {
			tbody.html(["<tr class='def'><td colspan='", _getcolumns(), "' class='message'>", lang.failure, "</td></tr>"].join(""));
			stats.html("");
		    }
		    ProgressDialog.hide();
		    cb();
		}).send();
	    }
	},

	checkrow: function(tag, row_id) {
	    G.checkrow(tag, function(arg) {
		if( typeof _cache.checked == 'undefined' ) {
		    _cache.checked = {};
		}
		_cache.checked[row_id] = arg;
	    });
	},

	dropcache: function() {
	    _cache.data = {};
	},

	more1: function(user_id, account_id) {
	    Dialog({width: 880, title: lang.tech.route.more1, body: _moretbl1(_cache.data[user_id], account_id).join('')}).show();
	},

	more2: function(user_id, account_id, a_cookie) {
	    Dialog({width: 880, title: lang.tech.route.more2, body: _moretbl2(_cache.data[user_id], account_id, a_cookie).join('')}).show();
	},

	zstatus: function(tag, user_id, row_no, guid, offset) {
	    var x = new Popup(), zaccept, zreject, znote, zalert;
	    var ptr = _cache.data[user_id]._c[row_no].ptr;
	    var commit = function(self, method) {
		var xhr = G.xhr(method, G.getdataref({plug: 'tech'}), "", function(xhr) {
		    if( xhr.status == 200 ) {
			ptr.zstatus = method == 'PUT' ? 'accepted' : /*method == 'DELETE'*/'rejected';
			ptr.znote = ptr._znote;
			tag.removeClass('accepted');
			tag.removeClass('rejected');
			tag.addClass(ptr.zstatus);
			tag.addClass('footnote');
			tag.setAttribute('data-title', lang.zstatus[ptr.zstatus].format_a(G.shielding(__USERNAME__), G.shielding(ptr.activity_type,"").toLowerCase()) +
			    (String.isEmpty(ptr.znote) ? "" : ": {0}".format_a(ptr.znote)));
			x.hide();
			Toast.show(lang.success.zstatus);
			ptr._znote = null;
		    } else {
			enable();
			alarm(xhr.status == 409 ? lang.errors.zstatus.exist : lang.errors.runtime);
		    }
		    x.stopSpinner();
		});
		x.startSpinner();
		disable();
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.send(G.formParamsURI({guid: guid, note: ptr._znote, _datetime: G.getdatetime(new Date())}));
	    }
	    var alarm = function(arg) {
		zalert.html(arg);
		zalert.show();
	    }
	    var enable = function() {
		zaccept.disabled = ptr.zstatus == 'accepted';
		zreject.disabled = ptr.zstatus == 'rejected' || String.isEmpty(ptr._znote);
		znote.disabled = false;
	    }
	    var disable = function() {
		zaccept.disabled = true;
		zreject.disabled = true;
		znote.disabled = true;
	    }

	    if( _cache.row_no != null && _cache.row_no != row_no ) {
		x.hide();
	    }
	    x.set(_zstatustbl(ptr).join(''));
	    x.toggle(tag, offset);
	    _cache.row_no = row_no;
	    zalert = _("zalert");
	    znote = _("znote");
	    zaccept = _("zaccept");
	    zreject = _("zreject");
	    if( typeof ptr._znote != 'undefined' ) {
		znote.text(ptr._znote);
	    }
	    znote.oninput = function() {
		ptr._znote = znote.value.trim();
		enable();
		zalert.hide();
	    }
	    if( ptr.zstatus != 'accepted' ) {
		zaccept.onclick = function() {
		    zalert.hide();
		    commit(this, "PUT");
		}
	    }
	    if( ptr.zstatus != 'rejected' ) {
		zreject.onclick = function() {
		    zalert.hide();
		    if( String.isEmpty(ptr._znote) ) {
			alarm(lang.errors.zstatus.note);
		    } else {
			commit(this, "DELETE");
		    }
		}
	    }
	    enable();
	}
    }
})();

PLUG.registerTab(__route);
