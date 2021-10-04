goog.declareModuleId('os.ui.im.AudioImportUI');

import AlertEventSeverity from '../../alert/alerteventseverity.js';
import AlertManager from '../../alert/alertmanager.js';
import AudioManager from '../../audio/audiomanager.js';
import {isFileSystem, isFileUrlEnabled, isLocal} from '../../file/index.js';
import AbstractImportUI from './abstractimportui.js';


/**
 * Used for importing sounds to the audio manager.
 */
export default class AudioImportUI extends AbstractImportUI {
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
