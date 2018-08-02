goog.provide('os.search.IGeoSearch');


/**
 * Interface for a search provider that supports filtering by GeoJSON shape.
 * @interface
 */
os.search.IGeoSearch = function() {};


/**
 * See os.implements
 * @type {string}
 * @const
 */
os.search.IGeoSearch.ID = 'os.search.IGeoSearch';


/**
 * Set the extent to apply to the query. The extent should be in the format `[minx, miny, maxx, maxy]`.
 * @param {Array<number>|undefined} center The center point, as `[lon, lat]`.
 * @param {number|undefined} distance The distance in meters.
 */
os.search.IGeoSearch.prototype.setGeoDistance;


/**
 * Set the extent to apply to the query. The extent should be in the format `[minx, miny, maxx, maxy]`.
 * @param {Array<number>|undefined} extent The extent to apply to the query.
 * @param {Array<number>=} opt_center The center point to use for scoring.
 * @param {number=} opt_distance The distance in meters to use for scoring.
 */
os.search.IGeoSearch.prototype.setGeoExtent;


/**
 * Set the GeoJSON shape to apply to the query.
 * @param {Object|undefined} shape The GeoJSON shape to apply to the query.
 * @param {Array<number>=} opt_center The center point to use for scoring.
 * @param {number=} opt_distance The distance in meters to use for scoring.
 */
os.search.IGeoSearch.prototype.setGeoShape;


/**
 * If the search provider supports filtering searches by center/distance.
 * @return {boolean}
 */
os.search.IGeoSearch.prototype.supportsGeoDistance;


/**
 * If the search provider supports filtering searches by extent.
 * @return {boolean}
 */
os.search.IGeoSearch.prototype.supportsGeoExtent;


/**
 * If the search provider supports filtering searches by GeoJSON geometry.
 * @return {boolean}
 */
os.search.IGeoSearch.prototype.supportsGeoShape;
