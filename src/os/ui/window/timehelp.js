goog.module('os.ui.window.TimeHelpUI');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const {close, create} = goog.require('os.ui.window');


/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/window/timehelp.html',
  controller: Controller,
  controllerAs: 'th'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'timehelp';

/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);

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
    close(this.element_);
  }
}

/**
 * Launches the date/time formatting help dialog if one isn't displayed already.
 */
const launchTimeHelp = function() {
  if (!document.getElementById('time-help')) {
    create({
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
    }, `<${directiveTag}></${directiveTag}>`);
  }
};

exports = {
  Controller,
  directive,
  directiveTag,
  launchTimeHelp
};
