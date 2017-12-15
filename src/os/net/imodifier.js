goog.provide('os.net.IModifier');
goog.require('goog.Uri');



/**
 * Modifiers modify portions of a URI before the URI is retrieved.
 * @interface
 */
os.net.IModifier = function() {};


/**
 * Gets the ID of the modifier
 * @return {string}
 */
os.net.IModifier.prototype.getId;


/**
 * Sets the ID of the modifier
 * @param {string} id The ID
 */
os.net.IModifier.prototype.setId;


/**
 * Gets the priority of the modifier. Modifiers are executed from
 * highest to lowest priority.
 * @return {number} The priority
 */
os.net.IModifier.prototype.getPriority;


/**
 * Sets the priority of the modifier. Modifiers are executed from
 * highest to lowest priority.
 * @param {number} priority The priority
 */
os.net.IModifier.prototype.setPriority;


/**
 * Modifies a URI in place
 * @param {goog.Uri} uri The URI to modify
 */
os.net.IModifier.prototype.modify;
