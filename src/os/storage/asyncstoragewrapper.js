goog.module('os.storage.AsyncStorageWrapper');
goog.module.declareLegacyNamespace();

const Deferred = goog.require('goog.async.Deferred');
const log = goog.require('goog.log');
const ErrorCode = goog.require('goog.storage.mechanism.ErrorCode');
const IterableMechanism = goog.require('goog.storage.mechanism.IterableMechanism');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const {getAppName, getSupportContact} = goog.require('os.config');
const osImplements = goog.require('os.implements');
const AsyncStorage = goog.require('os.storage.AsyncStorage');
const IMechanism = goog.require('os.storage.IMechanism');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Adapts a synchronous storage mechanism for asynchonous use. All returned deferred instances will be immediately
 * resolved.
 *
 *
 * @throws {Error} If the mechanism does not implement {@link IMechanism}.
 *
 * @template T,S
 */
class AsyncStorageWrapper extends AsyncStorage {
  /**
   * Constructor.
   * @param {!IMechanism} mechanism The underlying storage mechanism.
   * @param {(function(S):T|undefined)=} opt_deserialize
   * @param {(function(T):S)=} opt_serialize
   */
  constructor(mechanism, opt_deserialize, opt_serialize) {
    if (!osImplements(mechanism, IMechanism.ID)) {
      throw new Error('mechanism must implement os.storage.IMechanism');
    }

    super();

    /**
     * The mechanism used to persist key-value pairs.
     * @type {!IMechanism}
     * @protected
     */
    this.mechanism = mechanism;

    /**
     * @type {(function(S):T|undefined)}
     * @protected
     */
    this.deserialize = opt_deserialize || JSON.parse;

    /**
     * @type {(function(T):S)}
     * @protected
     */
    this.serialize = opt_serialize || JSON.stringify;
  }

  /**
   * @inheritDoc
   */
  init() {
    // wrapping a synchronous storage mechanism, so default to firing the callback immediately
    return Deferred.succeed();
  }

  /**
   * @inheritDoc
   */
  get(key) {
    var value;
    try {
      value = this.mechanism.get(key);
      if (value) {
        value = this.deserialize(value);
      }
    } catch (e) {
      value = undefined;
    }

    return this.getDeferredResult(value != null ? value : undefined);
  }

  /**
   * @inheritDoc
   */
  getAll() {
    var values = [];

    try {
      values = /** @type {IMechanism} */ (this.mechanism).getAll();

      for (var i = 0; i < values.length; i++) {
        var value = values[i];
        if (value) {
          values[i] = this.deserialize(value);
        }
      }
    } catch (e) {
      values = [];
    }

    return this.getDeferredResult(values);
  }

  /**
   * @inheritDoc
   */
  set(key, value, opt_replace) {
    if (opt_replace || this.mechanism.get(key) == null) {
      try {
        value = this.serialize(value);
      } catch (e) {
        value = undefined;
      }

      if (value) {
        try {
          this.mechanism.set(key, value);
        } catch (e) {
          var appName = getAppName('the application');
          var contactInfo = getSupportContact('your system administrator');
          var errorCode = typeof e == 'string' ? e : '';
          var msg;
          switch (errorCode) {
            case ErrorCode.INVALID_VALUE:
              msg = 'Failed saving data to application storage due to an invalid value.';
              break;
            case ErrorCode.QUOTA_EXCEEDED:
              msg = 'Application storage is full and data was not saved to the application.';
              break;
            case ErrorCode.STORAGE_DISABLED:
              msg = 'Application storage is disabled and data was not saved to the application.';
              break;
            default:
              msg = 'Failed saving data to application storage: ' + e.message + '.';
              break;
          }

          msg += ' Your work may be lost if you close/refresh ' + appName + '. Please contact ' + contactInfo +
              ' for support.';

          AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR,
              logger);
        }
      } else {
        this.mechanism.remove(key);
      }
    }

    return this.getDeferredResult();
  }

  /**
   * @inheritDoc
   */
  remove(key) {
    this.mechanism.remove(key);
    return this.getDeferredResult();
  }

  /**
   * @inheritDoc
   */
  clear() {
    if (this.mechanism instanceof IterableMechanism) {
      this.mechanism.clear();
    } else {
      log.warning(logger, 'Clear is unsupported by storage mechanism');
    }

    return this.getDeferredResult();
  }

  /**
   * Create a new deferred object to return a result.
   *
   * @param {T=} opt_result
   * @return {!Deferred}
   * @protected
   * @template T
   */
  getDeferredResult(opt_result) {
    return Deferred.succeed(opt_result);
  }
}

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.storage.AsyncStorageWrapper');


exports = AsyncStorageWrapper;
