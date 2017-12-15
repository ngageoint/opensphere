goog.provide('os.query.ui.ModifyAreaCtrl');
goog.provide('os.query.ui.modifyAreaDirective');

goog.require('goog.log');
goog.require('os.ui.query.ui.ModifyAreaCtrl');
goog.require('os.ui.query.ui.modifyAreaDirective');


/**
 * The modifyarea directive
 * @return {angular.Directive}
 */
os.query.ui.modifyAreaDirective = function() {
  var directive = os.ui.query.ui.modifyAreaDirective();
  directive.controller = os.query.ui.ModifyAreaCtrl;
  return directive;
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('osModifyarea', [os.query.ui.modifyAreaDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.query.ui.ModifyAreaCtrl}
 * @constructor
 * @ngInject
 */
os.query.ui.ModifyAreaCtrl = function($scope, $element) {
  os.query.ui.ModifyAreaCtrl.base(this, 'constructor', $scope, $element);
  this.log = os.query.ui.ModifyAreaCtrl.LOGGER_;

  /**
   * @type {ol.Feature|undefined}
   * @protected
   */
  this.areaPreview = null;

  /**
   * @type {ol.Feature|undefined}
   * @protected
   */
  this.targetPreview = null;
};
goog.inherits(os.query.ui.ModifyAreaCtrl, os.ui.query.ui.ModifyAreaCtrl);


/**
 * Logger for os.query.ui.ModifyAreaCtrl
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.query.ui.ModifyAreaCtrl.LOGGER_ = goog.log.getLogger('os.query.ui.ModifyAreaCtrl');


/**
 * @inheritDoc
 */
os.query.ui.ModifyAreaCtrl.prototype.disposeInternal = function() {
  os.query.ui.ModifyAreaCtrl.base(this, 'disposeInternal');

  if (this.areaPreview) {
    os.MapContainer.getInstance().removeFeature(this.areaPreview);
    this.areaPreview = null;
  }

  if (this.targetPreview) {
    os.MapContainer.getInstance().removeFeature(this.targetPreview);
    this.targetPreview = null;
  }
};


/**
 * @inheritDoc
 */
os.query.ui.ModifyAreaCtrl.prototype.onAreaChange = function(opt_new, opt_old) {
  if (this.areaPreview) {
    os.MapContainer.getInstance().removeFeature(this.areaPreview);
  }

  this.areaPreview = null;

  if (opt_new instanceof ol.Feature && opt_new.getGeometry()) {
    // clone the feature because we don't want the style, nor do we want to remove the original from the map
    this.areaPreview = os.ol.feature.clone(opt_new);
    this.areaPreview.set(os.data.RecordField.DRAWING_LAYER_NODE, false);
    os.MapContainer.getInstance().addFeature(this.areaPreview);
  }

  os.query.ui.ModifyAreaCtrl.base(this, 'onAreaChange', opt_new, opt_old);
};


/**
 * @inheritDoc
 */
os.query.ui.ModifyAreaCtrl.prototype.onTargetAreaChange = function(opt_new, opt_old) {
  if (this.targetPreview) {
    os.MapContainer.getInstance().removeFeature(this.targetPreview);
  }

  this.targetPreview = null;

  if (opt_new instanceof ol.Feature && opt_new.getGeometry()) {
    // clone the feature because we don't want the style, nor do we want to remove the original from the map
    this.targetPreview = os.ol.feature.clone(opt_new);
    this.targetPreview.set(os.data.RecordField.DRAWING_LAYER_NODE, false);
    os.MapContainer.getInstance().addFeature(this.targetPreview);
  }

  os.query.ui.ModifyAreaCtrl.base(this, 'onTargetAreaChange', opt_new, opt_old);
};


/**
 * @inheritDoc
 */
os.query.ui.ModifyAreaCtrl.prototype.setPreviewFeature = function(feature) {
  if (this.preview) {
    os.MapContainer.getInstance().removeFeature(this.preview);
  }

  os.query.ui.ModifyAreaCtrl.base(this, 'setPreviewFeature', feature);

  if (this.preview && this.preview.getGeometry()) {
    os.MapContainer.getInstance().addFeature(this.preview, os.style.PREVIEW_CONFIG);
  }
};
