goog.provide('plugin.audio.AudioPlugin');

goog.require('os.file.FileManager');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.im.AudioImportUI');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.audio.AudioFileTypeMethod');



/**
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.audio.AudioPlugin = function() {
  plugin.audio.AudioPlugin.base(this, 'constructor');
  this.id = 'audio';
};
goog.inherits(plugin.audio.AudioPlugin, os.plugin.AbstractPlugin);


/**
 * @inheritDoc
 */
plugin.audio.AudioPlugin.prototype.init = function() {
  // register the audio import UI
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails('Audio files for application sounds.');
  im.registerImportUI(this.id, new os.ui.im.AudioImportUI());

  // register the audio file method
  var fm = os.file.FileManager.getInstance();
  fm.registerContentTypeMethod(new plugin.audio.AudioFileTypeMethod());
};
