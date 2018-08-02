goog.provide('os.ui.query.ui.AreaFilterAddCtrl');
goog.provide('os.ui.query.ui.areaFilterAddDirective');
goog.require('goog.async.Delay');
goog.require('goog.events.EventTarget');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.Module');
goog.require('os.ui.data.groupby.TagGroupBy');
goog.require('os.ui.events.ScrollEvent');
goog.require('os.ui.filter.FilterManager');
goog.require('os.ui.filter.FilterTreeSearch');
goog.require('os.ui.filter.ui.FilterGroupBy');
goog.require('os.ui.filter.ui.FilterNode');
goog.require('os.ui.query.AreaManager');
goog.require('os.ui.query.AreaNode');
goog.require('os.ui.query.AreaTreeSearch');
goog.require('os.ui.slick.TreeSearch');


/**
 * The areafilteradd directive
 * @return {angular.Directive}
 */
os.ui.query.ui.areaFilterAddDirective = function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: os.ROOT + 'views/query/areafilteradd.html',
    controller: os.ui.query.ui.AreaFilterAddCtrl,
    controllerAs: 'afa'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('areafilteradd', [os.ui.query.ui.areaFilterAddDirective]);



/**
 * Controller function for the areafilteradd directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.events.EventTarget}
 * @constructor
 * @ngInject
 */
os.ui.query.ui.AreaFilterAddCtrl = function($scope, $element) {
  os.ui.query.ui.AreaFilterAddCtrl.base(this, 'constructor');
  $scope['areaTerm'] = '';
  $scope['filterTerm'] = '';
  $scope['areas'] = [];
  $scope['filters'] = [];

  var view = /** @type {string} */ (os.settings.get(['areas', 'groupBy'], 'None'));
  $scope['areaViews'] = os.ui.query.ui.AreaFilterAddCtrl.AREA_VIEWS;
  $scope['areaView'] = os.ui.query.ui.AreaFilterAddCtrl.AREA_VIEWS[view];

  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.areaSearchDelay_ = new goog.async.Delay(this.onAreaSearch_, 250, this);

  /**
   * @type {?os.ui.slick.TreeSearch}
   * @private
   */
  this.areaTreeSearch_ = null;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.filterSearchDelay_ = new goog.async.Delay(this.onFilterSearch_, 250, this);

  /**
   * @type {?os.ui.slick.TreeSearch}
   * @private
   */
  this.filterTreeSearch_ = null;

  /**
   * @type {Array<ol.Feature>}
   * @private
   */
  this.objectAreas_ = [];

  /**
   * @type {string}
   */
  this['countText'] = 'Nothing to add';

  /**
   * @type {boolean}
   */
  this['addDisabled'] = true;

  os.settings.listen(os.AREA_STORAGE_KEY, this.onSettingsUpdate_, false, this);
  os.settings.listen(os.FILTER_STORAGE_KEY, this.onSettingsUpdate_, false, this);

  $scope.$on('dirty', this.count_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));

  os.ui.areaManager.getStoredAreas().addCallback(this.onAreasReady_, this);
  this.updateFilters_();
};
goog.inherits(os.ui.query.ui.AreaFilterAddCtrl, goog.events.EventTarget);


