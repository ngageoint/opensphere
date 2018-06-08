goog.provide('plugin.descriptor.SearchPlugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.search.FacetedSearchCtrl');
goog.require('plugin.descriptor.DescriptorSearch');



/**
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.descriptor.SearchPlugin = function() {
  plugin.descriptor.SearchPlugin.base(this, 'constructor');
  this.id = plugin.descriptor.SearchPlugin.ID;
};
goog.inherits(plugin.descriptor.SearchPlugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.descriptor.SearchPlugin.ID = 'descriptorsearch';


/**
 * @inheritDoc
 */
plugin.descriptor.SearchPlugin.prototype.init = function() {
  os.search.SearchManager.getInstance().registerSearch(new plugin.descriptor.DescriptorSearch('Layers'));
  os.ui.search.FacetedSearchCtrl.provider = new plugin.descriptor.DescriptorSearch('Layers');
};
