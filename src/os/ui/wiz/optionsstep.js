goog.declareModuleId('os.ui.wiz.OptionsStep');

import {directiveTag as stepUi} from './optionsstepui.js';
import AbstractWizardStep from './step/abstractwizardstep.js';


/**
 * Import wizard miscellaneous options step
 */
export default class OptionsStep extends AbstractWizardStep {
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
