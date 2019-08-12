goog.provide('os.ui.LayersCtrl');
goog.provide('os.ui.LayersWindowCtrl');
goog.provide('os.ui.layersDirective');

goog.require('goog.Disposable');
goog.require('goog.async.Delay');
goog.require('goog.object');
goog.require('os.MapContainer');
goog.require('os.config.Settings');
goog.require('os.data.LayerNode');
goog.require('os.data.LayerTreeSearch');
goog.require('os.data.groupby.DateGroupBy');
goog.require('os.data.groupby.LayerProviderGroupBy');
goog.require('os.data.groupby.LayerTypeGroupBy');
goog.require('os.data.groupby.LayerZOrderGroupBy');
goog.require('os.defines');
goog.require('os.events.LayerEventType');
goog.require('os.layer.ICustomLayerVisible');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');
goog.require('os.object');
goog.require('os.query');
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
goog.require('os.ui.windowSelector');
goog.require('plugin.places.ui.placesDirective');


/**
 * The layers directive
 *
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
 *
 * @return {angular.Directive}
 */
os.ui.layersWindowDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'tab': '@'
    },
    controller: os.ui.LayersWindowCtrl,
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
 *
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
  map.listen(os.events.LayerEventType.CHANGE, this.search, false, this);

  // refresh on changed favorites
  os.settings.listen(os.user.settings.FavoriteManager.KEY, this.search, false, this);

  this.scope['showTiles'] = true;
  this.scope['showFeatures'] = true;
  this.scope['tilesBtnIcon'] = os.ROOT + 'images/tiles-base.png';
  this.scope['featuresBtnIcon'] = os.ROOT + 'images/features-base.png';

  this.init();
};
goog.inherits(os.ui.LayersCtrl, os.ui.slick.AbstractGroupByTreeSearchCtrl);


/**
 * The functions to be called to determine if the layer should not be toggled
* @type {Array<function(!ol.layer.Layer):boolean>}
*/
os.ui.LayersCtrl.SKIP_TOGGLE_FUNCS = [];


/**
 * The view options for grouping layers
 * @type {!Object<string, os.data.groupby.INodeGroupBy>}
 */
os.ui.LayersCtrl.VIEWS = {
  'Recently Updated': new os.data.groupby.DateGroupBy(true),
  'Source': new os.data.groupby.LayerProviderGroupBy(),
  'Tag': new os.ui.data.groupby.TagGroupBy(true),
  'Type': new os.data.groupby.LayerTypeGroupBy(),
  'Z-Order': new os.data.groupby.LayerZOrderGroupBy()
};


/**
 * @inheritDoc
 */
os.ui.LayersCtrl.prototype.disposeInternal = function() {
  var map = os.MapContainer.getInstance();
  map.unlisten(os.events.LayerEventType.ADD, this.search, false, this);
  map.unlisten(os.events.LayerEventType.REMOVE, this.search, false, this);
  map.unlisten(os.events.LayerEventType.CHANGE, this.search, false, this);

  os.settings.unlisten(os.user.settings.FavoriteManager.KEY, this.search, false, this);

  os.ui.LayersCtrl.base(this, 'disposeInternal');
};


/**
 * Closes the window
 */
os.ui.LayersCtrl.prototype.close = function() {
  os.ui.window.close(this.element);
};


/**
 * Change event handler for the groupBy control
 *
 * @export
 */
os.ui.LayersCtrl.prototype.onGroupByChanged = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.AddData.GROUP_BY, 1);
  this.search();
};


/**
 * @param {*} item
 * @return {?string}
 * @export
 */
os.ui.LayersCtrl.prototype.getUi = function(item) {
  if (item && os.implements(item, os.ui.ILayerUIProvider.ID)) {
    return item.getLayerUI(item);
  }

  return null;
};


/**
 * Checks if a window is open in the application
 *
 * @param {string} flag The window id
 * @return {boolean}
 * @export
 */
os.ui.LayersCtrl.prototype.isWindowActive = function(flag) {
  var s = angular.element(os.ui.windowSelector.CONTAINER).scope();
  var result = s['mainCtrl'][flag];

  if (result) {
    return true;
  }

  return !!angular.element('div[label="' + flag + '"].window').length;
};


