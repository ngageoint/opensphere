goog.provide('os.ui.wiz.OptionsStep');
goog.provide('os.ui.wiz.OptionsStepCtrl');

goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.color.colorPickerDirective');
goog.require('os.ui.wiz.step.AbstractWizardStep');
goog.require('os.ui.wiz.step.WizardStepEvent');



/**
 * Import wizard miscellaneous options step
 * @extends {os.ui.wiz.step.AbstractWizardStep}
 * @constructor
 */
os.ui.wiz.OptionsStep = function() {
  os.ui.wiz.OptionsStep.base(this, 'constructor');
  this.template = '<optionsstep></optionsstep>';
  this.title = 'Options';
};
goog.inherits(os.ui.wiz.OptionsStep, os.ui.wiz.step.AbstractWizardStep);


/**
 * @inheritDoc
 */
os.ui.wiz.OptionsStep.prototype.isValid = function(config) {
  return this.valid && !!config['title'];
};


/**
 * The import wizard options step directive
 * @return {angular.Directive}
 */
os.ui.wiz.optionsStepDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/wiz/optionsstep.html',
    controller: os.ui.wiz.OptionsStepCtrl,
    controllerAs: 'optionsStep'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('optionsstep', [os.ui.wiz.optionsStepDirective]);



/**
 * Controller for the import wizard options step
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.wiz.OptionsStepCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {string}
   * @private
   */
  this.originalTitle_ = $scope['config']['title'];

  $scope.$watch('config.title', this.onTitleChange_.bind(this));
  $scope.$watch('optionsForm.$valid', this.onValidationChange_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.ui.wiz.OptionsStepCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Handles changes to the title field, checking if the title already exists.
 * @param {string} newVal The new title value
 * @private
 */
os.ui.wiz.OptionsStepCtrl.prototype.onTitleChange_ = function(newVal) {
  if (newVal && newVal != this.originalTitle_) {
    var exists = os.file.FileStorage.getInstance().fileExists(os.file.getLocalUrl(newVal));
    this.scope_['optionsForm']['title'].$setValidity('exists', !exists);
  } else {
    this.scope_['optionsForm']['title'].$setValidity('exists', true);
  }
};


/**
 * Handles validation changes in the options form.
 * @param {boolean} valid If the form is valid.
 * @private
 */
os.ui.wiz.OptionsStepCtrl.prototype.onValidationChange_ = function(valid) {
  this.scope_.$emit(os.ui.wiz.step.WizardStepEvent.VALIDATE, valid);
};
