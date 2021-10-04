goog.declareModuleId('os.ui.wiz.step.WizardStepEvent');

/**
 * Events that can be fired by the wizard step controller.
 * @enum {string}
 */
const WizardStepEvent = {
  FINALIZE: 'finalize',
  VALIDATE: 'validate',
  SAVE: 'save'
};

export default WizardStepEvent;
