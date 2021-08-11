goog.module('os.data.filter.OddFilter');
goog.module.declareLegacyNamespace();

const AbstractFilter = goog.require('os.filter.AbstractFilter');


/**
 * An odd filter, it only returns true for odd indices in the source array.
 */
class OddFilter extends AbstractFilter {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  evaluate(item, index, array) {
    return index % 2 == 1;
  }
}

exports = OddFilter;
