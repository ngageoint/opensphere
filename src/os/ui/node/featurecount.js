goog.declareModuleId('os.ui.node.FeatureCountUI');

import {listen, unlistenByKey} from 'ol/src/events.js';

import VectorLayer from '../../layer/vector.js';
import PropertyChange from '../../source/propertychange.js';
import VectorSource from '../../source/vectorsource.js';
import Module from '../module.js';

const GoogEventType = goog.require('goog.events.EventType');

const {default: LayerNode} = goog.requireType('os.data.LayerNode');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');


/**
 * Shows the feature count out of the total for feature layers
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span></span>',
  controller: Controller,
  controllerAs: 'featureCount'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'featurecount';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted node UI
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
     * The layer.
     * @type {VectorLayer}
     * @private
     */
    this.layer_ = null;

    /**
     * @type {?VectorSource}
     * @private
     */
    this.source_ = null;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    if ('item' in $scope) {
      var node = /** @type {LayerNode} */ ($scope['item']);
      var layer = node ? node.getLayer() : null;
      if (layer instanceof VectorLayer) {
        this.layer_ = layer;

        var src = layer.getSource();
        if (src && src instanceof VectorSource) {
          this.source_ = /** @type {VectorSource} */ (src);
          this.listenKey = listen(this.source_, GoogEventType.PROPERTYCHANGE, this.onPropertyChange_, this);
        }
      }
    }

    $scope.$on('$destroy', this.onDestroy_.bind(this));
    this.element_.html(this.getTotal());
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
    var p = e.getProperty();
    if (p == PropertyChange.FEATURES || p == PropertyChange.FEATURE_VISIBILITY ||
        p == PropertyChange.LOADING || p == PropertyChange.VISIBLE ||
        p === PropertyChange.TIME_ENABLED || p == PropertyChange.TIME_FILTER) {
      this.element_.html(this.getTotal());
    }
  }

  /**
   * @return {string}
   */
  getTotal() {
    try {
      if (this.layer_ && this.source_ && !this.source_.isDisposed()) {
        if (!this.source_.isEnabled()) {
          return '(Disabled)';
        }

        if (this.source_.isLoading()) {
          return '(Loading...)';
        }

        var model = this.source_.getTimeModel();
        var shown = this.source_.getFilteredFeatures().length;
        var total = model.getSize();

        return '(' + (shown == total ? total : shown + '/' + total) + ')';
      }
    } catch (e) {
    }

    return '';
  }
}
