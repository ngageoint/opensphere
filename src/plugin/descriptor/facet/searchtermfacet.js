goog.module('plugin.descriptor.facet.SearchTerm');
goog.module.declareLegacyNamespace();

const SearchTermFacet = goog.require('os.search.SearchTermFacet');


/**
 * @extends {SearchTermFacet<!os.data.IDataDescriptor>}
 */
class SearchTerm extends SearchTermFacet {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {number}
     * @private
     */
    this.dateThreshold_ = -1;
  }

  /**
   * @inheritDoc
   */
  setTerm(term) {
    super.setTerm(term);
    this.dateThreshold_ = -1;

    if (term) {
      var now = Date.now();
      this.dateThreshold_ = now - SearchTerm.DURATION_;
    }
  }

  /**
   * @inheritDoc
   */
  testInternal(item) {
    var score = super.testInternal(item);
    if (score) {
      // items that the user has recently activated should be higher in the list
      var lastActive = item.getLastActive();
      var duration = SearchTerm.DURATION_;

      if (!isNaN(lastActive)) {
        score += 5 * (Math.max(0, lastActive - this.dateThreshold_) / duration);
      }
    }

    return score;
  }

  /**
   * @inheritDoc
   */
  getTexts(item) {
    return [item.getSearchText(), item.getTitle()];
  }
}


/**
 * @type {number}
 * @private
 */
SearchTerm.DURATION_ = 2 * 7 * 24 * 60 * 60 * 1000;


exports = SearchTerm;
