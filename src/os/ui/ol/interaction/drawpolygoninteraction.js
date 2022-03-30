goog.declareModuleId('os.ui.ol.interaction.DrawPolygon');

import Collection from 'ol/src/Collection.js';
import {getCenter, getWidth} from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import LineString from 'ol/src/geom/LineString.js';
import Polygon from 'ol/src/geom/Polygon.js';
import OLVectorLayer from 'ol/src/layer/Vector.js';
import MapBrowserEvent from 'ol/src/MapBrowserEvent.js';
import MapBrowserEventType from 'ol/src/MapBrowserEventType.js';
import OLVectorSource from 'ol/src/source/Vector.js';

import RecordField from '../../../data/recordfield.js';
import {normalizeGeometryCoordinates} from '../../../geo/geo2.js';
import {validate} from '../../../geo/jsts.js';
import * as interpolate from '../../../interpolate.js';
import * as osMap from '../../../map/map.js';
import * as os from '../../../os.js';
import AltitudeMode from '../../../webgl/altitudemode.js';
import {MODAL_SELECTOR} from '../../ui.js';
import AbstractDraw from './abstractdrawinteraction.js';

const dispose = goog.require('goog.dispose');
const {getDocument} = goog.require('goog.dom');
const BrowserEvent = goog.require('goog.events.BrowserEvent');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');

/**
 */
