goog.declareModuleId('os.interaction.DrawLine');

import {squaredDistance} from 'ol/src/coordinate.js';
import LineString from 'ol/src/geom/LineString.js';
import MapBrowserEventType from 'ol/src/MapBrowserEventType.js';

import {normalizeGeometryCoordinates} from '../geo/geo2.js';
import DrawPolygon from './drawpolygoninteraction.js';



/**
 * @typedef {{
 *   pixel: ol.Pixel,
 *   time: number
 * }}
 */
let DrawLineClick;

/**
 * Interaction to draw a line on the map/globe.
 */
export default class DrawLine extends DrawPolygon {
  /**
   * Constructor.
   * @param {olx.interaction.PointerOptions=} opt_options
   */
  constructor(opt_options) {
    super();

    this.origHandleEvent = this.handleEvent;
    this.handleEvent = DrawLine.handleEvent.bind(this);
    this.type = DrawLine.TYPE;

    /**
     * The time of the last down event.
     * @type {DrawLineClick|undefined}
     * @protected
     */
    this.lastDown = undefined;
  }

  /**
   * @inheritDoc
   */
  getGeometry() {
    var geom = null;

    this.coords.length = this.coords.length - 1;

    if (this.coords.length > 1) {
      geom = new LineString(this.coords);
      normalizeGeometryCoordinates(geom);
    }

    return geom;
  }

  /**
   * @inheritDoc
   */
  shouldFinish(mapBrowserEvent) {
    if (this.coords.length > 2 && this.lastDown != null) {
      var lastPixel = this.lastDown.pixel;
      var currPixel = mapBrowserEvent.pixel;
      if (lastPixel && currPixel) {
        var distance = Math.sqrt(squaredDistance(currPixel, lastPixel));
        var duration = Date.now() - this.lastDown.time;
        return distance < DrawLine.FINISH_DISTANCE && duration < DrawLine.FINISH_INTERVAL;
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  update(mapBrowserEvent) {
    super.update(mapBrowserEvent);

    if (mapBrowserEvent.type === MapBrowserEventType.POINTERUP) {
      this.lastDown = /** @type {DrawLineClick} */ ({
        time: Date.now(),
        pixel: mapBrowserEvent.pixel.slice()
      });
    }
  }

  /**
   * Handles map browser events while the control is active.
   *
   * @param {MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @this DrawLine
   * @override
   */
  static handleEvent(mapBrowserEvent) {
    // squelch double click events when active
    if (mapBrowserEvent.type === MapBrowserEventType.DBLCLICK) {
      return false;
    }

    return this.origHandleEvent.call(this, mapBrowserEvent);
  }
}

/**
 * The draw control type.
 * @type {string}
 * @override
 */
DrawLine.TYPE = 'line';

/**
 * Maximum distance between clicks to finish drawing.
 * @type {number}
 * @const
 */
DrawLine.FINISH_DISTANCE = 5;

/**
 * Interval between mouse down events to finish drawing the line.
 *
 * The interval was determined by the double click timeout used by Openlayers.
 *
 * @type {number}
 * @const
 */
DrawLine.FINISH_INTERVAL = 250;
