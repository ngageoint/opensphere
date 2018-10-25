goog.provide('os.ui.node.TileLoadingCtrl');
goog.provide('os.ui.node.tileLoadingDirective');
goog.require('ol.events');
goog.require('os.source.PropertyChange');
goog.require('os.ui.Module');


/**
 * Shows if a tile layer is loading
 * @return {angular.Directive}
 */
os.ui.node.tileLoadingDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span></span>',
    controller: os.ui.node.TileLoadingCtrl,
    controllerAs: 'tileLoading'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('tileloading', [os.ui.node.tileLoadingDirective]);



/**
 * Controller for tile loading UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.node.TileLoadingCtrl = function($scope, $element) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?ol.source.TileImage}
   * @private
   */
  this.source_ = null;

  if ('item' in $scope) {
    var node = /** @type {os.data.LayerNode} */ ($scope['item']);
    var src = /** @type {ol.layer.Layer} */ (node.getLayer()).getSource();

    if (src && src instanceof ol.source.TileImage) {
      this.source_ = /** @type {ol.source.TileImage} */ (src);
      ol.events.listen(this.source_, goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange_, this);
    }
  }

  this.element_.html(this.getText());
  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Clean up
 * @private
 */
os.ui.node.TileLoadingCtrl.prototype.onDestroy_ = function() {
  if (this.source_) {
    ol.events.unlisten(this.source_, goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange_, this);
  }

  this.element_ = null;
};


/**
 * Handles the loading property change
 * @param {os.events.PropertyChangeEvent} e The change event
 * @private
 */
os.ui.node.TileLoadingCtrl.prototype.onPropertyChange_ = function(e) {
  if (e.getProperty) {
    var p = e.getProperty();
    if (p == os.layer.PropertyChange.TILE_COUNT || p == os.source.PropertyChange.LOADING) {
      this.element_.html(this.getText());
    }
  }
};


/**
 * Gets the text to show for the tile layer.
 * @return {string}
 */
os.ui.node.TileLoadingCtrl.prototype.getText = function() {
  try {
    if (this.source_) {
      var count = /** @type {?number} */ (this.source_.get(os.layer.PropertyChange.TILE_COUNT));

      if (count != null) {
        return '(' + count + ' In View)';
      }
    }
  } catch (e) {
  }

  return '';
};
