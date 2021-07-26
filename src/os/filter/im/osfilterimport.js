goog.module('os.filter.im.OSFilterImport');
goog.module.declareLegacyNamespace();

const IFilterable = goog.require('os.filter.IFilterable');
const OSFilterImporter = goog.require('os.filter.im.OSFilterImporter');
const osImplements = goog.require('os.implements');
const {getMapContainer} = goog.require('os.map.instance');
const Module = goog.require('os.ui.Module');
const {directive: filterImportDirective, Controller: FilterImportCtrl} = goog.require('os.ui.filter.im.FilterImport');

/**
 * The osfilterimport directive
 *
 * @return {angular.Directive}
 */
const directive = () => {
  var dir = filterImportDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'osfilterimport';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the filter import directive
 * @unrestricted
 */
class Controller extends FilterImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @param {!angular.$sce} $sce Angular SCE service.
   * @ngInject
   */
  constructor($scope, $element, $sce) {
    super($scope, $element, $sce);
  }

  /**
   * @inheritDoc
   */
  getImporter() {
    var layerId = /** @type {string|undefined} */ (this.scope['layerId']);
    return new OSFilterImporter(this.getParser(), layerId);
  }

  /**
   * Get the base filterable descriptors and add in the filterable layers.
   * @inheritDoc
   */
  getFilterables() {
    var filterables = super.getFilterables();
    var layers = getMapContainer().getLayers();

    if (layers) {
      layers.forEach(function(layer) {
        if (osImplements(layer, IFilterable.ID)) {
          layer = /** @type {IFilterable} */ (layer);

          if (layer.isFilterable()) {
            filterables.unshift(layer);
          }
        }
      });
    }

    return filterables;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
