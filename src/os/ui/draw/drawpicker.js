goog.declareModuleId('os.ui.draw.DrawPickerUI');

import {listen, unlistenByKey} from 'ol/src/events.js';
import Point from 'ol/src/geom/Point.js';
import SimpleGeometry from 'ol/src/geom/SimpleGeometry.js';
import MapBrowserEventType from 'ol/src/MapBrowserEventType.js';

import DragBox from '../../interaction/dragboxinteraction.js';
import DragCircle from '../../interaction/dragcircleinteraction.js';
import DrawLine from '../../interaction/drawlineinteraction.js';
import DrawPolygon from '../../interaction/drawpolygoninteraction.js';
import {getIMapContainer} from '../../map/mapinstance.js';
import {addOGCMenuItems} from '../../ogc/registry.js';
import {ROOT} from '../../os.js';
import * as draw from '../menu/drawmenu.js';
import Module from '../module.js';
import DragBoxInteraction from '../ol/interaction/dragboxinteraction.js';
import DragCircleInteraction from '../ol/interaction/dragcircleinteraction.js';
import DrawPolygonInteraction from '../ol/interaction/drawpolygoninteraction.js';
import launchChooseArea from '../query/area/launchchoosearea.js';
import {apply} from '../ui.js';
import DrawEventType from './draweventtype.js';

const Disposable = goog.require('goog.Disposable');
const dispose = goog.require('goog.dispose');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');

const {default: OSMap} = goog.requireType('os.Map');
const {default: DrawEvent} = goog.requireType('os.ui.draw.DrawEvent');
const {default: Menu} = goog.requireType('os.ui.menu.Menu');
const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');


/**
 * The drawpicker directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'callback': '=?', // callback for draw completion
    'point': '=?', // whether to include the point control
    'line': '=?', // whether to include the line control
    'menu': '=?', // whether is should be a menu view
    'default': '@' // the default drawing control to use
  },
  templateUrl: ROOT + 'views/draw/drawpicker.html',
  controller: Controller,
  controllerAs: 'drawPicker'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'drawpicker';

/**
 * Add the directive to the module.
 */
Module.directive('drawpicker', [directive]);

