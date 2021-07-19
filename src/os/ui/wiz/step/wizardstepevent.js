goog.module('os.ui.wiz.step.WizardStepEvent');
goog.module.declareLegacyNamespace();


/**
 * Events that can be fired by the wizard step controller.
 * @enum {string}
 */
exports = {
  FINALIZE: 'finalize',
  VALIDATE: 'validate',
  SAVE: 'save'
};
