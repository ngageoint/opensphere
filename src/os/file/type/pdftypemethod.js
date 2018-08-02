goog.provide('os.file.type.PDFTypeMethod');
goog.require('os.file.File');
goog.require('os.file.IContentTypeMethod');



/**
 * Type method for PDF content.
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
os.file.type.PDFTypeMethod = function() {};


/**
 * @type {RegExp}
 * @const
 */
os.file.type.PDFTypeMethod.EXT_REGEXP = /\.pdf$/i;


/**
 * @inheritDoc
 */
os.file.type.PDFTypeMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.file.type.PDFTypeMethod.prototype.getContentType = function() {
  return 'text/pdf';
};


/**
 * @inheritDoc
 */
os.file.type.PDFTypeMethod.prototype.getLayerType = function() {
  return 'PDF';
};


/**
 * @inheritDoc
 */
os.file.type.PDFTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  var fileName = file.getFileName();
  var allegedType = file.getContentType();

  if (!opt_zipEntries) {
    if (fileName.match(os.file.type.PDFTypeMethod.EXT_REGEXP)) {
      return true;
    }

    if (allegedType == 'text/pdf') {
      return true;
    }
  }

  return false;
};
