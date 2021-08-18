goog.module('os.net.AbstractModifier');
goog.module.declareLegacyNamespace();

const IModifier = goog.requireType('os.net.IModifier');


/**
 * @abstract
 * @implements {IModifier}
 */
class AbstractModifier {
  /**
   * Constructor.
   * @param {string} id Identifier for the modifier
   * @param {number=} opt_priority Priority of the modifier
   */
  constructor(id, opt_priority) {
    /**
     * @type {string}
     * @private
     */
    this.id_ = id;

    /**
     * @type {number}
     * @private
     */
    this.priority_ = opt_priority !== undefined ? opt_priority : 0;
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.id_;
  }

  /**
   * @inheritDoc
   */
  setId(id) {
    this.id_ = id;
  }

  /**
   * @inheritDoc
   */
  getPriority() {
    return this.priority_;
  }

  /**
   * @inheritDoc
   */
  setPriority(priority) {
    this.priority_ = priority;
  }
}

exports = AbstractModifier;
