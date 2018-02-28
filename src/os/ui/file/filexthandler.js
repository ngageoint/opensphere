goog.provide('os.ui.file.FileXTHandler');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os');
goog.require('os.file.FileStorage');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.notification.NotificationManager');
goog.require('os.xt.IMessageHandler');



/**
 * Handles file load messages from other applications
 * @implements {os.xt.IMessageHandler}
 * @constructor
 */
os.ui.file.FileXTHandler = function() {};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.FileXTHandler.LOGGER_ = goog.log.getLogger('os.ui.file.FileXTHandler');


/**
 * @type {string}
 * @const
 */
os.ui.file.FileXTHandler.TYPE = 'file.load';


/**
 * @inheritDoc
 */
os.ui.file.FileXTHandler.prototype.getTypes = function() {
  return [
    os.ui.file.FileXTHandler.TYPE
  ];
};


/**
 * @inheritDoc
 */
os.ui.file.FileXTHandler.prototype.process = function(data, type, sender, time) {
  var url = /** @type {string} */ (data.url);

  if (type === os.ui.file.FileXTHandler.TYPE) {
    if (goog.string.startsWith(url, os.file.FileScheme.LOCAL + '://')) { // local file
      var fs = new os.file.FileStorage(os.SHARED_FILE_DB_NAME); // read into memory
      fs.getFile(url).addCallbacks(this.onFileReady_, this.onFileError_, this); // local file handler??
    } else {
      var importEvent = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.URL, url);
      os.dispatcher.dispatchEvent(importEvent);
      os.ui.notification.NotificationManager.getInstance().increment();
    }
  }
};


/**
 * @param {!os.file.File} file
 * @private
 */
os.ui.file.FileXTHandler.prototype.onFileReady_ = function(file) {
  var fs = new os.file.FileStorage(os.SHARED_FILE_DB_NAME);
  fs.deleteFile(file); // delete indexdb version
  var importEvent = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE, file);
  os.dispatcher.dispatchEvent(importEvent);
  os.ui.notification.NotificationManager.getInstance().increment();
};


/**
 * @param {*} error
 * @private
 */
os.ui.file.FileXTHandler.prototype.onFileError_ = function(error) {
  var errors = [];
  var statusCode;

  if (goog.isString(error)) {
    statusCode = 400;
    errors.push(/** @type {string} */ (error));
  } else {
    statusCode = 404;
    errors.push('File not found in local storage!');
  }

  goog.log.error(os.ui.file.FileXTHandler.LOGGER_, errors.toString() + ' Status code: ' + statusCode);
};
