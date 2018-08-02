goog.provide('os.im.mapping.time.DateMapping');
goog.require('os.im.mapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.TimeType');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.time');
goog.require('os.time.Duration');



/**
 * Mapping for fields representing date but not time.
 * @param {os.im.mapping.TimeType} type The type of time mapping.
 * @extends {os.im.mapping.time.DateTimeMapping.<T>}
 * @constructor
 * @template T
 */
os.im.mapping.time.DateMapping = function(type) {
  os.im.mapping.time.DateMapping.base(this, 'constructor', type, os.im.mapping.time.DateMapping.ID);
  this.format = os.time.DATE_FORMATS[0];
  this.formats = os.time.DATE_FORMATS;
  this.customFormats = [];
  this.regexes = os.time.DATE_REGEXES;

  this.xmlType = os.im.mapping.time.DateMapping.ID;
};
goog.inherits(os.im.mapping.time.DateMapping, os.im.mapping.time.DateTimeMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.time.DateMapping.ID = 'Date';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.time.DateMapping.ID, os.im.mapping.time.DateMapping);


/**
 * @inheritDoc
 */
os.im.mapping.time.DateMapping.prototype.getScore = function() {
  return 1;
};


/**
 * @inheritDoc
 */
os.im.mapping.time.DateMapping.prototype.updateItem = function(t, item) {
  if (this.field) {
    os.im.mapping.setItemField(item, this.field, os.time.format(new Date(t), os.time.Duration.DAY));
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.time.DateMapping.prototype.updateTime = function(to, from) {
  var toDate = new Date(to);
  var fromDate = new Date(from);
  toDate.setUTCFullYear(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate());

  return toDate;
};
