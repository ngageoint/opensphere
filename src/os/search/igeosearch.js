goog.module('os.search.IGeoSearch');
goog.module.declareLegacyNamespace();


/**
 * Interface for a search provider that supports filtering by GeoJSON shape.
 *
 * @interface
 */
class IGeoSearch {
  /**
   * Set the extent to apply to the query. The extent should be in the format `[minx, miny, maxx, maxy]`.
   * @param {Array<number>|undefined} center The center point, as `[lon, lat]`.
   * @param {number|undefined} distance The distance in meters.
   */
  setGeoDistance(center, distance) {}

  /**
   * Set the extent to apply to the query. The extent should be in the format `[minx, miny, maxx, maxy]`.
   * @param {Array<number>|undefined} extent The extent to apply to the query.
   * @param {Array<number>=} opt_center The center point to use for scoring.
   * @param {number=} opt_distance The distance in meters to use for scoring.
   */
  setGeoExtent(extent, opt_center, opt_distance) {}

  /**
   * Set the GeoJSON shape to apply to the query.
   * @param {Object|undefined} shape The GeoJSON shape to apply to the query.
   * @param {Array<number>=} opt_center The center point to use for scoring.
   * @param {number=} opt_distance The distance in meters to use for scoring.
   */
  setGeoShape(shape, opt_center, opt_distance) {}

  /**
   * If the search provider supports filtering searches by center/distance.
   * @return {boolean}
   */
  supportsGeoDistance() {}

  /**
   * If the search provider supports filtering searches by extent.
   * @return {boolean}
   */
  supportsGeoExtent() {}

  /**
   * If the search provider supports filtering searches by GeoJSON geometry.
   * @return {boolean}
   */
  supportsGeoShape() {}
}

/**
 * See os.implements
 * @type {string}
 * @const
 */
IGeoSearch.ID = 'os.search.IGeoSearch';

exports = IGeoSearch;
