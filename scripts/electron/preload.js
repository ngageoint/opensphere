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
 * General event types.
 * @enum {string}
 */
const EventType = {
  UPDATE_CHECK: 'check-for-updates',

  CERT_HANDLER_REGISTERED: 'client-certificate-handler-registered',
  CERT_SELECT: 'select-client-certificate',
  CERT_SELECTED: 'client-certificate-selected',

  COOKIE_SET: 'set-cookie',
  COOKIE_UPDATE: 'update-cookies'
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
  restart
});
