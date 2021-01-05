/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "cancellations";
    var _cache = {}, _perm = {}, _tags = {};
    var _statusColumn = 2;

    function _getcolumns(perm) {
	let x = 8, c = perm.columns || {};
	if( perm.restore == true || perm.revoke == true ) x++;
	if( c.area == true ) x++;
	if( c.department == true ) x++;
	if( c.distributor == true ) x++;
	return x;
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.cancellations.title, "</span>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	if( typeof perm.add != 'undefined' ) {
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0);' onclick='PLUG.add();'>", lang.cancellations.add, "</a>");
	}
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th class='date'>", lang.date, "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"user\",0.2)'>", lang.u_name, "</a></th>");
	ar.push("<th>", lang.u_code, "</th>");
	ar.push("<th>", lang.cancellations.type, "</th>");
	ar.push("<th>", lang.note, "</th>");
	if( perm.restore == true || perm.revoke == true ) {
	    ar.push("<th class='symbol'>", "&#x2699;", "</th>");
	}
	if( perm.columns != null && perm.columns.area == true ) {
	    ar.push("<th>", lang.area, "</th>");
	}
	if( perm.columns != null && perm.columns.department == true ) {
	    ar.push("<th>", lang.departmentAbbr, "</th>");
	}
	if( perm.columns != null && perm.columns.distributor == true ) {
	    ar.push("<th>", lang.distributor, "</th>");
	}
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	ar.push("<th width='85px'>", lang.dev_login, "</th>");
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(Dialog.container());
	ar.push(CancelingTypesPopup.container());
	ar.push(DateRangePopup.container());
	ar.push(UsersPopup.container());
	ar.push(UsersPopup.container("headsPopup"));
	ar.push(UsersPopup.container("dialog!usersPopup"));
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
	    route_date:true, 
	    user_id:true, dev_login:true, u_name:true,
	    area:true,
	    deps:true,
	    distrs:true,
	    head_id:true
	});
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z;
	var rx = new RegExp("['\"]", "g");
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.row_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.row_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td id='sR", r.row_no, "' class='date", r.hidden ? " strikethrough attention" : "", "'>", 
			G.getdate_l(Date.parseISO8601(r.route_date)), "</td>");
		    ar.push("<td class='string sw95px'>", G.shielding(r.u_name), "</td>");
		    t = G.shielding(r.u_code).replace(rx,' ');
		    if( r.u_code.length > 15 ) {
			ar.push("<td class='copyable int footnote' data-title='{0}' onclick='PLUG.copy(\"{0}\");event.stopPropagation();'>".format_a(t),
			    G.shielding(r.u_code).mtrunc(15), "</td>");
		    } else {
			ar.push("<td class='copyable int' onclick='PLUG.copy(\"{0}\");event.stopPropagation();'>".format_a(t),
			    G.shielding(r.u_code), "</td>");
		    }
		    ar.push("<td class='ref Xsw95px'>", G.shielding(r.canceling_type), "</td>");
		    ar.push("<td class='string note'>", G.shielding(r.note), "</td>");
		    if( perm.restore == true || perm.revoke == true ) {
			ar.push("<td class='ref'>");
			if( r.hidden ) {
			    if( perm.restore == true ) {
				ar.push("<a href='javascript:void(0)' onclick='PLUG.restore(this,", r.row_no, ");'>", 
				    lang.restore, "</a>");
			    }
			} else {
			    if( perm.revoke == true ) {
				ar.push("<a class='attention' href='javascript:void(0)' onclick='PLUG.revoke(this,", r.row_no, ");'>", 
				    lang.revoke, "</a>");
			    }
			}
			ar.push("</td>");
		    }
		    if( perm.columns != null && perm.columns.area == true ) {
			ar.push("<td class='ref sw95px'>", G.shielding(r.area), "</td>");
		    }
		    if( perm.columns != null && perm.columns.department == true ) {
			var t = []
			for( let i = 0, size = Array.isEmpty(r.departments) ? 0 : r.departments.length; i < size; i++ ) {
			    if( i == 2 ) {
				t.push("&mldr;");
				break;
			    } else if( i == 0 ) {
				t.push("<div class='row'>", G.shielding(r.departments[i]), "</div>");
			    } else {
				t.push("<div class='row remark'>", G.shielding(r.departments[i]), "</div>");
			    }
			}
			ar.push("<td class='ref Xsw95px'>", t.join(''), "</td>");
		    }
		    if( perm.columns != null && perm.columns.distributor == true ) {
			var t = []
			for( let i = 0, size = Array.isEmpty(r.distributors) ? 0 : r.distributors.length; i < size; i++ ) {
			    if( i == 2 ) {
				t.push("&mldr;");
				break;
			    } else if( i == 0 ) {
				t.push("<div class='row'>", G.shielding(r.distributors[i]), "</div>");
			    } else {
				t.push("<div class='row remark'>", G.shielding(r.distributors[i]), "</div>");
			    }
			}
			ar.push("<td class='ref sw95px'>", t.join(''), "</td>");
		    }
		    ar.push("<td class='string sw95px'>", G.shielding(r.head_name), "</td>");
		    ar.push("<td class='int'>", G.shielding(r.dev_login), "</td>");
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

    function _parambodytbl() {
	var ar = [];
	ar.push("<div class='row'>", lang.cancellations.notice, "</div>");
	ar.push("<div id='param:alert' class='row attention gone'>", "</div>");
	ar.push("<div class='row'>");
	ar.push("<button id='param:user' class='dropdown'>", "</button>");
	ar.push("</div>");
	ar.push("<div class='row'>");
	ar.push("<button id='param:type' class='dropdown'>", "</button>");
	ar.push("</div>");
	ar.push("<div class='row'>");
	ar.push("<button id='param:daterange' class='dropdown'>", "</button>");
	ar.push("</div>");
	ar.push("<div class='row'>");
	ar.push("<textarea id='param:note' rows='3' maxlength='1024' autocomplete='off' placeholder='", 
	    lang.note_placeholder, "'></textarea>");
	ar.push("</div>");
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
	G.xhr("GET", G.getajax({plug: _code}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_cache.data = data;
		//console.log(data);
		_tags.tbody.html(_datatbl(data, 1, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
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

    function _revoke(tags, data, perm) {
	ProgressDialog.show();
	G.xhr("DELETE", G.getajax({
		    plug: _code, 
		    route_date: data.route_date, 
		    user_id: data.user_id, 
		    _datetime: G.getdatetime(new Date())
		}), "", function(xhr) {
	    if( xhr.status == 200 ) {
		data.hidden = 1;
		tags.route_date.addClass("strikethrough attention");
		if( perm.restore == true ) {
		    tags.ref.html(lang.restore);
		    tags.ref.onclick = function() { PLUG.restore(tags.ref, data.row_no, perm); }
		    tags.ref.removeClass("attention");
		} else {
		    var n = tags.ref.parentNode.parentNode;
		    n.parentNode.removeChild(n);
		}
	    } else {
		Toast.show(lang.errors.runtime);
	    }
	    ProgressDialog.hide();
	}).send();
    }

    function _restore(tags, data, perm) {
	ProgressDialog.show();
	G.xhr("PUT", G.getajax({
		    plug: _code, 
		    route_date: data.route_date, 
		    user_id: data.user_id, 
		    _datetime: G.getdatetime(new Date())
		}), "", function(xhr) {
	    if( xhr.status == 200 ) {
		data.hidden = 0;
		tags.route_date.removeClass("strikethrough");
		tags.route_date.removeClass("attention");
		if( perm.restore == true ) {
		    tags.ref.html(lang.revoke);
		    tags.ref.onclick = function() { PLUG.revoke(tags.ref, data.row_no, perm); }
		    tags.ref.addClass("attention");
		} else {
		    var n = tags.ref.parentNode.parentNode;
		    n.parentNode.removeChild(n);
		}
	    } else {
		Toast.show(lang.errors.runtime);
	    }
	    ProgressDialog.hide();
	}).send();
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
	copy: function(text) {
	    navigator.clipboard.writeText(text);
	    Toast.show(lang.notices.clipboard);
	    console.log(text);
	},
	users: function(tag, type, offset) {
	    _togglePopup(type+"s", tag, offset, function(obj) {
		return UsersPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "user_id", type+"_id");
		}, {container:type+"sPopup", everyone:true})
	    });
	},
	restore: function(tag, row_no) {
	    _restore({ref: tag, route_date: _('sR{0}'.format_a(row_no))}, _cache.data.rows[row_no-1], _perm);
	},
	revoke: function(tag, row_no) {
	    _revoke({ref: tag, route_date: _('sR{0}'.format_a(row_no))}, _cache.data.rows[row_no-1], _perm);
	},
	add: function() {
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
		    x.toggle(tag/*, 0.2*/);
		}
	    }
	    Dialog({
		width: 650,
		title: lang.cancellations.add,
		body: _parambodytbl(),
		buttons: _parambtntbl(),
		onHideListener: function(dialogObject) { togglePopup(); },
		onScrollListener: function(dialogObject) { togglePopup(); }
	    }).show(function(dialogObject) {
		const newData = {};
		const mans = _cache.data.mans;
		const today = new Date();
		const min = new Date(new Date(today.getYear()+1900, today.getMonth(), 
		    today.getDate()).getTime() + 86400000*(_perm.add.offset||1));
		const max = new Date(today.getFullYear(), today.getMonth() + (_perm.add.depth||1) + 1, 0);
		const alertView = _('param:alert');
		const noteView = _('param:note');
		const userView = _('param:user');
		const typeView = _('param:type');
		const daterangeView = _('param:daterange');
		const backView = _('param:back');
		const commitView = _('param:commit');
		const func = function() {
		    commitView.disabled =
			String.isEmpty(newData.user_id) || 
			String.isEmpty(newData.type_id) || 
			String.isEmpty(newData.b_date) ||
			String.isEmpty(newData.e_date);
		}
		const dropDownLabel = function(arg0, arg1) {
		    if( typeof arg1 == 'object' ) {
			return "&#9776;&nbsp;&nbsp;{0}:&nbsp;&nbsp;<i>{1}</i>".format_a(arg0, arg1.descr);
		    } else if( !String.isEmpty(arg1)  ) {
			return "&#9776;&nbsp;&nbsp;{0}:&nbsp;&nbsp;<i>{1}</i>".format_a(arg0, arg1);
		    }
		    return "&#9776;&nbsp;&nbsp;{0}:&nbsp;&nbsp;<i>{1}</i>".format_a(arg0, lang.not_specified);
		}

		CancelingTypesPopup.cleanup(mans.users);
		UsersPopup.cleanup(mans.canceling_types, "dialog!usersPopup");

		userView.html(dropDownLabel(lang.u_name));
		typeView.html(dropDownLabel(lang.cancellations.type));
		daterangeView.html(dropDownLabel(lang.validity));

		dialogObject._container.onclick = function() {
		    togglePopup();
		}
		noteView.onfocus = function() {
		    togglePopup();
		}
		noteView.oninput = function() {
		    newData.note = this.value.trim();
		    func();
		}
		if( !Array.isEmpty(mans.canceling_types) ) {
		    typeView.onclick = function(ev) {
			togglePopup("canceling_types", typeView, function(obj) {
			    return CancelingTypesPopup(mans[obj], function(arg, i, ar) {
				newData.type_id = typeof arg == 'object' ? arg.canceling_type_id : null;
				typeView.html(dropDownLabel(lang.cancellations.type, arg));
				func();
			    }, {everything: false})
			});
			ev.stopPropagation();
		    }
		} else {
		    typeView.disabled = true;
		}
		if( !Array.isEmpty(mans.users) ) {
		    userView.onclick = function(ev) {
			togglePopup("users", userView, function(obj) {
			    return UsersPopup(mans[obj], function(arg, i, ar) {
				newData.user_id = typeof arg == 'object' ? arg.user_id : null;
				userView.html(dropDownLabel(lang.u_name, arg));
				func();
			    }, {everything: false, container: "dialog!usersPopup"})
			});
			ev.stopPropagation();
		    }
		} else {
		    userView.disabled = true;
		}
		daterangeView.onclick = function(ev) {
		    togglePopup("daterange", daterangeView, function(obj) {
			return DateRangePopup(min, max, function(arg0, arg1) {
			    newData.b_date = arg0 instanceof Date ? G.getdate(arg0) : arg0;
			    newData.e_date = arg1 instanceof Date ? G.getdate(arg1) : arg1;
			    daterangeView.html(dropDownLabel(lang.validity, 
				"{0} - {1}".format_a(G.getlongdate_l(arg0), G.getlongdate_l(arg1))
			    ));
			    func();
			});
		    });
		    ev.stopPropagation();
		}
		backView.onclick = function() {
		    dialogObject.hide();
		}
		commitView.onclick = function() {
		    if( String.isEmpty(newData.user_id) ) {
			alertView.html(lang.cancellations.msg0);
			alertView.show();
		    } else if( newData.b_date == null || newData.e_date == null || newData.b_date > newData.e_date ) {
			alertView.html(lang.cancellations.msg1);
			alertView.show();
		    } else if( String.isEmpty(newData.type_id) ) {
			alertView.html(lang.cancellations.msg2);
			alertView.show();
		    } else {
			let fd = new FormData();
			fd.append("_datetime", G.getdatetime(new Date()));
			fd.append("user_id", newData.user_id);
			fd.append("canceling_type_id", newData.type_id);
			fd.append("b_date", newData.b_date);
			fd.append("e_date", newData.e_date);

			if( !String.isEmpty(newData.note) ) {
			    fd.append("note", newData.note);
			}

			dialogObject.startSpinner();
			alertView.hide();

			G.xhr("POST", G.getajax({plug: _code}), "json", function(xhr, resp) {
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
	    _togglePopup();
	}
    }
})();


function startup(perm) {
    PLUG.startup({body: _('pluginContainer')}, perm);
}
