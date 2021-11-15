goog.declareModuleId('os.ui.layer.compare.LayerCompareUI');

import EventType from '../../../action/eventtype.js';
import * as capture from '../../../capture/capture.js';
import LayerEventType from '../../../events/layereventtype.js';
import {normalizeToCenter} from '../../../extent.js';
import {getGeometries} from '../../../feature/feature.js';
import {reduceExtentFromLayers, reduceExtentFromGeometries} from '../../../fn/fn.js';
import osImplements from '../../../implements.js';
import instanceOf from '../../../instanceof.js';
import ILayer from '../../../layer/ilayer.js';
import * as osMap from '../../../map/map.js';
import {getMapContainer} from '../../../map/mapinstance.js';
import {getMaxFeatures} from '../../../ogc/ogc.js';
import {ROOT} from '../../../os.js';
import SourceClass from '../../../source/sourceclass.js';
import {getLayersFromContext, visibleIfSupported} from '../../../ui/menu/layermenu.js';
import Menu from '../../menu/menu.js';
import MenuItem from '../../menu/menuitem.js';
import MenuItemType from '../../menu/menuitemtype.js';
import Module from '../../module.js';
import {resize, removeResize} from '../../ui.js';
import {bringToFront, close as closeWindow, create as createWindow, getById as getWindowById} from '../../window.js';
import {launchConfirm} from '../../window/confirm.js';
import LayerCompareNode from './layercomparenode.js';

const Promise = goog.require('goog.Promise');
const dispose = goog.require('goog.dispose');
const ViewportSizeMonitor = goog.require('goog.dom.ViewportSizeMonitor');
const {listen, unlistenByKey} = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');
const Collection = goog.require('ol.Collection');
const OLMap = goog.require('ol.Map');
const View = goog.require('ol.View');
const RotateControl = goog.require('ol.control.Rotate');
const ZoomControl = goog.require('ol.control.Zoom');
const {getCenter: getExtentCenter} = goog.require('ol.extent');
const OLVectorSource = goog.require('ol.source.Vector');
const olExtent = goog.require('ol.extent');

const EventKey = goog.requireType('goog.events.Key');
const Control = goog.requireType('ol.control.Control');
const Layer = goog.requireType('ol.layer.Layer');
const LayerEvent = goog.requireType('os.events.LayerEvent');
const {Context} = goog.requireType('os.ui.menu.layer');
const {default: ISource} = goog.requireType('os.source.ISource');
const {default: VectorSource} = goog.requireType('os.source.Vector');
const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');
const {default: SlickTreeNode} = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * Element selectors for the UI.
 * @enum {string}
 */
const Selector = {
  CONTAINER: '.js-layer-compare-container',
  MAP_LEFT: '.js-layer-compare-left',
  MAP_RIGHT: '.js-layer-compare-right',
  SLIDER: '.js-layer-compare-slider'
};

/**
 * Menu event types.
 * @enum {string}
 */
const MenuEventType = {
  MOVE_LEFT: 'compare:moveLeft',
  MOVE_RIGHT: 'compare:moveRight',
  GO_TO: 'compare:goTo',
  REMOVE: 'compare:remove'
};

/**
 * @typedef {{
 *   left: (Array<Layer>|undefined),
 *   right: (Array<Layer>|undefined)
 * }}
 */
export let LayerCompareOptions;

/**
 * Get active basemap layers from the main map.
 * @return {!Array<!Layer>}
 */
const getBasemaps = () => getMapContainer().getLayers().filter(isBasemap);

/**
 * If a layer is a basemap layer.
 * @param {Layer|ILayer} layer The layer.
 * @return {boolean} If the layer is a basemap.
 */
export const isBasemap = (layer) => osImplements(layer, ILayer.ID) &&
/** @type {ILayer} */ (layer).getOSType() === 'Map Layers';

/**
 * Create the controls to display on the map.
 * @return {!Array<!Control>}
 */
