goog.provide('os.ui.time.timeDirective');

goog.require('os.ui.Module');


/**
 * The time directive
 * @return {angular.Directive}
 */
os.ui.time.timeDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'hours': '=',
      'mins': '=',
      'secs': '='
    },
    templateUrl: os.ROOT + 'views/time/time.html',
    controllerAs: 'time'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('time', [os.ui.time.timeDirective]);
