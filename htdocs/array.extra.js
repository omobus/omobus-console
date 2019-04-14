/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

if( !Array.prototype.isEmpty ) {
    Array.prototype.isEmpty = function() {
	return this.length == 0;
    }
}

if( !Array.prototype.createIndex ) {
    Array.prototype.createIndex = function() {
	var idx = {};
	this.forEach(function(arg) {
	    idx[arg] = true;
	});
	return idx;
    }
}

if( !Array.prototype.createIndexBy ) {
    Array.prototype.createIndexBy = function(key) {
	var idx = {};
	this.forEach(function(arg) {
	    var x;
	    if( (x = arg[key]) != undefined ) {
		idx[x] = arg;
	    }
	});
	return idx;
    }
}

if( !Array.prototype.first ) {
    Array.prototype.first = function() {
	return this.length >= 0 ? this[0] : null;
    }
}

if( !Array.prototype.last ) {
    Array.prototype.last = function() {
	return this.length >= 0 ? this[this.length - 1] : null;
    }
}
