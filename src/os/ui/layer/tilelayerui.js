goog.provide('os.ui.layer.TileLayerUICtrl');
goog.provide('os.ui.layer.tileLayerUIDirective');

goog.require('os.command.TileLayerColor');
goog.require('os.command.TileLayerColorize');
goog.require('os.command.TileLayerStyle');
goog.require('os.defines');
goog.require('os.ui.ControlType');
goog.require('os.ui.Module');
goog.require('os.ui.layer');
goog.require('os.ui.layer.DefaultLayerUICtrl');
goog.require('os.ui.sliderDirective');


/**
 * A spinner directive for a node that loads items
 * @return {angular.Directive}
 */
os.ui.layer.tileLayerUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/layer/tile.html',
    controller: os.ui.layer.TileLayerUICtrl,
    controllerAs: 'tile'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('tilelayerui', [os.ui.layer.tileLayerUIDirective]);



/**
 * Controller for the tile layer UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @extends {os.ui.layer.DefaultLayerUICtrl}
 * @constructor
 * @ngInject
 */
os.ui.layer.TileLayerUICtrl = function($scope, $element, $timeout) {
  os.ui.layer.TileLayerUICtrl.base(this, 'constructor', $scope, $element, $timeout);

  $scope.$on('color.change', this.onColorChange.bind(this));
  $scope.$on('color.reset', this.onColorReset.bind(this));
};
goog.inherits(os.ui.layer.TileLayerUICtrl, os.ui.layer.DefaultLayerUICtrl);


/**
 * @inheritDoc
 */
os.ui.layer.TileLayerUICtrl.prototype.initUI = function() {
  os.ui.layer.TileLayerUICtrl.base(this, 'initUI');

  if (this.scope) {
    this.scope['color'] = this.getColor_();
    this.scope['styles'] = this.getValue(os.ui.layer.getStyles);
    this.scope['style'] = this.getValue(os.ui.layer.getStyle);
    this.scope['colorize'] = this.getValue(os.ui.layer.getColorize);
  }
};


/**
 * Gets the color from the item(s)
 * @return {?string} a hex color string
 * @private
 */
os.ui.layer.TileLayerUICtrl.prototype.getColor_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var layer = items[i].getLayer();
        if (layer instanceof os.layer.Tile) {
          var color = layer.getColor();
          return color ? os.color.toHexString(color) : color;
        }
      } catch (e) {
      }
    }
  }

  return null;
};


/**
 * Handles changes to color
 * @param {angular.Scope.Event} event
 * @param {string} value
 * @protected
 */
os.ui.layer.TileLayerUICtrl.prototype.onColorChange = function(event, value) {
  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.TileLayerColor(layer.getId(), value);
      };

  this.createCommand(fn);
};


/**
 * Handles color reset
 * @param {angular.Scope.Event} event
 * @protected
 */
os.ui.layer.TileLayerUICtrl.prototype.onColorReset = function(event) {
  // clear the label color config value
  this.onColorChange(event, '');

  // reset to the layer color
  this.scope['color'] = this.getColor_();
};


/**
 * Handles style changes.
 */
os.ui.layer.TileLayerUICtrl.prototype.onStyleChange = function() {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length === 1 && this.scope['style'] != null) {
    var value = /** @type {(string|osx.ogc.TileStyle)} */ (this.scope['style']);
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.TileLayerStyle(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};
goog.exportProperty(os.ui.layer.TileLayerUICtrl.prototype, 'onStyleChange',
    os.ui.layer.TileLayerUICtrl.prototype.onStyleChange);


/**
 * Handles colorize changes.
 */
os.ui.layer.TileLayerUICtrl.prototype.onColorizeChange = function() {
  var value = /** @type {boolean} */ (this.scope['colorize']);
  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.TileLayerColorize(layer.getId(), value);
      };

  this.createCommand(fn);
};
goog.exportProperty(os.ui.layer.TileLayerUICtrl.prototype, 'onColorizeChange',
    os.ui.layer.TileLayerUICtrl.prototype.onColorizeChange);
