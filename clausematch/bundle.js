(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _editorApp = require('./editor-app.controller');

var _editorApp2 = _interopRequireDefault(_editorApp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  templateUrl: 'app/components/editor-app/editor-app.template.html',
  controller: _editorApp2.default
};

},{"./editor-app.controller":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EditorAppController = function () {
  function EditorAppController() {
    _classCallCheck(this, EditorAppController);

    this.lines = ['There can be more >1 element', '<b>This one is bold</b>', '<i>This one is italic</i>'];
  }

  _createClass(EditorAppController, [{
    key: 'onLinesChanged',
    value: function onLinesChanged(lines) {
      this.lines = lines;
    }
  }]);

  return EditorAppController;
}();

exports.default = EditorAppController;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _editorInput = require('./editor-input.controller');

var _editorInput2 = _interopRequireDefault(_editorInput);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  controller: _editorInput2.default,
  bindings: {
    onTextChanged: '&',
    text: '<'
  }
};

},{"./editor-input.controller":4}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EditorInputController = function () {
  function EditorInputController($scope, $element) {
    _classCallCheck(this, EditorInputController);

    this.$element = $element;
    this.$scope = $scope;
  }

  _createClass(EditorInputController, [{
    key: '$onInit',
    value: function $onInit() {
      var _this = this;

      this.$element.attr('contenteditable', true);

      this.$element.bind('keyup', function () {
        _this.$scope.$evalAsync(function () {
          return _this.onTextChanged({ changedText: _this.$element.html() });
        });
      });
    }
  }, {
    key: '$onChanges',
    value: function $onChanges() {
      if (this.$element.html() !== this.text) {
        this.$element.html(this.text);
      }
    }
  }]);

  return EditorInputController;
}();

exports.default = EditorInputController;


EditorInputController.$inject = ['$scope', '$element'];

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _editorsList = require('./editors-list.controller');

var _editorsList2 = _interopRequireDefault(_editorsList);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  templateUrl: 'app/components/editors-list/editors-list.template.html',
  controller: _editorsList2.default,
  bindings: {
    lines: '<',
    onLinesChanged: '&'
  }
};

},{"./editors-list.controller":6}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EditorsListController = function () {
  function EditorsListController() {
    _classCallCheck(this, EditorsListController);

    // we need an abitility to edit text by simply clicking inside it
    // and also buttons should be clickable as normal
    this.cancelOptions = { cancel: 'button,[contenteditable]' };
  }

  _createClass(EditorsListController, [{
    key: 'onEditorChanged',
    value: function onEditorChanged(index, changedText) {
      this.lines[index] = changedText;
      this.onLinesChanged({ lines: this.lines });
    }
  }, {
    key: 'addEditorAtIndex',
    value: function addEditorAtIndex(index) {
      this.lines.splice(index + 1, 0, '');
      this.onLinesChanged({ lines: this.lines });
    }
  }, {
    key: 'removeEditorAtIndex',
    value: function removeEditorAtIndex(index) {
      this.lines.splice(index, 1);
      this.onLinesChanged({ lines: this.lines });
    }
  }]);

  return EditorsListController;
}();

exports.default = EditorsListController;

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _preview = require('./preview.controller');

var _preview2 = _interopRequireDefault(_preview);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  templateUrl: 'app/components/preview/preview.template.html',
  controller: _preview2.default,
  bindings: {
    lines: '<'
  }
};

},{"./preview.controller":8}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PreviewController = function () {
  function PreviewController() {
    _classCallCheck(this, PreviewController);
  }

  _createClass(PreviewController, [{
    key: "getFormattedData",
    value: function getFormattedData() {
      return JSON.stringify({ data: this.lines }, null, 4);
    }
  }]);

  return PreviewController;
}();

