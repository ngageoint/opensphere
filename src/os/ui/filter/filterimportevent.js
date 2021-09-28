goog.declareModuleId('os.ui.filter.FilterImportEvent');

import FilterEventType from './filtereventtype.js';

const GoogEvent = goog.require('goog.events.Event');

const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');


/**
 */
export default class FilterImportEvent extends GoogEvent {
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
