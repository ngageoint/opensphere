goog.module('os.ui.layer.compare.LayerCompareUI');
goog.module.declareLegacyNamespace();

const dispose = goog.require('goog.dispose');
const {listen, unlistenByKey} = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');
const Collection = goog.require('ol.Collection');
const OLMap = goog.require('ol.Map');
const View = goog.require('ol.View');
const RotateControl = goog.require('ol.control.Rotate');
const ZoomControl = goog.require('ol.control.Zoom');
const {getCenter: getExtentCenter} = goog.require('ol.extent');

const {ROOT} = goog.require('os');
const capture = goog.require('os.capture');
const osImplements = goog.require('os.implements');
const ILayer = goog.require('os.layer.ILayer');
const osMap = goog.require('os.map');
const {getMapContainer} = goog.require('os.map.instance');
const {resize, removeResize} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const {
  bringToFront,
  close: closeWindow,
  create: createWindow,
  getById: getWindowById
} = goog.require('os.ui.window');

const EventKey = goog.requireType('goog.events.Key');
const Control = goog.requireType('ol.control.Control');
const Layer = goog.requireType('ol.layer.Layer');


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
let LayerCompareOptions;


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
 * The layercompare directive.
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'layercompare';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the layercompare directive.
 * @unrestricted
 */
class Controller {
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

    // Updates the map sizes when the window is resized.
    resize(this.element, this.resizeFn);
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
}


/**
 * Identifier for the layer compare window.
 * @type {string}
 */
const windowId = 'compare-layers';


/**
 * Launch the layer compare window.
 * @param {!LayerCompareOptions} options The layer compare options.
 */
const launchLayerCompare = (options) => {
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

exports = {
  LayerCompareOptions,
  directive,
  directiveTag,
  Controller,
  launchLayerCompare,
  windowId
};
