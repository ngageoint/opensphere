goog.declareModuleId('os.ui.draw.DrawControlsUI');

import {MAC} from 'ol/src/has.js';

import Settings from '../../config/settings.js';
import * as dispatcher from '../../dispatcher.js';
import Measure from '../../interaction/measureinteraction.js';
import Method from '../../interpolatemethod.js';
import MapEvent from '../../map/mapevent.js';
import {getIMapContainer, getMapContainer} from '../../map/mapinstance.js';
import {Map as MapKeys} from '../../metrics/metricskeys.js';
import {ROOT} from '../../os.js';
import MenuItemType from '../menu/menuitemtype.js';
import Module from '../module.js';
import {Controller as BaseDrawControlsCtrl} from './basedrawcontrols.js';
import {getMenu} from './draw.js';
import DrawEventType from './draweventtype.js';

const googEvents = goog.require('goog.events');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: DrawEvent} = goog.requireType('os.ui.draw.DrawEvent');
const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');
const {default: MenuItem} = goog.requireType('os.ui.menu.MenuItem');


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

    /**
     * @type {?Measure}
     */
    this.measureInteraction = null;

    /**
     * Flag for whether we are currently measuring.
     * @type {boolean}
     * @protected
     */
    this.measuring = false;

    /**
     * @type {!string}
     * @private
     */
    this.key_ = 'measureMethod';

    Measure.method = /** @type {Method} */ (Settings.getInstance().get(this.key_, Measure.method));

    dispatcher.getInstance().listen(DrawEventType.DRAWEND, this.onDrawEnd_, false, this);
    dispatcher.getInstance().listen(DrawEventType.DRAWCANCEL, this.onDrawEnd_, false, this);
  }

  /**
   * @inheritDoc
   */
  $onDestroy() {
    googEvents.unlisten(getIMapContainer(), MapEvent.MAP_READY, this.onMapReady, false, this);
    dispatcher.getInstance().unlisten(DrawEventType.DRAWEND, this.onDrawEnd_, false, this);
    dispatcher.getInstance().unlisten(DrawEventType.DRAWCANCEL, this.onDrawEnd_, false, this);
    this.controlMenu.unlisten(Method.GEODESIC, this.onMeasureTypeChange_, false, this);
    this.controlMenu.unlisten(Method.RHUMB, this.onMeasureTypeChange_, false, this);
    super.$onDestroy();
  }

  /**
   * @inheritDoc
   */
  onMapReady(event) {
    super.onMapReady(event);

    this.measureInteraction = this.getMeasureInteraction_();
    if (this.measureInteraction) {
      // always leave the interaction enabled so it can respond to click events
      this.measureInteraction.setActive(true);
    }
  }

  /**
   * @inheritDoc
   */
  initControlMenu() {
    super.initControlMenu();

    // the main draw control UI should contribute the measure controls group if it isn't there already
    const mi = this.controlMenu.getRoot();
    const measureGroup = mi.find('Measure');

    if (!measureGroup) {
      const platformModifier = MAC ? 'Cmd' : 'Ctrl';

      mi.addChild({
        type: MenuItemType.GROUP,
        label: 'Measure',
        tooltip: 'Options for measuring distances',
        shortcut: `${platformModifier}+Shift+click`,
        sort: 50,
        children: [{
          label: 'Measure Rhumb Line',
          eventType: Method.RHUMB,
          tooltip: 'Measures the path of constant bearing between two points.',
          metricKey: MapKeys.MEASURE_TOGGLE,
          beforeRender: updateIcons,
          sort: 70
        }, {
          label: 'Measure Geodesic',
          eventType: Method.GEODESIC,
          tooltip: 'Measures the shortest distance between two points (variable bearing).',
          metricKey: MapKeys.MEASURE_TOGGLE,
          beforeRender: updateIcons,
          sort: 60
        }]
      });
    }

    this.controlMenu.listen(Method.GEODESIC, this.onMeasureTypeChange_, false, this);
    this.controlMenu.listen(Method.RHUMB, this.onMeasureTypeChange_, false, this);
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

  /**
   * @inheritDoc
   * @export
   */
  isActive() {
    return super.isActive() || (this.measureInteraction ? this.measureInteraction.getEnabled() : false);
  }

  /**
   * Toggles the measure interaction.
   * @param {boolean=} opt_value The toggle value
   * @export
   */
  toggleMeasure(opt_value) {
    var measure = this.measureInteraction;

    if (measure) {
      opt_value = opt_value !== undefined ? opt_value : !measure.getActive();
      measure.setEnabled(opt_value);
    }
  }

  /**
   * Handles draw end events.
   * @param {DrawEvent} evt The draw event
   * @private
   */
  onDrawEnd_(evt) {
    if (evt.target instanceof Measure) {
      this.toggleMeasure(false);
    }
  }

  /**
   * Gets the measure interaction from the map.
   * @return {?Measure} The measure interaction
   * @private
   */
  getMeasureInteraction_() {
    var interactions = getMapContainer().getMap().getInteractions().getArray();
    var measure = interactions.find((interaction) => {
      return interaction instanceof Measure && interaction.isType('measure');
    });
    return /** @type {Measure} */ (measure);
  }

  /**
   * Handles measure type changes.
   * @param {MenuEvent<undefined>} evt The event from the menu
   * @private
   */
  onMeasureTypeChange_(evt) {
    // Cancel any active measure interaction
    if (this.measureInteraction.getEnabled()) {
      this.measureInteraction.setEnabled(false);
    }

    // Cancel any active draw interaction
    if (this.interaction.getEnabled()) {
      this.interaction.setEnabled(false);
    }

    Measure.method = /** @type {Method} */ (evt.type);
    Settings.getInstance().set(this.key_, evt.type);
    this.toggleMeasure(true);
  }

  /**
   * @inheritDoc
   * @export
   */
  activateControl(type) {
    // Cancel any active measure interaction
    if (this.measureInteraction.getEnabled()) {
      this.measureInteraction.setEnabled(false);
    }

    super.activateControl(type);
  }
}

/**
 * Helper function for changing the icons on measure options.
 * @this {MenuItem}
 */
const updateIcons = function() {
  if (this.eventType === Measure.method) {
    this.icons = ['<i class="fa fa-fw fa-dot-circle-o"></i>'];
  } else {
    this.icons = ['<i class="fa fa-fw fa-circle-o"></i>'];
  }
};

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.draw.DrawControlsUI');
