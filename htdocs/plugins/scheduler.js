/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file. */

var PLUG = (function() {
    /* private properties & methods */
    var _code = "scheduler";
    var _tags = {};

    const TIMELINE = [['09:00','11:00'],['11:00','13:00'],['14:00','16:00'],['16:00','18:00']];
    const WEEKENDS = [1,0,0,0,0,0,1,/*7:*/1];

    function _getbody() {
	var ar = [];
	ar.push("<div id='schedule'></div>");
	ar.push(MonthsPopup.container());
	ar.push(UsersPopup.container());
	ar.push(Dialog.container());
	return ar;
    }

    function _getDaysInMonth(month, year) {
	var daysInMonth=[31,28,31,30,31,30,31,31,30,31,30,31];
	return (month==1)&&(year%4==0)&&((year%100!=0)||(year%400==0)) ? 29 : daysInMonth[month];
    }

    function _format(arg) {
	if( typeof arg == 'undefined' ) 
	    return "&nbsp;";
	if( arg.type == 'audit' || arg.type == 'coaching' ) 
	    return "{0}: <i>{1}</i>".format_a(lang.scheduler.types[arg.type], G.shielding(arg.employee_name,lang.dash));
	if( arg.type == 'account' ) 
	    return "{0}: <i>{1}</i>".format_a(lang.scheduler.types[arg.type], G.shielding(arg.a_name,lang.dash));
	return lang.scheduler.types[arg.type] || "&nbsp;";
    }

    function _warntbl(msg) {
	var ar = [];
	ar.push("<div class='warning'>", lang.scheduler.title, "</div>");
	ar.push("<div class='warning'>", msg, "</div>");
	return ar;
    }

    function _schedtbl(data, perm) {
	var ar = [];
	var func = function(arg) { return arg.user_id == data.user_id; };
	var year = data.year;
	var month = data.month - 1;
	var days = _getDaysInMonth(month, year);
	var firstDayDate = new Date(year, month, 1);
	var firstWeekDay = firstDayDate.getDay();
	var p_month = month == 0 ? 11 : month - 1;
	var p_year = p_month == 11 ? year - 1 : year;
	var p_days = _getDaysInMonth(p_month, p_year);
	var n_month = month == 11 ? 0 : month + 1;
	var n_year = n_month == 0 ? year + 1 : year;
	firstWeekDay = (firstWeekDay == 0 && firstDayDate) ? 7 : firstWeekDay;
	ar.push("<br/>");
	ar.push("<table width='100%' class='schedule'>");
	ar.push("<tbody>");
	ar.push("<tr>");
	ar.push("<td rowspan='3'></td>");
	ar.push("<th id='sched:stat_L' class='stats' width='20%' rowspan='3'></th>");
	ar.push("<th class='title' width='60%' colspan='3'>", "<b>", "<span id='sched:refresh' class='footnote clickable' data-title='", 
	    "{0} {1}".format_a(lang.received_ts, G.getdatetime_l(new Date())), "'>", lang.scheduler.title.toUpperCase(), 
	    "</b>", "</span>", "</th>");
	ar.push("<th id='sched:stat_R' class='stats' width='20%' rowspan='3'></th>");
	ar.push("<td rowspan='3'></td>");
	ar.push("</tr>");
	ar.push("<tr>");
	ar.push("<th class='title' width='60%' colspan='3'>", "<a id='sched:u_name' class='important' href='javascript:void(0)'>", 
	    data.myself ? lang.scheduler.myself.toUpperCase() : G.shielding(data.users.find(func)).descr, "</a>", "</th>");
	ar.push("</tr>");
	ar.push("<tr>");
	ar.push("<th class='title' width='60%' colspan='3'>", "<a id='sched:month' class='important' href='javascript:void(0)'>", 
	    G.getlongmonth_l(new Date(year, month)), "</a>", "</th>");
	ar.push("</tr>");

	for( var a = 0, z = lang.calendar.firstDay, p = 0; a < 6 /*weeks*/; a++ ) {
	    var wdaysParams = [], param, workingDays = 0;

	    for( var b = lang.calendar.firstDay; b <= lang.calendar.lastDay /*wdays*/; b++ ) {
		var param = {};
		if( z < firstWeekDay ) {
		    param.num = p_days - firstWeekDay + z + 1;
		} else if( z >= firstWeekDay + days ) {
		    p = p + 1;
		    param.num = p;
		} else {
		    param.num = z - firstWeekDay + 1;
		    param.ptr = data.days[param.num] || {};
		    param.myself = data.myself;
		    workingDays += (WEEKENDS[b] ? 0 : 1);
		}
		if( !WEEKENDS[b] ) {
		    wdaysParams.push(param);
		}
		z++;
	    }

	    if( workingDays == 0 ) {
		continue;
	    }

	    ar.push("<tr>");
	    ar.push("<td rowspan='2'></td>");
	    for( var b = 0; b < 5 /*days*/; b++ ) {
		param = wdaysParams[b];
		if( param.ptr == null ) {
		    ar.push("<th width='20%' rowspan='2'></th>");
		} else {
		    ar.push("<th width='20%'>", param.num, "</th>");
		}
	    }
	    ar.push("<td rowspan='2'></td>");
	    ar.push("</tr>");

	    ar.push("<tr>");
	    for( var b = 0; b < 5 /*days*/; b++ ) {
		param = wdaysParams[b];
		if( param.ptr != null ) {
		    ar.push("<th width='20%'>", lang.calendar.days.names[b+1], "</th>");
		}
	    }
	    ar.push("</tr>");

	    for( var u = 1; u <= 4; u++ ) {
		var timeline = TIMELINE[u-1];
		ar.push("<tr>");
		ar.push("<th class='footnote' data-title='", "{0} - {1}".format_a(timeline[0],timeline[1]), "'>", u, "</th>");
		for( var b = 0; b < 5 /*days*/; b++ ) {
		    var param = wdaysParams[b];
		    if( param.ptr == null || !Array.isArray(param.ptr.jobs) ) {
			if( u == 1 ) {
			    ar.push("<td rowspan='4'></td>");
			}
		    } else if( !String.isEmpty(param.ptr.canceling_note) ) {
			if( u == 1 ) {
			    ar.push("<td class='note' rowspan='4'>", param.ptr.canceling_note.toUpperCase(), "</td>");
			}
		    } else if( param.ptr.closed ) {
			ar.push("<td class='job_disabled'>", _format(param.ptr.jobs[u-1]), "</td>");
		    } else if( param.myself ) {
			ar.push("<td class='job_clickable' timeline='", u, "' mday='", param.num, "'>", _format(param.ptr.jobs[u-1]), "</td>");
		    } else {
			ar.push("<td class='job'>", _format(param.ptr.jobs[u-1]), "</td>");
		    }
		}
		ar.push("<th>", u, "</th>");
		ar.push("</tr>");
	    }
	}
	ar.push("</tbody>");
	ar.push("</table>");

	return ar;
    }

    function _jobbodytbl(timeline, employees) {
	var ar = [];
	ar.push("<div class='row'>", lang.scheduler.notice.format_a(timeline[0],timeline[1]), "</div>");
	ar.push("<div class='row attention gone' id='job:alert'></div>");
	ar.push("<div class='row'>");
	ar.push("<select id='job:type'>");
	ar.push("<option value=''>", lang.not_specified, "</option>");
	for( const [key, value] of Object.entries(lang.scheduler.types) ) {
	    ar.push("<option value='", key, "'>", value, "</option>");
	}
	ar.push("</select>");
	ar.push("</div>");
	ar.push("<div class='row'>");
	ar.push("<select id='job:emp'>");
	ar.push("<option value=''>", lang.not_specified, "</option>");
	if( Array.isArray(employees) ) {
	    employees.forEach(function(arg) {ar.push("<option value='", G.shielding(arg.user_id), "'>", G.shielding(arg.descr), "</option>"); });
	}
	ar.push("</select>");
	ar.push("</div>");
	ar.push("<div class='row'>");
	ar.push("<input id='job:account' type='text' placeholder='", lang.scheduler.placeholder, "' autocomplete='on'>", "</input>");
	ar.push("</div>");
	return ar;
    }

    function _jobbtntbl() {
	var ar = [];
	ar.push("<div class='row' align='right'>");
	ar.push("<button id='job:back'>", lang.back, "</button>");
	ar.push("&nbsp;&nbsp;");
	ar.push("<button id='job:commit' disabled='true'>", lang.scheduler.commit, "</button>");
	ar.push("&nbsp;&nbsp;");
	ar.push("</div>");
	return ar;
    }


    function _checkJob(arg) {
	if( arg.type == 'audit' || arg.type == 'coaching' ) {
	    return !String.isEmpty(arg.employee_id);
	} else if( arg.type == 'account' ) {
	    return !String.isEmpty(arg.a_name);
	}
	return /*!String.isEmpty(arg.type)*/true;
    }

    function _onclickJobListener(tag, data, cb) {
	const num = tag.getAttribute('timeline');
	const mday = tag.getAttribute('mday');
	const timeline = TIMELINE[num-1];
	var ptr = data.days[mday];
	var job = ptr.jobs[num-1];
	var newJob = Object.assign({}, job);

	Dialog({
	    width: 550, 
	    title: lang.scheduler.caption.format_a(timeline[0], timeline[1], G.getlongday_l(ptr.p_date)),
	    body: _jobbodytbl(timeline, data.employees),
	    buttons: _jobbtntbl()
	}).show(function(dialogObject) {
	    const alertView = _('job:alert');
	    const empView = _('job:emp');
	    const accountView = _('job:account');
	    const typeView = _('job:type');
	    const backView = _('job:back');
	    const commitView = _('job:commit');
	    const func = function() {
		if( newJob.type == 'audit' || newJob.type == 'coaching' ) {
		    empView.parentElement.show();
		    accountView.parentElement.hide();
		} else if( newJob.type == 'account' ) {
		    empView.parentElement.hide();
		    accountView.parentElement.show();
		} else { 
		    empView.parentElement.hide();
		    accountView.parentElement.hide();
		}
		commitView.disabled = !( 
		    ((job.type||'') != (newJob.type||'') || job.employee_id != newJob.employee_id || job.a_name != newJob.a_name) 
			&& _checkJob(newJob)
		);
	    }

	    if( typeof job.type != 'undefined' ) {
		typeView.value = job.type;
	    }
	    if( typeof job.a_name != 'undefined' ) {
		accountView.value = job.a_name;
	    }
	    if( typeof job.employee_id != 'undefined' ) {
		empView.value = job.employee_id;
	    }

	    typeView.onchange = function() {
		newJob.type = (this.value || this.options[this.selectedIndex].value);
		func();
	    };
	    empView.onchange = function() {
		newJob.employee_id = (this.value || this.options[this.selectedIndex].value);
		newJob.employee_name = (/*this.innerText ||*/ this.options[this.selectedIndex].innerText);
		func();
	    };
	    accountView.oninput = function() {
		newJob.a_name = this.value.trim();
		func();
	    }
	    backView.onclick = function() {
		dialogObject.hide();
	    }
	    commitView.onclick = function() {
		var par = {plug: _code, _datetime: G.getdatetime(new Date()), user_id: data.user_id, date: ptr.p_date, num: num};
		dialogObject.startSpinner();
		alertView.hide();
		if( typeof newJob.type == 'undefined' || newJob.type == '' ) {
		    G.xhr("DELETE", G.getdataref(par), "json", function(xhr, resp) {
			if( xhr.status == 200 && typeof resp.updated_rows != 'undefined' && resp.updated_rows > 0 ) {
			    ptr.jobs[num-1] = {};
			    tag.html("");
			    dialogObject.hide();
			    cb(data);
			} else {
			    alertView.html(lang.errors.runtime);
			    alertView.show();
			}
			dialogObject.stopSpinner();
		    }).send();
		} else {
		    var xz = {};
		    xz.type = newJob.type;
		    if( newJob.type == 'audit' || newJob.type == 'coaching' ) {
			xz.employee_id = newJob.employee_id;
			xz.employee_name = newJob.employee_name;
		    } else if( newJob.type == 'account' ) {
			xz.a_name = newJob.a_name;
		    }
		    var xhr = G.xhr("PUT", G.getdataref(par), "json", function(xhr, resp) {
			if( xhr.status == 200 ) {
			    if( typeof resp.updated_rows != 'undefined' && resp.updated_rows > 0 ) {
				ptr.jobs[num-1] = xz;
				tag.html(_format(xz));
			    } else {
				Toast.show(lang.scheduler.ignored);
			    }
			    dialogObject.hide();
			    cb(data);
			} else {
			    alertView.html(xhr.status == 403 ? lang.errors.not_permitted : lang.errors.runtime);
			    alertView.show();
			}
			dialogObject.stopSpinner();
		    });
		    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		    xhr.send(G.formParamsURI(xz));
		}
	    }

	    func();
	});
    }

    function _onclickPopupListener(tag, popup, cb) {
	var x;
	for( var name in _tags.popups) {
	    if( typeof popup != 'undefined' && name == popup ) {
		x = _tags.popups[name];
	    } else {
		_tags.popups[name].hide();
	    }
	}
	if( typeof popup != 'undefined' && x == null ) {
	    x = _tags.popups[popup] = cb(popup);
	}
	if( x != null ) {
	    x.toggle(tag);
	}
    }

    function _schedreq(params, updateHistory, perm) {
	ProgressDialog.show();
	G.xhr("GET", G.getdataref(Object.assign({plug:_code}, params)), "json", function(xhr, data) {
	    if( xhr.status == 200 && data != null && typeof data == 'object' ) {
		//console.log(data);
		_tags.sched.html(_schedtbl(data, perm).join(""));
		/* initialize scheduler: */
		var refresh = _('sched:refresh');
		var u_name = _('sched:u_name');
		var month = _('sched:month');
		var stat_L = _('sched:stat_L');
		var stat_R = _('sched:stat_R');
		var jobs = _tags.sched.getElementsByClassName('job_clickable');
		var stats = function(arg) {
		    var a = [0,0,0,0], t, arL = [], arR = [];
		    for( var prop in arg.days ) {
			var p = arg.days[prop];
			for( var i = 0, size = Array.isArray(p.jobs) ? p.jobs.length : 0; i < size; i++ ) {
			    if( String.isEmpty(p.canceling_note) ) {
				var t = p.jobs[i].type;
				if( t == 'office' ) {
				    a[0]++; a[2]++;
				} else if( ['account','audit','coaching'].includes(t) ) {
				    a[1]++; a[2]++;
				}
				a[3]++;
			    }
			}
		    }
		    if( a[2] > 0 ) {
			t = Math.round(100.0*a[0]/a[2]);
			arL.push("<table width='100%'>");
			arL.push("<tr>");
			arL.push("<td class='noborder", t > 20 ? ' attention' : '', "'>", t, "%</td>");
			arL.push("<td class='noborder'>", 100.0 - t, "%</td>");
			arL.push("</tr>");
			arL.push("<tr>");
			arL.push("<td class='noborder watermark'>", lang.scheduler.office_work.toLowerCase(), "</td>");
			arL.push("<td class='noborder watermark'>", lang.scheduler.field_work.toLowerCase(), "</td>");
			arL.push("</tr>");
			arL.push("</table>");
		    }
		    if( a[3] > 0 ) {
			t = Math.round(100.0*a[2]/a[3]);
			arR.push("<table width='100%'>");
			arR.push("<tr>");
			arR.push("<td class='noborder", t < 100 ? ' attention' : '', "'>", t, "%</td>");
			arR.push("</tr>");
			arR.push("<tr>");
			arR.push("<td class='noborder watermark'>", lang.scheduler.total_work.toLowerCase(), "</td>");
			arR.push("</tr>");
			arR.push("</table>");
		    }
		    //console.log(a);
		    stat_L.html(arL.join(''));
		    stat_R.html(arR.join(''));
		}

		for( var i = 0; i < jobs.length; i++ ) {
		    jobs[i].onclick = function() { _onclickJobListener(this, data, stats); };
		}
		refresh.onclick = function() {
		    _schedreq(params, false, perm);
		}
		u_name.onclick = function() { 
		    _onclickPopupListener(this, "users", function(name) {
			return UsersPopup(data[name], function(arg, i, ar) {
			    if( data.user_id != arg.user_id ) {
				_schedreq({user_id: arg.user_id, year: data.year, month: data.month}, true, perm);
			    }
			}, {everyone:false, defaults:data.user_id});
		    }); 
		}
		month.onclick = function() {
		    _onclickPopupListener(this, "months", function(name) {
			return MonthsPopup(data[name], function(arg, i, ar) {
			    if( data.month != arg.month || data.year != arg.year ) {
				_schedreq({user_id: data.user_id, year: arg.year, month: arg.month}, true, perm);
			    }
			}, {defaults: {y:data.year, m:data.month}});
		    }); 
		}

		stats(data);
	    } else {
		_tags.sched.html(_warntbl(xhr.status == 403 ? lang.errors.not_permitted : lang.errors.runtime).join(""));
	    }
	    if( updateHistory ) {
		history.replaceState(params, "", G.getdefref(Object.assign({plug:_code}, params)));
	    }
	    _tags.popups = {};
	    ProgressDialog.hide();
	}).send();
    }


/* public properties & methods */
    return {
	startup: function(tags, params, perm) {
	    _tags = tags;
	    _tags.body.html(_getbody().join(""));
	    _tags.sched = _("schedule");
	    _tags.popups = {};
	    _schedreq(params, false, perm);
	}
    }
})();


function startup(params, perm) {
    PLUG.startup({body: _('pluginContainer')}, params, perm);
}

window.onpopstate = function(event) {
    window.location.reload(true);
}
