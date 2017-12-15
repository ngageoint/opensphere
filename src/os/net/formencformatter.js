goog.provide('os.net.FormEncFormatter');
goog.require('goog.net.XhrIo');
goog.require('os.net.IDataFormatter');



/**
 * THIS CLASS IS THE DEFAULT POST FORMATTER. IF YOU CHANGE IT, STUFF WILL BREAK.
 * Check out CustomFormatter, JsonEncFormatter, or just go make your own if you
 * need something different.
 *
 * Creates a x-www-form-urlencoded payload for a typical POST request of form data
 *
 * @implements {os.net.IDataFormatter}
 * @constructor
 */
os.net.FormEncFormatter = function() {
};


/**
 * @inheritDoc
 */
os.net.FormEncFormatter.prototype.getContentType = function() {
  return goog.net.XhrIo.FORM_CONTENT_TYPE;
};


/**
 * @inheritDoc
 */
os.net.FormEncFormatter.prototype.format = function(uri) {
  var q = uri.getQuery();
  uri.getQueryData().clear();
  return q;
};
