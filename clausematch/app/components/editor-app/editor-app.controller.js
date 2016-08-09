export default class EditorAppController {
  constructor() {
    this.lines = ['test1', 'test2', 'test3'];
  }

  onLinesChanged(lines) {
    this.lines = lines;
  }
}
