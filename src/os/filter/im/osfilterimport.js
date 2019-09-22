goog.provide('os.filter.im.OSFilterImportCtrl');
goog.provide('os.filter.im.osFilterImportDirective');

goog.require('os.filter.im.OSFilterImporter');
goog.require('os.implements');
goog.require('os.ui.Module');
goog.require('os.ui.filter.im.FilterImportCtrl');


/**
 * The osfilterimport directive
 *
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
 *
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
os.filter.im.OSFilterImportCtrl.prototype.getImporter = function() {
  var layerId = /** @type {string|undefined} */ (this.scope['layerId']);
  return new os.filter.im.OSFilterImporter(this.getParser(), layerId);
};


/**
 * Get the base filterable descriptors and add in the filterable layers.
 * @inheritDoc
 */
os.filter.im.OSFilterImportCtrl.prototype.getFilterables = function() {
  var filterables = os.filter.im.OSFilterImportCtrl.base(this, 'getFilterables');
  var layers = os.map.mapContainer.getLayers();

  if (layers) {
    layers.forEach(function(layer) {
      if (os.implements(layer, os.filter.IFilterable.ID)) {
        layer = /** @type {os.filter.IFilterable} */ (layer);

        if (layer.isFilterable()) {
          filterables.unshift(layer);
        }
      }
    });
  }

  return filterables;
};
