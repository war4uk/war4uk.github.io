import editorInputComponent from './components/editor-input/editor-input.component';
import editorsListComponent from './components/editors-list/editors-list.component';
import previewComponent from './components/preview/preview.component';
import editorAppComponent from './components/editor-app/editor-app.component';

angular.module('textEditor', ['ui.sortable'])
  .component('cmEditorInput', editorInputComponent)
  .component('cmEditorsList', editorsListComponent)
  .component('cmPreview', previewComponent)
  .component('cmEditorApp', editorAppComponent);
