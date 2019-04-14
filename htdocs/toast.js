/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

var Toast = (function() {
    /* private properties & methods */
    var ar = [], f = false, test = "";

    function show(tag) {
	if( ar.length > 0 ) {
	    f = true;
	    tag.html(ar.shift());

	    tag.fadeIn(800, function() {
		setTimeout(function() { 
		    tag.fadeOut(500, function() {
			show(tag);
		    });
		}, 5000);
	    });
	} else {
	    f = false;
	}
    }

    function add(msg) {
	if( !String.isEmpty(msg) && (!f || test != msg) ) {
	    ar.push(msg);
	    test = msg;
	}
    }


    /* public properties & methods */
    return {
	show: function(msg) {
	    add(msg);
	    if( !f ) {
		show(_("toastContainer"));
	    }
	}
    }
})();
