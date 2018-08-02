goog.provide('os.data.ProviderEntry');

goog.require('os.data.IDataProvider');



/**
 * An entry for the provider registry in the data manager
 * @param {!string} type The type
 * @param {!function()} clazz The class
 * @param {!string} title The title
 * @param {?string} desc The description
 * @param {?string=} opt_ui The directive HTML for creating a new provider of this type
 * @param {function(os.file.File):number=} opt_fileDetection The function used
 *  for detecting if a file matches this provider type
 * @constructor
 */
os.data.ProviderEntry = function(type, clazz, title, desc, opt_ui, opt_fileDetection) {
  /**
   * The provider type
   * @type {!string}
   */
  this.type = type.toLowerCase();

  /**
   * The class
   * @type {!function(new:os.data.IDataProvider)}
   */
  this.clazz = clazz;

  /**
   * The title
   * @type {!string}
   */
  this.title = title;

  /**
   * The description
   * @type {?string}
   */
  this.desc = desc;

  /**
   * The add UI
   * @type {?string}
   */
  this.ui = opt_ui || null;

  /**
   * @type {?function(os.file.File):number}
   */
  this.fileDetection = opt_fileDetection || null;
};
