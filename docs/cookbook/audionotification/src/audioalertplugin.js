goog.declareModuleId('plugin.audioalert.AudioAlertPlugin');

import AudioManager from 'opensphere/src/os/audio/audiomanager.js';
import AbstractPlugin from 'opensphere/src/os/plugin/abstractplugin.js';
import PluginManager from 'opensphere/src/os/plugin/pluginmanager.js';


/**
 * Cookbook example for playing an audio alert.
 */
export default class AudioAlertPlugin extends AbstractPlugin {
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
