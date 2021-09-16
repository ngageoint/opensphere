goog.module('os.ui.ol.interaction.DragCircle');

const {toLonLat} = goog.require('ol.proj');
const RecordField = goog.require('os.data.RecordField');
const {normalizeGeometryCoordinates} = goog.require('os.geo2');
const {METHOD_FIELD, getMethod} = goog.require('os.interpolate');
const Units = goog.require('os.math.Units');
const Circle = goog.require('os.olm.render.Circle');
const AbstractDrag = goog.require('os.ui.ol.interaction.AbstractDrag');
const AltitudeMode = goog.require('os.webgl.AltitudeMode');


/**
 * Draws a circular query area on the map.
 * This interaction is only supported for mouse devices.
 */
class DragCircle extends AbstractDrag {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.type = DragCircle.TYPE;

    /**
     * @type {!Circle}
     * @protected
     */
    this.circle2D = new Circle(this.getStyle(), Units.KILOMETERS);

    /**
     * @type {?ol.Coordinate}
     * @protected
     */
    this.center = null;

    /**
     * @type {number}
     * @protected
     */
    this.distance = -1;
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
    var geom = this.circle2D.getOriginalGeometry();

    if (geom) {
      normalizeGeometryCoordinates(geom);
    }

    return geom;
  }

  /**
   * @inheritDoc
   */
  getProperties() {
    var props = {};
    props[METHOD_FIELD] = getMethod();
    props[RecordField.ALTITUDE_MODE] = AltitudeMode.CLAMP_TO_GROUND;
    return props;
  }

  /**
   * @inheritDoc
   */
  begin(mapBrowserEvent) {
    super.begin(mapBrowserEvent);
    this.circle2D.setMap(mapBrowserEvent.map);
  }

  /**
   * @inheritDoc
   */
  update(mapBrowserEvent) {
    var endCoord = mapBrowserEvent.coordinate;

    if (this.startCoord) {
      this.center = this.startCoord;

      if (endCoord) {
        var start = toLonLat(this.startCoord, this.getMap().getView().getProjection());
        var end = toLonLat(endCoord, this.getMap().getView().getProjection());

        this.distance = osasm.geodesicInverse(start, end).distance;
        this.update2D(this.startCoord, endCoord);
      }
    }
  }

  /**
   * Updates the 2D version
   *
   * @param {ol.Coordinate} start
   * @param {ol.Coordinate} end
   * @protected
   */
  update2D(start, end) {
    if (start && end) {
      this.circle2D.setCoordinates(start, end);
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    super.cleanup();

    this.center = null;
    this.distance = -1;

    if (this.circle2D) {
      this.circle2D.setMap(null);
    }
  }

  /**
   * @inheritDoc
   */
  getResultString() {
    var str = '';

    if (this.startCoord) {
      str += this.startCoord[0] + 'E ';
      str += this.startCoord[1] + 'N ';
    }

    if (this.distance) {
      str += this.distance + 'm';
    }

    return str;
  }
}

/**
 * @type {string}
 */
DragCircle.TYPE = 'circle';

exports = DragCircle;
