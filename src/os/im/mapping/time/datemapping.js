goog.declareModuleId('os.im.mapping.time.DateMapping');

import Duration from '../../../time/duration.js';
import * as osTime from '../../../time/time.js';
import {setItemField} from '../mapping.js';
import MappingRegistry from '../mappingregistry.js';
import DateTimeMapping from './datetimemapping.js';

const {default: TimeType} = goog.requireType('os.im.mapping.TimeType');


/**
 * Mapping for fields representing date but not time.
 *
 * @extends {DateTimeMapping<T>}
 * @template T
 */
export default class DateMapping extends DateTimeMapping {
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
