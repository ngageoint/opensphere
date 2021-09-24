goog.module('plugin.places.PlacesLayerConfig');

const {default: KMLLayerConfig} = goog.require('plugin.file.kml.KMLLayerConfig');
const PlacesLayer = goog.require('plugin.places.PlacesLayer');
const PlacesSource = goog.require('plugin.places.PlacesSource');


/**
 * Creates a KML layer for organizing Places.
 */
class PlacesLayerConfig extends KMLLayerConfig {
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


exports = PlacesLayerConfig;
