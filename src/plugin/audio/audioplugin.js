goog.module('plugin.audio.AudioPlugin');
goog.module.declareLegacyNamespace();

const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const AudioImportUI = goog.require('os.ui.im.AudioImportUI');
const ImportManager = goog.require('os.ui.im.ImportManager');
const mime = goog.require('plugin.audio.mime');


/**
 * Plugin to allow importing audio files.
 */
class AudioPlugin extends AbstractPlugin {
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
    im.registerImportUI(mime.TYPE, new AudioImportUI());
  }
}

exports = AudioPlugin;
