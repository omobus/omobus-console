/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "quests_results";
    var _restoreSymbol = "&#x2713";
    var _removeSymbol = "&#x2715";
    var _cache = {}, _perm = {}, _tags = {};

    function _getcolumns1(perm) {
	let x = 11, c = perm.columns || {};
	if( c.channel == true ) x++;
	return x;
    }

    function _getcolumns2(perm) {
	let x = 4;
	if( perm.remove == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang[_code].title, "</span>&nbsp;");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)");
	ar.push("<span id='accountsGroup'>");
	ar.push("<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</span>");
	ar.push("<span id='questGroup' class='gone'>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.hidden(this)'>", lang.view_unlinked_data, "</a>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.back(this)'>", lang.a_everything, "</a>");
	ar.push("</span>");
	ar.push("</td></tr></table>");
	/* accounts page: */
	ar.push("<div id='accountsContainer'>");
	ar.push("<table width='100%' class='report'>", "<thead>", "<tr>");
	ar.push("<th rowspan='2' class='autoincrement'>", lang.num, "</th>");
	ar.push("<th rowspan='2'>", lang.a_code, "</th>");
	ar.push("<th rowspan='2'><a href='javascript:void(0)' onclick='PLUG.retail_chains(this)'>", lang.a_name, "</a></th>");
	ar.push("<th rowspan='2'>", lang.address, "</th>");
	if( perm.columns != null && perm.columns.channel == true ) {
	    ar.push("<th rowspan='2' class='sw95px'><a href='javascript:void(0)' onclick='PLUG.channels(this)'>", lang.chan_name, "</a></th>");
	}
	ar.push("<th rowspan='2' class='sw95px'><a href='javascript:void(0)' onclick='PLUG.qnames(this)'>", lang.qname, "</a></th>");
	ar.push("<th colspan='2'>", lang.altered_data, "</th>");
	ar.push("<th colspan='2'>", lang.verified_data, "</th>");
	ar.push("<th colspan='2'>", lang.founded_data, "</th>");
	ar.push("</tr>", "<tr>");
	ar.push("<th>", lang.date, "</th>");
	ar.push("<th>", lang.u_name, "</th>");
	ar.push("<th>", lang.date, "</th>");
	ar.push("<th>", lang.u_name, "</th>");
	ar.push("<th>", lang.date, "</th>");
	ar.push("<th>", lang.u_name, "</th>");
	ar.push("</tr>", G.thnums(_getcolumns1(perm)), "</thead>");
	ar.push("<tbody id='maintb'>", "</tbody>");
	ar.push("</table>");
	ar.push("</div>");
	/* quest page: */
	ar.push("<div id='questContainer' class='gone'>");
	ar.push("<table width='100%'>","<tbody>","<tr>");
	ar.push("<td width='40%' valign='top'>");
	ar.push("<table width='100%' class='report'>", "<tbody id='tbody2'>", "</tbody>", "</table>");
	ar.push("</td>");
	ar.push("<td width='2%'/>");
	ar.push("<td width='58%' valign='top'>");
	ar.push("<table width='100%' class='report'>", "<thead>", "<tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th>", lang.qpath, "</th>");
	ar.push("<th>", lang.qrow, "</th>");
	ar.push("<th>", lang.qvalue, "</th>");
	if( perm.remove ) {
	    ar.push("<th width='27px' class='symbol'>", _removeSymbol, "</th>");
	}
	ar.push("</tr>", G.thnums(_getcolumns2(perm)), "</thead>");
	ar.push("<tbody id='tbody4'></tbody>");
	ar.push("</table>");
	ar.push("<br/>");
	ar.push("<table width='100%' class='report'>", "<tbody id='tbody3'>", "</tbody>", "</table>");
	ar.push("</td>");
	ar.push("</tr>", "</tbody>", "</table>");
	ar.push("</div>");
	ar.push(ChannelsPopup.container());
	ar.push(QuestNamesPopup.container());
	ar.push(RetailChainsPopup.container());
