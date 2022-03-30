goog.declareModuleId('os.ui.ol.interaction.DragCircle');

import {toLonLat} from 'ol/src/proj.js';

import RecordField from '../../../data/recordfield.js';
import {normalizeGeometryCoordinates} from '../../../geo/geo2.js';
import {METHOD_FIELD, getMethod} from '../../../interpolate.js';
import Units from '../../../math/units.js';
import Circle from '../../../olm/render/circle.js';
import AltitudeMode from '../../../webgl/altitudemode.js';
import AbstractDrag from './abstractdraginteraction.js';

/**
 * Draws a circular query area on the map.
 * This interaction is only supported for mouse devices.
 */
export default class DragCircle extends AbstractDrag {
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
