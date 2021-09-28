goog.declareModuleId('plugin.file.csv.ui.CSVExportUI');

import {ROOT} from '../../../../os/os.js';
import Module from '../../../../os/ui/module.js';


/**
 * The csvexport directive for use in exportdialog.js
 *
 * This is not a stand alone UI, it's meant to augment exportdialog.js
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  scope: {
    'exporter': '='
  },
  templateUrl: ROOT + 'views/plugin/csv/csvexport.html',
  controller: Controller,
  controllerAs: 'csvexport'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'csvexport';


/**
 * Add the directive to the module.
 */
Module.directive('csvexport', [directive]);



/**
 * Controller function for the csvexport directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
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
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
    this.exporter_ = null;
  }

  /**
   * Updates the CSV exporter with the current UI configuration.
   *
   * @private
   */
  updateExporter_() {
    if (this.exporter_ && this.scope_) {
      this.exporter_.setExportEllipses(this.scope_['exportEllipses']);
      this.exporter_.setAlwaysIncludeWkt(this.scope_['alwaysIncludeWkt']);
    }
  }
}
