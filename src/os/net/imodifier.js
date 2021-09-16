goog.module('os.net.IModifier');

const Uri = goog.requireType('goog.Uri');


/**
 * Modifiers modify portions of a URI before the URI is retrieved.
 *
 * @interface
 */
class IModifier {
  /**
   * Gets the ID of the modifier
   * @return {string}
   */
  getId() {}

  /**
   * Sets the ID of the modifier
   * @param {string} id The ID
   */
  setId(id) {}

  /**
   * Gets the priority of the modifier. Modifiers are executed from
   * highest to lowest priority.
   * @return {number} The priority
   */
  getPriority() {}

  /**
   * Sets the priority of the modifier. Modifiers are executed from
   * highest to lowest priority.
   * @param {number} priority The priority
   */
  setPriority(priority) {}

  /**
   * Modifies a URI in place
   * @param {Uri} uri The URI to modify
   */
  modify(uri) {}
}

exports = IModifier;
