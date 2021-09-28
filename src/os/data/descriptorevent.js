goog.declareModuleId('os.data.DescriptorEvent');

const GoogEvent = goog.require('goog.events.Event');

const {default: IDataDescriptor} = goog.requireType('os.data.IDataDescriptor');


/**
 */
export default class DescriptorEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {IDataDescriptor=} opt_descriptor
   * @param {IDataDescriptor=} opt_descriptor2
   */
  constructor(type, opt_descriptor, opt_descriptor2) {
    super(type);

    /**
     * @type {?IDataDescriptor}
     */
    this.descriptor = opt_descriptor || null;

    /**
     * @type {?IDataDescriptor}
     */
    this.descriptor2 = opt_descriptor2 || null;
  }
}
