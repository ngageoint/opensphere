goog.module('os.ui.ColorControlType');

const ControlType = goog.require('os.ui.ControlType');


/**
 * @enum {string}
 */
exports = {
  PICKER_RESET: ControlType.COLOR + ':pickerReset',
  PICKER: ControlType.COLOR + ':picker',
  HUE: ControlType.COLOR + ':hue',
  BASIC: ControlType.COLOR + ':basic',
  NONE: ControlType.COLOR + ':none'
};
