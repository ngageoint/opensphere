goog.declareModuleId('os.query.ui.AreaOptionsStep');

import AbstractWizardStep from '../../ui/wiz/step/abstractwizardstep.js';
import {directiveTag as stepUi} from './areaoptionsstepui.js';


/**
 * Area import wizard options step
 */
export default class AreaOptionsStep extends AbstractWizardStep {
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
