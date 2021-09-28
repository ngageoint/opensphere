goog.declareModuleId('os.filter.AbstractFilter');

const {default: IFilter} = goog.requireType('os.filter.IFilter');


/**
 * @implements {IFilter}
 * @template T
 */
export default class AbstractFilter {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {!string}
     * @private
     */
    this.id_ = 'os.filter.AbstractFilter';
  }

  /**
   * @inheritDoc
   */
  evaluate(item, index, array) {
    return true;
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
}
