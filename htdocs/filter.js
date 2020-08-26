/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

function Filter(arg, short, maptb) {
    if( !(this instanceof Filter) ) {
	return new Filter(arg, short, maptb);
    }
    if( arg instanceof HTMLElement ) {
	arg = arg.val();
    }
    this._ar = this._init(arg);
    this._short = short;
    this._maptb = maptb;
}


/* static functions: */

(function (Filter, undefined) {
    Filter.onkeyup = function(tag, ev, func) {
	var a = true;
	//console.log(ev.keyCode);
	if( typeof __filtersTimeout != 'undefined' && ev.keyCode != 16 ) {
	    clearTimeout(__filtersTimeout);
	    __filtersTimeout = null;
	}
        if( ev.keyCode == 13 ) {
	    a = false; tag.blur();
	    func();
	} else if( ev.keyCode == 27 ) {
	    if( tag.value != '' ) {
		tag.value = '';
		func();
	    } else {
		tag.blur();
	    }
	    a = false;
	} else if( typeof ev.keyCode == 'undefined' ) {
	    func();
	} else if( ev.keyCode != "Meta" && (ev.keyCode == 8 || (46 <= ev.keyCode && ev.keyCode <= 90 )) ) {
	    __filtersTimeout = setTimeout(func, 1500);
	}
	return a;
    };
}(Filter));

(function (Filter, undefined) {
    var _re0 = new RegExp(' ', 'g');
    Filter.escape = function(k, v) {
	return typeof k == 'string' && typeof v != 'undefined' && !String.isEmpty(v) ?
	    "{0}={1}$".format_a(k, v.replace(_re0,'\\040')) : "";
    };
}(Filter));


/** private functions: **/

Filter.prototype._enumerateKeys = function(ar, cb, prefix) {
    for( var key in ar ) {
	var val = ar[key];
	var type = typeof val;
	if( type == 'object' ) {
	    if( Array.isArray(val) ) {
		for( var i = 0, s = val.length; i < s; i++ ) {
		    var xv = val[i];
		    var xt = typeof xv;
		    if( xt == 'object' ) {
			this._enumerateKeys(val[i], cb, key + '.');
		    } else if( xt != 'function' && xv != null ) {
			cb(prefix == null ? key : (prefix + key), xv);
		    }
		}
	    } else {
		this._enumerateKeys(val, cb, key + '.');
	    }
	} else if( type != 'function' && val != null ) {
	    cb(prefix == null ? key : (prefix + key), val);
        }
    }
}

// Dumps as key=value\n string.
Filter.prototype._dump = function(args) {
    var ar = [], own = this;
    this._enumerateKeys(args, function(k, v) {
	if( typeof own._maptb == 'undefined' || (typeof own._maptb[k] != 'undefined' && own._maptb[k] == true) ) {
	    if( own._short ) {
		ar.push(v,"\n");
	    } else {
		ar.push(k,"=",v,"\n");
	    }
	}
    });
    return ar.join("");
}

// Prepares filter. Input string: regexp0 regexp1 ...
Filter.prototype._init = function(s) {
    //console.log(s);
    var arr = s.trim().split(' '), rc = [];
    for( var i = z = 0, size = arr == null ? 0 : arr.length; i < size; i++ ) {
	//console.log(arr[i]);
	if( arr[i] != null && arr[i].length > 0 ) {
	    try {
		rc[z++] = new RegExp(arr[i], "im");
	    } catch( ex ) {
		rc[z++] = null;
	    }
	}
    }
    return rc;
}


/* public functions: */

Filter.prototype.is = function(arg) {
    if( this._ar == null || this._ar.length == 0 ) {
        return true;
    }
    var s = this._dump(arg), x;
    //console.log(s); console.log("------------- ");
    for( var i = 0; i < this._ar.length; i++ ) {
	if( (x = this._ar[i]) == null || !x.test(s) ) {
	    return false;
	}
    }
    return true;
}
