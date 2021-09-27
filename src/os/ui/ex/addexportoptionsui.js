goog.declareModuleId('os.ui.AddExportOptionsUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';

const ExportOptions = goog.requireType('os.ex.ExportOptions');


/**
 * Directive
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'options': '=',
    'showcount': '='
  },
  templateUrl: ROOT + 'views/file/addexportoptions.html',
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * Add the directive to the module
 */
Module.directive('addexportoptions', [directive]);


/**
 * Controller function for the addExportOptions directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * Radio option selected
     * @type {string}
     */
    this.scope['option'] = 'allData';

    /**
     * Toggle to show count next to each option
     * @type {string}
     */
    this['showcount'] = this.scope['showcount'] || false;

    const exportOptions = /** @type {ExportOptions|undefined} */ (this.scope['options']);

    /**
     * All data
     * @type {Array}
     */
    this['allData'] = exportOptions && exportOptions.allData || [];

    /**
     * Only selected Data
     * @type {Array}
     */
    this['selectedData'] = exportOptions && exportOptions.selectedData || [];

    /**
     * Only active (checked) data
     * @type {Array}
     */
    this['activeData'] = exportOptions && exportOptions.activeData || [];

    this.scope.$watch('option', function(newVal) {
      this.scope.$emit('addexportoptions.updateitem', this[newVal]);
    }.bind(this));
  }
}
