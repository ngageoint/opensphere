goog.provide('os.file.type.TextTypeMethod');
goog.require('os.file.IContentTypeMethod');



/**
 * Type method for plain text content.
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
os.file.type.TextTypeMethod = function() {};


/**
 * @type {RegExp}
 * @const
 */
os.file.type.TextTypeMethod.EXT_REGEXP = /\.txt$/i;


/**
 * @inheritDoc
 */
os.file.type.TextTypeMethod.prototype.getPriority = function() {
  return -100;
};


/**
 * @inheritDoc
 */
os.file.type.TextTypeMethod.prototype.getContentType = function() {
  return 'text/plain';
};


/**
 * @inheritDoc
 */
os.file.type.TextTypeMethod.prototype.getLayerType = function() {
  return 'text';
};


/**
 * @inheritDoc
 */
os.file.type.TextTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  // text type does not currently support zipped content
  if (!opt_zipEntries) {
    var fileName = file.getFileName();
    if (fileName && fileName.match(os.file.type.TextTypeMethod.EXT_REGEXP)) {
      return true;
    }

    var allegedType = file.getContentType();
    if (allegedType && goog.string.contains(allegedType, this.getContentType())) {
      return true;
    }

    var content = file.getContent();
    if (goog.isString(content)) {
      return true;
    }
  }

  return false;
};
