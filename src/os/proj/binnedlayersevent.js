goog.declareModuleId('os.proj.switch.BinnedLayersEvent');

const GoogEvent = goog.require('goog.events.Event');
const GoogEventType = goog.require('goog.events.EventType');

const {default: BinnedLayersType} = goog.requireType('os.proj.switch.BinnedLayersType');


/**
 */
export default class BinnedLayersEvent extends GoogEvent {
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
