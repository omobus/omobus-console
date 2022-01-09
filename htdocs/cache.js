/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

/* OBSOLETE: begin */

function Cache(name) {
    this.name = name;
}

Cache.prototype.getchecked = function(row_id) {
    return typeof this.checked != 'undefined' && typeof this.checked[row_id] != 'undefined' && this.checked[row_id] == true;
}

Cache.prototype.setchecked = function(row_id, flag) {
    if( typeof this.checked == 'undefined' ) {
        this.checked = [];
    }
    this.checked[row_id] = flag;
    //console.log(row_id + ":" + this.checked[row_id]);
}

Cache.prototype.checkrow = function(tr, row_id) {
    if( tr.className == 'selected' ) {
	tr.className = null;
	this.setchecked(row_id);
    } else {
	tr.className = 'selected';
	this.setchecked(row_id, true);
    }
}

/* OBSOLETE: end */