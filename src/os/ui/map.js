goog.module('os.ui.Map');
goog.module.declareLegacyNamespace();

goog.require('goog.log');
goog.require('os.MapContainer');
goog.require('os.ui');


/**
 * Logger.
 * @type {goog.log.Logger}
 */
const logger = goog.log.getLogger('os.ui.Map');


/**
 * Controller for the map directive.
 */
class Controller {
  /**
   * Constructor.
   * @ngInject
   */
  constructor() {
    /**
     * The map instance.
     * @type {os.MapContainer}
     * @private
     */
    this.map_ = os.MapContainer.getInstance();

    // let angular settle before initializing the map. this ensures the DOM is done laying out and the map container
    // is sized appropriately.
    os.ui.waitForAngular(this.onAngularReady_.bind(this));
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    if (this.map_) {
      this.map_.dispose();
      this.map_ = null;
    }
  }

  /**
   * Initialize the map when Angular has finished loading the DOM.
   *
   * @param {string=} opt_err Error message if a failure occurred.
   * @private
   */
  onAngularReady_(opt_err) {
    if (typeof opt_err === 'string') {
      goog.log.error(logger, 'Error waiting for Angular to render the page: ' + JSON.stringify(opt_err));
    } else if (this.map_) {
      this.map_.init();
    }
  }
}


/**
 * The map directive.
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  scope: true,
  replace: true,
  template: '<div id="map-container" class="mw-0 flex-fill"></div>',
  controller: Controller,
  controllerAs: 'mapCtrl'
});


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('map', [directive]);

exports = {Controller, directive};
