goog.provide('os.ui.file.method.UrlNoFailMethod');
goog.require('goog.events');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.file.File');
goog.require('os.file.IFileMethod');
goog.require('os.net.Request');
goog.require('os.ui.file.method.UrlMethod');


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.method.UrlNoFailMethod.LOGGER_ = goog.log.getLogger('os.ui.file.method.UrlNoFailMethod');


/**
 * @type {string}
 * @const
 */
os.ui.file.method.UrlNoFailMethod.TYPE = 'unkown';


/**
 * Handle the file request failure.  Create file with name and URL but no contents.
 * @override
 * @param {goog.events.Event} event
 * @protected
 * @suppress {duplicate}
 */
os.ui.file.method.UrlMethod.prototype.onError = function(event) {
  var request = /** @type {os.net.Request} */ (event.target);
  request.removeAllListeners();

  var url = request.getUri().toString();
  var q = url.indexOf('?');
  var i = url.lastIndexOf('/') + 1;
  var fileName = decodeURI(url.substring(i == -1 ? 0 : i, q == -1 ? url.length : q));

  var msg = 'Unable to read contents from URL "' + url + '"!  Creating file with name and URL, but no contents';
  goog.log.info(os.ui.file.method.UrlNoFailMethod.LOGGER_, msg);

  var file = new os.file.File();
  file.setFileName(fileName);
  file.setUrl(url);
  file.setType(os.ui.file.method.UrlNoFailMethod.TYPE);
  this.setFile(file);
  this.dispatchEvent(os.events.EventType.COMPLETE);
};
