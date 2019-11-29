goog.module('os.alertManager');
goog.module.declareLegacyNamespace();

const AlertManager = goog.require('os.alert.AlertManager');

/**
 * Global alert manager reference.
 * @type {AlertManager}
 */
const instance = AlertManager.getInstance();

exports = instance;
