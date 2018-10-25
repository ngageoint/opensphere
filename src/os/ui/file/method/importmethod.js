goog.provide('os.ui.file.method.ImportMethod');
goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.file');
goog.require('os.file.IFileMethod');
goog.require('os.ui.file.importDialogDirective');
goog.require('os.ui.file.method.UrlMethod');
goog.require('os.ui.window');



/**
 * Import method handling both local files and URL's.
 * @param {boolean=} opt_keepFile Whether the file method will keep the original File reference around
 * @extends {os.ui.file.method.UrlMethod}
 * @constructor
 */
os.ui.file.method.ImportMethod = function(opt_keepFile) {
  os.ui.file.method.ImportMethod.base(this, 'constructor');
  this.log = os.ui.file.method.ImportMethod.LOGGER_;

  /**
   * If the File reference should be saved on the {@link os.file.File} instance.
   * @type {boolean}
   * @private
   */
  this.keepFile_ = Boolean(opt_keepFile);
};
goog.inherits(os.ui.file.method.ImportMethod, os.ui.file.method.UrlMethod);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.method.ImportMethod.LOGGER_ = goog.log.getLogger('os.ui.file.method.ImportMethod');


/**
 * @inheritDoc
 */
os.ui.file.method.ImportMethod.prototype.getPriority = function() {
  return 100;
};


/**
 * @inheritDoc
 */
os.ui.file.method.ImportMethod.prototype.clone = function() {
  var other = new this.constructor();
  other.setKeepFile(this.getKeepFile());
  return other;
};


/**
 * If the File reference should be saved on the {@link os.file.File} instance.
 * @return {boolean}
 */
os.ui.file.method.ImportMethod.prototype.getKeepFile = function() {
  return this.keepFile_;
};


/**
 * Set if the File reference should be saved on the {@link os.file.File} instance.
 * @param {boolean} val
 */
os.ui.file.method.ImportMethod.prototype.setKeepFile = function(val) {
  this.keepFile_ = val;
};


/**
 * @inheritDoc
 */
os.ui.file.method.ImportMethod.prototype.loadFile = function(opt_options) {
  var file = this.getFile();
  var url = this.getUrl();
  if (!file && !url) {
    var scopeOptions = {
      'manager': opt_options && opt_options['manager'] || os.ui.im.ImportManager.getInstance(),
      'method': this
    };

    var windowOptions = {
      'id': os.ui.file.method.UrlMethod.ID,
      'label': 'Import Data',
      'icon': 'fa fa-cloud-download',
      'x': 'center',
      'y': 'center',
      'width': '400',
      'min-width': '400',
      'max-width': '400',
      'height': 'auto',
      'modal': 'true',
      'show-close': 'true',
      'no-scroll': 'true'
    };

    var template = '<importdialog manager="manager" method="method"></importdialog>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  } else if (url) {
    this.loadUrl();
  } else if (file) {
    this.dispatchEvent(os.events.EventType.COMPLETE);
  }
};
