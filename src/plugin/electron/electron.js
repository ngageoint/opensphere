goog.module('plugin.electron');


/**
 * Identifier for the Electron plugin.
 * @type {string}
 */
const ID = 'electron';


/**
 * If the app is running within Electron.
 * @return {boolean}
 */
const isElectron = () => {
  return !!window['ElectronOS'];
};


exports = {ID, isElectron};
