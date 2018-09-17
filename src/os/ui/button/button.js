goog.provide('os.ui.button.Button');



/**
 * Simple model class representing a button.
 * @param {!Function} clickFunc The function executed when the button is clicked
 * @param {?string} title The button on hover text
 * @param {?string} icon The icon to display
 * @param {?string} text The text displayed on the button.
 * @constructor
 */
os.ui.button.Button = function(clickFunc, title, icon, text) {
  /**
   * @type {!Function}
   */
  this['clickFunc'] = clickFunc;

  /**
   * @type {?string}
   */
  this['title'] = title || '';

  /**
   * @type {?string}
   */
  this['icon'] = icon || '';


  /**
   * @type {?string}
   */
  this['text'] = text || '';
};
