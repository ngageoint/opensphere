goog.module('os.ui.window.TimeHelpUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const window = goog.require('os.ui.window');


/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: os.ROOT + 'views/window/timehelp.html',
  controller: Controller,
  controllerAs: 'th'
});


/**
 * Add the directive to the os module
 */
Module.directive('timehelp', [directive]);


/**
 * Launches the date/time formatting help dialog if one isn't displayed already.
 */
window.launchTimeHelp = function() {
  if (!document.getElementById('time-help')) {
    window.create({
      'label': 'Custom Date/Time Formats',
      'icon': 'fa fa-clock-o',
      'x': '-10',
      'y': 'center',
      'width': '445',
      'min-width': '250',
      'max-width': '600',
      'height': '445',
      'min-height': '250',
      'max-height': '600',
      'show-close': true,
      'modal': true
    }, '<timehelp></timehelp>');
  }
};



/**
 * Controller for date/time format help.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up references.
   *
   * @private
   */
  destroy_() {
    this.element_ = null;
  }

  /**
   * Close the window
   *
   * @export
   */
  close() {
    window.close(this.element_);
  }
}

exports = {
  Controller,
  directive
};
