/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file. */

/* Google Maps API: https://developers.google.com/maps/documentation/javascript/tutorial */

var __gmap = (function() {
    /* private properties & methods */
    var _cache = {}; // internal cache object for preventing reloading data
    var _code = "gmap";

    function _trace(data) {
	var ar = [], path = [];
        for( var obj = null, i = 0, size = Array.isArray(data.trace) ? data.trace.length : 0; i < size && (obj = data.trace[i]) != null; i++ ) {
	    path.push(new google.maps.LatLng(obj.latitude, obj.longitude));
	}
	if( !path.isEmpty() ) {
	    ar.push(new google.maps.Polyline({
		path: path,
		geodesic: false,
		strokeColor: "#0303EE", strokeWidth: 4, strokeOpacity: 0.5
	    }));
	}
	return ar;
    }

    function _points(data) {
	var ar = [], msgs = lang.tech.route.map, size = Array.isArray(data.trace) ? data.trace.length : 0, obj;
        for( var i = 0; i < size && (obj = data.trace[i]) != null; i++ ) {
	    if( data.trace[i].control_point == 1 ) {
		ar.push(new google.maps.Marker({
		    position: new google.maps.LatLng(obj.latitude, obj.longitude),
		    title: G.gettime_l(Date.parseISO8601(obj.fix_dt)),
		    icon: {
			url: G.getstaticref('drawable/point-blue.png'),
			scaledSize: new google.maps.Size(10, 10), 
			anchor: new google.maps.Point(5, 5)
		    }
		}));
	    }
	}
	if( size > 0 ) { /* add first and last point on top of other control points */
	    obj = data.trace.first();
	    ar.push(new google.maps.Marker({
		position: new google.maps.LatLng(obj.latitude, obj.longitude),
		title: msgs.start.format_a(G.gettime_l(Date.parseISO8601(obj.fix_dt))),
		icon: {
		    url: G.getstaticref('drawable/point-start.png'), 
		    scaledSize: new google.maps.Size(16, 16),
		    anchor: new google.maps.Point(8, 8)
		}
	    }));
	    obj = data.trace.last();
	    ar.push(new google.maps.Marker({
		position: new google.maps.LatLng(obj.latitude, obj.longitude),
		title: msgs.finish.format_a(G.gettime_l(Date.parseISO8601(obj.fix_dt)), G.getint_l(data.distance_traveled)),
		icon: {
		    url: G.getstaticref('drawable/point-finish.png'), 
		    scaledSize: new google.maps.Size(16, 16),
		    anchor: new google.maps.Point(8, 8)
		}
	    }));
	}
	return ar;
    }

    function _accounts(data, iw) {
	var obj, msgs = lang.tech.route.map, r = [], my = [];
	for( var i = 0, size = Array.isArray(data.route) ? data.route.length : 0; i < size && (obj = data.route[i]) != null; i++ ) {
	    var info = null, x = data.my_accounts[obj.account_id] || {};
	    if( obj.closed != null ) {
		info = msgs.closed.format_a(G.shielding(obj.activity_type), G.gettime_l(Date.parseISO8601(obj.b_dt)), G.gettime_l(Date.parseISO8601(obj.e_dt)), 
		    obj.duration, G.getdate_l(Date.parseISO8601(obj.b_dt)), G.getint_l(obj.dist));
		x._c = true;
	    } else if( obj.canceled != null ) {
		info = msgs.canceled.format_a(G.shielding(obj.activity_type));
		x._c = true;
	    }
	    if( Array.isArray(x._ar) ) {
		x._ar.push(obj);
	    } else {
		x._ar = [obj];
	    }
	    if( typeof obj.latitude != 'undefined' && typeof obj.longitude != 'undefined' && obj.strict ) {
		var marker = new google.maps.Marker({
		    position: new google.maps.LatLng(obj.latitude, obj.longitude),
		    title: msgs.activity.format_a(G.gettime_l(Date.parseISO8601(obj.b_dt))),
		    icon: {
			url: G.getstaticref('drawable/activity.png'), 
			scaledSize: new google.maps.Size(32, 32),
			anchor: new google.maps.Point(16, 26)
		    }
		});
		marker._popupContent = [
		    "<div class='gmap-infowindow'>",
		    "<b>",G.shielding(x.descr),"</b>","<br/>",
		    G.shielding(x.address),"<br/>",
		    G.shielding(x.chan),"<hr/>",
		    info,
		    "</div>"
		];
		marker.addListener('click', function() {
		    iw.setContent(this._popupContent.join(''));
		    iw.open(this.getMap(), this);
		});
		r.push(marker);
		if( typeof x.latitude != 'undefined' && typeof x.longitude != 'undefined' ) {
		    r.push(new google.maps.Polyline({
			path: [new google.maps.LatLng(obj.latitude, obj.longitude),new google.maps.LatLng(x.latitude, x.longitude)],
			geodesic: false,
			strokeColor: "#bf1515", strokeWidth: 4, strokeOpacity: 0.5
		    }));
		}
	    }
	}
	for( var key in data.my_accounts ) {
	    if( (obj = data.my_accounts[key]) != null && (typeof obj.latitude != 'undefined' && typeof obj.longitude != 'undefined') ) {
		if( obj.route != null || obj._c ) {
		    var marker = new google.maps.Marker({
			position: new google.maps.LatLng(obj.latitude, obj.longitude),
			title: msgs.account.format_a(G.shielding(obj.descr)),
			icon: {
			    url: G.getstaticref("drawable/{0}{1}.png".format_a(obj.route != null ? 'route' : 'my', obj._c ? "_closed" : "")),
			    scaledSize: new google.maps.Size(48, 48),
			    anchor: new google.maps.Point(obj.route != null ? 30 : 24, 46)
			}
		    });
		    marker._popupContent = [
			"<div class='gmap-infowindow'>",
			"<b>",G.shielding(obj.descr),"</b>","<br/>",
			G.shielding(obj.address),"<br/>",
			G.shielding(obj.chan)
		    ];
		    if( Array.isArray(obj._ar) ) {
			obj._ar.forEach(function(ptr, index) {
			    if( ptr.closed != null ) {
				marker._popupContent.push(index == 0 ? "<hr />" : "<br />");
				marker._popupContent.push(msgs.closed.format_a(G.shielding(ptr.activity_type), 
				    G.gettime_l(Date.parseISO8601(ptr.b_dt)), G.gettime_l(Date.parseISO8601(ptr.e_dt)), 
				    ptr.duration, G.getdate_l(Date.parseISO8601(ptr.b_dt)), G.getint_l(ptr.dist)));
			    } else if( ptr.canceled != null ) {
				marker._popupContent.push(index == 0 ? "<hr />" : "<br />");
				marker._popupContent.push(msgs.canceled.format_a(G.shielding(ptr.activity_type)));
			    }
			});
		    }
		    marker._popupContent.push("</div>");
		    marker.addListener('click', function() {
			iw.setContent(this._popupContent.join(''));
			iw.open(this.getMap(), this);
		    });
		    r.push(marker);
		} else {
		    var marker = new google.maps.Marker({
			position: new google.maps.LatLng(obj.latitude, obj.longitude),
			title: msgs.account.format_a(G.shielding(obj.descr)),
			icon: {
			    url: G.getstaticref('drawable/my.png'),
			    scaledSize: new google.maps.Size(48, 48),
			    anchor: new google.maps.Point(24, 46)
			}
		    });
		    marker._popupContent = [
			"<div class='gmap-infowindow'>",
			"<b>",G.shielding(obj.descr),"</b>","<br/>",
			G.shielding(obj.address),"<br/>",
			G.shielding(obj.chan),
			"</div>"
		    ];
		    marker.addListener('click', function() {
			iw.setContent(this._popupContent.join(''));
			iw.open(this.getMap(), this);
		    });
		    my.push(marker);
		}
		obj._ar = null;
		obj._c = null;
	    }
	}

	return {route: r, my: my};
    }

    function _unsched(data) {
	var obj, ar = [], msg = lang.tech.route.map.unsched;
	for( var i = 0, size = Array.isArray(data.unsched) ? data.unsched.length : 0; i < size && (obj = data.unsched[i]) != null; i++ ) {
	    if( typeof obj.latitude != 'undefined' && typeof obj.longitude != 'undefined' ) {
		ar.push(new google.maps.Marker({
		    position: new google.maps.LatLng(obj.latitude, obj.longitude),
		    title: msg.format_a(G.gettime_l(Date.parseISO8601(obj.fix_dt))),
		    icon: {
			url: G.getstaticref('drawable/unsched.png'), 
			scaledSize: new google.maps.Size(32, 32),
			anchor: new google.maps.Point(16, 26)
		    }
		}));
	    }
	}
	return ar;
    }

    function _additions(data) {
	var obj, ar = [], msg = lang.tech.route.map.addition;
	for( var i = 0, size = Array.isArray(data.additions) ? data.additions.length : 0; i < size && (obj = data.additions[i]) != null; i++ ) {
	    if( typeof obj.latitude != 'undefined' && typeof obj.longitude != 'undefined' ) {
		ar.push(new google.maps.Marker({
		    position: new google.maps.LatLng(obj.latitude, obj.longitude),
		    title: msg.format_a(G.gettime_l(Date.parseISO8601(obj.fix_dt))),
		    icon: {
			url: G.getstaticref('drawable/addition.png'), 
			scaledSize: new google.maps.Size(48, 48),
			anchor: new google.maps.Point(24, 46)
		    }
		}));
	    }
	}
	return ar;
    }

    function _setGeoObjects(m, ar) {
	if( Array.isArray(ar) ) {
	    ar.forEach(function(ptr) {
		ptr.setMap(m);
	    });
	}
    }

    function _dropGeoObjects(m, ar) {
	if( Array.isArray(ar) ) {
	    ar.forEach(function(ptr) {
		ptr.setMap(null);
	    });
	}
    }

    function _createInstance(canvas, sbtag, cbtag, data) {
	var map = null, objects = {};

	if( data.map != null ) {
	    objects._iw = new google.maps.InfoWindow();
	    objects.accounts = _accounts(data, objects._iw);
	    objects.trace = _trace(data);
	    objects.controlPoints = _points(data);
	    objects.unsched = _unsched(data);
	    objects.additions = _additions(data);

	    map = new google.maps.Map(canvas, {
		center: new google.maps.LatLng(data.map.latitude, data.map.longitude),
		clickableIcons: false,
		panControl: false,
		streetViewControl: false,
		mapTypeControl: false,
		zoom: 12,
		minZoom: 4,
		maxZoom: 18
	    });
	    //_setGeoObjects(map, objects.accounts.my);
	    _setGeoObjects(map, objects.trace);
	    _setGeoObjects(map, objects.controlPoints);
	    _setGeoObjects(map, objects.accounts.route);
	    _setGeoObjects(map, objects.unsched);
	    _setGeoObjects(map, objects.additions);
	    // CheckBox:
	    cbtag.className = "gmap-cb-checked";
	    cbtag.onclick = function() {
		if( cbtag.className == "gmap-cb-checked" ) {
		    _setGeoObjects(map, objects.accounts.my);
		    cbtag.className = "gmap-cb-unchecked";
		} else {
		    _dropGeoObjects(map, objects.accounts.my);
		    cbtag.className = "gmap-cb-checked";
		}
	    }
	    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(cbtag);
	    // NOTE: SearchBox object exist only if APIKEY is defined and Places API is enabled !!!
	    if( typeof google.maps.places != 'undefined' ) {
		// https://developers.google.com/maps/documentation/javascript/places-autocomplete
		var sb = new google.maps.places.SearchBox(sbtag);
		google.maps.event.addListener(sb, 'places_changed', function() {
		    sb.set('map', null);
		    var places = sb.getPlaces();
		    var bounds = new google.maps.LatLngBounds();
		    for( var i = 0, place; place = places[i]; i++ ) {
			(function(place) {
			    var marker = new google.maps.Marker({position: place.geometry.location});
			    marker.bindTo('map', sb, 'map');
			    google.maps.event.addListener(marker, 'map_changed', function() {
				if(!this.getMap() ) { this.unbindAll(); }
			    });
			    bounds.extend(place.geometry.location);
			} (place));
		    }
		    map.fitBounds(bounds);
		    sb.set('map', map);
		    map.setZoom(Math.min(map.getZoom(),12));
		});
		map.controls[google.maps.ControlPosition.TOP_LEFT].push(sbtag);
	    }
	}

	return map;
    }


    /* public properties & methods */
    return {
	getcode: function() { return _code; },
	getcaption: function() { return lang.tech.route.title1; },
	getbody: function() {
	    var ar = [];
	    ar.push("<div class='warning' id='", _code, "-warning'></div>");
	    ar.push("<div class='gmap-canvas' id='", _code, "-canvas'>");
	    ar.push("<input class='gmap-sb' id='", _code, "-sb' type='text' placeholder='", lang.geosearch, "'></input>");
	    ar.push("<button class='gmap-cb-unchecked' id='", _code, "-cb' type='button' title='", lang.tech.route.map.button0, "'>&#9872;</button>");
	    ar.push("</div>");
	    return ar.join('');
	},

	setdata: function(body, user_id, date) {
	    var warn = _("{0}-warning".format_a(_code)), canvas = _("{0}-canvas".format_a(_code)), 
		sb = _("{0}-sb".format_a(_code)), cb = _("{0}-cb".format_a(_code));
	    warn.hide(); canvas.hide();
	    if( _cache[user_id] != null ) { // set data from the internal cache
		_createInstance(canvas, sb, cb, _cache[user_id])
		canvas.show();
		canvas.style.height = "{0}px".format_a(window.innerHeight - canvas.position().top - 5);
	    } else {
		ProgressDialog.show();
		_cache[user_id] = null; // drop the internal cache
		G.xhr("GET", G.getajax({plug: "tech", code: "tech_route", user_id: user_id, date: G.getdate(date)}), "json", function(xhr, data) {
		    if( xhr.status == 200 &&  data != null && typeof data == 'object' ) {
			if( _createInstance(canvas, sb, cb, data) ) {
			    _cache[user_id] = data;
			    canvas.show();
			    canvas.style.height = "{0}px".format_a(window.innerHeight - canvas.position().top - 5);
			} else {
			    warn.html(lang.empty);
			    warn.show();
			}
		    } else {
			warn.html(lang.failure);
			warn.show();
		    }
		    ProgressDialog.hide();
		}).send();
	    }
	},

	dropcache: function() {
	    _cache = {};
	}
    }
})();

PLUG.registerTab(__gmap);
