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

    this.lines = ['test1', 'test2', 'test3'];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHBcXGNvbXBvbmVudHNcXGVkaXRvci1hcHBcXGVkaXRvci1hcHAuY29tcG9uZW50LmpzIiwiYXBwXFxjb21wb25lbnRzXFxlZGl0b3ItYXBwXFxlZGl0b3ItYXBwLmNvbnRyb2xsZXIuanMiLCJhcHBcXGNvbXBvbmVudHNcXGVkaXRvci1pbnB1dFxcZWRpdG9yLWlucHV0LmNvbXBvbmVudC5qcyIsImFwcFxcY29tcG9uZW50c1xcZWRpdG9yLWlucHV0XFxlZGl0b3ItaW5wdXQuY29udHJvbGxlci5qcyIsImFwcFxcY29tcG9uZW50c1xcZWRpdG9ycy1saXN0XFxlZGl0b3JzLWxpc3QuY29tcG9uZW50LmpzIiwiYXBwXFxjb21wb25lbnRzXFxlZGl0b3JzLWxpc3RcXGVkaXRvcnMtbGlzdC5jb250cm9sbGVyLmpzIiwiYXBwXFxjb21wb25lbnRzXFxwcmV2aWV3XFxwcmV2aWV3LmNvbXBvbmVudC5qcyIsImFwcFxcY29tcG9uZW50c1xccHJldmlld1xccHJldmlldy5jb250cm9sbGVyLmpzIiwiYXBwXFxpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQ0FBOzs7Ozs7a0JBRWU7QUFDYixlQUFhLG9EQURBO0FBRWI7QUFGYSxDOzs7Ozs7Ozs7Ozs7O0lDRk0sbUI7QUFDbkIsaUNBQWM7QUFBQTs7QUFDWixTQUFLLEtBQUwsR0FBYSxDQUFDLE9BQUQsRUFBVSxPQUFWLEVBQW1CLE9BQW5CLENBQWI7QUFDRDs7OzttQ0FFYyxLLEVBQU87QUFDcEIsV0FBSyxLQUFMLEdBQWEsS0FBYjtBQUNEOzs7Ozs7a0JBUGtCLG1COzs7Ozs7Ozs7QUNBckI7Ozs7OztrQkFFZTtBQUNiLG1DQURhO0FBRWIsWUFBVTtBQUNSLG1CQUFlLEdBRFA7QUFFUixVQUFNO0FBRkU7QUFGRyxDOzs7Ozs7Ozs7Ozs7O0lDRk0scUI7QUFDbkIsaUNBQVksTUFBWixFQUFvQixRQUFwQixFQUE4QjtBQUFBOztBQUM1QixTQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxTQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0Q7Ozs7OEJBRVM7QUFBQTs7QUFDUixXQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLGlCQUFuQixFQUFzQyxJQUF0Qzs7QUFFQSxXQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLE9BQW5CLEVBQTRCLFlBQU07QUFDaEMsY0FBSyxNQUFMLENBQVksVUFBWixDQUF1QjtBQUFBLGlCQUFNLE1BQUssYUFBTCxDQUFtQixFQUFFLGFBQWEsTUFBSyxRQUFMLENBQWMsSUFBZCxFQUFmLEVBQW5CLENBQU47QUFBQSxTQUF2QjtBQUNELE9BRkQ7QUFHRDs7O2lDQUVZO0FBQ1gsVUFBSSxLQUFLLFFBQUwsQ0FBYyxJQUFkLE9BQXlCLEtBQUssSUFBbEMsRUFBd0M7QUFDdEMsYUFBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixLQUFLLElBQXhCO0FBQ0Q7QUFDRjs7Ozs7O2tCQWxCa0IscUI7OztBQXFCckIsc0JBQXNCLE9BQXRCLEdBQWdDLENBQUMsUUFBRCxFQUFXLFVBQVgsQ0FBaEM7Ozs7Ozs7OztBQ3JCQTs7Ozs7O2tCQUVlO0FBQ2IsZUFBYSx3REFEQTtBQUViLG1DQUZhO0FBR2IsWUFBVTtBQUNSLFdBQU8sR0FEQztBQUVSLG9CQUFnQjtBQUZSO0FBSEcsQzs7Ozs7Ozs7Ozs7OztJQ0ZNLHFCO0FBRW5CLG1DQUFjO0FBQUE7O0FBQ1o7QUFDQTtBQUNBLFNBQUssYUFBTCxHQUFxQixFQUFFLFFBQVEsMEJBQVYsRUFBckI7QUFDRDs7OztvQ0FFZSxLLEVBQU8sVyxFQUFhO0FBQ2xDLFdBQUssS0FBTCxDQUFXLEtBQVgsSUFBb0IsV0FBcEI7QUFDQSxXQUFLLGNBQUwsQ0FBb0IsRUFBRSxPQUFPLEtBQUssS0FBZCxFQUFwQjtBQUNEOzs7cUNBRWdCLEssRUFBTztBQUN0QixXQUFLLEtBQUwsQ0FBVyxNQUFYLENBQWtCLFFBQVEsQ0FBMUIsRUFBNkIsQ0FBN0IsRUFBZ0MsRUFBaEM7QUFDQSxXQUFLLGNBQUwsQ0FBb0IsRUFBRSxPQUFPLEtBQUssS0FBZCxFQUFwQjtBQUNEOzs7d0NBRW1CLEssRUFBTztBQUN6QixXQUFLLEtBQUwsQ0FBVyxNQUFYLENBQWtCLEtBQWxCLEVBQXlCLENBQXpCO0FBQ0EsV0FBSyxjQUFMLENBQW9CLEVBQUUsT0FBTyxLQUFLLEtBQWQsRUFBcEI7QUFDRDs7Ozs7O2tCQXJCa0IscUI7Ozs7Ozs7OztBQ0FyQjs7Ozs7O2tCQUVlO0FBQ2IsZUFBYSw4Q0FEQTtBQUViLCtCQUZhO0FBR2IsWUFBVTtBQUNSLFdBQU87QUFEQztBQUhHLEM7Ozs7Ozs7Ozs7Ozs7SUNGTSxpQjs7Ozs7Ozt1Q0FDQTtBQUNqQixhQUFPLEtBQUssU0FBTCxDQUFlLEVBQUUsTUFBTSxLQUFLLEtBQWIsRUFBZixFQUFxQyxJQUFyQyxFQUEyQyxDQUEzQyxDQUFQO0FBQ0Q7Ozs7OztrQkFIa0IsaUI7Ozs7O0FDQXJCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQSxRQUFRLE1BQVIsQ0FBZSxZQUFmLEVBQTZCLENBQUMsYUFBRCxDQUE3QixFQUNHLFNBREgsQ0FDYSxlQURiLHlCQUVHLFNBRkgsQ0FFYSxlQUZiLHlCQUdHLFNBSEgsQ0FHYSxXQUhiLHFCQUlHLFNBSkgsQ0FJYSxhQUpiIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBFZGl0b3JBcHBDb250cm9sbGVyIGZyb20gJy4vZWRpdG9yLWFwcC5jb250cm9sbGVyJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHtcclxuICB0ZW1wbGF0ZVVybDogJ2FwcC9jb21wb25lbnRzL2VkaXRvci1hcHAvZWRpdG9yLWFwcC50ZW1wbGF0ZS5odG1sJyxcclxuICBjb250cm9sbGVyOiBFZGl0b3JBcHBDb250cm9sbGVyLFxyXG59O1xyXG4iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBFZGl0b3JBcHBDb250cm9sbGVyIHtcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMubGluZXMgPSBbJ3Rlc3QxJywgJ3Rlc3QyJywgJ3Rlc3QzJ107XHJcbiAgfVxyXG5cclxuICBvbkxpbmVzQ2hhbmdlZChsaW5lcykge1xyXG4gICAgdGhpcy5saW5lcyA9IGxpbmVzO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgRWRpdG9ySW5wdXRDb250cm9sbGVyIGZyb20gJy4vZWRpdG9yLWlucHV0LmNvbnRyb2xsZXInO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG4gIGNvbnRyb2xsZXI6IEVkaXRvcklucHV0Q29udHJvbGxlcixcclxuICBiaW5kaW5nczoge1xyXG4gICAgb25UZXh0Q2hhbmdlZDogJyYnLFxyXG4gICAgdGV4dDogJzwnLFxyXG4gIH0sXHJcbn07XHJcbiIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIEVkaXRvcklucHV0Q29udHJvbGxlciB7XHJcbiAgY29uc3RydWN0b3IoJHNjb3BlLCAkZWxlbWVudCkge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9ICRlbGVtZW50O1xyXG4gICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XHJcbiAgfVxyXG5cclxuICAkb25Jbml0KCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdjb250ZW50ZWRpdGFibGUnLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50LmJpbmQoJ2tleXVwJywgKCkgPT4ge1xyXG4gICAgICB0aGlzLiRzY29wZS4kZXZhbEFzeW5jKCgpID0+IHRoaXMub25UZXh0Q2hhbmdlZCh7IGNoYW5nZWRUZXh0OiB0aGlzLiRlbGVtZW50Lmh0bWwoKSB9KSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gICRvbkNoYW5nZXMoKSB7XHJcbiAgICBpZiAodGhpcy4kZWxlbWVudC5odG1sKCkgIT09IHRoaXMudGV4dCkge1xyXG4gICAgICB0aGlzLiRlbGVtZW50Lmh0bWwodGhpcy50ZXh0KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbkVkaXRvcklucHV0Q29udHJvbGxlci4kaW5qZWN0ID0gWyckc2NvcGUnLCAnJGVsZW1lbnQnXTtcclxuXHJcbiIsImltcG9ydCBFZGl0b3JzTGlzdENvbnRyb2xsZXIgZnJvbSAnLi9lZGl0b3JzLWxpc3QuY29udHJvbGxlcic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgdGVtcGxhdGVVcmw6ICdhcHAvY29tcG9uZW50cy9lZGl0b3JzLWxpc3QvZWRpdG9ycy1saXN0LnRlbXBsYXRlLmh0bWwnLFxyXG4gIGNvbnRyb2xsZXI6IEVkaXRvcnNMaXN0Q29udHJvbGxlcixcclxuICBiaW5kaW5nczoge1xyXG4gICAgbGluZXM6ICc8JyxcclxuICAgIG9uTGluZXNDaGFuZ2VkOiAnJicsXHJcbiAgfSxcclxufTtcclxuIiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgRWRpdG9yc0xpc3RDb250cm9sbGVyIHtcclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAvLyB3ZSBuZWVkIGFuIGFiaXRpbGl0eSB0byBlZGl0IHRleHQgYnkgc2ltcGx5IGNsaWNraW5nIGluc2lkZSBpdFxyXG4gICAgLy8gYW5kIGFsc28gYnV0dG9ucyBzaG91bGQgYmUgY2xpY2thYmxlIGFzIG5vcm1hbFxyXG4gICAgdGhpcy5jYW5jZWxPcHRpb25zID0geyBjYW5jZWw6ICdidXR0b24sW2NvbnRlbnRlZGl0YWJsZV0nIH07XHJcbiAgfVxyXG5cclxuICBvbkVkaXRvckNoYW5nZWQoaW5kZXgsIGNoYW5nZWRUZXh0KSB7XHJcbiAgICB0aGlzLmxpbmVzW2luZGV4XSA9IGNoYW5nZWRUZXh0O1xyXG4gICAgdGhpcy5vbkxpbmVzQ2hhbmdlZCh7IGxpbmVzOiB0aGlzLmxpbmVzIH0pO1xyXG4gIH1cclxuXHJcbiAgYWRkRWRpdG9yQXRJbmRleChpbmRleCkge1xyXG4gICAgdGhpcy5saW5lcy5zcGxpY2UoaW5kZXggKyAxLCAwLCAnJyk7XHJcbiAgICB0aGlzLm9uTGluZXNDaGFuZ2VkKHsgbGluZXM6IHRoaXMubGluZXMgfSk7XHJcbiAgfVxyXG5cclxuICByZW1vdmVFZGl0b3JBdEluZGV4KGluZGV4KSB7XHJcbiAgICB0aGlzLmxpbmVzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB0aGlzLm9uTGluZXNDaGFuZ2VkKHsgbGluZXM6IHRoaXMubGluZXMgfSk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCBQcmV2aWV3Q29udHJvbGxlciBmcm9tICcuL3ByZXZpZXcuY29udHJvbGxlcic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgdGVtcGxhdGVVcmw6ICdhcHAvY29tcG9uZW50cy9wcmV2aWV3L3ByZXZpZXcudGVtcGxhdGUuaHRtbCcsXHJcbiAgY29udHJvbGxlcjogUHJldmlld0NvbnRyb2xsZXIsXHJcbiAgYmluZGluZ3M6IHtcclxuICAgIGxpbmVzOiAnPCcsXHJcbiAgfSxcclxufTtcclxuIiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJldmlld0NvbnRyb2xsZXIge1xyXG4gIGdldEZvcm1hdHRlZERhdGEoKSB7XHJcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoeyBkYXRhOiB0aGlzLmxpbmVzIH0sIG51bGwsIDQpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgZWRpdG9ySW5wdXRDb21wb25lbnQgZnJvbSAnLi9jb21wb25lbnRzL2VkaXRvci1pbnB1dC9lZGl0b3ItaW5wdXQuY29tcG9uZW50JztcclxuaW1wb3J0IGVkaXRvcnNMaXN0Q29tcG9uZW50IGZyb20gJy4vY29tcG9uZW50cy9lZGl0b3JzLWxpc3QvZWRpdG9ycy1saXN0LmNvbXBvbmVudCc7XHJcbmltcG9ydCBwcmV2aWV3Q29tcG9uZW50IGZyb20gJy4vY29tcG9uZW50cy9wcmV2aWV3L3ByZXZpZXcuY29tcG9uZW50JztcclxuaW1wb3J0IGVkaXRvckFwcENvbXBvbmVudCBmcm9tICcuL2NvbXBvbmVudHMvZWRpdG9yLWFwcC9lZGl0b3ItYXBwLmNvbXBvbmVudCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndGV4dEVkaXRvcicsIFsndWkuc29ydGFibGUnXSlcclxuICAuY29tcG9uZW50KCdjbUVkaXRvcklucHV0JywgZWRpdG9ySW5wdXRDb21wb25lbnQpXHJcbiAgLmNvbXBvbmVudCgnY21FZGl0b3JzTGlzdCcsIGVkaXRvcnNMaXN0Q29tcG9uZW50KVxyXG4gIC5jb21wb25lbnQoJ2NtUHJldmlldycsIHByZXZpZXdDb21wb25lbnQpXHJcbiAgLmNvbXBvbmVudCgnY21FZGl0b3JBcHAnLCBlZGl0b3JBcHBDb21wb25lbnQpO1xyXG4iXX0=
