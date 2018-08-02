goog.provide('os.file.type.AnyTypeMethod');
goog.require('os.file.IContentTypeMethod');



/**
 * Generic type method that matches any file. This executes at the lowest priority possible and should only
 * be registered against file manager as a "last resort" method to handle otherwise unhandled file types.
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
os.file.type.AnyTypeMethod = function() {};


/**
 * @type {string}
 */
os.file.type.AnyTypeMethod.TYPE = 'anytype';


/**
 * @inheritDoc
 */
os.file.type.AnyTypeMethod.prototype.getContentType = function() {
  return '*/*';
};


/**
 * @inheritDoc
 */
os.file.type.AnyTypeMethod.prototype.getLayerType = function() {
  return os.file.type.AnyTypeMethod.TYPE;
};


/**
 * @inheritDoc
 */
os.file.type.AnyTypeMethod.prototype.getPriority = function() {
  return -1000;
};


/**
 * @inheritDoc
 */
os.file.type.AnyTypeMethod.prototype.isType = function(content, fileName, allegedType, opt_zipEntries) {
  // this method matches any file type we could successfully parse
  if (content) {
    return true;
  }

  return false;
};
