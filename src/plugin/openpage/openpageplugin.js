goog.provide('plugin.openpage.Plugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.openpage.Handler');


/**
 * Provides a Weather menu option when right-clicking the map. The resulting location is then
 * opened in a new tab with the configured weather URL.
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.openpage.Plugin = function() {
  plugin.openpage.Plugin.base(this, 'constructor');
  this.id = plugin.openpage.ID;
};
goog.inherits(plugin.openpage.Plugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.openpage.Plugin);


/**
 * @inheritDoc
 */
plugin.openpage.Plugin.prototype.init = function() {
  os.xt.Peer.getInstance().addHandler(new plugin.openpage.Handler());
};