export default class DrawPolygon extends AbstractDraw {
  /**
   * Constructor.
   */
  constructor() {
    super({});

    this.handleEvent = this.handleEvent_;
    this.handleDownEvent = this.handleDownEvent_;
    this.handleMoveEvent = this.handleMoveEvent_;
    this.handleUpEvent = this.handleUpEvent_;

    this.type = DrawPolygon.TYPE;

    /**
     * @protected
     * @type {Array<!ol.Coordinate>}
     */
    this.coords = [];

    /**
     * The coords removed with an undo in case they are needed for a redo.
     * @protected
     * @type {!Array<!ol.Coordinate>}
     */
    this.backupcoords = [];

    /**
     * @protected
     * @type {OLVectorLayer}
     */
    this.overlay2D = null;

    /**
     * @protected
     * @type {ol.Feature}
     */
    this.line2D = null;

    /**
     * @type {boolean}
     * @protected
     */
    this.finish = false;

    /**
     * @type {?ol.Pixel}
     * @private
     */
    this.downPixel_ = null;

    /**
     * @type {KeyHandler}
     * @private
     */
    this.undoKeyHandler_ = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.cleanup();

    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  getGeometry() {
    var geom = new Polygon([this.coords]);
    var method = interpolate.getMethod();
    geom.set(interpolate.METHOD_FIELD, method);

    //
    // normalize coordinates prior to validation, or polygons crossing the date line may be broken
    //
    // normalization from the first coordinate is typically preferred, but if the geometry covers more than half of the
    // world extent, this will not work. in that situation, use the center of the geometry's extent.
    //
    var halfWorld = getWidth(osMap.PROJECTION.getExtent()) / 2;
    var geomExtent = geom.getExtent();
    var extentWidth = getWidth(geomExtent);
    var normalizeTo = extentWidth > halfWorld ? getCenter(geomExtent)[0] : undefined;
    normalizeGeometryCoordinates(geom, normalizeTo);

    // validate the geometry to ensure it's accepted in server queries
    geom = /** @type {Polygon} */ (validate(geom));

    return geom;
  }

  /**
   * @inheritDoc
   */
  getProperties() {
    var props = {};
    props[interpolate.METHOD_FIELD] = interpolate.getMethod();
    props[RecordField.ALTITUDE_MODE] = AltitudeMode.CLAMP_TO_GROUND;
    return props;
  }

  /**
   * @param {MapBrowserEvent} mapBrowserEvent Event.
   * @protected
   */
  saveLast(mapBrowserEvent) {
    this.coords[this.coords.length - 1] = this.coords[0];
  }

  /**
   * @param {MapBrowserEvent} mapBrowserEvent Event.
   * @return {boolean} Whether or not we should finish drawing
   * @protected
   */
  shouldFinish(mapBrowserEvent) {
    if (this.coords.length > 3) {
      var start = this.getMap().getPixelFromCoordinate(this.coords[0]);
      var px = mapBrowserEvent.pixel;

      if (start && px) {
        return Math.abs(px[0] - start[0]) < 7 && Math.abs(px[1] - start[1]) < 7;
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  begin(mapBrowserEvent) {
    this.finish = false;
    super.begin(mapBrowserEvent);
    interpolate.updateTransforms();
    this.coords.length = 0;
    this.backupcoords.length = 0;
    this.undoKeyHandler_ = new KeyHandler(getDocument(), true);
    this.undoKeyHandler_.listen(KeyEvent.EventType.KEY, this.handleKeyEvent_, true, this);
  }

  /**
   * @inheritDoc
   */
  update(mapBrowserEvent) {
    this.addCoord(mapBrowserEvent.coordinate, mapBrowserEvent);
  }

  /**
   * @param {ol.Coordinate} coord
   * @param {ol.MapBrowserEvent=} opt_mapBrowserEvent
   * @protected
   */
  addCoord(coord, opt_mapBrowserEvent) {
    if (coord) {
      if (opt_mapBrowserEvent) {
        if (opt_mapBrowserEvent.type === MapBrowserEventType.POINTERUP ||
          opt_mapBrowserEvent.type === MapBrowserEventType.POINTERDOWN) {
          this.backupcoords.length = 0;
          this.coords.push(coord);

          if (this.coords.length == 1) {
            this.coords.push(coord);
          }
        } else if (this.coords.length > 1) {
          this.coords[this.coords.length - 1] = coord;
        }
      } else {
        this.coords.push(coord);
      }

      this.beforeUpdate(opt_mapBrowserEvent);

      if (this.coords.length > 1) {
        this.update2D();
      }
    }
  }

  /**
   * This is for extending classes
   *
   * @param {ol.MapBrowserEvent=} opt_mapBrowserEvent
   * @protected
   */
  beforeUpdate(opt_mapBrowserEvent) {
  }

  /**
   * Updates the 2D version
   *
   * @protected
   */
  update2D() {
    this.createOverlay();
    this.overlay2D.setMap(this.getMap());

    if (!this.line2D) {
      this.line2D = new Feature();
      this.line2D.setStyle(this.getStyle());
      this.line2D.set(interpolate.METHOD_FIELD, interpolate.getMethod());
      this.overlay2D.getSource().addFeature(this.line2D);
    }

    var geom = this.createGeometry();

    this.line2D.setGeometry(geom);
    this.line2D.set(interpolate.ORIGINAL_GEOM_FIELD, undefined);
    this.line2D.setProperties(this.getProperties(), true);
    interpolate.interpolateFeature(this.line2D);
  }

  /**
   * Creates the 2D overlay if it doesn't exist already.
   */
  createOverlay() {
    if (!this.overlay2D) {
      this.overlay2D = new OLVectorLayer({
        map: this.getMap(),
        source: new OLVectorSource({
          features: new Collection(),
          useSpatialIndex: false
        }),
        style: this.getStyle(),
        updateWhileAnimating: true,
        updateWhileInteracting: true
      });
    }
  }

  /**
   * @protected
   * @return {Geometry}
   */
  createGeometry() {
    return new LineString(this.coords.slice());
  }

  /**
   * Handle keyboard events.
   *
   * @param {KeyEvent} event
   * @private
   */
  handleKeyEvent_(event) {
    var ctrlOr = os.isOSX() ? event.metaKey : event.ctrlKey;

    if (!document.querySelector(MODAL_SELECTOR)) {
      switch (event.keyCode) {
        case KeyCodes.Z:
          if (ctrlOr) {
            event.stopPropagation();
            event.preventDefault();
            // macs default to cmd+shift+z for undo
            event.shiftKey ? this.redo_() : this.undo_();
          }
          break;
        case KeyCodes.Y:
          if (ctrlOr) {
            event.stopPropagation();
            event.preventDefault();
            this.redo_();
          }
          break;
        default:
          break;
      }
    }
  }

  /**
   * Undo the last point from the shape.
   * @private
   */
  undo_() {
    if (this.coords.length > 2) {
      // pop off the temp coord (where mouse pointer is)
      var mousePosition = this.coords.pop();
      // pop off the actual coord we want to remove
      this.backupcoords.push(this.coords.pop());
      this.addCoord(mousePosition);
    } else {
      this.coords.length = 0;
      this.cancel();
    }
  }

  /**
   * Restore the last point removed from the shape.
   * @private
   */
  redo_() {
    // pop off the temp coord (where mouse pointer is)
    var mousePosition = this.coords.pop();
    this.addCoord(this.backupcoords.pop());
    this.addCoord(mousePosition);
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    super.cleanup();

    if (this.overlay2D) {
      this.overlay2D.getSource().getFeaturesCollection().clear();
      this.overlay2D.setMap(null);
      this.overlay2D.dispose();
      this.overlay2D = null;
    }

    if (this.line2D) {
      this.line2D = null;
    }

    dispose(this.undoKeyHandler_);
  }

  /**
   * @inheritDoc
   */
  getResultString() {
    return this.coords.toString();
  }

  /**
   * @param {MapBrowserEvent} mapBrowserEvent Event.
   * @this DrawPolygon
   * @private
   */
  handleMoveEvent_(mapBrowserEvent) {
    if (this.drawing) {
      this.update(mapBrowserEvent);
    }
  }

  /**
   * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
   * @this DrawPolygon
   * @return {boolean}
   * @private
   * @suppress {accessControls}
   */
  handleEvent_(mapBrowserEvent) {
    if (!(mapBrowserEvent instanceof MapBrowserEvent)) {
      return true;
    }

    this.updateTrackedPointers_(mapBrowserEvent);

    if (mapBrowserEvent.type == MapBrowserEventType.POINTERUP) {
      this.handleUpEvent_(mapBrowserEvent);
    } else if (mapBrowserEvent.type == MapBrowserEventType.POINTERDOWN) {
      this.handleDownEvent_(mapBrowserEvent);
    } else if (mapBrowserEvent.type == MapBrowserEventType.POINTERMOVE) {
      this.handleMoveEvent_(mapBrowserEvent);
    }

    return true;
  }

  /**
   * @param {MapBrowserEvent} mapBrowserEvent Event.
   * @this DrawPolygon
   * @return {boolean}
   * @private
   */
  handleUpEvent_(mapBrowserEvent) {
    var px = mapBrowserEvent.pixel;
    if (this.downPixel_ && Math.abs(px[0] - this.downPixel_[0]) < 3 && Math.abs(px[1] - this.downPixel_[1]) < 3) {
      // If we saved the down pixel and the up event is within our tolerance, handle the event. If outside the
      // tolerance, assume this was from panning the map.
      if (this.drawing && this.shouldFinish(mapBrowserEvent)) {
        // Done drawing, wrap it up.
        this.saveLast(mapBrowserEvent);
        this.end(mapBrowserEvent);
      } else if (!this.drawing) {
        // Haven't started drawing, start now.
        this.begin(mapBrowserEvent);
        this.update(mapBrowserEvent);
      } else {
        // Started drawing, add a coordinate.
        this.update(mapBrowserEvent);
      }
    }

    return false;
  }

  /**
   * @param {MapBrowserEvent} mapBrowserEvent Event.
   * @this DrawPolygon
   * @return {boolean}
   * @private
   */
  handleDownEvent_(mapBrowserEvent) {
    // Only handle the event if there are no other draw controls active
    if (!this.getOtherDrawing()) {
      var browserEvent = new BrowserEvent(mapBrowserEvent.originalEvent);
      if (browserEvent.isMouseActionButton() && (this.drawing || this.condition(mapBrowserEvent))) {
        // If the default condition (shift+click) is met, we want to draw. If not, save the down pixel so we can
        // decide if this is a draw or pan in the up event.
        if (this.defaultCondition(mapBrowserEvent)) {
          if (!this.drawing) {
            // If we haven't started drawing, do so now.
            this.begin(mapBrowserEvent);
          }

          // Add a coordinate to the drawing.
          this.update(mapBrowserEvent);
        } else {
          // In order to allow map panning while this interaction is enabled, store the mouse down pixel for now and
          // check it again on the up event. If it is close enough, we'll call it a click and not a click+drag.
          this.downPixel_ = mapBrowserEvent.pixel;
        }
      }
    }

    return false;
  }
}


/**
 * @type {string}
 */
DrawPolygon.TYPE = 'polygon';
