/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

var ProgressDialog = (function() {
    /* private properties & methods */
    var _container, _sp;

    /* public properties & methods */
    return {
	show: function() {
	    if( _container == null ) {
		_container = _("progressContainer");
	    }
	    if( _sp == null ) {
		_sp = spinnerLarge(_container, "50%", "50%");
	    }
	    _container.show();
	},
	hide: function() {
	    if( _container == null ) {
		_container = _("progressContainer");
	    }
	    if( _sp != null ) {
		_sp.stop;
		_sp = null;
	    }
	    _container.hide();
	}
    }
})();
