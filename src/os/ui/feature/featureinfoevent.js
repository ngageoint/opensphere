goog.module('os.ui.feature.FeatureInfoEvent');
goog.module.declareLegacyNamespace();

/**
 * Events emitted by the feature info window.
 * @enum {string}
 */
exports = {
  // Angular event type for switching the view to the description tab.
  SHOW_DESCRIPTION: 'os.ui.feature.FeatureInfoCtrl.showDescription',
  // Angular event type for updating all tabs.
  UPDATE_TABS: 'os.ui.feature.FeatureInfoCtrl.updateTabs'
};