const createControls = () => [
  new RotateControl({
    autoHide: false,
    className: 'c-layer-compare-control ol-rotate'
  }),
  new ZoomControl({
    className: 'c-layer-compare-control ol-zoom'
  })
];

/**
 * Launch a dialog warning users of the risks in using 2D with lots of data.
 *
 * @return {!Promise}
 */
const launchLayerComparePerformanceDialog = function() {
  return new Promise(function(resolve, reject) {
    var text = '<p>Using Layer Compare with the current data volume may degrade performance considerably or crash ' +
        'the browser. Click OK to use Layer Compare, or Cancel to abort.</p>' +
        '<p>If you would like to use Layer Compare safely, please consider narrowing your time range, applying ' +
        'filters, shrinking your query areas, or removing some feature layers.</p>';

    launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: resolve,
      cancel: reject,
      prompt: text,
      windowOptions: {
        'label': 'Feature Limit Exceeded',
        'icon': 'fa fa-warning',
        'x': 'center',
        'y': 'center',
        'width': '425',
        'height': 'auto',
        'modal': 'true',
        'headerClass': 'bg-warning u-bg-warning-text'
      }
    }));
  });
};

/**
 * The layercompare directive.
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/layer/compare/layercompare.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'layercompare';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the layercompare directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * The drag event listener keys.
     * @type {Array<!EventKey>}
     * @protected
     */
    this.dragListeners = null;

    /**
     * Offset from where the drag event started to the slider center.
     * @type {number}
     * @protected
     */
    this.dragOffset = 0;

    /**
     * The left layers to compare.
     * @type {!Collection<Layer>}
     * @protected
     */
    this.leftLayers = new Collection();

    /**
     * The left map.
     * @type {OLMap}
     * @protected
     */
    this.leftMap = null;

    /**
     * The left layer nodes.
     * @export {!Array<SlickTreeNode>}
     */
    this.leftNodes = [];

    /**
     * The left selected layer nodes.
     * @export {!Array<SlickTreeNode>}
     */
    this.leftSelected = [];

    /**
     * The menu for the left SlickGrid.
     * @export {!Menu<undefined>}
     */
    this.leftMenu = new Menu(new MenuItem({
      type: MenuItemType.ROOT,
      children: [{
        label: 'Move Right',
        eventType: MenuEventType.MOVE_RIGHT,
        icons: ['<i class="fas fa-fw fa-angle-right"></i>'],
        tooltip: 'Move the selected layers to the right map',
        handler: this.moveSelected.bind(this, 'right'),
        beforeRender: goog.partial(canMove, 'right'),
        sort: 0
      }, {
        label: 'Go To',
        eventType: EventType.GOTO,
        icons: ['<i class="fa fa-fw fa-fighter-jet"></i>'],
        tooltip: 'Repositions the map to show the layer',
        handler: this.goTo.bind(this),
        beforeRender: visibleIfSupported,
        sort: 10
      }, {
        label: 'Remove',
        eventType: MenuEventType.REMOVE,
        icons: ['<i class="fas fa-fw fa-times"></i>'],
        tooltip: 'Remove the selected layers from the Layer Comparison',
        handler: this.removeSelected.bind(this, 'left'),
        sort: 20
      }]
    }));

    /**
     * The right layers to compare.
     * @type {!Collection<Layer>}
     * @protected
     */
    this.rightLayers = new Collection();

    /**
     * The right map.
     * @type {OLMap}
     * @protected
     */
    this.rightMap = null;

    /**
     * The right layer nodes.
     * @export {!Array<SlickTreeNode>}
     */
    this.rightNodes = [];

    /**
     * The right selected layer nodes.
     * @export {!Array<SlickTreeNode>}
     */
    this.rightSelected = [];

    /**
     * The menu for the right SlickGrid.
     * @export {!Menu<undefined>}
     */
    this.rightMenu = new Menu(new MenuItem({
      type: MenuItemType.ROOT,
      children: [{
        label: 'Move Left',
        eventType: MenuEventType.MOVE_LEFT,
        icons: ['<i class="fas fa-fw fa-angle-left"></i>'],
        tooltip: 'Move the selected layers to the left map',
        handler: this.moveSelected.bind(this, 'left'),
        beforeRender: goog.partial(canMove, 'left'),
        sort: 0
      }, {
        label: 'Go To',
        eventType: EventType.GOTO,
        icons: ['<i class="fa fa-fw fa-fighter-jet"></i>'],
        tooltip: 'Repositions the map to show the layer',
        handler: this.goTo.bind(this),
        beforeRender: visibleIfSupported,
        sort: 10
      }, {
        label: 'Remove',
        eventType: MenuEventType.REMOVE,
        icons: ['<i class="fas fa-fw fa-times"></i>'],
        tooltip: 'Remove the selected layers from the Layer Comparison',
        handler: this.removeSelected.bind(this, 'right'),
        sort: 20
      }]
    }));

    /**
     * The shared map view.
     * @type {View}
     * @protected
     */
    this.view = null;

    /**
     * Prebound window resize handler.
     * @type {function()}
     * @protected
     */
    this.resizeFn = this.updateMapSize.bind(this);

    /**
     * Browser window size monitor for handling browser resizes.
     * @type {ViewportSizeMonitor}
     * @protected
     */
    this.vsm = new ViewportSizeMonitor();

    // Updates the map sizes when the window or browser is resized.
    resize(this.element, this.resizeFn);
    this.vsm.listen(GoogEventType.RESIZE, this.handleBrowserResize, false, this);
  }

  /**
   * Angular $onDestroy lifecycle call.
   */
  $onDestroy() {
    if (this.element) {
      removeResize(this.element, this.resizeFn);
    }

    if (this.dragListeners) {
      this.dragListeners.forEach(unlistenByKey);
      this.dragListeners = null;
    }

    getMapContainer().unlisten(LayerEventType.REMOVE, this.onLayerRemoved, false, this);

    dispose(this.leftMap);
    dispose(this.rightMap);
    dispose(this.view);
    dispose(this.vsm);

    this.scope = null;
    this.element = null;
  }

  /**
   * Angular $onInit lifecycle call.
   */
  $onInit() {
    this.view = this.createView();

    // Create two OpenLayers maps that share a view and are stacked on top of one another.
    const leftEl = this.element.find(Selector.MAP_LEFT)[0];
    const rightEl = this.element.find(Selector.MAP_RIGHT)[0];

    this.leftMap = new OLMap({
      controls: [],
      layers: this.leftLayers,
      target: leftEl,
      view: this.view
    });

    const controls = new Collection(createControls());

    this.rightMap = new OLMap({
      controls,
      layers: this.rightLayers,
      target: rightEl,
      view: this.view
    });

    // Update map canvases to fill the available space.
    this.updateMapSize();

    // Make the left map container 50% width for an initial split view.
    this.element.find(Selector.MAP_LEFT).width('50%');

    // listen for layer remove events so we can remove them from the compare
    getMapContainer().listen(LayerEventType.REMOVE, this.onLayerRemoved, false, this);

    // Set the layers on each map.
    const compareOptions = /** @type {LayerCompareOptions} */ (this.scope);
    this.setLeftLayers(compareOptions.left);
    this.setRightLayers(compareOptions.right);
  }

  /**
   * Close the window.
   * @export
   */
  close() {
    closeWindow(this.element);
  }

  /**
   * Create an OpenLayers view initialized from the main map's view.
   * @return {!View} The view.
   * @protected
   */
  createView() {
    const mapContainer = getMapContainer();
    const mainMap = mapContainer ? mapContainer.getMap() : null;
    const mainView = mainMap ? mainMap.getView() : mainMap;

    const projection = osMap.PROJECTION;
    const center = mainView ? mainView.getCenter() : getExtentCenter(projection.getExtent());
    const rotation = mainView ? mainView.getRotation() : 0;
    const zoom = mainView ? mainView.getZoom() : osMap.DEFAULT_ZOOM;

    return new View({
      center,
      minZoom: osMap.MIN_ZOOM,
      maxZoom: osMap.MAX_ZOOM,
      projection,
      rotation,
      zoom
    });
  }

  /**
   * Checks whether a layer is present in the comparison window.
   * @param {Layer|ILayer} layer The layer to check.
   * @param {string=} opt_target Optional target side to check.
   * @return {boolean} Whether we have the layer.
   */
  hasLayer(layer, opt_target) {
    layer = /** @type {Layer} */ (layer);
    if (opt_target == 'left') {
      return this.leftLayers.getArray().includes(layer);
    } else if (opt_target == 'right') {
      return this.rightLayers.getArray().includes(layer);
    }

    return this.leftLayers.getArray().includes(layer) || this.rightLayers.getArray().includes(layer);
  }

  /**
   * Set the layers in a collection.
   * @param {Collection<Layer>} collection The collection.
   * @param {Array<Layer>|undefined} layers The layers.
   * @protected
   */
  setCollectionLayers(collection, layers) {
    collection.clear();

    if (layers) {
      // always include the basemaps here, but never add duplicates
      getBasemaps().forEach((basemap) => {
        if (!layers.includes(basemap)) {
          layers.push(basemap);
        }
      });

      layers.forEach((layer) => {
        collection.push(layer);
      });
    }
  }

  /**
   * Set the layers on the left map.
   * @param {Array<Layer>|undefined} layers The layers.
   */
  setLeftLayers(layers) {
    const collection = this.leftLayers;
    this.setCollectionLayers(collection, layers);

    const nodes = this.createNodes(layers);
    this.leftNodes = nodes;
  }

  /**
   * Set the layers on the right map.
   * @param {Array<Layer>|undefined} layers The layers.
   */
  setRightLayers(layers) {
    const collection = this.rightLayers;
    this.setCollectionLayers(collection, layers);

    const nodes = this.createNodes(layers);
    this.rightNodes = nodes;
  }

  /**
   * Set the layers on the right map.
   * @param {Array<Layer|ILayer>|undefined} layers The layers.
   * @param {string} target The side to add the layers to.
   */
  addLayers(layers, target) {
    if (target == 'left') {
      const leftLayers = this.leftLayers.getArray().filter((l) => !isBasemap(l));
      this.setLeftLayers(leftLayers.concat(layers));
    } else if (target == 'right') {
      const rightLayers = this.rightLayers.getArray().filter((l) => !isBasemap(l));
      this.setRightLayers(rightLayers.concat(layers));
    }
  }

  /**
   * Creates tree nodes from layers.
   * @param {Array<Layer>|undefined} layers The layers.
   * @return {!Array<SlickTreeNode>}
   */
  createNodes(layers) {
    let nodes = [];
    if (layers && layers.length > 0) {
      nodes = layers.map((layer) => {
        if (!isBasemap(layer)) {
          const node = new LayerCompareNode();
          node.setLayer(/** @type {ILayer} */ (layer));
          return node;
        }

        return null;
      }).filter((layer) => !!layer);
    }

    return nodes;
  }

  /**
   * Swap layers in the window.
   * @export
   */
  swap() {
    const rightLayerArr = this.rightLayers.getArray().slice();
    const leftLayerArr = this.leftLayers.getArray().slice();

    this.setRightLayers(leftLayerArr);
    this.setLeftLayers(rightLayerArr);
  }

  /**
   * Moves selected layers to the other side.
   * @param {string} target The side to move to.
   * @export
   */
  moveSelected(target) {
    const rightLayerArr = this.rightLayers.getArray();
    const leftLayerArr = this.leftLayers.getArray();

    if (target == 'left') {
      const layers = this.rightSelected.map((node) => node.getLayer());
      const rightUnselectedLayers = rightLayerArr.filter((layer) => !layers.includes(layer));
      this.setRightLayers(rightUnselectedLayers);
      this.setLeftLayers(leftLayerArr.concat(layers));
    } else if (target == 'right') {
      const layers = this.leftSelected.map((node) => node.getLayer());
      const leftUnselectedLayers = leftLayerArr.filter((layer) => !layers.includes(layer));
      this.setRightLayers(rightLayerArr.concat(layers));
      this.setLeftLayers(leftUnselectedLayers);
    }
  }

  /**
   * Whether the selection can be moved to the right.
   * @return {boolean}
   * @export
   */
  disableMoveRight() {
    return this.leftSelected.length == 0 || this.leftSelected.some((node) => this.hasLayer(node.getLayer(), 'right'));
  }

  /**
   * Whether the selection can be moved to the left.
   * @return {boolean}
   * @export
   */
  disableMoveLeft() {
    return this.rightSelected.length == 0 || this.rightSelected.some((node) => this.hasLayer(node.getLayer(), 'left'));
  }

  /**
   * Removes selected layers from a side.
   * @param {string} from The side to move to.
   */
  removeSelected(from) {
    if (from == 'right') {
      const rightLayerArr = this.rightLayers.getArray();
      const layers = this.rightSelected.map((node) => node.getLayer());
      const rightUnselectedLayers = rightLayerArr.filter((layer) => !layers.includes(layer));
      this.setRightLayers(rightUnselectedLayers);
    } else if (from == 'left') {
      const leftLayerArr = this.leftLayers.getArray();
      const layers = this.leftSelected.map((node) => node.getLayer());
      const leftUnselectedLayers = leftLayerArr.filter((layer) => !layers.includes(layer));
      this.setLeftLayers(leftUnselectedLayers);
    }
  }

  /**
   * Removes a layer from the compare.
   * @param {Layer|ILayer} layer The layer to remove.
   */
  remove(layer) {
    // please the compiler and our terrible layer typing
    layer = /** @type {Layer} */ (layer);

    const rightLayerArr = this.rightLayers.getArray().filter((item) => item !== layer);
    const leftLayerArr = this.leftLayers.getArray().filter((item) => item !== layer);

    // if layers were filtered out, reset with the new array
    if (this.rightLayers.getLength() > rightLayerArr.length) {
      this.setRightLayers(rightLayerArr);
    }

    if (this.leftLayers.getLength() > leftLayerArr.length) {
      this.setLeftLayers(leftLayerArr);
    }
  }

  /**
   * Handle the "Go To" menu event.
   * @param {!MenuEvent<Context>} event The menu event.
   */
  goTo(event) {
    // aggregate the features and execute flyTo, in case they have altitude and pure extent wont cut it
    const layers = getLayersFromContext(event.getContext());
    const features = layers.reduce((feats, layer) => {
      let source = layer.getSource();
      if (source instanceof OLVectorSource) {
        source = /** @type {OLVectorSource} */ (source);
        const newFeats = source.getFeatures();
        return newFeats.length > 0 ? feats.concat(newFeats) : feats;
      }
      return feats;
    }, []);

    let extent;
    if (features && features.length) {
      extent = getGeometries(features).reduce(reduceExtentFromGeometries, olExtent.createEmpty());
    } else {
      extent = layers.reduce(reduceExtentFromLayers, olExtent.createEmpty());
    }

    if (extent && extent.indexOf(Infinity) != -1 || extent.indexOf(-Infinity) != -1) {
      return;
    }

    // just use the left map here, either one works since their views are synchronized
    const leftView = this.leftMap.getView();
    const buffer = .1;

    if (olExtent.getWidth(extent) < buffer && olExtent.getHeight(extent) < buffer) {
      extent = olExtent.buffer(extent, buffer);
    }

    // In 2D views, projections supporting wrapping can pan "multiple worlds" over. We want to pan the least
    // amount possible to go to the spot and avoid jumping "multiple worlds" back to the "origin world"
    extent = normalizeToCenter(extent, leftView.getCenter()[0]);

    leftView.fit(extent, {
      duration: 1000,
      maxZoom: osMap.MAX_AUTO_ZOOM,
      constrainResolution: true
    });
  }

  /**
   * Export the layers to an image
   * @export
   */
  export() {
    // Get both canvases
    var topCanvas = this.element.find(`${Selector.MAP_LEFT} canvas`)[0];
    var bottomCanvas = this.element.find(`${Selector.MAP_RIGHT} canvas`)[0];

    // Get the location of the split
    const slider = this.element.find(Selector.SLIDER)[0];
    const split = slider.offsetLeft * window.devicePixelRatio;

    // Create the canvas that will be exported as an image
    var fullCanvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
    const width = fullCanvas.width = bottomCanvas.width;
    const height = fullCanvas.height = bottomCanvas.height;
    var fullContext = fullCanvas.getContext('2d');

    // Fill the image with a black background to prevent transparency related issues
    fullContext.fillStyle = 'black';
    fullContext.fillRect(0, 0, width, height);

    // Crop and add the bottom canvas to the right of the image
    fullContext.drawImage(bottomCanvas, split, 0, width, height,
        split, 0, width, height);

    // Crop and add the top canvas to the left of the image
    fullContext.drawImage(topCanvas, 0, 0, split, height,
        0, 0, split, height);

    // Draw a line to represent where the canvases are split
    fullContext.beginPath();
    fullContext.moveTo(split, height);
    fullContext.lineTo(split, 0);
    fullContext.stroke();

    // Export the combined canvas
    capture.saveCanvas(fullCanvas);
  }

  /**
   * Handle slider drag event.
   * @param {Event} event The drag event.
   * @protected
   */
  handleDrag(event) {
    if (event && this.element) {
      event.preventDefault();
      event.stopPropagation();

      const container = this.element.find(Selector.CONTAINER)[0];
      if (container) {
        // Move the slider to the mouse position, clamping within the bounds of the container.
        const rect = container.getBoundingClientRect();
        const offset = Math.round(Math.min(Math.max(event.clientX - rect.x - this.dragOffset, 0), rect.width));
        this.element.find(Selector.SLIDER).css('left', `${offset}px`);

        this.updateMapContainerWidth();
      }
    }
  }

  /**
   * Update the width of the map container relative to the slider.
   * @protected
   */
  updateMapContainerWidth() {
    // Update the width of the top map. This makes it appear on the left side of the comparison.
    const width = this.element.find(Selector.SLIDER).css('left');
    const mapSelector = Selector.MAP_LEFT;
    this.element.find(mapSelector).width(width);
  }

  /**
   * Toggle dragging the compare slider.
   * @param {Event} event The event.
   * @export
   */
  toggleDrag(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();

      const dragging = event.type === GoogEventType.MOUSEDOWN;
      if (dragging && !this.dragListeners) {
        // The click event origin is on the slider, but we want to move the line relative to the mousedown position so
        // it doesn't jump on the first mousemove event. Determine the offset between the mouse event and the line.
        const slider = this.element.find(Selector.SLIDER)[0];
        if (slider) {
          const sliderRect = slider.getBoundingClientRect();
          // The extra offset is a little arbitrary and is due to the EW cursor being ~12px wide and the event is
          // relative to the left edge. This tries to account for that to avoid an initial jump due to this difference.
          this.dragOffset = event.clientX - sliderRect.x + 6;
        } else {
          this.dragOffset = 0;
        }

        this.dragListeners = [
          listen(window, GoogEventType.MOUSEMOVE, this.handleDrag, false, this),
          listen(window, GoogEventType.MOUSEUP, this.toggleDrag, false, this)
        ];
      } else if (!dragging && this.dragListeners) {
        this.dragListeners.forEach(unlistenByKey);
        this.dragListeners = null;
      }
    }
  }

  /**
   * Handles layer remove events from the main map.
   * @param {LayerEvent} event
   */
  onLayerRemoved(event) {
    if (this.hasLayer(event.layer)) {
      this.remove(event.layer);
    }
  }

  /**
   * Update the OpenLayers map canvases to fill the container.
   * @protected
   */
  updateMapSize() {
    if (this.element && this.leftMap && this.rightMap) {
      const container = this.element.find(Selector.CONTAINER);
      const size = [container.width(), container.height()];
      this.leftMap.setSize(size);
      this.rightMap.setSize(size);
    }
  }

  /**
   * Handler for browser window resize events. Requests an update to the map sizes on the next animation frame.
   * These updates won't happen on browser resize without the requestAnimationFrame call due to the OL map render
   * being tied to animation frames.
   * @protected
   */
  handleBrowserResize() {
    requestAnimationFrame(this.resizeFn);
  }
}

