goog.provide('plugin.params.ParamsPlugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.params');
goog.require('plugin.params.menu');



/**
 * Allow changing request parameters for layers in opensphere
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.params.ParamsPlugin = function() {
  plugin.params.ParamsPlugin.base(this, 'constructor');

  this.id = plugin.params.ID;
  this.errorMessage = null;
};
goog.inherits(plugin.params.ParamsPlugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.params.ParamsPlugin);


/**
 * @inheritDoc
 */
plugin.params.ParamsPlugin.prototype.disposeInternal = function() {
  plugin.params.ParamsPlugin.base(this, 'disposeInternal');
  plugin.params.menu.layerDispose();
};


/**
 * @inheritDoc
 */
plugin.params.ParamsPlugin.prototype.init = function() {
  plugin.params.menu.layerSetup();
};
