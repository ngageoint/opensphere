goog.provide('os.ui.help.MisconfiguredUiCtrl');
goog.provide('os.ui.help.misconfiguredUiDirective');

goog.require('os.ui.Module');
goog.require('os.ui.help.misconfiguredDirective');


/**
 * The misconfiguredUi directive
 * @return {angular.Directive}
 */
os.ui.help.misconfiguredUiDirective = function() {
  var template = [
    '<div class="js-window__wrapper">',
    '<div class="js-window__content">',
    '<misconfigured reason="{{reason}}" name="{{name}}"></misconfigured>',
    '</div>',
    '</div>'].join('');

  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'reason': '@',
      'name': '@'
    },
    template: template,
    controller: os.ui.help.MisconfiguredUiCtrl,
    controllerAs: 'misconfiguredUi'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('misconfiguredUi', [os.ui.help.misconfiguredUiDirective]);



/**
 * Controller function for the misconfiguredUi directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.help.MisconfiguredUiCtrl = function($scope, $element) {
  $scope.$emit(os.ui.WindowEventType.READY);
};
