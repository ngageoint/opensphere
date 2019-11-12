goog.provide('os.debug.FancierWindow');
goog.require('goog.debug.FancyWindow');
goog.require('goog.html.SafeStyleSheet');
goog.require('goog.string.Const');
goog.require('os.alert.AlertManager');
goog.require('os.ui');



/**
 * Makes FancyWindow fancier by making the window close button do the same thing as clicking the exit button
 *
 * @param {string=} opt_identifier Identifier for this logging class
 * @param {string=} opt_prefix Prefix pre-pended to the messages
 * @extends {goog.debug.FancyWindow}
 * @constructor
 */
os.debug.FancierWindow = function(opt_identifier, opt_prefix) {
  os.debug.FancierWindow.base(this, 'constructor', opt_identifier, opt_prefix);
};
goog.inherits(os.debug.FancierWindow, goog.debug.FancyWindow);


/**
 * @type {!goog.string.Const}
 * @private
 * @const
 */
os.debug.FancierWindow.STYLE_RULES_ = goog.string.Const.from(
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
 * @inheritDoc
 */
os.debug.FancierWindow.prototype.writeInitialDocument = function() {
  goog.events.unlisten(this.win, goog.events.EventType.BEFOREUNLOAD, this.closeLogger, false, this);
  os.debug.FancierWindow.superClass_.writeInitialDocument.call(this);

  /** @suppress {accessControls} To access the private dom helper for the logging window to get the save button */
  var saveButton = this.dh_.getElement('savebutton');
  saveButton.addEventListener(goog.events.EventType.CLICK, this.exportLogs_.bind(this));

  // close button should set the debug window to disabled
  if (this.win) {
    goog.events.listenOnce(this.win, goog.events.EventType.BEFOREUNLOAD, this.closeLogger, false, this);
  }
};


/**
 * @suppress {accessControls}
 */
os.debug.FancierWindow.prototype.closeLogger = function() {
  this.exit_(null);
};


/**
 * @inheritDoc
 */
os.debug.FancierWindow.prototype.getStyleRules = function() {
  var baseRules = os.debug.FancierWindow.base(this, 'getStyleRules');
  var extraRules = goog.html.SafeStyleSheet.fromConstant(os.debug.FancierWindow.STYLE_RULES_);
  return goog.html.SafeStyleSheet.concat(baseRules, extraRules);
};


/**
 * @inheritDoc
 * @suppress {accessControls} To overwrite private method getHtml_ to add save button
 */
os.debug.FancierWindow.prototype.getHtml_ = function() {
  var baseHtml = os.debug.FancierWindow.superClass_.getHtml_.call(this);

  var SafeHtml = goog.html.SafeHtml;

  var body = SafeHtml.create(
      'body', {},
      SafeHtml.create(
          'div', {'id': 'head'},
          SafeHtml.create('span', {'id': 'savebutton'}, 'save')));

  var additionalHtml = SafeHtml.create('html', {}, body);
  return goog.html.SafeHtml.concat(baseHtml, additionalHtml);
};


/**
 * Export the logs to a file.
 * @private
 */
os.debug.FancierWindow.prototype.exportLogs_ = function() {
  var SafeHtml = goog.html.SafeHtml;
  var head = SafeHtml.create(
      'head', {},
      SafeHtml.concat(
          SafeHtml.create('title', {}, 'Logging: ' + this.identifier),
          SafeHtml.createStyle(this.getStyleRules())));

  var htmlMessages = [];

  /** @suppress {accessControls} To access the private log messages (savedMessges_) */
  var messages = this.savedMessages_.getValues();
  for (var i = 0; i < messages.length; i++) {
    htmlMessages.push(SafeHtml.create('div', {'class': 'logmsg'}, messages[i]));
  }

  var body = SafeHtml.create(
      'body', {},
      SafeHtml.concat(
          SafeHtml.create(
              'div',
              {'id': 'log', 'style': goog.string.Const.from('overflow:auto;height:100%;')},
              SafeHtml.concat(htmlMessages))));

  var logOutput = SafeHtml.create('html', {}, SafeHtml.concat(head, body));

  var outFileName = this.identifier + 'LoggingOutput_' + moment(goog.now()).utc().format('YYYYMMDD_Hmmss') + 'Z.html';
  if (os.file.persist.saveFile(outFileName, goog.html.SafeHtml.unwrap(logOutput), 'text/html')) {
    os.alert.AlertManager.getInstance().sendAlert('Created ' + outFileName, os.alert.AlertEventSeverity.SUCCESS);
  } else {
    os.alert.AlertManager.getInstance().sendAlert('Could not create ' + outFileName, os.alert.AlertEventSeverity.ERROR);
  }
};


/**
 * @inheritDoc
 */
os.debug.FancierWindow.prototype.addLogRecord = function(logRecord) {
  // If this window is not opened but enabled (the X button was clicked), then disable it
  if (!this.hasActiveWindow() && this.isEnabled()) {
    this.setEnabled(false);
  }
  os.debug.FancierWindow.superClass_.addLogRecord.call(this, logRecord);
};
