goog.module('os.query.ui.AreaOptionsStepUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.im.mergeAreaOptionDirective');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const {AREA_IMPORT_HELP} = goog.require('os.ui.query');
const WizardStepEvent = goog.require('os.ui.wiz.step.WizardStepEvent');


/**
 * The area import wizard options step directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'areaoptionsstep';


/**
 * Add the directive to the module
 */
Module.directive('areaoptionsstep', [directive]);


/**
 * Controller for the import wizard options step
 * @unrestricted
 */
class Controller {
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

exports = {
  Controller,
  directive,
  directiveTag
};
