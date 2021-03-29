goog.module('os.ui.layer.ImageLayerUI');
goog.module.declareLegacyNamespace();

const LayerColor = goog.require('os.command.LayerColor');
const TileLayerColorize = goog.require('os.command.TileLayerColorize');
const TileLayerStyle = goog.require('os.command.TileLayerStyle');
// const defines = goog.require('os.defines');
// const ControlType = goog.require('os.ui.ControlType');
const Module = goog.require('os.ui.Module');
const layer = goog.require('os.ui.layer');
const DefaultLayerUICtrl = goog.require('os.ui.layer.DefaultLayerUICtrl');
// const sliderDirective = goog.require('os.ui.sliderDirective');
const {ROOT} = goog.require('os');



/**
 * A spinner directive for a node that loads items
 *
 * @return {angular.Directive}
 */
const directive = () => {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: ROOT + 'views/layer/image.html',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'imagelayerui';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the addserver directive.
 * @unrestricted
 */
class Controller extends DefaultLayerUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);
    this.initUI();

    if (this.scope) {
      this.scope['color'] = this.getColor_();
      this.scope['styles'] = this.getValue(layer.getStyles);
      this.scope['style'] = this.getValue(layer.getStyle);
      this.scope['colorize'] = this.getValue(layer.getColorize);
    }

    $scope.$on('color.change', this.onColorChange_.bind(this));
    $scope.$on('color.reset', this.onColorReset_.bind(this));
  }

  /**
   * Gets the color from the item(s)
   *
   * @return {?string} a hex color string
   * @private
   */
  getColor_() {
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
  }

  /**
   * Handles changes to color
   *
   * @param {angular.Scope.Event} event
   * @param {string} value
   * @protected
   */
  onColorChange_(event, value) {
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new LayerColor(layer.getId(), value);
        };

    this.createCommand(fn);
  }

  /**
   * Handles color reset
   *
   * @param {angular.Scope.Event} event
   * @protected
   */
  onColorReset_(event) {
    // clear the label color config value
    this.onColorChange_(event, '');

    // reset to the layer color
    this.scope['color'] = this.getColor_();
  }

  /**
   * Handles style changes.
   *
   * @export
   */
  onStyleChange_() {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length === 1 && this.scope['style'] != null) {
      var value = /** @type {(string|osx.ogc.TileStyle)} */ (this.scope['style']);
      var fn =
          /**
           * @param {os.layer.ILayer} layer
           * @return {os.command.ICommand}
           */
          function(layer) {
            return new TileLayerStyle(layer.getId(), value);
          };

      this.createCommand(fn);
    }
  }

  /**
   * Handles colorize changes.
   *
   * @export
   */
  onColorizeChange_() {
    var value = /** @type {boolean} */ (this.scope['colorize']);
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new TileLayerColorize(layer.getId(), value);
        };

    this.createCommand(fn);
  }
}


exports = {
  Controller,
  directive,
  directiveTag
};
