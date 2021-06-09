const {contextBridge, ipcRenderer} = require('electron');
const {getMaximumMemory, getSystemMemory, setMaximumMemory} = require('../memconfig.js');

/**
 * Registered certificate handler.
 * @type {Electron.CertificateRequestFn|undefined}
 */
let certHandler;


/**
 * Cookies set in the current session.
 * @type {string}
 */
let cookies = '';


/**
 * The copied base settings file that will be loaded by the application.
 * @type {string}
 */
let baseSettingsFile = '';


/**
 * Settings files available to the application.
 * @type {!Array<!ElectronOS.SettingsFile>}
 */
let settingsFiles = [];


/**
 * The directory containing user config files and copied app settings.
 * @type {string}
 */
let userSettingsDir = '';


/**
 * General event types.
 * @enum {string}
 */
const EventType = {
  UPDATE_CHECK: 'check-for-updates',

  CERT_HANDLER_REGISTERED: 'client-certificate-handler-registered',
  CERT_SELECT: 'select-client-certificate',
  CERT_SELECTED: 'client-certificate-selected',

  COOKIE_SET: 'set-cookie',
  COOKIE_UPDATE: 'update-cookies',

  SETTINGS_ADD: 'add-settings',
  SETTINGS_GET_FILES: 'get-settings-files',
  SETTINGS_GET_BASE_FILE: 'get-base-settings-file',
  SETTINGS_GET_USER_DIR: 'get-user-settings-dir',
  SETTINGS_REMOVE: 'remove-settings',
  SETTINGS_SET: 'set-settings'
};


/**
 * Register a certificate handler for Electron.
 * @param {Electron.CertificateRequestFn|undefined} handler The handler.
 */
const registerCertificateHandler = (handler) => {
  certHandler = handler;

  // Notify the main process that the handler has been registered.
  ipcRenderer.send(EventType.CERT_HANDLER_REGISTERED);
};


/**
 * Notify the main process that it should check for updates.
 */
const checkForUpdates = () => {
  ipcRenderer.send(EventType.UPDATE_CHECK);
};


/**
 * Handle IPC request to select a client certificate.
 * @param {ElectronEvent} event The event.
 * @param {string} url The URL requesting a certificate.
 * @param {Array<Certificate>} list The available client certificates.
 */
const selectClientCertificate = (event, url, list) => {
  if (certHandler) {
    certHandler(url, list).then((cert) => {
      // Sent the selected certificate to the main process.
      ipcRenderer.send(EventType.CERT_SELECTED, url, cert);
    }, (reason) => {
      // The Electron handler will delete the promise if undefined is returned, as the user did not make a choice. A
      // null value indicates the user cancelled the request and a cert should not be used.
      const value = reason === 'unload' ? undefined : null;
      ipcRenderer.send(EventType.CERT_SELECTED, url, value);
    });
  } else {
    // No handler regisered, use Electron's default behavior.
    ipcRenderer.send(EventType.CERT_SELECTED, url, list[0]);
  }
};


/**
 * Get cookies for the current session.
 * @return {string} The semi-colon delimited list of cookies.
 */
const getCookies = () => {
  return cookies;
};


/**
 * Set a cookie in the current session.
 * @param {string} value The cookie value.
 */
const setCookie = (value) => {
  ipcRenderer.send(EventType.COOKIE_SET, value);
};


/**
 * Request cookie update from the main process.
 */
const updateCookies = () => {
  ipcRenderer.send(EventType.COOKIE_UPDATE);
};

/**
 * Gets the currently set maximum memory.
 * @return {number} The semi-colon delimited list of cookies.
 */
const getMaxMemory = () => {
  return getMaximumMemory();
};

/**
 * Sets a new value for the max memory.
 * @param {number} value The max memory value.
 */
const setMaxMemory = (value) => {
  setMaximumMemory(value);
};

/**
 * Add a user settings file.
 * @param {!ElectronOS.SettingsFile} file The file.
 * @param {string} content The settings content.
 * @return {!Promise} A promise that resolves when the settings file has been saved.
 */
const addUserSettings = async (file, content) => {
  return ipcRenderer.invoke(EventType.SETTINGS_ADD, file, content).then((files) => settingsFiles = files);
};

/**
 * Remove a user settings file.
 * @param {!ElectronOS.SettingsFile} file The file.
 * @return {!Promise} A promise that resolves when the settings file has been removed.
 */
const removeUserSettings = async (file) => {
  return ipcRenderer.invoke(EventType.SETTINGS_REMOVE, file).then((files) => settingsFiles = files);
};

/**
 * Get the path to the base settings file loaded by the application.
 * @return {string}
 */
const getBaseSettingsFile = () => baseSettingsFile;


/**
 * Get the settings files available to the application.
 * @return {!Array<string>}
 */
const getSettingsFiles = () => settingsFiles;

/**
 * Get directory containing user config files and copied app settings.
 * @return {!string}
 */
const getUserSettingsDir = () => userSettingsDir;

/**
 * Update application settings files.
 * @param {!Array<string>} value The list of settings files.
 * @return {!Promise} A promise that resolves when settings have been saved.
 */
const setSettingsFiles = (value) => {
  return ipcRenderer.invoke(EventType.SETTINGS_SET, value).then(() => settingsFiles = value);
};

/**
 * Restarts the application.
 */
const restart = () => {
  ipcRenderer.send('restart');
};

// Handle certificate select event from the main process.
ipcRenderer.on(EventType.CERT_SELECT, selectClientCertificate);


// Handle cookie initialization from the main process.
ipcRenderer.on(EventType.COOKIE_UPDATE, (event, value) => {
  cookies = value;
});


// Initialize settings values from the main process.
ipcRenderer.invoke(EventType.SETTINGS_GET_BASE_FILE).then((file) => {
  baseSettingsFile = file;
});

ipcRenderer.invoke(EventType.SETTINGS_GET_FILES).then((files) => {
  settingsFiles = files;
});

ipcRenderer.invoke(EventType.SETTINGS_GET_USER_DIR).then((files) => {
  userSettingsDir = files;
});


//
// Expose a minimal Electron interface for use in OpenSphere.
//
// For more information, see:
//
// https://www.electronjs.org/docs/all#contextbridge
// https://www.electronjs.org/docs/tutorial/security#2-do-not-enable-nodejs-integration-for-remote-content
// https://www.electronjs.org/docs/tutorial/security#3-enable-context-isolation-for-remote-content
//
contextBridge.exposeInMainWorld('ElectronOS', {
  checkForUpdates,
  getCookies,
  setCookie,
  updateCookies,
  registerCertificateHandler,
  getMaxMemory,
  getSystemMemory,
  setMaxMemory,
  addUserSettings,
  removeUserSettings,
  getBaseSettingsFile,
  getSettingsFiles,
  setSettingsFiles,
  getUserSettingsDir,
  restart
});
