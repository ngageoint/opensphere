goog.provide('plugin.heatmap.HeatmapLayerUICtrl');
goog.provide('plugin.heatmap.heatmapLayerUIDirective');
goog.require('goog.async.Delay');
goog.require('os.defines');
goog.require('os.style');
goog.require('os.ui.Module');
goog.require('os.ui.layer');
goog.require('os.ui.layer.DefaultLayerUICtrl');
goog.require('plugin.heatmap.cmd.Gradient');
goog.require('plugin.heatmap.cmd.Intensity');
goog.require('plugin.heatmap.cmd.Size');


/**
 * The directive for heatmap layer controls
 * @return {angular.Directive}
 */
plugin.heatmap.heatmapLayerUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/heatmap/heatmap.html',
    controller: plugin.heatmap.HeatmapLayerUICtrl,
    controllerAs: 'heatmap'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('heatmaplayerui', [plugin.heatmap.heatmapLayerUIDirective]);



/**
 * Controller for the vector layer UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @extends {os.ui.layer.DefaultLayerUICtrl}
 * @ngInject
 */
plugin.heatmap.HeatmapLayerUICtrl = function($scope, $element, $timeout) {
  plugin.heatmap.HeatmapLayerUICtrl.base(this, 'constructor', $scope, $element, $timeout);

  $scope.$on('size.slidestop', this.onSizeChange.bind(this));
  $scope.$on('intensity.slidestop', this.onIntensityChange.bind(this));
  $scope.$on('intensity.spinstop', this.onIntensityChange.bind(this));
  this['maxIntensity'] = 50;

  // add heatmap-specific events to the initEvents array
  this.initEvents = this.initEvents.concat(goog.object.getValues(plugin.heatmap.HeatmapPropertyType));
  this.intensityDelay = new goog.async.Delay(this.changeIntensity_, 1000, this);
};
goog.inherits(plugin.heatmap.HeatmapLayerUICtrl, os.ui.layer.DefaultLayerUICtrl);


/**
 * @inheritDoc
 */
plugin.heatmap.HeatmapLayerUICtrl.prototype.initUI = function() {
  plugin.heatmap.HeatmapLayerUICtrl.base(this, 'initUI');

  if (this.scope) {
    this.scope['size'] = this.getSize_();
    this.scope['intensity'] = this.getIntensity_();

    this.scope['gradients'] = [
      {'title': 'Rainbow', 'gradient': os.color.RAINBOW_HEATMAP_GRADIENT_HEX},
      {'title': 'Thermal', 'gradient': os.color.THERMAL_HEATMAP_GRADIENT_HEX}
    ];
    var gradient = this.getGradient_();
    this.scope['gradient'] = this.scope['gradients'][gradient == os.color.THERMAL_HEATMAP_GRADIENT_HEX ? 1 : 0];
  }
};


/**
 * Handles changes to the gradient
 * @protected
 */
plugin.heatmap.HeatmapLayerUICtrl.prototype.onGradientChange = function() {
  var value = this.scope['gradient']['gradient'];
  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new plugin.heatmap.cmd.Gradient(layer.getId(), value);
      };

  this.createCommand(fn);
};
goog.exportProperty(
    plugin.heatmap.HeatmapLayerUICtrl.prototype,
    'onGradientChange',
    plugin.heatmap.HeatmapLayerUICtrl.prototype.onGradientChange);


/**
 * Handles changes to the gradient
 * @return {Array}
 * @private
 */
plugin.heatmap.HeatmapLayerUICtrl.prototype.getGradient_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var layer = /** @type {plugin.heatmap.Heatmap} */ (items[i].getLayer());
        if (layer) {
          return layer.getGradient();
        }
      } catch (e) {
      }
    }
  }
  return [];
};


/**
 * Handles changes to size
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
plugin.heatmap.HeatmapLayerUICtrl.prototype.onSizeChange = function(event, value) {
  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new plugin.heatmap.cmd.Size(layer.getId(), value);
      };

  this.createCommand(fn);
};


/**
 * Gets the size from the layer
 * @return {number}
 * @private
 */
plugin.heatmap.HeatmapLayerUICtrl.prototype.getSize_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var layer = /** @type {plugin.heatmap.Heatmap} */ (items[i].getLayer());
        if (layer) {
          return layer.getSize();
        }
      } catch (e) {
      }
    }
  }

  return 1.0;
};


/**
 * Handles changes to intensity
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
plugin.heatmap.HeatmapLayerUICtrl.prototype.onIntensityChange = function(event, value) {
  this.scope['intensity'] = value;
  this.intensityDelay.start();
};


/**
 * Implements changes to intensity
 * @private
 */
plugin.heatmap.HeatmapLayerUICtrl.prototype.changeIntensity_ = function() {
  var value = this.scope['intensity'];
  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new plugin.heatmap.cmd.Intensity(layer.getId(), value);
      };

  this.createCommand(fn);
};


/**
 * Gets the intensity from the layer
 * @return {number}
 * @private
 */
plugin.heatmap.HeatmapLayerUICtrl.prototype.getIntensity_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var layer = /** @type {plugin.heatmap.Heatmap} */ (items[i].getLayer());
        if (layer) {
          return layer.getIntensity();
        }
      } catch (e) {
      }
    }
  }

  return this['maxIntensity'] / 2; // default to the middle of the slider - THIN-8618
};
