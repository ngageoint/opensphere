/**
 * This is added for backward compatibility with files that goog.require('os.alertManager'). This can be removed if
 * those are replaced with `goog.require('os.alert.AlertManager')` and use `getInstance()`.
 */
goog.module('os.alertManager');
goog.module.declareLegacyNamespace();

const AlertManager = goog.require('os.alert.AlertManager');

exports = AlertManager.getInstance();
