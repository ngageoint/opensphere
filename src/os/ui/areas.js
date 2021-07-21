goog.provide('os.ui.AreasCtrl');
goog.provide('os.ui.areasDirective');

goog.require('goog.async.Delay');
goog.require('os');
goog.require('os.data.AreaNode');
goog.require('os.data.AreaTreeSearch');
goog.require('os.data.groupby.SourceGroupBy');
goog.require('os.query.AreaManager');
goog.require('os.structs.TreeNode');
goog.require('os.ui.Module');
goog.require('os.ui.data.groupby.TagGroupBy');
goog.require('os.ui.ex.AreaExportUI');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.areaImport');
goog.require('os.ui.menu.spatial');
goog.require('os.ui.query.BaseCombinatorCtrl');
goog.require('os.ui.query.CombinatorCtrl');
goog.require('os.ui.query.editAreaDirective');
goog.require('os.ui.slick.AbstractGroupByTreeSearchCtrl');
goog.require('os.ui.urlDragDropDirective');


/**
 * The areas window directive
 *
 * @return {angular.Directive}
 */
os.ui.areasDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/areas.html',
    controller: os.ui.AreasCtrl,
    controllerAs: 'areasCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('areas', [os.ui.areasDirective]);



/**
 * Controller for Areas window
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.slick.AbstractGroupByTreeSearchCtrl}
 * @constructor
 * @ngInject
 */
os.ui.AreasCtrl = function($scope, $element) {
  os.ui.AreasCtrl.base(this, 'constructor', $scope, $element, 25);

  this.title = 'areas';
  try {
    this.scope['contextMenu'] = os.ui.menu.spatial.MENU;
  } catch (e) {
  }

  this.scope['views'] = os.ui.AreasCtrl.VIEWS;

  /**
   * @type {?os.data.AreaTreeSearch}
   */
  this.treeSearch = new os.data.AreaTreeSearch('areas', this.scope);

  /**
   * Bound version of the drag-drop handler.
   * @type {Function}
   */
  this['onDrop'] = this.onDrop_.bind(this);

  os.ui.areaManager.listen(goog.events.EventType.PROPERTYCHANGE, this.searchIfAddedOrRemoved_, false, this);
  this.init();
};
goog.inherits(os.ui.AreasCtrl, os.ui.slick.AbstractGroupByTreeSearchCtrl);


/**
 * The view options for grouping areas
 * @type {!Object<string, os.data.groupby.INodeGroupBy>}
 */
os.ui.AreasCtrl.VIEWS = {
  'None': -1, // you can't use null because Angular treats that as the empty/unselected option
  'Tag': new os.ui.data.groupby.TagGroupBy(false),
  'Source': new os.data.groupby.SourceGroupBy(false)
};


/**
 * @inheritDoc
 */
os.ui.AreasCtrl.prototype.disposeInternal = function() {
  os.ui.areaManager.unlisten(goog.events.EventType.PROPERTYCHANGE, this.searchIfAddedOrRemoved_, false, this);

  os.ui.AreasCtrl.base(this, 'disposeInternal');
};


/**
 * Launches the advanced combination window
 *
 * @export
 */
os.ui.AreasCtrl.prototype.launch = function() {
  os.ui.query.CombinatorCtrl.launch();
};


/**
 * Opens the area import menu.
 *
 * @export
 */
os.ui.AreasCtrl.prototype.openImportMenu = function() {
  var target = this.element.find('.js-import-group');
  var menu = os.ui.menu.areaImport.MENU;
  if (menu && target && target.length) {
    menu.open(undefined, {
      my: 'left top+4',
      at: 'left bottom',
      of: target
    });
  }
};


/**
 * Disables export button
 *
 * @return {boolean}
 * @export
 */
os.ui.AreasCtrl.prototype.exportDisabled = function() {
  if (this.scope['areas']) {
    return this.scope['areas'].length == 0 || this.scope['areas'][0].getLabel() == 'No results';
  } else {
    return true;
  }
};


/**
 * Pop up area export gui
 *
 * @export
 */
os.ui.AreasCtrl.prototype.export = function() {
  var allAreas = this.allAreas();
  os.ui.AreasCtrl.exportAreas(allAreas, this.selectedAreas(), this.activeAreas(allAreas));
};


