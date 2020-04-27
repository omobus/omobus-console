/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

window.onload = function() {
    var msg = _('msg');
    var auth = _('authButton');
    var msgcode = msg.getAttribute("X-msgcode");
    if( msgcode == "invalid" ) {
	msg.html(lang.errors.auth.msg3);
    } else if( msgcode == "obsolete" ) {
	msg.html(lang.errors.auth.msg4);
    }
    auth.value = lang.login;
    _('apks').html(lang.apks);
    _('hint0').html(lang.username);
    _('hint1').html(lang.password);
    _('authForm').onsubmit = function() { 
	try {
	    var usernameRegex = /^[a-zA-Z0-9\-_]+$/;
	    var usernameValue = _("username").value.trim();
	    var passwordValue = _("password").value;
	    auth.value = lang.connecting;
	    auth.disabled = true;
	    if( !isEnvironmentCorrect() ) {
		msg.html(lang.errors.auth.msg5);
		auth.value = lang.login;
		auth.disabled = false;
	    } else if( String.isEmpty(usernameValue) || String.isEmpty(passwordValue) ) { 
		msg.html(lang.errors.auth.msg0);
		auth.value = lang.login;
		auth.disabled = false;
	    } else if( !usernameRegex.test(usernameValue) ) {
		msg.html(lang.errors.auth.msg1);
		auth.value = lang.login;
		auth.disabled = false;
	    } else {
		msg.html('');
		G.xhr("POST", G.getauth(), "text", function(xhr) {
		    if( xhr.status == 400 ) {
			msg.html(lang.errors.auth.msg2);
			auth.value = lang.login;
			auth.disabled = false;
		    } else if( xhr.status != 200 ) {
			msg.html("Server error: {0}.".format_a(xhr.status));
			auth.value = lang.login;
			auth.disabled = false;
		    } else {
			document.location = xhr.responseText;
		    }
		}).send(G.formParamsURI({username: usernameValue, password: passwordValue}));
	    }
	} catch(ex) {
	    console.log(ex);
	}
	return false;
    };
}
