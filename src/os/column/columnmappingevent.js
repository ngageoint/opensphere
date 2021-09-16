goog.module('os.column.ColumnMappingEvent');

const GoogEvent = goog.require('goog.events.Event');

const ColumnMappingEventType = goog.requireType('os.column.ColumnMappingEventType');


/**
 * Event representing changes to column mappings.
 */
class ColumnMappingEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {ColumnMappingEventType} type
   * @param {?osx.column.ColumnModel} column
   */
  constructor(type, column) {
    super(type);

    /**
     * @type {?osx.column.ColumnModel}
     * @private
     */
    this.column_ = column;
  }

  /**
   * @return {?osx.column.ColumnModel}
   */
  getColumn() {
    return this.column_;
  }
}

exports = ColumnMappingEvent;
