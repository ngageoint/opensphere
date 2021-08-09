goog.module('os.ui.metrics.MetricDetailsUI');
goog.module.declareLegacyNamespace();

const Disposable = goog.require('goog.Disposable');
const {ROOT} = goog.require('os');
const {instanceOf} = goog.require('os.classRegistry');
const Module = goog.require('os.ui.Module');
const {ClassName} = goog.require('os.ui.metrics');

const MetricNode = goog.requireType('os.ui.metrics.MetricNode');


/**
 * The metricdetails directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'metric': '='
  },
  templateUrl: ROOT + 'views/config/metricdetails.html',
  controller: Controller,
  controllerAs: 'details'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'metricdetails';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the metricdetails directive
 * @unrestricted
 */
class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    super();

    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.scope_ = null;
  }

  /**
   * Get the metric label.
   *
   * @return {string}
   * @export
   */
  getLabel() {
    if (this.scope_ && instanceOf(this.scope_['metric'], ClassName.METRIC_NODE)) {
      var node = /** @type {!MetricNode} */ (this.scope_['metric']);
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
  }

  /**
   * Get the metric description.
   *
   * @return {string}
   * @export
   */
  getDescription() {
    if (this.scope_ && instanceOf(this.scope_['metric'], ClassName.METRIC_NODE)) {
      var node = /** @type {MetricNode} */ (this.scope_['metric']);
      return node.getDescription() || '';
    }

    return '';
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
