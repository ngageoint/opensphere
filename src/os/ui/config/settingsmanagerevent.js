goog.module('os.ui.config.SettingsManagerEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');

const SettingPlugin = goog.requireType('os.ui.config.SettingPlugin');

/**
 */
class SettingsManagerEvent extends GoogEvent {
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

exports = SettingsManagerEvent;
