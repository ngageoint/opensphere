goog.declareModuleId('os.ui.AddDataUI');

import Settings from '../config/settings.js';
import DataManager from '../data/datamanager.js';
import DataProviderEventType from '../data/dataprovidereventtype.js';
import DateGroupBy from '../data/groupby/dategroupby.js';
import RecentGroupBy from '../data/groupby/recentgroupby.js';
import TypeGroupBy from '../data/groupby/typegroupby.js';
import * as dispatcher from '../dispatcher.js';
import Metrics from '../metrics/metrics.js';
import {AddData} from '../metrics/metricskeys.js';
import {ROOT} from '../os.js';
import FavoriteManager from '../user/settings/favoritemanager.js';
import AddDataCtrl from './data/adddatactrl.js';
import TagGroupBy from './data/groupby/taggroupby.js';
import UIEventParams from './events/uieventparams.js';
import ImportEventType from './im/importeventtype.js';
import {openServers} from './menu/defaultwindowsmenu.js';
import {openWindow} from './menu/windowsmenu.js';
import Module from './module.js';
import OnboardingManager from './onboarding/onboardingmanager.js';
import {apply} from './ui.js';

const {default: DataProviderEvent} = goog.requireType('os.data.DataProviderEvent');
const {default: INodeGroupBy} = goog.requireType('os.data.groupby.INodeGroupBy');


/**
 * The Add Data window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
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
export const directiveTag = 'adddata';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for Add Data Window
 * @unrestricted
 */
export class Controller extends AddDataCtrl {
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
