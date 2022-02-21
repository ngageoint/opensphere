goog.declareModuleId('plugin.file.kml.tour.AbstractTourPrimitive');

import * as fn from '../../../../os/fn/fn.js';


/**
 * Abstract KML tour primitive.
 *
 * @abstract
 */
export default class AbstractTourPrimitive {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * If the tour primitive executes asynchronously.
     * @type {boolean}
     */
    this.isAsync = false;
  }

  /**
   * Execute the tour instruction.
   *
   * @abstract
   * @return {!goog.Promise} A promise that resolves when execution completes.
   */
  execute() {}
}


/**
 * Pause tour instruction execution.
 */
AbstractTourPrimitive.prototype.pause = fn.noop;


/**
 * Reset the tour primitive.
 */
AbstractTourPrimitive.prototype.reset = fn.noop;