/**
 * Identifier for the layer compare window.
 * @type {string}
 */
export const windowId = 'compare-layers';

/**
 * Gets whether an instance of the window exists.
 * @return {boolean}
 */
export const exists = () => !!getWindowById(windowId);

/**
 * Gets the existing controller instance for the UI.
 * @return {?Controller}
 */
export const getCompareController = () => {
  const existing = getWindowById(windowId);
  if (existing) {
    const scope = existing.find(Selector.CONTAINER).scope();
    if (scope && scope['ctrl']) {
      return /** @type {Controller} */ (scope['ctrl']);
    }
  }

  return null;
};

/**
 * Checks whether a layer can be moved.
 * @param {string} target Target side to check.
 * @param {Context} context The menu context.
 * @this {MenuItem}
 */
const canMove = function(target, context) {
  const layers = getLayersFromContext(context);
  const controller = getCompareController();

  if (controller && layers.some((l) => controller.hasLayer(l, target))) {
    this.visible = false;
  }
};

/**
 * Launch the layer compare window.
 * @param {!LayerCompareOptions} options The layer compare options.
 */
const launchLayerCompareWindow = (options) => {
  const existingController = getCompareController();
  if (existingController) {
    existingController.setLeftLayers(options.left);
    existingController.setRightLayers(options.right);
    bringToFront(windowId);
  } else {
    const windowOptions = {
      'id': windowId,
      'label': 'Compare Layers',
      'icon': 'fas fa-layer-group',
      'x': 'center',
      'y': 'center',
      'width': 1200,
      'min-width': 600,
      'max-width': 2000,
      'height': 600,
      'min-height': 300,
      'max-height': 2000,
      'show-close': true
    };

    const template = `<${directiveTag}></${directiveTag}>`;
    createWindow(windowOptions, template, undefined, undefined, undefined, options);
  }
};

/**
 * Launch the layer compare.
 * @param {!LayerCompareOptions} options The layer compare options.
 */
export const launchLayerCompare = (options) => {
  const featureCount = countFeatures(options.left) + countFeatures(options.right);
  if (featureCount > getMaxFeatures('2d')) {
    launchLayerComparePerformanceDialog().then(() => {
      // User decides to open the window despite the performance warning
      launchLayerCompareWindow(options);
    }, () => {
      // User decides not to open the window, silently ignore the rejection
    });
  } else {
    launchLayerCompareWindow(options);
  }
};

/**
 * Count the features in an array of layers.
 * @param {Array<Layer>=} layerArray An array of layers.
 * @return {number} The total number of features in the layer array.
 */
const countFeatures = (layerArray) => {
  if (layerArray && layerArray.length > 0) {
    var featureCount = 0;
    layerArray.forEach((layer) => {
      var source = /** @type {VectorSource} */ (layer.getSource());
      if (source && instanceOf(source, SourceClass.VECTOR)) {
        featureCount += source.getFeatureCount();
      }
    });
    return featureCount;
  } else {
    return 0;
  }
};

/**
 * Maximum zoom used for go to/fly to operations
 * @type {number}
 */
export const MAX_AUTO_ZOOM = 18;
