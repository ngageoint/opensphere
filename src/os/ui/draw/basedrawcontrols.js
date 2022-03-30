goog.declareModuleId('os.ui.draw.BaseDrawControlsUI');

import Feature from 'ol/src/Feature.js';
import Settings from '../../config/settings.js';
import RecordField from '../../data/recordfield.js';
import * as dispatcher from '../../dispatcher.js';
import DragZoom from '../../interaction/dragzoominteraction.js';
import Metrics from '../../metrics/metrics.js';
import {Map as MapMetrics} from '../../metrics/metricskeys.js';
import {addOGCMenuItems} from '../../ogc/registry.js';
import {ROOT} from '../../os.js';
import GlobalMenuEventType from '../globalmenueventtype.js';
import * as draw from '../menu/drawmenu.js';
import Module from '../module.js';
import AbstractDraw from '../ol/interaction/abstractdrawinteraction.js';
import DragBox from '../ol/interaction/dragboxinteraction.js';
import {apply} from '../ui.js';
import DrawEventType from './draweventtype.js';

const log = goog.require('goog.log');
const {getRandomString} = goog.require('goog.string');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');
const {default: IMapContainer} = goog.requireType('os.map.IMapContainer');
const {default: DrawEvent} = goog.requireType('os.ui.draw.DrawEvent');
const {default: Menu} = goog.requireType('os.ui.menu.Menu');


/**
 * The draw-controls directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'menu': '=',
    'olMap': '=',
    'embeddedControls': '=?'
  },
  templateUrl: ROOT + 'views/draw/basedrawcontrols.html',
  controller: Controller,
  controllerAs: 'drawControls'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'draw-controls';

/**
 * Add the directive to the os.ui module.
 */
Module.directive('drawControls', [directive]);

