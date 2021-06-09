/* eslint-disable jsdoc/require-returns-check */
/**
 * @fileoverview Externs for OpenSphere integration with Electron.
 * @externs
 */

/**
 * Electron API.
 * @type {Object}
 */
let Electron;


/**
 * @typedef {{
 *   data: string,
 *   issuer: Electron.CertificatePrincipal,
 *   issuerCert: Electron.Certificate,
 *   issuerName: string,
 *   subject: Electron.CertificatePrincipal,
 *   subjectName: string,
 *   serialNumber: string,
 *   fingerprint: string,
 *   validExpiry: number,
 *   validStart: number
 * }}
 */
Electron.Certificate;


/**
 * @typedef {{
 *   commonName: string,
 *   organizations: Array<string>,
 *   organizationUnits: Array<string>,
 *   locality: string,
 *   state: string,
 *   country: string,
 *   validStart: number,
 *   validExpiry: number
 * }}
 */
Electron.CertificatePrincipal;


/**
 * @typedef {function(string, !Array<!Electron.Certificate>):!Promise<!Electron.Certificate>}
 */
Electron.CertificateRequestFn;


/**
 * Interface exposed by the Electron preload script.
 * @type {Object}
 */
let ElectronOS;


/**
 * Notify the main process that it should check for updates.
 */
ElectronOS.checkForUpdates = function() {};


/**
 * Register a certificate request handler with Electron.
 * @param {Electron.CertificateRequestFn|undefined} handler The handler.
 */
ElectronOS.registerCertificateHandler = function(handler) {};


/**
 * Get cookies for the current session.
 * @return {string} The semi-colon delimited list of cookies.
 */
ElectronOS.getCookies = function() {};


/**
 * Set a cookie in the current session.
 * @param {string} value The cookie value.
 */
ElectronOS.setCookie = function(value) {};


/**
 * Request cookie update from the main process.
 */
ElectronOS.updateCookies = function() {};

/**
 * Get the maximum memory application can use.
 * @return {number} The maximum memory application can use.
 */
ElectronOS.getMaxMemory = function() {};

/**
 * Gets the total available memory for the system.
 * @return {number} The total available memory on the system in MB.
 */
ElectronOS.getSystemMemory = function() {};

/**
 * Set the maximum memory the application can use.
 * @param {number} value The maximum memory application can use.
 */
ElectronOS.setMaxMemory = function(value) {};

/**
 * Restarts the entire application.
 */
ElectronOS.restart = function() {};

/**
 * @typedef {{
 *   default: boolean,
 *   enabled: boolean,
 *   label: string,
 *   path: string
 * }}
 */
ElectronOS.SettingsFile;

/**
 * Get the settings file config by file name.
 * @param {string} fileName The file name.
 * @return {ElectronOS.SettingsFile|undefined} The file, or undefined if not found.
 */
ElectronOS.getSettingsFile = function(fileName) {};

/**
 * Add a user settings file.
 * @param {!ElectronOS.SettingsFile} file The file.
 * @param {string} content The settings content.
 * @return {!Promise} A promise that resolves when the settings file has been saved.
 */
ElectronOS.addUserSettings = function(file, content) {};

/**
 * Remove a user settings file.
 * @param {!ElectronOS.SettingsFile} file The file.
 * @return {!Promise} A promise that resolves when the settings file has been removed.
 */
ElectronOS.removeUserSettings = function(file) {};

/**
 * Update a user settings file.
 * @param {!ElectronOS.SettingsFile} file The file.
 * @return {!Promise} A promise that resolves when the settings file has been updated.
 */
ElectronOS.updateUserSettings = function(file) {};

/**
 * Get the base settings file to load in the application.
 * @return {string}
 */
ElectronOS.getBaseSettingsFile = function() {};

/**
 * Get the settings files available to the application.
 * @return {!Array<!ElectronOS.SettingsFile>} The list of settings files.
 */
ElectronOS.getSettingsFiles = function() {};

/**
 * Update application settings files.
 * @param {!Array<!ElectronOS.SettingsFile>} value The list of settings files.
 * @return {!Promise} A promise that resolves when settings have been saved.
 */
ElectronOS.setSettingsFiles = function(value) {};

/**
 * Get directory containing user config files and copied app settings.
 * @return {!string}
 */
ElectronOS.getUserSettingsDir = function() {};
