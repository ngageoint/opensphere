goog.declareModuleId('os.ui.LayersUI');

import VectorLayer from 'ol/src/layer/Vector.js';

import './layer/defaultlayerui.js';
import './layertree.js';
import './uiswitch.js';
import Settings from '../config/settings.js';
import DateGroupBy from '../data/groupby/dategroupby.js';
import LayerProviderGroupBy from '../data/groupby/layerprovidergroupby.js';
import LayerTypeGroupBy from '../data/groupby/layertypegroupby.js';
import LayerZOrderGroupBy from '../data/groupby/layerzordergroupby.js';
import LayerTreeSearch from '../data/layertreesearch.js';
import * as dispatcher from '../dispatcher.js';
import LayerEventType from '../events/layereventtype.js';
import osImplements from '../implements.js';
import Drawing from '../layer/drawinglayer.js';
import * as folder from '../layer/folder.js';
import FolderManager from '../layer/foldermanager.js';
import {getMapContainer} from '../map/mapinstance.js';
import Metrics from '../metrics/metrics.js';
import {AddData} from '../metrics/metricskeys.js';
import {ROOT} from '../os.js';
import FavoriteManager from '../user/settings/favoritemanager.js';
import TagGroupBy from './data/groupby/taggroupby.js';
import UIEvent from './events/uievent.js';
import UIEventType from './events/uieventtype.js';
import ILayerUIProvider from './ilayeruiprovider.js';
import * as importMenu from './menu/importmenu.js';
import * as layerMenu from './menu/layermenu.js';
import {toggleWindow} from './menu/windowsmenu.js';
import Module from './module.js';
import AbstractGroupByTreeSearchCtrl from './slick/abstractgroupbytreesearchctrl.js';
import {apply} from './ui.js';
import {close} from './window.js';
import windowSelector from './windowselector.js';

const {getRandomString} = goog.require('goog.string');

const {default: INodeGroupBy} = goog.requireType('os.data.groupby.INodeGroupBy');
const {default: ILayer} = goog.requireType('os.layer.ILayer');
const {default: Menu} = goog.requireType('os.ui.menu.Menu');


/**
 * The layers directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/layers.html',
  controller: Controller,
  controllerAs: 'layers'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'layers';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for Layers window
 * @unrestricted
 */
export class Controller extends AbstractGroupByTreeSearchCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element, 200);

    this.title = 'layers';
    try {
      this.scope['contextMenu'] = layerMenu.getMenu();
    } catch (e) {
    }

    this.scope['views'] = Controller.VIEWS;
    this.viewDefault = /** @type {string} */ (Settings.getInstance().get('layers.viewDefault', 'Z-Order'));

    /**
     * @type {?LayerTreeSearch}
     */
    this.treeSearch = new LayerTreeSearch('layerTree', $scope);

    /**
     * @type {!Object<string, !Menu>}
     * @private
     */
    this.menus_ = {};

    if (importMenu.getMenu()) {
      this.menus_['.add-data-group'] = importMenu.getMenu();
    }

    var map = getMapContainer();
    map.listen(LayerEventType.ADD, this.search, false, this);
    map.listen(LayerEventType.REMOVE, this.search, false, this);
    map.listen(LayerEventType.CHANGE, this.search, false, this);

    var fm = FolderManager.getInstance();
    fm.listen(folder.FolderEventType.FOLDER_CREATED, this.search, false, this);
    fm.listen(folder.FolderEventType.FOLDER_REMOVED, this.search, false, this);
    fm.listen(folder.FolderEventType.FOLDER_UPDATED, this.search, false, this);
    fm.listen(folder.FolderEventType.FOLDERS_CLEARED, this.search, false, this);

    // refresh on changed favorites
    Settings.getInstance().listen(FavoriteManager.KEY, this.search, false, this);

    this.scope['showTiles'] = true;
    this.scope['showFeatures'] = true;
    this.scope['tilesBtnIcon'] = ROOT + 'images/tiles-base.png';
    this.scope['featuresBtnIcon'] = ROOT + 'images/features-base.png';

    this.scope['createFolderTooltip'] = folder.CREATE_PROMPT;
    this.scope['viewEnabledTooltip'] = 'Automatically group layers based on the Group By selection. Disable to ' +
        'manually organize layers in folders.';

    this.init();

    folder.setFolderMenuEnabled(!this.scope['viewEnabled']);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    var map = getMapContainer();
    map.unlisten(LayerEventType.ADD, this.search, false, this);
    map.unlisten(LayerEventType.REMOVE, this.search, false, this);
    map.unlisten(LayerEventType.CHANGE, this.search, false, this);

    var fm = FolderManager.getInstance();
    fm.unlisten(folder.FolderEventType.FOLDER_CREATED, this.search, false, this);
    fm.unlisten(folder.FolderEventType.FOLDER_REMOVED, this.search, false, this);
    fm.unlisten(folder.FolderEventType.FOLDER_UPDATED, this.search, false, this);
    fm.unlisten(folder.FolderEventType.FOLDERS_CLEARED, this.search, false, this);

    Settings.getInstance().unlisten(FavoriteManager.KEY, this.search, false, this);

    super.disposeInternal();
  }

  /**
   * Closes the window
   */
  close() {
    close(this.element);
  }

  /**
   * Create a new folder.
   *
   * @export
   */
  createFolder() {
    const createOptions = {
      id: getRandomString(),
      type: 'folder',
      name: 'New Folder',
      children: [],
      parentId: '',
      collapsed: false
    };

    folder.createOrEditFolder(createOptions, (name) => {
      createOptions.name = name;
      FolderManager.getInstance().createFolder(createOptions);

      // Disable automatic grouping, if enabled.
      if (this.scope['viewEnabled']) {
        this.scope['viewEnabled'] = false;
        apply(this.scope);
      }
    });
  }

  /**
   * Change event handler for the groupBy control
   *
   * @export
   */
  onGroupByChanged() {
    Metrics.getInstance().updateMetric(AddData.GROUP_BY, 1);
    folder.setFolderMenuEnabled(!this.scope['viewEnabled']);
    this.search();
  }

  /**
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

  /**
   * Checks if a window is open in the application
   *
   * @param {string} flag The window id
   * @return {boolean}
   * @export
   */
  isWindowActive(flag) {
    var s = angular.element(windowSelector.CONTAINER).scope();
    var result = s['mainCtrl'][flag];

    if (result) {
      return true;
    }

    return !!angular.element('div[label="' + flag + '"].window').length;
  }

  /**
   * Opens the specified menu.
   *
   * @param {string} selector The menu target selector.
   * @export
   */
  openMenu(selector) {
    var menu = this.menus_[selector];
    if (menu) {
      var target = this.element.find(selector);
      if (target && target.length > 0) {
        menu.open(undefined, {
          my: 'left top+3',
          at: 'left bottom',
          of: target
        });
      }
    }
  }

  /**
   * Toggles a flag on mainCtrl
   *
   * @param {string} flagName The name of the flag to toggle
   * @export
   */
  toggle(flagName) {
    if (!toggleWindow(flagName)) {
      var event = new UIEvent(UIEventType.TOGGLE_UI, flagName);
      dispatcher.getInstance().dispatchEvent(event);
    }
  }

  /**
   * Toggles the Tile layers on/off
   *
   * @export
   */
  toggleTileLayers() {
    this.scope['showTiles'] = !this.scope['showTiles'];

    var layers = getMapContainer().getLayers();
    for (var i = 0; i < layers.length; i++) {
      // call the functions in SKIP_TOGGLE_FUNCS on each layer
      // to determine if it should not be toggled
      if (!Controller.SKIP_TOGGLE_FUNCS.some((fn) => fn(layers[i]))) {
        if (!(layers[i] instanceof VectorLayer)) {
          // toggle tiles
          /** @type {ILayer} */ (layers[i]).setEnabled(this.showTiles());
        }
      }
    }
  }

  /**
   * Checks if the Tiles should be displayed
   *
   * @return {boolean}
   * @export
   */
  showTiles() {
    return this.scope['showTiles'];
  }

  /**
   * Toggles the Feature layers on/off
   *
   * @export
   */
  toggleFeatureLayers() {
    this.scope['showFeatures'] = !this.scope['showFeatures'];

    var layers = getMapContainer().getLayers();
    for (var i = 0; i < layers.length; i++) {
      if (layers[i] instanceof VectorLayer) {
        // do not toggle the Drawing Layer
        if (!(layers[i] instanceof Drawing)) {
          /** @type {ILayer} */ (layers[i]).setLayerVisible(this.showFeatures());
        }
      }
    }
  }

  /**
   * Checks if the Features should be displayed
   *
   * @return {boolean}
   * @export
   */
  showFeatures() {
    return this.scope['showFeatures'];
  }
}

/**
 * The functions to be called to determine if the layer should not be toggled
 * @type {Array<function(!Layer):boolean>}
 */
Controller.SKIP_TOGGLE_FUNCS = [];

/**
 * The view options for grouping layers
 * @type {!Object<string, INodeGroupBy>}
 */
Controller.VIEWS = {
  'Recently Updated': new DateGroupBy(true),
  'Source': new LayerProviderGroupBy(),
  'Tag': new TagGroupBy(true),
  'Type': new LayerTypeGroupBy(),
  'Z-Order': new LayerZOrderGroupBy()
};
