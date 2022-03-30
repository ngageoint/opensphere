goog.declareModuleId('plugin.cesium.TileGridTilingScheme');

import {equivalent, get, transformExtent, fromLonLat} from 'ol/src/proj.js';
import {ENABLE_RASTER_REPROJECTION} from 'ol/src/reproj/common.js';
import {toSize} from 'ol/src/size.js';
import * as geo from '../../os/geo/geo.js';
import {PROJECTION} from '../../os/map/map.js';

import * as osProj from '../../os/proj/proj.js';

const asserts = goog.require('goog.asserts');

/**
 * @implements {Cesium.TilingScheme}
 */
export default class TileGridTilingScheme {
  /**
   * Constructor.
   * @param {!TileImageSource} source The source.
   * @param {TileGrid=} opt_tileGrid The tile grid. If not provided, the source's tile grid will be used.
   */
  constructor(source, opt_tileGrid) {
    var tg = opt_tileGrid || source.getTileGrid();
    asserts.assert(tg);

    /**
     * @type {!TileGrid}
     * @private
     */
    this.tilegrid_ = tg;

    var proj = source.getProjection() || PROJECTION;
    asserts.assert(proj);
    var isGeographic = equivalent(proj, get(osProj.EPSG4326));
    var isWebMercator = equivalent(proj, get(osProj.EPSG3857));

    if (!isGeographic && !isWebMercator && !ENABLE_RASTER_REPROJECTION) {
      throw new Error('Cesium only supports EPSG:4326 and EPSG:3857 projections');
    }

    /**
     * @type {!Cesium.Ellipsoid}
     * @private
     */
    this.ellipsoid_ = Cesium.Ellipsoid.WGS84;

    /**
     * @type {!(Cesium.GeographicProjection|Cesium.WebMercatorProjection)}
     */
    this.cesiumProjection_ = isGeographic ? new Cesium.GeographicProjection(this.ellipsoid_) :
      new Cesium.WebMercatorProjection(this.ellipsoid_);

    /**
     * @type {!olProj.Projection}
     * @private
     */
    this.projection_ = /** @type {!olProj.Projection} */ (proj);

    var extent = transformExtent(this.tilegrid_.getExtent(), this.projection_, osProj.EPSG4326);
    extent = extent.map(function(deg) {
      return deg * geo.D2R;
    });

    /**
     * @type {!Cesium.Rectangle}
     * @private
     */
    this.rectangle_ = new Cesium.Rectangle(extent[0], extent[1], extent[2], extent[3]);
  }

  /**
   * @inheritDoc
   */
  get ellipsoid() {
    return this.ellipsoid_;
  }

  /**
   * @inheritDoc
   */
  get rectangle() {
    return this.rectangle_;
  }

  /**
   * @inheritDoc
   */
  get projection() {
    return this.cesiumProjection_;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} To allow access to tilegrid private properties.
   */
  getNumberOfXTilesAtLevel(level) {
    var tileRange = this.tilegrid_.getFullTileRange(level);
    if (tileRange) {
      return tileRange.maxX - tileRange.minX + 1;
    }

    // Cesium assumes that all levels (0 to maxZoom) exist and uses this function to compute the current
    // zoom level by texel spacing. Therefore, return something other than 0 by extrapolating from the
    // levels which are defined (if a zoom factor was detected).
    var zoomFactor = this.tilegrid_.zoomFactor_;
    if (zoomFactor !== undefined) {
      var minZoom = this.tilegrid_.getMinZoom();
      tileRange = this.tilegrid_.getFullTileRange(minZoom);
      var numXTiles = tileRange.maxX - tileRange.minX + 1;
      return Math.pow(zoomFactor, Math.log(numXTiles) / Math.log(zoomFactor) - minZoom + level);
    }

    return 0;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} To allow access to tilegrid private properties.
   */
  getNumberOfYTilesAtLevel(level) {
    var tileRange = this.tilegrid_.getFullTileRange(level);
    if (tileRange) {
      return tileRange.maxY - tileRange.minY + 1;
    }

    // Cesium assumes that all levels exist, so attempt to extrapolate this value if a
    // zoomFactor exists
    var zoomFactor = this.tilegrid_.zoomFactor_;
    if (zoomFactor !== undefined) {
      var minZoom = this.tilegrid_.getMinZoom();
      tileRange = this.tilegrid_.getFullTileRange(minZoom);
      var numYTiles = tileRange.maxY - tileRange.minY + 1;
      return Math.pow(zoomFactor, Math.log(numYTiles) / Math.log(zoomFactor) - minZoom + level);
    }

    return 0;
  }

  /**
   * @inheritDoc
   */
  rectangleToNativeRectangle(rectangle, opt_result) {
    asserts.assert(rectangle);

    var extent = [
      rectangle.west * geo.R2D,
      rectangle.south * geo.R2D,
      rectangle.east * geo.R2D,
      rectangle.north * geo.R2D];

    extent = transformExtent(extent, osProj.EPSG4326, this.projection_);

    var result = opt_result || new Cesium.Rectangle();
    result.west = extent[0];
    result.south = extent[1];
    result.east = extent[2];
    result.north = extent[3];

    return result;
  }

  /**
   * @inheritDoc
   */
  tileXYToNativeRectangle(x, y, level, opt_result) {
    var rectangle = this.tileXYToRectangle(x, y, level, opt_result);
    return this.rectangleToNativeRectangle(rectangle, opt_result);
  }

  /**
   * @inheritDoc
   */
  tileXYToRectangle(x, y, level, opt_result) {
    var extent = this.tilegrid_.getTileCoordExtent([level, x, y]);
    extent = transformExtent(extent, this.projection_, osProj.EPSG4326);

    var result = opt_result || new Cesium.Rectangle();
    result.west = extent[0] * geo.D2R;
    result.south = extent[1] * geo.D2R;
    result.east = extent[2] * geo.D2R;
    result.north = extent[3] * geo.D2R;

    return result;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} To allow access to tilegrid private properties.
   */
  positionToTileXY(position, level, opt_result) {
    if (!this.contains(position)) {
      // outside bounds of tiling scheme
      return undefined;
    }

    var coord = fromLonLat([position.longitude * geo.R2D, position.latitude * geo.R2D], this.projection_);

    var origin = this.tilegrid_.getOrigin(level);
    var resolution = this.tilegrid_.getResolution(level);
    var tileSize = toSize(this.tilegrid_.getTileSize(level), this.tilegrid_.tmpSize_);

    var x = ((coord[0] - origin[0]) / resolution) / tileSize[0];
    var y = ((origin[1] - coord[1]) / resolution) / tileSize[1];

    var result = opt_result || new Cesium.Cartesian2();
    result.x = Math.floor(x);
    result.y = Math.floor(y);

    return result;
  }

  /**
   * @param {Cesium.Cartographic} position The lon/lat in radians
   * @return {boolean} Whether or not the position is within the tiling scheme
   */
  contains(position) {
    var epsilon = 1E-12;
    var rectangle = this.rectangle_;

    return !(position.latitude - rectangle.north > epsilon ||
        position.latitude - rectangle.south < -epsilon ||
        position.longitude - rectangle.west < -epsilon ||
        position.longitude - rectangle.east > epsilon);
  }
}
