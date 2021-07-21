goog.module('os.filter.AbstractFilter');
goog.module.declareLegacyNamespace();

const IFilter = goog.requireType('os.filter.IFilter');


/**
 * @implements {IFilter}
 * @template T
 */
class AbstractFilter {
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

exports = AbstractFilter;
