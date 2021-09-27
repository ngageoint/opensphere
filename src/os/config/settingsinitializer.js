goog.module('os.config.SettingsInitializer');

const {SETTINGS} = goog.require('os');
const osConfig = goog.require('os.config');
const {getSettings} = goog.require('os.config.instance');
const SettingsFile = goog.require('os.config.storage.SettingsFile');
const SettingsIDBStorage = goog.require('os.config.storage.SettingsIDBStorage');
const SettingsLocalStorage = goog.require('os.config.storage.SettingsLocalStorage');
const {default: AngularAppSettingsInitializer} = goog.require('os.ui.config.AngularAppSettingsInitializer');


/**
 * Initialize settings for OpenSphere.
 */
class SettingsInitializer extends AngularAppSettingsInitializer {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.ngAppSelector = '#ng-app';
    this.ngAppModule = 'os';
    this.namespace = [osConfig.coreNs, osConfig.appNs];
    this.fileUri = this.fileUri || SETTINGS;
  }

  /**
   * @inheritDoc
   */
  registerStorages() {
    var settingsRegistry = getSettings().getStorageRegistry();

    // register all available storages from which to load settings
    settingsRegistry.addStorage(new SettingsFile(/** @type {!string} */ (this.fileUri)));
    if (this.overridesUri) {
      settingsRegistry.addStorage(new SettingsFile(this.overridesUri));
    }
    settingsRegistry.addStorage(new SettingsLocalStorage('opensphere', this.namespace));
    settingsRegistry.addStorage(new SettingsIDBStorage(this.namespace));
  }
}

exports = SettingsInitializer;
