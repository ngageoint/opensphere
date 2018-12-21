goog.provide('os.ui.notification.NotifyPulseCtrl');
goog.provide('os.ui.notification.notifyPulseDirective');


/**
 * @return {angular.Directive}
 */
os.ui.notification.notifyPulseDirective = function() {
  return {
    restrict: 'A',
    controller: os.ui.notification.NotifyPulseCtrl
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('notifypulse', [os.ui.notification.notifyPulseDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.notification.NotifyPulseCtrl = function($scope, $element, $timeout) {
  $scope.$on(os.ui.notification.NotifyPulseCtrl.FIRE, function() {
    $element.addClass('a-pulsate active');
    $timeout(function() {
      $element.removeClass('a-pulsate active');
    }, 3250);
  });
};


/**
 * @type {string}
 */
os.ui.notification.NotifyPulseCtrl.FIRE = 'notification.indicator.fire';
