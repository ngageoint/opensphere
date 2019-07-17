goog.provide('os.ui.filter.op.time.NewerOlderThanCtrl');
goog.provide('os.ui.filter.op.time.newerOlderThanDirective');

goog.require('os.ui.Module');
goog.require('os.ui.datetime.durationDirective');
goog.require('os.ui.filter.colTypeCheckValidation');
goog.require('os.ui.popover.popoverDirective');


/**
 * The newerolderthan directive
 *
 * @return {angular.Directive}
 */
os.ui.filter.op.time.newerOlderThanDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/filter/op/time/newerolderthan.html',
    controller: os.ui.filter.op.time.NewerOlderThanCtrl,
    controllerAs: 'newerOlderThanCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('newerolderthan', [os.ui.filter.op.time.newerOlderThanDirective]);



/**
 * Controller for the newerolderthan directive.
 *
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.filter.op.time.NewerOlderThanCtrl = function($scope) {
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
};


/**
 * @private
 */
os.ui.filter.op.time.NewerOlderThanCtrl.prototype.onDestroy_ = function() {
  this.scope_ = null;
};


/**
 * Watcher for maximum duration value changes.
 *
 * @param {number} newVal The new maximum value.
 * @param {number} oldVal The old maximum value.
 * @export
 */
os.ui.filter.op.time.NewerOlderThanCtrl.prototype.onChange = function(newVal, oldVal) {
  var val = '';

  if (!isNaN(newVal)) {
    val += newVal;
  }

  this.scope_['expr']['literal'] = val;
};
