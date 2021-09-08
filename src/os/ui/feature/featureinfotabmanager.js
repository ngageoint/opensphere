goog.module('os.ui.feature.FeatureInfoTabManager');

const DescriptionTabUI = goog.require('os.ui.feature.tab.DescriptionTabUI');
const PropertiesTabUI = goog.require('os.ui.feature.tab.PropertiesTabUI');
const descriptionEnableFunction = goog.require('os.ui.feature.tab.descriptionEnableFunction');
const FeatureTab = goog.require('os.ui.tab.FeatureTab');


/**
 * Tab manager for the feature info
 * @unrestricted
 */
class FeatureInfoTabManager {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * Array of tabs to show.
     * @type {Array<FeatureTab>}
     */
    this['registeredTabs'] = FeatureInfoTabManager.TABS;
  }

  /**
   * Retrieve a copy of the registered tabs
   *
   * @return {Array<FeatureTab>} clone of the registered tabs
   */
  getTabs() {
    return this['registeredTabs'];
  }

  /**
   * Register a tab with the tab manager
   *
   * @param {FeatureTab} tab The tab to register
   */
  registerTab(tab) {
    if (tab) {
      this['registeredTabs'].push(tab);
    }
  }

  /**
   * Get the global instance.
   * @return {!FeatureInfoTabManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new FeatureInfoTabManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {FeatureInfoTabManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {FeatureInfoTabManager|undefined}
 */
let instance;

/**
 * The default properties tab.
 * @type {FeatureTab}
 */
FeatureInfoTabManager.PROPERTIES_TAB = new FeatureTab('props', 'Properties', 'fa-th', PropertiesTabUI.directiveTag);

/**
 * The description tab.
 * @type {FeatureTab}
 */
FeatureInfoTabManager.DESCRIPTION_TAB = new FeatureTab('desc', 'Description', 'fa-newspaper-o',
    DescriptionTabUI.directiveTag, null, descriptionEnableFunction);

/**
 * Array of tabs to show on this mashup.
 * @type {Array<FeatureTab>}
 */
FeatureInfoTabManager.TABS = [
  FeatureInfoTabManager.PROPERTIES_TAB,
  FeatureInfoTabManager.DESCRIPTION_TAB
];

exports = FeatureInfoTabManager;
