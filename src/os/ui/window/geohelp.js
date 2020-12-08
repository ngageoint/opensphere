goog.module('os.ui.window.GeoHelpUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const window = goog.require('os.ui.window');


/**
 * A dialog with information about custom date/geo formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: os.ROOT + 'views/window/geohelp.html',
  controller: Controller,
  controllerAs: 'th'
});


/**
 * Add the directive to the core module
 */
Module.directive('geohelp', [directive]);


/**
 * Launches the date/time formatting help dialog if one isn't displayed already.
 */
window.launchGeoHelp = function() {
  if (!document.getElementById('geo-help')) {
    window.create({
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
    }, '<geohelp></geohelp>');
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
    $scope.$on('$destroy', goog.bind(this.destroy_, this));
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