exports.default = PreviewController;

},{}],9:[function(require,module,exports){
'use strict';

var _editorInput = require('./components/editor-input/editor-input.component');

var _editorInput2 = _interopRequireDefault(_editorInput);

var _editorsList = require('./components/editors-list/editors-list.component');

var _editorsList2 = _interopRequireDefault(_editorsList);

var _preview = require('./components/preview/preview.component');

var _preview2 = _interopRequireDefault(_preview);

var _editorApp = require('./components/editor-app/editor-app.component');

var _editorApp2 = _interopRequireDefault(_editorApp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

angular.module('textEditor', ['ui.sortable']).component('cmEditorInput', _editorInput2.default).component('cmEditorsList', _editorsList2.default).component('cmPreview', _preview2.default).component('cmEditorApp', _editorApp2.default);

},{"./components/editor-app/editor-app.component":1,"./components/editor-input/editor-input.component":3,"./components/editors-list/editors-list.component":5,"./components/preview/preview.component":7}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHBcXGNvbXBvbmVudHNcXGVkaXRvci1hcHBcXGVkaXRvci1hcHAuY29tcG9uZW50LmpzIiwiYXBwXFxjb21wb25lbnRzXFxlZGl0b3ItYXBwXFxlZGl0b3ItYXBwLmNvbnRyb2xsZXIuanMiLCJhcHBcXGNvbXBvbmVudHNcXGVkaXRvci1pbnB1dFxcZWRpdG9yLWlucHV0LmNvbXBvbmVudC5qcyIsImFwcFxcY29tcG9uZW50c1xcZWRpdG9yLWlucHV0XFxlZGl0b3ItaW5wdXQuY29udHJvbGxlci5qcyIsImFwcFxcY29tcG9uZW50c1xcZWRpdG9ycy1saXN0XFxlZGl0b3JzLWxpc3QuY29tcG9uZW50LmpzIiwiYXBwXFxjb21wb25lbnRzXFxlZGl0b3JzLWxpc3RcXGVkaXRvcnMtbGlzdC5jb250cm9sbGVyLmpzIiwiYXBwXFxjb21wb25lbnRzXFxwcmV2aWV3XFxwcmV2aWV3LmNvbXBvbmVudC5qcyIsImFwcFxcY29tcG9uZW50c1xccHJldmlld1xccHJldmlldy5jb250cm9sbGVyLmpzIiwiYXBwXFxpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQ0FBOzs7Ozs7a0JBRWU7QUFDYixlQUFhLG9EQURBO0FBRWI7QUFGYSxDOzs7Ozs7Ozs7Ozs7O0lDRk0sbUI7QUFDbkIsaUNBQWM7QUFBQTs7QUFDWixTQUFLLEtBQUwsR0FBYSxDQUNYLDhCQURXLEVBRVgseUJBRlcsRUFHWCwyQkFIVyxDQUFiO0FBS0Q7Ozs7bUNBRWMsSyxFQUFPO0FBQ3BCLFdBQUssS0FBTCxHQUFhLEtBQWI7QUFDRDs7Ozs7O2tCQVhrQixtQjs7Ozs7Ozs7O0FDQXJCOzs7Ozs7a0JBRWU7QUFDYixtQ0FEYTtBQUViLFlBQVU7QUFDUixtQkFBZSxHQURQO0FBRVIsVUFBTTtBQUZFO0FBRkcsQzs7Ozs7Ozs7Ozs7OztJQ0ZNLHFCO0FBQ25CLGlDQUFZLE1BQVosRUFBb0IsUUFBcEIsRUFBOEI7QUFBQTs7QUFDNUIsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsU0FBSyxNQUFMLEdBQWMsTUFBZDtBQUNEOzs7OzhCQUVTO0FBQUE7O0FBQ1IsV0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixpQkFBbkIsRUFBc0MsSUFBdEM7O0FBRUEsV0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixPQUFuQixFQUE0QixZQUFNO0FBQ2hDLGNBQUssTUFBTCxDQUFZLFVBQVosQ0FBdUI7QUFBQSxpQkFBTSxNQUFLLGFBQUwsQ0FBbUIsRUFBRSxhQUFhLE1BQUssUUFBTCxDQUFjLElBQWQsRUFBZixFQUFuQixDQUFOO0FBQUEsU0FBdkI7QUFDRCxPQUZEO0FBR0Q7OztpQ0FFWTtBQUNYLFVBQUksS0FBSyxRQUFMLENBQWMsSUFBZCxPQUF5QixLQUFLLElBQWxDLEVBQXdDO0FBQ3RDLGFBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsS0FBSyxJQUF4QjtBQUNEO0FBQ0Y7Ozs7OztrQkFsQmtCLHFCOzs7QUFxQnJCLHNCQUFzQixPQUF0QixHQUFnQyxDQUFDLFFBQUQsRUFBVyxVQUFYLENBQWhDOzs7Ozs7Ozs7QUNyQkE7Ozs7OztrQkFFZTtBQUNiLGVBQWEsd0RBREE7QUFFYixtQ0FGYTtBQUdiLFlBQVU7QUFDUixXQUFPLEdBREM7QUFFUixvQkFBZ0I7QUFGUjtBQUhHLEM7Ozs7Ozs7Ozs7Ozs7SUNGTSxxQjtBQUVuQixtQ0FBYztBQUFBOztBQUNaO0FBQ0E7QUFDQSxTQUFLLGFBQUwsR0FBcUIsRUFBRSxRQUFRLDBCQUFWLEVBQXJCO0FBQ0Q7Ozs7b0NBRWUsSyxFQUFPLFcsRUFBYTtBQUNsQyxXQUFLLEtBQUwsQ0FBVyxLQUFYLElBQW9CLFdBQXBCO0FBQ0EsV0FBSyxjQUFMLENBQW9CLEVBQUUsT0FBTyxLQUFLLEtBQWQsRUFBcEI7QUFDRDs7O3FDQUVnQixLLEVBQU87QUFDdEIsV0FBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixRQUFRLENBQTFCLEVBQTZCLENBQTdCLEVBQWdDLEVBQWhDO0FBQ0EsV0FBSyxjQUFMLENBQW9CLEVBQUUsT0FBTyxLQUFLLEtBQWQsRUFBcEI7QUFDRDs7O3dDQUVtQixLLEVBQU87QUFDekIsV0FBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixLQUFsQixFQUF5QixDQUF6QjtBQUNBLFdBQUssY0FBTCxDQUFvQixFQUFFLE9BQU8sS0FBSyxLQUFkLEVBQXBCO0FBQ0Q7Ozs7OztrQkFyQmtCLHFCOzs7Ozs7Ozs7QUNBckI7Ozs7OztrQkFFZTtBQUNiLGVBQWEsOENBREE7QUFFYiwrQkFGYTtBQUdiLFlBQVU7QUFDUixXQUFPO0FBREM7QUFIRyxDOzs7Ozs7Ozs7Ozs7O0lDRk0saUI7Ozs7Ozs7dUNBQ0E7QUFDakIsYUFBTyxLQUFLLFNBQUwsQ0FBZSxFQUFFLE1BQU0sS0FBSyxLQUFiLEVBQWYsRUFBcUMsSUFBckMsRUFBMkMsQ0FBM0MsQ0FBUDtBQUNEOzs7Ozs7a0JBSGtCLGlCOzs7OztBQ0FyQjs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUEsUUFBUSxNQUFSLENBQWUsWUFBZixFQUE2QixDQUFDLGFBQUQsQ0FBN0IsRUFDRyxTQURILENBQ2EsZUFEYix5QkFFRyxTQUZILENBRWEsZUFGYix5QkFHRyxTQUhILENBR2EsV0FIYixxQkFJRyxTQUpILENBSWEsYUFKYiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgRWRpdG9yQXBwQ29udHJvbGxlciBmcm9tICcuL2VkaXRvci1hcHAuY29udHJvbGxlcic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgdGVtcGxhdGVVcmw6ICdhcHAvY29tcG9uZW50cy9lZGl0b3ItYXBwL2VkaXRvci1hcHAudGVtcGxhdGUuaHRtbCcsXHJcbiAgY29udHJvbGxlcjogRWRpdG9yQXBwQ29udHJvbGxlcixcclxufTtcclxuIiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgRWRpdG9yQXBwQ29udHJvbGxlciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLmxpbmVzID0gW1xyXG4gICAgICAnVGhlcmUgY2FuIGJlIG1vcmUgPjEgZWxlbWVudCcsXHJcbiAgICAgICc8Yj5UaGlzIG9uZSBpcyBib2xkPC9iPicsXHJcbiAgICAgICc8aT5UaGlzIG9uZSBpcyBpdGFsaWM8L2k+JyxcclxuICAgIF07XHJcbiAgfVxyXG5cclxuICBvbkxpbmVzQ2hhbmdlZChsaW5lcykge1xyXG4gICAgdGhpcy5saW5lcyA9IGxpbmVzO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgRWRpdG9ySW5wdXRDb250cm9sbGVyIGZyb20gJy4vZWRpdG9yLWlucHV0LmNvbnRyb2xsZXInO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG4gIGNvbnRyb2xsZXI6IEVkaXRvcklucHV0Q29udHJvbGxlcixcclxuICBiaW5kaW5nczoge1xyXG4gICAgb25UZXh0Q2hhbmdlZDogJyYnLFxyXG4gICAgdGV4dDogJzwnLFxyXG4gIH0sXHJcbn07XHJcbiIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIEVkaXRvcklucHV0Q29udHJvbGxlciB7XHJcbiAgY29uc3RydWN0b3IoJHNjb3BlLCAkZWxlbWVudCkge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9ICRlbGVtZW50O1xyXG4gICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XHJcbiAgfVxyXG5cclxuICAkb25Jbml0KCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdjb250ZW50ZWRpdGFibGUnLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50LmJpbmQoJ2tleXVwJywgKCkgPT4ge1xyXG4gICAgICB0aGlzLiRzY29wZS4kZXZhbEFzeW5jKCgpID0+IHRoaXMub25UZXh0Q2hhbmdlZCh7IGNoYW5nZWRUZXh0OiB0aGlzLiRlbGVtZW50Lmh0bWwoKSB9KSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gICRvbkNoYW5nZXMoKSB7XHJcbiAgICBpZiAodGhpcy4kZWxlbWVudC5odG1sKCkgIT09IHRoaXMudGV4dCkge1xyXG4gICAgICB0aGlzLiRlbGVtZW50Lmh0bWwodGhpcy50ZXh0KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbkVkaXRvcklucHV0Q29udHJvbGxlci4kaW5qZWN0ID0gWyckc2NvcGUnLCAnJGVsZW1lbnQnXTtcclxuXHJcbiIsImltcG9ydCBFZGl0b3JzTGlzdENvbnRyb2xsZXIgZnJvbSAnLi9lZGl0b3JzLWxpc3QuY29udHJvbGxlcic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgdGVtcGxhdGVVcmw6ICdhcHAvY29tcG9uZW50cy9lZGl0b3JzLWxpc3QvZWRpdG9ycy1saXN0LnRlbXBsYXRlLmh0bWwnLFxyXG4gIGNvbnRyb2xsZXI6IEVkaXRvcnNMaXN0Q29udHJvbGxlcixcclxuICBiaW5kaW5nczoge1xyXG4gICAgbGluZXM6ICc8JyxcclxuICAgIG9uTGluZXNDaGFuZ2VkOiAnJicsXHJcbiAgfSxcclxufTtcclxuIiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgRWRpdG9yc0xpc3RDb250cm9sbGVyIHtcclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAvLyB3ZSBuZWVkIGFuIGFiaXRpbGl0eSB0byBlZGl0IHRleHQgYnkgc2ltcGx5IGNsaWNraW5nIGluc2lkZSBpdFxyXG4gICAgLy8gYW5kIGFsc28gYnV0dG9ucyBzaG91bGQgYmUgY2xpY2thYmxlIGFzIG5vcm1hbFxyXG4gICAgdGhpcy5jYW5jZWxPcHRpb25zID0geyBjYW5jZWw6ICdidXR0b24sW2NvbnRlbnRlZGl0YWJsZV0nIH07XHJcbiAgfVxyXG5cclxuICBvbkVkaXRvckNoYW5nZWQoaW5kZXgsIGNoYW5nZWRUZXh0KSB7XHJcbiAgICB0aGlzLmxpbmVzW2luZGV4XSA9IGNoYW5nZWRUZXh0O1xyXG4gICAgdGhpcy5vbkxpbmVzQ2hhbmdlZCh7IGxpbmVzOiB0aGlzLmxpbmVzIH0pO1xyXG4gIH1cclxuXHJcbiAgYWRkRWRpdG9yQXRJbmRleChpbmRleCkge1xyXG4gICAgdGhpcy5saW5lcy5zcGxpY2UoaW5kZXggKyAxLCAwLCAnJyk7XHJcbiAgICB0aGlzLm9uTGluZXNDaGFuZ2VkKHsgbGluZXM6IHRoaXMubGluZXMgfSk7XHJcbiAgfVxyXG5cclxuICByZW1vdmVFZGl0b3JBdEluZGV4KGluZGV4KSB7XHJcbiAgICB0aGlzLmxpbmVzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB0aGlzLm9uTGluZXNDaGFuZ2VkKHsgbGluZXM6IHRoaXMubGluZXMgfSk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCBQcmV2aWV3Q29udHJvbGxlciBmcm9tICcuL3ByZXZpZXcuY29udHJvbGxlcic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgdGVtcGxhdGVVcmw6ICdhcHAvY29tcG9uZW50cy9wcmV2aWV3L3ByZXZpZXcudGVtcGxhdGUuaHRtbCcsXHJcbiAgY29udHJvbGxlcjogUHJldmlld0NvbnRyb2xsZXIsXHJcbiAgYmluZGluZ3M6IHtcclxuICAgIGxpbmVzOiAnPCcsXHJcbiAgfSxcclxufTtcclxuIiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJldmlld0NvbnRyb2xsZXIge1xyXG4gIGdldEZvcm1hdHRlZERhdGEoKSB7XHJcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoeyBkYXRhOiB0aGlzLmxpbmVzIH0sIG51bGwsIDQpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgZWRpdG9ySW5wdXRDb21wb25lbnQgZnJvbSAnLi9jb21wb25lbnRzL2VkaXRvci1pbnB1dC9lZGl0b3ItaW5wdXQuY29tcG9uZW50JztcclxuaW1wb3J0IGVkaXRvcnNMaXN0Q29tcG9uZW50IGZyb20gJy4vY29tcG9uZW50cy9lZGl0b3JzLWxpc3QvZWRpdG9ycy1saXN0LmNvbXBvbmVudCc7XHJcbmltcG9ydCBwcmV2aWV3Q29tcG9uZW50IGZyb20gJy4vY29tcG9uZW50cy9wcmV2aWV3L3ByZXZpZXcuY29tcG9uZW50JztcclxuaW1wb3J0IGVkaXRvckFwcENvbXBvbmVudCBmcm9tICcuL2NvbXBvbmVudHMvZWRpdG9yLWFwcC9lZGl0b3ItYXBwLmNvbXBvbmVudCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndGV4dEVkaXRvcicsIFsndWkuc29ydGFibGUnXSlcclxuICAuY29tcG9uZW50KCdjbUVkaXRvcklucHV0JywgZWRpdG9ySW5wdXRDb21wb25lbnQpXHJcbiAgLmNvbXBvbmVudCgnY21FZGl0b3JzTGlzdCcsIGVkaXRvcnNMaXN0Q29tcG9uZW50KVxyXG4gIC5jb21wb25lbnQoJ2NtUHJldmlldycsIHByZXZpZXdDb21wb25lbnQpXHJcbiAgLmNvbXBvbmVudCgnY21FZGl0b3JBcHAnLCBlZGl0b3JBcHBDb21wb25lbnQpO1xyXG4iXX0=
