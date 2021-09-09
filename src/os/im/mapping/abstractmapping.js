goog.module('os.im.mapping.AbstractMapping');

const IXmlPersistable = goog.require('os.IXmlPersistable'); // eslint-disable-line
const osMapping = goog.require('os.im.mapping');
const IMapping = goog.require('os.im.mapping.IMapping'); // eslint-disable-line
const {appendElement, createElement} = goog.require('os.xml');


/**
 * @abstract
 * @implements {IMapping<T, S>}
 * @implements {IXmlPersistable}
 * @template T,S
 */
class AbstractMapping {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {string|undefined}
     * @protected
     */
    this.id = undefined;

    /**
     * The type attribute value for the root XML node.
     * @type {!string}
     */
    this.xmlType = 'AbstractMapping';

    /**
     * @inheritDoc
     */
    this.field = undefined;

    /**
     * @inheritDoc
     */
    this.ui = undefined;

    /**
     * @inheritDoc
     */
    this.warnings = undefined;
  }

  /**
   * @inheritDoc
   */
  autoDetect(items) {
    return null;
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.id;
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return null;
  }

  /**
   * @inheritDoc
   */
  getScore() {
    return 0;
  }

  /**
   * @inheritDoc
   */
  getScoreType() {
    return osMapping.DEFAULT_SCORETYPE;
  }

  /**
   * @inheritDoc
   */
  getFieldsChanged() {
    return [this.field];
  }

  /**
   * @inheritDoc
   */
  execute(item, opt_targetItem) {
    // Do nothing by default.
  }

  /**
   * @inheritDoc
   */
  testField(value) {
    return value != null;
  }

  /**
   * @inheritDoc
   */
  clone() {
    // HACK: The compiler doesn't like using "new" on abstract classes, so cast it as the interface.
    var other = new /** @type {function(new:IMapping)} */ (this.constructor)();
    other.field = this.field;
    return other;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = opt_to || {};

    opt_to['id'] = this.getId();
    opt_to['field'] = this.field;

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    this.field = config['field'];
  }

  /**
   * @inheritDoc
   */
  toXml() {
    var mapping = createElement('mapping', undefined, undefined, {
      'type': this.xmlType
    });

    appendElement('field', mapping, osMapping.localFieldToXmlField(this.field));

    return mapping;
  }

  /**
   * @inheritDoc
   */
  fromXml(xml) {
    this.xmlType = xml.getAttribute('type');
    this.field = osMapping.xmlFieldToLocalField(this.getXmlValue(xml, 'field'));
  }

  /**
   * Convert a string to a boolean
   *
   * @param {string} input  An input string
   * @return {boolean} true if the string is 'true', false otherwise.
   */
  toBoolean(input) {
    if ('true' === input) {
      return true;
    }
    return false;
  }

  /**
   * Safely extract from an xml Element the first value of the first tag
   *
   * @param {!Element} xml The xml element
   * @param {string}  tagName The tag to look for.
   * @return {?string} The value if available. Null otherwise.
   */
  getXmlValue(xml, tagName) {
    var list = xml.getElementsByTagName(tagName);
    if (list && list[0]) {
      return list[0].innerHTML;
    }
    return null;
  }
}

exports = AbstractMapping;
