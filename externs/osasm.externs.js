var osasm = {};


/**
 * Solves the direct geodesic problem
 *
 * @param {Array<number>} coord The coordinate as [lon, lat] in degrees
 * @param {number} bearing The bearing in degrees clock-wise from north
 * @param {number} distance The distance in meters
 * @return {Array<number>} The resulting coordinate in [lon, lat]
 */
osasm.geodesicDirect = function(coord, bearing, distance) {};


/**
 * Solves the inverse geodesic problem
 *
 * @param {Array<number>} coord1 The first coordinate as [lon, lat] in degrees
 * @param {Array<number>} coord2 The second coordinate as [lon, lat] in degrees
 * @return {{distance: number, initialBearing: number, finalBearing: number}}
 *  An object with the distance in meters and initial/final bearings in degrees
 *  clock-wise from north
 */
osasm.geodesicInverse = function(coord1, coord2) {};


/**
 * Fills the given pointer with desired number of coordinates interpolated between the
 * given coordinates.
 *
 * @example
 *    var ptr = osasm._malloc(2 * num * Float64Array.BYTES_PER_ELEMENT);
 *    osasm.geodesicInterpolate(lonlat1, lonlat2, ptr, num);
 *    var flatCoords = new Float64Array(osasm.HEAPU8.buffer, ptr, 2 * numPoints);
 *    ...
 *    osasm._free(ptr);
 *
 * @param {Array<number>} lonlat1 The first coordinate as [lon, lat] in degrees
 * @param {Array<number>} lonlat2 The second coordinate as [lon, lat] in degrees
 * @param {number} pointer The pointer to the array in memory @see @link osasm._malloc
 * @param {number} numPoints The number of total points the segment should have
 */
osasm.geodesicInterpolate = function(lonlat1, lonlat2, pointer, numPoints) {};


/**
 * Solves the direct rhumb problem
 *
 * @param {Array<number>} coord The coordinate as [lon, lat]
 * @param {number} bearing The bearing in degrees clock-wise from north
 * @param {number} distance The distance in meters
 * @return {Array<number>} The resulting coordinate in [lon, lat]
 */
osasm.rhumbDirect = function(coord, bearing, distance) {};


/**
 * Solves the inverse rhumb problem
 *
 * @param {Array<number>} coord1 The first coordinate as [lon, lat] in degrees
 * @param {Array<number>} coord2 The second coordinate as [lon, lat] in degrees
 * @return {{distance: number, bearing: number}} An object with the distance
 *  in meters and the bearing in degrees clock-wise from north.
 */
osasm.rhumbInverse = function(coord1, coord2) {};


/**
 * Fills the given pointer with desired number of coordinates interpolated between the
 * given coordinates.
 *
 * @example
 *    var ptr = osasm._malloc(2 * num * Float64Array.BYTES_PER_ELEMENT);
 *    osasm.rhumbInterpolate(lonlat1, lonlat2, ptr, num);
 *    var flatCoords = new Float64Array(osasm.HEAPU8.buffer, ptr, 2 * numPoints);
 *    ...
 *    osasm._free(ptr);
 *
 * @param {Array<number>} lonlat1 The first coordinate as [lon, lat] in degrees
 * @param {Array<number>} lonlat2 The second coordinate as [lon, lat] in degrees
 * @param {number} pointer The pointer to the array in memory @see @link osasm._malloc
 * @param {number} numPoints The number of total points the segment should have
 */
osasm.rhumbInterpolate = function(lonlat1, lonlat2, pointer, numPoints) {};


/**
 * @param {Array<number>} coord The coordinate as [lon, lat] in degrees
 * @return {string} The MGRS string representation of the coordinate
 */
osasm.toMGRS = function(coord) {};


/**
 * @param {string} mgrs The MGRS string representation of the coordinate
 * @return {Array<number>} The coordinate as [lon, lat] in degrees
 */
osasm.toLonLat = function(mgrs) {};


/**
 * @param {number} numBytes The number of bytes to allocate in memory
 * @return {number} Pointer to position in memory
 */
osasm._malloc = function(numBytes) {};


/**
 * @param {number} pointer Pointer to position in memory to free
 */
osasm._free = function(pointer) {};


/**
 * @type {ArrayBuffer}
 */
osasm.HEAPU8;
