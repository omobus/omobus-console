/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "discards";
    var _opt = {
	L: {lines: 8, length: 2, width: 4, radius: 6, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "auto"},
	S: {lines: 6, length: 1, width: 2, radius: 3, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "auto", left: "auto"}
    };
    var _cache = null, _perm = null, _elem = null;

    function _getcolumns(perm) {
	return 11 + (perm.reject == true ? 1 : 0);
    }

    function _getbody(perm) {
	return "<table class='headerbar' width='100%'><tr><td><h1>" + lang.discards.title + ":&nbsp;&nbsp;<input id='plugfilter' " +
	    "type='text' placeholder='" + lang.everything + "' onkeyup='return PLUG.onfilter(this, event);'/></h1></td>" +
	    "<td style='text-align: right;'>" + lang.received_ts + "&nbsp;<span id='timestamp'>-</span>&nbsp;(<a id='refresh' " +
	    "href='javascript:PLUG.onrefresh();'>" + lang.refresh + "</a>)</td></tr></table>" +
	    "<table width='100%' class='report'><thead><tr>" + 
	    "<th rowspan='2' class='autoincrement'>" + lang.num + "</th>" + 
	    "<th rowspan='2' class='datetime'>" + lang.fix_dt + "</th>" + 
	    "<th colspan='3'>" + lang.outlet + "</th>" + 
	    "<th rowspan='2'>" + lang.u_name + "</th>" + 
	    "<th rowspan='2'>" + lang.u_code + "</th>" + 
	    "<th rowspan='2'>" + lang.discards.type + "</th>" + 
	    "<th rowspan='2'>" + lang.note + "</th>" + 
	    "<th rowspan='2'>" + lang.route + "</th>" + 
	    "<th rowspan='2'>" + lang.validate.cap + "</th>" + 
	    (perm.reject == true?("<th rowspan='2'>" + lang.reject.cap + "</th>"):"") + 
	    "</tr><tr>" + 
	    "<th>" + lang.a_code + "</th>" + 
	    "<th>" + lang.a_name + "</th>" + 
	    "<th>" + lang.address + "</th>" + 
	    "</tr>" + G.thnums(_getcolumns(perm)) + "</thead><tbody id=\"maintb\"></tbody></table>" +
	    "<div id='plugspin' style='display:none; padding-top: 30px;'></div>";
    }

    function _getobjcache() {
	return G.getobjcache(_code, null);
    }

    function _checkrow(tr, objcache, row_id) {
	if( tr.className == 'selected' ) {
	    tr.className = null;
	    objcache.setchecked(row_id);
	} else {
	    tr.className = 'selected';
	    objcache.setchecked(row_id, true);
	}
    }

    function _failed(perm, msg) {
	return ["<tr class='def'><td colspan='" + _getcolumns(perm) + "' class='message'>" + msg + "</td></tr>"];
    }

    function _success(rows, f, objcache, perm) {
	var ar = [], r;
	for( var i = 0, x = 1, size = rows.length; i < size; i++ ) {
	    if( (r = rows[i]) != null && f.is(r) ) {
		ar.push("<tr" + (objcache.getchecked(r.account_id) ? " class='selected'" : "") + ">");
		ar.push("<td style='cursor:pointer' class='autoincrement' onclick=\"PLUG.oncheckrow(this.parentNode,'" + r.account_id +
		    "');event.stopPropagation();\">" + r.row_no + "</td>");
		ar.push("<td class='datetime" + (r.rejected ? " disabled" : "") +"'>" + G.getdatetime_l(Date.parseISO8601(r.fix_dt)) + "</td>");
		ar.push("<td class='string" + (r.rejected ? " disabled" : "") +"'>" + r.a_code + "</td>");
		ar.push("<td class='string" + (r.closed ? " strikethrough attention" : (r.rejected ? " disabled" : "")) +"'>" + r.a_name + "</td>");
		ar.push("<td class='string" + (r.closed ? " strikethrough attention" : (r.rejected ? " disabled" : "")) +"'>" + r.address + "</td>");
		ar.push("<td class='string" + (r.rejected ? " disabled" : "") +"'>" + r.u_name + "</td>");
		ar.push("<td class='string" + (r.rejected ? " disabled" : "") +"'>" + r.user_id + "</td>");
		ar.push("<td class='string" + (r.rejected ? " disabled" : "") +"'>" + G.shielding(r.discard_type) + "</td>");
		ar.push("<td class='string" + (r.rejected ? " disabled" : "") +"'>" + G.shielding(r.note) + "</td>");
		ar.push("<td class='date" + (r.rejected ? " disabled" : "") +"'>" + G.getdate_l(Date.parseISO8601(r.route_date)) + "</td>");
		ar.push("<td class='ref' style='width: 60px; white-space: nowrap;'>");
		if( perm.validate && !r.validated && !r.rejected ) {
		    ar.push("<span id='aV" + r.row_no + "'><a href='javascript:PLUG.validate(" + 
			r.row_no + ", \"" + r.account_id + "\", \"" + r.user_id + "\", \"" + r.route_date + "\", \"" + r.activity_type_id + 
			    "\");'>" + lang.validate.ref + "</a></span>");
		} else {
		    ar.push(r.v_name == null || r.v_name == '' ? (r.v_code?r.v_code:(r.validated?lang.plus:'')) : r.v_name);
		}
		ar.push("</td>");
		if( perm.reject ) {
		    ar.push("<td class='ref' style='width: 60px; white-space: nowrap;'>");
		    if( r.rejected ) {
			ar.push(lang.plus);
		    } else {
			ar.push("<span id='aR" + r.row_no + "'><a href='javascript:PLUG.reject(" + 
			    r.row_no + ", \"" + r.account_id + "\", \"" + r.user_id + "\", \"" + r.route_date + "\", \"" + r.activity_type_id + 
				"\");'>" + lang.reject.ref + "</a></span>");
		    }
		    ar.push("</td>");
		}
		ar.push("</tr>");
		x++;
	    }
	}
	if( ar.length == 0 ) {
	    ar = _failed(perm, lang.empty);
	}
	return ar;
    }

    function _setdata(tbody, f) {
	var sp = new Spinner(_opt.L).spin(_elem.spin.get(0));
	_elem.spin.show(); tbody.hide();
	_cache = null; // drop the internal cache
	G.xhr("GET", G.getajax({plug: _code}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		tbody.html(_success(data, f, _getobjcache(), _perm).join(""));
		_cache = data;
	    } else {
		tbody.html(_failed(_perm, lang.failure).join(""));
	    }
	    _elem.ts.text(G.getdatetime_l(new Date()));
	    tbody.show(); sp.stop(); _elem.spin.hide();
	}).send();
    }

    function _filterdata(tbody, f) {
	if( _cache != null ) {
	    var sp = new Spinner(_opt.L).spin(_elem.spin.get(0));
	    _elem.spin.show(); tbody.hide();
	    setTimeout(function() {
		tbody.html(_success(_cache, f, _getobjcache(), _perm).join(""));
		sp.stop(); _elem.spin.hide(); tbody.show();
	    }, 0);
	}
    }

    function _validate(tbody, row_no, account_id, user_id, route_date, activity_type_id) {
	var tag = tbody.find("#aV"+row_no);
	var sp = new Spinner(_opt.S);
	var params = {plug: _code, account_id: account_id, user_id: user_id, route_date: route_date, activity_type_id: activity_type_id};
	tag.parent().get(0).appendChild(sp.spin().el);
	tag.hide();
	G.xhr("PUT", G.getajax(params), "", function(xhr) {
	    if( xhr.status == 200 ) {
		tag.text(lang.plus);
		_cache[row_no-1].validated = 1;
	    } else {
		tag.text("");
	    }
	    tag.show();
	    sp.stop();
	}).send();
    }

    function _reject(tbody, row_no, account_id, user_id, route_date, activity_type_id) {
	var tag = tbody.find("#aR"+row_no), tag1 = tbody.find("#aV"+row_no);
	var sp = new Spinner(_opt.S);
	var params = {plug: _code, account_id: account_id, user_id: user_id, route_date: route_date, activity_type_id: activity_type_id};
	tag.parent().get(0).appendChild(sp.spin().el);
	tag.hide();
	G.xhr("DELETE", G.getajax(params), "", function(xhr) {
	    if( xhr.status == 200 ) {
		tag.text(lang.plus);
		tag1.text("");
		_cache[row_no-1].rejected = 1;
	    } else {
		tag.text("");
	    }
	    tag.show();
	    sp.stop();
	}).send();
    }


    /* public properties & methods */
    return {
	get: function(perm) {
	    return _getbody(perm);
	},
	set: function(elem, perm) {
	    _elem = elem; _perm = perm;
	},
	refresh: function() {
	    _setdata(_elem.tbody, new Filter(_elem.f.val()));
	},
	validate: function(row_no, account_id, user_id, route_date, activity_type_id) {
	    _validate(_elem.tbody, row_no, account_id, user_id, route_date, activity_type_id);
	},
	reject: function(row_no, account_id, user_id, route_date, activity_type_id) {
	    _reject(_elem.tbody, row_no, account_id, user_id, route_date, activity_type_id);
	},

	onrefresh: function() {
	    _setdata(_elem.tbody, new Filter(_elem.f.val()));
	},
	onfilter: function(tag, ev) {
	    var a = true;
	    if( ev.keyCode == 13 ) {
		_filterdata(_elem.tbody, new Filter(_elem.f.val())); a = false;
	    } else if( ev.keyCode == 27 ) {
		_filterdata(_elem.tbody, new Filter(_elem.f.val())); tag.blur();
	    }
	    return a;
	},
	oncheckrow: function(tr, row_id) {
	    _checkrow(tr, _getobjcache(), row_id);
	}
    }
})();


function startup(tag, perm) {
    tag.html(PLUG.get(perm));
    PLUG.set({
	body: tag,
	tbody: tag.find("#maintb"),
	spin: tag.find("#plugspin"),
	f: tag.find("#plugfilter"),
	ts: tag.find("#timestamp")
    }, perm);
    PLUG.refresh();
}
