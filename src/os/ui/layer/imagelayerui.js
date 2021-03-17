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
    templateUrl: ROOT + 'views/layer/tile.html',
    controller: Controller,
    controllerAs: 'tile'
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
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @extends {DefaultLayerUICtrl}
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    $scope.$on('color.change', this.onColorChange.bind(this));
    $scope.$on('color.reset', this.onColorReset.bind(this));
  }

  /**
   * @inheritDoc
   */
  initUI() {
    layer.TileLayerUICtrl.base(this, 'initUI');

    if (this.scope_) {
      this.scope_['color'] = this.getColor_();
      this.scope_['styles'] = this.getValue(layer.getStyles);
      this.scope_['style'] = this.getValue(layer.getStyle);
      this.scope_['colorize'] = this.getValue(layer.getColorize);
    }
  }

  /**
   * Gets the color from the item(s)
   *
   * @return {?string} a hex color string
   * @private
   */
  getColor_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope_['items']);

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
  onColorChange(event, value) {
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
  onColorReset(event) {
    // clear the label color config value
    this.onColorChange(event, '');

    // reset to the layer color
    this.scope_['color'] = this.getColor_();
  }

  /**
   * Handles style changes.
   *
   * @export
   */
  onStyleChange() {
    var items = /** @type {Array} */ (this.scope_['items']);
    if (items && items.length === 1 && this.scope_['style'] != null) {
      var value = /** @type {(string|osx.ogc.TileStyle)} */ (this.scope_['style']);
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
  onColorizeChange() {
    var value = /** @type {boolean} */ (this.scope_['colorize']);
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
  directive
};
