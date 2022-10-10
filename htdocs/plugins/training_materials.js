/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
/* private properties & methods */
    var _code = "training_materials";
    var _cache = {}, _perm = {}, _tags = {};

    function _getcolumns(perm) {
	return 11;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.training_materials.title, "</span>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	if( typeof perm.add != 'undefined' ) {
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0);' onclick='PLUG.add();'>", lang.training_materials.add, "</a>");
	}
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th>", lang.code, "</th>");
	ar.push("<th>", lang.training_material, "</th>");
	ar.push("<th class='symbol footnote' data-title='", lang.shared, "''>", "&#x21e7;", "</th>");
	ar.push("<th>", lang.blob_size, "</th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.brands(this)'>", lang.brand, "</a></th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.countries(this)'>", lang.country, "</a></th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.departments(this)'>", lang.departmentAbbr, "</a></th>");
	ar.push("<th>", lang.validity, "</th>");
	ar.push("<th class='symbol'>", "&#x2699;", "</th>");
	ar.push("<th>", lang.author, "</th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(Dialog.container());
	ar.push(SlideshowSimple.container());
	ar.push(BrandsPopup.container());
	ar.push(CountriesPopup.container());
	ar.push(DepartmentsPopup.container());
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

    function _shieldingStringArray(arg) {
	const ar = [];
	if( typeof __shieldingStringArrayIndex == 'undefined' ) {
	    __shieldingStringArrayIndex = 0;
	}
	if( arg.length >= 3 ) {
	    ar.push(G.shielding(arg[0]));
	    ar.push("<div class='gone' id='zx:", __shieldingStringArrayIndex, "'>");
	    for( let idx = 1; idx < arg.length; idx++ ) {
		ar.push("<hr/><div class='row remark'>", arg[idx], "</div>");
	    }
	    ar.push("</div>");
	    ar.push("<div class='symbol'><a href='javascript:void(0)' onclick='PLUG.expand(this,_(\"zx:",
		__shieldingStringArrayIndex, "\"))'>", "&#x21F2;", "</a></div>");
	    __shieldingStringArrayIndex++;
	} else {
	    arg.forEach(function(arg0, arg1) {
		if( arg1 > 0 ) {
		    ar.push("<hr/><div class='row remark'>", G.shielding(arg0), "</div>");
		} else {
		    ar.push(G.shielding(arg0));
		}
	    });
	}
	return ar;
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, today = G.getdate(new Date()), x = 0, r, z;
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.tm_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.tm_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    if( (perm.edit || r._isowner) && (typeof r._isaliendata == 'undefined' || r._isaliendata == 0) ) {
			ar.push("<td class='int'>", "<a href='javascript:void(0);' onclick='PLUG.edit(\"", r.tm_id, "\")'>", 
			    G.shielding(r.tm_id), "</a>", "</td>");
		    } else {
			ar.push("<td class='int'>", G.shielding(r.tm_id), "</td>");
		    }
		    ar.push("<td class='string", String.isEmpty(r.descr) ? " incomplete" : "", 
			(typeof r.e_date == 'undefined' || r.e_date >= today) ? "" : " disabled", 
			"'>", G.shielding(r.descr), "</td>");
		    ar.push("<td width='20px' class='symbol ref'>");
		    if( r.shared ) {
			ar.push("&#x21e7;");
		    } else {
			ar.push("&nbsp;");
		    }
		    ar.push("</td>");
		    ar.push("<td width='65px' class='ref", typeof r.blob_size == 'undefined' ? " incomplete" : "", "'>");
		    if( typeof r.blob_size == 'undefined' ) {
			ar.push("&nbsp;");
		    } else if( r.content_type == 'image/jpeg' ) {
			ar.push("<a href='javascript:void(0);' onclick='PLUG.slideshow(\"", r.tm_id, "\")'>", 
			    r.blob_size ? G.getnumeric_l(r.blob_size/1024, 1) : lang.dash, "</a>");
		    } else {
			ar.push("<a href='", G.getdataref({plug: _code, tm_id: r.tm_id, blob: true}), "' target='_blank'>",
			    r.blob_size ? G.getnumeric_l(r.blob_size/1024, 1) : lang.dash, "</a>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref sw95px'>");
		    if( Array.isArray(r.brands) ) {
			Array.prototype.push.apply(ar, _shieldingStringArray(r.brands));
		    } else {
			ar.push("<div class='row watermark'><i>", lang.without_restrictions, "</i></div>");
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref sw95px", String.isEmpty(r.country_id) ? " incomplete" : "", "'>", G.shielding(r.country), "</td>");
		    ar.push("<td class='ref sw95px'>");
		    if( Array.isArray(r.departments) ) {
			Array.prototype.push.apply(ar, _shieldingStringArray(r.departments));
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
			ar.push("<td class='int'>", "<a href='javascript:void(0);' onclick='PLUG.unlink(this,\"", r.tm_id, "\")'>", 
			    lang.unlink, "</a>", "</td>");
		    } else {
			ar.push("<td class='ref sw95px'>", "&nbsp;", "</td>");
		    }
		    ar.push("<td class='string sw95px'>", G.shielding(r.author), "</td>");
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

    function _checkboxContainer(ar, rows, name, descr) {
	let x = 0;
	ar.push("<div class='row'>", "{0}:".format_a(descr));
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
	if( x == 2 ) { /* align up to 3 columns */
	    ar.push("<div class='row tblcell'>", "</div>");
	}
	ar.push("</div>");
	ar.push("</div>");
	ar.push("</div>");
	ar.push("</div>");

	return ar;
    }

    function _parambodytbl(mans) {
	var ar = [];
	ar.push("<div class='row'>", lang.training_materials.notice, "</div>");
	ar.push("<div id='param:alert' class='row attention gone'>", "</div>");
	ar.push("<div class='row'>");
	ar.push("<input id='param:name' type='text' placeholder='", lang.training_materials.placeholder, "' autocomplete='on'>", "</input>");
	ar.push("</div>");
	ar.push("<div class='row'>");
	ar.push("<label class='checkbox'>");
	ar.push("<input id='param:shared' type='checkbox' />");
	ar.push("<div class='checkbox__text'>", lang.shared, "</div>");
	ar.push("</label>");
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
	ar.push("<div class='row'>");
	ar.push("<select id='param:country'>");
	ar.push("<option value=''>", "{0}: {1}".format_a(lang.country, lang.without_restrictions), "</option>");
	if( Array.isArray(mans.countries) ) {
	    mans.countries.forEach(function(arg) {
		ar.push("<option value='", G.shielding(arg.country_id), "'>", 
		    "{0}: {1}".format_a(lang.country, G.shielding(arg.descr)), 
		    "</option>");
	    });
	}
	ar.push("</select>");
	ar.push("</div>");
	if( !Array.isEmpty(mans.brands) ) {
	    _checkboxContainer(ar, mans.brands, "brand", lang.brand);
	}
	if( !Array.isEmpty(mans.departments) ) {
	    _checkboxContainer(ar, mans.departments, "dep", lang.department);
	}

	return ar;
    }

    function _parambtntbl() {
	var ar = [];
	ar.push("<div class='row' align='right'>");
	ar.push("<button id='param:back'>", lang.back, "</button>");
	ar.push("&nbsp;&nbsp;");
	ar.push("<button id='param:commit' disabled='true' class='xx'>", lang.save, "</button>");
	ar.push("&nbsp;&nbsp;");
	ar.push("</div>");
	return ar;
    }

    function _datareq() {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	_cache.page = null;
	G.xhr("GET", G.getdataref({plug: _code}), "json", function(xhr, data) {
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
	    if( !(f.type == 'application/pdf' || f.type == 'video/mp4' || f.type == 'image/jpeg' || f.type == 'application/zip') ) {
		Toast.show(lang.training_materials.msg0.format_a(f.name));
		console.log(f.name + " => " + f.type);
	    } else if( max_file_size_mb*1024*1024 < f.size ) {
		Toast.show(lang.training_materials.msg1.format_a(f.name, max_file_size_mb));
	    } else {
		var fd, xhr;
		fd = new FormData();
		fd.append("_datetime", G.getdatetime(new Date()));
		fd.append("blob", f, f.name.replace(/\.[^/.]+$/, ""));
		fd.append("content_type", f.type);
		xhr = G.xhr("POST", G.getdataref({plug: _code}), "json", function(xhr, resp) {
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
	    SlideshowSimple([G.getdataref({plug: _code, blob: "yes", tm_id: arg})]).show();
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
		input.accept="image/jpeg, application/pdf, video/mp4, application/zip"
		input.onchange = function() {
		    _add(this.files, _perm.add.max_file_size_mb);
		}
		input.click();
	    }
	},
	edit: function(arg) {
	    Dialog({
		width: 650, 
		title: lang.training_materials.caption.format_a(arg), 
		body: _parambodytbl(_cache.data.mans),
		buttons: _parambtntbl()
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
		const data = _cache.data.rows.find(function(e) { return e.tm_id == arg; });
		const newData = {
		    descr: data.descr, 
		    brand_ids: Array.clone(data.brand_ids),
		    country_id: data.country_id, 
		    dep_ids: Array.clone(data.dep_ids),
		    b_date: data.b_date,
		    e_date: data.e_date,
		    shared: data.shared > 0
		};
		const mans = _cache.data.mans;
		const alertView = _('param:alert');
		const nameView = _('param:name');
		const sharedView = _("param:shared");
		const countryView = _('param:country');
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
			(
			    (data.descr||'') == (newData.descr||'') &&
			    equals(data.brand_ids||[], newData.brand_ids||[]) &&
			    (data.country_id||'') == (newData.country_id||'') &&
			    equals(data.dep_ids||[], newData.dep_ids||[]) &&
			    (data.b_date||'') == (newData.b_date||'') &&
			    (data.e_date||'') == (newData.e_date||'') &&
			    (data.shared > 0) == newData.shared
			);
		    //console.log(newData);
		}

		sharedView.checked = data.shared > 0;

		if( !String.isEmpty(data.descr) ) {
		    nameView.value = data.descr;
		}
		if( !String.isEmpty(data.country_id) ) {
		    countryView.value = data.country_id;
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
		    const mn = function(arg) {
		    if( arg == 'chan' ) {
			return 'channels';
		    } else if( arg == 'dep' ) {
			return 'departments';
		    }
		    return arg + 's';
		    }
		    const val = cbar[i];
		    const type = val.getAttribute('data-type');
		    const ref = val.getAttribute('data-ref');
		    if( type == null || ref == null ) {
			continue;
		    }
		    const ptr = mans[mn(type)][ref];
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
		    }
		}
		nameView.onfocus = function() {
		    togglePopup();
		}
		nameView.oninput = function() {
		    newData.descr = this.value.trim();
		    func();
		}
		sharedView.onchange = function() {
		    newData.shared = this.checked;
		    func();
		    togglePopup();
		}
		countryView.onchange = function() {
		    newData.country_id = (this.value || this.options[this.selectedIndex].value);
		    func();
		};
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
			alertView.html(lang.training_materials.msg2);
			alertView.show();
		    } else if( String.isEmpty(newData.country_id) ) {
			alertView.html(lang.training_materials.msg3);
			alertView.show();
		    } else {
			let fd = new FormData();
			fd.append("_datetime", G.getdatetime(new Date()));
			fd.append("name", newData.descr);
			fd.append("shared", newData.shared);
			fd.append("country_id", newData.country_id);
			
			if( !String.isEmpty(newData.dep_ids) ) {
			    fd.append("dep_ids", newData.dep_ids);
			}
			if( !Array.isEmpty(newData.brand_ids) ) {
			    fd.append("brand_ids", newData.brand_ids);
			}
			if( !String.isEmpty(newData.b_date) ) {
			    fd.append("b_date", newData.b_date);
			}
			if( !String.isEmpty(newData.e_date) ) {
			    fd.append("e_date", newData.e_date);
			}

			dialogObject.startSpinner();
			alertView.hide();

			G.xhr("PUT", G.getdataref({plug: _code, tm_id: data.tm_id}), "json", function(xhr, resp) {
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
	unlink: function(tag, tm_id) {
	    let fd = new FormData();
	    fd.append("_datetime", G.getdatetime(new Date()));
	    ProgressDialog.show();
	    tag.style.visibility = 'hidden';
	    G.xhr("DELETE", G.getdataref({plug: _code, tm_id: tm_id}), "", function(xhr) {
		if( xhr.status == 200 ) {
		    var indexElement = _cache.data.rows.findIndex(function(v) {
			return v.tm_id == tm_id;
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
	},
	expand: function(tag, container) {
	    if( container.hasClass('gone') ) {
		container.removeClass('gone');
		tag.html("&#x21F1;");
	    } else {
		container.addClass('gone');
		tag.html("&#x21F2;");
	    }
	},
	brands: function(tag, offset) {
	    _togglePopup("brands", tag, offset, function(obj) {
		return BrandsPopup(_cache.data._f[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "brand_id", "brand_ids");
		})
	    });
	},
	departments: function(tag, offset) {
	    _togglePopup("departments", tag, offset, function(obj) {
		return DepartmentsPopup(_cache.data._f[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "dep_id", "dep_ids");
		})
	    });
	},
	countries: function(tag, offset) {
	    _togglePopup("countries", tag, offset, function(obj) {
		return CountriesPopup(_cache.data._f[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "country_id");
		})
	    });
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
