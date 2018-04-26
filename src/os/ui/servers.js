goog.provide('os.ui.ServersCtrl');
goog.provide('os.ui.serversDirective');

goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.config.Settings');
goog.require('os.data.DataManager');
goog.require('os.defines');
goog.require('os.im.ImportProcess');
goog.require('os.metrics');
goog.require('os.metrics.Metrics');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.server.AbstractLoadingServer');
goog.require('os.ui.window');


/**
 * The servers window directive
 * @return {angular.Directive}
 */
os.ui.serversDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/config/servers.html',
    controller: os.ui.ServersCtrl,
    controllerAs: 'servers'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('servers', [os.ui.serversDirective]);



/**
 * Controller for Servers window
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.ServersCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  var dm = os.dataManager;
  dm.listen(os.data.DataProviderEventType.ADD_PROVIDER, this.updateData_, false, this);
  dm.listen(os.data.DataProviderEventType.REMOVE_PROVIDER, this.updateData_, false, this);
  this.updateData_();

  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
os.ui.ServersCtrl.LOGGER_ = goog.log.getLogger('os.ui.ServersCtrl');


/**
 * Cleanup
 * @private
 */
os.ui.ServersCtrl.prototype.onDestroy_ = function() {
  if (this.scope_ && this.scope_['data']) {
    var list = this.scope_['data'];
    for (var i = 0, n = list.length; i < n; i++) {
      /** @type {os.data.IDataProvider} */ (list[i]['item']).unlisten(
          goog.events.EventType.PROPERTYCHANGE, this.onItemChanged_, false, this);
    }
  }

  var dm = os.dataManager;
  dm.unlisten(os.data.DataProviderEventType.ADD_PROVIDER, this.updateData_, false, this);
  dm.unlisten(os.data.DataProviderEventType.REMOVE_PROVIDER, this.updateData_, false, this);

  this.scope_ = null;
};


/**
 * @private
 */
os.ui.ServersCtrl.prototype.updateData_ = function() {
  if (!this.scope_) {
    return;
  }

  var list = /** @type {Array.<os.data.IDataProvider>} */ (
      os.dataManager.getProviderRoot().getChildren());

  this.scope_['all'] = true;
  var data = [];

  if (list) {
    var id = 0;
    for (var i = 0, n = list.length; i < n; i++) {
      var item = list[i];

      if (item.includeInServers()) {
        data.push({
          'id': id,
          'enabled': item.getEnabled(),
          'edit': item.getEditable(),
          'loading': false,
          'error': item.getError(),
          'label': item.getLabel(),
          'item': item
        });

        if (item instanceof os.ui.server.AbstractLoadingServer) {
          data[data.length - 1]['loading'] = /** @type {os.ui.server.AbstractLoadingServer} */ (item).isLoading();
        }

        if (!item.getEnabled()) {
          this.scope_['all'] = false;
        }

        item.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onItemChanged_, false, this);
        item.listen(goog.events.EventType.PROPERTYCHANGE, this.onItemChanged_, false, this);
        id++;
      }
    }
  }

  this.scope_['data'] = data;
  this.apply();
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.ui.ServersCtrl.prototype.onItemChanged_ = function(event) {
  var prop = event.getProperty();

  if (prop === 'loading' || prop === 'error') {
    // update the item icon during load and error conditions
    this.updateData_();
  }
};


/**
 * Applies the scope
 * @protected
 */
os.ui.ServersCtrl.prototype.apply = function() {
  os.ui.apply(this.scope_);
};


/**
 * Updates the servers from the UI enabled flag
 * @param {boolean=} opt_prompt
 */
os.ui.ServersCtrl.prototype.update = function(opt_prompt) {
  if (!this.scope_) {
    return;
  }

  if (!goog.isDef(opt_prompt)) {
    opt_prompt = true;
  }

  var list = this.scope_['data'];

  if (list) {
    this.scope_['all'] = true;
    for (var i = 0, n = list.length; i < n; i++) {
      var enabled = list[i]['enabled'];

      var provider = /** @type {os.data.IDataProvider} */ (list[i]['item']);
      if (provider.getEnabled() !== enabled) {
        if (!enabled && opt_prompt) {
          // attempting to disable the server, so check if we need to prompt the user first
          if (this.getPrompt_(provider, this.update.bind(this, false), false)) {
            continue;
          }
        }

        // change the value
        os.dataManager.setProviderEnabled(provider.getId(), enabled);

        // if enabling the server, load it now
        if (enabled) {
          provider.load();
        }
      }

      os.settings.set([
        provider.getEditable() ? 'userProviders' : 'providers', provider.getId(), 'enabled'], enabled);

      if (!enabled) {
        this.checkForActiveDescriptors_(provider, true);
        this.scope_['all'] = false;
      }
    }
  }
};
goog.exportProperty(os.ui.ServersCtrl.prototype, 'update', os.ui.ServersCtrl.prototype.update);


