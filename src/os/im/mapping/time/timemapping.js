goog.provide('os.im.mapping.time.TimeMapping');
goog.require('os.im.mapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.TimeType');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.time');



/**
 * Mapping for fields representing time but not date.
 * @param {os.im.mapping.TimeType} type The type of time mapping.
 * @extends {os.im.mapping.time.DateTimeMapping.<T>}
 * @constructor
 * @template T
 */
os.im.mapping.time.TimeMapping = function(type) {
  os.im.mapping.time.TimeMapping.base(this, 'constructor', type, os.im.mapping.time.TimeMapping.ID);
  this.format = os.time.TIME_FORMATS[0];
  this.formats = os.time.TIME_FORMATS;
  this.customFormats = os.time.CUSTOM_TIME_FORMATS;
  this.regexes = os.time.TIME_REGEXES;

  this.xmlType = os.im.mapping.time.TimeMapping.ID;
};
goog.inherits(os.im.mapping.time.TimeMapping, os.im.mapping.time.DateTimeMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.time.TimeMapping.ID = 'Time';

// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.time.TimeMapping.ID, os.im.mapping.time.TimeMapping);


/**
 * @inheritDoc
 */
os.im.mapping.time.TimeMapping.prototype.getScore = function() {
  return 1;
};


/**
 * @inheritDoc
 */
os.im.mapping.time.TimeMapping.prototype.updateItem = function(t, item) {
  if (this.field) {
    os.im.mapping.setItemField(item, this.field, os.time.format(new Date(t)));
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.time.TimeMapping.prototype.updateTime = function(to, from) {
  var toDate = new Date(to);
  var fromDate = new Date(from);
  toDate.setUTCHours(fromDate.getUTCHours(), fromDate.getUTCMinutes(), fromDate.getUTCSeconds(),
      fromDate.getUTCMilliseconds());

  return toDate;
};
