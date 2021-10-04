goog.declareModuleId('os.ui.Map');

import MapContainer from '../mapcontainer.js';
import Module from './module.js';
import {waitForAngular} from './ui.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.Map');

/**
 * Controller for the map directive.
 */
export class Controller {
  /**
   * Constructor.
   * @ngInject
   */
  constructor() {
    /**
     * The map instance.
     * @type {MapContainer}
     * @private
     */
    this.map_ = MapContainer.getInstance();

    // let angular settle before initializing the map. this ensures the DOM is done laying out and the map container
    // is sized appropriately.
    waitForAngular(this.onAngularReady_.bind(this));
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
      log.error(logger, 'Error waiting for Angular to render the page: ' + JSON.stringify(opt_err));
    } else if (this.map_) {
      this.map_.init();
    }
  }
}

/**
 * The map directive.
 * @return {angular.Directive}
 */
export const directive = () => ({
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
Module.directive('map', [directive]);
