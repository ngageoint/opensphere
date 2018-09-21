goog.provide('plugin.basemap.ui.BaseMapLayerUICtrl');
goog.provide('plugin.basemap.ui.baseMapLayerUIDirective');
goog.require('goog.async.Delay');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.layer.TileLayerUICtrl');
goog.require('os.ui.spinnerDirective');


/**
 * The directive for the base map layer UI
 * @return {!angular.Directive}
 */
plugin.basemap.ui.baseMapLayerUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/basemap/basemaplayerui.html',
    controller: plugin.basemap.ui.BaseMapLayerUICtrl,
    controllerAs: 'basemap'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('basemaplayerui', [plugin.basemap.ui.baseMapLayerUIDirective]);



/**
 * Controller for the base map layer UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @extends {os.ui.layer.TileLayerUICtrl}
 * @ngInject
 */
plugin.basemap.ui.BaseMapLayerUICtrl = function($scope, $element, $timeout) {
  plugin.basemap.ui.BaseMapLayerUICtrl.base(this, 'constructor', $scope, $element, $timeout);

  $scope.$on('minZoom.spin', this.onMinZoomChange.bind(this));
  $scope.$on('minZoom.spinchange', this.onMinZoomChange.bind(this));
  $scope.$on('maxZoom.spin', this.onMaxZoomChange.bind(this));
  $scope.$on('maxZoom.spinchange', this.onMaxZoomChange.bind(this));

  this.refreshDelay = new goog.async.Delay(this.onRefresh, 1000, this);
};
goog.inherits(plugin.basemap.ui.BaseMapLayerUICtrl, os.ui.layer.TileLayerUICtrl);


/**
 * @inheritDoc
 */
plugin.basemap.ui.BaseMapLayerUICtrl.prototype.initUI = function() {
  plugin.basemap.ui.BaseMapLayerUICtrl.base(this, 'initUI');

  if (this.scope) {
    this.scope['minZoom'] = this.getMinZoom_();
    this.scope['maxZoom'] = this.getMaxZoom_();
  }
};


/**
 * Handles changes to min zoom
 * @param {?angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
plugin.basemap.ui.BaseMapLayerUICtrl.prototype.onMinZoomChange = function(event, value) {
  var items = /** @type {Array.<!os.data.LayerNode>} */ (this.scope['items']);

  if (items) {
    var resolution = os.MapContainer.getInstance().zoomToResolution(value);

    for (var i = 0, n = items.length; i < n; i++) {
      try {
        /** @type {ol.layer.Layer} */ (items[i].getLayer()).setMaxResolution(resolution);
        this.refreshDelay.start();
      } catch (e) {
      }
    }
  }
};


/**
 * Handles changes to max zoom
 * @param {?angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
plugin.basemap.ui.BaseMapLayerUICtrl.prototype.onMaxZoomChange = function(event, value) {
  var items = /** @type {Array.<!os.data.LayerNode>} */ (this.scope['items']);

  if (items) {
    var resolution = os.MapContainer.getInstance().zoomToResolution(value);

    for (var i = 0, n = items.length; i < n; i++) {
      try {
        /** @type {ol.layer.Layer} */ (items[i].getLayer()).setMinResolution(resolution);
        this.refreshDelay.start();
      } catch (e) {
      }
    }
  }
};


/**
 * @protected
 */
plugin.basemap.ui.BaseMapLayerUICtrl.prototype.onRefresh = function() {
  // Changing the min/max zoom in Cesium affects the tile cache, so refresh
  if (os.MapContainer.getInstance().is3DEnabled()) {
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
};


/**
 * Gets the min zoom
 * @return {number} zoom
 * @private
 */
plugin.basemap.ui.BaseMapLayerUICtrl.prototype.getMinZoom_ = function() {
  var items = /** @type {Array.<!os.data.LayerNode>} */ (this.scope['items']);

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var layer = /** @type {ol.layer.Layer} */ (items[i].getLayer());

        if (layer) {
          return Math.round(os.MapContainer.getInstance().resolutionToZoom(layer.getMaxResolution()));
        }
      } catch (e) {
      }
    }
  }

  return 2;
};


/**
 * Gets the max zoom
 * @return {number}
 * @private
 */
plugin.basemap.ui.BaseMapLayerUICtrl.prototype.getMaxZoom_ = function() {
  var items = /** @type {Array.<!os.data.LayerNode>} */ (this.scope['items']);

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var layer = /** @type {ol.layer.Layer} */ (items[i].getLayer());

        if (layer) {
          return Math.round(os.MapContainer.getInstance().resolutionToZoom(layer.getMinResolution()));
        }
      } catch (e) {
      }
    }
  }

  return 28;
};


/**
 * @param {string} key The scope value to set
 */
plugin.basemap.ui.BaseMapLayerUICtrl.prototype.setCurrent = function(key) {
  var map = os.MapContainer.getInstance();
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
};
goog.exportProperty(plugin.basemap.ui.BaseMapLayerUICtrl.prototype, 'setCurrent',
    plugin.basemap.ui.BaseMapLayerUICtrl.prototype.setCurrent);

