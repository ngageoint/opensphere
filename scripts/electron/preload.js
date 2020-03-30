const {contextBridge, ipcRenderer} = require('electron');


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
 * User certificate event types.
 * @enum {string}
 */
const CertEventType = {
  HANDLER_REGISTERED: 'client-certificate-handler-registered',
  SELECT: 'select-client-certificate',
  SELECTED: 'client-certificate-selected'
};


/**
 * Cookie event types.
 * @enum {string}
 */
const CookieEventType = {
  SET: 'set-cookie',
  UPDATE: 'update-cookies'
};


/**
 * Register a certificate handler for Electron.
 * @param {Electron.CertificateRequestFn|undefined} handler The handler.
 */
const registerCertificateHandler = (handler) => {
  certHandler = handler;

  // Notify the main process that the handler has been registered.
  ipcRenderer.send(CertEventType.HANDLER_REGISTERED);
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
      ipcRenderer.send(CertEventType.SELECTED, url, cert);
    }, (reason) => {
      // The Electron handler will delete the promise if undefined is returned, as the user did not make a choice. A
      // null value indicates the user cancelled the request and a cert should not be used.
      const value = reason === 'unload' ? undefined : null;
      ipcRenderer.send(CertEventType.SELECTED, url, value);
    });
  } else {
    // No handler regisered, use Electron's default behavior.
    ipcRenderer.send(CertEventType.SELECTED, url, list[0]);
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


// Handle certificate select event from the main process.
ipcRenderer.on(CertEventType.SELECT, selectClientCertificate);


// Handle cookie initialization from the main process.
ipcRenderer.on(CookieEventType.UPDATE, (event, value) => {
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
  getCookies,
  setCookie,
  updateCookies,
  registerCertificateHandler
});
