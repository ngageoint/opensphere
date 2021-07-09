goog.module('os.ui.search.NoResult');
goog.module.declareLegacyNamespace();

const AbstractSearchResult = goog.require('os.search.AbstractSearchResult');

/**
 * Search results containing a coordinate to display on the map.
 *
 * @extends {AbstractSearchResult<number>}
 */
class NoResult extends AbstractSearchResult {
  /**
   * Constructor.
   */
  constructor() {
    super(0, 0);
  }

  /**
   * @inheritDoc
   */
  getSearchUI() {
    return '<div class="coord-result-card"><div class="result-card-header">No results found</div></div>';
  }
}

exports = NoResult;
