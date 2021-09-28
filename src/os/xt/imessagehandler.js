goog.declareModuleId('os.xt.IMessageHandler');

/**
 * The message handler interface
 *
 * @interface
 */
export default class IMessageHandler {
  /**
   * Gets the type (or types) of messages that this handler handles
   * @return {Array.<string>}
   */
  getTypes() {}

  /**
   * Processes a message
   * @param {*} data The message payload
   * @param {string} type The message type
   * @param {string} sender The sender ID
   * @param {number} time The time the message was sent
   */
  process(data, type, sender, time) {}
}
