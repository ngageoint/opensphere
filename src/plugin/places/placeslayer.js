goog.declareModuleId('plugin.places.PlacesLayer');

import KMLLayer from '../file/kml/kmllayer.js';

const fn = goog.require('os.fn');

/**
 * KML Layer for organizing Places.
 */
export default class PlacesLayer extends KMLLayer {
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
