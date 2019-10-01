goog.provide('plugin.file.zip.ZIPPlugin');

goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.file.zip.ZIPDescriptor');
goog.require('plugin.file.zip.ZIPParser');
goog.require('plugin.file.zip.ZIPProvider');
goog.require('plugin.file.zip.mime');
goog.require('plugin.file.zip.ui.ZIPImportUI');



/**
 * Provides ZIP support
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.file.zip.ZIPPlugin = function() {
  plugin.file.zip.ZIPPlugin.base(this, 'constructor');
  this.id = plugin.file.zip.ZIPPlugin.ID;
};


goog.inherits(plugin.file.zip.ZIPPlugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.file.zip.ZIPPlugin.ID = 'zip';


/**
 * @type {string}
 * @const
 */
plugin.file.zip.ZIPPlugin.TYPE = 'ZIP Layers';


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPPlugin.prototype.init = function() {
  var dm = os.dataManager;

  // register zip provider type
  dm.registerProviderType(new os.data.ProviderEntry(
      plugin.file.zip.ZIPPlugin.ID,
      plugin.file.zip.ZIPProvider,
      plugin.file.zip.ZIPPlugin.TYPE,
      plugin.file.zip.ZIPPlugin.TYPE));

  // register the zip descriptor type
  dm.registerDescriptorType(this.id, plugin.file.zip.ZIPDescriptor);

  // register the zip import ui
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails('ZIP file (*.ZIP)', true);
  im.registerImportUI(plugin.file.zip.mime.TYPE, new plugin.file.zip.ui.ZIPImportUI());
  im.registerParser(this.id, plugin.file.zip.ZIPParser);
};
