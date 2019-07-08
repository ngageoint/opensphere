goog.provide('plugin.file.csv.ui.CSVExportCtrl');
goog.provide('plugin.file.csv.ui.csvExportDirective');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.icon.IconPickerCtrl');
goog.require('os.ui.icon.iconPickerDirective');



/**
 * The csvexport directive for use in exportdialog.js
 *
 * This is not a stand alone UI, it's meant to augment exportdialog.js
 *
 * @return {angular.Directive}
 */
plugin.file.csv.ui.csvExportDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'exporter': '='
    },
    templateUrl: os.ROOT + 'views/plugin/csv/csvexport.html',
    controller: plugin.file.csv.ui.CSVExportCtrl,
    controllerAs: 'csvexport'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('csvexport', [plugin.file.csv.ui.csvExportDirective]);



/**
 * Controller function for the csvexport directive
 *
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
plugin.file.csv.ui.CSVExportCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {plugin.file.csv.CSVExporter}
   * @private
   */
  this.exporter_ = /** @type {plugin.file.csv.CSVExporter} */ ($scope['exporter']);

  /**
   * @type {boolean}
   */
  $scope['exportEllipses'] = this.exporter_.getExportEllipses();

  /**
   * @type {boolean}
   */
  $scope['alwaysIncludeWkt'] = this.exporter_.getAlwaysIncludeWkt();

  $scope.$watch('exportEllipses', this.updateExporter_.bind(this));
  $scope.$watch('alwaysIncludeWkt', this.updateExporter_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));

  this.updateExporter_();
};


/**
 * Clean up.
 *
 * @private
 */
plugin.file.csv.ui.CSVExportCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.exporter_ = null;
};


/**
 * Updates the CSV exporter with the current UI configuration.
 *
 * @private
 */
plugin.file.csv.ui.CSVExportCtrl.prototype.updateExporter_ = function() {
  if (this.exporter_ && this.scope_) {
    this.exporter_.setExportEllipses(this.scope_['exportEllipses']);
    this.exporter_.setAlwaysIncludeWkt(this.scope_['alwaysIncludeWkt']);
  }
};
