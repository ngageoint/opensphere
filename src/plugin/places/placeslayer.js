goog.module('plugin.places.PlacesLayer');
goog.module.declareLegacyNamespace();

const fn = goog.require('os.fn');
const KMLLayer = goog.require('plugin.file.kml.KMLLayer');


/**
 * KML Layer for organizing Places.
 */
class PlacesLayer extends KMLLayer {
  /**
   * Constructor.
   * @param {olx.layer.VectorOptions} options Vector layer options
   */
  constructor(options) {
    super(options);

    // TODO add specialized legend rendering for Places
    this.renderLegend = fn.noop;
  }
}

exports = PlacesLayer;