/**
 * @param {os.data.IDataProvider} provider
 * @param {function()} callback
 * @param {boolean} remove True for remove, false for disable
 * @return {boolean} Whether or not the prompt was launched
 * @private
 */
os.ui.ServersCtrl.prototype.getPrompt_ = function(provider, callback, remove) {
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

    os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
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
};


/**
 * @param {os.data.IDataProvider} provider
 * @param {boolean=} opt_deactivate
 * @return {!Array.<string>} titles of any active descriptors for this provider
 * @private
 */
os.ui.ServersCtrl.prototype.checkForActiveDescriptors_ = function(provider, opt_deactivate) {
  var dm = os.dataManager;
  var descriptors = dm.getDescriptors(provider.getId() + os.ui.data.BaseProvider.ID_DELIMITER);
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
};


/**
 * Toggles all servers
 */
os.ui.ServersCtrl.prototype.toggleAll = function() {
  var list = /** @type {Array.<os.data.IDataProvider>} */ (this.scope_['data']);

  if (list) {
    for (var i = 0, n = list.length; i < n; i++) {
      list[i]['enabled'] = this.scope_['all'];
    }

    this.update();
  }
};
goog.exportProperty(os.ui.ServersCtrl.prototype, 'toggleAll', os.ui.ServersCtrl.prototype.toggleAll);


/**
 * Adds a new server
 */
os.ui.ServersCtrl.prototype.add = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.Servers.ADD_SERVER, 1);
  var importProcess = new os.im.ImportProcess();
  importProcess.setEvent(new os.ui.im.ImportEvent(os.ui.im.ImportEventType.URL));
  importProcess.begin();
};
goog.exportProperty(os.ui.ServersCtrl.prototype, 'add', os.ui.ServersCtrl.prototype.add);


/**
 * Edits/Views a server
 * @param {!os.data.IDataProvider} provider
 */
os.ui.ServersCtrl.prototype.edit = function(provider) {
  var im = os.ui.im.ImportManager.getInstance();
  var type = os.dataManager.getProviderTypeByClass(provider.constructor);
  var ui = im.getImportUI(type);
  // Log metric
  if (provider.getEditable()) {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.Servers.EDIT, 1);
  } else {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.Servers.VIEW, 1);
  }

  if (ui) {
    ui.launchUI(null, {'provider': provider, 'type': type});
  } else {
    var errorMsg = 'There is no import UI defined for "' + type + '".';

    os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR);
    goog.log.error(os.ui.ServersCtrl.LOGGER_, errorMsg);
  }
};
goog.exportProperty(os.ui.ServersCtrl.prototype, 'edit', os.ui.ServersCtrl.prototype.edit);


/**
 * Removes a server
 * @param {!os.data.IDataProvider} provider
 * @param {boolean=} opt_prompt
 */
os.ui.ServersCtrl.prototype.remove = function(provider, opt_prompt) {
  if (!goog.isDef(opt_prompt)) {
    opt_prompt = true;
  }
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.Servers.REMOVE, 1);
  var titles = this.checkForActiveDescriptors_(provider, !opt_prompt);

  if (titles.length > 0 && opt_prompt) {
    if (this.getPrompt_(provider, this.remove.bind(this, provider, false), true)) {
      return;
    }
  }

  os.settings.delete(['userProviders', provider.getId()]);

  os.dataManager.removeProvider(provider.getId());
  goog.log.info(os.ui.ServersCtrl.LOGGER_, 'Removed provider "' + provider.getLabel() + '"');
};
goog.exportProperty(os.ui.ServersCtrl.prototype, 'remove', os.ui.ServersCtrl.prototype.remove);


/**
 * Refreshes a server
 * @param {!os.data.IDataProvider} provider
 */
os.ui.ServersCtrl.prototype.refresh = function(provider) {
  goog.log.info(os.ui.ServersCtrl.LOGGER_, 'Refreshing provider "' + provider.getLabel() + '"');
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.Servers.REFRESH, 1);
  if (provider instanceof os.ui.server.AbstractLoadingServer) {
    if (!(provider).isLoading()) {
      provider.load(true);
    }
  } else {
    provider.load(true);
  }
};
goog.exportProperty(os.ui.ServersCtrl.prototype, 'refresh', os.ui.ServersCtrl.prototype.refresh);
