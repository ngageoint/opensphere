goog.declareModuleId('os.debug.FancierWindow');

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import {saveFile} from '../file/persist/persist.js';

const FancyWindow = goog.require('goog.debug.FancyWindow');
const googEvents = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');
const SafeHtml = goog.require('goog.html.SafeHtml');
const SafeStyleSheet = goog.require('goog.html.SafeStyleSheet');
const Const = goog.require('goog.string.Const');


/**
 * @type {!Const}
 */
const styleRules = Const.from(
    '#log{background-color:#000;}' +
    '.logmsg{color:#eee;}' +
    '.dbg-i{color:#0f0;}' +
    '#head{' +
        'background-image: -webkit-gradient(linear,0 0,0 100%,from(#616972),color-stop(70%,#434c55),to(#384149));' +
        'background-image: -webkit-linear-gradient(#616972,#434c55 70%,#384149);' +
        'background-image: -moz-linear-gradient(top,#616972,#434c55 70%,#384149);' +
        'background-image: -o-linear-gradient(#616972,#434c55 70%,#384149);' +
        'background-image: linear-gradient(#616972,#434c55 70%,#384149);}' +
    '#head p,#head p b{color:#eee;font-weight:bold;}' +
    '#clearbutton,#exitbutton,#openbutton{color:#eee;}#closebutton{color:#333;}' +
    '#savebutton{text-decoration:underline;color:#eee;cursor:' +
    'pointer;position:absolute;top:0px;right:115px;font:x-small arial;}');


/**
 * Makes FancyWindow fancier by making the window close button do the same thing as clicking the exit button
 */
export default class FancierWindow extends FancyWindow {
  /**
   * Constructor.
   * @param {string=} opt_identifier Identifier for this logging class
   * @param {string=} opt_prefix Prefix pre-pended to the messages
   */
  constructor(opt_identifier, opt_prefix) {
    super(opt_identifier, opt_prefix);
  }

  /**
   * @inheritDoc
   */
  writeInitialDocument() {
    googEvents.unlisten(this.win, GoogEventType.BEFOREUNLOAD, this.closeLogger, false, this);
    super.writeInitialDocument();

    /** @suppress {accessControls} To access the private dom helper for the logging window to get the save button */
    const saveButton = this.dh_.getElement('savebutton');
    saveButton.addEventListener(GoogEventType.CLICK, this.exportLogs_.bind(this));

    // close button should set the debug window to disabled
    if (this.win) {
      googEvents.listenOnce(this.win, GoogEventType.BEFOREUNLOAD, this.closeLogger, false, this);
    }
  }

  /**
   * @suppress {accessControls}
   */
  closeLogger() {
    this.exit_(null);
  }

  /**
   * @inheritDoc
   */
  getStyleRules() {
    const baseRules = super.getStyleRules();
    const extraRules = SafeStyleSheet.fromConstant(styleRules);
    return SafeStyleSheet.concat(baseRules, extraRules);
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} To overwrite private method getHtml_ to add save button
   */
  getHtml_() {
    const baseHtml = super.getHtml_();

    const body = SafeHtml.create(
        'body', {},
        SafeHtml.create(
            'div', {'id': 'head'},
            SafeHtml.create('span', {'id': 'savebutton'}, 'save')));

    const additionalHtml = SafeHtml.create('html', {}, body);
    return SafeHtml.concat(baseHtml, additionalHtml);
  }

  /**
   * Export the logs to a file.
   * @private
   */
  exportLogs_() {
    const head = SafeHtml.create(
        'head', {},
        SafeHtml.concat(
            SafeHtml.create('title', {}, 'Logging: ' + this.identifier),
            SafeHtml.createStyle(this.getStyleRules())));

    const htmlMessages = [];

    /** @suppress {accessControls} To access the private log messages (savedMessges_) */
    const messages = this.savedMessages_.getValues();
    for (let i = 0; i < messages.length; i++) {
      htmlMessages.push(SafeHtml.create('div', {'class': 'logmsg'}, messages[i]));
    }

    const body = SafeHtml.create(
        'body', {},
        SafeHtml.concat(
            SafeHtml.create(
                'div',
                {'id': 'log', 'style': Const.from('overflow:auto;height:100%;')},
                SafeHtml.concat(htmlMessages))));

    const logOutput = SafeHtml.create('html', {}, SafeHtml.concat(head, body));

    const outFileName = this.identifier + 'LoggingOutput_' + moment(Date.now()).utc().format('YYYYMMDD_Hmmss') +
        'Z.html';
    if (saveFile(outFileName, SafeHtml.unwrap(logOutput), 'text/html')) {
      AlertManager.getInstance().sendAlert('Created ' + outFileName, AlertEventSeverity.SUCCESS);
    } else {
      AlertManager.getInstance().sendAlert('Could not create ' + outFileName,
          AlertEventSeverity.ERROR);
    }
  }

  /**
   * @inheritDoc
   */
  addLogRecord(logRecord) {
    // If this window is not opened but enabled (the X button was clicked), then disable it
    if (!this.hasActiveWindow() && this.isEnabled()) {
      this.setEnabled(false);
    }
    super.addLogRecord(logRecord);
  }
}
