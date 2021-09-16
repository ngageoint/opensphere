goog.module('os.ui.AddDataUI');

const {ROOT} = goog.require('os');
const dispatcher = goog.require('os.Dispatcher');
const Settings = goog.require('os.config.Settings');
const DataManager = goog.require('os.data.DataManager');
const DataProviderEventType = goog.require('os.data.DataProviderEventType');
const DateGroupBy = goog.require('os.data.groupby.DateGroupBy');
const RecentGroupBy = goog.require('os.data.groupby.RecentGroupBy');
const TypeGroupBy = goog.require('os.data.groupby.TypeGroupBy');
const Metrics = goog.require('os.metrics.Metrics');
const {AddData} = goog.require('os.metrics.keys');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const AddDataCtrl = goog.require('os.ui.data.AddDataCtrl');
const TagGroupBy = goog.require('os.ui.data.groupby.TagGroupBy');
const UIEventParams = goog.require('os.ui.events.UIEventParams');
const ImportEventType = goog.require('os.ui.im.ImportEventType');
const {openWindow} = goog.require('os.ui.menu.windows');
const {openServers} = goog.require('os.ui.menu.windows.default');
const OnboardingManager = goog.require('os.ui.onboarding.OnboardingManager');
const FavoriteManager = goog.require('os.user.settings.FavoriteManager');

const DataProviderEvent = goog.requireType('os.data.DataProviderEvent');
const INodeGroupBy = goog.requireType('os.data.groupby.INodeGroupBy');


/**
 * The Add Data window directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/windows/adddata.html',
  controller: Controller,
  controllerAs: 'addData'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'adddata';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for Add Data Window
 * @unrestricted
 */
class Controller extends AddDataCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * @type {boolean}
     */
    this['showServerAlert'] = DataManager.getInstance().hasError();

    var om = OnboardingManager.getInstance();
    if (om) {
      om.displayOnboarding(ROOT + 'onboarding/adddata.json');
    }

    /**
     * Name of the filter displayed on the UI when a filter is applied
     * @type {?string}
     */
    $scope['filterName'] = null;

    $scope['openServers'] = openServers;
    $scope['openAlerts'] = openWindow.bind(undefined, 'alerts');

    $scope.$on('os.ui.window.params', this.onParamsChange_.bind(this));

    DataManager.getInstance().listen(DataProviderEventType.LOADED, this.checkServerError_, false, this);
    DataManager.getInstance().listen(DataProviderEventType.EDIT_PROVIDER, this.checkServerError_, false, this);
    DataManager.getInstance().listen(DataProviderEventType.REMOVE_PROVIDER, this.checkServerError_, false, this);

    // refresh on changed favorites
    Settings.getInstance().listen(FavoriteManager.KEY, this.search, false, this);
  }

  /**
   * @inheritDoc
   */
  onDestroy() {
    DataManager.getInstance().unlisten(DataProviderEventType.LOADED, this.checkServerError_, false, this);
    DataManager.getInstance().unlisten(DataProviderEventType.EDIT_PROVIDER, this.checkServerError_, false, this);
    DataManager.getInstance().unlisten(DataProviderEventType.REMOVE_PROVIDER, this.checkServerError_, false, this);

    Settings.getInstance().unlisten(FavoriteManager.KEY, this.search, false, this);

    super.onDestroy();
  }

  /**
   * @inheritDoc
   */
  getGroupBys() {
    return Controller.VIEWS;
  }

  /**
   * Check if any enabled providers encountered an error while loading and display a message to the user if it hasn't
   * already been seen.
   *
   * @param {DataProviderEvent=} opt_event The data provider event
   * @private
   */
  checkServerError_(opt_event) {
    if (this.scope) {
      var provider = opt_event ? opt_event.dataProvider : null;
      if (provider && !provider.getError()) {
        // if the provider event that triggered this was not in an error state, don't do anything
        return;
      }

      this['showServerAlert'] = DataManager.getInstance().hasError();
      apply(this.scope);
    }
  }

  /**
   * Dismiss the server alert and do not show it again.
   *
   * @export
   */
  dismissServerAlert() {
    this['showServerAlert'] = false;
  }

  /**
   * Toggles the add data drop-down menu.
   *
   * @export
   */
  launchFileImport() {
    Metrics.getInstance().updateMetric(AddData.IMPORT, 1);
    dispatcher.getInstance().dispatchEvent(ImportEventType.FILE);
  }

  /**
   * Handle params change event
   *
   * @param {!angular.Scope.Event} event
   * @param {Object} params
   * @private
   */
  onParamsChange_(event, params) {
    if (params[UIEventParams.FILTER_FUNC]) {
      this.setFilterFunction(params[UIEventParams.FILTER_FUNC]);
      this.scope['filterName'] = params[UIEventParams.FILTER_NAME];
    }
    // this.updateSize_(!!params[UIEventParams.FILTER_FUNC]);
  }

  /**
   * Clear the filter function
   *
   * @export
   */
  clearFilter() {
    this.scope['filterName'] = null;
    this.setFilterFunction(null);
    // this.updateSize_(false);
  }
}

/**
 * The view options for choosing layers
 * @type {!Object<string, ?INodeGroupBy>}
 */
Controller.VIEWS = {
  'Recently Updated': new DateGroupBy(),
  'Recently Used': new RecentGroupBy(),
  'Tag': new TagGroupBy(),
  'Type': new TypeGroupBy(),
  'Source': -1 // you can't use null because Angular treats that as the empty/unselected option
};

exports = {
  Controller,
  directive,
  directiveTag
};
