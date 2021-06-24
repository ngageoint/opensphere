goog.module('os.events.LayerConfigEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');


/**
 */
class LayerConfigEvent extends GoogEvent {
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

exports = LayerConfigEvent;
