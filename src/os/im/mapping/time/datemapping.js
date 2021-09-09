goog.module('os.im.mapping.time.DateMapping');

const {setItemField} = goog.require('os.im.mapping');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const DateTimeMapping = goog.require('os.im.mapping.time.DateTimeMapping');
const osTime = goog.require('os.time');
const Duration = goog.require('os.time.Duration');

const TimeType = goog.requireType('os.im.mapping.TimeType');


/**
 * Mapping for fields representing date but not time.
 *
 * @extends {DateTimeMapping<T>}
 * @template T
 */
class DateMapping extends DateTimeMapping {
  /**
   * Constructor.
   * @param {TimeType} type The type of time mapping.
   */
  constructor(type) {
    super(type, DateMapping.ID);
    this.format = osTime.DATE_FORMATS[0];
    this.formats = osTime.DATE_FORMATS;
    this.customFormats = [];
    this.regexes = osTime.DATE_REGEXES;

    this.xmlType = DateMapping.ID;
  }

  /**
   * @inheritDoc
   */
  getScore() {
    return 1;
  }

  /**
   * @inheritDoc
   */
  updateItem(t, item) {
    if (this.field) {
      setItemField(item, this.field, osTime.format(new Date(t), Duration.DAY));
    }
  }

  /**
   * @inheritDoc
   */
  updateTime(to, from) {
    var toDate = new Date(to);
    var fromDate = new Date(from);
    toDate.setUTCFullYear(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate());

    return toDate;
  }
}

/**
 * @type {string}
 * @override
 */
DateMapping.ID = 'Date';

// Register the mapping.
MappingRegistry.getInstance().registerMapping(DateMapping.ID, DateMapping);

exports = DateMapping;
