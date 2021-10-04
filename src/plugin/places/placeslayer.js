goog.declareModuleId('plugin.places.PlacesLayer');

import * as fn from '../../os/fn/fn.js';
import KMLLayer from '../file/kml/kmllayer.js';

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
