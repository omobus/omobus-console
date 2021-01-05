/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

PLUG.registerRef("target", (function() {
    /* private properties & methods */
    var _cache = {}; // internal cache object for preventing reloading data
    var _columns = 11;

    function _gettable() {
	var ar = [];
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th rowspan='2' class='autoincrement'>", lang.num, "</th>");
	ar.push("<th rowspan='2' class='time'>", lang.created_time, "</th>");
	ar.push("<th rowspan='2'>", lang.a_code, "</th>");
	ar.push("<th rowspan='2'>", lang.a_name, "</th>");
	ar.push("<th rowspan='2'>", lang.address, "</th>");
	ar.push("<th rowspan='2'>", lang.targets.subject.caption, "</th>");
	ar.push("<th rowspan='2'>", lang.targets.body.caption, "</th>");
	ar.push("<th colspan='2'>", lang.validity, "</th>");
	ar.push("<th rowspan='2'>", lang.targets.type, "</th>");
	ar.push("<th rowspan='2' width='95px'>", lang.photo, "</th>");
	ar.push("</tr><tr>");
	ar.push("<th>", lang.b_date, "</th>");
	ar.push("<th>", lang.e_date, "</th>");
	ar.push("</tr>", G.thnums(_columns), "</thead>");
	ar.push("<tbody id='xztb'></tbody></table>");
	return ar;
    }

    function _datatbl(data, u_id, date, checked) {
	var ar = [], r, k;
	for( var i = 0, size = Array.isArray(data.rows) ? data.rows.length : 0; i < size; i++ ) {
	    r = data.rows[i];
	    k = "{0}${1}${2}".format_a(u_id, G.getdate(date), r.doc_id);
	    ar.push("<tr ", (typeof checked != 'undefined' && checked[k]) ? "class='selected'" : "", ">");
	    ar.push("<td class='clickable autoincrement' onclick='PLUG.getRef(\"target\").checkrow(this.parentNode,\"",
		k, "\")'>", r.row_no, "</td>");
	    ar.push("<td class='time'>", G.gettime_l(Date.parseISO8601(r.fix_dt)), "</td>");
	    ar.push("<td class='int'>", G.shielding(r.a_code), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.a_name), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.address), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.subject), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.doc_note), "</td>");
	    ar.push("<td class='date'>", G.getdate_l(Date.parseISO8601(r.b_date)), "</td>");
	    ar.push("<td class='date'>", G.getdate_l(Date.parseISO8601(r.e_date)), "</td>");
	    ar.push("<td class='ref'>", G.shielding(r.target_type), "</td>");
	    ar.push("<td class='ref'>");
	    if( r.blob_id == null || r.blob_id == "" ) {
		ar.push("&nbsp;");
	    } else {
		ar.push("<a href='javascript:void(0);' onclick='PLUG.slideshow([", r.blob_id, "])'>",
		    lang.view, "</a>");
	    }
	    ar.push("</td>");
	    ar.push("</tr>");
	}
	if( ar.length == 0 ) {
	    ar = ["<tr class='def'><td colspan='", _columns, "' class='message'>", lang.empty, "</td></tr>"];
	}
	if( typeof data.data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", _columns, "' class='watermark'>", lang.data_ts, "&nbsp;", data.data_ts, "</td></tr>");
	}
	return ar;
    }


    /* public properties & methods */
    return {
	getcaption: function() { return lang.doctypes.target; },
	getbody: function() { return _gettable().join(""); },

	setdata: function(body, user_id, date, cb) {
	    var tbody = _("xztb");
	    if( typeof _cache.data == 'undefined' ) {
		_cache.data = {};
	    }
	    if( _cache.data[user_id] != null ) { // sets data from the internal cache
		tbody.html(_datatbl(_cache.data[user_id], user_id, date, _cache.checked).join(""));
	    } else {
		ProgressDialog.show();
		_cache.data[user_id] = null; // drops the internal cache
		G.xhr("GET", G.getajax({plug: "tech", code: "tech_targets", user_id: user_id, date: G.getdate(date)}), "json", function(xhr, data) {
		    if( xhr.status == 200 &&  data != null && typeof data == 'object' ) {
			_cache.data[user_id] = data;
			tbody.html(_datatbl(data, user_id, date, _cache.checked).join(""));
		    } else {
			tbody.html(["<tr class='def'><td colspan='", _columns, "' class='message'>", lang.failure, "</td></tr>"].join(""));
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
	}
    }
})() );
