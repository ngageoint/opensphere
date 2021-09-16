goog.module('os.ui.tab.Tab');

/**
 * Simple model class representing a pluggable tab.
 * @unrestricted
 */
class Tab {
  /**
   * Constructor.
   * @param {string} id The ID to track the element by
   * @param {string} label The user facing label of the tab
   * @param {string} icon The icon to display
   * @param {string} template The template to compile
   * @param {Object=} opt_data The optional data for the tab
   */
  constructor(id, label, icon, template, opt_data) {
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
  }
}

exports = Tab;
