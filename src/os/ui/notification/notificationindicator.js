goog.module('os.ui.notification.NotifyPulseUI');

const Module = goog.require('os.ui.Module');


/**
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'A',
  controller: Controller
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'notifypulse';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

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
  directive,
  directiveTag
};
