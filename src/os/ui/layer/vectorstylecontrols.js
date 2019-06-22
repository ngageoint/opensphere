goog.provide('os.ui.layer.VectorStyleControlsCtrl');
goog.provide('os.ui.layer.vectorStyleControlsDirective');

goog.require('goog.Disposable');
goog.require('os.ui.Module');
goog.require('os.ui.icon.iconPickerDirective');
goog.require('os.ui.sliderDirective');


/**
 * @enum {string}
 */
os.ui.layer.VectorStyleControlsEventType = {
  LINE_DASH_CHANGE: 'vector:lineDashChange',
  SHAPE_CHANGE: 'vector:shapeChange',
  CENTER_SHAPE_CHANGE: 'vector:centerShapeChange',
  SHOW_ROTATION_CHANGE: 'vector:showRotationChange',
  ROTATION_COLUMN_CHANGE: 'vector:rotationColumnChange'
};


/**
 * Directive to style vector layers, features, etc.
 * @return {angular.Directive}
 */
os.ui.layer.vectorStyleControlsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'color': '=',
      'opacity': '=',
      'icon': '=?',
      'centerIcon': '=?',
      'iconSet': '=?',
      'iconSrc': '=?',
      'showIcon': '=?',
      'showCenterIcon': '=?',
      'size': '=',
      'shape': '=',
      'shapes': '=',
      'centerShape': '=?',
      'centerShapes': '=?',
      'lineDash': '=?',
      'showColorReset': '=?'
    },
    templateUrl: os.ROOT + 'views/layer/vectorstylecontrols.html',
    controller: os.ui.layer.VectorStyleControlsCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('vectorstylecontrols', [os.ui.layer.vectorStyleControlsDirective]);



/**
 * Controller function for the vectorstylecontrols directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.layer.VectorStyleControlsCtrl = function($scope) {
  os.ui.layer.VectorStyleControlsCtrl.base(this, 'constructor');

  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  if (this.scope['showIcon'] == null) {
    this.scope['showIcon'] = true;
  }

  if (this.scope['showCenterIcon'] == null) {
    this.scope['showCenterIcon'] = true;
  }

  this.scope['lineDashOptions'] = os.style.LINE_STYLE_OPTIONS;
  var name = os.style.dashPatternToOptions(this.scope['lineDash']);
  this.scope['lineDashName'] = name ? name : this.scope['lineDashOptions'][0];

  $scope.$on('$destroy', goog.bind(this.dispose, this));
};
goog.inherits(os.ui.layer.VectorStyleControlsCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.disposeInternal = function() {
  this.scope = null;
};


/**
 * Fire a scope event when the shape is changed by the user.
 * @export
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.onShapeChange = function() {
  if (this.scope) {
    this.scope.$emit(os.ui.layer.VectorStyleControlsEventType.SHAPE_CHANGE, this.scope['shape']);
  }
};


/**
 * Check for ellipse with center
 * @return {boolean}
 * @export
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.hasCenter = function() {
  if (this.scope && this.scope['shape']) {
    return os.style.CENTER_LOOKUP[this.scope['shape']];
  }
  return false;
};


/**
 * Fire a scope event when the ellipse center shape is changed by the user.
 * @param {string} shape
 * @export
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.onCenterShapeChange = function(shape) {
  if (this.scope) {
    this.scope.$emit(os.ui.layer.VectorStyleControlsEventType.CENTER_SHAPE_CHANGE, shape);
    this.scope['centerShape'] = shape;
  }
};


/**
 * Fire a scope event when the line dash is changed by the user.
 * @export
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.onLineDashChange = function() {
  if (this.scope && this.scope['lineDashName']) {
    this.scope['lineDash'] = /** @type {os.style.styleLineDashOption} */ (this.scope['lineDashName']).pattern;
    this.scope.$emit(os.ui.layer.VectorStyleControlsEventType.LINE_DASH_CHANGE, this.scope['lineDash']);
  }
};
