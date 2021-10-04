goog.declareModuleId('plugin.file.kml.JsonField');

import * as annotation from '../../../os/annotation/annotation.js';
import RecordField from '../../../os/data/recordfield.js';


/**
 * Fields that are known to contain specialized JSON data.
 * @type {!Array<string>}
 */
const JsonField = [
  annotation.OPTIONS_FIELD,
  RecordField.RING_OPTIONS
];

export default JsonField;
