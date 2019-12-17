goog.provide('plugin.file.zip.ZIPPlugin');

goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.file.mime.zip');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.file.zip.ZIPParser');
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
  // register the zip import ui
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails('ZIP file (*.ZIP)', true);
  im.registerImportUI(os.file.mime.zip.TYPE, new plugin.file.zip.ui.ZIPImportUI());
  im.registerParser(this.id, plugin.file.zip.ZIPParser);
};
