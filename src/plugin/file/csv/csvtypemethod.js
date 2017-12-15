goog.provide('plugin.file.csv.CSVTypeMethod');
goog.require('os.file.File');
goog.require('os.file.IContentTypeMethod');
goog.require('os.file.type.CSVTypeMethod');
goog.require('plugin.file.csv.CSVParserConfig');



/**
 * Type method for CSV content.
 * @implements {os.file.IContentTypeMethod}
 * @extends {os.file.type.CSVTypeMethod}
 * @constructor
 */
plugin.file.csv.CSVTypeMethod = function() {
  plugin.file.csv.CSVTypeMethod.base(this, 'constructor');
};
goog.inherits(plugin.file.csv.CSVTypeMethod, os.file.type.CSVTypeMethod);


/**
 * Regexp to test if this might be XML or JSON content (starts with <, {, or [).
 * @type {RegExp}
 * @const
 */
plugin.file.csv.CSVTypeMethod.SANITY_CHECK = /^\s*[<{[]/;


/**
 * Regexp to match the first row of data.
 * @type {RegExp}
 * @const
 */
plugin.file.csv.CSVTypeMethod.FIRST_ROW = /^.*?\n/;


/**
 * Character limit for the first row of data before we pass it through the preview check. CSV's should generally have
 * multiple rows of data and the first row (should be the header row) is unlikely to be this long.
 * @type {number}
 * @const
 */
plugin.file.csv.CSVTypeMethod.FIRST_ROW_LIMIT = 50000;


/**
 * @inheritDoc
 */
plugin.file.csv.CSVTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  var content = file.getContent();

  // CSVs do not currently support zipped content
  if (!opt_zipEntries) {
    // try the parent method first
    if (plugin.file.csv.CSVTypeMethod.base(this, 'isType', file, opt_zipEntries)) {
      return true;
    } else if (goog.isString(content) && !plugin.file.csv.CSVTypeMethod.SANITY_CHECK.test(content)) {
      try {
        // verify the first row of data doesn't exceed our limit. if only one row, test the full content length against
        // the limit.
        var match = content.match(plugin.file.csv.CSVTypeMethod.FIRST_ROW);
        if (match && match[0] && match[0].length < plugin.file.csv.CSVTypeMethod.FIRST_ROW_LIMIT ||
            content.length < plugin.file.csv.CSVTypeMethod.FIRST_ROW_LIMIT) {
          var config = new plugin.file.csv.CSVParserConfig();
          config['file'] = file;
          config.updatePreview();

          if (config['preview'].length > 0 && config['columns'].length > 1) {
            return true;
          }
        }
      } catch (e) {
      }
    }
  }

  return false;
};
