/**
 * This is added for backward compatibility with files that goog.require('os.alertManager'). This can be removed if
 * those are replaced with `goog.require('os.alert.AlertManager')` and use `getInstance()`.
 */
goog.provide('os.alertManager');

goog.require('os.alert.AlertManager');

/**
 * Global alert manager instance.
 * @type {os.alert.AlertManager}
 */
os.alertManager = os.alert.AlertManager.getInstance();
