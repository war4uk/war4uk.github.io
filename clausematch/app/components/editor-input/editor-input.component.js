import EditorInputController from './editor-input.controller';

export default {
  controller: EditorInputController,
  bindings: {
    onTextChanged: '&',
    text: '<',
  },
};
