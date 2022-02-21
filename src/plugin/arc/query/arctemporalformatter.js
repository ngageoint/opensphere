goog.declareModuleId('plugin.arc.query.ArcTemporalFormatter');

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

export default ArcTemporalFormatter;
