goog.declareModuleId('os.ui.layer.compare.LayerCompareUI');

import * as capture from '../../../capture/capture.js';
import * as osMap from '../../../map/map.js';
import {ROOT} from '../../../os.js';
import Module from '../../module.js';
import {resize, removeResize} from '../../ui.js';
import {bringToFront, close as closeWindow, create as createWindow, getById as getWindowById} from '../../window.js';
import {launchConfirm} from '../../window/confirm.js';

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

const osImplements = goog.require('os.implements');
const instanceOf = goog.require('os.instanceOf');
const ILayer = goog.require('os.layer.ILayer');
const {getMapContainer} = goog.require('os.map.instance');
const {getMaxFeatures} = goog.require('os.ogc');
const SourceClass = goog.require('os.source.SourceClass');

const EventKey = goog.requireType('goog.events.Key');
const Control = goog.requireType('ol.control.Control');
const Layer = goog.requireType('ol.layer.Layer');
const ISource = goog.requireType('os.source.ISource');
const VectorSource = goog.requireType('os.source.Vector');


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
 * @param {Layer} layer The layer.
 * @return {boolean} If the layer is a basemap.
 */
const isBasemap = (layer) => osImplements(layer, ILayer.ID) &&
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
     * If the "left" map is on top. Order is really determined by z-index and which element width is adjusted, so the
     * selectors are really just to keep track of the two maps.
     * @type {boolean}
     * @protected
     */
    this.leftOnTop = true;

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

    const compareOptions = /** @type {LayerCompareOptions} */ (this.scope);

    // Add basemaps to the layer sets if they aren't already present.
    const basemaps = getBasemaps();
    if (!compareOptions.left.some(isBasemap)) {
      compareOptions.left = compareOptions.left.concat(basemaps);
    }
    if (!compareOptions.right.some(isBasemap)) {
      compareOptions.right = compareOptions.right.concat(basemaps);
    }

    // Set the layers on each map.
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
   * Set the layers in a collection.
   * @param {Collection<Layer>} collection The collection.
   * @param {Array<Layer>|undefined} layers The layers.
   * @protected
   */
  setCollectionLayers(collection, layers) {
    collection.clear();

    if (layers) {
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
    const collection = this.leftOnTop ? this.leftLayers : this.rightLayers;
    this.setCollectionLayers(collection, layers);
  }

  /**
   * Set the layers on the right map.
   * @param {Array<Layer>|undefined} layers The layers.
   */
  setRightLayers(layers) {
    const collection = this.leftOnTop ? this.rightLayers : this.leftLayers;
    this.setCollectionLayers(collection, layers);
  }

  /**
   * Swap layers in the window.
   * @export
   */
  swap() {
    this.leftOnTop = !this.leftOnTop;

    // Swap the order via CSS. This uses z-order to control which map is displayed on top, and the width of the top
    // map is adjusted by the slider (making it appear to be on the left).
    //
    // Map controls are also swapped to ensure they display on the right of the compare window.
    if (this.leftOnTop) {
      this.element.find(Selector.MAP_LEFT).addClass('c-layer-compare-top');
      this.element.find(Selector.MAP_RIGHT).removeClass('c-layer-compare-top').width('auto');

      this.leftMap.getControls().clear();
      this.rightMap.getControls().extend(createControls());
    } else {
      this.element.find(Selector.MAP_LEFT).removeClass('c-layer-compare-top').width('auto');
      this.element.find(Selector.MAP_RIGHT).addClass('c-layer-compare-top');

      this.rightMap.getControls().clear();
      this.leftMap.getControls().extend(createControls());
    }

    this.updateMapContainerWidth();
  }

  /**
   * Export the layers to an image
   * @export
   */
  export() {
    // Get both canvases
    var topCanvas = null;
    var bottomCanvas = null;
    if (this.leftOnTop) {
      topCanvas = this.element.find(`${Selector.MAP_LEFT} canvas`)[0];
      bottomCanvas = this.element.find(`${Selector.MAP_RIGHT} canvas`)[0];
    } else {
      topCanvas = this.element.find(`${Selector.MAP_RIGHT} canvas`)[0];
      bottomCanvas = this.element.find(`${Selector.MAP_LEFT} canvas`)[0];
    }

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
    const mapSelector = this.leftOnTop ? Selector.MAP_LEFT : Selector.MAP_RIGHT;
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
 * Launch the layer compare window.
 * @param {!LayerCompareOptions} options The layer compare options.
 */
const launchLayerCompareWindow = (options) => {
  const existing = getWindowById(windowId);
  if (existing) {
    const scope = existing.find(Selector.CONTAINER).scope();
    if (scope && scope['ctrl']) {
      const ctrl = /** @type {Controller} */ (scope['ctrl']);
      ctrl.setLeftLayers(options.left);
      ctrl.setRightLayers(options.right);
    }

    bringToFront(windowId);
  } else {
    const windowOptions = {
      'id': windowId,
      'label': 'Compare Layers',
      'icon': 'fas fa-layer-group',
      'x': 'center',
      'y': 'center',
      'width': 800,
      'min-width': 400,
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
