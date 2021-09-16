goog.module('os.time.replacers');

const VariableReplacer = goog.require('os.net.VariableReplacer');
const time = goog.require('os.time');
const TimeRangePresets = goog.require('os.time.TimeRangePresets');


/**
 * If replacers have been initialized.
 * @type {boolean}
 */
let initialized = false;

/**
 * Initialize variable replacers for time.
 */
const init = () => {
  if (!initialized) {
    initialized = true;

    // replace {now[:offset]} in URI's
    VariableReplacer.add('now', time.replaceNow);
    // replace {time:[start|end]} in URI's
    VariableReplacer.add('time', TimeRangePresets.replaceTime);
  }
};

exports = {
  init
};
