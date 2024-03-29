/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.
 *
 ** Major portions taken verbatim or adapted from the JSON-js.
 ** See https://github.com/douglascrockford/JSON-js for more information.
 ** Original file json_parse.js. Release date: 2015-05-02.
 **
 ** This file contains an alternative JSON parse function that
 ** uses recursive descent instead of eval.
 */

// This is a function that can parse a JSON text, producing a JavaScript
// data structure. It is a simple, recursive descent parser. It does not use
// eval or regular expressions, so it can be used as a model for implementing
// a JSON parser in other languages.

// We are defining the function inside of another function to avoid creating
// global variables.


var json_parse = (function () {
    "use strict";

    var IDX = {}; 	// The index of string and numbers, stored in the result object
    var at;		// The index of the current character
    var ch;		// The current character
    var escapee = {
	    '"': '"',
	    '\\': '\\',
	    '/': '/',
	    b: '\b',
	    f: '\f',
	    n: '\n',
	    r: '\r',
	    t: '\t'
	};
    var text;


    function cache(value) {
	if( value == null ) {
	    return value;
	}
	if( IDX[value] !== value ) {
	    IDX[value] = value;
	}
	return IDX[value];
    }

    function error(m) {
	throw {
	    name: 'SyntaxError',
	    message: m,
	    at: at,
	    text: text
        };
    }

    function next(c) { 
	// If a c parameter is provided, verify that it matches the current character.
	if (c && c !== ch) {
	    error("Expected '" + c + "' instead of '" + ch + "'");
	}
	// Get the next character. When there are no more characters,
	// return the empty string.
	ch = text.charAt(at);
	at += 1;
	return ch;
    }

    // Parse a number value.
    function number() {
	var number, string = '';
	if (ch === '-') {
	    string = '-';
	    next('-');
	}
	while (ch >= '0' && ch <= '9') {
	    string += ch;
	    next();
	}
	if (ch === '.') {
	    string += '.';
	    while (next() && ch >= '0' && ch <= '9') {
		string += ch;
	    }
	}
	if (ch === 'e' || ch === 'E') {
	    string += ch;
	    next();
	    if (ch === '-' || ch === '+') {
		string += ch;
		next();
	    }
	    while (ch >= '0' && ch <= '9') {
		string += ch;
		next();
	    }
	}
	number = +string;
	if (!isFinite(number)) {
	    error("Bad number");
	} else {
	    return number;
	}
    }

    // Parse a string value.
    function string() {
	var hex, i, string = '', uffff;
	// When parsing for string values, we must look for " and \ characters.
	if (ch === '"') {
	    while (next()) {
		if (ch === '"') {
		    next();
		    return string;
		}
		if (ch === '\\') {
		    next();
		    if (ch === 'u') {
			uffff = 0;
			for (i = 0; i < 4; i += 1) {
			    hex = parseInt(next(), 16);
			    if (!isFinite(hex)) {
				break;
			    }
			    uffff = uffff * 16 + hex;
			}
			string += String.fromCharCode(uffff);
		    } else if (typeof escapee[ch] === 'string') {
			string += escapee[ch];
		    } else {
			break;
		    }
		} else {
		    string += ch;
		}
	    }
	}
	error("Bad string");
    }

    // Skip whitespace.
    function white() {
	while (ch && ch <= ' ') {
	    next();
	}
    }

    // true, false, or null.
    function word() {
	switch (ch) {
	case 't':
	    next('t');
	    next('r');
	    next('u');
	    next('e');
	    return true;
	case 'f':
	    next('f');
	    next('a');
	    next('l');
	    next('s');
	    next('e');
	    return false;
	case 'n':
	    next('n');
	    next('u');
	    next('l');
	    next('l');
	    return null;
	}
	error("Unexpected '" + ch + "'");
    }

    // Parse an array value.
    function array() {
	var array = [];

	if (ch === '[') {
	    next('[');
	    white();
	    if (ch === ']') {
		next(']');
		return array;   // empty array
	    }
	    while (ch) {
		array.push(value());
		white();
		if (ch === ']') {
		    next(']');
		    return array;
		}
		next(',');
		white();
	    }
	}
	error("Bad array");
    }

    // Parse an object value.
    function object() {
	var key, object = {};

	if (ch === '{') {
	    next('{');
	    white();
	    if (ch === '}') {
		next('}');
		return object;   // empty object
	    }
	    while (ch) {
		key = string();
		white();
		next(':');
		if (Object.hasOwnProperty.call(object, key)) {
		    error('Duplicate key "' + key + '"');
		}
		object[key] = value();
		white();
		if (ch === '}') {
		    next('}');
		    return object;
		}
		next(',');
		white();
	    }
	}
	error("Bad object");
    };

    // Parse a JSON value. It could be an object, an array, a string, a number,
    // or a word.
    function value() {
	white();
	switch (ch) {
	case '{':
	    return object();
	case '[':
	    return array();
	case '"':
	    return cache(string());
	case '-':
	    return cache(number());
	default:
	    return cache(ch >= '0' && ch <= '9' ? number() : word());
        }
    };


    // Return the json_parse function. It will have access to all of the above
    // functions and variables.
    return function (source) {
	var result;

	text = source;
	at = 0;
	ch = ' ';
	result = value();
	white();
	if (ch) {
	    error("Syntax error");
	}

	return result;
    };
}());
