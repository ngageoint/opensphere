goog.declareModuleId('plugin.arc.query.ArcTemporalFormatter');

const {default: ITemporalFormatter} = goog.requireType('os.query.ITemporalFormatter');


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
