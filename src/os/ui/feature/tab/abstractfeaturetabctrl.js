goog.provide('os.ui.feature.tab.AbstractFeatureTabCtrl');



/**
 * Abstract controller for feature tabs.
 *
 * @abstract
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 */
os.ui.feature.tab.AbstractFeatureTabCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   */
  this.element = $element;

  // Control is constructed after the first broadcast, so update the tab once after all constructors have executed.
  if (this.scope && this.scope['items'] && this.scope['items'].length > 0) {
    var data = this.scope['items'][0]['data'];
    setTimeout(function() {
      this.updateTab(null, data);
      os.ui.apply(this.scope);
    }.bind(this), 0);
  }

  this.scope.$on(os.ui.feature.FeatureInfoCtrl.UPDATE_TABS, this.updateTab.bind(this));
  this.scope.$on('$destroy', goog.bind(this.destroy, this));
};


/**
 * Clean up.
 *
 * @protected
 */
os.ui.feature.tab.AbstractFeatureTabCtrl.prototype.destroy = function() {
  this.scope = null;
  this.element = null;
};


/**
 * Update the tab content
 *
 * @abstract
 * @param {?angular.Scope.Event} event The broadcast event
 * @param {*} data The event data
 * @protected
 */
os.ui.feature.tab.AbstractFeatureTabCtrl.prototype.updateTab = function(event, data) {};
