goog.provide('os.query.ui.AreaOptionsStep');
goog.provide('os.query.ui.AreaOptionsStepCtrl');

goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.im.mergeAreaOptionDirective');
goog.require('os.ui.query');
goog.require('os.ui.wiz.step.AbstractWizardStep');
goog.require('os.ui.wiz.step.WizardStepEvent');



/**
 * Area import wizard options step
 * @extends {os.ui.wiz.step.AbstractWizardStep}
 * @constructor
 */
os.query.ui.AreaOptionsStep = function() {
  os.query.ui.AreaOptionsStep.base(this, 'constructor');
  this.template = '<areaoptionsstep></areaoptionsstep>';
  this.title = 'Area Options';
};
goog.inherits(os.query.ui.AreaOptionsStep, os.ui.wiz.step.AbstractWizardStep);


/**
 * @inheritDoc
 */
os.query.ui.AreaOptionsStep.prototype.initialize = function(config) {
  if (!this.initialized && (!config['columns'] || config['columns'].length == 0)) {
    config.updatePreview();
    os.query.ui.AreaOptionsStep.base(this, 'initialize', config);
  }
};


/**
 * The area import wizard options step directive
 * @return {angular.Directive}
 */
os.query.ui.areaOptionsStepDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/query/areaoptionsstep.html',
    controller: os.query.ui.AreaOptionsStepCtrl,
    controllerAs: 'areaoptions'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('areaoptionsstep', [os.query.ui.areaOptionsStepDirective]);



/**
 * Controller for the import wizard options step
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.query.ui.AreaOptionsStepCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {!Object<string, string>}
   */
  this['help'] = os.ui.query.AREA_IMPORT_HELP;

  $scope.$watch('areaOptionsForm.$valid', this.onValidationChange_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.query.ui.AreaOptionsStepCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Handles validation changes in the options form.
 * @param {boolean} valid If the form is valid.
 * @private
 */
os.query.ui.AreaOptionsStepCtrl.prototype.onValidationChange_ = function(valid) {
  this.scope_.$emit(os.ui.wiz.step.WizardStepEvent.VALIDATE, valid);
};
