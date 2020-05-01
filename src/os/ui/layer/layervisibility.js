goog.module('os.ui.layer.LayerVisibilityUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');

const ILayer = goog.requireType('os.layer.ILayer');
const LayerNode = goog.requireType('os.data.LayerNode');


/**
 * Template for the layer visibility directive.
 * @type {string}
 */
const template = `
  <span ng-click="ctrl.toggle($event)" title="{{ctrl.getTooltip()}}">
    <i class="fa" ng-class="ctrl.isVisible() ? 'fa-eye' : 'fa-eye-slash'"></i>
  </span>`;


/**
 * The layer visibility directive.
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: template,
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * Add the directive to the module
 */
Module.directive('layervisibility', [directive]);



/**
 * Controller for the layer visibility directive.
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @ngInject
   */
  constructor($scope) {
    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.scope = null;
  }

  /**
   * Get the layer from the scope.
   * @return {ILayer}
   * @protected
   */
  getLayer() {
    if (this.scope && this.scope['item']) {
      const node = /** @type {LayerNode} */ (this.scope['item']);
      return node.getLayer();
    }

    return null;
  }

  /**
   * Get the tooltip to display.
   * @return {string}
   * @export
   */
  getTooltip() {
    const layer = this.getLayer();
    if (layer) {
      return `${layer.getLayerVisible() ? 'Hide' : 'Show'} the layer`;
    }
    return '';
  }

  /**
   * Get the tooltip to display.
   * @return {boolean}
   * @export
   */
  isVisible() {
    const layer = this.getLayer();
    return !!layer && layer.getLayerVisible();
  }

  /**
   * Toggle layer visibility.
   * @param {!angular.Scope.Event} event The event.
   * @export
   */
  toggle(event) {
    const layer = this.getLayer();
    if (layer) {
      event.stopPropagation();
      layer.setLayerVisible(!layer.getLayerVisible());
    }
  }
}

exports = {
  Controller,
  directive
};
