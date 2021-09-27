goog.declareModuleId('os.ui.node.DrawingFeatureNodeUI');

import Module from '../module.js';
import AbstractNodeUICtrl from '../slick/abstractnodeui.js';

const {getMapContainer} = goog.require('os.map.instance');

const DrawingFeatureNode = goog.requireType('os.data.DrawingFeatureNode');


/**
 * @type {string}
 */
export const template = '<span ng-if="nodeUi.show()">' +
    '<span ng-click="nodeUi.remove()"><i class="fa fa-times fa-fw c-glyph"' +
    'title="Remove the feature"></i></span></span>';

/**
 * The selected/highlighted node UI directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template,
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'drawingfeaturenodeui';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted node UI
 * @unrestricted
 */
export class Controller extends AbstractNodeUICtrl {
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
   * Remove the feature
   *
   * @export
   */
  remove() {
    // the node should be on the scope as 'item'
    var node = /** @type {DrawingFeatureNode} */ (this.scope['item']);
    var feature = node.getFeature();

    if (feature) {
      node.getParent().removeChild(node);
      getMapContainer().removeFeature(feature);
    }
  }
}
