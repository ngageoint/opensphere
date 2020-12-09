goog.module('os.ui.notification.NotifyPulseUI');
goog.module.declareLegacyNamespace();

const ui = goog.require('os.ui');


/**
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'A',
  controller: Controller
});

/**
 * Add the directive to the ui module
 */
ui.Module.directive('notifypulse', [directive]);



/**
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    $scope.$on(Controller.FIRE, function() {
      $element.addClass('a-pulsate active');
      $timeout(function() {
        $element.removeClass('a-pulsate active');
      }, 3250);
    });
  }
}


/**
 * @type {string}
 */
Controller.FIRE = 'notification.indicator.fire';

exports = {
  Controller,
  directive
};
