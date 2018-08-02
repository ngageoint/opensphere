goog.provide('os.record.Record');
goog.require('os.record.IRecord');



/**
 * The most basic implementation of a record.
 * @constructor
 * @implements {os.record.IRecord}
 */
os.record.Record = function() {
  this.id = '' + os.record.Record.RECORD_ID_;
  os.record.Record.RECORD_ID_++;
};


/**
 * A one-up counter for all records
 * @type {number}
 * @private
 */
os.record.Record.RECORD_ID_ = 0;


/**
 * @inheritDoc
 */
os.record.Record.prototype.id = null;


/**
 * @inheritDoc
 */
os.record.Record.prototype.color = 0;


/**
 * @inheritDoc
 */
os.record.Record.prototype.recordTime = null;
