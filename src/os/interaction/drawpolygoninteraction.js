goog.module('os.interaction.DrawPolygon');

const ViewHint = goog.require('ol.ViewHint');
const {getWidth} = goog.require('ol.extent');
const {toLonLat} = goog.require('ol.proj');
const I3DSupport = goog.require('os.I3DSupport');
const MapContainer = goog.require('os.MapContainer');
const osImplements = goog.require('os.implements');
const osMap = goog.require('os.map');
const {default: OLDrawPolygon} = goog.require('os.ui.ol.interaction.DrawPolygon');

const OSMap = goog.requireType('os.Map');


/**
 * Interaction to draw a polygon on the map.
 *
 * @implements {I3DSupport}
 */
class DrawPolygon extends OLDrawPolygon {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The polygon color.
     * @type {!ol.Color}
     * @protected
     */
    this.color = [51, 255, 255, 1];
  }

  /**
   * @inheritDoc
   */
  update2D() {
    super.update2D();
    this.updateWebGL();
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    super.cleanup();

    // restore camera controls in 3D mode
    var map = /** @type {OSMap} */ (this.getMap());
    if (map) {
      map.toggleMovement(true);
    }

    this.cleanupWebGL();
  }

  /**
   * @inheritDoc
   */
  addCoord(coord, opt_mapBrowserEvent) {
    //
    // In 3D, coordinates will always fall within the world extent. When drawing across the antimeridian, we want to
    // wrap coordinates across the AM so the direction is clear. For example, clicking +175 then -175 should convert the
    // second coord to +185.
    //
    var mapContainer = MapContainer.getInstance();
    if (mapContainer.is3DEnabled()) {
      var lastCoord = this.coords[this.coords.length - 1];
      if (coord && lastCoord) {
        var worldWidth = getWidth(osMap.PROJECTION.getExtent());
        var halfWorld = worldWidth / 2;
        var xDiff = coord[0] - lastCoord[0];
        if (xDiff > halfWorld) {
          // crossed antimeridian from right to left
          coord[0] -= worldWidth;
        } else if (xDiff < -halfWorld) {
          // crossed antimeridian from left to right
          coord[0] += worldWidth;
        }
      }
    }

    super.addCoord(coord, opt_mapBrowserEvent);
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return true;
  }

  /**
   * @inheritDoc
   */
  begin(mapBrowserEvent) {
    super.begin(mapBrowserEvent);
    var map = this.getMap();
    if (map && map.getView().getHints()[ViewHint.INTERACTING] <= 0) {
      // stop camera controls in 3D mode
      /** @type {OSMap} */ (map).toggleMovement(false);
    }
  }

  /**
   * Clean up the WebGL renderer.
   */
  cleanupWebGL() {}

  /**
   * Update the polygon in the WebGL renderer.
   */
  updateWebGL() {}

  /**
   * @param {ol.Coordinate} coord The coordinate
   * @return {ol.Coordinate} The lon/lat
   */
  static coordToLonLat(coord) {
    return toLonLat(coord, osMap.PROJECTION);
  }
}

osImplements(DrawPolygon, I3DSupport.ID);

exports = DrawPolygon;
