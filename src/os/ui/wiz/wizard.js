goog.module('os.ui.wiz.WizardUI');

const {clamp} = goog.require('goog.math');
const {ROOT} = goog.require('os');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const osWindow = goog.require('os.ui.window');
const WizardStepEvent = goog.require('os.ui.wiz.step.WizardStepEvent');

const FileParserConfig = goog.requireType('os.parse.FileParserConfig');
const IWizardStep = goog.requireType('os.ui.wiz.step.IWizardStep');


/**
 * Wizard step states.
 * @enum {string}
 */
const StepState = {
  COMPLETE: 'complete',
  ERROR: 'error',
  NONE: ''
};


/**
 * The wizard directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/wiz/wizard.html',
  controller: Controller,
  controllerAs: 'wiz'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'wizard';


/**
 * Add the directive to the os.ui module
 */
Module.directive('wizard', [directive]);


/**
 * Controller for the wizard directive
 *
 * @template T
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @param {!Object.<string, string>} $attrs
   * @ngInject
   */
  constructor($scope, $element, $timeout, $attrs) {
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
     * @type {Array<IWizardStep>}
     */
    this['steps'] = $scope['steps'];

    this['stepStates'] = {};
    for (var i = 0, n = this['steps'].length; i < n; i++) {
      var step = this['steps'][i];
      this.setStepState(step, StepState.NONE);
    }

    /**
     * @type {number}
     */
    this['activeIndex'] = this['steps'] && this['steps'].length > 0 ? 0 : -1;

    if (this['activeIndex'] >= 0) {
      this.activateStep_(this['steps'][this['activeIndex']]);
    }

    $scope.$on(WizardStepEvent.VALIDATE, this.onStepValidityChange_.bind(this));
    $scope.$on(WizardStepEvent.SAVE, this.onSave_.bind(this));
    $scope.$on(WindowEventType.CANCEL, this.cancelInternal.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up references/listeners
   *
   * @private
   */
  destroy_() {
    var step = this['steps'][this['activeIndex']];
    if (!step.isDeactivated()) {
      step.deactivate(this.config);
    }

    this.timeout = null;
    this.element = null;
    this.scope = null;
  }

  /**
   * Handle step validity change. The dispatcher (step controller) can specify a validity value that will override
   * the step isValid call if false. This allows form validation errors to prevent moving on in the wizard even if
   * the model/config is technically valid.
   *
   * @param {angular.Scope.Event} event
   * @param {boolean=} opt_valid
   * @private
   */
  onStepValidityChange_(event, opt_valid) {
    event.stopPropagation();

    // default to true, relying on the step validity result
    var valid = opt_valid !== undefined ? opt_valid : true;
    var step = this['steps'][this['activeIndex']];
    if (valid && step.isValid(this.config)) {
      this.setStepState(step, StepState.NONE);
    } else {
      this.setStepState(step, StepState.ERROR);
    }
  }

  /**
   * Handles save events.
   *
   * @param {angular.Scope.Event} event
   * @param {FileParserConfig=} opt_config Optional parser config.
   * @private
   */
  onSave_(event, opt_config) {
    var step = this['steps'][this['activeIndex']];
    if (step) {
      step.finalize(opt_config);
    }
  }

  /**
   * @param {IWizardStep} step
   * @param {boolean=} opt_skipCompile If true, compilation of the next step will be skipped. Use this when moving
   *   multiple steps at a time.
   * @private
   */
  activateStep_(step, opt_skipCompile) {
    var scope = opt_skipCompile ? undefined : this.scope.$new();
    var parent = opt_skipCompile ? undefined : this.element.find('#js-wizard-step-content');
    step.activate(this.config, scope, parent);
  }

  /**
   * Check if all steps are complete and finish the wizard, or display an error.
   *
   * @export
   */
  accept() {
    var step = this['steps'][this['activeIndex']];
    if (step.isValid(this.config)) {
      this.finish();
    } else {
      this.setStepState(step, StepState.ERROR);
    }
  }

  /**
   * If the accept button should be enabled.
   *
   * @return {boolean}
   * @export
   */
  canAccept() {
    // only enable the accept button if we're on the last step and it's valid
    return this.isLastStep() && this.getStepState(this['activeIndex']) != StepState.ERROR;
  }

  /**
   * If the next button should be enabled.
   *
   * @return {boolean}
   * @export
   */
  canContinue() {
    // only enable the next button if we're not on the last step and the current step is valid
    return !this.isLastStep() && this.getStepState(this['activeIndex']) != StepState.ERROR;
  }

  /**
   * If the accept button should be enabled.
   *
   * @return {boolean}
   * @export
   */
  isLastStep() {
    return this['activeIndex'] == this['steps'].length - 1;
  }

  /**
   * Performs wizard cancellation actions and closes the window.
   *
   * @export
   */
  cancel() {
    this.cancelInternal();
    osWindow.close(this.element);
  }

  /**
   * Performs wizard cancellation/cleanup actions.
   *
   * @protected
   */
  cancelInternal() {
    // meant for overriding classes
  }

  /**
   * Perform wizard completion actions.
   *
   * @protected
   */
  finish() {
    osWindow.close(this.element);
  }

  /**
   * Move to the next step in the wizard.
   *
   * @param {boolean=} opt_skipCompile If true, compilation of the next step will be skipped. Use this when moving
   *   multiple steps at a time.
   * @export
   */
  next(opt_skipCompile) {
    if (this['activeIndex'] < this['steps'].length - 1) {
      var step = this['steps'][this['activeIndex']];
      if (step.isValid(this.config)) {
        this.setStepState(step, StepState.COMPLETE);
        step.deactivate(this.config);

        step = this['steps'][++this['activeIndex']];

        // don't skip compilation if the step is valid. the wizard will stop at this step.
        var skipCompile = opt_skipCompile && step.isValid(this.config);
        this.activateStep_(step, skipCompile);
      } else {
        this.setStepState(step, StepState.ERROR);

        if (!step.isCompiled()) {
          this.activateStep_(step);
        }
      }

      this.afterStepping_();
    }
  }

  /**
   * Move to the previous step in the wizard.
   *
   * @param {boolean=} opt_skipCompile If true, compilation of the next step will be skipped. Use this when moving
   *   multiple steps at a time.
   * @export
   */
  prev(opt_skipCompile) {
    if (this['activeIndex'] > 0) {
      var step = this['steps'][this['activeIndex']];
      this.setStepState(step, step.isValid(this.config) ? StepState.NONE : StepState.ERROR);
      step.deactivate(this.config);

      step = this['steps'][--this['activeIndex']];
      this.activateStep_(step, opt_skipCompile);
      this.afterStepping_();
    }
  }

  /**
   * Update step states.
   *
   * @private
   */
  afterStepping_() {
    if (this['activeIndex'] > -1) {
      // validate active step
      var activeStep = this['steps'][this['activeIndex']];
      if (!activeStep.isValid(this.config)) {
        this.setStepState(activeStep, StepState.ERROR);
      }

      // reset state for downstream steps
      for (var i = this['activeIndex'] + 1, ii = this['steps'].length; i < ii; i++) {
        this.setStepState(this['steps'][i], StepState.NONE);
      }
    }
  }

  /**
   * Move to a specific step in the wizard.
   *
   * @param {number} index
   * @export
   */
  setStepIndex(index) {
    index = clamp(index, 0, this['steps'].length - 1);

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
  }

  /**
   * Determine if the provided step is set as the active step.
   *
   * @param {IWizardStep|number} step The step or the index in the steps array
   * @return {boolean}
   * @export
   */
  isActive(step) {
    if (typeof step === 'number') {
      return this['activeIndex'] === step;
    } else {
      return this['steps'][this['activeIndex']] === step;
    }
  }

  /**
   * Get the icon to display next to the step in the wizard.
   *
   * @param {IWizardStep|number} step The step or the index in the steps array
   * @return {!string}
   * @export
   */
  getStepIcon(step) {
    if (typeof step === 'number') {
      step = this['steps'][step];
    }

    if (step) {
      var state = this.getStepState(step);
      if (state == StepState.ERROR) {
        // always show the error icon if the step is invalid, regardless of position
        return 'fa-exclamation-triangle text-warning';
      } else if (this.isActive(step)) {
        // show the caret for the active step
        return 'fa-caret-right';
      } else if (state == StepState.COMPLETE) {
        // show checkmark for completed steps
        return 'fa-check text-success';
      }
    }

    return '';
  }

  /**
   * Get the state of the provided step
   *
   * @param {IWizardStep|number} step The step or the index in the steps array
   * @return {!string}
   * @export
   */
  getStepState(step) {
    if (typeof step === 'number') {
      step = this['steps'][step];
    }

    return this['stepStates'][step.getTitle()];
  }

  /**
   * Set the state of the provided step
   *
   * @param {IWizardStep|number} step The step or the index in the steps array
   * @param {StepState} state The new state
   * @protected
   */
  setStepState(step, state) {
    if (typeof step === 'number') {
      step = this['steps'][step];
    }

    if (step) {
      this['stepStates'][step.getTitle()] = state;
      apply(this.scope);
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
