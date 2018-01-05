goog.provide('os.ui.text');

goog.require('goog.string');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.ui.textPromptDirective');
goog.require('os.ui.window');


/**
 * @param {string} text
 */
os.ui.text.copy = function(text) {
  if (text && !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(text))) {
    var textArea = document.createElement('textarea');
    textArea.style.top = '-2000px';
    textArea.style.left = '-2000px';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.value = text;

    document.body.appendChild(textArea);
    textArea.select();

    try {
      var success = document.execCommand('copy');
    } catch (e) {
    }

    document.body.removeChild(textArea);

    if (success) {
      var msg = (text.length > 20 ? 'Value ' : '"' + text + '" ') + ' copied to clipboard';
      os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.INFO);
    } else {
      os.ui.window.create({
        'id': 'copy',
        'x': 'center',
        'y': 'center',
        'label': 'Copy',
        'show-close': true,
        'no-scroll': true,
        'min-width': 200,
        'min-height': 90,
        'max-width': 1000,
        'max-height': 1000,
        'modal': true,
        'width': 300,
        'height': 90,
        'icon': 'fa fa-copy'
      }, 'textprompt', undefined, undefined, undefined, {
        'text': 'Use Ctrl+C to copy',
        'value': text
      });
    }
  }
};
