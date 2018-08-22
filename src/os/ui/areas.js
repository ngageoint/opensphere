goog.provide('os.ui.AreasCtrl');
goog.provide('os.ui.areasDirective');

goog.require('goog.async.Delay');
goog.require('os.data.AreaTreeSearch');
goog.require('os.data.groupby.SourceGroupBy');
goog.require('os.defines');
goog.require('os.query.AreaManager');
goog.require('os.ui.CombinatorCtrl');
goog.require('os.ui.Module');
goog.require('os.ui.data.groupby.TagGroupBy');
goog.require('os.ui.ex.AreaExportCtrl');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.menu.areaImport');
goog.require('os.ui.menu.spatial');
goog.require('os.ui.query.ui.CombinatorCtrl');
goog.require('os.ui.query.ui.editAreaDirective');
goog.require('os.ui.slick.AbstractGroupByTreeSearchCtrl');
goog.require('os.ui.util.autoHeightDirective');


/**
 * The areas window directive
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
    this.scope['contextMenu'] = os.ui.menu.SPATIAL;
  } catch (e) {
  }

  this.scope['views'] = os.ui.AreasCtrl.VIEWS;

  /**
   * @type {?os.data.AreaTreeSearch}
   */
  this.treeSearch = new os.data.AreaTreeSearch('areas', this.scope);

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
os.ui.AreasCtrl.prototype.destroy = function() {
  os.ui.areaManager.unlisten(goog.events.EventType.PROPERTYCHANGE, this.searchIfAddedOrRemoved_, false, this);

  os.ui.AreasCtrl.base(this, 'destroy');
};


/**
 * Launches the advanced combination window
 */
os.ui.AreasCtrl.prototype.launch = function() {
  os.ui.CombinatorCtrl.launch();
};
goog.exportProperty(os.ui.AreasCtrl.prototype, 'launch', os.ui.AreasCtrl.prototype.launch);


/**
 * Opens the area import menu.
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
goog.exportProperty(
    os.ui.AreasCtrl.prototype,
    'openImportMenu',
    os.ui.AreasCtrl.prototype.openImportMenu);


/**
 * Disables export button
 * @return {boolean}
 */
os.ui.AreasCtrl.prototype.exportDisabled = function() {
  if (this.scope['selected']) {
    return this.scope['selected'].length == 0 || this.scope['selected'][0].getLabel() == 'No results';
  } else {
    return true;
  }
};
goog.exportProperty(os.ui.AreasCtrl.prototype, 'exportDisabled', os.ui.AreasCtrl.prototype.exportDisabled);


/**
 * Pop up area export gui
 */
os.ui.AreasCtrl.prototype.export = function() {
  var areas = /** @type {Array<os.structs.ITreeNode>} */ (this.scope['selected']).map(
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

  os.ui.ex.AreaExportCtrl.start(areas);
};
goog.exportProperty(
    os.ui.AreasCtrl.prototype,
    'export',
    os.ui.AreasCtrl.prototype.export);


/**
 * Launches the area import window
 */
os.ui.AreasCtrl.prototype.import = function() {
  os.query.launchQueryImport();
};
goog.exportProperty(os.ui.AreasCtrl.prototype, 'import', os.ui.AreasCtrl.prototype.import);


/**
 * Preform a search only if a node is added, updated, or removed
 * @param {os.events.PropertyChangeEvent} e The event
 * @private
 */
os.ui.AreasCtrl.prototype.searchIfAddedOrRemoved_ = function(e) {
  if (e && e.getProperty() !== 'toggle') {
    this.search();
  }
};
