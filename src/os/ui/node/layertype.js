goog.provide('os.ui.node.LayerTypeCtrl');
goog.provide('os.ui.node.layerTypeDirective');
goog.require('os.config.Settings');
goog.require('os.ui.Module');


/**
 * Shows the feature count out of the total for feature layers
 * @return {angular.Directive}
 */
os.ui.node.layerTypeDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span>{{layerType.getType()}}</span>',
    controller: os.ui.node.LayerTypeCtrl,
    controllerAs: 'layerType'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('layertype', [os.ui.node.layerTypeDirective]);



/**
 * Controller for selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.node.LayerTypeCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;
};


/**
 * @return {string}
 */
os.ui.node.LayerTypeCtrl.prototype.getType = function() {
  if (os.settings.get(['ui', 'layers', 'showLayerTypes'], true)) {
    var node = /** @type {os.data.LayerNode} */ (this.scope_['item']);
    if (node) {
      var layer = node.getLayer();
      if (layer) {
        return layer.getExplicitType();
      }
    }
  }

  return '';
};

goog.exportProperty(
    os.ui.node.LayerTypeCtrl.prototype, 'getType', os.ui.node.LayerTypeCtrl.prototype.getType);
