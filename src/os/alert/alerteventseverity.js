goog.declareModuleId('os.alert.AlertEventSeverity');

import AlertEventLevel from './alerteventlevel.js';


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

export default AlertEventSeverity;
