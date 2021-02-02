goog.module('plugin.electron');


/**
 * Identifier for the Electron plugin.
 * @type {string}
 */
const ID = 'electron';


/**
 * Electron settings keys.
 * @enum {string}
 */
const SettingKey = {
  // publish.channel from the electron-builder config
  RELEASE_CHANNEL: 'plugin.electron.releaseChannel',
  // electron.releaseUrl from the app settings
  RELEASE_URL: 'plugin.electron.releaseUrl'
};


/**
 * If the app is running within Electron.
 * @return {boolean}
 */
const isElectron = () => {
  return !!window['ElectronOS'];
};


exports = {ID, SettingKey, isElectron};
