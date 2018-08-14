goog.provide('plugin.file.shp.ui.SHPExportCtrl');
goog.provide('plugin.file.shp.ui.shpExportDirective');
goog.require('os.defines');
goog.require('os.ui.Module');


/**
 * The shpexport directive
 * @return {angular.Directive}
 */
plugin.file.shp.ui.shpExportDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'exporter': '='
    },
    templateUrl: os.ROOT + 'views/plugin/shp/shpexport.html',
    controller: plugin.file.shp.ui.SHPExportCtrl,
    controllerAs: 'shpexport'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('shpexport', [plugin.file.shp.ui.shpExportDirective]);



/**
 * Controller function for the shpexport directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
plugin.file.shp.ui.SHPExportCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {plugin.file.shp.SHPExporter}
   * @private
   */
  this.exporter_ = /** @type {plugin.file.shp.SHPExporter} */ ($scope['exporter']);

  /**
   * @type {boolean}
   */
  $scope['exportEllipses'] = this.exporter_.getExportEllipses();

  $scope.$watch('exportEllipses', this.updateExporter_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));

  this.updateExporter_();
};


/**
 * Clean up.
 * @private
 */
plugin.file.shp.ui.SHPExportCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.exporter_ = null;
};


/**
 * Updates the SHP exporter with the current UI configuration.
 * @private
 */
plugin.file.shp.ui.SHPExportCtrl.prototype.updateExporter_ = function() {
  if (this.exporter_ && this.scope_) {
    this.exporter_.setExportEllipses(this.scope_['exportEllipses']);
  }
};
