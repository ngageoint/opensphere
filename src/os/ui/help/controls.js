goog.declareModuleId('os.ui.help.Controls');

import {ROOT} from '../../os.js';

const KeyCodes = goog.requireType('goog.events.KeyCodes');


/**
 * Singleton for application to add controls
 */
export default class Controls {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * List of controls
     * @type {Array}
     * @private
     */
    this.controls_ = [];
  }

  /**
   * @return {Array}
   */
  getControls() {
    return this.controls_;
  }

  /**
   * Allow application to add controls
   *
   * @param {string} section
   * @param {number} order
   * @param {string} text
   * @param {Array<KeyCodes>=} opt_keys
   * @param {Array<string>=} opt_other
   */
  addControl(section, order, text, opt_keys, opt_other) {
    var ctrlGroup = this.controls_.find(function(group) {
      return group['section'] == section;
    });
    if (!ctrlGroup) {
      ctrlGroup = {
        'section': section,
        'order': order,
        'controls': []
      };
      this.controls_.push(ctrlGroup);
    }
    // Add this control to the list of controls
    ctrlGroup.controls.push({
      'text': text,
      'keys': opt_keys,
      'other': opt_other
    });
  }

  /**
   * Get the global instance.
   * @return {!Controls}
   */
  static getInstance() {
    if (!instance) {
      instance = new Controls();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {Controls} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {Controls|undefined}
 */
let instance;

/**
 * Mouse Pictures
 * @type {Object}
 */
Controls.MOUSE = {
  LEFT_MOUSE: 'LEFT_MOUSE',
  MIDDLE_MOUSE: 'MIDDLE_MOUSE',
  RIGHT_MOUSE: 'RIGHT_MOUSE'
};

/**
 * Mouse Pictures
 * @type {Object}
 */
Controls.MOUSE_IMAGE = {
  'LEFT_MOUSE': ROOT + 'images/MouseLeft.png',
  'MIDDLE_MOUSE': ROOT + 'images/MouseMiddle.png',
  'RIGHT_MOUSE': ROOT + 'images/MouseRight.png'
};

/**
 * Mouse Pictures
 * @type {Object}
 */
Controls.FONT = {
  HORIZONTAL: 'HORIZONTAL',
  VERTICAL: 'VERTICAL',
  ALL: 'ALL',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UP: 'UP',
  DOWN: 'DOWN'
};

/**
 * Mouse Pictures
 * @type {Object}
 */
Controls.FONT_CLASS = {
  'HORIZONTAL': {
    'font': 'fa fa-fw fa-arrows-h',
    'class': 'control-drag'
  },
  'VERTICAL': {
    'font': 'fa fa-fw fa-arrows-v',
    'class': 'control-drag'
  },
  'ALL': {
    'font': 'fa fa-fw fa-arrows',
    'class': 'control-drag'
  },
  'LEFT': {
    'font': 'fa fa-fw fa-long-arrow-left',
    'class': 'control-key'
  },
  'RIGHT': {
    'font': 'fa fa-fw fa-long-arrow-right',
    'class': 'control-key'
  },
  'UP': {
    'font': 'fa fa-fw fa-long-arrow-up',
    'class': 'control-key'
  },
  'DOWN': {
    'font': 'fa fa-fw fa-long-arrow-down',
    'class': 'control-key'
  }
};
