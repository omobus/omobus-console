/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "orders";
    var _cache = {}, _perm = {}, _tags = {};

    function _getcolumns(perm) {
	return 10 + (perm.columns == null ? 0 : (
	    (perm.columns.channel == true ? 1 : 0) + 
	    (perm.columns.head == true ? 1 : 0) + 
	    (perm.columns.distributor == true ? 1 : 0) + 
	    (perm.columns.payment == true ? 1 : 0) 
	));
    }

    function _getbody(perm) {
	var ar = [];
	ar.push("<table class='headerbar' width='100%'><tr><td><h1>");
	ar.push("<span>", lang.orders.title1, "</span>&nbsp;");
	ar.push("<a id='plugCal' href='javascript:void(0);' onclick='PLUG.calendar(this)'>[&nbsp;-&nbsp;]</a>");
	ar.push("</h1></td><td class='r'>");
	ar.push("<span>", lang.received_ts, "</span>&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>");
	ar.push("&nbsp;(<a href='javascript:void(0);' onclick='PLUG.refresh();'>", lang.refresh, "</a>)<span id='plugTotal'></span>");
	if( perm.csv ) {
	    ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:void(0)' onclick='PLUG.csv(this)'>", lang.export.csv, "</a>");
	}
	ar.push("&nbsp&nbsp;|&nbsp;&nbsp;<input class='search' type='text' maxlength='96' autocomplete='off' placeholder='",
	    lang.search, "' id='plugFilter' onkeyup='return PLUG.filter(this, event);' onpaste='PLUG.filter(this, event); return true;' />");
	ar.push("</td></tr></table>");
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th class='date'>", lang.created_date, "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"user\",0.2)'>", lang.u_name, "</a></th>");
	ar.push("<th>", lang.a_code, "</th>");
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.retail_chains(this)'>", lang.a_name, "</a></th>");
	ar.push("<th>", lang.address, "</th>");
	if( perm.columns != null && perm.columns.channel == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.channels(this)'>", lang.chan_name, "</a></th>");
	}
	ar.push("<th><a href='javascript:void(0)' onclick='PLUG.order_types(this,0.6)'>", lang.doc_no, "</a></th>");
	ar.push("<th>", lang.amount, "</th>");
	ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.delivery_types(this,0.6)'>", lang.shipment, "</a></th>");
	if( perm.columns != null && perm.columns.payment == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.payment_methods(this,0.7)'>", lang.payment, "</a></th>");
	}
	if( perm.columns != null && perm.columns.distributor == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.distributors(this,0.8)'>", lang.distributor, "</a></th>");
	}
	ar.push("<th>", lang.note, "</th>");
	if( perm.columns != null && perm.columns.head == true ) {
	    ar.push("<th class='sw95px'><a href='javascript:void(0)' onclick='PLUG.users(this,\"head\",0.90)'>", lang.head_name, "</a></th>");
	}
	ar.push("</tr>", G.thnums(_getcolumns(perm)), "</thead>");
	ar.push("<tbody id='maintb'></tbody></table>");
	ar.push(MonthsPopup.container());
	ar.push(ChannelsPopup.container());
	ar.push(DeliveryTypesPopup.container());
	ar.push(DistributorsPopup.container());
	ar.push(OrderTypesPopup.container());
	ar.push(PaymentMethodsPopup.container());
	ar.push(RetailChainsPopup.container());
	ar.push(UsersPopup.container());
	ar.push(UsersPopup.container("headsPopup"));
	ar.push(Dialog.container());
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
	    doc_id:true,
	    fix_dt:true, 
	    user_id:true, dev_login:true, u_name:true, 
	    account_id:true, a_code:true, a_name:true, address:true, 
	    chan_id:true, chan:true, 
	    poten:true, 
	    rc_id:true, rc:true, ka_code:true, 
	    region:true, 
	    city:true, 
	    order_type_id:true,
	    distr_id:true, 
	    delivery_type_id:true, 
	    payment_method_id:true, 
	    doc_id:true, 
	    doc_note:true,
	    head_id:true
	});
    }

    function _detailsbody(r) {
	var ar = [], x;
	ar.push("<table width='100%'>","<tr>","<td>");
	if( !String.isEmpty(r.u_name) ) {
	    ar.push("<div>", "<i>{0}: {1}</i>".format_a(G.shielding(r.dev_login, lang.dash), G.shielding(r.u_name)), "</div>");
	}
	ar.push("<div>", "<b>{0}: {1}</b>".format_a(G.shielding(r.a_code), G.shielding(r.a_name)), "</div>");
	ar.push("<div>", G.shielding(r.address), "</div>");
	if( !String.isEmpty(r.chan) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.chan_name, G.shielding(r.chan)), "</div>");
	}
	if( !String.isEmpty(r.poten) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.poten, G.shielding(r.poten)), "</div>");
	}
	if( !String.isEmpty(r.rc) ) {
	    ar.push("<div>", "{0}: {1}".format_a(lang.rc_name, G.shielding(r.rc)), "</div>");
	}
	ar.push("</td>", "<td width='10px'/>", "<td width='270px' style='text-align:right;'>");
	ar.push("<div>", "{0}: <b>{1}</b>".format_a(lang.amount, G.getcurrency_l(r.amount)), "</div>");
	ar.push("<div>", "{0}{1}{2}".format_a(G.shielding(r.distributor, lang.dash), typeof r.warehouse == 'undefined'?'':' / ', G.shielding(r.warehouse)), "</div>");
	ar.push("<div>", "{0}: <b>{1}</b>".format_a(lang.delivery, G.getdate_l(Date.parseISO8601(r.delivery_date))), "</div>");
	ar.push("</td>","</tr></table>");
	ar.push("<br/>");
	ar.push("<table width='100%' class='report'>");
	ar.push("<thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th>", lang.product, "</th>");
	ar.push("<th>", lang.price, "</th>");
	ar.push("<th>", lang.qty, "</th>");
	ar.push("<th>", lang.pack, "</th>");
	ar.push("<th>", lang.discount, "</th>");
	ar.push("<th>", lang.amount, "</th>");
	ar.push("</tr></thead><tbody>");
	for( var i = 0, size = Array.isArray(r.rows) ? r.rows.length : 0; i < size; i++ ) {
	    x = r.rows[i];
	    ar.push("<tr>");
	    ar.push("<td class='autoincrement'>", i + 1, "</td>");
	    ar.push("<td class='string'>", G.shielding(x.prod), "</td>");
	    ar.push("<td class='numeric'>", G.getcurrency_l(x.unit_price), "</td>");
	    ar.push("<td class='int'>", G.getint_l(x.qty), "</td>");
	    ar.push("<td class='int'>", G.shielding(x.pack_name), "</td>");
	    ar.push("<td class='int'>", x.discount > 0 ? G.getpercent_l(x.discount) : lang.dash, "</td>");
	    ar.push("<td class='numeric'>", G.getcurrency_l(x.amount), "</td>");
	    ar.push("</tr>");
	}
	ar.push("</tbody>");
	ar.push("<tfoot><tr class='def'><td colspan='7' class='watermark'>", 
	    "{0}: {1}".format_a(lang.fix_dt, G.getdatetime_l(Date.parseISO8601(r.fix_dt))), 
	    "</td></tr></tfoot>");
	ar.push("</table>");
	ar.push("<br/>");
	return ar;
    }

    function _datamsg(msg, perm) {
	return ["<tr class='def'><td colspan='", _getcolumns(perm), "' class='message'>", msg, "</td></tr>"];
    }

    function _datatbl(data, page, total, f, checked, perm) {
	var ar = [], size = Array.isArray(data.rows) ? data.rows.length : 0, x = 0, r, z;
	data._rows = [];
	for( var i = 0; i < size; i++ ) {
	    if( (r = data.rows[i]) != null && f.is(r) ) {
		if( (page-1)*perm.rows <= x && x < page*perm.rows ) {
		    ar.push("<tr" + (typeof checked != 'undefined' && checked[r.doc_id] ? " class='selected'" : "") + ">");
		    ar.push("<td class='autoincrement clickable' onclick=\"PLUG.checkrow(this.parentNode,'" +
			r.doc_id + "');event.stopPropagation();\">", r.row_no, "</td>");
		    ar.push("<td class='date delim'>", G.getdatetime_l(Date.parseISO8601(r.fix_dt)), "</td>");
		    ar.push("<td class='string sw95px delim'>", G.shielding(r.u_name), "</td>");
		    ar.push("<td class='int'>", G.shielding(r.a_code), "</td>");
		    ar.push("<td class='string'>", G.shielding(r.a_name), "</td>");
		    ar.push("<td class='string note" + (perm.columns != null && perm.columns.channel == true ? "" : " delim") + 
			"'>", G.shielding(r.address), "</td>");
		    if( perm.columns != null && perm.columns.channel == true ) {
			ar.push("<td class='ref sw95px delim'>", G.shielding(r.chan), "</td>");
		    }
		    ar.push("<td class='ref'>");
		    ar.push("<div class='row'><a href='javascript:void(0)' onclick='PLUG.more(" + r.row_no + ");'>", G.shielding(r.doc_no), "</a></div>");
		    ar.push("<hr/><div class='row watermark'>", G.shielding(r.doc_id), "</div>");
		    ar.push("<hr/><div class='row watermark'>", G.getdatetime_l(Date.parseISO8601(r.inserted_ts)), "</div>");
		    ar.push("<hr/><div class='row watermark'>", G.shielding(r.order_type), "</div>");
		    ar.push("</td>");
		    ar.push("<td class='int", typeof r.ttd == 'undefined' ? " attention" : "", "'>");
		    ar.push("<div class='row footnote' data-title='", typeof r.ttd == 'undefined' ? lang.ttd.unknown : lang.ttd[r.ttd], "'>", 
			G.getcurrency_l(r.amount), "</div>");
		    if( Array.isArray(r.erp) && r.erp.length > 0 ) {
			ar.push("<hr/>");
			// status > 0 - closed; status < 0 - deleted.
			r.erp.forEach(function(arg) {
			    ar.push("<div class='row watermark");
			    if( arg.status < 0 ) {
				ar.push(' strikethrough');
			    }
			    if( arg.status != 0 ) {
				ar.push(' footnote');
			    }
			    ar.push("'");
			    if( arg.status < 0 ) {
				ar.push(" data-title='", lang.notices.document.deleted.format_a(G.shielding(arg.erp_no), G.getdatetime_l(Date.parseISO8601(arg.erp_dt))), "'");
			    }
			    if( arg.status > 0 ) {
				ar.push(" data-title='", lang.notices.document.closed.format_a(G.shielding(arg.erp_no), G.getdatetime_l(Date.parseISO8601(arg.erp_dt))), "'");
			    }
			    ar.push(">", "{1}: {0}".format_a(G.getcurrency_l(arg.amount), G.shielding(arg.erp_no)), "</div>");
			});
		    }
		    ar.push("</td>");
		    ar.push("<td class='ref sw95px'>");
		    ar.push("<div class='row'>", G.getdate_l(Date.parseISO8601(r.delivery_date)), "</div>");
		    if( !String.isEmpty(r.delivery_type) ) {
			ar.push("<hr/><div class='row watermark'>", G.shielding(r.delivery_type), "</div>");
		    }
		    if( !String.isEmpty(r.delivery_note) ) {
			ar.push("<hr/><div class='row watermark'>", G.shielding(r.delivery_note), "</div>");
		    }
		    ar.push("</td>");
		    if( perm.columns != null && perm.columns.payment == true ) {
			ar.push("<td class='ref sw95px'>");
			if( !String.isEmpty(r.payment_method) ) {
			    ar.push("<div class='row'>", G.shielding(r.payment_method), "</div>");
			}
			if( typeof r.encashment != 'undefined' && r.encashment > 0 ) {
			    ar.push("<hr/><div class='row watermark'>", G.getcurrency_l(r.encashment), "</div>");
			}
			if( typeof r.payment_delay != 'undefined' && r.payment_delay > 0 ) {
			    ar.push("<hr/><div class='row watermark'>", "{0}:&nbsp;{1}".format_a(lang.payment_delay,r.payment_delay), "</div>");
			}
			if( typeof r.bonus != 'undefined' && r.bonus > 0 ) {
			    ar.push("<hr/><div class='row watermark'>", "{0}:&nbsp;{1}".format_a(lang.payment_delay,G.getcurrency_l(r.bonus)), "</div>");
			}
			ar.push("</td>");
		    }
		    if( perm.columns != null && perm.columns.distributor == true ) {
			ar.push("<td class='ref sw95px'>");
			ar.push("<div class='row'>", G.shielding(r.distributor), "</div>");
			if( !String.isEmpty(r.warehouse) ) {
			    ar.push("<hr/><div class='row watermark'>", G.shielding(r.warehouse), "</div>");
			}
			ar.push("</td>");
		    }
		    ar.push("<td class='string note" + (perm.columns != null && perm.columns.head == true ? " delim" : "") + "'>");
		    if( !String.isEmpty(r.doc_note) ) {
			ar.push("<div class='row'>", G.shielding(r.doc_note), "</div>");
		    }
		    if( Array.isArray(r.order_params) && r.order_params.length > 0 ) {
			if( !String.isEmpty(r.doc_note) ) {
			    ar.push("<hr/>");
			}
			r.order_params.forEach(function(val, index) {
			    if( index > 0 ) { ar.push("<hr/>"); }
			    ar.push("<div class='row watermark'>", G.shielding(val), "</div>");
			});
		    }
		    ar.push("</td>");
		    if( perm.columns != null && perm.columns.head == true ) {
			ar.push("<td class='string sw95px'>", G.shielding(r.head_name), "</td>");
		    }
		    ar.push("</tr>");
		    data._rows.push(r);
		}
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

    function _datareq(y, m) {
	var sp;
	_tags.tbody.hide();
	_tags.total.html("");
	sp = spinnerLarge(_tags.body, "50%", "50%");
	_cache.data = null; // drop the internal cache
	G.xhr("GET", G.getajax({plug: _code, year: y, month: m}), "json-js", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_cache.data = data;
		_tags.tbody.html(_datatbl(data, 1, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
	    } else {
		_tags.tbody.html(_datamsg(lang.failure, _perm).join(""));
	    }
	    _tags.ts.html(G.getdatetime_l(new Date()));
	    _tags.tbody.show();
	    sp.stop();
	}).send();
	_cache.y = y; _cache.m = m;
	_tags.cal.html(G.getlongmonth_l(new Date(y, m - 1, 1)).toLowerCase());
    }

    function _page(page) {
	var sp;
	if( _cache.data != null ) {
	    _tags.tbody.hide();
	    _tags.total.html("");
	    sp = spinnerLarge(_tags.body, "50%", "50%");
	    setTimeout(function() {
		_tags.tbody.html(_datatbl(_cache.data, page, _tags.total, _getfilter(), _cache.checked, _perm).join(""));
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
	startup: function(tags, y, m, perm) {
	    _perm = perm;
	    _perm.rows = perm.rows == null || perm.rows <= 0 ? 100 : perm.rows;
	    _tags = tags;
	    _tags.body.html(_getbody(perm).join(""));
	    _tags.tbody = _("maintb");
	    _tags.cal = _("plugCal");
	    _tags.f = _("plugFilter");
	    _tags.ts = _("timestamp");
	    _tags.total = _("plugTotal");
	    _tags.popups = {};
	    _datareq(y, m);
	},
	refresh: function() {
	    _togglePopup();
	    _tags.popups = {};
	    _datareq(_cache.y, _cache.m);
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
	calendar: function(tag) {
	    _togglePopup("cal", tag, undefined, function(obj) {
		return MonthsPopup(function(y, m) {
		    var tmp = _tags.popups[obj];
		    _datareq(y, m);
		    history.replaceState({y:y, m:m}, "", G.getref({plug: _code, year: y, month: m}));
		    _tags.popups = {}; _tags.popups[obj] = tmp;
		}, {year: _cache.y, month: _cache.m, uri: G.getajax({plug: _code, calendar: true})})
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
	delivery_types: function(tag, offset) {
	    _togglePopup("delivery_types", tag, offset, function(obj) {
		return DeliveryTypesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "delivery_type_id");
		})
	    });
	},
	distributors: function(tag, offset) {
	    _togglePopup("distributors", tag, offset, function(obj) {
		return DistributorsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "distr_id");
		})
	    });
	},
	order_types: function(tag, offset) {
	    _togglePopup("order_types", tag, offset, function(obj) {
		return OrderTypesPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "order_type_id");
		})
	    });
	},
	payment_methods: function(tag, offset) {
	    _togglePopup("payment_methods", tag, offset, function(obj) {
		return PaymentMethodsPopup(_cache.data[obj], function(arg, i, ar) {
		    _onpopup(tag, arg, "payment_method_id");
		})
	    });
	},
	more: function(row_no) {
	    var r = _cache.data.rows[row_no-1];
	    Dialog({width: 700, title: lang.orders.caption.format_a(r.doc_no, r.doc_id), body: _detailsbody(r)}).show();
	},
	csv: function() {
	    var ar = [];
	    if( _cache.data != null && Array.isArray(_cache.data._rows) ) {
		_cache.data._rows.forEach(function(r, i) {
		    ar.push(r);
		});
	    }
	    G.tocsv(_code, ar, _perm.csv);
	}
    }
})();


function startup(tag, y, m, perm) {
    PLUG.startup({body: tag}, y, m, perm);
}

window.onpopstate = function(event) {
    window.location.reload(true);
}
