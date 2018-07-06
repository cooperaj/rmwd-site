'use strict';

export default class {
    constructor(element) {
        this.navbar = element;

        if (this.navbar !== null) {
            this._scrollInit();
        }
    }

    _scrollInit() {
        window.onscroll = evt => this._scrollEvent(evt)
    }

    _scrollEvent(evt) {
        if (document.body.scrollTop > 5 || document.documentElement.scrollTop > 5) {
            this.navbar.classList.add("is-scrolled");
        } else {
            this.navbar.classList.remove("is-scrolled");
        }
    }
}