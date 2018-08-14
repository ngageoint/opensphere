goog.provide('os.ui.layer.EllipseOptionsCtrl');
goog.provide('os.ui.layer.ellipseOptionsDirective');

goog.require('os.command.VectorLayerShowEllipsoids');
goog.require('os.command.VectorLayerShowGroundReference');
goog.require('os.style');
goog.require('os.ui.Module');
goog.require('os.ui.layer.AbstractLayerUICtrl');


/**
 * The ellipseoptions directive.
 * @return {angular.Directive}
 */
os.ui.layer.ellipseOptionsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/layer/ellipseoptions.html',
    controller: os.ui.layer.EllipseOptionsCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('ellipseoptions', [os.ui.layer.ellipseOptionsDirective]);



/**
 * Controller function for the ellipseoptions directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {os.ui.layer.AbstractLayerUICtrl}
 * @constructor
 * @ngInject
 */
os.ui.layer.EllipseOptionsCtrl = function($scope, $element) {
  os.ui.layer.EllipseOptionsCtrl.base(this, 'constructor', $scope, $element);

  /**
   * The Show Ellipsoids checkbox state.
   * @type {boolean}
   */
  this['showEllipsoids'] = false;

  /**
   * The Show Ground Reference checkbox state.
   * @type {boolean}
   */
  this['showGroundReference'] = false;
};
goog.inherits(os.ui.layer.EllipseOptionsCtrl, os.ui.layer.AbstractLayerUICtrl);


/**
 * @inheritDoc
 */
os.ui.layer.EllipseOptionsCtrl.prototype.disposeInternal = function() {
  os.ui.layer.EllipseOptionsCtrl.base(this, 'disposeInternal');

  this.scope = null;
  this.element = null;
};


/**
 * @inheritDoc
 */
os.ui.layer.EllipseOptionsCtrl.prototype.initUI = function() {
  os.ui.layer.EllipseOptionsCtrl.base(this, 'initUI');

  if (!this.isDisposed()) {
    this['showEllipsoids'] = this.getShowEllipsoids_();
    this['showGroundReference'] = this.getShowGroundReference_();
  }
};


/**
 * If ellipsoids should be displayed for the layer(s).
 * @return {boolean}
 * @private
 */
os.ui.layer.EllipseOptionsCtrl.prototype.getShowEllipsoids_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return !!config[os.style.StyleField.SHOW_ELLIPSOIDS];
    }
  }

  return false;
};


/**
 * If ellipses should also show a ground reference line.
 * @return {boolean}
 * @private
 */
os.ui.layer.EllipseOptionsCtrl.prototype.getShowGroundReference_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
  if (items && items.length > 0) {
    var config = os.style.StyleManager.getInstance().getLayerConfig(items[0].getId());
    if (config) {
      return !!config[os.style.StyleField.SHOW_GROUND_REF];
    }
  }

  return false;
};


/**
 * Handle changes to the Show Ellipsoids option.
 */
os.ui.layer.EllipseOptionsCtrl.prototype.onShowEllipsoidsChange = function() {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    var value = this['showEllipsoids'];
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerShowEllipsoids(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};
goog.exportProperty(
    os.ui.layer.EllipseOptionsCtrl.prototype,
    'onShowEllipsoidsChange',
    os.ui.layer.EllipseOptionsCtrl.prototype.onShowEllipsoidsChange);


/**
 * Handle changes to the Show Ground Reference option.
 */
os.ui.layer.EllipseOptionsCtrl.prototype.onShowGroundReferenceChange = function() {
  var items = /** @type {Array} */ (this.scope['items']);
  if (items && items.length > 0) {
    var value = this['showGroundReference'];
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.VectorLayerShowGroundReference(layer.getId(), value);
        };

    this.createCommand(fn);
  }
};
goog.exportProperty(
    os.ui.layer.EllipseOptionsCtrl.prototype,
    'onShowGroundReferenceChange',
    os.ui.layer.EllipseOptionsCtrl.prototype.onShowGroundReferenceChange);
