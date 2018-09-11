goog.provide('os.ui.tab.Tab');



/**
 * Simple model class representing a pluggable tab.
 * @param {string} id The ID to track the element by
 * @param {string} label The user facing label of the tab
 * @param {string} icon The icon to display
 * @param {string} template The template to compile
 * @param {Object=} opt_data The optional data for the tab
 * @param {function(Object, boolean)=} opt_enableFunc The optional tab enable function
 * @constructor
 */
os.ui.tab.Tab = function(id, label, icon, template, opt_data, opt_enableFunc) {
  /**
   * @type {string}
   */
  this['id'] = id;

  /**
   * @type {string}
   */
  this['label'] = label;

  /**
   * @type {string}
   */
  this['icon'] = icon;

  /**
   * @type {string}
   */
  this['template'] = template;

  /**
   * @type {*}
   */
  this['data'] = opt_data || null;

  /**
   * @type {boolean}
   */
  this['isShown'] = true;

  /**
   * The function that returns if tab should be shown.
   * @type {?function(*, boolean)}
   */
  this['enableFunc'] = opt_enableFunc;
};
