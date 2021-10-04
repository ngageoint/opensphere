goog.declareModuleId('os.ui.feature.FeatureInfoEvent');

/**
 * Events emitted by the feature info window.
 * @enum {string}
 */
const FeatureInfoEvent = {
  // Angular event type for switching the view to the description tab.
  SHOW_DESCRIPTION: 'os.ui.feature.FeatureInfoUI.showDescription',
  // Angular event type for updating all tabs.
  UPDATE_TABS: 'os.ui.feature.FeatureInfoUI.updateTabs'
};

export default FeatureInfoEvent;
