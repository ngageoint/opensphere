goog.declareModuleId('os.ui.metrics.MetricCompletionUI');

import {toString} from 'ol/src/color.js';

import {instanceOf} from '../../classregistry.js';
import {getGradientColor} from '../../color.js';
import {METRIC_GRADIENT} from '../../metrics/index.js';
import {getLeafNodes} from '../../structs/structs.js';
import Module from '../module.js';
import {ClassName} from './metricsui.js';

const {default: MetricNode} = goog.requireType('os.ui.metrics.MetricNode');


/**
 * Shows the feature count out of the total for feature layers
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span class="pl-1 c-slick-grid__hover-color" ng-style="mc.style" ' +
      'ng-bind-html="mc.getCompleted()" />',
  controller: Controller,
  controllerAs: 'mc'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'metriccompletion';

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
     * @type {?MetricNode}
     * @private
     */
    this.node_ = null;

    /**
     * @type {string}
     */
    this['style'] = '';

    if (instanceOf($scope['item'], ClassName.METRIC_NODE)) {
      this.node_ = /** @type {MetricNode} */ ($scope['item']);
    }

    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up
   *
   * @private
   */
  onDestroy_() {
    this.node_ = null;
  }

  /**
   * @return {string}
   * @export
   */
  getCompleted() {
    try {
      if (this.node_ && this.node_.hasChildren()) {
        var percent = this.getVisitedPercent_();
        var color = getGradientColor(percent / 100 * 255, METRIC_GRADIENT);
        if (color.length == 3) {
          color.push(1);
        }

        this['style'] = {
          'color': toString(color)
        };

        return '<strong>(' + percent + '% Explored)</strong>';
      }
    } catch (e) {
    }

    return '';
  }

  /**
   * Gets the visited percentage for the node.
   *
   * @return {number}
   * @private
   */
  getVisitedPercent_() {
    if (this.node_) {
      if (this.node_.hasChildren()) {
        var leaves = /** @type {!Array<!MetricNode>} */ (getLeafNodes(this.node_));
        var total = leaves.length;
        var visited = 0;

        for (var i = 0; i < total; i++) {
          if (leaves[i].getVisited()) {
            visited++;
          }
        }

        return Math.round(visited / total * 100);
      } else {
        return this.node_.getVisited() ? 100 : 0;
      }
    }

    return 0;
  }
}
