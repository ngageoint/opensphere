goog.provide('os.ui.filter.FilterEvent');
goog.provide('os.ui.filter.FilterEventType');
goog.provide('os.ui.filter.FilterImportEvent');
goog.require('goog.events.Event');



/**
 * @param {string} type
 * @param {string=} opt_key
 * @param {os.filter.FilterEntry=} opt_entry
 * @extends {goog.events.Event}
 * @constructor
 */
os.ui.filter.FilterEvent = function(type, opt_key, opt_entry) {
  os.ui.filter.FilterEvent.base(this, 'constructor', type);

  /**
   * @type {?string}
   */
  this.key = opt_key || null;

  /**
   * @type {os.filter.FilterEntry}
   */
  this.entry = opt_entry || null;
};
goog.inherits(os.ui.filter.FilterEvent, goog.events.Event);



/**
 * @param {string} type
 * @param {Array<os.filter.FilterEntry>} filters
 * @extends {goog.events.Event}
 * @constructor
 */
os.ui.filter.FilterImportEvent = function(type, filters) {
  os.ui.filter.FilterImportEvent.base(this, 'constructor', os.ui.filter.FilterEventType.FILTERS_IMPORTED);

  /**
   * @type {Array<os.filter.FilterEntry>}
   */
  this.filters = filters;
};
goog.inherits(os.ui.filter.FilterImportEvent, goog.events.Event);


/**
 * @enum {string}
 */
os.ui.filter.FilterEventType = {
  FILTERS_CHANGED: 'filtersChanged',
  GROUPING_CHANGED: 'filterGroupingChanged',
  HANDLERS_CHANGED: 'filterHandlersChanged',
  FILTERS_REFRESH: 'filtersRefresh',
  FILTERS_IMPORTED: 'filtersImported',
  ADD_FILTER: 'addFilter',
  EXPORT_FILTER: 'exportFilter'
};
