/**
 * This is added for backward compatibility with files that goog.require('os.alertManager'). This can be removed if
 * those are replaced with `goog.require('os.alert.AlertManager')` and use `getInstance()`.


*/
goog.declareModuleId('os.alertManager');

import AlertManager from './alertmanager.js';


/**
 * Global alert manager instance.
 * @type {!AlertManager}
 */
const alertManager = AlertManager.getInstance();

export default alertManager;
