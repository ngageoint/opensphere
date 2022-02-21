goog.declareModuleId('plugin.electron');

/**
 * Identifier for the Electron plugin.
 * @type {string}
 */
export const ID = 'electron';

/**
 * Electron event types.
 * @enum {string}
 */
export const EventType = {
  UPDATE_SETTINGS: 'electron:update-settings'
};

/**
 * Electron settings keys.
 * @enum {string}
 */
export const SettingKey = {
  // publish.channel from the electron-builder config
  RELEASE_CHANNEL: 'plugin.electron.releaseChannel',
  // electron.releaseUrl from the app settings
  RELEASE_URL: 'plugin.electron.releaseUrl'
};

/**
 * If the app is running within Electron.
 * @return {boolean}
 */
export const isElectron = () => {
  return !!window['ElectronOS'];
};
