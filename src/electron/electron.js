goog.provide('os.electron');


/**
 * Get the Electron preload exports.
 * @return {Object|undefined}
 */
os.electron.getElectron = function() {
  return window.ElectronExports || undefined;
};


/**
 * If the app is running within Electron.
 * @return {boolean}
 */
os.electron.isElectron = function() {
  return !!os.electron.getElectron();
};
