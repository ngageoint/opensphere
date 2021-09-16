goog.module('os.im.mapping.time.TimeMapping');

const {setItemField} = goog.require('os.im.mapping');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const DateTimeMapping = goog.require('os.im.mapping.time.DateTimeMapping');
const osTime = goog.require('os.time');

const TimeType = goog.requireType('os.im.mapping.TimeType');


/**
 * Mapping for fields representing time but not date.
 *
 * @extends {DateTimeMapping<T>}
 * @template T
 */
class TimeMapping extends DateTimeMapping {
  /**
   * Constructor.
   * @param {TimeType} type The type of time mapping.
   */
  constructor(type) {
    super(type, TimeMapping.ID);
    this.format = osTime.TIME_FORMATS[0];
    this.formats = osTime.TIME_FORMATS;
    this.customFormats = osTime.CUSTOM_TIME_FORMATS;
    this.regexes = osTime.TIME_REGEXES;

    this.xmlType = TimeMapping.ID;
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
      setItemField(item, this.field, osTime.format(new Date(t)));
    }
  }

  /**
   * @inheritDoc
   */
  updateTime(to, from) {
    var toDate = new Date(to);
    var fromDate = new Date(from);
    toDate.setUTCHours(fromDate.getUTCHours(), fromDate.getUTCMinutes(), fromDate.getUTCSeconds(),
        fromDate.getUTCMilliseconds());

    return toDate;
  }
}

/**
 * @type {string}
 * @override
 */
TimeMapping.ID = 'Time';

// Register the mapping.
MappingRegistry.getInstance().registerMapping(TimeMapping.ID, TimeMapping);

exports = TimeMapping;
