goog.declareModuleId('os.ui.feature.tab.AbstractFeatureTabCtrl');

import Feature from 'ol/src/Feature.js';
import RenderFeature from 'ol/src/render/Feature.js';

import {apply} from '../../ui.js';
import FeatureInfoEvent from '../featureinfoevent.js';

/**
 * Abstract controller for feature tabs.
 *
 * @abstract
 */
export default class AbstractFeatureTabCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     */
    this.element = $element;

    // Control is constructed after the first broadcast, so update the tab once after all constructors have executed.
    if (this.scope && this.scope['items'] && this.scope['items'].length > 0) {
      var data = this.scope['items'][0]['data'];
      setTimeout(function() {
        this.updateTab(null, data);
        apply(this.scope);
      }.bind(this), 0);
    }

    this.scope.$on(FeatureInfoEvent.UPDATE_TABS, this.updateTab.bind(this));
    this.scope.$on('$destroy', this.destroy.bind(this));
  }

  /**
   * Clean up.
   *
   * @protected
   */
  destroy() {
    this.scope = null;
    this.element = null;
  }

  /**
   * If the provided value is a feature.
   *
   * @param {*} value The value.
   * @return {boolean}
   * @protected
   */
  isFeature(value) {
    return value instanceof Feature || value instanceof RenderFeature;
  }

  /**
   * Update the tab content
   *
   * @abstract
   * @param {?angular.Scope.Event} event The broadcast event
   * @param {*} data The event data
   * @protected
   */
  updateTab(event, data) {}
}
