goog.provide('os.query.SpatialQueryEvent');
goog.provide('os.query.SpatialQueryEventType');
goog.require('goog.events.Event');
goog.require('ol.Feature');


/**
 * @enum {string}
 */
os.query.SpatialQueryEventType = {
  ADDED: 'queryAdded',
  REMOVED: 'queryRemoved',
  CLEARED: 'queriesCleared'
};



/**
 * @param {string} type
 * @param {ol.Feature=} opt_query
 * @param {boolean=} opt_append
 * @extends {goog.events.Event}
 * @constructor
 */
os.query.SpatialQueryEvent = function(type, opt_query, opt_append) {
  os.query.SpatialQueryEvent.base(this, 'constructor', type);

  /**
   * @type {?ol.Feature}
   */
  this.query = opt_query || null;

  /**
   * @type {boolean}
   */
  this.append = goog.isDef(opt_append) ? opt_append : false;
};
goog.inherits(os.query.SpatialQueryEvent, goog.events.Event);
