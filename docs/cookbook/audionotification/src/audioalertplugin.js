goog.module('plugin.audioalert.AudioAlertPlugin');

const AudioManager = goog.require('os.audio.AudioManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const PluginManager = goog.require('os.plugin.PluginManager');

/**
 * Cookbook example for playing an audio alert.
 */
class AudioAlertPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
    this.errorMessage = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    const audioManager = AudioManager.getInstance();
    audioManager.play('sound1');
  }
}

/**
 * @type {string}
 */
const ID = 'audioalert';

// add the plugin to the application
PluginManager.getInstance().addPlugin(new AudioAlertPlugin());

exports = AudioAlertPlugin;
