goog.declareModuleId('os.plugin.AbstractPlugin');

const Disposable = goog.require('goog.Disposable');
const {default: IPlugin} = goog.requireType('os.plugin.IPlugin');


/**
 * @abstract
 * @implements {IPlugin}
 */
export default class AbstractPlugin extends Disposable {
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
