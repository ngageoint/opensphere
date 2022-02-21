goog.declareModuleId('plugin.file.kml.tour.TourControl');

import AbstractTourPrimitive from './abstracttourprimitive.js';

const Promise = goog.require('goog.Promise');
const nextTick = goog.require('goog.async.nextTick');

/**
 * Enables the tour to be paused until a user takes action to continue the tour.
 */
export default class TourControl extends AbstractTourPrimitive {
  /**
   * Constructor.
   * @param {!Tour} tour The tour object.
   */
  constructor(tour) {
    super();

    /**
     * The tour object.
     * @type {!Tour}
     * @private
     */
    this.tour_ = tour;

    /**
     * If the tour has been paused by this control.
     * @type {boolean}
     * @private
     */
    this.paused_ = false;
  }

  /**
   * @inheritDoc
   */
  execute() {
    return new Promise((resolve, reject) => {
      // let the tour pick up the promise before pausing
      nextTick(() => {
        // pause the tour once, until reset
        if (!this.paused_) {
          this.paused_ = true;
          this.tour_.pause();
        }

        resolve();
      });
    });
  }

  /**
   * @inheritDoc
   */
  reset() {
    this.paused_ = false;
  }
}
