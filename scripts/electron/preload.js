const {contextBridge, ipcRenderer} = require('electron');
const path = require('path');
const url = require('url');

const CookieEventType = require('../cookieeventtype.js');
const SettingsEventType = require('../settingseventtype.js');
const {getMaximumMemory, getSystemMemory, setMaximumMemory, setMemoryFlags} = require('../memconfig.js');

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
 * If this is the main window.
 * @type {boolean}
 */
let isMain = false;


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
 * If user settings are supported.
 * @type {boolean}
 */
let userSettingsSupported = false;


/**
 * General event types.
 * @enum {string}
 */
const EventType = {
  IS_MAIN: 'is-main-window',
  UPDATE_CHECK: 'check-for-updates',

  CERT_HANDLER_REGISTERED: 'client-certificate-handler-registered',
  CERT_SELECT: 'select-client-certificate',
  CERT_SELECTED: 'client-certificate-selected'
};


/**
 * Regular expression to detect a remote (http or https) URL.
 * @type {RegExp}
 */
const URI_REGEXP = /^(?:http|https):\/\//;


/**
 * If this is the main window.
 * @return {boolean}
 */
const isMainWindow = () => isMain;


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
  ipcRenderer.send(CookieEventType.SET, value);
};


/**
 * Request cookie update from the main process.
 */
const updateCookies = () => {
  ipcRenderer.send(CookieEventType.UPDATE);
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
  setMaximumMemory(String(value));
};

/**
 * Get the settings file config by file name/URL.
 * @param {string} fileOrPath The file name or URL.
 * @return {ElectronOS.SettingsFile|undefined} The file, or undefined if not found.
 */
const getSettingsFile = (fileOrPath) => {
  const filePath = URI_REGEXP.test(fileOrPath) ? fileOrPath : path.join(userSettingsDir, fileOrPath);
  return settingsFiles.find((file) => file.path === filePath);
};

/**
 * Add a user settings file.
 * @param {!ElectronOS.SettingsFile} file The file.
 * @param {?string} content The settings content.
 * @return {!Promise<!Array<!ElectronOS.SettingsFile>>} A promise that resolves to the updated settings.
 */
const addUserSettings = async (file, content) =>
  settingsFiles = await ipcRenderer.invoke(SettingsEventType.ADD, file, content);

/**
 * Remove a user settings file.
 * @param {!ElectronOS.SettingsFile} file The file.
 * @return {!Promise<!Array<!ElectronOS.SettingsFile>>} A promise that resolves to the updated settings.
 */
const removeUserSettings = async (file) => settingsFiles = await ipcRenderer.invoke(SettingsEventType.REMOVE, file);

/**
 * Update a user settings file.
 * @param {!ElectronOS.SettingsFile} file The file.
 * @return {!Promise<!Array<!ElectronOS.SettingsFile>>} A promise that resolves to the updated settings.
 */
const updateUserSettings = async (file) => settingsFiles = await ipcRenderer.invoke(SettingsEventType.UPDATE, file);

/**
 * Get the local path to the base settings file loaded by the application.
 * @return {string}
 */
const getBaseSettingsFile = () => baseSettingsFile;

/**
 * Get the file:// URL to the base settings file loaded by the application.
 * @return {string}
 */
const getBaseSettingsFileUrl = () => url.pathToFileURL(baseSettingsFile).toString();

/**
 * Get the settings files available to the application.
 * @return {!Array<!ElectronOS.SettingsFile>}
 */
const getSettingsFiles = () => settingsFiles;

/**
 * Get directory containing user config files and copied app settings.
 * @return {string}
 */
const getUserSettingsDir = () => userSettingsDir;

/**
 * If user settings management is supported. User settings are currently only supported in the main window, given files
 * would need to be separately managed in other windows.
 * @return {boolean}
 */
const supportsUserSettings = () => isMain && userSettingsSupported;

/**
 * Update application settings files.
 * @param {!Array<!ElectronOS.SettingsFile>} value The list of settings files.
 * @return {!Promise<!Array<!ElectronOS.SettingsFile>>} A promise that resolves to the saved settings.
 */
const setSettingsFiles = async (value) => settingsFiles = await ipcRenderer.invoke(SettingsEventType.SET, value);

/**
 * Restarts the application.
 */
const restart = () => {
  ipcRenderer.send('restart');
};

// Set memory flags on the renderer process.
setMemoryFlags();

// Handle certificate select event from the main process.
ipcRenderer.on(EventType.CERT_SELECT, selectClientCertificate);

// Handle cookie initialization from the main process.
ipcRenderer.on(CookieEventType.UPDATE, (event, value) => {
  cookies = value;
});

// Initialize values from the main process.
(async () => {
  // Initialize the main window flag.
  isMain = await ipcRenderer.invoke(EventType.IS_MAIN);

  // Initialize user settings values.
  userSettingsSupported = await ipcRenderer.invoke(SettingsEventType.SUPPORTED);

  if (userSettingsSupported) {
    baseSettingsFile = await ipcRenderer.invoke(SettingsEventType.GET_BASE_FILE);
    settingsFiles = await ipcRenderer.invoke(SettingsEventType.GET_FILES);
    userSettingsDir = await ipcRenderer.invoke(SettingsEventType.GET_USER_DIR);
  }
})();

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
  isMainWindow,
  checkForUpdates,
  getCookies,
  setCookie,
  updateCookies,
  registerCertificateHandler,
  getMaxMemory,
  getSystemMemory,
  setMaxMemory,
  getSettingsFile,
  addUserSettings,
  removeUserSettings,
  updateUserSettings,
  getBaseSettingsFile,
  getBaseSettingsFileUrl,
  getSettingsFiles,
  setSettingsFiles,
  getUserSettingsDir,
  supportsUserSettings,
  restart
});
