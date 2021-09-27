goog.declareModuleId('os.ui.notification.NotifyPulseUI');

import Module from '../module.js';


/**
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'A',
  controller: Controller
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'notifypulse';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * @unrestricted
 */
export class Controller {
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
