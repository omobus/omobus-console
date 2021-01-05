/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

var ProgressDialog = (function() {
    /* private properties & methods */
    var _container, _onkeyup;

    /* public properties & methods */
    return {
	show: function() {
	    if( _container == null ) {
		_container = _("progressContainer");
	    }
	    _onkeyup = window.onkeyup;
	    window.onkeyup = function(ev) { return true };
	    _container.show();
	},
	hide: function() {
	    if( _container == null ) {
		_container = _("progressContainer");
	    }
	    if( _onkeyup != null ) {
		window.onkeyup = _onkeyup;
		_onkeyup = null;
	    }
	    _container.hide();
	}
    }
})();
