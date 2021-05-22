goog.module('plugin.file.kml.tour.TourControl');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const nextTick = goog.require('goog.async.nextTick');
const AbstractTourPrimitive = goog.require('plugin.file.kml.tour.AbstractTourPrimitive');


/**
 * Enables the tour to be paused until a user takes action to continue the tour.
 */
class TourControl extends AbstractTourPrimitive {
  /**
   * Constructor.
   * @param {!plugin.file.kml.tour.Tour} tour The tour object.
   */
  constructor(tour) {
    super();

    /**
     * The tour object.
     * @type {!plugin.file.kml.tour.Tour}
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

exports = TourControl;
