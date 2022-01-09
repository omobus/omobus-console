/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var __a_list = (function() {
    /* private properties & methods */
    var _cache = {}; // internal cache object for preventing reloading data
    var _columns = 8;

    function _gettable() {
	var ar = [];
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th class='datetime'>", lang.fix_date, "</th>");
	ar.push("<th class='datetime'>", lang.satellite_dt, "</th>");
	ar.push("<th class='datetime'>", lang.inserted_ts, "</th>");
	ar.push("<th width='120px'>", lang.code, "</th>");
	ar.push("<th>", lang.tech.a_list.descr, "</th>");
	ar.push("<th>", lang.latitude, "</th>");
	ar.push("<th>", lang.longitude, "</th>");
	ar.push("</tr>", G.thnums(_columns), "</thead><tbody id='xztb'></tbody></table>");
	return ar;
    }

    function _datatbl(data, u_id, date, checked) {
	var ar = [], r, k;
	for( var i = 0, size = Array.isArray(data.rows) ? data.rows.length : 0; i < size; i++ ) {
	    r = data.rows[i];
	    k = "{0}${1}${2}".format_a(u_id, G.getdate(date), r.row_id);
	    ar.push("<tr class='clickable", (typeof checked != 'undefined' && checked[k]) ? " selected" : "", 
		"' onclick=\"__a_list.checkrow(this,'", k, "')\">");
	    ar.push("<td class='autoincrement'>", r.row_no, "</td>");
	    ar.push("<td class='datetime'>", G.getdatetime_l(Date.parseISO8601(r.fix_dt)), "</td>");
	    ar.push("<td class='datetime'>", (r.satellite_dt == "" ? "" : G.getdatetime_l(Date.parseISO8601(r.satellite_dt))), "</td>");
	    ar.push("<td class='datetime'>", G.getdatetime_l(Date.parseISO8601(r.inserted_ts)), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.act_code), "</td>");
	    ar.push("<td class='string'>", G.shielding(r.descr), "</td>");
	    ar.push("<td class='numeric'>", r.latitude == null ? "" : parseFloat(r.latitude).toFixed(6), "</td>");
	    ar.push("<td class='numeric'>", r.longitude == null ? "" : parseFloat(r.longitude).toFixed(6), "</td>");
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
	getcaption: function() { return lang.tech.a_list.title; },
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
		G.xhr("GET", G.getdataref({plug: "tech", code: "a_list", user_id: user_id, date: G.getdate(date)}), "json", function(xhr, data) {
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
})();

PLUG.registerTab(__a_list);
