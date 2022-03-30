goog.declareModuleId('os.ui.ol.interaction.DragBox');

import {fromExtent} from 'ol/src/geom/Polygon.js';
import {toLonLat} from 'ol/src/proj.js';

import RecordField from '../../../data/recordfield.js';
import {normalizeLongitude} from '../../../geo/geo2.js';
import GeometryField from '../../../geom/geometryfield.js';
import {METHOD_FIELD} from '../../../interpolate.js';
import Method from '../../../interpolatemethod.js';
import Box from '../../../olm/render/box.js';
import AltitudeMode from '../../../webgl/altitudemode.js';
import AbstractDrag from './abstractdraginteraction.js';

/**
 * Draws a rectangluar query area on the map.
 * This interaction is only supported for mouse devices.
 */
export default class DragBox extends AbstractDrag {
  /**
   * Constructor.
   * @param {olx.interaction.PointerOptions=} opt_options
   */
  constructor(opt_options) {
    super(opt_options);
    this.type = DragBox.TYPE;

    /**
     * @type {ol.Coordinate}
     * @protected
     */
    this.endCoord = null;

    /**
     * The direction of the drawing operation. 1 = right, -1 = left, 0 = undecided.
     * @type {?number}
     * @protected
     */
    this.direction = null;

    /**
     * Whether the draw has cross the antimeridian.
     * @type {boolean}
     */
    this.crossedAntimeridian = false;

    /**
     * Flag for whether the final draw result should be the original geometry or the interpolated one. We
     * want to return the original when the box is not wider than half the world width.
     * @type {boolean}
     */
    this.useOriginal = true;

    /**
     * @type {!Box}
     * @protected
     */
    this.box2D = new Box(/** @type {Style} */ (this.getStyle()));
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
    var geom = this.useOriginal ? this.box2D.getOriginalGeometry() : this.box2D.getGeometry();
    geom.set(GeometryField.NORMALIZED, true);
    geom.set(METHOD_FIELD, Method.RHUMB);
    return geom;
  }

  /**
   * @inheritDoc
   */
  getProperties() {
    var props = {};
    props[METHOD_FIELD] = Method.RHUMB;
    props[RecordField.ALTITUDE_MODE] = AltitudeMode.CLAMP_TO_GROUND;
    return props;
  }

  /**
   * @inheritDoc
   */
  begin(mapBrowserEvent) {
    this.crossedAntimeridian = false;
    this.direction = null;
    this.useOriginal = true;

    super.begin(mapBrowserEvent);
    this.box2D.setMap(mapBrowserEvent.map);
  }

  /**
   * @inheritDoc
   */
  update(mapBrowserEvent) {
    // record the current last longitude, we'll use this to figure out the differential in the current draw call
    var proj = this.getMap().getView().getProjection();
    var lastEndLon = this.endCoord && toLonLat(this.endCoord, proj)[0];

    this.endCoord = mapBrowserEvent.coordinate || this.endCoord;

    if (this.startCoord && this.endCoord) {
      var start = toLonLat(this.startCoord, proj);
      var end = toLonLat(this.endCoord, proj);

      // we need the ending longitude raw, and normalized to the start + 360 and - 360 to be sure of the direction
      var startLon = start[0];
      var endLon = end[0];
      var endLonNormalizedRight = normalizeLongitude(endLon, startLon, startLon + 360);
      var endLonNormalizedLeft = normalizeLongitude(endLon, startLon, startLon - 360);

      if (lastEndLon != null) {
        var lastEndLonNormalizedRight = normalizeLongitude(lastEndLon, startLon, startLon + 360);
        var lastEndLonNormalizedLeft = normalizeLongitude(lastEndLon, startLon, startLon - 360);

        // The check against 300 here is for the case of crossing the antimeridian. The delta between this call
        // and the last will be ~360 degrees when you pass over the antimeridian (i.e. current lon = 179, last = -179).
        //
        // If and only if we've already cross the antimeridian, we need to check the last normalized differentials as
        // well. This corresponds to the case of wrapping all the way around the world and crossing over the starting
        // point where we need to reset the crossedAntimeridian flag.
        if (Math.abs(endLon - lastEndLon) > 300 || (this.crossedAntimeridian &&
            (Math.abs(endLonNormalizedRight - lastEndLonNormalizedRight) > 300 ||
            Math.abs(endLonNormalizedLeft - lastEndLonNormalizedLeft) > 300))) {
          this.crossedAntimeridian = !this.crossedAntimeridian;
        }
      }

      if (!this.crossedAntimeridian && lastEndLon != null && Math.abs(endLon - lastEndLon) < 180) {
        // 0 = no direction chosen, 1 = right, -1 = left
        this.direction = Math.sign(Math.round((endLon - startLon)));
      }

      // if we're going left, we need to use the left normalized endpoint, and vice versa.
      if (this.direction == -1) {
        endLon = endLonNormalizedLeft;
      } else if (this.direction == 1) {
        endLon = endLonNormalizedRight;
      }

      // insert a central longitude point in order to force the renderers to know which direction to render in
      var middleLon = (endLon + startLon) / 2;
      var minX = startLon;
      var minY = start[1];
      var maxX = endLon;
      var maxY = end[1];
      var geometry;

      if (Math.abs(maxX - minX) > 180) {
        var coords = [
          [minX, minY],
          [minX, maxY],
          [middleLon, maxY],
          [maxX, maxY],
          [maxX, minY],
          [middleLon, minY],
          [minX, minY]
        ];

        this.useOriginal = false;
        geometry = new Polygon([coords]);
      } else {
        this.useOriginal = true;
        geometry = fromExtent([minX, minY, maxX, maxY]);
      }

      this.updateGeometry(geometry);
    }
  }

  /**
   * Update the draw geometry.
   * @param {Polygon} geometry The geometry.
   */
  updateGeometry(geometry) {
    if (geometry) {
      this.box2D.updateGeometry(geometry);
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    super.cleanup();
    this.endCoord = null;

    if (this.box2D) {
      this.box2D.setMap(null);
    }
  }

  /**
   * @inheritDoc
   */
  getResultString() {
    if (this.startCoord && this.endCoord) {
      return 'Start corner: ' + this.startCoord.toString() + '. End corner: ' + this.endCoord.toString();
    }

    return 'Unknown coordinates.';
  }
}

/**
 * @type {string}
 */
DragBox.TYPE = 'box';
