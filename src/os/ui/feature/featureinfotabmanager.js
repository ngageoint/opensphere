goog.provide('os.ui.feature.FeatureInfoTabManager');

goog.require('goog.object');
goog.require('os.ui.feature.tab.descriptionEnableFunction');
goog.require('os.ui.feature.tab.descriptionTabDirective');
goog.require('os.ui.feature.tab.propertiesTabDirective');
goog.require('os.ui.tab.Tab');



/**
 * Tab manager for the feature info
 * @constructor
 */
os.ui.feature.FeatureInfoTabManager = function() {
  /**
   * Array of tabs to show.
   * @type {Array.<os.ui.tab.Tab>}
   */
  this['registeredTabs'] = os.ui.feature.FeatureInfoTabManager.TABS;
};
goog.addSingletonGetter(os.ui.feature.FeatureInfoTabManager);


/**
 * The default properties tab.
 * @type {os.ui.tab.Tab}
 */
os.ui.feature.FeatureInfoTabManager.PROPERTIES_TAB = new os.ui.tab.Tab('props', 'Properties', 'fa-th', 'propertiestab');


/**
 * The description tab.
 * @type {os.ui.tab.Tab}
 */
os.ui.feature.FeatureInfoTabManager.DESCRIPTION_TAB = new
    os.ui.tab.Tab('desc', 'Description', 'fa-newspaper-o', 'descriptiontab',
        null, os.ui.feature.tab.descriptionEnableFunction);


/**
 * Array of tabs to show on this mashup.
 * @type {Array.<os.ui.tab.Tab>}
 */
os.ui.feature.FeatureInfoTabManager.TABS = [
  os.ui.feature.FeatureInfoTabManager.PROPERTIES_TAB,
  os.ui.feature.FeatureInfoTabManager.DESCRIPTION_TAB
];


/**
 * Retrieve a copy of the registered tabs
 * @return {Array.<os.ui.tab.Tab>} clone of the registered tabs
 */
os.ui.feature.FeatureInfoTabManager.prototype.getTabs = function() {
  return goog.object.unsafeClone(this['registeredTabs']);
};


/**
 * Register a tab with the tab manager
 * @param {os.ui.tab.Tab} tab The tab to register
 */
os.ui.feature.FeatureInfoTabManager.prototype.registerTab = function(tab) {
  if (tab) {
    this['registeredTabs'].push(tab);
  }
};
