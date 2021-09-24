goog.declareModuleId('plugin.file.shp.ui.SHPExportUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');


/**
 * The shpexport directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  scope: {
    'exporter': '='
  },
  templateUrl: ROOT + 'views/plugin/shp/shpexport.html',
  controller: Controller,
  controllerAs: 'shpexport'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'shpexport';


/**
 * Add the directive to the module.
 */
Module.directive('shpexport', [directive]);



/**
 * Controller function for the shpexport directive
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
   * Updates the SHP exporter with the current UI configuration.
   *
   * @private
   */
  updateExporter_() {
    if (this.exporter_ && this.scope_) {
      this.exporter_.setExportEllipses(this.scope_['exportEllipses']);
    }
  }
}
