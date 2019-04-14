/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file. */

function spinnerSmall(tag, top, left) {
    var p = tag.position();
    if( typeof top == 'undefined' || top == "center" ) {
	top = "{0}px".format_a(p.top + p.height/2);
    } else if( typeof top == 'number' ) {
	top = "{0}px".format_a(top);
    }
    if( typeof left == 'undefined' || left == "center" ) {
	left = "{0}px".format_a(p.left + p.width/2);
    } else if( typeof left == 'number' ) {
	left = "{0}px".format_a(left);
    }

    return new Spinner({lines: 6, length: 1, width: 2, radius: 3, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, 
	shadow: false, hwaccel: false, top: top, left: left}).spin(tag);
}

function spinnerLarge(tag, top, left) {
    var p = tag.position();
    if( typeof top == 'undefined' || top == "center" ) {
	top = "{0}px".format_a(p.top + p.height/2);
    } else if( typeof top == 'number' ) {
	top = "{0}px".format_a(top);
    }
    if( typeof left == 'undefined' || left == "center" ) {
	left = "{0}px".format_a(p.left + p.width/2);
    } else if( typeof left == 'number' ) {
	left = "{0}px".format_a(left);
    }

    return new Spinner({lines: 8, length: 2, width: 4, radius: 6, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, 
	shadow: false, hwaccel: false, top: top, left: left}).spin(tag);
}



/* OBSOLETE: */

function _SPIN_OPT(opt, top, left) {
    if( top != null ) 	{ opt.top = top; }
    if( left != null ) 	{ opt.left = left; }
    return opt;
}

function SPIN_LARGE(top, left) {
    return _SPIN_OPT({lines: 8, length: 2, width: 4, radius: 6, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false}, top, left);
}

//function SPIN_MEDIUM(top, left) {
//    return _SPIN_OPT({lines: 8, length: 2, width: 4, radius: 5, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false}, top, left);
//}
//
//function SPIN_SMALL(top, left) {
//    return _SPIN_OPT({lines: 6, length: 1, width: 2, radius: 3, corners: 1, rotate: 0, direction: 1, speed: 1, trail: 60, shadow: false, hwaccel: false}, top, left);
//}
