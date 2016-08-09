export default class EditorsListController {

  constructor() {
    // we need an abitility to edit text by simply clicking inside it
    // and also buttons should be clickable as normal
    this.cancelOptions = { cancel: 'button,[contenteditable]' };
  }

  onEditorChanged(index, changedText) {
    this.lines[index] = changedText;
    this.onLinesChanged({ lines: this.lines });
  }

  addEditorAtIndex(index) {
    this.lines.splice(index + 1, 0, '');
    this.onLinesChanged({ lines: this.lines });
  }

  removeEditorAtIndex(index) {
    this.lines.splice(index, 1);
    this.onLinesChanged({ lines: this.lines });
  }
}
