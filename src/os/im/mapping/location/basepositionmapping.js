goog.provide('os.im.mapping.location.BasePositionMapping');

goog.require('os.im.mapping.AbstractPositionMapping');



/**
 * @extends {os.im.mapping.AbstractPositionMapping.<T>}
 * @constructor
 * @template T
 */
os.im.mapping.location.BasePositionMapping = function() {
  os.im.mapping.location.BasePositionMapping.base(this, 'constructor');

  /**
   * @type {Object.<string, os.im.mapping.IMapping>}
   * @protected
   */
  this.types = os.im.mapping.location.BasePositionMapping.TYPES;

  /**
   * @type {?string}
   * @protected
   */
  this.type = 'Lat/Lon';
};
goog.inherits(os.im.mapping.location.BasePositionMapping, os.im.mapping.AbstractPositionMapping);


/**
 * @type {RegExp}
 * @const
 */
os.im.mapping.location.BasePositionMapping.POS_REGEX =
    /(pos(i(t(i(o(n)?)?)?)?)?|mgrs|coord(i(n(a(t(e(s)?)?)?)?)?)?|geo(m(e(t(r(y)?)?)?)?)?|loc(a(t(i(o(n)?)?)?)?)?)/i;


/**
 * The position types this mapping supports. Should be implemented in subclasses.
 * @type {string}
 * @const
 */
os.im.mapping.location.BasePositionMapping.ID = 'Position';


/**
 * The position types this mapping supports. Should be implemented in subclasses.
 * @type {Object.<string, os.im.mapping.IMapping>}
 * @const
 */
os.im.mapping.location.BasePositionMapping.TYPES = {};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.getId = function() {
  return os.im.mapping.location.BasePositionMapping.ID;
};


/**
 * Get the chosen type for this mapping.
 * @return {?string}
 */
os.im.mapping.location.BasePositionMapping.prototype.getType = function() {
  return this.type;
};


/**
 * Get the chosen type for this mapping.
 * @param {?string} type
 */
os.im.mapping.location.BasePositionMapping.prototype.setType = function(type) {
  if (type && type in this.types) {
    this.type = type;
  } else {
    this.type = null;
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.getFieldsChanged = function() {
  return [this.field];
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.getLabel = function() {
  return this.type;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.getScore = function() {
  if (this.type == 'MGRS') {
    return 1;
  }

  return 2;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.getScoreType = function() {
  return 'geom';
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.execute = function(item) {
  if (this.type) {
    this.types[this.type].field = this.field;
    this.types[this.type].customFormat = this.customFormat;
    this.types[this.type].execute(item);
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.testField = function(value) {
  if (this.type) {
    return this.types[this.type].testField(value);
  }
  return false;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.testAndGetField = function(value, opt_format) {
  if (this.type) {
    return this.types[this.type].testAndGetField(value, opt_format);
  }
  return null;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.autoDetect = function(items) {
  if (items) {
    var i = items.length;
    while (i--) {
      var item = items[i];

      for (var field in item) {
        if (field.match(os.im.mapping.location.BasePositionMapping.POS_REGEX)) {
          for (var type in this.types) {
            if (this.types[type].testField(String(item[field]))) {
              var mapping = new os.im.mapping.location.BasePositionMapping();
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
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.clone = function() {
  var other = os.im.mapping.location.BasePositionMapping.base(this, 'clone');
  other.setType(this.type);
  return other;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.persist = function(opt_to) {
  opt_to = os.im.mapping.location.BasePositionMapping.base(this, 'persist', opt_to);
  opt_to['type'] = this.getType();

  return opt_to;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.restore = function(config) {
  os.im.mapping.location.BasePositionMapping.base(this, 'restore', config);
  this.setType(config['type']);
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.toXml = function() {
  var xml = os.im.mapping.location.BasePositionMapping.base(this, 'toXml');
  os.xml.appendElement('subType', xml, this.getType());

  return xml;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BasePositionMapping.prototype.fromXml = function(xml) {
  os.im.mapping.location.BasePositionMapping.base(this, 'fromXml', xml);

  this.setType(this.getXmlValue(xml, 'subType'));
};

