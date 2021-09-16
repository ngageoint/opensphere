goog.module('os.ui.wiz.OptionsStep');

const {directiveTag: stepUi} = goog.require('os.ui.wiz.OptionsStepUI');
const AbstractWizardStep = goog.require('os.ui.wiz.step.AbstractWizardStep');


/**
 * Import wizard miscellaneous options step
 */
class OptionsStep extends AbstractWizardStep {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.template = `<${stepUi}></${stepUi}>`;
    this.title = 'Options';
  }

  /**
   * @inheritDoc
   */
  isValid(config) {
    return this.valid && !!config['title'];
  }
}

exports = OptionsStep;