/**
 * Clean up.
 * @private
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.destroy_ = function() {
  this.areaSearchDelay_.dispose();
  this.areaSearchDelay_ = null;

  this.areaTreeSearch_.dispose();
  this.areaTreeSearch_ = null;

  this.filterSearchDelay_.dispose();
  this.filterSearchDelay_ = null;

  this.filterTreeSearch_.dispose();
  this.filterTreeSearch_ = null;

  os.settings.unlisten(os.AREA_STORAGE_KEY, this.onSettingsUpdate_, false, this);
  os.settings.unlisten(os.FILTER_STORAGE_KEY, this.onSettingsUpdate_, false, this);

  var view = 'None';
  for (var key in os.ui.query.ui.AreaFilterAddCtrl.AREA_VIEWS) {
    if (this.scope_['areaView'] === os.ui.query.ui.AreaFilterAddCtrl.AREA_VIEWS[key]) {
      view = key;
      break;
    }
  }
  os.settings.set(['areas', 'groupBy'], view);

  this.scope_ = null;
  this.element_ = null;
};


/**
 * Handle areas loaded from storage.
 * @param {Array<ol.Feature>} areas
 * @private
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.onAreasReady_ = function(areas) {
  var areaTree = [];
  if (areas) {
    for (var i = 0; i < areas.length; i++) {
      var area = areas[i];
      area.setId(goog.string.getRandomString());
      // shown controls the checkbox state in this window and temp makes them not stick around in AreaManager
      area.set('shown', false);
      area.set('temp', true);
      var node = new os.ui.query.AreaNode(area);
      areaTree.push(node);
    }
  }

  var filters = os.ui.filterManager.getStoredFilters();
  var filterTree = [];
  if (filters) {
    for (var i = 0; i < filters.length; i++) {
      var filter = filters[i];
      filter.setId(goog.string.getRandomString());
      // enabled controls the checkbox state in this window and temporary makes them not stick around in FilterManager
      filter.setEnabled(false);
      filter.setTemporary(true);
      var node = new os.ui.filter.ui.FilterNode();
      node.setEntry(filter);
      filterTree.push(node);
    }
  }

  this.areaTreeSearch_ = new os.ui.query.AreaTreeSearch(areaTree, 'areas', this.scope_, 'No areas');
  this.filterTreeSearch_ = new os.ui.filter.FilterTreeSearch(filterTree, 'filters', this.scope_,
      'No matching filters');

  this.searchAreas();
  this.searchFilters();
  this.count_();
};


/**
 * The view options for grouping areas
 * @type {!Object<string, os.data.groupby.INodeGroupBy>}
 */
os.ui.query.ui.AreaFilterAddCtrl.AREA_VIEWS = {
  'None': -1, // you can't use null because Angular treats that as the empty/unselected option
  'Tag': new os.ui.data.groupby.TagGroupBy(true)
};


/**
 * @type {os.data.groupby.INodeGroupBy}
 * @const
 * @private
 */
os.ui.query.ui.AreaFilterAddCtrl.TYPE_GROUP_BY_ = new os.ui.filter.ui.FilterGroupBy();


