goog.provide('os.file.type.ZipTypeMethod');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.file.IContentTypeMethod');



/**
 * Generic type method for ZIP content.
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
os.file.type.ZipTypeMethod = function() {
  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.file.type.ZipTypeMethod.LOGGER_;

  /**
   * @type {RegExp}
   * @protected
   */
  this.regex = /\.zip$/i;
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.file.type.ZipTypeMethod.LOGGER_ = goog.log.getLogger('os.file.type.ZipTypeMethod');


/**
 * @inheritDoc
 */
os.file.type.ZipTypeMethod.prototype.getContentType = function() {
  return 'application/zip';
};


/**
 * @inheritDoc
 */
os.file.type.ZipTypeMethod.prototype.getLayerType = function() {
  return 'ZIP';
};


/**
 * @inheritDoc
 */
os.file.type.ZipTypeMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.file.type.ZipTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  if (opt_zipEntries) {
    try {
      for (var i = 0, n = opt_zipEntries.length; i < n; i++) {
        var entry = opt_zipEntries[i];
        if (entry.filename.match(this.regex)) {
          return true;
        }
      }

      return false;
    } catch (e) {
      goog.log.error(this.log, e.message, e);
    }
  }

  return false;
};
