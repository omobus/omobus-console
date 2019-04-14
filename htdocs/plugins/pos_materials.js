/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
/* private properties & methods */
    var _code = "pos_materials";
    var _opt = {
	L: {lines: 8, length: 2, width: 4, radius: 6, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "auto"},
	S: {lines: 6, length: 1, width: 2, radius: 3, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "auto", left: "auto"},
	D: {lines: 8, length: 2, width: 2, radius: 5, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false, top: "32px", left: "550px"}
    };
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
	return 11;
    }

    function _getbody(perm) {
	return "<table class='headerbar' width='100%'><tr><td><h1>" + lang.pos_materials.title + ":&nbsp;&nbsp;" +
	    "<input id='plugfilter' type='text' placeholder='" + lang.everything + "' onkeyup='return PLUG.onfilter(this, event);' />" +
	    "</h1></td><td style='text-align: right;'>" + lang.get_watermark + "&nbsp;<span id='timestamp'>&nbsp;-&nbsp;</span>&nbsp;" +
	    "(<a href='javascript:PLUG.onrefresh();'>" + lang.refresh  + "</a>)" +
	    (perm.add != null?("&nbsp&nbsp;|&nbsp;&nbsp;<a href='javascript:PLUG.add();'>" + lang.pos_materials.add + "</a>"):"") +
	    "</td></tr></table>" +
	    "<table width='100%' class='report'><thead><tr>" + 
	    "<th class='autoincrement'>" + lang.num + "</th>" + 
	    "<th>" + lang.pos_material + "</th>" + 
	    "<th>" + lang.code + "</th>" + 
	    "<th>" + lang.pos_materials.blob + "</th>" + 
	    "<th>" + lang.country + "</th>" + 
	    "<th>" + lang.brand + "</th>" + 
	    "<th>" + lang.placement + "</th>" + 
	    "<th>" + lang.department + "</th>" + 
	    "<th>" + lang.remove.cap + "</th>" + 
	    "<th>" + lang.author + "</th>" + 
	    "<th>" + lang.modified + "</th>" + 
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

    function _initcolorbox() {
	$(".group1").colorbox({rel:'group1',photo:true,preloading:false,maxWidth:"95%",maxHeight:"95%"});
    }

    function _failed(perm, msg) {
	return ["<tr><td colspan='" + _getcolumns(perm) + "' class='message'>" + msg + "</td></tr>"];
    }

    function _success(rows, f, objcache, perm) {
	var ar = [], r, cn, basecn;
	for( var i = 0, x = 1, size = rows ? rows.length : 0; i < size; i++ ) {
	    if( (r = rows[i]) != null && f.is(r) ) {
		ar.push("<tr" + (objcache.getchecked(r.posm_id) ? " class='selected'" : "") + ">");
		ar.push("<td style='cursor:pointer' class='autoincrement' onclick=\"PLUG.oncheckrow(this.parentNode,'" + r.posm_id +
		    "');event.stopPropagation();\">" + r.row_no + "</td>");
		ar.push("<td class='string'>" +
		    (r.owner||perm&&perm.edit ? "<a href='javascript:PLUG.edit(" + r.row_no + ",\"" + r.posm_id + "\");'>" : "") +
		    r.descr +
		    (r.owner||perm&&perm.edit ? "</a>" : "") + "</td>");
		ar.push("<td class='int'>" + r.posm_id + "</td>");
		ar.push("<td class='int' width='60px;'><a class='group1' href='" + G.getajax({plug: _code, posm_id: r.posm_id, blob: true}) + "' title='" + r.descr + "'>" + 
		    (r.size ? G.getnumeric_l(r.size/1024, 1) : "") + "</a></td>");
		ar.push("<td class='ref' width='100px;'>" + G.shielding(r.country) + "</td>");
		ar.push("<td class='ref' width='100px;'>" + G.shielding(r.brand) + "</td>");
		ar.push("<td class='ref' width='200px;'>" + G.shielding(r.placements) + "</td>");
		ar.push("<td class='ref' width='100px;'>" + G.shielding(r.department) + "</td>");
		if( r.hidden ) {
		    ar.push("<td class='bool'>" + lang.plus + "</td>");
		} else if( !(r.owner || (perm && perm.remove)) ) {
		    ar.push("<td class='bool'>&nbsp;</td>");
		} else {
		    ar.push("<td id='aR" + r.row_no + "' class='ref' style='width: 60px; white-space: nowrap;'>");
		    ar.push("<a href='javascript:PLUG.remove(" + r.row_no + ",\"" + r.posm_id + "\");'>" + lang.remove.ref + "</a>");
		    ar.push("</td>");
		}
		ar.push("<td class='string'>" + G.shielding(r.author) + "</td>");
		ar.push("<td class='datetime'>" + G.getdatetime_l(Date.parseISO8601(r.updated_dt)) + "</td>");
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
	var sp = new Spinner(_opt.L).spin(_elem.spin.get(0));
	_elem.spin.show(); tbody.hide();
	_cache = null; // drop the internal cache
	G.xhr("GET", G.getajax({plug: _code}), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		tbody.html(_success(data.rows, f, _getobjcache(), _perm).join(""));
		data.countries_i = data.countries ? data.countries.createIndexBy('country_id') : null;
		data.brands_i = data.brands ? data.brands.createIndexBy('brand_id') : null;
		_cache = data;
		_initcolorbox();
	    } else {
		tbody.html(_failed(_perm, lang.failure).join(""));
	    }
	    _elem.ts.text(G.getdatetime_l(new Date()));
	    tbody.show(); sp.stop(); _elem.spin.hide();
	}).send();
    }

    function _filterdata(tbody, f) {
	if( _cache != null ) {
	    var sp = new Spinner(_opt.L).spin(_elem.spin.get(0));
	    _elem.spin.show(); tbody.hide();
	    setTimeout(function() {
		tbody.html(_success(_cache.rows, f, _getobjcache(), _perm).join(""));
		sp.stop(); _elem.spin.hide(); tbody.show();
	    }, 0);
	}
    }

    function _remove(tbody, row_no, posm_id) {
	var tag = tbody.find("#aR"+row_no), sp = new Spinner(_opt.S);
	tag.html("");
	tag.get(0).appendChild(sp.spin().el);
	G.xhr("DELETE", G.getajax({plug: _code, posm_id: posm_id}), "", function(xhr) {
	    if( xhr.status == 200 ) {
		tag.text(lang.plus);
		_cache.rows[row_no-1].hidden = 1;
	    } else {
		//tag.text("");
	    }
	    sp.stop();
	}).send();
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

    function _add(perm, files) {
	$.each(files, function(i, f) {
	    if( f.type !== 'image/jpeg' ) {
		Toast.show(lang.pos_materials.msg0.format_a(f.name));
	    } else if( perm.add.max_file_size_mb*1024*1024 < f.size ) {
		Toast.show(lang.pos_materials.msg1.format_a(f.name, perm.add.max_file_size_mb));
	    } else {
		_storeBlob({
		    _file: f,
		    _data: _cache,
		    name: f.name.replace(/\.[^/.]+$/, ""),
		    placements: _cloneArray(_cache.placements, null, function(r) {return r.placement_id;})
		});
	    }
	});
    }

    function _edit(perm, row) {
	_context = {
	    _data: _cache,
	    _row: row,
	    posm_id: row.posm_id,
	    name: row.descr,
	    country: (row.country_id ? _cache.countries_i[row.country_id] : null),
	    brand: (row.brand_id ? _cache.brands_i[row.brand_id] : null),
	    placements: _cloneArray(_cache.placements, row.placement_ids, function(r) {return r.placement_id;})
	};
	_showbox(_context, _elem.box, _getbox(lang.pos_materials.caption1.format_a(_context.posm_id), _context));
    }

    function _getbox(title, context) {
	var a = [], t;
	a.push("<div style='width: 550px; margin-top: 30px;' onclick='PLUG.hidepopup();event.stopPropagation();'>");
	a.push("<h1><span>" + title + "</span><span id='spin'></span></h1>");
	a.push("<div class='row'>" + lang.pos_materials.notice + "</div>");
	a.push("<div id='msg' class='row attention gone'></div>");
	a.push("<div class='row'><input type='text' maxlength='192' autocomplete='off' oninput='PLUG.e.caption(this.value)' placeholder='" +
	    lang.pos_materials.placeholder + "' value='" + context.name + "'/></div>");
	if( context._data.countries ) {
	    a.push("<div class='row'>" + lang.country + ":&nbsp;<a id='country' href='javascript:PLUG.e.country();'>" +
		(context.country ? context.country.descr : lang.country_everyone.toLowerCase()) + "</a>");
	    a.push("<div style='float: right'><a id='countrycleanup' class='cleanup' " + (context.country?"":"style='display: none;'") + " href='javascript:PLUG.e._setcountry()'>" +
		lang.remove.ref + "</a></div>");
	    a.push("</div>");
	}
	if( context._data.brands ) {
	    a.push("<div class='row'>" + lang.brand + ":&nbsp;<a id='brand' href='javascript:PLUG.e.brand();'>" +
		(context.brand ? context.brand.descr : lang.brand_everyone.toLowerCase()) + "</a>");
	    a.push("<div style='float: right'><a id='brandcleanup' class='cleanup' " + (context.brand?"":"style='display: none;'") + " href='javascript:PLUG.e._setbrand()'>" +
		lang.remove.ref + "</a></div>");
	    a.push("</div>");
	}
	if( context._data.placements ) {
	    a.push("<div class='row'>" + lang.placement + ":&nbsp;<a id='placement' href='javascript:PLUG.e.placement();'>" +
		_fmtArrayL(context.placements) + "</a></div>");
	}
	a.push("<hr />");
	a.push("<div align='right'><button onclick='PLUG.hidebox();;event.stopPropagation();'>" + lang.back + "</button>&nbsp;&nbsp;<button id='commit' " +
	    "onclick='PLUG.save();;event.stopPropagation();' " + (context.posm_id?"disabled='true'":"") + ">" + lang.save + "</button></div>");
	a.push("<div id='popup' class='ballon' style='display: none; z-index: 99990;' onclick='PLUG.hidepopup();'>" +
	    "<div class='arrow'></div><div class='body' style='min-height: 30px;'></div></div>");
	a.push("</div>");
	return a;
    }

    function _getsimplelist(rows, selected, code, f) {
	var ar = [], i, size, r;
	if( f ) {
	    ar.push("<div class='search'><input type='text' onclick='event.stopPropagation();' maxlength='96' autocomplete='off' " +
		"oninput='PLUG.e._f" + code + "(this.value)' placeholder='" + lang.search + "'></input></div>");
	}
	ar.push("<div class='simplelist'><table id='sl-data'>");
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

    function _storeBlob(context) {
	_context = context;
	_showbox(_context, _elem.box, _getbox(lang.pos_materials.caption0, _context));
    }

    function _checkContext(context) {
	return context.name.isEmpty() || G.getdate(context.b_date) > G.getdate(context.e_date);
    }

    function _save(context, onsuccess) {
	if( context.name.isEmpty() ) {
	    _showmsg(_context._msg, lang.pos_materials.msg2);
	} else if( context.b_date > context.e_date ) {
	    _showmsg(_context._msg, lang.pos_materials.msg3);
	} else {
	    var fd, sp, xhr, t;
	    fd = new FormData();
	    if( context.posm_id ) fd.append("posm_id", context.posm_id);
	    fd.append("name", context.name);
	    if( context._file ) fd.append("blob", context._file, context._file.name);
	    if( context.country ) fd.append("country_id", context.country.country_id);
	    if( context.brand ) fd.append("brand_id", context.brand.brand_id);
	    if( (t = _fmtArray(context.placements, "placement_id")) != null ) fd.append("placement_ids", t);
	    _hidemsg(_context._msg);
	    sp = new Spinner(_opt.D).spin(_context._spin.get(0));
	    xhr = G.xhr(context.posm_id ? "PUT" : "POST", G.getajax({plug: _code, posm_id: context.posm_id}), "", function(xhr) {
		_disable(context._commit, false);
		if( xhr.status == 200 ) {
		    onsuccess();
		} else {
		    _showmsg(_context._msg, lang.pos_materials.msg3);
		}
		sp.stop();
	    });
	    _disable(context._commit, true);
	    xhr.send(fd);
	}
    }

    function _filterSL(value, ar, popup) {
	var tb = popup.find("#sl-data").get(0);
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
	remove: function(row_no, posm_id) {
	    if( _perm ) {
		_remove(_elem.tbody, row_no, posm_id);
	    }
	},
	add: function() {
	    if( _cache && _perm && _perm.add ) {
		var input = $(document.createElement('input'));
		input.bind({
		    change: function() {
			_add(_perm, this.files);
		    }
		});
		input.attr("type", "file");
		input.trigger('click'); // opening dialog
	    }
	},
	drop: function(files) {
	    if( _cache && _perm && _perm.add ) {
		_add(_perm, files);
	    }
	},
	edit: function(row_no, posm_id) {
	    if( _cache && _perm ) {
		_edit(_perm, _cache.rows[row_no-1]);
	    }
	},
	hidebox: function() {
	    _hidebox(_elem.box);
	},
	hidepopup: function() {
	    _hidepopup(_context._popup);
	},
	save: function() {
	    _save(_context, function() {
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
	    caption: function(value) {
		_context.name = value;
		_redrawbox(_context);
	    },
	    brand: function() {
		_showpopup(_context._popup, _elem.box.find("#brand"), _getsimplelist(_context._data.brands, function(r) {
			return _context.brand && r.brand_id == _context.brand.brand_id;
		    }, "brand", true)
		);
	    },
	    placement: function() {
		_showpopup(_context._popup, _elem.box.find("#placement"), _getmultilist(_context.placements, "placement"));
	    },
	    country: function() {
		_showpopup(_context._popup, _elem.box.find("#country"), _getsimplelist(_context._data.countries, function(r) {
			return _context.country && r.country_id == _context.country.country_id;
		    }, "country", false)
		);
	    },

	    _setcountry: function(i) {
		if( i == null ) {
		    _context.country = null;
		    _elem.box.find("#country").text(lang.country_everyone.toLowerCase());
		    _elem.box.find("#countrycleanup").hide();
		} else {
		    _context.country = _context._data.countries[i];
		    _elem.box.find("#country").text(_context.country.descr);
		    _elem.box.find("#countrycleanup").show();
		}
		_redrawbox(_context);
	    },
	    _setbrand: function(i) {
		if( i == null ) {
		    _context.brand = null;
		    _elem.box.find("#brand").text(lang.brand_everyone.toLowerCase());
		    _elem.box.find("#brandcleanup").hide();
		} else {
		    _context.brand = _context._data.brands[i];
		    _elem.box.find("#brand").text(_context.brand.descr);
		    _elem.box.find("#brandcleanup").show();
		}
		_redrawbox(_context);
	    },
	    _fbrand: function(value) {
		_filterSL(value, _context._data.brands, _context._popup);
	    },
	    _fplacement: function(value) {
		_filterML(value, _context.placements, _context._popup);
	    },
	    _chkplacement: function(i, checked) {
		_context.placements[i].checked = checked ? true : null;
		    _elem.box.find("#placement").text(_fmtArrayL(_context.placements, "placement_id"));
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
