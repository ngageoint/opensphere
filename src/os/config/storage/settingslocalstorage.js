goog.module('os.config.storage.SettingsLocalStorage');
goog.module.declareLegacyNamespace();

const Deferred = goog.require('goog.async.Deferred');
const {create} = goog.require('goog.storage.mechanism.mechanismfactory');
const {addNamespaces} = goog.require('os.config.namespace');
const BaseLocalSettingsStorage = goog.require('os.config.storage.BaseLocalSettingsStorage');
const ISettingsReadableStorage = goog.require('os.config.storage.ISettingsReadableStorage');
const ISettingsStorage = goog.require('os.config.storage.ISettingsStorage');
const ISettingsWritableStorage = goog.require('os.config.storage.ISettingsWritableStorage');
const osImplements = goog.require('os.implements');
const AsyncStorageWrapper = goog.require('os.storage.AsyncStorageWrapper');
const PrefixedMechanism = goog.require('os.storage.PrefixedMechanism');

const GoogPrefixedMechanism = goog.requireType('goog.storage.mechanism.PrefixedMechanism');


/**
 * Asynchronous storage used for persisting settings to IndexedDb
 *
 * @implements {ISettingsStorage}
 * @implements {ISettingsReadableStorage}
 * @implements {ISettingsWritableStorage}
 */
class SettingsLocalStorage extends BaseLocalSettingsStorage {
  /**
   * Constructor.
   * @param {!string} prefix The storage mechanism prefix
   * @param {!Array<!string>} namespaces The namespaces of the settings
   */
  constructor(prefix, namespaces) {
    super(namespaces);

    /**
     * @inheritDoc
     */
    this.name = 'localStorage';

    /**
     * @type {PrefixedMechanism}
     * @private
     */
    this.mechanism_ = new PrefixedMechanism(/** @type {!GoogPrefixedMechanism} */ (create()), prefix);

    if (this.mechanism_) {
      this.store = new AsyncStorageWrapper(this.mechanism_);
    }
  }

  /**
   * Migrate old settings storage to new paradigm with namespaces
   *
   * @return {Deferred|undefined}
   * @override
   */
  onInit() {
    try {
      var str = this.mechanism_.get(SettingsLocalStorage.LEGACY_STORE_NAME);
      if (str) {
        var prefs = addNamespaces(/** @type {Object<string, *>} */ (JSON.parse(str)));

        this.namespaces.forEach(function(namespace) {
          var nsPrefs = prefs[namespace] || {};
          this.mechanism_.set(namespace, JSON.stringify(nsPrefs));
        }, this);

        this.mechanism_.remove(SettingsLocalStorage.LEGACY_STORE_NAME);
      }
    } catch (e) {
      return Deferred.fail('Failed to migrate localStorage settings');
    }
  }
}
osImplements(SettingsLocalStorage, ISettingsStorage.ID);
osImplements(SettingsLocalStorage, ISettingsReadableStorage.ID);
osImplements(SettingsLocalStorage, ISettingsWritableStorage.ID);


/**
 * @const {string}
 */
SettingsLocalStorage.LEGACY_STORE_NAME = 'settings';


exports = SettingsLocalStorage;
