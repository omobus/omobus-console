/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

PLUG.registerRef("photo", (function() {
    /* private properties & methods */
    var _cache = {}; // internal cache object for preventing reloading data
    var _columns = 11;

    function _gettable() {
	var ar = [];
	ar.push("<table width='100%' class='report'><thead><tr>");
	ar.push("<th class='autoincrement'>", lang.num, "</th>");
	ar.push("<th class='time'>", lang.created_time, "</th>");
	ar.push("<th>", lang.a_code, "</th>");
	ar.push("<th>", lang.a_name, "</th>");
	ar.push("<th>", lang.address, "</th>");
	ar.push("<th>", lang.placement, "</th>");
	ar.push("<th>", lang.asp_type, "</th>");
	ar.push("<th>", lang.brand, "</th>");
	ar.push("<th>", lang.photos.type, "</th>");
	ar.push("<th width='95px'>", lang.photo, "</th>");
	ar.push("<th>", lang.note, "</th>");
	ar.push("</tr>", G.thnums(_columns), "</thead>");
	ar.push("<tbody id='xztb'></tbody></table>");
	return ar;
    }

    function _datatbl(data, u_id, date, checked) {
	var ar = [], r, k, xs;
	for( var i = 0, size = Array.isArray(data.rows) ? data.rows.length : 0; i < size; i++ ) {
	    r = data.rows[i];
	    xs = typeof r.revoked != 'undefined' && r.revoked ? ' strikethrough' : '';
	    k = "{0}${1}${2}".format_a(u_id, G.getdate(date), r.doc_id);
	    ar.push("<tr ", (typeof checked != 'undefined' && checked[k]) ? "class='selected'" : "", ">");
	    ar.push("<td class='clickable autoincrement' onclick='PLUG.getRef(\"photo\").checkrow(this.parentNode,\"",
		k, "\")'>", r.row_no, "</td>");
	    ar.push("<td class='time", xs, "'>", G.gettime_l(Date.parseISO8601(r.fix_dt)), "</td>");
	    ar.push("<td class='int", xs, "'>", G.shielding(r.a_code), "</td>");
	    ar.push("<td class='string", xs, "'>", G.shielding(r.a_name), "</td>");
	    ar.push("<td class='string", xs, "'>", G.shielding(r.address), "</td>");
	    ar.push("<td class='ref", xs, "'>", G.shielding(r.placement), "</td>");
	    ar.push("<td class='ref", xs, "'>", G.shielding(r.asp_type), "</td>");
	    ar.push("<td class='ref", xs, "'>", G.shielding(r.brand), "</td>");
	    ar.push("<td class='ref", xs, "'>", G.shielding(r.photo_type), "</td>");
	    ar.push("<td class='ref'>");
	    if( String.isEmpty(r.blob_id) ) {
		ar.push("&nbsp;");
	    } else {
		ar.push("<img class='clickable' onclick='PLUG.getRef(\"photo\").slideshow(", i, ")' height='90px' src='",
		    G.getdataref({plug: "tech", blob: "yes", thumb: "yes", blob_id: r.blob_id}), "' />");
	    }
	    ar.push("</td>");
	    ar.push("<td class='string", xs, "'>");
	    if( !String.isEmpty(r.doc_note) ) {
		ar.push("<div class='row'>", G.shielding(r.doc_note), "</div>");
	    }
	    if( Array.isArray(r.photo_params) && r.photo_params.length > 0 ) {
		if( !String.isEmpty(r.doc_note) ) {
		    ar.push("<hr/>");
		}
		r.photo_params.forEach(function(val, index) {
		    if( index > 0 ) { ar.push("<hr/>"); }
		    ar.push("<div class='row remark'>", G.shielding(val), "</div>");
		});
	    }
	    ar.push("</td>");
	}
	if( ar.length == 0 ) {
	    ar = ["<tr class='def'><td colspan='", _columns, "' class='message'>", lang.empty, "</td></tr>"];
	}
	if( typeof data.data_ts == 'string' ) {
	    ar.push("<tr class='def'><td colspan='", _columns, "' class='watermark'>", lang.data_ts, "&nbsp;", data.data_ts, "</td></tr>");
	}
	return ar;
    }

    function _getexplain(r) {
	var ar = [];
	ar.push("<div>", lang.a_code, ":&nbsp;", G.shielding(r.a_code), "</div>");
	ar.push("<h1>", G.shielding(r.a_name), "</h1>");
	ar.push("<div>", G.shielding(r.address), "</div>");
	if( !String.isEmpty(r.rc) ) {
	    ar.push("<div>", lang.rc_name, ":&nbsp;", G.shielding(r.rc), "</div>");
	}
	if( !String.isEmpty(r.chan) ) {
	    ar.push("<div>", lang.chan_name, ":&nbsp;", G.shielding(r.chan), "</div>");
	}
	if( !String.isEmpty(r.poten) ) {
	    ar.push("<div>", lang.poten, ":&nbsp;", G.shielding(r.poten), "</div>");
	}
	ar.push("<hr/>");
	ar.push("<div>", lang.placement, ":&nbsp;", G.shielding(r.placement, lang.dash), "</div>");
	if( !String.isEmpty(r.brand) ) {
	    ar.push("<div>", lang.brand, ":&nbsp;", G.shielding(r.brand), "</div>");
	}
	if( !String.isEmpty(r.photo_type) ) {
	    ar.push("<div>", lang.photos.type, ":&nbsp;", G.shielding(r.photo_type), "</div>");
	}
	if( Array.isArray(r.photo_params) && r.photo_params.length > 0 ) {
	    r.photo_params.forEach(function(val, index) {
		ar.push("<div>", "({0}) {1}".format_a(index+1, G.shielding(val)), "</div>");
	    });
	}
	if( !String.isEmpty(r.doc_note) ) {
	    ar.push("<div>", G.shielding(r.doc_note), "</div>");
	}
	ar.push("<hr/>");
        ar.push("<div>", lang.fix_date, ":&nbsp;", G.getdatetime_l(Date.parseISO8601(r.fix_dt)), "</div>");
	if( typeof __allowTargetCreation != 'undefined' && __allowTargetCreation && (typeof r.revoked == 'undefined' || !r.revoked) ) {
	    ar.push("<br/><br/>");
	    ar.push("<div id='spin:", r.blob_id, "' class='spinner'></div>");
	    ar.push("<h2>", lang.targets.title2, "</h2>");
	    ar.push("<div>", lang.notices.target, "</div>");
	    ar.push("<div class='row attention gone' id='alert:", r.blob_id, "'></div>");
	    ar.push("<div class='row'>");
	    ar.push("<input id='sub:", r.blob_id, "' type='text' maxlength='128' autocomplete='off' oninput='PLUG.getRef(\"photo\").target.set(",
		r.blob_id, ",\"sub\",this.value)' placeholder='", lang.targets.subject.placeholder, "'/>");
	    ar.push("</div>");
	    ar.push("<div class='row'>");
	    ar.push("<textarea id='msg:", r.blob_id, "' rows='5' maxlength='2048' autocomplete='off' oninput='PLUG.getRef(\"photo\").target.set(", r.blob_id,
		",\"msg\",this.value)' placeholder='", lang.targets.body.placeholder, "'></textarea>");
	    ar.push("</div>");
	    ar.push("<div class='row'>");
	    ar.push("<label class='checkbox'>");
	    ar.push("<input type='checkbox' id='strict:", r.blob_id, "' onchange='PLUG.getRef(\"photo\").target.set(", r.blob_id, ",\"strict\",this.checked)' />");
	    ar.push("<div class='checkbox__text'>", lang.targets.strict, "</div>");
	    ar.push("</label>");
	    ar.push("</div>");
	    ar.push("<div class='row'>");
	    ar.push("<label class='checkbox'>");
	    ar.push("<input type='checkbox' id='urgent:", r.blob_id, "' onchange='PLUG.getRef(\"photo\").target.set(", r.blob_id, ",\"urgent\",this.checked)'",
		(typeof __allowUrgentActivities != 'undefined' && __allowUrgentActivities) ? "" : " disabled='disabled'", " />");
	    ar.push("<div class='checkbox__text'>", lang.targets.urgent, "</div>");
	    ar.push("</label>");
	    ar.push("</div>");
	    ar.push("<br/>");
	    ar.push("<div align='center'><button id='commit:", r.blob_id, "' onclick='PLUG.getRef(\"photo\").target.create(\"", r.doc_id, "\",", r.blob_id,
		");' disabled='true'>", lang.save, "</button></div>");
	}
	return ar;
    }

    function _getparam(key) {
	if( _cache.targets == null ) {
	    _cache.targets = {};
	    _cache.targets[key] = {};
	} else if( _cache.targets[key] == null ) {
	    _cache.targets[key] = {};
	}
	return _cache.targets[key];
    }

    function _checktarget(tag, params) {
	tag.disabled = String.isEmpty(params.sub) || String.isEmpty(params.msg);
    }

    function _createtarget(tags, doc_id, params) {
	/* check params: */
	tags.alarm.hide();
	if( String.isEmpty(params.sub) ) {
	    tags.alarm.html(lang.errors.target.sub);
	    tags.alarm.show();
	} else if( String.isEmpty(params.msg) ) {
	    tags.alarm.html(lang.errors.target.body);
	    tags.alarm.show();
	} else {
	    var xhr = G.xhr("POST", G.getdataref({plug: "tech", doc_id: doc_id}), "", function(xhr) {
		if( xhr.status == 200 ) {
		    params.sub = null;
		    params.msg = null;
		    params.strict = null;
		    params.urgent = null;
		    tags.sub.value = "";
		    tags.msg.value = "";
		    tags.strict.checked = false;
		    tags.urgent.checked = false;
		    Toast.show(lang.success.target);
		} else {
		    tags.commit.disabled = false;
		    tags.alarm.html(xhr.status == 409 ? lang.errors.target.exist : lang.errors.runtime);
		    tags.alarm.show();
		}
		tags.spin.hide();
	    });
	    tags.spin.show();
	    params.doc_id = doc_id;
	    params._datetime = G.getdatetime(new Date());
	    tags.commit.disabled = true;
	    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	    xhr.send(G.formParamsURI(params));
	}
    }


    /* public properties & methods */
    return {
	getcaption: function() { return lang.doctypes.photo; },
	getbody: function() { return _gettable().join(""); },

	setdata: function(body, user_id, date, cb) {
	    var tbody = _("xztb");
	    if( typeof _cache.data == 'undefined' ) {
		_cache.data = {};
	    }
	    if( _cache.data[user_id] != null ) { // sets data from the internal cache
		tbody.html(_datatbl(_cache.data[user_id], user_id, date, _cache.checked).join(""));
		_cache.ptr = _cache.data[user_id].rows;
	    } else {
		ProgressDialog.show();
		_cache.data[user_id] = _cache.ptr = null; // drops the internal cache
		G.xhr("GET", G.getdataref({plug: "tech", code: "tech_photos", user_id: user_id, date: G.getdate(date)}), "json", function(xhr, data) {
		    if( xhr.status == 200 &&  data != null && typeof data == 'object' ) {
			tbody.html(_datatbl(data, user_id, date, _cache.checked).join(""));
			_cache.data[user_id] = data;
			_cache.ptr = _cache.data[user_id].rows;
		    } else {
			tbody.html(["<tr class='def'><td colspan='", _columns, "' class='message'>", lang.failure, "</td></tr>"].join(""));
		    }
		    ProgressDialog.hide();
		    cb();
		}).send();
	    }
	},

	checkrow: function(tag, row_id) {
	    G.checkrow(tag, function(arg) {
		if( typeof _cache.checked == 'undefined' ) {
		    _cache.checked = {};
		}
		_cache.checked[row_id] = arg;
	    });
	},

	dropcache: function() {
	    _cache.data = {};
	    _cache.ptr = null;
	},

	slideshow: function(row_no) {
	    var ar = [];
	    if( Array.isArray(_cache.ptr) ) {
		_cache.ptr.forEach(function(arg) {
		    ar.push({
			ref: G.getdataref({plug: "tech", blob: "yes", blob_id: arg.blob_id}), 
			explain: _getexplain(arg).join("")
		    });
		});
		_cache.targets = {};
		Slideshow(ar, {idx:row_no+1}).show();
	    }
	},

	target: {
	    set: function(blob_id, arg0, arg1) {
		var p = _getparam(blob_id);
		p[arg0] = arg1;
		_checktarget(_("commit:{0}".format_a(blob_id)), p);
		_("alert:{0}".format_a(blob_id)).hide();
	    },
	    create: function(doc_id, blob_id) {
		_createtarget({
		    commit: _("commit:{0}".format_a(blob_id)),
		    alarm: _("alert:{0}".format_a(blob_id)),
		    sub: _("sub:{0}".format_a(blob_id)),
		    msg: _("msg:{0}".format_a(blob_id)),
		    strict: _("strict:{0}".format_a(blob_id)),
		    urgent: _("urgent:{0}".format_a(blob_id)),
		    spin: _("spin:{0}".format_a(blob_id))
		}, doc_id, _cache.targets[blob_id]);
	    }
	}
    }
})() );
