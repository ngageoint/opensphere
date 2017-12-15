goog.provide('os.ui.file.method.FileMethod');
goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events.EventTarget');
goog.require('os.file.IFileMethod');
goog.require('os.net.Request');
goog.require('os.ui.file.fileImportDirective');
goog.require('os.ui.window');



/**
 * @param {boolean=} opt_keepFile Whether the file method will keep the original File reference around.
 *                                This is necessary when the content type of the file is needed (i.e. when uploading
 *                                it to a server).
 * @implements {os.file.IFileMethod}
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.ui.file.method.FileMethod = function(opt_keepFile) {
  os.ui.file.method.FileMethod.base(this, 'constructor');

  /**
   * @type {os.file.File}
   * @private
   */
  this.file_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.keepFile_ = Boolean(opt_keepFile);
};
goog.inherits(os.ui.file.method.FileMethod, goog.events.EventTarget);


/**
 * @inheritDoc
 */
os.ui.file.method.FileMethod.prototype.disposeInternal = function() {
  os.ui.file.method.FileMethod.base(this, 'disposeInternal');
  this.clearFile();
};


/**
 * @inheritDoc
 */
os.ui.file.method.FileMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.ui.file.method.FileMethod.prototype.isSupported = function() {
  return Modernizr.indexeddb;
};


/**
 * @inheritDoc
 */
os.ui.file.method.FileMethod.prototype.getFile = function() {
  return this.file_;
};


/**
 * @inheritDoc
 */
os.ui.file.method.FileMethod.prototype.setFile = function(file) {
  this.file_ = file;
};


/**
 * @inheritDoc
 */
os.ui.file.method.FileMethod.prototype.clearFile = function() {
  this.file_ = null;
};


/**
 * @inheritDoc
 */
os.ui.file.method.FileMethod.prototype.clone = function() {
  var other = new this.constructor();
  other.setKeepFile(this.getKeepFile());
  return other;
};


/**
 * @return {boolean}
 */
os.ui.file.method.FileMethod.prototype.getKeepFile = function() {
  return this.keepFile_;
};


/**
 * @param {boolean} val
 */
os.ui.file.method.FileMethod.prototype.setKeepFile = function(val) {
  this.keepFile_ = val;
};


/**
 * @inheritDoc
 */
os.ui.file.method.FileMethod.prototype.loadFile = function(opt_options) {
  if (!this.file_) {
    var scopeOptions = {
      'method': this
    };
    var windowOptions = {
      'label': 'Import File',
      'icon': 'fa fa-floppy-o lt-blue-icon',
      'x': 'center',
      'y': 'center',
      'width': '400',
      'min-width': '400',
      'max-width': '400',
      'height': '150',
      'min-height': '150',
      'max-height': '150',
      'modal': 'true',
      'show-close': 'true',
      'no-scroll': 'true'
    };
    var template = '<fileimport></fileimport>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);

    // wait for the window to open before clicking the file input. for whatever reason this doesn't work inside
    // the controller constructor (even on a timeout) the first time the directive is compiled but does work every
    // other time. putting it here always works. the delay allows IE compile/display the import dialog since IE will
    // pause the application while a file browser is open.
    var tries = 0;
    var tryClick = function() {
      tries++;

      if (tries < 10) {
        var fileEl = goog.dom.getElement('win-container').querySelector('input[type="file"]');
        if (fileEl) {
          fileEl.click();
        } else {
          setTimeout(tryClick, 100);
        }
      }
    };
    setTimeout(tryClick, 100);
  } else {
    this.dispatchEvent(os.events.EventType.COMPLETE);
  }
};
