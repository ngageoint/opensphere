goog.module('os.query.SpatialQueryEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const Feature = goog.requireType('ol.Feature');


/**
 */
class SpatialQueryEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {Feature=} opt_query
   * @param {boolean=} opt_append
   */
  constructor(type, opt_query, opt_append) {
    super(type);

    /**
     * @type {?Feature}
     */
    this.query = opt_query || null;

    /**
     * @type {boolean}
     */
    this.append = opt_append !== undefined ? opt_append : false;
  }
}

exports = SpatialQueryEvent;