/**
 * Update the tree on a crosstalk event
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.onSettingsUpdate_ = function(event) {
  os.ui.areaManager.getStoredAreas().addCallback(this.onAreasUpdate_, this);
  os.ui.filterManager.load();
  this.updateFilters_();
};


/**
 * Handle async area storage call
 * @param {Array<ol.Feature>=} opt_areas
 * @private
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.onAreasUpdate_ = function(opt_areas) {
  var areas = opt_areas || this.areaTreeSearch_.getSearch().map(function(node) {
    return node.getArea();
  });
  areas = areas.concat(this.objectAreas_);

  var areaTree = [];
  if (areas) {
    for (var i = 0; i < areas.length; i++) {
      var area = areas[i];
      area.setId(goog.string.getRandomString());
      // shown controls the checkbox state in this window and temp makes them not stick around in AreaManager
      area.set('shown', false);
      area.set('temp', true);
      var node = new os.ui.query.AreaNode(area);
      areaTree.push(node);
    }
  }

  this.areaTreeSearch_.setSearch(areaTree);
  this.searchAreas();
  this.updateFilters_();
};


/**
 * @private
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.updateFilters_ = function() {
  var filters = os.ui.filterManager.getStoredFilters();
  var filterTree = [];

  if (filters) {
    for (var i = 0; i < filters.length; i++) {
      var filter = filters[i];
      filter.setId(goog.string.getRandomString());
      filter.setEnabled(false);
      filter.setTemporary(true);
      var node = new os.ui.filter.ui.FilterNode();
      node.setEntry(filter);
      filterTree.push(node);
    }
  }

  this.filterTreeSearch_.setSearch(filterTree);
  this.searchFilters();
  this.count_();
};


/**
 * Starts the area search delay
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.searchAreas = function() {
  if (this.areaSearchDelay_) {
    this.areaSearchDelay_.start();
  }
};
goog.exportProperty(
    os.ui.query.ui.AreaFilterAddCtrl.prototype,
    'searchAreas',
    os.ui.query.ui.AreaFilterAddCtrl.prototype.searchAreas);


/**
 * Performs the area search
 * @private
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.onAreaSearch_ = function() {
  if (this.areaTreeSearch_) {
    var t = this.scope_['areaTerm'];

    if (!t) {
      t = '*';
    }

    var view = this.scope_['areaView'];
    view = view === -1 ? null : view;

    // do the search
    this.areaTreeSearch_.beginSearch(t, view);
    os.ui.apply(this.scope_);
  }
};


/**
 * Starts the filter search delay
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.searchFilters = function() {
  if (this.filterSearchDelay_) {
    this.filterSearchDelay_.start();
  }
};
goog.exportProperty(
    os.ui.query.ui.AreaFilterAddCtrl.prototype,
    'searchFilters',
    os.ui.query.ui.AreaFilterAddCtrl.prototype.searchFilters);


/**
 * Performs the filter search
 * @private
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.onFilterSearch_ = function() {
  if (this.filterTreeSearch_) {
    var t = this.scope_['filterTerm'];
    var view = os.ui.query.ui.AreaFilterAddCtrl.TYPE_GROUP_BY_;

    // do the search
    this.filterTreeSearch_.beginSearch(t, view);
    os.ui.apply(this.scope_);
  }
};


/**
 * Adds the toggled on filters and areas to their managers.
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.add = function() {
  if (this.areaTreeSearch_) {
    var areas = /** @type {Array<os.ui.slick.SlickTreeNode>} */ (this.areaTreeSearch_.getSearch());
    this.addFromNodes_(areas);
  }

  if (this.filterTreeSearch_) {
    var filters = /** @type {Array<os.ui.slick.SlickTreeNode>} */ (this.filterTreeSearch_.getSearch());
    this.addFromNodes_(filters);
  }

  this.close();
};
goog.exportProperty(
    os.ui.query.ui.AreaFilterAddCtrl.prototype,
    'add',
    os.ui.query.ui.AreaFilterAddCtrl.prototype.add);


/**
 * Adds toggled nodes to filter and area manager.
 * @param {Array<os.ui.slick.SlickTreeNode>|os.ui.slick.SlickTreeNode} nodes
 * @private
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.addFromNodes_ = function(nodes) {
  if (!goog.isArray(nodes)) {
    nodes = [nodes];
  }

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node instanceof os.ui.filter.ui.FilterNode) {
      var filter = node.getEntry();
      if (filter && filter.isEnabled()) {
        // Little hacky... Assumes the format url#name#type
        var name = filter.getType().split('#');
        // If we dont have anything in the middle. just use the whole name...
        var layerName = name[1] || filter.getType();
        if (layerName) {
          var descriptors = this.getDescriptors(layerName);
          if (descriptors.length) {
            descriptors.forEach(function(desc) {
              var clone = filter.clone();
              clone.setType(desc.getId());
              os.ui.filterManager.addFilter(clone);
              os.alertManager.sendAlert('Added filter for ' + desc.getTitle(), os.alert.AlertEventSeverity.SUCCESS);
            });
          } else {
            os.alertManager.sendAlert('Unable to find matching layer for ' + filter.getType(),
                os.alert.AlertEventSeverity.ERROR);
          }
        }
      }
    }

    if (node instanceof os.ui.query.AreaNode) {
      var area = node.getArea();
      if (area && area.get('shown')) {
        os.ui.areaManager.add(area);
        continue;
      }
    }

    if (node instanceof os.ui.slick.SlickTreeNode && node.getChildren()) {
      this.addFromNodes_(/** @type {Array<os.ui.slick.SlickTreeNode>} */ (node.getChildren()));
    }
  }
};


