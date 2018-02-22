goog.provide('plugin.file.kml.tour.TourControl');

goog.require('goog.Promise');
goog.require('goog.async.nextTick');
goog.require('plugin.file.kml.tour.AbstractTourPrimitive');


/**
 * Enables the tour to be paused until a user takes action to continue the tour.
 * @param {!plugin.file.kml.tour.Tour} tour The tour object.
 * @extends {plugin.file.kml.tour.AbstractTourPrimitive}
 * @constructor
 */
plugin.file.kml.tour.TourControl = function(tour) {
  plugin.file.kml.tour.TourControl.base(this, 'constructor');

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
};
goog.inherits(plugin.file.kml.tour.TourControl, plugin.file.kml.tour.AbstractTourPrimitive);


/**
 * @inheritDoc
 */
plugin.file.kml.tour.TourControl.prototype.execute = function() {
  return new goog.Promise(function(resolve, reject) {
    // let the tour pick up the promise before pausing
    goog.async.nextTick(function() {
      // pause the tour once, until reset
      if (!this.paused_) {
        this.paused_ = true;
        this.tour_.pause();
      }

      resolve();
    }, this);
  }, this);
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.TourControl.prototype.reset = function() {
  this.paused_ = false;
};
