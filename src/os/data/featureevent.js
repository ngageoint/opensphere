goog.declareModuleId('os.data.FeatureEvent');

const GoogEvent = goog.require('goog.events.Event');


/**
 * Change event for features that won't be handled by OL3.
 *
 * These should *always* be dispatched using ol.Feature#dispatchFeatureEvent (a mixin) to ensure the events are created
 * in the same application context as the feature. This ensures 'instanceof GoogEvent' returns true and Closure
 * won't create a new event and extend it off this one (which is expensive).
 */
export default class FeatureEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type The event type to fire
   * @param {number} id The feature id
   * @param {*} newVal The new value
   * @param {*} oldVal The old value
   */
  constructor(type, id, newVal, oldVal) {
    super(type);

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
  }
}
