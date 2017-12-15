goog.provide('os.im.mapping.RenameMapping');

goog.require('os.im.mapping');
goog.require('os.im.mapping.AbstractMapping');
goog.require('os.im.mapping.MappingRegistry');



/**
 * Used to rename a field.
 * @extends {os.im.mapping.AbstractMapping.<T>}
 * @constructor
 * @template T
 */
os.im.mapping.RenameMapping = function() {
  os.im.mapping.RenameMapping.base(this, 'constructor');

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
};
goog.inherits(os.im.mapping.RenameMapping, os.im.mapping.AbstractMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.RenameMapping.ID = 'Rename';

// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.RenameMapping.ID, os.im.mapping.RenameMapping);


/**
 * @inheritDoc
 */
os.im.mapping.RenameMapping.prototype.getId = function() {
  return os.im.mapping.RenameMapping.ID;
};


/**
 * @inheritDoc
 */
os.im.mapping.RenameMapping.prototype.getLabel = function() {
  return 'Rename ' + this.field + ' to ' + this.toField;
};


/**
 * @inheritDoc
 */
os.im.mapping.RenameMapping.prototype.getFieldsChanged = function() {
  var fields = [];
  if (this.field && this.toField) {
    if (!this.keepOriginal) {
      fields.push(this.field);
    }
    fields.push(this.toField);
  }

  return fields;
};


/**
 * @inheritDoc
 */
os.im.mapping.RenameMapping.prototype.execute = function(item) {
  if (this.field && this.toField && this.toField != this.field) {
    var current = os.im.mapping.getItemField(item, this.field);
    if (current) {
      os.im.mapping.setItemField(item, this.toField, current);

      if (!this.keepOriginal) {
        os.im.mapping.setItemField(item, this.field, undefined);
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.RenameMapping.prototype.clone = function() {
  var other = os.im.mapping.RenameMapping.base(this, 'clone');
  other.toField = this.toField;
  other.keepOriginal = this.keepOriginal;
  return other;
};


/**
 * @inheritDoc
 */
os.im.mapping.RenameMapping.prototype.persist = function(opt_to) {
  opt_to = os.im.mapping.RenameMapping.base(this, 'persist', opt_to);
  opt_to['toField'] = this.toField;
  opt_to['keepOriginal'] = this.keepOriginal;

  return opt_to;
};


/**
 * @inheritDoc
 */
os.im.mapping.RenameMapping.prototype.restore = function(config) {
  os.im.mapping.RenameMapping.base(this, 'restore', config);
  this.toField = config['toField'];
  this.keepOriginal = config['keepOriginal'];
};


/**
 * @inheritDoc
 */
os.im.mapping.RenameMapping.prototype.toXml = function() {
  var xml = os.im.mapping.RenameMapping.base(this, 'toXml');
  os.xml.appendElement('toField', xml, this.toField);
  os.xml.appendElement('keepOriginal', xml, this.keepOriginal || false);

  return xml;
};


/**
 * @inheritDoc
 */
os.im.mapping.RenameMapping.prototype.fromXml = function(xml) {
  os.im.mapping.RenameMapping.base(this, 'fromXml', xml);

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
};