/**
 * Get all the descriptors for this layer name
 * @param {string} layer
 * @return {!Array<!os.data.IDataDescriptor>}
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.getDescriptors = function(layer) {
  var filteredDescriptors = [];
  var descriptors = os.dataManager.getDescriptors();
  descriptors.forEach(function(desc) {
    if (desc.getName() == layer) {
      filteredDescriptors.push(desc);
    }
  });
  return filteredDescriptors;
};


/**
 * Closes the window without doing anything.
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(
    os.ui.query.ui.AreaFilterAddCtrl.prototype,
    'close',
    os.ui.query.ui.AreaFilterAddCtrl.prototype.close);


/**
 * Fires an event telling the form to scroll the map into the view.
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.scrollToMap = function() {
  os.dispatcher.dispatchEvent(new os.ui.events.ScrollEvent('#mapSection'));
};
goog.exportProperty(
    os.ui.query.ui.AreaFilterAddCtrl.prototype,
    'scrollToMap',
    os.ui.query.ui.AreaFilterAddCtrl.prototype.scrollToMap);


/**
 * Handler for dirty checkbox events. Counts the active areas/filters and updates the value on the UI.
 * @param {angular.Scope.Event=} opt_event
 * @private
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.count_ = function(opt_event) {
  if (opt_event) {
    opt_event.stopPropagation();
    opt_event.preventDefault();
  }

  var ac = 0;
  var fc = 0;
  var areas;
  var filters;

  if (this.areaTreeSearch_) {
    areas = /** @type {Array<os.ui.slick.SlickTreeNode>} */ (this.areaTreeSearch_.getSearch());

    for (var i = 0; i < areas.length; i++) {
      if (areas[i].getArea().get('shown')) {
        ac++;
      }
    }
  }

  if (this.filterTreeSearch_) {
    filters = /** @type {Array<os.ui.slick.SlickTreeNode>} */ (this.filterTreeSearch_.getSearch());

    for (var i = 0; i < filters.length; i++) {
      if (filters[i].getEntry().isEnabled()) {
        fc++;
      }
    }
  }

  var text = 'Nothing to add';
  if (ac && !fc) {
    text = 'Adding <b>' + ac + '</b> area' + (ac == 1 ? '' : 's');
  } else if (!ac && fc) {
    text = 'Adding <b>' + fc + '</b> filter' + (fc == 1 ? '' : 's');
  } else if (ac && fc) {
    text = 'Adding <b>' + ac + '</b> area' + (ac == 1 ? '' : 's') +
        ' and <b>' + fc + '</b> filter' + (fc == 1 ? '' : 's');
  }

  this['countText'] = text;
  this['addDisabled'] = !ac && !fc;
};


/**
 * Launches a window to choose objects to add areas from.
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.launchAddObjectAreas = function() {
  var id = 'areaobjectadd';
  if (os.ui.window.exists(id)) {
    os.ui.window.bringToFront(id);
    return;
  }

  var options = {
    'id': id,
    'x': 'center',
    'y': 'center',
    'label': 'Add Areas from Objects',
    'show-close': true,
    'no-scroll': false,
    'width': 500,
    'height': 'auto',
    'modal': true
  };

  var scopeOptions = {
    'callback': this.onAreasSelected_.bind(this)
  };

  os.ui.window.create(options, 'areaobjectadd callback="callback"', undefined, this.scope, undefined, scopeOptions);
};
goog.exportProperty(
    os.ui.query.ui.AreaFilterAddCtrl.prototype,
    'launchAddObjectAreas',
    os.ui.query.ui.AreaFilterAddCtrl.prototype.launchAddObjectAreas);


/**
 * Callback for area selection from objects.
 * @param {Array<ol.Feature>} features
 * @private
 */
os.ui.query.ui.AreaFilterAddCtrl.prototype.onAreasSelected_ = function(features) {
  this.objectAreas_ = features;
  this.onAreasUpdate_();
};
