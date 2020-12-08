goog.module('plugin.basemap.ui.BaseMapLayerUIUI');
goog.module.declareLegacyNamespace();

goog.require('os.defines');
goog.require('os.ui.spinnerDirective');
const MapContainer = goog.require('os.MapContainer');
const Delay = goog.require('goog.async.Delay');
const osMap = goog.require('os.map');
const Module = goog.require('os.ui.Module');
const TileLayerUICtrl = goog.require('os.ui.layer.TileLayerUICtrl');


/**
 * The directive for the base map layer UI
 *
 * @return {!angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: os.ROOT + 'views/plugin/basemap/basemaplayerui.html',
  controller: Controller,
  controllerAs: 'basemap'
});


/**
 * Add the directive to the module
 */
Module.directive('basemaplayerui', [directive]);



/**
 * Controller for the base map layer UI
 * @unrestricted
 */
class Controller extends TileLayerUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);

    $scope.$on('minZoom.spin', this.onMinZoomChange.bind(this));
    $scope.$on('minZoom.spinchange', this.onMinZoomChange.bind(this));
    $scope.$on('maxZoom.spin', this.onMaxZoomChange.bind(this));
    $scope.$on('maxZoom.spinchange', this.onMaxZoomChange.bind(this));

    this['mapMinZoom'] = osMap.MIN_ZOOM;
    this['mapMaxZoom'] = osMap.MAX_ZOOM;

    this.refreshDelay = new Delay(this.onRefresh, 1000, this);
  }

  /**
   * @inheritDoc
   */
  initUI() {
    super.initUI();

    if (this.scope) {
      this.scope['minZoom'] = this.getMinZoom_();
      this.scope['maxZoom'] = this.getMaxZoom_();
    }
  }

  /**
   * Handles changes to min zoom
   *
   * @param {?angular.Scope.Event} event
   * @param {number} value
   * @protected
   */
  onMinZoomChange(event, value) {
    var items = /** @type {Array.<!os.data.LayerNode>} */ (this.scope['items']);

    if (items) {
      var resolution = MapContainer.getInstance().zoomToResolution(value);

      for (var i = 0, n = items.length; i < n; i++) {
        try {
          /** @type {ol.layer.Layer} */ (items[i].getLayer()).setMaxResolution(resolution);
          this.refreshDelay.start();
        } catch (e) {
        }
      }
    }
  }

  /**
   * Handles changes to max zoom
   *
   * @param {?angular.Scope.Event} event
   * @param {number} value
   * @protected
   */
  onMaxZoomChange(event, value) {
    var items = /** @type {Array.<!os.data.LayerNode>} */ (this.scope['items']);

    if (items) {
      var resolution = MapContainer.getInstance().zoomToResolution(value);

      for (var i = 0, n = items.length; i < n; i++) {
        try {
          /** @type {ol.layer.Layer} */ (items[i].getLayer()).setMinResolution(resolution);
          this.refreshDelay.start();
        } catch (e) {
        }
      }
    }
  }

  /**
   * @protected
   */
  onRefresh() {
    // Changing the min/max zoom in Cesium affects the tile cache, so refresh
    if (MapContainer.getInstance().is3DEnabled()) {
      var items = /** @type {Array.<!os.data.LayerNode>} */ (this.scope['items']);

      if (items) {
        for (var i = 0, n = items.length; i < n; i++) {
          var layer = items[i].getLayer();

          if (layer && /** @type {ol.layer.Layer} */ (layer).getSource()) {
            /** @type {ol.layer.Layer} */ (layer).getSource().refresh();
          }
        }
      }
    }
  }

  /**
   * Gets the min zoom
   *
   * @return {number} zoom
   * @private
   */
  getMinZoom_() {
    var items = /** @type {Array.<!os.data.LayerNode>} */ (this.scope['items']);

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        try {
          var layer = /** @type {ol.layer.Layer} */ (items[i].getLayer());

          if (layer) {
            return Math.round(MapContainer.getInstance().resolutionToZoom(layer.getMaxResolution()));
          }
        } catch (e) {
        }
      }
    }

    return osMap.MIN_ZOOM;
  }

  /**
   * Gets the max zoom
   *
   * @return {number}
   * @private
   */
  getMaxZoom_() {
    var items = /** @type {Array.<!os.data.LayerNode>} */ (this.scope['items']);

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        try {
          var layer = /** @type {ol.layer.Layer} */ (items[i].getLayer());

          if (layer) {
            return Math.round(MapContainer.getInstance().resolutionToZoom(layer.getMinResolution()));
          }
        } catch (e) {
        }
      }
    }

    return osMap.MAX_ZOOM;
  }

  /**
   * @param {string} key The scope value to set
   * @export
   */
  setCurrent(key) {
    var map = MapContainer.getInstance();
    var resolution;

    if (map.is3DEnabled()) {
      // in 3D mode, the resolution should be determined based on the camera height adjusted to the equator. this will
      // prevent the 2D projection from interfering with the relative zoom
      var camera = map.getWebGLCamera();
      if (camera) {
        resolution = camera.calcResolutionForDistance(camera.getAltitude(), 0);
      }
    } else {
      resolution = map.getMap().getView().getResolution();
    }

    if (resolution != null) {
      // zoom level should be an integer inclusive of the current level
      this.scope[key] = Math.floor(map.resolutionToZoom(resolution));

      if (key == 'minZoom') {
        this.onMinZoomChange(null, this.scope[key]);
      } else {
        this.onMaxZoomChange(null, this.scope[key]);
      }
    }
  }
}

exports = {
  Controller,
  directive
};
