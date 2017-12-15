goog.provide('os.ui.filter.TextNoColCheckCtrl');
goog.provide('os.ui.filter.textNoColCheckDirective');

goog.require('os.ui.Module');


/**
 * A directive that allows for filtering on a numeric column but including a wildcard.
 * The normal directive restricts the filter to be the same type as the column (i.e. decimal).
 * But in this case, we need to allow for a numeric along with a '*'
 * @return {angular.Directive}
 */
os.ui.filter.textNoColCheckDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/filter/textnocolcheck.html',
    controller: os.ui.filter.TextNoColCheckCtrl,
    controllerAs: 'textNoColCheckCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('fbTextNoColCheck', [os.ui.filter.textNoColCheckDirective]);



/**
 * Controller for the between UI
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.filter.TextNoColCheckCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  this['start'] = undefined;

  if (goog.isDefAndNotNull($scope['expr']['literal'])) {
    this['start'] = $scope['expr']['literal'];
  }

  this.onChange();
  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * clean up
 * @private
 */
os.ui.filter.TextNoColCheckCtrl.prototype.onDestroy_ = function() {
  this.scope_ = null;
};


/**
 * Run when the user changes the value
 */
os.ui.filter.TextNoColCheckCtrl.prototype.onChange = function() {
  this.scope_['expr']['literal'] = this['start'];
};
goog.exportProperty(os.ui.filter.TextNoColCheckCtrl.prototype, 'onChange',
    os.ui.filter.TextNoColCheckCtrl.prototype.onChange);
