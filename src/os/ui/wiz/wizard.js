goog.provide('os.ui.wiz.WizardCtrl');
goog.provide('os.ui.wiz.wizardDirective');

goog.require('os.ui.Module');
goog.require('os.ui.WindowEventType');
goog.require('os.ui.window');
goog.require('os.ui.wiz.step.IWizardStep');
goog.require('os.ui.wiz.step.WizardStepEvent');


/**
 * Wizard step states.
 * @enum {string}
 */
os.ui.wiz.StepState = {
  COMPLETE: 'complete',
  ERROR: 'error',
  NONE: ''
};


/**
 * The wizard directive
 * @return {angular.Directive}
 */
os.ui.wiz.wizardDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/wiz/wizard.html',
    controller: os.ui.wiz.WizardCtrl,
    controllerAs: 'wiz'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('wizard', [os.ui.wiz.wizardDirective]);



/**
 * Controller for the wizard directive
 * @param {angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @param {!Object.<string, string>} $attrs
 * @template T
 * @constructor
 * @ngInject
 */
os.ui.wiz.WizardCtrl = function($scope, $element, $timeout, $attrs) {
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
   * @type {?angular.$timeout}
   * @protected
   */
  this.timeout = $timeout;

  /**
   * @type {T}
   * @protected
   */
  this.config = $scope['config'] || {};

  /**
   * If the wizard is currently loading.
   * @type {boolean}
   */
  this['loading'] = false;

  /**
   * @type {string}
   */
  this['wizardClass'] = '';

  /**
   * @type {Array<os.ui.wiz.step.IWizardStep>}
   */
  this['steps'] = $scope['steps'];

  this['stepStates'] = {};
  for (var i = 0, n = this['steps'].length; i < n; i++) {
    var step = this['steps'][i];
    this.setStepState(step, os.ui.wiz.StepState.NONE);
  }

  /**
   * @type {number}
   */
  this['activeIndex'] = this['steps'] && this['steps'].length > 0 ? 0 : -1;

  if (this['activeIndex'] >= 0) {
    this.activateStep_(this['steps'][this['activeIndex']]);
  }

  $scope.$on(os.ui.wiz.step.WizardStepEvent.VALIDATE, this.onStepValidityChange_.bind(this));
  $scope.$on(os.ui.wiz.step.WizardStepEvent.SAVE, this.onSave_.bind(this));
  $scope.$on(os.ui.WindowEventType.CANCEL, this.cancelInternal.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up references/listeners
 * @private
 */
os.ui.wiz.WizardCtrl.prototype.destroy_ = function() {
  var step = this['steps'][this['activeIndex']];
  if (!step.isDeactivated()) {
    step.deactivate(this.config);
  }

  this.timeout = null;
  this.element = null;
  this.scope = null;
};


/**
 * Handle step validity change. The dispatcher (step controller) can specify a validity value that will override
 * the step isValid call if false. This allows form validation errors to prevent moving on in the wizard even if
 * the model/config is technically valid.
 * @param {angular.Scope.Event} event
 * @param {boolean=} opt_valid
 * @private
 */
os.ui.wiz.WizardCtrl.prototype.onStepValidityChange_ = function(event, opt_valid) {
  event.stopPropagation();

  // default to true, relying on the step validity result
  var valid = goog.isDef(opt_valid) ? opt_valid : true;
  var step = this['steps'][this['activeIndex']];
  if (valid && step.isValid(this.config)) {
    this.setStepState(step, os.ui.wiz.StepState.NONE);
  } else {
    this.setStepState(step, os.ui.wiz.StepState.ERROR);
  }
};


/**
 * Handles save events.
 * @param {angular.Scope.Event} event
 * @param {os.parse.FileParserConfig=} opt_config Optional parser config.
 * @private
 */
os.ui.wiz.WizardCtrl.prototype.onSave_ = function(event, opt_config) {
  var step = this['steps'][this['activeIndex']];
  if (step) {
    step.finalize(opt_config);
  }
};


/**
 * @param {os.ui.wiz.step.IWizardStep} step
 * @param {boolean=} opt_skipCompile If true, compilation of the next step will be skipped. Use this when moving
 *   multiple steps at a time.
 * @private
 */
os.ui.wiz.WizardCtrl.prototype.activateStep_ = function(step, opt_skipCompile) {
  var scope = opt_skipCompile ? undefined : this.scope.$new();
  var parent = opt_skipCompile ? undefined : this.element.find('#js-wizard-step-content');
  step.activate(this.config, scope, parent);
};


/**
 * Check if all steps are complete and finish the wizard, or display an error.
 */
os.ui.wiz.WizardCtrl.prototype.accept = function() {
  var step = this['steps'][this['activeIndex']];
  if (step.isValid(this.config)) {
    this.finish();
  } else {
    this.setStepState(step, os.ui.wiz.StepState.ERROR);
  }
};
goog.exportProperty(os.ui.wiz.WizardCtrl.prototype, 'accept', os.ui.wiz.WizardCtrl.prototype.accept);


/**
 * If the accept button should be enabled.
 * @return {boolean}
 */
os.ui.wiz.WizardCtrl.prototype.canAccept = function() {
  // only enable the accept button if we're on the last step and it's valid
  return this.isLastStep() && this.getStepState(this['activeIndex']) != os.ui.wiz.StepState.ERROR;
};
goog.exportProperty(os.ui.wiz.WizardCtrl.prototype, 'canAccept', os.ui.wiz.WizardCtrl.prototype.canAccept);


/**
 * If the next button should be enabled.
 * @return {boolean}
 */
os.ui.wiz.WizardCtrl.prototype.canContinue = function() {
  // only enable the next button if we're not on the last step and the current step is valid
  return !this.isLastStep() && this.getStepState(this['activeIndex']) != os.ui.wiz.StepState.ERROR;
};
goog.exportProperty(os.ui.wiz.WizardCtrl.prototype, 'canContinue', os.ui.wiz.WizardCtrl.prototype.canContinue);


/**
 * If the accept button should be enabled.
 * @return {boolean}
 */
os.ui.wiz.WizardCtrl.prototype.isLastStep = function() {
  return this['activeIndex'] == this['steps'].length - 1;
};
goog.exportProperty(os.ui.wiz.WizardCtrl.prototype, 'isLastStep', os.ui.wiz.WizardCtrl.prototype.isLastStep);


/**
 * Performs wizard cancellation actions and closes the window.
 */
os.ui.wiz.WizardCtrl.prototype.cancel = function() {
  this.cancelInternal();
  os.ui.window.close(this.element);
};
goog.exportProperty(os.ui.wiz.WizardCtrl.prototype, 'cancel', os.ui.wiz.WizardCtrl.prototype.cancel);


/**
 * Performs wizard cancellation/cleanup actions.
 * @protected
 */
os.ui.wiz.WizardCtrl.prototype.cancelInternal = function() {
  // meant for overriding classes
};


/**
 * Perform wizard completion actions.
 * @protected
 */
os.ui.wiz.WizardCtrl.prototype.finish = function() {
  os.ui.window.close(this.element);
};


/**
 * Move to the next step in the wizard.
 * @param {boolean=} opt_skipCompile If true, compilation of the next step will be skipped. Use this when moving
 *   multiple steps at a time.
 */
os.ui.wiz.WizardCtrl.prototype.next = function(opt_skipCompile) {
  if (this['activeIndex'] < this['steps'].length - 1) {
    var step = this['steps'][this['activeIndex']];
    if (step.isValid(this.config)) {
      this.setStepState(step, os.ui.wiz.StepState.COMPLETE);
      step.deactivate(this.config);

      step = this['steps'][++this['activeIndex']];

      // don't skip compilation if the step is valid. the wizard will stop at this step.
      var skipCompile = opt_skipCompile && step.isValid(this.config);
      this.activateStep_(step, skipCompile);
    } else {
      this.setStepState(step, os.ui.wiz.StepState.ERROR);

      if (!step.isCompiled()) {
        this.activateStep_(step);
      }
    }

    this.afterStepping_();
  }
};
goog.exportProperty(os.ui.wiz.WizardCtrl.prototype, 'next', os.ui.wiz.WizardCtrl.prototype.next);


/**
 * Move to the previous step in the wizard.
 * @param {boolean=} opt_skipCompile If true, compilation of the next step will be skipped. Use this when moving
 *   multiple steps at a time.
 */
os.ui.wiz.WizardCtrl.prototype.prev = function(opt_skipCompile) {
  if (this['activeIndex'] > 0) {
    var step = this['steps'][this['activeIndex']];
    this.setStepState(step, step.isValid(this.config) ? os.ui.wiz.StepState.NONE : os.ui.wiz.StepState.ERROR);
    step.deactivate(this.config);

    step = this['steps'][--this['activeIndex']];
    this.activateStep_(step, opt_skipCompile);
    this.afterStepping_();
  }
};
goog.exportProperty(os.ui.wiz.WizardCtrl.prototype, 'prev', os.ui.wiz.WizardCtrl.prototype.prev);


/**
 * Update step states.
 * @private
 */
os.ui.wiz.WizardCtrl.prototype.afterStepping_ = function() {
  if (this['activeIndex'] > -1) {
    // validate active step
    var activeStep = this['steps'][this['activeIndex']];
    if (!activeStep.isValid(this.config)) {
      this.setStepState(activeStep, os.ui.wiz.StepState.ERROR);
    }

    // reset state for downstream steps
    for (var i = this['activeIndex'] + 1, ii = this['steps'].length; i < ii; i++) {
      this.setStepState(this['steps'][i], os.ui.wiz.StepState.NONE);
    }
  }
};


/**
 * Move to a specific step in the wizard.
 * @param {number} index
 */
os.ui.wiz.WizardCtrl.prototype.setStepIndex = function(index) {
  index = goog.math.clamp(index, 0, this['steps'].length - 1);

  while (this['activeIndex'] != index) {
    var old = this['activeIndex'];
    if (old > index) {
      // skip compilation if there are more steps to process
      this.prev(old > index + 1);
    } else if (old < index) {
      // skip compilation if there are more steps to process
      this.next(old < index - 1);
    }

    if (old == this['activeIndex']) {
      // step didn't change - bail!
      break;
    }
  }
};
goog.exportProperty(
    os.ui.wiz.WizardCtrl.prototype,
    'setStepIndex',
    os.ui.wiz.WizardCtrl.prototype.setStepIndex);


/**
 * Determine if the provided step is set as the active step.
 * @param {os.ui.wiz.step.IWizardStep|number} step The step or the index in the steps array
 * @return {boolean}
 */
os.ui.wiz.WizardCtrl.prototype.isActive = function(step) {
  if (goog.isNumber(step)) {
    return this['activeIndex'] === step;
  } else {
    return this['steps'][this['activeIndex']] === step;
  }
};
goog.exportProperty(
    os.ui.wiz.WizardCtrl.prototype,
    'isActive',
    os.ui.wiz.WizardCtrl.prototype.isActive);


/**
 * Get the icon to display next to the step in the wizard.
 * @param {os.ui.wiz.step.IWizardStep|number} step The step or the index in the steps array
 * @return {!string}
 */
os.ui.wiz.WizardCtrl.prototype.getStepIcon = function(step) {
  if (goog.isNumber(step)) {
    step = this['steps'][step];
  }

  if (step) {
    var state = this.getStepState(step);
    if (state == os.ui.wiz.StepState.ERROR) {
      // always show the error icon if the step is invalid, regardless of position
      return 'fa-exclamation-triangle text-warning';
    } else if (this.isActive(step)) {
      // show the caret for the active step
      return 'fa-caret-right';
    } else if (state == os.ui.wiz.StepState.COMPLETE) {
      // show checkmark for completed steps
      return 'fa-check text-success';
    }
  }

  return '';
};
goog.exportProperty(
    os.ui.wiz.WizardCtrl.prototype,
    'getStepIcon',
    os.ui.wiz.WizardCtrl.prototype.getStepIcon);


/**
 * Get the state of the provided step
 * @param {os.ui.wiz.step.IWizardStep|number} step The step or the index in the steps array
 * @return {!string}
 */
os.ui.wiz.WizardCtrl.prototype.getStepState = function(step) {
  if (goog.isNumber(step)) {
    step = this['steps'][step];
  }

  return this['stepStates'][step.getTitle()];
};
goog.exportProperty(
    os.ui.wiz.WizardCtrl.prototype,
    'getStepState',
    os.ui.wiz.WizardCtrl.prototype.getStepState);


/**
 * Set the state of the provided step
 * @param {os.ui.wiz.step.IWizardStep|number} step The step or the index in the steps array
 * @param {os.ui.wiz.StepState} state The new state
 * @protected
 */
os.ui.wiz.WizardCtrl.prototype.setStepState = function(step, state) {
  if (goog.isNumber(step)) {
    step = this['steps'][step];
  }

  if (step) {
    this['stepStates'][step.getTitle()] = state;
    os.ui.apply(this.scope);
  }
};
