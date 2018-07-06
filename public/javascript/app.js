/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
module.exports = __webpack_require__(3);


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("Object.defineProperty(__webpack_exports__, \"__esModule\", { value: true });\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__javascript_navbar_js__ = __webpack_require__(2);\n\n\n\n\nvar nav = new __WEBPACK_IMPORTED_MODULE_0__javascript_navbar_js__[\"a\" /* default */](document.querySelector('nav.is-fixed-top'));//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9hc3NldHMvYXBwLmpzPzczNDciXSwibmFtZXMiOlsibmF2IiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUVBOztBQUVBLElBQUlBLE1BQU0sSUFBSSxzRUFBSixDQUFXQyxTQUFTQyxhQUFULENBQXVCLGtCQUF2QixDQUFYLENBQVYiLCJmaWxlIjoiMS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IE5hdkJhciBmcm9tICcuL2phdmFzY3JpcHQvbmF2YmFyLmpzJztcblxubGV0IG5hdiA9IG5ldyBOYXZCYXIoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbmF2LmlzLWZpeGVkLXRvcCcpKTtcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9hc3NldHMvYXBwLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///1\n");

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("\n\nvar _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nvar _class = function () {\n    function _class(element) {\n        _classCallCheck(this, _class);\n\n        this.navbar = element;\n\n        if (this.navbar !== null) {\n            this._scrollInit();\n        }\n    }\n\n    _createClass(_class, [{\n        key: \"_scrollInit\",\n        value: function _scrollInit() {\n            var _this = this;\n\n            window.onscroll = function (evt) {\n                return _this._scrollEvent(evt);\n            };\n        }\n    }, {\n        key: \"_scrollEvent\",\n        value: function _scrollEvent(evt) {\n            if (document.body.scrollTop > 5 || document.documentElement.scrollTop > 5) {\n                this.navbar.classList.add(\"is-scrolled\");\n            } else {\n                this.navbar.classList.remove(\"is-scrolled\");\n            }\n        }\n    }]);\n\n    return _class;\n}();\n\n/* harmony default export */ __webpack_exports__[\"a\"] = (_class);//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9hc3NldHMvamF2YXNjcmlwdC9uYXZiYXIuanM/YzIxYiJdLCJuYW1lcyI6WyJlbGVtZW50IiwibmF2YmFyIiwiX3Njcm9sbEluaXQiLCJ3aW5kb3ciLCJvbnNjcm9sbCIsIl9zY3JvbGxFdmVudCIsImV2dCIsImRvY3VtZW50IiwiYm9keSIsInNjcm9sbFRvcCIsImRvY3VtZW50RWxlbWVudCIsImNsYXNzTGlzdCIsImFkZCIsInJlbW92ZSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFHSSxvQkFBWUEsT0FBWixFQUFxQjtBQUFBOztBQUNqQixhQUFLQyxNQUFMLEdBQWNELE9BQWQ7O0FBRUEsWUFBSSxLQUFLQyxNQUFMLEtBQWdCLElBQXBCLEVBQTBCO0FBQ3RCLGlCQUFLQyxXQUFMO0FBQ0g7QUFDSjs7OztzQ0FFYTtBQUFBOztBQUNWQyxtQkFBT0MsUUFBUCxHQUFrQjtBQUFBLHVCQUFPLE1BQUtDLFlBQUwsQ0FBa0JDLEdBQWxCLENBQVA7QUFBQSxhQUFsQjtBQUNIOzs7cUNBRVlBLEcsRUFBSztBQUNkLGdCQUFJQyxTQUFTQyxJQUFULENBQWNDLFNBQWQsR0FBMEIsQ0FBMUIsSUFBK0JGLFNBQVNHLGVBQVQsQ0FBeUJELFNBQXpCLEdBQXFDLENBQXhFLEVBQTJFO0FBQ3ZFLHFCQUFLUixNQUFMLENBQVlVLFNBQVosQ0FBc0JDLEdBQXRCLENBQTBCLGFBQTFCO0FBQ0gsYUFGRCxNQUVPO0FBQ0gscUJBQUtYLE1BQUwsQ0FBWVUsU0FBWixDQUFzQkUsTUFBdEIsQ0FBNkIsYUFBN0I7QUFDSDtBQUNKIiwiZmlsZSI6IjIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XG4gICAgICAgIHRoaXMubmF2YmFyID0gZWxlbWVudDtcblxuICAgICAgICBpZiAodGhpcy5uYXZiYXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbEluaXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9zY3JvbGxJbml0KCkge1xuICAgICAgICB3aW5kb3cub25zY3JvbGwgPSBldnQgPT4gdGhpcy5fc2Nyb2xsRXZlbnQoZXZ0KVxuICAgIH1cblxuICAgIF9zY3JvbGxFdmVudChldnQpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wID4gNSB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wID4gNSkge1xuICAgICAgICAgICAgdGhpcy5uYXZiYXIuY2xhc3NMaXN0LmFkZChcImlzLXNjcm9sbGVkXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5uYXZiYXIuY2xhc3NMaXN0LnJlbW92ZShcImlzLXNjcm9sbGVkXCIpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2Fzc2V0cy9qYXZhc2NyaXB0L25hdmJhci5qcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///2\n");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

eval("// removed by extract-text-webpack-plugin//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9hc3NldHMvc2Fzcy9tYWluLnNjc3M/ZmEyOCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSIsImZpbGUiOiIzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gcmVtb3ZlZCBieSBleHRyYWN0LXRleHQtd2VicGFjay1wbHVnaW5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2Fzc2V0cy9zYXNzL21haW4uc2Nzc1xuLy8gbW9kdWxlIGlkID0gM1xuLy8gbW9kdWxlIGNodW5rcyA9IDAiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///3\n");

/***/ })
/******/ ]);