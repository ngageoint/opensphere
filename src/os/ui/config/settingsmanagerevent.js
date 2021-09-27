goog.declareModuleId('os.ui.config.SettingsManagerEvent');

const GoogEvent = goog.require('goog.events.Event');

const {default: SettingPlugin} = goog.requireType('os.ui.config.SettingPlugin');


/**
 */
export default class SettingsManagerEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {SettingPlugin=} opt_plugin
   */
  constructor(type, opt_plugin) {
    super(type);

    /**
     * @type {SettingPlugin}
     */
    this.plugin = opt_plugin || null;
  }
}
