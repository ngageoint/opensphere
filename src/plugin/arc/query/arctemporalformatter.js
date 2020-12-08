goog.module('plugin.arc.query.ArcTemporalFormatter');
goog.module.declareLegacyNamespace();

const ITemporalFormatter = goog.requireType('os.query.ITemporalFormatter');


/**
 * @implements {ITemporalFormatter}
 */
class ArcTemporalFormatter {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * @inheritDoc
   */
  format(controller) {
    return controller.getStart() + ', ' + controller.getEnd();
  }
}

exports = ArcTemporalFormatter;
