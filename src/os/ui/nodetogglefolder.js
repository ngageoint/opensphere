goog.declareModuleId('os.ui.NodeToggleFolderUI');

import Module from './module.js';
import {Controller as NodeToggleCtrl, directive as nodeToggleDirective} from './nodetoggle.js';


/**
 * A toggle directive for a node also shows a folder
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var dir = nodeToggleDirective();
  dir.template = '<span>' + dir.template + '<i class="fa fa-fw action" ' +
      'ng-class="{\'fa-folder\': item.collapsed, \'fa-folder-open\': !item.collapsed}"></i></span>';
  dir.controller = Controller;
  return /** @type {angular.Directive} */ (dir);
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'nodetogglefolder';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the node toggle w/ folder directive
 * @unrestricted
 */
export class Controller extends NodeToggleCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
  }

  /**
   * @inheritDoc
   */
  onPropertyChange(e) {}

  /**
   * @inheritDoc
   */
  updateOpacity() {}
}
