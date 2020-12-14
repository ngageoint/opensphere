goog.provide('os.ui.AreasCtrl');
goog.provide('os.ui.areasDirective');

goog.require('goog.async.Delay');
goog.require('os.data.AreaNode');
goog.require('os.data.AreaTreeSearch');
goog.require('os.data.groupby.SourceGroupBy');
goog.require('os.defines');
goog.require('os.query.AreaManager');
goog.require('os.ui.Module');
goog.require('os.ui.data.groupby.TagGroupBy');
goog.require('os.ui.ex.AreaExportCtrl');
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

  this.scope['activeAreas'] = [];

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
  os.ui.AreasCtrl.exportAreas(this.scope['areas']);
};


/**
 * Pop up area export gui
 *
 * @param {Array<os.ui.query.AreaNode>} areas
 * @export
 */
os.ui.AreasCtrl.exportAreas = function(areas) {
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

  os.ui.ex.AreaExportCtrl.start(formattedAreas);
};


/**
 * Events fired by the query area import menu.
 * @enum {string}
 */
os.ui.AreasCtrl.EventType = {
  ALL: 'areaexport:all',
  SELECTED: 'areaexport:selected',
  ACTIVE: 'areaexport:active'
};


/**
 * Opens the area export menu.
 *
 * @export
 */
os.ui.AreasCtrl.prototype.openExportMenu = function() {
  var target = this.element.find('.js-export-group');
  var menu = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
    type: os.ui.menu.MenuItemType.ROOT,
    children: [{
      label: 'Export All',
      eventType: os.ui.AreasCtrl.EventType.ALL,
      tooltip: 'Export all areas',
      handler: this.exportEventHandler_.bind(this),
      sort: 1
    }, {
      label: 'Export Selected',
      eventType: os.ui.AreasCtrl.EventType.SELECTED,
      tooltip: 'Export only selected areas',
      handler: this.exportEventHandler_.bind(this),
      sort: 2
    }, {
      label: 'Export Active',
      eventType: os.ui.AreasCtrl.EventType.ACTIVE,
      tooltip: 'Export only active areas',
      handler: this.exportEventHandler_.bind(this),
      sort: 3
    }]
  }));

  var menuRoot = menu.getRoot();

  this.scope['activeAreas'] = this.scope['areas'][0].getLabel() == 'No results' ? [] : this.activeAreas();

  menuRoot.find(os.ui.AreasCtrl.EventType.ALL).enabled = (this.scope['areas'][0].getLabel() != 'No results');
  menuRoot.find(os.ui.AreasCtrl.EventType.SELECTED).enabled = (this.scope['selected'].length > 0);
  menuRoot.find(os.ui.AreasCtrl.EventType.ACTIVE).enabled = (this.scope['activeAreas'].length > 0);

  if (menu && target && target.length) {
    menu.open(undefined, {
      my: 'left top+4',
      at: 'left bottom',
      of: target
    });
  }
};


/**
 * @return {Array<!os.data.AreaNode>} Array of active areas
 */
os.ui.AreasCtrl.prototype.activeAreas = function() {
  var allAreas = this.scope['areas'];
  var activeAreas = [];

  allAreas.forEach((area) => {
    if (area.getArea().get('shown')) {
      activeAreas.push(/** @type {!os.data.AreaNode} */ (new os.data.AreaNode(area.getArea())));
    }
  });

  return activeAreas;
};


/**
 * Handle menu area export events.
 *
 * @param {!os.ui.menu.MenuEvent} event The menu event.
 * @private
 */
os.ui.AreasCtrl.prototype.exportEventHandler_ = function(event) {
  switch (event.type) {
    case os.ui.AreasCtrl.EventType.ALL:
      os.ui.AreasCtrl.exportAreas(this.scope['areas']);
      break;
    case os.ui.AreasCtrl.EventType.SELECTED:
      os.ui.AreasCtrl.exportAreas(this.scope['selected']);
      break;
    case os.ui.AreasCtrl.EventType.ACTIVE:
      os.ui.AreasCtrl.exportAreas(this.scope['activeAreas']);
      break;
    default:
      break;
  }
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
