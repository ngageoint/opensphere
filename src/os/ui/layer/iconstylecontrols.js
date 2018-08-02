goog.provide('os.ui.layer.IconStyleControlsCtrl');
goog.provide('os.ui.layer.iconStyleControlsDirective');

goog.require('goog.Disposable');
goog.require('os.ui.Module');


/**
 * The icon options directive.
 * @return {angular.Directive}
 */
os.ui.layer.iconStyleControlsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'columns': '=',
      'showRotation': '=?',
      'rotationColumn': '=?'
    },
    templateUrl: os.ROOT + 'views/layer/iconstylecontrols.html',
    controller: os.ui.layer.IconStyleControlsCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('iconstylecontrols', [os.ui.layer.iconStyleControlsDirective]);



/**
 * Controller function for the iconstyleoptions directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.layer.IconStyleControlsCtrl = function($scope) {
  os.ui.layer.IconStyleControlsCtrl.base(this, 'constructor');

  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  if (this.scope['showRotation'] == null) {
    this.scope['showRotation'] = true;
  }

  if (this.scope['rotationColumn'] == null) {
    this.scope['rotationColumn'] = '';
  }

  $scope.$on('$destroy', goog.bind(this.dispose, this));
};
goog.inherits(os.ui.layer.IconStyleControlsCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.layer.IconStyleControlsCtrl.prototype.disposeInternal = function() {
  this.scope = null;
};


/**
 * Toggle the Show Rotation.
 * @protected
 */
os.ui.layer.IconStyleControlsCtrl.prototype.toggleShowRotation = function() {
  this.scope['showRotation'] = !this.scope['showRotation'];
  this.onShowRotation();
};
goog.exportProperty(
    os.ui.layer.IconStyleControlsCtrl.prototype,
    'toggleShowRotation',
    os.ui.layer.IconStyleControlsCtrl.prototype.toggleShowRotation);


/**
 * Handles changes to showing rotation
 * @protected
 */
os.ui.layer.IconStyleControlsCtrl.prototype.onShowRotation = function() {
  if (this.scope) {
    this.scope.$emit(os.ui.layer.VectorStyleControlsEventType.SHOW_ROTATION_CHANGE, this.scope['showRotation']);
  }
};
goog.exportProperty(
    os.ui.layer.IconStyleControlsCtrl.prototype,
    'onShowRotation',
    os.ui.layer.IconStyleControlsCtrl.prototype.onShowRotation);



/**
 * Handles column changes to the rotation
 * @protected
 */
os.ui.layer.IconStyleControlsCtrl.prototype.onRotationColumnChange = function() {
  if (this.scope) {
    this.scope.$emit(os.ui.layer.VectorStyleControlsEventType.ROTATION_COLUMN_CHANGE, this.scope['rotationColumn']);
  }
};
goog.exportProperty(
    os.ui.layer.IconStyleControlsCtrl.prototype,
    'onRotationColumnChange',
    os.ui.layer.IconStyleControlsCtrl.prototype.onRotationColumnChange);
