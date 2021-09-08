goog.module('os.ui.draw.DrawControlsUI');

const googEvents = goog.require('goog.events');
const log = goog.require('goog.log');
const {ROOT} = goog.require('os');
const {getIMapContainer} = goog.require('os.map.instance');
const MapEvent = goog.require('os.MapEvent');
const Module = goog.require('os.ui.Module');
const {getMenu} = goog.require('os.ui.draw');
const {Controller: BaseDrawControlsCtrl} = goog.require('os.ui.draw.BaseDrawControlsUI');

const Logger = goog.requireType('goog.log.Logger');


/**
 * The draw-controls directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'os-draw-controls';

/**
 * Add the directive to the module.
 */
Module.directive('osDrawControls', [directive]);

/**
 * Controller for the draw-controls directive.
 * @unrestricted
 */
class Controller extends BaseDrawControlsCtrl {
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

exports = {
  Controller,
  directive,
  directiveTag
};
