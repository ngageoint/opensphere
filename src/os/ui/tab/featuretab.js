goog.provide('os.ui.tab.FeatureTab');

goog.require('ol.Feature');
goog.require('os.ui.tab.Tab');



/**
 * Model class representing a pluggable feature tab.
 * @param {string} id The ID to track the element by
 * @param {string} label The user facing label of the tab
 * @param {string} icon The icon to display
 * @param {string} template The template to compile
 * @param {Object=} opt_data The optional data for the tab
 * @param {function(ol.Feature, boolean)=} opt_enableFunc The optional tab enable function
 * @extends {os.ui.tab.Tab}
 * @constructor
 */
os.ui.tab.FeatureTab = function(id, label, icon, template, opt_data, opt_enableFunc) {
  os.ui.tab.FeatureTab.base(this, 'constructor', id, label, icon, template, opt_data);

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
goog.inherits(os.ui.tab.FeatureTab, os.ui.tab.Tab);


/**
 * Execute the tab's enable function and return if the tab is shown given the feature
 * @param {ol.Feature} feature The feature represented in the tab
 * @return {boolean} true if the tab is shown
 */
os.ui.tab.FeatureTab.prototype.checkIfEnabled = function(feature) {
  if (this['enableFunc'] != null) {
    this['isShown'] = this['enableFunc'].call(this, feature);
  }
  return this['isShown'];
};
