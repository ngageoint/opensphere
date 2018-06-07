goog.provide('os.ui.util.ValidationMessageCtrl');
goog.provide('os.ui.util.validationMessageDirective');


/**
 * A collection of help messages that can be overriden or added to, meant to consolidate messages used in validation
 * Make sure to include the was-valided class at the parent level for these to work!
 * @return {angular.Directive}
 */
os.ui.util.validationMessageDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'target': '='
    },
    templateUrl: os.ROOT + 'views/util/validationmessage.html',
    controller: os.ui.util.ValidationMessageCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('validationMessage', [os.ui.util.validationMessageDirective]);


/**
 * Controller for the validation message
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.util.ValidationMessageCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;
};


/**
 * Waits for Angular to finish doing things then resizes the map.
 * @return {boolean}
 */
os.ui.util.ValidationMessageCtrl.prototype.hasError = function() {
  return !goog.object.isEmpty(this.scope_['target'].$error);
};
