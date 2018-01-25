goog.provide('os.ui.AddDataCtrl');
goog.provide('os.ui.addDataDirective');

goog.require('os.data.groupby.DateGroupBy');
goog.require('os.data.groupby.FavoriteGroupBy');
goog.require('os.data.groupby.RecentGroupBy');
goog.require('os.data.groupby.TagListGroupBy');
goog.require('os.data.groupby.TypeGroupBy');
goog.require('os.defines');
goog.require('os.metrics.Metrics');
goog.require('os.ui.Module');
goog.require('os.ui.data.AddDataCtrl');
goog.require('os.ui.data.groupby.TagGroupBy');
goog.require('os.ui.menu.windows');
goog.require('os.ui.menu.windows.default');
goog.require('os.ui.util.autoHeightDirective');


/**
 * The Add Data window directive
 * @return {angular.Directive}
 */
os.ui.addDataDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/windows/adddata.html',
    controller: os.ui.AddDataCtrl,
    controllerAs: 'addData'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('adddata', [os.ui.addDataDirective]);



/**
 * Controller for Add Data Window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.data.AddDataCtrl}
 * @constructor
 * @ngInject
 */
os.ui.AddDataCtrl = function($scope, $element) {
  os.ui.AddDataCtrl.base(this, 'constructor', $scope, $element);

  /**
   * @type {boolean}
   */
  this['showServerAlert'] = os.dataManager.hasError();

  var om = os.ui.onboarding.OnboardingManager.getInstance();
  if (om) {
    om.displayOnboarding(os.ROOT + 'onboarding/adddata.json');
  }

  /**
   * Name of the filter displayed on the UI when a filter is applied
   * @type {?string}
   */
  $scope['filterName'] = null;

  if (os.action && os.ui.menu.windows.default) {
    $scope['openServers'] = os.ui.menu.windows.default.openServers;
  }
  if (os.ui.action && os.ui.menu.windows) {
    $scope['openAlerts'] = os.ui.menu.windows.openWindow.bind(undefined, 'alerts');
  }

  $scope.$on('os.ui.window.params', this.onParamsChange_.bind(this));

  os.dataManager.listen(os.data.DataProviderEventType.LOADED, this.checkServerError_, false, this);
  os.dataManager.listen(os.data.DataProviderEventType.EDIT_PROVIDER, this.checkServerError_, false, this);
  os.dataManager.listen(os.data.DataProviderEventType.REMOVE_PROVIDER, this.checkServerError_, false, this);

  // refresh on changed favorites
  os.settings.listen(os.user.settings.FavoriteManager.KEY, this.search, false, this);
};
goog.inherits(os.ui.AddDataCtrl, os.ui.data.AddDataCtrl);


/**
 * The view options for choosing layers
 * @type {!Object.<string, ?os.data.groupby.INodeGroupBy>}
 */
os.ui.AddDataCtrl.VIEWS = {
  'Favorites': new os.data.groupby.FavoriteGroupBy(),
  'INT': new os.data.groupby.TagListGroupBy(),
  'Recently Updated': new os.data.groupby.DateGroupBy(),
  'Recently Used': new os.data.groupby.RecentGroupBy(),
  'Tag': new os.ui.data.groupby.TagGroupBy(),
  'Type': new os.data.groupby.TypeGroupBy(),
  'Source': -1 // you can't use null because Angular treats that as the empty/unselected option
};


/**
 * @inheritDoc
 */
os.ui.AddDataCtrl.prototype.onDestroy = function() {
  os.dataManager.unlisten(os.data.DataProviderEventType.LOADED, this.checkServerError_, false, this);
  os.dataManager.unlisten(os.data.DataProviderEventType.EDIT_PROVIDER, this.checkServerError_, false, this);
  os.dataManager.unlisten(os.data.DataProviderEventType.REMOVE_PROVIDER, this.checkServerError_, false, this);

  os.settings.unlisten(os.user.settings.FavoriteManager.KEY, this.search, false, this);

  os.ui.AddDataCtrl.base(this, 'onDestroy');
};


/**
 * @inheritDoc
 */
os.ui.AddDataCtrl.prototype.getGroupBys = function() {
  return os.ui.AddDataCtrl.VIEWS;
};


/**
 * Check if any enabled providers encountered an error while loading and display a message to the user if it hasn't
 * already been seen.
 * @param {os.data.DataProviderEvent=} opt_event The data provider event
 * @private
 */
os.ui.AddDataCtrl.prototype.checkServerError_ = function(opt_event) {
  if (this.scope) {
    var provider = opt_event ? opt_event.dataProvider : null;
    if (provider && !provider.getError()) {
      // if the provider event that triggered this was not in an error state, don't do anything
      return;
    }

    this['showServerAlert'] = os.dataManager.hasError();
    os.ui.apply(this.scope);
  }
};


/**
 * Dismiss the server alert and do not show it again.
 */
os.ui.AddDataCtrl.prototype.dismissServerAlert = function() {
  this['showServerAlert'] = false;
};
goog.exportProperty(
    os.ui.AddDataCtrl.prototype,
    'dismissServerAlert',
    os.ui.AddDataCtrl.prototype.dismissServerAlert);


/**
 * Toggles the add data drop-down menu.
 */
os.ui.AddDataCtrl.prototype.launchFileImport = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.AddData.IMPORT, 1);
  os.dispatcher.dispatchEvent(os.ui.im.ImportEventType.FILE);
};
goog.exportProperty(os.ui.AddDataCtrl.prototype, 'launchFileImport', os.ui.AddDataCtrl.prototype.launchFileImport);


/**
 * Handle params change event
 * @param {!angular.Scope.Event} event
 * @param {Object} params
 * @private
 */
os.ui.AddDataCtrl.prototype.onParamsChange_ = function(event, params) {
  if (params[os.ui.events.UIEventParams.FILTER_FUNC]) {
    this.setFilterFunction(params[os.ui.events.UIEventParams.FILTER_FUNC]);
    this.scope['filterName'] = params[os.ui.events.UIEventParams.FILTER_NAME];
  }
  // this.updateSize_(!!params[os.ui.events.UIEventParams.FILTER_FUNC]);
};


/**
 * Clear the filter function
 */
os.ui.AddDataCtrl.prototype.clearFilter = function() {
  this.scope['filterName'] = null;
  this.setFilterFunction(null);
  // this.updateSize_(false);
};
goog.exportProperty(
    os.ui.AddDataCtrl.prototype,
    'clearFilter',
    os.ui.AddDataCtrl.prototype.clearFilter);
