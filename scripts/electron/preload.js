const {contextBridge, ipcRenderer} = require('electron');


/**
 * Registered certificate handler.
 * @type {Electron.CertificateRequestFn|undefined}
 */
let certHandler;


/**
 * Register a certificate handler for Electron.
 * @param {Electron.CertificateRequestFn|undefined} handler The handler.
 */
const registerCertificateHandler = (handler) => {
  certHandler = handler;

  // Notify the main process that the handler has been registered.
  ipcRenderer.send('client-certificate-handler-registered');
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
      ipcRenderer.send('client-certificate-selected', url, cert);
    }, (reason) => {
      // The Electron handler will delete the promise if undefined is returned, as the user did not make a choice. A
      // null value indicates the user cancelled the request and a cert should not be used.
      const value = reason === 'unload' ? undefined : null;
      ipcRenderer.send('client-certificate-selected', url, value);
    });
  } else {
    // No handler regisered, use Electron's default behavior.
    ipcRenderer.send('client-certificate-selected', url, list[0]);
  }
};


// Handle certificate select event from the main process.
ipcRenderer.on('select-client-certificate', selectClientCertificate);


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
  registerCertificateHandler
});
