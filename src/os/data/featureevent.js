goog.provide('os.data.FeatureEvent');
goog.provide('os.data.FeatureEventType');
goog.require('goog.events.Event');


/**
 * Change events fired by ol.Feature objects that avoid OL3 listeners.
 * @enum {string}
 */
os.data.FeatureEventType = {
  COLOR: 'feature:color',
  VALUECHANGE: 'feature:valueChange'
};



/**
 * Change event for features that won't be handled by OL3.
 *
 * These should *always* be dispatched using ol.Feature#dispatchFeatureEvent (a mixin) to ensure the events are created
 * in the same application context as the feature. This ensures 'instanceof goog.events.Event' returns true and Closure
 * won't create a new event and extend it off this one (which is expensive).
 *
 * @param {string} type The event type to fire
 * @param {number} id The feature id
 * @param {*} newVal The new value
 * @param {*} oldVal The old value
 * @extends {goog.events.Event}
 * @constructor
 */
os.data.FeatureEvent = function(type, id, newVal, oldVal) {
  os.data.FeatureEvent.base(this, 'constructor', type);

  /**
   * The feature id
   * @type {number}
   */
  this.id = id;

  /**
   * The new value
   * @type {*}
   */
  this.newVal = newVal;


  /**
   * The old value
   * @type {*}
   */
  this.oldVal = oldVal;
};
goog.inherits(os.data.FeatureEvent, goog.events.Event);
