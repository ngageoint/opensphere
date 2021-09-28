goog.declareModuleId('os.proj.switch.ReprojectionWarning');

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';

const Delay = goog.require('goog.async.Delay');


/**
 * Displays a warning when tile layers will be reprojected.
 */
export default class ReprojectionWarning {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {goog.async.Delay}
     * @private
     */
    this.delay_ = new Delay(this.onWarn_, 500, this);

    /**
     * @type {!Array<string>}
     * @private
     */
    this.titles_ = [];
  }

  /**
   * @param {string} title
   */
  addTitle(title) {
    this.titles_.push(title);
    this.delay_.start();
  }

  /**
   * Handles warning
   *
   * @private
   */
  onWarn_() {
    var plural = this.titles_.length > 1;
    var msg = 'The tile layer' + (plural ? 's ' : ' ') + this.titles_.join(', ') +
        (plural ? ' are' : ' is') + ' being locally re-projected because the remote services do not support ' +
        'the current projection.';
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
    this.titles_.length = 0;
  }

  /**
   * Get the global instance.
   * @return {!ReprojectionWarning}
   */
  static getInstance() {
    if (!instance) {
      instance = new ReprojectionWarning();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {ReprojectionWarning} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {ReprojectionWarning|undefined}
 */
let instance;
