goog.declareModuleId('os.time.replacers');

import VariableReplacer from '../net/variablereplacer.js';
import * as time from './time.js';
import * as TimeRangePresets from './timerangepresets.js';


/**
 * If replacers have been initialized.
 * @type {boolean}
 */
let initialized = false;

/**
 * Initialize variable replacers for time.
 */
export const init = () => {
  if (!initialized) {
    initialized = true;

    // replace {now[:offset]} in URI's
    VariableReplacer.add('now', time.replaceNow);
    // replace {time:[start|end]} in URI's
    VariableReplacer.add('time', TimeRangePresets.replaceTime);
  }
};
