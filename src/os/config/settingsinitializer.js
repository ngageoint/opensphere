goog.declareModuleId('os.config.SettingsInitializer');

import {SETTINGS} from '../os.js';
import AngularAppSettingsInitializer from '../ui/config/angularappsettingsinitializer.js';
import * as osConfig from './config.js';
import {getSettings} from './configinstance.js';
import SettingsFile from './storage/settingsfile.js';
import SettingsIDBStorage from './storage/settingsidbstorage.js';
import SettingsLocalStorage from './storage/settingslocalstorage.js';


/**
 * Initialize settings for OpenSphere.
 */
export default class SettingsInitializer extends AngularAppSettingsInitializer {
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
