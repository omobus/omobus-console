/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "contacts";
    var _cache = {}, _perm = {}, _tags = {};


    function _fmtcontact(d) {
	return lang.personFormat.format({name: G.shielding(d.name), patronymic: G.shielding(d.patronymic), surname: G.shielding(d.surname)});
    }

    function _getcolumns(perm) {
	let x = 13, c = perm.columns || {};
	if( c.channel == true ) x++;
	if( c.cohort == true ) x++;
	if( c.specialization == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.contacts.title, "</span>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.xlsx(this)'>", lang.export.xlsx, "</a>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th rowspan='2' class='autoincrement'>", lang.num, "</th>");
	ar.push("<th rowspan='2' width='150px'>", lang.contact, "</th>");
	ar.push("<th rowspan='2' class='sw95px'><a href='javascript:void(0)' onclick='PLUG.jobs(this, 0.30)'>", lang.job_title, "</a></th>");
	ar.push("<th rowspan='2'>", lang.a_code, "</th>");
	ar.push("<th rowspan='2'><a href='javascript:void(0)' onclick='PLUG.retail_chains(this)'>", lang.a_name, "</a></th>");
	ar.push("<th rowspan='2'>", lang.address, "</th>");
	if( perm.columns != null && perm.columns.channel == true ) {
	    ar.push("<th rowspan='2' class='sw95px'><a href='javascript:void(0)' onclick='PLUG.channels(this)'>", lang.chan_name, "</a></th>");
	}
	if( perm.columns != null && perm.columns.specialization == true ) {
	    ar.push("<th rowspan='2' width='65px'><a href='javascript:void(0)' onclick='PLUG.specs(this, 0.30)'>", lang.specialization, "</a></th>");
	}
	if( perm.columns != null && perm.columns.cohort == true ) {
	    ar.push("<th rowspan='2' width='65px'><a href='javascript:void(0)' onclick='PLUG.levels(this, 0.30)'>", lang.cohort, "</a></th>");
	}
	ar.push("<th colspan='2'>", lang.contacts.informing.group, "</th>");
	ar.push("<th rowspan='2'>", lang.note, "</th>");
	ar.push("<th colspan='2'>", lang.contacts.consents.group, "</th>");
	ar.push("<th rowspan='2' class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"author\",0.90)'>", lang.author, "</a></th>");
	ar.push("<th rowspan='2' class='footnote_L' data-title='", lang.alien_data, "'>", "&#9850;", "</th>");
	ar.push("<tr>");
	for( let i = 0; i < 2; i++ ) {
	    ar.push("<th width='36px'><a href='javascript:void(0)' onclick='PLUG.informing(this,", i+1, ")'>", 
		lang.contacts.informing.abbr[i], "</th>");
	}
	for( let i = 0; i < 2; i++ ) {
	    ar.push("<th width='25px'><a class='footnote_L' href='javascript:void(0)' onclick='PLUG.consent(this,", i+1, ")'",
		" data-title='", lang.contacts.consents.name[i], "'>", lang.contacts.consents.abbr[i], "</th>");
	}
	ar.push("</tr>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(ChannelsPopup.container());
	ar.push(JobTitlesPopup.container());
	ar.push(CohortsPopup.container());
	ar.push(RetailChainsPopup.container());
	ar.push(SpecializationsPopup.container());
	ar.push(UsersPopup.container("authorsPopup"));
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
	    "account_id", 
	    "a_code", 
	    "a_name", 
	    "address",
	    "chan_id", 
	    "chan",
	    "poten",
	    "rc_id", 
	    "rc", 
	    "ka_type",
	    "region",
	    "city",
	    "contact_id",
	    "name", 
	    "surname", 
	    "patronymic", 
	    "mobile", 
	    "email",
	    "job_title_id", 
	    "job_title",
	    "spec_id",
	    "specialization",
	    "cohort_id",
	    "extra_info",
	    "consent_status",
	    "author_id", 
	    "author"
	]);
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z, t;
	var rx = new RegExp("['\"]", "g");
	data._rows = [];
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    var xs = "", z = [false, false], y = [false, false], w = Date.parseISO8601(r.consent_dt);
		    if( r.a_hidden ) {
			xs = " strikethrough attention";
		    } else if ( r.a_locked ) {
			xs = " strikethrough";
		    }
		    if( !String.isEmpty(r.patronymic) || !String.isEmpty(r.surname) ) {
			z[0] = true;
		    }
		    if( !String.isEmpty(r.email) || !String.isEmpty(r.mobile) ) {
			z[0] = z[1] = true;
		    }
		    if( r.consent_status == 'collecting' ) {
			y[0] = true;
		    } else if( r.consent_status == 'collecting_and_informing' ) {
			y[0] = y[1] = true;
		    }
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.contact_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.contact_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    t = G.shielding(r.contact_id).replace(rx,' ');
		    ar.push("<td class='string'>", _fmtcontact(r));
		    if( r.contact_id.length > 21 ) {
			ar.push("<div class='row watermark copyable footnote' data-title='{0}' onclick='G.copyToClipboard(\"{0}\");event.stopPropagation();'>"
			    .format_a(t), "<hr/>", G.shielding(r.contact_id).mtrunc(21), "</div>");
		    } else {
			ar.push("<div class='row watermark copyable' onclick='G.copyToClipboard(\"{0}\");event.stopPropagation();'>"
			    .format_a(t), "<hr/>", G.shielding(r.contact_id), "</div>");
		    }
		    ar.push("</td>");
		    if( r.locked ) {
			ar.push("<td class='ref strikethrough footnote' data-title='", lang.contacts.footnote0, "'>", 
			    G.shielding(r.job_title), "</td>");
		    } else {
			ar.push("<td class='ref'>", G.shielding(r.job_title), "</td>");
		    }
		    ar.push("<td class='int", xs, "'>", G.shielding(r.a_code), "</td>");
		    ar.push("<td class='string a_name", xs, "'>", G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string a_address", xs, "'>", G.shielding(r.address), "</td>");
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px'>", G.shielding(r.chan), "</td>");
		    }
		    if( perm.columns != null && perm.columns.specialization == true ) {
			ar.push("<td class='ref'>", G.shielding(r.specialization), "</td>");
		    }
		    if( perm.columns != null && perm.columns.cohort == true ) {
			ar.push("<td class='ref'>", G.shielding(r.cohort), "</td>");
		    }
		    ar.push("<td class='int' width='36px'>");
		    if( String.isEmpty(r.mobile) ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<span class='copyable footnote_L' data-title='{1}: {0}' onclick='G.copyToClipboard(\"{0}\");event.stopPropagation();'>"
			    .format_a(G.shielding(r.mobile), lang.mobile), "<hr/>", lang.plus, "</span>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='int' width='36px'>");
		    if( String.isEmpty(r.email) ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<span class='copyable footnote_L' data-title='{1}: {0}' onclick='G.copyToClipboard(\"{0}\");event.stopPropagation();'>"
			    .format_a(G.shielding(r.email), lang.email), "<hr/>", lang.plus, "</span>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string note'>", G.shielding(r.extra_info), "</td>");
		    ar.push("<td class='int", (z[0] && !y[0]) ? " violation" : "", "' width='25px'>");
		    if( y[0] ) {
			ar.push("<a href='", G.getdataref({plug: _code, contact_id: r.contact_id, blob: true}), "'");
			if( w != null ) {
			    ar.push(" class='footnote_L' data-title='{0}: {1}'".format_a(lang.contacts.consents.timestamp, G.getdatetime_l(w)));
			}
			ar.push(" target='_blank'>", lang.plus, "</a>");
		    } else {
			ar.push("&nbsp;");
		    }
		    ar.push("</td>");
		    ar.push("<td class='int", (z[1] && !y[1]) ? " violation" : "", "' width='25px'>");
		    if( y[1] ) {
			ar.push("<a href='", G.getdataref({plug: _code, contact_id: r.contact_id, blob: true}), "'");
			if( w != null ) {
			    ar.push(" class='footnote_L' data-title='{0}: {1}'".format_a(lang.contacts.consents.timestamp, G.getdatetime_l(w)));
			}
			ar.push(" target='_blank'>", lang.plus, "</a>");
		    } else {
			ar.push("&nbsp;");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string sw95px'>", G.shielding(r.author), "</td>");
		    if( r._isaliendata ) {
			ar.push("<td width='14px' class='int footnote_L' data-title='", lang.alien_data, "'>", "&#9850;", "</td>");
		    } else {
			ar.push("<td width='14px' class='int'>", "&nbsp;", "</td>");
		    }
		    ar.push("</tr>");
		}
		data._rows.push(r);
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
	    ar.push("<tr class='def'><td colspan='" + _getcolumns(perm) + "' class='watermark'>" + lang.data_ts +
		"&nbsp;" + data.data_ts + "</td></tr>");
	}
	if( (z = Math.floor(x/perm.rows) + ((x%perm.rows)?1:0)) > 1 /*pages: */ ) {
	    ar.push("<tr class='def'><td colspan='" + _getcolumns(perm) + "' class='navbar'>");
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

    function _compileRowset(data) {
	const ar = [];
	const i_accounts = Array.createIndexBy(data.accounts, "account_id");
	const i_authors = Array.createIndexBy(data.authors, "user_id");
	const i_channels = Array.createIndexBy(data.channels, "chan_id");
	const i_cities = Array.createIndexBy(data.cities, "city_id");
	const i_jobs = Array.createIndexBy(data.job_titles, "job_title_id");
	const i_loyalties = Array.createIndexBy(data.cohorts, "cohort_id");
	const i_regions = Array.createIndexBy(data.regions, "region_id");
	const i_retail_chains = Array.createIndexBy(data.retail_chains, "rc_id");
	const i_specs = Array.createIndexBy(data.specializations, "spec_id");

	if( !Array.isEmpty(data.rows) ) {
	    data.rows.forEach(function(arg, i) {
		const a = i_accounts[arg.account_id] || {};
		const u = i_authors[arg.author_id] || {};
		const h = i_channels[a.chan_id] || {};
		const k = i_cities[a.city_id] || {};
		const j = i_jobs[arg.job_title_id] || {};
		const l = i_loyalties[arg.cohort_id] || {};
		const e = i_regions[a.region_id] || {};
		const r = i_retail_chains[a.rc_id] || {};
		const s = i_specs[arg.spec_id] || {};
		const x = {}

		x.row_no = i + 1;
		x.contact_id = arg.contact_id;
		x.name = arg.name;
		x.surname = arg.surname;
		x.patronymic = arg.patronymic;
		x.job_title_id = arg.job_title_id;
		x.job_title = j.descr;
		x.spec_id = arg.spec_id;
		x.specialization = s.descr;
		x.cohort_id = arg.cohort_id;
		x.cohort = l.descr;
		x.mobile = arg.mobile;
		x.email = arg.email;
		x.account_id = a.account_id;
		x.a_code = a.code;
		x.a_name = a.descr;
		x.address = a.address;
		x.a_hidden = a.hidden;
		x.a_locked = a.locked;
		x.chan_id = h.chan_id;
		x.chan = h.descr;
		x.rc_id = r.rc_id;
		x.rc = r.descr;
		x.ka_type = r.ka_type;
		x.region_id = e.region_id;
		x.region = e.descr;
		x.city_id = k.city_id;
		x.city = k.descr;
		x.author_id = arg.author_id;
		x.author = u.descr;
		x.extra_info = arg.extra_info;
		x.consent_status = arg.consent_status;
		x.consent_dt = arg.consent_dt;
		x.locked = arg.locked;
		x.updated_ts = arg.updated_ts;
		x._isaliendata = arg._isaliendata;
		ar.push(x);
	    });
	}

	return {
	    data_ts: data.data_ts,
	    rows: ar,
	    authors: data.authors,
	    channels: data.channels,
	    cities: data.cities,
	    job_titles: data.job_titles,
	    cohorts: data.cohorts,
	    regions: data.regions,
	    retail_chains: data.retail_chains,
	    specializations: data.specializations
	}
    }

    function _datareq() {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getdataref({plug: _code}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_cache.data = _compileRowset(data);
		//console.log(data);
		//console.log(_cache.data);
		_tags.tbody.html(_datatbl(_cache.data, 1, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
	    } else {
		_tags.tbody.html(_datamsg(lang.failure, _perm).join(""));
		_tags.total.html("");
	    }
	    _tags.ts.html(G.getdatetime_l(new Date()));
	    ProgressDialog.hide();
	}).send();
    }

    function _page(page) {
	if( _cache.data != null ) {
	    ProgressDialog.show();
	    setTimeout(function() {
		_tags.tbody.html(_datatbl(_cache.data, page, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
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

    function _consentFilter(tag, n) {
	if( _cache.xfilters == null ) {
	    _cache.xfilters = {};
	}
	if( tag.hasClass("important") ) {
	    _cache.xfilters["consent_status" + n] = null;
	    tag.removeClass('important');
	} else {
	    const z = [];
	    if( n == 1 ) {
		z.push("collecting");
		z.push("collecting_and_informing");
	    } else {
		z.push("collecting_and_informing");
	    }
	    _cache.xfilters["consent_status" + n] = "consent_status=({0})$".format_a(z.join("|"));
	    tag.addClass('important');
	}
	_page(1);
    }

    function _informingFilter(tag, n) {
	if( _cache.xfilters == null ) {
	    _cache.xfilters = {};
	}
	if( tag.hasClass("important") ) {
	    if( n == 1 ) { _cache.xfilters["mobile"] = null; }
	    if( n == 2 ) { _cache.xfilters["email"] = null; }
	    tag.removeClass('important');
	} else {
	    if( n == 1 ) { _cache.xfilters["mobile"] = "mobile=(.*)$"; }
	    if( n == 2 ) { _cache.xfilters["email"] = "email=(.*)$"; }
	    tag.addClass('important');
	}
	_page(1);
    }

    function _toxlsx() {
	var ar = [], data_ts;
	var func = function(data_ts, ar, templ) {
	    XlsxPopulate.fromDataAsync(templ)
		.then(wb => {
		    var offset = 3;
		    var ws = wb.sheet(0);
		    wb.properties()._node.children = [];
		    wb.property('Title', lang.contacts.title);
		    wb.property('Author', __AUTHOR__);
		    //wb.property('Description', "{0} {1}".format_a(lang.data_ts, data_ts));
		    ws.name(_code);
		    for( var i = 0, size = Math.min(ar.length,1048576 - offset), x; i < size; i++ ) {
			r = ar[i];
			ws.cell("A{0}".format_a(i + offset)).value(r.row_no);
			ws.cell("B{0}".format_a(i + offset)).value(r.contact_id);
			ws.cell("C{0}".format_a(i + offset)).value(_fmtcontact(r));
			ws.cell("D{0}".format_a(i + offset)).value(r.job_title);
			ws.cell("E{0}".format_a(i + offset)).value(r.specialization);
			ws.cell("F{0}".format_a(i + offset)).value(r.cohort);
			ws.cell("G{0}".format_a(i + offset)).value(r.mobile);
			ws.cell("H{0}".format_a(i + offset)).value(r.email);
			ws.cell("I{0}".format_a(i + offset)).value(r.a_code);
			ws.cell("J{0}".format_a(i + offset)).value(r.a_name);
			ws.cell("K{0}".format_a(i + offset)).value(r.address);
			ws.cell("L{0}".format_a(i + offset)).value(r.chan);
			ws.cell("M{0}".format_a(i + offset)).value(r.poten);
			ws.cell("N{0}".format_a(i + offset)).value(r.region);
			ws.cell("O{0}".format_a(i + offset)).value(r.city);
			ws.cell("P{0}".format_a(i + offset)).value(r.rc);
			ws.cell("Q{0}".format_a(i + offset)).value(r.ka_type);
			ws.cell("R{0}".format_a(i + offset)).value(r.extra_info);
			if( r.consent_status == 'collecting' || r.consent_status == 'collecting_and_informing' ) {
			    ws.cell("S{0}".format_a(i + offset)).value(lang.yes);
			}
			if( r.consent_status == 'collecting_and_informing' ) {
			    ws.cell("T{0}".format_a(i + offset)).value(lang.yes);
			}
			ws.cell("U{0}".format_a(i + offset)).value(Date.parseISO8601(r.consent_dt));
			ws.cell("V{0}".format_a(i + offset)).value(r.author);
			ws.cell("W{0}".format_a(i + offset)).value(/*Date.parseISO8601(*/r.updated_ts/*)*/);
		    }
		    wb.outputAsync()
			.then(function(blob) {
			    saveAs(blob, "{0}.xlsx".format_a(_code));
			    ProgressDialog.hide();
			})
		})
		.catch(function(err) {
		    ProgressDialog.hide();
		    Toast.show(lang.errors.xlsx);
		    console.log(err);
		});
	}
	if( _cache.data != null && Array.isArray(_cache.data._rows) ) {
	    _cache.data._rows.forEach(function(r, i) {
		ar.push(r);
	    });
	    data_ts = _cache.data.data_ts;
	}
	ProgressDialog.show();
	if( _cache.xlsx == null ) {
	    G.xhr("GET", G.getstaticref("assets/{0}.xlsx".format_a(_code)), "arraybuffer", function(xhr, data) {
		if( xhr.status == 200 && data != null ) {
		    func(data_ts, ar, data);
		    _cache.xlsx = data;
		} else {
		    ProgressDialog.hide();
		    Toast.show(lang.errors.not_found);
		}
	    }).send();
	} else {
	    func(data_ts, ar, _cache.xlsx);
	}
    }


/* public properties & methods */
    return {
	startup: function(tags, perm) {
	    _perm = perm;
	    _perm.rows = perm.rows == null || perm.rows <= 0 ? 100 : perm.rows;
	    _tags = tags;
	    _tags.body.html(_getbody(perm).join(""));
	    _tags.tbody = _("maintb");
	    _tags.f = _("plugFilter");
	    _tags.ts = _("timestamp");
	    _tags.total = _("plugTotal");
	    _tags.popups = {};
	    _datareq();
	},
	refresh: function() {
	    _togglePopup();
	    _tags.popups = {};
	    _datareq();
	},
	filter: function(tag, ev) {
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
	users: function(tag, type, offset) {
	    _togglePopup(type+"s", tag, offset, function(obj) {
		return UsersPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "user_id", type+"_id");
		}, {container:type+"sPopup", everyone:true})
	    });
	},
	channels: function(tag, offset) {
	    _togglePopup("channels", tag, offset, function(obj) {
		return ChannelsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "chan_id");
		})
	    });
	},
	retail_chains: function(tag, offset) {
	    _togglePopup("retail_chains", tag, offset, function(obj) {
		return RetailChainsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "rc_id");
		})
	    });
	},
	jobs: function(tag, offset) {
	    _togglePopup("job_titles", tag, offset, function(obj) {
		return JobTitlesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "job_title_id");
		})
	    });
	},
	levels: function(tag, offset) {
	    _togglePopup("cohorts", tag, offset, function(obj) {
		return CohortsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "cohort_id");
		})
	    });
	},
	specs: function(tag, offset) {
	    _togglePopup("specializations", tag, offset, function(obj) {
		return SpecializationsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "spec_id");
		})
	    });
	},
	consent: function(tag, n) {
	    _togglePopup();
	    _consentFilter(tag, n);
	},
	informing: function(tag, n) {
	    _togglePopup();
	    _informingFilter(tag, n);
	},
	xlsx: function() {
	    _toxlsx();
	}
    }
})();


function startup(perm) {
    PLUG.startup({body: _('pluginContainer')}, perm);
}
