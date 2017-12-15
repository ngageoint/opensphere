goog.provide('os.file.type.AbstractContainerTypeMethod');
goog.require('os.file.IContentTypeMethod');



/**
 * Generic type method for container types (i.e. zip) content.
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
os.file.type.AbstractContainerTypeMethod = function() {};


/**
 * @inheritDoc
 */
os.file.type.AbstractContainerTypeMethod.prototype.getContentType = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.file.type.AbstractContainerTypeMethod.prototype.getLayerType = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.file.type.AbstractContainerTypeMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.file.type.AbstractContainerTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  if (opt_zipEntries && goog.isArray(opt_zipEntries)) {
    for (var i = 0; i < opt_zipEntries.length; i++) {
      var entry = opt_zipEntries[i];

      if (entry && entry.filename && entry.filename.match(this.getFileNameRegex())) {
        return true;
      }
    }
  }

  return false;
};


/**
 * Gets the filename regex for the file type.
 * @return {RegExp}
 */
os.file.type.AbstractContainerTypeMethod.prototype.getFileNameRegex = goog.abstractMethod;
