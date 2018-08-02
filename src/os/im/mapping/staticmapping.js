goog.provide('os.im.mapping.StaticMapping');
goog.require('os.im.mapping');
goog.require('os.im.mapping.AbstractMapping');



/**
 * Maps a field to a static value.
 * @extends {os.im.mapping.AbstractMapping<Object>}
 * @constructor
 */
os.im.mapping.StaticMapping = function() {
  os.im.mapping.StaticMapping.base(this, 'constructor');

  /**
   * Static value. If defined, the mapping will assign this value to the field.
   * @type {*}
   */
  this.value = null;

  /**
   * If an existing value should be replaced. Defaults to true.
   * @type {boolean}
   */
  this.replace = true;
};
goog.inherits(os.im.mapping.StaticMapping, os.im.mapping.AbstractMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.StaticMapping.ID = 'Static';


/**
 * @inheritDoc
 */
os.im.mapping.StaticMapping.prototype.getId = function() {
  return os.im.mapping.StaticMapping.ID;
};


/**
 * @inheritDoc
 */
os.im.mapping.StaticMapping.prototype.getLabel = function() {
  return 'Set ' + this.field + ' to ' + this.value;
};


/**
 * @inheritDoc
 */
os.im.mapping.StaticMapping.prototype.execute = function(item) {
  if (item && this.field && (this.replace || os.im.mapping.getItemField(item, this.field) == null)) {
    os.im.mapping.setItemField(item, this.field, this.value);
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.StaticMapping.prototype.clone = function() {
  var other = os.im.mapping.StaticMapping.base(this, 'clone');
  other.value = this.value;
  other.replace = this.replace;
  return other;
};


/**
 * @inheritDoc
 */
os.im.mapping.StaticMapping.prototype.persist = function(opt_to) {
  opt_to = os.im.mapping.StaticMapping.base(this, 'persist', opt_to);
  opt_to['value'] = this.value;
  opt_to['replace'] = this.replace;

  return opt_to;
};


/**
 * @inheritDoc
 */
os.im.mapping.StaticMapping.prototype.restore = function(config) {
  os.im.mapping.StaticMapping.base(this, 'restore', config);
  this.value = config['value'];
  this.replace = config['replace'];
};
