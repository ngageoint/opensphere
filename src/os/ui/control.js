goog.provide('os.ui.ColorControlType');
goog.provide('os.ui.ControlType');


/**
 * @enum {string}
 */
os.ui.ControlType = {
  COLOR: 'colorControl'
};


/**
 * @enum {string}
 */
os.ui.ColorControlType = {
  PICKER_RESET: os.ui.ControlType.COLOR + ':pickerReset',
  PICKER: os.ui.ControlType.COLOR + ':picker',
  HUE: os.ui.ControlType.COLOR + ':hue',
  BASIC: os.ui.ControlType.COLOR + ':basic',
  NONE: os.ui.ControlType.COLOR + ':none'
};
