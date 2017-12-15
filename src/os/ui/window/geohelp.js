goog.provide('os.ui.window.GeoHelpCtrl');
goog.provide('os.ui.window.geoHelpDirective');

goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * A dialog with information about custom date/geo formats, as implemented by Moment.js.
 * @return {angular.Directive}
 */
os.ui.window.geoHelpDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/window/geohelp.html',
    controller: os.ui.window.GeoHelpCtrl,
    controllerAs: 'th'
  };
};


/**
 * Add the directive to the core module
 */
os.ui.Module.directive('geohelp', [os.ui.window.geoHelpDirective]);


/**
 * Launches the date/time formatting help dialog if one isn't displayed already.
 */
os.ui.window.launchGeoHelp = function() {
  if (!document.getElementById('geo-help')) {
    os.ui.window.create({
      'label': 'Location Formats',
      'icon': 'fa fa-map-marker lt-blue-icon',
      'x': '-10',
      'y': 'center',
      'width': '445',
      'min-width': '250',
      'max-width': '600',
      'height': '500',
      'min-height': '250',
      'max-height': '600',
      'show-close': 'true',
      'z-index': '10002'
    }, '<geohelp></geohelp>');
  }
};



/**
 * Controller for date/time format help.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.window.GeoHelpCtrl = function($scope, $element) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;
  $scope.$on('$destroy', goog.bind(this.destroy_, this));
};


/**
 * Clean up references.
 * @private
 */
os.ui.window.GeoHelpCtrl.prototype.destroy_ = function() {
  this.element_ = null;
};


/**
 * Close the window
 */
os.ui.window.GeoHelpCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(
    os.ui.window.GeoHelpCtrl.prototype,
    'close',
    os.ui.window.GeoHelpCtrl.prototype.close);
