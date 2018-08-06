goog.provide('os.ui.node.FeatureCountCtrl');
goog.provide('os.ui.node.featureCountDirective');
goog.require('ol.events');
goog.require('os.source.PropertyChange');
goog.require('os.ui.Module');


/**
 * Shows the feature count out of the total for feature layers
 * @return {angular.Directive}
 */
os.ui.node.featureCountDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span></span>',
    controller: os.ui.node.FeatureCountCtrl,
    controllerAs: 'featureCount'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('featurecount', [os.ui.node.featureCountDirective]);



/**
 * Controller for selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.node.FeatureCountCtrl = function($scope, $element) {
  /**
   * @type {?os.source.Vector}
   * @private
   */
  this.source_ = null;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  if ('item' in $scope) {
    var node = /** @type {os.data.LayerNode} */ ($scope['item']);
    var src = /** @type {ol.layer.Layer} */ (node.getLayer()).getSource();

    if (src && src instanceof os.source.Vector) {
      this.source_ = /** @type {os.source.Vector} */ (src);
      ol.events.listen(this.source_, goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange_, this);
    }
  }

  $scope.$on('$destroy', this.onDestroy_.bind(this));
  this.element_.html(this.getTotal());
};


/**
 * Clean up
 * @private
 */
os.ui.node.FeatureCountCtrl.prototype.onDestroy_ = function() {
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
os.ui.node.FeatureCountCtrl.prototype.onPropertyChange_ = function(e) {
  var p = e.getProperty();
  if (p == os.source.PropertyChange.FEATURES || p == os.source.PropertyChange.FEATURE_VISIBILITY ||
      p == os.source.PropertyChange.LOADING || p == os.source.PropertyChange.VISIBLE ||
      p === os.source.PropertyChange.TIME_ENABLED || p == os.source.PropertyChange.TIME_FILTER) {
    this.element_.html(this.getTotal());
  }
};


/**
 * @return {string}
 */
os.ui.node.FeatureCountCtrl.prototype.getTotal = function() {
  try {
    if (this.source_ && !this.source_.isDisposed()) {
      if (this.source_.isLoading()) {
        return '(Loading...)';
      }

      var model = this.source_.getTimeModel();
      var shown = this.source_.getFilteredFeatures().length;
      var total = model.getSize();

      return '(' + (shown == total ? total : shown + '/' + total) + ')';
    }
  } catch (e) {
  }

  return '';
};
