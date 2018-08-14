goog.provide('os.ui.metrics.MetricCompletionCtrl');
goog.provide('os.ui.metrics.metricCompletionDirective');

goog.require('ol.color');
goog.require('os.color');
goog.require('os.ui.Module');


/**
 * Shows the feature count out of the total for feature layers
 * @return {angular.Directive}
 */
os.ui.metrics.metricCompletionDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span class="metric-completion" style="padding-left:5px" ng-style="mc.style" ' +
        'ng-bind-html="mc.getCompleted()" />',
    controller: os.ui.metrics.MetricCompletionCtrl,
    controllerAs: 'mc'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('metriccompletion', [os.ui.metrics.metricCompletionDirective]);



/**
 * Controller for selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.metrics.MetricCompletionCtrl = function($scope, $element) {
  /**
   * @type {?os.ui.metrics.MetricNode}
   * @private
   */
  this.node_ = null;

  /**
   * @type {string}
   */
  this['style'] = '';

  if ($scope['item'] instanceof os.ui.metrics.MetricNode) {
    this.node_ = $scope['item'];
  }

  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Clean up
 * @private
 */
os.ui.metrics.MetricCompletionCtrl.prototype.onDestroy_ = function() {
  this.node_ = null;
};


/**
 * @return {string}
 */
os.ui.metrics.MetricCompletionCtrl.prototype.getCompleted = function() {
  try {
    if (this.node_ && this.node_.hasChildren()) {
      var percent = this.getVisitedPercent_();
      var color = os.color.getGradientColor(percent / 100 * 255, os.metrics.METRIC_GRADIENT);
      if (color.length == 3) {
        color.push(1);
      }

      this['style'] = {
        'color': ol.color.toString(color)
      };

      return '<strong>(' + percent + '% Explored)</strong>';
    }
  } catch (e) {
  }

  return '';
};
goog.exportProperty(
    os.ui.metrics.MetricCompletionCtrl.prototype,
    'getCompleted',
    os.ui.metrics.MetricCompletionCtrl.prototype.getCompleted);


/**
 * Gets the visited percentage for the node.
 * @return {number}
 * @private
 */
os.ui.metrics.MetricCompletionCtrl.prototype.getVisitedPercent_ = function() {
  if (this.node_) {
    if (this.node_.hasChildren()) {
      var leaves = /** @type {!Array<!os.ui.metrics.MetricNode>} */ (os.structs.getLeafNodes(this.node_));
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
};

