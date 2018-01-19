goog.provide('plugin.places.ui.PlacesCtrl');
goog.provide('plugin.places.ui.placesDirective');

goog.require('goog.Disposable');
goog.require('os.defines');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');
goog.require('os.ui.Module');
goog.require('os.ui.menu.layer');
goog.require('os.ui.window.confirmDirective');
goog.require('os.ui.window.confirmTextDirective');
goog.require('plugin.file.kml.ui');
goog.require('plugin.file.kml.ui.KMLNode');
goog.require('plugin.file.kml.ui.placemarkEditDirective');


/**
 * The places directive
 * @return {angular.Directive}
 */
plugin.places.ui.placesDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/plugin/places/places.html',
    controller: plugin.places.ui.PlacesCtrl,
    controllerAs: 'places'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('places', [plugin.places.ui.placesDirective]);



/**
 * Controller function for the places directive
 * @param {!angular.Scope} $scope The Angular scope.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
plugin.places.ui.PlacesCtrl = function($scope) {
  plugin.places.ui.PlacesCtrl.base(this, 'constructor');

  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  var pm = plugin.places.PlacesManager.getInstance();

  /**
   * The Places root KML node.
   * @type {plugin.file.kml.ui.KMLNode}
   * @private
   */
  this.placesRoot_ = pm.getPlacesRoot();
  if (!this.placesRoot_ && !pm.isLoaded()) {
    pm.listenOnce(os.config.EventType.LOADED, this.onPlacesReady_, false, this);
  }

  /**
   * The context menu for Places.
   * @type {os.ui.menu.Menu<os.ui.menu.layer.Context>|undefined}
   */
  this['contextMenu'] = os.ui.menu.layer.MENU;

  /**
   * The Places KML tree.
   * @type {!Array<Object>}
   */
  this['treeData'] = this.placesRoot_ ? [this.placesRoot_] : [];

  /**
   * The selected node in the tree.
   * @type {plugin.file.kml.ui.KMLNode}
   */
  this['selected'] = null;

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(plugin.places.ui.PlacesCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
plugin.places.ui.PlacesCtrl.prototype.disposeInternal = function() {
  plugin.places.ui.PlacesCtrl.base(this, 'disposeInternal');

  plugin.places.PlacesManager.getInstance().unlisten(os.config.EventType.LOADED, this.onPlacesReady_, false, this);

  this.placesRoot_ = null;
  this.scope_ = null;
};


/**
 * Handle places manager loaded event.
 * @param {goog.events.Event} event
 * @private
 */
plugin.places.ui.PlacesCtrl.prototype.onPlacesReady_ = function(event) {
  this.placesRoot_ = plugin.places.PlacesManager.getInstance().getPlacesRoot();

  if (this.placesRoot_) {
    this['treeData'] = [this.placesRoot_];
    os.ui.apply(this.scope_);
  }
};


/**
 * If the places root node is available.
 * @return {boolean}
 */
plugin.places.ui.PlacesCtrl.prototype.hasRoot = function() {
  return this.placesRoot_ != null;
};
goog.exportProperty(
    plugin.places.ui.PlacesCtrl.prototype,
    'hasRoot',
    plugin.places.ui.PlacesCtrl.prototype.hasRoot);


/**
 * Export places to a KMZ.
 */
plugin.places.ui.PlacesCtrl.prototype.export = function() {
  if (this.placesRoot_) {
    plugin.file.kml.ui.launchTreeExport(this.placesRoot_, 'Export Places');
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.Places.EXPORT, 1);
  } else {
    os.alertManager.sendAlert('Nothing to export.', os.alert.AlertEventSeverity.WARNING);
  }
};
goog.exportProperty(
    plugin.places.ui.PlacesCtrl.prototype,
    'export',
    plugin.places.ui.PlacesCtrl.prototype.export);


/**
 * Import places from a file/URL.
 */
plugin.places.ui.PlacesCtrl.prototype.import = function() {
  plugin.places.PlacesManager.getInstance().startImport();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.Places.IMPORT, 1);
};
goog.exportProperty(
    plugin.places.ui.PlacesCtrl.prototype,
    'import',
    plugin.places.ui.PlacesCtrl.prototype.import);


/**
 * Create a new folder and add it to the tree.
 */
plugin.places.ui.PlacesCtrl.prototype.addFolder = function() {
  var parent = this['selected'] && this['selected'].length == 1 ? this['selected'][0] : this.placesRoot_;
  while (parent && !parent.isFolder()) {
    parent = parent.getParent();
  }

  if (parent) {
    plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
      'parent': parent
    }));
  }
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.Places.ADD_FOLDER, 1);
};
goog.exportProperty(
    plugin.places.ui.PlacesCtrl.prototype,
    'addFolder',
    plugin.places.ui.PlacesCtrl.prototype.addFolder);


/**
 * Create a new place and add it to the tree.
 */
plugin.places.ui.PlacesCtrl.prototype.addPlace = function() {
  var parent = this['selected'] && this['selected'].length == 1 ? this['selected'][0] : this.placesRoot_;
  while (parent && !parent.isFolder()) {
    parent = parent.getParent();
  }

  if (parent) {
    plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
      'parent': parent
    }));
  }
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.Places.ADD_PLACE, 1);
};
goog.exportProperty(
    plugin.places.ui.PlacesCtrl.prototype,
    'addPlace',
    plugin.places.ui.PlacesCtrl.prototype.addPlace);


/**
 * Fully expands the tree from the provided node. Uses the first node if multiple are selected.
 */
plugin.places.ui.PlacesCtrl.prototype.expandAll = function() {
  var node = this['selected'] && this['selected'].length > 0 ? this['selected'][0] : this.placesRoot_;
  if (node) {
    node.setCollapsed(false, true);
    this.scope_.$broadcast(os.ui.slick.SlickGridEvent.INVALIDATE_ROWS);
  }
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.Places.EXPAND_ALL, 1);
};
goog.exportProperty(
    plugin.places.ui.PlacesCtrl.prototype,
    'expandAll',
    plugin.places.ui.PlacesCtrl.prototype.expandAll);


/**
 * Fully collapses the tree from the provided node. Uses the first node if multiple are selected.
 */
plugin.places.ui.PlacesCtrl.prototype.collapseAll = function() {
  var node = this['selected'] && this['selected'].length > 0 ? this['selected'][0] : this.placesRoot_;
  if (node) {
    node.setCollapsed(true, true);
    this.scope_.$broadcast(os.ui.slick.SlickGridEvent.INVALIDATE_ROWS);
  }
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.Places.COLLAPSE_ALL, 1);
};
goog.exportProperty(
    plugin.places.ui.PlacesCtrl.prototype,
    'collapseAll',
    plugin.places.ui.PlacesCtrl.prototype.collapseAll);
