goog.declareModuleId('os.record.Record');

const {default: IRecord} = goog.requireType('os.record.IRecord');


/**
 * The most basic implementation of a record.
 *
 * @implements {IRecord}
 */
export default class Record {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @inheritDoc
     */
    this.id = '' + Record.RECORD_ID_++;

    /**
     * @inheritDoc
     */
    this.color = 0;

    /**
     * @inheritDoc
     */
    this.recordTime = null;
  }
}

/**
 * A one-up counter for all records
 * @type {number}
 * @private
 */
Record.RECORD_ID_ = 0;
