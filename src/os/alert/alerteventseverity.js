goog.module('os.alert.AlertEventSeverity');
goog.module.declareLegacyNamespace();

const AlertEventLevel = goog.require('os.alert.AlertEventLevel');

/**
 * Severity levels of alert events.
 * @enum {AlertEventLevel}
 */
const AlertEventSeverity = {
  ERROR: new AlertEventLevel('Error', 400),
  WARNING: new AlertEventLevel('Warning', 300),
  SUCCESS: new AlertEventLevel('Success', 200),
  INFO: new AlertEventLevel('Info', 100)
};

exports = AlertEventSeverity;