/**
 * Controller for the draw-controls directive. This version of the draw controls is designed to work with
 * the os.ui version of the OL map.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * @type {AbstractDraw}
     * @protected
     */
    this.interaction = null;

    /**
     * The active drawing feature.
     * @type {Feature|undefined}
     * @protected
     */
    this.feature = undefined;

    /**
     * The menu containing the available draw interactions (displayed from the button dropdown).
     * @type {Menu|undefined}
     * @protected
     */
    this.controlMenu = draw.getMenu();

    /**
     * The menu to display when drawing completes.
     * @type {Menu|undefined}
     * @protected
     */
    this.menu = $scope['menu'];

    /**
     * The logger
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {IMapContainer}
     * @private
     */
    this.olMap_ = $scope['olMap'];

    /**
     * @type {string}
     */
    this['selectedType'] = '';

    /**
     * If the line control is supported.
     * @type {boolean}
     */
    this['supportsLines'] = false;

    /**
     * If extra controls should be hidden.
     * @type {boolean}
     */
    this['hideExtraControls'] = false;
  }

  /**
   * Angular initialization lifecycle function. Sets up event listening and our controls menu.
   */
  $onInit() {
    this.initControlMenu();

    dispatcher.getInstance().listen(DrawEventType.DRAWSTART, this.apply, false, this);
    dispatcher.getInstance().listen(DrawEventType.DRAWEND, this.onDrawEnd, false, this);
    dispatcher.getInstance().listen(DrawEventType.DRAWCANCEL, this.apply, false, this);

    dispatcher.getInstance().listen(DrawEventType.DRAWBOX, this.onDrawType, false, this);
    dispatcher.getInstance().listen(DrawEventType.DRAWCIRCLE, this.onDrawType, false, this);
    dispatcher.getInstance().listen(DrawEventType.DRAWPOLYGON, this.onDrawType, false, this);
    dispatcher.getInstance().listen(DrawEventType.DRAWLINE, this.onDrawType, false, this);

    var selected = /** @type {string} */ (Settings.getInstance().get('drawType', DragBox.TYPE));
    this.setSelectedControl(selected);
  }

  /**
   * Angular destruction lifecycle function. Stop event listening.
   */
  $onDestroy() {
    dispatcher.getInstance().unlisten(DrawEventType.DRAWSTART, this.apply, false, this);
    dispatcher.getInstance().unlisten(DrawEventType.DRAWEND, this.onDrawEnd, false, this);
    dispatcher.getInstance().unlisten(DrawEventType.DRAWCANCEL, this.apply, false, this);

    dispatcher.getInstance().unlisten(DrawEventType.DRAWBOX, this.onDrawType, false, this);
    dispatcher.getInstance().unlisten(DrawEventType.DRAWCIRCLE, this.onDrawType, false, this);
    dispatcher.getInstance().unlisten(DrawEventType.DRAWPOLYGON, this.onDrawType, false, this);
    dispatcher.getInstance().unlisten(DrawEventType.DRAWLINE, this.onDrawType, false, this);

    this.scope = null;
    this.element = null;
  }

  /**
   * @return {ol.PluggableMap}
   */
  getMap() {
    return this.olMap_ ? this.olMap_.getMap() : null;
  }

  /**
   * Get the menu to display when drawing completes.
   *
   * @return {Menu|undefined}
   */
  getMenu() {
    return this.menu;
  }

  /**
   * Set the active drawing feature.
   *
   * @param {Feature|undefined} f The feature.
   * @protected
   */
  setFeature(f) {
    if (this.feature && this.olMap_) {
      this.olMap_.removeFeature(this.feature, true);
    }

    this.feature = f;

    if (this.feature && this.olMap_) {
      this.olMap_.addFeature(this.feature);
    }
  }

  /**
   * @param {string} type
   * @protected
   */
  setSelectedControl(type) {
    if (this.interaction) {
      this.interaction.setActive(false);
      this.interaction = null;
    }

    var map = this.getMap();
    if (map) {
      var interactions = map.getInteractions().getArray();
      for (var i = 0, n = interactions.length; i < n; i++) {
        var interaction = /** @type {AbstractDraw} */ (interactions[i]);
        if (interaction instanceof AbstractDraw &&
           !(interaction instanceof DragZoom)) {
          var active = interaction.isType(type);
          interaction.setActive(active);

          if (active) {
            this.interaction = interaction;
            break;
          }
        }
      }
    } else {
      this.listenForMapReady();
    }

    Settings.getInstance().set('drawType', type);
    this['selectedType'] = type;
  }

  /**
   * Register a listener that will be called when the map is ready.
   *
   * @protected
   */
  listenForMapReady() {
    // implement in extending classes
  }

  /**
   * Handle map ready event.
   *
   * @param {GoogEvent} event The ready event.
   * @protected
   */
  onMapReady(event) {
    this.setSelectedControl(this['selectedType']);
  }

  /**
   * @param {*=} opt_event
   * @protected
   */
  apply(opt_event) {
    apply(this.scope);
  }

  /**
   * @protected
   */
  initControlMenu() {
    var mi = this.controlMenu.getRoot();
    if (this['supportsLines']) {
      const drawGroup = mi.find('Draw');
      drawGroup.addChild({
        label: 'Line',
        eventType: draw.EventType.LINE,
        tooltip: 'Draw a line on the map',
        icons: ['<i class="fa fa-fw fa-long-arrow-right"></i> '],
        handler: draw.handleDrawEvent,
        sort: 40
      });
    }

    if (this['hideExtraControls']) {
      mi.removeChild('Choose Area');
      mi.removeChild('Enter Coordinates');
      mi.removeChild('Whole World');
      mi.removeChild('drawMenuSeparator');
    } else {
      addOGCMenuItems(this.controlMenu, 130);
    }
  }

  /**
   * @param {DrawEvent} event
   * @protected
   */
  onDrawEnd(event) {
    if (event.target === this.interaction) {
      var style = this.interaction.getStyle();
      var menu = this.getMenu();
      var map = this.getMap();
      if (menu && map) {
        // stop doing stuff while the menu is up
        $(map.getViewport()).addClass('u-pointer-events-none');

        var f = new Feature(event.properties);
        f.setGeometry(event.geometry.clone());
        f.setId(getRandomString());
        f.setStyle(style);
        f.set(RecordField.DRAWING_LAYER_NODE, false);

        this.setFeature(f);

        var context = {
          feature: f,
          geometry: event.geometry,
          style: style
        };

        menu.open(context, {
          my: 'left top',
          at: 'left+' + event.pixel[0] + ' top+' + event.pixel[1],
          of: '#map-container'
        });

        dispatcher.getInstance().listenOnce(GlobalMenuEventType.MENU_CLOSE, this.onMenuEnd, false, this);
        this.apply();
      }
    }
  }

  /**
   * Handles menu finish
   *
   * @param {GoogEvent=} opt_e
   * @protected
   */
  onMenuEnd(opt_e) {
    $(this.getMap().getViewport()).removeClass('u-pointer-events-none');
    this.setFeature(undefined);
    if (this.interaction) {
      this.interaction.setEnabled(false);
    }
    this.apply();
  }

  /**
   * @param {GoogEvent} e
   */
  onDrawType(e) {
    if (e && e.type) {
      this.activateControl(e.type);
    }
  }

  /**
   * @param {string} type
   * @export
   */
  activateControl(type) {
    log.fine(this.log, 'Activating ' + type + ' control.');
    Metrics.getInstance().updateMetric(MapMetrics.DRAW, 1);
    Metrics.getInstance().updateMetric(MapMetrics.DRAW + '_' + type, 1);

    if (this.interaction && this.interaction.getType() != type) {
      // disable the old control so that it isn't secretly enabled the next time it comes on
      this.interaction.setEnabled(false);
      this.setSelectedControl(type);
    }

    if (this.interaction) {
      this.interaction.setEnabled(!this.interaction.getEnabled());
    }
  }

  /**
   * @param {boolean=} opt_value
   * @export
   */
  toggleMenu(opt_value) {
    var menu = this.controlMenu;

    var target = this.element.find('.draw-controls-group');
    menu.open(undefined, {
      my: 'left top+4',
      at: 'left bottom',
      of: target
    });
  }

  /**
   * @return {boolean} whether the current interaction is enabled/active
   * @export
   */
  isActive() {
    return this.interaction ? this.interaction.getEnabled() : false;
  }
}

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.draw.BaseDrawControlsUI');
