goog.provide('os.debug.FancierWindow');
goog.require('goog.debug.FancyWindow');
goog.require('goog.html.SafeStyleSheet');
goog.require('goog.string.Const');



/**
 * Makes FancyWindow fancier by making the window close button do the same thing as clicking the exit button
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
    '#clearbutton,#exitbutton,#openbutton{color:#eee;}#closebutton{color:#333;}');


/**
 * @inheritDoc
 */
os.debug.FancierWindow.prototype.writeInitialDocument = function() {
  os.debug.FancierWindow.superClass_.writeInitialDocument.call(this);

  // close button should set the debug window to disabled
  if (this.win) {
    goog.events.listenOnce(this.win, goog.events.EventType.BEFOREUNLOAD, this.onBeforeUnload_, false, this);
  }
};


/**
 * @private
 */
os.debug.FancierWindow.prototype.onBeforeUnload_ = function() {
  // this.exit_ is private (grr), so copy it here
  this.setEnabled(false);
  if (this.win) {
    goog.events.unlisten(this.win, goog.events.EventType.BEFOREUNLOAD, this.onBeforeUnload_, false, this);
    this.win.close();
  }
};


/**
 * @inheritDoc
 */
os.debug.FancierWindow.prototype.getStyleRules = function() {
  var baseRules = os.debug.FancierWindow.base(this, 'getStyleRules');
  var extraRules = goog.html.SafeStyleSheet.fromConstant(os.debug.FancierWindow.STYLE_RULES_);
  return goog.html.SafeStyleSheet.concat(baseRules, extraRules);
};
