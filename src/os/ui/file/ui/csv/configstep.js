goog.module('os.ui.file.ui.csv.ConfigStep');
goog.module.declareLegacyNamespace();

const MappingManager = goog.require('os.im.mapping.MappingManager');
const AbstractWizardStep = goog.require('os.ui.wiz.step.AbstractWizardStep');
const CsvParserConfig = goog.requireType('os.parse.csv.CsvParserConfig');
const {directiveTag: stepUi} = goog.require('os.ui.file.ui.csv.ConfigStepUI');


/**
 * CSV import data step
 *
 * @extends {AbstractWizardStep<CsvParserConfig>}
 */
class ConfigStep extends AbstractWizardStep {
  /**
   * Constructor.
   * @param {angular.$compile=} opt_compile Angular compile function
   */
  constructor(opt_compile) {
    super(opt_compile);
    this.template = `<${stepUi}></${stepUi}>`;
    this.title = 'Configuration';
  }

  /**
   * @inheritDoc
   */
  finalize(config) {
    try {
      config.updatePreview();

      var features = config['preview'].slice(0, 24);
      if ((!config['mappings'] || config['mappings'].length <= 0) && features && features.length > 0) {
        // no mappings have been set yet, so try to auto detect them
        var mm = MappingManager.getInstance();
        var mappings = mm.autoDetect(features);
        if (mappings && mappings.length > 0) {
          config['mappings'] = mappings;
        }
      }
    } catch (e) {
    }
  }
}

exports = ConfigStep;
