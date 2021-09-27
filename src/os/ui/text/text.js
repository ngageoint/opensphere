goog.declareModuleId('os.ui.text');

import {directiveTag} from '../textprompt.js';
import * as osWindow from '../window.js';

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');


/**
 * Copies a string of text into the clipboard.
 *
 * @param {string} text The string to copy.
 * @param {string=} opt_msg Optional message to send as an alert.
 */
export const copy = function(text, opt_msg) {
  if (text && !isEmptyOrWhitespace(makeSafe(text))) {
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
      var msg = opt_msg || (text.length > 20 ? 'Value ' : '"' + text + '" ') + 'copied to clipboard';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.INFO);
    } else {
      osWindow.create({
        'id': 'copy',
        'x': 'center',
        'y': 'center',
        'label': 'Copy',
        'show-close': true,
        'min-width': 200,
        'min-height': 90,
        'max-width': 1000,
        'max-height': 1000,
        'modal': true,
        'width': 300,
        'height': 'auto',
        'icon': 'fa fa-copy'
      }, directiveTag, undefined, undefined, undefined, {
        'text': 'Use Ctrl+C to copy',
        'value': text
      });
    }
  }
};
