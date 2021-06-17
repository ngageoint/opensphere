goog.module('os.ui.layer.compare.LayerCompareUI');
goog.module.declareLegacyNamespace();

const dispose = goog.require('goog.dispose');
const {listen, unlistenByKey} = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');
const Collection = goog.require('ol.Collection');
const OLMap = goog.require('ol.Map');
const View = goog.require('ol.View');
const {createEmpty, isEmpty} = goog.require('ol.extent');

const {ROOT} = goog.require('os');
const {filterFalsey, reduceExtentFromLayers} = goog.require('os.fn');
const osMap = goog.require('os.map');
const Module = goog.require('os.ui.Module');
const {resize, removeResize} = goog.require('os.ui');
const {
  bringToFront,
  close: closeWindow,
  create: createWindow,
  exists: windowExists
} = goog.require('os.ui.window');

const EventKey = goog.requireType('goog.events.Key');
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
    // Create two OpenLayers maps that share a view and are stacked on top of one another.
    const leftEl = this.element.find(Selector.MAP_LEFT)[0];
    const rightEl = this.element.find(Selector.MAP_RIGHT)[0];

    this.view = new View({
      center: [0, 0],
      zoom: 3,
      projection: osMap.PROJECTION,
      minZoom: osMap.MIN_ZOOM,
      maxZoom: osMap.MAX_ZOOM
    });

    this.leftMap = new OLMap({
      controls: [],
      layers: this.leftLayers,
      target: leftEl,
      view: this.view
    });

    this.rightMap = new OLMap({
      controls: [],
      layers: this.rightLayers,
      target: rightEl,
      view: this.view
    });

    // Update map canvases to fill the available space.
    this.updateMapSize();

    // Make the left map container 50% width for an initial split view.
    this.element.find(Selector.MAP_LEFT).width('50%');

    // Set the layers on each map.
    const compareOptions = /** @type {LayerCompareOptions} */ (this.scope);
    this.setCollectionLayers(this.leftLayers, compareOptions.left);
    this.setCollectionLayers(this.rightLayers, compareOptions.right);

    // Fit the view to the available layers.
    this.fit();
  }

  /**
   * Close the window.
   * @export
   */
  close() {
    closeWindow(this.element);
  }

  /**
   * Fit layers to the window.
   * @param {Array<!Layer>=} opt_layers The layer(s) to fit. Defaults to all layers.
   * @export
   */
  fit(opt_layers) {
    const layers = opt_layers || this.leftLayers.getArray().concat(this.rightLayers.getArray());
    if (layers && this.view) {
      let extent = layers.filter(filterFalsey).reduce(reduceExtentFromLayers, createEmpty());
      if (isEmpty(extent)) {
        extent = osMap.PROJECTION.getExtent();
      }

      this.view.fit(extent);
    }
  }

  /**
   * Set the layers in a collection.
   * @param {Collection<Layer>} collection The collection.
   * @param {Array<Layer>|undefined} layers The layers.
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
   * Swap layers in the window.
   * @export
   */
  swap() {
    this.leftOnTop = !this.leftOnTop;

    // Swap the order via CSS. This uses z-order to control which map is displayed on top, and the width of the top
    // map is adjusted by the slider (making it appear to be on the left).
    if (this.leftOnTop) {
      this.element.find(Selector.MAP_LEFT).addClass('c-layer-compare-top');
      this.element.find(Selector.MAP_RIGHT).removeClass('c-layer-compare-top').width('auto');
    } else {
      this.element.find(Selector.MAP_LEFT).removeClass('c-layer-compare-top').width('auto');
      this.element.find(Selector.MAP_RIGHT).addClass('c-layer-compare-top');
    }

    this.updateMapContainerWidth();
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
  if (windowExists(windowId)) {
    bringToFront(windowId);
    // TODO: update the existing window
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
