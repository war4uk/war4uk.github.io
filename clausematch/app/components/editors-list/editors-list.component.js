import EditorsListController from './editors-list.controller';

export default {
  templateUrl: 'app/components/editors-list/editors-list.template.html',
  controller: EditorsListController,
  bindings: {
    lines: '<',
    onLinesChanged: '&',
  },
};
