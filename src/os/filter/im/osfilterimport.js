goog.provide('os.filter.im.OSFilterImportCtrl');
goog.provide('os.filter.im.osFilterImportDirective');

goog.require('os.color');
goog.require('os.data.BaseDescriptor');
goog.require('os.implements');
goog.require('os.layer.ILayer');
goog.require('os.ui.Module');
goog.require('os.ui.filter.im.FilterImportCtrl');


/**
 * The osfilterimport directive
 * @return {angular.Directive}
 */
os.filter.im.osFilterImportDirective = function() {
  var dir = os.ui.filter.im.filterImportDirective();
  dir.controller = os.filter.im.OSFilterImportCtrl;
  return dir;
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('osfilterimport', [os.filter.im.osFilterImportDirective]);



/**
 * Controller function for the filter import directive
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @param {!angular.$sce} $sce Angular SCE service.
 * @extends {os.ui.filter.im.FilterImportCtrl}
 * @constructor
 * @ngInject
 */
os.filter.im.OSFilterImportCtrl = function($scope, $element, $sce) {
  os.filter.im.OSFilterImportCtrl.base(this, 'constructor', $scope, $element, $sce);
};
goog.inherits(os.filter.im.OSFilterImportCtrl, os.ui.filter.im.FilterImportCtrl);


/**
 * @inheritDoc
 */
os.filter.im.OSFilterImportCtrl.prototype.getProviderFromFilterable = function(filterable) {
  var provider = os.filter.im.OSFilterImportCtrl.base(this, 'getProviderFromFilterable', filterable);

  // if the filterable implements a provider name interface function, add that to the title
  if (!provider && os.implements(filterable, os.layer.ILayer.ID)) {
    provider = /** @type {!os.layer.ILayer} */ (filterable).getProvider();
  }

  return provider;
};


/**
 * @inheritDoc
 */
os.filter.im.OSFilterImportCtrl.prototype.getIconsFromFilterable = function(filterable) {
  if (os.implements(filterable, os.layer.ILayer.ID)) {
    var options = /** @type {!os.layer.ILayer} */ (filterable).getLayerOptions();
    var color = /** @type {string|undefined} */ (options['color']);
    if (color) {
      return '<i class="fa fa-bars" style="color:' + os.color.toHexString(color) + '"></i>';
    }
  }

  return os.filter.im.OSFilterImportCtrl.base(this, 'getIconsFromFilterable', filterable);
};