/**
 * Opens the specified menu.
 *
 * @param {string} selector The menu target selector.
 * @export
 */
os.ui.LayersCtrl.prototype.openMenu = function(selector) {
  var menu = this.menus_[selector];
  if (menu) {
    var target = this.element.find(selector);
    if (target && target.length > 0) {
      menu.open(undefined, {
        my: 'left top',
        at: 'left bottom',
        of: target
      });
    }
  }
};


/**
 * Toggles a flag on mainCtrl
 *
 * @param {string} flagName The name of the flag to toggle
 * @export
 */
os.ui.LayersCtrl.prototype.toggle = function(flagName) {
  if (!os.ui.menu.windows.toggleWindow(flagName)) {
    var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, flagName);
    os.dispatcher.dispatchEvent(event);
  }
};


/**
 * Toggles the Tile layers on/off
 *
 * @export
 */
os.ui.LayersCtrl.prototype.toggleTileLayers = function() {
  this.scope['showTiles'] = !this.scope['showTiles'];

  var layers = os.map.mapContainer.getLayers();
  for (var i = 0; i < layers.length; i++) {
    // call the functions in SKIP_TOGGLE_FUNCS on each layer
    // to determine if it should not be toggled
    if (!os.ui.LayersCtrl.SKIP_TOGGLE_FUNCS.some(function(func) {
      return func(layers[i]);
    })) {
      var type = layers[i].getType();

      if (type && type != ol.LayerType.VECTOR) {
        // toggle tiles
        layers[i].setLayerVisible(this.showTiles());
      }
    }
  }
};


/**
 * Checks if the Tiles should be displayed
 *
 * @return {boolean}
 * @export
 */
os.ui.LayersCtrl.prototype.showTiles = function() {
  return this.scope['showTiles'];
};


/**
 * Toggles the Feature layers on/off
 *
 * @export
 */
os.ui.LayersCtrl.prototype.toggleFeatureLayers = function() {
  this.scope['showFeatures'] = !this.scope['showFeatures'];

  var layers = os.map.mapContainer.getLayers();
  for (var i = 0; i < layers.length; i++) {
    var type = layers[i].getType();

    if (type && type == ol.LayerType.VECTOR) {
      // do not toggle the Drawing Layer
      if (!(layers[i] instanceof os.layer.Drawing)) {
        // check if the layer has a special implementation for setting visibility
        if (os.implements(layers[i], os.layer.ICustomLayerVisible.ID)) {
          layers[i].setCustomLayerVisible(this.showFeatures());
        } else {
          // toggle other features the default way
          layers[i].setLayerVisible(this.showFeatures());
        }
      }
    }
  }
};


/**
 * Checks if the Features should be displayed
 *
 * @return {boolean}
 * @export
 */
os.ui.LayersCtrl.prototype.showFeatures = function() {
  return this.scope['showFeatures'];
};


/**
 * Controller for area count directive.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.LayersWindowCtrl = function($scope) {
  os.ui.LayersWindowCtrl.base(this, 'constructor');

  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  os.ui.queryManager.listen(goog.events.EventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);
  this.onQueriesChanged_();

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.LayersWindowCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.LayersWindowCtrl.prototype.disposeInternal = function() {
  os.ui.LayersWindowCtrl.base(this, 'disposeInternal');

  os.ui.queryManager.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);

  this.scope_ = null;
};


/**
 * Handle changes to the query manager.
 *
 * @private
 */
os.ui.LayersWindowCtrl.prototype.onQueriesChanged_ = function() {
  if (this.scope_) {
    var qm = os.ui.queryManager;
    var fm = os.ui.filterManager;

    this.scope_['areaCount'] = 0;

    var states = qm.getAreaStates();
    for (var key in states) {
      if (key != os.query.AreaState.NONE) {
        this.scope_['areaCount'] += states[key];
      }
    }

    var filters = fm.getFilters() || [];
    this.scope_['filterCount'] = filters.reduce(function(result, filter, index) {
      return filter && qm.hasFilter(filter) ? result + 1 : result;
    }, 0);
  }

  os.ui.apply(this.scope_);
};
