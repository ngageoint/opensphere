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
 *   fingerprint: string
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
