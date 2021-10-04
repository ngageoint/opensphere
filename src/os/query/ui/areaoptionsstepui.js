goog.declareModuleId('os.query.ui.AreaOptionsStepUI');

import '../../ui/im/mergeareaoption.js';
import {ROOT} from '../../os.js';
import Module from '../../ui/module.js';
import {AREA_IMPORT_HELP} from '../../ui/query/query.js';
import WizardStepEvent from '../../ui/wiz/step/wizardstepevent.js';


/**
 * The area import wizard options step directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/query/areaoptionsstep.html',
  controller: Controller,
  controllerAs: 'areaoptions'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'areaoptionsstep';


/**
 * Add the directive to the module
 */
Module.directive('areaoptionsstep', [directive]);


/**
 * Controller for the import wizard options step
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
     * @type {!Object<string, string>}
     */
    this['help'] = AREA_IMPORT_HELP;

    $scope.$watch('areaOptionsForm.$valid', this.onValidationChange_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * Handles validation changes in the options form.
   *
   * @param {boolean} valid If the form is valid.
   * @private
   */
  onValidationChange_(valid) {
    this.scope_.$emit(WizardStepEvent.VALIDATE, valid);
  }
}
