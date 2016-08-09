export default class EditorInputController {
  constructor($scope, $element) {
    this.$element = $element;
    this.$scope = $scope;
  }

  $onInit() {
    this.$element.attr('contenteditable', true);

    this.$element.bind('keyup', () => {
      this.$scope.$evalAsync(() => this.onTextChanged({ changedText: this.$element.html() }));
    });
  }

  $onChanges() {
    if (this.$element.html() !== this.text) {
      this.$element.html(this.text);
    }
  }
}

EditorInputController.$inject = ['$scope', '$element'];