/**
 * Controller function for the drawpicker directive
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super();

    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * The map.
     * @type {OSMap}
     * @protected
     */
    this.map = /** @type {OSMap} */ (getIMapContainer().getMap());

    /**
     * Listener key for clicks on the map.
     * @type {?ol.EventsKey}
     * @protected
     */
    this.mapListenKey = null;

    /**
     * DragBox interaction
     * @type {DragBox}
     * @private
     */
    this.dragBox_ = new DragBox();
    listen(this.dragBox_, DrawEventType.DRAWEND, this.onDrawEnd_, this);
    listen(this.dragBox_, DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

    /**
     * DragCircle interaction
     * @type {DragCircle}
     * @private
     */
    this.dragCircle_ = new DragCircle();
    listen(this.dragCircle_, DrawEventType.DRAWEND, this.onDrawEnd_, this);
    listen(this.dragCircle_, DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

    /**
     * DrawPolygon interaction
     * @type {DrawPolygon}
     * @private
     */
    this.drawPolygon_ = new DrawPolygon();
    listen(this.drawPolygon_, DrawEventType.DRAWEND, this.onDrawEnd_, this);
    listen(this.drawPolygon_, DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

    /**
     * DrawLine interaction
     * @type {DrawPolygon}
     * @private
     */
    this.drawLine_ = new DrawLine();
    listen(this.drawLine_, DrawEventType.DRAWEND, this.onDrawEnd_, this);
    listen(this.drawLine_, DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

    /**
     * Handler for escape key events.
     * @type {!KeyHandler}
     * @protected
     */
    this.keyHandler = new KeyHandler(document);
    this.keyHandler.listen(KeyEvent.EventType.KEY, this.onKey, false, this);

    if ($scope['menu']) {
      /**
       * The draw menu controls (if applicable).
       * @type {Menu}
       */
      this.controlMenu = draw.create(this.onDrawEvent.bind(this));
      this.initControlMenu();
    }

    var defaultType = /** @type {string} */ ($scope['default']);
    /**
     * The selected drawing type.
     * @type {?string}
     */
    this['selectedType'] = defaultType || DragBoxInteraction.TYPE;

    /**
     * Whether the control is currently drawing.
     * @type {boolean}
     */
    this['active'] = false;

    /**
     * UID for this controller, used to unique identify the menu anchor.
     * @type {number}
     */
    this['uid'] = goog.getUid(this);

    this.map.addInteraction(this.dragBox_);
    this.map.addInteraction(this.dragCircle_);
    this.map.addInteraction(this.drawPolygon_);
    this.map.addInteraction(this.drawLine_);

    if (defaultType) {
      // if passed a default type, initialize to it
      this.draw(defaultType);
    }

    $scope.$on('drawpicker.cancel', this.onDrawCancel_.bind(this));
    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.disablePoint();

    // remove interactions
    this.map.removeInteraction(this.dragBox_);
    this.map.removeInteraction(this.dragCircle_);
    this.map.removeInteraction(this.drawPolygon_);
    this.map.removeInteraction(this.drawLine_);
    this.dragBox_.dispose();
    this.dragCircle_.dispose();
    this.drawPolygon_.dispose();
    this.drawLine_.dispose();
    this.dragBox_ = null;
    this.dragCircle_ = null;
    this.drawPolygon_ = null;
    this.drawLine_ = null;

    dispose(this.keyHandler);

    this.scope = null;
    this.element = null;
    this.map = null;
  }

  /**
   * @protected
   */
  initControlMenu() {
    var mi = this.controlMenu.getRoot();
    var onDraw = this.onDrawEvent.bind(this);

    // remove the enter coordinates and whole world options as they are inapplicable here
    mi.removeChild('Whole World');
    mi.removeChild('Enter Coordinates');

    if (this.scope['line']) {
      mi.addChild({
        label: 'Line',
        eventType: draw.EventType.LINE,
        tooltip: 'Draw a line on the map',
        icons: ['<i class="fa fa-fw fa-long-arrow-right"></i> '],
        handler: onDraw,
        sort: 40
      });
    }

    // use this handler to bind on-click 'OK' to whatever 'callback' is on the this.scope OR returns null to do default 'add to areas'
    var getCallback = function() {
      return (this.scope['callback'] ? this.onOGCQueryFeatureChosen.bind(this) : null);
    }.bind(this);

    // add any configured OGC lookups (e.g. Country Borders)
    addOGCMenuItems(this.controlMenu, 130, getCallback);
  }

  /**
   * Handle draw menu events.
   *
   * @param {MenuEvent} event The event.
   */
  onDrawEvent(event) {
    switch (event.type) {
      case draw.EventType.BOX:
        this.draw(DragBoxInteraction.TYPE);
        break;
      case draw.EventType.CIRCLE:
        this.draw(DragCircleInteraction.TYPE);
        break;
      case draw.EventType.POLYGON:
        this.draw(DrawPolygonInteraction.TYPE);
        break;
      case draw.EventType.LINE:
        this.draw(DrawLine.TYPE);
        break;
      case draw.EventType.CHOOSE_AREA:
        launchChooseArea(this.onAreaChosen.bind(this));
        break;
      default:
        break;
    }
  }

  /**
   * Opens the drawing menu.
   *
   * @export
   */
  toggleMenu() {
    var target = this.element.find('.js-draw-controls' + this['uid']);
    this.controlMenu.open(undefined, {
      my: 'left top+4',
      at: 'left bottom',
      of: target
    });
  }

  /**
   * Initializes drawing with the chosen control.
   *
   * @param {string} type The drawing type to initialize.
   * @export
   */
  draw(type) {
    var lastType = this['selectedType'];
    var wasActive = this['active'];
    this.onDrawCancel_();

    if (wasActive && lastType && lastType === type) {
      // user clicked the currently active button, so treat it as toggling the controls off
      return;
    }

    this['active'] = true;
    this['selectedType'] = type;
    var interaction;

    if (type == 'point') {
      // don't need an interaction for handling points
      this.enablePoint();
      return;
    } else if (type == DragBoxInteraction.TYPE) {
      interaction = this.dragBox_;
    } else if (type == DragCircleInteraction.TYPE) {
      interaction = this.dragCircle_;
    } else if (type == DrawPolygonInteraction.TYPE) {
      interaction = this.drawPolygon_;
    } else if (type == DrawLine.TYPE) {
      interaction = this.drawLine_;
    }

    if (interaction) {
      interaction.setActive(true);
      interaction.setEnabled(true);
    }
  }

  /**
   * Enables a listener for clicks on the map
   */
  enablePoint() {
    if (!this.mapListenKey) {
      this.mapListenKey = listen(this.map, MapBrowserEventType.SINGLECLICK, this.onMapClick, this);
    }
  }

  /**
   * Enables a listener for clicks on the map
   */
  disablePoint() {
    if (this.mapListenKey) {
      unlistenByKey(this.mapListenKey);
      this.mapListenKey = null;
    }
  }

  /**
   * Handles draw end events.
   *
   * @param {DrawEvent} event
   * @private
   */
  onDrawEnd_(event) {
    if (event && event.geometry instanceof SimpleGeometry) {
      var geometry = /** @type {ol.geom.SimpleGeometry} */ (event.geometry);
      this.scope['callback'](geometry);
    }
  }

  /**
   * Handles draw cancel events.
   *
   * @param {(angular.Scope.Event|DrawEvent)=} opt_event
   * @private
   */
  onDrawCancel_(opt_event) {
    if (opt_event) {
      opt_event.preventDefault();
    }

    // disable all interactions
    this.disablePoint();
    this.dragBox_.setActive(false);
    this.dragBox_.setEnabled(false);
    this.dragCircle_.setActive(false);
    this.dragCircle_.setEnabled(false);
    this.drawPolygon_.setActive(false);
    this.drawPolygon_.setEnabled(false);
    this.drawLine_.setActive(false);
    this.drawLine_.setEnabled(false);

    this['active'] = false;

    apply(this.scope);
  }

  /**
   * Handle map browser events.
   *
   * @param {MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} 'false' to stop event propagation
   * @protected
   */
  onMapClick(mapBrowserEvent) {
    if (mapBrowserEvent.type == MapBrowserEventType.SINGLECLICK &&
        mapBrowserEvent.coordinate && mapBrowserEvent.coordinate.length > 1) {
      // This UI will do everything in lon/lat
      var point = new Point(mapBrowserEvent.coordinate);
      this.scope['callback'](point);
    }

    return false;
  }

  /**
   * Handler for escape key presses.
   *
   * @param {KeyEvent} event
   */
  onKey(event) {
    if (event.keyCode == KeyCodes.ESC) {
      this.onDrawCancel_();
    }
  }

  /**
   * Handler for area chosen.
   *
   * @param {Feature} feature The chosen area.
   */
  onAreaChosen(feature) {
    var geometry = feature.getGeometry();
    if (geometry instanceof SimpleGeometry) {
      this.scope['callback'](geometry);
    }
  }

  /**
   * Handler for ogc feature chosen.
   * @param {Feature} feature The loaded ogc feature.
   */
  onOGCQueryFeatureChosen(feature) {
    this.onAreaChosen(feature);
  }
}
