goog.provide('os.config.storage.SettingsFile');
goog.require('goog.async.Deferred');
goog.require('goog.functions');
goog.require('os.config.namespace');
goog.require('os.config.storage.ISettingsReadableStorage');
goog.require('os.config.storage.ISettingsStorage');
goog.require('os.implements');
goog.require('os.net.Request');



/**
 * Settings which are read in from a file (like an overrides).
 * @implements {os.config.storage.ISettingsStorage}
 * @implements {os.config.storage.ISettingsReadableStorage}
 * @constructor
 * @param {!string} uri
 * @param {boolean=} opt_suppressErrors Whether failure to connect should be ignored - useful for overrides files which
 *     may or may not be available
 */
os.config.storage.SettingsFile = function(uri, opt_suppressErrors) {
  /**
   * @type {!string}
   * @private
   */
  this.uri_ = uri;

  /**
   * @inheritDoc
   */
  this.name = 'file: ' + uri;

  /**
   * @type {boolean}
   * @private
   */
  this.suppressErrors_ = !!opt_suppressErrors;
};
os.implements(os.config.storage.SettingsFile, os.config.storage.ISettingsStorage.ID);
os.implements(os.config.storage.SettingsFile, os.config.storage.ISettingsReadableStorage.ID);


/**
 * @inheritDoc
 * @see {os.config.storage.ISettingsStorage}
 */
os.config.storage.SettingsFile.prototype.init = function() {
  return goog.async.Deferred.succeed();
};


/**
 * @inheritDoc
 * @see {os.config.storage.ISettingsStorage}
 */
os.config.storage.SettingsFile.prototype.getSettings = function() {
  var deferred = new goog.async.Deferred();

  var request = new os.net.Request();
  request.listen(goog.net.EventType.SUCCESS, goog.partial(this.onGetSuccess_, deferred), false, this);
  request.listen(goog.net.EventType.ERROR, goog.partial(this.onGetFail_, deferred), false, this);
  request.setUri(this.uri_);
  request.load();

  return deferred;
};


/**
 * Handle get settings success
 * @param {!goog.async.Deferred} deferred
 * @param {!goog.events.Event} event
 * @private
 */
os.config.storage.SettingsFile.prototype.onGetSuccess_ = function(deferred, event) {
  var request = /** @type {os.net.Request} */ (event.target);
  var response = /** @type {string} */ (request.getResponse());
  request.dispose();

  // strip out comments
  response = response.replace(/\/\*[\s\S]*\*\//mg, '');

  var settings = /** @type {!Object} */ (JSON.parse(response));

  // namespace user settings
  settings[os.config.ConfigType.PREFERENCE] =
      os.config.namespace.addNamespaces(settings[os.config.ConfigType.PREFERENCE] || {});

  deferred.callback(settings);
};


/**
 * Handle get settings fail
 * @param {!goog.async.Deferred} deferred
 * @param {string=} opt_msg
 * @private
 */
os.config.storage.SettingsFile.prototype.onGetFail_ = function(deferred, opt_msg) {
  if (!this.suppressErrors_) {
    deferred.errback(opt_msg);
  } else {
    deferred.callback({});
  }
};


/**
 * @inheritDoc
 */
os.config.storage.SettingsFile.prototype.name = 'file';


/**
 * @inheritDoc
 * @see {os.config.storage.ISettingsStorage}
 */
os.config.storage.SettingsFile.prototype.canAccess = true;
