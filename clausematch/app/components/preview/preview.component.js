import PreviewController from './preview.controller';

export default {
  templateUrl: 'app/components/preview/preview.template.html',
  controller: PreviewController,
  bindings: {
    lines: '<',
  },
};