/**
 * Pop up area export gui
 *
 * @param {Array<os.ui.query.AreaNode>} areas
 * @param {Array<os.data.AreaNode>=} opt_selected
 * @param {Array<os.data.AreaNode>=} opt_active
 * @export
 */
os.ui.AreasCtrl.exportAreas = function(areas, opt_selected, opt_active) {
  var allAreas = os.ui.AreasCtrl.formatAreas(areas);
  var selectedAreas = opt_selected ? os.ui.AreasCtrl.formatAreas(opt_selected) : undefined;
  var activeAreas = opt_active ? os.ui.AreasCtrl.formatAreas(opt_active) : undefined;

  os.ui.ex.AreaExportUI.Controller.start(allAreas, selectedAreas, activeAreas);
};


/**
 * Format areas for export
 *
 * @param {Array<os.ui.query.AreaNode>} areas
 * @return {Array<ol.Feature>}
 */
os.ui.AreasCtrl.formatAreas = function(areas) {
  var formattedAreas = /** @type {Array<os.structs.ITreeNode>} */ (areas).map(
      /**
       * @param {os.structs.ITreeNode} node The tree node
       * @return {ol.Feature} The area
       */
      function(node) {
        if (node instanceof os.data.AreaNode) {
          var area = node.getArea();

          if (area) {
            return os.query.AreaManager.mapOriginalGeoms(area);
          }
        }

        return null;
      }).filter(os.fn.filterFalsey);

  return formattedAreas;
};


/**
 * Get every area in the window. Now with leaf nodes.
 * @return {Array<os.data.AreaNode>} Array of every area
 */
os.ui.AreasCtrl.prototype.allAreas = function() {
  var allAreas = goog.array.flatten(this.scope['areas'].map(os.structs.getLeafNodes));
  return /** @type {Array<os.data.AreaNode>} */ (allAreas);
};


/**
 * Get every selected area, including leaves from selected folder groups.
 * @return {Array<os.data.AreaNode>} Array of every selected area
 */
os.ui.AreasCtrl.prototype.selectedAreas = function() {
  var selected = goog.array.flatten(this.scope['selected'].map(os.structs.getLeafNodes));
  goog.array.removeDuplicates(selected);

  return /** @type {Array<os.data.AreaNode>} */ (selected);
};


/**
 * Get all of the active areas from a given subset.
 * @param {Array<os.data.AreaNode>} allAreas Array of all area nodes.
 * @return {Array<os.data.AreaNode>} Array of active areas
 */
os.ui.AreasCtrl.prototype.activeAreas = function(allAreas) {
  var activeAreas = allAreas.map((node) => {
    var area = node.getArea();
    if (area.get('shown')) {
      return /** @type {!os.data.AreaNode} */ (new os.data.AreaNode(area));
    }
  }).filter(os.fn.filterFalsey);

  return /** @type {Array<os.data.AreaNode>} */ (activeAreas);
};


/**
 * Launches the area import window
 *
 * @param {os.file.File=} opt_file Optional file to use in the import.
 * @export
 */
os.ui.AreasCtrl.prototype.import = function(opt_file) {
  os.query.launchQueryImport(undefined, opt_file);
};


/**
 * Preform a search only if a node is added, updated, or removed
 *
 * @param {os.events.PropertyChangeEvent} e The event
 * @private
 */
os.ui.AreasCtrl.prototype.searchIfAddedOrRemoved_ = function(e) {
  if (e && e.getProperty() !== 'toggle') {
    this.search();
  }
};


/**
 * Handles file drops over the areas tab.
 *
 * @param {Event} event The drop event.
 */
os.ui.AreasCtrl.prototype.onDrop_ = function(event) {
  if (event.dataTransfer && event.dataTransfer.files) {
    os.file.createFromFile(/** @type {!File} */ (event.dataTransfer.files[0]))
        .addCallback(this.import.bind(this), this.onFail_.bind(this));
  }
};


/**
 * Handle file drag-drop.
 *
 * @param {!goog.events.Event|os.file.File} event
 * @private
 */
os.ui.AreasCtrl.prototype.onFail_ = function(event) {
  os.alertManager.sendAlert('Could not handle file with drag and drop. Try again or use the browse capability.');
};
