goog.provide('os.ui.file.method.UrlNoFailMethod');
goog.require('goog.events');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.file.File');
goog.require('os.file.IFileMethod');
goog.require('os.net.Request');
goog.require('os.ui.file.method.UrlMethod');



/**
 * Extension of {os.ui.file.method.UrlMethod} which still creates a file, with a name and URL, even if the request
 * for the file fails and its contents can't be read.
 * @implements {os.file.IFileMethod}
 * @extends {os.ui.file.method.UrlMethod}
 * @constructor
 */
os.ui.file.method.UrlNoFailMethod = function() {
  os.ui.file.method.UrlNoFailMethod.base(this, 'constructor');
  this.log = os.ui.file.method.UrlNoFailMethod.LOGGER_;
};
goog.inherits(os.ui.file.method.UrlNoFailMethod, os.ui.file.method.UrlMethod);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.method.UrlNoFailMethod.LOGGER_ = goog.log.getLogger('os.ui.file.method.UrlNoFailMethod');


/**
 * Handle the file request failure.  Create file with name and URL but no contents.
 * @override
 * @param {goog.events.Event} event
 * @protected
 */
os.ui.file.method.UrlNoFailMethod.prototype.onError = function(event) {
  var request = /** @type {os.net.Request} */ (event.target);
  request.removeAllListeners();

  var url = request.getUri().toString();
  var q = url.indexOf('?');
  var i = url.lastIndexOf('/') + 1;
  var fileName = decodeURI(url.substring(i == -1 ? 0 : i, q == -1 ? url.length : q));

  var msg = 'Unable to read contents from URL "' + url + '"!  Creating file with name and URL, but no contents';
  goog.log.info(this.log, msg);

  var file = new os.file.File();
  file.setFileName(fileName);
  file.setUrl(url);
  this.setFile(file);
  this.dispatchEvent(os.events.EventType.COMPLETE);
};
