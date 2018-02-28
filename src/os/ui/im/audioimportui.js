goog.provide('os.ui.im.AudioImportUI');

goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.audio.AudioManager');
goog.require('os.file');
goog.require('os.ui.im.AbstractImportUI');



/**
 * Used for importing sounds to the audio manager.
 *
 * @constructor
 * @extends {os.ui.im.AbstractImportUI}
 * @template T
 */
os.ui.im.AudioImportUI = function() {
  os.ui.im.AudioImportUI.base(this, 'constructor');
};
goog.inherits(os.ui.im.AudioImportUI, os.ui.im.AbstractImportUI);


/**
 * @inheritDoc
 */
os.ui.im.AudioImportUI.prototype.launchUI = function(file, opt_config) {
  var url = file.getUrl();

  var msg = null;
  if (url && !os.file.isLocal(url) && (os.file.FILE_URL_ENABLED || !os.file.isFileSystem(url))) {
    var label = os.audio.AudioManager.getInstance().addSound(url);

    msg = 'Added new sound "' + label + '"';
    os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.SUCCESS);
  } else {
    msg = 'The audio manager does not support local files. Only files from a URL can be played.';
    os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
  }
};
