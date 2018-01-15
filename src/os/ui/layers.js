goog.provide('os.ui.LayersCtrl');
goog.provide('os.ui.layersDirective');

goog.require('goog.async.Delay');
goog.require('goog.object');
goog.require('os.MapContainer');
goog.require('os.config.Settings');
goog.require('os.data.LayerNode');
goog.require('os.data.LayerTreeSearch');
goog.require('os.data.groupby.DateGroupBy');
goog.require('os.data.groupby.FavoriteGroupBy');
goog.require('os.data.groupby.LayerProviderGroupBy');
goog.require('os.data.groupby.LayerTypeGroupBy');
goog.require('os.data.groupby.LayerZOrderGroupBy');
goog.require('os.data.groupby.TagListGroupBy');
goog.require('os.defines');
goog.require('os.events.LayerEventType');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');
goog.require('os.object');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.data.groupby.TagGroupBy');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.events.UIEventType');
goog.require('os.ui.layer.defaultLayerUIDirective');
goog.require('os.ui.layerTreeDirective');
goog.require('os.ui.menu.import');
goog.require('os.ui.menu.layer');
goog.require('os.ui.menu.windows');
goog.require('os.ui.slick.AbstractGroupByTreeSearchCtrl');
goog.require('os.ui.uiSwitchDirective');
goog.require('os.ui.util.autoHeightDirective');
goog.require('plugin.places.ui.placesDirective');


/**
 * The layers directive
 * @return {angular.Directive}
 */
os.ui.layersDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/layers.html',
    controller: os.ui.LayersCtrl,
    controllerAs: 'layers'
  };
};


/**
 * The layers window directive
 * @return {angular.Directive}
 */
os.ui.layersWindowDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'tab': '@'
    },
    templateUrl: os.ROOT + 'views/windows/layers.html'
  };
};


/**
 * Add the directives to the module
 */
os.ui.Module.directive('layers', [os.ui.layersDirective]);
os.ui.Module.directive('layerswin', [os.ui.layersWindowDirective]);



/**
 * Controller for Layers window
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {os.ui.slick.AbstractGroupByTreeSearchCtrl}
 * @constructor
 * @ngInject
 */
os.ui.LayersCtrl = function($scope, $element) {
  os.ui.LayersCtrl.base(this, 'constructor', $scope, $element, 200);

  this.title = 'layers';
  try {
    this.scope['contextMenu'] = os.ui.menu.layer.MENU;
  } catch (e) {
  }

  this.scope['views'] = os.ui.LayersCtrl.VIEWS;
  this.viewDefault = 'Z-Order';

  /**
   * @type {?os.data.LayerTreeSearch}
   */
  this.treeSearch = new os.data.LayerTreeSearch('layerTree', $scope);

  /**
   * @type {!Object<string, !os.ui.menu.Menu>}
   * @private
   */
  this.menus_ = {};

  if (os.ui.menu.import.MENU) {
    this.menus_['.add-data-group'] = os.ui.menu.import.MENU;
  }

  var map = os.MapContainer.getInstance();
  map.listen(os.events.LayerEventType.ADD, this.search, false, this);
  map.listen(os.events.LayerEventType.REMOVE, this.search, false, this);

  // refresh on changed favorites
  os.settings.listen(os.user.settings.FavoriteManager.KEY, this.search, false, this);

  this.init();
};
goog.inherits(os.ui.LayersCtrl, os.ui.slick.AbstractGroupByTreeSearchCtrl);


/**
 * The view options for grouping layers
 * @type {!Object<string, os.data.groupby.INodeGroupBy>}
 */
os.ui.LayersCtrl.VIEWS = {
  'Favorites': new os.data.groupby.FavoriteGroupBy(),
  'INT': new os.data.groupby.TagListGroupBy(true),
  'Recently Updated': new os.data.groupby.DateGroupBy(true),
  'Source': new os.data.groupby.LayerProviderGroupBy(),
  'Tag': new os.ui.data.groupby.TagGroupBy(true),
  'Type': new os.data.groupby.LayerTypeGroupBy(),
  'Z-Order': new os.data.groupby.LayerZOrderGroupBy()
};


/**
 * @inheritDoc
 */
os.ui.LayersCtrl.prototype.destroy = function() {
  var map = os.MapContainer.getInstance();
  map.unlisten(os.events.LayerEventType.ADD, this.search, false, this);
  map.unlisten(os.events.LayerEventType.REMOVE, this.search, false, this);

  os.settings.unlisten(os.user.settings.FavoriteManager.KEY, this.search, false, this);

  os.ui.LayersCtrl.base(this, 'destroy');
};


/**
 * Closes the window
 */
os.ui.LayersCtrl.prototype.close = function() {
  os.ui.window.close(this.element);
};


/**
 * Change event handler for the groupBy control
 */
os.ui.LayersCtrl.prototype.onGroupByChanged = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.AddData.GROUP_BY, 1);
  this.search();
};
goog.exportProperty(os.ui.LayersCtrl.prototype, 'onGroupByChanged',
    os.ui.LayersCtrl.prototype.onGroupByChanged);


/**
 * @param {*} item
 * @return {?string}
 */
os.ui.LayersCtrl.prototype.getUi = function(item) {
  if (item && item instanceof os.data.LayerNode) {
    var node = /** @type {os.data.LayerNode} */ (item);
    var l = node.getLayer();

    return l.getLayerUI() || 'defaultlayerui';
  }

  return null;
};
goog.exportProperty(os.ui.LayersCtrl.prototype, 'getUi', os.ui.LayersCtrl.prototype.getUi);


/**
 * Checks if a window is open in the application
 * @param {string} flag The window id
 * @return {boolean}
 */
os.ui.LayersCtrl.prototype.isWindowActive = function(flag) {
  var s = angular.element('#win-container').scope();
  var result = s['mainCtrl'][flag];

  if (result) {
    return true;
  }

  return !!angular.element('div[label="' + flag + '"].window').length;
};
goog.exportProperty(os.ui.LayersCtrl.prototype, 'isWindowActive', os.ui.LayersCtrl.prototype.isWindowActive);


/**
 * Opens the specified menu.
 * @param {string} selector The menu target selector.
 */
os.ui.LayersCtrl.prototype.openMenu = function(selector) {
  var menu = this.menus_[selector];
  if (menu) {
    var target = this.element.find(selector);
    if (target && target.length > 0) {
      this.scope['menu'] = selector;
      os.dispatcher.listenOnce(os.ui.GlobalMenuEventType.MENU_CLOSE, this.onMenuClose, false, this);

      menu.open(undefined, {
        my: 'left top',
        at: 'left bottom',
        of: target
      });
    }
  }
};
goog.exportProperty(os.ui.LayersCtrl.prototype, 'openMenu', os.ui.LayersCtrl.prototype.openMenu);


/**
 * Handle menu close event.
 * @param {goog.events.Event} evt The event.
 * @protected
 */
os.ui.LayersCtrl.prototype.onMenuClose = function(evt) {
  this.scope['menu'] = null;
};


/**
 * Toggles a flag on mainCtrl
 * @param {string} flagName The name of the flag to toggle
 */
os.ui.LayersCtrl.prototype.toggle = function(flagName) {
  if (!os.ui.menu.windows.openWindow(flagName)) {
    var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, flagName);
    os.dispatcher.dispatchEvent(event);
  }
};
goog.exportProperty(os.ui.LayersCtrl.prototype, 'toggle', os.ui.LayersCtrl.prototype.toggle);
