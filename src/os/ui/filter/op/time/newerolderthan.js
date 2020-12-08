goog.module('os.ui.filter.op.time.NewerOlderThanUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.datetime.durationDirective');
goog.require('os.ui.filter.colTypeCheckValidation');
goog.require('os.ui.popover.popoverDirective');

const Module = goog.require('os.ui.Module');



/**
 * The newerolderthan directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: os.ROOT + 'views/filter/op/time/newerolderthan.html',
  controller: Controller,
  controllerAs: 'newerOlderThanCtrl'
});


/**
 * Add the directive to the module
 */
Module.directive('newerolderthan', [directive]);



/**
 * Controller for the newerolderthan directive.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    var val = parseFloat($scope['expr']['literal']);
    if (val == null || isNaN(val)) {
      // default to 1 minute
      val = 60000;
    }
    /**
     * @type {number}
     */
    this['value'] = val;

    this.onChange(val, val);

    $scope.$watch('newerOlderThanCtrl.value', this.onChange.bind(this));
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * @private
   */
  onDestroy_() {
    this.scope_ = null;
  }

  /**
   * Watcher for maximum duration value changes.
   *
   * @param {number} newVal The new maximum value.
   * @param {number} oldVal The old maximum value.
   * @export
   */
  onChange(newVal, oldVal) {
    var val = '';

    if (!isNaN(newVal)) {
      val += newVal;
    }

    this.scope_['expr']['literal'] = val;
  }
}

exports = {
  Controller,
  directive
};
