/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

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
	ar.push("<span>", lang.get_watermark, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	if( perm.csv ) {
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.csv(this)'>", lang.export.csv, "</a>");
	}
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
	ar.push("<th width='260'><a href='javascript:void(0)' onclick='PLUG.confirmation_types(this,0.65)'>", lang.targets_compliance.confirmations, "</a></th>");
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
	    "L.confirm_id":true
	});
    }

    function _getstatus(r) {
	var ar = [], z;
	ar.push("<div><i>", G.shielding(r.target_type), "</i></div>");
	ar.push("<div>", G.shielding(r.body), "</div>");
	ar.push("<div>" + lang.validity + ":&nbsp;" + lang.b_date2 + "&nbsp;<i>" + G.getlongday_l(Date.parseISO8601(r.b_date)) +
	    "</i>&nbsp;" + lang.e_date2 + "&nbsp;<i>" + G.getlongday_l(Date.parseISO8601(r.e_date)) + "</i></div>");
	ar.push("<hr />");
	ar.push("<div class='r watermark'>", "{0} / {1}".format_a(G.shielding(r.target_id), r.updated_ts), "</div>");
	return ar;
    }

    function _gettarget(doc_id) {
	var ar = [];
	ar.push("<h1>", lang.targets.title2, "</h1>");
	ar.push("<div onclick='event.stopPropagation();'>");
	ar.push("<div class='row'>", lang.notices.target, "</div>");
	ar.push("<div class='row attention gone' id='alert:" + doc_id + "'></div>");
	ar.push("<div class='row'><input id='sub:" + doc_id + "' type='text' maxlength='128' autocomplete='off' placeholder='" + 
	    lang.targets.subject.placeholder + "'/></div>");
	ar.push("<div class='row'><textarea id='msg:" + doc_id + "' rows='6' maxlength='2048' autocomplete='off' placeholder='" + 
	    lang.targets.body.placeholder + "'></textarea></div>");
	ar.push("<div class='row'><input id='strict:" + doc_id + "' type='checkbox'/>&nbsp;<lable for='strict:" + doc_id + "'>" +
	    lang.targets.strict + "</lablel></div>");
	ar.push("<br/>");
	ar.push("<div align='center'><button id='commit:" + doc_id + "' disabled='true'>", lang.save, "</button></div>");
	ar.push("</div>");
	return ar;
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
		    ar.push("<td style='cursor:pointer' class='autoincrement" + (r.myself?" attention footnote":"") + "' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.row_id + "');event.stopPropagation();\"" + (r.myself?(" data-title='" + lang.targets_compliance.myself + "'"):"") + ">", r.row_no, "</td>");
		    ar.push("<td class='string sw95px'>", G.shielding(r.author_name), "</td>");
		    ar.push("<td class='int'>", G.shielding(r.a_code), "</td>");
		    ar.push("<td class='string" + (r.a_hidden ? " strikethrough attention" : "") + "'>", G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string note" + (r.a_hidden ? " strikethrough attention" : "") + "'>", G.shielding(r.address), "</td>");
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
			    (k>=20?"data-original='":"src='") + G.getajax({plug: _code, blob: "yes", thumb: "yes", blob_id: r.blob_id}) + "'/>");
			b++;
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref'>");
		    if( r.L != null ) {
			ar.push("<div>","<div class='row'>");
			if( perm.target == true ) {
			    ar.push("<span onclick='PLUG.target(this,\"", r.L.doc_id, "\",0.80)'>");
			}
			ar.push(G.shielding(r.L.confirm, lang.dash));
			if( perm.target == true ) {
			    ar.push("</span>");
			}
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
				    ar.push("<div class='row'>", G.shielding(arg.confirm, lang.dash), "</div>");
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
	}
	if( ar.length == 0 ) {
	    ar = _datamsg(lang.empty, perm);
	}
	if( typeof data.data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='" + _getcolumns(perm) + "' class='watermark'>" + lang.data_watermark + 
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

    function _setdata() {
	var sp;
	_tags.tbody.hide();
	_tags.total.html("");
	sp = spinnerLarge(_tags.body, "50%", "50%");
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
	    }
	    _tags.ts.html(G.getdatetime_l(new Date()));
	    _tags.tbody.show();
	    sp.stop();
	}).send();
    }

    function _page(page) {
	var sp;
	if( _cache.data != null ) {
	    _tags.more.hide();
	    _tags.tbody.hide();
	    _tags.total.html("");
	    sp = spinnerLarge(_tags.body, "50%", "50%");
	    setTimeout(function() {
		_tags.tbody.html(_datatbl(_cache.data, page, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
		new LazyLoad();
		_tags.tbody.show();
		sp.stop();
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
	    _cache.targets = {};
	    _setdata();
	},
	refresh: function() {
	    if( _today != null ) {
		_today = G.getdate(new Date());
	    }
	    _togglePopup();
	    _tags.popups = {};
	    _tags.more.hide();
	    _setdata();
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
		    _onpopup(tag, arg, "confirm_id");
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
	    _tags.more.set(_getstatus(_cache.data.rows[row_no-1]).join(''));
	    _tags.more.toggle(tag, offset);
	    _cache._more_row_no = row_no;
	},
	target: function(tag, doc_id, offset) {
	    var commit, sub, msg, strict, offset, params;
	    if( !_cache.targets.hasOwnProperty(doc_id) ) {
		_cache.targets[doc_id] = {};
	    }
	    if( _cache._more_row_no != null && _cache._more_row_no != doc_id ) {
		_tags.more.hide();
	    }
	    _tags.more.set(_gettarget(doc_id).join(''));
	    _tags.more.toggle(tag, offset);
	    _cache._more_row_no = doc_id;
	    params = _cache.targets[doc_id];
	    offset = _tags.more.position().top;
	    commit = _("commit:{0}".format_a(doc_id));
	    sub = _("sub:{0}".format_a(doc_id));
	    msg = _("msg:{0}".format_a(doc_id));
	    strict = _("strict:{0}".format_a(doc_id));
	    sub.value = params.sub || "";
	    msg.value = params.msg || "";
	    strict.checked = params.strict;
	    commit.disabled = String.isEmpty(params.sub) || String.isEmpty(params.msg);
	    sub.oninput = function() { 
		params.sub = this.value.trim();
		commit.disabled = String.isEmpty(params.sub) || String.isEmpty(params.msg);
	    };
	    msg.oninput = function() { 
		params.msg = this.value.trim();
		commit.disabled = String.isEmpty(params.sub) || String.isEmpty(params.msg);
	    };
	    strict.onchange = function() { 
		params.strict = this.checked; 
	    };
	    commit.onclick = function() {
		var self = this, a = _("alert:{0}".format_a(doc_id));
		a.hide();
		if( String.isEmpty(params.sub) ) {
		    a.html(lang.errors.target.sub);
		    a.show();
		} else if( String.isEmpty(params.msg) ) {
		    a.html(lang.errors.target.body);
		    a.show();
		} else {
		    var sp = spinnerSmall(this, this.position().top + this.height()/2 - offset, "auto");
		    var xhr = G.xhr("POST", G.getajax({plug: _code, doc_id: doc_id}), "", function(xhr) {
			if( xhr.status == 200 ) {
			    _cache.targets[doc_id] = params = {};
			    _tags.more.hide();
			    Toast.show(lang.success.target);
			} else {
			    self.disabled = false;
			    a.html(xhr.status == 409 ? lang.errors.target.exist : lang.errors.runtime);
			    a.show();
			}
			sp.stop();
		    });
		    params.doc_id = doc_id;
		    this.disabled = true;
		    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		    xhr.send(G.formParamsURI(params));
		}
	    }
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
	csv: function() {
	    var ar = [];
	    if( _cache.data != null && Array.isArray(_cache.data._rows) ) {
		_cache.data._rows.forEach(function(r, i) {
		    ar.push(r);
		});
	    }
	    G.tocsv(_code, ar, _perm.csv);
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


function startup(tag, perm) {
    PLUG.startup({body: tag}, perm);
}
