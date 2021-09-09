goog.module('os.proj.switch.BinnedLayersEvent');

const GoogEvent = goog.require('goog.events.Event');
const GoogEventType = goog.require('goog.events.EventType');

const BinnedLayersType = goog.requireType('os.proj.switch.BinnedLayersType');


/**
 */
class BinnedLayersEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {BinnedLayersType} layers
   */
  constructor(layers) {
    super(BinnedLayersEvent.TYPE);

    /**
     * @type {BinnedLayersType}
     */
    this.layers = layers;
  }
}

/**
 * @type {string}
 * @const
 */
BinnedLayersEvent.TYPE = GoogEventType.LOAD;

exports = BinnedLayersEvent;
