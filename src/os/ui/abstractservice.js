goog.provide('os.ui.AbstractService');

goog.require('goog.json');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.alert.AlertManager');
goog.require('os.ui');
goog.require('os.xt.Peer');



/**
 * Provides functions available to all services.
 * @constructor
 * @ngInject
 */
os.ui.AbstractService = function() {
  /**
   * @type {os.xt.Peer}
   */
  this.peer = os.xt.Peer.getInstance();

  /**
   * The logger
   * @type {goog.log.Logger}
   */
  this.log = os.ui.AbstractService.LOGGER_;
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.AbstractService.LOGGER_ = goog.log.getLogger('os.ui.AbstractService');


/**
 * Request callback on success
 * @param {goog.events.Event} event The request event
 * @param {function(*): ?} resolve The goog.Promise resolve function
 * @protected
 */
os.ui.AbstractService.prototype.onSuccess = function(event, resolve) {
  var request = /** @type {os.net.Request} */ (event.target);
  var response = /** @type {string} */ (request.getResponse());
  request.dispose();

  if (response && goog.isString(response) && goog.json.isValid(response)) {
    var data = /** @type {Object} */ (JSON.parse(response));
    resolve(data);
  } else {
    resolve('');
  }
};


/**
 * A default error handler to display messages
 * @param {goog.events.Event} event The request event
 * @param {string} message The base error message to display
 * @param {boolean} silent If error popups should be suppressed. Errors will still be logged.
 * @param {function(?):?=} opt_reject The goog.Promise reject function
 * @protected
 */
os.ui.AbstractService.prototype.onError = function(event, message, silent, opt_reject) {
  var request = /** @type {os.net.Request} */ (event.target);
  var rejectMessage = message;
  var errors = request.getErrors();
  request.dispose();

  if (errors && errors.length > 0) {
    var errorStr = errors.join('\n');
    if (rejectMessage && rejectMessage.length > 0) {
      rejectMessage += '\n' + errorStr;
    } else {
      rejectMessage = errorStr;
    }
  }

  this.reportError(rejectMessage, silent, opt_reject);
};


/**
 * Fires an error alert with support information attached.
 * @param {string} message The base error message.
 * @param {boolean} silent If error popups should be suppressed. Errors will still be logged.
 * @param {function(?):?=} opt_reject The goog.Promise reject function
 * @protected
 */
os.ui.AbstractService.prototype.reportError = function(message, silent, opt_reject) {
  var support = '';
  var supportContact = /** @type {string} */ (os.settings.get(['supportContact']));
  if (supportContact && !silent) {
    support = '\nContact <strong>' + supportContact + '</strong> for support.';
  }

  var errorMsg = '';
  if (!silent) {
    errorMsg = goog.string.newLineToBr(message + support);
  } else {
    errorMsg = message;
  }

  if (silent) {
    goog.log.error(this.log, errorMsg);
  } else {
    os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR, this.log);
  }

  if (goog.isDef(opt_reject)) {
    opt_reject(message);
  }
};
