goog.module('os.ui.layer.TileLayerUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.sliderDirective');

const {ROOT} = goog.require('os');
const {instanceOf} = goog.require('os.classRegistry');
const {toHexString} = goog.require('os.color');
const LayerColor = goog.require('os.command.LayerColor');
const TileLayerColorize = goog.require('os.command.TileLayerColorize');
const TileLayerStyle = goog.require('os.command.TileLayerStyle');
const LayerClass = goog.require('os.layer.LayerClass');
const Module = goog.require('os.ui.Module');
const {getColorize, getStyle, getStyles} = goog.require('os.ui.layer');
const {Controller: DefaultLayerUICtrl} = goog.require('os.ui.layer.DefaultLayerUI');

const ICommand = goog.requireType('os.command.ICommand');
const LayerNode = goog.requireType('os.data.LayerNode');
const ILayer = goog.requireType('os.layer.ILayer');
const Tile = goog.requireType('os.layer.Tile');


/**
 * A spinner directive for a node that loads items
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/layer/tile.html',
  controller: Controller,
  controllerAs: 'tile'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'tilelayerui';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the tile layer UI
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

    $scope.$on('color.change', this.onColorChange.bind(this));
    $scope.$on('color.reset', this.onColorReset.bind(this));
  }

  /**
   * @inheritDoc
   */
  initUI() {
    super.initUI();

    if (this.scope) {
      this.scope['color'] = this.getColor_();
      this.scope['styles'] = this.getValue(getStyles);
      this.scope['style'] = this.getValue(getStyle);
      this.scope['colorize'] = this.getValue(getColorize);
    }
  }

  /**
   * Gets the color from the item(s)
   *
   * @return {?string} a hex color string
   * @private
   */
  getColor_() {
    var items = /** @type {Array<!LayerNode>} */ (this.scope['items']);

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        try {
          var layer = items[i].getLayer();
          if (instanceOf(layer, LayerClass.TILE)) {
            var color = /** @type {Tile} */ (layer).getColor();
            return color ? toHexString(color) : color;
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
         * @param {ILayer} layer
         * @return {ICommand}
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
    this.scope['color'] = this.getColor_();
  }

  /**
   * Handles style changes.
   *
   * @export
   */
  onStyleChange() {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length === 1 && this.scope['style'] != null) {
      var value = /** @type {(string|osx.ogc.TileStyle)} */ (this.scope['style']);
      var fn =
          /**
           * @param {ILayer} layer
           * @return {ICommand}
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
    var value = /** @type {boolean} */ (this.scope['colorize']);
    var fn =
        /**
         * @param {ILayer} layer
         * @return {ICommand}
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
