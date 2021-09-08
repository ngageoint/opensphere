goog.module('os.ui.window.GeoHelpUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const osWindow = goog.require('os.ui.window');


/**
 * A dialog with information about custom date/geo formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/window/geohelp.html',
  controller: Controller,
  controllerAs: 'th'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'geohelp';

/**
 * Add the directive to the core module
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
    osWindow.close(this.element_);
  }
}

/**
 * Launches the date/time formatting help dialog if one isn't displayed already.
 */
const launchGeoHelp = function() {
  if (!document.getElementById('geo-help')) {
    osWindow.create({
      'label': 'Location Formats',
      'icon': 'fa fa-map-marker',
      'x': '-10',
      'y': 'center',
      'width': '445',
      'min-width': '250',
      'max-width': '600',
      'height': '500',
      'min-height': '250',
      'max-height': '600',
      'show-close': true,
      'modal': true
    }, `<${directiveTag}></${directiveTag}>`);
  }
};

/**
 * @type {function()}
 * @deprecated Please use os.ui.window.GeoHelpUI.launchGeoHelp.
 */
osWindow.launchGeoHelp = launchGeoHelp;

exports = {
  Controller,
  directive,
  directiveTag,
  launchGeoHelp
};
