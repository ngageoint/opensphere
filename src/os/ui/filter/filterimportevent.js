goog.module('os.ui.filter.FilterImportEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const FilterEventType = goog.require('os.ui.filter.FilterEventType');

const FilterEntry = goog.requireType('os.filter.FilterEntry');


/**
 */
class FilterImportEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {Array<FilterEntry>} filters
   */
  constructor(type, filters) {
    super(FilterEventType.FILTERS_IMPORTED);

    /**
     * @type {Array<FilterEntry>}
     */
    this.filters = filters;
  }
}

exports = FilterImportEvent;
