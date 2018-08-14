goog.provide('os.storage.AsyncStorageWrapper');

goog.require('goog.async.Deferred');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.storage.mechanism.ErrorCode');
goog.require('os.config');
goog.require('os.implements');
goog.require('os.storage.AsyncStorage');
goog.require('os.storage.IMechanism');



/**
 * Adapts a synchronous storage mechanism for asynchonous use. All returned deferred instances will be immediately
 * resolved.
 *
 * @param {!os.storage.IMechanism} mechanism The underlying storage mechanism.
 * @param {(function(S):T|undefined)=} opt_deserialize
 * @param {(function(T):S)=} opt_serialize
 * @extends {os.storage.AsyncStorage}
 * @constructor
 *
 * @throws {Error} If the mechanism does not implement {@link os.storage.IMechanism}.
 *
 * @template T,S
 */
os.storage.AsyncStorageWrapper = function(mechanism, opt_deserialize, opt_serialize) {
  if (!os.implements(mechanism, os.storage.IMechanism.ID)) {
    throw new Error('mechanism must implement os.storage.IMechanism');
  }

  os.storage.AsyncStorageWrapper.base(this, 'constructor');

  /**
   * The mechanism used to persist key-value pairs.
   * @type {!os.storage.IMechanism}
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
};
goog.inherits(os.storage.AsyncStorageWrapper, os.storage.AsyncStorage);


/**
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.storage.AsyncStorageWrapper.LOGGER_ = goog.log.getLogger('os.storage.AsyncStorageWrapper');


/**
 * @inheritDoc
 */
os.storage.AsyncStorageWrapper.prototype.init = function() {
  // wrapping a synchronous storage mechanism, so default to firing the callback immediately
  return goog.async.Deferred.succeed();
};


/**
 * @inheritDoc
 */
os.storage.AsyncStorageWrapper.prototype.get = function(key) {
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
};


/**
 * @inheritDoc
 */
os.storage.AsyncStorageWrapper.prototype.getAll = function() {
  var values = [];

  try {
    values = /** @type {os.storage.IMechanism} */ (this.mechanism).getAll();

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
};


/**
 * @inheritDoc
 */
os.storage.AsyncStorageWrapper.prototype.set = function(key, value, opt_replace) {
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
        var appName = os.config.getAppName('the application');
        var contactInfo = os.config.getSupportContact('your system administrator');
        var errorCode = typeof e == 'string' ? e : '';
        var msg;
        switch (errorCode) {
          case goog.storage.mechanism.ErrorCode.INVALID_VALUE:
            msg = 'Failed saving data to application storage due to an invalid value.';
            break;
          case goog.storage.mechanism.ErrorCode.QUOTA_EXCEEDED:
            msg = 'Application storage is full and data was not saved to the application.';
            break;
          case goog.storage.mechanism.ErrorCode.STORAGE_DISABLED:
            msg = 'Application storage is disabled and data was not saved to the application.';
            break;
          default:
            msg = 'Failed saving data to application storage: ' + e.message + '.';
            break;
        }

        msg += ' Your work may be lost if you close/refresh ' + appName + '. Please contact ' + contactInfo +
            ' for support.';

        os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR,
            os.storage.AsyncStorageWrapper.LOGGER_);
      }
    } else {
      this.mechanism.remove(key);
    }
  }

  return this.getDeferredResult();
};


/**
 * @inheritDoc
 */
os.storage.AsyncStorageWrapper.prototype.remove = function(key) {
  this.mechanism.remove(key);
  return this.getDeferredResult();
};


/**
 * @inheritDoc
 */
os.storage.AsyncStorageWrapper.prototype.clear = function() {
  if (this.mechanism instanceof goog.storage.mechanism.IterableMechanism) {
    this.mechanism.clear();
  } else {
    goog.log.warning(os.storage.AsyncStorageWrapper.LOGGER_, 'Clear is unsupported by storage mechanism');
  }

  return this.getDeferredResult();
};


/**
 * Create a new deferred object to return a result.
 * @param {T=} opt_result
 * @return {!goog.async.Deferred}
 * @protected
 * @template T
 */
os.storage.AsyncStorageWrapper.prototype.getDeferredResult = function(opt_result) {
  return goog.async.Deferred.succeed(opt_result);
};
