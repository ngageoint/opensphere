goog.provide('os.state.JSONStateTypeMethod');
goog.require('os.file.IContentTypeMethod');
goog.require('os.state');



/**
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
os.state.JSONStateTypeMethod = function() {};


/**
 * @inheritDoc
 */
os.state.JSONStateTypeMethod.prototype.getContentType = function() {
  return 'application/json';
};


/**
 * @inheritDoc
 */
os.state.JSONStateTypeMethod.prototype.getLayerType = function() {
  return 'STATE';
};


/**
 * @inheritDoc
 */
os.state.JSONStateTypeMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.state.JSONStateTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  var content = file.getContent();

  if (!opt_zipEntries && content) {
    var object = null;
    try {
      if (goog.isObject(content)) {
        object = /** @type {Object} */ (content);
      } else if (goog.isString(content)) {
        object = goog.json.parse(content);
      }
    } catch (e) {
      // parsing failed, invalid JSON
    }

    if (goog.isObject(object)) {
      if (goog.isArray(object[os.state.Tag.STATE])) {
        return true;
      }
    }
  }

  return false;
};
