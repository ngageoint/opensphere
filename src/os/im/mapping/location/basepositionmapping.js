goog.declareModuleId('os.im.mapping.location.BasePositionMapping');

import {appendElement} from '../../../xml.js';
import AbstractPositionMapping from '../abstractpositionmapping.js';

const {default: IMapping} = goog.requireType('os.im.mapping.IMapping');


/**
 * @extends {AbstractPositionMapping<T>}
 * @template T
 */
export default class BasePositionMapping extends AbstractPositionMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {Object<string, AbstractPositionMapping>}
     * @protected
     */
    this.types = BasePositionMapping.TYPES;

    /**
     * @type {?string}
     * @protected
     */
    this.type = 'Lat/Lon';
  }

  /**
   * @inheritDoc
   */
  getId() {
    return BasePositionMapping.ID;
  }

  /**
   * Get the chosen type for this mapping.
   *
   * @return {?string}
   */
  getType() {
    return this.type;
  }

  /**
   * Get the chosen type for this mapping.
   *
   * @param {?string} type
   */
  setType(type) {
    if (type && type in this.types) {
      this.type = type;
    } else {
      this.type = null;
    }
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
  getLabel() {
    return this.type;
  }

  /**
   * @inheritDoc
   */
  getScore() {
    if (this.type == 'MGRS') {
      return 1;
    }

    return 2;
  }

  /**
   * @inheritDoc
   */
  getScoreType() {
    return 'geom';
  }

  /**
   * @inheritDoc
   */
  execute(item) {
    if (this.type) {
      this.types[this.type].field = this.field;
      this.types[this.type].customFormat = this.customFormat;
      this.types[this.type].execute(item);
    }
  }

  /**
   * @inheritDoc
   */
  testField(value) {
    if (this.type) {
      return this.types[this.type].testField(value);
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  testAndGetField(value, opt_format) {
    if (this.type) {
      return this.types[this.type].testAndGetField(value, opt_format);
    }
    return null;
  }

  /**
   * @inheritDoc
   */
  autoDetect(items) {
    if (items) {
      var i = items.length;
      while (i--) {
        var item = items[i];

        for (var field in item) {
          if (field.match(BasePositionMapping.POS_REGEX)) {
            for (var type in this.types) {
              if (this.types[type].testField(String(item[field]))) {
                var mapping = new BasePositionMapping();
                mapping.field = field;
                mapping.setType(type);
                return mapping;
              }
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  clone() {
    var other = /** @type {BasePositionMapping} */ (super.clone());
    other.setType(this.type);
    return other;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to);
    opt_to['type'] = this.getType();

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);
    this.setType(config['type']);
  }

  /**
   * @inheritDoc
   */
  toXml() {
    var xml = super.toXml();
    appendElement('subType', xml, this.getType());

    return xml;
  }

  /**
   * @inheritDoc
   */
  fromXml(xml) {
    super.fromXml(xml);

    this.setType(this.getXmlValue(xml, 'subType'));
  }
}

/**
 * @type {RegExp}
 * @const
 */
BasePositionMapping.POS_REGEX =
    /(pos(i(t(i(o(n)?)?)?)?)?|mgrs|coord(i(n(a(t(e(s)?)?)?)?)?)?|geo(m(e(t(r(y)?)?)?)?)?|loc(a(t(i(o(n)?)?)?)?)?)/i;

/**
 * The position types this mapping supports. Should be implemented in subclasses.
 * @type {string}
 */
BasePositionMapping.ID = 'Position';

/**
 * The position types this mapping supports. Should be implemented in subclasses.
 * @type {Object<string, IMapping>}
 */
BasePositionMapping.TYPES = {};
