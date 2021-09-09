goog.module('os.query.TemporalFormatter');

const {format, momentFormat} = goog.require('os.time');

const ITemporalFormatter = goog.requireType('os.query.ITemporalFormatter');


/**
 * Base implementation of a temporal formatter
 *
 * @implements {ITemporalFormatter}
 */
class TemporalFormatter {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {?string}
     * @private
     */
    this.datePattern_ = null;
  }

  /**
   * Set the start column.
   *
   * @param {?string} value
   */
  setStartColumn(value) {
  }

  /**
   * Set the end column.
   *
   * @param {?string} value
   */
  setEndColumn(value) {
  }

  /**
   * Sets the date format from a string
   *
   * @param {?string} value
   */
  setDateFormat(value) {
    this.datePattern_ = value;
  }

  /**
   * @inheritDoc
   */
  format(controller) {
    var start = '';
    var end = '';
    if (!this.datePattern_) {
      start = format(new Date(controller.getStart()), undefined, false, true);
      end = format(new Date(controller.getEnd()), undefined, false, true);
    } else {
      start = momentFormat(new Date(controller.getStart()), this.datePattern_, true);
      end = momentFormat(new Date(controller.getEnd()), this.datePattern_, true);
    }


    return start + '/' + end;
  }
}

exports = TemporalFormatter;
