/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var G = (function() {
    /* private properties & methods */
    var _cache = [];

    function _fmtdate(d, fmt) { 
	return d == null ? "" : (d instanceof Date ? d : Date.parseISO8601(d)).format(fmt, 0, lang);
    }

    function _thousdelim(s) {
	var x = s.split('.'), rgx = /(\d+)(\d{3})/;
	var x1 = x[0], x2 = x.length > 1 ? '.' + x[1] : '';
	while (rgx.test(x1)) {
	    x1 = x1.replace(rgx, '$1' + lang.numberFormat.thousand_delimiter + '$2');
	}
	return x1 + x2;
    }

    function _fileSizeIEC(a,b,c,d,e) {
	//https://wiki.ubuntu.com/UnitsPolicy
	return (b=Math,c=b.log,d=1024,e=c(a)/c(d)|0,a/b.pow(d,e)).toFixed(2) + ' ' + (e?'KMGTPEZY'[--e]+'iB':'Bytes')
    }

    function _fmtnumber(n, prec, def) {
	return (n == null || typeof n == 'undefined') ? ((def == null || typeof def == 'undefined') ? lang.dash : def) : 
	    _thousdelim(parseFloat(n).toFixed(prec).toString());
    }

    function _fmturi(code, params, extra, absolute) {
	var ar = [], delim = "?";
	if( typeof absolute != 'undefined' && absolute ) {
	    if( typeof window.location.protocol != 'undefined' ) {
		ar.push(window.location.protocol, "//");
	    }
	    ar.push(window.location.hostname);
	    if( !String.isEmpty(window.location.port) ) {
		ar.push(":", window.location.port);
	    }
	}
	ar.push("/console/", code);
	if( params != null && typeof params == 'object' ) {
	    for( var prop in params ) {
		var v = params[prop];
		if( v != null ) {
		    ar.push(delim,prop,"=",v);
		    delim = "&";
		}
	    }
	}
	if( extra != null && typeof extra == 'object' ) {
	    for( var prop in extra ) {
		ar.push(delim,prop,"=",extra[prop]);
		delim = "&";
	    }
	}
	return encodeURI(ar.join(''));
    }

/*
    function _enumerateKeys(ar, cb, prefix) {
	for( var key in ar ) {
	    var val = ar[key];
	    if( typeof val == 'object' ) {
		_enumerateKeys(val, cb, key + '.');
	    } else {
		cb(prefix == null ? key : (prefix + key), val)
	    }
	}
    }
*/

    function _htmlentities(arg) {
	if( typeof arg == 'string' ) {
	    arg = arg.replace(/<br\s*\/>/gi, "\n");
	    //arg = arg.replace(/<(?:.|\s)*?>/g, ""); // remove all <tags>
	    arg = arg.replace(/&/g, "&amp;");
	    arg = arg.replace(/</g, "&lt;");
	    arg = arg.replace(/>/g, "&gt;");
	    arg = arg.replace(/'/g,/*'=>*/ "&lsquo;");
	    arg = arg.replace(/"/g,/*"=>*/ "&quot;");
	    arg = arg.replace(/\n/g, "<br/>");
	    arg = arg.replace(/&lt;b&gt;/gi, "<b>");
	    arg = arg.replace(/&lt;\/b&gt;/gi, "</b>");
	    arg = arg.replace(/&lt;i&gt;/gi, "<i>");
	    arg = arg.replace(/&lt;\/i&gt;/gi, "</i>");
	}
	return arg;
    }

    /* public properties & methods */
    return {
	shielding: function(arg, def) {
	    return arg == null || arg == "" ? (def == null || typeof def == 'undefined' ? "" : def) : _htmlentities(arg); 
	},

	getdate: function(d) { return _fmtdate(d, "yyyy-mm-dd"); },
	getdatetime: function(d) { return _fmtdate(d, "yyyy-mm-dd HH:MM:ss"); },
	getdatetime_l: function(d) { return _fmtdate(d, lang.dateFormat.datetime); },
	getdate_l: function(d) { return _fmtdate(d, lang.dateFormat.date); },
	getlongdatetime_l: function(d) { return _fmtdate(d, lang.dateFormat.longdatetime); },
	getlongdate_l: function(d) { return _fmtdate(d, lang.dateFormat.longdate); },
	gettime_l: function(d) { return _fmtdate(d, lang.dateFormat.time); },
	getlongtime_l: function(d) { return _fmtdate(d, lang.dateFormat.longtime); },
	getlongmonth_l: function(d) { return _fmtdate(d, lang.dateFormat.longmonth); },
	getlongday_l: function(d) { return _fmtdate(d, lang.dateFormat.longday); },

	getnumeric_l: function(n, prec, def) { return _fmtnumber(n, prec, def); },
	getcurrency_l: function(n, def) { return _fmtnumber(n, lang.numberFormat.currency_precision, def); },
	getpercent_l: function(arg, def) { return (arg == null && (def == null || typeof def == 'undefined')) ? lang.dash : (_fmtnumber(arg, 1, def) + '%'); },
	getint_l: function(n, def) { return _fmtnumber(n, 0, def); },

	fileSize: function(arg) { return arg == null ? null : _fileSizeIEC(arg); },

	getauthref: function(params) { return _fmturi("auth", params); },
	getdefref: function(params) { return _fmturi("default", params, {sid:__SID__,lang:lang.__code}); },
	getdataref: function(params) { return _fmturi("data", params, {sid:__SID__}); },
	getloginref: function(params) { return _fmturi("login", params, {lang:lang.__code}); },
	getlogoutref: function() { return _fmturi("logout", null, {sid:__SID__}); },
	getdumpref: function(params) { return _fmturi("dump", params, {sid:__SID__}); },
	getstaticref: function(name) { return __STATIC_REF_PREFIX__ + "/" + name; },
	getphotoref: function(ref, absolute) { return _fmturi("photo", {ref: ref}, null, absolute); },

/* OBSOLETE: begin */
	getobjcache: function(code, cookie) {
	    var n = "[G]:" + code;
	    if( cookie != null && typeof cookie != 'undefined' ) { n += (":" + cookie); }
	    if( typeof _cache[n] == 'undefined' ) { _cache[n] = new Cache(n); }
	    return _cache[n];
	},
/* OBSOLETE: end */

	thnums: function(n) {
	    var s = "<tr>";
	    for( i = 1; i <= n; i++ ) s += ("<th>"+i+"</th>");
	    s += "</tr>"
	    return s
	},

	checkrow: function(tag, onset) {
	    if( tag.hasClass('selected') ) {
		tag.removeClass('selected');
		onset(false);
	    } else {
		tag.addClass('selected');
		onset(true);
	    }
	},

	xhr: function(method, uri, type, done) {
	    var xhr = new XMLHttpRequest();
	    xhr.open(method, uri, true);
	    xhr.responseType = type == 'json-js' ? 'text' : type;
	    xhr.onreadystatechange = function() {
		if( this.readyState == 4 /* DONE */ ) {
		    if( xhr.status == 401 ) {
			document.location = G.getloginref({msgcode:"invalid"});
		    } else if( xhr.status == 440 ) {
			document.location = G.getloginref({msgcode:"obsolete"});
		    } else if( this.status == 200 && type == 'json-js' && typeof this.response == "string" ) {
			done(this, json_parse(this.response));
		    } else if( this.status == 200 && type == "json" && typeof this.response == "string" ) {
			done(this, JSON.parse(this.response));
		    } else {
			done(this, this.response);
		    }
		}
	    }
	    //console.log(method + "->" + uri);
	    return xhr;
	},

	formParamsURI: function(params) {
	    var s = "", tmp;
	    if( params != null && typeof params == 'object' ) {
		for( var prop in params ) {
		    if( s.length > 0 ) {
			s += "&";
		    }
		    if( (tmp = params[prop]) != null ) {
			s += (prop + "=" + encodeURIComponent(tmp));
		    }
		}
	    }
	    return s;
	},

	formData: function(params) {
	    var fd = new FormData();
	    if( params != null && typeof params == 'object' ) {
		for( var prop in params ) {
		    fd.append(prop, params[prop]);
		}
	    }
	    return fd;
	},

	tozip: function(code, rows, templ, max, abort, tag0, tag1, span) {
	    if( String.isEmpty(code) || !Array.isArray(rows) || String.isEmpty(templ) ) {
		throw SyntaxError("invalid input parameters!");
	    }
	    var size = rows.length;
	    var max = max == null || max <= 0 ? 2000 : max;
	    var zip = new JSZip();
	    var x = 0, z = 0;
	    var __getzipfname = function() {
		return "{0}-({1}).omobus.zip".format_a(code, z);
	    }
	    var __getphotofname = function(arg) {
		return templ.format(arg.params, false).format({blob_id: arg.blob_id}).replace(/\/|\!|\\|\*|:/g, "_");
	    }
	    var __save = function(r) {
		if( (r == null && rows.isEmpty()) || abort() ) {
		    tag0.show(); tag1.hide(); span.html("");
		    zip.generateAsync({type:"blob"}).then(function(data) { saveAs(data, __getzipfname()); });
		    zip = null;
		} else {
		    if( x >= max ) {
			zip.generateAsync({type:"blob"}).then(function(data) { saveAs(data, __getzipfname()); });
			zip = new JSZip();
			x = 0; z++;
		    }
		    G.xhr("GET", G.getdataref({plug: code, blob_id: r.blob_id, blob: "yes"}), "arraybuffer", function(xhr) {
			if( xhr.status != 200 ) {
			    zip.file(__getphotofname(r) + ".txt", "Unable to download photo!");
			} else {
			    zip.file(__getphotofname(r) + ".jpg", xhr.response, {binary: true});
			}
			x++;
			span.html(lang.export.progress.format_a(size - rows.length, size));
			__save(rows.shift());
		    }).send();
		}
	    }
	    /* create zip: */
	    tag0.hide(); tag1.show();
	    span.html(lang.export.progress.format_a(0, size));
	    __save(rows.shift());
	},

	copyToClipboard: function(text) {
	    navigator.clipboard.writeText(text);
	    Toast.show(lang.notices.clipboard);
	    console.log(text);
	},

	quarterDateRange: function(year, quarter) {
	    if( quarter == 1 ) {
		return [new Date(year,0,1), new Date(year,2,31)];
	    } else if( quarter == 2 ) {
		return [new Date(year,3,1), new Date(year,5,30)];
	    } else if( quarter == 3 ) {
		return [new Date(year,6,1), new Date(year,8,30)];
	    } else if( quarter == 4 ) {
		return [new Date(year,9,1), new Date(year,11,31)];
	    }
	    throw new Error("Invalid quarter number.");
	}
    }
})();
