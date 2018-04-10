goog.provide('os.ui.window.TimeHelpCtrl');
goog.provide('os.ui.window.timeHelpDirective');

goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 * @return {angular.Directive}
 */
os.ui.window.timeHelpDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/window/timehelp.html',
    controller: os.ui.window.TimeHelpCtrl,
    controllerAs: 'th'
  };
};


/**
 * Add the directive to the os module
 */
os.ui.Module.directive('timehelp', [os.ui.window.timeHelpDirective]);


/**
 * Launches the date/time formatting help dialog if one isn't displayed already.
 */
os.ui.window.launchTimeHelp = function() {
  if (!document.getElementById('time-help')) {
    os.ui.window.create({
      'label': 'Custom Date/Time Formats',
      'icon': 'fa fa-clock-o lt-blue-icon',
      'x': '-10',
      'y': 'center',
      'width': '445',
      'min-width': '250',
      'max-width': '600',
      'height': '445',
      'min-height': '250',
      'max-height': '600',
      'show-close': 'true'
    }, '<timehelp></timehelp>');
  }
};



/**
 * Controller for date/time format help.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.window.TimeHelpCtrl = function($scope, $element) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up references.
 * @private
 */
os.ui.window.TimeHelpCtrl.prototype.destroy_ = function() {
  this.element_ = null;
};


/**
 * Close the window
 */
os.ui.window.TimeHelpCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(
    os.ui.window.TimeHelpCtrl.prototype,
    'close',
    os.ui.window.TimeHelpCtrl.prototype.close);
