goog.provide('plugin.config.Plugin');

goog.require('os.data.ConfigDescriptor');
goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.config');
goog.require('plugin.config.Provider');


/**
 * Provides config support
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.config.Plugin = function() {
  plugin.config.Plugin.base(this, 'constructor');
  this.id = plugin.config.ID;
};
goog.inherits(plugin.config.Plugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.config.Plugin);


/**
 * @inheritDoc
 */
plugin.config.Plugin.prototype.init = function() {
  var dm = os.dataManager;

  dm.registerProviderType(new os.data.ProviderEntry(
    plugin.config.ID, plugin.config.Provider, 'config Provider',
    'config servers provide layers through layer configs'));

  dm.registerDescriptorType(os.data.ConfigDescriptor.ID, os.data.ConfigDescriptor);
};
