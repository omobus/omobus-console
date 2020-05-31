/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
/* private properties & methods */
    var _code = "planograms";
    var _cache = {}, _perm = {}, _tags = {};

    function _getcolumns(perm) {
	return 11;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.planograms.title, "</span>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	if( typeof perm.add != 'undefined' ) {
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0);' onclick='PLUG.add();'>", lang.planograms.add, "</a>");
	}
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th>", lang.code, "</th>");
	ar.push("<th>", lang.planogram, "</th>");
	ar.push("<th>", lang.blob_size, "</th>");
	ar.push("<th>", lang.country, "</th>");
	ar.push("<th>", lang.brand, "</th>");
	ar.push("<th>", lang.rc_name, "</th>");
	ar.push("<th>", lang.chan_name, "</th>");
	ar.push("<th>", lang.validity, "</th>");
	ar.push("<th class='symbol'>", "&#x2699;", "</th>");
	ar.push("<th>", lang.author, "</th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(Dialog.container());
	ar.push(SlideshowSimple.container());
	ar.push(CountriesPopup.container());
	ar.push(RetailChainsPopup.container());
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
	return Filter(a.join(' '), false);
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _shieldingStringArray(ar) {
	let x = [];
	for( let i = 0, size = ar == null ? 0 : ar.length; i < size; i++ ) {
	    x.push(G.shielding(ar[i]));
	}
	return x;
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, today = G.getdate(new Date()), x = 0, r, z;
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.pl_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.pl_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    if( (perm.edit || r._isowner) && (typeof r._isaliendata == 'undefined' || r._isaliendata == 0) ) {
			ar.push("<td class='int'>", "<a href='javascript:void(0);' onclick='PLUG.edit(\"", r.pl_id, "\")'>", 
			    G.shielding(r.pl_id), "</a>", "</td>");
		    } else {
			ar.push("<td class='int'>", G.shielding(r.pl_id), "</td>");
		    }
		    ar.push("<td class='string", String.isEmpty(r.descr) ? " incomplete" : "", 
			(typeof r.e_date == 'undefined' || r.e_date >= today) ? "" : " disabled", 
			"'>", G.shielding(r.descr), "</td>");
		    ar.push("<td width='65px' class='ref", typeof r.blob_size == 'undefined' ? " incomplete" : "", "'>");
		    if( typeof r.blob_size == 'undefined' ) {
			ar.push("&nbsp;");
		    } else if( r.content_type == 'image/jpeg' ) {
			ar.push("<a href='javascript:void(0);' onclick='PLUG.slideshow(\"", r.pl_id, "\")'>",
			    r.blob_size ? G.getnumeric_l(r.blob_size/1024, 1) : lang.dash, "</a>");
		    } else {
			ar.push("<a href='", G.getajax({plug: _code, pl_id: r.pl_id, blob: true}), "' target='_blank'>",
			    r.blob_size ? G.getnumeric_l(r.blob_size/1024, 1) : lang.dash, "</a>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref sw95px", String.isEmpty(r.country_id) ? " incomplete" : "", "'>", G.shielding(r.country), "</td>");
		    ar.push("<td class='ref sw95px", Array.isEmpty(r.brand_ids) ? " incomplete" : "", "'>");
		    if( Array.isArray(r.brands) ) {
			r.brands.forEach(function(arg0, arg1) {
			    if( arg1 > 0 ) {
				ar.push("<hr/><div class='row remark'>", G.shielding(arg0), "</div>");
			    } else {
				ar.push(G.shielding(arg0));
			    }
			});
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref Xsw95px'>");
		    if( !String.isEmpty(r.rc) ) {
			ar.push(G.shielding(r.rc));
		    } else {
			ar.push("<div class='row watermark'><i>", lang.without_restrictions, "</i></div>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref Xsw95px'>");
		    if( Array.isArray(r.channels) ) {
			r.channels.forEach(function(arg0, arg1) {
			    if( arg1 > 0 ) {
				ar.push("<hr/><div class='row remark'>", G.shielding(arg0), "</div>");
			    } else {
				ar.push(G.shielding(arg0));
			    }
			});
		    } else {
			ar.push("<div class='row watermark'><i>", lang.without_restrictions, "</i></div>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='date'>");
		    if( !String.isEmpty(r.b_date) || !String.isEmpty(r.e_date) ) {
			ar.push(G.getdate_l(r.b_date), "<hr/><div class='row remark'>", 
			    G.getdate_l(r.e_date), "</div>");
		    } else {
			ar.push("<div class='row watermark'><i>", lang.without_restrictions, "</i></div>");
		    }
		    ar.push("</td>");
		    if( (perm.remove || r._isowner) && (typeof r._isaliendata == 'undefined' || r._isaliendata == 0) ) {
			ar.push("<td class='int'>", "<a href='javascript:void(0);' onclick='PLUG.unlink(this,\"", r.pl_id, "\")'>", 
			    lang.unlink, "</a>", "</td>");
		    } else {
			ar.push("<td class='ref sw95px'>", "&nbsp;", "</td>");
		    }
		    ar.push("<td class='ref sw95px'>", G.shielding(r.author), "</td>");
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

    function _checkboxContainer(ar, rows, name) {
	var x = 0;
	ar.push("<hr/>");
	ar.push("<div class='tbl'>");
	ar.push("<div class='tblbody'>");
	ar.push("<div class='tblrow'>");
	for( let i = 0, size = rows.length; i < size; i++ ) {
	    let v = rows[i];
	    if( x == 3 ) {
		ar.push("</div>");
		ar.push("<div class='tblrow'>");
		x = 0;
	    }
	    ar.push("<div class='row tblcell'>");
	    ar.push("<label class='checkbox'>");
	    ar.push("<input type='checkbox' data-type='", name, "' data-ref='", i, "' />");
	    ar.push("<div class='checkbox__text'>", v.descr, "</div>");
	    ar.push("</label>");
	    ar.push("</div>");
	    x++;
	}
	ar.push("</div>");
	ar.push("</div>");
	ar.push("</div>");

	return ar;
    }

    function _parambodytbl(mans) {
	var ar = [];
	ar.push("<div class='row'>", lang.planograms.notice, "</div>");
	ar.push("<div id='param:alert' class='row attention gone'>", "</div>");
	ar.push("<div class='row'>");
	ar.push("<input id='param:name' type='text' placeholder='", lang.planograms.placeholder, "' autocomplete='on'>", "</input>");
	ar.push("</div>");
	ar.push("<div class='row'>");
	ar.push("<button id='param:country' class='dropdown'>", "</button>");
	ar.push("</div>");
	ar.push("<div class='row'>");
	ar.push("<button id='param:rc' class='dropdown'>", "</button>");
	ar.push("</div>");
	ar.push("<div class='row'>");
	ar.push("<select id='param:daterange'>");
	ar.push("<option value=''>", "{0}: {1}".format_a(lang.validity, lang.without_restrictions), "</option>");
	ar.push("<option value='end_of_week'>", "{0}: {1}".format_a(lang.validity, lang.daterange.end_of_week), "</option>");
	ar.push("<option value='end_of_month'>", "{0}: {1}".format_a(lang.validity, lang.daterange.end_of_month), "</option>");
	ar.push("<option value='end_of_quarter'>", "{0}: {1}".format_a(lang.validity, lang.daterange.end_of_quarter), "</option>");
	ar.push("<option value='end_of_year'>", "{0}: {1}".format_a(lang.validity, lang.daterange.end_of_year), "</option>");
	ar.push("<option value='next_month'>", "{0}: {1}".format_a(lang.validity, lang.daterange.next_month), "</option>");
	ar.push("<option value='next_quarter'>", "{0}: {1}".format_a(lang.validity, lang.daterange.next_quarter), "</option>");
	ar.push("</select>");
	ar.push("</div>");
	if( !Array.isEmpty(mans.brands) ) {
	    _checkboxContainer(ar, mans.brands, "brand");
	}
	if( !Array.isEmpty(mans.channels) ) {
	    _checkboxContainer(ar, mans.channels, "chan");
	}
	return ar;
    }

    function _parambtntbl() {
	var ar = [];
	ar.push("<div class='row' align='right'>");
	ar.push("<button id='param:back'>", lang.back, "</button>");
	ar.push("&nbsp;&nbsp;");
	ar.push("<button id='param:commit' disabled='true'>", lang.save, "</button>");
	ar.push("&nbsp;&nbsp;");
	ar.push("</div>");
	return ar;
    }

    function _datareq() {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	_cache.page = null;
	G.xhr("GET", G.getajax({plug: _code}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		//console.log(data);
		_tags.tbody.html(_datatbl(data, 1, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
		_cache.data = data;
		_cache.page = 1;
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
		_cache.page = page;
		ProgressDialog.hide();
	    }, 0);
	}
    }

    function _add(files, max_file_size_mb) {
	for( var i = 0, size = files.length, counter = 0; i < size; i++ ) {
	    var f = files[i];
	    if( !(f.type == 'image/jpeg' || f.type == 'application/pdf') ) {
		Toast.show(lang.planograms.msg0.format_a(f.name));
	    } else if( max_file_size_mb*1024*1024 < f.size ) {
		Toast.show(lang.planograms.msg1.format_a(f.name, max_file_size_mb));
	    } else {
		var fd, xhr;
		fd = new FormData();
		fd.append("_datetime", G.getdatetime(new Date()));
		fd.append("blob", f, f.name.replace(/\.[^/.]+$/, ""));
		fd.append("content_type", f.type);
		xhr = G.xhr("POST", G.getajax({plug: _code}), "json", function(xhr, resp) {
		    if( xhr.status == 200 ) {
			PLUG.refresh();
		    } else {
			Toast.show(xhr.status == 403 ? lang.errors.not_permitted : lang.errors.runtime);
		    }
		    counter--;
		    if( counter == 0 ) {
			ProgressDialog.hide();
		    }
		});
		if( counter == 0 ) {
		    ProgressDialog.show();
		}
		counter++;
		xhr.send(fd);
	    }
	}
    }

    function _createSelectOption(value, text, selected) {
	const option = document.createElement("option");
	option.value = value;
	option.text = text;
	option.selected = selected;
	return option
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
	slideshow: function(arg) {
	    SlideshowSimple([G.getajax({plug: _code, blob: "yes", pl_id: arg})]).show();
	},
	drop: function(files) {
	    if( _perm.add ) {
		_add(files, _perm.add.max_file_size_mb);
	    }
	},
	add: function() {
	    if( _perm.add ) {
		var input = document.createElement('input');
		input.type = 'file';
		input.onchange = function() {
		    _add(this.files, _perm.add.max_file_size_mb);
		}
		input.click();
	    }
	},
	edit: function(arg) {
	    const popups = {};
	    const togglePopup = function(popup, tag, oncreate) {
		let x, name;
		for( name in popups) {
		    if( typeof popup != 'undefined' && name == popup ) {
			x = popups[name];
		    } else {
			popups[name].hide();
		    }
		}
		if( typeof popup != 'undefined' && x == null ) {
		    x = popups[popup] = oncreate(popup);
		}
		if( x != null ) {
		    x.toggle(tag/*, offset*/);
		}
	    }
	    Dialog({
		width: 650, 
		title: lang.planograms.caption.format_a(arg), 
		body: _parambodytbl(_cache.data.mans),
		buttons: _parambtntbl(),
		onHideListener: function(dialogObject) { togglePopup(); },
		onScrollListener: function(dialogObject) { togglePopup(); }
	    }).show(function(dialogObject) {
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth();
		const end_of_week = new Date(year, month, today.getDate() - today.getDay() + lang.calendar.firstDay + 6);
		const end_of_month = new Date(year, month == 11 ? 11 : (month + 1), month == 11 ? 31 : 0);
		const quarter = Math.ceil((month+1)/3);
		const end_of_quarter = G.quarterDateRange(year, quarter)[1];
		const end_of_year = new Date(year, 11, 31);
		const next_month = [
		    month == 11 ? new Date(year+1, 0, 1) : new Date(year, month+1, 1),
		    month == 11 ? new Date(year+1, 0, 31) : (month == 10 ? new Date(year, month+1, 31) : new Date(year, month+2, 0))
		];
		const next_quarter = G.quarterDateRange(quarter == 4 ? (year + 1) : year, quarter == 4 ? 1 : (quarter + 1));
		const next_year = [new Date(year+1, 0, 1), new Date(year+1, 11, 31)];
		const data = _cache.data.rows.find(function(e) { return e.pl_id == arg; });
		const newData = {
		    descr: data.descr, 
		    country_id: data.country_id, 
		    brand_ids: Array.clone(data.brand_ids),
		    rc_id: data.rc_id,
		    chan_ids: Array.clone(data.chan_ids),
		    b_date: data.b_date,
		    e_date: data.e_date
		};
		const mans = _cache.data.mans;
		const alertView = _('param:alert');
		const nameView = _('param:name');
		const countryView = _('param:country');
		const rcView = _('param:rc');
		const daterangeView = _('param:daterange');
		const cbar = dialogObject.getElementsByTagName('input');
		const backView = _('param:back');
		const commitView = _('param:commit');
		const equals = function(arg0, arg1) {
		    if( arg0.length != arg1.length ) {
			return false;
		    }
		    for( let i = 0, size = arg0.length; i < size; i++ ) {
			if( arg1.findIndex(k => k == arg0[i]) < 0 ) {
			    return false;
			}
		    }
		    return true;
		}
		const func = function() {
		    commitView.disabled = 
			String.isEmpty(newData.descr) || 
			String.isEmpty(newData.country_id) || 
			Array.isEmpty(newData.brand_ids) || 
			(
			    (data.descr||'') == (newData.descr||'') &&
			    (data.country_id||'') == (newData.country_id||'') &&
			    equals(data.brand_ids||[], newData.brand_ids||[]) &&
			    (data.rc_id||'') == (newData.rc_id||'') &&
			    equals(data.chan_ids||[], newData.chan_ids||[]) &&
			    (data.b_date||'') == (newData.b_date||'') &&
			    (data.e_date||'') == (newData.e_date||'')
			);
		    //console.log(newData);
		}
		const dropDownLabel = function(arg0, arg1) {
		    if( typeof arg1 == 'object' ) {
			return "&#9776;&nbsp;&nbsp;{0}:&nbsp;&nbsp;<i>{1}</i>".format_a(arg0, arg1.descr);
		    } else if( !String.isEmpty(arg1)  ) {
			return "&#9776;&nbsp;&nbsp;{0}:&nbsp;&nbsp;<i>{1}</i>".format_a(arg0, arg1);
		    }
		    return "&#9776;&nbsp;&nbsp;{0}:&nbsp;&nbsp;<i>{1}</i>".format_a(arg0, lang.without_restrictions);
		}

		CountriesPopup.cleanup(mans.countries);
		RetailChainsPopup.cleanup(mans.retail_chains);

		countryView.html(dropDownLabel(lang.country, data.country));
		rcView.html(dropDownLabel(lang.rc_name, data.rc));

		if( !String.isEmpty(data.descr) ) {
		    nameView.value = data.descr;
		}
		if( month >= 9 ) {
		    daterangeView.add(_createSelectOption("next_year", "{0}: {1}".format_a(lang.validity, lang.daterange.next_quarter)));
		}
		if( !String.isEmpty(data.b_date) && !String.isEmpty(data.e_date) ) {
		    daterangeView.add(_createSelectOption("0", "{0}: {1} - {2}".format_a(lang.validity, G.getlongdate_l(data.b_date), G.getlongdate_l(data.e_date)), true));
		}
		for( let i = 0, size = cbar.length; i < size; i++ ) {
		    if( cbar[i].type != 'checkbox' ) {
			continue;
		    }
		    const val = cbar[i];
		    const type = val.getAttribute('data-type');
		    const ref = val.getAttribute('data-ref');
		    const ptr = mans[type == 'chan' ? 'channels' : (type+'s')][ref];
		    val.checked = Array.isArray(data[type+'_ids']) && data[type+'_ids'].findIndex(k => k == ptr[type+'_id']) >= 0;
		    val.onchange = function() {
			if( !Array.isArray(newData[type+'_ids']) ) {
			    newData[type+'_ids'] = [];
			}
			const idx = newData[type+'_ids'].findIndex(k => k == ptr[type+'_id']);
			if( this.checked ) {
			    if( idx < 0 ) {
				newData[type+'_ids'].push(ptr[type+'_id']);
			    }
			} else {
			    if( idx >= 0 ) {
				newData[type+'_ids'].splice(idx, 1);
			    }
			}
			func();
			togglePopup();
		    }
		}
		dialogObject._container.onclick = function() {
		    togglePopup();
		}
		nameView.onfocus = function() {
		    togglePopup();
		}
		nameView.oninput = function() {
		    newData.descr = this.value.trim();
		    func();
		}
		if( !Array.isEmpty(mans.countries) ) {
		    countryView.onclick = function(ev) {
			togglePopup("countries", countryView, function(obj) {
			    return CountriesPopup(mans[obj], function(arg, i, ar) {
				newData.country_id = typeof arg == 'object' ? arg.country_id : null;
				countryView.html(dropDownLabel(lang.country, arg));
				func();
			    }, {everything: false})
			});
			ev.stopPropagation();
		    }
		} else {
		    countryView.disabled = true;
		}
		if( !Array.isEmpty(mans.retail_chains) ) {
		    rcView.onclick = function(ev) {
			togglePopup("retail_chains", rcView, function(obj) {
			    return RetailChainsPopup(mans[obj], function(arg, i, ar) {
				newData.rc_id = typeof arg == 'object' ? arg.rc_id : null;
				rcView.html(dropDownLabel(lang.rc_name, arg));
				func();
			    })
			});
			ev.stopPropagation();
		    }
		} else {
		    rcView.disabled = true;
		}
		daterangeView.onclick = function() {
		    togglePopup();
		}
		daterangeView.onchange = function() {
		    let x = (this.value || this.options[this.selectedIndex].value), t;
		    if( x == '' ) {
			newData.b_date = null;
			newData.e_date = null;
		    } else if( x == 'end_of_week' ) {
			newData.b_date = String.isEmpty(data.b_date) ? G.getdate(today) : data.b_date;
			newData.e_date = G.getdate(end_of_week);
		    } else if( x == 'end_of_month' ) {
			newData.b_date = String.isEmpty(data.b_date) ? G.getdate(today) : data.b_date;
			newData.e_date = G.getdate(end_of_month);
		    } else if( x == 'end_of_quarter' ) {
			newData.b_date = String.isEmpty(data.b_date) ? G.getdate(today) : data.b_date;
			newData.e_date = G.getdate(end_of_quarter);
		    } else if( x == 'end_of_year' ) {
			newData.b_date = String.isEmpty(data.b_date) ? G.getdate(today) : data.b_date;
			newData.e_date = G.getdate(end_of_year);
		    } else if( x == 'next_month' ) {
			newData.b_date = G.getdate(next_month[0]);
			newData.e_date = G.getdate(next_month[1]);
		    } else if( x == 'next_quarter' ) {
			newData.b_date = G.getdate(next_quarter[0]);
			newData.e_date = G.getdate(next_quarter[1]);
		    } else if( x == 'next_year' ) {
			newData.b_date = G.getdate(next_year[0]);
			newData.e_date = G.getdate(next_year[1]);
		    } else {
			newData.b_date = data.b_date;
			newData.e_date = data.e_date;
		    }
		    //console.log(x, "->", newData.b_date, " - ", newData.e_date);
		    func();
		};
		backView.onclick = function() {
		    dialogObject.hide();
		}
		commitView.onclick = function() {
		    if( String.isEmpty(newData.descr) ) {
			alertView.html(lang.planograms.msg2);
			alertView.show();
		    } else if( String.isEmpty(newData.country_id) ) {
			alertView.html(lang.planograms.msg3);
			alertView.show();
		    } else if( Array.isEmpty(newData.brand_ids) ) {
			alertView.html(lang.planograms.msg4);
			alertView.show();
		    } else {
			let fd = new FormData();
			fd.append("_datetime", G.getdatetime(new Date()));
			fd.append("name", newData.descr);
			fd.append("country_id", newData.country_id);
			fd.append("brand_ids", newData.brand_ids);

			if( !String.isEmpty(newData.rc_id) ) {
			    fd.append("rc_id", newData.rc_id);
			}
			if( !Array.isEmpty(newData.chan_ids) ) {
			    fd.append("chan_ids", newData.chan_ids);
			}
			if( !String.isEmpty(newData.b_date) ) {
			    fd.append("b_date", newData.b_date);
			}
			if( !String.isEmpty(newData.e_date) ) {
			    fd.append("e_date", newData.e_date);
			}

			dialogObject.startSpinner();
			alertView.hide();

			G.xhr("PUT", G.getajax({plug: _code, pl_id: data.pl_id}), "json", function(xhr, resp) {
			    if( xhr.status == 200 ) {
				PLUG.refresh();
				dialogObject.hide();
			    } else {
				alertView.html(xhr.status == 403 ? lang.errors.not_permitted : lang.errors.runtime);
				alertView.show();
			    }
			    dialogObject.stopSpinner();
			}).send(fd);
		    }
		}

		func();
	    });
	},
	unlink: function(tag, pl_id) {
	    let fd = new FormData();
	    fd.append("_datetime", G.getdatetime(new Date()));
	    ProgressDialog.show();
	    tag.style.visibility = 'hidden';
	    G.xhr("DELETE", G.getajax({plug: _code, pl_id: pl_id}), "", function(xhr) {
		if( xhr.status == 200 ) {
		    var indexElement = _cache.data.rows.findIndex(function(v) {
			return v.pl_id == pl_id;
		    });
		    if( indexElement != -1 ) {
			_cache.data.rows.splice(indexElement, 1);
			//console.log(_cache.data);
			setTimeout(function() {
			    _tags.tbody.html(_datatbl(_cache.data, _cache.page, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
			    ProgressDialog.hide();
			}, 0);
		    } else {
			ProgressDialog.hide();
		    }
		} else {
		    tag.style.visibility = 'visible';
		    Toast.show(lang.errors.runtime);
		    ProgressDialog.hide();
		}
	    }).send(fd);
	}
    }
})();

function startup(perm) {
    PLUG.startup({body: _('pluginContainer')}, perm || {});
}

window.ondragover = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}
window.ondrop = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    PLUG.drop(ev.dataTransfer.files);
}
