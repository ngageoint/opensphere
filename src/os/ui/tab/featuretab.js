goog.declareModuleId('os.ui.tab.FeatureTab');

import Tab from './tab.js';

/**
 * Model class representing a pluggable feature tab.
 * @unrestricted
 */
export default class FeatureTab extends Tab {
  /**
   * Constructor.
   * @param {string} id The ID to track the element by
   * @param {string} label The user facing label of the tab
   * @param {string} icon The icon to display
   * @param {string} template The template to compile
   * @param {Object=} opt_data The optional data for the tab
   * @param {function(Feature, boolean)=} opt_enableFunc The optional tab enable function
   */
  constructor(id, label, icon, template, opt_data, opt_enableFunc) {
    super(id, label, icon, template, opt_data);

    /**
     * @type {boolean}
     */
    this['isShown'] = true;

    /**
     * The function that returns if tab should be shown.
     * @type {?function(*, boolean)}
     */
    this['enableFunc'] = opt_enableFunc;
  }

  /**
   * Execute the tab's enable function and return if the tab is shown given the feature
   *
   * @param {Feature} feature The feature represented in the tab
   * @return {boolean} true if the tab is shown
   */
  checkIfEnabled(feature) {
    if (this['enableFunc'] != null) {
      this['isShown'] = this['enableFunc'].call(this, feature);
    }
    return this['isShown'];
  }
}
