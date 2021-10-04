goog.declareModuleId('os.ui.ColorControlType');

import ControlType from './controltype.js';


/**
 * @enum {string}
 */
const ColorControlType = {
  PICKER_RESET: ControlType.COLOR + ':pickerReset',
  PICKER: ControlType.COLOR + ':picker',
  HUE: ControlType.COLOR + ':hue',
  BASIC: ControlType.COLOR + ':basic',
  NONE: ControlType.COLOR + ':none'
};

export default ColorControlType;
