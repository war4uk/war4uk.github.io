export default class EditorAppController {
  constructor() {
    this.lines = [
      'There can be more >1 element',
      '<b>This one is bold</b>',
      '<i>This one is italic</i>',
    ];
  }

  onLinesChanged(lines) {
    this.lines = lines;
  }
}