//ar.push(UsersPopup.container("headsPopup"));
	ar.push(Popup.container());
	ar.push(Dialog.container("baseDialog-blue","dialog-blue"));
	ar.push(SlideshowSimple.container());
	return ar;
    }

    function _getfilter() {
	var a = [];
	if( _cache.xfilters != null ) {
	    for( var name in _cache.xfilters ) {
		a.push(_cache.xfilters[name]);
	    }
	}
	a.push(_tags.f.val());
	return Filter(a.join(' '), false, [
	    "qname_id",
	    "qname\.descr",
	    "account_id",
	    "a\.code",
	    "a\.descr",
	    "a\.address",
	    "a\.chan_id",
	    "a\.chan\.descr",
	    "a\.rc_id",
	    "a\.rc\.\descr",

"user_id", 
	    "dev_login", 
	    "u_name", 
	    "head_id",
	    "area",
	    "departments\.[0-9]+",
	    "distributors\.[0-9]+"
	]);
    }

    function _data1msg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns1(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _data1tbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z, t;
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    var xs = "";
		    if( r.a.hidden ) {
			xs = " strikethrough attention";
		    } else if ( r.a.locked ) {
			xs = " strikethrough";
		    }
		    ar.push("<tr class='clickable" + (typeof checked != 'undefined' && checked[r.row_id] ? " selected'" : "") +
			"' onclick='PLUG.quest(" + r.row_no + ")'>");
		    ar.push("<td class='autoincrement clickable' onclick='PLUG.checkrow(this.parentNode,\"" +
			r.row_id + "\");event.stopPropagation();'>", r.row_no, "</td>");
		    ar.push("<td class='int", xs, "'>", G.shielding(r.a.code), "</td>");
		    ar.push("<td class='string a_name", xs, "'>", G.shielding(r.a.descr), "</td>");
		    ar.push("<td class='string address", xs, "'>", G.shielding(r.a.address), "</td>");
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px'>", G.shielding(r.a.chan.descr), "</td>");
		    }
		    ar.push("<td class='ref sw95px delim'>", G.shielding(r.qname.descr), "</td>");
		    ar.push("<td class='date'>", G.getdate_l(Date.parseISO8601(r.altered_dt)), "</td>");
		    ar.push("<td class='string u_name2 delim'>", G.shielding(r.censor.descr || r.censor_id), "</td>");
		    ar.push("<td class='date'>", G.getdate_l(Date.parseISO8601(r.fix_dt)), "</td>");
		    ar.push("<td class='string u_name2 delim'>", G.shielding(r.u.descr), "</td>");
		    ar.push("<td class='date'>", G.getdate_l(Date.parseISO8601(r.founded_dt)), "</td>");
		    ar.push("<td class='string u_name2'>", G.shielding(r.founder.descr), "</td>");
		    ar.push("</tr>");
		}
		x++;
	    }
	}
	if( x > 0 ) {
	    total.html((x != size ? "&nbsp;&nbsp;({0}/{1})" : "&nbsp;&nbsp;({1})").format_a(x, size));
	} else {
	    total.html("");
	}
	if( ar.length == 0 ) {
	    ar = _data1msg(lang.empty, perm);
	}
	if( typeof data.data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", _getcolumns1(perm),"' class='watermark'>", lang.data_ts, "&nbsp;", data.data_ts, "</td></tr>");
	}
	if( (z = Math.floor(x/perm.rows) + ((x%perm.rows)?1:0)) > 1 /*pages: */ ) {
	    ar.push("<tr class='def'><td colspan='" + _getcolumns1(perm) + "' class='navbar'>");
	    if( page > 1 ) {
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(1)'>|&lt;</a>&nbsp;");
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page-1,")'>&lt;</a>&nbsp;");
	    }
	    if( page == 1 ) {
		ar.push("&nbsp;",page,"&nbsp;");
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page+1,")'>",page+1,"</a>");
		if( (page+2) <= z ) {
		    ar.push("&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page+2,")'>",page+2,"</a>");
		}
	    } else if( page == z ) {
		if( (page-2) >= 1 ) {
		    ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page-2,")'>",page-2,"</a>&nbsp;");
		}
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page-1,")'>",page-1,"</a>&nbsp;");
		ar.push("&nbsp;",page);
	    } else {
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page-1,")'>",page-1,"</a>&nbsp;");
		ar.push("&nbsp;",page);
		if( (page+1) <= z ) {
		    ar.push("&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page+1,")'>",page+1,"</a>");
		}
	    }
	    if( page < z ) {
		ar.push("&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",page+1,")'>&gt;</a>&nbsp;");
		ar.push("&nbsp;<a href='javascript:void(0)' onclick='PLUG.page(",z,")'>&gt;|</a>");
	    }
	    ar.push("</td></tr>");
	}
	return ar;
    }

    function _data2msg(msg, cols) {
	return ["<tr class='def'><td colspan='", cols, "' class='message'>", msg, "</td></tr>"];
    }

    function _data2divider(msg, cols) {
	return ["<tr class='def'><td colspan='", cols, "' class='divider'>", msg, "</td></tr>"];
    }

    function _data2tbl1_1(data) {
	var ar = [], info = [];
	if( !String.isEmpty(data.head_name) ) {
	    ar.push("<tr>",
		"<td align='center'>", lang.head_name, ":</td>",
		"<td align='center'>", G.shielding(data.head_name), "</td>",
		"</tr>");
	}
	if( !String.isEmpty(data.email) ) {
	    info.push("<a class='ref' href='mailto:{0}'>{0}</a>".format_a(G.shielding(data.email)));
	}
	if( !String.isEmpty(data.mobile) ) {
	    info.push(G.shielding(data.mobile));
	}
	ar.push("<tr>",
	    "<td align='center' width='49%'>", lang.u_name, ":</td>",
	    "<td align='center' width='51%'>", "<b>", G.shielding(data.u_name, lang.dash), "</b>", 
		info.length > 0 ? ("<br/>"+info.join('&nbsp;&nbsp;')) : "", "</td>",
	    "</tr>");
	ar.push("<tr>",
	    "<td align='center'>", lang.dev_login, ":</td>",
	    "<td align='center'>", G.shielding(data.dev_login, lang.dash), "</td>",
	    "</tr>");
	ar.push("<tr>",
	    "<td align='center'>", lang.u_code, ":</td>",
	    "<td align='center'>", G.shielding(data.user_id), "</td>",
	    "</tr>");
	if( !String.isEmpty(data.area) ) {
	    ar.push("<tr>",
		"<td align='center'>", lang.area, ":</td>",
		"<td align='center'>", G.shielding(data.area), "</td>",
		"</tr>");
	}
	if( !String.isEmpty(data.agency) ) {
	    ar.push("<tr>",
		"<td align='center'>", lang.agency, ":</td>",
		"<td align='center'>", G.shielding(data.agency), "</td>",
		"</tr>");
	}
	if( !Array.isEmpty(data.departments) ) {
	    const t = []
	    data.departments.forEach(function(arg0, arg1, arg2) {
		t.push(G.shielding(arg0));
	    });
	    ar.push("<tr>",
		"<td align='center'>", lang.department, ":</td>",
		"<td align='center'>", t.join('<br/>'), "</td>",
		"</tr>");
	}
	if( !Array.isEmpty(data.distributors) ) {
	    const t = []
	    data.distributors.forEach(function(arg0, arg1, arg2) {
		t.push(G.shielding(arg0));
	    });
	    ar.push("<tr>",
		"<td align='center'>", lang.distributor, ":</td>",
		"<td align='center'>", t.join('<br/>'), "</td>",
		"</tr>");
	}
	return ar;
    }

    function _data2tbl1_2(data) {
	var ar = [], style1 = ""
	if( data.hidden ) {
	    style1 = " strikethrough attention";
	} else if ( data.locked ) {
	    style1 = " strikethrough";
	}
	ar.push("<tr>", "<th colspan='2' class='", style1,"'>", "<i>{0}</i>: {1}".format_a(data.a_code, data.a_name), "</th>", "</tr>");
	ar.push("<tr>", "<th colspan='2' class='", style1,"'>", data.address, "</th>", "</tr>");
	if( data.a_code != data.account_id ) {
	    ar.push("<tr>",
		"<th>", lang.account_id, ":</th>",
		"<th>", data.account_id, "</th>",
		"</tr>");
	}
	if( !String.isEmpty(data.chan_name) ) {
	    ar.push("<tr>",
		"<th>", lang.chan_name, ":</th>",
		"<th>", data.chan_name, "</th>",
		"</tr>");
	}
	if( !String.isEmpty(data.phone) ) {
	    ar.push("<tr>",
		"<th>", lang.phone, ":</th>",
		"<th>", data.phone, "</th>",
		"</tr>");
	}
	if( !String.isEmpty(data.extra_info) ) {
	    ar.push("<tr>",
		"<th colspan='2'>", data.extra_info, "</th>",
		"</tr>");
	}
	return ar;
    }

    function _data2tbl1_3(data) {
	var ar = [];
	ar.push("<tr>", "<th colspan='2'>", "<b>", data.descr, "</b>", "</th>", "</tr>");
	return ar;
    }

    function _data2tbl1_4(data, classNames) {
	var ar = [];
	ar.push("<tr>",
	    "<td align='center' width='49%'>", lang.u_name, ":</td>",
	    "<td class='", classNames || "", "' align='center' width='51%'>", G.shielding(data.u_name, lang.dash), "</td>",
	    "</tr>");
	ar.push("<tr>",
	    "<td align='center'>", lang.dev_login, ":</td>",
	    "<td class='", classNames || "", "' align='center'>", G.shielding(data.dev_login, lang.dash), "</td>",
	    "</tr>");
	ar.push("<tr>",
	    "<td align='center'>", lang.u_code, ":</td>",
	    "<td class='", classNames || "", "' align='center'>", G.shielding(data.user_id), "</td>",
	    "</tr>");
	return ar;
    }

    function _data2tbl1_5(data, classNames) {
	var ar = [];
	ar.push("<tr>",
	    "<td align='center'>", lang.dev_login, ":</td>",
	    "<td class='", classNames || "", "' align='center'>", G.shielding(data, lang.dash), "</td>",
	    "</tr>");
	return ar;
    }

    function _data2tbl1(data, perm) {
	let ar = [], f = false;
	if( data.qname != null ) {
	    ar = ar.concat(_data2tbl1_3(data.qname));
	}
	if( data.a != null ) {
	    ar = ar.concat(_data2tbl1_2(data.a));
	}
	if( data.qname != null && data.a != null ) {
	    let x = [];
	    if( perm.urgent ) {
		x.push("<button onclick='PLUG.urgent()'>", lang.urgent, "</button>")
	    }
	    if( perm.eraseEverything ) {
		x.push("<button onclick='PLUG.eraseEverything()'>", lang.erase, "</button>")
	    }
	    if( !Array.isEmpty(x) ) {
		ar.push("<tr class='def'><td colspan='2' align='center'>", x.join(""), "</td></tr>");
	    }
	}
	if( data.altered_dt != null ) {
	    ar = ar.concat(_data2divider(lang.altered_data, 2));
	    ar = ar.concat(_data2msg(G.getdatetime_l(data.altered_dt), 2));
	    ar = ar.concat(data.censor != null ? _data2tbl1_4(data.censor, "altered") : _data2tbl1_5(data.censor_id, "altered"));
	}
	ar = ar.concat(_data2divider(lang.verified_data, 2));
	if( data.u != null ) {
	    ar = ar.concat(_data2msg(G.getdatetime_l(data.fix_dt), 2));
	    ar = ar.concat(_data2tbl1_1(data.u));
	} else {
	    ar = ar.concat(_data2msg(lang.empty, 2));
	}
	ar = ar.concat(_data2divider(lang.founded_data, 2));
	if( data.founder != null ) {
	    ar = ar.concat(_data2msg(G.getdatetime_l(data.founded_dt), 2));
	    ar = ar.concat(_data2tbl1_4(data.founder));
	} else {
	    ar = ar.concat(_data2msg(lang.empty, 2));
	}
	return ar;
    }

    function _data2tbl2(data, f, perm) {
	let ar = [], size = Array.isArray(data.rows2) ? data.rows2.length : 0, max = Math.min(6, size), x = 0, style1;
	for( let r, i = 0; i < size; i++ ) {
	    if( (r = data.rows2[i]) != null && (f == true || r.hidden == 0) ) {
		style1 = r.hidden == 1 ? ' strikethrough' : '';
		if( x == 0 ) {
		    ar.push("<tr class='def'>");
		}
		if( typeof r.censor_id != 'undefined' ) {
		    ar.push("<td class='autoincrement footnote_L altered' data-title='", "{0} ({1}: {2}, {3}: {4})"
			.format_a(lang.altered_data, lang.author.toLowerCase(), G.shielding(r.censor_name,r.censor_id),
			    lang.date.toLowerCase(), G.getdatetime_l(r.altered_dt)),
			"' align='center' width='", 100/max, "%'>");
		} else {
		    ar.push("<td align='center' width='", 100/max, "%'>");
		}
		ar.push("<img class='clickable' onclick='PLUG.slideshow(", r.blob_id, ")' width='90px' src='",
		    G.getdataref({plug: _code, blob: "yes", thumb: "yes", blob_id: r.blob_id}), "' />");
		ar.push("<br/>");
		ar.push("<div class='row", style1, "' x-cookie2='yes'>", G.shielding(r.qentity), "</div>");
		if( perm.remove ) {
		    ar.push("<hr/>");
		    ar.push("<div class='row'>");
		    if( r.hidden == 1 ) {
			ar.push("<a href='javascript:void(0)' onclick='PLUG.restore2(this,", i, ")'>", 
			    lang.restore, "</a>");
		    } else {
			ar.push("<a class='attention' href='javascript:void(0)' onclick='PLUG.remove2(this,", i, ")'>", 
			    lang.unlink, "</a>");
		    }
		    ar.push("</div>");
		}
		ar.push("</td>");
		x++;
		if( x >= max ) {
		    ar.push("</tr>");
		    x = 0;
		}
	    }
	}
	if( x > 0 ) {
	    for( let i = x; i < max; i++ ) {
		ar.push("<td align='center' width='", 100/max, "%'>", "&nbsp;", "</td>");
	    }
	    ar.push("</tr>");
	}
	if( ar.length > 0 && typeof data.data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", max, "' class='watermark'>", lang.data_ts, "&nbsp;", data.data_ts, "</td></tr>");
	}
	return ar;
    }

    function _data2tbl3(data, f, perm) {
	let ar = [], x = 0, style1;
	for( let r, i = 0, size = Array.isArray(data.rows) ? data.rows.length : 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && (f == true || r.hidden == 0) ) {
		style1 = r.hidden == 1 ? ' strikethrough' : '';
		ar.push("<tr>");
		if( typeof r.censor_id != 'undefined' ) {
		    ar.push("<td class='autoincrement footnote_L altered' data-title='", "{0} ({1}: {2}, {3}: {4})"
			.format_a(lang.altered_data, lang.author.toLowerCase(), G.shielding(r.censor_name,r.censor_id),
			    lang.date.toLowerCase(), G.getdatetime_l(r.altered_dt)),
			"' x-cookie1='yes'>");
		} else {
		    ar.push("<td class='autoincrement' x-cookie1='yes'>");
		}
		ar.push(i + 1, "</td>");
		ar.push("<td class='string", style1, "' x-cookie2='yes'>", G.shielding(r.qpath), "</td>");
		ar.push("<td class='string", style1, "' x-cookie2='yes'>", G.shielding(r.qrow), "</td>");
		ar.push("<td class='ref'>");
		if( perm.edit && ['text','integer','float','boolean','triboolean','selector'].includes(r.qtype) ) {
		    ar.push("<span onclick='PLUG.edit(this,", i, ",0.80)'>", G.shielding(r.qitem, r.value), "</span>");
		} else {
		    ar.push(G.shielding(r.qitem, r.value));
		}
		ar.push("</td>");
		if( perm.remove ) {
		    ar.push("<td class='ref'>");
		    if( r.hidden == 1 ) {
			ar.push("<a class='symbol footnote_L' data-title='", lang[_code].restore, "' href='javascript:void(0)' ",
			    "onclick='PLUG.restore(this,", i, ")'>", _restoreSymbol, "</a>");
		    } else {
			ar.push("<a class='symbol attention footnote_L' data-title='", lang[_code].remove, "' href='javascript:void(0)' ",
			    "onclick='PLUG.remove(this,", i, ")'>", _removeSymbol, "</a>");
		    }
		    ar.push("</td>");
		}
		ar.push("</tr>");
		x++;
	    }
	}
	if( ar.length == 0 ) {
	    ar = _data2msg(lang.empty, 5);
	}
	if( typeof data.data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", _getcolumns2(perm), "' class='watermark'>", 
		lang.data_ts, "&nbsp;", data.data_ts, "</td></tr>");
	}
	return ar;
    }

    function _compileRowset(data) {
	if( !Array.isEmpty(data.rows) ) {
	    const i_accounts = Array.createIndexBy(data.accounts, "account_id");
	    const i_censors = Array.createIndexBy(data.censors, "user_id");
	    const i_channels = Array.createIndexBy(data.channels, "chan_id");
	    const i_cities = Array.createIndexBy(data.cities, "city_id");
	    const i_founders = Array.createIndexBy(data.founders, "user_id");
	    const i_qnames = Array.createIndexBy(data.quest_names, "qname_id");
	    const i_regions = Array.createIndexBy(data.regions, "region_id");
	    const i_retail_chains = Array.createIndexBy(data.retail_chains, "rc_id");
	    const i_users = Array.createIndexBy(data.users, "user_id");

	    data.rows.forEach(function(arg, i) {
		arg.a = i_accounts[arg.account_id] || {};
		arg.a.chan = i_channels[arg.a.chan_id] || {};
		arg.a.city = i_cities[arg.a.city_id] || {};
		arg.a.region = i_regions[arg.a.region_id] || {};
		arg.a.rc = i_retail_chains[arg.a.rc_id] || {};
		arg.qname = i_qnames[arg.qname_id] || {};
		arg.censor = i_censors[arg.censor_id] || {};
		arg.founder = i_founders[arg.founder_id] || {};
		arg.u = i_users[arg.user_id] || {};
	    });
	}
	return data;
    }

    function _data1req() {
	ProgressDialog.show();
	_cache.data1 = null; // drop the internal cache
	G.xhr("GET", G.getdataref({plug: _code}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_cache.data1 = _compileRowset(data);
		//console.log(data); console.log(_cache.data1);
		_tags.tbody.html(_data1tbl(_cache.data1, 1, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
	    } else {
		_tags.tbody.html(_data1msg(lang.failure, _perm).join(""));
		_tags.total.html("");
	    }
	    _tags.ts.html(G.getdatetime_l(new Date()));
	    ProgressDialog.hide();
	}).send();
    }

    function _data2req(params) {
	ProgressDialog.show();
	_cache.data2 = null; _cache.p2 = null; // drop the internal cache
	G.xhr("GET", G.getdataref({plug: _code, account_id: params.account_id, qname_id: params.qname_id}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_cache.data2 = data;
		_cache.p2 = params;
console.log(_cache.p2, _cache.data2);
		_tags.tbody2.html(_data2tbl1(_cache.data2, _perm).join(""));
		_tags.tbody3.html(_data2tbl2(_cache.data2, _cache.hidden, _perm).join(""));
		_tags.tbody4.html(_data2tbl3(_cache.data2, _cache.hidden, _perm).join(""));
	    } else {
//		_tags.tbody.html(_data1msg(lang.failure, _perm).join(""));
//		_tags.total.html("");
	    }
	    _tags.ts.html(G.getdatetime_l(new Date()));
	    ProgressDialog.hide();
	}).send();
    }

    function _page(page) {
	if( _cache.data1 != null ) {
	    ProgressDialog.show();
	    setTimeout(function() {
		_tags.tbody.html(_data1tbl(_cache.data1, page, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
		ProgressDialog.hide();
	    }, 0);
	}
    }

    function _togglePopup(popup, tag, offset, oncreate) {
	var x;
	for( var name in _tags.popups) {
	    if( typeof popup != 'undefined' && name == popup ) {
		x = _tags.popups[name];
	    } else {
		_tags.popups[name].hide();
	    }
	}
	if( typeof popup != 'undefined' && x == null ) {
	    x = _tags.popups[popup] = oncreate(popup);
	}
	if( x != null ) {
	    x.toggle(tag, offset);
	}
    }

    function _onpopup(tag, arg, keyname, filterkey) {
	if( _cache.xfilters == null ) {
	    _cache.xfilters = {};
	}
	if( filterkey == null || typeof filterkey == 'undefined' ) {
	    filterkey = keyname;
	}
	if( typeof arg == 'object' ) {
	    _cache.xfilters[filterkey] = Filter.escape(filterkey, arg[keyname]);
	    tag.addClass('important');
	} else {
	    _cache.xfilters[filterkey] = null;
	    tag.removeClass('important')
	}
	_page(1);
    }

    function _switchTo(attrs) {
	const f = typeof attrs != 'undelined' && attrs != null;
	_togglePopup();
/*_tags.tbody2.html("");
	_tags.tbody3.html("");
	_tags.tbody4.html("");*/
	_tags.summary.forEach(function(arg) { if( f == true ) { arg.hide(); } else { arg.show(); } });
	_tags.more.forEach(function(arg)    { if( f == true ) { arg.show(); } else { arg.hide(); } });
	if( f ) {
	    if( _cache.data2 == null || _cache.p2 == null || _cache.p2.account_id != attrs.account_id || _cache.p2.qname_id != attrs.qname_id ) {
		_data2req({account_id: attrs.account_id, qname_id: attrs.qname_id});
	    }
	    history.replaceState({account_id: attrs.account_id, qname_id: attrs.qname_id}, "", 
		G.getdefref({plug: _code, account_id: attrs.account_id, qname_id: attrs.qname_id}));
	} else {
	    if( _cache.data1 == null ) {
		_data1req();
	    }
	    history.replaceState({}, "", G.getdefref({plug: _code}));
	}
	_cache.screenName = f ? 'quest' : 'main';
    }

    function _forceStyle(tag, selectors, className) {
	const ar = (tag || document ).querySelectorAll(selectors);
	for( let i = 0, size = ar.length; i < size; i++ ) {
	    ar[i].addClass(className);
	}
    }

    function _suppressStyle(tag, selectors, className) {
	const ar = (tag || document).querySelectorAll(selectors);
	for( let i = 0, size = ar.length; i < size; i++ ) {
	    ar[i].removeClass(className);
	}
    }

    function _updateHiddenValue(tag, data, method, facility /* Q|Q2 */, onsuccess) {
	let fd = new FormData();
	fd.append("_datetime", G.getdatetime(new Date()));
	fd.append("facility", facility);
	fd.append("fix_date", data.fix_date || "?");
	fd.append("account_id", data.account_id || "?");
	fd.append("qname_id", data.qname_id || "?");
	if( facility == 'Q' ) {
	    fd.append("qrow_id", data.qrow_id || "?");
	} else if( facility == "Q2" ) {
	    fd.append("guid", data.guid || "?");
	    fd.append("qentity_id", data.qentity_id || "?");
	}
	ProgressDialog.show();
	tag.style.visibility = 'hidden';
	G.xhr(method, G.getdataref({plug: _code, facility: facility}), "", function(xhr) {
	    if( xhr.status == 200 ) {
		onsuccess(tag, data, method, facility);
	    } else {
		Toast.show(lang.errors.runtime);
	    }
	    tag.style.visibility = 'visible';
	    ProgressDialog.hide();
	}).send(fd);
    }

    function _eraseEverything(data) {
	Dialog({
	    container: "baseDialog-blue", 
	    width: 410, 
	    title: lang.erase, 
	    body: ["<div>", lang[_code].erase_warning, "</div>"],
	    buttons: ["<div class='row' align='right'>", "<button id='eraseEverything'>", lang.erase, "</button>", "</div>"]
	}).show(function(dialogView) {
	    const commitView = _("eraseEverything");
	    commitView.onclick = function() {
		const facility = "erase";
		const fd = new FormData();
		fd.append("_datetime", G.getdatetime(new Date()));
		fd.append("facility", facility);
		fd.append("fix_date", data.fix_date || "?");
		fd.append("account_id", data.account_id || "?");
		fd.append("qname_id", data.qname_id || "?");
		commitView.disabled = true;
		dialogView.startSpinner();
		G.xhr("DELETE", G.getdataref({plug: _code, facility: facility}), "", function(xhr) {
		    if( xhr.status == 200 ) {
			PLUG.refresh();
			dialogView.hide();
		    } else {
			Toast.show(lang.errors.runtime);
			commitView.disabled = false;
		    }
		    dialogView.stopSpinner();
		}).send(fd);
	    };
	});
    }

    function _changeValue(tag, data, offset) {
	var ar = [];
	ar.push("<h1>", data.qrow)
	if( !String.isEmpty(data.qpath) ) {
	    ar.push("<div>", data.qpath, "</div>");
	}
	ar.push("</h1>");
	ar.push("<div onclick='event.stopPropagation();'>");
	if( !String.isEmpty(data.extra_info) ) {
	    ar.push("<p>", "<div class='row'>", data.extra_info, "</div>", "</p>");
	}
	ar.push("<div class='row attention gone' id='v:alert'></div>");
	ar.push("<div class='row'>");
	if( data.qtype == 'text' ) {
	    ar.push("<textarea id='v:data' rows='2' maxlength='1024' autocomplete='off'>", "</textarea>");
	} else if( ['integer','float'].includes(data.qtype) ) {
	    ar.push("<input id='v:data' type='text' maxlength='5' autocomplete='off'>", "</input>");
	} else if( ['boolean','triboolean'].includes(data.qtype) ) {
	    ar.push("<select id='v:data'>");
	    if( data.qtype == 'triboolean' ) {
		ar.push("<option value='maybe'>", lang.maybe, "</option>");
	    }
	    ar.push("<option value='no'>", lang.no, "</option>");
	    ar.push("<option value='yes'>", lang.yes, "</option>");
	    ar.push("</select>");
	} else if( data.qtype == 'selector' ) {
	    ar.push("<select id='v:data'>");
	    for( let i = 0, size = Array.isEmpty(data.quest_items) ? 0 : data.quest_items.length, k; i < size; i++ ) {
		if( (k = data.quest_items[i]) != null ) {
		    ar.push("<option value='", k.qitem_id, "'>", G.shielding(k.descr), "</option>");
		}
	    }
	    ar.push("</select>");
	}
	ar.push("</div>");
	ar.push("<br/>");
	ar.push("<div align='center'>");
	ar.push("<button id='v:commit' disabled='true'>", lang.save, "</button>");
	ar.push("</div>");
	ar.push("</div>");
	_tags.valuePopup.set(ar, 400);
	_tags.valuePopup.toggle(tag, offset, function(popupView) {
	    const preventPast = function(event) {
		event.preventDefault();
	    }
	    const is = function() {
		return !(String.isEmpty(data._newValue) || data._newValue == data.value);
	    }
	    const dataView = _("v:data");
	    const alertView = _("v:alert");
	    const commitView = _("v:commit");
	    dataView.focus();
	    dataView.value = data._newValue || data.value;
	    dataView.oninput = function() {
		data._newValue = this.value.trim();
		commitView.disabled = !is();
		alertView.hide();
	    }
	    if( data.qtype == 'integer' ) {
		dataView.onpaste = preventPast;
		dataView.onkeypress = function(event) {
		    if( event.charCode == 13 && is() ) {
			commitView.click();
		    }
		    return event.charCode >= 48 && event.charCode <= 57;
		};
	    } else if( data.qtype == 'float' ) {
		dataView.onpaste = preventPast;
		dataView.onkeypress = function(event) {
		    if( event.charCode == 13 && is() ) {
			commitView.click();
		    }
		    return (event.charCode >= 48 && event.charCode <= 57) || 
			(event.charCode == 46 /* [.] */ && !dataView.value.includes('.'));
		}
	    } else if( ['text','boolean','triboolean','selector'].includes(data.qtype) ) {
		dataView.onkeypress = function(event) {
		    if( event.charCode == 13 && is() ) {
			commitView.click();
		    }
		    return event.charCode != 13;
		}
	    }
	    commitView.disabled = String.isEmpty(data._newValue) || data._newValue == data.value;
	    commitView.onclick = function() {
		const facility = "set";
		const fd = new FormData();
		fd.append("_datetime", G.getdatetime(new Date()));
		fd.append("facility", facility);
		fd.append("fix_date", data.fix_date || "?");
		fd.append("account_id", data.account_id || "?");
		fd.append("qname_id", data.qname_id || "?");
		fd.append("qrow_id", data.qrow_id || "?");
		fd.append("value", data._newValue);
		commitView.disabled = true;
		alertView.hide();
		popupView.startSpinner();
		G.xhr("PUT", G.getdataref({plug: _code, facility: facility}), "", function(xhr) {
		    if( xhr.status == 200 ) {
			if( data.qtype == 'selector' && !Array.isEmpty(data.quest_items) ) {
			    const found = data.quest_items.find(element => element.qitem_id == data._newValue);
			    data.qitem = found == null ? data._newValue : found.descr;
			    tag.html(data.qitem);
			} else {
			    tag.html(data._newValue);
			}
			data.value = data._newValue;
			data._newValue = null;
			popupView.hide();
		    } else {
			alertView.html(lang.errors.runtime);
			alertView.show();
			commitView.disabled = false;
		    }
		    popupView.stopSpinner();
		}).send(fd);
	    };
	});
    }


/* public properties & methods */
    return {
	startup: function(tags, params, perm) {
	    _perm = perm;
	    _perm.rows = perm.rows == null || perm.rows <= 0 ? 100 : perm.rows;
	    _tags = tags;
	    _tags.body.html(_getbody(perm).join(""));
	    _tags.tbody = _("maintb");
	    _tags.tbody2 = _("tbody2");
	    _tags.tbody3 = _("tbody3");
	    _tags.tbody4 = _("tbody4");
	    _tags.f = _("plugFilter");
	    _tags.ts = _("timestamp");
	    _tags.total = _("plugTotal");
	    _tags.summary = [_("accountsGroup"), _("accountsContainer")];
	    _tags.more = [_("questGroup"), _("questContainer")];
	    _tags.popups = {};
	    _tags.valuePopup = new Popup();
	    _switchTo(params);
	},
	refresh: function() {
	    _togglePopup();
	    _tags.popups = {};
	    if( _cache.screenName == 'main' || _cache.p2 == null ) {
		_data1req();
		_cache.data2 = null;
		_cache.p2 = null;
	    } else {
		_data2req(_cache.p2);
		_cache.data1 = null;
	    }
	},
	filter: function(tag, ev) {
	    _togglePopup();
	    return Filter.onkeyup(tag, ev, function() {
		_page(1);
	    });
	},
	page: function(arg) {
	    _page(arg);
	    window.scrollTo(0, 0);
	},
	checkrow: function(tag, row_id) {
	    G.checkrow(tag, function(arg) {
		if( typeof _cache.checked == 'undefined' ) {
		    _cache.checked = {};
		}
		_cache.checked[row_id] = arg;
	    });
	},
	channels: function(tag, offset) {
	    _togglePopup("channels", tag, offset, function(obj) {
		return ChannelsPopup(_cache.data1[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "chan_id");
		})
	    });
	},
	retail_chains: function(tag, offset) {
	    _togglePopup("retail_chains", tag, offset, function(obj) {
		return RetailChainsPopup(_cache.data1[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "rc_id");
		})
	    });
	},
	qnames: function(tag, offset) {
	    _togglePopup("quest_names", tag, offset, function(obj) {
		return QuestNamesPopup(_cache.data1[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "qname_id");
		})
	    });
	},
	quest: function(row_no) {
	    _switchTo(_cache.data1.rows[row_no-1]);
	    window.scrollTo(0, 0);
	},
	back: function() {
	    _switchTo();
	},
	slideshow: function(blob_id) {
	    SlideshowSimple([G.getdataref({plug: _code, blob: "yes", blob_id: blob_id})]).show();
	},
	remove: function(tag, i) {
	    _updateHiddenValue(tag, _cache.data2.rows[i], "DELETE", "Q", function(tag, r) /* onsuccess */ {
		let tr = tag.parentNode.parentNode;
		_forceStyle(tr, '[x-cookie1]', 'altered');
		_suppressStyle(tr, '[x-cookie1]', 'footnote_L');
		_forceStyle(tr, '[x-cookie2]', 'strikethrough');
		tag.setAttribute("data-title", lang[_code].restore);
		tag.removeClass('attention');
		tag.html(_restoreSymbol);
		tag.onclick = function() { PLUG.restore(tag, i); }
		r.hidden = 1;
	    });
	},
	restore: function(tag, i) {
	    _updateHiddenValue(tag, _cache.data2.rows[i], "PUT", "Q", function(tag, r) /* onsuccess */ {
		let tr = tag.parentNode.parentNode;
		_forceStyle(tr, '[x-cookie1]', 'altered');
		_suppressStyle(tr, '[x-cookie1]', 'footnote_L');
		_suppressStyle(tr, '[x-cookie2]', 'strikethrough');
		tag.setAttribute("data-title", lang[_code].remove);
		tag.addClass('attention');
		tag.html(_removeSymbol);
		tag.onclick = function() { PLUG.remove(tag, i); }
		r.hidden = 0;
	    });
	},
	remove2: function(tag, i) {
	    _updateHiddenValue(tag, _cache.data2.rows2[i], "DELETE", "Q2", function(tag, r) /* onsuccess */ {
		let tr = tag.parentNode.parentNode;
		tr.removeClass('footnote_L');
		_forceStyle(tr, '[x-cookie2]', 'strikethrough');
		tag.removeClass('attention');
		tag.html(lang.restore);
		tag.onclick = function() { PLUG.restore2(tag, i); }
		r.hidden = 1;
	    });
	},
	restore2: function(tag, i) {
	    _updateHiddenValue(tag, _cache.data2.rows2[i], "PUT", "Q2", function(tag, r) /* onsuccess */ {
		let tr = tag.parentNode.parentNode;
		tr.removeClass('footnote_L');
		_suppressStyle(tr, '[x-cookie2]', 'strikethrough');
		tag.addClass('attention');
		tag.html(lang.unlink);
		tag.onclick = function() { PLUG.remove2(tag, i); }
		r.hidden = 0;
	    });
	},
	eraseEverything: function() {
	    if( _cache.data2 != null ) {
		_eraseEverything(_cache.data2);
	    }
	},
	edit: function(tag, i, offset) {
	    _changeValue(tag, _cache.data2.rows[i], offset);
	},




