goog.module('os.ui.AreasUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.urlDragDropDirective');

const {flatten, removeDuplicates} = goog.require('goog.array');
const GoogEventType = goog.require('goog.events.EventType');
const {ROOT} = goog.require('os');
const AlertManager = goog.require('os.alert.AlertManager');
const AreaNode = goog.require('os.data.AreaNode');
const AreaTreeSearch = goog.require('os.data.AreaTreeSearch');
const SourceGroupBy = goog.require('os.data.groupby.SourceGroupBy');
const {createFromFile} = goog.require('os.file');
const {filterFalsey} = goog.require('os.fn');
const {launchQueryImport} = goog.require('os.query');
const AreaManager = goog.require('os.query.AreaManager');
const {getLeafNodes} = goog.require('os.structs');
const Module = goog.require('os.ui.Module');
const TagGroupBy = goog.require('os.ui.data.groupby.TagGroupBy');
const AreaExportUI = goog.require('os.ui.ex.AreaExportUI');
const areaImport = goog.require('os.ui.menu.areaImport');
const spatial = goog.require('os.ui.menu.spatial');
const CombinatorUI = goog.require('os.ui.query.CombinatorUI');
const AbstractGroupByTreeSearchCtrl = goog.require('os.ui.slick.AbstractGroupByTreeSearchCtrl');

const GoogEvent = goog.requireType('goog.events.Event');
const Feature = goog.requireType('ol.Feature');
const INodeGroupBy = goog.requireType('os.data.groupby.INodeGroupBy');
const PropertyChangeEvent = goog.requireType('os.events.PropertyChangeEvent');
const OSFile = goog.requireType('os.file.File');
const ITreeNode = goog.requireType('os.structs.ITreeNode');
const QueryAreaNode = goog.requireType('os.ui.query.AreaNode');


/**
 * The areas window directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/areas.html',
  controller: Controller,
  controllerAs: 'areasCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'areas';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for Areas window
 * @unrestricted
 */
class Controller extends AbstractGroupByTreeSearchCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element, 25);

    this.title = 'areas';
    try {
      this.scope['contextMenu'] = spatial.MENU;
    } catch (e) {
    }

    this.scope['views'] = Controller.VIEWS;

    /**
     * @type {?AreaTreeSearch}
     */
    this.treeSearch = new AreaTreeSearch('areas', this.scope);

    /**
     * Bound version of the drag-drop handler.
     * @type {Function}
     */
    this['onDrop'] = this.onDrop_.bind(this);

    AreaManager.getInstance().listen(GoogEventType.PROPERTYCHANGE, this.searchIfAddedOrRemoved_, false, this);
    this.init();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    AreaManager.getInstance().unlisten(GoogEventType.PROPERTYCHANGE, this.searchIfAddedOrRemoved_, false, this);

    super.disposeInternal();
  }

  /**
   * Launches the advanced combination window
   *
   * @export
   */
  launch() {
    CombinatorUI.launch();
  }

  /**
   * Opens the area import menu.
   *
   * @export
   */
  openImportMenu() {
    var target = this.element.find('.js-import-group');
    var menu = areaImport.MENU;
    if (menu && target && target.length) {
      menu.open(undefined, {
        my: 'left top+4',
        at: 'left bottom',
        of: target
      });
    }
  }

  /**
   * Disables export button
   *
   * @return {boolean}
   * @export
   */
  exportDisabled() {
    if (this.scope['areas']) {
      return this.scope['areas'].length == 0 || this.scope['areas'][0].getLabel() == 'No results';
    } else {
      return true;
    }
  }

  /**
   * Pop up area export gui
   *
   * @export
   */
  export() {
    var allAreas = this.allAreas();
    Controller.exportAreas(allAreas, this.selectedAreas(), this.activeAreas(allAreas));
  }

  /**
   * Get every area in the window. Now with leaf nodes.
   * @return {Array<AreaNode>} Array of every area
   */
  allAreas() {
    var allAreas = flatten(this.scope['areas'].map(getLeafNodes));
    return /** @type {Array<AreaNode>} */ (allAreas);
  }

  /**
   * Get every selected area, including leaves from selected folder groups.
   * @return {Array<AreaNode>} Array of every selected area
   */
  selectedAreas() {
    var selected = flatten(this.scope['selected'].map(getLeafNodes));
    removeDuplicates(selected);

    return /** @type {Array<AreaNode>} */ (selected);
  }

  /**
   * Get all of the active areas from a given subset.
   * @param {Array<AreaNode>} allAreas Array of all area nodes.
   * @return {Array<AreaNode>} Array of active areas
   */
  activeAreas(allAreas) {
    var activeAreas = allAreas.map((node) => {
      var area = node.getArea();
      if (area.get('shown')) {
        return /** @type {!AreaNode} */ (new AreaNode(area));
      }
    }).filter(filterFalsey);

    return /** @type {Array<AreaNode>} */ (activeAreas);
  }

  /**
   * Launches the area import window
   *
   * @param {OSFile=} opt_file Optional file to use in the import.
   * @export
   */
  import(opt_file) {
    launchQueryImport(undefined, opt_file);
  }

  /**
   * Preform a search only if a node is added, updated, or removed
   *
   * @param {PropertyChangeEvent} e The event
   * @private
   */
  searchIfAddedOrRemoved_(e) {
    if (e && e.getProperty() !== 'toggle') {
      this.search();
    }
  }

  /**
   * Handles file drops over the areas tab.
   *
   * @param {Event} event The drop event.
   */
  onDrop_(event) {
    if (event.dataTransfer && event.dataTransfer.files) {
      createFromFile(/** @type {!File} */ (event.dataTransfer.files[0]))
          .addCallback(this.import.bind(this), this.onFail_.bind(this));
    }
  }

  /**
   * Handle file drag-drop.
   *
   * @param {!GoogEvent|OSFile} event
   * @private
   */
  onFail_(event) {
    AlertManager.getInstance().sendAlert(
        'Could not handle file with drag and drop. Try again or use the browse capability.');
  }

  /**
   * Pop up area export gui
   *
   * @param {Array<QueryAreaNode>} areas
   * @param {Array<AreaNode>=} opt_selected
   * @param {Array<AreaNode>=} opt_active
   * @export
   */
  static exportAreas(areas, opt_selected, opt_active) {
    var allAreas = Controller.formatAreas(areas);
    var selectedAreas = opt_selected ? Controller.formatAreas(opt_selected) : undefined;
    var activeAreas = opt_active ? Controller.formatAreas(opt_active) : undefined;

    AreaExportUI.Controller.start(allAreas, selectedAreas, activeAreas);
  }

  /**
   * Format areas for export
   *
   * @param {Array<QueryAreaNode>} areas
   * @return {Array<Feature>}
   */
  static formatAreas(areas) {
    var formattedAreas = /** @type {Array<ITreeNode>} */ (areas).map(
        /**
         * @param {ITreeNode} node The tree node
         * @return {Feature} The area
         */
        function(node) {
          if (node instanceof AreaNode) {
            var area = node.getArea();

            if (area) {
              return AreaManager.mapOriginalGeoms(area);
            }
          }

          return null;
        }).filter(filterFalsey);

    return formattedAreas;
  }
}


/**
 * The view options for grouping areas
 * @type {!Object<string, INodeGroupBy>}
 */
Controller.VIEWS = {
  'None': -1, // you can't use null because Angular treats that as the empty/unselected option
  'Tag': new TagGroupBy(false),
  'Source': new SourceGroupBy(false)
};


exports = {
  Controller,
  directive,
  directiveTag
};
