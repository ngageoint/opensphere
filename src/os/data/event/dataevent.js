goog.provide('os.data.event.DataEvent');
goog.provide('os.data.event.DataEventType');
goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.data.event.DataEventType = {
  SOURCE_ADDED: 'dataSourceAdded',
  SOURCE_REMOVED: 'dataSourceRemoved',
  SOURCE_REMOVED_NO_DESTROY: 'dataSourceRemovedNotDestroyed',
  FILTERS_CHANGED: 'filtersChanged',
  DATA_ADDED: 'dataAdded',
  DATA_REMOVED: 'dataRemoved',
  MAX_FEATURES: 'maxFeatures'
};



/**
 * @param {string} type
 * @param {os.source.ISource} source
 * @param {os.filter.IFilter=} opt_filter
 * @param {Array.<T>=} opt_items
 * @extends {goog.events.Event}
 * @constructor
 * @template T
 */
os.data.event.DataEvent = function(type, source, opt_filter, opt_items) {
  os.data.event.DataEvent.base(this, 'constructor', type);

  /**
   * @type {os.source.ISource}
   */
  this.source = source;

  /**
   * @type {?os.filter.IFilter}
   */
  this.filter = opt_filter || null;

  /**
   * @type {?Array.<T>}
   */
  this.items = opt_items || null;
};
goog.inherits(os.data.event.DataEvent, goog.events.Event);
