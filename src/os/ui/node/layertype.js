goog.module('os.ui.node.LayerTypeUI');
goog.module.declareLegacyNamespace();

const Settings = goog.require('os.config.Settings');
const Module = goog.require('os.ui.Module');

const LayerNode = goog.requireType('os.data.LayerNode');


/**
 * Shows the feature count out of the total for feature layers
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span>{{layerType.getType()}}</span>',
  controller: Controller,
  controllerAs: 'layerType'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'layertype';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted node UI
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;
  }

  /**
   * @return {string}
   * @export
   */
  getType() {
    if (Settings.getInstance().get(['ui', 'layers', 'showLayerTypes'], true)) {
      var node = /** @type {LayerNode} */ (this.scope_['item']);
      if (node) {
        var layer = node.getLayer();
        if (layer) {
          return layer.getExplicitType();
        }
      }
    }

    return '';
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
