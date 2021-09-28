goog.declareModuleId('os.ui.layer.LayerVisibilityUI');

import Module from '../module.js';

const {default: LayerNode} = goog.requireType('os.data.LayerNode');
const {default: ILayer} = goog.requireType('os.layer.ILayer');


/**
 * Template for the layer visibility directive.
 * @type {string}
 */
const template = `
  <span ng-click="ctrl.toggle($event)" title="{{ctrl.getTooltip()}}">
    <i class="fa fa-fw" ng-class="ctrl.isVisible() ? 'fa-eye' : 'fa-eye-slash'"></i>
  </span>`;


/**
 * The layer visibility directive.
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: template,
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'layervisibility';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the layer visibility directive.
 */
export class Controller {
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
