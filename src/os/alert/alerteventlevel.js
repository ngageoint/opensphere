goog.module('os.alert.AlertEventLevel');
goog.module.declareLegacyNamespace();


/**
 * An alert level.
 */
class AlertEventLevel {
  /**
   * @param {string} name The name of the level.
   * @param {number} value The numeric value of the level.
   */
  constructor(name, value) {
    /**
     * The name of the level.
     * @type {string}
     */
    this.name = name;

    /**
     * The numeric value of the level.
     * @type {number}
     */
    this.value = value;
  }

  /**
   * @return {string} String representation of the alert level.
   * @override
   */
  toString() {
    return this.name;
  }
}

exports = AlertEventLevel;
