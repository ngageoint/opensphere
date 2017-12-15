goog.provide('os.file.type.CSVTypeMethod');
goog.require('os.file.File');
goog.require('os.file.IContentTypeMethod');



/**
 * Type method for CSV content.
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
os.file.type.CSVTypeMethod = function() {};


/**
 * @type {RegExp}
 * @const
 */
os.file.type.CSVTypeMethod.EXT_REGEXP = /\.csv$/i;


/**
 * @inheritDoc
 */
os.file.type.CSVTypeMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.file.type.CSVTypeMethod.prototype.getContentType = function() {
  return 'text/csv';
};


/**
 * @inheritDoc
 */
os.file.type.CSVTypeMethod.prototype.getLayerType = function() {
  return 'CSV';
};


/**
 * @inheritDoc
 */
os.file.type.CSVTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  var fileName = file.getFileName();
  var allegedType = file.getContentType();

  // CSVs do not currently support zipped content
  if (!opt_zipEntries) {
    if (fileName.match(os.file.type.CSVTypeMethod.EXT_REGEXP)) {
      return true;
    }

    if (allegedType == 'text/csv') {
      return true;
    }
  }

  return false;
};
