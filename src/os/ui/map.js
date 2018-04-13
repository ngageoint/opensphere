goog.provide('os.ui.MapCtrl');
goog.provide('os.ui.mapDirective');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.MapContainer');
goog.require('os.ui');


/**
 * The map directive
 * @return {angular.Directive}
 */
os.ui.mapDirective = function() {
  return {
    restrict: 'E',
    scope: true,
    replace: true,
    template: '<div id="map-container" class="mw-0 w-100 h-100"></div>',
    controller: os.ui.MapCtrl,
    controllerAs: 'mapCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('map', [os.ui.mapDirective]);



/**
 * Controller function for the map directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.MapCtrl = function($scope) {
  /**
  * @type {os.MapContainer}
  * @private
  */
  this.map_ = os.MapContainer.getInstance();

  $scope.$on('$destroy', this.destroy_.bind(this));

  // let angular settle before initializing the map. this ensures the DOM is done laying out and the map container
  // is sized appropriately.
  os.ui.waitForAngular(this.onAngularReady_.bind(this));
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.MapCtrl.LOGGER_ = goog.log.getLogger('os.ui.MapCtrl');


/**
 * Clean up!
 * @private
 */
os.ui.MapCtrl.prototype.destroy_ = function() {
  this.map_.dispose();
  this.map_ = null;
};


/**
 * Initialize the map when Angular has finished loading the DOM.
 * @param {string=} opt_err Error message if a failure occurred
 * @private
 */
os.ui.MapCtrl.prototype.onAngularReady_ = function(opt_err) {
  if (goog.isString(opt_err)) {
    goog.log.error(os.ui.MapCtrl.LOGGER_, 'Error waiting for Angular to render the page: ' +
        JSON.stringify(opt_err));
  } else if (this.map_) {
    this.map_.init();
  }
};
