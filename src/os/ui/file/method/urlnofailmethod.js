goog.module('os.ui.file.method.UrlNoFailMethod');

const log = goog.require('goog.log');
const EventType = goog.require('os.events.EventType');
const OSFile = goog.require('os.file.File');
const UrlMethod = goog.require('os.ui.file.method.UrlMethod');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');
const Request = goog.requireType('os.net.Request');


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.file.method.UrlNoFailMethod');

/**
 * @type {string}
 */
const TYPE = 'unkown';

/**
 * Handle the file request failure.  Create file with name and URL but no contents.
 *
 * @override
 * @param {GoogEvent} event
 * @protected
 * @suppress {duplicate}
 */
UrlMethod.prototype.onError = function(event) {
  var request = /** @type {Request} */ (event.target);
  request.removeAllListeners();

  var url = request.getUri().toString();
  var q = url.indexOf('?');
  var i = url.lastIndexOf('/') + 1;
  var fileName = decodeURI(url.substring(i == -1 ? 0 : i, q == -1 ? url.length : q));

  var msg = 'Unable to read contents from URL "' + url + '"!  Creating file with name and URL, but no contents';
  log.info(logger, msg);

  var file = new OSFile();
  file.setFileName(fileName);
  file.setUrl(url);
  file.setType(TYPE);
  this.setFile(file);
  this.dispatchEvent(EventType.COMPLETE);
};

exports = {
  TYPE
};
