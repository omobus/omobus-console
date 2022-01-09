/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

PLUG.registerRef("reclamation", (function() {
    /* private properties & methods */
    var _cache = {}; // internal cache object for preventing reloading data
    var _columns = 12;

    function _gettable() {
	var ar = [];
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th class='time'>", lang.created_time, "</th>");
	ar.push("<th>", lang.a_code, "</th>");
	ar.push("<th>", lang.a_name, "</th>");
	ar.push("<th>", lang.address, "</th>");
	ar.push("<th>", lang.doc_no, "</th>");
	ar.push("<th>", lang.prod_name, "</th>");
	ar.push("<th>", lang.price, "</th>");
	ar.push("<th>", lang.qty, "</th>");
	ar.push("<th>", lang.pack, "</th>");
	ar.push("<th>", lang.amount, "</th>");
	ar.push("<th>", lang.reclamation_type, "</th>");
	ar.push("</tr>", G.thnums(_columns), "</thead>");
	ar.push("<tbody id='xztb'></tbody></table>");
	return ar;
    }

    function _datatbl(data, u_id, date, checked) {
	var ar = [], r, k;
	for( var i = 0, size = Array.isArray(data.rows) ? data.rows.length : 0; i < size; i++ ) {
	    r = data.rows[i];
	    k = "{0}${1}${2}".format_a(u_id, G.getdate(date), r.row_id);
	    ar.push("<tr ", (typeof checked != 'undefined' && checked[k]) ? "class='selected'" : "", ">");
	    ar.push("<td class='clickable autoincrement' onclick='PLUG.getRef(\"reclamation\").checkrow(this.parentNode,\"",
		k, "\")'>", r.row_no, "</td>");
	    ar.push("<td class='time'>", G.gettime_l(Date.parseISO8601(r.fix_dt)), "</td>");
	    ar.push("<td class='int'>", G.shielding(r.a_code), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.a_name), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.address), "</td>");
	    ar.push("<td class='int'>", G.shielding(r.doc_no), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.prod), "</td>");
	    ar.push("<td class='numeric'>", G.getcurrency_l(r.unit_price), "</td>");
	    ar.push("<td class='int'>", G.getint_l(r.qty), "</td>");
	    ar.push("<td class='int'>", G.shielding(r.pack_name), "</td>");
	    ar.push("<td class='numeric'>", G.getcurrency_l(r.amount), "</td>");
	    ar.push("<td class='ref'>", G.shielding(r.reclamation_type), "</td>");
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
	getcaption: function() { return lang.doctypes.reclamation; },
	getbody: function() { return _gettable().join(''); },

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
		G.xhr("GET", G.getdataref({plug: "tech", code: "tech_reclamations", user_id: user_id, date: G.getdate(date)}), "json", function(xhr, data) {
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
