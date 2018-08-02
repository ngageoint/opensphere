goog.provide('os.record.IRecord');

goog.require('os.time.ITime');



/**
 * A simple interface for describing a record
 * @interface
 */
os.record.IRecord = function() {};


/**
 * The ID of the record
 * @type {string}
 */
os.record.IRecord.prototype.id;


/**
 * The color of the record
 * @type {number}
 */
os.record.IRecord.prototype.color;


/**
 * The time for the record
 * @type {os.time.ITime}
 */
os.record.IRecord.prototype.recordTime;
