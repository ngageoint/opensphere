goog.provide('plugin.audioalert.AudioAlertPlugin');

goog.require('os.audio.AudioManager');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.plugin.PluginManager');


/**
 * Cookbook example for playing an audio alert.
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.audioalert.AudioAlertPlugin = function() {
  plugin.audioalert.AudioAlertPlugin.base(this, 'constructor');
  this.id = plugin.audioalert.ID;
  this.errorMessage = null;
};
goog.inherits(plugin.audioalert.AudioAlertPlugin, os.plugin.AbstractPlugin);

/**
 * @type {string}
 * @const
 */
plugin.audioalert.ID = 'audioalert';

/**
 * @inheritDoc
 */
plugin.audioalert.AudioAlertPlugin.prototype.init = function() {
  var audioManager = os.audio.AudioManager.getInstance();
  audioManager.play("sound1");
};

// add the plugin to the application
os.plugin.PluginManager.getInstance().addPlugin(new plugin.audioalert.AudioAlertPlugin());
