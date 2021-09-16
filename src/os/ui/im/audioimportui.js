goog.module('os.ui.im.AudioImportUI');

const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const AudioManager = goog.require('os.audio.AudioManager');
const {isFileSystem, isFileUrlEnabled, isLocal} = goog.require('os.file');
const AbstractImportUI = goog.require('os.ui.im.AbstractImportUI');


/**
 * Used for importing sounds to the audio manager.
 */
class AudioImportUI extends AbstractImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    const url = file.getUrl();

    let msg = null;
    if (url && !isLocal(url) && (isFileUrlEnabled() || !isFileSystem(url))) {
      const label = AudioManager.getInstance().addSound(url);

      msg = 'Added new sound "' + label + '"';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.SUCCESS);
    } else {
      msg = 'The audio manager does not support local files. Only files from a URL can be played.';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
    }
  }
}

exports = AudioImportUI;
