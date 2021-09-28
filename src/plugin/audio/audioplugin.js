goog.declareModuleId('plugin.audio.AudioPlugin');

import {TYPE} from './mime.js';

const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const AudioImportUI = goog.require('os.ui.im.AudioImportUI');
const ImportManager = goog.require('os.ui.im.ImportManager');


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
