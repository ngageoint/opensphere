goog.declareModuleId('plugin.file.kml.JsonField');

const annotation = goog.require('os.annotation');
const RecordField = goog.require('os.data.RecordField');


/**
 * Fields that are known to contain specialized JSON data.
 * @type {!Array<string>}
 */
const JsonField = [
  annotation.OPTIONS_FIELD,
  RecordField.RING_OPTIONS
];

export default JsonField;
