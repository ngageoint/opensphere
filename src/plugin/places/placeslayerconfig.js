goog.declareModuleId('plugin.places.PlacesLayerConfig');

import KMLLayerConfig from '../file/kml/kmllayerconfig.js';
import PlacesLayer from './placeslayer.js';
import PlacesSource from './placessource.js';

/**
 * Creates a KML layer for organizing Places.
 */
export default class PlacesLayerConfig extends KMLLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getLayer(source) {
    return new PlacesLayer({
      source: source
    });
  }

  /**
   * @inheritDoc
   */
  getSource(options) {
    return new PlacesSource(undefined);
  }
}


/**
 * Places layer config ID.
 * @type {string}
 * @const
 */
PlacesLayerConfig.ID = 'places';
