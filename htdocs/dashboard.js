/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var Dashboard = (function() {
    /* private properties & methods */

    function _dashboard(ar, rows) {
	var r, x, z = 0;
	for( var i = 0, size = rows.length; i < size; i++ ) {
	    if( (r = rows[i]) != null && (x = lang[r]) != null ) {
		if( z == 0 ) ar.push("<tr>");
		ar.push("<td " + (z == 0 ? "" : "class='r'") + "><a href='" + G.getdefref({plug: r}) + "'>", x.title, "</a></td>");
		if( z != 0 ) ar.push("</tr>");
		z += (z == 0 ? 1 : -1 );
	    }
	}
	if( z != 0 ) {
	    ar.push("<td></td></tr>");
	}
	return ar;
    }


    function _plugins(rules) {
	var ar = [], d, p, r;
	ar.push("<div class='role'>", lang.role.format_a(G.shielding(rules.cn, lang.dash), rules.ip, rules.username, rules.group), "</div>");
	if( (d = rules.permissions.daily_reports) != null && Array.isArray(d) && d.length > 0 ) {
	    ar.push("<hr />", lang.reports.daily, "<table class='dashboard'>");
	    _dashboard(ar, d);
	    ar.push("</table>");
	}
	if( (d = rules.permissions.monthly_reports) != null && Array.isArray(d) && d.length > 0 ) {
	    ar.push("<hr />", lang.reports.monthly, "<table class='dashboard'>");
	    _dashboard(ar, d);
	    ar.push("</table>");
	}
	if( (d = rules.permissions.analitics) != null && Array.isArray(d) && d.length > 0 ) {
	    ar.push("<hr />", lang.analitics, "<table class='dashboard'>");
	    _dashboard(ar, d);
	    ar.push("</table>");
	}
	if( (d = rules.permissions.managment) != null && Array.isArray(d) && d.length > 0 ) {
	    ar.push("<hr />", lang.managment, "<table class='dashboard'>");
	    _dashboard(ar, d);
	    ar.push("</table>");
	}
	if( (d = rules.permissions.archives) != null && Array.isArray(d) && d.length > 0 ) {
	    ar.push("<hr />", lang.archives, "<table class='dashboard'>");
	    _dashboard(ar, d);
	    ar.push("</table>");
	}

	return ar;
    }

    function _dumps(rules) {
	var ar = [], r, z = 0;
	ar.push("<div class='role'>", lang.role.format_a(G.shielding(rules.cn, lang.dash), rules.ip, rules.username, rules.group), "</div>");
	ar.push("<hr />");
	if( rules.dumps == null || rules.dumps.depth == null ) {
	    ar.push(lang.dumps_notice.everything);
	} else {
	    ar.push(lang.dumps_notice.limited.format_a(G.getdate_l(Date.parseISO8601(rules.dumps.depth))));
	}
	ar.push("<hr />");
	if( rules.dumps == null || !Array.isArray(rules.dumps.rows) ) {
	    ar.push("<br/><center>", lang.dumps_denied, "</center>");
	} else if( rules.dumps.rows.isEmpty() ) {
	    ar.push("<br/><center>", lang.dumps_empty, "</center>");
	} else {
	    ar.push("<table class='dashboard'>");
	    for( var i = 0, size = rules.dumps.rows.length; i < size; i++ ) {
		r = rules.dumps.rows[i];
		if( z == 0 ) ar.push("<tr>");
		ar.push("<td " + (z == 0 ? "" : "class='r'") + "><a target='_blank' href='" + G.getdumpref({name: r}) + "'>", 
		    (lang.dumps_names[r] == null ? r : lang.dumps_names[r].format_a(r)), "</a></td>");
		if( z != 0 ) ar.push("</tr>");
		z += (z == 0 ? 1 : -1 );
	    }
	    if( z != 0 ) {
		ar.push("<td></td></tr>");
	    }
	    ar.push("</table>");
	}
	return ar;
    }

    function _support(rules) {
	var ar = [], d;
	ar.push("<div class='role'>", lang.role.format_a(G.shielding(rules.cn, lang.dash), rules.ip, rules.username, rules.group), "</div>");
	ar.push("<hr />");
	ar.push(lang.support_warning);
	ar.push("<hr />");
	for( var i = 0, size = Array.isArray(rules.supports) ? rules.supports.length : 0; i < size; i++ ) {
	    d = rules.supports[i];
	    var z = [];
	    if( !String.isEmpty(d.phone) ) { z.push("<b>" + G.shielding(d.phone) + "</b>"); }
	    if( !String.isEmpty(d.email) ) { z.push("<a href='mailto:" + d.email + "'>" + G.shielding(d.email) + "</a>"); }
	    if( !z.isEmpty() ) {
		 ar.push("<div class='row'>", G.shielding(d.descr), ":&nbsp;", z.join(",&nbsp;"), "</div>");
	    }
	}
	ar.push("<hr />");
	ar.push(lang.support_notice);
	ar.push("<br /><a href='" + G.getdefref({plug: "tickets"}) + "'>", lang.tickets.title4, "</a>");
	return ar;
    }

    function _set(tag, label, onclick) {
	tag.html(label);
	tag.onclick = onclick;
	return tag;
    }


    /* public properties & methods */
    return {
	startup: function(rules) {
	    var sup = _('supportContainer');
	    var mod = _('pluginsContainer');
	    var dum = _('dumpsContainer');
	    _set(_('logoutRef'), lang.exit, function(ev) {
		document.location = G.getlogoutref();
	    });
	    _set(_('userRef'), rules.cn/*, function(ev) {
	    }*/);
	    _set(_('pluginsRef'), lang.plugins, function(ev) {
		sup.hide();
		dum.hide();
		if( mod.toggle() ) {
		    mod.popupDown(this, 0.8*2);
		}
	    });
	    _set(_('dumpsRef'), lang.dumps, function(ev) {
		sup.hide();
		mod.hide();
		if( dum.toggle() ) {
		    dum.popupDown(this, 0.8*2);
		}
	    });
	    _set(_('supportRef'), lang.support, function(ev) {
		mod.hide();
		dum.hide();
		if( sup.toggle() ) {
		    sup.popupDown(this, 0.8*2);
		}
	    });
	    sup.getElementsByClassName('body')[0].html(_support(rules).join(''));
	    sup.getElementsByClassName('arrow')[0].style.left = '80%';
	    sup.onclick = sup.hide;
	    mod.getElementsByClassName('body')[0].html(_plugins(rules).join(''));
	    mod.getElementsByClassName('arrow')[0].style.left = '80%';
	    mod.onclick = mod.hide;
	    dum.getElementsByClassName('body')[0].html(_dumps(rules).join(''));
	    dum.getElementsByClassName('arrow')[0].style.left = '80%';
	    dum.onclick = mod.hide;
	}
    }
})();
