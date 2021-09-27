goog.declareModuleId('os.ui.AbstractService');

const {isValid} = goog.require('goog.json');
const log = goog.require('goog.log');
const {newLineToBr} = goog.require('goog.string');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const Settings = goog.require('os.config.Settings');
const Peer = goog.require('os.xt.Peer');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');


/**
 * Provides functions available to all services.
 * @unrestricted
 */
export default class AbstractService {
  /**
   * Constructor.
   * @ngInject
   */
  constructor() {
    /**
     * @type {Peer}
     */
    this.peer = Peer.getInstance();

    /**
     * The logger
     * @type {Logger}
     */
    this.log = logger;
  }

  /**
   * Request callback on success
   *
   * @param {GoogEvent} event The request event
   * @param {function(*): ?} resolve The goog.Promise resolve function
   * @protected
   */
  onSuccess(event, resolve) {
    var request = /** @type {os.net.Request} */ (event.target);
    var response = /** @type {string} */ (request.getResponse());
    request.dispose();

    if (response && typeof response === 'string' && isValid(response)) {
      var data = /** @type {Object} */ (JSON.parse(response));
      resolve(data);
    } else {
      resolve('');
    }
  }

  /**
   * A default error handler to display messages
   *
   * @param {GoogEvent} event The request event
   * @param {string} message The base error message to display
   * @param {boolean} silent If error popups should be suppressed. Errors will still be logged.
   * @param {function(?):?=} opt_reject The goog.Promise reject function
   * @protected
   */
  onError(event, message, silent, opt_reject) {
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
  }

  /**
   * Fires an error alert with support information attached.
   *
   * @param {string} message The base error message.
   * @param {boolean} silent If error popups should be suppressed. Errors will still be logged.
   * @param {function(?):?=} opt_reject The goog.Promise reject function
   * @protected
   */
  reportError(message, silent, opt_reject) {
    var support = '';
    var supportContact = /** @type {string} */ (Settings.getInstance().get(['supportContact']));
    if (supportContact && !silent) {
      support = '\nContact <strong>' + supportContact + '</strong> for support.';
    }

    var errorMsg = '';
    if (!silent) {
      errorMsg = newLineToBr(message + support);
    } else {
      errorMsg = message;
    }

    if (silent) {
      log.error(this.log, errorMsg);
    } else {
      AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR, this.log);
    }

    if (opt_reject !== undefined) {
      opt_reject(message);
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.AbstractService');
