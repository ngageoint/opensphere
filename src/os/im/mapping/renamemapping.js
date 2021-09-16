goog.module('os.im.mapping.RenameMapping');

const {getItemField, setItemField} = goog.require('os.im.mapping');
const AbstractMapping = goog.require('os.im.mapping.AbstractMapping');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const {appendElement} = goog.require('os.xml');


/**
 * Used to rename a field.
 *
 * @extends {AbstractMapping<T>}
 * @template T
 */
class RenameMapping extends AbstractMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The new name for the field.
     * @type {string|undefined}
     */
    this.toField = undefined;

    /**
     * Whether or not to keep the original field.
     * @type {boolean}
     */
    this.keepOriginal = false;
  }

  /**
   * @inheritDoc
   */
  getId() {
    return RenameMapping.ID;
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return 'Rename ' + this.field + ' to ' + this.toField;
  }

  /**
   * @inheritDoc
   */
  getFieldsChanged() {
    var fields = [];
    if (this.field && this.toField) {
      if (!this.keepOriginal) {
        fields.push(this.field);
      }
      fields.push(this.toField);
    }

    return fields;
  }

  /**
   * @inheritDoc
   */
  execute(item) {
    if (this.field && this.toField && this.toField != this.field) {
      var current = getItemField(item, this.field);
      if (current != null) {
        setItemField(item, this.toField, current);

        if (!this.keepOriginal) {
          setItemField(item, this.field, undefined);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  clone() {
    var other = /** @type {RenameMapping} */ (super.clone());
    other.toField = this.toField;
    other.keepOriginal = this.keepOriginal;
    return other;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to);
    opt_to['toField'] = this.toField;
    opt_to['keepOriginal'] = this.keepOriginal;

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);
    this.toField = config['toField'];
    this.keepOriginal = config['keepOriginal'];
  }

  /**
   * @inheritDoc
   */
  toXml() {
    var xml = super.toXml();
    appendElement('toField', xml, this.toField);
    appendElement('keepOriginal', xml, this.keepOriginal || false);

    return xml;
  }

  /**
   * @inheritDoc
   */
  fromXml(xml) {
    super.fromXml(xml);

    var val = this.getXmlValue(xml, 'toField');
    if (null != val) {
      this.toField = val;
    } else {
      this.toField = undefined;
    }

    val = this.getXmlValue(xml, 'keepOriginal');
    if (null != val) {
      this.keepOriginal = this.toBoolean(val);
    } else {
      this.keepOriginal = false;
    }
  }
}

/**
 * @type {string}
 */
RenameMapping.ID = 'Rename';

// Register the mapping.
MappingRegistry.getInstance().registerMapping(RenameMapping.ID, RenameMapping);

exports = RenameMapping;
