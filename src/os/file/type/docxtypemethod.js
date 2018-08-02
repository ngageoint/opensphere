goog.provide('os.file.type.DocxTypeMethod');
goog.require('os.file.File');
goog.require('os.file.IContentTypeMethod');



/**
 * Type method for CSV content.
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
os.file.type.DocxTypeMethod = function() {};


/**
 * @type {RegExp}
 * @const
 */
os.file.type.DocxTypeMethod.EXT_REGEXP = /\.docx$/i;


/**
 * @inheritDoc
 */
os.file.type.DocxTypeMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.file.type.DocxTypeMethod.prototype.getContentType = function() {
  return 'text/docx';
};


/**
 * @inheritDoc
 */
os.file.type.DocxTypeMethod.prototype.getLayerType = function() {
  return 'DOCX';
};


/**
 * @inheritDoc
 */
os.file.type.DocxTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  var fileName = file.getFileName();
  var allegedType = file.getContentType();

  if (fileName.match(os.file.type.DocxTypeMethod.EXT_REGEXP)) {
    return true;
  }

  if (allegedType == 'text/docx') {
    return true;
  }

  return false;
};
