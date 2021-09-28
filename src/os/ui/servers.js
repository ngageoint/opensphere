goog.declareModuleId('os.ui.ServersUI');

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import Settings from '../config/settings.js';
import {ProviderKey} from '../data/data.js';
import DataManager from '../data/datamanager.js';
import DataProviderEventType from '../data/dataprovidereventtype.js';
import Metrics from '../metrics/metrics.js';
import {Servers as ServersKeys} from '../metrics/metricskeys.js';
import {ROOT} from '../os.js';
import BaseProvider from './data/baseprovider.js';
import * as AddServer from './file/addserver.js';
import ImportManager from './im/importmanager.js';
import Module from './module.js';
import AbstractLoadingServer from './server/abstractloadingserver.js';
import {apply} from './ui.js';
import * as ConfirmUI from './window/confirm.js';

const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: IDataProvider} = goog.requireType('os.data.IDataProvider');


/**
 * The servers window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/config/servers.html',
  controller: Controller,
  controllerAs: 'servers'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'servers';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for Servers window
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    var dm = DataManager.getInstance();
    dm.listen(DataProviderEventType.ADD_PROVIDER, this.updateData_, false, this);
    dm.listen(DataProviderEventType.REMOVE_PROVIDER, this.updateData_, false, this);
    this.updateData_();

    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Cleanup
   *
   * @private
   */
  onDestroy_() {
    if (this.scope_ && this.scope_['data']) {
      var list = this.scope_['data'];
      for (var i = 0, n = list.length; i < n; i++) {
        /** @type {IDataProvider} */ (list[i]['item']).unlisten(
            GoogEventType.PROPERTYCHANGE, this.onItemChanged_, false, this);
      }
    }

    var dm = DataManager.getInstance();
    dm.unlisten(DataProviderEventType.ADD_PROVIDER, this.updateData_, false, this);
    dm.unlisten(DataProviderEventType.REMOVE_PROVIDER, this.updateData_, false, this);

    this.scope_ = null;
  }

  /**
   * @private
   */
  updateData_() {
    if (!this.scope_) {
      return;
    }

    var list = /** @type {Array.<IDataProvider>} */ (
      DataManager.getInstance().getProviderRoot().getChildren());

    this.scope_['all'] = true;
    var data = [];

    var im = ImportManager.getInstance();
    if (list) {
      var id = 0;
      for (var i = 0, n = list.length; i < n; i++) {
        var item = list[i];

        if (item.includeInServers()) {
          var type = DataManager.getInstance().getProviderTypeByClass(item.constructor);
          var auth = item instanceof BaseProvider ? item.getAuth() : null;
          data.push({
            'id': id,
            'enabled': item.getEnabled(),
            'edit': item.getEditable(),
            'loading': false,
            'error': item.getError(),
            'label': item.getLabel(),
            'item': item,
            'hasView': !!im.getImportUI(type),
            'authLink': auth && auth.link,
            'authTooltip': auth && auth.tooltip
          });

          if (item instanceof AbstractLoadingServer) {
            data[data.length - 1]['loading'] = /** @type {AbstractLoadingServer} */ (item).isLoading();
          }

          if (!item.getEnabled()) {
            this.scope_['all'] = false;
          }

          item.unlisten(GoogEventType.PROPERTYCHANGE, this.onItemChanged_, false, this);
          item.listen(GoogEventType.PROPERTYCHANGE, this.onItemChanged_, false, this);
          id++;
        }
      }
    }

    this.scope_['data'] = data;
    this.apply();
  }

  /**
   * @param {os.events.PropertyChangeEvent} event
   * @private
   */
  onItemChanged_(event) {
    var prop = event.getProperty();

    if (prop === 'loading' || prop === 'error') {
      // update the item icon during load and error conditions
      this.updateData_();
    }
  }

  /**
   * Applies the scope
   *
   * @protected
   */
  apply() {
    apply(this.scope_);
  }

  /**
   * Updates the servers from the UI enabled flag
   *
   * @param {boolean=} opt_prompt
   * @export
   */
  update(opt_prompt) {
    if (!this.scope_) {
      return;
    }

    if (opt_prompt === undefined) {
      opt_prompt = true;
    }

    var list = this.scope_['data'];

    if (list) {
      this.scope_['all'] = true;
      for (var i = 0, n = list.length; i < n; i++) {
        var enabled = list[i]['enabled'];

        var provider = /** @type {IDataProvider} */ (list[i]['item']);
        if (provider.getEnabled() !== enabled) {
          if (!enabled && opt_prompt) {
            // attempting to disable the server, so check if we need to prompt the user first
            if (this.getPrompt_(provider, this.update.bind(this, false), false)) {
              continue;
            }
          }

          // change the value
          DataManager.getInstance().setProviderEnabled(provider.getId(), enabled);

          // if enabling the server, load it now
          if (enabled) {
            provider.load();
          }
        }

        var providerKey = provider.getEditable() ? ProviderKey.USER : ProviderKey.ADMIN;
        Settings.getInstance().set([providerKey, provider.getId(), 'enabled'], enabled);

        if (!enabled) {
          this.checkForActiveDescriptors_(provider, true);
          this.scope_['all'] = false;
        }
      }
    }
  }

  /**
   * @param {IDataProvider} provider
   * @param {function()} callback
   * @param {boolean} remove True for remove, false for disable
   * @return {boolean} Whether or not the prompt was launched
   * @private
   */
  getPrompt_(provider, callback, remove) {
    var titles = this.checkForActiveDescriptors_(provider);
    var msg = null;

    if (titles.length > 0) {
      msg = 'The "' + provider.getLabel() + '" server is currently providing the following active layers:' +
          '<ul><li>' + titles.join('</li><li>') + '</li></ul>Disabling this server will remove these layers. ' +
          'Are you sure you wish to disable the server?';

      if (remove) {
        msg = msg.replace('Disabling', 'Removing');
        msg = msg.replace('disable', 'remove');
      }

      ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
        confirm: callback,
        cancel: this.updateData_.bind(this),
        prompt: msg,
        yesText: 'Yes',
        noText: 'No',
        noIcon: 'fa fa-remove',
        windowOptions: {
          'label': 'Active Layers Exist',
          'icon': 'fa fa-warning',
          'x': 'center',
          'y': 'center',
          'width': '400',
          'height': 'auto',
          'modal': 'true',
          'headerClass': 'bg-warning u-bg-warning-text'
        }
      }));

      return true;
    }

    return false;
  }

  /**
   * @param {IDataProvider} provider
   * @param {boolean=} opt_deactivate
   * @return {!Array.<string>} titles of any active descriptors for this provider
   * @private
   */
  checkForActiveDescriptors_(provider, opt_deactivate) {
    var dm = DataManager.getInstance();
    var descriptors = dm.getDescriptors(provider.getId() + BaseProvider.ID_DELIMITER);
    var titles = [];

    if (descriptors) {
      for (var i = 0, n = descriptors.length; i < n; i++) {
        if (descriptors[i].isActive()) {
          titles.push(descriptors[i].getTitle());

          if (opt_deactivate) {
            descriptors[i].setActive(false);
          }
        }
      }
    }

    return titles;
  }

  /**
   * Toggles all servers
   *
   * @export
   */
  toggleAll() {
    var list = /** @type {Array<Object>} */ (this.scope_['data']);

    if (list) {
      for (var i = 0, n = list.length; i < n; i++) {
        list[i]['enabled'] = this.scope_['all'];
      }

      this.update();
    }
  }

  /**
   * Adds a new server
   *
   * @export
   */
  add() {
    AddServer.launchAddServerWindow();
  }

  /**
   * Edits/Views a server
   *
   * @param {!IDataProvider} provider
   * @export
   */
  edit(provider) {
    var im = ImportManager.getInstance();
    var type = DataManager.getInstance().getProviderTypeByClass(provider.constructor);
    var ui = im.getImportUI(type);
    // Log metric
    if (provider.getEditable()) {
      Metrics.getInstance().updateMetric(ServersKeys.EDIT, 1);
    } else {
      Metrics.getInstance().updateMetric(ServersKeys.VIEW, 1);
    }

    if (ui) {
      ui.launchUI(null, {'provider': provider, 'type': type});
    } else {
      var errorMsg = 'There is no import UI defined for "' + type + '".';

      AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR);
      log.error(logger, errorMsg);
    }
  }

  /**
   * Removes a server
   *
   * @param {!IDataProvider} provider
   * @param {boolean=} opt_prompt
   * @export
   */
  remove(provider, opt_prompt) {
    if (opt_prompt === undefined) {
      opt_prompt = true;
    }
    Metrics.getInstance().updateMetric(ServersKeys.REMOVE, 1);
    var titles = this.checkForActiveDescriptors_(provider, !opt_prompt);

    if (titles.length > 0 && opt_prompt) {
      if (this.getPrompt_(provider, this.remove.bind(this, provider, false), true)) {
        return;
      }
    }
    var descList = DataManager.getInstance().getDescriptors(provider.getId() + BaseProvider.ID_DELIMITER);
    for (var i = 0, ii = descList.length; i < ii; i++) {
      DataManager.getInstance().removeDescriptor(descList[i]);
    }
    Settings.getInstance().delete([ProviderKey.USER, provider.getId()]);

    DataManager.getInstance().removeProvider(provider.getId());
    log.info(logger, 'Removed provider "' + provider.getLabel() + '"');
  }

  /**
   * Refreshes a server
   *
   * @param {!IDataProvider} provider
   * @export
   */
  refresh(provider) {
    log.info(logger, 'Refreshing provider "' + provider.getLabel() + '"');
    Metrics.getInstance().updateMetric(ServersKeys.REFRESH, 1);
    if (provider instanceof AbstractLoadingServer) {
      if (!(provider).isLoading()) {
        provider.load(true);
      }
    } else {
      provider.load(true);
    }
  }
}

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.ServersUI');
