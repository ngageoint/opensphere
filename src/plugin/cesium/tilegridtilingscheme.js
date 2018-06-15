goog.provide('plugin.cesium.TileGridTilingScheme');

goog.require('goog.asserts');
goog.require('ol.proj');
goog.require('os.geo');
goog.require('os.map');
goog.require('os.proj');


/**
 * @param {!ol.source.TileImage} source
 * @extends {Cesium.TilingScheme}
 * @constructor
 */
plugin.cesium.TileGridTilingScheme = function(source) {
  throw new Error('TileGridTilingScheme created before initialization!');
};


/**
 * Initialize the class. This must be done asynchronously after Cesium has been loaded
 */
plugin.cesium.TileGridTilingScheme.init = function() {
  /**
   * @param {!ol.source.TileImage} source
   * @extends {Cesium.TilingScheme}
   * @constructor
   */
  plugin.cesium.TileGridTilingScheme = function(source) {
    var tg = source.getTileGrid();
    goog.asserts.assert(tg);

    /**
     * @type {!ol.tilegrid.TileGrid}
     * @private
     */
    this.tilegrid_ = tg;

    var proj = source.getProjection() || os.map.PROJECTION;
    goog.asserts.assert(proj);
    var isGeographic = ol.proj.equivalent(proj, ol.proj.get(os.proj.EPSG4326));
    var isWebMercator = ol.proj.equivalent(proj, ol.proj.get(os.proj.EPSG3857));

    if (!isGeographic && !isWebMercator && !ol.ENABLE_RASTER_REPROJECTION) {
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
     * @type {!ol.proj.Projection}
     * @private
     */
    this.projection_ = /** @type {!ol.proj.Projection} */ (proj);

    var extent = ol.proj.transformExtent(this.tilegrid_.getExtent(), this.projection_, os.proj.EPSG4326);
    extent = extent.map(function(deg) {
      return deg * os.geo.D2R;
    });

    /**
     * @type {!Cesium.Rectangle}
     * @private
     */
    this.rectangle_ = new Cesium.Rectangle(extent[0], extent[1], extent[2], extent[3]);
  };
  goog.inherits(plugin.cesium.TileGridTilingScheme, Cesium.TilingScheme);

  // after creating the class, ensure this function can still be called without consequence.
  plugin.cesium.TileGridTilingScheme.init = goog.nullFunction;


  Object.defineProperties(plugin.cesium.TileGridTilingScheme.prototype, {
    'ellipsoid': {
      get:
        /**
         * @return {!Cesium.Ellipsoid}
         * @this plugin.cesium.TileGridTilingScheme
         */
        function() {
          return this.ellipsoid_;
        }
    },

    'rectangle': {
      get:
        /**
         * @return {!Cesium.Rectangle} rectangle in radians covered by the tiling scheme
         * @this plugin.cesium.TileGridTilingScheme
         */
        function() {
          return this.rectangle_;
        }
    },

    'projection': {
      get:
        /**
         * @return {!(Cesium.GeographicProjection|Cesium.WebMercatorProjection)}
         * @this plugin.cesium.TileGridTilingScheme
         */
        function() {
          return this.cesiumProjection_;
        }
    }
  });


  /**
   * @inheritDoc
   */
  plugin.cesium.TileGridTilingScheme.prototype.getNumberOfXTilesAtLevel = function(level) {
    var tileRange = this.tilegrid_.getFullTileRange(level);
    if (tileRange) {
      return tileRange.maxX - tileRange.minX + 1;
    }

    return 0;
  };


  /**
   * @inheritDoc
   */
  plugin.cesium.TileGridTilingScheme.prototype.getNumberOfYTilesAtLevel = function(level) {
    var tileRange = this.tilegrid_.getFullTileRange(level);
    if (tileRange) {
      return tileRange.maxY - tileRange.minY + 1;
    }

    return 0;
  };


  /**
   * @inheritDoc
   */
  plugin.cesium.TileGridTilingScheme.prototype.rectangleToNativeRectangle = function(rectangle, opt_result) {
    goog.asserts.assert(rectangle);

    var extent = [
      rectangle.west * os.geo.R2D,
      rectangle.south * os.geo.R2D,
      rectangle.east * os.geo.R2D,
      rectangle.north * os.geo.R2D];

    extent = ol.proj.transformExtent(extent, os.proj.EPSG4326, this.projection_);

    var result = opt_result || new Cesium.Rectangle();
    result.west = extent[0];
    result.south = extent[1];
    result.east = extent[2];
    result.north = extent[3];

    return result;
  };

  /**
   * @inheritDoc
   */
  plugin.cesium.TileGridTilingScheme.prototype.tileXYToNativeRectangle = function(x, y, level, opt_result) {
    var rectangle = this.tileXYToRectangle(x, y, level, opt_result);
    return this.rectangleToNativeRectangle(rectangle, opt_result);
  };


  /**
   * @inheritDoc
   */
  plugin.cesium.TileGridTilingScheme.prototype.tileXYToRectangle = function(x, y, level, opt_result) {
    var extent = this.tilegrid_.getTileCoordExtent([level, x, -y - 1]);
    extent = ol.proj.transformExtent(extent, this.projection_, os.proj.EPSG4326);

    var result = opt_result || new Cesium.Rectangle();
    result.west = extent[0] * os.geo.D2R;
    result.south = extent[1] * os.geo.D2R;
    result.east = extent[2] * os.geo.D2R;
    result.north = extent[3] * os.geo.D2R;

    return result;
  };

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  plugin.cesium.TileGridTilingScheme.prototype.positionToTileXY = function(position, level, opt_result) {
    if (!this.contains(position)) {
      // outside bounds of tiling scheme
      return undefined;
    }

    var coord = ol.proj.fromLonLat([position.longitude * os.geo.R2D, position.latitude * os.geo.R2D], this.projection_);

    var origin = this.tilegrid_.getOrigin(level);
    var resolution = this.tilegrid_.getResolution(level);
    var tileSize = ol.size.toSize(this.tilegrid_.getTileSize(level), this.tilegrid_.tmpSize_);

    var x = ((coord[0] - origin[0]) / resolution) / tileSize[0];
    var y = ((origin[1] - coord[1]) / resolution) / tileSize[1];

    var result = opt_result || new Cesium.Cartesian2();
    result.x = Math.floor(x);
    result.y = Math.floor(y);

    return result;
  };

  /**
   * @param {Cesium.Cartographic} position The lon/lat in radians
   * @return {boolean} Whether or not the position is within the tiling scheme
   */
  plugin.cesium.TileGridTilingScheme.prototype.contains = function(position) {
    var epsilon = 1E-12;
    var rectangle = this.rectangle_;

    return !(position.latitude - rectangle.north > epsilon ||
        position.latitude - rectangle.south < -epsilon ||
        position.longitude - rectangle.west < -epsilon ||
        position.longitude - rectangle.east > epsilon);
  };
};
