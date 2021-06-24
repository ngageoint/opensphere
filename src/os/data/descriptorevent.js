goog.module('os.data.DescriptorEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');


/**
 */
class DescriptorEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {os.data.IDataDescriptor=} opt_descriptor
   * @param {os.data.IDataDescriptor=} opt_descriptor2
   */
  constructor(type, opt_descriptor, opt_descriptor2) {
    super(type);

    /**
     * @type {?os.data.IDataDescriptor}
     */
    this.descriptor = opt_descriptor || null;

    /**
     * @type {?os.data.IDataDescriptor}
     */
    this.descriptor2 = opt_descriptor2 || null;
  }
}

exports = DescriptorEvent;
