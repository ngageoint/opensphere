goog.declareModuleId('plugin.descriptor.facet.SearchTerm');

import SearchTermFacet from '../../../os/search/searchtermfacet.js';

/**
 * @extends {SearchTermFacet<!IDataDescriptor>}
 */
export default class SearchTerm extends SearchTermFacet {
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
      this.dateThreshold_ = now - duration;
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
      var duration = duration;

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
 */
const duration = 2 * 7 * 24 * 60 * 60 * 1000;
