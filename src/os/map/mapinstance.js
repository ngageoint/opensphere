goog.module('os.map.instance');

const {assert} = goog.require('goog.asserts');

const MapContainer = goog.requireType('os.MapContainer');
const IMapContainer = goog.requireType('os.map.IMapContainer');


/**
 * The global IMapContainer instance.
 * @type {IMapContainer}
 */
let iMapContainer = null;

/**
 * Get the global IMapContainer instance. This provides a limited map interface without requiring a specific
 * implementation.
 * @return {!IMapContainer}
 */
const getIMapContainer = () => {
  assert(iMapContainer != null, 'IMapContainer instance is not defined! Use setIMapContainer to set the instance.');
  return iMapContainer;
};

/**
 * Set the global IMapContainer instance.
 * @param {IMapContainer} value The instance.
 */
const setIMapContainer = (value) => {
  iMapContainer = value;
};

/**
 * The global MapContainer instance.
 * @type {MapContainer}
 */
let mapContainer = null;

/**
 * Get the global MapContainer instance.
 * @return {!MapContainer}
 */
const getMapContainer = () => {
  assert(mapContainer != null, 'MapContainer instance is not defined! Use setMapContainer to set the instance.');
  return mapContainer;
};

/**
 * Set the global MapContainer instance.
 * @param {MapContainer} value The instance.
 */
const setMapContainer = (value) => {
  mapContainer = value;
};

exports = {
  getIMapContainer,
  setIMapContainer,
  getMapContainer,
  setMapContainer
};
