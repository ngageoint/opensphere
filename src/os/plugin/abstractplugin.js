goog.module('os.plugin.AbstractPlugin');

const Disposable = goog.require('goog.Disposable');
const IPlugin = goog.requireType('os.plugin.IPlugin');


/**
 * @abstract
 * @implements {IPlugin}
 */
class AbstractPlugin extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {!string}
     * @protected
     */
    this.id = '';

    /**
     * @type {?string}
     * @protected
     */
    this.error = null;
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.id;
  }

  /**
   * @inheritDoc
   */
  getError() {
    return this.error;
  }
}

exports = AbstractPlugin;
