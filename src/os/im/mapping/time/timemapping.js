goog.declareModuleId('os.im.mapping.time.TimeMapping');

import * as osTime from '../../../time/time.js';
import {setItemField} from '../mapping.js';
import MappingRegistry from '../mappingregistry.js';
import DateTimeMapping from './datetimemapping.js';

const {default: TimeType} = goog.requireType('os.im.mapping.TimeType');


/**
 * Mapping for fields representing time but not date.
 *
 * @extends {DateTimeMapping<T>}
 * @template T
 */
export default class TimeMapping extends DateTimeMapping {
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
