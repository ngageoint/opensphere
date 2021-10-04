goog.declareModuleId('os.config.storage.SettingsObjectStorage');

import osImplements from '../../implements.js';
import ConfigType from '../configtype.js';
import ISettingsReadableStorage from './isettingsreadablestorage.js';
import ISettingsStorage from './isettingsstorage.js';
import ISettingsWritableStorage from './isettingswritablestorage.js';
import SettingsWritableStorageType from './settingswritablestoragetype.js';

const Deferred = goog.require('goog.async.Deferred');
const googObject = goog.require('goog.object');


/**
 * A storage for settings which reads/writes to an in-memory JSON object.  This is not used in production,
 * but is useful for transient settings for things like unit tests.
 *
 * @implements {ISettingsStorage<*>}
 * @implements {ISettingsReadableStorage<*>}
 * @implements {ISettingsWritableStorage<*>}
 */
export default class SettingsObjectStorage {
  /**
   * Constructor.
   * @param {!Array<!string>} namespaces
   * @param {Object<string, *>=} opt_initialSettings
   */
  constructor(namespaces, opt_initialSettings) {
    /**
     * @inheritDoc
     */
    this.canAccess = true;

    /**
     * @inheritDoc
     */
    this.name = 'object';

    /**
     * @inheritDoc
     */
    this.writeType = SettingsWritableStorageType.LOCAL;

    /**
     * @inheritDoc
     */
    this.needsCleared = false;

    /**
     * @inheritDoc
     */
    this.canInsertDeltas = false;

    /**
     * @type {!Array<!string>}
     * @protected
     */
    this.namespaces = namespaces;

    /**
     * The settings storage object
     * @type {!Object<string, *>}
     */
    this.store = {};

    if (opt_initialSettings) {
      this.setSettings_(opt_initialSettings);
    }
  }

  /**
   * @inheritDoc
   */
  init() {
    try {
      for (var i = 0, ii = this.namespaces.length; i < ii; i++) {
        var ns = this.namespaces[i];
        this.store[ns] = this.store[ns] || {};
      }
      return Deferred.succeed();
    } catch (e) {
      return Deferred.fail('Failed to init settings: ' + e.message);
    }
  }

  /**
   * @inheritDoc
   */
  getSettings() {
    var prefs = {};
    prefs[ConfigType.PREFERENCE] = googObject.unsafeClone(this.store);
    return Deferred.succeed(prefs);
  }

  /**
   * @inheritDoc
   */
  setSettings(map, opt_delete) {
    try {
      this.setSettings_(map);
      return Deferred.succeed();
    } catch (e) {
      return Deferred.fail('Failed to save settings: ' + e.message);
    }
  }

  /**
   * Apply the keys/values of the given map to settings
   *
   * @param {Object<string, *>} map
   * @private
   */
  setSettings_(map) {
    this.namespaces.forEach(function(namespace) {
      var prefs = map[namespace] || {};
      this.store[namespace] = prefs;
    }, this);
  }

  /**
   * @inheritDoc
   */
  deleteSettings(ns) {
    try {
      delete this.store[ns];
      return Deferred.succeed();
    } catch (e) {
      return Deferred.fail('Failed to delete settings:' + e.message);
    }
  }
}

osImplements(SettingsObjectStorage, ISettingsStorage.ID);
osImplements(SettingsObjectStorage, ISettingsReadableStorage.ID);
osImplements(SettingsObjectStorage, ISettingsWritableStorage.ID);
