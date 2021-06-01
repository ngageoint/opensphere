goog.module('plugin.file.kml.JsonField');
goog.module.declareLegacyNamespace();

const annotation = goog.require('os.annotation');
const RecordField = goog.require('os.data.RecordField');


/**
 * Fields that are known to contain specialized JSON data.
 * @type {!Array<string>}
 */
exports = [
  annotation.OPTIONS_FIELD,
  RecordField.RING_OPTIONS
];