/*,
	users: function(tag, type, offset) {
	    _togglePopup(type+"s", tag, offset, function(obj) {
		return UsersPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "user_id", type+"_id");
		}, {container:type+"sPopup", everyone:true})
	    });
	},
	more: function(row_no) {
	    _switchTo(_cache.data.rows[row_no-1]);
	    _historyState(_cache.y, _cache.m, _cache.u);
	    window.scrollTo(0, 0);
	},
	back: function() {
	    _switchTo();
	    _historyState(_cache.y, _cache.m, _cache.u);
	},
	page: function(arg) {
	    _morepage(arg);
	    window.scrollTo(0, 0);
	},
*/
	hidden: function(tag) {
	    if( tag.hasClass("important") ) {
		_cache.hidden = null;
		tag.removeClass('important');
	    } else {
		_cache.hidden = true;
		tag.addClass('important');
	    }
	    _tags.tbody3.html(_data2tbl2(_cache.data2, _cache.hidden, _perm).join(""));
	    _tags.tbody4.html(_data2tbl3(_cache.data2, _cache.hidden, _perm).join(""));
	}
    }
})();


function startup(params, perm) {
    if( params == null || typeof params != 'object' || typeof params.account_id == 'undefined' || typeof params.qname_id == 'undefined' ) {
	PLUG.startup({body: _('pluginContainer')}, null, perm);
    } else {
	PLUG.startup({body: _('pluginContainer')}, params, perm);
    }
}

window.onpopstate = function(event) {
    window.location.reload(true);
}
