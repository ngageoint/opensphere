goog.provide('os.ui.query.ui.AddFilterCtrl');
goog.provide('os.ui.query.ui.addFilterDirective');

goog.require('os.filter.FilterEntry');
goog.require('os.ui.Module');
goog.require('os.ui.filter.ui.editFiltersDirective');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.query');
goog.require('os.ui.window');


/**
 * The combinator window directive
 * @return {angular.Directive}
 */
os.ui.query.ui.addFilterDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'layer': '=',
      'btnText': '@'
    },
    template: '<button class="btn btn-default" title="Add a filter" ng-disabled="!addfilterctrl.canAdd()" ' +
        'ng-click="addfilterctrl.add()"><i class="btn-icon fa fa-plus green-icon"></i> {{btnText}}</button>',
    controller: os.ui.query.ui.AddFilterCtrl,
    controllerAs: 'addfilterctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('addfilter', [os.ui.query.ui.addFilterDirective]);



/**
 * Controller for combinator window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.query.ui.AddFilterCtrl = function($scope, $element) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {os.ui.menu.Menu|undefined}
   * @protected
   */
  this.layerMenu = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
    type: os.ui.menu.MenuItemType.ROOT,
    children: []
  }));

  /**
   * The list of layers
   * @type {Array}
   * @protected
   */
  this.layers = [];

  this.updateLayers();
  os.ui.queryManager.listen(goog.events.EventType.PROPERTYCHANGE, this.updateLayers, false, this);
  $scope.$on('$destroy', this.onDestroy.bind(this));
};


/**
 * Clean up
 * @protected
 */
os.ui.query.ui.AddFilterCtrl.prototype.onDestroy = function() {
  os.ui.queryManager.unlisten(goog.events.EventType.PROPERTYCHANGE, this.updateLayers, false, this);

  goog.dispose(this.layerMenu);
  this.layerMenu = undefined;

  this.scope = null;
  this.element_ = null;
};


/**
 * Updates the list of layers in the combo box
 * @protected
 */
os.ui.query.ui.AddFilterCtrl.prototype.updateLayers = function() {
  if (!this.layerMenu) {
    return;
  }

  // drop existing menu items
  var menuRoot = this.layerMenu.getRoot();
  if (menuRoot.children) {
    menuRoot.children = undefined;
  }

  var qm = os.ui.queryManager;
  var set = qm.getLayerSet();
  var layers = [];

  for (var key in set) {
    var filterable = /** @type {os.filter.IFilterable} */ (os.ui.filterManager.getFilterable(key));

    try {
      if (filterable) {
        var cols = filterable.getFilterColumns();

        if (cols) {
          layers.push({
            'id': key,
            'label': set[key],
            'columns': cols
          });
        }
      }
    } catch (e) {
      // most likely, layer wasn't an IFilterable implementation
    }
  }

  if (this.scope['layer']) {
    if (this.scope['layer']['id']) {
      goog.array.insert(layers, this.scope['layer']);
    }
  }

  layers.sort(os.ui.query.ui.AddFilterCtrl.sortLayers);

  for (var i = 0, n = layers.length; i < n; i++) {
    var id = layers[i]['id'];
    menuRoot.addChild({
      label: layers[i]['label'],
      eventType: id,
      handler: this.addFilter.bind(this, id)
    });
  }

  this.layers = layers;
};


/**
 * Open the menu to pick the layer for the filter
 */
os.ui.query.ui.AddFilterCtrl.prototype.add = function() {
  if (this.scope['layer'] && this.scope['layer']['id']) {
    this.addFilter(this.scope['layer']['id']);
  } else if (this.layerMenu && this.element_) {
    this.layerMenu.open(undefined, {
      my: 'left top',
      at: 'left bottom',
      of: this.element_
    });
  }
};
goog.exportProperty(
    os.ui.query.ui.AddFilterCtrl.prototype,
    'add',
    os.ui.query.ui.AddFilterCtrl.prototype.add);


/**
 * Launch the editor for a filter
 * @param {string} layerId
 * @protected
 */
os.ui.query.ui.AddFilterCtrl.prototype.addFilter = function(layerId) {
  var layer = goog.array.find(this.layers, function(layer) {
    return layer['id'] == layerId;
  });
  os.ui.filter.FilterManager.edit(layerId, layer['columns'], this.onFilterReady_.bind(this));
};


/**
 * Handle filter ready
 * @param {os.filter.FilterEntry} entry
 * @private
 */
os.ui.query.ui.AddFilterCtrl.prototype.onFilterReady_ = function(entry) {
  if (entry) {
    this.scope.$emit('filterComplete', entry);
  }
};


/**
 * If a new filter can be added.
 * @return {boolean}
 */
os.ui.query.ui.AddFilterCtrl.prototype.canAdd = function() {
  return !!this.layers && this.layers.length > 0;
};
goog.exportProperty(
    os.ui.query.ui.AddFilterCtrl.prototype,
    'canAdd',
    os.ui.query.ui.AddFilterCtrl.prototype.canAdd);


/**
 * Sort layers
 * @param {Object} a
 * @param {Object} b
 * @return {number} per compare functions
 */
os.ui.query.ui.AddFilterCtrl.sortLayers = function(a, b) {
  return goog.string.caseInsensitiveCompare(a['label'], b['label']);
};
