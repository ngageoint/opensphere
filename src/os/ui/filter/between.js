goog.provide('os.ui.filter.BetweenCtrl');
goog.provide('os.ui.filter.betweenDirective');

goog.require('os.ui.Module');
goog.require('os.ui.filter.colTypeCheckValidation');


/**
 * The default between literal directive
 * @return {angular.Directive}
 */
os.ui.filter.betweenDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/filter/between.html',
    controller: os.ui.filter.BetweenCtrl,
    controllerAs: 'betweenCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('fbBetween', [os.ui.filter.betweenDirective]);



/**
 * Controller for the between UI
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.filter.BetweenCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  this['min'] = 0;
  this['max'] = 1;

  if (goog.isDefAndNotNull($scope['expr']['literal'])) {
    var nums = $scope['expr']['literal'].split(/\s*,\s*/);

    if (nums.length == 2) {
      this['min'] = parseFloat(nums[0]);
      this['max'] = parseFloat(nums[1]);
    }
  }

  this.onChange();
  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * clean up
 * @private
 */
os.ui.filter.BetweenCtrl.prototype.onDestroy_ = function() {
  this.scope_ = null;
};


/**
 * Run when the user changes the value
 */
os.ui.filter.BetweenCtrl.prototype.onChange = function() {
  var a = parseFloat(this['min']);
  var b = parseFloat(this['max']);
  var val = '';

  if (!isNaN(a)) {
    val += a + ', ';
  }

  if (!isNaN(b)) {
    val += b;
  }

  this.scope_['expr']['literal'] = val;
};
goog.exportProperty(os.ui.filter.BetweenCtrl.prototype, 'onChange', os.ui.filter.BetweenCtrl.prototype.onChange);
