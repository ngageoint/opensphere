goog.module('os.ui.ol.interaction.DrawPolygon');

const dispose = goog.require('goog.dispose');
const {getDocument} = goog.require('goog.dom');
const BrowserEvent = goog.require('goog.events.BrowserEvent');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const Collection = goog.require('ol.Collection');
const Feature = goog.require('ol.Feature');
const MapBrowserEventType = goog.require('ol.MapBrowserEventType');
const MapBrowserPointerEvent = goog.require('ol.MapBrowserPointerEvent');
const {getCenter, getWidth} = goog.require('ol.extent');
const LineString = goog.require('ol.geom.LineString');
const Polygon = goog.require('ol.geom.Polygon');
const OLVectorLayer = goog.require('ol.layer.Vector');
const OLVectorSource = goog.require('ol.source.Vector');
const os = goog.require('os');
const RecordField = goog.require('os.data.RecordField');
const {validate} = goog.require('os.geo.jsts');
const {normalizeGeometryCoordinates} = goog.require('os.geo2');
const interpolate = goog.require('os.interpolate');
const osMap = goog.require('os.map');
const {MODAL_SELECTOR} = goog.require('os.ui');
const AbstractDraw = goog.require('os.ui.ol.interaction.AbstractDraw');
const AltitudeMode = goog.require('os.webgl.AltitudeMode');

const Geometry = goog.requireType('ol.geom.Geometry');


/**
 */
class DrawPolygon extends AbstractDraw {
  /**
   * Constructor.
   */
  constructor() {
    super({
      handleEvent: DrawPolygon.handleEvent_,
      handleDownEvent: DrawPolygon.handleDownEvent_,
      handleMoveEvent: DrawPolygon.handleMoveEvent_,
      handleUpEvent: DrawPolygon.handleUpEvent_
    });
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
   * @param {MapBrowserPointerEvent} mapBrowserEvent Event.
   * @protected
   */
  saveLast(mapBrowserEvent) {
    this.coords[this.coords.length - 1] = this.coords[0];
  }

  /**
   * @param {MapBrowserPointerEvent} mapBrowserEvent Event.
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
        if (opt_mapBrowserEvent.type === MapBrowserEventType.POINTERUP) {
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
   * @param {MapBrowserPointerEvent} mapBrowserEvent Event.
   * @this DrawPolygon
   * @private
   */
  static handleMoveEvent_(mapBrowserEvent) {
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
  static handleEvent_(mapBrowserEvent) {
    if (!(mapBrowserEvent instanceof MapBrowserPointerEvent)) {
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
   * @param {MapBrowserPointerEvent} mapBrowserEvent Event.
   * @this DrawPolygon
   * @return {boolean}
   * @private
   */
  static handleUpEvent_(mapBrowserEvent) {
    var px = mapBrowserEvent.pixel;

    if (this.downPixel_ && Math.abs(px[0] - this.downPixel_[0]) < 3 && Math.abs(px[1] - this.downPixel_[1]) < 3) {
      this.downPixel_ = null;
      if (!this.drawing) {
        this.begin(mapBrowserEvent);
      }

      if (this.shouldFinish(mapBrowserEvent)) {
        this.saveLast(mapBrowserEvent);
        this.end(mapBrowserEvent);
      } else {
        this.update(mapBrowserEvent);
      }
    }

    return false;
  }

  /**
   * @param {MapBrowserPointerEvent} mapBrowserEvent Event.
   * @this DrawPolygon
   * @return {boolean}
   * @private
   */
  static handleDownEvent_(mapBrowserEvent) {
    // In order to allow dragging while this interaction is enabled, we're just
    // gonna store the mouse down pixel for now and check it again on the up
    // event. If it is close enough, we'll call it a click and not a click+drag.
    var browserEvent = new BrowserEvent(mapBrowserEvent.originalEvent);
    if (browserEvent.isMouseActionButton() && (this.drawing || this.condition(mapBrowserEvent))) {
      this.downPixel_ = mapBrowserEvent.pixel;
    }

    return false;
  }
}


/**
 * @type {string}
 */
DrawPolygon.TYPE = 'polygon';


exports = DrawPolygon;
