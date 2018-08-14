goog.provide('os.data.IReimport');



/**
 * @interface
 */
os.data.IReimport = function() {};


/**
 * @return {boolean}
 */
os.data.IReimport.prototype.canReimport = goog.abstractMethod;


/**
 * Reimports this item
 */
os.data.IReimport.prototype.reimport = goog.abstractMethod;
