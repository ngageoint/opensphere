goog.provide('plugin.text.transformer.TextTransformerPlugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.text.transformer.DashesTransformer');
goog.require('os.ui.text.transformer.QuotesTransformer');
goog.require('os.ui.text.transformer.TextTransformerManager');


/**
 * Provides text transformer support
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.text.transformer.TextTransformerPlugin = function() {
  plugin.text.transformer.TextTransformerPlugin.base(this, 'constructor');
  this.id = plugin.text.transformer.TextTransformerPlugin.ID;
};
goog.inherits(plugin.text.transformer.TextTransformerPlugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.text.transformer.TextTransformerPlugin);


/**
 * @type {string}
 * @const
 */
plugin.text.transformer.TextTransformerPlugin.ID = 'textTransformer';


/**
 * @inheritDoc
 */
plugin.text.transformer.TextTransformerPlugin.prototype.init = function() {
  const manager = os.ui.text.transformer.TextTransformerManager.getInstance();
  manager.registerTextTransformer('quotes', os.ui.text.transformer.QuotesTransformer.getInstance());
  manager.registerTextTransformer('dashes', os.ui.text.transformer.DashesTransformer.getInstance());
};
