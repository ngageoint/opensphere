goog.module('os.map.instance');
goog.module.declareLegacyNamespace();

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
 * @return {IMapContainer}
 */
const getIMapContainer = () => {
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
 * @return {MapContainer}
 */
const getMapContainer = () => {
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
