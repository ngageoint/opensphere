goog.declareModuleId('os.ui.draw.DrawControlsUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import {Controller as BaseDrawControlsCtrl} from './basedrawcontrols.js';
import {getMenu} from './draw.js';

const googEvents = goog.require('goog.events');
const log = goog.require('goog.log');
const MapEvent = goog.require('os.MapEvent');
const {getIMapContainer} = goog.require('os.map.instance');

const Logger = goog.requireType('goog.log.Logger');


/**
 * The draw-controls directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'menu': '=?',
    'olMap': '=?',
    'showLabel': '='
  },
  templateUrl: ROOT + 'views/draw/drawcontrols.html',
  controller: Controller,
  controllerAs: 'drawControls'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'os-draw-controls';

/**
 * Add the directive to the module.
 */
Module.directive('osDrawControls', [directive]);

/**
 * Controller for the draw-controls directive.
 * @unrestricted
 */
export class Controller extends BaseDrawControlsCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    // Base draw controller doesn't support lines as a default.
    this['supportsLines'] = true;

    this.log = logger;
  }

  /**
   * @inheritDoc
   */
  $onDestroy() {
    super.$onDestroy();
    googEvents.unlisten(getIMapContainer(), MapEvent.MAP_READY, this.onMapReady, false, this);
  }

  /**
   * @inheritDoc
   */
  getMap() {
    var map = super.getMap();
    return map || getIMapContainer().getMap();
  }

  /**
   * @inheritDoc
   */
  getMenu() {
    var menu = super.getMenu();
    return menu || getMenu();
  }

  /**
   * @inheritDoc
   */
  setFeature(f) {
    if (this.feature) {
      getIMapContainer().removeFeature(this.feature.getId(), true);
    }

    this.feature = f;

    if (this.feature) {
      getIMapContainer().addFeature(this.feature);
    }
  }

  /**
   * @inheritDoc
   */
  listenForMapReady() {
    googEvents.listenOnce(getIMapContainer(), MapEvent.MAP_READY, this.onMapReady, false, this);
  }
}

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.draw.DrawControlsUI');
