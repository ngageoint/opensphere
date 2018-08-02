goog.provide('os.ui.im.ImportEvent');
goog.provide('os.ui.im.ImportEventType');
goog.require('goog.events.Event');
goog.require('os.file.File');


/**
 * @enum {string}
 */
os.ui.im.ImportEventType = {
  FILE: 'importFile',
  URL: 'importUrl'
};



/**
 * File/URL import event.
 * @param {string} type
 * @param {(os.file.File|string)=} opt_fileOrUrl
 * @param {string=} opt_contentHint
 * @param {Object=} opt_config Optional config, giving context to the import process
 * @extends {goog.events.Event}
 * @constructor
 */
os.ui.im.ImportEvent = function(type, opt_fileOrUrl, opt_contentHint, opt_config) {
  os.ui.im.ImportEvent.base(this, 'constructor', type);

  /**
   * @type {?string}
   */
  this.contentHint = opt_contentHint ? opt_contentHint : null;

  /**
   * @type {?os.file.File}
   */
  this.file = opt_fileOrUrl && opt_fileOrUrl instanceof os.file.File ? opt_fileOrUrl : null;

  /**
   * @type {?string}
   */
  this.url = opt_fileOrUrl && goog.isString(opt_fileOrUrl) ? opt_fileOrUrl : null;

  /**
   * @type {?Object}
   */
  this.config = opt_config || null;
};
goog.inherits(os.ui.im.ImportEvent, goog.events.Event);
