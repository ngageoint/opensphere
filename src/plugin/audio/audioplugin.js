goog.declareModuleId('plugin.audio.AudioPlugin');

import AudioImportUI from '../../os/ui/im/audioimportui.js';
import ImportManager from '../../os/ui/im/importmanager.js';
import {TYPE} from './mime.js';

const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');


/**
 * Plugin to allow importing audio files.
 */
export default class AudioPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = 'audio';
  }

  /**
   * @inheritDoc
   */
  init() {
    // register the audio import UI
    const im = ImportManager.getInstance();
    im.registerImportDetails('Audio files for application sounds.');
    im.registerImportUI(TYPE, new AudioImportUI());
  }
}
