goog.provide('os.data.xf.IGroupable');

goog.require('goog.events.Listenable');



/**
 * Interface representing a XF groupable object.
 * @extends {goog.events.Listenable}
 * @template T
 * @interface
 */
os.data.xf.IGroupable = function() {};


/**
 * Gets the bin method.
 * @return {os.histo.IBinMethod}
 */
os.data.xf.IGroupable.prototype.getBinMethod;


/**
 * Sets the bin method.
 * @param {os.histo.IBinMethod} value The count object
 */
os.data.xf.IGroupable.prototype.setBinMethod;


/**
 * This runs when an item is added to a group
 * @param {os.histo.Bin<T>} bin
 * @param {T} item
 * @return {os.histo.Bin<T>}
 */
os.data.xf.IGroupable.prototype.reduceAdd;


/**
 * This runs when an item is removed from a group
 * @param {os.histo.Bin<T>} bin
 * @param {T} item
 * @return {os.histo.Bin.<T>}
 */
os.data.xf.IGroupable.prototype.reduceRemove;


/**
 * Creates a new bin for a group
 * @return {os.histo.Bin<T>}
 */
os.data.xf.IGroupable.prototype.reduceInit;
