goog.provide('os.IGroupable');

goog.require('os.implements');



/**
 * Interface representing a thing that supports advanced grouping options.
 * @interface
 */
os.IGroupable = function() {};


/**
 * ID for {@see os.implements}
 * @const {string}
 */
os.IGroupable.ID = 'os.IGroupable';


/**
 * Gets the group ID.
 * @return {!string} The ID
 */
os.IGroupable.prototype.getGroupId;


/**
 * Gets the group label.
 * @return {!string} The label
 */
os.IGroupable.prototype.getGroupLabel;
