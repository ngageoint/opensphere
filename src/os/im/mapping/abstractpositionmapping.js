goog.declareModuleId('os.im.mapping.AbstractPositionMapping');

import {appendElement} from '../../xml.js';
import AbstractMapping from './abstractmapping.js';
import {localFieldToXmlField, xmlFieldToLocalField} from './mapping.js';


/**
 * @abstract
 */
export default class AbstractPositionMapping extends AbstractMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Optional format string to override autodetect preferences
     * @type {string|undefined}
     */
    this.customFormat = undefined;
  }

  /**
   * @inheritDoc
   */
  clone() {
    var other = /** @type {AbstractPositionMapping} */ (super.clone());
    other.customFormat = this.customFormat;
    return other;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to);
    opt_to['customFormat'] = this.customFormat;
    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);
    this.customFormat = config['customFormat'];
  }

  /**
   * @inheritDoc
   */
  toXml() {
    var xml = super.toXml();
    appendElement('customFormat', xml, localFieldToXmlField(this.customFormat || null));

    return xml;
  }

  /**
   * @inheritDoc
   */
  fromXml(xml) {
    super.fromXml(xml);
    var customFormat = xmlFieldToLocalField(this.getXmlValue(xml, 'customFormat'));
    this.customFormat = /** @type {string|undefined} */ (customFormat ? customFormat : undefined);
  }

  /**
   * Tests if the mapping can be performed on the provided value
   *
   * @param {string} value The field value to test
   * @param {string=} opt_format optional parsing format string
   * @return {?string} if a value can be parsed correctly return that value, otherwise null
   */
  testAndGetField(value, opt_format) {
    return this.testField(value) ? value : null;
  }
}
