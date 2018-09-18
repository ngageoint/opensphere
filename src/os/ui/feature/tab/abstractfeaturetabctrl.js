goog.provide('os.ui.feature.tab.AbstractFeatureTabCtrl');



/**
 * Abstract controller for feature tabs.
 * @constructor
 * @ngInject
 */
os.ui.feature.tab.AbstractFeatureTabCtrl = function() {
  goog.asserts.assert(this.scope != null);

  // Control is constructed after the first broadcast
  // so the description need to be updated once during construction
  if (this.scope && this.scope['items'] && this.scope['items'].length > 0) {
    this.updateTab(null, this.scope['items'][0]['data']);
  }

  this.scope.$on(os.ui.feature.FeatureInfoCtrl.UPDATE_TABS, this.updateTab.bind(this));
  this.scope.$on('$destroy', goog.bind(this.destroy, this));
};


/**
 * Clean up.
 * @protected
 */
os.ui.feature.tab.AbstractFeatureTabCtrl.prototype.destroy = function() {
  this.scope = null;
  this.element = null;
};


/**
 * Update the tab content
 * @param {?angular.Scope.Event} event The broadcast event
 * @param {*} data The event data
 * @protected
 */
os.ui.feature.tab.AbstractFeatureTabCtrl.prototype.updateTab = goog.abstractMethod;
