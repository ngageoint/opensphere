goog.declareModuleId('os.ui.node.TileLoadingUI');

import {listen, unlistenByKey} from 'ol/src/events.js';
import TileImage from 'ol/src/source/TileImage.js';

import LayerPropertyChange from '../../layer/propertychange.js';
import PropertyChange from '../../source/propertychange.js';
import Module from '../module.js';

const GoogEventType = goog.require('goog.events.EventType');

const {default: LayerNode} = goog.requireType('os.data.LayerNode');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');


/**
 * Shows if a tile layer is loading
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span></span>',
  controller: Controller,
  controllerAs: 'tileLoading'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'tileloading';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for tile loading UI
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {?TileImage}
     * @private
     */
    this.source_ = null;

    if ('item' in $scope) {
      var node = /** @type {LayerNode} */ ($scope['item']);
      var src = /** @type {Layer} */ (node.getLayer()).getSource();

      if (src && src instanceof TileImage) {
        this.source_ = /** @type {TileImage} */ (src);
        this.listenKey = listen(this.source_, GoogEventType.PROPERTYCHANGE, this.onPropertyChange_, this);
      }
    }

    this.element_.html(this.getText());
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up
   *
   * @private
   */
  onDestroy_() {
    if (this.source_) {
      unlistenByKey(this.listenKey);
    }

    this.element_ = null;
  }

  /**
   * Handles the loading property change
   *
   * @param {PropertyChangeEvent} e The change event
   * @private
   */
  onPropertyChange_(e) {
    if (e.getProperty) {
      var p = e.getProperty();
      if (p == LayerPropertyChange.TILE_COUNT || p == PropertyChange.LOADING) {
        this.element_.html(this.getText());
      }
    }
  }

  /**
   * Gets the text to show for the tile layer.
   *
   * @return {string}
   */
  getText() {
    try {
      if (this.source_) {
        var count = /** @type {?number} */ (this.source_.get(LayerPropertyChange.TILE_COUNT));

        if (count != null) {
          return '(' + count + ' In View)';
        }
      }
    } catch (e) {
    }

    return '';
  }
}
