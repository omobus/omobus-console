/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "targets_compliance";
    var _cache = {}, _perm = {}, _tags = {}, _today = G.getdate(new Date()), _F = false /* abort export photos */;

    function _getcolumns(perm) {
	return 11 + (perm.columns == null ? 0 : (
	    (perm.columns.channel == true ? 1 : 0)
	));
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.targets_compliance.title, "</span>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.xlsx(this)'>", lang.export.xlsx, "</a>");
	if( perm.zip ) {
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.zip(this,_(\"L\"),_(\"progress\"))'>",
		lang.export.photo, "</a><span id='L' style='display: none;'><span id='progress'></span>&nbsp;(<a href='javascript:void(0)' " +
		"onclick='PLUG.abort();'>", lang.abort, "</a>)</span>");
	}
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.toggle(this)' class='important'>", 
	    lang.targets_compliance.inprogress, "</a>");
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"author\",0.10)'>", lang.author, "</a></th>");
	ar.push("<th>", lang.a_code, "</th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.retail_chains(this)'>", lang.a_name, "</a></th>");
	ar.push("<th>", lang.address, "</th>");
	if( perm.columns != null && perm.columns.channel == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.channels(this,0.25)'>", lang.chan_name, "</a></th>");
	}
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.target_types(this,0.50)'>", lang.targets.subject.caption, "</a></th>");
	ar.push("<th>", lang.validity, "</th>");
	ar.push("<th>", lang.photo, "</th>");
	ar.push("<th width='260px'><a href='javascript:void(0)' onclick='PLUG.confirmation_types(this,0.65)'>", lang.targets_compliance.confirmations, "</a></th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"performer\",0.80)'>", lang.performer_name, "</a></th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(Popup.container());
	ar.push(ChannelsPopup.container());
	ar.push(RetailChainsPopup.container());
	ar.push(ConfirmationTypesPopup.container());
	ar.push(TargetTypesPopup.container());
	ar.push(UsersPopup.container("authorsPopup"));
	ar.push(UsersPopup.container("performersPopup"));
	ar.push(UsersPopup.container("headsPopup"));
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
	return Filter(a.join(' '), false, {
	    target_id:true, 
	    author_id:true, author_name:true, 
	    account_id:true, a_code:true, a_name:true, address:true, 
	    chan_id:true, chan:true, 
	    poten:true, 
	    rc_id:true, rc:true, ka_code:true, 
	    region:true, 
	    city:true, 
	    subject:true, 
	    target_type_id:true, target_type:true, 
	    b_date:true, 
	    "L.performer_id":true,
	    "L.head_id":true, 
	    "L.confirmation_type_id":true
	});
    }

    function _targettbl(r) {
	var ar = [], z;
	ar.push("<div><i>", G.shielding(r.target_type), "</i></div>");
	ar.push("<div>", "{0}:&nbsp;<i>{1}</i>&nbsp;-&nbsp;<i>{2}</i>".format_a(lang.validity, G.getlongday_l(Date.parseISO8601(r.b_date)),
	    G.getlongday_l(Date.parseISO8601(r.e_date))), "</div>");
	ar.push("<hr />");
	ar.push("<div>", G.shielding(r.body), "</div>");
	ar.push("<hr />");
	ar.push("<div class='r watermark'>", "{0} / {1}".format_a(G.shielding(r.target_id), r.updated_ts), "</div>");
	return ar;
    }

    function _remarktbl(r, remark_types) {
	var ar = [];
	ar.push("<h1>", lang.remark.caption, "</h1>");
	ar.push("<div onclick='event.stopPropagation();'>");
	ar.push("<p>");
	ar.push("<div class='row'>", lang.notices.remark, "</div>");
	ar.push("</p>");
	ar.push("<div class='row attention gone' id='re:alert'></div>");
	if( Array.isArray(remark_types) && remark_types.length > 0 ) {
	    ar.push("<p>");
	    ar.push("<div class='row'>");
	    ar.push("<select id='re:type'>");
	    ar.push("<option value=''>", lang.not_specified, "</option>");
		remark_types.forEach(function(r) {
		ar.push("<option value='", G.shielding(r.remark_type_id), "'>", G.shielding(r.descr), "</option>");
	    });
	    ar.push("</select>");
	    ar.push("</div>");
	    ar.push("</p>");
	}
	ar.push("<div class='row'><textarea id='re:note' rows='3' maxlength='1024' autocomplete='off' placeholder='",
	    lang.remark.placeholder, "'></textarea></div>");
	ar.push("<br/>");
	ar.push("<div align='center'>");
	ar.push("<button id='re:accept' disabled='true'>", lang.remark.accept, "</button>");
	ar.push("&nbsp;&nbsp;");
	ar.push("<button id='re:reject' disabled='true'>", lang.remark.reject, "</button>");
	ar.push("</div>");
	ar.push("</div>");
	return ar;
    }

    function _remarkNote(type, note) {
	var n = [];
	if( !String.isEmpty(type) ) {
	    n.push(G.shielding(type));
	}
	if( !String.isEmpty(note) ) {
	    n.push(G.shielding(note));
	}
	return n;
    }

    function _remarkStyle(r) {
	var xs = [], n;
	if( typeof r != 'undefined' ) {
	    if( r.status == 'accepted' || r.status == 'rejected' ) {
		xs.push(" footnote_L' data-title='", lang.remark[r.status]);
		if( (n = _remarkNote(r.type, r.note)).length > 0 ) {
		    xs.push(": ", n.join(". "), ".");
		}
	    }
	}
	return xs;
    }

    function _remarkStatus(r) {
	var xs = [];
	if( typeof r != 'undefined' ) {
	    if( r.status == 'accepted' ) {
		return "&#x1F600;";
	    } else if( r.status == 'rejected' ) {
		return "&#10071;";
	    }
	}
	return '';
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z;
	data._rows = [];
	for( var i = 0, k = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) && (_today == null || (r.b_date <= _today && _today <= r.e_date)) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    var b = 1, blobs = [];
		    if( !(r.blob_id == null || r.blob_id == "") ) {
			blobs.push(r.blob_id);
		    }
		    if( Array.isArray(r.confirmations) ) {
			r.confirmations.forEach(function(arg0, index0, array0) {
			    if( Array.isArray(arg0.photos) ) {
				arg0.photos.forEach(function(arg1, index1, array1) {
				    blobs.push(arg1);
				});
			    }
			});
		    }
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.row_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable" + (r.myself?" attention footnote":"") + "' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.row_id + "');event.stopPropagation();\"" + (r.myself?(" data-title='" + lang.targets_compliance.myself + "'"):"") + ">", r.row_no, "</td>");
		    ar.push("<td class='string sw95px'>", G.shielding(r.author_name), "</td>");
		    ar.push("<td class='int'>", G.shielding(r.a_code), "</td>");
		    ar.push("<td class='string a_name" + (r.a_hidden ? " strikethrough attention" : "") + "'>", G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string a_address" + (r.a_hidden ? " strikethrough attention" : "") + "'>", G.shielding(r.address), "</td>");
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px'>", G.shielding(r.chan), "</td>");
		    }
		    ar.push("<td class='ref" + (r.hidden ? " strikethrough" : "") + "'><span onclick='PLUG.more(this," + r.row_no + ",0.70)'>", 
			G.shielding(r.subject), "</span></td>");
		    ar.push("<td class='date" + (r.hidden ? " strikethrough" : "") + "'>", G.getdate_l(r.b_date),
			"<hr/><div class='row watermark'>", G.getdate_l(r.e_date), "</div></td>");
		    ar.push("<td class='ref'>");
		    if( r.blob_id == null || r.blob_id == "" ) {
			ar.push("&nbsp;");
		    } else {
			ar.push("<img class='clickable' onclick='PLUG.slideshow([" + blobs.join(',') + "]," + b + ")' height='90px' " + 
			    (k>=20?"data-src='":"src='") + G.getajax({plug: _code, blob: "yes", thumb: "yes", blob_id: r.blob_id}) + "'/>");
			b++;
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref'>");
		    if( r.L != null ) {
			ar.push("<div>","<div class='row", _remarkStyle(r.L.remark).join(''), "'>");
			if( perm.remark == true ) {
			    ar.push("<span onclick='PLUG.remark(this,\"", r.row_no, "\",0.80)'>");
			}
			ar.push(G.shielding(r.L.confirm, lang.dash));
			if( perm.remark == true ) {
			    ar.push("</span>");
			}
			ar.push("<div>", _remarkStatus(r.L.remark), "</div>");
			ar.push("</div>");
			if( !String.isEmpty(r.L.doc_note) ) {
			    ar.push("<div class='row'><b>", G.shielding(r.L.doc_note), "</b></div>");
			}
			if( Array.isArray(r.L.photos) ) {
			    ar.push("<div class='row'>");
			    r.L.photos.forEach(function(arg1, index1, array1) {
				if( index1 > 0 ) {
				    ar.push("&nbsp;&nbsp;");
				}
				ar.push("<a href='javascript:void(0)' onclick='PLUG.slideshow([" + blobs.join(',') + "]," + b + ")'>[&nbsp;" + 
				    (index1+1) + "&nbsp;]</a>");
				b++;
			    });
			    ar.push("</div>");
			}
			ar.push("<div class='row watermark'>", G.getdatetime_l(r.L.fix_dt), "</div>");
			ar.push("</div>");
			if( r.confirmations.length > 1 ) {
			    ar.push("<div class='gone' id='zx:", r.row_no, "'>");
			    for( var idx = 1, arg; idx < r.confirmations.length; idx++ ) {
				if( (arg = r.confirmations[idx]) != null ) {
				    ar.push("<hr/><div>")
				    if( r.L.performer_id != arg.performer_id ) {
					ar.push("<div class='row watermark'>", G.shielding(arg.performer_name), "</div>");
				    }
				    ar.push("<div class='row", _remarkStyle(arg.remark).join(''), "'>");
				    ar.push(G.shielding(arg.confirm, lang.dash));
				    ar.push(_remarkStatus(r.L.remark));
				    ar.push("</div>");
				    if( !String.isEmpty(arg.doc_note) ) {
					ar.push("<div class='row'><b>", G.shielding(arg.doc_note), "</b></div>");
				    }
				    if( Array.isArray(arg.photos) ) {
					ar.push("<div class='row'>");
					arg.photos.forEach(function(arg1, index1, array1) {
					    if( index1 > 0 ) {
						ar.push("&nbsp;&nbsp;");
					    }
					    ar.push("<a href='javascript:void(0)' onclick='PLUG.slideshow([" + blobs.join(',') + "]," + b + ")'>[&nbsp;" + 
						(index1+1) + "&nbsp;]</a>");
					    b++;
					});
					ar.push("</div>");
				    }
				    ar.push("<div class='row watermark'>", G.getdatetime_l(arg.fix_dt), "</div>");
				    ar.push("</div>");
				}
			    }
			    ar.push("</div>");
			    ar.push("<hr/><div class='row'><a href='javascript:void(0)' onclick='PLUG.other(this,_(\"zx:" + r.row_no + "\"))'>", 
				lang.targets_compliance.more, "</a></div>");
			}
		    } else {
			ar.push("&nbsp;");
		    }
		    ar.push("</td>");
		    ar.push("<td class='string sw95px'>", r.L != null ? G.shielding(r.L.performer_name) : "&nbsp;", "</td>");
		    ar.push("<td class='string sw95px'>", r.L != null ? G.shielding(r.L.head_name) : "&nbsp;", "</td>");
		    ar.push("</tr>");
		    k++;
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

    function _datareq() {
	ProgressDialog.show();
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getajax({plug: _code}), "json-js", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		if( Array.isArray(data.rows) ) {
		    data.rows.forEach(function(arg, index, ar) {
			if( Array.isArray(arg.confirmations) ) {
			    arg.L = arg.confirmations[0];
			}
		    });
		}
		_cache.data = data;
		_tags.tbody.html(_datatbl(data, 1, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
		new LazyLoad();
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
		new LazyLoad();
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

    function _toxlsx() {
	var ar = [], data_ts;
	var func = function(data_ts, ar, templ) {
	    XlsxPopulate.fromDataAsync(templ)
		.then(wb => {
		    var offset = 4;
		    var ws = wb.sheet(0);
		    wb.properties()._node.children = [];
		    wb.property('Title', lang.photos.title);
		    wb.property('Author', __AUTHOR__);
		    ws.name(_code);
		    ws.cell("A1").value("{0} {1}".format_a(lang.data_ts, data_ts));
		    for( var i = 0, size = Math.min(ar.length,1048576 - offset), x; i < size; i++ ) {
			r = ar[i];
			ws.cell("A{0}".format_a(i + offset)).value(r.row_no);
			ws.cell("B{0}".format_a(i + offset)).value(r.author_name);
			ws.cell("C{0}".format_a(i + offset)).value(r.a_code);
			ws.cell("D{0}".format_a(i + offset)).value(r.a_name);
			ws.cell("E{0}".format_a(i + offset)).value(r.address);
			ws.cell("F{0}".format_a(i + offset)).value(r.chan);
			ws.cell("G{0}".format_a(i + offset)).value(r.poten);
			ws.cell("H{0}".format_a(i + offset)).value(r.region);
			ws.cell("I{0}".format_a(i + offset)).value(r.city);
			ws.cell("J{0}".format_a(i + offset)).value(r.rc);
			ws.cell("K{0}".format_a(i + offset)).value(r.ka_code);
			ws.cell("L{0}".format_a(i + offset)).value(r.target_id);
			ws.cell("M{0}".format_a(i + offset)).value(r.subject);
			ws.cell("N{0}".format_a(i + offset)).value(r.body);
			ws.cell("O{0}".format_a(i + offset)).value(r.target_type);
			ws.cell("P{0}".format_a(i + offset)).value(Date.parseISO8601(r.b_date));
			ws.cell("Q{0}".format_a(i + offset)).value(Date.parseISO8601(r.e_date));
			if( typeof r.ref != 'undefined' ) {
			    ws.cell("R{0}".format_a(i + offset)).value("[ 1 ]")
				.style({ fontColor: "0563c1", underline: true })
				.hyperlink({ hyperlink: G.getphotoref(r.ref,true) });
			}
			if( r.L != null ) {
			    ws.cell("S{0}".format_a(i + offset)).value(Date.parseISO8601(r.L.fix_dt));
			    ws.cell("T{0}".format_a(i + offset)).value(r.L.confirm);
			    if( Array.isArray(r.L.refs) && r.L.refs.length > 0 ) {
				const n = ["U","V","W","X","Y","Z"];
				r.L.refs.forEach(function(val, index) {
				    ws.cell("{1}{0}".format_a(i + offset,n[index])).value("[ {0} ]".format_a(index + 1))
					.style({ fontColor: "0563c1", underline: true })
					.hyperlink({ hyperlink: G.getphotoref(r.L.refs[index],true) });
				});
			    }
			    ws.cell("AA{0}".format_a(i + offset)).value(r.L.doc_note);
			    ws.cell("AB{0}".format_a(i + offset)).value(r.L.performer_name);
			    ws.cell("AC{0}".format_a(i + offset)).value(r.L.head_name);
			    if( typeof r.L.remark != 'undefined' ) {
				ws.cell("AD{0}".format_a(i + offset)).value(r.L.remark.status);
				ws.cell("AE{0}".format_a(i + offset)).value(r.L.remark.type);
				ws.cell("AF{0}".format_a(i + offset)).value(r.L.remark.note);
			    }
			}
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
	    _tags.more = new Popup();
	    _tags.popups = {};
	    _cache.remarks = {};
	    _datareq();
	},
	refresh: function() {
	    if( _today != null ) {
		_today = G.getdate(new Date());
	    }
	    _togglePopup();
	    _tags.popups = {};
	    _tags.more.hide();
	    _datareq();
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
	toggle: function(tag) {
	    if( _today == null ) {
		_today = G.getdate(new Date());
		tag.addClass('important');
	    } else {
		_today = null;
		tag.removeClass('important');
	    }
	    _page(1);
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
	confirmation_types: function(tag, offset) {
	    _togglePopup("confirmation_types", tag, offset, function(obj) {
		return ConfirmationTypesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "confirmation_type_id");
		})
	    });
	},
	target_types: function(tag, offset) {
	    _togglePopup("target_types", tag, offset, function(obj) {
		return TargetTypesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "target_type_id");
		})
	    });
	},
	more: function(tag, row_no, offset) {
	    if( _cache._more_row_no != null && _cache._more_row_no != row_no ) {
		_tags.more.hide();
	    }
	    _tags.more.set(_targettbl(_cache.data.rows[row_no-1]).join(''));
	    _tags.more.toggle(tag, offset);
	    _cache._more_row_no = row_no;
	},
	remark: function(tag, row_no, offset) {
	    var reaccept, rereject, renote, realert, retype;
	    var u = 'remark:{0}'.format_a(row_no);
	    var r = _cache.data.rows[row_no-1].L;
	    var ptr = _cache.remarks[r.doc_id] || {status:(r.remark||{}).status,remark_type_id:null,type:null,note:null};
	    var commit = function(self, method) {
		var xhr = G.xhr(method, G.getajax({plug: _code}), "", function(xhr) {
		    if( xhr.status == 200 ) {
			ptr.status = method == 'PUT' ? 'accepted' : /*method == 'DELETE'*/'rejected';
			var n, div = tag.parentNode;
			div.addClass('footnote_L');
			if( (n = _remarkNote(ptr.type, ptr.note)).length > 0 ) {
			    div.setAttribute('data-title', "{0}: {1}.".format_a(lang.remark[ptr.status], n.join(". ")));
			} else {
			    div.setAttribute('data-title', lang.remark[ptr.status]);
			}
			if( (div = div.getElementsByTagName('div')) != null && div.length > 0 ) {
			    div[0].html(_remarkStatus(ptr));
			}
			_tags.more.hide();
			Toast.show(lang.success.remark);
			r.remark = ptr;
			ptr = null;
			_cache.remarks[r.doc_id] = null;
		    } else {
			enable();
			alarm(xhr.status == 409 ? lang.errors.remark.exist : lang.errors.runtime);
		    }
		    _tags.more.stopSpinner();
		});
		_tags.more.startSpinner();
		disable();
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		var params = {doc_id: r.doc_id, _datetime: G.getdatetime(new Date())};
		if( typeof ptr.remark_type_id != 'undefined' && !String.isEmpty(ptr.remark_type_id) ) {
		    params.remark_type_id = ptr.remark_type_id;
		}
		if( typeof ptr.note != 'undefined' && !String.isEmpty(ptr.note) ) {
		    params.note = ptr.note;
		}
		xhr.send(G.formParamsURI(params));
	    }
	    var alarm = function(arg) {
		realert.html(arg);
		realert.show();
	    }
	    var enable = function() {
		reaccept.disabled = ptr.status == 'accepted';
		rereject.disabled = ptr.status == 'rejected' || String.isEmpty(ptr.note);
		renote.disabled = false;
	    }
	    var disable = function() {
		reaccept.disabled = true;
		rereject.disabled = true;
		renote.disabled = true;
	    }
	    if( _cache._more_row_no != null && _cache._more_row_no != u ) {
		_tags.more.hide();
	    }
	    _tags.more.set(_remarktbl(r, _cache.data.remark_types).join(''));
	    realert = _("re:alert");
	    renote = _("re:note");
	    reaccept = _("re:accept");
	    rereject = _("re:reject");
	    retype = _("re:type");
	    if( retype != null ) {
		retype.onchange = function() {
		    ptr.remark_type_id = (this.value || this.options[this.selectedIndex].value);
		    ptr.type = this.options[this.selectedIndex].innerText;
		    enable();
		    realert.hide();
		}
	    }
	    renote.oninput = function() {
		ptr.note = this.value.trim();
		enable();
		realert.hide();
	    }
	    if( ptr.status != 'accepted' ) {
		reaccept.onclick = function() {
		    realert.hide();
		    commit(this, "PUT");
		}
	    }
	    if( ptr.status != 'rejected' ) {
		rereject.onclick = function() {
		    realert.hide();
		    if( String.isEmpty(ptr.note) ) {
			alarm(lang.errors.remark.note);
		    } else {
			commit(this, "DELETE");
		    }
		}
	    }
	    if( ptr.remark_type_id != null ) {
		retype.value = ptr.remark_type_id;
	    }
	    if( ptr.note != null ) {
		renote.text(ptr.note);
	    }
	    _tags.more.toggle(tag, offset);
	    _cache._more_row_no = u;
	    _cache.remarks[r.doc_id] = ptr;
	    enable();
	},
	other: function(tag, container) {
	    if( container.hasClass('gone') ) {
		container.removeClass('gone');
		tag.html(lang.targets_compliance.less);
	    } else {
		container.addClass('gone');
		tag.html(lang.targets_compliance.more);
	    }
	},
	slideshow: function(blobs, position) {
	    var ar = [];
	    blobs.forEach(function(arg) { ar.push(G.getajax({plug: _code, blob: "yes", blob_id: arg})); });
	    SlideshowSimple(ar, {idx: position}).show();
	},
	xlsx: function() {
	    _toxlsx();
	},
	zip: function(tag0, tag1, span) {
	    var ar = [];
	    if( _cache.data != null && Array.isArray(_cache.data._rows) ) {
		_cache.data._rows.forEach(function(r, i) {
		    if( r.blob_id != null ) {
			ar.push({params: {target_id:r.target_id, blob_id:r.blob_id}, blob_id: r.blob_id});
		    }
		    if( Array.isArray(r.confirmations) ) {
			r.confirmations.forEach(function(arg0) {
			    if( Array.isArray(arg0.photos) ) {
				arg0.photos.forEach(function(arg1) {
				    ar.push({params: {target_id:r.target_id, blob_id:arg1}, blob_id: arg1});
				});
			    }
			});
		    }
		});
	    }
	    _F = false;
	    G.tozip(_code, ar, _perm.zip != null ? _perm.zip.photo : null, _perm.zip != null ? _perm.zip.max : null,
		function() {return _F;}, tag0, tag1, span);
	},
	abort: function() {
	    _F = true;
	}
    }
})();


function startup(perm) {
    PLUG.startup({body: _('pluginContainer')}, perm);
}
