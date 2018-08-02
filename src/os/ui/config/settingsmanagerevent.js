goog.provide('os.ui.config.SettingsManagerEvent');
goog.provide('os.ui.config.SettingsManagerEventType');
goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.ui.config.SettingsManagerEventType = {
  SELECTED_CHANGE: 'settingsmanager:selectedchange',
  SETTING_ADDED: 'settingsmanager:pluginadded'
};



/**
 * @param {string} type
 * @param {os.ui.config.SettingPlugin=} opt_plugin
 * @extends {goog.events.Event}
 * @constructor
 */
os.ui.config.SettingsManagerEvent = function(type, opt_plugin) {
  os.ui.config.SettingsManagerEvent.base(this, 'constructor', type);

  /**
   * @type {os.ui.config.SettingPlugin}
   */
  this.plugin = opt_plugin || null;
};
goog.inherits(os.ui.config.SettingsManagerEvent, goog.events.Event);


