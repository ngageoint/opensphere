goog.provide('os.data.ProviderEntry');

goog.require('os.data.IDataProvider');



/**
 * An entry for the provider registry in the data manager
 * @param {!string} type The type
 * @param {!function()} clazz The class
 * @param {!string} title The title
 * @param {?string} desc The description
 * @constructor
 */
os.data.ProviderEntry = function(type, clazz, title, desc) {
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
};
