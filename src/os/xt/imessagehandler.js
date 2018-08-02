goog.provide('os.xt.IMessageHandler');



/**
 * The message handler interface
 * @interface
 * @export
 */
os.xt.IMessageHandler = function() {};


/**
 * Gets the type (or types) of messages that this handler handles
 * @return {Array.<string>}
 */
os.xt.IMessageHandler.prototype.getTypes;


/**
 * Processes a message
 * @param {*} data The message payload
 * @param {string} type The message type
 * @param {string} sender The sender ID
 * @param {number} time The time the message was sent
 */
os.xt.IMessageHandler.prototype.process;
