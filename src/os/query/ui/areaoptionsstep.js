goog.module('os.query.ui.AreaOptionsStep');
goog.module.declareLegacyNamespace();

const {directiveTag: stepUi} = goog.require('os.query.ui.AreaOptionsStepUI');
const AbstractWizardStep = goog.require('os.ui.wiz.step.AbstractWizardStep');


/**
 * Area import wizard options step
 */
class AreaOptionsStep extends AbstractWizardStep {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.template = `<${stepUi}></${stepUi}>`;
    this.title = 'Area Options';
  }

  /**
   * @inheritDoc
   */
  initialize(config) {
    if (!this.initialized && (!config['columns'] || config['columns'].length == 0)) {
      config.updatePreview();
      super.initialize(config);
    }
  }
}

exports = AreaOptionsStep;
