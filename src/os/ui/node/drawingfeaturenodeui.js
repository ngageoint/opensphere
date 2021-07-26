goog.module('os.ui.node.DrawingFeatureNodeUI');
goog.module.declareLegacyNamespace();

const {getMapContainer} = goog.require('os.map.instance');
const Module = goog.require('os.ui.Module');
const AbstractNodeUICtrl = goog.require('os.ui.slick.AbstractNodeUICtrl');

const DrawingFeatureNode = goog.requireType('os.data.DrawingFeatureNode');


/**
 * @type {string}
 */
const template = '<span ng-if="nodeUi.show()">' +
    '<span ng-click="nodeUi.remove()"><i class="fa fa-times fa-fw c-glyph"' +
    'title="Remove the feature"></i></span></span>';

/**
 * The selected/highlighted node UI directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'drawingfeaturenodeui';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted node UI
 * @unrestricted
 */
class Controller extends AbstractNodeUICtrl {
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

exports = {
  Controller,
  directive,
  directiveTag,
  template
};
