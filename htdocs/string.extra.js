/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

/* static functions: */

(function (String, undefined) {
    String.isEmpty = function(arg) {
	return arg == null || arg.isEmpty();
    };
}(String));


/* public functions: */

String.prototype.format = function(args, normalize) {
    var newStr = this;
    for( var key in args ) {
	if( args[key] != null ) {
	    newStr = newStr.replace(new RegExp('\\{' + key + '\\}','g'), args[key]);
	}
    }
    return normalize == false ? newStr : newStr.replace(/{[\w|\.]+}/g,'');
}

String.prototype.format_a = function() {
    var newStr = this;
    for( var i = 0; i < arguments.length; i++ ) {
	if( arguments[i] != null ) {
	    newStr = newStr.replace(new RegExp('\\{' + i + '\\}','g'), arguments[i]);
	}
    }
    return newStr.replace(/{[\w|\.]+}/g,'');
}

String.prototype.isEmpty = function() {
    return this.length == 0;
}

String.prototype.left = function(arg) {
    return arg <= 0 ? "" : this.substring(0, arg);
}

String.prototype.trunc = function(n, useWordBoundary) {
    if( this.length <= n ) { 
	return this; 
    }
    var subString = this.substr(0, n-1);
    return (useWordBoundary ? subString.substr(0, subString.lastIndexOf(' ')) : subString) + "&hellip;";
};

String.prototype.mtrunc = function(n) {
    if( this.length <= n ) {
	return this;
    }
    return this.substr(0, (n-1)/2) + "&hellip;" + this.substr(this.length - ((n-3)/2), this.length - 1);
};
