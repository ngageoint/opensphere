goog.declareModuleId('plugin.places.ui.PlacesUI');

import '../../../os/ui/layertree.js';
import '../../../os/ui/uiswitch.js';
import './placesbutton.js';

import {ROOT} from '../../../os/os.js';
import ILayerUIProvider from '../../../os/ui/ilayeruiprovider.js';
import * as layerMenu from '../../../os/ui/menu/layermenu.js';
import Module from '../../../os/ui/module.js';
import SlickGridEvent from '../../../os/ui/slick/slickgridevent.js';
import * as ui from '../../../os/ui/ui.js';
import * as KMLTreeExportUI from '../../file/kml/ui/kmltreeexportui.js';
import {createOrEditFolder} from '../../file/kml/ui/kmlui.js';
import PlacesManager from '../placesmanager.js';

const Disposable = goog.require('goog.Disposable');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const EventType = goog.require('os.config.EventType');
const osImplements = goog.require('os.implements');
const Metrics = goog.require('os.metrics.Metrics');
const {Places: PlacesKeys} = goog.require('os.metrics.keys');

const ExportOptions = goog.requireType('os.ex.ExportOptions');
const {default: Menu} = goog.requireType('os.ui.menu.Menu');
const {FolderOptions} = goog.requireType('plugin.file.kml.ui');
const {default: KMLNode} = goog.requireType('plugin.file.kml.ui.KMLNode');


/**
 * The places directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/plugin/places/places.html',
  controller: Controller,
  controllerAs: 'places'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'places';


/**
 * Add the directive to the module.
 */
Module.directive('places', [directive]);



/**
 * Controller function for the places directive
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @ngInject
   */
  constructor($scope) {
    super();

    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    var pm = PlacesManager.getInstance();

    /**
     * The Places root KML node.
     * @type {KMLNode}
     * @private
     */
    this.placesRoot_ = pm.getPlacesRoot();
    if (!this.placesRoot_ && !pm.isLoaded()) {
      pm.listenOnce(EventType.LOADED, this.onPlacesReady_, false, this);
    }

    /**
     * The context menu for Places.
     * @type {Menu<layerMenu.Context>|undefined}
     */
    this['contextMenu'] = layerMenu.getMenu();

    /**
     * The Places KML tree.
     * @type {!Array<Object>}
     */
    this['treeData'] = this.placesRoot_ ? [this.placesRoot_] : [];

    /**
     * The selected node in the tree.
     * @type {KMLNode}
     */
    this['selected'] = null;

    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    PlacesManager.getInstance().unlisten(EventType.LOADED, this.onPlacesReady_, false, this);

    this.placesRoot_ = null;
    this.scope_ = null;
  }

  /**
   * Handle places manager loaded event.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onPlacesReady_(event) {
    this.placesRoot_ = PlacesManager.getInstance().getPlacesRoot();

    if (this.placesRoot_) {
      this['treeData'] = [this.placesRoot_];
      ui.apply(this.scope_);
    }
  }

  /**
   * If the places root node is available.
   *
   * @return {boolean}
   * @export
   */
  hasRoot() {
    return this.placesRoot_ != null;
  }

  /**
   * Export places to a KMZ.
   *
   * @todo import ExportFields from places & add "fields: ExportFields" to export internal fields
   * @export
   */
  export() {
    if (this.placesRoot_) {
      var activePlaces = getActivePlaces(this.placesRoot_);

      launchExportUI(this.placesRoot_, /** @type {ExportOptions} */ ({
        allData: this.placesRoot_.getChildren(),
        selectedData: this['selected'],
        activeData: activePlaces,
        additionalOptions: true,
        items: this.placesRoot_.getChildren()
      }));

      Metrics.getInstance().updateMetric(PlacesKeys.EXPORT, 1);
    } else {
      AlertManager.getInstance().sendAlert('Nothing to export.', AlertEventSeverity.WARNING);
    }
  }

  /**
   * Import places from a file/URL.
   *
   * @export
   */
  import() {
    PlacesManager.getInstance().startImport();
    Metrics.getInstance().updateMetric(PlacesKeys.IMPORT, 1);
  }

  /**
   * Create a new folder and add it to the tree.
   *
   * @export
   */
  addFolder() {
    var parent = this['selected'] && this['selected'].length == 1 ? this['selected'][0] : this.placesRoot_;
    while (parent && !parent.isFolder()) {
      parent = parent.getParent();
    }

    if (parent) {
      createOrEditFolder(/** @type {!FolderOptions} */ ({
        'parent': parent
      }));
    }
    Metrics.getInstance().updateMetric(PlacesKeys.ADD_FOLDER, 1);
  }

  /**
   * Fully expands the tree from the provided node. Uses the first node if multiple are selected.
   *
   * @export
   */
  expandAll() {
    var node = this['selected'] && this['selected'].length > 0 ? this['selected'][0] : this.placesRoot_;
    if (node) {
      node.setCollapsed(false, true);
      this.scope_.$broadcast(SlickGridEvent.INVALIDATE_ROWS);
    }
    Metrics.getInstance().updateMetric(PlacesKeys.EXPAND_ALL, 1);
  }

  /**
   * Fully collapses the tree from the provided node. Uses the first node if multiple are selected.
   *
   * @export
   */
  collapseAll() {
    var node = this['selected'] && this['selected'].length > 0 ? this['selected'][0] : this.placesRoot_;
    if (node) {
      node.setCollapsed(true, true);
      this.scope_.$broadcast(SlickGridEvent.INVALIDATE_ROWS);
    }
    Metrics.getInstance().updateMetric(PlacesKeys.COLLAPSE_ALL, 1);
  }

  /**
   * Gets the accordion UI associated with the selected item.
   *
   * @param {*} item
   * @return {?string}
   * @export
   */
  getUi(item) {
    if (item && osImplements(item, ILayerUIProvider.ID)) {
      return item.getLayerUI(item);
    }

    return null;
  }
}


/**
 * Get active nodes from root
 * @param {!KMLNode} root
 * @return {Array<KMLNode>}
 */
const getActivePlaces = function(root) {
  var places = root.getChildren() || [];
  var activePlaces = [];

  for (var i = 0; i < places.length; i++) {
    var place = places[i];

    if (place.canAddChildren) {
      var active = getActivePlaces(places[i]);
      var clone = place.clone();

      clone.setChildren(active);
      activePlaces.push(clone);
    } else if (place.getState() == 'on') {
      activePlaces.push(place);
    }
  }

  return activePlaces;
};


/**
 * Export places to a KMZ.
 * @param {!KMLNode} rootNode
 * @param {ExportOptions=} opt_options
 */
export const launchExportUI = function(rootNode, opt_options) {
  var tooltip = 'Places-specific feature styles (e.g. Range Rings) will not be exported, and will render as points. ' +
      'The standard Layer export window can support this action.';
  KMLTreeExportUI.launchTreeExport(rootNode, 'Export Places', opt_options, tooltip);
};
