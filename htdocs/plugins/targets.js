/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
/* private properties & methods */
    var _code = "targets";
    /*var _opt = {
	L: {lines: 8, length: 2, width: 4, radius: 6, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "auto"},
	S: {lines: 6, length: 1, width: 2, radius: 3, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "auto", left: "auto"},
	D: {lines: 8, length: 2, width: 2, radius: 5, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "32px", left: "705px"}
    };*/
    var _cache = null, _perm = null, _elem = null, _context = null;


    function _showmsg(tag, msg) {
	tag.show(); tag.html(msg);
    }

    function _hidemsg(tag) {
	tag.hide(); tag.html("");
    }

    function _disable(tag, arg) {
	if( arg ) {
	    tag.attr("disabled", true);
	} else {
	    tag.removeAttr("disabled");
	}
    }

    function _getcolumns(perm) {
	return 10;
    }

    function _getbody(perm) {
	return "<table class='headerbar' width='100%'><tr><td><h1>" + lang.targets.title + ":&nbsp;&nbsp;" +
	    "<input id='plugfilter' type='text' placeholder='" + lang.everything + "' onkeyup='return PLUG.onfilter(this, event);' />" +
	    "</h1></td><td style='text-align: right;'>" + lang.received_ts + "&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>&nbsp;" +
	    "(<a href='javascript:PLUG.onrefresh();'>" + lang.refresh  + "</a>)" +
	    (perm.add != null?("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:PLUG.add();'>" + lang.targets.title1 + "</a>"):"") +
	    "</td></tr></table>" +
	    "<table width='100%' class='report'><thead><tr>" + 
	    "<th rowspan='2' class='autoincrement'>" + lang.num + "</th>" + 
	    "<th rowspan='2'>" + lang.targets.subject.caption + "</th>" + 
	    "<th rowspan='2'>" + lang.targets.body.caption + "</th>" + 
	    "<th rowspan='2'>" + lang.targets.type + "</th>" + 
	    "<th colspan='2'>" + lang.validity + "</th>" + 
	    "<th rowspan='2'>" + lang.targets.accounts.caption + "</th>" + 
	    "<th rowspan='2'>" + lang.department + "</th>" + 
	    "<th rowspan='2'>" + lang.remove.cap + "</th>" + 
	    "<th rowspan='2'>" + lang.author + "</th>" + 
	    "</tr><tr>" + 
	    "<th>" + lang.b_date + "</th>" + 
	    "<th>" + lang.e_date + "</th>" + 
	    "</tr>" + G.thnums(_getcolumns(perm)) + "</thead><tbody id=\"maintb\"></tbody></table>" +
	    "<div id='plugspin' style='display: none; padding-top: 30px;'></div>" +
	    "<div id='plugbox' class='dialog' style='display: none;'></div>";
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

    function _fixrows(rows) {
	var i, size, r, d = G.getdate(new Date());
	for( i = 0, size = rows ? rows.length : 0; i < size; i++ ) {
	    if( (r = rows[i]) != null ) {
		r.obsolete = (r.e_date >= d) ? 0 : 1;
		r.inprogress = (!r.obsolete && d > r.b_date) ? 1 : 0;
	    }
	}
    }

    function _failed(perm, msg) {
	return ["<tr class='def'><td colspan='" + _getcolumns(perm) + "' class='message'>" + msg + "</td></tr>"];
    }

    function _checkput(ar, arg) {
	if( arg ) { ar.push(arg); ar.push("<hr/>"); }
    }

    function _accounts(r) {
	var ar = [];
	_checkput(ar, r.regions);
	_checkput(ar, r.cities);
	_checkput(ar, r.retail_chains);
	_checkput(ar, r.channels);
	_checkput(ar, r.potentials);
	ar.push(ar.length || r.accounts > 0 ? lang.targets.accounts.total.format_a(r.accounts) : lang.dash);
	return ar;
    }

    function _success(data, f, objcache, perm) {
	var ar = [], r, cn, basecn, t;
	for( var i = 0, x = 1, size = data.targets ? data.targets.length : 0; i < size; i++ ) {
	    if( (r = data.targets[i]) != null && f.is(r) ) {
		t = r.obsolete ? " disabled" : "";
		ar.push("<tr" + (objcache.getchecked(r.target_id) ? " class='selected'" : "") + ">");
		ar.push("<td style='cursor:pointer' class='autoincrement' onclick=\"PLUG.oncheckrow(this.parentNode,'" + r.target_id +
		    "');event.stopPropagation();\">" + r.row_no + "</td>");
		ar.push("<td class='string" + t + "' width='180'>" + 
		    (!r.obsolete&&!r.inprogress&&(r.owner||perm&&perm.edit) ? "<a href='javascript:PLUG.edit(" + r.row_no + ",\"" + r.target_id + "\");'>" : "") +
		    G.shielding(r.subject) + 
		    (!r.obsolete&&!r.inprogress&&(r.owner||perm&&perm.edit) ? "</a>" : "") + "</td>");
		ar.push("<td class='string" + t + "'>" + G.shielding(r.body) + "</td>");
		ar.push("<td class='ref" + t + "' width='130''>" + (r.target_type ? r.target_type : "") + "</td>");
		ar.push("<td class='date" + t + "'>" + G.getdate_l(Date.parseISO8601(r.b_date)) + "</td>");
		ar.push("<td class='date" + t + "'>" + G.getdate_l(Date.parseISO8601(r.e_date)) + "</td>");
		ar.push("<td class='ref" + t + "' width='230px;'>" + _accounts(r).join("") + "</td>");
		ar.push("<td class='ref" + t + "' width='100px;'>" + G.shielding(r.department) + "</td>");
		if( r.hidden ) {
		    ar.push("<td class='bool'>" + lang.plus + "</td>");
		} else if( !(r.owner || (perm && perm.remove)) ) {
		    ar.push("<td class='bool'>&nbsp;</td>");
		} else {
		    ar.push("<td id='aR" + r.row_no + "' class='ref' style='width: 60px; white-space: nowrap;'>");
		    ar.push("<a href='javascript:PLUG.remove(" + r.row_no + ",\"" + r.target_id + "\");'>" + lang.remove.ref + "</a>");
		    ar.push("</td>");
		}
		ar.push("<td class='string" + t + "'>" + r.author + "</td>");
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
	//var sp = new Spinner(_opt.L).spin(_elem.spin.get(0));
	//_elem.spin.show(); tbody.hide();
ProgressDialog.show();
	_cache = null; // drop the internal cache
	G.xhr("GET", G.getdataref({plug: _code}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		_fixrows(data.targets);
		data.types_i = data.types ? data.types.createIndexBy('target_type_id') : null;
		data.departments_i = data.departments ? data.departments.createIndexBy('dep_id') : null;
		tbody.html(_success(data, f, _getobjcache(), _perm).join(""));
		_cache = data;
	    } else {
		tbody.html(_failed(_perm, lang.failure).join(""));
	    }
	    _elem.ts.text(G.getdatetime_l(new Date()));
ProgressDialog.hide();
	    //tbody.show(); sp.stop(); _elem.spin.hide();
	}).send();
    }

    function _filterdata(tbody, f) {
	if( _cache != null ) {
	    //var sp = new Spinner(_opt.L).spin(_elem.spin.get(0));
	    //_elem.spin.show(); tbody.hide();
ProgressDialog.show();
	    setTimeout(function() {
		tbody.html(_success(_cache, f, _getobjcache(), _perm).join(""));
		//sp.stop(); _elem.spin.hide(); tbody.show();
ProgressDialog.hide();
	    }, 0);
	}
    }

    function _remove(tbody, row_no, target_id) {
	var tag = tbody.find("#aR"+row_no)/*, sp = new Spinner(_opt.S)*/;
	tag.html("");
	//tag.get(0).appendChild(sp.spin().el);
ProgressDialog.show();
	G.xhr("DELETE", G.getdataref({plug: _code, target_id: target_id}), "", function(xhr) {
	    if( xhr.status == 200 ) {
		tag.text(lang.plus);
		_cache.targets[row_no-1].hidden = 1;
	    } else {
		//tag.text("");
	    }
	    //sp.stop();
ProgressDialog.hide();
	}).send();
    }

    function _startdate(today, perm) {
	return new Date(new Date(today.getYear()+1900, today.getMonth(), today.getDate()).getTime() + 
	    86400000*(perm&&perm.offset!=null?perm.offset:1));
    }

    function _stopdate(today, perm) {
	return new Date(today.getFullYear(), today.getMonth() + (perm&&perm.depth!=null?perm.depth:1) + 1, 0);
    }

    function _cloneArray(ar, s, getid) {
	var clone = ar != null ? ar.slice() : null;
	var x = s != null ? s.split(',') : null;
	for( var i = 0, s = clone != null ? clone.length : 0; i < s; i++ ) {
	    clone[i].checked = x != null && x.indexOf(getid(clone[i])) >= 0 ? true : null;
	}
	return clone;
    }

    function _countArray(ar) {
	var x = 0;
	for( var i = 0, s = ar ? ar.length : 0; i < s; i++ ) {
	    if( ar[i].checked ) {
		x++
	    }
	}
	return x;
    }

    function _cleanupArray(ar) {
	for( var i = 0, s = ar ? ar.length : 0; i < s; i++ ) {
	    ar[i].checked = null
	}
    }

    function _fmtArray(ar, key) {
	var x;
	for( var i = 0, s = ar ? ar.length : 0; i < s; i++ ) {
	    if( ar[i].checked ) {
		if( x != null ) {
		    x += (","+ar[i][key]);
		} else {
		    x = ar[i][key];
		}
	    }
	}
	return x;
    }

    function _fmtArrayL(ar) {
	var x;
	for( var i = 0, s = ar ? ar.length : 0; i < s; i++ ) {
	    if( ar[i].checked ) {
		if( x != null ) {
		    x += (", "+ar[i].descr);
		} else {
		    x = ar[i].descr;
		}
	    }
	}
	return x ? x : lang.everything;
    }

    function _createContext(row, data, perm) {
	var today = new Date();
	var a = {
	    _b_date: _startdate(today, perm.add),
	    _e_date: _stopdate(today, perm.add),
	    _data: data,
	    _row: row
	};
	if( row ) {
	    a.target_id = row.target_id;
	    a.subject = row.subject;
	    a.body = row.body;
	    if( (a.type = data.types_i[row.target_type_id]) == null ) {
		a.type = data.types[0];
	    }
	    a.dep = (row.dep_id ? data.departments_i[row.dep_id] : null);
	    a.b_date = Date.parseISO8601(row.b_date);
	    a.e_date = Date.parseISO8601(row.e_date);
	    a.regions = _cloneArray(data.regions, row.region_ids, function(r) {return r.region_id;});
	    a.cities = _cloneArray(data.cities, row.city_ids, function(r) {return r.city_id;});
	    a.retail_chains = _cloneArray(data.retail_chains, row.rc_ids, function(r) {return r.rc_id;});
	    a.channels = _cloneArray(data.channels, row.chan_ids, function(r) {return r.chan_id;});
	    a.potentials = _cloneArray(data.potentials, row.poten_ids, function(r) {return r.poten_id;});
	    a.accounts = _cloneArray(data.accounts, row.account_ids, function(r) {return r.account_id;});
	} else {
	    a.subject = '';
	    a.body = '';
	    a.type = data.types[0];
	    a.dep = null;
	    a.b_date = a._b_date;
	    a.e_date = new Date(a._b_date.getFullYear(), a._b_date.getMonth() + 1, 0);
	    a.regions = _cloneArray(data.regions, null, function(r) {return r.region_id;});
	    a.cities = _cloneArray(data.cities, null, function(r) {return r.city_id;});
	    a.retail_chains = _cloneArray(data.retail_chains, null, function(r) {return r.rc_id;});
	    a.channels = _cloneArray(data.channels, null, function(r) {return r.chan_id;});
	    a.potentials = _cloneArray(data.potentials, null, function(r) {return r.poten_id;});
	    a.accounts = _cloneArray(data.accounts, null, function(r) {return r.account_id;});
	}
	return a;
    }

    function _checkContext(context) {
	return context.subject.isEmpty() || context.body.isEmpty() || G.getdate(context.b_date) > G.getdate(context.e_date);
    }

    function _getbox(title, context) {
	var a = [], t;
	a.push("<div style='width: 705px; margin-top: 30px;' onclick='PLUG.hidepopup();event.stopPropagation();'>");
	a.push("<h1><span>" + title + "</span><span id='spin'></span></h1>");
	a.push("<div class='row'>" + lang.targets.notice + "</div>");
	a.push("<div id='msg' class='row attention gone'></div>");
	a.push("<div class='row'><input type='text' maxlength='128' autocomplete='off' oninput='PLUG.e.subject(this.value)' placeholder='" + 
	    lang.targets.subject.placeholder + "' value='" + context.subject + "'/></div>");
	a.push("<div class='row'><textarea rows='3' maxlength='2048' autocomplete='off' oninput='PLUG.e.body(this.value)' placeholder='" + 
	    lang.targets.body.placeholder + "'>" + context.body + "</textarea></div>");
	a.push("<div class='row'>" + lang.targets.type + ":&nbsp;<a id='type' href='javascript:PLUG.e.type();'>" + 
	    context.type.descr + "</a></div>");
	a.push("<div class='row'>" + lang.validity + ":&nbsp;<a id='b_date' href='javascript:PLUG.e.b_date();'>" +
	    G.getlongday_l(context.b_date).toLowerCase() + "</a>&nbsp;-&nbsp;<a id='e_date' href='javascript:PLUG.e.e_date();'>" + 
	    G.getlongday_l(context.e_date).toLowerCase() + "</a></div>");
	if( context._data.regions ) {
	    a.push("<div class='row'>" + lang.region + ":&nbsp;<a id='region' href='javascript:PLUG.e.region();'>" + 
		_fmtArrayL(context.regions) + "</a></div>");
	}
	if( context._data.cities ) {
	    a.push("<div class='row'>" + lang.city + ":&nbsp;<a id='city' href='javascript:PLUG.e.city();'>" + 
		_fmtArrayL(context.cities) + "</a></div>");
	}
	if( context._data.retail_chains ) {
	    a.push("<div class='row'>" + lang.rc_name + ":&nbsp;<a id='rc' href='javascript:PLUG.e.rc();'>" + 
		_fmtArrayL(context.retail_chains) + "</a></div>");
	}
	if( context._data.channels ) {
	    a.push("<div class='row'>" + lang.chan_name + ":&nbsp;<a id='chan' href='javascript:PLUG.e.chan();'>" + 
		_fmtArrayL(context.channels) + "</a></div>");
	}
	if( context._data.potentials ) {
	    a.push("<div class='row'>" + lang.poten + ":&nbsp;<a id='poten' href='javascript:PLUG.e.poten();'>" + 
		_fmtArrayL(context.potentials) + "</a></div>");
	}
	if( context._data.accounts ) {
	    t = _countArray(context.accounts);
	    console.log("accounts array count={0}".format_a(t));
	    a.push("<div class='row'>" + lang.targets.accounts.caption + ":&nbsp;<a id='account' href='javascript:PLUG.e.a();'>" + 
		(t ? lang.targets.ref1.format_a(t) : lang.targets.ref0) + "</a>");
	    a.push("<div style='float: right'><a id='acleanup' class='cleanup' " + (t?"":"style='display: none;'") + " href='javascript:PLUG.e._cleanup()'>" + 
		lang.remove.ref + "</a></div>");
	    a.push("</div>");
	}
	if( context._data.departments ) {
	    a.push("<div class='row'>" + lang.department + ":&nbsp;<a id='dep' href='javascript:PLUG.e.dep();'>" + 
		(context.dep ? context.dep.descr :  lang.dep_everyone.toLowerCase()) + "</a>");
	    a.push("<div style='float: right'><a id='depcleanup' class='cleanup' " + (context.dep?"":"style='display: none;'") + " href='javascript:PLUG.e._setdep()'>" + 
		lang.remove.ref + "</a></div>");
	    a.push("</div>");
	}
	a.push("<hr />");
	a.push("<div align='right'><button onclick='PLUG.hidebox();'>" + lang.back + "</button>&nbsp;&nbsp;<button id='commit' " + 
	    "onclick='PLUG.save();' disabled='true'>" + lang.save + "</button></div>");
	a.push("<div id='popup' class='ballon' style='display: none; z-index: 99990;' onclick='PLUG.hidepopup();'>" +
	    "<div class='arrow'></div><div class='body' style='min-height: 30px;'></div></div>");
	a.push("</div>");
	return a;
    }

    function _getsimplelist(rows, selected, code) {
	var ar = [], i, size, r;
	ar.push("<div class='simplelist'><table>");
	for( i = 0, size = rows.length; i < size; i++ ) {
	    if( (r = rows[i]) != null ) {
		ar.push("<tr " + (selected(r) ? "class='selected'" : ("onclick='PLUG.e._set" + code +"(" + i + ")'")) +
		    "><td>" + r.descr + "</td></tr>");
	    }
	}
	ar.push("</table></div>");
	return ar;
    }

    function _getmultilist(rows, code) {
	var ar = [], i, size, r;
	ar.push("<div class='search'><input type='text' onclick='event.stopPropagation();' maxlength='96' autocomplete='off' " + 
	    "oninput='PLUG.e._f" + code + "(this.value)' placeholder='" + lang.search + "'></input></div>");
	ar.push("<div class='multilist'><table id='ml-data'>");
	for( i = 0, size = rows.length; i < size; i++ ) {
	    if( (r = rows[i]) != null ) {
		ar.push("<tr " + (r.checked?"class='selected' ":"") + "onclick='PLUG.e._chk" + code +"(" + i + 
		    ",PLUG.ischecked($(this)));event.stopPropagation();'><td>" + r.descr + 
		    "</td><td class='mark'>&bull;</td></tr>");
	    }
	}
	ar.push("</table></div>");
	ar.push("<div class='placeholder' style='display:none'></div>");
	return ar;
    }

    function _showbox(context, box, ar) {
	box.html(ar.join(''));
	context._commit = box.find("#commit");
	context._spin = box.find("#spin");
	context._msg = box.find("#msg");
	context._popup = box.find("#popup");
	box.show();
    }

    function _hidebox(box) {
	if( box != null && box.is(":visible") ) {
	    box.hide();
	}
    }

    function _redrawbox(context) {
	_disable(context._commit, _checkContext(context));
	_hidemsg(context._msg);
    }

    function _showpopup(popup, tag, ar) {
	if( popup.is(":visible") ) {
	    popup.hide();
	} else {
	    var pos = tag.position();
	    popup.find(".body").html(ar.join(''));
	    popup.css({top: pos.top + tag.height(), left: pos.left + (tag.width() - popup.width())/2});
	    popup.show();
	}
    }

    function _hidepopup(popup) {
	if( popup != null && popup.is(":visible") ) {
	    popup.hide();
	}
    }

    function _savetarget(context, onsuccess) {
	var params = {
	    subject: context.subject, body: context.body,
	    b_date: G.getdate(context.b_date), e_date: G.getdate(context.e_date),
	    type_id: context.type.target_type_id,
	    dep_id: context.dep ? context.dep.dep_id : null,
	    rc_ids: _fmtArray(context.retail_chains, "rc_id"),
	    chan_ids: _fmtArray(context.channels, "chan_id"),
	    poten_ids: _fmtArray(context.potentials, "poten_id"),
	    region_ids: _fmtArray(context.regions, "region_id"),
	    city_ids: _fmtArray(context.cities, "city_id"),
	    account_ids: _fmtArray(context.accounts, "account_id")
	};
	_hidemsg(_context._msg);
	if( params.subject.isEmpty() ) {
	    _showmsg(_context._msg, lang.errors.target.subject);
	} else if( params.body.isEmpty() ) {
	    _showmsg(_context._msg, lang.errors.target.body);
	} else if( params.type_id.isEmpty() ) {
	    _showmsg(_context._msg, lang.errors.target.type);
	} else if( params.b_date > params.e_date ) {
	    _showmsg(_context._msg, lang.errors.target.date);
	} else {
	    //var sp = new Spinner(_opt.D).spin(_context._spin.get(0));
ProgressDialog.show();
	    var xhr = G.xhr(context.target_id ? "PUT" : "POST", G.getdataref({plug: _code, target_id: context.target_id}), "", function(xhr) {
		_disable(context._commit, false);
		if( xhr.status == 200 ) {
		    onsuccess();
		} else {
		    _showmsg(_context._msg, lang.errors.runtime);
		}
		//sp.stop();
ProgressDialog.hide();
	    });
	    _disable(context._commit, true);
params._datetime = G.getdatetime(new Date());
	    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	    xhr.send(G.formParamsURI(params));
	}
    }

    function _filterML(value, ar, popup) {
	var tb = popup.find("#ml-data").get(0);
	var ph = popup.find(".placeholder").get(0);
	var f = new Filter(value, true);
	var empty = true;
	for( var i = 0; i < ar.length; i++ ) {
	    if( f.is(ar[i]) ) {
		tb.rows[i].style.display = null;
		empty = false;
	    } else {
		tb.rows[i].style.display = "none";
	    }
	}
	ph.style.display = empty ? null : "none";
	ph.innerHTML = empty ? lang.no_results.format_a(value) : "";
    }

    function _a(context, files, tag, cleanup) {
	$.each(files, function(i, f) {
	    if( f.type === 'text/plain' ) {
		var reader = new FileReader();
		reader.onload = (function(theFile) {
		    return function(e) {
			var ar, r, t, idx = {};
			if( (ar = e.target.result.replace(/\t|\r/g, '').split('\n')) != null ) {
			    for( var i = 0, s = ar.length; i < s; i++ ) {
				if( (r = ar[i]).length > 0 ) {
				    idx[r] = true;
				}
			    }
			    for( var i = 0, s = context.accounts.length; i < s; i++ ) {
				r = context.accounts[i];
				//if( ar.indexOf(r.account_id) >= 0 || ar.indexOf(r.code) >= 0 ) {
				if( idx[r.account_id] === true ) {
				    r.checked = true;
				}
			    }
			}
			tag.text((t = _countArray(context.accounts)) ? lang.targets.ref1.format_a(t) : lang.targets.ref0);
			if( t ) cleanup.show(); else cleanup.hide();
			_redrawbox(context);
		    };
		})(f);
		reader.readAsText(f);
	    }
	});
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
	remove: function(row_no, target_id) {
	    if( _perm ) {
		_remove(_elem.tbody, row_no, target_id);
	    }
	},
	add: function() {
	    if( _cache && _perm && _perm.add ) {
		_context = _createContext(null, _cache, _perm);
		_showbox(_context, _elem.box, _getbox(lang.targets.title2, _context));
	    }
	},
	edit: function(row_no, target_id) {
	    if( _cache ) {
		_context = _createContext(_cache.targets[row_no-1], _cache, _perm);
		_showbox(_context, _elem.box, _getbox(lang.targets.title3.format_a(_context.target_id), _context));
	    }
	},
	hidebox: function() {
	    _hidebox(_elem.box);
	},
        hidepopup: function() {
	    _hidepopup(_context._popup);
        },
	save: function() {
	    _savetarget(_context, function() {
		    _hidebox(_elem.box);
		    _setdata(_elem.tbody, new Filter(_elem.f.val()));
		}
	    );
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
	},

	ischecked: function(tag) {
	    var x;
	    if( (x = tag.hasClass("selected")) ) {
		tag.removeClass("selected");
	    } else {
		tag.addClass("selected");
	    }
	    return !x;
	},

	e: {
	    subject: function(value) {
		_context.subject = value;
		_redrawbox(_context);
	    },
	    body: function(value) {
		_context.body = value;
		_redrawbox(_context);
	    },
	    type: function() {
		_showpopup(_context._popup, _elem.box.find("#type"), _getsimplelist(_context._data.types, function(r) {
			return r.target_type_id == _context.type.target_type_id;
		    }, "type")
		);
	    },
	    dep: function() {
		_showpopup(_context._popup, _elem.box.find("#dep"), _getsimplelist(_context._data.departments, function(r) {
			return _context.dep && r.dep_id == _context.dep.dep_id;
		    }, "dep")
		);
	    },
	    b_date: function() {
		_context._cal = new DailyCalendar("PLUG.e._refb_date", "PLUG.e._setb_date").
		    setperiod(_context._b_date, _context._e_date);
		_showpopup(_context._popup, _elem.box.find("#b_date"), _context._cal.build(_context.b_date));
	    },
	    e_date: function() {
		_context._cal = new DailyCalendar("PLUG.e._refe_date", "PLUG.e._sete_date").
		    setperiod(_context.b_date, _context._e_date);
		_showpopup(_context._popup, _elem.box.find("#e_date"), _context._cal.build(_context.e_date));
	    },
	    region: function() {
		_showpopup(_context._popup, _elem.box.find("#region"), _getmultilist(_context.regions, "region"));
	    },
	    city: function() {
		_showpopup(_context._popup, _elem.box.find("#city"), _getmultilist(_context.cities, "city"));
	    },
	    rc: function() {
		_showpopup(_context._popup, _elem.box.find("#rc"), _getmultilist(_context.retail_chains, "rc"));
	    },
	    chan: function() {
		_showpopup(_context._popup, _elem.box.find("#chan"), _getmultilist(_context.channels, "chan"));
	    },
	    poten: function() {
		_showpopup(_context._popup, _elem.box.find("#poten"), _getmultilist(_context.potentials, "poten"));
	    },
	    a: function() {
		var input = $(document.createElement('input'));
		input.bind({
		    change: function() {
			_a(_context, this.files, _elem.box.find("#account"), _elem.box.find("#acleanup"));
		    }
		});
		input.attr("type", "file");
		input.attr("accept", ".txt");
		input.trigger('click'); // opening dialog
	    },
	    _settype: function(i) {
		_context.type = _context._data.types[i];
		_elem.box.find("#type").text(_context.type.descr);
		_redrawbox(_context);
	    },
	    _setdep: function(i) {
		if( i == null ) {
		    _context.dep = null;
		    _elem.box.find("#dep").text(lang.dep_everyone);
		    _elem.box.find("#depcleanup").hide();
		} else {
		    _context.dep = _context._data.departments[i];
		    _elem.box.find("#dep").text(_context.dep.descr);
		    _elem.box.find("#depcleanup").show();
		}
		_redrawbox(_context);
	    },
	    _refb_date: function(month, year) {
		_context._popup.find(".body").html(_context._cal.refresh(month, year).join(''));
	    },
	    _setb_date: function(date) {
		_context.b_date = date instanceof Date ? date : Date.parseISO8601(date);
		_elem.box.find("#b_date").text(G.getlongday_l(_context.b_date).toLowerCase());
		_redrawbox(_context);
	    },
	    _refe_date: function(month, year) {
		_context._popup.find(".body").html(_context._cal.refresh(month, year).join(''));
	    },
	    _sete_date: function(date) {
		_context.e_date = date instanceof Date ? date : Date.parseISO8601(date);
		_elem.box.find("#e_date").text(G.getlongday_l(_context.e_date).toLowerCase());
		_redrawbox(_context);
	    },
	    _fregion: function(value) {
		_filterML(value, _context.regions, _context._popup);
	    },
	    _fcity: function(value) {
		_filterML(value, _context.cities, _context._popup);
	    },
	    _frc: function(value) {
		_filterML(value, _context.retail_chains, _context._popup);
	    },
	    _fchan: function(value) {
		_filterML(value, _context.channels, _context._popup);
	    },
	    _fpoten: function(value) {
		_filterML(value, _context.potentials, _context._popup);
	    },
	    _chkregion: function(i, checked) {
		_context.regions[i].checked = checked ? true : null;
		_elem.box.find("#region").text(_fmtArrayL(_context.regions, "region_id"));
		_redrawbox(_context);
	    },
	    _chkcity: function(i, checked) {
		_context.cities[i].checked = checked ? true : null;
		_elem.box.find("#city").text(_fmtArrayL(_context.cities, "city_id"));
		_redrawbox(_context);
	    },
	    _chkrc: function(i, checked) {
		_context.retail_chains[i].checked = checked ? true : null;
		_elem.box.find("#rc").text(_fmtArrayL(_context.retail_chains, "rc_id"));
		_redrawbox(_context);
	    },
	    _chkchan: function(i, checked) {
		_context.channels[i].checked = checked ? true : null;
		_elem.box.find("#chan").text(_fmtArrayL(_context.channels, "chan_id"));
		_redrawbox(_context);
	    },
	    _chkpoten: function(i, checked) {
		_context.potentials[i].checked = checked ? true : null;
		_elem.box.find("#poten").text(_fmtArrayL(_context.potentials, "poten_id"));
		_redrawbox(_context);
	    },
	    _cleanup: function() {
		_cleanupArray(_context.accounts);
		_elem.box.find("#account").text(lang.targets.ref0);
		_elem.box.find("#acleanup").hide();
		_redrawbox(_context);
	    }
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
	ts: tag.find("#timestamp"),
	box: tag.find("#plugbox")
    }, perm);
    PLUG.refresh();
}
