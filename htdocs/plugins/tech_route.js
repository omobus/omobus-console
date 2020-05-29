/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

var __route = (function() {
    /* private properties & methods */
    var _cache = {}; // internal cache object for preventing reloading data
    var _columns = 17;

    function _fixpower(arg) {
	return arg == null ? null : (arg === 255 ? '~0' : arg);
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
	ar.push("<th>", lang.chan_name, "</th>");
	ar.push("<th>", lang.poten, "</th>");
	ar.push("<th class='timesec'>", lang.b_date, "</th>");
	ar.push("<th class='timesec'>", lang.e_date, "</th>");
	ar.push("<th width='45px'>", lang.tech.route.duration, "</th>");
	ar.push("<th width='75px' colspan='2'>", lang.dist, "</th>");
	ar.push("<th width='45px'>", lang.mileageAbbr, "</th>");
	ar.push("<th>", lang.tech.route.activity_type, "</th>");
	ar.push("<th class='bool'>", "&#8281;", "</th>");
	ar.push("</tr>", G.thnums(_columns), "</thead>");
	ar.push("<tbody id='xztb'></tbody></table>");
	ar.push("<div id='routeStats'></div>");
	return ar;
    }

    function _addition(r) {
	var ar = [];
	if( !String.isEmpty(r.number) ) { ar.push(G.shielding(r.number)); }
	ar.push("{0} {1}.".format_a(G.shielding(r.account), G.shielding(r.address)));
	if( !String.isEmpty(r.legal_address) ) { ar.push("<i>{0}</i>: <u>{1}</u>.".format_a(lang.legal_address, G.shielding(r.legal_address))); }
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
	    xs.push(" ", r.zstatus, " footnote' data-title='", lang.zstatus[r.zstatus].format_a(G.shielding(r.activity_type)));
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
		if( typeof __allowZstatusChanging != 'undefined' && __allowZstatusChanging && r.strict && r.closed && r.guid ) {
		    ar.push("<td class='bool ref clickable", _zstatusStyle(r).join(''), "' onclick='__route.zstatus(this,\"", r.user_id, "\",", i, ",\"", r.guid, "\",0.10)'>", 
			"<span>+</span>", "</td>");
		} else {
		    ar.push("<td class='bool", _zstatusStyle(r).join(''), "'>", r.closed == null ? "" : "+", "</td>");
		}
		ar.push("<td class='bool", r.canceled == null ? "" : " footnote' data-title='{0}.".format_a(_canceling(r).join(". ")), "'>", 
		    r.canceled == null ? "" : "+", "</td>");
		ar.push("<td class='int'>");
		if( data._d != null && data._d.hasOwnProperty(r.account_id) ) {
		    ar.push("<a href='javascript:void(0)' onclick='__route.more(\"", u_id, "\",\"", r.account_id, "\")'>", G.shielding(a.a_code), "</a>");
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
		ar.push("<td class='ref'>", G.shielding(r.chan), "</td>");
		ar.push("<td class='ref'>", G.shielding(r.poten), "</td>");
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
		if( typeof r.docs == 'undefined' && typeof r.extra_info == 'undefined' ) {
		    ar.push("<td class='int' width='30px'>", "&nbsp;", "</td>");
		} else if( !String.isEmpty(r.extra_info) ) {
		    ar.push("<td class='int footnote_L' data-title='{0}.".format_a(r.extra_info), "' width='30px'>", 
			(typeof r.docs != 'undefined' && r.docs > 0) ? "&#x1F613;<sup>{0}</sup>".format_a(G.getint_l(r.docs)) : "&#x1F613;", 
			"</td>");
		} else if( typeof r.docs != 'undefined' && r.docs > 0 ) {
		    ar.push("<td class='int' width='30px'>", G.getint_l(r.docs), "</td>");
		} else {
		    ar.push("<td class='int' width='30px'>", "&nbsp;", "</td>");
		}
		ar.push("</tr>");
	    } else if( z._t == "unsched" ) {
		ar.push("<tr class='clickable'", (typeof checked != 'undefined' && checked[k]) ? "class='selected' " : "",
		    " onclick='__route.checkrow(this,\"", k, "\")'>");
		ar.push("<td colspan='5'>", lang.tech.route.unsched, "</td>");
		ar.push("<td colspan='4'>", _unsched(r).join(". "), "</td>");
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
		ar.push("<td colspan='4'>", _addition(r).join(' '), "</td>");
		ar.push("<td colspan='2' class='datetime'>", _tm(date, Date.parseISO8601(r.fix_dt)), "</td>");
		ar.push("<td colspan='7' class='ref'", Array.isArray(r.photos) ? " onclick='event.stopPropagation();'" : "", ">", 
		    Array.isArray(r.photos) ? blobs.join("&nbsp;&nbsp;") : "&nbsp;", "</td>");
		ar.push("</tr>");
	    } else if( z._t == "joint" ) {
		ar.push("<tr class='watermark'>");
		ar.push("<td colspan='4'>&nbsp;</td>");
		ar.push("<td colspan='5'>", (r.state=='begin'?lang.tech.route.joint.b:lang.tech.route.joint.e).format_a(G.shielding(r.e_name)), "</td>");
		ar.push("<td colspan='2' class='datetime'>", _tm(date, Date.parseISO8601(r.fix_dt)), "</td>");
		ar.push("<td colspan='7'>&nbsp;</td>");
		ar.push("</tr>");
	    }
	}
	if( ar.length == 0 ) {
	    ar = ["<tr class='def'><td colspan='", _columns, "' class='message'>", lang.empty, "</td></tr>"];
	}
	if( typeof data.data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", _columns, "' class='watermark'>", lang.data_ts, "&nbsp;", data.data_ts, "</td></tr>");
	}

	return ar;
    }

    function _statstbl(data) {
	var ar = [], violations = [], devids = [], info = [], docs;
	if( data.packets == null || data.packets.count == null || data.packets.count == 0 ) {
	    return ar;
	}
	if( data.violations != null ) {
	    if( data.violations.gps_off ) {
		violations.push(lang.violations.gps);
	    }
	    if( data.violations.tm_changed ) {
		violations.push(lang.violations.tm);
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
	ar.push("<tr>",
	    "<td>", lang.dev_login, ":</td>",
	    "<td class='ref' colspan='2' width='260px'>", G.shielding(data.dev_login, lang.dash), "</td>",
	    "</tr>");
	ar.push("<tr>",
	    "<td>", lang.dev_id, ":</td>",
	    "<td class='ref' colspan='2' width='260px'>", devids.join('<br/>'), "</td>",
	    "</tr>");
	ar.push("<tr>",
	    "<td>", lang.tech.route.packets.title, ":</td>",
	    "<td class='int' colspan='2' width='260px'>", lang.tech.route.packets.value.format_a(data.packets.count, G.shielding(data.packets.time)), "</td>",
	    "</tr>");
	if( data.traffics != null ) {
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
	if( data.power != null ) {
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
	if( data.exchanges != null ) {
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
	ar.push("</table>");
	ar.push("</td>");
	/* delimeter: */
	ar.push("<td width='2%'></td>");
	/* route stats: */
	ar.push("<td width='49%' valign='top'>");
	ar.push("<table  width='100%' class='report'>");
	if( !String.isEmpty(data.head_name) ) {
	    ar.push("<tr>",
		"<td>", lang.head_name, ":</td>",
		"<td class='ref' colspan='3'>", G.shielding(data.head_name), "</td>",
		"</tr>");
	}
	if( !String.isEmpty(data.email) ) {
	    info.push("<a href='mailto:{0}'>{0}</a>".format_a(G.shielding(data.email)));
	}
	if( !String.isEmpty(data.mobile) ) {
	    info.push(G.shielding(data.mobile));
	}
	ar.push("<tr>",
	    "<td>", lang.u_name, ":</td>",
	    "<td class='ref' colspan='3'>", "<b>", G.shielding(data.u_name, lang.dash), "</b>", 
		info.length > 0 ? ("<br/>"+info.join('&nbsp;&nbsp;')) : "", "</td>",
	    "</tr>");
	if( !String.isEmpty(data.area) ) {
	    ar.push("<tr>",
		"<td>", lang.area, ":</td>",
		"<td class='ref' colspan='3'>", G.shielding(data.area), "</td>",
		"</tr>");
	}
	if( !String.isEmpty(data.agency) ) {
	    ar.push("<tr>",
		"<td>", lang.agency, ":</td>",
		"<td class='ref' colspan='3'>", G.shielding(data.agency), "</td>",
		"</tr>");
	}
	if( Array.isArray(data.departments) && data.departments.length > 0 ) {
	    var t = []
	    data.departments.forEach(function(arg0, arg1, arg2) { 
		t.push(G.shielding(arg0)); 
	    });
	    ar.push("<tr>",
		"<td>", lang.department, ":</td>",
		"<td class='ref' colspan='3'>", t.join('<br/>'), "</td>",
		"</tr>");
	}
	if( Array.isArray(data.distributors) && data.distributors.length > 0 ) {
	    var t = []
	    data.distributors.forEach(function(arg0, arg1, arg2) { 
		t.push(G.shielding(arg0)); 
	    });
	    ar.push("<tr>",
		"<td>", lang.distributor, ":</td>",
		"<td class='ref' colspan='3'>", t.join('<br/>'), "</td>",
		"</tr>");
	}
	ar.push("<tr>",
	    "<td>", lang.workday, ":</td>", 
	    "<td class='int' width='80px'>", (data.wd != null && data.wd.b != null) ? G.gettime_l(data.wd.b) : lang.dash, "</td>",
	    "<td class='int' width='80px'>", (data.wd != null && data.wd.e != null) ? G.gettime_l(data.wd.e) : lang.dash, "</td>",
	    "<td class='int' width='140px'>", (data.wd != null && data.wd.b != null && data.wd.e != null) ? lang.minutes.format_a(
		Math.round((Date.parseISO8601(data.wd.e)-Date.parseISO8601(data.wd.b))/60000)) : lang.dash,"</td>",
	    "</tr>");
	ar.push("<tr>",
	    "<td>", lang.route_compliance.wd, ":</td>", 
	    "<td class='int' width='80px'>", (data.rd != null && data.rd.b != null) ? G.gettime_l(data.rd.b) : lang.dash, "</td>",
	    "<td class='int' width='80px'>", (data.rd != null && data.rd.e != null) ? G.gettime_l(data.rd.e) : lang.dash, "</td>",
	    "<td class='int' width='140px'>", (data.rd != null && data.rd.b != null && data.rd.e != null) ? "{0} ({1})".format_a(
		lang.minutes.format_a(Math.round((Date.parseISO8601(data.rd.e)-Date.parseISO8601(data.rd.b))/60000)), 
		    lang.minutes.format_a(data.rd.indoor)) 
		: lang.dash,"</td>",
	    "</tr>");
	if( data.wd != null && data.wd.mileage != null && data.wd.mileage/1000 > 0 ) {
	    ar.push("<tr>",
		"<td>", lang.mileage, ":</td>", 
		"<td class='int' colspan='3'>", lang.kilometers.format_a(parseFloat(data.wd.mileage/1000.0).toFixed(1)), "</td>",
		"</tr>");
	}
	if( data.rd != null && data.rd.mileage != null && data.rd.mileage/1000 > 0 ) {
	    ar.push("<tr>",
		"<td>", lang.route_mileage, ":</td>", 
		"<td class='int' colspan='3'>", lang.kilometers.format_a(parseFloat(data.rd.mileage/1000.0).toFixed(1)), "</td>",
		"</tr>");
	}
	if( !violations.isEmpty() ) {
	    ar.push("<tr>",
		"<td>", lang.violations._caption, ":</td>", 
		"<td class='ref attention' colspan='3'>", violations.join("<hr/>"), "</td>",
		"</tr>");
	}
	if( docs != null ) {
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

    function _moretbl(data, account_id) {
	var ar = [], a = data.my_accounts[account_id] || {}, xs;
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
	if( typeof a.cash_register == 'number' && a.cash_register > 0 ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.cash_registers, a.cash_register), "</div>");
	}
	ar.push("</td>", "<td width='10px'/>", "<td width='270px' style='text-align:right;'>");
	ar.push("<div>", "{0}: {1}".format_a(lang.u_code, G.shielding(data.user_id)), "</div>");
	ar.push("<div>", "{0}: {1}".format_a(lang.dev_login, G.shielding(data.dev_login)), "</div>");
	ar.push("<div>", "{0}: <b>{1}</b>".format_a(lang.date, G.getdate_l(data.date)), "</div>");
	ar.push("</td>","</tr>","</table>");
	ar.push("<br/>");
	(data._d[account_id] || []).forEach(function(r, index) {
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
		    "<span class='r'>", "{0}. <i>{1}</i>: {2}".format_a(G.shielding(r.categ), lang.sla.result, G.getpercent_l(r.sla)),
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
		r.criterias.forEach(function(arg0, arg1) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.descr), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.score), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.note), "</td>");
		    if( arg1 == 0 ) {
			ar.push("<td class='ref def' rowspan='", r.criterias.length, "'>");
			if( Array.isArray(r.photos) ) {
			    r.photos.forEach(function(arg0, arg1, arg2) {
				ar.push("<p><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
				    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></p>");
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
		ar.push("<td class='divider'>", lang.product, "</td>");
		ar.push("<td class='divider'>", lang.placement, "</td>");
		ar.push("<td class='divider'>", lang.exist, "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='ref'>", G.shielding(arg0.placement), "</td>");
		    ar.push("<td class='bool'>", arg0.exist == 1 ? lang.plus : (arg0.exist == 2 ? lang.shortage : lang.dash), "</td>");
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
			ar.push("<p><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
			    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></p>");
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
		ar.push("<td class='divider'>", lang.product, "</td>");
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
		ar.push("<td class='divider'>", lang.product, "</td>");
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
		ar.push("<td class='ref", xs, "' width='200px'>", G.shielding(r.placement), "</td>");
		ar.push("<td class='ref", xs, "' width='100px'>", G.shielding(r.brand), "</td>");
		ar.push("<td class='ref", xs, "' width='200px'>", G.shielding(r.photo_type), "</td>");
		ar.push("<td class='ref' width='130px'>");
		if( String.isEmpty(r.blob_id) ) {
		    ar.push("&nbsp;");
		} else {
		    ar.push("<img class='clickable' onclick='PLUG.slideshow([", r.blob_id, "],1)' height='90px' src='",
			G.getajax({plug: "tech", blob: "yes", thumb: "yes", blob_id: r.blob_id}), "' />");
		}
		ar.push("</td>");
		ar.push("<td class='string", xs, "'>");
		if( !String.isEmpty(r.doc_note) ) {
			ar.push("<div class='row'>", G.shielding(r.doc_note), "</div>");
		}
		if( Array.isArray(r.photo_params) && r.photo_params.length > 0 ) {
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
			G.getajax({plug: "tech", blob: "yes", thumb: "yes", blob_id: r.blob_id}), "' />");
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
		ar.push("<td class='divider'>", lang.product, "</td>");
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
			ar.push("<p><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
			    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></p>");
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
		ar.push("<td class='divider'>", lang.product, "</td>");
		ar.push("<td class='divider' width='95px'>", lang.price, "</td>");
		ar.push("<td class='divider' width='35px'>", lang.promo, "</td>");
		ar.push("<td class='divider' width='95px'>", lang.rrp, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='int'>", G.getcurrency_l(arg0.price), "</td>");
		    ar.push("<td class='bool'>", (arg0.promo ? lang.plus : "&nbsp;"), "</td>");
		    ar.push("<td class='int'>", G.getcurrency_l(arg0.rrp), "</td>");
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
		ar.push("<td class='divider' Xwidth='300px'>", lang.promos.type, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("<td class='divider'>", lang.photo, "</td>");
		ar.push("</tr>");
		ar.push("<tr>");
		ar.push("<td class='ref'>", G.shielding(r.categ), "</td>");
		ar.push("<td class='ref'>", G.shielding(r.brand), "</td>");
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
			ar.push("<p><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
			    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></p>");
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
		    "<span class='r'>", "{0}. <i>{1}</i>: {2}".format_a(G.shielding(r.e_name), lang.sla.result, G.getsla_l(r.assessment, r.sla)),
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
		ar.push("</tr>");
		r.criterias.forEach(function(arg0, arg1) {
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
		ar.push("<td class='divider'>", lang.product, "</td>");
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
		r.brands.forEach(function(arg0, arg1) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.descr, lang.other), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.facing), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.assortment), "</td>");
		    if( arg1 == 0 ) {
			ar.push("<td class='ref def' rowspan='", r.brands.length, "'>");
			if( Array.isArray(r.photos) ) {
			    r.photos.forEach(function(arg0, arg1, arg2) {
				ar.push("<p><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
				    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></p>");
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
		ar.push("<td class='divider'>", lang.product, "</td>");
		ar.push("<td class='divider' width='105px'>", lang.manuf_date, "</td>");
		ar.push("<td class='divider' width='75px'>", lang.stock, "</td>");
		ar.push("<td class='divider' width='35px'>", "&nbsp;", "</td>");
		ar.push("</tr>");
		r.rows.forEach(function(arg0) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='int'>", G.shielding(arg0.p_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.prod), "</td>");
		    ar.push("<td class='date'>", G.getdate_l(Date.parseISO8601(arg0.manuf_date)), "</td>");
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
	    } else if( r._t == "testing" ) {
		ar.push("<div>");
		ar.push("<h2>", "{0} {1} {2} / {3}".format_a(lang.doctypes[r._t], lang.num, r.doc_no, r.doc_id), 
		    "<span class='r'>", "{0}. <i>{1}</i>: {2}".format_a(lang.personFormat.format({name: G.shielding(r.name), patronymic: G.shielding(r.patronymic), 
			surname: G.shielding(r.surname)}).trim().trunc(20), lang.sla.result, G.getpercent_l(r.sla)),
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
		ar.push("</tr>");
		r.criterias.forEach(function(arg0, arg1) {
		    ar.push("<tr>");
		    ar.push("<td class='autoincrement'>", arg0.row_no + 1, "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.descr), "</td>");
		    ar.push("<td class='int'>", G.getint_l(arg0.score), "</td>");
		    ar.push("<td class='string'>", G.shielding(arg0.note), "</td>");
		    ar.push("</tr>");
		});
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
			ar.push("<p><a href='javascript:void(0)' onclick='PLUG.slideshow([", arg2.join(','), "],",
			    (arg1+1), ")'>[&nbsp;", (arg1+1), "&nbsp;]</a></p>");
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
		ar.push("<td class='divider' colspan='2'>", lang.wishes.type, "</td>");
		ar.push("<td class='divider'>", lang.note, "</td>");
		ar.push("</tr>");
		ar.push("<tr>");
		ar.push("<td class='string' width='30%'>", G.shielding(r.weeks), "</td>");
		ar.push("<td class='string' width='30%'>", G.shielding(r.days), "</td>");
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
	var obj = {};
	var cb = function(code, a_id, ptr) {
	    var x;
	    if( !String.isEmpty(ptr.fix_dt) && !String.isEmpty(ptr.doc_no) ) {
		if( !obj.hasOwnProperty(a_id) ) {
		    x = obj[a_id] = [];
		} else {
		    x = obj[a_id];
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
	var fn = function(code) {
	    var x = data["{0}s".format_a(code)] || data[code] || data["{0}es".format_a(code)], z;
	    if( x != null ) {
		for( var k in x ) {
		    z = x[k];
		    if( Array.isArray(z) ) {
			x[k].forEach(function(element, index, array) { cb(code, k, element); });
		    } else if( z != null ) {
			cb(code, k, z);
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
	fn("extra");
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
	fn("testing");
	fn("training");
	fn("wish");

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
		G.xhr("GET", G.getajax({plug: "tech", code: "tech_route", user_id: user_id, date: G.getdate(date)}), "json", function(xhr, data) {
		    if( xhr.status == 200 &&  data != null && typeof data == 'object' ) {
			data._c = _compile_route(data);
			data._d = _compile_docs(data);
			//console.log(data);
			_cache.data[user_id] = data;
			tbody.html(_datatbl(data, user_id, date, _cache.checked).join(""));
			stats.html(_statstbl(data).join(""));
		    } else {
			tbody.html(["<tr class='def'><td colspan='", _columns, "' class='message'>", lang.failure, "</td></tr>"].join(""));
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

	more: function(user_id, account_id) {
	    Dialog({width: 880, title: lang.tech.route.more, body: _moretbl(_cache.data[user_id], account_id).join('')}).show();
	},

	zstatus: function(tag, user_id, row_no, guid, offset) {
	    var x = new Popup(), zaccept, zreject, znote, zalert;
	    var ptr = _cache.data[user_id]._c[row_no].ptr;
	    var commit = function(self, method) {
		var xhr = G.xhr(method, G.getajax({plug: 'tech'}), "", function(xhr) {
		    if( xhr.status == 200 ) {
			ptr.zstatus = method == 'PUT' ? 'accepted' : /*method == 'DELETE'*/'rejected';
			ptr.znote = ptr._znote;
			tag.removeClass('accepted');
			tag.removeClass('rejected');
			tag.addClass(ptr.zstatus);
			tag.addClass('footnote');
			tag.setAttribute('data-title', lang.zstatus[ptr.zstatus].format_a(ptr.activity_type) +
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
