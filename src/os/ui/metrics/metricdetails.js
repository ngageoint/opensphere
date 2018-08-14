goog.provide('os.ui.metrics.MetricDetailsCtrl');
goog.provide('os.ui.metrics.metricDetailsDirective');

goog.require('goog.Disposable');
goog.require('os.ui.Module');


/**
 * The metricdetails directive
 * @return {angular.Directive}
 */
os.ui.metrics.metricDetailsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'metric': '='
    },
    templateUrl: os.ROOT + 'views/config/metricdetails.html',
    controller: os.ui.metrics.MetricDetailsCtrl,
    controllerAs: 'details'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('metricdetails', [os.ui.metrics.metricDetailsDirective]);



/**
 * Controller function for the metricdetails directive
 * @param {!angular.Scope} $scope
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.metrics.MetricDetailsCtrl = function($scope) {
  os.ui.metrics.MetricDetailsCtrl.base(this, 'constructor');

  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.metrics.MetricDetailsCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.metrics.MetricDetailsCtrl.prototype.disposeInternal = function() {
  os.ui.metrics.MetricDetailsCtrl.base(this, 'disposeInternal');

  this.scope_ = null;
};


/**
 * Get the metric label.
 * @return {string}
 */
os.ui.metrics.MetricDetailsCtrl.prototype.getLabel = function() {
  if (this.scope_ && this.scope_['metric'] instanceof os.ui.metrics.MetricNode) {
    var node = /** @type {!os.ui.metrics.MetricNode} */ (this.scope_['metric']);
    var crumbs = [node.getLabel()];

    var current = node;
    var parent;
    while (current && (parent = current.getParent())) {
      var parentLabel = parent.getLabel();
      if (parentLabel) {
        crumbs.unshift(parentLabel);
        current = parent;
      } else {
        break;
      }
    }

    return crumbs.join(' > ');
  }

  return '';
};
goog.exportProperty(
    os.ui.metrics.MetricDetailsCtrl.prototype,
    'getLabel',
    os.ui.metrics.MetricDetailsCtrl.prototype.getLabel);


/**
 * Get the metric description.
 * @return {string}
 */
os.ui.metrics.MetricDetailsCtrl.prototype.getDescription = function() {
  if (this.scope_ && this.scope_['metric'] instanceof os.ui.metrics.MetricNode) {
    var node = /** @type {os.ui.metrics.MetricNode} */ (this.scope_['metric']);
    return node.getDescription() || '';
  }

  return '';
};
goog.exportProperty(
    os.ui.metrics.MetricDetailsCtrl.prototype,
    'getDescription',
    os.ui.metrics.MetricDetailsCtrl.prototype.getDescription);
