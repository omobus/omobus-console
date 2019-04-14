/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

PLUG.registerRef("rating", (function() {
    /* private properties & methods */
    var _cache = {}; // internal cache object for preventing reloading data
    var _columns = 7;

    function _gettable() {
	var ar = [];
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th class='time'>", lang.created_time, "</th>");
	ar.push("<th>", lang.a_code, "</th>");
	ar.push("<th>", lang.a_name, "</th>");
	ar.push("<th>", lang.address, "</th>");
	ar.push("<th>", lang.u_name, "</th>");
	ar.push("<th width='90px'>", lang.sla.result, "</th>");
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
	    ar.push("<td class='clickable autoincrement' onclick='PLUG.getRef(\"rating\").checkrow(this.parentNode,\"",
		k, "\")'>", r.row_no, "</td>");
	    ar.push("<td class='time'>", G.gettime_l(Date.parseISO8601(r.fix_dt)), "</td>");
	    ar.push("<td class='int'>", G.shielding(r.a_code), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.a_name), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.address), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.e_name), "</td>");
	    ar.push("<td class='int'><a href='javascript:void(0)' onclick='PLUG.getRef(\"rating\").more(", i, ");'>", 
		G.getsla_l(r.assessment, r.sla), "</a></td>");
	    ar.push("</tr>");
	}
	if( ar.length == 0 ) {
	    ar = ["<tr class='def'><td colspan='", _columns, "' class='message'>", lang.empty, "</td></tr>"];
	}
	if( typeof data.data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", _columns, "' class='watermark'>", lang.data_watermark, "&nbsp;", data.data_ts, "</td></tr>");
	}
	return ar;
    }

    function _detailsbody(r) {
	var ar = [], x;
	ar.push("<div>", G.shielding(r.e_name), "</div>");
	ar.push("<div>", lang.sla.result + ":&nbsp;" + G.getsla_l(r.assessment, r.sla), "</div>");
	ar.push("<div>", G.shielding(r.a_name), "</div>");
	ar.push("<div>", G.shielding(r.address), "</div>");
	ar.push("<br/>");
	ar.push("<table width='100%' class='report'>");
	ar.push("<thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th>", lang.sla.criteria, "</th>");
	ar.push("<th width='50px'>", lang.sla.score, "</th>");
	ar.push("<th>", lang.note, "</th>");
	ar.push("</tr></thead><tbody>");
	for( var i = 0, size = r.criterias.length; i < size; i++ ) {
	    x = r.criterias[i];
	    ar.push("<tr>");
	    ar.push("<td class='autoincrement'>", i + 1, "</td>");
	    ar.push("<td class='string'>", G.shielding(x.descr), "</td>");
	    ar.push("<td class='int'>", G.getint_l(x.score), "</td>");
	    ar.push("<td class='string'>", G.shielding(x.note), "</td>");
	    ar.push("</tr>");
	}
	ar.push("</tbody><tfoot>");
	ar.push("<tr class='def'><td colspan='4' class='watermark'>", "{0}&nbsp;{1}".format_a(
	    lang.data_watermark, G.getdatetime_l(Date.parseISO8601(r.fix_dt))), "</td></tr>");
	ar.push("</tfoot></table>");
	ar.push("<br/>");
	return ar;
    }


    /* public properties & methods */
    return {
	getcaption: function() { return lang.doctypes.rating; },
	getbody: function() { return _gettable().join(""); },

	setdata: function(body, user_id, date, cb) {
	    var sp, tbody = _("xztb");
	    if( typeof _cache.data == 'undefined' ) {
		_cache.data = {};
	    }
	    if( _cache.data[user_id] != null ) { // sets data from the internal cache
		tbody.html(_datatbl(_cache.data[user_id], user_id, date, _cache.checked).join(""));
		_cache.ptr = _cache.data[user_id].rows;
	    } else {
		tbody.hide();
		sp = spinnerLarge(body, "50%", "50%");
		_cache.data[user_id] = _cache.ptr = null; // drops the internal cache
		G.xhr("GET", G.getajax({plug: "tech", code: "tech_ratings", user_id: user_id, date: G.getdate(date)}), "json", function(xhr, data) {
		    if( xhr.status == 200 &&  data != null && typeof data == 'object' ) {
			tbody.html(_datatbl(data, user_id, date, _cache.checked).join(""));
			_cache.data[user_id] = data;
			_cache.ptr = _cache.data[user_id].rows;
		    } else {
			tbody.html(["<tr class='def'><td colspan='", _columns, "' class='message'>", lang.failure, "</td></tr>"].join(""));
		    }
		    tbody.show();
		    sp.stop();
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
	    _cache.ptr = null;
	},

	more: function(row_no) {
	    Dialog({width: 700, title: lang.sla.ratings, body: _detailsbody(_cache.ptr[row_no])}).show();
	}
    }
})() );
