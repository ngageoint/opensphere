goog.provide('os.config.ServerSettings');
goog.require('os.ui.config.SettingPlugin');
goog.require('os.ui.serversDirective');



/**
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
os.config.ServerSettings = function() {
  os.config.ServerSettings.base(this, 'constructor');

  this.setLabel('Data Servers');
  this.setDescription('Add and configure data servers');
  this.setTags(['servers', 'data', 'provider']);
  this.setIcon('fa fa-database');
  this.setUI('servers');
};
goog.inherits(os.config.ServerSettings, os.ui.config.SettingPlugin);


/**
 * @type {string}
 * @const
 */
os.config.ServerSettings.ID = 'servers';


/**
 * @inheritDoc
 */
os.config.ServerSettings.prototype.getId = function() {
  return os.config.ServerSettings.ID;
};
