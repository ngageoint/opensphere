goog.provide('os.file.type.HtmlTypeMethod');
goog.require('os.file.IContentTypeMethod');



/**
 * Type method for HTML content.
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
os.file.type.HtmlTypeMethod = function() {};


/**
 * @type {RegExp}
 * @const
 */
os.file.type.HtmlTypeMethod.EXT_REGEXP = /\.html$/i;


/**
 * @inheritDoc
 */
os.file.type.HtmlTypeMethod.prototype.getPriority = function() {
  return -90;
};


/**
 * @inheritDoc
 */
os.file.type.HtmlTypeMethod.prototype.getContentType = function() {
  return 'text/html';
};


/**
 * @inheritDoc
 */
os.file.type.HtmlTypeMethod.prototype.getLayerType = function() {
  return 'html';
};


/**
 * @inheritDoc
 */
os.file.type.HtmlTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  // html type does not currently support zipped content
  if (!opt_zipEntries) {
    var fileName = file.getFileName();
    if (fileName && fileName.match(os.file.type.HtmlTypeMethod.EXT_REGEXP)) {
      return true;
    }

    var allegedType = file.getContentType();
    if (allegedType && goog.string.contains(allegedType, this.getContentType())) {
      return true;
    }

    var content = file.getContent();
    if (goog.isString(content) && goog.string.startsWith(content, '<!DOCTYPE html')) {
      return true;
    }
  }

  return false;
};
