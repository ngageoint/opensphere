goog.provide('os.ui.node.DrawingFeatureNodeUICtrl');
goog.provide('os.ui.node.drawingFeatureNodeUIDirective');

goog.require('os.ui.Module');
goog.require('os.ui.slick.AbstractNodeUICtrl');


/**
 * @type {string}
 */
os.ui.node.DrawingFeatureNodeUITemplate = '<span ng-if="nodeUi.show()">' +
    '<span ng-click="nodeUi.remove()"><i class="fa fa-times fa-fw c-glyph text-danger"' +
    'title="Remove the feature"></i></span></span>';


/**
 * The selected/highlighted node UI directive
 * @return {angular.Directive}
 */
os.ui.node.drawingFeatureNodeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: os.ui.node.DrawingFeatureNodeUITemplate,
    controller: os.ui.node.DrawingFeatureNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('drawingfeaturenodeui', [os.ui.node.drawingFeatureNodeUIDirective]);



/**
 * Controller for selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.slick.AbstractNodeUICtrl}
 * @constructor
 * @ngInject
 */
os.ui.node.DrawingFeatureNodeUICtrl = function($scope, $element) {
  os.ui.node.DrawingFeatureNodeUICtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(os.ui.node.DrawingFeatureNodeUICtrl, os.ui.slick.AbstractNodeUICtrl);


/**
 * Remove the feature
 * @export
 */
os.ui.node.DrawingFeatureNodeUICtrl.prototype.remove = function() {
  // the node should be on the scope as 'item'
  var node = /** @type {os.data.DrawingFeatureNode} */ (this.scope['item']);
  var feature = node.getFeature();

  if (feature) {
    node.getParent().removeChild(node);
    os.MapContainer.getInstance().removeFeature(feature);
  }
};
