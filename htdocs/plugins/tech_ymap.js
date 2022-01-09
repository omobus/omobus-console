/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

/* Yandex Maps API: https://tech.yandex.com/maps/doc/jsapi/2.1/dg/concepts/about-docpage/ */

var __ymap = (function() {
    /* private properties & methods */
    var _cache = {}; // internal cache object for preventing reloading data
    var _mapInstance = null;
    var _code = "ymap";

    function _trace(data) {
	var ar = new ymaps.GeoObjectCollection(), path = [];
        for( var obj = null, i = 0, size = Array.isArray(data.trace) ? data.trace.length : 0; i < size && (obj = data.trace[i]) != null; i++ ) {
	    path.push([obj.latitude, obj.longitude]);
	}
	if( !path.isEmpty() ) {
	    ar.add(new ymaps.Polyline(
		path,
		{ hintContent: lang.tech.route.map.trace.format_a(data.wd != null && data.wd.mileage != null ? data.wd.mileage : 0) },
		{ strokeColor: "#0303EE", strokeWidth: 4, strokeOpacity: 0.5 }
	    ));
	}
	return ar;
    }

    function _points(data) {
	var ar = new ymaps.GeoObjectCollection(), msgs = lang.tech.route.map, size = Array.isArray(data.trace) ? data.trace.length : 0, obj;
        for( var i = 0; i < size && (obj = data.trace[i]) != null; i++ ) {
	    if( data.trace[i].control_point == 1 ) {
		ar.add(new ymaps.Placemark(
		    [obj.latitude, obj.longitude],
		    { hintContent: G.gettime_l(Date.parseISO8601(obj.fix_dt)) },
		    { 
			iconLayout: 'default#image', 
			iconImageHref: G.getstaticref('drawable/point-blue.png'), 
			iconImageSize: [10, 10], 
			iconImageOffset: [-5, -5] 
		    }
		));
	    }
	}
	if( size > 0 ) { /* add first and last point on top of other control points */
	    obj = data.trace.first();
	    ar.add(new ymaps.Placemark(
		[obj.latitude, obj.longitude],
		{ hintContent: msgs.start.format_a(G.gettime_l(Date.parseISO8601(obj.fix_dt))) },
		{ 
		    iconLayout: 'default#image', 
		    iconImageHref: G.getstaticref('drawable/point-start.png'), 
		    iconImageSize: [16, 16],
		    iconImageOffset: [-8, -8]
		}
	    ));
	    obj = data.trace.last();
	    ar.add(new ymaps.Placemark(
		[obj.latitude, obj.longitude],
		{ hintContent:  msgs.finish.format_a(G.gettime_l(Date.parseISO8601(obj.fix_dt)), data.wd != null && data.wd.mileage != null ? data.wd.mileage : 0) },
		{ 
		    iconLayout: 'default#image',
		    iconImageHref: G.getstaticref('drawable/point-finish.png'),
		    iconImageSize: [16, 16],
		    iconImageOffset: [-8, -8]
		}
	    ));
	}
	return ar;
    }

    function _accounts(data) {
	var obj, msgs = lang.tech.route.map, r = new ymaps.GeoObjectCollection(), my = new ymaps.GeoObjectCollection();
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
		r.add(new ymaps.Placemark(
		    [obj.latitude, obj.longitude],
		    { 
			hintContent: msgs.activity.format_a(G.gettime_l(Date.parseISO8601(obj.b_dt))),
			balloonContent: [
			    "<div class='ymap-infowindow'>",
			    "<b>",G.shielding(x.descr),"</b>","<br/>",
			    G.shielding(x.address),"<br/>",
			    G.shielding(x.chan),"<hr/>",
			    info,
			    "</div>"
			].join('')
		    },
		    { 
			iconLayout: 'default#image', 
			iconImageHref: G.getstaticref('drawable/activity.png'),
			iconImageSize: [32, 32], 
			iconImageOffset: [-16, -26] 
		    }
		));
		if( typeof x.latitude != 'undefined' && typeof x.longitude != 'undefined' ) {
		    r.add(new ymaps.Polyline(
			[[obj.latitude, obj.longitude],[x.latitude, x.longitude]],
			{ hintContent: msgs.dist.format_a(obj.dist) },
			{ strokeColor: "#bf1515", strokeWidth: 4, strokeOpacity: 0.5 }
		    ));
		}
	    }
	}
	for( var key in data.my_accounts ) {
	    if( (obj = data.my_accounts[key]) != null && typeof obj.latitude != 'undefined' && typeof obj.longitude != 'undefined' ) {
		if( obj.route != null || obj._c ) {
		    var content = [
			"<div class='ymap-infowindow'>",
			"<b>",G.shielding(obj.descr),"</b>","<br/>",
			G.shielding(obj.address),"<br/>",
			G.shielding(obj.chan)
		    ];
		    if( Array.isArray(obj._ar) ) {
			obj._ar.forEach(function(ptr, index) {
			    if( ptr.closed != null ) {
				content.push(index == 0 ? "<hr />" : "<br />");
				content.push(msgs.closed.format_a(G.shielding(ptr.activity_type),
				    G.gettime_l(Date.parseISO8601(ptr.b_dt)), G.gettime_l(Date.parseISO8601(ptr.e_dt)),
				    ptr.duration, G.getdate_l(Date.parseISO8601(ptr.b_dt)), G.getint_l(ptr.dist)));
			    } else if( ptr.canceled != null ) {
				content.push(index == 0 ? "<hr />" : "<br />");
				content.push(msgs.canceled.format_a(G.shielding(ptr.activity_type)));
			    }
			});
		    }
		    content.push("</div>");
		    r.add(new ymaps.Placemark(
			[obj.latitude, obj.longitude],
			{ 
			    hintContent: msgs.account.format_a(G.shielding(obj.descr)), 
			    balloonContent: content.join('')
			},
			{ 
			    iconLayout: 'default#image', 
			    iconImageHref: G.getstaticref("drawable/{0}{1}.png".format_a(obj.route != null ? 'route' : 'my', obj._c != null ? "_closed" : "")),
			    iconImageSize: [48, 48], 
			    iconImageOffset: [obj.route != null ? -30 : -24, -46] 
			}
		    ));
		} else {
		    var content = [
			"<div class='ymap-infowindow'>",
			"<b>",G.shielding(obj.descr),"</b>","<br/>",
			G.shielding(obj.address),"<br/>",
			G.shielding(obj.chan),
			"</div>"
		    ];
		    my.add(new ymaps.Placemark(
			[obj.latitude, obj.longitude],
			{ 
			    hintContent: msgs.account.format_a(G.shielding(obj.descr)), 
			    balloonContent: content.join('')
			},
			{ 
			    iconLayout: 'default#image', 
			    iconImageHref: G.getstaticref('drawable/my.png'), 
			    iconImageSize: [48, 48], 
			    iconImageOffset: [-24, -46] 
			}
		    ));
		}
		obj._ar = null;
		obj._c = null;
	    }
	}

	return {route: r, my: my};
    }

    function _unsched(data) {
	var obj, ar = new ymaps.GeoObjectCollection(), msg = lang.tech.route.map.unsched;
	for( var i = 0, size = Array.isArray(data.unsched) ? data.unsched.length : 0; i < size && (obj = data.unsched[i]) != null; i++ ) {
	    if( typeof obj.latitude != 'undefined' && typeof obj.longitude != 'undefined' ) {
		ar.add(new ymaps.Placemark(
		    [obj.latitude, obj.longitude],
		    { hintContent: msg.format_a(G.gettime_l(Date.parseISO8601(obj.fix_dt))) },
		    { 
			iconLayout: 'default#image', 
			iconImageHref: G.getstaticref('drawable/unsched.png'), 
			iconImageSize: [32, 32], 
			iconImageOffset: [-16, -26] 
		    }
		));
	    }
	}
	return ar;
    }

    function _additions(data) {
	var obj, ar = new ymaps.GeoObjectCollection(), msg = lang.tech.route.map.addition;
	for( var i = 0, size = Array.isArray(data.additions) ? data.additions.length : 0; i < size && (obj = data.additions[i]) != null; i++ ) {
	    if( typeof obj.latitude != 'undefined' && typeof obj.longitude != 'undefined' ) {
		ar.add(new ymaps.Placemark(
		    [obj.latitude, obj.longitude],
		    { hintContent: msg.format_a(G.gettime_l(Date.parseISO8601(obj.fix_dt))) },
		    { 
			iconLayout: 'default#image',
			iconImageHref: G.getstaticref('drawable/addition.png'),
			iconImageSize: [48, 48],
			iconImageOffset: [-24, -46]
		    }
		));
	    }
	}
	return ar;
    }

    function _createCheckButton(caption, fn0, fn1) {
	btn.events.add('select', fn0).add('deselect', fn1);
    }

    function _createInstance(canvas, data) {
	var map = null, btn = null, objects = {}, len;

	if( data.map != null ) {
	    objects.unsched = _unsched(data);
	    objects.additions = _additions(data);
	    objects.accounts = _accounts(data);
	    objects.trace = _trace(data);
	    objects.controlPoints = _points(data);

	    map = new ymaps.Map(
		canvas, 
		{
		    controls: ['searchControl', 'fullscreenControl', 'zoomControl'],
		    center: [data.map.latitude, data.map.longitude],
		    zoom: 12
		}, 
		{
		    minZoom: 4, maxZoom: 19
		}
	    );
	    btn = new ymaps.control.Button({ data: { content: lang.tech.route.map.button0 }}, { selectOnClick: true });
	    btn.state.set('selected', true);
	    //map.geoObjects.add(objects.accounts.my);
	    map.geoObjects.add(objects.trace);
	    map.geoObjects.add(objects.controlPoints);
	    map.geoObjects.add(objects.accounts.route);
	    map.geoObjects.add(objects.unsched);
	    map.geoObjects.add(objects.additions);
	    map.controls.add(btn, { float: "left", maxWidth: 150 });
	    btn.events
		.add('select', function() { map.geoObjects.remove(objects.accounts.my); })
		.add('deselect', function() { map.geoObjects.add(objects.accounts.my); });
	}

	return map;
    }


    /* public properties & methods */
    return {
	getcode: function() { return _code; },
	getcaption: function() { return lang.tech.route.title1; },
	getbody: function() { return "<div class='warning' id='{0}-warning'> </div><div class='ymap-canvas' id='{0}-canvas'> </div>".format_a(_code); },

	setdata: function(body, user_id, date) {
	    var warn = _("{0}-warning".format_a(_code)), canvas = _("{0}-canvas".format_a(_code));
	    warn.hide(); canvas.hide();
	    if( _cache[user_id] != null ) { // set data from the internal cache
		if( _mapInstance != null ) {
		    _mapInstance.destroy();
		}
		_mapInstance = _createInstance(canvas, _cache[user_id])
		canvas.show();
		canvas.style.height = "{0}px".format_a(window.innerHeight - canvas.position().top - 5);
	    } else {
		ProgressDialog.show();
		_cache[user_id] = null; // drop the internal cache
		G.xhr("GET", G.getdataref({plug: "tech", code: "tech_route", user_id: user_id, date: G.getdate(date)}), "json", function(xhr, data) {
		    if( _mapInstance != null ) {
			_mapInstance.destroy();
		    }
		    if( xhr.status == 200 &&  data != null && typeof data == 'object' ) {
			if( (_mapInstance = _createInstance(canvas, data)) ) {
			    _cache[user_id] = data;
			    canvas.show();
			    canvas.style.height = "{0}px".format_a(window.innerHeight - canvas.position().top - 5);
			} else {
			    canvas.html("");
			    warn.html(lang.empty);
			    warn.show();
			}
		    } else {
			canvas.html("");
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

PLUG.registerTab(__ymap);
