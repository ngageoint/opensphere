goog.declareModuleId('os.events.LayerConfigEvent');

const GoogEvent = goog.require('goog.events.Event');


/**
 */
export default class LayerConfigEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {Object<string, *>} options
   */
  constructor(type, options) {
    super(type);

    /**
     * @type {Object<string, *>|Array<Object<string, *>>}
     */
    this.options = options;
  }
}
