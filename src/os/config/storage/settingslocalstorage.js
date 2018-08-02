goog.provide('os.config.storage.SettingsLocalStorage');

goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('goog.storage.mechanism.PrefixedMechanism');
goog.require('os.config.storage.BaseLocalSettingsStorage');
goog.require('os.config.storage.ISettingsReadableStorage');
goog.require('os.config.storage.ISettingsStorage');
goog.require('os.config.storage.ISettingsWritableStorage');
goog.require('os.config.storage.SettingsWritableStorageType');
goog.require('os.implements');
goog.require('os.storage.AsyncStorageWrapper');
goog.require('os.storage.PrefixedMechanism');



/**
 * Asynchronous storage used for persisting settings to IndexedDb
 * @implements {os.config.storage.ISettingsStorage}
 * @implements {os.config.storage.ISettingsReadableStorage}
 * @implements {os.config.storage.ISettingsWritableStorage}
 * @extends {os.config.storage.BaseLocalSettingsStorage}
 * @constructor
 * @param {!string} prefix The storage mechanism prefix
 * @param {!Array.<!string>} namespaces The namespaces of the settings
 */
os.config.storage.SettingsLocalStorage = function(prefix, namespaces) {
  os.config.storage.SettingsLocalStorage.base(this, 'constructor', namespaces);

  var mech = goog.storage.mechanism.mechanismfactory.create();
  /**
   * @type {os.storage.PrefixedMechanism}
   * @private
   */
  this.mechanism_ = new os.storage.PrefixedMechanism(
      /** @type {!goog.storage.mechanism.PrefixedMechanism} */ (mech), prefix);

  if (this.mechanism_) {
    this.store = new os.storage.AsyncStorageWrapper(this.mechanism_);
  }
};
goog.inherits(os.config.storage.SettingsLocalStorage, os.config.storage.BaseLocalSettingsStorage);
os.implements(os.config.storage.SettingsLocalStorage, os.config.storage.ISettingsStorage.ID);
os.implements(os.config.storage.SettingsLocalStorage, os.config.storage.ISettingsReadableStorage.ID);
os.implements(os.config.storage.SettingsLocalStorage, os.config.storage.ISettingsWritableStorage.ID);


/**
 * @const {string}
 */
os.config.storage.SettingsLocalStorage.LEGACY_STORE_NAME = 'settings';


/**
 * Migrate old settings storage to new paradigm with namespaces
 * @return {goog.async.Deferred|undefined}
 * @override
 */
os.config.storage.SettingsLocalStorage.prototype.onInit = function() {
  try {
    var str = this.mechanism_.get(os.config.storage.SettingsLocalStorage.LEGACY_STORE_NAME);
    if (str) {
      var prefs = os.config.namespace.addNamespaces(/** @type {Object.<string, *>} */ (JSON.parse(str)));

      goog.array.forEach(this.namespaces, function(namespace) {
        var nsPrefs = prefs[namespace] || {};
        this.mechanism_.set(namespace, JSON.stringify(nsPrefs));
      }, this);

      this.mechanism_.remove(os.config.storage.SettingsLocalStorage.LEGACY_STORE_NAME);
    }
  } catch (e) {
    return goog.async.Deferred.fail('Failed to migrate localStorage settings');
  }
};


/**
 * @inheritDoc
 */
os.config.storage.SettingsLocalStorage.prototype.name = 'localStorage';
